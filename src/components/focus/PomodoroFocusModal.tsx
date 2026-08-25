import React, { useState, useEffect, useMemo } from 'react';
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
  Minimize2
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
  const [breakDurationMinutes, setBreakDurationMinutes] = useState<number>(8);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isAutoStartBreaks, setIsAutoStartBreaks] = useState<boolean>(false);
  const [customTimerMinutes, setCustomTimerMinutes] = useState<number>(45);

  const [targetLoops, setTargetLoops] = useState<number>(2);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(defaultTopicId || session.topicId || '');
  const [isTopicSearchOpen, setIsTopicSearchOpen] = useState(false);
  const [topicSearchTerm, setTopicSearchTerm] = useState('');

  const [activeSound, setActiveSound] = useState<AmbientSoundType>('rain');
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [completedSessionsToday, setCompletedSessionsToday] = useState(2);

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

  // Ambient Audio Engine
  useEffect(() => {
    if (isOpen && session.status === 'running' && isAudioEnabled && activeSound !== 'none') {
      ambientEngine.play(activeSound);
      ambientEngine.setVolume(soundVolume);
    } else {
      ambientEngine.stop();
    }
    return () => ambientEngine.stop();
  }, [isOpen, session.status, isAudioEnabled, activeSound, soundVolume]);

  const isRunning = session.status === 'running';
  const isPaused = session.status === 'paused';

  const handleTogglePlay = () => {
    soundManager.playClick();
    if (isRunning) {
      pauseTimer();
    } else if (isPaused) {
      resumeTimer();
    } else {
      // Check if Android permission needed
      if (window.AndroidFloatingTimer && window.AndroidFloatingTimer.isOverlayPermissionGranted && !window.AndroidFloatingTimer.isOverlayPermissionGranted()) {
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

  const radius = 105;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent * circumference);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/85 backdrop-blur-md select-none animate-fade-in">
      <div className="relative w-full h-full sm:h-auto sm:max-w-lg sm:rounded-3xl bg-[#F7F6F0] dark:bg-[#0D0E0C] border border-[#D8D8CF] dark:border-[#30342B] shadow-2xl p-5 flex flex-col justify-between pt-safe pb-safe overflow-hidden">
        
        {/* TOP HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D8D8CF] dark:border-[#30342B] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#596B35] text-white flex items-center justify-center font-bold">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#11120F] dark:text-[#F4F4ED] uppercase font-serif">
                {isSettingsOpen ? 'Pomodoro Settings' : '3D Focus Chamber'}
              </h3>
              <p className="text-[10px] text-[#596B35] dark:text-[#A4B879]">
                {isSettingsOpen ? 'Study Pomodoro Configuration' : 'Deep Study Session'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* PiP Trigger */}
            <button
              onClick={async () => {
                soundManager.playClick();
                const opened = await requestPictureInPicture();
                if (opened) {
                  onClose();
                } else {
                  // Fallback: show in-page floating overlay and close modal
                  showFloatingOverlay();
                  onClose();
                }
              }}
              className="p-2 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 transition-all cursor-pointer"
              title="Minimize to Floating / Picture-in-Picture Timer"
            >
              <PictureInPicture2 className="w-4 h-4" />
            </button>

            {/* Settings Toggle */}
            <button
              onClick={() => {
                soundManager.playClick();
                setIsSettingsOpen(prev => !prev);
              }}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isSettingsOpen
                  ? 'bg-[#596B35] text-white'
                  : 'bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] text-[#65675F] dark:text-[#A7AA9C] hover:text-[#11120F] dark:hover:text-white'
              }`}
              title="Focus Chamber Settings"
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
              className="p-2 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] text-[#85877E] hover:text-[#11120F] dark:hover:text-white cursor-pointer"
              title="Close modal (Timer continues in floating mode)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* VIEW A: DEDICATED POMODORO SETTINGS PANEL */}
        {isSettingsOpen ? (
          <div className="py-3 space-y-4 overflow-y-auto flex-1 animate-fade-in">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#191A17] dark:text-[#F4F4ED]">
                  Study Focus Duration
                </span>
                <div className="flex items-center gap-1 text-base font-extrabold text-[#11120F] dark:text-[#F4F4ED] font-mono">
                  <span>{focusDurationMinutes}</span>
                  <span className="text-xs text-[#85877E] font-normal">min</span>
                  <Edit2 className="w-3.5 h-3.5 text-[#596B35] ml-1" />
                </div>
              </div>

              <input
                type="range"
                min="1"
                max="120"
                value={focusDurationMinutes}
                onChange={e => {
                  const val = Number(e.target.value);
                  setFocusDurationMinutes(val);
                  if (session.mode === 'pomodoro' && session.status === 'idle') {
                    setSessionMode('pomodoro', val);
                  }
                }}
                className="w-full accent-[#596B35] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#85877E] font-mono">
                <span>1 min</span>
                <span>120 min</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {[15, 25, 45, 60].map(mins => (
                  <button
                    key={mins}
                    onClick={() => {
                      setFocusDurationMinutes(mins);
                      if (session.mode === 'pomodoro' && session.status === 'idle') {
                        setSessionMode('pomodoro', mins);
                      }
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                      focusDurationMinutes === mins
                        ? 'bg-[#596B35] text-white shadow-sm'
                        : 'bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] text-[#65675F] dark:text-[#A7AA9C]'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Break Duration */}
            <div className="space-y-2.5 pt-2 border-t border-[#EEEEE8] dark:border-[#1D201A]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#191A17] dark:text-[#F4F4ED]">
                  Break Duration
                </span>
                <div className="flex items-center gap-1 text-base font-extrabold text-[#11120F] dark:text-[#F4F4ED] font-mono">
                  <span>{breakDurationMinutes}</span>
                  <span className="text-xs text-[#85877E] font-normal">min</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={breakDurationMinutes}
                onChange={e => setBreakDurationMinutes(Number(e.target.value))}
                className="w-full accent-[#596B35] cursor-pointer"
              />
            </div>

            {/* Start Pomodoro Loop Button */}
            <div className="pt-2">
              <button
                onClick={() => setIsLoopModalOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#596B35] to-[#4F7A45] hover:opacity-95 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <Clock className="w-4 h-4" />
                <span>Start Pomodoro Loop Cycle</span>
              </button>
            </div>
          </div>
        ) : (
          /* VIEW B: MAIN ACTIVE FOCUS CHAMBER */
          <div className="py-2 space-y-3.5 flex-1 flex flex-col justify-between animate-fade-in">
            
            {/* Topic Selector Bar */}
            <div className="relative">
              <button
                onClick={() => setIsTopicSearchOpen(prev => !prev)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] text-xs cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2 h-2 rounded-full bg-[#596B35]" />
                  <span className="font-bold text-[#191A17] dark:text-[#F4F4ED] truncate">
                    {selectedTopic ? selectedTopic.topic.name : 'Select Topic to Track'}
                  </span>
                  {selectedTopic && (
                    <span className="text-[10px] text-[#85877E] truncate">
                      • {selectedTopic.subjectName}
                    </span>
                  )}
                </div>
                <Search className="w-3.5 h-3.5 text-[#85877E] shrink-0" />
              </button>

              {isTopicSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-2xl p-2 z-30 max-h-52 overflow-y-auto space-y-1">
                  <input
                    type="text"
                    placeholder="Search topic..."
                    value={topicSearchTerm}
                    onChange={e => setTopicSearchTerm(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-xs mb-1.5 focus:outline-none"
                  />
                  {filteredTopics.map(t => (
                    <div
                      key={t.topic.id}
                      onClick={() => {
                        setSelectedTopicId(t.topic.id);
                        setSessionTopic(t.topic.id, t.topic.name, t.subjectName);
                        setIsTopicSearchOpen(false);
                      }}
                      className="p-2 rounded-lg hover:bg-[#EEEEE8] dark:hover:bg-[#1D201A] cursor-pointer flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-[#191A17] dark:text-[#F4F4ED] truncate">{t.topic.name}</span>
                      <span className="text-[10px] text-[#85877E]">{t.subjectName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4 Mode Tabs */}
            <div className="flex items-center justify-between p-1 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B]">
              {[
                { id: 'pomodoro' as TimerMode, label: 'Pomodoro', icon: Hourglass },
                { id: 'break' as TimerMode, label: 'Break', icon: Coffee },
                { id: 'stopwatch' as TimerMode, label: 'Stopwatch', icon: StopwatchIcon },
                { id: 'timer' as TimerMode, label: 'Timer', icon: Clock }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    let dur = focusDurationMinutes;
                    if (tab.id === 'break') dur = breakDurationMinutes;
                    else if (tab.id === 'timer') dur = customTimerMinutes;
                    setSessionMode(tab.id, dur);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    session.mode === tab.id
                      ? 'bg-[#596B35] text-white shadow-sm'
                      : 'text-[#65675F] dark:text-[#A7AA9C]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Loop Active Badge */}
            {session.isLoopActive && (
              <div className="flex items-center justify-center">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold font-mono bg-[#DCE8B7] dark:bg-[#354126] text-[#11120F] dark:text-[#F4F4ED] border border-[#596B35]">
                  🔄 Loop {session.currentLoop} of {session.targetLoops}: {session.mode === 'pomodoro' ? 'Study Focus' : 'Break Time'}
                </span>
              </div>
            )}

            {/* Radial Clock Display */}
            <div className="flex flex-col items-center justify-center my-1 relative">
              <div className="relative w-52 h-52 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 240 240">
                  <circle cx="120" cy="120" r={radius} stroke="currentColor" strokeWidth="8" className="text-[#EEEEE8] dark:text-[#151713]" fill="transparent" />
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    stroke="#596B35"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-300 ease-linear"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-extrabold text-[#11120F] dark:text-[#F4F4ED] font-mono">
                    {session.mode === 'stopwatch' ? formatTime(session.stopwatchElapsedSec) : formatTime(session.remainingSec)}
                  </span>
                  <span className="text-[10px] text-[#596B35] dark:text-[#A4B879] font-bold uppercase tracking-wider mt-1">
                    {isRunning ? (session.mode === 'break' ? 'Resting' : 'Focus Active') : isPaused ? 'Timer Paused' : 'Chamber Ready'}
                  </span>
                </div>
              </div>
            </div>

            {/* Start / Pause / Reset Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  soundManager.playClick();
                  resetTimer();
                }}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] text-xs font-bold text-[#65675F] cursor-pointer hover:text-white transition-all"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="px-8 py-3 rounded-xl bg-[#11120F] hover:bg-[#596B35] text-white text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isRunning ? 'Pause' : isPaused ? 'Resume' : 'Start Focus'}</span>
              </button>
            </div>

            {/* Ambient Sound Selector */}
            <div className="p-2 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] flex items-center justify-between gap-1">
              {[
                { id: 'rain', label: 'Rain' },
                { id: 'waves', label: 'Waves' },
                { id: 'binaural', label: 'Alpha' },
                { id: 'none', label: 'Mute' }
              ].map(snd => (
                <button
                  key={snd.id}
                  onClick={() => setActiveSound(snd.id as AmbientSoundType)}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-colors ${
                    activeSound === snd.id
                      ? 'bg-[#596B35] text-white'
                      : 'text-[#65675F] dark:text-[#A7AA9C]'
                  }`}
                >
                  {snd.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VIEW C: START POMODORO LOOP MODAL */}
        {isLoopModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-xs rounded-3xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-2xl p-5 space-y-4 animate-scale-up">
              <div className="flex items-center gap-2 text-[#11120F] dark:text-[#F4F4ED]">
                <Clock className="w-5 h-5 text-[#596B35]" />
                <h3 className="text-base font-extrabold">Start Pomodoro</h3>
              </div>

              <p className="text-xs text-[#65675F] dark:text-[#A7AA9C]">
                How many focus-break loops would you like to run?
              </p>

              <div className="space-y-1">
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={targetLoops}
                  onChange={e => setTargetLoops(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-base font-extrabold text-[#11120F] dark:text-[#F4F4ED] text-left focus:outline-none focus:border-[#596B35]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLoopModalOpen(false)}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-[#65675F] hover:bg-[#EEEEE8] dark:hover:bg-[#1D201A] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleStartLoopFlow}
                  className="px-6 py-2.5 rounded-full bg-[#DCE8B7] dark:bg-[#354126] hover:bg-[#596B35] hover:text-white text-[#11120F] dark:text-[#F4F4ED] text-xs font-extrabold shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  Start
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};