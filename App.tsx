import React, { useState } from 'react';
import { AuthProvider } from './auth/AuthContext';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { HomeView } from './views/HomeView';
import { ImageAnalysisView } from './views/ImageAnalysisView';
import { VaccineView } from './views/VaccineView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { Login } from './auth/Login';
import { Register } from './auth/Register';

const AppContent: React.FC = () => {
    const [currentView, setCurrentView] = useState('home');

    const renderView = () => {
        switch (currentView) {
            case 'home':
                return <HomeView setCurrentView={setCurrentView} />;
            case 'health':
                return <ImageAnalysisView mode="health" />;
            case 'facts':
                return <ImageAnalysisView mode="facts" />;
            case 'management':
                return <ImageAnalysisView mode="management" />;
            case 'vaccines':
                return <VaccineView />;
            case 'history':
                return <HistoryView />;
            case 'settings':
                return <SettingsView />;
            case 'login':
                return <Login 
                    onSwitchToRegister={() => setCurrentView('register')} 
                    onBack={() => setCurrentView('home')}
                    onSuccess={() => setCurrentView('home')}
                />;
            case 'register':
                return <Register 
                    onSwitchToLogin={() => setCurrentView('login')} 
                    onBack={() => setCurrentView('home')}
                    onSuccess={() => setCurrentView('home')}
                />;
            default:
                return <HomeView setCurrentView={setCurrentView} />;
        }
    };

    return (
        <Layout currentView={currentView} setCurrentView={setCurrentView}>
            {renderView()}
        </Layout>
    );
};

// Error Boundary for safety
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_: any) {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("App crashed:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
                        <p className="text-gray-600 mb-4">Please reload the application.</p>
                        <button onClick={() => window.location.reload()} className="bg-primary text-white px-4 py-2 rounded">
                            Reload
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <AppProvider>
                    <AppContent />
                </AppProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
};

export default App;