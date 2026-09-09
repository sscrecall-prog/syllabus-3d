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
import { TelegramIcon, isTelegramUrl, cleanTelegramUrl, parseTelegramDetails } from '../../utils/telegramUtils';
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
  onAddLecture: (lecture: {
    title: string;
    youtubeUrl: string;
    duration?: string;
    notes?: string;
    platform?: 'youtube' | 'telegram';
    telegramUrl?: string;
    channelName?: string;
  }) => void;
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
  const [platform, setPlatform] = useState<'youtube' | 'telegram'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [channelName, setChannelName] = useState('');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [urlError, setUrlError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Active Embedded Video Player State
  const [activePlayingLecture, setActivePlayingLecture] = useState<TopicLecture | null>(null);

  // Live extracted YouTube video ID for thumbnail preview
  const liveVideoId = platform === 'youtube' ? extractYouTubeVideoId(youtubeUrl) : null;
  const liveThumbnail = liveVideoId ? getYouTubeThumbnailUrl(youtubeUrl) : null;
  const liveTelegramDetails = platform === 'telegram' || isTelegramUrl(youtubeUrl) ? parseTelegramDetails(youtubeUrl) : null;

  const handleOpenAddForm = (selectedPlatform: 'youtube' | 'telegram' = 'youtube') => {
    soundManager.playClick();
    setPlatform(selectedPlatform);
    setIsAdding(true);
    setYoutubeUrl('');
    setChannelName('');
    setTitle(
      selectedPlatform === 'telegram'
        ? `Telegram Class: ${topicName}`
        : `Lecture ${lectures.length + 1}: ${topicName}`
    );
    setDuration('');
    setNotes('');
    setUrlError('');
  };

  const handleCancelAdd = () => {
    soundManager.playClick();
    setIsAdding(false);
    setYoutubeUrl('');
    setChannelName('');
    setTitle('');
    setDuration('');
    setNotes('');
    setUrlError('');
  };

  const handleUrlChange = (val: string) => {
    setYoutubeUrl(val);
    if (urlError) setUrlError('');

    // Auto-detect Telegram link
    if (isTelegramUrl(val) && platform !== 'telegram') {
      setPlatform('telegram');
      const details = parseTelegramDetails(val);
      if (!channelName && details.channelOrGroup) {
        setChannelName(details.channelOrGroup);
      }
      if (!title || title.startsWith('Lecture ')) {
        setTitle(`Telegram Class: ${topicName}`);
      }
    } else if ((val.includes('youtube.com') || val.includes('youtu.be')) && platform !== 'youtube') {
      setPlatform('youtube');
      if (title.startsWith('Telegram Class:')) {
        setTitle(`Lecture ${lectures.length + 1}: ${topicName}`);
      }
    }
  };

  const handleSaveLecture = (e: React.FormEvent) => {
    e.preventDefault();
    const rawUrl = youtubeUrl.trim();
    if (!rawUrl) {
      setUrlError(platform === 'telegram' ? 'Please paste a Telegram link or @handle.' : 'Please paste a YouTube video URL.');
      return;
    }

    if (platform === 'telegram') {
      const cleanUrl = cleanTelegramUrl(rawUrl);
      const details = parseTelegramDetails(rawUrl);
      const finalTitle = title.trim() || `Telegram Class: ${topicName}`;
      const finalChannel = channelName.trim() || details.channelOrGroup;

      onAddLecture({
        title: finalTitle,
        youtubeUrl: cleanUrl,
        platform: 'telegram',
        telegramUrl: cleanUrl,
        channelName: finalChannel,
        duration: duration.trim() || undefined,
        notes: notes.trim() || finalChannel || undefined
      });
    } else {
      const videoId = extractYouTubeVideoId(rawUrl);
      if (!videoId) {
        if (isTelegramUrl(rawUrl)) {
          setPlatform('telegram');
          return;
        }
        setUrlError('Invalid YouTube link. Please paste a valid YouTube watch, youtu.be, or shorts link.');
        return;
      }

      const finalTitle = title.trim() || `Lecture ${lectures.length + 1}: ${topicName}`;
      onAddLecture({
        title: finalTitle,
        youtubeUrl: formatYouTubeWatchUrl(rawUrl),
        platform: 'youtube',
        duration: duration.trim() || undefined,
        notes: notes.trim() || undefined
      });
    }

    setIsAdding(false);
    setYoutubeUrl('');
    setChannelName('');
    setTitle('');
    setDuration('');
    setNotes('');
    setUrlError('');
  };

  const handleCardClick = (lecture: TopicLecture) => {
    soundManager.playClick();
    const isTg = lecture.platform === 'telegram' || isTelegramUrl(lecture.youtubeUrl);
    if (isTg) {
      const tgUrl = cleanTelegramUrl(lecture.telegramUrl || lecture.youtubeUrl);
      window.open(tgUrl, '_blank');
    } else {
      openYouTubeLectureInNewTab(lecture.youtubeUrl);
    }
  };

  const handlePlayEmbedded = (e: React.MouseEvent, lecture: TopicLecture) => {
    e.stopPropagation();
    soundManager.playClick();
    const isTg = lecture.platform === 'telegram' || isTelegramUrl(lecture.youtubeUrl);
    if (isTg) {
      const tgUrl = cleanTelegramUrl(lecture.telegramUrl || lecture.youtubeUrl);
      window.open(tgUrl, '_blank');
    } else {
      setActivePlayingLecture(lecture);
    }
  };

  const handleDeleteConfirm = (e: React.MouseEvent, lectureId: string) => {
    e.stopPropagation();
    onDeleteLecture(lectureId);
    setDeletingId(null);
  };

  return (
    <div className="space-y-4">
      
      {/* 1. HEADER & ADD BUTTONS */}
      <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-500/15 via-[#229ED9]/15 to-transparent text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="relative">
              <YoutubeIcon className="w-4 h-4 text-red-500 fill-current inline-block mr-0.5" />
              <TelegramIcon className="w-4 h-4 text-[#229ED9] fill-current inline-block -ml-1" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3 className="text-xs sm:text-sm font-black text-[#11120F] dark:text-[#F5F5F7] uppercase tracking-wide">
                Video Lectures & Classes
              </h3>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-[#F8FAFC] dark:bg-[#20212E] border border-[#E2E8F0] dark:border-[#272730] text-[#65675F] dark:text-[#94A3B8] tabular-nums">
                {lectures.length} {lectures.length === 1 ? 'Lecture' : 'Lectures'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] font-sans mt-0.5">
              Stream YouTube classes & Telegram channel lectures with synced notes
            </p>
          </div>
        </div>

        {!isAdding && (
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <button
              onClick={() => handleOpenAddForm('youtube')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 shrink-0 tap-bounce"
            >
              <YoutubeIcon className="w-3.5 h-3.5 fill-white" />
              <span>+ YouTube</span>
            </button>
            <button
              onClick={() => handleOpenAddForm('telegram')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1E88C7] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 shrink-0 tap-bounce"
            >
              <TelegramIcon className="w-3.5 h-3.5 fill-white" />
              <span>+ Telegram Link</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. ADD LECTURE FORM */}
      {isAdding && (
        <form
          onSubmit={handleSaveLecture}
          className={`p-4 sm:p-5 rounded-3xl bg-[#F8FAFC] dark:bg-[#14151F] border-2 ${
            platform === 'telegram'
              ? 'border-[#229ED9]/40 dark:border-[#229ED9]/50'
              : 'border-red-500/30 dark:border-red-500/40'
          } shadow-elevated-card space-y-4 animate-fade-in relative overflow-hidden`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#272730]">
            {/* Platform Toggle Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730]">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setPlatform('youtube');
                  if (title.startsWith('Telegram Class:')) {
                    setTitle(`Lecture ${lectures.length + 1}: ${topicName}`);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  platform === 'youtube'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <YoutubeIcon className="w-3.5 h-3.5 fill-current" />
                <span>YouTube</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setPlatform('telegram');
                  if (title.startsWith('Lecture ')) {
                    setTitle(`Telegram Class: ${topicName}`);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  platform === 'telegram'
                    ? 'bg-[#229ED9] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TelegramIcon className="w-3.5 h-3.5 fill-current" />
                <span>Telegram</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCancelAdd}
              className="p-1.5 rounded-lg text-[#85877E] hover:text-[#191A17] dark:hover:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* URL Input */}
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#191A17] dark:text-[#F5F5F7] mb-1">
                {platform === 'telegram' ? 'Telegram Video / Channel Link' : 'YouTube Video Link / URL'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={e => handleUrlChange(e.target.value)}
                  placeholder={
                    platform === 'telegram'
                      ? 'Paste link e.g. https://t.me/channel_name/123 or t.me/c/... or @channel'
                      : 'Paste URL e.g. https://youtu.be/... or https://www.youtube.com/watch?v=...'
                  }
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white dark:bg-[#18181D] border text-xs font-medium text-[#191A17] dark:text-[#F5F5F7] placeholder-[#85877E] focus:outline-none transition-all ${
                    urlError
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                      : platform === 'telegram'
                      ? 'border-[#E2E8F0] dark:border-[#272730] focus:border-[#229ED9]'
                      : 'border-[#E2E8F0] dark:border-[#272730] focus:border-red-500'
                  }`}
                  autoFocus
                />
                {platform === 'telegram' ? (
                  <TelegramIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#229ED9] fill-current pointer-events-none" />
                ) : (
                  <YoutubeIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 fill-current pointer-events-none" />
                )}
              </div>
              {urlError && (
                <p className="text-[11px] font-mono font-bold text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{urlError}</span>
                </p>
              )}
            </div>

            {/* Live Video Thumbnail / Telegram Preview Box */}
            {platform === 'youtube' && liveThumbnail && (
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

            {/* Live Telegram Preview Box */}
            {platform === 'telegram' && isTelegramUrl(youtubeUrl) && (
              <div className="p-3 rounded-2xl bg-white dark:bg-[#18181D] border border-[#229ED9]/30 flex items-center gap-3 animate-fade-in shadow-xs">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#229ED9] to-[#0088cc] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <TelegramIcon className="w-7 h-7 fill-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#229ED9]/15 text-[#0088cc] dark:text-[#64B5F6] inline-block mb-1 border border-[#229ED9]/30">
                    ✓ Telegram Link Verified
                  </span>
                  <p className="text-xs font-bold text-[#191A17] dark:text-[#F5F5F7] truncate">
                    Target: <span className="font-mono text-[#229ED9]">{liveTelegramDetails?.displayLabel || youtubeUrl}</span>
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
                placeholder={
                  platform === 'telegram'
                    ? 'e.g. Telegram Class & Chapter Notes'
                    : 'e.g. Complete One-Shot & High Weightage PYQs'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] text-xs font-medium text-[#191A17] dark:text-[#F5F5F7] placeholder-[#85877E] focus:outline-none focus:border-[#229ED9] transition-all"
              />
            </div>

            {/* Duration and Teacher / Channel Notes in 2 columns */}
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
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] text-xs font-medium text-[#191A17] dark:text-[#F5F5F7] placeholder-[#85877E] focus:outline-none focus:border-[#229ED9]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#191A17] dark:text-[#F5F5F7] mb-1">
                  {platform === 'telegram' ? 'Channel / Instructor Name' : 'Teacher / Channel Note'}{' '}
                  <span className="text-[10px] text-[#85877E] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={platform === 'telegram' ? channelName : notes}
                  onChange={e => {
                    if (platform === 'telegram') {
                      setChannelName(e.target.value);
                    } else {
                      setNotes(e.target.value);
                    }
                  }}
                  placeholder={
                    platform === 'telegram'
                      ? 'e.g. @SSC_Maths_Notes / Gagan Sir'
                      : 'e.g. Gagan Pratap Sir / Aditya Ranjan Sir'
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] text-xs font-medium text-[#191A17] dark:text-[#F5F5F7] placeholder-[#85877E] focus:outline-none focus:border-[#229ED9]"
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
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl ${
                platform === 'telegram' ? 'bg-[#229ED9] hover:bg-[#1E88C7]' : 'bg-red-600 hover:bg-red-700'
              } text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-all cursor-pointer active:scale-95 tap-bounce`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save {platform === 'telegram' ? 'Telegram Class' : 'Lecture'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. LECTURES LIST */}
      <div className="space-y-3.5">
        {lectures.length > 0 ? (
          lectures.map((lecture, index) => {
            const isTg = lecture.platform === 'telegram' || isTelegramUrl(lecture.youtubeUrl);
            const tgDetails = isTg ? parseTelegramDetails(lecture.telegramUrl || lecture.youtubeUrl) : null;
            const videoId = !isTg ? extractYouTubeVideoId(lecture.youtubeUrl) : null;
            const thumbnail = videoId ? getYouTubeThumbnailUrl(lecture.youtubeUrl) : null;

            return (
              <div
                key={lecture.id}
                className={`group relative p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] ${
                  isTg
                    ? 'hover:border-[#229ED9]/40 dark:hover:border-[#229ED9]/40'
                    : 'hover:border-red-500/40 dark:hover:border-red-500/40'
                } shadow-xs hover:shadow-md transition-all select-none overflow-hidden space-y-3 sm:space-y-3.5`}
              >
                {/* Top Ambient Glow Line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${
                    isTg ? 'via-[#229ED9]' : 'via-red-500'
                  } to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}
                />

                {/* Main Content Area: Thumbnail + Info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                  {/* 16:9 Thumbnail Container */}
                  {isTg ? (
                    /* Telegram Thumbnail Card */
                    <div
                      onClick={() => handleCardClick(lecture)}
                      className="relative w-full sm:w-48 aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-[#182533] via-[#0E1621] to-[#17212B] shrink-0 shadow-xs border border-[#229ED9]/30 cursor-pointer group/thumb flex flex-col items-center justify-center p-3 text-center select-none"
                    >
                      {/* Telegram Logo Watermark */}
                      <div className="absolute -right-3 -bottom-3 w-20 h-20 text-white/[0.05] pointer-events-none">
                        <TelegramIcon className="w-full h-full fill-current" />
                      </div>

                      {/* Central Play Badge */}
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#229ED9] text-white flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform mb-1">
                        <TelegramIcon className="w-5 h-5 fill-white ml-0.5" />
                      </div>

                      <span className="text-[10px] font-mono font-bold text-[#64B5F6] truncate max-w-full px-2">
                        {lecture.channelName || tgDetails?.displayLabel || 'Telegram Class'}
                      </span>

                      {/* Duration Badge */}
                      {lecture.duration && (
                        <div className="absolute bottom-1.5 right-1.5 px-1.5 sm:px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-mono font-bold border border-white/10 shadow-xs">
                          {lecture.duration}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* YouTube Thumbnail Card */
                    <div
                      onClick={() => handleCardClick(lecture)}
                      className="relative w-full sm:w-48 aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 shrink-0 shadow-xs border border-[#E2E8F0]/80 dark:border-[#272730] cursor-pointer group/thumb"
                    >
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={lecture.title}
                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#11120F] text-red-500">
                          <YoutubeIcon className="w-10 h-10 fill-current" />
                        </div>
                      )}

                      {/* Central Play Badge */}
                      <div className="absolute inset-0 bg-black/25 group-hover/thumb:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform">
                          <Play className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-white ml-0.5" />
                        </div>
                      </div>

                      {/* Duration Badge */}
                      {lecture.duration && (
                        <div className="absolute bottom-1.5 right-1.5 px-1.5 sm:px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-mono font-bold border border-white/10 shadow-xs">
                          {lecture.duration}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Video Information & Chapters */}
                  <div className="space-y-1.5 flex-1 min-w-0 w-full">
                    {/* Meta Pills: Lecture Number / Platform + Teacher / Channel + Added Date */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      {isTg ? (
                        <span className="whitespace-nowrap px-2 sm:px-2.5 py-0.5 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-bold bg-[#229ED9]/15 text-[#0088cc] dark:text-[#64B5F6] border border-[#229ED9]/25 font-mono tracking-wide flex items-center gap-1">
                          <TelegramIcon className="w-3 h-3 fill-current" />
                          <span>Telegram #{index + 1}</span>
                        </span>
                      ) : (
                        <span className="whitespace-nowrap px-2 sm:px-2.5 py-0.5 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-mono tracking-wide">
                          Lecture #{index + 1}
                        </span>
                      )}

                      {(lecture.channelName || lecture.notes) && (
                        <span className="px-2 sm:px-2.5 py-0.5 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-medium bg-slate-100 dark:bg-[#1E2030] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 max-w-[180px] sm:max-w-[200px] truncate">
                          {lecture.channelName || lecture.notes}
                        </span>
                      )}

                      <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1 sm:ml-auto">
                        <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                        <span>Added {lecture.addedAt}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h4
                      onClick={() => handleCardClick(lecture)}
                      className={`text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 cursor-pointer ${
                        isTg ? 'hover:text-[#229ED9] dark:hover:text-[#64B5F6]' : 'hover:text-red-600 dark:hover:text-red-400'
                      } transition-colors`}
                    >
                      {lecture.title}
                    </h4>

                    {/* Attached Timestamps / Key Chapters */}
                    {lecture.timestamps && lecture.timestamps.length > 0 && (
                      <div className="pt-0.5">
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                          <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-0.5">
                            Chapters:
                          </span>
                          {lecture.timestamps.slice(0, 5).map(ts => (
                            <button
                              key={ts.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                soundManager.playClick();
                                if (onOpenSplitStudy) {
                                  onOpenSplitStudy(lecture.id, ts.timeSeconds);
                                } else if (!isTg) {
                                  openYouTubeLectureInNewTab(lecture.youtubeUrl, ts.timeSeconds);
                                } else {
                                  handleCardClick(lecture);
                                }
                              }}
                              className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-md sm:rounded-lg bg-slate-100/90 dark:bg-[#1E2030] ${
                                isTg
                                  ? 'hover:bg-[#229ED9] hover:text-white dark:hover:bg-[#229ED9]'
                                  : 'hover:bg-red-600 hover:text-white dark:hover:bg-red-600'
                              } dark:hover:text-white border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 text-[10px] sm:text-[11px] font-mono font-semibold transition-all cursor-pointer active:scale-95 shadow-2xs tap-bounce`}
                              title={`Jump to ${ts.title} (${ts.timeLabel})`}
                            >
                              <Play className="w-2 h-2 fill-current" />
                              <span>{ts.timeLabel}</span>
                            </button>
                          ))}
                          {lecture.timestamps.length > 5 && (
                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono font-medium">
                              +{lecture.timestamps.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Bottom Actions Bar with Divider */}
                <div className="pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-[#272730] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {/* Left Status */}
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span className={`w-2 h-2 rounded-full ${isTg ? 'bg-[#229ED9]' : 'bg-emerald-500'}`} />
                    <span>{isTg ? 'Telegram Cloud Video' : 'YouTube Ready'}</span>
                  </div>

                  {/* Right Action Suite */}
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-between sm:justify-end sm:ml-auto w-full sm:w-auto">
                    {/* Split Study with Synced Notes Button */}
                    {onOpenSplitStudy && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.playClick();
                          onOpenSplitStudy(lecture.id, 0);
                        }}
                        title="Open Lecture & Take Synced Notes Side-by-Side"
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#EFF6FF] dark:bg-[#1E2438] hover:bg-[#DBEAFE] dark:hover:bg-[#252E48] border border-[#DBEAFE] dark:border-[#2F3A5C] text-[#2563EB] dark:text-[#7AA2F7] text-[11px] sm:text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs tap-bounce"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Sync Notes</span>
                      </button>
                    )}

                    {/* Play In-App (Theater Mode for YouTube) */}
                    {!isTg && (
                      <button
                        onClick={(e) => handlePlayEmbedded(e, lecture)}
                        title="Watch in Theater Modal"
                        className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-[#1E2030] hover:bg-slate-200 dark:hover:bg-[#282C40] border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer active:scale-95 tap-bounce"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Direct Action Button: Open in Telegram OR Watch in YouTube */}
                    {isTg ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(lecture);
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#229ED9] hover:bg-[#1E88C7] text-white text-[11px] sm:text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 tap-bounce"
                      >
                        <TelegramIcon className="w-3.5 h-3.5 fill-white" />
                        <span>Open Telegram</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(lecture);
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] sm:text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 tap-bounce"
                      >
                        <YoutubeIcon className="w-4 h-4 fill-white" />
                        <span>Watch</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    {/* Delete Button */}
                    {deletingId === lecture.id ? (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleDeleteConfirm(e, lecture.id)}
                          className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer hover:bg-rose-700 active:scale-95"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(null);
                          }}
                          className="p-1 sm:p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
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
                        className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* Empty State */
          !isAdding && (
            <div className="py-10 sm:py-14 px-4 text-center rounded-3xl bg-white dark:bg-[#18181D] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-red-500/10 via-[#229ED9]/15 to-transparent border border-slate-200 dark:border-slate-700/80 flex items-center justify-center text-red-600 dark:text-red-400 mx-auto shadow-xs">
                <div className="flex items-center -space-x-1">
                  <YoutubeIcon className="w-7 h-7 text-red-500 fill-current" />
                  <TelegramIcon className="w-7 h-7 text-[#229ED9] fill-current" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-black text-[#191A17] dark:text-[#F5F5F7] uppercase tracking-wide">
                  No Video Lectures Linked Yet
                </h4>
                <p className="text-xs text-[#65675F] dark:text-[#A1A1AA] max-w-md mx-auto font-medium leading-relaxed">
                  Attach your teacher's YouTube class or Telegram channel videos. Stream directly, take synced notes, and jump to important timestamps!
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2.5 flex-wrap">
                <button
                  onClick={() => handleOpenAddForm('youtube')}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-all cursor-pointer active:scale-95 tap-bounce"
                >
                  <YoutubeIcon className="w-4 h-4 fill-white" />
                  <span>+ Add YouTube Lecture</span>
                </button>
                <button
                  onClick={() => handleOpenAddForm('telegram')}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1E88C7] text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-all cursor-pointer active:scale-95 tap-bounce"
                >
                  <TelegramIcon className="w-4 h-4 fill-white" />
                  <span>+ Add Telegram Link</span>
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

