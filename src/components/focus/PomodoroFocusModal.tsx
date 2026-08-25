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

export const PomodoroFocusModal: React.FC<PomodoroFocusModalProps> = ({
  isOpen,
  onClose,
  defaultTopicId
}) => {
  const { allTopics, logStudySession } = useSyllabus();

  const [mainMode, setMainMode] = useState<FocusMainMode>('pomodoro');
  const [pomoPreset, setPomoPreset] = useState<number>(25);
  const [breakPreset, setBreakPreset] = useState<number>(5);
  const [customTimerMinutes, setCustomTimerMinutes] = useState<number>(45);

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

  useEffect(() => {
    if (isOpen && isRunning && activeSound !== 'none') {
      ambientEngine.play(activeSound);
      ambientEngine.setVolume(soundVolume);
    } else {
      ambientEngine.stop();
    }
    return () => ambientEngine.stop();
  }, [isOpen, isRunning, activeSound]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    ambientEngine.stop();
    soundManager.playCompleteChime();
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    logStudySession(Math.round(totalSeconds / 60));
    setCompletedSessionsToday(c => c + 1);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/80 backdrop-blur-md select-none animate-fade-in">
      <div className="relative w-full h-full sm:h-auto sm:max-w-lg sm:rounded-3xl bg-[#F7F6F0] dark:bg-[#0D0E0C] border border-[#D8D8CF] dark:border-[#30342B] shadow-2xl p-5 flex flex-col justify-between pt-safe pb-safe">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D8D8CF] dark:border-[#30342B]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#596B35] text-white flex items-center justify-center font-bold">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#11120F] dark:text-[#F4F4ED] uppercase font-serif">
                Focus Chamber
              </h3>
              <p className="text-[10px] text-[#596B35] dark:text-[#A4B879]">
                Deep Study Session
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-[#85877E] hover:text-[#11120F] dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Topic Search */}
        <div className="relative my-2">
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
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mainMode === tab.id
                  ? 'bg-[#596B35] text-white shadow-sm'
                  : 'text-[#65675F] dark:text-[#A7AA9C]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Radial Clock Display */}
        <div className="flex flex-col items-center justify-center my-3 relative">
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
              <span className="text-[10px] text-[#596B35] font-bold uppercase tracking-wider mt-1">
                {isRunning ? 'Session Active' : 'Ready'}
              </span>
            </div>
          </div>
        </div>

        {/* Start / Pause Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(pomoPreset * 60);
            }}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] text-xs font-bold text-[#65675F]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsRunning(r => !r)}
            className="px-8 py-3 rounded-xl bg-[#11120F] hover:bg-[#596B35] text-white text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-2"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
          </button>
        </div>

        {/* Ambient Sound Bar */}
        <div className="p-2 rounded-xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] flex items-center justify-between gap-1 mt-3">
          {[
            { id: 'rain', label: 'Rain' },
            { id: 'waves', label: 'Waves' },
            { id: 'binaural', label: 'Alpha' },
            { id: 'none', label: 'Mute' }
          ].map(snd => (
            <button
              key={snd.id}
              onClick={() => setActiveSound(snd.id as AmbientSoundType)}
              className={`flex-1 py-1 text-[10px] font-bold rounded-md ${
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
    </div>
  );
};
