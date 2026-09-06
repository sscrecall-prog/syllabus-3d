import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSyllabus } from '../../context/SyllabusContext';
import { X, RotateCw, Trophy, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';
import { Topic } from '../../types/syllabus';

interface RevisionSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTopic?: (topic: Topic, subjectName: string, chapterName: string) => void;
}

export const RevisionSessionModal: React.FC<RevisionSessionModalProps> = ({
  isOpen,
  onClose,
  onOpenTopic
}) => {
  const { dueRevisions, completeRevisionCard, allTopics } = useSyllabus();

  const [sessionQueue] = useState(() => [...dueRevisions]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  if (!isOpen) return null;

  const activeQueue = sessionQueue.length > 0 ? sessionQueue : [];
  const currentRevision = activeQueue[currentIndex];

  const topicMatch = currentRevision
    ? allTopics.find(at => at.topic.id === currentRevision.topicId)
    : undefined;

  const handleOpenTopic = () => {
    soundManager.playClick();
    haptics.medium();
    if (onOpenTopic && currentRevision) {
      const targetTopic = topicMatch?.topic || ({
        id: currentRevision.topicId,
        name: currentRevision.topicName,
        status: 'in_progress',
        completedSubtopics: 0,
        totalSubtopics: 0
      } as unknown as Topic);

      onOpenTopic(
        targetTopic,
        topicMatch?.subjectName || currentRevision.subjectName,
        topicMatch?.chapterName || currentRevision.chapterName
      );
    }
  };

  const handleGrade = (grade: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentRevision) return;

    completeRevisionCard(currentRevision.id, grade);
    setReviewedCount(prev => prev + 1);

    if (currentIndex + 1 < activeQueue.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionCompleted(true);
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSessionCompleted(false);
    setReviewedCount(0);
    onClose();
  };

  const progressPercent = activeQueue.length > 0
    ? Math.round(((currentIndex) / activeQueue.length) * 100)
    : 100;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={handleReset}
    >
      <div
        className="relative w-full max-w-xl rounded-3xl bg-[#FAF8F5] dark:bg-[#18181D] border border-[#EBD3A0] dark:border-[#272730] shadow-2xl overflow-hidden p-6 sm:p-8 my-auto"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header with Progress Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-black text-[#171717] dark:text-[#F5F5F7]">
                Spaced Revision Flashcards
              </h4>
              <p className="text-[11px] text-[#6B7280] font-semibold">
                {activeQueue.length > 0 ? `Card ${currentIndex + 1} of ${activeQueue.length}` : 'No cards due'}
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl text-[#6B7280] hover:text-rose-500 hover:bg-[#F5E6C8]/40 dark:hover:bg-[#282828] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shimmering Gold Progress Track */}
        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#23232A] mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#D4AF37] via-[#F5E6C8] to-[#B89327] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {sessionCompleted || activeQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-xl">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-[#171717] dark:text-[#F5F5F7]">
                Revision Session Complete!
              </h3>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                {reviewedCount > 0
                  ? `Awesome! You mastered ${reviewedCount} topic cards today. Next spaced repetition intervals have been calculated.`
                  : 'All your syllabus topics are up-to-date! No pending revisions due today.'}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-2xl bg-[#D4AF37] text-[#171717] text-xs font-black shadow-md shadow-[#D4AF37]/30 hover:scale-105 transition-all cursor-pointer"
            >
              Close Session
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* DIRECT TOPIC CARD (CLICK TO OPEN FULL TOPIC SECTION) */}
            <div
              onClick={handleOpenTopic}
              className="w-full min-h-[260px] p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#1E1F29] border-2 border-[#EBD3A0] dark:border-[#2D2E3D] hover:border-[#D4AF37] dark:hover:border-[#D4AF37] shadow-xl hover:shadow-2xl flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] group select-none relative overflow-hidden"
              title="Click to open full topic section"
            >
              {/* Top ambient glow accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-75 group-hover:opacity-100 transition-opacity" />

              {/* Subject Badge & Stage */}
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="px-3 py-1 rounded-full bg-[#D4AF37]/15 text-[#8C6D15] dark:text-[#D4AF37] border border-[#D4AF37]/25 font-black uppercase tracking-wider text-[11px]">
                  {currentRevision.subjectName}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#11120F]/5 dark:bg-white/10 text-[#6B7280] dark:text-[#A1A1AA] text-[11px] font-mono font-bold">
                  Stage {currentRevision.stage}
                </span>
              </div>

              {/* Topic & Chapter Center Content */}
              <div className="text-center space-y-2.5 py-4">
                <span className="text-[11px] font-mono font-black text-[#6B7280] dark:text-[#8E90A6] uppercase tracking-widest block">
                  Topic to Recall
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#171717] dark:text-[#F5F5F7] group-hover:text-[#D4AF37] transition-colors leading-tight">
                  {currentRevision.topicName}
                </h3>
                <p className="text-xs font-medium text-[#6B7280] dark:text-[#8E90A6]">
                  Chapter: <span className="font-semibold text-[#171717] dark:text-[#CBD5E1]">{currentRevision.chapterName}</span>
                </p>
              </div>

              {/* Action Prompt Pill (Clear Open Indicator) */}
              <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#14151D] border border-[#EBD3A0]/80 dark:border-[#2D2E3D] group-hover:border-[#D4AF37] text-xs font-bold text-[#8C6D15] dark:text-[#D4AF37] shadow-2xs group-hover:bg-[#D4AF37]/10 transition-all">
                <BookOpen className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="font-extrabold text-[12px]">Tap or Click to Open Full Topic Section (Notes & Formulas)</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37] transition-transform group-hover:translate-x-1 shrink-0" />
              </div>
            </div>

            {/* GRADING ACTION BUTTONS */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#6B7280] block text-center">
                Rate Recall Quality (Updates Next Interval):
              </span>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleGrade('again')}
                  className="py-2.5 px-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  Again (1d)
                </button>
                <button
                  onClick={() => handleGrade('hard')}
                  className="py-2.5 px-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  Hard (3d)
                </button>
                <button
                  onClick={() => handleGrade('good')}
                  className="py-2.5 px-2 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  Good (7d)
                </button>
                <button
                  onClick={() => handleGrade('easy')}
                  className="py-2.5 px-2 rounded-2xl bg-[#D4AF37] hover:bg-[#B89327] text-[#171717] text-xs font-black shadow-md shadow-[#D4AF37]/30 transition-all cursor-pointer"
                >
                  Easy (14d) ★
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

