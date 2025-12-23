import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Settings, HistoryItem, Translation } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { translations, detectBrowserLanguage } from '../lib/translations';
import { useAuth } from '../auth/useAuth';

interface AppContextProps {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    history: HistoryItem[];
    addToHistory: (item: HistoryItem) => void;
    clearHistory: () => void;
    importHistory: (data: HistoryItem[]) => void;
    t: Translation;
    resetSettings: () => void;
    showSyncPrompt: boolean;
    handleSync: (shouldSync: boolean) => void;
}

// Initialize defaults dynamically based on browser environment
const getInitialSettings = (): Settings => ({
    theme: 'light',
    language: detectBrowserLanguage(), // Auto-detect language on first load
    ttsVoice: 'Puck',
    volume: 1.0,
    fontSize: 'normal',
    apiKey: '' // Default empty
});

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isGuest } = useAuth();
    
    // Settings are global/device specific for simplicity, but could be user specific too.
    // Keeping settings local for now.
    const [settings, setSettings] = useLocalStorage<Settings>('kisan-settings', getInitialSettings());
    
    // History Key depends on User ID
    const historyKey = user ? `kisan-history-${user.id}` : 'kisan-history';
    const [history, setHistory] = useLocalStorage<HistoryItem[]>(historyKey, []);

    // Sync Prompt State
    const [showSyncPrompt, setShowSyncPrompt] = useState(false);

    // Detect if we just logged in and have guest data
    useEffect(() => {
        if (!isGuest && user) {
            const guestDataStr = localStorage.getItem('kisan-history');
            if (guestDataStr) {
                try {
                    const guestData = JSON.parse(guestDataStr);
                    if (Array.isArray(guestData) && guestData.length > 0) {
                        setShowSyncPrompt(true);
                    }
                } catch (e) {}
            }
        }
    }, [user, isGuest]);

    const handleSync = (shouldSync: boolean) => {
        if (shouldSync) {
            const guestDataStr = localStorage.getItem('kisan-history');
            if (guestDataStr) {
                const guestData = JSON.parse(guestDataStr);
                // Merge logic: Put guest items at the top or bottom? Let's spread them.
                // Avoid duplicates by ID if necessary, but for now simple merge.
                setHistory(prev => [...guestData, ...prev]);
            }
        }
        // Always clear guest data after decision
        localStorage.removeItem('kisan-history');
        setShowSyncPrompt(false);
    };

    // Theme Effect - applies immediately when settings change
    useEffect(() => {
        if (settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        // Also set the lang attribute on html tag for accessibility
        document.documentElement.lang = settings.language;
    }, [settings.theme, settings.language]);

    const updateSettings = (newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const resetSettings = () => {
        setSettings(getInitialSettings());
    };

    const addToHistory = (item: HistoryItem) => {
        setHistory(prev => [item, ...prev]);
    };

    const clearHistory = () => {
        if (window.confirm('Are you sure you want to clear all history? This cannot be undone.')) {
            setHistory([]);
        }
    };

    const importHistory = (data: HistoryItem[]) => {
        // Basic validation
        if (Array.isArray(data) && data.length > 0 && data[0].id) {
            setHistory(prev => [...data, ...prev]);
            alert('History imported successfully!');
        } else {
            alert('Invalid data format.');
        }
    }

    // derived state for translations
    const t = useMemo(() => {
        return translations[settings.language] || translations['en'];
    }, [settings.language]);

    return (
        <AppContext.Provider value={{
            settings,
            updateSettings,
            history,
            addToHistory,
            clearHistory,
            importHistory,
            t,
            resetSettings,
            showSyncPrompt,
            handleSync
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};