import React, { useState, useEffect } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { X, Plus } from 'lucide-react';
import { DifficultyLevel } from '../../types/syllabus';

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTopicModal: React.FC<AddTopicModalProps> = ({ isOpen, onClose }) => {
  const { currentExam, addTopic } = useSyllabus();

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [topicName, setTopicName] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [weightage, setWeightage] = useState(4);
  const [subtopicsText, setSubtopicsText] = useState('');

  useEffect(() => {
    if (currentExam && currentExam.subjects.length > 0) {
      const fs1 = currentExam.subjects[0];
      setSelectedSubjectId(fs1.id);
      if (fs1.chapters.length > 0) {
        setSelectedChapterId(fs1.chapters[0].id);
      }
    }
  }, [currentExam]);

  const subjectMatch = currentExam?.subjects.find(s => s.id === selectedSubjectId);

  useEffect(() => {
    if (subjectMatch && subjectMatch.chapters.length > 0) {
      setSelectedChapterId(subjectMatch.chapters[0].id);
    }
  }, [selectedSubjectId, subjectMatch]);

  if (!isOpen || !currentExam) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim() || !selectedSubjectId || !selectedChapterId) return;

    const subtopics = subtopicsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    addTopic(selectedSubjectId, selectedChapterId, {
      name: topicName,
      difficulty,
      weightage,
      subtopics: subtopics.length > 0 ? subtopics : ['General Concepts']
    });

    setTopicName('');
    setSubtopicsText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
              <Plus className="w-4 h-4" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Add Custom Topic
            </h4>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
              >
                {currentExam.subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Chapter</label>
              <select
                value={selectedChapterId}
                onChange={e => setSelectedChapterId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
              >
                {subjectMatch?.chapters.map(ch => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Topic Name</label>
            <input
              type="text"
              value={topicName}
              onChange={e => setTopicName(e.target.value)}
              placeholder="e.g. New Concept, Indian Literature, etc."
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Difficulty</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Weightage (Marks)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={weightage}
                onChange={e => setWeightage(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Subtopics (Comma-separated)</label>
            <input
              type="text"
              value={subtopicsText}
              onChange={e => setSubtopicsText(e.target.value)}
              placeholder="e.g. Formulas, Types, Practice Sets"
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md"
            >
              Add Topic
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
