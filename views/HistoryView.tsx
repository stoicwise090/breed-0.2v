import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, Calendar, Stethoscope, BookOpen, Activity, Download, X } from 'lucide-react';
import { HistoryItem, AppMode } from '../types';
import { ResultCard } from '../components/ResultCard';

export const HistoryView: React.FC = () => {
    const { history, clearHistory, t, settings } = useApp();
    const [filter, setFilter] = useState<AppMode | 'all'>('all');
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

    const filteredHistory = history.filter(item => filter === 'all' || item.mode === filter);

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `kisan_mitra_history_${Date.now()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const getIcon = (mode: string) => {
        switch (mode) {
            case 'health': return <Stethoscope size={18} />;
            case 'facts': return <BookOpen size={18} />;
            case 'management': return <Activity size={18} />;
            default: return <Stethoscope size={18} />;
        }
    };

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center text-gray-500">
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
                    <Calendar size={48} className="opacity-50" />
                </div>
                <h3 className="text-xl font-bold mb-2 dark:text-gray-300">No History</h3>
                <p>{t.noHistory}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t.history}</h2>
                    <div className="flex gap-2">
                        <button onClick={handleExport} className="p-2 text-primary hover:bg-green-50 rounded-lg">
                            <Download size={20} />
                        </button>
                        <button onClick={clearHistory} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>

                {/* Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['all', 'health', 'management', 'facts'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as AppMode | 'all')}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                        >
                            {f === 'all' ? t.filterAll : f === 'health' ? t.healthScan : f === 'facts' ? t.breedId : t.management}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {filteredHistory.map((item) => (
                    <div 
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4 cursor-pointer active:scale-95 transition-transform"
                    >
                        <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border dark:border-gray-600">
                            {item.thumbnail ? (
                                <img src={item.thumbnail} alt="Scan" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Activity />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase mb-1">
                                {getIcon(item.mode)}
                                <span>{item.mode}</span>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{item.result.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-snug">{item.result.description}</p>
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 font-medium">
                                <Calendar size={12} />
                                <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal for Details using ResultCard */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                            <h3 className="font-bold text-lg dark:text-white">Scan Details</h3>
                            <button onClick={() => setSelectedItem(null)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-4">
                            {selectedItem.thumbnail && (
                                <img src={selectedItem.thumbnail} className="w-full rounded-xl object-cover max-h-60 border dark:border-gray-700" alt="Full" />
                            )}
                            <ResultCard result={selectedItem.result} t={t} language={settings.language} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};