import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Play,
  Save,
  Check,
  Columns,
  ExternalLink,
  ChevronDown,
  Copy,
  Plus,
  Zap,
  ShieldAlert,
  Edit3,
  Eye,
  CheckSquare,
  ChevronsLeftRight,
  Clock,
  Bookmark,
  Trash2,
  Maximize2,
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Video,
  FileText
} from 'lucide-react';
import { TopicLecture, LectureTimestamp } from '../../types/syllabus';
import {
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
  getYouTubeWatchUrlWithTimestamp,
  openYouTubeLectureInNewTab,
  parseTimestampToSeconds,
  formatSecondsToTimestamp,
  extractTimestampsFromText
} from '../../utils/youtubeUtils';
import { soundManager } from '../../utils/soundEffects';
import { YoutubeIcon } from './TopicLecturesSection';

interface SplitScreenLectureStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicName: string;
  subjectName?: string;
  chapterName?: string;
  lectures: TopicLecture[];
  initialLectureId?: string;
  initialSeekSeconds?: number;
  initialNotes: string;
  onSaveNotes: (newNotes: string) => void;
  onAddTimestamp?: (lectureId: string, timestamp: { timeSeconds: number; timeLabel: string; title: string }) => void;
  onDeleteTimestamp?: (lectureId: string, timestampId: string) => void;
}

