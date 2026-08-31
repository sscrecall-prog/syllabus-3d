import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Moon,
  Flame,
  Zap,
  Smile,
  Coffee,
  BatteryLow,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Trophy,
  History
} from 'lucide-react';
import { useSyllabus } from '../../context/SyllabusContext';
import { DailyMood, DistractionCategory } from '../../types/syllabus';
import { getTodayDateKey } from '../../utils/dailyProductivityStorage';
import { soundManager } from '../../utils/soundEffects';

interface DailyReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHistory?: () => void;
}

export const DailyReflectionModal: React.FC<DailyReflectionModalProps> = ({
  isOpen,
  onClose,
  onOpenHistory
}) => {
  const { top3Targets, saveDailyReflection, reflectionsHistory } = useSyllabus();

  const todayKey = getTodayDateKey();
  const existingTodayReflection = reflectionsHistory.find(r => r.date === todayKey);

  const completedTargetsCount = top3Targets.filter(t => t.text.trim() && t.completed).length;
  const totalTargetsCount = top3Targets.filter(t => t.text.trim()).length;

  const [mood, setMood] = useState<DailyMood>(existingTodayReflection?.mood || 'fire');
  const [rating, setRating] = useState<number>(existingTodayReflection?.rating || 5);
  const [biggestWin, setBiggestWin] = useState<string>(existingTodayReflection?.biggestWin || '');
  const [distraction, setDistraction] = useState<DistractionCategory>(existingTodayReflection?.distractionReason || 'none');
  const [distractionNote, setDistractionNote] = useState<string>(existingTodayReflection?.distractionNote || '');
  const [tomorrowPriority, setTomorrowPriority] = useState<string>(existingTodayReflection?.tomorrowPriority || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!biggestWin.trim() && !tomorrowPriority.trim()) {
      alert('Please fill at least your biggest win or tomorrow priority!');
      return;
    }

    saveDailyReflection({
      date: todayKey,
      rating,
      mood,
      biggestWin: biggestWin.trim() || 'Showed up and stayed committed!',
      distractionReason: distraction,
      distractionNote: distractionNote.trim() || undefined,
      tomorrowPriority: tomorrowPriority.trim() || 'Crush morning study session',
      targetsCompletedCount: completedTargetsCount
    });

    onClose();
  };

  const moodOptions: Array<{ id: DailyMood; label: string; icon: any; color: string; desc: string }> = [
    { id: 'fire', label: 'Unstoppable', icon: Flame, color: 'text-orange-500 bg-orange-500/10 border-orange-500/30', desc: '100% Locked In' },
    { id: 'lightning', label: 'Productive', icon: Zap, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30', desc: 'Solid Output' },
    { id: 'happy', label: 'Moderate', icon: Smile, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', desc: 'Good Progress' },
    { id: 'tired', label: 'Distracted', icon: Coffee, color: 'text-sky-500 bg-sky-500/10 border-sky-500/30', desc: 'Lost Focus' },
    { id: 'stressed', label: 'Low Energy', icon: BatteryLow, color: 'text-rose-500 bg-rose-500/10 border-rose-500/30', desc: 'Need Recovery' }
  ];

  const distractionPills: Array<{ id: DistractionCategory; label: string; icon: string }> = [
    { id: 'none', label: 'None - Zero Distractions! 🏆', icon: '✨' },
    { id: 'social_media', label: 'Social Media / Reels 📱', icon: '📵' },
    { id: 'youtube', label: 'YouTube Rabbit Hole 📺', icon: '⏳' },
    { id: 'overthinking', label: 'Overthinking / Anxiety 🧠', icon: '💭' },
    { id: 'fatigue', label: 'Sleepiness / Low Energy 🥱', icon: '⚡' },
    { id: 'other', label: 'Other Interruption ⚠️', icon: '📝' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#FAF9F5] dark:bg-[#12131C] border border-[#D8D8CF] dark:border-[#28293D] shadow-2xl overflow-hidden animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Glowing Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-br from-[#1A1B28] via-[#12131F] to-[#0A0B12] text-white border-b border-[#28293D] overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shadow-lg">
                <Moon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Day-End Reflection
                  </span>
                  <span className="text-[10px] font-mono text-[#A1A1B2]">{todayKey}</span>
                </div>
                <h3 className="text-base sm:text-lg font-black font-serif uppercase tracking-tight text-white mt-0.5">
                  1-Minute Night Study Journal
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onOpenHistory && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenHistory();
                  }}
                  className="p-2 rounded-xl text-[#A1A1B2] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="View Reflection History"
                >
                  <History className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-[#A1A1B2] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Today's Target Stats Badge */}
          <div className="relative z-10 flex items-center gap-2 mt-4 pt-3 border-t border-white/10 text-xs font-mono text-[#C2C5D6]">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Top 3 Non-Negotiables:</span>
            <span className="font-extrabold text-white bg-white/10 px-2 py-0.5 rounded-md border border-white/15">
              {completedTargetsCount} / {Math.max(3, totalTargetsCount)} Completed
            </span>
          </div>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4.5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* 1. Daily Mood / Energy Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#11120F] dark:text-[#E2E4F0] flex items-center justify-between">
              <span>1. How was your focus & energy today?</span>
              <span className="text-[10px] font-mono text-[#85877E]">{rating}/5 Rating</span>
            </label>

            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {moodOptions.map(m => {
                const Icon = m.icon;
                const isSelected = mood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMood(m.id);
                      if (m.id === 'fire') setRating(5);
                      else if (m.id === 'lightning') setRating(4);
                      else if (m.id === 'happy') setRating(3);
                      else if (m.id === 'tired') setRating(2);
                      else setRating(1);
                      soundManager.playClick();
                    }}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer text-center flex flex-col items-center gap-1 ${
                      isSelected
                        ? `${m.color} ring-2 ring-current shadow-md scale-105 font-bold`
                        : 'bg-white dark:bg-[#1A1B28] border-[#D8D8CF] dark:border-[#28293D] text-[#65675F] dark:text-[#8E90A6] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-mono leading-none tracking-tight">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Biggest Academic Win */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#11120F] dark:text-[#E2E4F0] flex items-center gap-1.5">
              <span>2. Aaj ka sabse bada academic win kya tha?</span>
              <span className="text-amber-500 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              value={biggestWin}
              onChange={e => setBiggestWin(e.target.value)}
              placeholder="e.g. Completed 60 Geometry PYQs & full speed mock!"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#181926] border border-[#D8D8CF] dark:border-[#28293D] text-xs font-medium text-[#11120F] dark:text-white placeholder-[#85877E] focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] shadow-xs"
            />
          </div>

          {/* 3. Primary Distraction / Trap */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#11120F] dark:text-[#E2E4F0]">
              3. Kahan time waste hua ya focus toota?
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {distractionPills.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setDistraction(d.id);
                    soundManager.playClick();
                  }}
                  className={`px-3 py-2 rounded-xl text-[11px] font-medium border text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                    distraction === d.id
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300 font-bold shadow-xs'
                      : 'bg-white dark:bg-[#181926] border-[#D8D8CF] dark:border-[#28293D] text-[#65675F] dark:text-[#9A9CAE] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="truncate">{d.label}</span>
                </button>
              ))}
            </div>

            {distraction !== 'none' && (
              <input
                type="text"
                value={distractionNote}
                onChange={e => setDistractionNote(e.target.value)}
                placeholder="Optional note: Why did this happen & how to prevent it?"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#181926] border border-[#D8D8CF] dark:border-[#28293D] text-[11px] text-[#11120F] dark:text-white placeholder-[#85877E] focus:outline-none focus:border-rose-500"
              />
            )}
          </div>

          {/* 4. Tomorrow Morning's #1 Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#11120F] dark:text-[#E2E4F0] flex items-center gap-1.5">
              <span>4. Kal subah ka sabse pehla #1 non-negotiable target?</span>
              <span className="text-amber-500 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              value={tomorrowPriority}
              onChange={e => setTomorrowPriority(e.target.value)}
              placeholder="e.g. 7 AM: Revision of English Error Spotting 100 Rules"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#181926] border border-[#D8D8CF] dark:border-[#28293D] text-xs font-medium text-[#11120F] dark:text-white placeholder-[#85877E] focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] shadow-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#D8D8CF] dark:border-[#28293D] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-[#EEEEE8] dark:bg-[#1E1F2E] text-[#65675F] dark:text-[#A1A1B2] text-xs font-bold hover:bg-[#E2E2D8] transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="submit"
              className="group relative px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Log Night Reflection (+30 XP)</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
