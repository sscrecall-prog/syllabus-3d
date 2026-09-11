import React, { useState, useEffect, useMemo } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { Calendar, Target, Edit2, Sparkles, Clock } from 'lucide-react';
import { EditExamTargetModal } from '../modals/EditExamTargetModal';
import { soundManager } from '../../utils/soundEffects';

export const ExamCountdown3D: React.FC = React.memo(() => {
  const { currentExam } = useSyllabus();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Calculate dynamic countdown with automatic smart rollover if date has passed
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isProjected: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isProjected: false });

  useEffect(() => {
    if (!currentExam) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const rawDateStr = currentExam.examDate || '2026-10-15';
      
      let targetYr = currentExam.targetYear || 2026;
      let month = 9; // Oct default (0-indexed)
      let day = 15;

      if (rawDateStr.includes('-')) {
        const parts = rawDateStr.split('-').map(Number);
        if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          targetYr = parts[0];
          month = parts[1] - 1;
          day = parts[2];
        }
      }

      const parsedDate = new Date(targetYr, month, day, 9, 0, 0);
      let examTime = parsedDate.getTime();
      let projected = false;

      // If exam date has passed in the past, roll over to the exact same month/day in the next upcoming cycle
      if (isNaN(examTime) || examTime <= now) {
        projected = true;
        const currentYear = new Date().getFullYear();
        let nextCycleDate = new Date(Math.max(targetYr, currentYear), month, day, 9, 0, 0);
        if (nextCycleDate.getTime() <= now) {
          nextCycleDate = new Date(Math.max(targetYr, currentYear) + 1, month, day, 9, 0, 0);
        }
        examTime = nextCycleDate.getTime();
      }

      const difference = Math.max(0, examTime - now);
      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const m = Math.floor((difference / 1000 / 60) % 60);
      const s = Math.floor((difference / 1000) % 60);

      setTimeLeft(prev => {
        if (prev.seconds === s && prev.minutes === m && prev.hours === h && prev.days === d && prev.isProjected === projected) {
          return prev;
        }
        return { days: d, hours: h, minutes: m, seconds: s, isProjected: projected };
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [currentExam?.examDate, currentExam?.targetYear, currentExam?.name]);

  const cards = useMemo(() => [
    { label: 'DAYS', value: timeLeft.days, color: 'text-amber-500 dark:text-amber-400', glow: 'shadow-amber-500/10' },
    { label: 'HOURS', value: timeLeft.hours, color: 'text-sky-500 dark:text-[#7AA2F7]', glow: 'shadow-blue-500/10' },
    { label: 'MINS', value: timeLeft.minutes, color: 'text-emerald-500 dark:text-emerald-400', glow: 'shadow-emerald-500/10' },
    { label: 'SECS', value: timeLeft.seconds, color: 'text-rose-500 dark:text-rose-400', glow: 'shadow-rose-500/10' }
  ], [timeLeft]);

  const formattedDate = useMemo(() => {
    try {
      if (!currentExam?.examDate) return 'Oct 15, 2026';
      if (currentExam.examDate.includes('-')) {
        const parts = currentExam.examDate.split('-').map(Number);
        if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          const d = new Date(parts[0], parts[1] - 1, parts[2]);
          return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      }
      const d = new Date(currentExam.examDate);
      if (isNaN(d.getTime())) return currentExam.examDate;
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return currentExam?.examDate || 'Oct 15, 2026';
    }
  }, [currentExam?.examDate]);

  return (
    <>
      <div className="relative rounded-2xl sm:rounded-3xl bg-white dark:bg-[#141624] border border-slate-200/80 dark:border-white/[0.08] shadow-subtle-depth p-3 sm:p-4 overflow-hidden space-y-2.5">
        {/* Subtle Ambient Radial Backlight */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/5 dark:bg-[#7AA2F7]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Clean Meta Header with Quick Edit Trigger */}
        <div className="relative z-10 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#2563EB] to-indigo-600 dark:from-[#7AA2F7] dark:to-[#415C9E] text-white dark:text-[#0B0B0D] flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <Target className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 stroke-[2.4]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-[#F5F5F7] uppercase tracking-wide truncate">
                  {currentExam.name} COUNTDOWN
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                  Live
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-[#94A3B8] flex items-center gap-1.5 mt-0.5 font-mono">
                <Calendar className="w-3 h-3 text-[#2563EB] dark:text-[#7AA2F7] shrink-0" />
                <span>Exam Date: {formattedDate}</span>
                {timeLeft.isProjected && (
                  <span className="text-amber-500 dark:text-amber-400 text-[9px] font-bold">
                    (Next Cycle)
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setIsEditModalOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all cursor-pointer shrink-0 active:scale-95"
            title="Edit Exam Date & Target"
          >
            <Edit2 className="w-3 h-3 text-[#2563EB] dark:text-[#7AA2F7]" />
            <span className="hidden xs:inline">Edit Target</span>
          </button>
        </div>

        {/* 4-Digit Modern Glass Flip-Clock Cards */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 relative z-10">
          {cards.map(c => (
            <div
              key={c.label}
              className="relative py-2 sm:py-3 px-1 sm:px-2 rounded-xl sm:rounded-2xl bg-slate-50/90 dark:bg-[#1A1C2C] border border-slate-200/80 dark:border-white/[0.08] text-center shadow-xs flex flex-col items-center justify-center transition-all duration-200 hover:border-blue-500/40 dark:hover:border-[#7AA2F7]/40 group"
            >
              {/* Split Horizontal Horizon Line */}
              <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/[0.04] dark:bg-white/[0.04] pointer-events-none" />

              <span className={`text-xl sm:text-2xl md:text-3xl font-black font-mono tabular-nums tracking-tight block ${c.color} drop-shadow-xs transition-transform group-hover:scale-105`}>
                {String(c.value).padStart(2, '0')}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest block font-mono mt-0.5">
                {c.label}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom Study Runway Status Bar */}
        <div className="pt-1 flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-[#94A3B8] border-t border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-1.5 truncate">
            <Clock className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="truncate">
              Runway: <strong className="text-slate-800 dark:text-slate-200 font-black">{timeLeft.days} Days</strong> to exam
            </span>
          </div>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
            Keep Consistent 🔥
          </span>
        </div>
      </div>

      {/* Target Exam Date Edit Modal */}
      {isEditModalOpen && (
        <EditExamTargetModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  );
});

