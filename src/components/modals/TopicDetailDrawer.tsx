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
  ChevronDown,
  ShieldAlert
} from 'lucide-react';
import { formatDateReadable, formatMinutes } from '../../utils/dateUtils';
import { ProfessionalNotesEditor } from '../common/ProfessionalNotesEditor';
import { AdvancedMistakeJournal } from '../mistakes/AdvancedMistakeJournal';
import { soundManager } from '../../utils/soundEffects';

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

  useEffect(() => {
    if (topic) {
      setNotes(topic.notes || '');
      setAccuracy(topic.accuracy || 80);
      setEditName(topic.name);
      setEditDifficulty(topic.difficulty);
      setEditWeightage(topic.weightage);
      setTimerSeconds(0);
      setIsTimerRunning(false);
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
    soundManager.playCompleteChime();
  };

  const handleSaveNotes = (newNotes: string) => {
    setNotes(newNotes);
    updateTopicNotes(topic.id, newNotes);
    soundManager.playClick();
  };

  const handleSaveTopicDetails = (e: React.FormEvent) => {
    e.preventDefault();
    editTopic(topic.id, {
      name: editName,
      difficulty: editDifficulty,
      weightage: Number(editWeightage)
    });
    setIsEditing(false);
    soundManager.playClick();
  };

  const handleAddSubtopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtopicInput.trim()) return;
    addSubtopic(topic.id, newSubtopicInput.trim());
    setNewSubtopicInput('');
    soundManager.playClick();
  };

  const handleDelete = () => {
    deleteTopic(topic.id);
    onClose();
    soundManager.playClick();
  };

  const mistakesCount = topic.mistakes ? topic.mistakes.length : 0;
  const activeMistakesCount = topic.mistakes ? topic.mistakes.filter(m => !m.resolved).length : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-2xl bg-[#F7F6F0] dark:bg-[#0D0E0C] border-l border-[#D8D8CF] dark:border-[#30342B] shadow-2xl flex flex-col justify-between transition-colors">
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-[#D8D8CF] dark:border-[#30342B] bg-white dark:bg-[#151713] flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#596B35] dark:text-[#A4B879]">
                <span>{subjectName || 'Subject'}</span>
                <span>•</span>
                <span className="truncate">{chapterName || 'Chapter'}</span>
              </div>
              <h2 className="text-base sm:text-xl font-extrabold text-[#11120F] dark:text-[#F4F4ED] truncate mt-0.5 font-serif">
                {topic.name}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsEditing(p => !p)}
                className="p-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-[#65675F] hover:text-[#11120F] dark:hover:text-white transition-all cursor-pointer"
                title="Edit Topic"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-[#85877E] hover:text-[#11120F] dark:hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center px-4 sm:px-6 pt-3 pb-0 border-b border-[#D8D8CF] dark:border-[#30342B] bg-white dark:bg-[#151713] gap-2">
            {[
              { id: 'overview', label: 'Overview & Status', icon: BookOpen },
              { id: 'notes', label: 'Academic Notes', icon: FileText },
              {
                id: 'mistakes',
                label: 'Mistake & Trap Journal',
                icon: ShieldAlert,
                badge: activeMistakesCount > 0 ? activeMistakesCount : null
              }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundManager.playClick();
                    setActiveTab(tab.id as any);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'border-[#596B35] text-[#596B35] dark:text-[#A4B879]'
                      : 'border-transparent text-[#65675F] dark:text-[#85877E] hover:text-[#11120F] dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#B94A48] text-white">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                
                {/* Topic Edit Form */}
                {isEditing && (
                  <form onSubmit={handleSaveTopicDetails} className="p-4 rounded-2xl bg-white dark:bg-[#151713] border border-[#596B35] space-y-3">
                    <h3 className="text-xs font-bold text-[#11120F] dark:text-[#F4F4ED] uppercase font-mono">
                      Edit Topic Information
                    </h3>
                    <div>
                      <label className="block text-[11px] font-bold text-[#85877E] mb-1">Topic Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-xs font-bold text-[#11120F] dark:text-white"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#85877E] mb-1">Difficulty</label>
                        <select
                          value={editDifficulty}
                          onChange={e => setEditDifficulty(e.target.value as DifficultyLevel)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-xs font-bold"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#85877E] mb-1">Weightage (Marks)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={editWeightage}
                          onChange={e => setEditWeightage(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-xs font-bold"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#85877E]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-[#11120F] hover:bg-[#596B35] text-white text-xs font-bold"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                )}

                {/* Status Selector */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-subtle-depth space-y-2.5">
                  <span className="text-[11px] font-bold text-[#85877E] uppercase font-mono block">
                    Preparation Status
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['not_started', 'in_progress', 'completed', 'weak'] as TopicStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => updateTopicStatus(topic.id, st)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          topic.status === st
                            ? 'bg-[#11120F] text-white border-transparent shadow-sm'
                            : 'bg-[#F7F6F0] dark:bg-[#1D201A] text-[#65675F] dark:text-[#A7AA9C] border-[#D8D8CF] dark:border-[#30342B] hover:border-[#596B35]'
                        }`}
                      >
                        {st === 'not_started' && 'Not Started'}
                        {st === 'in_progress' && 'In Progress ⚡'}
                        {st === 'completed' && 'Mastered ✓'}
                        {st === 'weak' && 'Weak ⚠️'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtopics Checklist */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-subtle-depth space-y-3">
                  <span className="text-xs font-bold text-[#11120F] dark:text-[#F4F4ED] block font-serif">
                    Subtopics & Concept Checklist
                  </span>
                  <div className="space-y-1.5">
                    {topic.subtopics?.map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B]">
                        <span className="text-xs font-semibold text-[#191A17] dark:text-[#F4F4ED]">• {sub}</span>
                        <button
                          onClick={() => deleteSubtopic(topic.id, idx)}
                          className="text-xs text-[#85877E] hover:text-[#B94A48] p-1"
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
                      className="flex-1 px-3 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-xs font-medium"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#11120F] hover:bg-[#596B35] text-white text-xs font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </form>
                </div>

                {/* Danger Zone */}
                <div className="pt-4 border-t border-[#D8D8CF] dark:border-[#30342B] flex justify-between items-center">
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDelete}
                        className="px-4 py-2 rounded-xl bg-[#B94A48] hover:bg-[#A33D3B] text-white text-xs font-bold cursor-pointer"
                      >
                        Yes, Delete Topic
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-2 rounded-xl bg-[#EEEEE8] dark:bg-[#1D201A] text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-xs font-bold text-[#B94A48] hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete this Topic</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* NOTES TAB */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <ProfessionalNotesEditor
                  initialContent={notes}
                  onSave={handleSaveNotes}
                  topicName={topic.name}
                />
              </div>
            )}

            {/* ADVANCED MISTAKES & TRAPS TAB */}
            {activeTab === 'mistakes' && (
              <AdvancedMistakeJournal
                topic={topic}
                subjectName={subjectName}
                chapterName={chapterName}
              />
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
