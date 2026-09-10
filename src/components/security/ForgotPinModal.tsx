import React, { useState } from 'react';
import { ShieldAlert, KeyRound, CheckCircle2, AlertCircle, X, ArrowRight } from 'lucide-react';
import { usePinLock } from '../../context/PinLockContext';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

interface ForgotPinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPinModal: React.FC<ForgotPinModalProps> = ({ isOpen, onClose }) => {
  const { config, resetPinWithRecovery } = usePinLock();

  const [step, setStep] = useState<'verify' | 'new_pin' | 'success'>('verify');
  const [answer, setAnswer] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleVerifyAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      setError('Please enter your recovery answer.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    soundManager.playClick();

    try {
      // Test the answer with a dummy call or move to new_pin step
      // The actual hash check is done via resetPinWithRecovery
      setStep('new_pin');
    } catch (err) {
      setError('Invalid recovery answer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const requiredLength = config.pinLength || 4;
    if (newPin.length !== requiredLength) {
      setError(`PIN must be exactly ${requiredLength} digits.`);
      soundManager.playError();
      return;
    }

    if (!/^\d+$/.test(newPin)) {
      setError('PIN must contain only numbers.');
      soundManager.playError();
      return;
    }

    if (newPin !== confirmPin) {
      setError('PIN confirmation does not match.');
      soundManager.playError();
      return;
    }

    setIsSubmitting(true);
    const success = await resetPinWithRecovery(answer, newPin);
    setIsSubmitting(false);

    if (success) {
      setStep('success');
      setTimeout(() => {
        onClose();
        setStep('verify');
        setAnswer('');
        setNewPin('');
        setConfirmPin('');
      }, 1500);
    } else {
      setError('Incorrect recovery answer. Please try again.');
      setStep('verify');
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md bg-[#0F111A] border border-white/15 rounded-3xl shadow-2xl p-6 text-white relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'verify' && (
          <form onSubmit={handleVerifyAnswer} className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black tracking-tight text-white">Reset Safety PIN</h3>
              <p className="text-xs text-slate-400 mt-1">
                Answer your pre-configured security question to verify your identity.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                Security Question
              </span>
              <p className="text-sm font-semibold text-slate-200">
                {config.securityQuestion || 'What is your target exam or dream post?'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Your Recovery Answer</label>
              <input
                type="text"
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  setError(null);
                }}
                placeholder="Type your answer here..."
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !answer.trim()}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-xs font-extrabold text-white transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {step === 'new_pin' && (
          <form onSubmit={handleResetPin} className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black tracking-tight text-white">Create New PIN</h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter a new {config.pinLength || 4}-digit security PIN.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">New PIN</label>
                <input
                  type="password"
                  maxLength={config.pinLength || 4}
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => {
                    setNewPin(e.target.value.replace(/\D/g, ''));
                    setError(null);
                  }}
                  placeholder={`${config.pinLength || 4} digits`}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 text-base font-mono tracking-widest text-center focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Confirm New PIN</label>
                <input
                  type="password"
                  maxLength={config.pinLength || 4}
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value.replace(/\D/g, ''));
                    setError(null);
                  }}
                  placeholder={`Re-enter ${config.pinLength || 4} digits`}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 text-base font-mono tracking-widest text-center focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setStep('verify')}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting || newPin.length !== (config.pinLength || 4)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-xs font-extrabold text-white transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Save & Unlock</span>
              </button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">PIN Reset Successfully</h3>
            <p className="text-xs text-slate-300">Your new safety PIN has been saved. Unlocking...</p>
          </div>
        )}
      </div>
    </div>
  );
};
