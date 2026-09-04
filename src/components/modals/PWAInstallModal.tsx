import React from 'react';
import { X, Smartphone, Laptop, CheckCircle2, Download, Share2, PlusSquare } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import { haptics } from '../../utils/haptics';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, triggerInstall } = usePWA();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      haptics.medium();
      await triggerInstall();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none overflow-hidden"
      onClick={() => {
        haptics.light();
        onClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200/80 dark:border-slate-800 shadow-2xl p-5 sm:p-6 overflow-hidden overscroll-contain animate-slide-up sm:animate-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile iOS Drag Grab Handle */}
        <div className="sm:hidden -mt-1 pb-3 flex items-center justify-center">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 active:scale-95 transition-transform" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SYLLABUS 3D" className="w-10 h-10 object-contain drop-shadow-md" />
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Install SYLLABUS 3D App
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% Offline & Native Full-Screen App
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              haptics.light();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 tap-bounce touch-target-min flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits Grid */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-white">Works 100% Offline</h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Access syllabus, flashcards & focus timer without internet.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-white">Native Home Screen Icon</h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Launches instantly like a native Android or iOS app.</p>
            </div>
          </div>
        </div>

        {/* Dynamic Action Button or iOS Guidance */}
        {isInstallable ? (
          <button
            onClick={handleInstallClick}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30 cursor-pointer active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Install App on this Device</span>
          </button>
        ) : (
          <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs space-y-2 text-slate-700 dark:text-slate-300">
            <span className="font-bold flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
              <Share2 className="w-4 h-4" />
              <span>For iPhone / Safari & Browser users:</span>
            </span>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
              <li>Tap the <span className="font-bold text-slate-800 dark:text-slate-200">Share button ( <Share2 className="inline w-3 h-3" /> )</span> in your browser.</li>
              <li>Scroll down and select <span className="font-bold text-slate-800 dark:text-slate-200">"Add to Home Screen" ( <PlusSquare className="inline w-3 h-3" /> )</span>.</li>
              <li>Tap <span className="font-bold text-slate-800 dark:text-slate-200">Add</span>. SYLLABUS 3D will appear on your phone screen!</li>
            </ol>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};
