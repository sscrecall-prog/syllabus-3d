import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSyllabus } from '../../context/SyllabusContext';
import { useTimer } from '../../context/TimerContext';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Flame,
  Hourglass,
  Coffee,
  Timer as StopwatchIcon,
  Clock,
  Search,
  Settings,
  Edit2,
  PictureInPicture2,
  Minimize2,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  Target,
  Plus,
  Minus,
  CheckSquare,
  CloudRain,
  Waves,
  Brain,
  SkipForward,
  Award,
  Activity,
  Headphones
} from 'lucide-react';
import { ambientEngine, AmbientSoundType } from '../../utils/ambientSounds';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';
import { mediaSessionManager } from '../../utils/mediaSession';
import { TimerMode } from '../../types/timer';

interface PomodoroFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTopicId?: string;
}

export const PomodoroFocusModal: React.FC<PomodoroFocusModalProps> = ({
  isOpen,
  onClose,
  defaultTopicId
}) => {
  const { allTopics, profile } = useSyllabus();
  const {
    session,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    stopTimer,
    setSessionMode,
    setSessionTopic,
    requestPictureInPicture,
    exitPictureInPicture,
    isPiPActive,
    showFloatingOverlay,
    openPermissionModal
  } = useTimer();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoopModalOpen, setIsLoopModalOpen] = useState(false);

  const [focusDurationMinutes, setFocusDurationMinutes] = useState<number>(() => {
    return session.mode === 'pomodoro' ? Math.max(1, Math.round(session.totalDurationSec / 60)) : 25;
  });
  const [breakDurationMinutes, setBreakDurationMinutes] = useState<number>(() => {
    return session.mode === 'break' ? Math.max(1, Math.round(session.totalDurationSec / 60)) : 5;
  });
  const [customTimerMinutes, setCustomTimerMinutes] = useState<number>(() => {
    return session.mode === 'timer' ? Math.max(1, Math.round(session.totalDurationSec / 60)) : 45;
  });

  const [targetLoops, setTargetLoops] = useState<number>(session.targetLoops || 4);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(defaultTopicId || session.topicId || '');
  const [isTopicSearchOpen, setIsTopicSearchOpen] = useState(false);
  const [topicSearchTerm, setTopicSearchTerm] = useState('');

  const [activeSound, setActiveSound] = useState<AmbientSoundType>('rain');
  const [soundVolume, setSoundVolume] = useState<number>(0.5);

  useEffect(() => {
    if (defaultTopicId) {
      setSelectedTopicId(defaultTopicId);
      const top = allTopics.find(t => t.topic.id === defaultTopicId);
      if (top) setSessionTopic(top.topic.id, top.topic.name, top.subjectName);
    } else if (allTopics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(allTopics[0].topic.id);
      setSessionTopic(allTopics[0].topic.id, allTopics[0].topic.name, allTopics[0].subjectName);
    }
  }, [defaultTopicId, allTopics]);

  // Ambient Audio Engine Control
  useEffect(() => {
    if (isOpen && session.status === 'running' && activeSound !== 'none') {
      ambientEngine.play(activeSound);
      ambientEngine.setVolume(soundVolume);
    } else {
      ambientEngine.stop();
    }
    return () => ambientEngine.stop();
  }, [isOpen, session.status, activeSound, soundVolume]);

  const isRunning = session.status === 'running';
  const isPaused = session.status === 'paused';
  const isIdle = session.status === 'idle';

  // MediaSession API Integration for Lock-Screen and Earbud Controls
  useEffect(() => {
    if (!isOpen && session.status === 'idle') {
      mediaSessionManager.clear();
      return;
    }

    const top = allTopics.find(t => t.topic.id === selectedTopicId);
    const minsLeft = Math.ceil(session.remainingSec / 60);

    mediaSessionManager.updateMetadata({
      title: session.mode === 'stopwatch'
        ? `Stopwatch (${formatTime(session.stopwatchElapsedSec)})`
        : `${session.mode.toUpperCase()} • ${minsLeft}m left`,
      artist: top ? `${top.topic.name} • ${top.subjectName}` : 'Syllabus 3D Focus Chamber',
      album: activeSound !== 'none' ? `Ambience: ${activeSound.toUpperCase()}` : 'Focus Mode'
    });

    mediaSessionManager.setPlaybackState(
      isRunning ? 'playing' : isPaused ? 'paused' : 'none'
    );

    mediaSessionManager.setActionHandlers({
      onPlay: () => {
        if (!isRunning) handleTogglePlay();
      },
      onPause: () => {
        if (isRunning) handleTogglePlay();
      },
      onStop: () => {
        resetTimer();
      },
      onNext: () => {
        handleSkipNext();
      }
    });
  }, [isOpen, session.status, session.remainingSec, session.stopwatchElapsedSec, session.mode, activeSound, selectedTopicId]);

  // Keyboard shortcut listener (Space = Play/Pause, Esc = Close/Minimize)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'Escape') {
        if (isTopicSearchOpen) {
          setIsTopicSearchOpen(false);
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isLoopModalOpen) {
          setIsLoopModalOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRunning, isPaused, isTopicSearchOpen, isSettingsOpen, isLoopModalOpen]);

  const handleTogglePlay = () => {
    haptics.medium();
    if (isRunning) {
      soundManager.playClick();
      pauseTimer();
    } else if (isPaused) {
      soundManager.playPomodoroBell();
      resumeTimer();
    } else {
      soundManager.playPomodoroBell();
      if (
        window.AndroidFloatingTimer &&
        window.AndroidFloatingTimer.isOverlayPermissionGranted &&
        !window.AndroidFloatingTimer.isOverlayPermissionGranted()
      ) {
        openPermissionModal();
      }
      const top = allTopics.find(t => t.topic.id === selectedTopicId);
      let dur = focusDurationMinutes;
      if (session.mode === 'break') dur = breakDurationMinutes;
      else if (session.mode === 'timer') dur = customTimerMinutes;

      startTimer({
        mode: session.mode,
        durationMinutes: dur,
        topicId: top?.topic.id,
        topicName: top?.topic.name,
        subjectName: top?.subjectName,
        currentLoop: session.currentLoop || 1,
        targetLoops: session.targetLoops || targetLoops,
        isLoopActive: session.isLoopActive
      });
    }
  };

  const handleStartLoopFlow = () => {
    setIsLoopModalOpen(false);
    setIsSettingsOpen(false);
    soundManager.playClick();
    haptics.success();

    const top = allTopics.find(t => t.topic.id === selectedTopicId);
    startTimer({
      mode: 'pomodoro',
      durationMinutes: focusDurationMinutes,
      topicId: top?.topic.id,
      topicName: top?.topic.name,
      subjectName: top?.subjectName,
      currentLoop: 1,
      targetLoops,
      isLoopActive: true
    });
  };

  // Fast on-the-fly minute adjustment
  const handleQuickAdjust = (minutesDelta: number) => {
    soundManager.playClick();
    haptics.light();
    if (session.mode === 'pomodoro' && session.status === 'idle') {
      const next = Math.max(1, Math.min(180, focusDurationMinutes + minutesDelta));
      setFocusDurationMinutes(next);
      setSessionMode('pomodoro', next);
    } else if (session.mode === 'break' && session.status === 'idle') {
      const next = Math.max(1, Math.min(60, breakDurationMinutes + minutesDelta));
      setBreakDurationMinutes(next);
      setSessionMode('break', next);
    } else if (session.mode === 'timer' && session.status === 'idle') {
      const next = Math.max(1, Math.min(180, customTimerMinutes + minutesDelta));
      setCustomTimerMinutes(next);
      setSessionMode('timer', next);
    }
  };

  const handleApplyPreset = (minutes: number) => {
    soundManager.playClick();
    haptics.light();
    if (session.mode === 'pomodoro') {
      setFocusDurationMinutes(minutes);
      if (isIdle) setSessionMode('pomodoro', minutes);
    } else if (session.mode === 'break') {
      setBreakDurationMinutes(minutes);
      if (isIdle) setSessionMode('break', minutes);
    } else if (session.mode === 'timer') {
      setCustomTimerMinutes(minutes);
      if (isIdle) setSessionMode('timer', minutes);
    }
  };

  const handleSkipNext = () => {
    soundManager.playClick();
    haptics.medium();
    if (session.isLoopActive && session.mode === 'pomodoro') {
      setSessionMode('break', breakDurationMinutes);
    } else if (session.isLoopActive && session.mode === 'break') {
      setSessionMode('pomodoro', focusDurationMinutes);
    } else {
      resetTimer();
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = useMemo(() => {
    if (session.mode === 'stopwatch') return (session.stopwatchElapsedSec % 60) / 60;
    if (session.totalDurationSec === 0) return 0;
    return Math.min(1, Math.max(0, (session.totalDurationSec - session.remainingSec) / session.totalDurationSec));
  }, [session.mode, session.stopwatchElapsedSec, session.remainingSec, session.totalDurationSec]);

  const selectedTopic = allTopics.find(t => t.topic.id === selectedTopicId);

  const filteredTopics = useMemo(() => {
    if (!topicSearchTerm.trim()) return allTopics;
    const q = topicSearchTerm.toLowerCase();
    return allTopics.filter(t =>
      t.topic.name.toLowerCase().includes(q) ||
      t.subjectName.toLowerCase().includes(q)
    );
  }, [allTopics, topicSearchTerm]);

  // Dynamic luxury mode configuration
  const modeConfig = useMemo(() => {
    switch (session.mode) {
      case 'break':
        return {
          id: 'break' as TimerMode,
          label: 'Break Interval',
          shortLabel: 'Break',
          icon: Coffee,
          gradStart: '#F59E0B',
          gradEnd: '#EF4444',
          glow: 'rgba(245, 158, 11, 0.45)',
          activeTabBg: 'bg-amber-500 text-white shadow-sm',
          accentColor: '#F59E0B',
          presets: [
            { mins: 5, label: '5m', tag: 'Quick' },
            { mins: 10, label: '10m', tag: 'Coffee' },
            { mins: 15, label: '15m', tag: 'Walk' },
            { mins: 20, label: '20m', tag: 'Recharge' }
          ]
        };
      case 'stopwatch':
        return {
          id: 'stopwatch' as TimerMode,
          label: 'Continuous Stopwatch',
          shortLabel: 'Stopwatch',
          icon: StopwatchIcon,
          gradStart: '#0EA5E9',
          gradEnd: '#8B5CF6',
          glow: 'rgba(14, 165, 233, 0.45)',
          activeTabBg: 'bg-sky-500 text-white shadow-sm',
          accentColor: '#0EA5E9',
          presets: []
        };
      case 'timer':
        return {
          id: 'timer' as TimerMode,
          label: 'Custom Countdown',
          shortLabel: 'Custom',
          icon: Clock,
          gradStart: '#8B5CF6',
          gradEnd: '#EC4899',
          glow: 'rgba(139, 92, 246, 0.45)',
          activeTabBg: 'bg-purple-500 text-white shadow-sm',
          accentColor: '#8B5CF6',
          presets: [
            { mins: 10, label: '10m', tag: 'Sprint' },
            { mins: 20, label: '20m', tag: 'Drill' },
            { mins: 30, label: '30m', tag: 'Quiz' },
            { mins: 45, label: '45m', tag: 'Section' },
            { mins: 60, label: '60m', tag: 'Mock' }
          ]
        };
      case 'pomodoro':
      default:
        return {
          id: 'pomodoro' as TimerMode,
          label: 'Deep Focus Chamber',
          shortLabel: 'Pomodoro',
          icon: Zap,
          gradStart: '#10B981',
          gradEnd: '#06B6D4',
          glow: 'rgba(16, 185, 129, 0.45)',
          activeTabBg: 'bg-[#2563EB] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] shadow-sm',
          accentColor: '#10B981',
          presets: [
            { mins: 15, label: '15m', tag: 'Sprint' },
            { mins: 25, label: '25m', tag: 'Classic' },
            { mins: 45, label: '45m', tag: 'Deep' },
            { mins: 60, label: '60m', tag: 'Mastery' },
            { mins: 90, label: '90m', tag: 'Marathon' }
          ]
        };
    }
  }, [session.mode]);

  const currentDurationMins =
    session.mode === 'break'
      ? breakDurationMinutes
      : session.mode === 'timer'
      ? customTimerMinutes
      : focusDurationMinutes;

  if (!isOpen) return null;

  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent * circumference);

  const tipAngle = (progressPercent * 360 - 90) * (Math.PI / 180);
  const tipX = 120 + radius * Math.cos(tipAngle);
  const tipY = 120 + radius * Math.sin(tipAngle);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none animate-fade-in font-sans"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#12141F] border border-[#E2E8F0] dark:border-[#282C40] shadow-2xl p-4 sm:p-6 flex flex-col justify-between overflow-hidden max-h-[92vh] my-auto transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle Ambient Radial Glow */}
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
          style={{ background: modeConfig.gradStart }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none transition-all duration-700"
          style={{ background: modeConfig.gradEnd }}
        />

        {/* 1. TOP HEADER TOOLBAR */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#222638] shrink-0 relative z-10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs transition-transform active:scale-95"
              style={{ background: `linear-gradient(135deg, ${modeConfig.gradStart}, ${modeConfig.gradEnd})` }}
            >
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-[13px] sm:text-sm font-black text-[#11120F] dark:text-[#F8FAFC] uppercase tracking-wide font-mono">
                  {isSettingsOpen ? 'Protocol Config' : '3D Focus Chamber'}
                </h3>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.08] text-[#2563EB] dark:text-[#7AA2F7] font-mono">
                  v2.5
                </span>
              </div>
              <p className="text-[11px] font-bold text-[#2563EB] dark:text-[#7AA2F7] flex items-center gap-1">
                <Sparkles className="w-3 h-3 inline" />
                <span>
                  {isSettingsOpen
                    ? 'Chamber & Overlay Customization'
                    : session.isLoopActive
                    ? `Multi-Loop Active • Loop ${session.currentLoop || 1} of ${session.targetLoops || 4}`
                    : 'Executive Study Session • +25 XP / cycle'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Picture-in-Picture Popout Window */}
            <button
              onClick={async () => {
                soundManager.playClick();
                if (isPiPActive) {
                  await exitPictureInPicture();
                } else {
                  await requestPictureInPicture();
                }
              }}
              className={`p-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 ${
                isPiPActive
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] text-[#65675F] dark:text-[#94A3B8] hover:text-[#11120F] dark:hover:text-white'
              }`}
              title={isPiPActive ? 'Exit Picture-in-Picture' : 'Pop out Picture-in-Picture Floating Window'}
            >
              <PictureInPicture2 className="w-4 h-4" />
            </button>

            {/* Minimize to In-App Floating Capsule */}
            <button
              onClick={() => {
                soundManager.playClick();
                showFloatingOverlay();
                onClose();
              }}
              className="p-2 rounded-xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] text-[#2563EB] dark:text-[#7AA2F7] hover:bg-[#F1F5F9] dark:hover:bg-[#222638] transition-all cursor-pointer shadow-xs active:scale-95"
              title="Minimize to In-App Floating Capsule"
            >
              <Minimize2 className="w-4 h-4" />
            </button>

            {/* Settings Toggle */}
            <button
              onClick={() => {
                soundManager.playClick();
                setIsSettingsOpen(prev => !prev);
              }}
              className={`p-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 ${
                isSettingsOpen
                  ? 'bg-[#2563EB] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D]'
                  : 'bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] text-[#65675F] dark:text-[#94A3B8] hover:text-[#11120F] dark:hover:text-white'
              }`}
              title="Configure Focus Protocols"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Close Modal Button */}
            <button
              onClick={() => {
                soundManager.playClick();
                if (isRunning || isPaused) {
                  showFloatingOverlay();
                }
                onClose();
              }}
              className="p-2 rounded-xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] text-[#85877E] hover:text-[#11120F] dark:hover:text-white cursor-pointer shadow-xs active:scale-95"
              title="Close Modal (Timer runs in background/floating capsule)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* VIEW A: DEDICATED TIMER PROTOCOL SETTINGS */}
        {isSettingsOpen ? (
          <div className="py-3 space-y-4 overflow-y-auto flex-1 animate-fade-in text-xs relative z-10">
            {/* Focus Duration */}
            <div className="p-3 rounded-2xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-[#11120F] dark:text-[#F8FAFC]">
                    Focus Study Duration
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm font-extrabold text-[#11120F] dark:text-white font-mono">
                  <span>{focusDurationMinutes}</span>
                  <span className="text-[11px] text-[#85877E] font-normal">min</span>
                </div>
              </div>

              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={focusDurationMinutes}
                onChange={e => {
                  const val = Number(e.target.value);
                  setFocusDurationMinutes(val);
                  if (session.mode === 'pomodoro' && isIdle) {
                    setSessionMode('pomodoro', val);
                  }
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />

              <div className="flex items-center gap-1.5 pt-1">
                {[15, 25, 45, 60, 90].map(mins => (
                  <button
                    key={mins}
                    onClick={() => {
                      setFocusDurationMinutes(mins);
                      if (session.mode === 'pomodoro' && isIdle) {
                        setSessionMode('pomodoro', mins);
                      }
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                      focusDurationMinutes === mins
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-[#F8FAFC] dark:bg-[#12141F] border border-[#E2E8F0] dark:border-[#282C40] text-[#65675F] dark:text-[#94A3B8]'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Break Duration */}
            <div className="p-3 rounded-2xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-[#11120F] dark:text-[#F8FAFC]">
                    Break Rest Duration
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm font-extrabold text-[#11120F] dark:text-white font-mono">
                  <span>{breakDurationMinutes}</span>
                  <span className="text-[11px] text-[#85877E] font-normal">min</span>
                </div>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                step="1"
                value={breakDurationMinutes}
                onChange={e => {
                  const val = Number(e.target.value);
                  setBreakDurationMinutes(val);
                  if (session.mode === 'break' && isIdle) {
                    setSessionMode('break', val);
                  }
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex items-center gap-1.5 pt-1">
                {[5, 10, 15, 20].map(mins => (
                  <button
                    key={mins}
                    onClick={() => {
                      setBreakDurationMinutes(mins);
                      if (session.mode === 'break' && isIdle) {
                        setSessionMode('break', mins);
                      }
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                      breakDurationMinutes === mins
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-[#F8FAFC] dark:bg-[#12141F] border border-[#E2E8F0] dark:border-[#282C40] text-[#65675F] dark:text-[#94A3B8]'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-Loop Cycle Protocol Button */}
            <div className="pt-2">
              <button
                onClick={() => setIsLoopModalOpen(true)}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#11120F] to-[#25281E] hover:from-[#2563EB] hover:to-[#1D4ED8] dark:from-[#7AA2F7] dark:to-[#5B8BF5] text-white dark:text-[#0B0B0D] font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <Clock className="w-4 h-4" />
                <span>Configure Multi-Loop Cycle ({targetLoops} Loops)</span>
              </button>
            </div>
          </div>
        ) : (
          /* VIEW B: MAIN ACTIVE 3D FOCUS CHAMBER */
          <div className="py-2.5 space-y-3 flex-1 flex flex-col justify-between animate-fade-in relative z-10">
            {/* 1. TOPIC SELECTOR BAR */}
            <div className="relative">
              <button
                onClick={() => setIsTopicSearchOpen(prev => !prev)}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] text-xs cursor-pointer shadow-xs hover:border-[#2563EB] dark:hover:border-[#7AA2F7] transition-all group"
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0"
                    style={{ background: modeConfig.accentColor }}
                  />
                  <span className="font-bold text-[#11120F] dark:text-[#F8FAFC] truncate">
                    {selectedTopic ? selectedTopic.topic.name : 'Select Topic to Track Focus'}
                  </span>
                  {selectedTopic && (
                    <span className="text-[11px] text-[#65675F] dark:text-[#94A3B8] truncate font-mono">
                      • {selectedTopic.subjectName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-[#85877E] dark:text-[#64748B] group-hover:text-[#11120F] dark:group-hover:text-white transition-colors">
                    Change
                  </span>
                  <Search className="w-3.5 h-3.5 text-[#85877E] shrink-0" />
                </div>
              </button>

              {isTopicSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] shadow-2xl p-2 z-30 max-h-56 overflow-y-auto space-y-1 animate-scale-up">
                  <input
                    type="text"
                    placeholder="Search syllabus topics..."
                    value={topicSearchTerm}
                    onChange={e => setTopicSearchTerm(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#12141F] border border-[#E2E8F0] dark:border-[#282C40] text-xs mb-1.5 focus:outline-none focus:border-[#2563EB] dark:focus:border-[#7AA2F7]"
                  />
                  {filteredTopics.map(t => (
                    <div
                      key={t.topic.id}
                      onClick={() => {
                        setSelectedTopicId(t.topic.id);
                        setSessionTopic(t.topic.id, t.topic.name, t.subjectName);
                        setIsTopicSearchOpen(false);
                      }}
                      className="p-2.5 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-[#222638] cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <span className="font-bold text-[#11120F] dark:text-[#F8FAFC] truncate">{t.topic.name}</span>
                      <span className="text-[11px] text-[#85877E] font-mono shrink-0 ml-2">{t.subjectName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. MODE SWITCHER TABS (Pomodoro, Break, Stopwatch, Custom) */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40]">
              {[
                { id: 'pomodoro' as TimerMode, label: 'Pomodoro', icon: Zap },
                { id: 'break' as TimerMode, label: 'Break', icon: Coffee },
                { id: 'stopwatch' as TimerMode, label: 'Stopwatch', icon: StopwatchIcon },
                { id: 'timer' as TimerMode, label: 'Custom', icon: Clock }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = session.mode === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      let dur = focusDurationMinutes;
                      if (tab.id === 'break') dur = breakDurationMinutes;
                      else if (tab.id === 'timer') dur = customTimerMinutes;
                      setSessionMode(tab.id, dur);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 ${
                      isActive
                        ? modeConfig.activeTabBg
                        : 'text-[#65675F] dark:text-[#94A3B8] hover:text-[#11120F] dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 3. 1-CLICK DURATION PRESETS STRIP */}
            {modeConfig.presets.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[10px] font-mono font-bold text-[#85877E] shrink-0 pl-1">
                  Preset:
                </span>
                {modeConfig.presets.map(p => {
                  const isCurrent = currentDurationMins === p.mins;
                  return (
                    <button
                      key={p.mins}
                      onClick={() => handleApplyPreset(p.mins)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 shrink-0 ${
                        isCurrent
                          ? 'bg-black/10 dark:bg-white/10 text-[#11120F] dark:text-white border border-black/15 dark:border-white/20 shadow-xs'
                          : 'bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] text-[#65675F] dark:text-[#94A3B8] hover:border-black/20 dark:hover:border-white/20'
                      }`}
                    >
                      <span>{p.label}</span>
                      <span className="text-[9px] opacity-70 font-sans font-normal">({p.tag})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 4. GRANULAR MINUTE ADJUSTMENT (When idle) */}
            {isIdle && session.mode !== 'stopwatch' && (
              <div className="flex items-center justify-center gap-2">
                {[-5, -1, 1, 5].map(delta => (
                  <button
                    key={delta}
                    onClick={() => handleQuickAdjust(delta)}
                    className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] text-[11px] font-mono font-bold text-[#65675F] dark:text-[#94A3B8] hover:border-[#2563EB] dark:hover:border-[#7AA2F7] transition-all cursor-pointer active:scale-95"
                  >
                    {delta > 0 ? `+${delta}m` : `${delta}m`}
                  </button>
                ))}
              </div>
            )}

            {/* 5. LUXURY 3D RADIAL GAUGE DIAL */}
            <div className="flex flex-col items-center justify-center my-1 relative">
              <div className="relative w-52 h-52 sm:w-56 sm:h-56 flex items-center justify-center">
                
                {/* SVG Dial Gauge */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 240 240">
                  <defs>
                    <linearGradient id="activeDialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={modeConfig.gradStart} />
                      <stop offset="100%" stopColor={modeConfig.gradEnd} />
                    </linearGradient>

                    <filter id="dialNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Outer Orbit Tick Ring */}
                  <circle
                    cx="120"
                    cy="120"
                    r="114"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="2, 6"
                    className="text-black/10 dark:text-white/10"
                    fill="transparent"
                  />

                  {/* Background Track Circle */}
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-[#E2E8F0] dark:text-[#1F2335]"
                    fill="transparent"
                  />

                  {/* Active Progress Arc */}
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    stroke="url(#activeDialGradient)"
                    strokeWidth="9"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    filter="url(#dialNeonGlow)"
                    fill="transparent"
                    className="transition-all duration-300 ease-out"
                  />

                  {/* Glowing Orbit Tip Dot */}
                  {progressPercent > 0.005 && (
                    <circle
                      cx={tipX}
                      cy={tipY}
                      r="5.5"
                      fill={modeConfig.gradEnd}
                      className="animate-pulse"
                      style={{ filter: `drop-shadow(0 0 6px ${modeConfig.glow})` }}
                    />
                  )}
                </svg>

                {/* Centered Luxury Digital Display */}
                <div className="absolute flex flex-col items-center justify-center text-center px-4">
                  {/* Mode / Loop Indicator Pill */}
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] mb-1">
                    <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-[#65675F] dark:text-[#94A3B8]">
                      {session.mode === 'pomodoro' && session.isLoopActive
                        ? `LOOP ${session.currentLoop || 1} / ${session.targetLoops || 4}`
                        : modeConfig.label}
                    </span>
                  </div>

                  {/* High-Precision Numbers */}
                  <span className="text-4xl sm:text-5xl font-black text-[#11120F] dark:text-[#F8FAFC] font-mono tracking-tight tabular-nums drop-shadow-xs">
                    {session.mode === 'stopwatch'
                      ? formatTime(session.stopwatchElapsedSec)
                      : formatTime(session.remainingSec)}
                  </span>
                  
                  {/* Status Indicator Badge */}
                  <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isRunning
                          ? 'bg-emerald-500 animate-ping'
                          : isPaused
                          ? 'bg-amber-500'
                          : 'bg-zinc-400'
                      }`}
                    />
                    <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                      isRunning
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isPaused
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-[#85877E] dark:text-[#94A3B8]'
                    }`}>
                      {isRunning
                        ? session.mode === 'break'
                          ? 'Resting'
                          : 'Focus Active'
                        : isPaused
                        ? 'Paused'
                        : 'Ready to Launch'}
                    </span>
                  </div>

                  {/* Micro Progress Readout */}
                  <span className="text-[10px] font-mono font-semibold text-[#85877E] dark:text-[#64748B] mt-0.5">
                    {session.mode === 'stopwatch'
                      ? 'Live Study Chrono'
                      : `${Math.round(progressPercent * 100)}% Complete • ${Math.ceil(session.remainingSec / 60)}m left`}
                  </span>
                </div>
              </div>
            </div>

            {/* 6. EXECUTIVE CONTROL ACTION BAR */}
            <div className="flex items-center justify-center gap-3 pt-1">
              {/* Reset Button */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  resetTimer();
                }}
                className="p-3 rounded-2xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] text-xs font-bold text-[#65675F] dark:text-[#94A3B8] hover:text-[#11120F] dark:hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
                title="Reset Timer to Initial State"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Primary Tactile Start / Pause Button */}
              <button
                onClick={handleTogglePlay}
                className="flex-1 max-w-[210px] py-3.5 px-6 rounded-2xl text-xs font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer text-white"
                style={{
                  background: isRunning
                    ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                    : isPaused
                    ? 'linear-gradient(135deg, #10B981, #059669)'
                    : `linear-gradient(135deg, ${modeConfig.gradStart}, ${modeConfig.gradEnd})`,
                  boxShadow: `0 4px 14px ${modeConfig.glow}`
                }}
              >
                {isRunning ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
                <span>{isRunning ? 'Pause' : isPaused ? 'Resume' : 'Start Focus'}</span>
                <span className="text-[10px] font-mono opacity-80 px-1.5 py-0.2 rounded bg-black/20 text-white font-normal hidden sm:inline">
                  Space
                </span>
              </button>

              {/* Skip / Next Loop Button */}
              <button
                onClick={handleSkipNext}
                className="p-3 rounded-2xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] text-xs font-bold text-[#65675F] dark:text-[#94A3B8] hover:text-[#11120F] dark:hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
                title={session.isLoopActive ? 'Skip to Next Interval' : 'Finish / Skip Timer'}
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* 7. AMBIENT SOUNDTRACK STRIP WITH EQUALIZER */}
            <div className="p-2.5 rounded-2xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#65675F] dark:text-[#94A3B8]">
                <div className="flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#7AA2F7]" />
                  <span>Ambience Soundscapes</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Equalizer Waveform when audio active */}
                  {isRunning && activeSound !== 'none' && (
                    <div className="flex items-end gap-0.5 h-3 px-1.5 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20">
                      <span className="w-0.5 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-bounce" />
                      <span className="w-0.5 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-0.5 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                  )}

                  {/* Volume Slider */}
                  <div className="flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-[#85877E]" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={soundVolume}
                      onChange={e => setSoundVolume(Number(e.target.value))}
                      className="w-14 sm:w-18 h-1 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#2563EB] dark:accent-[#7AA2F7]"
                      title={`Volume: ${Math.round(soundVolume * 100)}%`}
                    />
                    <span className="text-[10px] font-mono text-[#85877E] w-5 text-right">
                      {Math.round(soundVolume * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Sound Option Chips */}
              <div className="grid grid-cols-5 gap-1">
                {[
                  { id: 'rain' as AmbientSoundType, label: 'Rain', icon: CloudRain },
                  { id: 'ocean' as AmbientSoundType, label: 'Ocean', icon: Waves },
                  { id: 'binaural' as AmbientSoundType, label: 'Alpha', icon: Brain },
                  { id: 'fireplace' as AmbientSoundType, label: 'Camp', icon: Flame },
                  { id: 'none' as AmbientSoundType, label: 'Mute', icon: VolumeX }
                ].map(snd => {
                  const SndIcon = snd.icon;
                  const isSndActive = activeSound === snd.id;
                  return (
                    <button
                      key={snd.id}
                      onClick={() => {
                        soundManager.playClick();
                        setActiveSound(snd.id);
                      }}
                      className={`py-1.5 px-1 text-[11px] font-bold rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1 ${
                        isSndActive
                          ? 'bg-[#2563EB] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] shadow-xs'
                          : 'bg-[#F8FAFC] dark:bg-[#12141F] text-[#65675F] dark:text-[#94A3B8] hover:text-[#11120F] dark:hover:text-white border border-transparent hover:border-black/10 dark:hover:border-white/10'
                      }`}
                    >
                      <SndIcon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{snd.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 8. BENTO PERFORMANCE SUMMARY STRIP (Footer) */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#E2E8F0] dark:border-[#222638]">
              {/* Bento Card 1: Goal/Topic */}
              <div className="p-2 rounded-xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] flex flex-col justify-center">
                <span className="text-[10px] font-mono text-[#85877E] uppercase font-bold flex items-center gap-1">
                  <Target className="w-3 h-3 text-[#2563EB] dark:text-[#7AA2F7]" />
                  <span>Target</span>
                </span>
                <span className="text-[11px] font-bold text-[#11120F] dark:text-[#F8FAFC] truncate">
                  {selectedTopic ? selectedTopic.topic.name : 'General Focus'}
                </span>
              </div>

              {/* Bento Card 2: Loops */}
              <button
                onClick={() => setIsLoopModalOpen(true)}
                className="p-2 rounded-xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] flex flex-col justify-center cursor-pointer hover:border-[#2563EB] dark:hover:border-[#7AA2F7] transition-colors text-left"
                title="Configure Multi-Loop Cycles"
              >
                <span className="text-[10px] font-mono text-[#85877E] uppercase font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>Cycles</span>
                </span>
                <span className="text-[11px] font-bold text-[#11120F] dark:text-[#F8FAFC] truncate">
                  {session.isLoopActive
                    ? `${session.currentLoop || 1}/${session.targetLoops || 4} Active`
                    : `${targetLoops} Loops Set`}
                </span>
              </button>

              {/* Bento Card 3: XP Reward */}
              <div className="p-2 rounded-xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] flex flex-col justify-center">
                <span className="text-[10px] font-mono text-[#85877E] uppercase font-bold flex items-center gap-1">
                  <Award className="w-3 h-3 text-emerald-500" />
                  <span>Reward</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono truncate">
                  +25 XP Boost
                </span>
              </div>
            </div>

          </div>
        )}

        {/* VIEW C: MULTI-LOOP POMODORO MODAL POPUP */}
        {isLoopModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-xs rounded-3xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] shadow-2xl p-5 space-y-4 animate-scale-up">
              <div className="flex items-center gap-2 text-[#11120F] dark:text-[#F8FAFC]">
                <Clock className="w-5 h-5 text-[#2563EB] dark:text-[#7AA2F7]" />
                <h3 className="text-sm font-black">Multi-Loop Study Protocol</h3>
              </div>

              <p className="text-xs text-[#65675F] dark:text-[#94A3B8]">
                How many focus + rest cycles would you like to run in this deep session?
              </p>

              {/* Counter with +/- buttons */}
              <div className="flex items-center justify-between p-2 rounded-2xl bg-[#F8FAFC] dark:bg-[#12141F] border border-[#E2E8F0] dark:border-[#282C40]">
                <button
                  type="button"
                  onClick={() => setTargetLoops(prev => Math.max(1, prev - 1))}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] flex items-center justify-center text-sm font-bold text-[#11120F] dark:text-white cursor-pointer active:scale-95 shadow-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className="text-center">
                  <span className="text-xl font-black font-mono text-[#11120F] dark:text-white">
                    {targetLoops}
                  </span>
                  <span className="text-[10px] text-[#85877E] font-mono block">
                    Cycles
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setTargetLoops(prev => Math.min(12, prev + 1))}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] flex items-center justify-center text-sm font-bold text-[#11120F] dark:text-white cursor-pointer active:scale-95 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Estimated Duration Calculation */}
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300">
                Total Study Time: <strong className="font-mono">{targetLoops * focusDurationMinutes}m</strong> focus + <strong className="font-mono">{targetLoops * breakDurationMinutes}m</strong> rest = <strong className="font-mono">{Math.round((targetLoops * (focusDurationMinutes + breakDurationMinutes)) / 60 * 10) / 10} hours</strong>.
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsLoopModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#65675F] hover:bg-[#F1F5F9] dark:hover:bg-[#222638] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleStartLoopFlow}
                  className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#0B0B0D] text-xs font-black shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  Start Cycle Protocol
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};
