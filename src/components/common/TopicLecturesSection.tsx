import React, { useState } from 'react';
import {
  Plus,
  ExternalLink,
  Trash2,
  Play,
  Clock,
  CheckCircle2,
  Video,
  X,
  AlertCircle,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { TopicLecture } from '../../types/syllabus';
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  formatYouTubeWatchUrl,
  openYouTubeLectureInNewTab,
  getYouTubeEmbedUrl
} from '../../utils/youtubeUtils';
import { soundManager } from '../../utils/soundEffects';

export const YoutubeIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface TopicLecturesSectionProps {
  topicId: string;
  topicName: string;
  lectures: TopicLecture[];
  onAddLecture: (lecture: { title: string; youtubeUrl: string; duration?: string; notes?: string }) => void;
  onDeleteLecture: (lectureId: string) => void;
  onOpenSplitStudy?: (lectureId: string, seekSeconds?: number) => void;
  onAddTimestamp?: (lectureId: string, timestamp: { timeSeconds: number; timeLabel: string; title: string }) => void;
  onDeleteTimestamp?: (lectureId: string, timestampId: string) => void;
}

export const TopicLecturesSection: React.FC<TopicLecturesSectionProps> = ({
  topicId,
  topicName,
  lectures = [],
  onAddLecture,
  onDeleteLecture,
  onOpenSplitStudy,
  onAddTimestamp,
  onDeleteTimestamp
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [urlError, setUrlError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Active Embedded Video Player State
  const [activePlayingLecture, setActivePlayingLecture] = useState<TopicLecture | null>(null);

  // Live extracted YouTube video ID for thumbnail preview
  const liveVideoId = extractYouTubeVideoId(youtubeUrl);
  const liveThumbnail = liveVideoId ? getYouTubeThumbnailUrl(youtubeUrl) : null;

  const handleOpenAddForm = () => {
    soundManager.playClick();
    setIsAdding(true);
    setYoutubeUrl('');
    setTitle(`Lecture ${lectures.length + 1}: ${topicName}`);
    setDuration('');
    setNotes('');
    setUrlError('');
  };

  const handleCancelAdd = () => {
    soundManager.playClick();
    setIsAdding(false);
    setYoutubeUrl('');
    setTitle('');
    setDuration('');
    setNotes('');
    setUrlError('');
  };

  const handleSaveLecture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) {
      setUrlError('Please paste a YouTube video URL.');
      return;
    }

    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      setUrlError('Invalid YouTube link. Please paste a valid YouTube watch, youtu.be, or shorts link.');
      return;
    }

    const finalTitle = title.trim() || `Lecture ${lectures.length + 1}: ${topicName}`;
    onAddLecture({
      title: finalTitle,
      youtubeUrl: formatYouTubeWatchUrl(youtubeUrl),
      duration: duration.trim() || undefined,
      notes: notes.trim() || undefined
    });

    setIsAdding(false);
    setYoutubeUrl('');
    setTitle('');
    setDuration('');
    setNotes('');
    setUrlError('');
  };

  const handleCardClick = (lecture: TopicLecture) => {
    soundManager.playClick();
    openYouTubeLectureInNewTab(lecture.youtubeUrl);
  };

  const handlePlayEmbedded = (e: React.MouseEvent, lecture: TopicLecture) => {
    e.stopPropagation();
    soundManager.playClick();
    setActivePlayingLecture(lecture);
  };

  const handleDeleteConfirm = (e: React.MouseEvent, lectureId: string) => {
    e.stopPropagation();
    onDeleteLecture(lectureId);
    setDeletingId(null);
  };

  return (
    <div className="space-y-4">
      
      {/* 1. HEADER & ADD BUTTON */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-500/25 shadow-xs">
            <YoutubeIcon className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-[#11120F] dark:text-[#F5F5F7] uppercase tracking-wide">
                Video Lectures & Classes
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F8FAFC] dark:bg-[#20212E] border border-[#E2E8F0] dark:border-[#272730] text-[#65675F] dark:text-[#94A3B8] tabular-nums">
                {lectures.length} {lectures.length === 1 ? 'Lecture' : 'Lectures'}
              </span>
            </div>
            <p className="text-[10px] text-[#85877E] font-mono">
              Stream attached video classes, take timestamped sync notes, and watch PYQs
            </p>
          </div>
        </div>

        {!isAdding && (
          <button
            onClick={handleOpenAddForm}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#11120F] dark:bg-white hover:bg-red-600 dark:hover:bg-red-600 text-white dark:text-black hover:text-white dark:hover:text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add YouTube Lecture</span>
          </button>
        )}
      </div>

      {/* 2. ADD LECTURE FORM */}
      {isAdding && (
        <form
          onSubmit={handleSaveLecture}
          className="p-4 sm:p-5 rounded-3xl bg-[#F8FAFC] dark:bg-[#14151F] border-2 border-red-500/30 dark:border-red-500/40 shadow-elevated-card space-y-4 animate-fade-in relative overflow-hidden"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#272730]">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#191A17] dark:text-[#F5F5F7]">
              <YoutubeIcon className="w-4 h-4 text-red-500 fill-current" />
              <span>Link New YouTube Lecture</span>
            </div>
            <button
              type="button"
              onClick={handleCancelAdd}
              className="p-1 rounded-lg text-[#85877E] hover:text-[#191A17] dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* YouTube URL Input */}
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#191A17] dark:text-[#F5F5F7] mb-1">
                YouTube Video Link / URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={e => {
                    setYoutubeUrl(e.target.value);
                    if (urlError) setUrlError('');
                  }}
                  placeholder="Paste URL e.g. https://youtu.be/... or https://www.youtube.com/watch?v=..."
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white dark:bg-[#18181D] border text-xs font-medium text-[#191A17] dark:text-[#F5F5F7] placeholder-[#85877E] focus:outline-none transition-all ${
                    urlError
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-[#E2E8F0] dark:border-[#272730] focus:border-red-500'
                  }`}
                  autoFocus
                />
                <YoutubeIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 fill-current pointer-events-none" />
              </div>
              {urlError && (
                <p className="text-[11px] font-mono font-bold text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{urlError}</span>
                </p>
              )}
            </div>

            {/* Live Video Thumbnail Preview Box */}
            {liveThumbnail && (
              <div className="p-3 rounded-2xl bg-white dark:bg-[#18181D] border border-red-500/20 flex items-center gap-3 animate-fade-in shadow-xs">
                <div className="relative w-28 h-16 rounded-xl overflow-hidden shrink-0 bg-black">
                  <img
                    src={liveThumbnail}
                    alt="Thumbnail Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 inline-block mb-1 border border-emerald-500/25">
                    ✓ Valid YouTube Video Detected
                  </span>
                  <p className="text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] truncate">
                    Video ID: <span className="font-mono text-red-500">{liveVideoId}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Lecture Title */}
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#191A17] dark:text-[#F5F5F7] mb-1">
                Lecture Title / Description
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Complete One-Shot & High Weightage PYQs"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] text-xs font-medium text-[#191A17] dark:text-[#F5F5F7] placeholder-[#85877E] focus:outline-none focus:border-red-500 transition-all"
              />
            </div>

            {/* Duration and Teacher / Notes in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#191A17] dark:text-[#F5F5F7] mb-1">
                  Duration / Tag <span className="text-[10px] text-[#85877E] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder="e.g. 1 hr 15m or One-Shot"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] text-xs font-medium text-[#191A17] dark:text-[#F5F5F7] placeholder-[#85877E] focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#191A17] dark:text-[#F5F5F7] mb-1">
                  Teacher / Channel Note <span className="text-[10px] text-[#85877E] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Gagan Pratap Sir / Aditya Ranjan Sir"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] text-xs font-medium text-[#191A17] dark:text-[#F5F5F7] placeholder-[#85877E] focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#272730]">
            <button
              type="button"
              onClick={handleCancelAdd}
              className="px-4 py-2 rounded-xl bg-white dark:bg-[#20212E] border border-[#E2E8F0] dark:border-[#272730] text-xs font-bold text-[#65675F] dark:text-[#A1A1AA] hover:text-[#191A17] dark:hover:text-white cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save Lecture</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. LECTURES LIST */}
      <div className="space-y-3">
        {lectures.length > 0 ? (
          lectures.map((lecture, index) => {
            const videoId = extractYouTubeVideoId(lecture.youtubeUrl);
            const thumbnail = videoId ? getYouTubeThumbnailUrl(lecture.youtubeUrl) : null;

            return (
              <div
                key={lecture.id}
                onClick={() => handleCardClick(lecture)}
                className="group relative p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] hover:border-red-500/60 dark:hover:border-red-500/60 shadow-subtle-depth hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 select-none overflow-hidden"
              >
                {/* Top Subtle Red Ambient Glow Line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Left Side: Thumbnail with Play Badge + Video Info */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  
                  {/* Thumbnail */}
                  <div className="relative w-32 sm:w-44 h-20 sm:h-24 rounded-2xl overflow-hidden bg-black shrink-0 shadow-xs border border-[#E2E8F0]/60 dark:border-[#272730] group-hover:scale-[1.02] transition-transform">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={lecture.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#11120F] text-red-500">
                        <YoutubeIcon className="w-8 h-8 fill-current" />
                      </div>
                    )}

                    {/* Central Play Badge */}
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    {lecture.duration && (
                      <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-xs text-white text-[10px] font-mono font-bold border border-white/10">
                        {lecture.duration}
                      </div>
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25 font-mono">
                        Lecture #{index + 1}
                      </span>
                      {lecture.notes && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-mono truncate">
                          {lecture.notes}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-black tracking-tight text-[#191A17] dark:text-[#F5F5F7] group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
                      {lecture.title}
                    </h4>

                    <div className="flex items-center gap-3 text-[10px] text-[#85877E] dark:text-[#A1A1AA] pt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>Added {lecture.addedAt}</span>
                      </span>
                      <span className="hidden xs:inline text-red-500 font-mono font-semibold">
                        Click to Open in YouTube ↗
                      </span>
                    </div>

                    {/* Attached Timestamps Chips */}
                    {lecture.timestamps && lecture.timestamps.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {lecture.timestamps.slice(0, 5).map(ts => (
                          <button
                            key={ts.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundManager.playClick();
                              if (onOpenSplitStudy) {
                                onOpenSplitStudy(lecture.id, ts.timeSeconds);
                              } else {
                                openYouTubeLectureInNewTab(lecture.youtubeUrl, ts.timeSeconds);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F8FAFC] dark:bg-[#20212E] hover:bg-red-600 text-red-500 hover:text-white border border-[#E2E8F0] dark:border-[#272730] hover:border-red-500 text-[10px] font-mono font-bold transition-colors cursor-pointer active:scale-95"
                            title={`Jump to ${ts.title} (${ts.timeLabel})`}
                          >
                            <Play className="w-2 h-2 fill-current" />
                            <span>{ts.timeLabel}</span>
                          </button>
                        ))}
                        {lecture.timestamps.length > 5 && (
                          <span className="text-[10px] text-[#85877E] font-mono">
                            +{lecture.timestamps.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E2E8F0] dark:border-[#272730] justify-end flex-wrap">
                  
                  {/* Split Study with Synced Notes Button */}
                  {onOpenSplitStudy && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        soundManager.playClick();
                        onOpenSplitStudy(lecture.id, 0);
                      }}
                      title="Watch Lecture & Take Synced Notes Side-by-Side"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Sync Notes</span>
                    </button>
                  )}

                  {/* Play In-App Button */}
                  <button
                    onClick={(e) => handlePlayEmbedded(e, lecture)}
                    title="Watch In-App Player"
                    className="p-2 rounded-xl bg-[#F8FAFC] dark:bg-[#20212E] hover:bg-[#EEEEE8] dark:hover:bg-[#2D2D35] border border-[#E2E8F0] dark:border-[#272730] text-[#65675F] dark:text-[#A1A1AA] hover:text-[#191A17] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  {/* Open Direct in YouTube Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(lecture);
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <YoutubeIcon className="w-4 h-4 fill-white" />
                    <span>Watch</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  {/* Delete Button */}
                  {deletingId === lecture.id ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDeleteConfirm(e, lecture.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer hover:bg-rose-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(null);
                        }}
                        className="p-1.5 rounded-xl text-[#85877E] hover:text-[#191A17] dark:hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(lecture.id);
                      }}
                      title="Delete Lecture"
                      className="p-2 rounded-xl text-[#85877E] hover:text-rose-600 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          /* Empty State */
          !isAdding && (
            <div className="py-10 sm:py-14 px-4 text-center rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-600 dark:text-red-400 mx-auto shadow-xs">
                <YoutubeIcon className="w-8 h-8 fill-current" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-black text-[#191A17] dark:text-[#F5F5F7] uppercase tracking-wide">
                  No Video Lectures Linked Yet
                </h4>
                <p className="text-xs text-[#65675F] dark:text-[#A1A1AA] max-w-md mx-auto font-medium leading-relaxed">
                  Paste your teacher's YouTube class, one-shot marathon, or PYQ revision video link. Stream directly, take synced notes, and jump to important timestamps!
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleOpenAddForm}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Link Your First YouTube Lecture</span>
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* 4. EMBEDDED IN-APP VIDEO PLAYER MODAL */}
      {activePlayingLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl rounded-3xl bg-[#0B0B0D] border border-[#272730] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#272730] bg-[#18181D]">
              <div className="flex items-center gap-2.5 min-w-0">
                <YoutubeIcon className="w-5 h-5 text-red-500 fill-current shrink-0" />
                <h4 className="text-xs sm:text-sm font-bold text-[#F5F5F7] truncate">
                  {activePlayingLecture.title}
                </h4>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openYouTubeLectureInNewTab(activePlayingLecture.youtubeUrl)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Open in YouTube"
                >
                  <span>Open in YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setActivePlayingLecture(null)}
                  className="p-1.5 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-[#20212E] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Iframe Container */}
            <div className="relative w-full pb-[56.25%] bg-black">
              {getYouTubeEmbedUrl(activePlayingLecture.youtubeUrl) ? (
                <iframe
                  src={getYouTubeEmbedUrl(activePlayingLecture.youtubeUrl)!}
                  title={activePlayingLecture.title}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white space-y-3">
                  <p className="text-sm font-semibold">Unable to embed this YouTube video.</p>
                  <button
                    onClick={() => openYouTubeLectureInNewTab(activePlayingLecture.youtubeUrl)}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Watch Directly on YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

