import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyzeImage } from '../services/geminiService';
import { AnalysisResult, AppMode } from '../types';
import { ResultCard } from '../components/ResultCard';

interface ImageAnalysisViewProps {
    mode: AppMode;
}

export const ImageAnalysisView: React.FC<ImageAnalysisViewProps> = ({ mode }) => {
    const { t, settings, addToHistory } = useApp();
    const [image, setImage] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setResult(null);
            setError(null);
            const reader = new FileReader();
            reader.onload = (ev) => setImage(ev.target?.result as string);
            reader.readAsDataURL(selectedFile);
        }
    };

    const runAnalysis = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const data = await analyzeImage(file, mode, settings.language);
            setResult(data);
            addToHistory({
                id: Date.now().toString(),
                timestamp: Date.now(),
                mode,
                result: data,
                thumbnail: image || undefined
            });
        } catch (err) {
            setError("Analysis failed. Please check internet connection.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setImage(null);
        setFile(null);
        setResult(null);
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {mode === 'health' ? t.healthScan : mode === 'facts' ? t.breedId : t.management}
                </h2>
                {image && (
                    <button onClick={reset} className="text-sm text-primary font-medium hover:underline">
                        {t.takePhoto}
                    </button>
                )}
            </div>

            {/* Main Action Area */}
            {!result ? (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl flex flex-col items-center justify-center overflow-hidden relative mb-6 border-2 border-dashed border-gray-300 dark:border-gray-600">
                        {image ? (
                            <img src={image} alt="Preview" className="w-full h-full object-contain bg-black" />
                        ) : (
                            <div className="text-center text-gray-500 p-4" onClick={() => fileInputRef.current?.click()}>
                                <Camera size={64} className="mx-auto mb-4 text-primary opacity-80" />
                                <p className="text-lg font-medium">{t.uploadImage}</p>
                                <p className="text-sm opacity-75 mt-1">Tap to open camera</p>
                            </div>
                        )}
                    </div>

                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef}
                        onChange={handleFileChange} 
                        className="hidden"
                        capture="environment"
                    />

                    <div className="grid grid-cols-1 gap-3">
                        {!image ? (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-lg hover:bg-green-800 transition flex items-center justify-center gap-3"
                            >
                                <Camera size={24} />
                                {t.takePhoto}
                            </button>
                        ) : (
                            <button 
                                onClick={runAnalysis}
                                disabled={loading}
                                className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition flex items-center justify-center gap-3 ${loading ? 'bg-gray-400' : 'bg-secondary hover:bg-orange-700'}`}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : t.analyzing.replace('...', '')}
                            </button>
                        )}
                    </div>
                    {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-center">{error}</div>}
                </div>
            ) : (
                <div className="animate-fade-in">
                    <ResultCard result={result} t={t} language={settings.language} />
                    <button 
                        onClick={reset}
                        className="w-full mt-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-bold"
                    >
                        {t.takePhoto}
                    </button>
                </div>
            )}
        </div>
    );
};