import React from 'react';

export const InitialAuthLoading: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#171717] text-[#F5E6C8] flex flex-col justify-center items-center p-4">
      <div className="relative flex flex-col items-center">
        <div className="w-20 h-20 rounded-3xl bg-[#222222] border border-[#383838] shadow-2xl p-3 flex items-center justify-center animate-pulse">
          <img src="/logo.png" alt="SYLLABUS 3D" className="w-full h-full object-contain" />
        </div>
        <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mt-6" />
      </div>
    </div>
  );
};
