import React, { useState, useEffect } from 'react';
import { usePWA } from '../../hooks/usePWA';
import { haptics } from '../../utils/haptics';
import { soundManager } from '../../utils/soundEffects';
import {
  Download,
  X,
  Sparkles,
  Share,
  PlusSquare,
  CheckCircle2,
  Smartphone
} from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, triggerInstall } = usePWA();
  const [isDismissed, setIsDismissed] = useState(true);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Detect iOS Safari
  const isIOS = typeof window !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;

  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );

  useEffect(() => {
    // If already installed or running standalone, do not show
    if (isInstalled || isStandalone) {
      setIsDismissed(true);
      return;
    }

    try {
      const dismissedUntil = localStorage.getItem('syllabus3d_pwa_dismissed_until');
      if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
        setIsDismissed(true);
        return;
      }
    } catch {}

    // Show if installable on Android/Chrome OR if user is on iOS Safari (not standalone)
    if (isInstallable || isIOS) {
      // Slight delay so it doesn't pop aggressively on immediate load
      const timer = setTimeout(() => setIsDismissed(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, isStandalone, isIOS]);

  const handleDismiss = () => {
    soundManager.playClick();
    haptics.light();
    setIsDismissed(true);
    try {
      // Dismiss for 7 days
      localStorage.setItem('syllabus3d_pwa_dismissed_until', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    } catch {}
  };

  const handleInstallClick = async () => {
    soundManager.playClick();
    haptics.medium();

    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (isInstallable) {
      const installed = await triggerInstall();
      if (installed) {
        haptics.success();
        setIsDismissed(true);
      }
    }
  };

  if (isDismissed || isInstalled || isStandalone) return null;

  return (
    <>
      {/* Floating Mobile/Desktop PWA Banner */}
      <div className="fixed bottom-20 md:bottom-5 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-sm z-40 animate-slide-up select-none pointer-events-none">
        <div className="pointer-events-auto p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-[#151724]/95 backdrop-blur-md border border-[#2563EB]/30 dark:border-[#7AA2F7]/30 shadow-2xl flex items-center justify-between gap-3 text-[#11120F] dark:text-white relative overflow-hidden">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-[#2563EB]/20 to-[#7AA2F7]/20 rounded-full blur-xl pointer-events-none" />

          {/* App Icon + Text */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] dark:from-[#7AA2F7] dark:to-[#5B82D7] p-0.5 shadow-sm shrink-0 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Syllabus 3D"
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  // Fallback to icon if logo not found
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs sm:text-[13px] font-black truncate">
                  Install Syllabus 3D
                </h4>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  App
                </span>
              </div>
              <p className="text-[11px] text-[#65675F] dark:text-[#94A3B8] truncate">
                100% Offline • Fullscreen • Fast
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] dark:from-[#7AA2F7] dark:to-[#5B8BF5] text-white dark:text-[#0B0B0D] text-xs font-black shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>

            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#85877E] hover:text-[#11120F] dark:hover:text-white transition-colors cursor-pointer"
              title="Dismiss for 7 days"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#181A28] border border-[#E2E8F0] dark:border-[#282C40] p-5 space-y-4 shadow-2xl animate-scale-up text-[#11120F] dark:text-[#F8FAFC]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#222638] pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#2563EB] dark:text-[#7AA2F7]" />
                <h3 className="text-sm font-black">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-[#85877E] hover:text-[#11120F] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#65675F] dark:text-[#94A3B8]">
              <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#12141F] border border-[#E2E8F0] dark:border-[#282C40]">
                <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0 font-bold font-mono">
                  1
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-[#11120F] dark:text-white">Tap the Share button</p>
                  <p className="text-[11px]">In Safari's bottom toolbar, tap the <Share className="w-3.5 h-3.5 inline text-blue-500" /> Share icon.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#12141F] border border-[#E2E8F0] dark:border-[#282C40]">
                <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0 font-bold font-mono">
                  2
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-[#11120F] dark:text-white">Select 'Add to Home Screen'</p>
                  <p className="text-[11px]">Scroll down the list and tap <PlusSquare className="w-3.5 h-3.5 inline text-blue-500" /> Add to Home Screen.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#12141F] border border-[#E2E8F0] dark:border-[#282C40]">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 font-bold font-mono">
                  3
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-[#11120F] dark:text-white">Tap 'Add'</p>
                  <p className="text-[11px]">Syllabus 3D will appear as a standalone app on your home screen!</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-2xl bg-[#2563EB] dark:bg-[#7AA2F7] hover:bg-[#1D4ED8] dark:hover:bg-[#6090F5] text-white dark:text-[#0B0B0D] font-black text-xs shadow-sm cursor-pointer active:scale-95 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
