import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSyllabus } from '../../context/SyllabusContext';
import { X, Trash2, Save, BookOpen, Check, Plus } from 'lucide-react';
import { Subject } from '../../types/syllabus';

interface EditSubjectModalProps {
  subject: Subject | null;
  isOpen: boolean;
  onClose: () => void;
}

const PALETTE = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#f97316', // Orange
];

export const EditSubjectModal: React.FC<EditSubjectModalProps> = ({ subject, isOpen, onClose }) => {
  const { editSubject, deleteSubject, addSubject } = useSyllabus();

  const isCreateMode = !subject;
  const [name, setName] = useState('');
  const [initialChapterName, setInitialChapterName] = useState('General Concepts');
  const [color, setColor] = useState(PALETTE[0]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setColor(subject.color || PALETTE[0]);
      setShowDeleteConfirm(false);
    } else {
      setName('');
      setInitialChapterName('General Concepts');
      setColor(PALETTE[0]);
      setShowDeleteConfirm(false);
    }
  }, [subject, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isCreateMode) {
      addSubject({
        name: name.trim(),
        color,
        initialChapterName: initialChapterName.trim() || 'General Concepts'
      });
    } else if (subject) {
      editSubject(subject.id, { name: name.trim(), color });
    }
    onClose();
  };

  const handleDelete = () => {
    if (subject) {
      deleteSubject(subject.id);
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {isCreateMode ? <Plus className="w-4 h-4 stroke-[2.5]" /> : <BookOpen className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isCreateMode ? 'Add New Subject' : 'Edit Subject'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {isCreateMode ? 'Create a new subject area for your exam syllabus' : `Configure settings for ${subject?.name}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {showDeleteConfirm ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Delete &quot;{subject.name}&quot;?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All chapters, topics, and study progress within this subject will be permanently removed.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md"
              >
                Yes, Delete Subject
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Subject Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Mathematics, General Studies, English..."
                required
                autoFocus
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {isCreateMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Initial Chapter Name
                </label>
                <input
                  type="text"
                  value={initialChapterName}
                  onChange={e => setInitialChapterName(e.target.value)}
                  placeholder="e.g. Chapter 1: Basics / Foundation"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  You can add more chapters and topics anytime after creating the subject.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Theme Color
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {PALETTE.map(col => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setColor(col)}
                    className={'w-7 h-7 rounded-full flex items-center justify-center transition-transform shrink-0 cursor-pointer ' + (color === col ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : '')}
                    style={{ backgroundColor: col }}
                  >
                    {color === col && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              {!isCreateMode && subject ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {isCreateMode ? <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isCreateMode ? 'Add Subject' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
