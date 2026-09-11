import React, { useState, useEffect } from 'react';
import {
  Share2,
  ShieldCheck,
  Mail,
  Heart,
  Copy,
  Check,
  ExternalLink,
  X,
  Send,
  MessageCircle,
  ArrowUp,
  Lock,
  Database,
  EyeOff,
  Sparkles,
  Award,
  HelpCircle,
  Compass
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

interface AppFooterProps {
  onNavigate?: (view: any) => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({ onNavigate }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Feedback form state
  const [feedbackCategory, setFeedbackCategory] = useState<'feedback' | 'bug' | 'syllabus' | 'feature'>('feedback');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);

  const appUrl = 'https://syllabus-3d.vercel.app';
  const shareTitle = 'Syllabus 3D — Master Your Competitive Exam Syllabus';
  const shareText = 'Check out Syllabus 3D — the high-performance spaced revision tracker, 3D focus chamber, and complete syllabus management platform for aspirants!';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setHasCopied(true);
    soundManager.playCompleteChime();
    setTimeout(() => setHasCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: appUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      setIsShareModalOpen(true);
    }
  };

  const handleScrollToTop = () => {
    soundManager.playClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;
    soundManager.playCompleteChime();
    setIsFeedbackSubmitted(true);
    setTimeout(() => {
      setIsFeedbackSubmitted(false);
      setFeedbackMessage('');
      setIsContactModalOpen(false);
    }, 2200);
  };

  // Escape key handler for footer modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsShareModalOpen(false);
        setIsPrivacyModalOpen(false);
        setIsContactModalOpen(false);
      }
    };
    if (isShareModalOpen || isPrivacyModalOpen || isContactModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isShareModalOpen, isPrivacyModalOpen, isContactModalOpen]);

  return (
    <>
      <footer className="mt-8 pt-6 pb-6 border-t border-slate-200/80 dark:border-white/[0.08] print:hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          
          {/* Left: Brand Identity & Offline / Cloud Status */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
            <div className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-white/10 p-1 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="Syllabus 3D" className="w-full h-full object-contain" />
            </div>
            <span className="font-black text-slate-900 dark:text-white tracking-tight">SYLLABUS 3D</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2563EB]/10 dark:bg-[#7AA2F7]/15 text-[#2563EB] dark:text-[#93C5FD] border border-[#2563EB]/20 dark:border-[#7AA2F7]/30">
              v2.4 PRO
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Offline Ready • Cloud Synced</span>
            </span>
          </div>

          {/* Right: Quick Action Modals & Top Button */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                handleNativeShare();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-[#1A1C2C] hover:bg-slate-200 dark:hover:bg-[#25283C] text-slate-700 dark:text-[#CBD5E1] border border-slate-200/70 dark:border-white/[0.06] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Share Syllabus 3D"
            >
              <Share2 className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#7AA2F7]" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setIsPrivacyModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-[#1A1C2C] hover:bg-slate-200 dark:hover:bg-[#25283C] text-slate-700 dark:text-[#CBD5E1] border border-slate-200/70 dark:border-white/[0.06] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Privacy Policy"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Privacy</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setIsContactModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-[#1A1C2C] hover:bg-slate-200 dark:hover:bg-[#25283C] text-slate-700 dark:text-[#CBD5E1] border border-slate-200/70 dark:border-white/[0.06] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Send Feedback / Suggest Syllabus"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Feedback</span>
            </button>

            <button
              type="button"
              onClick={handleScrollToTop}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-[#1A1C2C] hover:bg-slate-200 dark:hover:bg-[#25283C] text-slate-700 dark:text-[#CBD5E1] border border-slate-200/70 dark:border-white/[0.06] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Scroll back to top"
            >
              <span>Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </footer>

      {/* 1. SHARE APP MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#151620] border border-[#E2E8F0] dark:border-[#272730] shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#2563EB]/15 dark:bg-[#7AA2F7]/15 text-[#2563EB] dark:text-[#7AA2F7] flex items-center justify-center font-bold">
                  <Share2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 id="share-modal-title" className="text-base font-black text-[#11120F] dark:text-[#F5F5F7]">Share Syllabus 3D</h3>
                  <p className="text-xs text-[#85877E]">Help fellow study partners stay disciplined</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#85877E] cursor-pointer"
                aria-label="Close share dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Share Links (WhatsApp, Telegram, Twitter) */}
            <div className="grid grid-cols-3 gap-2.5">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + appUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundManager.playClick()}
                className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                <MessageCircle className="w-5 h-5" />
                <span>WhatsApp</span>
              </a>

              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundManager.playClick()}
                className="p-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                <Send className="w-5 h-5" />
                <span>Telegram</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(appUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundManager.playClick()}
                className="p-3 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>X / Twitter</span>
              </a>
            </div>

            {/* Copy Link Input Bar */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#65675F] dark:text-[#A1A1AA] uppercase tracking-wider block">
                Copy App Link
              </label>
              <div className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl bg-[#F8FAFC] dark:bg-[#1B1C28] border border-[#E2E8F0] dark:border-[#2A2C3E]">
                <span className="text-xs font-mono text-[#11120F] dark:text-[#F5F5F7] truncate flex-1">
                  {appUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 ${
                    hasCopied
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-[#2563EB] dark:bg-[#7AA2F7] text-white dark:text-black hover:opacity-90'
                  }`}
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRIVACY POLICY MODAL */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="privacy-modal-title">
          <div className="relative w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#151620] border border-[#E2E8F0] dark:border-[#272730] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EEEEE8] dark:border-[#242533]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 stroke-[2.4]" />
                </div>
                <div>
                  <h3 id="privacy-modal-title" className="text-base font-black text-[#11120F] dark:text-[#F5F5F7]">Privacy & Data Policy</h3>
                  <p className="text-xs text-[#85877E]">Student First • Zero Surveillance Promise</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#85877E] cursor-pointer"
                aria-label="Close privacy policy dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Privacy Commitments */}
            <div className="space-y-4 text-xs leading-relaxed text-[#353733] dark:text-[#CBD5E1]">
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#1B1C28] border border-[#E2E8F0] dark:border-[#2A2C3E] space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#11120F] dark:text-white">
                  <Database className="w-4 h-4 text-[#2563EB] dark:text-[#7AA2F7]" />
                  <span>1. Local-First Client Storage</span>
                </div>
                <p className="text-[#65675F] dark:text-[#94A3B8]">
                  All your study plans, marks, notes, flashcards, and timer records are stored directly inside your browser's local sandbox and IndexedDB. We do not sell or monetize your study behavior.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#1B1C28] border border-[#E2E8F0] dark:border-[#2A2C3E] space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#11120F] dark:text-white">
                  <EyeOff className="w-4 h-4 text-emerald-500" />
                  <span>2. Zero Third-Party Advertising</span>
                </div>
                <p className="text-[#65675F] dark:text-[#94A3B8]">
                  Syllabus 3D contains absolutely zero advertisement SDKs, marketing telemetry, or tracking pixels. Your concentration is the priority.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#1B1C28] border border-[#E2E8F0] dark:border-[#2A2C3E] space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#11120F] dark:text-white">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>3. Complete Data Ownership & Portability</span>
                </div>
                <p className="text-[#65675F] dark:text-[#94A3B8]">
                  You own 100% of your data. You can export a full JSON snapshot of your syllabus progress from Settings anytime and migrate it to any device.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#11120F] dark:bg-white text-white dark:text-black font-bold text-xs cursor-pointer active:scale-95 transition-all"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. CONTACT US / FEEDBACK MODAL */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
          <div className="relative w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#151620] border border-[#E2E8F0] dark:border-[#272730] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EEEEE8] dark:border-[#242533]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5 stroke-[2.4]" />
                </div>
                <div>
                  <h3 id="contact-modal-title" className="text-base font-black text-[#11120F] dark:text-[#F5F5F7]">Contact Us & Feedback</h3>
                  <p className="text-xs text-[#85877E]">Direct line to the developer & support team</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#85877E] cursor-pointer"
                aria-label="Close contact dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isFeedbackSubmitted ? (
              <div className="py-8 text-center space-y-2 animate-fade-in">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-sm font-black text-[#11120F] dark:text-white">Message Received!</h4>
                <p className="text-xs text-[#85877E]">Thank you for helping improve Syllabus 3D for all aspirants.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                {/* Category Pills */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#65675F] dark:text-[#A1A1AA] uppercase tracking-wider block">
                    Message Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'feedback', label: '💡 Suggestion' },
                      { id: 'bug', label: '🐛 Bug Report' },
                      { id: 'syllabus', label: '📚 Syllabus' },
                      { id: 'feature', label: '⚡ New Feature' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFeedbackCategory(cat.id as any)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          feedbackCategory === cat.id
                            ? 'bg-[#2563EB]/15 dark:bg-[#7AA2F7]/20 text-[#2563EB] dark:text-[#7AA2F7] border-[#2563EB]/30 dark:border-[#7AA2F7]/40 shadow-xs'
                            : 'bg-[#F8FAFC] dark:bg-[#1B1C28] text-[#65675F] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#2A2C3E]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#65675F] dark:text-[#A1A1AA] uppercase tracking-wider block">
                    Your Message / Request
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={feedbackMessage}
                    onChange={e => setFeedbackMessage(e.target.value)}
                    placeholder="Share your suggestion, requested topic, or report an issue..."
                    className="w-full p-3 rounded-2xl bg-[#F8FAFC] dark:bg-[#1B1C28] border border-[#E2E8F0] dark:border-[#2A2C3E] text-xs font-medium text-[#11120F] dark:text-white placeholder-[#85877E] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#7AA2F7]"
                  />
                </div>

                {/* Email Direct Fallback */}
                <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#1B1C28] border border-[#E2E8F0] dark:border-[#2A2C3E] flex items-center justify-between text-xs">
                  <span className="text-[#85877E]">Direct Email:</span>
                  <a
                    href="mailto:support@syllabus3d.app?subject=Syllabus%203D%20Inquiry"
                    className="font-bold text-[#2563EB] dark:text-[#7AA2F7] hover:underline flex items-center gap-1"
                  >
                    <span>support@syllabus3d.app</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#EEEEE8] dark:bg-[#282938] text-[#65675F] dark:text-[#CBD5E1] text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#11120F] dark:bg-white text-white dark:text-black hover:bg-[#2563EB] dark:hover:bg-[#6090F5] text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
