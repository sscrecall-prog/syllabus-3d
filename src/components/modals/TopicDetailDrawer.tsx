import React, { useState, useEffect, useMemo } from 'react';
import { Topic, TopicStatus, DifficultyLevel, TopicPdfAttachment } from '../../types/syllabus';
import { useSyllabus } from '../../context/SyllabusContext';
import {
  X,
  Clock,
  Target,
  BookOpen,
  FileText,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Plus,
  Edit3,
  Award,
  Sparkles,
  Zap,
  Check,
  Save,
  AlertTriangle
} from 'lucide-react';
import { ProfessionalNotesEditor } from '../common/ProfessionalNotesEditor';
import { AdvancedMistakeJournal } from '../mistakes/AdvancedMistakeJournal';
import { TopicPdfAttachmentsSection } from '../common/TopicPdfAttachmentsSection';
import { TopicLecturesSection, YoutubeIcon } from '../common/TopicLecturesSection';
import { TopicAudioMemosSection } from '../common/TopicAudioMemosSection';
import { SplitScreenPdfStudyModal } from '../common/SplitScreenPdfStudyModal';
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
  onClose
}) => {
  const {
    exams,
    updateTopicStatus,
    updateTopicNotes,
    logStudySession,
    editTopic,
    deleteTopic,
    addSubtopic,
    deleteSubtopic,
    updateTopicMetrics,
    addTopicPdfAttachment,
    deleteTopicPdfAttachment,
    addTopicLecture,
    deleteTopicLecture,
    addTopicAudioMemo,
    deleteTopicAudioMemo,
    addTopicImageAttachment,
    deleteTopicImageAttachment,
    currentExam
  } = useSyllabus();

  // Find live reactive topic from SyllabusContext exams state
  const liveTopic = useMemo(() => {
    if (!topic) return null;
    for (const exam of exams) {
      for (const subj of exam.subjects) {
        for (const chap of subj.chapters) {
          const found = chap.topics.find(t => t.id === topic.id);
          if (found) return found;
        }
      }
    }
    return topic;
  }, [exams, topic]);

  const [notes, setNotes] = useState('');
  const [accuracyInput, setAccuracyInput] = useState<number>(0);
  const [studyMinutesInput, setStudyMinutesInput] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'lectures' | 'mistakes'>('overview');

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<DifficultyLevel>('Medium');
  const [editWeightage, setEditWeightage] = useState<number | undefined>(undefined);
  const [newSubtopicInput, setNewSubtopicInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accuracySavedNotice, setAccuracySavedNotice] = useState(false);
  const [timeSavedNotice, setTimeSavedNotice] = useState(false);
  const [editSavedNotice, setEditSavedNotice] = useState(false);

  // In-App Split-Screen PDF Study Mode state
  const [isSplitPdfOpen, setIsSplitPdfOpen] = useState(false);
  const [splitPdfAttachmentId, setSplitPdfAttachmentId] = useState<string | undefined>(undefined);

  // Live Drawer Stopwatch
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Synchronize state with live topic
  useEffect(() => {
    if (liveTopic) {
      setNotes(liveTopic.notes || '');
      setAccuracyInput(liveTopic.accuracy !== undefined ? liveTopic.accuracy : 0);
      setStudyMinutesInput(liveTopic.studyTimeMinutes || 0);
      setEditName(liveTopic.name);
      setEditDifficulty(liveTopic.difficulty || 'Medium');
      setEditWeightage(liveTopic.weightage !== undefined ? liveTopic.weightage : undefined);
    }
  }, [
    liveTopic?.id,
    liveTopic?.name,
    liveTopic?.difficulty,
    liveTopic?.weightage,
    liveTopic?.accuracy,
    liveTopic?.studyTimeMinutes,
    liveTopic?.notes
  ]);

  // Reset stopwatch & edit mode when topic changes
  useEffect(() => {
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setIsEditing(false);
    setShowDeleteConfirm(false);
  }, [topic?.id]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  if (!liveTopic) return null;

  // Accuracy updater
  const handleSaveAccuracy = (newAcc: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newAcc)));
    setAccuracyInput(clamped);
    if (updateTopicMetrics) {
      updateTopicMetrics(liveTopic.id, { accuracy: clamped });
    } else {
      editTopic(liveTopic.id, { accuracy: clamped });
    }
    soundManager.playCompleteChime();
    setAccuracySavedNotice(true);
    setTimeout(() => setAccuracySavedNotice(false), 2000);
  };

  // Study Time Adders (+15m, +30m, etc.)
  const handleAddStudyMinutes = (minsToAdd: number) => {
    const newTotal = (liveTopic.studyTimeMinutes || 0) + minsToAdd;
    setStudyMinutesInput(newTotal);
    if (updateTopicMetrics) {
      updateTopicMetrics(liveTopic.id, { addMinutes: minsToAdd });
    } else {
      logStudySession(minsToAdd, liveTopic.id);
    }
    soundManager.playCompleteChime();
    setTimeSavedNotice(true);
    setTimeout(() => setTimeSavedNotice(false), 2000);
  };

  // Stop active Drawer stopwatch & log
  const handleStopAndLogStopwatch = () => {
    if (timerSeconds >= 5) {
      const minutes = Math.max(1, Math.round(timerSeconds / 60));
      handleAddStudyMinutes(minutes);
    }
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const handleSaveNotes = (newNotes: string) => {
    setNotes(newNotes);
    updateTopicNotes(liveTopic.id, newNotes);
    soundManager.playClick();
  };

  const handleSaveTopicDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    editTopic(liveTopic.id, {
      name: editName.trim(),
      difficulty: editDifficulty,
      weightage: editWeightage !== undefined && editWeightage > 0 ? Number(editWeightage) : undefined
    });

    soundManager.playCompleteChime();
    setEditSavedNotice(true);
    setTimeout(() => setEditSavedNotice(false), 2500);
    setIsEditing(false);
  };

  const handleAddSubtopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtopicInput.trim()) return;
    addSubtopic(liveTopic.id, newSubtopicInput.trim());
    setNewSubtopicInput('');
    soundManager.playClick();
  };

  const handleDelete = () => {
    deleteTopic(liveTopic.id);
    onClose();
    soundManager.playClick();
  };

  const mistakesCount = liveTopic.mistakes ? liveTopic.mistakes.length : 0;
  const activeMistakesCount = liveTopic.mistakes ? liveTopic.mistakes.filter(m => !m.resolved).length : 0;
  const pdfCount = liveTopic.pdfAttachments ? liveTopic.pdfAttachments.length : 0;
  const audioCount = liveTopic.audioMemos ? liveTopic.audioMemos.length : 0;
  const lecturesCount = liveTopic.lectures ? liveTopic.lectures.length : 0;
  const imagesCount = liveTopic.images ? liveTopic.images.length : 0;

  // Format Stopwatch Display
  const formatStopwatch = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-2xl bg-[#F7F6F0] dark:bg-[#0B0B0D] border-l border-[#D8D8CF] dark:border-[#272730] shadow-2xl flex flex-col justify-between transition-colors">
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-[#D8D8CF] dark:border-[#272730] bg-white dark:bg-[#18181D] flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#596B35] dark:text-[#8B5CF6]">
                <span>{subjectName || 'Subject'}</span>
                <span>•</span>
                <span className="truncate">{chapterName || 'Chapter'}</span>
              </div>
              <h2 className="text-base sm:text-xl font-extrabold text-[#11120F] dark:text-[#F5F5F7] truncate mt-0.5 font-serif">
                {liveTopic.name}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setIsEditing(p => !p);
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isEditing
                    ? 'bg-[#596B35] text-white border-[#596B35] shadow-sm'
                    : 'bg-[#F7F6F0] dark:bg-[#23232A] border-[#D8D8CF] dark:border-[#272730] text-[#65675F] hover:text-[#11120F] dark:hover:text-white hover:border-[#596B35]'
                }`}
                title={isEditing ? 'Close Edit Form' : 'Edit Topic Information'}
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  onClose();
                }}
                className="p-2 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-[#65675F] hover:text-[#11120F] dark:hover:text-white hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* EDIT TOPIC FORM PANEL (Appears directly beneath header when pencil is clicked) */}
          {isEditing && (
            <div className="p-4 sm:p-6 bg-white dark:bg-[#18181D] border-b-2 border-[#596B35] dark:border-[#8B5CF6] shadow-md animate-fade-in">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#D8D8CF] dark:border-[#272730]">
                <div className="flex items-center gap-2 text-xs font-bold text-[#596B35] dark:text-[#8B5CF6]">
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Topic Parameters</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-[#85877E] hover:text-[#11120F] dark:hover:text-white cursor-pointer"
                >
                  Close Form ✕
                </button>
              </div>

              <form onSubmit={handleSaveTopicDetails} className="space-y-3.5">
                {/* Topic Name */}
                <div>
                  <label className="block text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] mb-1">
                    Topic Title
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-xs font-semibold text-[#191A17] dark:text-[#F5F5F7] focus:outline-none focus:border-[#596B35]"
                    placeholder="Topic Name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Difficulty */}
                  <div>
                    <label className="block text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={editDifficulty}
                      onChange={e => setEditDifficulty(e.target.value as DifficultyLevel)}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-xs font-semibold text-[#191A17] dark:text-[#F5F5F7] focus:outline-none focus:border-[#596B35]"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  {/* Weightage Marks (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] mb-1">
                      Weightage Marks <span className="text-[10px] text-[#85877E] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editWeightage !== undefined ? editWeightage : ''}
                      onChange={e => setEditWeightage(e.target.value === '' ? undefined : Number(e.target.value))}
                      placeholder="e.g. 4 (optional)"
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-xs font-semibold text-[#191A17] dark:text-[#F5F5F7] focus:outline-none focus:border-[#596B35]"
                    />
                  </div>
                </div>

                {/* Subtopics Checklist Management */}
                <div>
                  <label className="block text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] mb-1">
                    Subtopics & Concept Checkpoints ({liveTopic.subtopics ? liveTopic.subtopics.length : 0})
                  </label>
                  
                  {/* Existing Subtopics with Delete */}
                  {liveTopic.subtopics && liveTopic.subtopics.length > 0 && (
                    <div className="space-y-1.5 mb-2 max-h-36 overflow-y-auto pr-1">
                      {liveTopic.subtopics.map((st, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-xs"
                        >
                          <span className="truncate text-[#191A17] dark:text-[#F5F5F7] font-medium">{st}</span>
                          <button
                            type="button"
                            onClick={() => deleteSubtopic(liveTopic.id, idx)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                            title="Remove subtopic"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Subtopic Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newSubtopicInput}
                      onChange={e => setNewSubtopicInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubtopicSubmit(e);
                        }
                      }}
                      placeholder="Add subtopic / checkpoint..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-xs font-medium text-[#191A17] dark:text-[#F5F5F7] focus:outline-none focus:border-[#596B35]"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubtopicSubmit}
                      className="px-3 py-1.5 rounded-xl bg-[#EEEEE8] dark:bg-[#23232A] hover:bg-[#596B35] hover:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D8D8CF] dark:border-[#272730]">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-xs font-semibold text-[#65675F] dark:text-[#A1A1AA] hover:text-[#191A17] dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#596B35] text-white text-xs font-bold hover:bg-[#4a5a2d] transition-colors cursor-pointer shadow-md shadow-[#596B35]/20"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Edit Saved Confirmation Notice */}
          {editSavedNotice && (
            <div className="px-4 sm:px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Topic details updated successfully!</span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center px-4 sm:px-6 pt-3 pb-0 border-b border-[#D8D8CF] dark:border-[#272730] bg-white dark:bg-[#18181D] gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Overview & Metrics', icon: BookOpen },
              {
                id: 'lectures',
                label: 'Lectures',
                icon: YoutubeIcon,
                badge: lecturesCount > 0 ? `${lecturesCount} Video` : null,
                badgeColor: 'bg-red-500'
              },
              {
                id: 'notes',
                label: 'Notes',
                icon: FileText,
                badge: (() => {
                  const items: string[] = [];
                  if (imagesCount > 0) items.push(`${imagesCount} 📸`);
                  if (pdfCount > 0) items.push(`${pdfCount} PDF`);
                  if (audioCount > 0) items.push(`${audioCount} 🎙️`);
                  return items.length > 0 ? items.join(' • ') : null;
                })(),
                badgeColor: 'bg-rose-500'
              },
              {
                id: 'mistakes',
                label: 'Mistake & Trap Journal',
                icon: ShieldAlert,
                badge: activeMistakesCount > 0 ? activeMistakesCount : null,
                badgeColor: 'bg-[#B94A48]'
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
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-[#596B35] text-[#596B35] dark:text-[#8B5CF6]'
                      : 'border-transparent text-[#65675F] dark:text-[#85877E] hover:text-[#11120F] dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono text-white ${tab.badgeColor || 'bg-[#B94A48]'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-5">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                
                {/* 1. TOPIC STATS HERO TILES (ACCURACY % & STUDY TIME) */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Accuracy Tile */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-1">
                    <span className="text-[10px] font-bold uppercase font-mono text-[#85877E] flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-[#596B35] dark:text-[#8B5CF6]" />
                      <span>Mock Accuracy</span>
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-[#11120F] dark:text-white font-mono">
                        {liveTopic.accuracy || 0}%
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        (liveTopic.accuracy || 0) >= 80
                          ? 'bg-[#4F7A45]/20 text-[#4F7A45]'
                          : (liveTopic.accuracy || 0) >= 60
                          ? 'bg-[#C49A3A]/20 text-[#C49A3A]'
                          : 'bg-[#B94A48]/20 text-[#B94A48]'
                      }`}>
                        {(liveTopic.accuracy || 0) >= 80 ? 'Mastered' : (liveTopic.accuracy || 0) >= 60 ? 'Moderate' : 'Needs Practice'}
                      </span>
                    </div>
                  </div>

                  {/* Study Time Tile */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-1">
                    <span className="text-[10px] font-bold uppercase font-mono text-[#85877E] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#596B35] dark:text-[#8B5CF6]" />
                      <span>Total Studied</span>
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-[#11120F] dark:text-white font-mono">
                        {liveTopic.studyTimeMinutes || 0}m
                      </span>
                      <span className="text-xs text-[#85877E] font-mono">
                        ({Math.round(((liveTopic.studyTimeMinutes || 0) / 60) * 10) / 10}h)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. ACCURACY CONTROLLER (SLIDER & PRESET CHIPS) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#596B35] dark:text-[#8B5CF6]" />
                      <span className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7] font-serif">
                        Update Mock Test Accuracy
                      </span>
                    </div>
                    {accuracySavedNotice && (
                      <span className="text-xs text-[#4F7A45] font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Saved!</span>
                      </span>
                    )}
                  </div>

                  {/* Accuracy Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold font-mono text-[#65675F] dark:text-[#A1A1AA]">
                      <span>0%</span>
                      <span className="text-sm font-extrabold text-[#596B35] dark:text-[#8B5CF6]">{accuracyInput}%</span>
                      <span>100%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={accuracyInput}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setAccuracyInput(val);
                        handleSaveAccuracy(val);
                      }}
                      className="w-full accent-[#596B35] cursor-pointer"
                    />
                  </div>

                  {/* Quick Preset Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {[
                      { label: '40% (Weak)', val: 40 },
                      { label: '65% (Avg)', val: 65 },
                      { label: '80% (Target)', val: 80 },
                      { label: '90% (Good)', val: 90 },
                      { label: '98% (Pro)', val: 98 }
                    ].map(chip => (
                      <button
                        key={chip.val}
                        type="button"
                        onClick={() => handleSaveAccuracy(chip.val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          liveTopic.accuracy === chip.val
                            ? 'bg-[#596B35] text-white'
                            : 'bg-[#F7F6F0] dark:bg-[#23232A] text-[#65675F] dark:text-[#A1A1AA] hover:bg-[#DCE8B7] dark:hover:bg-[#8B5CF6]/20'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. STUDY TIME LOGGER (+15M, +30M, STOPWATCH) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#596B35] dark:text-[#8B5CF6]" />
                      <span className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7] font-serif">
                        Log Study & Practice Time
                      </span>
                    </div>
                    {timeSavedNotice && (
                      <span className="text-xs text-[#4F7A45] font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Logged!</span>
                      </span>
                    )}
                  </div>

                  {/* 1-Click Quick Add Buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-[#85877E] uppercase font-mono block">
                      Quick Add Minutes to Topic:
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {[15, 30, 45, 60].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => handleAddStudyMinutes(mins)}
                          className="py-2 px-1 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] hover:bg-[#DCE8B7] dark:hover:bg-[#8B5CF6]/20 border border-[#D8D8CF] dark:border-[#272730] text-xs font-mono font-bold text-[#191A17] dark:text-[#F5F5F7] transition-all cursor-pointer active:scale-95 text-center"
                        >
                          +{mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Topic Stopwatch */}
                  <div className="p-3.5 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase font-mono text-[#85877E] block">
                        Live Stopwatch
                      </span>
                      <span className="text-lg font-mono font-extrabold text-[#11120F] dark:text-white">
                        {formatStopwatch(timerSeconds)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isTimerRunning ? (
                        <button
                          type="button"
                          onClick={() => setIsTimerRunning(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#11120F] dark:bg-white text-white dark:text-black text-xs font-bold shadow-sm cursor-pointer active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleStopAndLogStopwatch}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4F7A45] text-white text-xs font-bold shadow-sm cursor-pointer active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Save ({Math.max(1, Math.round(timerSeconds / 60))}m)</span>
                        </button>
                      )}

                      {timerSeconds > 0 && !isTimerRunning && (
                        <button
                          type="button"
                          onClick={() => setTimerSeconds(0)}
                          className="p-1.5 rounded-lg text-[#85877E] hover:text-[#B94A48] cursor-pointer"
                          title="Reset Stopwatch"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. PREPARATION STATUS SELECTOR */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-2.5">
                  <span className="text-[11px] font-bold text-[#85877E] uppercase font-mono block">
                    Preparation Status
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['not_started', 'in_progress', 'completed', 'weak'] as TopicStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          const targetAcc = st === 'completed' ? Math.max(85, liveTopic.accuracy || 85) : liveTopic.accuracy;
                          updateTopicStatus(liveTopic.id, st, targetAcc);
                          soundManager.playCompleteChime();
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          liveTopic.status === st
                            ? 'bg-[#11120F] dark:bg-white text-white dark:text-black border-transparent shadow-sm'
                            : 'bg-[#F7F6F0] dark:bg-[#23232A] text-[#65675F] dark:text-[#A1A1AA] border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35]'
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

                {/* 5. Subtopics Checklist */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-3">
                  <span className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7] block font-serif">
                    Subtopics & Concept Checklist
                  </span>
                  <div className="space-y-1.5">
                    {liveTopic.subtopics && liveTopic.subtopics.length > 0 ? (
                      liveTopic.subtopics.map((sub, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730]">
                          <span className="text-xs font-semibold text-[#191A17] dark:text-[#F5F5F7]">• {sub}</span>
                          <button
                            type="button"
                            onClick={() => deleteSubtopic(liveTopic.id, idx)}
                            className="text-xs text-[#85877E] hover:text-[#B94A48] p-1 cursor-pointer"
                            title="Delete Subtopic"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#85877E] italic py-1">No subtopics added yet.</p>
                    )}
                  </div>

                  <form onSubmit={handleAddSubtopicSubmit} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newSubtopicInput}
                      onChange={(e) => setNewSubtopicInput(e.target.value)}
                      placeholder="Add new subtopic..."
                      className="flex-1 px-3 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#23232A] border border-[#D8D8CF] dark:border-[#272730] text-xs font-medium focus:outline-none focus:border-[#596B35]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#11120F] dark:bg-white text-white dark:text-black hover:bg-[#596B35] dark:hover:bg-[#A4B879] text-xs font-bold cursor-pointer transition-all active:scale-95"
                    >
                      Add
                    </button>
                  </form>
                </div>

                {/* Danger Zone */}
                <div className="pt-4 border-t border-[#D8D8CF] dark:border-[#272730] flex justify-between items-center">
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="px-4 py-2 rounded-xl bg-[#B94A48] hover:bg-[#A33D3B] text-white text-xs font-bold cursor-pointer"
                      >
                        Yes, Delete Topic
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-2 rounded-xl bg-[#EEEEE8] dark:bg-[#23232A] text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
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

            {/* LECTURES TAB */}
            {activeTab === 'lectures' && (
              <div className="space-y-5">
                <TopicLecturesSection
                  topicId={liveTopic.id}
                  topicName={liveTopic.name}
                  lectures={liveTopic.lectures || []}
                  onAddLecture={(lecture) => {
                    if (addTopicLecture) {
                      addTopicLecture(liveTopic.id, lecture);
                    }
                  }}
                  onDeleteLecture={(lectureId) => {
                    if (deleteTopicLecture) {
                      deleteTopicLecture(liveTopic.id, lectureId);
                    }
                  }}
                />
              </div>
            )}

            {/* NOTES TAB */}
            {activeTab === 'notes' && (
              <div className="space-y-5">
                <ProfessionalNotesEditor
                  initialContent={notes}
                  onSave={handleSaveNotes}
                  topicName={liveTopic.name}
                  subjectName={subjectName}
                  chapterName={chapterName}
                  examName={currentExam?.name}
                  onOpenSplitPdf={() => {
                    setSplitPdfAttachmentId(undefined);
                    setIsSplitPdfOpen(true);
                  }}
                  hasPdfAttachments={(liveTopic.pdfAttachments?.length || 0) > 0}
                  images={liveTopic.images || []}
                  onAddImage={(img) => {
                    if (addTopicImageAttachment) {
                      addTopicImageAttachment(liveTopic.id, img);
                    }
                  }}
                  onDeleteImage={(imgId) => {
                    if (deleteTopicImageAttachment) {
                      deleteTopicImageAttachment(liveTopic.id, imgId);
                    }
                  }}
                />

                <TopicAudioMemosSection
                  topicId={liveTopic.id}
                  topicName={liveTopic.name}
                  audioMemos={liveTopic.audioMemos || []}
                  onAddAudioMemo={(memo) => {
                    if (addTopicAudioMemo) {
                      addTopicAudioMemo(liveTopic.id, memo);
                    }
                  }}
                  onDeleteAudioMemo={(memoId) => {
                    if (deleteTopicAudioMemo) {
                      deleteTopicAudioMemo(liveTopic.id, memoId);
                    }
                  }}
                  onInsertTranscriptToNotes={(text) => {
                    const updated = notes ? notes + '\n' + text : text;
                    setNotes(updated);
                    handleSaveNotes(updated);
                  }}
                />

                <TopicPdfAttachmentsSection
                  topicId={liveTopic.id}
                  topicName={liveTopic.name}
                  attachments={liveTopic.pdfAttachments || []}
                  onAddAttachment={(newAttachment) => {
                    if (addTopicPdfAttachment) {
                      addTopicPdfAttachment(liveTopic.id, newAttachment);
                    }
                  }}
                  onDeleteAttachment={(attachmentId) => {
                    if (deleteTopicPdfAttachment) {
                      deleteTopicPdfAttachment(liveTopic.id, attachmentId);
                    }
                  }}
                  onOpenSplitStudy={(attachmentId) => {
                    setSplitPdfAttachmentId(attachmentId);
                    setIsSplitPdfOpen(true);
                  }}
                />
              </div>
            )}

            {/* ADVANCED MISTAKES & TRAPS TAB */}
            {activeTab === 'mistakes' && (
              <AdvancedMistakeJournal
                topic={liveTopic}
                subjectName={subjectName}
                chapterName={chapterName}
              />
            )}

          </div>
        </div>
      </div>

      {/* IN-APP SPLIT-SCREEN PDF STUDY MODAL */}
      {isSplitPdfOpen && (
        <SplitScreenPdfStudyModal
          isOpen={isSplitPdfOpen}
          onClose={() => setIsSplitPdfOpen(false)}
          topicName={liveTopic.name}
          subjectName={subjectName}
          chapterName={chapterName}
          initialNotes={notes}
          attachments={liveTopic.pdfAttachments || []}
          initialAttachmentId={splitPdfAttachmentId}
          onSaveNotes={handleSaveNotes}
          images={liveTopic.images || []}
          onAddImage={(img) => {
            if (addTopicImageAttachment) {
              addTopicImageAttachment(liveTopic.id, img);
            }
          }}
          onDeleteImage={(imgId) => {
            if (deleteTopicImageAttachment) {
              deleteTopicImageAttachment(liveTopic.id, imgId);
            }
          }}
        />
      )}
    </div>
  );
};
