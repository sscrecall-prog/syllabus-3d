import React, { useState } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { X, RotateCw, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RevisionSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedRevisionId?: string;
}

export const RevisionSessionModal: React.FC<RevisionSessionModalProps> = ({
  isOpen,
  onClose,
  preselectedRevisionId,
}) => {
  const { dueRevisions, completeRevisionCard, allTopics } = useSyllabus();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  if (!isOpen) return null;

  const activeQueue = dueRevisions.length > 0 ? dueRevisions : [];
  const currentRevision = activeQueue[currentIndex];

  const topicMatch = currentRevision
    ? allTopics.find(at => at.topic.id === currentRevision.topicId)
    : undefined;

  const handleGrade = (grade: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentRevision) return;

    completeRevisionCard(currentRevision.id, grade);
    setReviewedCount(prev => prev + 1);
    setIsFlipped(false);

    if (currentIndex + 1 < activeQueue.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionCompleted(true);
      confetti({ particleCount: 80, spread: 70 });
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setReviewedCount(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/70 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl overflow-hidden p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Spaced Revision Session
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {preselectedRevisionId ? 'Topic Review' : `${Math.min(currentIndex + 1, activeQueue.length)} of ${activeQueue.length} cards`}
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {sessionCompleted || activeQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mb-4 shadow-md">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
              Revision Complete!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
              {reviewedCount > 0
                ? `You have successfully revised ${reviewedCount} topic cards. Your next spaced interval has been scheduled.`
                : 'All your syllabus topics are up-to-date! No pending revisions due today.'}
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md transition-all"
            >
              Close Session
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div
              onClick={() => setIsFlipped(prev => !prev)}
              className="cursor-pointer relative min-h-[280px] rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all"
            >
              {!isFlipped ? (
                <div className="flex flex-col items-center justify-center text-center my-auto">
                  <span className="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold mb-3">
                    {currentRevision.subjectName} · {currentRevision.chapterName}
                  </span>

                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                    {currentRevision.topicName}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                    Recall the core formulas, solution methods, and past mistakes for this topic.
                  </p>

                  <span className="mt-6 text-[11px] font-semibold text-brand-500 animate-pulse">
                    Click to Flip & Reveal High-Yield Notes →
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">
                      High-Yield Core Notes
                    </span>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      {topicMatch?.topic.notes || 'No notes added yet. Use the topic drawer to add formulas & rules.'}
                    </p>
                  </div>

                  {topicMatch?.topic.mistakes && topicMatch.topic.mistakes.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                        Key Mistakes to Avoid
                      </span>
                      <div className="mt-1 space-y-1.5">
                        {topicMatch.topic.mistakes.slice(0, 2).map(m => (
                          <div key={m.id} className="text-xs text-slate-700 dark:text-slate-300 bg-rose-500/5 border border-rose-500/20 p-2 rounded-lg">
                            • {m.correctApproach}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <span className="block text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
                How well did you remember this topic?
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  onClick={() => handleGrade('again')}
                  className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-center transition-all"
                >
                  <span className="block text-xs font-bold">Again</span>
                  <span className="text-[10px] opacity-80">&lt;1 day</span>
                </button>

                <button
                  onClick={() => handleGrade('hard')}
                  className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-center transition-all"
                >
                  <span className="block text-xs font-bold">Hard</span>
                  <span className="text-[10px] opacity-80">3 days</span>
                </button>

                <button
                  onClick={() => handleGrade('good')}
                  className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-center transition-all"
                >
                  <span className="block text-xs font-bold">Good</span>
                  <span className="text-[10px] opacity-80">7 days</span>
                </button>

                <button
                  onClick={() => handleGrade('easy')}
                  className="p-3 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-600 dark:text-brand-400 text-center transition-all"
                >
                  <span className="block text-xs font-bold">Easy</span>
                  <span className="text-[10px] opacity-80">21 days</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
