import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSyllabus } from '../../context/SyllabusContext';
import { EXAM_PRESETS_CATALOG } from '../../data/initialData';
import { X, Calendar, Sparkles, Check, Save, Target, ArrowRightLeft, PlusCircle } from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

interface EditExamTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddModal?: () => void;
}

const PRESET_EXAMS = [
  { name: 'SSC CGL 2026', code: 'SSC_CGL', date: '2026-10-15', year: 2026 },
  { name: 'UPSC CSE 2026', code: 'UPSC_CSE', date: '2026-05-24', year: 2026 },
  { name: 'IBPS PO 2026', code: 'IBPS_PO', date: '2026-11-10', year: 2026 },
  { name: 'Railway NTPC 2026', code: 'RRB_NTPC', date: '2026-09-18', year: 2026 },
  { name: 'State PCS 2026', code: 'STATE_PCS', date: '2026-12-05', year: 2026 },
  { name: 'SSC CHSL 2026', code: 'SSC_CHSL', date: '2026-07-20', year: 2026 }
];

export const EditExamTargetModal: React.FC<EditExamTargetModalProps> = ({
  isOpen,
  onClose,
  onOpenAddModal
}) => {
  const { currentExam, exams, updateCurrentExamDetails, setSelectedExamId, addExam } = useSyllabus();

  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [targetYear, setTargetYear] = useState(2026);
  const [selectedPresetCode, setSelectedPresetCode] = useState<string | null>(null);

  useEffect(() => {
    if (currentExam) {
      setExamName(currentExam.name);
      setExamDate(currentExam.examDate || '2026-10-15');
      setTargetYear(currentExam.targetYear || 2026);
      setSelectedPresetCode(null);
    }
  }, [currentExam, isOpen]);

  if (!isOpen || !currentExam) return null;

  const handleSelectPreset = (preset: typeof PRESET_EXAMS[0]) => {
    setExamName(preset.name);
    setExamDate(preset.date);
    setTargetYear(preset.year);
    setSelectedPresetCode(preset.code);
    soundManager.playClick();
  };

  // Check if chosen preset already exists as an enrolled exam in this profile
  const matchingEnrolledExam = exams.find(
    e =>
      e.id !== currentExam.id &&
      (e.name.trim().toLowerCase() === examName.trim().toLowerCase() ||
        (selectedPresetCode && e.code === selectedPresetCode))
  );

  const matchingCatalogPreset = EXAM_PRESETS_CATALOG.find(
    c => c.name.toLowerCase() === examName.toLowerCase() || c.code === selectedPresetCode
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = examName.trim();
    if (!cleanName || !examDate) return;

    updateCurrentExamDetails({
      name: cleanName,
      examDate,
      targetYear: Number(targetYear) || 2026
    });

    soundManager.playCompleteChime();
    haptics.success();
    onClose();
  };

  const handleEnrollAsNew = () => {
    if (!examName.trim() || !examDate) return;
    const templateSubjects = matchingCatalogPreset?.subjects || [];
    addExam({
      name: examName.trim(),
      code: selectedPresetCode || 'CUSTOM',
      examDate,
      targetYear: Number(targetYear) || 2026,
      subjects: templateSubjects
    });
    onClose();
  };

  const handleSwitchToEnrolled = (examId: string) => {
    setSelectedExamId(examId);
    soundManager.playClick();
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
        className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#12131C] border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-[#7AA2F7]">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Customize Exam & Target Date
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Updating active exam: <span className="font-bold text-blue-600 dark:text-[#7AA2F7]">{currentExam.name}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Popular Exam Presets:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_EXAMS.map(p => {
                const isMatch = examName.toLowerCase() === p.name.toLowerCase();
                return (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isMatch
                        ? 'bg-blue-50 dark:bg-[#7AA2F7]/20 border-blue-500 text-blue-600 dark:text-[#7AA2F7] font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-Exam Notice: When user clicks an already enrolled exam preset */}
          {matchingEnrolledExam && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs">
              <div className="text-emerald-800 dark:text-emerald-300 font-medium">
                <span className="font-bold">{matchingEnrolledExam.name}</span> is already in your profile!
              </div>
              <button
                type="button"
                onClick={() => handleSwitchToEnrolled(matchingEnrolledExam.id)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Switch to it</span>
              </button>
            </div>
          )}

          {/* Multi-Exam Opportunity: When user clicks a preset NOT enrolled yet */}
          {!matchingEnrolledExam && matchingCatalogPreset && matchingCatalogPreset.name.toLowerCase() !== currentExam.name.toLowerCase() && (
            <div className="p-3 rounded-2xl bg-blue-500/10 dark:bg-[#7AA2F7]/10 border border-blue-500/25 dark:border-[#7AA2F7]/25 flex items-center justify-between gap-2 text-xs">
              <div className="text-blue-900 dark:text-blue-200 text-[11px] leading-snug">
                Want to keep <span className="font-bold">{currentExam.name}</span> and enroll in <span className="font-bold">{examName}</span> as a separate exam with its own syllabus?
              </div>
              <button
                type="button"
                onClick={handleEnrollAsNew}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Enroll as New</span>
              </button>
            </div>
          )}

          {/* Form Fields */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Exam Name / Target Title
            </label>
            <input
              type="text"
              value={examName}
              onChange={e => setExamName(e.target.value)}
              placeholder="e.g. SSC CGL 2026, UPSC CSE, IBPS PO"
              required
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            {onOpenAddModal ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddModal();
                }}
                className="text-xs font-bold text-blue-600 dark:text-[#7AA2F7] hover:underline flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Add Another Exam</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
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
                <Save className="w-3.5 h-3.5" />
                <span>Update Countdown Timer</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

