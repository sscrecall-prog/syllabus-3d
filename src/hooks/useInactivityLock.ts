import { useEffect, useRef } from 'react';
import { usePinLock } from '../context/PinLockContext';

/**
 * Hook to automatically lock the app on user inactivity or tab switching
 */
export const useInactivityLock = () => {
  const { config, isLocked, isConfigured, lockApp } = usePinLock();
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isConfigured || isLocked) return;

    // Reset activity timestamp on user interaction
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll'
    ];

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check inactivity periodically
    const timeoutMinutes = config.autoLockTimeout;
    const intervalMs = 5000; // Check every 5s

    const interval = setInterval(() => {
      if (timeoutMinutes <= 0) return; // <=0 means disabled via timeout

      const idleDurationMs = Date.now() - lastActivityRef.current;
      const thresholdMs = timeoutMinutes * 60 * 1000;

      if (idleDurationMs >= thresholdMs) {
        lockApp();
      }
    }, intervalMs);

    // Tab visibility change listener (Lock immediately on tab blur if enabled)
    const handleVisibilityChange = () => {
      if (config.lockOnTabSwitch && document.visibilityState === 'hidden') {
        lockApp();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [config.autoLockTimeout, config.lockOnTabSwitch, isConfigured, isLocked, lockApp]);
};
