import React from 'react';
import { useTimer } from '../../context/TimerContext';
import { Shield, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

export const FloatingTimerPermissionModal: React.FC = () => {
  const {
    isPermissionModalOpen,
    closePermissionModal,
    updateSettings,
    requestPictureInPicture
  } = useTimer();

  if (!isPermissionModalOpen) return null;

  const handleAllow = async () => {
    soundManager.playClick();
    updateSettings({ enabled: true });

    if (window.AndroidFloatingTimer && window.AndroidFloatingTimer.requestOverlayPermission) {
      window.AndroidFloatingTimer.requestOverlayPermission();
    } else {
      // On Web, try requesting PiP or notification permission if available
      if ('Notification' in window && Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch (e) {}
      }
      await requestPictureInPicture();
    }

    closePermissionModal();
  };

  const handleNotNow = () => {
    soundManager.playClick();
    closePermissionModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0F172A] border border-white/15 p-6 shadow-2xl flex flex-col items-center text-center animate-scale-in">
        <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center mb-4 shadow-lg">
          <Shield className="w-7 h-7 stroke-[2.2]" />
        </div>

        <h3 className="text-lg font-bold text-white font-serif tracking-tight">
          Floating Timer
        </h3>

        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          Keep your focus timer visible while using other apps or navigating your device.
        </p>

        <div className="w-full space-y-2 mt-6">
          <button
            onClick={handleAllow}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Allow Floating Timer</span>
          </button>

          <button
            onClick={handleNotNow}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold active:scale-98 transition-all cursor-pointer"
          >
            Not Now
          </button>
        </div>

        <p className="text-[10px] text-slate-500 mt-3">
          You can adjust this anytime in Settings &rarr; Floating Timer.
        </p>
      </div>
    </div>
  );
};