
import React, { useState } from 'react';
import AppGuide from './AppGuide.tsx';
import { XIcon, BookOpenIcon, BotIcon, GearIcon, CalendarIcon, SunIcon, MoonIcon } from '../constants.tsx';

interface NavMenuProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const PlaceholderView: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 p-8">
        <div className="p-4 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">{title}</h3>
        <p className="text-sm">This feature is currently under development. Stay tuned for updates!</p>
    </div>
);


const NavMenu: React.FC<NavMenuProps> = ({ isOpen, onClose, theme, toggleTheme }) => {
  const [activeView, setActiveView] = useState('app-guide');

  const menuItems = [
    { id: 'app-guide', label: 'App Guide', icon: <BookOpenIcon className="w-6 h-6" /> },
    { id: 'recommendations', label: 'AI Recommendations', icon: <BotIcon className="w-6 h-6" /> },
    { id: 'automation', label: 'Automation', icon: <GearIcon className="w-6 h-6" /> },
    { id: 'scheduling', label: 'Scheduling', icon: <CalendarIcon className="w-6 h-6" /> },
  ];

  const renderContent = () => {
    switch (activeView) {
        case 'app-guide':
            return <AppGuide />;
        case 'recommendations':
            return <PlaceholderView title="AI Recommendations" icon={<BotIcon className="w-8 h-8 text-purple-500"/>} />;
        case 'automation':
            return <PlaceholderView title="Automation" icon={<GearIcon className="w-8 h-8 text-blue-500"/>} />;
        case 'scheduling':
            return <PlaceholderView title="Scheduling" icon={<CalendarIcon className="w-8 h-8 text-green-500"/>} />;
        default:
            return null;
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      ></div>
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-brand-dark-card shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Menu</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex flex-col h-[calc(100%-65px)]">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <nav className="space-y-2">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`w-full flex items-center gap-4 p-3 rounded-lg text-left text-base font-medium transition-colors ${
                                activeView === item.id 
                                ? 'bg-brand-green/10 text-brand-green' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                            }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="flex-grow p-4 overflow-y-auto bg-gray-50 dark:bg-brand-dark-bg">
                {renderContent()}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Theme</span>
                    <div className="flex items-center gap-1 p-1 rounded-full bg-gray-200 dark:bg-brand-dark-bg">
                        <button
                            onClick={() => theme !== 'light' && toggleTheme()}
                            className={`p-1.5 rounded-full transition-colors ${theme === 'light' ? 'bg-white shadow text-amber-500' : 'text-gray-400'}`}
                            aria-label="Switch to light theme"
                        >
                            <SunIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => theme !== 'dark' && toggleTheme()}
                            className={`p-1.5 rounded-full transition-colors ${theme === 'dark' ? 'bg-brand-dark-card shadow text-white' : 'text-gray-500'}`}
                            aria-label="Switch to dark theme"
                        >
                            <MoonIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default NavMenu;