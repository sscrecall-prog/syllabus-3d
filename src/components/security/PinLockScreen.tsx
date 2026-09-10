import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Lock, Delete, AlertCircle, HelpCircle, Sparkles, Clock } from 'lucide-react';
import { usePinLock } from '../../context/PinLockContext';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';
import { ForgotPinModal } from './ForgotPinModal';

export const PinLockScreen: React.FC = () => {
  const { isLocked, config, unlockApp, cooldownRemaining } = usePinLock();
  const { profile } = useSyllabus();
  const { user } = useAuth();

  const [enteredPin, setEnteredPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const lastSubmittedPinRef = useRef<string>('');

  const pinLength = config.pinLength || 4;
  const isKeypadDisabled = cooldownRemaining > 0 || isChecking;

  const handleDigit = useCallback(
    (digit: string) => {
      if (isKeypadDisabled) return;
      soundManager.playClick();
      haptics.light();

      setEnteredPin(prev => {
        if (prev.length >= pinLength) return prev;
        const next = prev + digit;
        setErrorMessage(null);
        return next;
      });
    },
    [isKeypadDisabled, pinLength]
  );

  const handleBackspace = useCallback(() => {
    if (isKeypadDisabled) return;
    soundManager.playClick();
    haptics.light();
    setEnteredPin(prev => prev.slice(0, -1));
    setErrorMessage(null);
  }, [isKeypadDisabled]);

  const handleClear = useCallback(() => {
    if (isKeypadDisabled) return;
    soundManager.playClick();
    setEnteredPin('');
    setErrorMessage(null);
  }, [isKeypadDisabled]);

  // Physical Keyboard Listener
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isForgotModalOpen) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, isForgotModalOpen, handleDigit, handleBackspace, handleClear]);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reset last submitted pin when digits are altered
  useEffect(() => {
    if (enteredPin.length < pinLength) {
      lastSubmittedPinRef.current = '';
    }
  }, [enteredPin, pinLength]);

  // Auto-submit when all digits are entered
  useEffect(() => {
    if (
      enteredPin.length === pinLength &&
      !isChecking &&
      !isKeypadDisabled &&
      lastSubmittedPinRef.current !== enteredPin
    ) {
      lastSubmittedPinRef.current = enteredPin;

      const submitPin = async () => {
        setIsChecking(true);
        const result = await unlockApp(enteredPin);

        if (!isMountedRef.current) return;

        if (result.success) {
          setEnteredPin('');
          setErrorMessage(null);
          setIsChecking(false);
        } else {
          setIsShaking(true);
          setErrorMessage(result.error || 'Incorrect PIN');
          setTimeout(() => {
            if (isMountedRef.current) {
              setEnteredPin('');
              setIsShaking(false);
              setIsChecking(false);
            }
          }, 500);
        }
      };

      submitPin();
    }
  }, [enteredPin, pinLength, isChecking, isKeypadDisabled, unlockApp]);

  if (!isLocked) return null;

  const displayName = profile.name || user?.name || 'Aspirant';
  const avatarUrl = profile.avatarUrl || user?.avatarUrl;

  return (
    <>
      <div className="fixed inset-0 z-[99999] bg-[#070911]/95 dark:bg-[#070911]/98 backdrop-blur-3xl flex flex-col items-center justify-between p-4 sm:p-8 select-none text-white overflow-y-auto">
        
        {/* Background Ambient Glows */}
        <div className="fixed top-1/4 -left-20 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed bottom-1/4 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Branding */}
        <div className="w-full flex items-center justify-between max-w-sm pt-2 sm:pt-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/25">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black tracking-wider uppercase text-slate-200">
                Syllabus 3D
              </span>
              <span className="text-[10px] block font-mono text-cyan-400 font-bold">
                SAFETY LOCK
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-mono text-slate-300">
            <Lock className="w-3 h-3 text-cyan-400" />
            <span>Protected</span>
          </div>
        </div>

        {/* Center Module: User Avatar, Title, PIN Dots & Error */}
        <div className="flex flex-col items-center justify-center text-center max-w-xs w-full my-auto py-4">
          
          {/* User Avatar with Glowing Lock Ring */}
          <div className="relative mb-3 sm:mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-cyan-400/40 p-1 bg-white/5 shadow-[0_0_25px_rgba(34,211,238,0.25)] flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-600 to-cyan-600 flex items-center justify-center text-white font-black text-xl">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 border border-black/40 flex items-center justify-center text-white shadow-md">
              <Lock className="w-3 h-3" />
            </div>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Welcome back, {displayName}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
            Enter your {pinLength}-digit safety PIN to unlock your workspace.
          </p>

          {/* PIN Indicator Dots */}
          <div
            className={`flex items-center justify-center gap-3 sm:gap-4 my-5 sm:my-6 ${
              isShaking ? 'animate-pin-shake' : ''
            }`}
          >
            {Array.from({ length: pinLength }).map((_, idx) => {
              const isFilled = enteredPin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-200 ${
                    isFilled
                      ? 'bg-cyan-400 border border-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.8)] scale-110'
                      : 'bg-white/10 border border-white/20'
                  }`}
                />
              );
            })}
          </div>

          {/* Feedback & Error State */}
          <div className="h-7 flex items-center justify-center">
            {cooldownRemaining > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                <span>Locked for {cooldownRemaining}s</span>
              </div>
            ) : errorMessage ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{errorMessage}</span>
              </div>
            ) : isChecking ? (
              <span className="text-xs text-cyan-400 font-mono animate-pulse">Verifying PIN...</span>
            ) : (
              <span className="text-[11px] text-slate-500">Tap digits or use keyboard</span>
            )}
          </div>
        </div>

        {/* Numeric Keypad */}
        <div className="w-full max-w-[280px] sm:max-w-[300px] mb-2 sm:mb-6">
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                disabled={isKeypadDisabled}
                onClick={() => handleDigit(num.toString())}
                className="h-14 sm:h-16 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 text-xl sm:text-2xl font-mono font-bold text-white transition-all duration-150 flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs tap-bounce"
              >
                {num}
              </button>
            ))}

            {/* Bottom Row: Forgot PIN / 0 / Backspace */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setIsForgotModalOpen(true);
              }}
              className="h-14 sm:h-16 rounded-2xl bg-transparent hover:bg-white/[0.05] text-[11px] font-bold text-slate-400 hover:text-cyan-400 transition-colors flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 disabled:opacity-30"
              title="Recover Forgotten PIN"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400/80" />
              <span>Forgot?</span>
            </button>

            <button
              type="button"
              disabled={isKeypadDisabled}
              onClick={() => handleDigit('0')}
              className="h-14 sm:h-16 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 text-xl sm:text-2xl font-mono font-bold text-white transition-all duration-150 flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs tap-bounce"
            >
              0
            </button>

            <button
              type="button"
              disabled={isKeypadDisabled || enteredPin.length === 0}
              onClick={handleBackspace}
              className="h-14 sm:h-16 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-white transition-all duration-150 flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs tap-bounce"
              title="Delete Digit"
            >
              <Delete className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center pb-1">
          <p className="text-[11px] text-slate-500">
            Encrypted with Salted SHA-256 · Offline Secure
          </p>
        </div>
      </div>

      {/* Forgot PIN Recovery Modal */}
      <ForgotPinModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </>
  );
};
