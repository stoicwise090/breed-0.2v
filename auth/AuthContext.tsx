import React, { createContext, useState, useEffect } from 'react';
import { User, Language } from '../types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isGuest: boolean;
    login: (identifier: string, password: string) => Promise<boolean>;
    register: (name: string, identifier: string, password: string, language: Language) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load persisted session on mount
        const storedToken = localStorage.getItem('kisan-auth-token');
        const storedUser = localStorage.getItem('kisan-auth-user');
        
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (identifier: string, password: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });

            if (response.ok) {
                const data = await response.json();
                const { token, user } = data;
                
                setUser(user);
                setToken(token);
                localStorage.setItem('kisan-auth-token', token);
                localStorage.setItem('kisan-auth-user', JSON.stringify(user));
                return true;
            }
        } catch (e) {
            console.error(e);
        }
        return false;
    };

    const register = async (name: string, identifier: string, password: string, language: Language): Promise<boolean> => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, identifier, password, language })
            });

            if (response.ok) {
                const data = await response.json();
                const { token, user } = data;

                setUser(user);
                setToken(token);
                localStorage.setItem('kisan-auth-token', token);
                localStorage.setItem('kisan-auth-user', JSON.stringify(user));
                return true;
            }
        } catch (e) {
            console.error(e);
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('kisan-auth-token');
        localStorage.removeItem('kisan-auth-user');
        // Clear cached history if any to prevent guest data leak
        localStorage.removeItem('kisan-cached-history'); 
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isGuest: !user,
            login,
            register,
            logout,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};