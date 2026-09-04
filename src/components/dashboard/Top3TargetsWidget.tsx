import React, { useState } from 'react';
import {
  Target,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Sparkles,
  Flame,
  Moon,
  History,
  BookOpen,
  Edit2,
  Check,
  X,
  ChevronDown,
  Search,
  Zap
} from 'lucide-react';
import { useSyllabus } from '../../context/SyllabusContext';
import { DailyReflectionModal } from '../modals/DailyReflectionModal';
import { ReflectionHistoryModal } from '../modals/ReflectionHistoryModal';
import { soundManager } from '../../utils/soundEffects';

interface Top3TargetsWidgetProps {
  onNavigateToTopic?: (topicId: string) => void;
}

export const Top3TargetsWidget: React.FC<Top3TargetsWidgetProps> = ({ onNavigateToTopic }) => {
  const {
    top3Targets,
    updateTop3Target,
    toggleTop3Target,
    clearTop3Target,
    allTopics,
    reflectionsHistory
  } = useSyllabus();

  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [isPickerOpen, setIsPickerOpen] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState<string>('');

  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  const filledTargets = top3Targets.filter(t => t.text.trim());
  const completedTargets = filledTargets.filter(t => t.completed);
  const completionPercentage = filledTargets.length > 0
    ? Math.round((completedTargets.length / 3) * 100)
    : 0;

  const handleStartEdit = (targetId: string, currentText: string) => {
    setEditingTargetId(targetId);
    setEditText(currentText);
    setIsPickerOpen(null);
  };

  const handleSaveEdit = (targetId: string) => {
    if (editText.trim()) {
      updateTop3Target(targetId, editText.trim());
    }
    setEditingTargetId(null);
    setEditText('');
    soundManager.playClick();
  };

  const handleSelectTopicFromSyllabus = (targetId: string, topicObj: { topic: { id: string; name: string }; subjectName: string; subjectColor: string }) => {
    updateTop3Target(targetId, topicObj.topic.name, {
      topicId: topicObj.topic.id,
      subjectName: topicObj.subjectName,
      subjectColor: topicObj.subjectColor
    });
    setIsPickerOpen(null);
    setEditingTargetId(null);
    setPickerSearch('');
    soundManager.playClick();
  };

  const targetSlotMeta = [
    {
      num: '01',
      title: 'Top Non-Negotiable Target',
      badge: 'Primary Priority',
      badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25',
      accentGlow: 'hover:border-amber-500/40'
    },
    {
      num: '02',
      title: 'Core Practice & Problem Sprint',
      badge: 'Deep Practice',
      badgeClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25',
      accentGlow: 'hover:border-sky-500/40'
    },
    {
      num: '03',
      title: 'Revision or Supporting Milestone',
      badge: 'Speed Drill',
      badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25',
      accentGlow: 'hover:border-purple-500/40'
    }
  ];

  const filteredTopics = allTopics.filter(t => {
    if (!pickerSearch.trim()) return true;
    const q = pickerSearch.toLowerCase();
    return (
      t.topic.name.toLowerCase().includes(q) ||
      t.subjectName.toLowerCase().includes(q) ||
      t.chapterName.toLowerCase().includes(q)
    );
  }).slice(0, 15);

  return (
    <>
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#151620] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-4 relative overflow-hidden select-none">
        
        {/* Subtle Ambient Background Gradient */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/[0.03] dark:bg-amber-500/[0.04] rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Quick Actions */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#EEEEE8] dark:border-[#242533]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Target className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] sm:text-base font-black text-[#11120F] dark:text-[#F5F5F7] tracking-tight uppercase">
                  Top 3 Non-Negotiable Targets
                </h3>
                {completedTargets.length === 3 ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
                    🏆 3/3 CRUSHED!
                  </span>
                ) : completedTargets.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                    ⚡ {completedTargets.length}/3 DONE
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Action Pills */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            <button
              onClick={() => {
                soundManager.playClick();
                setIsHistoryModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-[#1E1F2A] hover:bg-[#F1F5F9] dark:hover:bg-[#282938] text-[#65675F] dark:text-[#CBD5E1] border border-[#E2E8F0] dark:border-[#2E3044] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 tap-bounce"
              title="View past reflection journal"
            >
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span>History</span>
              {reflectionsHistory.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  {reflectionsHistory.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setIsReflectionModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <Moon className="w-3.5 h-3.5 text-amber-300" />
              <span>1-Min Journal</span>
            </button>
          </div>
        </div>

        {/* 3 Non-Negotiable Slots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 relative z-10">
          {top3Targets.map((target, idx) => {
            const meta = targetSlotMeta[idx] || {
              num: `0${idx + 1}`,
              title: `Target #${idx + 1}`,
              badge: 'Sprint Target',
              badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
              accentGlow: 'hover:border-amber-500/40'
            };
            const isEditing = editingTargetId === target.id;
            const isPicker = isPickerOpen === target.id;
            const hasText = Boolean(target.text.trim());

            return (
              <div
                key={target.id}
                className={`p-4 rounded-2xl sm:rounded-3xl border transition-all duration-200 relative flex flex-col justify-between space-y-3.5 group ${
                  target.completed
                    ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] border-emerald-500/35 shadow-[0_2px_15px_rgba(16,185,129,0.1)]'
                    : hasText
                    ? `bg-[#F8FAFC] dark:bg-[#1A1C28] border-[#E2E8F0] dark:border-[#2A2D40] shadow-xs ${meta.accentGlow}`
                    : 'bg-[#F8FAFC]/50 dark:bg-[#151620] border-dashed border-[#E2E8F0] dark:border-[#282938] hover:border-amber-500/40'
                }`}
              >
                {/* Slot Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-black border ${meta.badgeClass}`}>
                      #{meta.num}
                    </span>
                    <span className="text-xs font-bold text-[#11120F] dark:text-[#E2E4F0] truncate">
                      {meta.title}
                    </span>
                  </div>

                  {hasText && (
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(target.id, target.text)}
                        className="p-1.5 rounded-lg text-[#85877E] hover:text-[#11120F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
                        title="Edit target name"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => clearTop3Target(target.id)}
                        className="p-1.5 rounded-lg text-[#85877E] hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Clear slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Slot Body: Active Target Text OR Empty Input State */}
                <div className="min-h-[56px] flex flex-col justify-center">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit(target.id);
                          if (e.key === 'Escape') setEditingTargetId(null);
                        }}
                        placeholder="Enter target name..."
                        className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#12131C] border border-amber-500 text-xs font-bold text-[#11120F] dark:text-white focus:outline-none shadow-xs"
                      />
                      <button
                        onClick={() => handleSaveEdit(target.id)}
                        className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold cursor-pointer transition-all shadow-xs active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <button
                        onClick={() => setEditingTargetId(null)}
                        className="p-2 rounded-xl bg-[#EEEEE8] dark:bg-[#28293D] text-[#85877E] hover:text-[#11120F] dark:hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : hasText ? (
                    <div
                      onClick={() => toggleTop3Target(target.id)}
                      className="flex items-start gap-3 cursor-pointer select-none"
                    >
                      {/* Tactile Squircle Checkbox */}
                      <button
                        type="button"
                        className={`mt-0.5 w-6 h-6 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90 ${
                          target.completed
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500/20'
                            : 'border-2 border-[#85877E]/50 dark:border-[#4B4E63] group-hover:border-amber-500 dark:group-hover:border-amber-400 bg-white/50 dark:bg-black/20'
                        }`}
                      >
                        {target.completed && <Check className="w-3.5 h-3.5 stroke-[3.2]" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[13px] sm:text-sm font-bold leading-snug transition-colors ${
                            target.completed
                              ? 'line-through text-[#85877E] dark:text-[#686B80]'
                              : 'text-[#11120F] dark:text-[#F5F5F7] group-hover:text-amber-600 dark:group-hover:text-amber-400'
                          }`}
                        >
                          {target.text}
                        </p>
                        {target.subjectName && (
                          <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-lg bg-white dark:bg-[#242533] border border-[#E2E8F0] dark:border-[#323448] text-[11px] font-mono font-bold text-[#191A17] dark:text-[#CBD5E1]">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: target.subjectColor || '#2563EB' }}
                            />
                            <span className="truncate max-w-[140px]">{target.subjectName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Empty Slot CTA */
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(target.id, '')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-[#202130] hover:bg-[#F8FAFC] dark:hover:bg-[#27283A] text-[#11120F] dark:text-[#E2E4F0] border border-[#E2E8F0] dark:border-[#2C2E42] text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs tap-bounce"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Custom Goal</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsPickerOpen(isPicker ? null : target.id);
                            setPickerSearch('');
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95 tap-bounce"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>From Syllabus</span>
                        </button>
                      </div>

                      {/* Dropdown Topic Picker */}
                      {isPicker && (
                        <div className="p-3 rounded-2xl bg-white dark:bg-[#12131C] border border-[#E2E8F0] dark:border-[#28293D] shadow-2xl space-y-2 mt-1 z-30 animate-fade-in">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-[#85877E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Search syllabus topics..."
                              value={pickerSearch}
                              onChange={e => setPickerSearch(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-[#1A1B28] border border-[#E2E8F0] dark:border-[#28293D] text-xs font-medium text-[#11120F] dark:text-white placeholder-[#85877E] focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="max-h-44 overflow-y-auto space-y-1 custom-scrollbar">
                            {filteredTopics.length === 0 ? (
                              <p className="text-center py-4 text-xs text-[#85877E]">No matching topics found</p>
                            ) : (
                              filteredTopics.map(t => (
                                <div
                                  key={t.topic.id}
                                  onClick={() => handleSelectTopicFromSyllabus(target.id, t)}
                                  className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer flex items-center justify-between text-xs transition-colors"
                                >
                                  <span className="font-bold text-[#11120F] dark:text-white truncate">
                                    {t.topic.name}
                                  </span>
                                  <span
                                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded text-white shrink-0 ml-1.5 shadow-2xs"
                                    style={{ backgroundColor: t.subjectColor }}
                                  >
                                    {t.subjectName}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress Status Line */}
                <div className="pt-2.5 border-t border-[#EEEEE8] dark:border-[#242533] flex items-center justify-between text-xs font-mono">
                  <span className="text-[11px] text-[#85877E] dark:text-[#787C99]">Status:</span>
                  {target.completed ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                      <span>Crushed & Done</span>
                    </span>
                  ) : hasText ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      <Zap className="w-3 h-3 fill-current" />
                      <span>In Progress</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#85877E] dark:text-[#787C99] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                      <Circle className="w-2.5 h-2.5" />
                      <span>Slot Ready</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Velocity Sprint Meter */}
        <div className="p-4 rounded-2xl sm:rounded-3xl bg-[#F8FAFC] dark:bg-[#1A1B26] border border-[#E2E8F0] dark:border-[#272730] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-[11px] font-mono font-bold text-[#65675F] dark:text-[#A1A1B2] uppercase tracking-wider shrink-0">
              Sprint Velocity:
            </span>
            <div className="flex-1 sm:w-44 h-2.5 rounded-full bg-[#E2E8F0] dark:bg-[#282A3A] overflow-hidden p-0.5 border border-[#E2E8F0]/50 dark:border-[#383A4E]/50">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 rounded-full transition-all duration-500 shadow-sm"
                style={{
                  width: `${completionPercentage}%`,
                  boxShadow: completionPercentage > 0 ? '0 0 10px rgba(245,158,11,0.5)' : 'none'
                }}
              />
            </div>
            <span className="font-mono font-black text-xs text-[#11120F] dark:text-white tabular-nums shrink-0">
              {completedTargets.length}/3 Done ({completionPercentage}%)
            </span>
          </div>

          <p className="text-[11px] font-medium text-[#65675F] dark:text-[#94A3B8] text-center sm:text-right">
            {completedTargets.length === 3
              ? '🎉 Outstanding work! All 3 non-negotiables crushed.'
              : completedTargets.length === 2
              ? '🔥 2 crushed! Just 1 more to complete your non-negotiables.'
              : completedTargets.length === 1
              ? '🎯 1 done! Momentum is building.'
              : '⚡ Finish these 3 core targets before checking off minor tasks.'}
          </p>
        </div>

      </div>

      {/* Daily Reflection Modal */}
      {isReflectionModalOpen && (
        <DailyReflectionModal
          isOpen={isReflectionModalOpen}
          onClose={() => setIsReflectionModalOpen(false)}
          onOpenHistory={() => setIsHistoryModalOpen(true)}
        />
      )}

      {/* Reflection History Modal */}
      {isHistoryModalOpen && (
        <ReflectionHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          onOpenNewReflection={() => setIsReflectionModalOpen(true)}
        />
      )}
    </>
  );
};

