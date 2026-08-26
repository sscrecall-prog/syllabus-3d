import React, { useState, useEffect } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { Calendar, Clock, Flame, ShieldAlert, Sparkles } from 'lucide-react';

export const ExamCountdown3D: React.FC = () => {
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
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.minutes },
    { label: 'Secs', value: timeLeft.seconds }
  ];

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#DCE8B7] dark:bg-[#8B5CF6]/20 text-[#596B35] dark:text-[#8B5CF6] flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5 stroke-[2]" />
        </div>
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-[#191A17] dark:text-[#F5F5F7] font-serif uppercase tracking-wider">
            {currentExam.name} Countdown
          </h3>
          <p className="text-[11px] text-[#65675F] dark:text-[#85877E]">
            Target Date: {new Date(currentExam.examDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full md:w-auto">
        {cards.map(c => (
          <div
            key={c.label}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-center min-w-[60px]"
          >
            <span className="text-base sm:text-xl font-extrabold text-[#11120F] dark:text-[#F5F5F7] font-mono block">
              {String(c.value).padStart(2, '0')}
            </span>
            <span className="text-[9px] font-bold text-[#596B35] dark:text-[#8B5CF6] uppercase tracking-wider block font-mono">
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
