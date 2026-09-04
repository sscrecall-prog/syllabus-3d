import React, { useState, useEffect } from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const OfflineStatusIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnectedToast(true);
      haptics.success();
      const timer = setTimeout(() => setShowReconnectedToast(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnectedToast(false);
      haptics.warning();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline && !showReconnectedToast) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[90] animate-slide-down select-none pointer-events-none max-w-sm w-auto px-3">
      {isOffline ? (
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181A28]/95 dark:bg-[#12141F]/95 border border-amber-500/40 text-white shadow-xl backdrop-blur-md text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[11px] truncate">
            Offline Mode • Syllabus & Timers Active
          </span>
        </div>
      ) : (
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600/95 text-white shadow-xl backdrop-blur-md text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[11px]">
            Back Online • Local Storage Synced
          </span>
        </div>
      )}
    </div>
  );
};
