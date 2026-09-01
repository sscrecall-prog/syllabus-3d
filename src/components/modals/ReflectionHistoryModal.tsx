import React from 'react';
import {
  X,
  History,
  Trophy,
  Zap,
  Trash2,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useSyllabus } from '../../context/SyllabusContext';
import { DailyMood, DistractionCategory } from '../../types/syllabus';
import { soundManager } from '../../utils/soundEffects';

interface ReflectionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewReflection?: () => void;
}

export const ReflectionHistoryModal: React.FC<ReflectionHistoryModalProps> = ({
  isOpen,
  onClose,
  onOpenNewReflection
}) => {
  const { reflectionsHistory, deleteDailyReflection } = useSyllabus();

  if (!isOpen) return null;

  const getMoodBadge = (mood: DailyMood) => {
    switch (mood) {
      case 'fire':
        return { label: 'Unstoppable', emoji: '🔥', color: 'text-orange-400 bg-orange-500/15 border-orange-500/30' };
      case 'lightning':
        return { label: 'Productive', emoji: '⚡', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' };
      case 'happy':
        return { label: 'Moderate', emoji: '🙂', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
      case 'tired':
        return { label: 'Distracted', emoji: '🥱', color: 'text-sky-400 bg-sky-500/15 border-sky-500/30' };
      case 'stressed':
        return { label: 'Low Energy', emoji: '😴', color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' };
      default:
        return { label: 'Completed', emoji: '✨', color: 'text-purple-400 bg-purple-500/15 border-purple-500/30' };
    }
  };

  const getDistractionInfo = (reason: DistractionCategory) => {
    switch (reason) {
      case 'none':
        return { label: '100% Focused • Zero Traps', emoji: '🏆', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'social_media':
        return { label: 'Social Media / Reels', emoji: '📱', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
      case 'youtube':
        return { label: 'YouTube Rabbit Hole', emoji: '📺', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
      case 'overthinking':
        return { label: 'Overthinking / Anxiety', emoji: '🧠', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      case 'fatigue':
        return { label: 'Fatigue / Sleepiness', emoji: '🥱', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      default:
        return { label: 'Other Interruption', emoji: '⚠️', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md select-none animate-fade-in font-sans">
      <div
        className="relative w-full h-full sm:h-auto sm:max-h-[86vh] sm:max-w-2xl sm:rounded-3xl bg-[#0F101A] border-0 sm:border border-[#2B2E42] shadow-2xl overflow-hidden flex flex-col text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header - Compact & Clean */}
        <div className="p-4 sm:p-5 bg-gradient-to-br from-[#1B1D30] via-[#131422] to-[#0A0B12] text-white border-b border-[#282B3E] flex items-center justify-between gap-3 shrink-0 relative overflow-hidden pt-safe">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 border border-white/20 text-white flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)] shrink-0">
              <History className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-200 border border-purple-400/40">
                  JOURNAL LOG
                </span>
                <span className="text-[10px] font-mono font-bold text-[#A1A1B2] bg-white/5 px-1.5 py-0.2 rounded border border-white/10">
                  {reflectionsHistory.length} Days
                </span>
              </div>
              <h3 className="text-xs sm:text-base font-black font-serif uppercase tracking-tight text-white mt-0.5 truncate drop-shadow-sm">
                Night Reflections History
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="relative z-10 p-1.5 sm:p-2 rounded-xl text-[#A1A1B2] hover:text-white hover:bg-white/10 border border-white/10 transition-all cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Timeline Log List */}
        <div className="p-3 sm:p-5 overflow-y-auto custom-scrollbar space-y-3 flex-1 bg-[#0F101A]">
          {reflectionsHistory.length === 0 ? (
            <div className="py-12 text-center space-y-3 px-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-white">No reflections logged yet</h4>
                <p className="text-[11px] sm:text-xs text-[#8E90A6] max-w-sm mx-auto leading-relaxed">
                  Take 1 minute every night to log your wins, eliminate distractions, and build unbreakable consistency!
                </p>
              </div>

              {onOpenNewReflection && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNewReflection();
                  }}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5 border border-white/20"
                >
                  <span>Log Tonight's Reflection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            reflectionsHistory.map(refl => {
              const moodMeta = getMoodBadge(refl.mood);
              const distMeta = getDistractionInfo(refl.distractionReason);

              return (
                <div
                  key={refl.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-[#161726] border border-[#2B2E42] shadow-sm space-y-2.5 hover:border-purple-500/40 transition-colors group"
                >
                  {/* Card Header Row: Date + Mood + Targets + Delete Button */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#242738]">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <div className="flex items-center gap-1 text-purple-400 shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[11px] sm:text-xs font-bold font-mono text-white">
                          {refl.date}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 shrink-0 ${moodMeta.color}`}>
                        <span>{moodMeta.emoji}</span>
                        <span>{moodMeta.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] sm:text-[11px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/25">
                        {refl.targetsCompletedCount}/3 Targets
                      </span>

                      {/* Delete Button - Directly touchable on mobile */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete reflection for ${refl.date}?`)) {
                            deleteDailyReflection(refl.id);
                            soundManager.playClick();
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-400/80 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 transition-all cursor-pointer shrink-0 active:scale-95"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 2 Core Points (Daily Win & Tomorrow Goal) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Biggest Win */}
                    <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                      <span className="text-[9px] sm:text-[10px] font-black text-emerald-400 uppercase font-mono tracking-wider flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        <span>Daily Win:</span>
                      </span>
                      <p className="text-white font-semibold text-xs leading-snug break-words">
                        {refl.biggestWin}
                      </p>
                    </div>

                    {/* Tomorrow's Goal */}
                    <div className="p-2.5 sm:p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                      <span className="text-[9px] sm:text-[10px] font-black text-purple-400 uppercase font-mono tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>Tomorrow's #1 Goal:</span>
                      </span>
                      <p className="text-white font-semibold text-xs leading-snug break-words">
                        {refl.tomorrowPriority}
                      </p>
                    </div>
                  </div>

                  {/* Focus Check / Distraction Pill */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-[11px] font-mono pt-0.5">
                    <span className="text-[#8E90A6] font-bold shrink-0">Focus Check:</span>
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] flex items-center gap-1 ${distMeta.color}`}>
                      <span>{distMeta.emoji}</span>
                      <span className="font-semibold">{distMeta.label}</span>
                    </span>
                    {refl.distractionNote && (
                      <span className="text-[#A1A1B2] italic text-[10px] break-words">
                        "{refl.distractionNote}"
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-[#12131F] border-t border-[#282B3E] flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] sm:text-xs text-[#8E90A6] font-mono truncate">
            {reflectionsHistory.length} entries saved
          </span>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenNewReflection && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewReflection();
                }}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer border border-white/20"
              >
                + New
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer border border-white/10"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
