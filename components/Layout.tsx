import React from 'react';
import { AppView } from '../types';
import BottomNav from './BottomNav';

interface LayoutProps {
    currentView: AppView;
    onNavigate: (view: AppView) => void;
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => {
    // Hide BottomNav on Login view
    const showNav = currentView !== AppView.LOGIN;

    return (
        <div className="flex flex-col min-h-screen bg-background-dark">
            <div className="flex-1 flex flex-col relative w-full max-w-md mx-auto shadow-2xl overflow-hidden min-h-screen">
                {children}
            </div>
            {showNav && <BottomNav currentView={currentView} onChange={onNavigate} />}
        </div>
    );
};

export default Layout;
