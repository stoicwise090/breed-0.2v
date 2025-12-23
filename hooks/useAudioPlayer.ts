import { useState, useRef, useEffect } from 'react';
import { generateSpeech } from '../services/geminiService';
import { useApp } from '../context/AppContext';

// Helper to split text into manageable sentences/chunks
const splitTextIntoChunks = (text: string): string[] => {
    if (!text) return [];
    // Split by periods, question marks, or exclamation marks, keeping the delimiter
    // Then join small fragments to ensure natural flow (min 30 chars unless end of text)
    const rawSegments = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    
    const chunks: string[] = [];
    let currentChunk = '';

    rawSegments.forEach(seg => {
        currentChunk += seg;
        if (currentChunk.length > 60) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
        }
    });

    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
};

export const useAudioPlayer = () => {
    const { settings } = useApp();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Queue State
    const [audioQueue, setAudioQueue] = useState<string[]>([]);
    const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const isStoppedRef = useRef(false);

    useEffect(() => {
        return () => {
            hardStop(); // Cleanup on unmount
        };
    }, []);

    const hardStop = () => {
        isStoppedRef.current = true;
        if (sourceRef.current) {
            try {
                sourceRef.current.onended = null; // Remove listener to prevent auto-next
                sourceRef.current.stop();
            } catch (e) { /* ignore */ }
            sourceRef.current = null;
        }
        setIsPlaying(false);
        setIsLoading(false);
    };

    const playChunk = async (index: number, queue: string[]) => {
        if (index >= queue.length || isStoppedRef.current) {
            setIsPlaying(false);
            return;
        }

        setIsLoading(true);
        setCurrentChunkIndex(index);

        try {
            const textChunk = queue[index];
            const pcmBuffer = await generateSpeech(textChunk, settings.ttsVoice, settings.language);

            if (isStoppedRef.current) return; // Check if stopped while fetching

            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const ctx = audioContextRef.current;

            // Manual PCM Decoding
            const rawData = new Uint8Array(pcmBuffer);
            const dataInt16 = new Int16Array(rawData.buffer);
            const audioBuffer = ctx.createBuffer(1, dataInt16.length, 24000);
            const channelData = audioBuffer.getChannelData(0);
            for (let i = 0; i < dataInt16.length; i++) {
                channelData[i] = dataInt16[i] / 32768.0;
            }

            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            const gainNode = ctx.createGain();
            gainNode.gain.value = settings.volume;

            source.connect(gainNode);
            gainNode.connect(ctx.destination);

            source.onended = () => {
                if (!isStoppedRef.current) {
                    playChunk(index + 1, queue);
                }
            };

            sourceRef.current = source;
            gainNodeRef.current = gainNode;

            source.start();
            setIsPlaying(true);
        } catch (error) {
            console.error("Chunk Playback Error", error);
            setIsPlaying(false);
        } finally {
            setIsLoading(false);
        }
    };

    const playText = async (text: string) => {
        hardStop(); // Ensure clean state
        isStoppedRef.current = false;
        
        const chunks = splitTextIntoChunks(text);
        setAudioQueue(chunks);
        setCurrentChunkIndex(0);
        
        if (chunks.length > 0) {
            playChunk(0, chunks);
        }
    };

    const repeatCurrentChunk = () => {
        if (audioQueue.length === 0) return;
        hardStop();
        isStoppedRef.current = false;
        playChunk(currentChunkIndex, audioQueue);
    };

    const replayAll = () => {
        if (audioQueue.length === 0) return;
        hardStop();
        isStoppedRef.current = false;
        playChunk(0, audioQueue);
    }

    return { 
        isPlaying, 
        isLoading, 
        playText, 
        stop: hardStop,
        repeatCurrentChunk,
        replayAll,
        hasAudio: audioQueue.length > 0
    };
};