import React, { useState, useEffect, useMemo } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { Clock, Calendar, Sparkles, Edit3, Flame, AlertCircle } from 'lucide-react';
import { EditExamTargetModal } from '../modals/EditExamTargetModal';

export const ExamCountdown3D: React.FC = () => {
  const { currentExam } = useSyllabus();
  const [showEditModal, setShowEditModal] = useState(false);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false
  });

  const targetDateStr = currentExam?.examDate || '2026-10-15';

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(targetDateStr).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr]);

  const formattedExamDate = useMemo(() => {
    try {
      return new Date(targetDateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return targetDateStr;
    }
  }, [targetDateStr]);

  const phaseInfo = useMemo(() => {
    if (timeLeft.isPast) return { label: 'Exam Concluded / Target Reached', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
    if (timeLeft.days < 30) return { label: '🚨 Final Sprint: Full Mock Drills & Speed Math', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    if (timeLeft.days < 90) return { label: '⚡ Phase 2: High-Yield Revision & Spaced Recall', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: '🔥 Phase 1: Deep Core Concept Mastery', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
  }, [timeLeft]);

  if (!currentExam) return null;

  return (
    <>
      <div className="relative w-full rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-[#0c132c]/95 via-[#080d20]/95 to-[#120f2e]/95 border border-slate-700/60 shadow-[0_15px_40px_rgba(0,0,0,0.45)] overflow-hidden text-white group">
        {/* Background Glowing Ambient Meshes */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-cyan-500/15 via-purple-600/15 to-transparent rounded-full blur-2xl pointer-events-none -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-pink-600/10 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

        {/* Top Bar: Exam Title, Date, & Customizer Button */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-600/30 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  {currentExam.name}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-brand-500/20 border border-brand-500/40 text-brand-400 text-[10px] font-bold">
                  {currentExam.targetYear || 2026}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Target Exam Date: <strong className="text-slate-200">{formattedExamDate}</strong></span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowEditModal(true)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/15 text-slate-200 text-xs font-semibold backdrop-blur-md transition-all shadow-sm cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Customize Exam</span>
          </button>
        </div>

        {/* 4 Glowing 3D Countdown Dials */}
        <div className="relative z-10 grid grid-cols-4 gap-2 sm:gap-4 mb-5">
          {/* DAYS */}
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 shadow-[0_8px_20px_rgba(0,210,255,0.15)] flex flex-col items-center justify-center text-center transform hover:scale-105 transition-all">
            <span className="text-2xl sm:text-4xl font-black font-mono tracking-tight bg-gradient-to-b from-cyan-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(0,210,255,0.4)]">
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[11px] font-extrabold uppercase tracking-widest text-cyan-300/80 mt-1">
              Days Left
            </span>
          </div>

          {/* HOURS */}
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-purple-500/30 shadow-[0_8px_20px_rgba(168,85,247,0.15)] flex flex-col items-center justify-center text-center transform hover:scale-105 transition-all">
            <span className="text-2xl sm:text-4xl font-black font-mono tracking-tight bg-gradient-to-b from-purple-300 via-purple-400 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(168,85,247,0.4)]">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[11px] font-extrabold uppercase tracking-widest text-purple-300/80 mt-1">
              Hours
            </span>
          </div>

          {/* MINUTES */}
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-pink-500/30 shadow-[0_8px_20px_rgba(236,72,153,0.15)] flex flex-col items-center justify-center text-center transform hover:scale-105 transition-all">
            <span className="text-2xl sm:text-4xl font-black font-mono tracking-tight bg-gradient-to-b from-pink-300 via-pink-400 to-rose-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(236,72,153,0.4)]">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[11px] font-extrabold uppercase tracking-widest text-pink-300/80 mt-1">
              Minutes
            </span>
          </div>

          {/* SECONDS */}
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 shadow-[0_8px_20px_rgba(16,185,129,0.15)] flex flex-col items-center justify-center text-center transform hover:scale-105 transition-all">
            <span className="text-2xl sm:text-4xl font-black font-mono tracking-tight bg-gradient-to-b from-emerald-300 via-emerald-400 to-teal-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(16,185,129,0.4)]">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[11px] font-extrabold uppercase tracking-widest text-emerald-300/80 mt-1">
              Seconds
            </span>
          </div>
        </div>

        {/* Dynamic Study Phase Status Tag */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-[11px]">
          <div className={`px-3 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${phaseInfo.color}`}>
            <span>{phaseInfo.label}</span>
          </div>

          <span className="text-slate-400 text-[11px]">
            Every second counts toward your AIR 1 goal 🚀
          </span>
        </div>
      </div>

      {/* Edit Modal */}
      <EditExamTargetModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </>
  );
};
