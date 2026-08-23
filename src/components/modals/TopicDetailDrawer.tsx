import React, { useState, useEffect } from 'react';
import { Topic, TopicStatus, MistakeType, DifficultyLevel } from '../../types/syllabus';
import { useSyllabus } from '../../context/SyllabusContext';
import {
  X,
  Play,
  Pause,
  Check,
  Plus,
  Save,
  CheckCircle2,
  Clock,
  Edit3,
  Trash2
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatDateReadable, formatMinutes } from '../../utils/dateUtils';

interface TopicDetailDrawerProps {
  topic: Topic | null;
  subjectName?: string;
  chapterName?: string;
  onClose: () => void;
}

export const TopicDetailDrawer: React.FC<TopicDetailDrawerProps> = ({
  topic,
  subjectName,
  chapterName,
  onClose,
}) => {
  const {
    updateTopicStatus,
    updateTopicNotes,
    addTopicMistake,
    resolveTopicMistake,
    logStudySession,
    editTopic,
    deleteTopic,
    addSubtopic,
    deleteSubtopic
  } = useSyllabus();

  const [notes, setNotes] = useState('');
  const [accuracy, setAccuracy] = useState(80);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'mistakes'>('overview');

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<DifficultyLevel>('Medium');
  const [editWeightage, setEditWeightage] = useState(4);
  const [newSubtopicInput, setNewSubtopicInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [showAddMistake, setShowAddMistake] = useState(false);
  const [mistakeDesc, setMistakeDesc] = useState('');
  const [mistakeType, setMistakeType] = useState<MistakeType>('conceptual');
  const [mistakeSolution, setMistakeSolution] = useState('');

  useEffect(() => {
    if (topic) {
      setNotes(topic.notes || '');
      setAccuracy(topic.accuracy || 80);
      setEditName(topic.name);
      setEditDifficulty(topic.difficulty);
      setEditWeightage(topic.weightage);
      setTimerSeconds(0);
      setIsTimerRunning(false);
      setShowAddMistake(false);
      setIsEditing(false);
      setShowDeleteConfirm(false);
    }
  }, [topic]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  if (!topic) return null;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  };

  const handleStatusChange = (st: TopicStatus) => {
    updateTopicStatus(topic.id, st, accuracy);
  };

  const handleSaveNotes = () => {
    updateTopicNotes(topic.id, notes);
  };

  const handleLogTime = () => {
    if (timerSeconds > 0) {
      const mins = Math.max(1, Math.round(timerSeconds / 60));
      logStudySession(mins);
      setIsTimerRunning(false);
      setTimerSeconds(0);
    }
  };

  const handleAddMistake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mistakeDesc.trim()) return;
    addTopicMistake(topic.id, mistakeDesc, mistakeType, mistakeSolution);
    setMistakeDesc('');
    setMistakeSolution('');
    setShowAddMistake(false);
  };

  const handleSaveTopicEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    editTopic(topic.id, {
      name: editName.trim(),
      difficulty: editDifficulty,
      weightage: editWeightage
    });
    setIsEditing(false);
  };

  const handleAddSubtopicClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtopicInput.trim()) return;
    addSubtopic(topic.id, newSubtopicInput.trim());
    setNewSubtopicInput('');
  };

  const handleDeleteTopic = () => {
    deleteTopic(topic.id);
    onClose();
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'notes' as const, label: 'Notes & Rules' },
    { id: 'mistakes' as const, label: 'Mistakes (' + topic.mistakes.length + ')' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/65 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold text-brand-500 mb-1">
              <span>{subjectName}</span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="text-slate-500 dark:text-slate-400 truncate">{chapterName}</span>
            </div>

            <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
              {topic.name}
            </h3>

            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={topic.status} size="sm" />
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {topic.difficulty}
              </span>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400">
                {topic.weightage} Marks
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsEditing(prev => !prev)}
              className={'p-2 rounded-xl transition-colors ' + (isEditing ? 'bg-brand-500 text-white' : 'text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800')}
              title="Edit Topic Details"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Delete Topic"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Banner */}
        {showDeleteConfirm && (
          <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between gap-3">
            <div>
              <h5 className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Delete &quot;{topic.name}&quot;?
              </h5>
              <p className="text-[11px] text-slate-500">
                This will remove this topic and all revision records.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTopic}
                className="px-3.5 py-1 text-xs font-bold bg-rose-500 text-white rounded-lg shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        )}

        {/* Study Timer Section */}
        <div className="p-3.5 sm:p-4 bg-brand-500/5 dark:bg-brand-950/20 border-b border-brand-500/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <div>
              <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">Study Timer</span>
              <h4 className="text-base sm:text-lg font-mono font-bold text-slate-900 dark:text-white">
                {formatTimer(timerSeconds)}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTimerRunning(prev => !prev)}
              className={'px-3 sm:px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all ' + (isTimerRunning ? 'bg-rose-500 text-white' : 'bg-brand-500 text-white hover:bg-brand-600')}
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
            </button>

            {timerSeconds > 0 && (
              <button
                onClick={handleLogTime}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20"
              >
                Log
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center px-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsEditing(false);
              }}
              className={'py-3 px-3 sm:px-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ' + (activeTab === tab.id && !isEditing ? 'border-brand-500 text-brand-500' : 'border-transparent text-slate-500 hover:text-slate-700')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* EDIT TOPIC FORM */}
          {isEditing ? (
            <form onSubmit={handleSaveTopicEdits} className="space-y-4 p-4 rounded-2xl bg-brand-500/5 border border-brand-500/20">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Edit Topic Details
                </h5>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={editDifficulty}
                    onChange={e => setEditDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Weightage (Marks)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={editWeightage}
                    onChange={e => setEditWeightage(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : null}

          {activeTab === 'overview' && (
            <>
              <div>
                <h5 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mb-2.5">
                  Update Status
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['completed', 'in_progress', 'revision_due', 'weak', 'not_started'] as TopicStatus[]).map(st => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      className={'p-2.5 rounded-xl border text-left transition-all ' + (topic.status === st ? 'bg-brand-500/10 border-brand-500 ring-1 ring-brand-500' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700')}
                    >
                      <StatusBadge status={st} size="sm" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtopics Management */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    Core Subtopics ({topic.subtopics.length})
                  </h5>
                </div>

                <div className="space-y-1.5 mb-3">
                  {topic.subtopics.map((sub, i) => (
                    <div
                      key={i}
                      className="group flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-4.5 h-4.5 rounded-md bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-500 shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                          {sub}
                        </span>
                      </div>

                      <button
                        onClick={() => deleteSubtopic(topic.id, i)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-all shrink-0"
                        title="Delete Subtopic"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Subtopic Inline Form */}
                <form onSubmit={handleAddSubtopicClick} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubtopicInput}
                    onChange={e => setNewSubtopicInput(e.target.value)}
                    placeholder="+ Add subtopic / key point..."
                    className="flex-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">Mock Accuracy</span>
                  <span className="text-xs font-bold text-brand-500">{topic.accuracy}%</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Last Studied:</span>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatDateReadable(topic.lastStudied)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Total Study:</span>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatMinutes(topic.studyTimeMinutes)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  High-Yield Formulas & Notes
                </h5>
                <button
                  onClick={handleSaveNotes}
                  className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notes</span>
                </button>
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add your cheat sheet rules, high-frequency exceptions, or key formulas here..."
                rows={10}
                className="w-full p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          {activeTab === 'mistakes' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  Logged Mistakes
                </h5>
                <button
                  onClick={() => setShowAddMistake(prev => !prev)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Mistake</span>
                </button>
              </div>

              {showAddMistake && (
                <form onSubmit={handleAddMistake} className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                  <input
                    type="text"
                    value={mistakeDesc}
                    onChange={e => setMistakeDesc(e.target.value)}
                    placeholder="Question / wrong logic description..."
                    required
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                  <select
                    value={mistakeType}
                    onChange={e => setMistakeType(e.target.value as MistakeType)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="conceptual">Conceptual Error</option>
                    <option value="calculation">Calculation Slip</option>
                    <option value="formula">Formula Forgotten</option>
                    <option value="silly">Silly Mistake</option>
                    <option value="time_pressure">Time Pressure</option>
                  </select>
                  <input
                    type="text"
                    value={mistakeSolution}
                    onChange={e => setMistakeSolution(e.target.value)}
                    placeholder="Correct solution / trick to remember..."
                    required
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowAddMistake(false)} className="px-3 py-1 text-xs rounded-lg">Cancel</button>
                    <button type="submit" className="px-3.5 py-1 rounded-lg bg-rose-500 text-white text-xs font-semibold">Save Mistake</button>
                  </div>
                </form>
              )}

              <div className="space-y-2.5">
                {topic.mistakes.length > 0 ? (
                  topic.mistakes.map(m => (
                    <div
                      key={m.id}
                      className={'p-3 sm:p-4 rounded-2xl border transition-all ' + (m.resolved ? 'bg-emerald-500/5 border-emerald-500/20 opacity-70' : 'bg-rose-500/5 border-rose-500/20')}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-500/10 text-rose-500 uppercase">
                          {m.mistakeType.replace('_', ' ')}
                        </span>
                        <button
                          onClick={() => resolveTopicMistake(topic.id, m.id)}
                          className={'flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ' + (m.resolved ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400')}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{m.resolved ? 'Mastered' : 'Mark Resolved'}</span>
                        </button>
                      </div>

                      <p className="text-xs font-medium text-slate-900 dark:text-white mb-1">
                        {m.questionDescription}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Remedy: {m.correctApproach}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No mistakes logged yet for this topic.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
