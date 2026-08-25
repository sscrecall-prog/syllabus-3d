import React from 'react';

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#040714] text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-x-hidden selection:bg-brand-500/30">
      {/* Subtle Background Radial Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-gradient-to-tr from-brand-500/10 via-purple-600/10 to-pink-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Centered Constrained Auth Card (420-460px max width) */}
      <div className="relative z-10 w-full max-w-[440px] p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl backdrop-blur-xl animate-fade-in my-auto">
        {children}
      </div>

      {/* Footer Branding */}
      <div className="relative z-10 text-center mt-6 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
        SYLLABUS 3D · Smart Exam Mastery Platform
      </div>
    </div>
  );
};
