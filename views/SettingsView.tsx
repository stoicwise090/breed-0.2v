import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Moon, RefreshCw, Volume2, Globe, Type, Download, Upload, Key } from 'lucide-react';
import { Language, FontSize } from '../types';

export const SettingsView: React.FC = () => {
    const { settings, updateSettings, t, resetSettings, history, importHistory } = useApp();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    importHistory(data);
                } catch (err) {
                    alert("Invalid File");
                }
            };
            reader.readAsText(file);
        }
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history));
        const node = document.createElement('a');
        node.setAttribute("href", dataStr);
        node.setAttribute("download", "kisan_mitra_backup.json");
        document.body.appendChild(node);
        node.click();
        node.remove();
    };

    return (
        <div className="space-y-6 pb-24">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t.settings}</h2>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden divide-y dark:divide-gray-700 border dark:border-gray-700">
                
                {/* API Key Section */}
                <div className="p-5 space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Key size={24} /></div>
                        <span className="font-bold text-lg dark:text-white">{t.apiKey}</span>
                    </div>
                    <div className="space-y-2">
                        <input 
                            type="password" 
                            value={settings.apiKey || ''} 
                            onChange={(e) => updateSettings({ apiKey: e.target.value })}
                            placeholder={t.apiKeyPlaceholder}
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Key size={12} /> {t.apiKeyNote}
                        </p>
                    </div>
                </div>

                {/* Theme */}
                <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Moon size={24} /></div>
                        <span className="font-bold text-lg dark:text-white">{t.theme}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={settings.theme === 'dark'} onChange={() => updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' })} />
                        <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                {/* Language */}
                <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Globe size={24} /></div>
                        <span className="font-bold text-lg dark:text-white">{t.language}</span>
                    </div>
                    <select value={settings.language} onChange={(e) => updateSettings({ language: e.target.value as Language })} className="bg-gray-100 border-none text-gray-900 text-base rounded-lg focus:ring-primary block p-2.5 dark:bg-gray-700 dark:text-white font-bold">
                        <option value="en">English</option>
                        <option value="hi">हिन्दी</option>
                        <option value="mr">मराठी</option>
                    </select>
                </div>

                {/* Font Size */}
                <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 text-gray-600 rounded-lg"><Type size={24} /></div>
                        <span className="font-bold text-lg dark:text-white">{t.fontSize}</span>
                    </div>
                    <div className="flex gap-2">
                        {['normal', 'large', 'extra'].map((s) => (
                            <button
                                key={s}
                                onClick={() => updateSettings({ fontSize: s as FontSize })}
                                className={`w-10 h-10 rounded-lg font-bold flex items-center justify-center border transition ${settings.fontSize === s ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'}`}
                            >
                                {s === 'normal' ? 'A' : s === 'large' ? 'A+' : 'A++'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Data Backup */}
                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Download size={24} /></div>
                        <span className="font-bold text-lg dark:text-white">{t.backupRestore}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pl-14">
                        <button onClick={handleExport} className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 font-medium dark:bg-gray-700 dark:text-white">
                            <Download size={18} /> {t.exportData}
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 font-medium dark:bg-gray-700 dark:text-white">
                            <Upload size={18} /> {t.importData}
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
                    </div>
                </div>

                 {/* Volume */}
                 <div className="p-5 space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg"><Volume2 size={24} /></div>
                        <span className="font-bold text-lg dark:text-white">{t.volume}</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.1" value={settings.volume} onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary" />
                </div>
            </div>

            <button onClick={() => { if (window.confirm('Reset all settings?')) resetSettings(); }} className="w-full py-4 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl font-bold transition flex items-center justify-center gap-2">
                <RefreshCw size={20} />
                {t.reset}
            </button>
        </div>
    );
};