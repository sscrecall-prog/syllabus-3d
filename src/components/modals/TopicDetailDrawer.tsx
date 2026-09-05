import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Topic, TopicStatus, DifficultyLevel, TopicPdfAttachment, TopicNoteItem } from '../../types/syllabus';
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
  Trash2,
  Plus,
  Edit3,
  Check,
  ListPlus,
  Sparkles,
  Circle,
  AlertTriangle,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { ProfessionalNotesEditor } from '../common/ProfessionalNotesEditor';
import { AdvancedMistakeJournal } from '../mistakes/AdvancedMistakeJournal';
import { TopicPdfAttachmentsSection } from '../common/TopicPdfAttachmentsSection';
import { TopicLecturesSection, YoutubeIcon } from '../common/TopicLecturesSection';
import { TopicAudioMemosSection } from '../common/TopicAudioMemosSection';
import { SplitScreenPdfStudyModal } from '../common/SplitScreenPdfStudyModal';
import { SplitScreenLectureStudyModal } from '../common/SplitScreenLectureStudyModal';
import { StatusBadge } from '../common/StatusBadge';
import { ViewErrorBoundary } from '../common/ViewErrorBoundary';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

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
    addMultipleSubtopics,
    deleteSubtopic,
    updateTopicMetrics,
    addTopicPdfAttachment,
    deleteTopicPdfAttachment,
    addTopicLecture,
    deleteTopicLecture,
    addLectureTimestamp,
    deleteLectureTimestamp,
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

  // Subtopics Mode state (Single vs Bulk Multi-Subtopic)
  const [subtopicMode, setSubtopicMode] = useState<'single' | 'bulk'>('single');
  const [bulkSubtopicsInput, setBulkSubtopicsInput] = useState('');

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

  // In-App Split-Screen Lecture Timestamp Sync state
  const [isSplitLectureOpen, setIsSplitLectureOpen] = useState(false);
  const [splitLectureId, setSplitLectureId] = useState<string | undefined>(undefined);
  const [splitLectureSeekSeconds, setSplitLectureSeekSeconds] = useState<number>(0);

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

  // Mobile Swipe-Down to Dismiss Touch Gesture State
  const touchStartY = useRef<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setDragOffsetY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffsetY > 85) {
      soundManager.playClick();
      haptics.light();
      onClose();
    }
    setDragOffsetY(0);
    touchStartY.current = null;
  };

  // ─────────────────────────────────────────────────────────────
  // Mobile Horizontal Swipe Navigation between Drawer Tabs
  // (e.g. Overview & Metrics ⇄ Lectures ⇄ Notes & PDF ⇄ Mistakes)
  // ─────────────────────────────────────────────────────────────
  const DRAWER_TABS: Array<'overview' | 'lectures' | 'notes' | 'mistakes'> = useMemo(
    () => ['overview', 'lectures', 'notes', 'mistakes'],
    []
  );

  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');

  const switchTab = useCallback((targetTab: 'overview' | 'lectures' | 'notes' | 'mistakes') => {
    if (targetTab === activeTab) return;
    const currentIdx = DRAWER_TABS.indexOf(activeTab);
    const targetIdx = DRAWER_TABS.indexOf(targetTab);
    setSlideDirection(targetIdx > currentIdx ? 'forward' : 'backward');
    soundManager.playClick();
    haptics.selection();
    setActiveTab(targetTab);
  }, [activeTab, DRAWER_TABS]);

  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const swipeStartTime = useRef<number>(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  // Helper to prevent swipe from hijacking form inputs, sliders, audio/video controls, or text selection
  const isInteractiveTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(
      target.closest(
        'input, textarea, select, button, a, [contenteditable="true"], [role="slider"], .no-swipe, [data-no-swipe], audio, video, iframe'
      )
    );
  };

  const handleContentTouchStart = (e: React.TouchEvent) => {
    if (isInteractiveTarget(e.target)) {
      swipeStartX.current = null;
      swipeStartY.current = null;
      isHorizontalSwipe.current = false;
      return;
    }

    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
    swipeStartTime.current = Date.now();
    isHorizontalSwipe.current = null;
  };

  const handleContentTouchMove = (e: React.TouchEvent) => {
    if (swipeStartX.current === null || swipeStartY.current === null) return;

    const diffX = e.touches[0].clientX - swipeStartX.current;
    const diffY = e.touches[0].clientY - swipeStartY.current;

    // Detect direction once movement threshold is crossed
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        if (Math.abs(diffX) > Math.abs(diffY) * 1.25) {
          isHorizontalSwipe.current = true;
        } else {
          isHorizontalSwipe.current = false;
        }
      }
    }
  };

  const handleContentTouchEnd = (e: React.TouchEvent) => {
    if (
      isHorizontalSwipe.current === true &&
      swipeStartX.current !== null &&
      e.changedTouches.length > 0
    ) {
      const diffX = e.changedTouches[0].clientX - swipeStartX.current;
      const duration = Date.now() - swipeStartTime.current;

      const isFastFlick = duration < 350 && Math.abs(diffX) > 30;
      const isNormalSwipe = Math.abs(diffX) > 45;

      if (isFastFlick || isNormalSwipe) {
        const currentIdx = DRAWER_TABS.indexOf(activeTab);

        if (diffX < 0) {
          // Swiped Left -> Go to Next Tab (e.g. Overview -> Lectures)
          if (currentIdx < DRAWER_TABS.length - 1) {
            switchTab(DRAWER_TABS[currentIdx + 1]);
          }
        } else if (diffX > 0) {
          // Swiped Right -> Go to Previous Tab (e.g. Lectures -> Overview)
          if (currentIdx > 0) {
            switchTab(DRAWER_TABS[currentIdx - 1]);
          }
        }
      }
    }

    swipeStartX.current = null;
    swipeStartY.current = null;
    isHorizontalSwipe.current = null;
  };

  // Auto-scroll the tab bar horizontally so the active tab stays centered in view
  useEffect(() => {
    if (tabBarRef.current) {
      const activeBtn = tabBarRef.current.querySelector<HTMLElement>(`[data-tab-id="${activeTab}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeTab]);

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

  const handleSaveNotes = (newNotes: string, noteItems?: TopicNoteItem[]) => {
    setNotes(newNotes);
    updateTopicNotes(liveTopic.id, newNotes, noteItems);
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

  // Computed parsed bulk subtopics from multi-line text input
  const parsedBulkSubtopics = useMemo(() => {
    return bulkSubtopicsInput
      .split(/[\n,]/)
      .map(line => line.trim().replace(/^[•*]\s*/, '').trim())
      .filter(line => line.length > 0);
  }, [bulkSubtopicsInput]);

  const handleAddBulkSubtopics = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (parsedBulkSubtopics.length === 0) return;
    
    if (addMultipleSubtopics) {
      addMultipleSubtopics(liveTopic.id, parsedBulkSubtopics);
    } else {
      parsedBulkSubtopics.forEach(st => addSubtopic(liveTopic.id, st));
    }

    setBulkSubtopicsInput('');
    soundManager.playCompleteChime();
  };

  const handleAddSubtopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtopicInput.trim()) return;

    // If user enters multiple comma/newline separated subtopics in the single box
    if (newSubtopicInput.includes(',') || newSubtopicInput.includes('\n')) {
      const parts = newSubtopicInput
        .split(/[\n,]/)
        .map(s => s.trim().replace(/^[•*]\s*/, '').trim())
        .filter(Boolean);
      if (parts.length > 0) {
        if (addMultipleSubtopics) {
          addMultipleSubtopics(liveTopic.id, parts);
        } else {
          parts.forEach(p => addSubtopic(liveTopic.id, p));
        }
        setNewSubtopicInput('');
        soundManager.playCompleteChime();
        return;
      }
    }

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

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end">
      {/* Explicit Dark Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in pointer-events-auto transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 max-w-full flex pl-0 sm:pl-10 pointer-events-auto">
        <div
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          style={{
            transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
            transition: dragOffsetY === 0 ? 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none'
          }}
          className="w-screen max-w-2xl bg-white dark:bg-[#0B0B0D] border-l border-[#E2E8F0] dark:border-[#272730] shadow-2xl flex flex-col justify-between transition-colors rounded-t-3xl sm:rounded-t-none"
        >
          
          {/* Mobile Pull-Down Drag Handle with Safe-Area Notch Clearance */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="sm:hidden pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-1 flex items-center justify-center cursor-grab active:cursor-grabbing bg-white dark:bg-[#18181D] select-none"
          >
            <div className="w-12 h-1.5 rounded-full bg-[#CBD5E1] dark:bg-[#475569] active:scale-95 transition-transform" />
          </div>
          {/* Header */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="p-4 sm:p-6 border-b border-[#E2E8F0] dark:border-[#272730] bg-white dark:bg-[#18181D] flex items-center justify-between gap-4 relative overflow-hidden"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2563EB] dark:text-[#7AA2F7]">
                <span>{subjectName || 'Subject'}</span>
                <span>•</span>
                <span className="truncate">{chapterName || 'Chapter'}</span>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap mt-1">
                <h2 className="text-lg sm:text-2xl font-black text-[#11120F] dark:text-[#F5F5F7] tracking-tight uppercase truncate">
                  {liveTopic.name}
                </h2>
                <StatusBadge status={liveTopic.status || 'not_started'} size="sm" />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setIsEditing(p => !p);
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
                  isEditing
                    ? 'bg-[#11120F] dark:bg-white text-white dark:text-black border-transparent shadow-xs'
                    : 'bg-[#F8FAFC] dark:bg-[#20212E] border-[#E2E8F0] dark:border-[#272730] text-[#65675F] hover:text-[#11120F] dark:hover:text-white hover:border-[#2563EB] dark:hover:border-[#7AA2F7]'
                }`}
                title={isEditing ? 'Close Edit Form' : 'Edit Topic Parameters'}
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#20212E] border border-[#E2E8F0] dark:border-[#272730] text-[#65675F] hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center justify-center active:scale-95"
                title="Close Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* EDIT TOPIC FORM PANEL (Appears directly beneath header when pencil is clicked) */}
          {isEditing && (
            <div className="p-4 sm:p-6 bg-white dark:bg-[#18181D] border-b-2 border-[#2563EB] dark:border-[#7AA2F7] shadow-md animate-fade-in">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E2E8F0] dark:border-[#272730]">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2563EB] dark:text-[#7AA2F7]">
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Topic Parameters</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-mono text-[#85877E] hover:text-[#11120F] dark:hover:text-white cursor-pointer"
                >
                  Close Form ✕
                </button>
              </div>

              <form onSubmit={handleSaveTopicDetails} className="space-y-3.5">
                {/* Topic Name */}
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#191A17] dark:text-[#F5F5F7] mb-1">
                    Topic Title
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] text-xs sm:text-sm font-bold text-[#191A17] dark:text-[#F5F5F7] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#7AA2F7]"
                    placeholder="Topic Name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Difficulty */}
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#191A17] dark:text-[#F5F5F7] mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={editDifficulty}
                      onChange={e => setEditDifficulty(e.target.value as DifficultyLevel)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#7AA2F7]"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  {/* Weightage Marks (Optional) */}
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#191A17] dark:text-[#F5F5F7] mb-1">
                      Weightage Marks <span className="text-[10px] text-[#85877E] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editWeightage !== undefined ? editWeightage : ''}
                      onChange={e => setEditWeightage(e.target.value === '' ? undefined : Number(e.target.value))}
                      placeholder="e.g. 4 (optional)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#7AA2F7]"
                    />
                  </div>
                </div>

                {/* Subtopics Checklist Management */}
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#191A17] dark:text-[#F5F5F7] mb-1">
                    Subtopics & Concept Checkpoints ({liveTopic.subtopics ? liveTopic.subtopics.length : 0})
                  </label>
                  
                  {/* Existing Subtopics with Delete */}
                  {liveTopic.subtopics && liveTopic.subtopics.length > 0 && (
                    <div className="space-y-1.5 mb-2 max-h-36 overflow-y-auto pr-1">
                      {liveTopic.subtopics.map((st, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] text-xs"
                        >
                          <span className="truncate text-[#191A17] dark:text-[#F5F5F7] font-semibold">{st}</span>
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
                      placeholder="Add subtopic (or comma-separated values)..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] text-xs font-medium text-[#191A17] dark:text-[#F5F5F7] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#7AA2F7]"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubtopicSubmit}
                      className="px-4 py-2 rounded-xl bg-[#11120F] dark:bg-white text-white dark:text-black hover:bg-[#2563EB] dark:hover:bg-[#7AA2F7] text-xs font-bold transition-colors cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#272730]">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#20212E] border border-[#E2E8F0] dark:border-[#272730] text-xs font-bold text-[#65675F] dark:text-[#A1A1AA] hover:text-[#191A17] dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#11120F] dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-xs active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Edit Saved Confirmation Notice */}
          {editSavedNotice && (
            <div className="px-4 sm:px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Topic details updated successfully!</span>
            </div>
          )}

          {/* Tab Navigation */}
          <div
            ref={tabBarRef}
            className="flex items-center px-4 sm:px-6 pt-2 pb-0 border-b border-[#E2E8F0] dark:border-[#272730] bg-white dark:bg-[#18181D] gap-1 overflow-x-auto no-scrollbar"
          >
            {[
              { id: 'overview', label: 'Overview & Metrics', icon: BookOpen },
              {
                id: 'lectures',
                label: 'Lectures',
                icon: YoutubeIcon,
                badge: lecturesCount > 0 ? `${lecturesCount} Video` : null,
                badgeColor: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
              },
              {
                id: 'notes',
                label: 'Notes & PDF',
                icon: FileText,
                badge: (() => {
                  const items: string[] = [];
                  if (pdfCount > 0) items.push(`${pdfCount} PDF`);
                  if (imagesCount > 0) items.push(`${imagesCount} Img`);
                  if (audioCount > 0) items.push(`${audioCount} Memos`);
                  return items.length > 0 ? items.join(' • ') : null;
                })(),
                badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              },
              {
                id: 'mistakes',
                label: 'Mistake & Trap Journal',
                icon: ShieldAlert,
                badge: activeMistakesCount > 0 ? `${activeMistakesCount} active` : null,
                badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
              }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-tab-id={tab.id}
                  onClick={() => switchTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-3 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-[#11120F] dark:border-white text-[#11120F] dark:text-white font-black'
                      : 'border-transparent text-[#65675F] dark:text-[#94A3B8] hover:text-[#11120F] dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${tab.badgeColor}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile Swipe Navigation Indicator Bar */}
          <div className="sm:hidden flex items-center justify-between px-4 py-1.5 bg-[#F8FAFC] dark:bg-[#12131F] border-b border-[#E2E8F0]/60 dark:border-[#272730]/60 text-[11px] font-mono text-[#65675F] dark:text-[#94A3B8] select-none">
            <button
              type="button"
              disabled={activeTab === 'overview'}
              onClick={() => {
                const idx = DRAWER_TABS.indexOf(activeTab);
                if (idx > 0) {
                  switchTab(DRAWER_TABS[idx - 1]);
                }
              }}
              className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg border transition-all ${
                activeTab === 'overview'
                  ? 'opacity-30 border-transparent cursor-not-allowed'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 border-[#E2E8F0] dark:border-[#272730] text-[#191A17] dark:text-[#F5F5F7] cursor-pointer active:scale-95'
              }`}
              title="Previous Tab (Swipe Right)"
            >
              <span>‹ Prev</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#2563EB] dark:text-[#7AA2F7]">
                Swipe ‹ › to navigate
              </span>
              <div className="flex items-center gap-1">
                {DRAWER_TABS.map(t => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => switchTab(t)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      activeTab === t
                        ? 'w-4 bg-[#2563EB] dark:bg-[#7AA2F7]'
                        : 'w-1.5 bg-[#CBD5E1] dark:bg-[#383A52] hover:bg-[#94A3B8]'
                    }`}
                    title={`Switch to ${t}`}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={activeTab === 'mistakes'}
              onClick={() => {
                const idx = DRAWER_TABS.indexOf(activeTab);
                if (idx < DRAWER_TABS.length - 1) {
                  switchTab(DRAWER_TABS[idx + 1]);
                }
              }}
              className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg border transition-all ${
                activeTab === 'mistakes'
                  ? 'opacity-30 border-transparent cursor-not-allowed'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 border-[#E2E8F0] dark:border-[#272730] text-[#191A17] dark:text-[#F5F5F7] cursor-pointer active:scale-95'
              }`}
              title="Next Tab (Swipe Left)"
            >
              <span>Next ›</span>
            </button>
          </div>

          {/* Content Area with Touch Handlers for Smooth Swipe Navigation */}
          <div
            onTouchStart={handleContentTouchStart}
            onTouchMove={handleContentTouchMove}
            onTouchEnd={handleContentTouchEnd}
            className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-5 overscroll-contain pb-[max(2.5rem,env(safe-area-inset-bottom,0px))]"
          >
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div key="overview" className={`space-y-4 sm:space-y-5 ${slideDirection === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
                
                {/* 1. TOPIC STATS HERO TILES (ACCURACY % & STUDY TIME) */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Accuracy Tile */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-2 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60" />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#85877E] flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Mock Accuracy</span>
                      </span>
                      <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-lg border ${
                        (liveTopic.accuracy || 0) >= 80
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                          : (liveTopic.accuracy || 0) >= 60
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25'
                      }`}>
                        {(liveTopic.accuracy || 0) >= 80 ? 'Mastered' : (liveTopic.accuracy || 0) >= 60 ? 'Moderate' : 'Needs Practice'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-[#11120F] dark:text-white font-mono tabular-nums">
                        {liveTopic.accuracy || 0}%
                      </span>
                    </div>
                  </div>

                  {/* Study Time Tile */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-2 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-60" />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#85877E] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Total Studied</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#85877E]">
                        {Math.round(((liveTopic.studyTimeMinutes || 0) / 60) * 10) / 10}h Logged
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-[#11120F] dark:text-white font-mono tabular-nums">
                        {liveTopic.studyTimeMinutes || 0}m
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. ACCURACY CONTROLLER (SLIDER & PRESET CHIPS) */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 flex items-center justify-center shrink-0">
                        <Target className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-[13px] font-black text-[#11120F] dark:text-[#F5F5F7] uppercase tracking-tight block">
                          Update Mock Test Accuracy
                        </span>
                        <span className="text-[10px] text-[#85877E] font-mono">
                          Calibrate question accuracy from latest PYQ mock test
                        </span>
                      </div>
                    </div>
                    {accuracySavedNotice && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Saved!</span>
                      </span>
                    )}
                  </div>

                  {/* Accuracy Slider */}
                  <div className="space-y-1.5 p-3 rounded-2xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#242533]">
                    <div className="flex justify-between text-xs font-mono font-bold text-[#65675F] dark:text-[#A1A1AA]">
                      <span>0%</span>
                      <span className="text-sm font-mono font-black text-cyan-600 dark:text-cyan-400 tabular-nums px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        {accuracyInput}%
                      </span>
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
                      className="w-full accent-cyan-500 cursor-pointer"
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border active:scale-95 ${
                          liveTopic.accuracy === chip.val
                            ? 'bg-[#11120F] dark:bg-white text-white dark:text-black border-transparent shadow-xs font-black'
                            : 'bg-[#F8FAFC] dark:bg-[#14151F] text-[#65675F] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#272730] hover:border-cyan-500'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. STUDY TIME LOGGER (+15M, +30M, STOPWATCH) */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-[13px] font-black text-[#11120F] dark:text-[#F5F5F7] uppercase tracking-tight block">
                          Log Study & Practice Time
                        </span>
                        <span className="text-[10px] text-[#85877E] font-mono">
                          Add sprint minutes or track live study with built-in stopwatch
                        </span>
                      </div>
                    </div>
                    {timeSavedNotice && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Logged!</span>
                      </span>
                    )}
                  </div>

                  {/* 1-Click Quick Add Buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-[#85877E] uppercase tracking-wider block">
                      Quick Add Minutes to Topic:
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {[15, 30, 45, 60].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => handleAddStudyMinutes(mins)}
                          className="py-2.5 px-1 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] hover:bg-[#11120F] hover:text-white dark:hover:bg-white dark:hover:text-black border border-[#E2E8F0] dark:border-[#272730] text-xs font-mono font-bold text-[#191A17] dark:text-[#F5F5F7] transition-all cursor-pointer active:scale-95 text-center shadow-2xs"
                        >
                          +{mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Topic Stopwatch */}
                  <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#85877E] block">
                        Live Stopwatch
                      </span>
                      <span className="text-xl font-mono tabular-nums font-black text-[#11120F] dark:text-white">
                        {formatStopwatch(timerSeconds)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isTimerRunning ? (
                        <button
                          type="button"
                          onClick={() => setIsTimerRunning(true)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#11120F] dark:bg-white text-white dark:text-black text-xs font-black shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleStopAndLogStopwatch}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Save ({Math.max(1, Math.round(timerSeconds / 60))}m)</span>
                        </button>
                      )}

                      {timerSeconds > 0 && !isTimerRunning && (
                        <button
                          type="button"
                          onClick={() => setTimerSeconds(0)}
                          className="p-2 rounded-xl text-[#85877E] hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                          title="Reset Stopwatch"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. PREPARATION STATUS SELECTOR */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-3">
                  <span className="text-[10px] font-mono font-bold text-[#85877E] uppercase tracking-wider block">
                    Preparation Status
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'not_started', label: 'Not Started', icon: Circle, activeClasses: 'bg-slate-700 text-white border-transparent shadow-xs font-black' },
                      { id: 'in_progress', label: 'In Progress', icon: Zap, activeClasses: 'bg-amber-500 text-white border-transparent shadow-xs shadow-amber-500/25 font-black' },
                      { id: 'completed', label: 'Mastered', icon: CheckCircle2, activeClasses: 'bg-emerald-600 text-white border-transparent shadow-xs shadow-emerald-600/25 font-black' },
                      { id: 'weak', label: 'Weak Topic', icon: AlertTriangle, activeClasses: 'bg-rose-600 text-white border-transparent shadow-xs shadow-rose-600/25 font-black' },
                    ].map((st) => {
                      const StatusIcon = st.icon;
                      const isSelected = (liveTopic.status || 'not_started') === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            const targetAcc = st.id === 'completed' ? Math.max(85, liveTopic.accuracy || 85) : liveTopic.accuracy;
                            updateTopicStatus(liveTopic.id, st.id as TopicStatus, targetAcc);
                            soundManager.playCompleteChime();
                            if (st.id === 'completed') {
                              haptics.success();
                            } else {
                              haptics.medium();
                            }
                          }}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 active:scale-95 ${
                            isSelected
                              ? st.activeClasses
                              : 'bg-[#F8FAFC] dark:bg-[#14151F] text-[#65675F] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#272730] hover:border-[#2563EB] dark:hover:border-[#7AA2F7]'
                          }`}
                        >
                          <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{st.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Subtopics Checklist */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-3.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-black text-[#11120F] dark:text-[#F5F5F7] uppercase tracking-tight">
                        Subtopics & Concept Checklist
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#2563EB]/15 dark:bg-[#7AA2F7]/20 text-[#2563EB] dark:text-[#7AA2F7] border border-[#2563EB]/20 dark:border-[#7AA2F7]/30">
                        {liveTopic.subtopics ? liveTopic.subtopics.length : 0}
                      </span>
                    </div>

                    {/* Mode Toggle Switch (Single vs Bulk Multi-Subtopic) */}
                    <div className="flex items-center rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] p-1 border border-[#E2E8F0] dark:border-[#272730]">
                      <button
                        type="button"
                        onClick={() => {
                          setSubtopicMode('single');
                          soundManager.playClick();
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          subtopicMode === 'single'
                            ? 'bg-white dark:bg-[#18181D] text-[#11120F] dark:text-white shadow-xs font-black'
                            : 'text-[#65675F] dark:text-[#94A3B8] hover:text-[#11120F] dark:hover:text-white'
                        }`}
                      >
                        Single
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSubtopicMode('bulk');
                          soundManager.playClick();
                        }}
                        className={`flex items-center gap-1 px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                          subtopicMode === 'bulk'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                            : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Bulk (Multiple)</span>
                      </button>
                    </div>
                  </div>

                  {/* Existing Subtopics List */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-0.5">
                    {liveTopic.subtopics && liveTopic.subtopics.length > 0 ? (
                      liveTopic.subtopics.map((sub, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] hover:border-[#2563EB]/40 dark:hover:border-[#7AA2F7]/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-[#7AA2F7] shrink-0" />
                            <span className="text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] truncate">{sub}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteSubtopic(liveTopic.id, idx)}
                            className="text-xs text-[#85877E] hover:text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Delete Subtopic"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#85877E] font-mono italic py-1">No subtopics added yet.</p>
                    )}
                  </div>

                  {/* Input Form based on Mode */}
                  {subtopicMode === 'single' ? (
                    <div className="space-y-1.5 pt-1">
                      <form onSubmit={handleAddSubtopicSubmit} className="flex gap-2">
                        <input
                          type="text"
                          value={newSubtopicInput}
                          onChange={(e) => setNewSubtopicInput(e.target.value)}
                          placeholder="Add subtopic (or comma-separated like: Intro, PYQs, Mock)..."
                          className="flex-1 px-3.5 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#14151F] border border-[#E2E8F0] dark:border-[#272730] text-xs font-semibold focus:outline-none focus:border-[#2563EB] dark:focus:border-[#7AA2F7] text-[#11120F] dark:text-white placeholder-[#85877E]"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-[#11120F] dark:bg-white text-white dark:text-black hover:bg-[#2563EB] dark:hover:bg-[#7AA2F7] text-xs font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 shrink-0"
                        >
                          + Add
                        </button>
                      </form>
                    </div>
                  ) : (
                    /* BULK MULTI-SUBTOPIC MODE */
                    <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#14151F] border border-amber-500/30 space-y-3 pt-3 animate-fade-in">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#11120F] dark:text-[#F5F5F7] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Paste Multiple Subtopics (One per line or Comma-separated):</span>
                        </span>
                        {parsedBulkSubtopics.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px] border border-emerald-500/30">
                            ✓ {parsedBulkSubtopics.length} Ready
                          </span>
                        )}
                      </div>

                      <textarea
                        value={bulkSubtopicsInput}
                        onChange={(e) => setBulkSubtopicsInput(e.target.value)}
                        placeholder={`Paste multiple subtopics here:\nBasic Concepts & Formulas\nShortcut Techniques\nPYQ Solved Examples\nMock Test Practice\nRevision Formula Sheet`}
                        rows={4}
                        className="w-full p-3 rounded-xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] text-xs font-mono font-medium text-[#171717] dark:text-white focus:ring-2 focus:ring-amber-500 leading-relaxed placeholder-[#85877E]"
                      />

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSubtopicMode('single');
                            setBulkSubtopicsInput('');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] text-xs font-bold text-[#65675F] dark:text-[#A9B1D6] hover:text-[#11120F] dark:hover:text-white cursor-pointer"
                        >
                          Switch to Single Mode
                        </button>

                        <button
                          type="button"
                          disabled={parsedBulkSubtopics.length === 0}
                          onClick={() => handleAddBulkSubtopics()}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer ${
                            parsedBulkSubtopics.length > 0
                              ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white'
                              : 'bg-[#F1F5F9] dark:bg-[#282833] text-[#85877E] cursor-not-allowed opacity-60'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Add All {parsedBulkSubtopics.length > 0 ? `(${parsedBulkSubtopics.length})` : ''} Subtopics</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="pt-4 border-t border-[#E2E8F0] dark:border-[#272730] flex justify-between items-center">
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
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
                      className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1.5 cursor-pointer"
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
              <div key="lectures" className={`space-y-5 ${slideDirection === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
                <ViewErrorBoundary compact sectionName="Video Lectures">
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
                    onOpenSplitStudy={(lectureId, seekSeconds) => {
                      setSplitLectureId(lectureId);
                      setSplitLectureSeekSeconds(seekSeconds || 0);
                      setIsSplitLectureOpen(true);
                    }}
                    onAddTimestamp={(lectureId, ts) => {
                      if (addLectureTimestamp) {
                        addLectureTimestamp(liveTopic.id, lectureId, ts);
                      }
                    }}
                    onDeleteTimestamp={(lectureId, tsId) => {
                      if (deleteLectureTimestamp) {
                        deleteLectureTimestamp(liveTopic.id, lectureId, tsId);
                      }
                    }}
                  />
                </ViewErrorBoundary>
              </div>
            )}

            {/* NOTES TAB */}
            {activeTab === 'notes' && (
              <div key="notes" className={`space-y-5 ${slideDirection === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
                <ViewErrorBoundary compact sectionName="Topic Notes Editor">
                  <ProfessionalNotesEditor
                    initialContent={notes}
                    initialNoteItems={liveTopic.noteItems}
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
                    lectures={liveTopic.lectures || []}
                    onOpenSplitLecture={(lectureId, seekSeconds) => {
                      setSplitLectureId(lectureId || liveTopic.lectures?.[0]?.id);
                      setSplitLectureSeekSeconds(seekSeconds || 0);
                      setIsSplitLectureOpen(true);
                    }}
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
                </ViewErrorBoundary>

                <ViewErrorBoundary compact sectionName="Audio Memos">
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
                </ViewErrorBoundary>

                <ViewErrorBoundary compact sectionName="PDF Attachments">
                  <TopicPdfAttachmentsSection
                    topicId={liveTopic.id}
                    topicName={liveTopic.name}
                    subjectName={subjectName}
                    chapterName={chapterName}
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
                </ViewErrorBoundary>
              </div>
            )}

            {/* ADVANCED MISTAKES & TRAPS TAB */}
            {activeTab === 'mistakes' && (
              <div key="mistakes" className={`animate-fade-in ${slideDirection === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
                <ViewErrorBoundary compact sectionName="Mistakes & Traps Journal">
                  <AdvancedMistakeJournal
                    topic={liveTopic}
                    subjectName={subjectName}
                    chapterName={chapterName}
                  />
                </ViewErrorBoundary>
              </div>
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

      {/* IN-APP SPLIT-SCREEN LECTURE & TIMESTAMP SYNC MODAL */}
      {isSplitLectureOpen && (
        <SplitScreenLectureStudyModal
          isOpen={isSplitLectureOpen}
          onClose={() => setIsSplitLectureOpen(false)}
          topicName={liveTopic.name}
          subjectName={subjectName}
          chapterName={chapterName}
          lectures={liveTopic.lectures || []}
          initialLectureId={splitLectureId}
          initialSeekSeconds={splitLectureSeekSeconds}
          initialNotes={notes}
          onSaveNotes={handleSaveNotes}
          onAddTimestamp={(lectureId, ts) => {
            if (addLectureTimestamp) {
              addLectureTimestamp(liveTopic.id, lectureId, ts);
            }
          }}
          onDeleteTimestamp={(lectureId, tsId) => {
            if (deleteLectureTimestamp) {
              deleteLectureTimestamp(liveTopic.id, lectureId, tsId);
            }
          }}
        />
      )}
    </div>,
    document.body
  );
};

