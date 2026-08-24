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
  Maximize2,
  Minimize2,
  Check,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { ambientEngine, AmbientSoundType } from '../../utils/ambientSounds';
import { soundManager } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';

interface PomodoroFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTopicId?: string;
}

const MOTIVATIONAL_QUOTES = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "Focus on being productive instead of busy. — Tim Ferriss",
  "One focused hour is worth ten distracted hours. — Deep Work",
  "Your rank is decided in the quiet hours of deep practice.",
  "Small daily streaks lead to massive exam breakthroughs.",
];

export const PomodoroFocusModal: React.FC<PomodoroFocusModalProps> = ({
  isOpen,
  onClose,
  defaultTopicId
}) => {
  const { allTopics, logStudySession } = useSyllabus();

  // Mode: 25m Focus, 50m Deep, 90m Flow, 5m Short Break, 15m Long Break
  const [sessionType, setSessionType] = useState<'focus25' | 'focus50' | 'focus90' | 'break5' | 'break15'>('focus25');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(defaultTopicId || '');
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSound, setActiveSound] = useState<AmbientSoundType>('rain');
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [completedSessionsToday, setCompletedSessionsToday] = useState(2);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize selected topic if passed
  useEffect(() => {
    if (defaultTopicId) {
      setSelectedTopicId(defaultTopicId);
    } else if (allTopics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(allTopics[0].topic.id);
    }
  }, [defaultTopicId, allTopics]);

  // Set time when sessionType changes
  useEffect(() => {
    let dur = 25 * 60;
    if (sessionType === 'focus25') dur = 25 * 60;
    else if (sessionType === 'focus50') dur = 50 * 60;
    else if (sessionType === 'focus90') dur = 90 * 60;
    else if (sessionType === 'break5') dur = 5 * 60;
    else if (sessionType === 'break15') dur = 15 * 60;

    setTotalSeconds(dur);
    setSecondsLeft(dur);
    setIsRunning(false);
  }, [sessionType]);

  // Timer Tick
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && secondsLeft === 0) {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

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
    confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });

    const minutesSpent = Math.round(totalSeconds / 60);
    logStudySession(minutesSpent);

    if (sessionType.startsWith('focus')) {
      setCompletedSessionsToday(c => c + 1);
    }

    // Auto switch to break if focus completed
    if (sessionType === 'focus25') {
      setSessionType('break5');
    } else if (sessionType === 'focus50') {
      setSessionType('break15');
    }
  };

  const handleTogglePlay = () => {
    soundManager.playClick();
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    soundManager.playClick();
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
    ambientEngine.stop();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  };

  const progressPercent = totalSeconds > 0 ? Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100) : 0;

  const currentTopicItem = useMemo(() => {
    return allTopics.find(t => t.topic.id === selectedTopicId);
  }, [allTopics, selectedTopicId]);

  if (!isOpen) return null;

  const sounds: Array<{ type: AmbientSoundType; label: string; icon: React.ElementType }> = [
    { type: 'rain', label: 'Rain', icon: CloudRain },
    { type: 'ocean', label: 'Waves', icon: Waves },
    { type: 'binaural', label: 'Alpha 432Hz', icon: Headphones },
    { type: 'fireplace', label: 'Cozy Fire', icon: FireIcon },
    { type: 'none', label: 'Mute', icon: VolumeX },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#040714] text-white flex flex-col justify-between p-4 sm:p-8 overflow-y-auto overflow-x-hidden selection:bg-brand-500/30 backdrop-blur-3xl animate-fade-in"
    >
      {/* Background Animated Breathing Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] rounded-full blur-[140px] transition-all duration-1000 ${
            sessionType.startsWith('break')
              ? 'bg-gradient-to-tr from-emerald-600/20 via-teal-500/20 to-cyan-500/10'
              : isRunning
              ? 'bg-gradient-to-tr from-cyan-500/25 via-purple-600/25 to-pink-500/20 animate-pulse'
              : 'bg-gradient-to-tr from-blue-600/15 via-purple-600/15 to-transparent'
          }`}
        />
      </div>

      {/* Top Controls Bar */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Active Session & Topic Badge */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 shrink-0 shadow-lg">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>

          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-400">
              {sessionType.startsWith('break') ? '☕ Rest & Recharge' : '⚡ 3D Deep Study Chamber'}
            </span>
            <div className="flex items-center gap-2">
              <select
                value={selectedTopicId}
                onChange={e => setSelectedTopicId(e.target.value)}
                className="bg-slate-900/80 border border-slate-700/80 text-xs font-bold rounded-xl px-2.5 py-1 text-white focus:ring-2 focus:ring-brand-500 focus:outline-none truncate max-w-[200px] sm:max-w-xs cursor-pointer"
              >
                <option value="">-- Freeflow Focus (General) --</option>
                {allTopics.map(t => (
                  <option key={t.topic.id} value={t.topic.id}>
                    {t.subjectName} · {t.topic.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Header Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleFullscreen}
            className="p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 transition-all cursor-pointer"
            title="Toggle Fullscreen (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              ambientEngine.stop();
              onClose();
            }}
            className="p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-rose-500/20 hover:text-rose-400 text-slate-200 border border-white/15 transition-all cursor-pointer"
            title="Exit Focus Chamber"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main 3D Ticking Chamber Core */}
      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center justify-center my-6 text-center space-y-6">
        {/* Session Selector Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl">
          {[
            { id: 'focus25', label: '25m Focus' },
            { id: 'focus50', label: '50m Deep Work' },
            { id: 'focus90', label: '90m Flow State' },
            { id: 'break5', label: '5m Short Break' },
            { id: 'break15', label: '15m Long Break' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setSessionType(m.id as typeof sessionType)}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                sessionType === m.id
                  ? 'bg-gradient-to-r from-brand-500 to-purple-600 text-white shadow-md shadow-brand-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* 3D Glowing Orb Timer Dial */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
          {/* Multi-layer SVG Progress Ring */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 240 240">
            <circle
              cx="120"
              cy="120"
              r="105"
              className="stroke-slate-800/80"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="120"
              cy="120"
              r="105"
              stroke="url(#focusGradient)"
              strokeWidth="12"
              strokeDasharray={660}
              strokeDashoffset={660 - (660 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d2ff" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Digital Clock & Breathing Orb Core */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {/* Center Breathing Aura */}
            <div
              className={`absolute w-44 h-44 rounded-full filter blur-xl transition-all duration-700 ${
                isRunning
                  ? 'bg-gradient-to-tr from-cyan-500/20 via-purple-500/30 to-pink-500/20 scale-110 animate-pulse'
                  : 'bg-slate-800/40 scale-95'
              }`}
            />

            <span className="relative z-10 text-5xl sm:text-7xl font-black font-mono tracking-tighter drop-shadow-[0_4px_25px_rgba(0,210,255,0.4)]">
              {formatTimer(secondsLeft)}
            </span>

            <span className="relative z-10 text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-slate-400 mt-2 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span>{isRunning ? 'Flow State Active' : 'Chamber Idle'}</span>
            </span>
          </div>
        </div>

        {/* Play / Pause / Reset Action Controls */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={handleReset}
            className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={handleTogglePlay}
            className={`px-8 sm:px-10 py-4 rounded-2xl flex items-center gap-3 text-base sm:text-lg font-black tracking-wide shadow-2xl transition-all cursor-pointer ${
              isRunning
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/40 scale-105'
                : 'bg-gradient-to-r from-[#0066ff] via-[#8b5cf6] to-[#d946ef] text-white shadow-purple-500/40 hover:scale-105 active:scale-95'
            }`}
          >
            {isRunning ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white" />}
            <span>{isRunning ? 'Pause Focus' : 'Start Focus'}</span>
          </button>

          {secondsLeft < totalSeconds && (
            <button
              onClick={handleSessionComplete}
              className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-400 transition-all cursor-pointer"
              title="Log Completed Early"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Motivational Aspirant Quote */}
        <p className="text-xs sm:text-sm text-slate-400 italic max-w-md mx-auto pt-2">
          {MOTIVATIONAL_QUOTES[quoteIndex % MOTIVATIONAL_QUOTES.length]}
        </p>
      </div>

      {/* Bottom Ambient Audio Dock & Session Stats */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        {/* Offline Ambient Sound Generator */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 pr-2">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>Ambient Sound:</span>
          </span>

          {sounds.map(s => {
            const Icon = s.icon;
            const isSel = activeSound === s.type;
            return (
              <button
                key={s.type}
                onClick={() => {
                  setActiveSound(s.type);
                  soundManager.playClick();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Daily Stats */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/30">
            <Flame className="w-4 h-4 fill-orange-500" />
            <span>{completedSessionsToday} Cycles Done Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};
