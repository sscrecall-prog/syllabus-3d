import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Clock,
  CheckCircle2,
  Tag,
  BookOpen,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  Flame,
  Zap,
  Sparkles
} from 'lucide-react';
import {
  RoutineSlot,
  RoutineSlotCategory,
  RoutineDay,
  ALL_ROUTINE_DAYS,
  WEEKDAYS,
  WEEKENDS,
  CATEGORY_CONFIG
} from '../../types/routine';
import { formatSlotDuration, timeToMinutes } from '../../context/RoutineContext';
import { useSyllabus } from '../../context/SyllabusContext';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

interface RoutineSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (slotData: Omit<RoutineSlot, 'id' | 'completedDates'>) => void;
  editingSlot?: RoutineSlot | null;
}

const CATEGORIES: RoutineSlotCategory[] = [
  'concept',
  'practice',
  'revision',
  'mock',
  'reading',
  'break',
  'sleep',
  'custom'
];

export const RoutineSlotModal: React.FC<RoutineSlotModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSlot
}) => {
  const { currentExam } = useSyllabus();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RoutineSlotCategory>('concept');
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('07:30');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<RoutineDay[]>(ALL_ROUTINE_DAYS);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [notes, setNotes] = useState('');
  const [checklists, setChecklists] = useState<string[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [validationError, setValidationError] = useState('');

  // Populate when editing
  useEffect(() => {
    if (editingSlot) {
      setTitle(editingSlot.title);
      setCategory(editingSlot.category);
      setStartTime(editingSlot.startTime);
      setEndTime(editingSlot.endTime);
      setSelectedSubjectId(editingSlot.subjectId || '');
      setSelectedDays(editingSlot.days || ALL_ROUTINE_DAYS);
      setPriority(editingSlot.priority || 'high');
      setNotes(editingSlot.notes || '');
      setChecklists(editingSlot.checklists || []);
    } else {
      // Default new slot
      setTitle('');
      setCategory('concept');
      setStartTime('06:00');
      setEndTime('07:30');
      setSelectedSubjectId(currentExam?.subjects[0]?.id || '');
      setSelectedDays(ALL_ROUTINE_DAYS);
      setPriority('high');
      setNotes('');
      setChecklists([]);
    }
    setValidationError('');
  }, [editingSlot, isOpen, currentExam]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Duration calculation
  const calculatedDuration = useMemo(() => {
    return formatSlotDuration(startTime, endTime);
  }, [startTime, endTime]);

  const toggleDay = (day: RoutineDay) => {
    soundManager.playClick();
    haptics.light();
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev; // At least one day
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  const handleAddChecklist = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newChecklistText.trim()) return;
    setChecklists(prev => [...prev, newChecklistText.trim()]);
    setNewChecklistText('');
    soundManager.playClick();
  };

  const handleRemoveChecklist = (idx: number) => {
    setChecklists(prev => prev.filter((_, i) => i !== idx));
    soundManager.playClick();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Please enter a title for this routine slot');
      return;
    }

    if (selectedDays.length === 0) {
      setValidationError('Please select at least one active day');
      return;
    }

    const matchedSubject = currentExam?.subjects.find(s => s.id === selectedSubjectId);

    onSave({
      title: title.trim(),
      category,
      startTime,
      endTime,
      subjectId: matchedSubject?.id,
      subjectName: matchedSubject?.name,
      subjectColor: matchedSubject?.color,
      days: selectedDays,
      priority,
      notes: notes.trim() || undefined,
      checklists: checklists.length > 0 ? checklists : undefined
    });

    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[125] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto custom-scrollbar rounded-2xl sm:rounded-3xl bg-white dark:bg-[#12141F] border border-slate-200 dark:border-white/10 shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {editingSlot ? 'Edit Routine Slot' : 'Create Routine Slot'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Design your daily study block with targets & timings
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

        {validationError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Slot Title */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
              Slot Title / Activity Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                setValidationError('');
              }}
              placeholder="e.g. Morning Quant Sprint, General Awareness, Speed Drills..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1A1D2D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Activity Category Grid */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
              Activity Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {CATEGORIES.map(cat => {
                const cfg = CATEGORY_CONFIG[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setCategory(cat);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? `${cfg.bgClass} ${cfg.borderClass} ${cfg.textClass} font-black shadow-xs ring-1 ring-blue-500/30`
                        : 'bg-slate-50 dark:bg-[#1A1D2D] border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <span className="text-base">{cfg.icon}</span>
                    <span className="text-[11px] font-bold truncate">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timing Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 items-end">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1A1D2D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono font-bold text-xs sm:text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1A1D2D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono font-bold text-xs sm:text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-center">
              <span className="text-[10px] uppercase font-mono font-bold text-blue-600 dark:text-blue-400 block">
                Duration
              </span>
              <span className="text-sm font-black text-blue-700 dark:text-blue-300 font-mono">
                {calculatedDuration}
              </span>
            </div>
          </div>

          {/* Associated Subject & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                Associated Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1A1D2D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="">None / General Routine</option>
                {currentExam?.subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['high', 'medium', 'low'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setPriority(p);
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer capitalize text-center ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 font-black'
                          : p === 'medium'
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-black'
                          : 'bg-slate-500/15 border-slate-500/40 text-slate-600 dark:text-slate-400 font-black'
                        : 'bg-slate-50 dark:bg-[#1A1D2D] border-slate-200/80 dark:border-white/10 text-slate-500'
                    }`}
                  >
                    {p === 'high' ? '🔥 High' : p === 'medium' ? '⚡ Med' : '🌱 Low'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Days Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                Active Days
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setSelectedDays(ALL_ROUTINE_DAYS);
                  }}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  All Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setSelectedDays(WEEKDAYS);
                  }}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Weekdays
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setSelectedDays(WEEKENDS);
                  }}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Weekends
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {ALL_ROUTINE_DAYS.map(day => {
                const isActive = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`py-2 text-xs font-bold font-mono rounded-xl border transition-all cursor-pointer text-center ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 font-black shadow-xs'
                        : 'bg-slate-50 dark:bg-[#1A1D2D] border-slate-200/80 dark:border-white/10 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-goals / Micro Checklists */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
              Slot Sub-Targets & Goals (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={e => setNewChecklistText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklist();
                  }
                }}
                placeholder="e.g. Solve 40 questions, Review formula sheet..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1A1D2D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAddChecklist()}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {checklists.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {checklists.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#1A1D2D] border border-slate-200/80 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <span className="truncate pr-2 font-medium">• {item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklist(idx)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes / Execution Advice */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
              Strategy / Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Keep phone in another room, take 5m stretch at halfway point..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1A1D2D] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{editingSlot ? 'Save Changes' : 'Create Slot'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
};
