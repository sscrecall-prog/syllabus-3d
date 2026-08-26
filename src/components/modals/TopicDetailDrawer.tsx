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
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'mistakes'>('overview');

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<DifficultyLevel>('Medium');
  const [editWeightage, setEditWeightage] = useState(4);
  const [newSubtopicInput, setNewSubtopicInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accuracySavedNotice, setAccuracySavedNotice] = useState(false);
  const [timeSavedNotice, setTimeSavedNotice] = useState(false);
  const [editSavedNotice, setEditSavedNotice] = useState(false);

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
      setEditWeightage(liveTopic.weightage || 4);
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
      weightage: Math.max(1, Math.min(10, Number(editWeightage)))
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

  // Format Stopwatch Display
  const formatStopwatch = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
                    : 'bg-[#F7F6F0] dark:bg-[#1D201A] border-[#D8D8CF] dark:border-[#30342B] text-[#65675F] hover:text-[#11120F] dark:hover:text-white hover:border-[#596B35]'
                }`}
                title={isEditing ? 'Close Edit Form' : 'Edit Topic Information'}
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-[#85877E] hover:text-[#11120F] dark:hover:text-white transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* EDIT TOPIC FORM BANNER (INSTANTLY VISIBLE WHEN PENCIL IS CLICKED) */}
          {isEditing && (
            <div className="p-4 sm:p-5 bg-white dark:bg-[#151713] border-b border-[#596B35]/40 shadow-md animate-fade-in space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#596B35]/15 text-[#596B35] dark:text-[#A4B879] flex items-center justify-center">
                    <Edit3 className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-[#11120F] dark:text-[#F4F4ED] uppercase font-mono tracking-wider">
                    Edit Topic Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-[#85877E] hover:text-[#11120F] dark:hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveTopicDetails} className="space-y-3">
                {/* Topic Name */}
                <div>
                  <label className="block text-[11px] font-bold text-[#65675F] dark:text-[#A7AA9C] mb-1 uppercase font-mono">
                    Topic Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Enter topic name..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-xs font-bold text-[#11120F] dark:text-white focus:outline-none focus:border-[#596B35] focus:ring-1 focus:ring-[#596B35]"
                    required
                    autoFocus
                  />
                </div>

                {/* Difficulty & Weightage Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Difficulty Selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#65675F] dark:text-[#A7AA9C] mb-1 uppercase font-mono">
                      Difficulty Level
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map(diff => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setEditDifficulty(diff)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-center ${
                            editDifficulty === diff
                              ? diff === 'Easy'
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                : diff === 'Medium'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                : 'bg-rose-500 text-white border-rose-500 shadow-sm'
                              : 'bg-[#F7F6F0] dark:bg-[#1D201A] text-[#65675F] dark:text-[#A7AA9C] border-[#D8D8CF] dark:border-[#30342B]'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weightage Marks */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#65675F] dark:text-[#A7AA9C] mb-1 uppercase font-mono">
                      Weightage (1 - 10 Marks)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editWeightage}
                      onChange={e => setEditWeightage(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-xs font-bold text-[#11120F] dark:text-white focus:outline-none focus:border-[#596B35]"
                    />
                  </div>
                </div>

                {/* Save / Cancel buttons */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#85877E] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#596B35] hover:bg-[#4d5e2e] text-white text-xs font-bold shadow-md shadow-[#596B35]/20 transition-all cursor-pointer active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
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
          <div className="flex items-center px-4 sm:px-6 pt-3 pb-0 border-b border-[#D8D8CF] dark:border-[#30342B] bg-white dark:bg-[#151713] gap-2">
            {[
              { id: 'overview', label: 'Overview & Metrics', icon: BookOpen },
              {
                id: 'notes',
                label: 'Academic Notes',
                icon: FileText,
                badge: pdfCount > 0 ? `${pdfCount} PDF` : null,
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
                  className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'border-[#596B35] text-[#596B35] dark:text-[#A4B879]'
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
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-subtle-depth space-y-1">
                    <span className="text-[10px] font-bold uppercase font-mono text-[#85877E] flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-[#596B35] dark:text-[#A4B879]" />
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
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-subtle-depth space-y-1">
                    <span className="text-[10px] font-bold uppercase font-mono text-[#85877E] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#596B35] dark:text-[#A4B879]" />
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
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-subtle-depth space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#596B35] dark:text-[#A4B879]" />
                      <span className="text-xs font-bold text-[#11120F] dark:text-[#F4F4ED] font-serif">
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
                    <div className="flex justify-between text-xs font-bold font-mono text-[#65675F] dark:text-[#A7AA9C]">
                      <span>0%</span>
                      <span className="text-sm font-extrabold text-[#596B35] dark:text-[#A4B879]">{accuracyInput}%</span>
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
                            : 'bg-[#F7F6F0] dark:bg-[#1D201A] text-[#65675F] dark:text-[#A7AA9C] hover:bg-[#DCE8B7] dark:hover:bg-[#354126]'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. STUDY TIME LOGGER (+15M, +30M, STOPWATCH) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-subtle-depth space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#596B35] dark:text-[#A4B879]" />
                      <span className="text-xs font-bold text-[#11120F] dark:text-[#F4F4ED] font-serif">
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
                          className="py-2 px-1 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] hover:bg-[#DCE8B7] dark:hover:bg-[#354126] border border-[#D8D8CF] dark:border-[#30342B] text-xs font-mono font-bold text-[#191A17] dark:text-[#F4F4ED] transition-all cursor-pointer active:scale-95 text-center"
                        >
                          +{mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Topic Stopwatch */}
                  <div className="p-3.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] flex items-center justify-between">
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
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-subtle-depth space-y-2.5">
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

                {/* 5. Subtopics Checklist */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-subtle-depth space-y-3">
                  <span className="text-xs font-bold text-[#11120F] dark:text-[#F4F4ED] block font-serif">
                    Subtopics & Concept Checklist
                  </span>
                  <div className="space-y-1.5">
                    {liveTopic.subtopics && liveTopic.subtopics.length > 0 ? (
                      liveTopic.subtopics.map((sub, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B]">
                          <span className="text-xs font-semibold text-[#191A17] dark:text-[#F4F4ED]">• {sub}</span>
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
                      className="flex-1 px-3 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-xs font-medium focus:outline-none focus:border-[#596B35]"
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
                <div className="pt-4 border-t border-[#D8D8CF] dark:border-[#30342B] flex justify-between items-center">
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
                        className="px-3 py-2 rounded-xl bg-[#EEEEE8] dark:bg-[#1D201A] text-xs font-semibold cursor-pointer"
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
    </div>
  );
};
