import React, { useState, useEffect } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { X, Calendar, Sparkles, Check, Save, Target } from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface EditExamTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_EXAMS = [
  { name: 'SSC CGL 2025', code: 'SSC_CGL', date: '2025-09-15', year: 2025 },
  { name: 'SSC CGL 2026', code: 'SSC_CGL', date: '2026-10-15', year: 2026 },
  { name: 'SSC CHSL 2026', code: 'SSC_CHSL', date: '2026-07-20', year: 2026 },
  { name: 'UPSC CSE 2026', code: 'UPSC_CSE', date: '2026-05-25', year: 2026 },
  { name: 'IBPS PO 2026', code: 'IBPS_PO', date: '2026-11-10', year: 2026 },
  { name: 'Railway NTPC 2026', code: 'RRB_NTPC', date: '2026-09-18', year: 2026 },
  { name: 'State PCS 2026', code: 'STATE_PCS', date: '2026-12-05', year: 2026 },
];

export const EditExamTargetModal: React.FC<EditExamTargetModalProps> = ({ isOpen, onClose }) => {
  const { currentExam, updateCurrentExamDetails } = useSyllabus();

  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [targetYear, setTargetYear] = useState(2026);

  useEffect(() => {
    if (currentExam) {
      setExamName(currentExam.name);
      setExamDate(currentExam.examDate || '2026-10-15');
      setTargetYear(currentExam.targetYear || 2026);
    }
  }, [currentExam, isOpen]);

  if (!isOpen || !currentExam) return null;

  const handleSelectPreset = (preset: typeof PRESET_EXAMS[0]) => {
    setExamName(preset.name);
    setExamDate(preset.date);
    setTargetYear(preset.year);
    soundManager.playClick();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim() || !examDate) return;
    updateCurrentExamDetails({
      name: examName.trim(),
      examDate,
      targetYear: Number(targetYear)
    });
    soundManager.playCompleteChime();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-500/20 to-purple-500/20 border border-brand-500/30 flex items-center justify-center text-brand-500">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Customize Exam & Target Date
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Set custom exam name and 3D countdown timer.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4">
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
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                      isMatch
                        ? 'bg-brand-500/15 border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Exam Name / Target Title
            </label>
            <input
              type="text"
              value={examName}
              onChange={e => setExamName(e.target.value)}
              placeholder="e.g. SSC CGL 2026, UPSC Prelims, Custom Exam"
              required
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-500" />
                <span>Target Exam Date</span>
              </label>
              <input
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                required
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Countdown Timer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
