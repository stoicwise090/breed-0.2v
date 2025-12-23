import React, { useState } from 'react';
import { useAuth } from './useAuth';
import { useApp } from '../context/AppContext';
import { Loader2, UserPlus, ChevronLeft, Cloud } from 'lucide-react';

interface RegisterProps {
    onSwitchToLogin: () => void;
    onBack: () => void;
    onSuccess: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, onBack, onSuccess }) => {
    const { register } = useAuth();
    const { t, settings } = useApp();
    const [name, setName] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const success = await register(name, identifier, password, settings.language);
        setLoading(false);
        if (success) {
            onSuccess();
        } else {
            setError(t.authError);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 animate-fade-in">
             <button onClick={onBack} className="flex items-center text-gray-500 mb-6 hover:text-primary">
                <ChevronLeft size={20} />
                {t.back}
            </button>
            <div className="flex flex-col items-center mb-6">
                <div className="p-3 bg-orange-100 text-secondary rounded-full mb-3">
                    <UserPlus size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t.registerTitle}</h2>
                <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs rounded-lg">
                    <Cloud size={14} />
                    <span>Data syncs across all your devices.</span>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.name}</label>
                    <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.emailPhone}</label>
                    <input 
                        type="text" 
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.password}</label>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 bg-secondary hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : t.register}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                    Already have an account?{' '}
                    <button onClick={onSwitchToLogin} className="text-secondary font-bold hover:underline">
                        {t.login}
                    </button>
                </p>
            </div>
        </div>
    );
};