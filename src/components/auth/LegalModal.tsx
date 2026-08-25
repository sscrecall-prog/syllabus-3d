import React from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';

interface LegalModalProps {
  type: 'terms' | 'privacy' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const isTerms = type === 'terms';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            {isTerms ? <FileText className="w-5 h-5 text-brand-500" /> : <ShieldCheck className="w-5 h-5 text-emerald-500" />}
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {isTerms ? 'Terms of Service' : 'Privacy Policy'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed text-left">
          {isTerms ? (
            <>
              <p>Welcome to <strong>SYLLABUS 3D</strong>. By creating an account or using our platform, you agree to these terms.</p>
              <h4 className="font-bold text-slate-900 dark:text-white">1. Use of Service</h4>
              <p>SYLLABUS 3D provides syllabus tracking, spaced repetition revision, and study timer tools for competitive exam preparation. You agree to use the platform for educational purposes.</p>
              <h4 className="font-bold text-slate-900 dark:text-white">2. Account Responsibility</h4>
              <p>You are responsible for maintaining the confidentiality of your account credentials and ensuring your study records remain accurate.</p>
              <h4 className="font-bold text-slate-900 dark:text-white">3. Offline Storage</h4>
              <p>Your local study data is securely preserved on your device via Progressive Web App storage and synchronized when online.</p>
            </>
          ) : (
            <>
              <p>Your privacy is important to us. This policy outlines how <strong>SYLLABUS 3D</strong> handles your preparation data.</p>
              <h4 className="font-bold text-slate-900 dark:text-white">1. Data Collected</h4>
              <p>We only store your account information (name and email) and your study activity (progress percentage, streak, notes, and revision queues).</p>
              <h4 className="font-bold text-slate-900 dark:text-white">2. Data Ownership</h4>
              <p>You own 100% of your notes and study records. You can export or delete your dataset at any time via the Settings panel.</p>
              <h4 className="font-bold text-slate-900 dark:text-white">3. Security</h4>
              <p>We do not sell your personal data or share your study patterns with unauthorized third parties.</p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
