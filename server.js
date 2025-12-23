import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";

// Initialize environment
const API_KEY = process.env.API_KEY;

// Configure Google GenAI on Server
const ai = new GoogleGenAI({ apiKey: API_KEY });

const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// File Upload Config (Memory Storage for direct processing)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// --- API ROUTES ---

// 1. Image Analysis Endpoint
app.post('/api/analyze', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image file provided' });
        
        const { mode, language } = req.body;
        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;

        const langName = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
        const baseInstruction = `Analyze this cattle image. Respond strictly in valid JSON in ${langName} language.`;
        
        let promptText = '';
        if (mode === 'health') {
            promptText = `${baseInstruction}
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
        } else if (mode === 'facts') {
            promptText = `${baseInstruction}
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
        } else {
            // Management
             promptText = `${baseInstruction}
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
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Image } },
                    { text: promptText }
                ]
            },
            config: { responseMimeType: 'application/json' }
        });

        if (!response.text) throw new Error("No response from AI");
        const result = JSON.parse(response.text);
        res.json(result);

    } catch (error) {
        console.error('Analysis Error:', error);
        res.status(500).json({ error: 'Failed to analyze image' });
    }
});

// 2. Vaccine Schedule Endpoint
app.post('/api/vaccine', async (req, res) => {
    try {
        const { dob, language } = req.body;
        const langName = language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
    
        const prompt = `Role: Expert Veterinarian in India.
        Task: Create a vaccination schedule for a calf born on ${dob}.
        Region: Indian Subcontinent.
        Language: ${langName}.
        Include FMD, HS, BQ, Brucellosis, Theileriosis, Anthrax if relevant.
        Strictly return a JSON Array.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
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

        if (!response.text) throw new Error("No schedule generated");
        res.json(JSON.parse(response.text));

    } catch (error) {
        console.error('Vaccine Error:', error);
        res.status(500).json({ error: 'Failed to generate schedule' });
    }
});

// 3. TTS Endpoint
app.post('/api/tts', async (req, res) => {
    try {
        const { text, voice, language } = req.body;
        
        // Voice selection logic (Server side)
        let selectedVoice = voice;
        if (!selectedVoice || selectedVoice === 'Puck') {
             if (language === 'hi' || language === 'mr') selectedVoice = 'Kore';
             else selectedVoice = 'Puck';
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text: text }] },
            config: {
                responseModalities: ["AUDIO"],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } }
            }
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio generated");

        // Return base64 so client logic can stay similar
        res.json({ audioData: base64Audio });

    } catch (error) {
        console.error('TTS Error:', error);
        res.status(500).json({ error: 'Failed to generate speech' });
    }
});

// Serve Frontend in Production
if (process.env.NODE_ENV !== 'development') {
    app.use(express.static(path.join(__dirname, 'dist')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});