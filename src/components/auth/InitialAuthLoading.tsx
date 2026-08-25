import React from 'react';

export const InitialAuthLoading: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#040714] text-white flex flex-col justify-center items-center p-4">
      <div className="relative flex flex-col items-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-3 flex items-center justify-center animate-pulse">
          <img src="/logo.png" alt="SYLLABUS 3D" className="w-full h-full object-contain" />
        </div>
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mt-6" />
      </div>
    </div>
  );
};
