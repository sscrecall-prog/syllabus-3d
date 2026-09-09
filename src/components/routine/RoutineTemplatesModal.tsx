import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  Moon,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Flame,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';
import { PROVEN_ROUTINE_TEMPLATES } from '../../data/routineTemplates';
import { RoutineTemplate, CATEGORY_CONFIG } from '../../types/routine';
import { formatSlotDuration, format12Hour } from '../../context/RoutineContext';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

interface RoutineTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (templateId: string) => void;
  currentSlotsCount: number;
}

export const RoutineTemplatesModal: React.FC<RoutineTemplatesModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
  currentSlotsCount
}) => {
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>('early_bird');
  const [confirmTemplate, setConfirmTemplate] = useState<RoutineTemplate | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmTemplate) {
          setConfirmTemplate(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, confirmTemplate, onClose]);

  if (!isOpen) return null;

  const handleSelectTemplate = (tpl: RoutineTemplate) => {
    soundManager.playClick();
    haptics.light();
    if (currentSlotsCount > 0) {
      setConfirmTemplate(tpl);
    } else {
      onApplyTemplate(tpl.id);
      onClose();
    }
  };

  const handleConfirmApply = () => {
    if (confirmTemplate) {
      onApplyTemplate(confirmTemplate.id);
      setConfirmTemplate(null);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[125] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto custom-scrollbar rounded-2xl sm:rounded-3xl bg-white dark:bg-[#12141F] border border-slate-200 dark:border-white/10 shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Proven Aspirant Routine Templates
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  5 Battle-Tested
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                1-Click apply verified daily timetables designed for maximum exam retention
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation Banner if slots exist */}
        {confirmTemplate ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-black font-black shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Replace current routine with "{confirmTemplate.name}"?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  You currently have {currentSlotsCount} slots saved. Applying this template will replace your current schedule with the {confirmTemplate.slots.length} pre-configured slots from this template.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-500/20">
              <button
                onClick={() => setConfirmTemplate(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white/10 cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmApply}
                className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-xs shadow-md shadow-amber-500/25 cursor-pointer active:scale-95"
              >
                Yes, Apply This Routine
              </button>
            </div>
          </div>
        ) : (
          /* Templates Cards List */
          <div className="space-y-3">
            {PROVEN_ROUTINE_TEMPLATES.map(tpl => {
              const isExpanded = expandedTemplateId === tpl.id;
              return (
                <div
                  key={tpl.id}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#161826] overflow-hidden transition-all hover:border-slate-300 dark:hover:border-white/20 shadow-xs"
                >
                  {/* Template Card Header */}
                  <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="text-2xl sm:text-3xl p-2 rounded-xl bg-white dark:bg-[#1F2236] border border-slate-200/80 dark:border-white/10 shrink-0 shadow-xs">
                        {tpl.icon}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                            {tpl.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                            {tpl.badge}
                          </span>
                        </div>

                        <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-1">
                          {tpl.tagline}
                        </p>

                        <div className="flex items-center gap-3 pt-1 text-[10px] sm:text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Clock className="w-3 h-3" />
                            <span>{tpl.totalStudyHours}h Study / day</span>
                          </span>
                          <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400">
                            <Moon className="w-3 h-3" />
                            <span>{tpl.totalSleepHours}h Sleep</span>
                          </span>
                          <span>• {tpl.slots.length} time blocks</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          setExpandedTemplateId(isExpanded ? null : tpl.id);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E2135] text-slate-700 dark:text-slate-300 hover:text-blue-600 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Hide Slots' : 'Preview Slots'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleSelectTemplate(tpl)}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Apply Routine</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Slots Preview */}
                  {isExpanded && (
                    <div className="px-3.5 sm:px-4 pb-4 pt-2 border-t border-slate-200/80 dark:border-white/10 space-y-2 bg-white/50 dark:bg-[#11131F]/50">
                      <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/30 text-[11px] text-blue-900 dark:text-blue-200">
                        <span className="font-bold">Target Aspirant: </span>
                        {tpl.targetAspirant}
                      </div>

                      <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                        {tpl.slots.map((slot, sIdx) => {
                          const cfg = CATEGORY_CONFIG[slot.category];
                          return (
                            <div
                              key={sIdx}
                              className="p-2.5 rounded-xl border border-slate-200/70 dark:border-white/5 bg-white dark:bg-[#1A1D2D] flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="font-mono font-bold text-slate-500 dark:text-slate-400 text-[11px] w-24 shrink-0">
                                  {slot.startTime} - {slot.endTime}
                                </span>

                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${cfg.badgeBg}`}>
                                  {cfg.icon} {cfg.label}
                                </span>

                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {slot.title}
                                </span>
                              </div>

                              <span className="font-mono text-[10px] font-semibold text-slate-400 shrink-0">
                                {formatSlotDuration(slot.startTime, slot.endTime)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};
