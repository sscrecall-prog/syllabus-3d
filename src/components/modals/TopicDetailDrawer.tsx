import React, { useState, useEffect } from 'react';
import { Topic, TopicStatus, MistakeType } from '../../types/syllabus';
import { useSyllabus } from '../../context/SyllabusContext';
import { X, Play, Pause, Check, Plus, Save, CheckCircle2, Clock } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatDateReadable, formatMinutes } from '../../utils/dateUtils';

interface TopicDetailDrawerProps {
  topic: Topic | null;
  subjectName?: string;
  subjectColor?: string;
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
  } = useSyllabus();

  const [notes, setNotes] = useState('');
  const [accuracy, setAccuracy] = useState(80);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'mistakes'>('overview');

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
      setTimerSeconds(0);
      setIsTimerRunning(false);
      setShowAddMistake(false);
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
          <div className="min-w-0">
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

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
              onClick={() => setActiveTab(tab.id)}
              className={'py-3 px-3 sm:px-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ' + (activeTab === tab.id ? 'border-brand-500 text-brand-500' : 'border-transparent text-slate-500 hover:text-slate-700')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
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

              <div>
                <h5 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Core Subtopics to Master
                </h5>
                <div className="space-y-1.5">
                  {topic.subtopics.map((sub, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50"
                    >
                      <div className="w-4.5 h-4.5 rounded-md bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-500 shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {sub}
                      </span>
                    </div>
                  ))}
                </div>
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
