import React from 'react';
import {
  X,
  History,
  Trophy,
  Flame,
  Zap,
  Smile,
  Coffee,
  BatteryLow,
  Trash2,
  Calendar,
  AlertCircle,
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
        return { label: 'Unstoppable 🔥', color: 'text-orange-500 bg-orange-500/10 border-orange-500/30' };
      case 'lightning':
        return { label: 'Productive ⚡', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' };
      case 'happy':
        return { label: 'Moderate 🙂', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' };
      case 'tired':
        return { label: 'Distracted 🥱', color: 'text-sky-500 bg-sky-500/10 border-sky-500/30' };
      case 'stressed':
        return { label: 'Low Energy 😴', color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' };
      default:
        return { label: 'Completed ✨', color: 'text-purple-500 bg-purple-500/10 border-purple-500/30' };
    }
  };

  const getDistractionLabel = (reason: DistractionCategory) => {
    switch (reason) {
      case 'none':
        return '🏆 100% Focused / Zero Distractions';
      case 'social_media':
        return '📵 Social Media / Reels';
      case 'youtube':
        return '⏳ YouTube Rabbit Hole';
      case 'overthinking':
        return '💭 Overthinking / Anxiety';
      case 'fatigue':
        return '⚡ Fatigue / Sleepiness';
      default:
        return '⚠️ Other Distraction';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in select-none">
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-[#FAF9F5] dark:bg-[#12131C] border border-[#D8D8CF] dark:border-[#28293D] shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-[#1A1B28] via-[#12131F] to-[#0A0B12] text-white border-b border-[#28293D] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shadow-lg">
              <History className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Journal History
                </span>
                <span className="text-[10px] font-mono text-[#A1A1B2]">{reflectionsHistory.length} Days Logged</span>
              </div>
              <h3 className="text-base sm:text-lg font-black font-serif uppercase tracking-tight text-white mt-0.5">
                Night Study Reflections Log
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#A1A1B2] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Log List */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-3.5 flex-1">
          {reflectionsHistory.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#11120F] dark:text-white">No reflections logged yet</h4>
                <p className="text-xs text-[#85877E] max-w-sm mx-auto">
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
                  className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Log Tonight's Reflection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            reflectionsHistory.map(refl => {
              const moodMeta = getMoodBadge(refl.mood);
              return (
                <div
                  key={refl.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181926] border border-[#D8D8CF] dark:border-[#28293D] shadow-xs space-y-3 hover:border-purple-500/40 transition-colors group"
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-2.5 border-b border-[#EEEEE8] dark:border-[#242538]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-xs font-bold font-mono text-[#11120F] dark:text-white">
                        {refl.date}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${moodMeta.color}`}>
                        {moodMeta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        {refl.targetsCompletedCount} / 3 Targets
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete reflection for ${refl.date}?`)) {
                            deleteDailyReflection(refl.id);
                            soundManager.playClick();
                          }
                        }}
                        className="p-1.5 rounded-lg text-[#85877E] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 2 Grid Points */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {/* Biggest Win */}
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono tracking-wider flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        <span>Daily Win:</span>
                      </span>
                      <p className="text-[#11120F] dark:text-[#E2E4F0] font-medium leading-snug">
                        {refl.biggestWin}
                      </p>
                    </div>

                    {/* Tomorrow's Goal */}
                    <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15 space-y-1">
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase font-mono tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>Tomorrow's #1 Priority:</span>
                      </span>
                      <p className="text-[#11120F] dark:text-[#E2E4F0] font-medium leading-snug">
                        {refl.tomorrowPriority}
                      </p>
                    </div>
                  </div>

                  {/* Distraction Note */}
                  <div className="text-[11px] font-mono text-[#65675F] dark:text-[#9A9CAE] flex items-center gap-1.5 pt-1">
                    <span className="font-bold text-[#85877E]">Focus Check:</span>
                    <span>{getDistractionLabel(refl.distractionReason)}</span>
                    {refl.distractionNote && (
                      <span className="italic text-[#85877E] truncate max-w-xs">
                        ({refl.distractionNote})
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-white dark:bg-[#181926] border-t border-[#D8D8CF] dark:border-[#28293D] flex items-center justify-between shrink-0">
          <span className="text-xs text-[#85877E] font-mono">
            {reflectionsHistory.length} total entries recorded
          </span>

          <div className="flex items-center gap-2">
            {onOpenNewReflection && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewReflection();
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                + New Reflection
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#EEEEE8] dark:bg-[#28293D] text-[#11120F] dark:text-white text-xs font-bold hover:bg-[#E2E2D8] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
