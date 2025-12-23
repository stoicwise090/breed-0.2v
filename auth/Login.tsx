import React, { useState } from 'react';
import { useAuth } from './useAuth';
import { useApp } from '../context/AppContext';
import { Loader2, LogIn, ChevronLeft } from 'lucide-react';

interface LoginProps {
    onSwitchToRegister: () => void;
    onBack: () => void;
    onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister, onBack, onSuccess }) => {
    const { login } = useAuth();
    const { t } = useApp();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const success = await login(identifier, password);
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
                <div className="p-3 bg-green-100 text-primary rounded-full mb-3">
                    <LogIn size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t.loginTitle}</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full py-3 bg-primary hover:bg-green-800 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : t.login}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                    Don't have an account?{' '}
                    <button onClick={onSwitchToRegister} className="text-primary font-bold hover:underline">
                        {t.register}
                    </button>
                </p>
            </div>
        </div>
    );
};