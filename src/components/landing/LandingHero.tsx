import React from 'react';
import { ProgressOrb } from '../3d/ProgressOrb';
import { ArrowRight, ShieldCheck, RotateCw, Flame, TrendingUp } from 'lucide-react';
import { useSyllabus } from '../../context/SyllabusContext';

interface LandingHeroProps {
  onEnterApp: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onEnterApp }) => {
  const { overallStats } = useSyllabus();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-between">
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

      <header className="relative z-10 w-full px-6 py-6 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="SYLLABUS 3D Logo"
            className="w-10 h-10 rounded-2xl object-cover shadow-lg shadow-brand-500/30 hover:scale-105 transition-transform"
          />
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              SYLLABUS <span className="text-brand-500">3D</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Competitive Exam Intelligence
            </p>
          </div>
        </div>

        <button
          onClick={onEnterApp}
          className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-md"
        >
          Launch Tracker
        </button>
      </header>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-600 dark:text-brand-400 text-xs font-semibold mb-6">
            <Flame className="w-4 h-4 fill-brand-500" />
            <span>Premium 3D Syllabus Tracking System</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[tight] tracking-tighter mb-6">
            Track. Complete.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-purple-500 to-emerald-500">
              Revise. Master.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mb-8 leading-relaxed">
            Stop studying blindly. Visualize your entire SSC CGL, Banking, Railway & UPSC exam preparation in an interactive 3D productivity environment with spaced repetition and mistake diagnostics.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 w-full sm:w-auto">
            <button
              onClick={onEnterApp}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-sm font-bold shadow-md transition-all"
            >
              <span>Open Your Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-500" />
              <span>Weak Area Diagnostics</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-amber-500" />
              <span>Spaced Repetition</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>120-Day Heatmap</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative p-8 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl flex flex-col items-center">
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-600 dark:text-brand-400 text-xs font-bold">
              Interactive 3D Model
            </div>

            <div className="my-4">
              <ProgressOrb percentage={overallStats.completionPercentage} size="lg" />
            </div>

            <div className="grid grid-cols-3 gap-4 w-full text-center pt-6 border-t border-slate-100 dark:border-slate-800/80">
              <div>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {overallStats.totalTopics}
                </span>
                <p className="text-[10px] text-slate-500">Topics</p>
              </div>
              <div>
                <span className="text-base font-extrabold text-brand-500">
                  {overallStats.completedCount}
                </span>
                <p className="text-[10px] text-slate-500">Mastered</p>
              </div>
              <div>
                <span className="text-base font-extrabold text-emerald-500">
                  {overallStats.completionPercentage}%
                </span>
                <p className="text-[10px] text-slate-500">Ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-10 w-full px-6 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>SSC CGL 2026 · Banking IBPS | SBI · Railway NTPC · UPSC CSE</p>
      </footer>
    </div>
  );
};
