import React, { useState, useEffect } from 'react';
import { Topic, TopicStatus, MistakeType, DifficultyLevel } from '../../types/syllabus';
import { useSyllabus } from '../../context/SyllabusContext';
import {
  X,
  Play,
  Pause,
  Check,
  Plus,
  CheckCircle2,
  Clock,
  Edit3,
  Trash2,
  BookOpen,
  FileText,
  AlertTriangle,
  Flame,
  ChevronDown
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatDateReadable, formatMinutes } from '../../utils/dateUtils';
import { ProfessionalNotesEditor } from '../common/ProfessionalNotesEditor';

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
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  if (!topic) return null;

  const handleStopTimer = () => {
    if (timerSeconds > 30) {
      const minutes = Math.ceil(timerSeconds / 60);
      logStudySession(minutes);
    }
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const handleSaveNotes = (newContent: string) => {
    setNotes(newContent);
    updateTopicNotes(topic.id, newContent);
  };

  const handleSaveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    editTopic(topic.id, {
      name: editName.trim(),
      difficulty: editDifficulty,
      weightage: editWeightage
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteTopic(topic.id);
    onClose();
  };

  const handleAddSubtopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtopicInput.trim()) return;
    addSubtopic(topic.id, newSubtopicInput.trim());
    setNewSubtopicInput('');
  };

  const handleAddMistakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mistakeDesc.trim() || !mistakeSolution.trim()) return;
    addTopicMistake(topic.id, mistakeDesc.trim(), mistakeType, mistakeSolution.trim());
    setMistakeDesc('');
    setMistakeSolution('');
    setShowAddMistake(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-fade-in flex justify-end">
      {/* Mobile: Bottom Sheet (rounded-t-[32px]) | Desktop: Slide-over Drawer */}
      <div className="w-full max-w-full md:max-w-xl h-[92vh] md:h-full mt-auto md:mt-0 bg-[#FAF8F5] dark:bg-[#1A1A1A] border-t md:border-l border-[#EBD3A0] dark:border-[#333333] shadow-2xl flex flex-col rounded-t-[32px] md:rounded-none overflow-hidden animate-slide-left">
        
        {/* Mobile Swipe Down Handle Pill */}
        <div className="md:hidden pt-3 pb-1 flex justify-center cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1.5 rounded-full bg-[#EBD3A0] dark:bg-[#383838]" />
        </div>

        {/* Drawer Header */}
        <div className="p-4 sm:p-6 border-b border-[#EBD3A0]/60 dark:border-[#2E2E2E] flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#6B7280] truncate">
              <span>{subjectName || 'Subject'}</span>
              <span>•</span>
              <span className="text-[#D4AF37]">{chapterName || 'Chapter'}</span>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveEdits} className="space-y-2 mt-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white dark:bg-[#242424] border border-[#D4AF37] text-sm font-bold text-[#171717] dark:text-white"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-[#D4AF37] text-[#171717] text-xs font-bold cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-[#333333] text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <h3 className="text-base sm:text-xl font-black text-[#171717] dark:text-[#F5E6C8] truncate">
                {topic.name}
              </h3>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsEditing(p => !p)}
              className="p-2 rounded-xl hover:bg-[#F5E6C8]/40 dark:hover:bg-[#282828] text-[#6B7280] hover:text-[#D4AF37] transition-colors cursor-pointer"
              title="Edit Topic"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[#F5E6C8]/40 dark:hover:bg-[#282828] text-[#6B7280] hover:text-rose-500 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#EBD3A0]/60 dark:border-[#2E2E2E] px-4 sm:px-6 gap-6 bg-white/50 dark:bg-[#171717]/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#D4AF37] text-[#8C6D15] dark:text-[#D4AF37]'
                : 'border-transparent text-[#6B7280]'
            }`}
          >
            Overview & Status
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'border-[#D4AF37] text-[#8C6D15] dark:text-[#D4AF37]'
                : 'border-transparent text-[#6B7280]'
            }`}
          >
            Study Notes & Rules
          </button>
          <button
            onClick={() => setActiveTab('mistakes')}
            className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'mistakes'
                ? 'border-[#D4AF37] text-[#8C6D15] dark:text-[#D4AF37]'
                : 'border-transparent text-[#6B7280]'
            }`}
          >
            Mistakes Log ({topic.mistakes?.length || 0})
          </button>
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Status Selector Bar */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#333333] space-y-3">
                <span className="text-xs font-bold text-[#6B7280] block">Topic Mastery State</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['not_started', 'in_progress', 'completed', 'weak'] as TopicStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => updateTopicStatus(topic.id, st)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        topic.status === st
                          ? 'bg-[#D4AF37] text-[#171717] shadow-md'
                          : 'bg-[#FAF8F5] dark:bg-[#1A1A1A] text-[#6B7280] hover:border-[#D4AF37]'
                      }`}
                    >
                      {st === 'not_started' && 'Not Started'}
                      {st === 'in_progress' && 'In Progress'}
                      {st === 'completed' && 'Mastered ✓'}
                      {st === 'weak' && 'Weak Topic ⚠️'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtopics Checklist */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#333333] space-y-3">
                <span className="text-xs font-bold text-[#171717] dark:text-[#F5E6C8] block">Subtopics & Concepts Checklist</span>
                <div className="space-y-1.5">
                  {topic.subtopics?.map((sub, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#2E2E2E]">
                      <span className="text-xs font-semibold text-[#171717] dark:text-[#F5E6C8]">• {sub}</span>
                      <button
                        onClick={() => deleteSubtopic(topic.id, idx)}
                        className="text-xs text-[#6B7280] hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddSubtopicSubmit} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newSubtopicInput}
                    onChange={(e) => setNewSubtopicInput(e.target.value)}
                    placeholder="Add new subtopic..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0] dark:border-[#333333] text-xs text-[#171717] dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#171717] text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </form>
              </div>

              {/* Danger Zone: Delete Topic */}
              <div className="pt-4 border-t border-[#EBD3A0]/60 dark:border-[#2E2E2E] flex justify-between items-center">
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Yes, Delete Topic
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-[#333333] text-xs font-semibold text-[#6B7280] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete this Topic</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <ProfessionalNotesEditor
                initialContent={notes}
                onSave={handleSaveNotes}
                topicName={topic.name}
              />
            </div>
          )}

          {activeTab === 'mistakes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#171717] dark:text-[#F5E6C8]">Mistake & Trap Journal</span>
                <button
                  onClick={() => setShowAddMistake(p => !p)}
                  className="px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#171717] text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Mistake</span>
                </button>
              </div>

              {showAddMistake && (
                <form onSubmit={handleAddMistakeSubmit} className="p-4 rounded-2xl bg-white dark:bg-[#222222] border border-[#D4AF37] space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] mb-1">Mistake Description</label>
                    <input
                      type="text"
                      value={mistakeDesc}
                      onChange={(e) => setMistakeDesc(e.target.value)}
                      placeholder="e.g. Forgot sign change in quadratic roots"
                      className="w-full p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0] dark:border-[#383838] text-xs font-semibold text-[#171717] dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] mb-1">Correct Solution / Approach</label>
                    <textarea
                      value={mistakeSolution}
                      onChange={(e) => setMistakeSolution(e.target.value)}
                      placeholder="Always write down full formula before solving..."
                      rows={3}
                      className="w-full p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0] dark:border-[#383838] text-xs font-semibold text-[#171717] dark:text-white"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMistake(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-[#333333] text-xs font-bold text-[#6B7280] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-[#D4AF37] text-[#171717] text-xs font-bold cursor-pointer"
                    >
                      Save Mistake
                    </button>
                  </div>
                </form>
              )}

              {topic.mistakes && topic.mistakes.length > 0 ? (
                <div className="space-y-3">
                  {topic.mistakes.map((m) => (
                    <div key={m.id} className="p-4 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#333333] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-500">⚠️ {m.questionDescription}</span>
                        <button
                          onClick={() => resolveTopicMistake(topic.id, m.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            m.resolved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {m.resolved ? 'Resolved ✓' : 'Mark Resolved'}
                        </button>
                      </div>
                      <p className="text-xs text-[#6B7280] leading-relaxed">
                        <strong className="text-[#171717] dark:text-[#F5E6C8]">Solution:</strong> {m.correctApproach}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6B7280] text-center py-6">
                  No mistakes logged for this topic yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
