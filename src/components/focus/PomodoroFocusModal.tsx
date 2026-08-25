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
  Check
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
  "Small daily streaks lead to massive exam breakthroughs."
];

export const PomodoroFocusModal: React.FC<PomodoroFocusModalProps> = ({
  isOpen,
  onClose,
  defaultTopicId
}) => {
  const { allTopics, logStudySession } = useSyllabus();

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

  // Responsive radius calculation: radius = 105 on mobile, 130 on desktop
  const radius = 115;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent * circumference);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-slate-950/90 backdrop-blur-xl select-none animate-fade-in overflow-y-auto">
      
      {/* IMMERSIVE MOBILE-NATIVE FOCUS CARD */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-xl sm:rounded-[32px] bg-[#FAF8F5] dark:bg-[#1A1A1A] sm:border border-[#EBD3A0] dark:border-[#333333] shadow-2xl overflow-hidden flex flex-col justify-between pt-safe pb-safe">
        
        {/* 1. TOP HEADER */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-[#EBD3A0]/60 dark:border-[#2E2E2E] flex items-center justify-between bg-white/80 dark:bg-[#202020]/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#B89327] text-[#171717] flex items-center justify-center font-black shadow-sm">
              <Zap className="w-4 h-4 fill-[#171717]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-[#171717] dark:text-[#F5E6C8] uppercase tracking-wider">
                3D Deep Study Chamber
              </h3>
              <p className="text-[9px] font-bold text-[#8C6D15] dark:text-[#D4AF37]">
                Ekagra Mastery Engine
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              ambientEngine.stop();
              onClose();
            }}
            className="p-2 rounded-xl text-[#6B7280] hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition-all cursor-pointer"
            title="Close Chamber"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. SCROLLABLE / FLEXIBLE BODY */}
        <div className="px-3.5 py-3 sm:px-6 sm:py-4 space-y-3 sm:space-y-4 overflow-y-auto flex-1 flex flex-col justify-between">
          
          {/* Top Overview Cards (Compact & Responsive) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 shrink-0">
            
            {/* Focus Streak Card */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#333333] flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/35 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 fill-[#D4AF37]" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#6B7280] block">Today's Focus</span>
                  <span className="text-xs font-black text-[#171717] dark:text-[#F5E6C8] font-mono">
                    {completedSessionsToday} Deep Sessions Completed
                  </span>
                </div>
              </div>
            </div>

            {/* Searchable Target Topic Card */}
            <div className="relative">
              <div
                onClick={() => setIsTopicSearchOpen(prev => !prev)}
                className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#333333] hover:border-[#D4AF37] flex items-center justify-between shadow-sm cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-[#6B7280] block flex items-center gap-1">
                      <span>Target Topic</span>
                      <Search className="w-2.5 h-2.5 text-[#D4AF37] inline" />
                    </span>
                    <span className="text-xs font-black text-[#171717] dark:text-[#F5E6C8] truncate block group-hover:text-[#D4AF37]">
                      {selectedTopic ? `${selectedTopic.subjectName} • ${selectedTopic.topic.name}` : 'Search & Select Topic...'}
                    </span>
                  </div>
                </div>
                <Search className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              </div>

              {/* SEARCH POPOVER MODAL */}
              {isTopicSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-30 p-2.5 rounded-2xl bg-white dark:bg-[#202020] border border-[#D4AF37] shadow-2xl space-y-2 animate-slide-up">
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 w-3.5 h-3.5 text-[#D4AF37] pointer-events-none" />
                    <input
                      type="text"
                      autoFocus
                      value={topicSearchTerm}
                      onChange={e => setTopicSearchTerm(e.target.value)}
                      placeholder="Search subject or topic..."
                      className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0] dark:border-[#383838] text-xs font-bold text-[#171717] dark:text-white placeholder-[#6B7280] focus:ring-2 focus:ring-[#D4AF37]"
                    />
                    {topicSearchTerm && (
                      <button
                        onClick={() => setTopicSearchTerm('')}
                        className="absolute right-2 text-[#6B7280] hover:text-[#171717] dark:hover:text-white p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1 p-1 rounded-xl bg-[#FAF8F5] dark:bg-[#171717] border border-[#EBD3A0]/60 dark:border-[#2E2E2E]">
                    {filteredTopics.length === 0 ? (
                      <p className="text-center py-3 text-xs text-[#6B7280]">
                        No matching topics
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
                            className={`p-1.5 rounded-lg flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#D4AF37] text-[#171717] font-bold shadow-sm'
                                : 'hover:bg-[#F5E6C8]/40 dark:hover:bg-[#252525] text-[#171717] dark:text-[#F5E6C8]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 pr-1">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: t.subjectColor || '#D4AF37' }}
                              />
                              <span className="truncate">{t.topic.name}</span>
                            </div>
                            <span className={`text-[9px] shrink-0 font-mono ${
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

          {/* 4 MODE TABS: POMODORO | BREAK | STOPWATCH | TIMER */}
          <div className="flex items-center justify-between p-1 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#333333] shadow-sm shrink-0">
            {[
              { id: 'pomodoro' as FocusMainMode, label: 'Pomodoro', icon: Hourglass },
              { id: 'break' as FocusMainMode, label: 'Break', icon: Coffee },
              { id: 'stopwatch' as FocusMainMode, label: 'Stopwatch', icon: StopwatchIcon },
              { id: 'timer' as FocusMainMode, label: 'Timer', icon: Clock }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = mainMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMainMode(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#D4AF37] text-[#171717] shadow-sm'
                      : 'text-[#6B7280] hover:text-[#171717] dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-presets Row */}
          {mainMode === 'pomodoro' && (
            <div className="flex items-center justify-center gap-1.5 shrink-0">
              {[25, 50, 90].map(mins => (
                <button
                  key={mins}
                  onClick={() => setPomoPreset(mins)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                    pomoPreset === mins
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#8C6D15] dark:text-[#D4AF37]'
                      : 'bg-white dark:bg-[#202020] border-[#EBD3A0]/60 dark:border-[#333333] text-[#6B7280]'
                  }`}
                >
                  {mins === 25 ? '25m Focus' : mins === 50 ? '50m Deep' : '90m Flow'}
                </button>
              ))}
            </div>
          )}

          {mainMode === 'break' && (
            <div className="flex items-center justify-center gap-1.5 shrink-0">
              {[5, 15].map(mins => (
                <button
                  key={mins}
                  onClick={() => setBreakPreset(mins)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
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
            <div className="flex items-center justify-center gap-1.5 shrink-0">
              {[15, 30, 45, 60, 120].map(mins => (
                <button
                  key={mins}
                  onClick={() => setCustomTimerMinutes(mins)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
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

          {/* RADIAL CLOCK DISPLAY (Mobile Scaled) */}
          <div className="flex flex-col items-center justify-center py-1 sm:py-2 relative flex-1">
            <div className="relative w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center">
              
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 260 260">
                <circle
                  cx="130"
                  cy="130"
                  r={radius}
                  className="stroke-slate-200 dark:stroke-[#2A2A2A]"
                  strokeWidth="7"
                  fill="transparent"
                />

                <circle
                  cx="130"
                  cy="130"
                  r={radius}
                  stroke="#D4AF37"
                  strokeWidth="9"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center space-y-1">
                <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-[#D4AF37]/15 text-[#8C6D15] dark:text-[#D4AF37] border border-[#D4AF37]/35 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-ping' : 'bg-[#D4AF37]'}`} />
                  <span>
                    {isRunning
                      ? mainMode === 'break' ? 'Relaxing Break' : 'Deep Work Active'
                      : 'Chamber Ready'}
                  </span>
                </span>

                <span className="text-4xl sm:text-5xl font-black text-[#171717] dark:text-[#F5E6C8] font-mono tracking-tight mt-0.5">
                  {mainMode === 'stopwatch' ? formatTime(stopwatchSeconds) : formatTime(secondsLeft)}
                </span>

                <span className="text-[10px] font-semibold text-[#6B7280]">
                  {mainMode === 'stopwatch'
                    ? 'Timed Stopwatch Session'
                    : `${Math.round(totalSeconds / 60)} min Target Goal`}
                </span>
              </div>
            </div>
          </div>

          {/* START / PAUSE / RESET BUTTONS */}
          <div className="flex items-center justify-center gap-2.5 shrink-0">
            {mainMode !== 'stopwatch' && (
              <button
                onClick={() => handleAddMinutes(-5)}
                className="p-2.5 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-[#6B7280] hover:text-[#171717] dark:hover:text-white transition-all cursor-pointer"
                title="-5 minutes"
              >
                <Minus className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleReset}
              className="px-4 py-3 rounded-2xl bg-white dark:bg-[#222222] hover:bg-rose-500/15 border border-[#EBD3A0] dark:border-[#383838] hover:border-rose-500/50 text-[#6B7280] hover:text-rose-500 text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              title="Reset Session"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleTogglePlay}
              className={`px-7 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2 ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
                  : 'bg-gradient-to-r from-[#D4AF37] to-[#B89327] hover:from-[#DFC077] hover:to-[#D4AF37] text-[#171717] shadow-[#D4AF37]/35'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Focus</span>
                </>
              )}
            </button>

            {mainMode !== 'stopwatch' && (
              <button
                onClick={() => handleAddMinutes(5)}
                className="p-2.5 rounded-2xl bg-white dark:bg-[#222222] border border-[#EBD3A0] dark:border-[#383838] text-[#6B7280] hover:text-[#171717] dark:hover:text-white transition-all cursor-pointer"
                title="+5 minutes"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Motivational Quote */}
          <div className="text-center shrink-0">
            <p className="text-[10px] font-medium text-[#6B7280] italic max-w-sm mx-auto line-clamp-1">
              &ldquo;{MOTIVATIONAL_QUOTES[quoteIndex]}&rdquo;
            </p>
          </div>

          {/* 6. AMBIENT SOUND SELECTOR BAR (Thumb-friendly on mobile) */}
          <div className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-[#202020] border border-[#EBD3A0] dark:border-[#333333] flex items-center justify-between gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#6B7280] shrink-0">
              <Volume2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Sound:</span>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-1 w-full overflow-x-auto no-scrollbar">
              {[
                { id: 'rain', label: 'Rain', icon: CloudRain },
                { id: 'waves', label: 'Waves', icon: Waves },
                { id: 'binaural', label: 'Alpha', icon: Headphones },
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
                    className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                      isActive
                        ? 'bg-[#D4AF37] text-[#171717] border-[#D4AF37] shadow-sm'
                        : 'bg-[#FAF8F5] dark:bg-[#171717] text-[#6B7280] border-[#EBD3A0]/60 dark:border-[#2E2E2E]'
                    }`}
                  >
                    <SndIcon className="w-3 h-3 shrink-0" />
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
