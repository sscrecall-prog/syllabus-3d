import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle }) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <div className="relative flex flex-col items-center text-center mb-7 sm:mb-8">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        type="button"
        className="absolute top-0 right-0 p-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
      </button>

      {/* App Logo */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 p-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl flex items-center justify-center">
        <img
          src="/logo.png"
          alt="SYLLABUS 3D Logo"
          className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform"
        />
      </div>

      {/* Heading & Subtitle */}
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
        {title}
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm">
        {subtitle}
      </p>
    </div>
  );
};
