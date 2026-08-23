import React, { useState, useEffect } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { X, Plus, BookOpen, Layers, Check, Palette } from 'lucide-react';
import { DifficultyLevel } from '../../types/syllabus';

interface AddTopicModalProps {
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

export const AddTopicModal: React.FC<AddTopicModalProps> = ({ isOpen, onClose }) => {
  const { currentExam, addCustomTopicWithHierarchy } = useSyllabus();

  // Subject state
  const [isNewSubject, setIsNewSubject] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState(PALETTE[0]);
  const [newSubjectIcon, setNewSubjectIcon] = useState('BookOpen');

  // Chapter state
  const [isNewChapter, setIsNewChapter] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [newChapterName, setNewChapterName] = useState('');
  const [newChapterDesc, setNewChapterDesc] = useState('');

  // Topic state
  const [topicName, setTopicName] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [weightage, setWeightage] = useState(4);
  const [subtopicsText, setSubtopicsText] = useState('');

  useEffect(() => {
    if (currentExam && currentExam.subjects.length > 0) {
      const firstSub = currentExam.subjects[0];
      setSelectedSubjectId(firstSub.id);
      if (firstSub.chapters.length > 0) {
        setSelectedChapterId(firstSub.chapters[0].id);
      }
    }
  }, [currentExam]);

  const subjectMatch = currentExam?.subjects.find(s => s.id === selectedSubjectId);

  useEffect(() => {
    if (subjectMatch && subjectMatch.chapters.length > 0) {
      setSelectedChapterId(subjectMatch.chapters[0].id);
      setIsNewChapter(false);
    } else if (isNewSubject) {
      setIsNewChapter(true);
    }
  }, [selectedSubjectId, subjectMatch, isNewSubject]);

  if (!isOpen || !currentExam) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) return;

    if (isNewSubject && !newSubjectName.trim()) return;
    if (isNewChapter && !newChapterName.trim()) return;

    const subtopics = subtopicsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    addCustomTopicWithHierarchy({
      isNewSubject,
      subjectId: isNewSubject ? undefined : selectedSubjectId,
      newSubjectName,
      newSubjectColor,
      newSubjectIcon,

      isNewChapter: isNewSubject ? true : isNewChapter,
      chapterId: isNewChapter || isNewSubject ? undefined : selectedChapterId,
      newChapterName,
      newChapterDescription: newChapterDesc,

      topicName,
      difficulty,
      weightage,
      subtopics: subtopics.length > 0 ? subtopics : ['Core Concepts']
    });

    // Reset fields
    setTopicName('');
    setSubtopicsText('');
    setNewSubjectName('');
    setNewChapterName('');
    setNewChapterDesc('');
    setIsNewSubject(false);
    setIsNewChapter(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden my-auto">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Add Custom Topic / Subject / Chapter
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Extend your exam syllabus with custom concepts
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* SECTION 1: Subject Selection / Creation */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                <span>1. Subject</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsNewSubject(prev => !prev);
                  if (!isNewSubject) setIsNewChapter(true);
                }}
                className={'px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ' + (isNewSubject ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300')}
              >
                {isNewSubject ? '✓ Using Custom Subject' : '+ Create New Subject'}
              </button>
            </div>

            {!isNewSubject ? (
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {currentExam.subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.chapters.length} chapters)
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    New Subject Name *
                  </label>
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={e => setNewSubjectName(e.target.value)}
                    placeholder="e.g. Computer Aptitude, Hindi, Static GK"
                    required={isNewSubject}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {PALETTE.map(col => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewSubjectColor(col)}
                        className={'w-6 h-6 rounded-full flex items-center justify-center transition-transform shrink-0 ' + (newSubjectColor === col ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : '')}
                        style={{ backgroundColor: col }}
                      >
                        {newSubjectColor === col && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Chapter Selection / Creation */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                <span>2. Chapter</span>
              </div>

              {!isNewSubject && (
                <button
                  type="button"
                  onClick={() => setIsNewChapter(prev => !prev)}
                  className={'px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ' + (isNewChapter ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300')}
                >
                  {isNewChapter ? '✓ Using Custom Chapter' : '+ Create New Chapter'}
                </button>
              )}
            </div>

            {!isNewChapter && !isNewSubject ? (
              <select
                value={selectedChapterId}
                onChange={e => setSelectedChapterId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {subjectMatch?.chapters.map(ch => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name} ({ch.topics.length} topics)
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    New Chapter Name *
                  </label>
                  <input
                    type="text"
                    value={newChapterName}
                    onChange={e => setNewChapterName(e.target.value)}
                    placeholder="e.g. MS Office 365, Internet & Protocols"
                    required={isNewChapter || isNewSubject}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Chapter Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newChapterDesc}
                    onChange={e => setNewChapterDesc(e.target.value)}
                    placeholder="Short summary of chapter scope..."
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Topic Details */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                Topic Name *
              </label>
              <input
                type="text"
                value={topicName}
                onChange={e => setTopicName(e.target.value)}
                placeholder="e.g. Shortcut Keys & Word Extensions"
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as DifficultyLevel)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Easy">Easy (Foundation)</option>
                  <option value="Medium">Medium (Standard)</option>
                  <option value="Hard">Hard (High Difficulty)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Weightage (Marks)
                </label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={weightage}
                  onChange={e => setWeightage(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Subtopics (Comma-separated)
              </label>
              <input
                type="text"
                value={subtopicsText}
                onChange={e => setSubtopicsText(e.target.value)}
                placeholder="e.g. Word shortcuts, Excel formulas, PPT templates"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Save & Add to Syllabus</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
