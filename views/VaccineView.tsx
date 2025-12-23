import React, { useState } from 'react';
import { Calendar, Syringe, Loader2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateVaccineSchedule } from '../services/geminiService';
import { Vaccine } from '../types';

export const VaccineView: React.FC = () => {
    const { t, settings } = useApp();
    const [dob, setDob] = useState('');
    const [schedule, setSchedule] = useState<Vaccine[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const handleGetSchedule = async () => {
        if (!dob) return;
        setLoading(true);
        try {
            const data = await generateVaccineSchedule(dob, settings.language);
            setSchedule(data);
        } catch (error) {
            alert('Failed to generate schedule. Check connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t.vaccineScheduler}</h2>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                    {t.enterDob}
                </label>
                <div className="flex flex-col gap-4">
                    <input 
                        type="date" 
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full p-4 text-lg rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                    />
                    <button 
                        onClick={handleGetSchedule}
                        disabled={!dob || loading}
                        className="w-full bg-primary hover:bg-green-800 text-white font-bold text-lg py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Calendar size={24} />}
                        {t.getSchedule}
                    </button>
                </div>
            </div>

            {schedule.length > 0 && (
                <div className="space-y-3">
                    {schedule.map((vac, index) => {
                        const isExpanded = expandedIndex === index;
                        return (
                            <div key={index} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden transition-all ${vac.isCritical ? 'border-l-4 border-l-red-500 border-t-gray-100' : 'border-l-4 border-l-green-500 border-t-gray-100'}`}>
                                <div 
                                    className="p-4 flex items-center gap-4 cursor-pointer"
                                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                                >
                                    <div className={`p-3 rounded-full flex-shrink-0 ${vac.isCritical ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        <Syringe size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-lg dark:text-white">{vac.name}</h3>
                                            {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                        </div>
                                        <p className="text-sm font-semibold text-secondary">{vac.age}</p>
                                    </div>
                                </div>
                                
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-0 bg-gray-50 dark:bg-gray-700/30 text-sm space-y-2 border-t dark:border-gray-700 mt-2 p-2">
                                        <div className="grid grid-cols-2 gap-4 mt-3">
                                            <div>
                                                <span className="block text-xs uppercase text-gray-500 font-bold">Dosage</span>
                                                <span className="dark:text-gray-200">{vac.dosage}</span>
                                            </div>
                                            <div>
                                                <span className="block text-xs uppercase text-gray-500 font-bold">Booster</span>
                                                <span className="dark:text-gray-200">{vac.booster}</span>
                                            </div>
                                        </div>
                                        {vac.description && <p className="text-gray-600 dark:text-gray-300 italic pt-2">{vac.description}</p>}
                                        {vac.isCritical && (
                                            <div className="flex items-center gap-2 text-red-600 font-bold text-xs mt-2 bg-red-50 p-2 rounded">
                                                <AlertTriangle size={14} />
                                                CRITICAL VACCINE
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};