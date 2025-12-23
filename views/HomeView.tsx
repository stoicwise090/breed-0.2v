import React from 'react';
import { useApp } from '../context/AppContext';
import { Stethoscope, BookOpen, Activity, MapPin } from 'lucide-react';

interface HomeViewProps {
    setCurrentView: (view: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ setCurrentView }) => {
    const { t } = useApp();

    const handleVetFinder = () => {
        if (!navigator.geolocation) {
            alert(t.vetFinderError);
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const url = `https://www.google.com/maps/search/veterinary+clinic/@${latitude},${longitude},12z`;
                window.open(url, '_blank');
            },
            () => { alert(t.vetFinderError); }
        );
    };

    const FeatureCard = ({ id, icon: Icon, title, desc, colorClass }: any) => (
        <button 
            onClick={() => setCurrentView(id)} 
            className="w-full p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-5 text-left"
        >
            <div className={`p-4 rounded-full ${colorClass}`}>
                <Icon size={32} />
            </div>
            <div>
                <h3 className="text-xl font-bold dark:text-white leading-tight">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{desc}</p>
            </div>
        </button>
    );

    return (
        <div className="space-y-6 pb-24">
            <div className="bg-primary rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                <h2 className="text-3xl font-extrabold mb-2">{t.appName}</h2>
                <p className="opacity-90 text-lg font-medium max-w-[80%]">Smart farming assistant for your livestock.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <FeatureCard 
                    id="health" 
                    icon={Stethoscope} 
                    title={t.healthScan} 
                    desc="Disease detection & diagnosis"
                    colorClass="bg-red-100 text-red-600"
                />
                
                <FeatureCard 
                    id="vaccines" 
                    icon={Activity} 
                    title={t.vaccineScheduler} 
                    desc="Schedules & reminders"
                    colorClass="bg-green-100 text-green-600"
                />

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setCurrentView('facts')} 
                        className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center gap-3"
                    >
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><BookOpen size={28} /></div>
                        <span className="font-bold dark:text-white">{t.breedId}</span>
                    </button>

                    <button 
                        onClick={() => setCurrentView('management')} 
                        className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center gap-3"
                    >
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><Activity size={28} /></div>
                        <span className="font-bold dark:text-white">{t.management}</span>
                    </button>
                </div>

                <button 
                    onClick={handleVetFinder} 
                    className="w-full p-4 mt-2 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-100 dark:border-orange-900/40 rounded-2xl flex items-center justify-center gap-3 text-orange-700 dark:text-orange-300 font-bold"
                >
                    <MapPin size={24} />
                    {t.emergencyVet}
                </button>
            </div>
        </div>
    );
};