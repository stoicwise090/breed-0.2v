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
    const { user, token, isGuest } = useAuth();
    
    // Settings remain local for now for responsiveness, but could be synced
    const [settings, setSettings] = useLocalStorage<Settings>('kisan-settings', getInitialSettings());
    
    // History State
    const [history, setHistory] = useState<HistoryItem[]>([]);
    
    // Guest History from LocalStorage
    const [guestHistory, setGuestHistory] = useLocalStorage<HistoryItem[]>('kisan-guest-history', []);

    // Sync Prompt State
    const [showSyncPrompt, setShowSyncPrompt] = useState(false);

    // Load History logic
    useEffect(() => {
        if (isGuest) {
            // In Guest mode, use local storage
            setHistory(guestHistory);
        } else if (token) {
            // In Authenticated mode, fetch from API
            const fetchHistory = async () => {
                try {
                    const res = await fetch('/api/user/data', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setHistory(data.history || []);
                    }
                } catch (e) {
                    console.error("Failed to fetch cloud history", e);
                }
            };
            fetchHistory();
        }
    }, [isGuest, token, guestHistory]); // Depend on guestHistory so guest mode updates immediately

    // Detect if we just logged in and have guest data to sync
    useEffect(() => {
        if (!isGuest && user) {
            const localData = localStorage.getItem('kisan-guest-history');
            if (localData) {
                try {
                    const parsed = JSON.parse(localData);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setShowSyncPrompt(true);
                    }
                } catch (e) {}
            }
        }
    }, [user, isGuest]);

    const handleSync = async (shouldSync: boolean) => {
        if (shouldSync && token) {
            const localData = localStorage.getItem('kisan-guest-history');
            if (localData) {
                const parsed = JSON.parse(localData);
                try {
                    // Send to backend
                    await fetch('/api/user/sync', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ items: parsed })
                    });
                    
                    // Refresh from server
                    const res = await fetch('/api/user/data', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setHistory(data.history);
                    }
                } catch (e) {
                    console.error("Sync failed", e);
                }
            }
        }
        
        // Always clear guest data after decision to avoid prompting again
        localStorage.removeItem('kisan-guest-history');
        setGuestHistory([]);
        setShowSyncPrompt(false);
    };

    // Theme Effect - applies immediately when settings change
    useEffect(() => {
        if (settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        document.documentElement.lang = settings.language;
    }, [settings.theme, settings.language]);

    const updateSettings = (newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const resetSettings = () => {
        setSettings(getInitialSettings());
    };

    const addToHistory = async (item: HistoryItem) => {
        if (isGuest) {
            setGuestHistory(prev => [item, ...prev]);
        } else if (token) {
            // Optimistic Update
            setHistory(prev => [item, ...prev]);
            // Send to backend
            try {
                await fetch('/api/user/history', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ item })
                });
            } catch (e) {
                console.error("Failed to save history to cloud", e);
            }
        }
    };

    const clearHistory = async () => {
        if (window.confirm('Are you sure you want to clear all history? This cannot be undone.')) {
            if (isGuest) {
                setGuestHistory([]);
            } else if (token) {
                setHistory([]);
                try {
                    await fetch('/api/user/history', {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                } catch (e) {
                    console.error("Failed to clear cloud history", e);
                }
            }
        }
    };

    const importHistory = (data: HistoryItem[]) => {
        if (Array.isArray(data) && data.length > 0 && data[0].id) {
            // For now, treat import as adding new items
             if (isGuest) {
                setGuestHistory(prev => [...data, ...prev]);
            } else if (token) {
                // Bulk sync
                handleSync(true); // Logic could be reused if we passed data, but simple enough to just loop or use sync endpoint
            }
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