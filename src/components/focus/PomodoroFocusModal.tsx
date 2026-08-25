import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  Zap,
  Flame,
  CloudRain,
  Waves,
  Headphones,
  Flame as FireIcon,
  Check,
  BookOpen,
  Sparkles,
  Hourglass,
  Coffee,
  Timer as StopwatchIcon,
  Clock,
  ChevronDown,
  Plus,
  Minus,
  Search
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

const MOTIVATIONAL_QUOTES = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "Focus on being productive instead of busy. — Tim Ferriss",
  "One focused hour is worth ten distracted hours. — Deep Work",
  "Your rank is decided in the quiet hours of deep practice.",
  "Small daily streaks lead to massive exam breakthroughs.",
  "Push yourself, because no one else is going to do it for you."
];

export const PomodoroFocusModal: React.FC<PomodoroFocusModalProps> = ({
  isOpen,
  onClose,
  defaultTopicId
}) => {
  const { allTopics, logStudySession, profile } = useSyllabus();

  // Mode: 'pomodoro' | 'break' | 'stopwatch' | 'timer'
  const [mainMode, setMainMode] = useState<FocusMainMode>('pomodoro');
  
  // Pomodoro Sub-presets: 25, 50, 90
  const [pomoPreset, setPomoPreset] = useState<number>(25);
  // Break Sub-presets: 5, 15
  const [breakPreset, setBreakPreset] = useState<number>(5);
  // Custom Timer Minutes
  const [customTimerMinutes, setCustomTimerMinutes] = useState<number>(45);

  const [selectedTopicId, setSelectedTopicId] = useState<string>(defaultTopicId || '');
  
  // Search state for topic selector
  const [isTopicSearchOpen, setIsTopicSearchOpen] = useState(false);
  const [topicSearchTerm, setTopicSearchTerm] = useState('');

  // State for Countdown Timers
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);

  // State for Stopwatch (Count-Up)
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);

  const [isRunning, setIsRunning] = useState(false);
  const [activeSound, setActiveSound] = useState<AmbientSoundType>('rain');
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [completedSessionsToday, setCompletedSessionsToday] = useState(2);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Initialize selected topic
  useEffect(() => {
    if (defaultTopicId) {
      setSelectedTopicId(defaultTopicId);
    } else if (allTopics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(allTopics[0].topic.id);
    }
  }, [defaultTopicId, allTopics]);

  // Mode change handler
  useEffect(() => {
    setIsRunning(false);
    if (mainMode === 'pomodoro') {
      const dur = pomoPreset * 60;
      setTotalSeconds(dur);
      setSecondsLeft(dur);
    } else if (mainMode === 'break') {
      const dur = breakPreset * 60;
      setTotalSeconds(dur);
      setSecondsLeft(dur);
    } else if (mainMode === 'timer') {
      const dur = customTimerMinutes * 60;
      setTotalSeconds(dur);
      setSecondsLeft(dur);
    } else if (mainMode === 'stopwatch') {
      setStopwatchSeconds(0);
    }
  }, [mainMode, pomoPreset, breakPreset, customTimerMinutes]);

  // Timer Tick Handling
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      if (mainMode === 'stopwatch') {
        interval = setInterval(() => {
          setStopwatchSeconds(prev => prev + 1);
        }, 1000);
      } else {
        if (secondsLeft > 0) {
          interval = setInterval(() => {
            setSecondsLeft(prev => prev - 1);
          }, 1000);
        } else if (secondsLeft === 0) {
          handleSessionComplete();
        }
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft, mainMode]);

  // Ambient sound handling
  useEffect(() => {
    if (isOpen && isRunning && activeSound !== 'none') {
      ambientEngine.play(activeSound);
      ambientEngine.setVolume(soundVolume);
    } else {
      ambientEngine.stop();
    }
    return () => {
      ambientEngine.stop();
    };
  }, [isOpen, isRunning, activeSound]);

  useEffect(() => {
    ambientEngine.setVolume(soundVolume);
  }, [soundVolume]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    ambientEngine.stop();
    soundManager.playCompleteChime();
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });

    const minutesSpent = Math.round(totalSeconds / 60);
    logStudySession(minutesSpent);

    if (mainMode === 'pomodoro' || mainMode === 'timer') {
      setCompletedSessionsToday(c => c + 1);
      // Auto suggest break
      setMainMode('break');
      setBreakPreset(5);
    }
  };

  const handleTogglePlay = () => {
    soundManager.playClick();
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    soundManager.playClick();
    setIsRunning(false);
    if (mainMode === 'stopwatch') {
      if (stopwatchSeconds > 60) {
        logStudySession(Math.round(stopwatchSeconds / 60));
      }
      setStopwatchSeconds(0);
    } else if (mainMode === 'pomodoro') {
      setSecondsLeft(pomoPreset * 60);
    } else if (mainMode === 'break') {
      setSecondsLeft(breakPreset * 60);
    } else if (mainMode === 'timer') {
      setSecondsLeft(customTimerMinutes * 60);
    }
  };

  const handleAddMinutes = (mins: number) => {
    soundManager.playClick();
    if (mainMode !== 'stopwatch') {
      setSecondsLeft(prev => Math.max(60, prev + mins * 60));
      setTotalSeconds(prev => Math.max(60, prev + mins * 60));
    }
  };

  // Format MM:SS or HH:MM:SS
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Radial progress percentage
  const progressPercent = useMemo(() => {
    if (mainMode === 'stopwatch') {
      return (stopwatchSeconds % 60) / 60;
    }
    if (totalSeconds === 0) return 0;
    return (totalSeconds - secondsLeft) / totalSeconds;
  }, [mainMode, stopwatchSeconds, secondsLeft, totalSeconds]);

  const selectedTopic = allTopics.find(t => t.topic.id === selectedTopicId);

  // Filtered topics for real-time search
  const filteredTopics = useMemo(() => {
    if (!topicSearchTerm.trim()) return allTopics;
    const q = topicSearchTerm.toLowerCase();
    return allTopics.filter(t =>
      t.topic.name.toLowerCase().includes(q) ||
      t.subjectName.toLowerCase().includes(q) ||
      t.chapterName.toLowerCase().includes(q)
    );
  }, [allTopics, topicSearchTerm]);

  if (!isOpen) return null;

  const circumference = 2 * Math.PI * 130;
  const strokeDashoffset = circumference - (progressPercent * circumference);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl overflow-y-auto animate-fade-in select-none">
      
      {/* FOCUS MODAL CARD */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#FAF8F5] dark:bg-[#1A1A1A] border border-[#EBD3A0] dark:border-[#333333] shadow-2xl overflow-hidden flex flex-col my-auto transition-all">
        
        {/* 1. TOP HEADER & CLOSE BUTTON */}
        <div className="p-4 sm:p-5 border-b border-[#EBD3A0]/60 dark:border-[#2E2E2E] flex items-center justify-between bg-white/70 dark:bg-[#202020]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#B89327] text-[#171717] flex items-center justify-center font-black shadow-md">
              <Zap className="w-5 h-5 fill-[#171717]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#171717] dark:text-[#F5E6C8] uppercase tracking-wider">
                3D Deep Study Chamber
              </h3>
              <p className="text-[10px] font-bold text-[#8C6D15] dark:text-[#D4AF37]">
                Ekagra Mastery Engine
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              ambientEngine.stop();
              onClose();
            }}
            className="p-2 rounded-xl text-[#6B7280] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Close Chamber"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          
          {/* 2. TOP OVERVIEW CARDS (Focus Stats & SEARCHABLE Active Topic Selector) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Left Card: Focus Sessions */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#333333] flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/35 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 fill-[#D4AF37]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#6B7280] block">Today's Focus Streak</span>
                  <span className="text-sm font-black text-[#171717] dark:text-[#F5E6C8] font-mono">
                    {completedSessionsToday} Deep Sessions Completed
                  </span>
                </div>
              </div>
            </div>

            {/* Right Card: SEARCHABLE Target Topic Trigger */}
            <div className="relative">
              <div
                onClick={() => setIsTopicSearchOpen(prev => !prev)}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#333333] hover:border-[#D4AF37] flex items-center justify-between shadow-sm cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#6B7280] block flex items-center gap-1">
                      <span>Active Study Target</span>
                      <Search className="w-3 h-3 text-[#D4AF37] inline" />
                    </span>
                    <span className="text-xs font-black text-[#171717] dark:text-[#F5E6C8] truncate block group-hover:text-[#D4AF37] transition-colors">
                      {selectedTopic ? `${selectedTopic.subjectName} • ${selectedTopic.topic.name}` : 'Search & Select Topic...'}
                    </span>
                  </div>
                </div>
                <Search className="w-4 h-4 text-[#D4AF37] shrink-0" />
              </div>

              {/* SEARCH POPOVER MODAL / DROPDOWN */}
              {isTopicSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-30 p-3 rounded-2xl bg-white dark:bg-[#202020] border border-[#D4AF37] shadow-2xl space-y-2.5 animate-slide-up">
                  {/* Search input */}
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 w-4 h-4 text-[#D4AF37] pointer-events-none" />
                    <input
                      type="text"
                      autoFocus
                      value={topicSearchTerm}
                      onChange={e => setTopicSearchTerm(e.target.value)}
                      placeholder="🔍 Search subject, chapter, or topic..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0] dark:border-[#383838] text-xs font-bold text-[#171717] dark:text-white placeholder-[#6B7280] focus:ring-2 focus:ring-[#D4AF37]"
                    />
                    {topicSearchTerm && (
                      <button
                        onClick={() => setTopicSearchTerm('')}
                        className="absolute right-2.5 text-[#6B7280] hover:text-[#171717] dark:hover:text-white p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filtered Topics List */}
                  <div className="max-h-44 overflow-y-auto space-y-1 p-1 rounded-xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#2E2E2E]">
                    {filteredTopics.length === 0 ? (
                      <p className="text-center py-4 text-xs text-[#6B7280]">
                        No matching topics found
                      </p>
                    ) : (
                      filteredTopics.map(t => {
                        const isSelected = selectedTopicId === t.topic.id;
                        return (
                          <div
                            key={t.topic.id}
                            onClick={() => {
                              soundManager.playClick();
                              setSelectedTopicId(t.topic.id);
                              setIsTopicSearchOpen(false);
                              setTopicSearchTerm('');
                            }}
                            className={`p-2 rounded-lg flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#D4AF37] text-[#171717] font-bold shadow-sm'
                                : 'hover:bg-[#F5E6C8]/40 dark:hover:bg-[#252525] text-[#171717] dark:text-[#F5E6C8]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: t.subjectColor || '#D4AF37' }}
                              />
                              <span className="truncate">{t.topic.name}</span>
                            </div>
                            <span className={`text-[10px] shrink-0 font-mono ${
                              isSelected ? 'text-[#171717]' : 'text-[#6B7280]'
                            }`}>
                              {t.subjectName}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. FOUR MODE TABS: POMODORO | BREAK | STOPWATCH | TIMER */}
          <div className="flex items-center justify-center p-1.5 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#333333] shadow-sm max-w-md mx-auto">
            
            {/* Mode 1: Pomodoro */}
            <button
              onClick={() => setMainMode('pomodoro')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                mainMode === 'pomodoro'
                  ? 'bg-[#D4AF37] text-[#171717] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#171717] dark:hover:text-white'
              }`}
            >
              <Hourglass className="w-3.5 h-3.5" />
              <span>Pomodoro</span>
            </button>

            {/* Mode 2: Break */}
            <button
              onClick={() => setMainMode('break')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                mainMode === 'break'
                  ? 'bg-[#D4AF37] text-[#171717] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#171717] dark:hover:text-white'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Break</span>
            </button>

            {/* Mode 3: Stopwatch */}
            <button
              onClick={() => setMainMode('stopwatch')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                mainMode === 'stopwatch'
                  ? 'bg-[#D4AF37] text-[#171717] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#171717] dark:hover:text-white'
              }`}
            >
              <StopwatchIcon className="w-3.5 h-3.5" />
              <span>Stopwatch</span>
            </button>

            {/* Mode 4: Custom Timer */}
            <button
              onClick={() => setMainMode('timer')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                mainMode === 'timer'
                  ? 'bg-[#D4AF37] text-[#171717] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#171717] dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timer</span>
            </button>
          </div>

          {/* SUB-PRESETS ROW FOR POMODORO / BREAK / TIMER */}
          {mainMode === 'pomodoro' && (
            <div className="flex items-center justify-center gap-2">
              {[25, 50, 90].map(mins => (
                <button
                  key={mins}
                  onClick={() => setPomoPreset(mins)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    pomoPreset === mins
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#8C6D15] dark:text-[#D4AF37]'
                      : 'bg-white dark:bg-[#202020] border-[#EBD3A0]/60 dark:border-[#333333] text-[#6B7280]'
                  }`}
                >
                  {mins === 25 ? '25m Focus' : mins === 50 ? '50m Deep Work' : '90m Flow State'}
                </button>
              ))}
            </div>
          )}

          {mainMode === 'break' && (
            <div className="flex items-center justify-center gap-2">
              {[5, 15].map(mins => (
                <button
                  key={mins}
                  onClick={() => setBreakPreset(mins)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    breakPreset === mins
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#8C6D15] dark:text-[#D4AF37]'
                      : 'bg-white dark:bg-[#202020] border-[#EBD3A0]/60 dark:border-[#333333] text-[#6B7280]'
                  }`}
                >
                  {mins === 5 ? '5m Short Break' : '15m Long Break'}
                </button>
              ))}
            </div>
          )}

          {mainMode === 'timer' && (
            <div className="flex items-center justify-center gap-2">
              {[15, 30, 45, 60, 120].map(mins => (
                <button
                  key={mins}
                  onClick={() => setCustomTimerMinutes(mins)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    customTimerMinutes === mins
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#8C6D15] dark:text-[#D4AF37]'
                      : 'bg-white dark:bg-[#202020] border-[#EBD3A0]/60 dark:border-[#333333] text-[#6B7280]'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          )}

          {/* 4. RADIAL CLOCK DISPLAY */}
          <div className="flex flex-col items-center justify-center py-2 relative">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              
              {/* Animated SVG Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
                {/* Background Ring */}
                <circle
                  cx="150"
                  cy="150"
                  r="130"
                  className="stroke-slate-200 dark:stroke-[#2A2A2A]"
                  strokeWidth="8"
                  fill="transparent"
                />

                {/* Progress Ring */}
                <circle
                  cx="150"
                  cy="150"
                  r="130"
                  stroke="#D4AF37"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              {/* Center Clock Numbers */}
              <div className="absolute flex flex-col items-center justify-center text-center space-y-1">
                
                {/* Status indicator badge */}
                <span className="px-3 py-1 text-[11px] font-black rounded-full bg-[#D4AF37]/15 text-[#8C6D15] dark:text-[#D4AF37] border border-[#D4AF37]/35 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-ping' : 'bg-[#D4AF37]'}`} />
                  <span>
                    {isRunning
                      ? mainMode === 'break' ? 'Relaxing Break' : 'Deep Work Active'
                      : 'Chamber Ready'}
                  </span>
                </span>

                {/* Time Display */}
                <span className="text-4xl sm:text-5xl font-black text-[#171717] dark:text-[#F5E6C8] font-mono tracking-tight mt-1">
                  {mainMode === 'stopwatch' ? formatTime(stopwatchSeconds) : formatTime(secondsLeft)}
                </span>

                <span className="text-xs font-semibold text-[#6B7280]">
                  {mainMode === 'stopwatch'
                    ? 'Timed Stopwatch Session'
                    : `${Math.round(totalSeconds / 60)} min Target Goal`}
                </span>
              </div>
            </div>
          </div>

          {/* 5. START / PAUSE / END CONTROLS */}
          <div className="flex items-center justify-center gap-3 pt-1">
            
            {/* Quick -5m Button */}
            {mainMode !== 'stopwatch' && (
              <button
                onClick={() => handleAddMinutes(-5)}
                className="p-3 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-[#6B7280] hover:text-[#171717] dark:hover:text-white transition-all cursor-pointer"
                title="Subtract 5 minutes"
              >
                <Minus className="w-4 h-4" />
              </button>
            )}

            {/* Reset / End Button */}
            <button
              onClick={handleReset}
              className="px-5 py-3.5 rounded-2xl bg-white dark:bg-[#222222] hover:bg-rose-500/15 border border-[#EBD3A0] dark:border-[#383838] hover:border-rose-500/50 text-[#6B7280] hover:text-rose-500 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Reset or End Session"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>

            {/* MAIN START / PAUSE BUTTON */}
            <button
              onClick={handleTogglePlay}
              className={`px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2 ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
                  : 'bg-gradient-to-r from-[#D4AF37] to-[#B89327] hover:from-[#DFC077] hover:to-[#D4AF37] text-[#171717] shadow-[#D4AF37]/35'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Focus</span>
                </>
              )}
            </button>

            {/* Quick +5m Button */}
            {mainMode !== 'stopwatch' && (
              <button
                onClick={() => handleAddMinutes(5)}
                className="p-3 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-[#6B7280] hover:text-[#171717] dark:hover:text-white transition-all cursor-pointer"
                title="Add 5 minutes"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Motivational Quote */}
          <div className="text-center pt-1">
            <p className="text-[11px] font-medium text-[#6B7280] italic max-w-md mx-auto">
              &ldquo;{MOTIVATIONAL_QUOTES[quoteIndex]}&rdquo;
            </p>
          </div>

          {/* 6. AMBIENT SOUND GENERATOR BAR */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280]">
              <Volume2 className="w-4 h-4 text-[#D4AF37]" />
              <span>Ambient Sound:</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {[
                { id: 'rain', label: 'Rain', icon: CloudRain },
                { id: 'waves', label: 'Waves', icon: Waves },
                { id: 'binaural', label: 'Alpha 432Hz', icon: Headphones },
                { id: 'fire', label: 'Fire', icon: FireIcon },
                { id: 'none', label: 'Mute', icon: VolumeX }
              ].map(snd => {
                const SndIcon = snd.icon;
                const isActive = activeSound === snd.id;

                return (
                  <button
                    key={snd.id}
                    onClick={() => {
                      soundManager.playClick();
                      setActiveSound(snd.id as AmbientSoundType);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isActive
                        ? 'bg-[#D4AF37] text-[#171717] border-[#D4AF37] shadow-sm'
                        : 'bg-[#FAF8F5] dark:bg-[#171717] text-[#6B7280] border-[#EBD3A0]/60 dark:border-[#2E2E2E] hover:border-[#D4AF37]'
                    }`}
                  >
                    <SndIcon className="w-3.5 h-3.5" />
                    <span>{snd.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
