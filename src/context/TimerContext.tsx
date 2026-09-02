import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TimerSessionState, FloatingTimerSettings, TimerMode } from '../types/timer';
import { useSyllabus } from './SyllabusContext';
import { soundManager } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

interface StartTimerOptions {
  mode?: TimerMode;
  durationMinutes?: number;
  topicId?: string;
  topicName?: string;
  subjectName?: string;
  targetLoops?: number;
  currentLoop?: number;
  isLoopActive?: boolean;
}

interface TimerContextType {
  session: TimerSessionState;
  settings: FloatingTimerSettings;
  isFloatingOverlayVisible: boolean;
  isFullModalOpen: boolean;
  isPermissionModalOpen: boolean;
  isPiPActive: boolean;
  startTimer: (options?: StartTimerOptions) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  stopTimer: () => void;
  setSessionMode: (mode: TimerMode, durationMinutes: number) => void;
  setSessionTopic: (topicId?: string, topicName?: string, subjectName?: string) => void;
  updateSettings: (partial: Partial<FloatingTimerSettings>) => void;
  openFullModal: () => void;
  closeFullModal: () => void;
  showFloatingOverlay: () => void;
  hideFloatingOverlay: () => void;
  toggleFloatingOverlay: () => void;
  requestPictureInPicture: () => Promise<boolean>;
  exitPictureInPicture: () => Promise<void>;
  openPermissionModal: () => void;
  closePermissionModal: () => void;
}

const DEFAULT_SETTINGS: FloatingTimerSettings = {
  enabled: true,
  showWhenBackgrounded: true,
  showPauseButton: true,
  rememberPosition: true,
  opacity: 0.95,
  size: 'standard',
  enablePiP: true,
  position: { x: typeof window !== 'undefined' && window.innerWidth > 640 ? window.innerWidth - 400 : 20, y: 100 }
};

const DEFAULT_SESSION: TimerSessionState = {
  id: 'session_' + Date.now(),
  mode: 'pomodoro',
  totalDurationSec: 25 * 60,
  remainingSec: 25 * 60,
  status: 'idle',
  startTimestamp: null,
  targetEndTimestamp: null,
  pausedTimestamp: null,
  accumulatedPausedMs: 0,
  stopwatchElapsedSec: 0,
  currentLoop: 1,
  targetLoops: 2,
  isLoopActive: false
};

