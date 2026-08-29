import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  CheckSquare
} from 'lucide-react';
import { ambientEngine, AmbientSoundType } from '../../utils/ambientSounds';
import { soundManager } from '../../utils/soundEffects';
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
  const { allTopics } = useSyllabus();
  const {
    session,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    setSessionMode,
    setSessionTopic,
    requestPictureInPicture,
    showFloatingOverlay,
    openPermissionModal
  } = useTimer();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoopModalOpen, setIsLoopModalOpen] = useState(false);

  const [focusDurationMinutes, setFocusDurationMinutes] = useState<number>(25);
  const [breakDurationMinutes, setBreakDurationMinutes] = useState<number>(5);
  const [customTimerMinutes, setCustomTimerMinutes] = useState<number>(45);

  const [targetLoops, setTargetLoops] = useState<number>(4);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(defaultTopicId || session.topicId || '');
  const [isTopicSearchOpen, setIsTopicSearchOpen] = useState(false);
  const [topicSearchTerm, setTopicSearchTerm] = useState('');
  const [sessionGoal, setSessionGoal] = useState<string>('');

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

  const handleTogglePlay = () => {
    soundManager.playClick();
    if (isRunning) {
      pauseTimer();
    } else if (isPaused) {
      resumeTimer();
    } else {
      // Check Android permission if applicable
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
        subjectName: top?.subjectName
      });
    }
  };

  const handleStartLoopFlow = () => {
    setIsLoopModalOpen(false);
    setIsSettingsOpen(false);
    soundManager.playClick();

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

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = useMemo(() => {
    if (session.mode === 'stopwatch') return (session.stopwatchElapsedSec % 60) / 60;
    if (session.totalDurationSec === 0) return 0;
    return (session.totalDurationSec - session.remainingSec) / session.totalDurationSec;
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

  if (!isOpen) return null;

  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent * circumference);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/85 backdrop-blur-md select-none animate-fade-in font-sans">
      <div className="relative w-full h-full sm:h-auto sm:max-w-lg sm:rounded-3xl bg-[#F7F6F0] dark:bg-[#12141A] border border-[#D8D8CF] dark:border-[#24283B] shadow-2xl p-4 sm:p-6 flex flex-col justify-between pt-safe pb-safe overflow-hidden">
        
        {/* 1. TOP HEADER TOOLBAR */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D8D8CF] dark:border-[#24283B] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#596B35] to-[#3B4723] dark:from-[#7AA2F7] dark:to-[#415C9E] text-white dark:text-[#0B0B0D] flex items-center justify-center font-bold shadow-sm">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-[#11120F] dark:text-[#C0CAF5] uppercase font-serif tracking-wide">
                {isSettingsOpen ? 'Timer Configuration' : '3D Focus Chamber'}
              </h3>
              <p className="text-[10px] font-bold text-[#596B35] dark:text-[#7AA2F7]">
                {isSettingsOpen ? 'Protocol Settings' : 'Deep Study Session • +25 XP'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Minimize to In-App Floating Capsule */}
            <button
              onClick={() => {
                soundManager.playClick();
                showFloatingOverlay();
                onClose();
              }}
              className="p-2 rounded-xl bg-white dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] text-[#596B35] dark:text-[#7AA2F7] hover:bg-[#EEEEE8] dark:hover:bg-[#24283B] transition-all cursor-pointer shadow-xs active:scale-95"
              title="Minimize to In-App Floating Timer Capsule"
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
                  ? 'bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D]'
                  : 'bg-white dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] text-[#65675F] dark:text-[#A9B1D6] hover:text-[#11120F] dark:hover:text-white'
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
              className="p-2 rounded-xl bg-white dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] text-[#85877E] hover:text-[#11120F] dark:hover:text-white cursor-pointer shadow-xs active:scale-95"
              title="Close modal (Timer continues in background/floating mode)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* VIEW A: DEDICATED TIMER PROTOCOL SETTINGS */}
        {isSettingsOpen ? (
          <div className="py-3 space-y-4 overflow-y-auto flex-1 animate-fade-in text-xs">
            {/* Focus Duration */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#191A17] dark:text-[#C0CAF5]">
                  Study Focus Duration
                </span>
                <div className="flex items-center gap-1 text-sm font-extrabold text-[#11120F] dark:text-white font-mono">
                  <span>{focusDurationMinutes}</span>
                  <span className="text-[10px] text-[#85877E] font-normal">min</span>
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
                  if (session.mode === 'pomodoro' && session.status === 'idle') {
                    setSessionMode('pomodoro', val);
                  }
                }}
                className="w-full accent-[#596B35] dark:accent-[#7AA2F7] cursor-pointer"
              />

              <div className="flex items-center gap-2 pt-1">
                {[15, 25, 45, 60, 90].map(mins => (
                  <button
                    key={mins}
                    onClick={() => {
                      setFocusDurationMinutes(mins);
                      if (session.mode === 'pomodoro' && session.status === 'idle') {
                        setSessionMode('pomodoro', mins);
                      }
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                      focusDurationMinutes === mins
                        ? 'bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] shadow-sm'
                        : 'bg-white dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] text-[#65675F] dark:text-[#A9B1D6]'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Break Duration */}
            <div className="space-y-2.5 pt-2 border-t border-[#EEEEE8] dark:border-[#24283B]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#191A17] dark:text-[#C0CAF5]">
                  Break Duration
                </span>
                <div className="flex items-center gap-1 text-sm font-extrabold text-[#11120F] dark:text-white font-mono">
                  <span>{breakDurationMinutes}</span>
                  <span className="text-[10px] text-[#85877E] font-normal">min</span>
                </div>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                step="1"
                value={breakDurationMinutes}
                onChange={e => setBreakDurationMinutes(Number(e.target.value))}
                className="w-full accent-[#596B35] dark:accent-[#7AA2F7] cursor-pointer"
              />
            </div>

            {/* Start Pomodoro Loop Flow */}
            <div className="pt-2">
              <button
                onClick={() => setIsLoopModalOpen(true)}
                className="w-full py-3 px-4 rounded-2xl bg-[#11120F] hover:bg-[#596B35] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#0B0B0D] font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <Clock className="w-4 h-4" />
                <span>Start Multi-Loop Study Cycle</span>
              </button>
            </div>
          </div>
        ) : (
          /* VIEW B: MAIN ACTIVE 3D FOCUS CHAMBER */
          <div className="py-2 space-y-3 flex-1 flex flex-col justify-between animate-fade-in">
            
            {/* Topic Selector Bar */}
            <div className="relative">
              <button
                onClick={() => setIsTopicSearchOpen(prev => !prev)}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] text-xs cursor-pointer shadow-xs hover:border-[#596B35] dark:hover:border-[#7AA2F7] transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2 h-2 rounded-full bg-[#596B35] dark:bg-[#7AA2F7] animate-pulse" />
                  <span className="font-bold text-[#191A17] dark:text-[#C0CAF5] truncate">
                    {selectedTopic ? selectedTopic.topic.name : 'Select Topic to Track Focus'}
                  </span>
                  {selectedTopic && (
                    <span className="text-[10px] text-[#65675F] dark:text-[#A9B1D6] truncate font-mono">
                      • {selectedTopic.subjectName}
                    </span>
                  )}
                </div>
                <Search className="w-3.5 h-3.5 text-[#85877E] shrink-0" />
              </button>

              {isTopicSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl bg-white dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] shadow-2xl p-2 z-30 max-h-52 overflow-y-auto space-y-1">
                  <input
                    type="text"
                    placeholder="Search topic in syllabus..."
                    value={topicSearchTerm}
                    onChange={e => setTopicSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#292E42] text-xs mb-1.5 focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7]"
                  />
                  {filteredTopics.map(t => (
                    <div
                      key={t.topic.id}
                      onClick={() => {
                        setSelectedTopicId(t.topic.id);
                        setSessionTopic(t.topic.id, t.topic.name, t.subjectName);
                        setIsTopicSearchOpen(false);
                      }}
                      className="p-2.5 rounded-xl hover:bg-[#F7F6F0] dark:hover:bg-[#24283B] cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <span className="font-bold text-[#191A17] dark:text-[#C0CAF5] truncate">{t.topic.name}</span>
                      <span className="text-[10px] text-[#85877E] font-mono">{t.subjectName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4 Mode Tabs (Pomodoro, Break, Stopwatch, Timer) */}
            <div className="flex items-center justify-between p-1 rounded-2xl bg-white dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] gap-1">
              {[
                { id: 'pomodoro' as TimerMode, label: 'Pomodoro', icon: Hourglass },
                { id: 'break' as TimerMode, label: 'Break', icon: Coffee },
                { id: 'stopwatch' as TimerMode, label: 'Stopwatch', icon: StopwatchIcon },
                { id: 'timer' as TimerMode, label: 'Custom', icon: Clock }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    let dur = focusDurationMinutes;
                    if (tab.id === 'break') dur = breakDurationMinutes;
                    else if (tab.id === 'timer') dur = customTimerMinutes;
                    setSessionMode(tab.id, dur);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95 ${
                    session.mode === tab.id
                      ? 'bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] shadow-sm'
                      : 'text-[#65675F] dark:text-[#A9B1D6] hover:text-[#11120F] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Quick Adjustment Chips (when idle) */}
            {session.status === 'idle' && session.mode !== 'stopwatch' && (
              <div className="flex items-center justify-center gap-2">
                {[-5, -1, 1, 5].map(delta => (
                  <button
                    key={delta}
                    onClick={() => handleQuickAdjust(delta)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] text-[11px] font-mono font-bold text-[#65675F] dark:text-[#A9B1D6] hover:border-[#596B35] dark:hover:border-[#7AA2F7] transition-all cursor-pointer active:scale-95"
                  >
                    {delta > 0 ? `+${delta}m` : `${delta}m`}
                  </button>
                ))}
              </div>
            )}

            {/* 3D Radial Dial Display */}
            <div className="flex flex-col items-center justify-center my-1 relative">
              <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center">
                
                {/* Outer Glow & Background Ring */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 240 240">
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-[#EEEEE8] dark:text-[#1F2335]"
                    fill="transparent"
                  />
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className={`transition-all duration-300 ease-linear ${
                      session.mode === 'break'
                        ? 'text-amber-500 dark:text-amber-400'
                        : 'text-[#596B35] dark:text-[#7AA2F7]'
                    }`}
                  />
                </svg>

                {/* Centered Digital Countdown */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl sm:text-4xl font-black text-[#11120F] dark:text-[#C0CAF5] font-mono tracking-tight">
                    {session.mode === 'stopwatch'
                      ? formatTime(session.stopwatchElapsedSec)
                      : formatTime(session.remainingSec)}
                  </span>
                  
                  <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 px-2.5 py-0.5 rounded-full ${
                    isRunning
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-pulse'
                      : isPaused
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-black/5 dark:bg-white/5 text-[#85877E]'
                  }`}>
                    {isRunning ? (session.mode === 'break' ? 'Resting' : 'Focus Active') : isPaused ? 'Paused' : 'Ready'}
                  </span>
                </div>
              </div>
            </div>

            {/* Play / Pause / Reset Control Buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  soundManager.playClick();
                  resetTimer();
                }}
                className="p-3 rounded-2xl bg-white dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] text-xs font-bold text-[#65675F] dark:text-[#A9B1D6] hover:text-[#11120F] dark:hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="px-8 py-3 rounded-2xl bg-[#11120F] hover:bg-[#596B35] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#0B0B0D] text-xs font-black shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isRunning ? 'Pause' : isPaused ? 'Resume' : 'Start Focus'}</span>
              </button>
            </div>

            {/* Ambient Sound Selector & Equalizer */}
            <div className="p-2.5 rounded-2xl bg-white dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#65675F] dark:text-[#A9B1D6]">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#596B35] dark:text-[#7AA2F7]" />
                  Study Ambience Soundtrack
                </span>
                {isRunning && activeSound !== 'none' && (
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" />
                    <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-5 gap-1">
                {[
                  { id: 'rain' as AmbientSoundType, label: '🌧️ Rain' },
                  { id: 'ocean' as AmbientSoundType, label: '🌊 Ocean' },
                  { id: 'binaural' as AmbientSoundType, label: '🧠 Alpha' },
                  { id: 'fireplace' as AmbientSoundType, label: '🔥 Camp' },
                  { id: 'none' as AmbientSoundType, label: '🔇 Mute' }
                ].map(snd => (
                  <button
                    key={snd.id}
                    onClick={() => {
                      soundManager.playClick();
                      setActiveSound(snd.id);
                    }}
                    className={`py-1.5 text-[10px] font-bold rounded-xl cursor-pointer transition-all active:scale-95 ${
                      activeSound === snd.id
                        ? 'bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] shadow-xs'
                        : 'bg-[#F7F6F0] dark:bg-[#16161E] text-[#65675F] dark:text-[#A9B1D6] hover:text-[#11120F] dark:hover:text-white'
                    }`}
                  >
                    {snd.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* VIEW C: MULTI-LOOP POMODORO MODAL */}
        {isLoopModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-xs rounded-3xl bg-white dark:bg-[#1F2335] border border-[#D8D8CF] dark:border-[#292E42] shadow-2xl p-5 space-y-4 animate-scale-up">
              <div className="flex items-center gap-2 text-[#11120F] dark:text-[#C0CAF5]">
                <Clock className="w-5 h-5 text-[#596B35] dark:text-[#7AA2F7]" />
                <h3 className="text-sm font-black">Multi-Loop Study Cycle</h3>
              </div>

              <p className="text-xs text-[#65675F] dark:text-[#A9B1D6]">
                How many focus-break loop cycles would you like to run today?
              </p>

              <div className="space-y-1">
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={targetLoops}
                  onChange={e => setTargetLoops(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#16161E] border border-[#D8D8CF] dark:border-[#292E42] text-sm font-black text-[#11120F] dark:text-white focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLoopModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#65675F] hover:bg-[#EEEEE8] dark:hover:bg-[#24283B] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleStartLoopFlow}
                  className="px-5 py-2 rounded-xl bg-[#596B35] hover:bg-[#47572a] dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] text-white dark:text-[#0B0B0D] text-xs font-black shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  Start Cycle
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};