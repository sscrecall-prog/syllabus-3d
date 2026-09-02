import React from 'react';
import { Target, RotateCw, BarChart3, Trophy, ArrowRight, ShieldCheck } from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface LandingHeroProps {
  onEnterApp: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onEnterApp }) => {
  const handleStart = () => {
    soundManager.playClick();
    onEnterApp();
  };

  const featureCards = [
    {
      title: 'Track Progress',
      desc: 'Monitor your syllabus completion.',
      icon: Target,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/15 border-purple-500/30'
    },
    {
      title: 'Smart Revisions',
      desc: 'Revise smarter with spaced repetition.',
      icon: RotateCw,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/15 border-cyan-500/30'
    },
    {
      title: 'Detailed Analytics',
      desc: 'Analyze performance and improve.',
      icon: BarChart3,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/15 border-blue-500/30'
    },
    {
      title: 'Stay Consistent',
      desc: 'Build consistency and crack your exam.',
      icon: Trophy,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/15 border-pink-500/30'
    }
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#050814] text-white flex flex-col items-center justify-center px-4 py-8 overflow-x-hidden selection:bg-brand-500/30">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-cyan-500/15 via-purple-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Poster Container */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center text-center">
        {/* 3D Glowing Neon 'S' Logo Area */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 mb-4 flex items-center justify-center">
          {/* Animated Ambient Ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-xl animate-pulse" />
          
          {/* Floating Feature Micro-Badges */}
          <div className="absolute -left-2 top-8 p-2 rounded-full bg-slate-900/80 border border-purple-500/30 shadow-lg text-purple-400">
            <Target className="w-4 h-4" />
          </div>
          <div className="absolute -right-2 top-10 p-2 rounded-full bg-slate-900/80 border border-cyan-500/30 shadow-lg text-cyan-400">
            <RotateCw className="w-4 h-4" />
          </div>
          <div className="absolute -left-1 bottom-8 p-2 rounded-full bg-slate-900/80 border border-blue-500/30 shadow-lg text-blue-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="absolute -right-1 bottom-10 p-2 rounded-full bg-slate-900/80 border border-pink-500/30 shadow-lg text-pink-400">
            <Trophy className="w-4 h-4" />
          </div>

          {/* Center 3D Logo */}
          <img
            src="/logo.png"
            alt="SYLLABUS 3D Logo"
            className="w-full h-full object-contain drop-shadow-[0_15px_30px_rgba(0,210,255,0.4)] scale-105 hover:scale-110 transition-transform duration-500"
          />
        </div>

        {/* Headings */}
        <span className="text-sm font-semibold tracking-wider text-slate-300 mb-1">
          Welcome to
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
          <span className="bg-gradient-to-r from-[#00d2ff] via-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
            Syllabus Tracker
          </span>
        </h1>

        <h2 className="text-sm font-semibold text-slate-300 tracking-wide mb-2">
          Track. Master. Succeed.
        </h2>

        <p className="text-xs text-slate-400 max-w-xs sm:max-w-sm mb-6 leading-relaxed">
          Your all-in-one study companion to track syllabus, manage revisions, and achieve your exam goals.
        </p>

        {/* 4 Poster Feature Cards */}
        <div className="w-full grid grid-cols-2 gap-2.5 sm:gap-3 mb-6">
          {featureCards.map((feat, i) => {
            const IconComp = feat.icon;
            return (
              <div
                key={i}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#0c1228]/90 border border-slate-800/80 text-left flex flex-col justify-between shadow-md hover:border-slate-700 transition-all group"
              >
                <div className={`w-8 h-8 rounded-xl ${feat.bgColor} border flex items-center justify-center ${feat.color} mb-2.5`}>
                  <IconComp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white mb-0.5">{feat.title}</h3>
                  <p className="text-[11px] text-slate-400 leading-snug">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Big Glow CTA Button */}
        <button
          onClick={handleStart}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#0066ff] via-[#8b5cf6] to-[#d946ef] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:shadow-[0_0_40px_rgba(217,70,239,0.7)] active:scale-[0.98] transition-all mb-4 group cursor-pointer"
        >
          <span>Let&apos;s get started</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Security / Trust Footer Tag */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Your journey to success starts here.</span>
        </div>
      </div>
    </div>
  );
};

