import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AnalysisResult, AppMode, Vaccine, Language } from '../types';

const getAiClient = () => {
    // Priority: 1. User Settings (localStorage), 2. Environment Variable
    let apiKey = process.env.API_KEY;
    
    if (typeof window !== 'undefined') {
        try {
            const storedSettings = localStorage.getItem('kisan-settings');
            if (storedSettings) {
                const parsed = JSON.parse(storedSettings);
                if (parsed.apiKey && parsed.apiKey.trim() !== '') {
                    apiKey = parsed.apiKey;
                }
            }
        } catch (e) {
            console.warn("Could not read API key from settings", e);
        }
    }

    if (!apiKey) {
        throw new Error("API Key is missing. Please add it in Settings.");
    }

    return new GoogleGenAI({ apiKey: apiKey });
};

// Client-side image compression
const compressImage = async (file: File): Promise<Blob> => {
    if (!file.type.startsWith('image/')) return file;

    return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => { img.src = e.target?.result as string; };

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_DIMENSION = 1200; // Good balance for AI
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

export const fileToGenerativePart = async (file: Blob): Promise<{ inlineData: { data: string; mimeType: string } }> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve({ inlineData: { data: base64String, mimeType: file.type || 'image/jpeg' } });
        };
        reader.readAsDataURL(file);
    });
};

const getPromptForMode = (mode: AppMode, language: Language): string => {
    const langName = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
    const baseInstruction = `Analyze this cattle image. Respond strictly in valid JSON in ${langName} language.`;

    switch (mode) {
        case 'health':
            return `${baseInstruction}
            ROLE: Expert Veterinarian.
            TASK: Diagnose visible diseases (Lumpy, FMD, Mastitis, Trauma, etc.).
            OUTPUT FORMAT:
            {
                "status": "Critical"|"Warning"|"Healthy",
                "title": "Disease Name or Healthy",
                "description": "Short summary of findings (max 2 sentences).",
                "confidence": 0-100,
                "diagnosis": {
                    "conditionName": "Precise medical name",
                    "severity": "Critical"|"Warning"|"Healthy",
                    "symptoms": ["Symptom 1", "Symptom 2"],
                    "immediateActions": ["First aid step 1", "Step 2"],
                    "preventiveMeasures": ["Prevention 1", "Prevention 2"],
                    "vetConsultationRequired": true/false
                }
            }`;
        case 'facts':
            return `${baseInstruction}
            TASK: Identify breed and facts.
            OUTPUT FORMAT:
            {
                "status": "Info",
                "title": "Breed Name",
                "description": "Origin and key traits.",
                "confidence": 0-100,
                "breedIdentification": {
                    "name": "Breed Name",
                    "origin": "Region",
                    "conformity": "High"|"Medium"|"Low"
                }
            }`;
        case 'management':
            return `${baseInstruction}
            ROLE: Livestock Specialist.
            TASK: Full management assessment.
            OUTPUT FORMAT:
            {
                "status": "Info",
                "title": "Management Report",
                "description": "Overall assessment.",
                "confidence": 0-100,
                "bodyConditionScore": { "score": "1-5", "description": "Analysis of ribs/spine/fat" },
                "managementSuggestions": { "nutrition": "Feed advice", "grooming": "Care advice", "environment": "Housing advice" },
                "productivityPotential": "Dairy/Draft potential assessment"
            }`;
        default: return '';
    }
};

export const analyzeImage = async (file: File, mode: AppMode, language: Language): Promise<AnalysisResult> => {
    const ai = getAiClient();
    const model = 'gemini-3-flash-preview';
    
    let imageBlob: Blob = file;
    try { imageBlob = await compressImage(file); } catch (e) { console.warn("Compression failed", e); }

    const imagePart = await fileToGenerativePart(imageBlob);
    const prompt = getPromptForMode(mode, language);

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseMimeType: 'application/json' }
        });
        if (!response.text) throw new Error("No response");
        return JSON.parse(response.text) as AnalysisResult;
    } catch (error) {
        console.error("Analysis Error:", error);
        throw error;
    }
};

export const generateVaccineSchedule = async (dob: string, language: Language): Promise<Vaccine[]> => {
    const ai = getAiClient();
    const model = 'gemini-3-flash-preview';
    const langName = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
    
    const prompt = `Role: Expert Veterinarian in India.
    Task: Create a vaccination schedule for a calf born on ${dob}.
    Region: Indian Subcontinent.
    Language: ${langName}.
    Include FMD, HS, BQ, Brucellosis, Theileriosis, Anthrax if relevant.
    Strictly return a JSON Array.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            disease: { type: Type.STRING },
                            age: { type: Type.STRING, description: "Age at vaccination" },
                            dosage: { type: Type.STRING },
                            booster: { type: Type.STRING },
                            sideEffects: { type: Type.STRING },
                            isCritical: { type: Type.BOOLEAN },
                            description: { type: Type.STRING }
                        },
                        required: ["name", "disease", "age", "isCritical", "dosage"]
                    }
                }
            }
        });
        if (!response.text) throw new Error("No schedule");
        return JSON.parse(response.text) as Vaccine[];
    } catch (error) {
        console.error("Vaccine Error:", error);
        throw error;
    }
};

/**
 * Maps app language code to the most suitable Gemini Voice name.
 * 'Kore' is often better for Indic languages in preview models, 'Puck' for English.
 */
const getVoiceForLanguage = (language: Language, userPreferredVoice?: string): string => {
    if (userPreferredVoice && userPreferredVoice !== 'Puck') return userPreferredVoice; // Respect explicit override if not default

    switch (language) {
        case 'hi':
        case 'mr':
            return 'Kore'; // 'Kore' tends to be clearer for non-English phonemes
        default:
            return 'Puck'; // 'Puck' is a standard, clear English voice
    }
};

export const generateSpeech = async (text: string, voice: string, language: Language): Promise<ArrayBuffer> => {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash-preview-tts';
    
    // Automatically select best voice for language if the passed voice is generic
    const selectedVoice = getVoiceForLanguage(language, voice);

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } }
            }
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio");
        
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
        return bytes.buffer;
    } catch (error) {
        console.error("TTS Error:", error);
        throw error;
    }
};