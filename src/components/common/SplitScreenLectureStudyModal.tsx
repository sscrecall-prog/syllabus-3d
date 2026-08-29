import React, { useState, useEffect, useRef } from 'react';
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
  RotateCcw
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
      return saved ? Math.min(Math.max(Number(saved), 20), 80) : 50;
    } catch {
      return 50;
    }
  });
  const [mobileTab, setMobileTab] = useState<'video' | 'notes'>('video');

  // Custom Timestamp Input Form state
  const [showAddTimestampForm, setShowAddTimestampForm] = useState(false);
  const [inputTimeStr, setInputTimeStr] = useState('00:00');
  const [inputTimestampTitle, setInputTimestampTitle] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

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
      const clampedPercent = Math.min(Math.max(newPercent, 20), 80);
      setVideoWidthPercent(Math.round(clampedPercent));
    };

    const handleTouchMove = (e: TouchEvent) => {
      const windowWidth = window.innerWidth;
      if (windowWidth < 1024 || !e.touches[0]) return;
      const newPercent = (e.touches[0].clientX / windowWidth) * 100;
      const clampedPercent = Math.min(Math.max(newPercent, 20), 80);
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

  // Jump to specific timestamp
  const handleSeekTo = (seconds: number) => {
    soundManager.playClick();
    setSeekSeconds(seconds);
    showToast(`Jumped video to ${formatSecondsToTimestamp(seconds)} ⏱️`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleManualSave = () => {
    onSaveNotes(notesContent);
    soundManager.playCompleteChime();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCopyNotes = () => {
    soundManager.playClick();
    navigator.clipboard.writeText(notesContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to insert timestamp tag into notes
  const handleInsertTimestampToNotes = (timeFormatted: string, label: string = 'Key Concept') => {
    soundManager.playClick();
    const tag = `\n- ⏱️ [${timeFormatted}] **${label}**: `;
    
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

    showToast(`Inserted [${timeFormatted}] into notes! ✍️`);
  };

  const handleAddCustomTimestamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLecture) return;

    const seconds = parseTimestampToSeconds(inputTimeStr);
    const timeLabel = formatSecondsToTimestamp(seconds);
    const title = inputTimestampTitle.trim() || `Bookmark at ${timeLabel}`;

    if (onAddTimestamp) {
      onAddTimestamp(currentLecture.id, {
        timeSeconds: seconds,
        timeLabel,
        title
      });
    }

    // Also offer to insert into notes
    handleInsertTimestampToNotes(timeLabel, title);

    setShowAddTimestampForm(false);
    setInputTimestampTitle('');
    setInputTimeStr('00:00');
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

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0B0B0D] text-[#F5F5F7] animate-fade-in select-none overflow-hidden">
      
      {/* Invisible overlay during drag */}
      {isDragging && <div className="fixed inset-0 z-50 cursor-col-resize select-none" />}

      {/* 1. TOP HEADER TOOLBAR */}
      <div className="px-3 sm:px-6 py-2.5 bg-[#18181D] border-b border-[#272730] flex items-center justify-between gap-3 shrink-0 shadow-lg">
        
        {/* Left: Back Arrow & Topic / Lecture Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#23232A] hover:bg-red-600 text-white text-xs font-bold transition-all border border-[#272730] hover:border-red-500 cursor-pointer shadow-sm active:scale-95 group shrink-0"
            title="Go back to Topic (Esc)"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="h-6 w-px bg-[#272730] hidden sm:block" />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-400">
              <span>{subjectName || 'Subject'}</span>
              <span>•</span>
              <span className="truncate">{chapterName || 'Chapter'}</span>
            </div>
            <h3 className="text-xs sm:text-sm font-extrabold text-white truncate flex items-center gap-2">
              <span className="truncate">{topicName}</span>
              <span className="hidden md:inline px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-500/20 text-red-300 font-bold border border-red-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3 text-red-400" />
                <span>Lecture + Notes Timestamp Sync</span>
              </span>
            </h3>
          </div>
        </div>

        {/* Center: Lecture Selector (if multiple) */}
        {lectures.length > 1 && (
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#A1A1AA] uppercase font-mono">
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
                className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-[#23232A] border border-[#272730] text-xs font-semibold text-white focus:outline-none focus:border-red-500 appearance-none cursor-pointer truncate"
              >
                {lectures.map((lec, idx) => (
                  <option key={lec.id} value={lec.id}>
                    📹 #{idx + 1}: {lec.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#A1A1AA] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Right Tools: Mobile Switcher, Save, Open in YouTube & Close */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Mobile Tab Switcher */}
          <div className="flex lg:hidden bg-[#23232A] p-0.5 rounded-lg border border-[#272730]">
            <button
              onClick={() => setMobileTab('video')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                mobileTab === 'video' ? 'bg-red-600 text-white' : 'text-[#A1A1AA]'
              }`}
            >
              Video
            </button>
            <button
              onClick={() => setMobileTab('notes')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                mobileTab === 'notes' ? 'bg-purple-600 text-white' : 'text-[#A1A1AA]'
              }`}
            >
              Notes
            </button>
          </div>

          {currentLecture && (
            <button
              onClick={() => openYouTubeLectureInNewTab(currentLecture.youtubeUrl, seekSeconds)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 text-xs font-bold transition-all cursor-pointer"
              title="Open video in YouTube at current timestamp"
            >
              <YoutubeIcon className="w-3.5 h-3.5 fill-red-400" />
              <span>Open in YouTube</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={handleManualSave}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isSaved ? 'Saved!' : 'Save Notes'}</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-[#23232A] hover:bg-rose-500/20 text-[#A1A1AA] hover:text-rose-400 border border-[#272730] transition-colors cursor-pointer"
            title="Close Workspace (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="px-4 py-2 bg-[#8B5CF6]/20 border-b border-[#8B5CF6]/40 text-purple-300 text-xs font-bold flex items-center justify-between animate-fade-in">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            {toastMessage}
          </span>
          <span className="text-[10px] text-purple-400 font-mono">Real-time sync</span>
        </div>
      )}

      {/* 2. SPLIT RESIZABLE MAIN WORKSPACE */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        
        {/* LEFT PANEL: VIDEO PLAYER + TIMESTAMPS BOOKMARKS */}
        <div
          style={{ width: `${videoWidthPercent}%` }}
          className={`h-full flex flex-col bg-[#111114] min-h-0 transition-[width] ${
            isDragging ? 'transition-none' : 'duration-150'
          } ${mobileTab === 'video' ? 'w-full flex' : 'hidden lg:flex'}`}
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
          <div className="p-3 bg-[#18181D] border-b border-[#272730] flex items-center justify-between gap-2 shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-red-400" />
                <span>Synced Timestamps</span>
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-[#23232A] text-[10px] font-mono font-bold text-[#A1A1AA]">
                {combinedTimestamps.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowAddTimestampForm(p => !p)}
                className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tag Bookmark</span>
              </button>
            </div>
          </div>

          {/* Add Custom Timestamp Form */}
          {showAddTimestampForm && (
            <form
              onSubmit={handleAddCustomTimestamp}
              className="p-3 bg-[#1C1C22] border-b border-[#272730] space-y-2 animate-fade-in"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Add Timestamp Bookmark & Tag in Notes</span>
                <button
                  type="button"
                  onClick={() => setShowAddTimestampForm(false)}
                  className="p-1 rounded text-[#85877E] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={inputTimeStr}
                  onChange={e => setInputTimeStr(e.target.value)}
                  placeholder="Time (mm:ss) e.g. 14:25"
                  className="px-3 py-1.5 rounded-lg bg-[#141418] border border-[#272730] text-xs font-mono font-bold text-white focus:outline-none focus:border-purple-500"
                  required
                />
                <input
                  type="text"
                  value={inputTimestampTitle}
                  onChange={e => setInputTimestampTitle(e.target.value)}
                  placeholder="Concept / Formula Title"
                  className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-[#141418] border border-[#272730] text-xs font-medium text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddTimestampForm(false)}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-[#A1A1AA] hover:bg-[#23232A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                >
                  Tag & Insert into Notes
                </button>
              </div>
            </form>
          )}

          {/* Synchronized Timestamps List (Click to Jump Video) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 bg-[#121216]">
            {combinedTimestamps.length > 0 ? (
              combinedTimestamps.map((ts, idx) => {
                const isCurrentlyActive = Math.abs(seekSeconds - ts.timeSeconds) < 15;

                return (
                  <div
                    key={idx}
                    onClick={() => handleSeekTo(ts.timeSeconds)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer group select-none ${
                      isCurrentlyActive
                        ? 'bg-red-500/15 border-red-500/40 text-white shadow-sm'
                        : 'bg-[#18181D] hover:bg-[#23232A] border-[#272730] hover:border-red-500/30 text-[#A1A1AA]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeekTo(ts.timeSeconds);
                        }}
                        className={`px-2 py-1 rounded-lg font-mono text-xs font-bold flex items-center gap-1 shrink-0 ${
                          isCurrentlyActive
                            ? 'bg-red-600 text-white'
                            : 'bg-[#23232A] group-hover:bg-red-600 text-red-400 group-hover:text-white transition-colors'
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
                        className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/25 text-purple-400 text-[10px] font-bold transition-colors"
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
                          className="p-1 rounded text-[#85877E] hover:text-rose-400 transition-colors"
                          title="Delete timestamp"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 px-4 space-y-2 text-[#85877E]">
                <Clock className="w-8 h-8 mx-auto text-[#383842]" />
                <p className="text-xs">No timestamps tagged yet for this lecture.</p>
                <p className="text-[11px] text-[#A1A1AA]">
                  Click <strong>+ Tag Bookmark</strong> or type <code>⏱️ [12:34]</code> anywhere in your notes to automatically sync!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* DRAGGABLE RESIZER SPLITTER */}
        <div
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          className={`hidden lg:flex w-2.5 relative items-center justify-center bg-[#18181D] hover:bg-red-500/30 cursor-col-resize select-none z-30 group transition-colors ${
            isDragging ? 'bg-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''
          }`}
          title="Drag to resize Video / Notes panels"
        >
          <div
            className={`w-1 h-full transition-colors ${
              isDragging ? 'bg-red-500' : 'bg-[#272730] group-hover:bg-red-500'
            }`}
          />
          <div className="absolute top-1/2 -translate-y-1/2 w-6 h-12 rounded-xl flex items-center justify-center bg-[#18181D] border border-[#383842] group-hover:border-red-500 text-[#A1A1AA] group-hover:text-white shadow-lg">
            <ChevronsLeftRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* RIGHT PANEL: LIVE SYNCHRONIZED NOTES WORKSPACE */}
        <div
          style={{ width: `${100 - videoWidthPercent}%` }}
          className={`h-full flex flex-col bg-[#18181D] min-h-0 border-l border-[#272730] transition-[width] ${
            isDragging ? 'transition-none' : 'duration-150'
          } ${mobileTab === 'notes' ? 'w-full flex' : 'hidden lg:flex'}`}
        >
          {/* Notes Subheader & Quick Tools */}
          <div className="p-3 bg-[#1C1C22] border-b border-[#272730] space-y-2 shrink-0">
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleInsertTimestampToNotes('00:00', 'Important Point')}
                  className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                  title="Insert clickable timestamp bookmark into notes"
                >
                  <Clock className="w-3 h-3" />
                  <span>+ [Timestamp]</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertSnippet('> [!FORMULA]\n> **Formula Name**: `Write equation here`\n> - Concept: \n')}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
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
                  className="p-1.5 rounded-lg bg-[#23232A] hover:bg-[#2E2E38] text-[#A1A1AA] hover:text-white cursor-pointer"
                  title="Copy All Notes"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Notes Live Textarea */}
          <div className="flex-1 p-4 relative flex flex-col min-h-0 bg-[#141418]">
            <textarea
              ref={notesTextareaRef}
              value={notesContent}
              onChange={e => {
                setNotesContent(e.target.value);
                onSaveNotes(e.target.value);
              }}
              placeholder={"Take live lecture notes here...\n\n⏱️ Tip: Write timestamps like [12:45] or ⏱️ 14:20 — clicking any timestamp will instantly jump the video to that moment!\n\n- ⏱️ [04:15] Theorem introduction\n- ⏱️ [12:30] Formula shortcut\n\n> [!FORMULA]\n> Formula equation here"}
              className="w-full flex-1 p-3.5 rounded-xl bg-[#18181D] border border-[#272730] text-xs sm:text-sm font-medium text-[#F5F5F7] placeholder-[#71717A] focus:outline-none focus:border-red-500 resize-none leading-relaxed font-sans"
            />

            {/* Bottom Status Bar */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-[#A1A1AA]">
              <span className="flex items-center gap-2">
                <span>{notesContent.trim() ? notesContent.trim().split(/\s+/).length : 0} words</span>
                <span>•</span>
                <span className="text-purple-400 font-mono font-bold">
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

    </div>
  );
};
