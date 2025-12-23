import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";

// Initialize environment
const API_KEY = process.env.API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'kisan-secret-key-change-in-prod';
const DB_FILE = path.join(process.cwd(), 'database.json');

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

// --- SIMPLE JSON DATABASE IMPLEMENTATION ---
const initDb = () => {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = { users: [], history: [] };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
};

const readDb = () => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return { users: [], history: [] };
    }
};

const writeDb = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

initDb();

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- API ROUTES ---

// Auth: Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, identifier, password, language } = req.body;
        const db = readDb();

        if (db.users.find(u => u.email === identifier || u.phone === identifier)) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now().toString(),
            name,
            email: identifier.includes('@') ? identifier : undefined,
            phone: !identifier.includes('@') ? identifier : undefined,
            password: hashedPassword,
            preferredLanguage: language,
            settings: { theme: 'light', fontSize: 'normal' } // Default settings
        };

        db.users.push(newUser);
        writeDb(db);

        const token = jwt.sign({ id: newUser.id, name: newUser.name }, JWT_SECRET);
        
        // Don't send password back
        const { password: _, ...userSafe } = newUser;
        res.json({ token, user: userSafe });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Registration failed" });
    }
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const db = readDb();
        const user = db.users.find(u => u.email === identifier || u.phone === identifier);

        if (!user) return res.status(400).json({ error: "User not found" });

        if (await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET);
            const { password: _, ...userSafe } = user;
            res.json({ token, user: userSafe });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (e) {
        res.status(500).json({ error: "Login failed" });
    }
});

// User Data: Get All (History & Settings)
app.get('/api/user/data', authenticateToken, (req, res) => {
    const db = readDb();
    const userHistory = db.history.filter(h => h.userId === req.user.id);
    const user = db.users.find(u => u.id === req.user.id);
    
    // Sort history by timestamp desc
    userHistory.sort((a, b) => b.timestamp - a.timestamp);

    res.json({
        history: userHistory,
        settings: user?.settings || {}
    });
});

// User Data: Sync History (Add Items)
app.post('/api/user/history', authenticateToken, (req, res) => {
    const { item } = req.body;
    const db = readDb();
    
    // Add user ID to item
    const newItem = { ...item, userId: req.user.id };
    
    // Check duplication by ID
    const exists = db.history.some(h => h.id === newItem.id);
    if (!exists) {
        db.history.push(newItem);
        writeDb(db);
    }
    
    res.json({ success: true });
});

// User Data: Sync Multiple Items (Import/Sync Guest Data)
app.post('/api/user/sync', authenticateToken, (req, res) => {
    const { items } = req.body;
    const db = readDb();
    let count = 0;

    if (Array.isArray(items)) {
        items.forEach(item => {
            if (!db.history.some(h => h.id === item.id)) {
                db.history.push({ ...item, userId: req.user.id });
                count++;
            }
        });
        writeDb(db);
    }
    res.json({ synced: count });
});

// User Data: Clear History
app.delete('/api/user/history', authenticateToken, (req, res) => {
    const db = readDb();
    db.history = db.history.filter(h => h.userId !== req.user.id);
    writeDb(db);
    res.json({ success: true });
});

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