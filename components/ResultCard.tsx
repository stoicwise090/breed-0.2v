import React from 'react';
import { AnalysisResult, Language } from '../types';
import { AlertTriangle, CheckCircle, Info, Activity, Volume2, StopCircle, Loader2, RotateCcw, Repeat } from 'lucide-react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

interface ResultCardProps {
    result: AnalysisResult;
    t: any; // Translations
    language: Language;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, t }) => {
    const { isPlaying, isLoading, playText, stop, repeatCurrentChunk, replayAll, hasAudio } = useAudioPlayer();

    // Construct a natural language summary for TTS based on the structured data
    const getTTSContent = () => {
        let text = `${result.title}. ${result.description}. `;
        if (result.diagnosis) {
            text += `${t.actions}: ${result.diagnosis.immediateActions.join(', ')}. `;
            if (result.diagnosis.vetConsultationRequired) text += `${t.consultVet} `;
        }
        if (result.managementSuggestions) {
            text += `Nutrition: ${result.managementSuggestions.nutrition}. `;
        }
        return text;
    };

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isPlaying) {
            stop();
        } else {
            playText(getTTSContent());
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'Critical': return 'bg-red-50 text-red-800 border-red-200';
            case 'Warning': return 'bg-orange-50 text-orange-800 border-orange-200';
            case 'Healthy': return 'bg-green-50 text-green-800 border-green-200';
            default: return 'bg-blue-50 text-blue-800 border-blue-200';
        }
    };

    const getIcon = (status?: string) => {
        switch (status) {
            case 'Critical': return <AlertTriangle className="text-red-600" />;
            case 'Warning': return <AlertTriangle className="text-orange-600" />;
            case 'Healthy': return <CheckCircle className="text-green-600" />;
            default: return <Info className="text-blue-600" />;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
            {/* Header */}
            <div className={`p-4 border-b flex flex-col md:flex-row md:items-start justify-between gap-4 ${getStatusColor(result.status)} dark:bg-gray-700 dark:border-gray-600`}>
                <div className="flex gap-3">
                    <div className="mt-1">{getIcon(result.status)}</div>
                    <div>
                        <h3 className="text-xl font-bold dark:text-gray-100">{result.title}</h3>
                        <p className="text-sm font-medium opacity-80">{result.status || 'Info'}</p>
                    </div>
                </div>
                
                {/* Audio Controls Toolbar */}
                <div className="flex items-center gap-2 self-end md:self-center">
                    {result.confidence && (
                        <div className="text-xs font-bold px-2 py-1 bg-white/50 rounded-lg backdrop-blur-sm mr-2">
                            {result.confidence}% {t.confidence}
                        </div>
                    )}
                    
                    {/* Secondary Controls (Only show if we have started audio session) */}
                    {(hasAudio || isPlaying) && (
                        <>
                            <button 
                                onClick={replayAll}
                                disabled={isLoading}
                                title={t.replay}
                                className="p-2 bg-white/80 dark:bg-gray-600 rounded-full hover:bg-white transition shadow-sm text-gray-700 dark:text-gray-200"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={repeatCurrentChunk}
                                disabled={isLoading}
                                title={t.repeat}
                                className="p-2 bg-white/80 dark:bg-gray-600 rounded-full hover:bg-white transition shadow-sm text-gray-700 dark:text-gray-200"
                            >
                                <Repeat className="w-4 h-4" />
                            </button>
                        </>
                    )}

                    {/* Main Play/Stop Button */}
                    <button 
                        onClick={handlePlay}
                        disabled={isLoading}
                        className={`p-2 rounded-full transition shadow-sm flex items-center justify-center ${
                            isPlaying 
                            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                            : 'bg-white/80 dark:bg-gray-600 text-blue-600 hover:bg-white'
                        }`}
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin w-5 h-5" />
                        ) : isPlaying ? (
                            <StopCircle className="w-5 h-5" />
                        ) : (
                            <Volume2 className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-gray-700 dark:text-gray-300">
                <p className="text-lg leading-relaxed">{result.description}</p>

                {/* HEALTH MODE - Diagnosis Details */}
                {result.diagnosis && (
                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/30">
                                <h4 className="font-bold text-red-800 dark:text-red-200 mb-2">{t.actions}</h4>
                                <ul className="list-disc pl-4 space-y-1 text-sm">
                                    {result.diagnosis.immediateActions.map((action, i) => (
                                        <li key={i}>{action}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-100 dark:border-orange-900/30">
                                <h4 className="font-bold text-orange-800 dark:text-orange-200 mb-2">{t.symptoms}</h4>
                                <ul className="list-disc pl-4 space-y-1 text-sm">
                                    {result.diagnosis.symptoms.map((s, i) => (
                                        <li key={i}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        {result.diagnosis.vetConsultationRequired && (
                            <div className="flex items-center gap-3 p-3 bg-red-600 text-white rounded-lg font-bold animate-pulse">
                                <Activity />
                                {t.consultVet}
                            </div>
                        )}
                    </div>
                )}

                {/* MANAGEMENT MODE - Details */}
                {result.managementSuggestions && (
                    <div className="mt-4 space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 border-b border-blue-200 pb-1">Management Plan</h4>
                            <div className="grid gap-3">
                                <div><span className="font-semibold">Nutrition:</span> {result.managementSuggestions.nutrition}</div>
                                <div><span className="font-semibold">Grooming:</span> {result.managementSuggestions.grooming}</div>
                                <div><span className="font-semibold">Housing:</span> {result.managementSuggestions.environment}</div>
                            </div>
                        </div>
                        {result.bodyConditionScore && (
                             <div className="flex items-center gap-4 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary">{result.bodyConditionScore.score}</div>
                                    <div className="text-xs uppercase text-gray-500">BCS Score</div>
                                </div>
                                <div className="text-sm">{result.bodyConditionScore.description}</div>
                             </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};