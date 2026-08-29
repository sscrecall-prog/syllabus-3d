import React, { useState, useEffect } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { Calendar, Clock, Flame, Zap, Sparkles, Target, ArrowRight } from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface ExamCountdown3DProps {
  onOpenFocus?: () => void;
}

export const ExamCountdown3D: React.FC<ExamCountdown3DProps> = ({ onOpenFocus }) => {
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
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
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
    <div className="relative rounded-3xl bg-gradient-to-br from-white via-white to-[#F7F6F0] dark:from-[#18181D] dark:via-[#16161E] dark:to-[#121216] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth p-4 sm:p-6 overflow-hidden space-y-4">
      
      {/* Top Meta Header & Urgency Pill */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#596B35] to-[#3B4723] dark:from-[#7AA2F7] dark:to-[#415C9E] text-white dark:text-[#0B0B0D] flex items-center justify-center shrink-0 shadow-md">
            <Target className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-[#11120F] dark:text-[#C0CAF5] font-serif uppercase tracking-wider">
                {currentExam.name} TARGET COUNTDOWN
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#DCE8B7] dark:bg-[#7AA2F7]/20 text-[#354126] dark:text-[#7AA2F7]">
                Live Sync
              </span>
            </div>
            <p className="text-[11px] text-[#65675F] dark:text-[#A9B1D6] flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3 h-3 text-[#596B35] dark:text-[#7AA2F7]" />
              <span>Exam Date: {formattedDate}</span>
              <span>•</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{timeLeft.days} Days Left</span>
            </p>
          </div>
        </div>

        {/* 1-Click Launch Focus Chamber Action */}
        {onOpenFocus && (
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenFocus();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#11120F] hover:bg-[#596B35] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#1A1B26] text-xs font-extrabold shadow-sm transition-all cursor-pointer active:scale-95 shrink-0 self-end sm:self-auto group"
            title="Launch 3D Deep Study Focus Chamber"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>3D Focus Chamber</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* 3D Holographic Digital Flip Clock Cards */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3.5">
        {cards.map(c => (
          <div
            key={c.label}
            className="relative p-2.5 sm:p-4 rounded-2xl bg-gradient-to-b from-[#F7F6F0] to-[#EAE9E0] dark:from-[#1F2335] dark:to-[#16161E] border border-[#D8D8CF] dark:border-[#292E42] text-center shadow-xs flex flex-col items-center justify-center group hover:border-[#596B35] dark:hover:border-[#7AA2F7] transition-all"
          >
            {/* Center Split Horizontal Line for Flip-Clock Aesthetic */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-black/5 dark:bg-white/5 pointer-events-none" />

            <span className={`text-xl sm:text-3xl md:text-4xl font-black font-mono tracking-tight block ${c.color} drop-shadow-xs`}>
              {String(c.value).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] font-black text-[#65675F] dark:text-[#A9B1D6] uppercase tracking-widest block font-mono mt-1">
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
