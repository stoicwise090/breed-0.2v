import React, { useState } from 'react';
import { 
    Menu, X, Calendar, History, Settings, Home, 
    Stethoscope, BookOpen, Activity, ChevronRight, 
    PanelLeftClose, PanelLeftOpen, LogIn, LogOut, User as UserIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../auth/useAuth';

interface LayoutProps {
    currentView: string;
    setCurrentView: (view: string) => void;
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, setCurrentView, children }) => {
    const { t, settings, showSyncPrompt, handleSync } = useApp();
    const { user, isGuest, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Full Navigation List (Sidebar)
    const allNavItems = [
        { id: 'home', label: t.appName, icon: Home },
        { id: 'health', label: t.healthScan, icon: Stethoscope },
        { id: 'vaccines', label: t.vaccineScheduler, icon: Calendar },
        { id: 'facts', label: t.breedId, icon: BookOpen },
        { id: 'management', label: t.management, icon: Activity },
        { id: 'history', label: t.history, icon: History },
        { id: 'settings', label: t.settings, icon: Settings },
    ];

    // Priority Navigation List (Mobile Bottom Bar)
    const bottomNavItems = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'health', icon: Stethoscope, label: 'Scan' },
        { id: 'vaccines', icon: Calendar, label: 'Vax' },
        { id: 'history', icon: History, label: 'Logs' },
    ];

    const handleNav = (id: string) => {
        setCurrentView(id);
        setIsMobileMenuOpen(false);
    };

    const getScaleClass = () => {
        switch (settings.fontSize) {
            case 'large': return 'text-lg';
            case 'extra': return 'text-xl';
            default: return 'text-base';
        }
    };

    return (
        <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden ${getScaleClass()}`}>
            
            {/* ================= DESKTOP SIDEBAR ================= */}
            <aside 
                className={`hidden md:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 z-20 transition-all duration-300 ease-in-out ${
                    isSidebarCollapsed ? 'w-20' : 'w-72'
                }`}
            >
                {/* Header */}
                <div className={`p-4 border-b border-gray-100 dark:border-gray-700 bg-primary text-white flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} transition-all h-16`}>
                    {!isSidebarCollapsed && (
                        <div className="overflow-hidden whitespace-nowrap">
                            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                <Activity className="text-white flex-shrink-0" />
                                {t.appName}
                            </h1>
                        </div>
                    )}
                     {isSidebarCollapsed && <Activity className="text-white" size={28} />}
                </div>

                {/* User Profile Section (Sidebar) */}
                <div className={`p-4 border-b border-gray-100 dark:border-gray-700 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
                    {isGuest ? (
                        isSidebarCollapsed ? (
                            <button onClick={() => setCurrentView('login')} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:text-primary"><LogIn size={20} /></button>
                        ) : (
                            <button 
                                onClick={() => setCurrentView('login')}
                                className="w-full py-2 px-4 bg-orange-50 dark:bg-orange-900/20 text-secondary dark:text-orange-400 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-100 transition"
                            >
                                <LogIn size={16} />
                                {t.login}
                            </button>
                        )
                    ) : (
                        <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                {user?.name.charAt(0).toUpperCase()}
                            </div>
                            {!isSidebarCollapsed && (
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{user?.name}</p>
                                    <button onClick={logout} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                                        <LogOut size={10} /> {t.logout}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {allNavItems.map(item => {
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNav(item.id)}
                                title={isSidebarCollapsed ? item.label : ''}
                                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-xl transition-all group relative ${
                                    isActive 
                                        ? 'bg-green-50 dark:bg-green-900/30 text-primary dark:text-green-400 font-bold shadow-sm ring-1 ring-green-100 dark:ring-green-900' 
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium'
                                }`}
                            >
                                <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
                                    <item.icon size={22} className={`flex-shrink-0 ${isActive ? 'text-primary dark:text-green-400' : 'text-gray-400'}`} />
                                    {!isSidebarCollapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
                                </div>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-gray-100 dark:border-gray-700">
                     <button 
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="w-full flex items-center justify-center p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                </div>
            </aside>

            {/* ================= MOBILE DRAWER ================= */}
             {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside className={`fixed top-0 left-0 h-full w-4/5 max-w-xs bg-white dark:bg-gray-800 z-50 transform transition-transform duration-300 ease-out shadow-2xl md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-5 flex justify-between items-center bg-primary text-white h-16">
                    <h2 className="font-bold text-xl">{t.appName}</h2>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 hover:bg-white/20 rounded-full">
                        <X size={28} />
                    </button>
                </div>
                
                {/* Mobile User Profile */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                    {isGuest ? (
                        <button 
                            onClick={() => handleNav('login')}
                            className="w-full py-3 bg-secondary text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md"
                        >
                            <LogIn size={20} /> {t.login}
                        </button>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                                    {user?.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white">{user?.name}</p>
                                    <p className="text-xs text-gray-500">{user?.email || user?.phone}</p>
                                </div>
                            </div>
                            <button onClick={logout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                <LogOut size={20} />
                            </button>
                        </div>
                    )}
                </div>

                <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-160px)]">
                    {allNavItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleNav(item.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                                currentView === item.id 
                                    ? 'bg-green-50 dark:bg-green-900/30 text-primary dark:text-green-400 font-bold border-l-4 border-primary' 
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            <item.icon size={24} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* ================= MAIN CONTENT ================= */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
                
                <header className="md:hidden bg-primary text-white p-4 flex items-center justify-between shadow-md z-30 flex-shrink-0 h-16">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 hover:bg-white/10 rounded-lg">
                            <Menu size={28} />
                        </button>
                        <h1 className="text-xl font-bold tracking-tight">{t.appName}</h1>
                    </div>
                    {isGuest ? (
                         <button onClick={() => setCurrentView('login')} className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full hover:bg-white/30">
                            {t.login}
                         </button>
                    ) : (
                         <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center font-bold text-xs">
                             {user?.name.charAt(0)}
                         </div>
                    )}
                </header>

                {/* GUEST BANNER CTA */}
                {isGuest && currentView !== 'login' && currentView !== 'register' && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 px-4 py-2 flex items-center justify-between text-xs md:text-sm text-orange-800 dark:text-orange-200 border-b border-orange-100 dark:border-orange-900/30 flex-shrink-0">
                        <span>{t.guestModeMsg}</span>
                        <button onClick={() => setCurrentView('login')} className="font-bold underline hover:text-orange-600">{t.login}</button>
                    </div>
                )}

                {/* SYNC PROMPT MODAL */}
                {showSyncPrompt && (
                    <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-slide-up">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Sync Data?</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">{t.syncDataPrompt}</p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => handleSync(false)}
                                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold"
                                >
                                    {t.syncNo}
                                </button>
                                <button 
                                    onClick={() => handleSync(true)}
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg"
                                >
                                    {t.syncYes}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full max-w-5xl mx-auto pb-24 md:pb-8 scroll-smooth relative">
                    {children}
                </main>

                <nav className="md:hidden bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex justify-between items-center px-6 py-2 pb-4 fixed bottom-0 w-full z-30 shadow-up">
                    {bottomNavItems.map(item => {
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNav(item.id)}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
                                    isActive 
                                        ? 'text-primary dark:text-green-400 -translate-y-1' 
                                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                            >
                                <div className={`p-1.5 rounded-full ${isActive ? 'bg-green-50 dark:bg-green-900/30' : ''}`}>
                                    <item.icon size={isActive ? 26 : 24} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className={`text-[10px] font-bold mt-1 ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>

            </div>
        </div>
    );
};