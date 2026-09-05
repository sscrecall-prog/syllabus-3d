import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTimer } from '../../context/TimerContext';
import { Play, Pause, X, Maximize2, Zap, Minus } from 'lucide-react';
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

  // State to track whether it's collapsed into a small cute emoji bubble
  const [isCollapsedToEmoji, setIsCollapsedToEmoji] = useState(false);

  // Initial smart positioning (bottom-right corner, above bottom nav on mobile)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 640;
      const w = isMobile ? 200 : 240;
      const defaultX = Math.max(12, window.innerWidth - w - 16);
      const defaultY = isMobile ? window.innerHeight - 130 : 90;
      return settings.position || { x: defaultX, y: defaultY };
    }
    return { x: 16, y: 90 };
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

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const overlayWidth = isCollapsedToEmoji ? 50 : isMobile ? 200 : 240;
    const overlayHeight = isCollapsedToEmoji ? 50 : 44;
    const maxX = Math.max(0, window.innerWidth - overlayWidth - 8);
    const maxY = Math.max(0, window.innerHeight - overlayHeight - 60);

    const nextX = Math.min(Math.max(8, dragStartRef.current.initialX + dx), maxX);
    const nextY = Math.min(Math.max(8, dragStartRef.current.initialY + dy), maxY);

    setPosition({ x: nextX, y: nextY });
  }, [isDragging, isCollapsedToEmoji]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    if (overlayRef.current) {
      try {
        overlayRef.current.releasePointerCapture(e.pointerId);
      } catch {}
    }

    if (settings.rememberPosition) {
      updateSettings({ position });
    }
  }, [isDragging, position, settings.rememberPosition, updateSettings]);

  if (!isVisible) return null;

  const secs = session.mode === 'stopwatch' ? session.stopwatchElapsedSec : session.remainingSec;
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const isPaused = session.status === 'paused';
  const progressPercent = session.mode === 'stopwatch'
    ? (session.stopwatchElapsedSec % 60) / 60
    : session.totalDurationSec > 0
    ? (session.totalDurationSec - session.remainingSec) / session.totalDurationSec
    : 0;

  // ═══════════════════════════════════════════════════════════════════
  // MODE A: COLLAPSED ULTRA-COMPACT TIMER EMOJI ORB (Tap to expand)
  // ═══════════════════════════════════════════════════════════════════
  if (isCollapsedToEmoji) {
    return (
      <div
        ref={overlayRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={e => {
          if (hasMovedRef.current) return;
          soundManager.playClick();
          setIsCollapsedToEmoji(false);
        }}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 9999,
          opacity: settings.opacity || 0.96,
          touchAction: 'none'
        }}
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#07090E]/95 dark:bg-[#07090E]/95 backdrop-blur-2xl border border-white/25 shadow-[0_10px_30px_rgba(0,0,0,0.65),0_0_0_1.5px_rgba(255,255,255,0.15)] select-none cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform hover:scale-110 active:scale-95 animate-scale-in group"
        title="Timer is running • Tap to expand"
        role="button"
        aria-label="Floating Timer Emoji Orb - Tap to expand"
      >
        {/* Animated Pulsing Progress Glow Ring */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-t-transparent pointer-events-none ${
            isPaused
              ? 'border-amber-400'
              : session.mode === 'break'
              ? 'border-amber-400 animate-spin [animation-duration:4s]'
              : 'border-emerald-400 animate-spin [animation-duration:3s]'
          }`}
        />

        {/* Live Study Emoji Icon */}
        <span className="text-xl sm:text-2xl select-none filter drop-shadow-md transform group-hover:scale-110 transition-transform">
          {session.mode === 'break' ? '☕' : '⏱️'}
        </span>

        {/* Mini Live Status Indicator Dot */}
        <span
          className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#07090E] ${
            isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
          }`}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // MODE B: EXPANDED SLIM FLOATING CAPSULE (195px × 40px)
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div
      ref={overlayRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={e => {
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;
        if (hasMovedRef.current) return;
        soundManager.playClick();
        openFullModal();
      }}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        opacity: settings.opacity || 0.96,
        touchAction: 'none'
      }}
      className="w-[195px] sm:w-[230px] h-[40px] sm:h-[44px] rounded-full bg-[#07090E]/95 dark:bg-[#07090E]/95 backdrop-blur-2xl border border-white/20 shadow-[0_12px_32px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)] select-none cursor-grab active:cursor-grabbing flex flex-col justify-between overflow-hidden transition-all duration-150 animate-scale-in group"
      title="Drag to reposition • Tap to expand full timer"
      role="region"
      aria-label="Floating Focus Timer"
    >
      <div className="flex-1 flex items-center justify-between px-2.5">
        
        {/* Play / Pause Mini Control */}
        <button
          onClick={e => {
            e.stopPropagation();
            soundManager.playClick();
            if (session.status === 'running') {
              pauseTimer();
            } else {
              resumeTimer();
            }
          }}
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-90 ${
            isPaused
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
          }`}
          title={isPaused ? 'Resume' : 'Pause'}
          aria-label={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? (
            <Play className="w-3 h-3 fill-current translate-x-0.5" />
          ) : (
            <Pause className="w-3 h-3 fill-current" />
          )}
        </button>

        {/* Center: Live Monospace Time & Pulsing Dot */}
        <div className="flex items-center gap-1.5 px-1.5 pointer-events-none">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isPaused
                ? 'bg-amber-400'
                : session.mode === 'break'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-emerald-400 animate-pulse'
            }`}
          />
          <span className="text-sm sm:text-base font-black font-mono tracking-tight text-white drop-shadow-xs tabular-nums">
            {timeStr}
          </span>
        </div>

        {/* Right: Maximize & Collapse to Emoji Orb Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={e => {
              e.stopPropagation();
              soundManager.playClick();
              openFullModal();
            }}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Expand Full 3D Chamber"
            aria-label="Expand Full 3D Chamber"
          >
            <Maximize2 className="w-2.5 h-2.5" />
          </button>

          {/* Collapse to Emoji Bubble */}
          <button
            onClick={e => {
              e.stopPropagation();
              soundManager.playClick();
              setIsCollapsedToEmoji(true);
            }}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/10 hover:bg-amber-500/30 active:scale-90 text-white/80 hover:text-amber-300 flex items-center justify-center transition-all cursor-pointer"
            title="Collapse to Mini ⏱️ Emoji Bubble"
            aria-label="Collapse to Mini ⏱️ Emoji Bubble"
          >
            <Minus className="w-2.5 h-2.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Ultra-Thin Glowing Progress Bar */}
      <div className="w-full h-[2px] bg-white/10 overflow-hidden shrink-0">
        <div
          className={`h-full transition-all duration-300 ${
            session.mode === 'break'
              ? 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]'
              : 'bg-gradient-to-r from-emerald-400 to-teal-300 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progressPercent * 100))}%` }}
        />
      </div>
    </div>
  );
};