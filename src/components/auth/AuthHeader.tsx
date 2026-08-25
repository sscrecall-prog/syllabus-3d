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
        className="absolute top-0 right-0 p-2 rounded-2xl bg-[#FAF8F5] dark:bg-[#2A2A2A] text-[#6B7280] dark:text-[#F5E6C8] hover:border-[#D4AF37] border border-[#EBD3A0]/60 dark:border-[#383838] transition-colors cursor-pointer"
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? <Sun className="w-4 h-4 text-[#D4AF37]" /> : <Moon className="w-4 h-4 text-[#6B7280]" />}
      </button>

      {/* App Logo */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 p-2 rounded-3xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0] dark:border-[#333333] shadow-xl flex items-center justify-center">
        <img
          src="/logo.png"
          alt="SYLLABUS 3D Logo"
          className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform"
        />
      </div>

      {/* Heading & Subtitle */}
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#171717] dark:text-[#F5E6C8]">
        {title}
      </h1>
      <p className="text-xs sm:text-sm text-[#6B7280] mt-1.5 max-w-sm">
        {subtitle}
      </p>
    </div>
  );
};
