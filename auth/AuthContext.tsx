import React, { createContext, useState, useEffect } from 'react';
import { User, Language } from '../types';

interface AuthContextType {
    user: User | null;
    isGuest: boolean;
    login: (identifier: string, password: string) => Promise<boolean>;
    register: (name: string, identifier: string, password: string, language: Language) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load persisted user on mount
        const storedUser = localStorage.getItem('kisan-auth-user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (identifier: string, password: string): Promise<boolean> => {
        // SIMULATED BACKEND DELAY
        await new Promise(resolve => setTimeout(resolve, 800));

        // Basic validation for demo purposes
        // In real app, this would hit an API endpoint
        try {
            const users = JSON.parse(localStorage.getItem('kisan-users-db') || '[]');
            const foundUser = users.find((u: any) => 
                (u.email === identifier || u.phone === identifier) && u.password === password
            );

            if (foundUser) {
                const safeUser: User = {
                    id: foundUser.id,
                    name: foundUser.name,
                    email: foundUser.email,
                    phone: foundUser.phone,
                    preferredLanguage: foundUser.preferredLanguage
                };
                setUser(safeUser);
                localStorage.setItem('kisan-auth-user', JSON.stringify(safeUser));
                return true;
            }
        } catch (e) {
            console.error(e);
        }
        return false;
    };

    const register = async (name: string, identifier: string, password: string, language: Language): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            const users = JSON.parse(localStorage.getItem('kisan-users-db') || '[]');
            
            // Check existence
            if (users.some((u: any) => u.email === identifier || u.phone === identifier)) {
                return false; 
            }

            const newUser = {
                id: Date.now().toString(),
                name,
                email: identifier.includes('@') ? identifier : undefined,
                phone: !identifier.includes('@') ? identifier : undefined,
                password, // In real app, never store plain text password
                preferredLanguage: language
            };

            users.push(newUser);
            localStorage.setItem('kisan-users-db', JSON.stringify(users));

            const safeUser: User = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                preferredLanguage: newUser.preferredLanguage
            };
            
            setUser(safeUser);
            localStorage.setItem('kisan-auth-user', JSON.stringify(safeUser));
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('kisan-auth-user');
    };

    return (
        <AuthContext.Provider value={{
            user,
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