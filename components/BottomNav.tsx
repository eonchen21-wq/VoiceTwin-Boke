import React from 'react';
import { AppView } from '../types';

interface BottomNavProps {
    currentView: AppView;
    onChange: (view: AppView) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChange }) => {
    // Helper to determine if a tab is active. 
    // Note: 'RESULT' view conceptually belongs to the 'RECORDING' (Home) tab flow.
    const isActive = (view: AppView) => {
        if (view === AppView.RECORDING && (currentView === AppView.RECORDING || currentView === AppView.RESULT)) return true;
        return currentView === view;
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#050508]/85 backdrop-blur-xl border-t border-white/5 pb-safe pt-2">
            <div className="flex justify-around items-center px-2 h-16 w-full max-w-md mx-auto">
                {/* Home Tab */}
                <button 
                    onClick={() => onChange(AppView.RECORDING)}
                    className={`group flex flex-col items-center justify-center w-16 gap-1 relative transition-all duration-300 ${isActive(AppView.RECORDING) ? 'text-primary' : 'text-slate-500 hover:text-white'}`}
                >
                    {isActive(AppView.RECORDING) && (
                         <div className="absolute -top-[17px] w-12 h-1 bg-primary rounded-b-full shadow-[0_0_10px_rgba(37,71,244,0.6)]"></div>
                    )}
                    <span 
                        className={`material-symbols-outlined text-[28px] transition-transform ${isActive(AppView.RECORDING) ? 'drop-shadow-[0_0_12px_rgba(37,71,244,0.4)]' : 'group-hover:scale-110'}`} 
                        style={{ fontVariationSettings: isActive(AppView.RECORDING) ? "'FILL' 1" : "'FILL' 0" }}
                    >
                        mic
                    </span>
                    <span className="text-[10px] font-bold tracking-wide font-body">首页</span>
                </button>

                {/* Playlist Tab */}
                <button 
                    onClick={() => onChange(AppView.PLAYLIST)}
                    className={`group flex flex-col items-center justify-center w-16 gap-1 relative transition-all duration-300 ${isActive(AppView.PLAYLIST) ? 'text-primary' : 'text-slate-500 hover:text-white'}`}
                >
                     {isActive(AppView.PLAYLIST) && (
                         <div className="absolute -top-[17px] w-12 h-1 bg-primary rounded-b-full shadow-[0_0_10px_rgba(37,71,244,0.6)]"></div>
                    )}
                    <span 
                        className={`material-symbols-outlined text-[28px] transition-transform ${isActive(AppView.PLAYLIST) ? 'drop-shadow-[0_0_12px_rgba(37,71,244,0.4)]' : 'group-hover:scale-110'}`}
                         style={{ fontVariationSettings: isActive(AppView.PLAYLIST) ? "'FILL' 1" : "'FILL' 0" }}
                    >
                        library_music
                    </span>
                    <span className="text-[10px] font-medium tracking-wide font-body">歌单</span>
                </button>

                {/* Profile Tab */}
                <button 
                    onClick={() => onChange(AppView.PROFILE)}
                    className={`group flex flex-col items-center justify-center w-16 gap-1 relative transition-all duration-300 ${isActive(AppView.PROFILE) ? 'text-primary' : 'text-slate-500 hover:text-white'}`}
                >
                    {isActive(AppView.PROFILE) && (
                         <div className="absolute -top-[17px] w-12 h-1 bg-primary rounded-b-full shadow-[0_0_10px_rgba(37,71,244,0.6)]"></div>
                    )}
                    <span 
                        className={`material-symbols-outlined text-[28px] transition-transform ${isActive(AppView.PROFILE) ? 'drop-shadow-[0_0_12px_rgba(37,71,244,0.4)]' : 'group-hover:scale-110'}`}
                        style={{ fontVariationSettings: isActive(AppView.PROFILE) ? "'FILL' 1" : "'FILL' 1" }}
                    >
                        person
                    </span>
                    <span className="text-[10px] font-medium tracking-wide font-body">我的</span>
                </button>
            </div>
            {/* Safe Area Spacing */}
            <div className="h-6 w-full"></div>
        </nav>
    );
};

export default BottomNav;
