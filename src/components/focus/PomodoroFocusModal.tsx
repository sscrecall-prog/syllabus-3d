import React, { useState, useEffect, useMemo } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
  Flame,
  CloudRain,
  Waves,
  Headphones,
  Flame as FireIcon,
  Hourglass,
  Coffee,
  Timer as StopwatchIcon,
  Clock,
  Plus,
  Minus,
  Search,
  Settings,
  Edit2,
  ChevronRight,
  Check,
  Bell
} from 'lucide-react';
import { ambientEngine, AmbientSoundType } from '../../utils/ambientSounds';
import { soundManager } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';

interface PomodoroFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTopicId?: string;
}

type FocusMainMode = 'pomodoro' | 'break' | 'stopwatch' | 'timer';

export const PomodoroFocusModal: React.FC<PomodoroFocusModalProps> = ({
  isOpen,
  onClose,
  defaultTopicId
}) => {
  const { allTopics, logStudySession } = useSyllabus();

  const [mainMode, setMainMode] = useState<FocusMainMode>('pomodoro');
  
  // Settings Panel States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoopModalOpen, setIsLoopModalOpen] = useState(false);

  // Configurable Durations (Matching Uploaded Screenshot)
  const [focusDurationMinutes, setFocusDurationMinutes] = useState<number>(25);
  const [breakDurationMinutes, setBreakDurationMinutes] = useState<number>(8);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isAutoStartBreaks, setIsAutoStartBreaks] = useState<boolean>(false);
  const [timerAlertSound, setTimerAlertSound] = useState<string>('Gentle Chime');

  // Custom Timer Minutes
  const [customTimerMinutes, setCustomTimerMinutes] = useState<number>(45);

  // Pomodoro Loop System (Screenshot 2)
  const [targetLoops, setTargetLoops] = useState<number>(2);
  const [currentLoop, setCurrentLoop] = useState<number>(1);
  const [isLoopActive, setIsLoopActive] = useState<boolean>(false);

  const [selectedTopicId, setSelectedTopicId] = useState<string>(defaultTopicId || '');
  const [isTopicSearchOpen, setIsTopicSearchOpen] = useState(false);
  const [topicSearchTerm, setTopicSearchTerm] = useState('');

  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);

  const [isRunning, setIsRunning] = useState(false);
  const [activeSound, setActiveSound] = useState<AmbientSoundType>('rain');
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [completedSessionsToday, setCompletedSessionsToday] = useState(2);

  useEffect(() => {
    if (defaultTopicId) setSelectedTopicId(defaultTopicId);
    else if (allTopics.length > 0 && !selectedTopicId) setSelectedTopicId(allTopics[0].topic.id);
  }, [defaultTopicId, allTopics]);

  // Mode & Duration Sync
  useEffect(() => {
    setIsRunning(false);
    if (mainMode === 'pomodoro') {
      const dur = focusDurationMinutes * 60;
      setTotalSeconds(dur);
      setSecondsLeft(dur);
    } else if (mainMode === 'break') {
      const dur = breakDurationMinutes * 60;
      setTotalSeconds(dur);
      setSecondsLeft(dur);
    } else if (mainMode === 'timer') {
      const dur = customTimerMinutes * 60;
      setTotalSeconds(dur);
      setSecondsLeft(dur);
    } else if (mainMode === 'stopwatch') {
      setStopwatchSeconds(0);
    }
  }, [mainMode, focusDurationMinutes, breakDurationMinutes, customTimerMinutes]);

  // Ticking Interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      if (mainMode === 'stopwatch') {
        interval = setInterval(() => setStopwatchSeconds(prev => prev + 1), 1000);
      } else {
        if (secondsLeft > 0) {
          interval = setInterval(() => setSecondsLeft(prev => prev - 1), 1000);
        } else if (secondsLeft === 0) {
          handleSessionComplete();
        }
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft, mainMode]);

  // Ambient Audio Engine
  useEffect(() => {
    if (isOpen && isRunning && isAudioEnabled && activeSound !== 'none') {
      ambientEngine.play(activeSound);
      ambientEngine.setVolume(soundVolume);
    } else {
      ambientEngine.stop();
    }
    return () => ambientEngine.stop();
  }, [isOpen, isRunning, isAudioEnabled, activeSound]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    ambientEngine.stop();
    soundManager.playCompleteChime();
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });

    logStudySession(Math.round(totalSeconds / 60), selectedTopicId);

    if (mainMode === 'pomodoro') {
      setCompletedSessionsToday(c => c + 1);
      
      // Handle Loop cycle
      if (isLoopActive) {
        setMainMode('break');
        if (isAutoStartBreaks) {
          setTimeout(() => setIsRunning(true), 1000);
        }
      } else {
        setMainMode('break');
      }
    } else if (mainMode === 'break') {
      if (isLoopActive) {
        if (currentLoop < targetLoops) {
          setCurrentLoop(prev => prev + 1);
          setMainMode('pomodoro');
          if (isAutoStartBreaks) {
            setTimeout(() => setIsRunning(true), 1000);
          }
        } else {
          // Finished all loops
          setIsLoopActive(false);
          setCurrentLoop(1);
          setMainMode('pomodoro');
        }
      } else {
        setMainMode('pomodoro');
      }
    }
  };

  const handleStartLoopFlow = () => {
    setIsLoopModalOpen(false);
    setIsSettingsOpen(false);
    setIsLoopActive(true);
    setCurrentLoop(1);
    setMainMode('pomodoro');
    setTotalSeconds(focusDurationMinutes * 60);
    setSecondsLeft(focusDurationMinutes * 60);
    setIsRunning(true);
    soundManager.playClick();
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = useMemo(() => {
    if (mainMode === 'stopwatch') return (stopwatchSeconds % 60) / 60;
    if (totalSeconds === 0) return 0;
    return (totalSeconds - secondsLeft) / totalSeconds;
  }, [mainMode, stopwatchSeconds, secondsLeft, totalSeconds]);

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
            {/* Settings Toggle Button */}
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
              onClick={onClose}
              className="p-2 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] text-[#85877E] hover:text-[#11120F] dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* VIEW A: DEDICATED POMODORO SETTINGS PANEL (SCREENSHOT 1) */}
        {/* ---------------------------------------------------- */}
        {isSettingsOpen ? (
          <div className="py-3 space-y-4 overflow-y-auto flex-1 animate-fade-in">
            
            {/* 1. Study (Focus Duration) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#191A17] dark:text-[#F4F4ED]">
                  Study
                </span>
                <div className="flex items-center gap-1 text-base font-extrabold text-[#11120F] dark:text-[#F4F4ED] font-mono">
                  <span>{focusDurationMinutes}</span>
                  <span className="text-xs text-[#85877E] font-normal">min</span>
                  <Edit2 className="w-3.5 h-3.5 text-[#596B35] ml-1" />
                </div>
              </div>

              {/* Slider 1m to 120m */}
              <input
                type="range"
                min="1"
                max="120"
                value={focusDurationMinutes}
                onChange={e => setFocusDurationMinutes(Number(e.target.value))}
                className="w-full accent-[#596B35] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#85877E] font-mono">
                <span>1 min</span>
                <span>120 min</span>
              </div>

              {/* Preset Chips */}
              <div className="flex items-center gap-2 pt-1">
                {[15, 25, 45, 60].map(mins => (
                  <button
                    key={mins}
                    onClick={() => {
                      soundManager.playClick();
                      setFocusDurationMinutes(mins);
                    }}
                    className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                      focusDurationMinutes === mins
                        ? 'bg-[#DCE8B7] dark:bg-[#354126] text-[#11120F] dark:text-[#F4F4ED] border-[#596B35]'
                        : 'bg-white dark:bg-[#151713] border-[#D8D8CF] dark:border-[#30342B] text-[#65675F] dark:text-[#A7AA9C]'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[#D8D8CF] dark:border-[#30342B]" />

            {/* 2. Break (Break Duration) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#191A17] dark:text-[#F4F4ED]">
                  Break
                </span>
                <div className="flex items-center gap-1 text-base font-extrabold text-[#11120F] dark:text-[#F4F4ED] font-mono">
                  <span>{breakDurationMinutes}</span>
                  <span className="text-xs text-[#85877E] font-normal">min</span>
                  <Edit2 className="w-3.5 h-3.5 text-[#596B35] ml-1" />
                </div>
              </div>

              {/* Slider 1m to 60m */}
              <input
                type="range"
                min="1"
                max="60"
                value={breakDurationMinutes}
                onChange={e => setBreakDurationMinutes(Number(e.target.value))}
                className="w-full accent-[#596B35] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#85877E] font-mono">
                <span>1 min</span>
                <span>60 min</span>
              </div>

              {/* Preset Chips */}
              <div className="flex items-center gap-2 pt-1">
                {[5, 10, 15, 30].map(mins => (
                  <button
                    key={mins}
                    onClick={() => {
                      soundManager.playClick();
                      setBreakDurationMinutes(mins);
                    }}
                    className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                      breakDurationMinutes === mins
                        ? 'bg-[#DCE8B7] dark:bg-[#354126] text-[#11120F] dark:text-[#F4F4ED] border-[#596B35]'
                        : 'bg-white dark:bg-[#151713] border-[#D8D8CF] dark:border-[#30342B] text-[#65675F] dark:text-[#A7AA9C]'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[#D8D8CF] dark:border-[#30342B]" />

            {/* 3. Audio Toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#191A17] dark:text-[#F4F4ED]">
                  Audio
                </h4>
                <p className="text-[10px] text-[#65675F] dark:text-[#85877E]">
                  {isAudioEnabled ? 'Background audio is playing' : 'Background audio is muted'}
                </p>
              </div>

              {/* Switch */}
              <button
                type="button"
                onClick={() => setIsAudioEnabled(prev => !prev)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  isAudioEnabled ? 'bg-[#596B35]' : 'bg-[#D8D8CF] dark:bg-[#30342B]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isAudioEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 4. Auto-start breaks Toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#191A17] dark:text-[#F4F4ED]">
                  Auto-start breaks
                </h4>
                <p className="text-[10px] text-[#65675F] dark:text-[#85877E]">
                  {isAutoStartBreaks ? 'Breaks start automatically' : 'Break stays paused until you start it'}
                </p>
              </div>

              {/* Switch */}
              <button
                type="button"
                onClick={() => setIsAutoStartBreaks(prev => !prev)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  isAutoStartBreaks ? 'bg-[#596B35]' : 'bg-[#D8D8CF] dark:bg-[#30342B]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isAutoStartBreaks ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 5. Timer Alert Action */}
            <div className="flex items-center justify-between py-1">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#191A17] dark:text-[#F4F4ED]">
                  Timer alert
                </h4>
                <p className="text-[10px] text-[#65675F] dark:text-[#85877E]">
                  How Study timer alerts when a session ends
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-[#596B35] dark:text-[#A4B879]">
                <span>{timerAlertSound}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Bottom Actions: Save Changes & Start Pomodoro */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setIsSettingsOpen(false);
                }}
                className="flex-1 py-3 rounded-2xl bg-[#DCE8B7] dark:bg-[#354126] text-[#11120F] dark:text-[#F4F4ED] text-xs font-extrabold shadow-sm cursor-pointer transition-all active:scale-95 text-center"
              >
                Save changes
              </button>

              <button
                onClick={() => setIsLoopModalOpen(true)}
                className="flex-1 py-3 rounded-2xl bg-[#11120F] hover:bg-[#596B35] text-white text-xs font-extrabold shadow-sm cursor-pointer transition-all active:scale-95 text-center"
              >
                Pomodoro Loops
              </button>
            </div>
          </div>
        ) : (
          /* ---------------------------------------------------- */
          /* VIEW B: MAIN FOCUS CHAMBER RUNNER */
          /* ---------------------------------------------------- */
          <div className="flex-1 flex flex-col justify-between py-2 space-y-3">
            
            {/* Target Topic Bar */}
            <div className="relative">
              <div
                onClick={() => setIsTopicSearchOpen(prev => !prev)}
                className="p-2.5 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#596B35] animate-pulse" />
                  <span className="text-xs font-bold text-[#191A17] dark:text-[#F4F4ED] truncate">
                    {selectedTopic ? `${selectedTopic.subjectName} • ${selectedTopic.topic.name}` : 'Select Topic...'}
                  </span>
                </div>
                <Search className="w-3.5 h-3.5 text-[#596B35]" />
              </div>

              {isTopicSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-30 p-2 rounded-xl bg-white dark:bg-[#151713] border border-[#596B35] shadow-2xl space-y-2">
                  <input
                    type="text"
                    autoFocus
                    value={topicSearchTerm}
                    onChange={e => setTopicSearchTerm(e.target.value)}
                    placeholder="Search topic..."
                    className="w-full p-2 rounded-lg bg-[#F7F6F0] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-xs font-medium focus:outline-none"
                  />
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {filteredTopics.map(t => (
                      <div
                        key={t.topic.id}
                        onClick={() => {
                          setSelectedTopicId(t.topic.id);
                          setIsTopicSearchOpen(false);
                        }}
                        className="p-1.5 rounded-md hover:bg-[#DCE8B7] dark:hover:bg-[#354126] text-xs cursor-pointer flex justify-between"
                      >
                        <span className="font-bold text-[#191A17] dark:text-[#F4F4ED] truncate">{t.topic.name}</span>
                        <span className="text-[10px] text-[#85877E]">{t.subjectName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4 Mode Tabs */}
            <div className="flex items-center justify-between p-1 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B]">
              {[
                { id: 'pomodoro' as FocusMainMode, label: 'Pomodoro', icon: Hourglass },
                { id: 'break' as FocusMainMode, label: 'Break', icon: Coffee },
                { id: 'stopwatch' as FocusMainMode, label: 'Stopwatch', icon: StopwatchIcon },
                { id: 'timer' as FocusMainMode, label: 'Timer', icon: Clock }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMainMode(tab.id)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mainMode === tab.id
                      ? 'bg-[#596B35] text-white shadow-sm'
                      : 'text-[#65675F] dark:text-[#A7AA9C]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Loop Active Status Badge */}
            {isLoopActive && (
              <div className="flex items-center justify-center">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold font-mono bg-[#DCE8B7] dark:bg-[#354126] text-[#11120F] dark:text-[#F4F4ED] border border-[#596B35]">
                  🔄 Loop {currentLoop} of {targetLoops}: {mainMode === 'pomodoro' ? 'Study Focus' : 'Break Time'}
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
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-extrabold text-[#11120F] dark:text-[#F4F4ED] font-mono">
                    {mainMode === 'stopwatch' ? formatTime(stopwatchSeconds) : formatTime(secondsLeft)}
                  </span>
                  <span className="text-[10px] text-[#596B35] dark:text-[#A4B879] font-bold uppercase tracking-wider mt-1">
                    {isRunning ? (mainMode === 'break' ? 'Resting' : 'Focus Active') : 'Chamber Ready'}
                  </span>
                </div>
              </div>
            </div>

            {/* Start / Pause Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setIsRunning(false);
                  if (mainMode === 'pomodoro') setSecondsLeft(focusDurationMinutes * 60);
                  else if (mainMode === 'break') setSecondsLeft(breakDurationMinutes * 60);
                  else if (mainMode === 'timer') setSecondsLeft(customTimerMinutes * 60);
                  else setStopwatchSeconds(0);
                }}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] text-xs font-bold text-[#65675F] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsRunning(r => !r)}
                className="px-8 py-3 rounded-xl bg-[#11120F] hover:bg-[#596B35] text-white text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
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

        {/* ---------------------------------------------------- */}
        {/* VIEW C: START POMODORO LOOP MODAL (SCREENSHOT 2) */}
        {/* ---------------------------------------------------- */}
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
