
export type Language = 'en' | 'hi' | 'mr';
export type AppMode = 'health' | 'facts' | 'management';
export type FontSize = 'normal' | 'large' | 'extra';

export interface User {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    preferredLanguage: Language;
}

export interface Settings {
    theme: 'light' | 'dark';
    language: Language;
    ttsVoice: string;
    ttsSpeed: number;
    volume: number;
    fontSize: FontSize;
    apiKey: string;
}

export interface DiagnosisDetails {
    conditionName: string;
    severity: 'Critical' | 'Warning' | 'Healthy' | 'Info';
    symptoms: string[];
    immediateActions: string[];
    preventiveMeasures: string[];
    vetConsultationRequired: boolean;
}

export interface AnalysisResult {
    // Shared
    status?: 'Critical' | 'Warning' | 'Healthy' | 'Info';
    title: string;
    description: string; // Fallback summary
    confidence?: number;
    
    // Health Mode Specific
    diagnosis?: DiagnosisDetails;

    // Management/Breed Mode Specific
    breedIdentification?: {
        name: string;
        origin: string;
        conformity: string; // High/Med/Low
    };
    bodyConditionScore?: {
        score: string; // 1-5
        description: string;
    };
    managementSuggestions?: {
        nutrition: string;
        grooming: string;
        environment: string;
    };
    productivityPotential?: string;
}

export interface HistoryItem {
    id: string;
    timestamp: number;
    mode: AppMode;
    result: AnalysisResult;
    thumbnail?: string;
}

export interface Vaccine {
    name: string;
    disease: string;
    age: string;
    dosage: string;
    booster: string;
    sideEffects: string;
    isCritical: boolean;
    description: string; // Summary
}

export interface Translation {
    appName: string;
    healthScan: string;
    breedId: string;
    management: string;
    vaccineScheduler: string;
    history: string;
    settings: string;
    emergencyVet: string;
    uploadImage: string;
    takePhoto: string;
    analyzing: string;
    listen: string;
    stop: string;
    clearHistory: string;
    exportData: string;
    importData: string;
    noHistory: string;
    theme: string;
    language: string;
    voice: string;
    speed: string;
    volume: string;
    fontSize: string;
    reset: string;
    back: string;
    critical: string;
    warning: string;
    healthy: string;
    info: string;
    enterDob: string;
    getSchedule: string;
    vetFinderError: string;
    vetFinderSuccess: string;
    actions: string;
    symptoms: string;
    prevention: string;
    consultVet: string;
    confidence: string;
    filterAll: string;
    backupRestore: string;
    apiKey: string;
    apiKeyPlaceholder: string;
    apiKeyNote: string;
    replay: string;
    repeat: string;
    // Capture UI
    clickToCapture: string;
    secureProcessing: string;
    // Auth Strings
    guest: string;
    login: string;
    register: string;
    logout: string;
    emailPhone: string;
    password: string;
    name: string;
    loginTitle: string;
    registerTitle: string;
    guestModeMsg: string;
    syncDataPrompt: string;
    syncYes: string;
    syncNo: string;
    authError: string;
}