const STORAGE_KEY_SESSION = 'syllabus3d_active_timer_session';
const STORAGE_KEY_SETTINGS = 'syllabus3d_floating_timer_settings';

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logStudySession, allTopics } = useSyllabus();

  const [settings, setSettings] = useState<FloatingTimerSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Error reading timer settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [session, setSession] = useState<TimerSessionState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSION);
      if (saved) {
        const parsed: TimerSessionState = JSON.parse(saved);
        const now = Date.now();
        if (parsed.status === 'running' && parsed.targetEndTimestamp) {
          const remaining = Math.max(0, Math.ceil((parsed.targetEndTimestamp - now) / 1000));
          if (remaining > 0) {
            return { ...parsed, remainingSec: remaining };
          } else {
            return { ...parsed, remainingSec: 0, status: 'completed' };
          }
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Error restoring timer session:', e);
    }
    return DEFAULT_SESSION;
  });

  const [isFloatingOverlayVisible, setIsFloatingOverlayVisible] = useState<boolean>(() => {
    return session.status === 'running' || session.status === 'paused';
  });
  const [isFullModalOpen, setIsFullModalOpen] = useState<boolean>(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState<boolean>(false);
  const [isPiPActive, setIsPiPActive] = useState<boolean>(false);

  const pipWindowRef = useRef<Window | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateSettings = useCallback((partial: Partial<FloatingTimerSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const persistSession = useCallback((updated: TimerSessionState) => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(updated));
      if (window.AndroidFloatingTimer && window.AndroidFloatingTimer.updateFloatingTimer) {
        window.AndroidFloatingTimer.updateFloatingTimer(JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Error persisting timer session:', e);
    }
  }, []);

  const notifyAndroidTimerChange = useCallback((action: 'start' | 'stop' | 'update', state: TimerSessionState) => {
    try {
      if (window.AndroidFloatingTimer) {
        if (action === 'start' && window.AndroidFloatingTimer.startFloatingTimer) {
          window.AndroidFloatingTimer.startFloatingTimer(JSON.stringify(state));
        } else if (action === 'stop' && window.AndroidFloatingTimer.stopFloatingTimer) {
          window.AndroidFloatingTimer.stopFloatingTimer();
        } else if (action === 'update' && window.AndroidFloatingTimer.updateFloatingTimer) {
          window.AndroidFloatingTimer.updateFloatingTimer(JSON.stringify(state));
        }
      }
    } catch (e) {
      console.warn('Android bridge error:', e);
    }
  }, []);

  const wakeLockRef = useRef<any>(null);

  const acquireWakeLock = useCallback(async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && (navigator as any).wakeLock) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        // wake lock request may fail if battery saver is on
      }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
      } catch (err) {}
      wakeLockRef.current = null;
    }
  }, []);

  const handleSessionComplete = useCallback(() => {
    releaseWakeLock();
    setSession(prev => {
      const completedState: TimerSessionState = {
        ...prev,
        status: 'completed',
        remainingSec: 0
      };
      persistSession(completedState);
      notifyAndroidTimerChange('stop', completedState);
      return completedState;
    });

    soundManager.playCompleteChime();
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });

    // Background Web Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Study Session Completed! 🎉', {
          body: `${session.topicName || 'Topic'} study goal reached! Great job!`,
          icon: '/logo.png',
          tag: 'study-timer-complete'
        });
      } catch (e) {}
    }

    if (session.totalDurationSec > 0) {
      logStudySession(Math.round(session.totalDurationSec / 60), session.topicId);
    }

    setIsFloatingOverlayVisible(false);

    if (pipWindowRef.current) {
      try {
        pipWindowRef.current.close();
      } catch (e) {}
      pipWindowRef.current = null;
      setIsPiPActive(false);
    }
  }, [session.totalDurationSec, session.topicId, session.topicName, logStudySession, persistSession, notifyAndroidTimerChange, releaseWakeLock]);

  const startTimer = useCallback((options?: StartTimerOptions) => {
    const now = Date.now();
    const mode = options?.mode || session.mode;
    const durSec = options?.durationMinutes ? options.durationMinutes * 60 : session.totalDurationSec;
    const targetEnd = mode === 'stopwatch' ? null : now + durSec * 1000;

    let topicId = options?.topicId || session.topicId;
    let topicName = options?.topicName || session.topicName;
    let subjectName = options?.subjectName || session.subjectName;

    if (!topicId && allTopics.length > 0) {
      topicId = allTopics[0].topic.id;
      topicName = allTopics[0].topic.name;
      subjectName = allTopics[0].subjectName;
    }

    const newSession: TimerSessionState = {
      id: 'session_' + now,
      mode,
      topicId,
      topicName,
      subjectName,
      totalDurationSec: durSec,
      remainingSec: durSec,
      status: 'running',
      startTimestamp: now,
      targetEndTimestamp: targetEnd,
      pausedTimestamp: null,
      accumulatedPausedMs: 0,
      stopwatchElapsedSec: 0,
      currentLoop: options?.currentLoop !== undefined ? options.currentLoop : session.currentLoop,
      targetLoops: options?.targetLoops !== undefined ? options.targetLoops : session.targetLoops,
      isLoopActive: options?.isLoopActive !== undefined ? options.isLoopActive : session.isLoopActive
    };

    setSession(newSession);
    persistSession(newSession);
    notifyAndroidTimerChange('start', newSession);

    if (settings.enabled) {
      setIsFloatingOverlayVisible(true);
    }
  }, [session, allTopics, settings.enabled, persistSession, notifyAndroidTimerChange]);

  const pauseTimer = useCallback(() => {
    if (session.status !== 'running') return;
    const now = Date.now();

    setSession(prev => {
      const pausedState: TimerSessionState = {
        ...prev,
        status: 'paused',
        pausedTimestamp: now
      };
      persistSession(pausedState);
      notifyAndroidTimerChange('update', pausedState);
      return pausedState;
    });
  }, [session.status, persistSession, notifyAndroidTimerChange]);

  const resumeTimer = useCallback(() => {
    if (session.status !== 'paused') return;
    const now = Date.now();
    const pausedMs = session.pausedTimestamp ? now - session.pausedTimestamp : 0;
    const newAccumulatedPausedMs = session.accumulatedPausedMs + pausedMs;
    const newTargetEndTimestamp = session.targetEndTimestamp ? session.targetEndTimestamp + pausedMs : null;

    setSession(prev => {
      const resumedState: TimerSessionState = {
        ...prev,
        status: 'running',
        pausedTimestamp: null,
        accumulatedPausedMs: newAccumulatedPausedMs,
        targetEndTimestamp: newTargetEndTimestamp
      };
      persistSession(resumedState);
      notifyAndroidTimerChange('update', resumedState);
      return resumedState;
    });
  }, [session, persistSession, notifyAndroidTimerChange]);

  const resetTimer = useCallback(() => {
    const durSec = session.totalDurationSec;
    setSession(prev => {
      const resetState: TimerSessionState = {
        ...prev,
        status: 'idle',
        remainingSec: durSec,
        startTimestamp: null,
        targetEndTimestamp: null,
        pausedTimestamp: null,
        accumulatedPausedMs: 0,
        stopwatchElapsedSec: 0
      };
      persistSession(resetState);
      notifyAndroidTimerChange('stop', resetState);
      return resetState;
    });
    setIsFloatingOverlayVisible(false);
  }, [session.totalDurationSec, persistSession, notifyAndroidTimerChange]);

  const stopTimer = useCallback(() => {
    setSession(prev => {
      const stoppedState: TimerSessionState = {
        ...prev,
        status: 'idle',
        startTimestamp: null,
        targetEndTimestamp: null,
        pausedTimestamp: null
      };
      persistSession(stoppedState);
      notifyAndroidTimerChange('stop', stoppedState);
      return stoppedState;
    });
    setIsFloatingOverlayVisible(false);
  }, [persistSession, notifyAndroidTimerChange]);

  const setSessionMode = useCallback((mode: TimerMode, durationMinutes: number) => {
    const durSec = durationMinutes * 60;
    setSession(prev => {
      const updated: TimerSessionState = {
        ...prev,
        mode,
        totalDurationSec: durSec,
        remainingSec: durSec,
        status: 'idle',
        startTimestamp: null,
        targetEndTimestamp: null,
        pausedTimestamp: null,
        accumulatedPausedMs: 0,
        stopwatchElapsedSec: 0
      };
      persistSession(updated);
      return updated;
    });
  }, [persistSession]);

  const setSessionTopic = useCallback((topicId?: string, topicName?: string, subjectName?: string) => {
    setSession(prev => {
      const updated = { ...prev, topicId, topicName, subjectName };
      persistSession(updated);
      return updated;
    });
  }, [persistSession]);

  useEffect(() => {
    if (session.status !== 'running') {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      return;
    }

    const tick = () => {
      const now = Date.now();

      if (session.mode === 'stopwatch') {
        if (session.startTimestamp) {
          const elapsed = Math.floor((now - session.startTimestamp - session.accumulatedPausedMs) / 1000);
          setSession(prev => {
            if (prev.stopwatchElapsedSec === elapsed) return prev;
            return { ...prev, stopwatchElapsedSec: elapsed };
          });
        }
      } else if (session.targetEndTimestamp) {
        const remaining = Math.max(0, Math.ceil((session.targetEndTimestamp - now) / 1000));
        setSession(prev => {
          if (prev.remainingSec === remaining) return prev;
          return { ...prev, remainingSec: remaining };
        });

        if (remaining <= 0) {
          handleSessionComplete();
        }
      }
    };

    tick();
    tickIntervalRef.current = setInterval(tick, 1000);

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  }, [session.status, session.mode, session.startTimestamp, session.targetEndTimestamp, session.accumulatedPausedMs, handleSessionComplete]);

  // Keep alive MediaSession & Screen WakeLock ONLY on status transitions (zero lag)
  useEffect(() => {
    if (session.status === 'running') {
      acquireWakeLock();
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && (window as any).MediaMetadata) {
        try {
          navigator.mediaSession.metadata = new (window as any).MediaMetadata({
            title: `⏱️ ${session.topicName || 'Study Session'}`,
            artist: 'Syllabus 3D Active Study Timer',
            album: session.subjectName || 'Competitive Exam Mastery'
          });
          navigator.mediaSession.playbackState = 'playing';
          navigator.mediaSession.setActionHandler('pause', () => pauseTimer());
          navigator.mediaSession.setActionHandler('play', () => resumeTimer());
          navigator.mediaSession.setActionHandler('stop', () => stopTimer());
        } catch (e) {}
      }
    } else {
      releaseWakeLock();
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        try {
          navigator.mediaSession.playbackState = session.status === 'paused' ? 'paused' : 'none';
        } catch (e) {}
      }
    }
  }, [session.status, session.topicName, session.subjectName, acquireWakeLock, releaseWakeLock, pauseTimer, resumeTimer, stopTimer]);

  // Background Visibility & Focus Real-Time Timestamp Synchronization
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (session.status === 'running') {
        const now = Date.now();
        if (session.mode === 'stopwatch' && session.startTimestamp) {
          const elapsed = Math.floor((now - session.startTimestamp - session.accumulatedPausedMs) / 1000);
          setSession(prev => ({ ...prev, stopwatchElapsedSec: elapsed }));
        } else if (session.targetEndTimestamp) {
          const remaining = Math.max(0, Math.ceil((session.targetEndTimestamp - now) / 1000));
          setSession(prev => ({ ...prev, remainingSec: remaining }));
          if (remaining <= 0) {
            handleSessionComplete();
          }
        }
        if (document.visibilityState === 'visible') {
          acquireWakeLock();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [session.status, session.mode, session.startTimestamp, session.targetEndTimestamp, session.accumulatedPausedMs, handleSessionComplete, acquireWakeLock]);

  const requestPictureInPicture = useCallback(async (): Promise<boolean> => {
    if ('documentPictureInPicture' in window && window.documentPictureInPicture) {
      try {
        const pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 360,
          height: 96
        });
        pipWindowRef.current = pipWindow;
        setIsPiPActive(true);

        pipWindow.document.body.style.margin = '0';
        pipWindow.document.body.style.backgroundColor = '#07080B';
        pipWindow.document.body.style.fontFamily = 'Inter, system-ui, sans-serif';
        pipWindow.document.body.style.display = 'flex';
        pipWindow.document.body.style.alignItems = 'center';
        pipWindow.document.body.style.justifyContent = 'center';
        pipWindow.document.body.style.height = '100vh';
        pipWindow.document.body.style.overflow = 'hidden';

        const updatePipDom = () => {
          const secs = session.remainingSec;
          const mins = Math.floor(secs / 60);
          const s = secs % 60;
          const timeStr = String(mins).padStart(2, '0') + ':' + String(s).padStart(2, '0');
          const isPaused = session.status === 'paused';
          const progressPercent = session.totalDurationSec > 0 ? (session.totalDurationSec - secs) / session.totalDurationSec : 0;

          pipWindow.document.body.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 12px 16px; box-sizing: border-box; background: rgba(15, 23, 42, 0.95); color: #F8FAFC; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 18px; box-shadow: 0 8px 32px rgba(0,0,0,0.6);">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <button id="pip-play-btn" style="width: 36px; height: 36px; border-radius: 50%; background: rgba(45, 212, 191, 0.2); border: 1px solid rgba(45, 212, 191, 0.4); color: #2DD4BF; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px;">
                  ${isPaused ? '▶' : '⏸'}
                </button>
                <div style="text-align: center;">
                  <div style="font-size: 22px; font-weight: 800; font-family: monospace; letter-spacing: -0.02em; color: #FFFFFF;">
                    🛡 ${timeStr}
                  </div>
                  <div style="font-size: 10px; font-weight: 600; color: ${isPaused ? '#FACC15' : '#94A3B8'};">
                    ${isPaused ? 'Paused' : 'Time remaining'}
                  </div>
                </div>
                <button id="pip-close-btn" style="width: 30px; height: 30px; border-radius: 50%; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: #94A3B8; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px;">
                  ✕
                </button>
              </div>
              <div style="width: 100%; height: 3px; background: rgba(255, 255, 255, 0.1); border-radius: 2px; overflow: hidden; margin-top: 6px;">
                <div style="width: ${Math.min(100, Math.max(0, progressPercent * 100))}%; height: 100%; background: #2DD4BF; transition: width 0.3s ease;"></div>
              </div>
            </div>
          `;

          const playBtn = pipWindow.document.getElementById('pip-play-btn');
          if (playBtn) {
            playBtn.onclick = () => {
              if (session.status === 'running') pauseTimer();
              else if (session.status === 'paused') resumeTimer();
            };
          }
          const closeBtn = pipWindow.document.getElementById('pip-close-btn');
          if (closeBtn) {
            closeBtn.onclick = () => {
              pipWindow.close();
            };
          }
        };

        updatePipDom();

        pipWindow.addEventListener('pagehide', () => {
          pipWindowRef.current = null;
          setIsPiPActive(false);
        });

        return true;
      } catch (e) {
        console.warn('Document Picture-in-Picture error:', e);
      }
    }

    return false;
  }, [session, pauseTimer, resumeTimer]);

  const exitPictureInPicture = useCallback(async () => {
    if (pipWindowRef.current) {
      try {
        pipWindowRef.current.close();
      } catch (e) {}
      pipWindowRef.current = null;
      setIsPiPActive(false);
    }
  }, []);

  const contextValue = useMemo(() => ({
    session,
    settings,
    isFloatingOverlayVisible,
    isFullModalOpen,
    isPermissionModalOpen,
    isPiPActive,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    stopTimer,
    setSessionMode,
    setSessionTopic,
    updateSettings,
    openFullModal: () => setIsFullModalOpen(true),
    closeFullModal: () => setIsFullModalOpen(false),
    showFloatingOverlay: () => setIsFloatingOverlayVisible(true),
    hideFloatingOverlay: () => setIsFloatingOverlayVisible(false),
    toggleFloatingOverlay: () => setIsFloatingOverlayVisible(prev => !prev),
    requestPictureInPicture,
    exitPictureInPicture,
    openPermissionModal: () => setIsPermissionModalOpen(true),
    closePermissionModal: () => setIsPermissionModalOpen(false)
  }), [
    session,
    settings,
    isFloatingOverlayVisible,
    isFullModalOpen,
    isPermissionModalOpen,
    isPiPActive,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    stopTimer,
    setSessionMode,
    setSessionTopic,
    updateSettings,
    requestPictureInPicture,
    exitPictureInPicture
  ]);

  return (
    <TimerContext.Provider value={contextValue}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};