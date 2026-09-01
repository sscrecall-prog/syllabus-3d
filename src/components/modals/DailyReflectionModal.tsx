import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  Moon,
  Flame,
  Zap,
  Smile,
  Coffee,
  BatteryLow,
  Trophy,
  History,
  ArrowRight,
  Target,
  ShieldAlert,
  Sunrise,
  CheckCircle2
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

  const moodOptions: Array<{
    id: DailyMood;
    label: string;
    shortLabel: string;
    emoji: string;
    icon: any;
    color: string;
    activeBg: string;
    inactiveBg: string;
  }> = [
    {
      id: 'fire',
      label: 'Unstoppable',
      shortLabel: 'Fire',
      emoji: '🔥',
      icon: Flame,
      color: 'text-orange-400 border-orange-500/40',
      activeBg: 'bg-orange-500/25 border-orange-400 shadow-[0_0_18px_rgba(249,115,22,0.4)] text-orange-300',
      inactiveBg: 'bg-[#161726] border-[#2B2E42] text-orange-400/80 hover:bg-orange-500/10'
    },
    {
      id: 'lightning',
      label: 'Productive',
      shortLabel: 'Great',
      emoji: '⚡',
      icon: Zap,
      color: 'text-amber-400 border-amber-500/40',
      activeBg: 'bg-amber-500/25 border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.4)] text-amber-300',
      inactiveBg: 'bg-[#161726] border-[#2B2E42] text-amber-400/80 hover:bg-amber-500/10'
    },
    {
      id: 'happy',
      label: 'Moderate',
      shortLabel: 'Good',
      emoji: '🙂',
      icon: Smile,
      color: 'text-emerald-400 border-emerald-500/40',
      activeBg: 'bg-emerald-500/25 border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.4)] text-emerald-300',
      inactiveBg: 'bg-[#161726] border-[#2B2E42] text-emerald-400/80 hover:bg-emerald-500/10'
    },
    {
      id: 'tired',
      label: 'Distracted',
      shortLabel: 'Lost',
      emoji: '🥱',
      icon: Coffee,
      color: 'text-sky-400 border-sky-500/40',
      activeBg: 'bg-sky-500/25 border-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.4)] text-sky-300',
      inactiveBg: 'bg-[#161726] border-[#2B2E42] text-sky-400/80 hover:bg-sky-500/10'
    },
    {
      id: 'stressed',
      label: 'Low Energy',
      shortLabel: 'Low',
      emoji: '😴',
      icon: BatteryLow,
      color: 'text-rose-400 border-rose-500/40',
      activeBg: 'bg-rose-500/25 border-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.4)] text-rose-300',
      inactiveBg: 'bg-[#161726] border-[#2B2E42] text-rose-400/80 hover:bg-rose-500/10'
    }
  ];

  const distractionPills: Array<{
    id: DistractionCategory;
    label: string;
    shortLabel: string;
    emoji: string;
    activeStyle: string;
    inactiveStyle: string;
  }> = [
    {
      id: 'none',
      label: 'None - 100% Focused 🏆',
      shortLabel: '100% Focused',
      emoji: '🏆',
      activeStyle: 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-bold',
      inactiveStyle: 'bg-[#161726] border-[#2B2E42] text-emerald-400/80 hover:bg-emerald-500/10'
    },
    {
      id: 'social_media',
      label: 'Social Media / Reels 📱',
      shortLabel: 'Social Media',
      emoji: '📱',
      activeStyle: 'bg-rose-500/25 border-rose-400 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)] font-bold',
      inactiveStyle: 'bg-[#161726] border-[#2B2E42] text-[#C2C5D6] hover:bg-rose-500/10 hover:text-rose-300'
    },
    {
      id: 'youtube',
      label: 'YouTube Rabbit Hole 📺',
      shortLabel: 'YouTube Trap',
      emoji: '📺',
      activeStyle: 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-bold',
      inactiveStyle: 'bg-[#161726] border-[#2B2E42] text-[#C2C5D6] hover:bg-cyan-500/10 hover:text-cyan-300'
    },
    {
      id: 'overthinking',
      label: 'Overthinking / Anxiety 🧠',
      shortLabel: 'Overthinking',
      emoji: '🧠',
      activeStyle: 'bg-purple-500/25 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)] font-bold',
      inactiveStyle: 'bg-[#161726] border-[#2B2E42] text-[#C2C5D6] hover:bg-purple-500/10 hover:text-purple-300'
    },
    {
      id: 'fatigue',
      label: 'Sleepiness / Low Energy 🥱',
      shortLabel: 'Sleepiness',
      emoji: '🥱',
      activeStyle: 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] font-bold',
      inactiveStyle: 'bg-[#161726] border-[#2B2E42] text-amber-400/90 hover:bg-amber-500/10 hover:text-amber-300'
    },
    {
      id: 'other',
      label: 'Other Interruption ⚠️',
      shortLabel: 'Other Interruption',
      emoji: '⚠️',
      activeStyle: 'bg-indigo-500/25 border-indigo-400 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)] font-bold',
      inactiveStyle: 'bg-[#161726] border-[#2B2E42] text-[#C2C5D6] hover:bg-indigo-500/10 hover:text-indigo-300'
    }
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none animate-fade-in font-sans"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] bg-[#0F101A] border border-[#2B2E42] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col text-white my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Glowing Header Banner - Compact & Responsive */}
        <div className="relative p-4 sm:p-5 bg-gradient-to-br from-[#1B1D30] via-[#131422] to-[#0A0B12] text-white border-b border-[#282B3E] overflow-hidden shrink-0">
          {/* Ambient Glow Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 border border-white/20 text-white flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)] shrink-0">
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-200 border border-purple-400/40">
                    DAY-END REFLECTION
                  </span>
                  <span className="text-[9px] font-mono font-bold text-[#A1A1B2] bg-white/5 px-1.5 py-0.2 rounded border border-white/10">
                    {todayKey}
                  </span>
                </div>
                <h3 className="text-xs sm:text-base font-black font-serif uppercase tracking-tight text-white mt-0.5 truncate drop-shadow-sm">
                  1-Minute Night Study Journal
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {onOpenHistory && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenHistory();
                  }}
                  className="p-1.5 sm:p-2 rounded-xl text-[#A1A1B2] hover:text-white hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                  title="View Reflection History"
                >
                  <History className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl text-[#A1A1B2] hover:text-white hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Today's Target Stats Pill Strip */}
          <div className="relative z-10 flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-white/10 text-[10px] sm:text-xs font-mono">
            <div className="flex items-center gap-1.5 text-[#D1D5E8]">
              <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Top 3 Targets:</span>
            </div>
            <span className="font-extrabold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30 shrink-0 text-[10px]">
              {completedTargetsCount} / {Math.max(3, totalTargetsCount)} Done
            </span>
          </div>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar bg-[#0F101A] flex-1">
          
          {/* 1. Daily Mood / Energy Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] sm:text-xs font-black uppercase font-mono tracking-wider text-purple-300 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 flex items-center justify-center text-[10px]">1</span>
                <span>Focus & Energy Today?</span>
              </label>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                {rating} / 5 Score
              </span>
            </div>

            {/* Responsive Mood Grid with Zero Text Overlapping */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {moodOptions.map(m => {
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
                    className={`py-2 px-1 sm:py-2.5 sm:px-2 rounded-xl sm:rounded-2xl border transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1 min-w-0 ${
                      isSelected
                        ? `${m.activeBg} scale-102 sm:scale-105 font-black`
                        : `${m.inactiveBg} opacity-90`
                    }`}
                  >
                    <span className="text-base sm:text-lg leading-none select-none">{m.emoji}</span>
                    <span className="text-[9px] sm:text-[10px] font-mono leading-none tracking-tight font-bold truncate max-w-full block">
                      {m.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Biggest Academic Win */}
          <div className="space-y-1.5">
            <label className="text-[11px] sm:text-xs font-black uppercase font-mono tracking-wider text-emerald-300 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center text-[10px]">2</span>
              <span>Today's Biggest Win?</span>
              <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={biggestWin}
                onChange={e => setBiggestWin(e.target.value)}
                placeholder="e.g. Completed 60 Geometry PYQs & full speed mock!"
                className="w-full pl-3.5 pr-9 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-[#161726] border border-[#2E3147] text-xs font-bold text-white placeholder-[#6E7187] focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 shadow-inner transition-all"
              />
              <Trophy className="w-4 h-4 text-emerald-400/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 3. Primary Distraction / Trap */}
          <div className="space-y-1.5">
            <label className="text-[11px] sm:text-xs font-black uppercase font-mono tracking-wider text-rose-300 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 flex items-center justify-center text-[10px]">3</span>
              <span>Where did you lose focus?</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {distractionPills.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setDistraction(d.id);
                    soundManager.playClick();
                  }}
                  className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-[11px] sm:text-xs border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 min-w-0 ${
                    distraction === d.id ? d.activeStyle : d.inactiveStyle
                  }`}
                >
                  <span className="truncate font-semibold flex items-center gap-1.5">
                    <span>{d.emoji}</span>
                    <span>{d.shortLabel}</span>
                  </span>
                  {distraction === d.id && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-current" />}
                </button>
              ))}
            </div>

            {distraction !== 'none' && (
              <input
                type="text"
                value={distractionNote}
                onChange={e => setDistractionNote(e.target.value)}
                placeholder="Optional: Why did this happen & how to prevent it?"
                className="w-full px-3.5 py-2 rounded-xl bg-[#161726] border border-rose-500/40 text-xs text-white placeholder-[#6E7187] focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 mt-1 transition-all"
              />
            )}
          </div>

          {/* 4. Tomorrow Morning's #1 Priority */}
          <div className="space-y-1.5">
            <label className="text-[11px] sm:text-xs font-black uppercase font-mono tracking-wider text-amber-300 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center text-[10px]">4</span>
              <span>Tomorrow's #1 Wake-Up Goal?</span>
              <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={tomorrowPriority}
                onChange={e => setTomorrowPriority(e.target.value)}
                placeholder="e.g. 7 AM: Revision of English 100 Rules"
                className="w-full pl-3.5 pr-9 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-[#161726] border border-[#2E3147] text-xs font-bold text-white placeholder-[#6E7187] focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 shadow-inner transition-all"
              />
              <Sunrise className="w-4 h-4 text-amber-400/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 sm:pt-4 border-t border-[#242738] flex items-center justify-between gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 text-[#A1A1B2] hover:text-white text-xs font-bold border border-white/10 transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="submit"
              className="group relative px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 sm:gap-2 overflow-hidden border border-white/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span>Log Reflection (+30 XP)</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
