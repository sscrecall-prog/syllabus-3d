import React, { useState } from 'react';
import { ShieldCheck, KeyRound, CheckCircle2, AlertCircle, X, HelpCircle } from 'lucide-react';
import { usePinLock } from '../../context/PinLockContext';
import { PinLength } from '../../types/pinLock';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

interface SetPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'enable' | 'change';
}

const DEFAULT_QUESTIONS = [
  'What is your target exam or dream post?',
  'What is your favorite academic subject?',
  'What was the name of your first school?',
  'What is your childhood nickname?'
];

export const SetPinModal: React.FC<SetPinModalProps> = ({
  isOpen,
  onClose,
  mode = 'enable'
}) => {
  const { config, enablePin, changePin } = usePinLock();

  const [pinLength, setPinLength] = useState<PinLength>(config.pinLength || 4);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [question, setQuestion] = useState(config.securityQuestion || DEFAULT_QUESTIONS[0]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If changing PIN, validate current PIN input length
    if (mode === 'change') {
      if (currentPin.length !== (config.pinLength || 4)) {
        setError(`Please enter your current ${config.pinLength || 4}-digit PIN.`);
        soundManager.playError();
        return;
      }
    }

    // Validate new PIN
    if (newPin.length !== pinLength) {
      setError(`New PIN must be exactly ${pinLength} digits.`);
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

    // If enabling, ensure security answer is provided
    const finalQuestion = question === 'custom' ? customQuestion.trim() : question;
    if (mode === 'enable') {
      if (!finalQuestion) {
        setError('Please select or type a security question.');
        soundManager.playError();
        return;
      }
      if (!answer.trim()) {
        setError('Please provide an answer for recovery.');
        soundManager.playError();
        return;
      }
    }

    setIsSubmitting(true);
    soundManager.playClick();

    try {
      if (mode === 'change') {
        const ok = await changePin(currentPin, newPin);
        if (!ok) {
          setError('Current PIN is incorrect. Could not change PIN.');
          setIsSubmitting(false);
          return;
        }
      } else {
        const ok = await enablePin(newPin, pinLength, finalQuestion, answer);
        if (!ok) {
          setError('Failed to enable PIN. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      setIsSuccess(true);
      haptics.success();
      soundManager.playSuccess();

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setAnswer('');
      }, 1400);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md bg-[#0F111A] border border-white/15 rounded-3xl shadow-2xl p-6 text-white relative overflow-hidden max-h-[90vh] overflow-y-auto">
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

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">
              {mode === 'change' ? 'PIN Changed Successfully' : 'Safety PIN Activated'}
            </h3>
            <p className="text-xs text-slate-300">
              Your study environment is now securely protected.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black tracking-tight text-white">
                {mode === 'change' ? 'Change Safety PIN' : 'Set Up Safety PIN'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {mode === 'change'
                  ? 'Verify your existing PIN and enter a new PIN below.'
                  : 'Lock your study schedule and notes with a secure PIN.'}
              </p>
            </div>

            {/* If Enabling: Choose 4-digit or 6-digit */}
            {mode === 'enable' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">PIN Length</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPinLength(4);
                      setNewPin('');
                      setConfirmPin('');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      pinLength === 4
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    4 Digits (Quick & Easy)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPinLength(6);
                      setNewPin('');
                      setConfirmPin('');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      pinLength === 6
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    6 Digits (Extra Secure)
                  </button>
                </div>
              </div>
            )}

            {/* Current PIN (If changing) */}
            {mode === 'change' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Current PIN</label>
                <input
                  type="password"
                  maxLength={config.pinLength || 4}
                  inputMode="numeric"
                  value={currentPin}
                  onChange={(e) => {
                    setCurrentPin(e.target.value.replace(/\D/g, ''));
                    setError(null);
                  }}
                  placeholder={`Enter current ${config.pinLength || 4} digits`}
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 text-center font-mono text-base tracking-widest focus:outline-none focus:border-cyan-400"
                />
              </div>
            )}

            {/* New PIN & Confirm PIN */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  {mode === 'change' ? 'New PIN' : 'Enter PIN'}
                </label>
                <input
                  type="password"
                  maxLength={pinLength}
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => {
                    setNewPin(e.target.value.replace(/\D/g, ''));
                    setError(null);
                  }}
                  placeholder={`${pinLength} digits`}
                  autoFocus={mode === 'enable'}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 text-center font-mono text-base tracking-widest focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Confirm PIN</label>
                <input
                  type="password"
                  maxLength={pinLength}
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value.replace(/\D/g, ''));
                    setError(null);
                  }}
                  placeholder={`Re-enter`}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 text-center font-mono text-base tracking-widest focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Security Recovery Question (Only on Enable) */}
            {mode === 'enable' && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Emergency Recovery Question</span>
                  </div>
                  <select
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    {DEFAULT_QUESTIONS.map((q) => (
                      <option key={q} value={q} className="bg-[#121320] text-white">
                        {q}
                      </option>
                    ))}
                    <option value="custom" className="bg-[#121320] text-white">
                      Custom question...
                    </option>
                  </select>
                </div>

                {question === 'custom' && (
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="Type your custom question..."
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Recovery Answer</label>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => {
                      setAnswer(e.target.value);
                      setError(null);
                    }}
                    placeholder="Secret answer (used if you ever forget your PIN)"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            )}

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
                disabled={isSubmitting || newPin.length !== pinLength}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-xs font-extrabold text-white transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{mode === 'change' ? 'Update PIN' : 'Activate PIN'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
