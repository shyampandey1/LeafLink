
import React, { useState, useEffect } from 'react';
import { MenuIcon } from '../constants.tsx';

interface HeaderProps {
  onMenuClick: () => void;
}

const getGreeting = () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false };
  const hour = parseInt(new Intl.DateTimeFormat('en-US', options).format(now));

  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  return (
    <header className="bg-white/80 dark:bg-brand-dark-bg/80 backdrop-blur-sm sticky top-0 z-30 p-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
            {greeting}, <span className="text-brand-green">Shyam</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Welcome to your Smart Garden</p>
        </div>
        <button
          onClick={onMenuClick}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-brand-dark-card transition-colors"
        >
          <MenuIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>
      </div>
    </header>
  );
};

export default Header;