export const SplitScreenLectureStudyModal: React.FC<SplitScreenLectureStudyModalProps> = ({
  isOpen,
  onClose,
  topicName,
  subjectName,
  chapterName,
  lectures = [],
  initialLectureId,
  initialSeekSeconds = 0,
  initialNotes,
  onSaveNotes,
  onAddTimestamp,
  onDeleteTimestamp
}) => {
  const [selectedLectureId, setSelectedLectureId] = useState<string>(
    initialLectureId || (lectures.length > 0 ? lectures[0].id : '')
  );
  const [seekSeconds, setSeekSeconds] = useState<number>(initialSeekSeconds);
  const [notesContent, setNotesContent] = useState(initialNotes || '');
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [videoWidthPercent, setVideoWidthPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('syllabus_split_lecture_width_percent');
      return saved ? Math.min(Math.max(Number(saved), 25), 75) : 50;
    } catch {
      return 50;
    }
  });
  const [mobileTab, setMobileTab] = useState<'video' | 'notes'>('video');
  const [isDesktop, setIsDesktop] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  // Custom Timestamp Input Form state with Hours, Minutes, Seconds
  const [showAddTimestampForm, setShowAddTimestampForm] = useState(false);
  const [inputHours, setInputHours] = useState('00');
  const [inputMinutes, setInputMinutes] = useState('00');
  const [inputSeconds, setInputSeconds] = useState('00');
  const [inputTimestampTitle, setInputTimestampTitle] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Resize listener to detect mobile vs desktop
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync initial lecture and seek seconds
  useEffect(() => {
    if (initialLectureId) {
      setSelectedLectureId(initialLectureId);
    } else if (lectures.length > 0 && !selectedLectureId) {
      setSelectedLectureId(lectures[0].id);
    }
    if (initialSeekSeconds !== undefined) {
      setSeekSeconds(initialSeekSeconds);
    }
  }, [initialLectureId, initialSeekSeconds, lectures]);

  // Sync notes
  useEffect(() => {
    setNotesContent(initialNotes || '');
  }, [initialNotes]);

  // Keyboard shortcut listener (ESC to go back)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundManager.playClick();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Draggable splitter listeners
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const windowWidth = window.innerWidth;
      if (windowWidth < 1024) return;
      const newPercent = (e.clientX / windowWidth) * 100;
      const clampedPercent = Math.min(Math.max(newPercent, 25), 75);
      setVideoWidthPercent(Math.round(clampedPercent));
    };

    const handleTouchMove = (e: TouchEvent) => {
      const windowWidth = window.innerWidth;
      if (windowWidth < 1024 || !e.touches[0]) return;
      const newPercent = (e.touches[0].clientX / windowWidth) * 100;
      const clampedPercent = Math.min(Math.max(newPercent, 25), 75);
      setVideoWidthPercent(Math.round(clampedPercent));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      try {
        localStorage.setItem('syllabus_split_lecture_width_percent', String(videoWidthPercent));
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, videoWidthPercent]);

  if (!isOpen) return null;

  const currentLecture = lectures.find(l => l.id === selectedLectureId) || lectures[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleManualSave = () => {
    soundManager.playCompleteChime();
    onSaveNotes(notesContent);
    setIsSaved(true);
    showToast('Lecture study notes saved successfully! 💾');
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleCopyNotes = () => {
    soundManager.playClick();
    navigator.clipboard.writeText(notesContent);
    setCopied(true);
    showToast('Notes copied to clipboard! 📋');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSeekTo = (seconds: number) => {
    soundManager.playClick();
    setSeekSeconds(seconds);
    const formatted = formatSecondsToTimestamp(seconds);
    showToast(`Jumped to lecture timestamp ⏱️ [${formatted}]`);
  };

  const handleInsertTimestampToNotes = (timeLabel: string, title?: string) => {
    soundManager.playClick();
    const cleanLabel = timeLabel.replace(/[\[\]⏱️]/g, '').trim();
    const tag = `\n- ⏱️ [${cleanLabel}] ${title || 'Key Concept'}\n`;
    
    if (notesTextareaRef.current) {
      const el = notesTextareaRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const updated = notesContent.substring(0, start) + tag + notesContent.substring(end);
      setNotesContent(updated);
      onSaveNotes(updated);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + tag.length, start + tag.length);
      }, 50);
    } else {
      const updated = notesContent ? notesContent + tag : tag.trim();
      setNotesContent(updated);
      onSaveNotes(updated);
    }

    showToast(`Inserted [${cleanLabel}] into notes! ✍️`);
  };

  // Adjust hours, minutes, or seconds with quick step
  const handleAdjustTime = (hDelta: number, mDelta: number, sDelta: number) => {
    soundManager.playClick();
    const curH = parseInt(inputHours, 10) || 0;
    const curM = parseInt(inputMinutes, 10) || 0;
    const curS = parseInt(inputSeconds, 10) || 0;

    let total = curH * 3600 + curM * 60 + curS + hDelta * 3600 + mDelta * 60 + sDelta;
    if (total < 0) total = 0;

    const newH = Math.floor(total / 3600);
    const newM = Math.floor((total % 3600) / 60);
    const newS = total % 60;

    setInputHours(newH.toString().padStart(2, '0'));
    setInputMinutes(newM.toString().padStart(2, '0'));
    setInputSeconds(newS.toString().padStart(2, '0'));
  };

  const handleAddCustomTimestamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLecture) return;

    const h = parseInt(inputHours, 10) || 0;
    const m = parseInt(inputMinutes, 10) || 0;
    const s = parseInt(inputSeconds, 10) || 0;
    const totalSeconds = h * 3600 + m * 60 + s;

    const timeLabel = formatSecondsToTimestamp(totalSeconds);
    const title = inputTimestampTitle.trim() || `Bookmark at ${timeLabel}`;

    if (onAddTimestamp) {
      onAddTimestamp(currentLecture.id, {
        timeSeconds: totalSeconds,
        timeLabel,
        title
      });
    }

    // Also insert into notes
    handleInsertTimestampToNotes(timeLabel, title);

    setShowAddTimestampForm(false);
    setInputTimestampTitle('');
    setInputHours('00');
    setInputMinutes('00');
    setInputSeconds('00');
    soundManager.playCompleteChime();
  };

  const handleInsertSnippet = (snippet: string) => {
    soundManager.playClick();
    setNotesContent(prev => prev + '\n' + snippet);
  };

  // Extract all timestamps found in notes
  const notesTimestamps = extractTimestampsFromText(notesContent);

  // All combined timestamps (from lecture metadata + extracted from notes)
  const combinedTimestamps: { timeLabel: string; timeSeconds: number; title: string; source: 'lecture' | 'notes'; id?: string }[] = [];

  if (currentLecture?.timestamps) {
    currentLecture.timestamps.forEach(ts => {
      combinedTimestamps.push({
        timeLabel: ts.timeLabel,
        timeSeconds: ts.timeSeconds,
        title: ts.title,
        source: 'lecture',
        id: ts.id
      });
    });
  }

  notesTimestamps.forEach(nts => {
    if (!combinedTimestamps.some(ct => Math.abs(ct.timeSeconds - nts.seconds) < 2)) {
      combinedTimestamps.push({
        timeLabel: nts.label,
        timeSeconds: nts.seconds,
        title: nts.lineText.replace(/⏱️|\[.*?\]/g, '').trim() || `Notes Tag at ${nts.label}`,
        source: 'notes'
      });
    }
  });

  combinedTimestamps.sort((a, b) => a.timeSeconds - b.timeSeconds);

  return createPortal(
    <div
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      className="fixed inset-0 z-[200] flex flex-col bg-[#16161E] text-[#C0CAF5] animate-fade-in overflow-hidden font-sans"
    >
      
      {/* Invisible overlay during drag */}
      {isDragging && <div className="fixed inset-0 z-50 cursor-col-resize select-none" />}

      {/* 1. TOP HEADER TOOLBAR */}
      <div className="px-3 sm:px-6 py-2.5 bg-[#1F2335] border-b border-[#292E42] flex items-center justify-between gap-3 shrink-0 shadow-lg">
        
        {/* Left: Back Arrow & Topic / Lecture Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#24283B] hover:bg-[#EF4444] text-white text-xs font-bold transition-all border border-[#292E42] hover:border-[#EF4444] cursor-pointer shadow-sm active:scale-95 group shrink-0"
            title="Go back to Topic (Esc)"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="h-6 w-px bg-[#292E42] hidden sm:block" />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-400">
              <span>{subjectName || 'Subject'}</span>
              <span>•</span>
              <span className="truncate">{chapterName || 'Chapter'}</span>
            </div>
            <h3 className="text-xs sm:text-sm font-extrabold text-white truncate flex items-center gap-2">
              <span className="truncate">{topicName}</span>
              <span className="hidden md:inline px-2 py-0.5 rounded-full text-[11px] font-mono bg-red-500/20 text-red-300 font-bold border border-red-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3 text-red-400" />
                <span>Lecture + Notes Sync</span>
              </span>
            </h3>
          </div>
        </div>

        {/* Center: Lecture Selector (if multiple) */}
        {lectures.length > 1 && (
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#A9B1D6] uppercase font-mono">
              Lecture:
            </span>
            <div className="relative min-w-[240px]">
              <select
                value={selectedLectureId}
                onChange={e => {
                  soundManager.playClick();
                  setSelectedLectureId(e.target.value);
                  setSeekSeconds(0);
                }}
                className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-[#24283B] border border-[#292E42] text-xs font-semibold text-white focus:outline-none focus:border-red-500 appearance-none cursor-pointer truncate"
              >
                {lectures.map((lec, idx) => (
                  <option key={lec.id} value={lec.id}>
                    📹 #{idx + 1}: {lec.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#A9B1D6] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Right Tools: Mobile Switcher, Save, Open in YouTube & Close */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Mobile Tab Switcher (Full Responsive) */}
          <div className="flex lg:hidden bg-[#24283B] p-0.5 rounded-xl border border-[#292E42]">
            <button
              onClick={() => {
                soundManager.playClick();
                setMobileTab('video');
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mobileTab === 'video'
                  ? 'bg-[#EF4444] text-white shadow-sm'
                  : 'text-[#A9B1D6] hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setMobileTab('notes');
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mobileTab === 'notes'
                  ? 'bg-[#7AA2F7] text-[#1A1B26] shadow-sm'
                  : 'text-[#A9B1D6] hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notes</span>
            </button>
          </div>

          {currentLecture && (
            <button
              onClick={() => openYouTubeLectureInNewTab(currentLecture.youtubeUrl, seekSeconds)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 text-xs font-bold transition-all cursor-pointer"
              title="Open video in YouTube at current timestamp"
            >
              <YoutubeIcon className="w-3.5 h-3.5 fill-red-400" />
              <span className="hidden md:inline">YouTube</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={handleManualSave}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isSaved ? 'Saved!' : 'Save'}</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-[#24283B] hover:bg-rose-500/20 text-[#A9B1D6] hover:text-rose-400 border border-[#292E42] transition-colors cursor-pointer"
            title="Close Workspace (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="px-4 py-2 bg-[#7AA2F7]/20 border-b border-[#7AA2F7]/40 text-[#C0CAF5] text-xs font-bold flex items-center justify-between animate-fade-in shrink-0">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            {toastMessage}
          </span>
          <span className="text-[11px] text-[#7AA2F7] font-mono">Real-time sync</span>
        </div>
      )}

      {/* 2. SPLIT RESIZABLE MAIN WORKSPACE (100% WIDTH ON MOBILE & SPLIT ON DESKTOP) */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden w-full">
        
        {/* LEFT PANEL: VIDEO PLAYER + TIMESTAMPS BOOKMARKS */}
        <div
          style={{ width: isDesktop ? `${videoWidthPercent}%` : '100%' }}
          className={`h-full flex flex-col bg-[#16161E] min-h-0 transition-[width] ${
            isDragging ? 'transition-none' : 'duration-150'
          } ${mobileTab === 'video' ? 'flex w-full' : 'hidden lg:flex'}`}
        >
          {/* Embedded YouTube Video Container with dynamic seek */}
          <div className="relative w-full pb-[56.25%] bg-black shrink-0 shadow-lg">
            {currentLecture && getYouTubeEmbedUrl(currentLecture.youtubeUrl, seekSeconds) ? (
              <iframe
                key={`${currentLecture.id}_${seekSeconds}`}
                src={getYouTubeEmbedUrl(currentLecture.youtubeUrl, seekSeconds)!}
                title={currentLecture.title}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white text-center space-y-2">
                <YoutubeIcon className="w-12 h-12 text-red-500" />
                <p className="text-sm font-bold">No Lecture Video Selected</p>
              </div>
            )}
          </div>

          {/* Quick Timestamp Sync Controls Bar */}
          <div className="p-3 bg-[#1F2335] border-b border-[#292E42] flex items-center justify-between gap-2 shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-red-400" />
                <span>Synced Timestamps</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[11px] font-mono font-bold">
                {combinedTimestamps.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setShowAddTimestampForm(!showAddTimestampForm);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tag Bookmark</span>
              </button>
            </div>
          </div>

          {/* Add Custom Timestamp Form with Hour (HH) : Minute (MM) : Second (SS) Support */}
          {showAddTimestampForm && (
            <form
              onSubmit={handleAddCustomTimestamp}
              className="p-3.5 bg-[#24283B] border-b border-[#292E42] space-y-3 animate-fade-in shadow-inner"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5 text-red-400">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Add Timestamp Bookmark (HH:MM:SS)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddTimestampForm(false)}
                  className="p-1 rounded-lg text-[#A9B1D6] hover:text-white hover:bg-[#1F2335] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 3-Part Time Input: Hours, Minutes, Seconds */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#16161E] border border-[#292E42]">
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] font-mono font-bold text-[#787C99] uppercase">HH</span>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={inputHours}
                        onChange={e => setInputHours(e.target.value.padStart(2, '0').slice(-2))}
                        className="w-10 text-center py-1 bg-transparent text-sm font-mono font-bold text-white focus:outline-none focus:text-red-400"
                        title="Hours"
                      />
                    </div>
                    <span className="text-sm font-bold text-[#787C99]">:</span>
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] font-mono font-bold text-[#787C99] uppercase">MM</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={inputMinutes}
                        onChange={e => setInputMinutes(e.target.value.padStart(2, '0').slice(-2))}
                        className="w-10 text-center py-1 bg-transparent text-sm font-mono font-bold text-white focus:outline-none focus:text-red-400"
                        title="Minutes"
                        required
                      />
                    </div>
                    <span className="text-sm font-bold text-[#787C99]">:</span>
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] font-mono font-bold text-[#787C99] uppercase">SS</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={inputSeconds}
                        onChange={e => setInputSeconds(e.target.value.padStart(2, '0').slice(-2))}
                        className="w-10 text-center py-1 bg-transparent text-sm font-mono font-bold text-white focus:outline-none focus:text-red-400"
                        title="Seconds"
                      />
                    </div>
                  </div>

                  {/* Quick Adjust Buttons */}
                  <div className="flex items-center gap-1 flex-wrap flex-1">
                    {[
                      { label: '+1h', h: 1, m: 0, s: 0 },
                      { label: '+10m', h: 0, m: 10, s: 0 },
                      { label: '+1m', h: 0, m: 1, s: 0 },
                      { label: '+30s', h: 0, m: 0, s: 30 }
                    ].map(step => (
                      <button
                        key={step.label}
                        type="button"
                        onClick={() => handleAdjustTime(step.h, step.m, step.s)}
                        className="px-2 py-1 rounded-lg bg-[#1F2335] hover:bg-[#292E42] text-[11px] font-mono font-bold text-[#C0CAF5] border border-[#292E42] transition-colors cursor-pointer"
                      >
                        {step.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setInputHours('00');
                        setInputMinutes('00');
                        setInputSeconds('00');
                      }}
                      className="px-2 py-1 rounded-lg bg-[#1F2335] hover:bg-[#292E42] text-[11px] font-mono text-[#787C99] hover:text-white border border-[#292E42] transition-colors cursor-pointer"
                      title="Reset time to 00:00:00"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Bookmark Title */}
                <input
                  type="text"
                  value={inputTimestampTitle}
                  onChange={e => setInputTimestampTitle(e.target.value)}
                  placeholder="Concept / Formula / Topic Title (e.g. Inradius Shortcut Formula)"
                  className="w-full px-3 py-2 rounded-xl bg-[#16161E] border border-[#292E42] text-xs font-medium text-white placeholder-[#787C99] focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddTimestampForm(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#A9B1D6] hover:bg-[#1F2335] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer shadow-md active:scale-95 transition-all"
                >
                  Tag & Insert into Notes
                </button>
              </div>
            </form>
          )}

          {/* Synchronized Timestamps List (Click to Jump Video) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 bg-[#16161E]">
            {combinedTimestamps.length > 0 ? (
              combinedTimestamps.map((ts, idx) => {
                const isCurrentlyActive = Math.abs(seekSeconds - ts.timeSeconds) < 15;

                return (
                  <div
                    key={idx}
                    onClick={() => handleSeekTo(ts.timeSeconds)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group select-none ${
                      isCurrentlyActive
                        ? 'bg-red-500/15 border-red-500/40 text-white shadow-sm'
                        : 'bg-[#1F2335] hover:bg-[#24283B] border-[#292E42] hover:border-red-500/30 text-[#A9B1D6]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeekTo(ts.timeSeconds);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold flex items-center gap-1 shrink-0 ${
                          isCurrentlyActive
                            ? 'bg-red-600 text-white'
                            : 'bg-[#24283B] group-hover:bg-red-600 text-red-400 group-hover:text-white transition-colors'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{ts.timeLabel}</span>
                      </button>

                      <span className="text-xs font-medium text-white truncate">
                        {ts.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInsertTimestampToNotes(ts.timeLabel, ts.title);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#7AA2F7]/15 hover:bg-[#7AA2F7]/25 text-[#7AA2F7] text-[11px] font-bold transition-colors cursor-pointer"
                        title="Insert this timestamp tag into notes"
                      >
                        + Notes
                      </button>

                      {ts.source === 'lecture' && ts.id && onDeleteTimestamp && currentLecture && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTimestamp(currentLecture.id, ts.id!);
                          }}
                          className="p-1 rounded text-[#787C99] hover:text-rose-400 transition-colors"
                          title="Delete timestamp"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 px-4 space-y-2 text-[#787C99]">
                <Clock className="w-8 h-8 mx-auto text-[#292E42]" />
                <p className="text-xs">No timestamps tagged yet for this lecture.</p>
                <p className="text-[11px] text-[#A9B1D6]">
                  Click <strong>+ Tag Bookmark</strong> or type <code>⏱️ [01:25:30]</code> anywhere in your notes to automatically sync!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* DRAGGABLE RESIZER SPLITTER (Desktop only) */}
        <div
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          className={`hidden lg:flex w-2.5 relative items-center justify-center bg-[#1F2335] hover:bg-red-500/30 cursor-col-resize select-none z-30 group transition-colors ${
            isDragging ? 'bg-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''
          }`}
          title="Drag to resize Video / Notes panels"
        >
          <div
            className={`w-1 h-full transition-colors ${
              isDragging ? 'bg-red-500' : 'bg-[#292E42] group-hover:bg-red-500'
            }`}
          />
          <div className="absolute top-1/2 -translate-y-1/2 w-6 h-12 rounded-xl flex items-center justify-center bg-[#24283B] border border-[#292E42] group-hover:border-red-500 text-[#A9B1D6] group-hover:text-white shadow-lg">
            <ChevronsLeftRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* RIGHT PANEL: LIVE SYNCHRONIZED NOTES WORKSPACE */}
        <div
          style={{ width: isDesktop ? `${100 - videoWidthPercent}%` : '100%' }}
          className={`h-full flex flex-col bg-[#1F2335] min-h-0 border-l border-[#292E42] transition-[width] ${
            isDragging ? 'transition-none' : 'duration-150'
          } ${mobileTab === 'notes' ? 'flex w-full' : 'hidden lg:flex'}`}
        >
          {/* Notes Subheader & Quick Tools */}
          <div className="p-3 bg-[#24283B] border-b border-[#292E42] space-y-2 shrink-0">
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleInsertTimestampToNotes('00:00:00', 'Important Point')}
                  className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                  title="Insert clickable timestamp bookmark into notes"
                >
                  <Clock className="w-3 h-3" />
                  <span>+ [Timestamp]</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertSnippet('> [!FORMULA]\n> **Formula Name**: `Write equation here`\n> - Concept: \n')}
                  className="px-2.5 py-1 rounded-lg bg-[#7AA2F7]/15 hover:bg-[#7AA2F7]/25 text-[#7AA2F7] border border-[#7AA2F7]/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <span>Σ Formula</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertSnippet('> [!TIP]\n> **Fast Shortcut**: \n')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Zap className="w-3 h-3" />
                  <span>Shortcut</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertSnippet('> [!WARNING]\n> **Common Exam Trap**: \n')}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>Trap</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleCopyNotes}
                  className="p-1.5 rounded-lg bg-[#1F2335] hover:bg-[#292E42] text-[#A9B1D6] hover:text-white cursor-pointer border border-[#292E42]"
                  title="Copy All Notes"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Notes Live Textarea */}
          <div className="flex-1 p-4 relative flex flex-col min-h-0 bg-[#16161E]">
            <textarea
              ref={notesTextareaRef}
              value={notesContent}
              onChange={e => {
                setNotesContent(e.target.value);
                onSaveNotes(e.target.value);
              }}
              placeholder={"Take live lecture notes here...\n\n⏱️ Tip: Write timestamps like [01:25:30] or ⏱️ 14:20 — clicking any timestamp will instantly jump the video to that moment!\n\n- ⏱️ [00:04:15] Theorem introduction\n- ⏱️ [01:12:30] Formula shortcut\n\n> [!FORMULA]\n> Formula equation here"}
              className="w-full flex-1 p-3.5 rounded-xl bg-[#1F2335] border border-[#292E42] text-xs sm:text-sm font-medium text-[#C0CAF5] placeholder-[#787C99] focus:outline-none focus:border-red-500 resize-none leading-relaxed font-sans"
            />

            {/* Bottom Status Bar */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-[#A9B1D6]">
              <span className="flex items-center gap-2">
                <span>{notesContent.trim() ? notesContent.trim().split(/\s+/).length : 0} words</span>
                <span>•</span>
                <span className="text-[#7AA2F7] font-mono font-bold">
                  {notesTimestamps.length} Synced Timestamps
                </span>
              </span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Auto-saved in real-time</span>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
