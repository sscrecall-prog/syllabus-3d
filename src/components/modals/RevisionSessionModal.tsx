import React, { useState } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { X, RotateCw, Trophy, ArrowRight, Check, RefreshCcw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../../utils/soundEffects';

interface RevisionSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RevisionSessionModal: React.FC<RevisionSessionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { dueRevisions, completeRevisionCard, allTopics } = useSyllabus();

  const [sessionQueue] = useState(() => [...dueRevisions]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  if (!isOpen) return null;

  const activeQueue = sessionQueue.length > 0 ? sessionQueue : [];
  const currentRevision = activeQueue[currentIndex];

  const topicMatch = currentRevision
    ? allTopics.find(at => at.topic.id === currentRevision.topicId)
    : undefined;

  const handleFlipCard = () => {
    setIsFlipped(prev => !prev);
    soundManager.playClick();
  };

  const handleGrade = (grade: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentRevision) return;

    completeRevisionCard(currentRevision.id, grade);
    setReviewedCount(prev => prev + 1);
    setIsFlipped(false);

    if (currentIndex + 1 < activeQueue.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionCompleted(true);
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setReviewedCount(0);
    onClose();
  };

  const progressPercent = activeQueue.length > 0
    ? Math.round(((currentIndex) / activeQueue.length) * 100)
    : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#FAF8F5] dark:bg-[#18181D] border border-[#EBD3A0] dark:border-[#272730] shadow-2xl overflow-hidden p-6 sm:p-8">
        
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
              <p className="text-[10px] text-[#6B7280] font-semibold">
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
            {/* 3D PERSPECTIVE FLIP CARD CONTAINER */}
            <div
              onClick={handleFlipCard}
              className="w-full h-72 cursor-pointer perspective-1000 select-none"
            >
              <div
                className={`w-full h-full relative transition-transform duration-500 rounded-3xl preserve-3d ${
                  isFlipped ? '[transform:rotateY(180deg)]' : ''
                }`}
              >
                {/* FRONT FACE (Question / Topic Name) */}
                <div className="absolute inset-0 w-full h-full p-6 rounded-3xl bg-white dark:bg-[#202020] border-2 border-[#EBD3A0] dark:border-[#272730] hover:border-[#D4AF37] shadow-xl flex flex-col justify-between [backface-visibility:hidden]">
                  <div className="flex items-center justify-between text-xs font-bold text-[#6B7280]">
                    <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/15 text-[#8C6D15] dark:text-[#D4AF37]">
                      {currentRevision.subjectName}
                    </span>
                    <span>Stage {currentRevision.stage}</span>
                  </div>

                  <div className="text-center space-y-2 py-4">
                    <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                      Topic to Recall:
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-[#171717] dark:text-[#F5F5F7]">
                      {currentRevision.topicName}
                    </h3>
                    <p className="text-xs text-[#6B7280]">
                      Chapter: {currentRevision.chapterName}
                    </p>
                  </div>

                  <div className="text-center text-[11px] font-bold text-[#D4AF37] flex items-center justify-center gap-1.5">
                    <RefreshCcw className="w-3.5 h-3.5" />
                    <span>Tap or Click anywhere to Flip & Reveal Formula / Notes</span>
                  </div>
                </div>

                {/* BACK FACE (Answer / Formulas & Key Rules) */}
                <div className="absolute inset-0 w-full h-full p-6 rounded-3xl bg-gradient-to-b from-white to-[#FAF8F5] dark:from-[#222222] dark:to-[#171717] border-2 border-[#D4AF37] shadow-2xl flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-y-auto">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#D4AF37] font-black">Key Concepts & Notes</span>
                    <span className="text-[11px] text-[#6B7280]">Tap to Flip Back</span>
                  </div>

                  <div className="py-2 text-left space-y-2">
                    {topicMatch?.topic.notes ? (
                      <p className="text-xs font-medium text-[#171717] dark:text-[#F5F5F7] whitespace-pre-line leading-relaxed">
                        {topicMatch.topic.notes}
                      </p>
                    ) : (
                      <div className="text-center py-6 text-xs text-[#6B7280]">
                        <p>No special notes saved yet.</p>
                        <p className="text-[11px] text-[#D4AF37] mt-1">Review subtopics: {topicMatch?.topic.subtopics?.join(', ') || 'Core concepts'}</p>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] font-bold text-[#6B7280] text-center border-t border-[#EBD3A0]/60 dark:border-[#2E2E2E] pt-2">
                    How well did you recall this topic?
                  </div>
                </div>
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
    </div>
  );
};
