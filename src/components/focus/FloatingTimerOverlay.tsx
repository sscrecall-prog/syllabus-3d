import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTimer } from '../../context/TimerContext';
import { Play, Pause, X, Shield, Maximize2 } from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

export const FloatingTimerOverlay: React.FC = () => {
  const {
    session,
    settings,
    isFloatingOverlayVisible,
    isFullModalOpen,
    pauseTimer,
    resumeTimer,
    hideFloatingOverlay,
    openFullModal,
    updateSettings
  } = useTimer();

  const isVisible = isFloatingOverlayVisible && !isFullModalOpen && (session.status === 'running' || session.status === 'paused');

  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    return settings.position || { x: typeof window !== 'undefined' && window.innerWidth > 640 ? window.innerWidth - 380 : 16, y: 100 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  });
  const hasMovedRef = useRef<boolean>(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (settings.rememberPosition && settings.position) {
      setPosition(settings.position);
    }
  }, [settings.rememberPosition, settings.position]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };

    if (overlayRef.current) {
      overlayRef.current.setPointerCapture(e.pointerId);
    }
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMovedRef.current = true;
    }

    const overlayWidth = settings.size === 'compact' ? 320 : 360;
    const overlayHeight = 80;
    const maxX = Math.max(0, window.innerWidth - overlayWidth - 10);
    const maxY = Math.max(0, window.innerHeight - overlayHeight - 10);

    const nextX = Math.min(Math.max(10, dragStartRef.current.initialX + dx), maxX);
    const nextY = Math.min(Math.max(10, dragStartRef.current.initialY + dy), maxY);

    setPosition({ x: nextX, y: nextY });
  }, [isDragging, settings.size]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    if (overlayRef.current) {
      try {
        overlayRef.current.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }

    if (settings.rememberPosition) {
      updateSettings({ position });
    }
  }, [isDragging, position, settings.rememberPosition, updateSettings]);

  const handleBodyClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    if (hasMovedRef.current) return;

    soundManager.playClick();
    openFullModal();
  }, [openFullModal]);

  if (!isVisible) return null;

  const secs = session.mode === 'stopwatch' ? session.stopwatchElapsedSec : session.remainingSec;
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  const timeStr = String(mins).padStart(2, '0') + ':' + String(s).padStart(2, '0');

  const isPaused = session.status === 'paused';
  const progressPercent = session.mode === 'stopwatch'
    ? (session.stopwatchElapsedSec % 60) / 60
    : session.totalDurationSec > 0
    ? (session.totalDurationSec - session.remainingSec) / session.totalDurationSec
    : 0;

  const isCompact = settings.size === 'compact';
  const widthClass = isCompact ? 'w-[320px] sm:w-[340px]' : 'w-[340px] sm:w-[380px]';
  const heightClass = isCompact ? 'h-[70px]' : 'h-[78px]';

  return (
    <div
      ref={overlayRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleBodyClick}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        opacity: settings.opacity || 0.95,
        touchAction: 'none'
      }}
      className={`${widthClass} ${heightClass} rounded-[38px] bg-[#07090E]/92 dark:bg-[#07090E]/92 backdrop-blur-2xl border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.18)] select-none cursor-grab active:cursor-grabbing flex flex-col justify-between overflow-hidden transition-shadow duration-150 animate-scale-in group`}
      title="Drag to reposition • Click to expand full timer"
      role="region"
      aria-label="Floating Focus Timer"
    >
      <div className="flex-1 flex items-center justify-between px-4 pt-1">
        {settings.showPauseButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playClick();
              if (session.status === 'running') {
                pauseTimer();
              } else {
                resumeTimer();
              }
            }}
            className="w-10 h-10 rounded-full bg-teal-500/15 hover:bg-teal-500/25 active:scale-95 border border-teal-400/40 text-teal-300 flex items-center justify-center transition-all shadow-sm shrink-0 cursor-pointer"
            title={isPaused ? 'Resume Timer' : 'Pause Timer'}
            aria-label={isPaused ? 'Resume Timer' : 'Pause Timer'}
          >
            {isPaused ? (
              <Play className="w-4 h-4 fill-teal-300 translate-x-0.5" />
            ) : (
              <Pause className="w-4 h-4 fill-teal-300" />
            )}
          </button>
        )}

        <div className="flex-1 flex flex-col items-center justify-center px-2 pointer-events-none">
          <div className="flex items-center gap-1.5 leading-none">
            <Shield className="w-4 h-4 text-teal-400 fill-teal-400/30 stroke-[2.2]" />
            <span className="text-[23px] font-black font-mono tracking-tight text-white drop-shadow-md">
              {timeStr}
            </span>
          </div>
          <span className={`text-[10px] font-semibold tracking-wide uppercase mt-0.5 ${
            isPaused ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}>
            {isPaused ? 'Paused' : session.mode === 'stopwatch' ? 'Stopwatch Elapsed' : 'Time remaining'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playClick();
              openFullModal();
            }}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Expand Full Timer"
            aria-label="Expand Full Timer"
          >
            <Maximize2 className="w-3 h-3" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playClick();
              hideFloatingOverlay();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 active:scale-95 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-300 flex items-center justify-center transition-all cursor-pointer"
            title="Hide Floating Overlay (Timer keeps running)"
            aria-label="Hide Floating Overlay"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      <div className="w-full h-[2.5px] bg-white/10 overflow-hidden shrink-0">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-300 shadow-[0_0_8px_rgba(45,212,191,0.8)]"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent * 100))}%` }}
        />
      </div>
    </div>
  );
};