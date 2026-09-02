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
  ChevronDown
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

  const targetSlotLabels = [
    { num: '01', title: 'Top Non-Negotiable Target', subtitle: 'Highest priority — must crush first' },
    { num: '02', title: 'Core Practice & Problem Sprint', subtitle: 'Deep work & active problem solving' },
    { num: '03', title: 'Revision or Supporting Milestone', subtitle: 'Vocab, formulas, or sectional mock' }
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
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-4.5 relative overflow-hidden select-none">
        
        {/* Top Header & Progress Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EEEEE8] dark:border-[#242533]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <Target className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-[#11120F] dark:text-[#F5F5F7] font-serif uppercase tracking-tight">
                  Top 3 Non-Negotiable Targets
                </h3>
                {completedTargets.length === 3 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
                    🔥 3/3 CRUSHED!
                  </span>
                )}
              </div>
              <p className="text-xs text-[#65675F] dark:text-[#A9B1D6]">
                Rule of 3: Focus only on what moves the needle today.
              </p>
            </div>
          </div>

          {/* Quick Actions (Night Reflection & History Journal) */}
          <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            <button
              onClick={() => {
                soundManager.playClick();
                setIsHistoryModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] hover:bg-[#EEEEE8] dark:hover:bg-[#2A2A36] text-[#65675F] dark:text-[#C0CAF5] border border-[#D8D8CF] dark:border-[#272730] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title="View past reflection journal"
            >
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span>History</span>
              {reflectionsHistory.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[11px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  {reflectionsHistory.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setIsReflectionModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Moon className="w-3.5 h-3.5 text-amber-300" />
              <span>1-Min Reflection</span>
            </button>
          </div>
        </div>

        {/* 3 Non-Negotiable Slots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {top3Targets.map((target, idx) => {
            const meta = targetSlotLabels[idx] || { num: `0${idx + 1}`, title: `Target #${idx + 1}`, subtitle: '' };
            const isEditing = editingTargetId === target.id;
            const isPicker = isPickerOpen === target.id;
            const hasText = Boolean(target.text.trim());

            return (
              <div
                key={target.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all relative flex flex-col justify-between space-y-3 ${
                  target.completed
                    ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30'
                    : hasText
                    ? 'bg-[#F7F6F0]/60 dark:bg-[#1E1F2A] border-[#D8D8CF] dark:border-[#2A2B3D] hover:border-amber-500/40'
                    : 'bg-white dark:bg-[#181926] border-dashed border-[#D8D8CF] dark:border-[#28293D]'
                }`}
              >
                {/* Slot Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      #{meta.num}
                    </span>
                    <span className="text-[11px] font-bold text-[#65675F] dark:text-[#A1A1B2] truncate">
                      {meta.title}
                    </span>
                  </div>

                  {hasText && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(target.id, target.text)}
                        className="p-1 rounded-lg text-[#85877E] hover:text-[#11120F] dark:hover:text-white transition-colors cursor-pointer"
                        title="Edit target"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => clearTop3Target(target.id)}
                        className="p-1 rounded-lg text-[#85877E] hover:text-rose-500 transition-colors cursor-pointer"
                        title="Clear slot"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Slot Body (Active Target Text OR Empty Input State) */}
                <div className="min-h-[48px] flex flex-col justify-center">
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
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#12131C] border border-amber-500 text-xs font-bold text-[#11120F] dark:text-white focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveEdit(target.id)}
                        className="p-1.5 rounded-xl bg-amber-500 text-black cursor-pointer hover:bg-amber-400"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingTargetId(null)}
                        className="p-1.5 rounded-xl bg-[#EEEEE8] dark:bg-[#28293D] text-[#85877E] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : hasText ? (
                    <div
                      onClick={() => toggleTop3Target(target.id)}
                      className="flex items-start gap-2.5 cursor-pointer group"
                    >
                      <button
                        type="button"
                        className="mt-0.5 shrink-0 transition-transform active:scale-90"
                      >
                        {target.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#85877E] group-hover:text-amber-500" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs font-bold leading-snug transition-colors ${
                            target.completed
                              ? 'line-through text-[#85877E] dark:text-[#65677A]'
                              : 'text-[#11120F] dark:text-[#F5F5F7] group-hover:text-amber-600 dark:group-hover:text-amber-400'
                          }`}
                        >
                          {target.text}
                        </p>
                        {target.subjectName && (
                          <span
                            className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-mono font-extrabold text-white"
                            style={{ backgroundColor: target.subjectColor || '#596B35' }}
                          >
                            {target.subjectName}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Empty Slot Picker CTA */
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(target.id, '')}
                          className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-[#EEEEE8] dark:bg-[#222332] hover:bg-[#E2E2D8] dark:hover:bg-[#2B2C3E] text-[#11120F] dark:text-[#E2E4F0] text-[11px] font-bold transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Custom Goal</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsPickerOpen(isPicker ? null : target.id);
                            setPickerSearch('');
                          }}
                          className="flex items-center gap-1 py-2 px-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] font-bold transition-all cursor-pointer"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Pick Syllabus Topic</span>
                        </button>
                      </div>

                      {/* Dropdown Topic Picker */}
                      {isPicker && (
                        <div className="p-2.5 rounded-2xl bg-white dark:bg-[#12131C] border border-[#D8D8CF] dark:border-[#28293D] shadow-xl space-y-2 mt-1 z-20">
                          <input
                            type="text"
                            placeholder="Search syllabus topic..."
                            value={pickerSearch}
                            onChange={e => setPickerSearch(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1A1B28] border border-[#D8D8CF] dark:border-[#28293D] text-[11px] text-[#11120F] dark:text-white placeholder-[#85877E] focus:outline-none"
                          />
                          <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                            {filteredTopics.map(t => (
                              <div
                                key={t.topic.id}
                                onClick={() => handleSelectTopicFromSyllabus(target.id, t)}
                                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer flex items-center justify-between text-[11px]"
                              >
                                <span className="font-bold text-[#11120F] dark:text-white truncate">
                                  {t.topic.name}
                                </span>
                                <span
                                  className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded text-white shrink-0 ml-1"
                                  style={{ backgroundColor: t.subjectColor }}
                                >
                                  {t.subjectName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress Mini Status */}
                <div className="pt-2 border-t border-[#EEEEE8] dark:border-[#242533] flex items-center justify-between text-[11px] font-mono text-[#85877E]">
                  <span>Status:</span>
                  <span className={target.completed ? 'text-emerald-500 font-bold' : hasText ? 'text-amber-500 font-medium' : 'text-[#85877E]'}>
                    {target.completed ? 'Done ✅' : hasText ? 'In Progress ⏳' : 'Not Set'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Velocity Strip */}
        <div className="p-3 rounded-2xl bg-[#F7F6F0] dark:bg-[#1E1F2A] border border-[#D8D8CF] dark:border-[#272730] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-mono font-bold text-[#65675F] dark:text-[#A1A1B2]">
              Non-Negotiable Completion:
            </span>
            <div className="w-32 h-2 rounded-full bg-[#D8D8CF] dark:bg-[#2A2B3E] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className="font-mono font-black text-[#11120F] dark:text-white">
              {completedTargets.length}/3 Done ({completionPercentage}%)
            </span>
          </div>

          <p className="text-[11px] text-[#85877E] italic text-center sm:text-right">
            {completedTargets.length === 3
              ? '🎉 Outstanding work! All 3 non-negotiables crushed.'
              : '⚡ Finish these 3 tasks before checking off minor items.'}
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

