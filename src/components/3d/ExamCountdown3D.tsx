import React, { useState, useEffect } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { Calendar, Target } from 'lucide-react';

export const ExamCountdown3D: React.FC = React.memo(() => {
  const { currentExam } = useSyllabus();

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const examDate = new Date(currentExam.examDate).getTime();
      const now = new Date().getTime();
      const difference = examDate - now;

      if (difference > 0) {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const m = Math.floor((difference / 1000 / 60) % 60);
        const s = Math.floor((difference / 1000) % 60);

        setTimeLeft(prev => {
          if (prev.seconds === s && prev.minutes === m && prev.hours === h && prev.days === d) return prev;
          return { days: d, hours: h, minutes: m, seconds: s };
        });
      } else {
        setTimeLeft(prev => (prev.days === 0 && prev.seconds === 0 ? prev : { days: 0, hours: 0, minutes: 0, seconds: 0 }));
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [currentExam.examDate]);

  const cards = [
    { label: 'DAYS', value: timeLeft.days, color: 'text-amber-500 dark:text-amber-400' },
    { label: 'HOURS', value: timeLeft.hours, color: 'text-blue-500 dark:text-[#7AA2F7]' },
    { label: 'MINS', value: timeLeft.minutes, color: 'text-emerald-500 dark:text-emerald-400' },
    { label: 'SECS', value: timeLeft.seconds, color: 'text-rose-500 dark:text-rose-400' }
  ];

  const formattedDate = (() => {
    try {
      const d = new Date(currentExam.examDate);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return currentExam.examDate;
    }
  })();

  return (
    <div className="relative rounded-2xl sm:rounded-3xl bg-white dark:bg-[#151622] border border-slate-200/80 dark:border-white/[0.08] shadow-subtle-depth ring-1 ring-black/[0.02] dark:ring-white/[0.03] p-3 sm:p-5 overflow-hidden space-y-2.5 sm:space-y-3.5">
      
      {/* Clean Meta Header */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="w-7 sm:w-10 h-7 sm:h-10 rounded-lg sm:rounded-2xl bg-gradient-to-br from-[#2563EB] to-indigo-600 dark:from-[#7AA2F7] dark:to-[#415C9E] text-white dark:text-[#0B0B0D] flex items-center justify-center shrink-0 shadow-sm">
          <Target className="w-3.5 sm:w-5 h-3.5 sm:h-5 stroke-[2.5]" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-[#C0CAF5] uppercase tracking-wider truncate">
            {currentExam.name} COUNTDOWN
          </h3>
          <p className="text-[9.5px] sm:text-[11px] font-medium text-slate-500 dark:text-[#A9B1D6] flex items-center gap-1.5 mt-0.5 font-mono">
            <Calendar className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#2563EB] dark:text-[#7AA2F7]" />
            <span>Exam Date: {formattedDate}</span>
          </p>
        </div>
      </div>

      {/* 4-Digit Symmetrical Flip-Clock Cards */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3.5">
        {cards.map(c => (
          <div
            key={c.label}
            className="relative py-2 sm:py-4 px-0.5 sm:px-2 rounded-xl sm:rounded-2xl bg-slate-50/90 dark:bg-[#1B1C28] border border-slate-200/70 dark:border-white/[0.06] text-center shadow-2xs flex flex-col items-center justify-center transition-all duration-200 hover:border-[#2563EB]/40 dark:hover:border-[#7AA2F7]/40"
          >
            {/* Split Horizontal Line */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-black/5 dark:bg-white/5 pointer-events-none" />

            <span className={`text-lg sm:text-3xl md:text-4xl font-black font-mono tabular-nums tracking-tight block ${c.color} drop-shadow-xs`}>
              {String(c.value).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[11px] font-black text-slate-500 dark:text-[#A9B1D6] uppercase tracking-widest block font-mono mt-0.5 sm:mt-1">
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

