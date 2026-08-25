export type TimerMode = 'pomodoro' | 'break' | 'timer' | 'stopwatch';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerSessionState {
  id: string;
  mode: TimerMode;
  topicId?: string;
  topicName?: string;
  subjectName?: string;
  totalDurationSec: number;
  remainingSec: number;
  status: TimerStatus;
  startTimestamp: number | null;
  targetEndTimestamp: number | null;
  pausedTimestamp: number | null;
  accumulatedPausedMs: number;
  stopwatchElapsedSec: number;
  currentLoop?: number;
  targetLoops?: number;
  isLoopActive?: boolean;
}

export interface FloatingTimerSettings {
  enabled: boolean;
  showWhenBackgrounded: boolean;
  showPauseButton: boolean;
  rememberPosition: boolean;
  opacity: number; // 0.5 to 1.0
  size: 'compact' | 'standard';
  enablePiP: boolean;
  position: { x: number; y: number };
}

export interface AndroidFloatingTimerBridge {
  isOverlayPermissionGranted?: () => boolean;
  requestOverlayPermission?: () => void;
  startFloatingTimer?: (jsonState: string) => void;
  updateFloatingTimer?: (jsonState: string) => void;
  stopFloatingTimer?: () => void;
  hideFloatingTimer?: () => void;
  showFloatingTimer?: () => void;
}

declare global {
  interface Window {
    AndroidFloatingTimer?: AndroidFloatingTimerBridge;
    documentPictureInPicture?: {
      requestWindow: (options: { width: number; height: number }) => Promise<Window>;
      window: Window | null;
    };
  }
}
