import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSyllabus } from '../../context/SyllabusContext';
import { EXAM_PRESETS_CATALOG, ExamPresetCatalogItem } from '../../data/initialData';
import {
  X,
  PlusCircle,
  Calendar,
  GraduationCap,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Layers
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface AddExamTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExamAdded?: (examId: string) => void;
}

export const AddExamTargetModal: React.FC<AddExamTargetModalProps> = ({
  isOpen,
  onClose,
  onExamAdded
}) => {
  const { exams, addExam, setSelectedExamId } = useSyllabus();

  const [selectedPreset, setSelectedPreset] = useState<ExamPresetCatalogItem | null>(
    EXAM_PRESETS_CATALOG[0] || null
  );
  const [isCustom, setIsCustom] = useState(false);
  const [examName, setExamName] = useState(EXAM_PRESETS_CATALOG[0]?.name || 'UPSC CSE 2026');
  const [examDate, setExamDate] = useState(EXAM_PRESETS_CATALOG[0]?.examDate || '2026-05-24');
  const [targetYear, setTargetYear] = useState<number>(EXAM_PRESETS_CATALOG[0]?.targetYear || 2026);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: ExamPresetCatalogItem) => {
    setSelectedPreset(preset);
    setIsCustom(false);
    setExamName(preset.name);
    setExamDate(preset.examDate);
    setTargetYear(preset.targetYear);
    soundManager.playClick();
  };

  const handleSelectCustom = () => {
    setSelectedPreset(null);
    setIsCustom(true);
    setExamName('');
    setExamDate('2026-10-15');
    setTargetYear(2026);
    soundManager.playClick();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim() || !examDate) return;

    // Check if an exam with identical name or id already exists
    const existing = exams.find(
      ex => ex.name.trim().toLowerCase() === examName.trim().toLowerCase()
    );

    if (existing) {
      // If already exists, switch to it
      setSelectedExamId(existing.id);
      soundManager.playClick();
      onExamAdded?.(existing.id);
      onClose();
      return;
    }

    const templateSubjects = !isCustom && selectedPreset ? selectedPreset.subjects : [];

    const newId = addExam({
      name: examName.trim(),
      code: selectedPreset?.code || 'CUSTOM',
      examDate,
      targetYear: Number(targetYear) || 2026,
      subjects: templateSubjects
    });

    onExamAdded?.(newId);
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundManager.playClick();
          onClose();
        }
      }}
    >
      <div 
        className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#12131C] border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2563EB]/20 to-purple-500/20 border border-[#2563EB]/30 flex items-center justify-center text-[#2563EB] dark:text-[#7AA2F7] shadow-xs">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Add Target Exam
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Enroll in multiple exams. Each retains its own timer and syllabus.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Preset Selector Grid */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#7AA2F7]" />
              <span>Choose Exam Preset (Pre-loaded Syllabus & Countdown)</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EXAM_PRESETS_CATALOG.map(p => {
                const isSelected = !isCustom && selectedPreset?.id === p.id;
                const isAlreadyEnrolled = exams.some(
                  e => e.name.toLowerCase() === p.name.toLowerCase() || e.id === p.id
                );

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`relative text-left p-2.5 sm:p-3 rounded-2xl border transition-all text-xs cursor-pointer flex flex-col justify-between min-h-[74px] ${
                      isSelected
                        ? 'bg-blue-50/90 dark:bg-[#7AA2F7]/15 border-blue-500 dark:border-[#7AA2F7] shadow-sm'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 w-full">
                      <span className="font-extrabold text-slate-900 dark:text-white leading-tight">
                        {p.name}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-[#7AA2F7] shrink-0" />
                      ) : isAlreadyEnrolled ? (
                        <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          Enrolled
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      <span>{p.targetYear}</span>
                      <span>{p.subjects.length} Subjects</span>
                    </div>
                  </button>
                );
              })}

              {/* Custom Option */}
              <button
                type="button"
                onClick={handleSelectCustom}
                className={`relative text-left p-2.5 sm:p-3 rounded-2xl border transition-all text-xs cursor-pointer flex flex-col justify-between min-h-[74px] ${
                  isCustom
                    ? 'bg-purple-50/90 dark:bg-purple-500/15 border-purple-500 dark:border-purple-400 shadow-sm'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-1 w-full">
                  <span className="font-extrabold text-slate-900 dark:text-white leading-tight flex items-center gap-1">
                    <span>+ Custom Exam</span>
                  </span>
                  {isCustom && <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />}
                </div>

                <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Blank Curriculum
                </div>
              </button>
            </div>
          </div>

          {/* Preset Syllabus Preview Info */}
          {!isCustom && selectedPreset && (
            <div className="p-3 rounded-2xl bg-blue-500/5 dark:bg-[#7AA2F7]/5 border border-blue-500/20 dark:border-[#7AA2F7]/20 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-blue-500/15 dark:bg-[#7AA2F7]/20 flex items-center justify-center text-blue-600 dark:text-[#7AA2F7] shrink-0 mt-0.5">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 text-xs">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                  <span>{selectedPreset.badge}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-blue-600 dark:text-[#7AA2F7] font-mono">
                    {selectedPreset.subjects.length} Subjects included
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedPreset.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedPreset.subjects.map(s => (
                    <span
                      key={s.id}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Form Fields: Name, Date, Year */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Exam Name / Target Title
              </label>
              <input
                type="text"
                value={examName}
                onChange={e => setExamName(e.target.value)}
                placeholder="e.g. UPSC CSE 2026, SSC CGL 2026, GATE 2026"
                required
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-[#7AA2F7]" />
                  <span>Target Exam Date</span>
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  required
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Year
                </label>
                <input
                  type="number"
                  min={2025}
                  max={2035}
                  value={targetYear}
                  onChange={e => setTargetYear(Number(e.target.value))}
                  required
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Enroll Exam & Load Syllabus</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
