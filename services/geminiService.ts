import { AnalysisResult, AppMode, Vaccine, Language } from '../types';

// Client-side image compression (Kept to reduce upload bandwidth)
const compressImage = async (file: File): Promise<Blob> => {
    if (!file.type.startsWith('image/')) return file;

    return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => { img.src = e.target?.result as string; };

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_DIMENSION = 1200; 
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_DIMENSION) {
                    height *= MAX_DIMENSION / width;
                    width = MAX_DIMENSION;
                }
            } else {
                if (height > MAX_DIMENSION) {
                    width *= MAX_DIMENSION / height;
                    height = MAX_DIMENSION;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(file); return; }

            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.8);
        };
        const fail = () => resolve(file);
        img.onerror = fail;
        reader.onerror = fail;
        reader.readAsDataURL(file);
    });
};

export const analyzeImage = async (file: File, mode: AppMode, language: Language): Promise<AnalysisResult> => {
    let imageBlob: Blob = file;
    try { imageBlob = await compressImage(file); } catch (e) { console.warn("Compression failed", e); }

    const formData = new FormData();
    formData.append('image', imageBlob);
    formData.append('mode', mode);
    formData.append('language', language);

    const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Analysis failed");
    }

    return await response.json() as AnalysisResult;
};

export const generateVaccineSchedule = async (dob: string, language: Language): Promise<Vaccine[]> => {
    const response = await fetch('/api/vaccine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dob, language })
    });

    if (!response.ok) {
        throw new Error("Failed to get schedule");
    }

    return await response.json() as Vaccine[];
};

export const generateSpeech = async (text: string, voice: string, language: Language): Promise<ArrayBuffer> => {
    const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, language })
    });

    if (!response.ok) {
        throw new Error("TTS failed");
    }

    const data = await response.json();
    const base64Audio = data.audioData;
    
    // Decode Base64 to ArrayBuffer
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
    return bytes.buffer;
};