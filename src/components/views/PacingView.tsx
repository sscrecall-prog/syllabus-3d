import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Printer
} from 'lucide-react';
import { useSyllabus } from '../../context/SyllabusContext';
import { SyllabusPacingCard } from '../dashboard/SyllabusPacingCard';
import { EditExamTargetModal } from '../modals/EditExamTargetModal';
import { AppView } from '../layout/Sidebar';
import { soundManager } from '../../utils/soundEffects';

interface PacingViewProps {
  onNavigate: (view: AppView) => void;
  onNavigateToSubject?: (subjectId: string) => void;
}

export const PacingView: React.FC<PacingViewProps> = ({
  onNavigate
}) => {
  const { currentExam, overallStats } = useSyllabus();
  const [isEditExamModalOpen, setIsEditExamModalOpen] = useState(false);

  const examName = currentExam?.name || 'Target Exam';
  const examDate = currentExam?.examDate || '2026-10-15';

  const formattedExamDate = (() => {
    try {
      const d = new Date(examDate);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return examDate;
    }
  })();

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 sm:pb-16 font-sans max-w-5xl mx-auto px-1 sm:px-0">
      
      {/* 🖨️ PRINT-ONLY DESK REVISION SUMMARY HEADER */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-black">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-700 block">
              SYLLABUS PACING & FINISH-LINE FORECAST CHEATSHEET
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight text-black mt-1">
              🎯 {examName.toUpperCase()} • TARGET DATE CALCULATOR
            </h1>
            <div className="flex items-center gap-3 text-xs font-mono text-gray-700 mt-2">
              <span>Target Exam Date: <strong>{formattedExamDate}</strong></span>
              <span>• Overall Progress: <strong>{overallStats.completionPercentage}% Mastered ({overallStats.completedCount}/{overallStats.totalTopics} Topics)</strong></span>
            </div>
          </div>
          <div className="text-right text-xs font-mono">
            <div className="font-bold text-black uppercase">Study Desk Target Sheet</div>
            <div className="text-gray-600 mt-1">Printed: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Syllabus 3D Precision Study System</div>
          </div>
        </div>
      </div>

      {/* 1. EXECUTIVE PAGE HERO HEADER */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 bg-gradient-to-br from-white via-slate-50/90 to-white dark:from-[#181926]/90 dark:via-[#141522]/85 dark:to-[#0F1019]/95 backdrop-blur-xl border border-slate-200/90 dark:border-[#272738]/80 shadow-elevated-card print:p-0 print:border-none print:shadow-none">
        
        {/* Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-gradient-to-br from-[#2563EB]/15 to-[#3B82F6]/10 dark:from-[#7AA2F7]/20 dark:to-[#8B5CF6]/15 blur-3xl pointer-events-none print:hidden" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 dark:bg-[#7AA2F7]/15 border border-blue-500/20 dark:border-[#7AA2F7]/30 text-[#2563EB] dark:text-[#7AA2F7] text-[10.5px] sm:text-[11px] font-black tracking-wide uppercase">
              <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              <span>Target Date & Pacing Calculator</span>
            </div>
            <h1 className="text-base sm:text-2xl font-black text-slate-900 dark:text-[#F5F5F7] tracking-tight">
              Finish-Line Forecast & Target Pacing
            </h1>
            <p className="text-[11px] text-slate-600 dark:text-[#9496A1] font-medium leading-relaxed sm:hidden">
              Calculate exact syllabus completion date based on daily pace & protect your active recall buffer.
            </p>
            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-[#9496A1] font-medium max-w-2xl leading-relaxed hidden sm:block">
              Calculate exactly when your syllabus will finish based on your real daily velocity. Protect your 14–30 day active recall revision buffer so you finish well before exam week.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0 no-print flex-wrap w-full sm:w-auto">
            <button
              onClick={() => {
                soundManager.playClick();
                setIsEditExamModalOpen(true);
              }}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] dark:from-[#7AA2F7] dark:to-[#5B8BF5] text-white dark:text-[#0A0B10] text-xs sm:text-[13px] font-extrabold shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer tap-bounce"
              title="Change target exam date"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Change Target Date</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                window.print();
              }}
              className="hidden sm:flex px-3.5 py-2 rounded-xl bg-white dark:bg-[#20212F] border border-slate-200 dark:border-[#2E2F40] text-slate-700 dark:text-[#E2E8F0] text-xs sm:text-[13px] font-bold shadow-xs hover:border-[#2563EB] dark:hover:border-[#7AA2F7] active:scale-95 transition-all items-center gap-1.5 cursor-pointer"
              title="Print pacing study table cheatsheet (Ctrl + P)"
            >
              <Printer className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#7AA2F7]" />
              <span>Print Cheatsheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY PACING FORECAST HERO CARD */}
      <SyllabusPacingCard
        onOpenEditExamTarget={() => setIsEditExamModalOpen(true)}
        onNavigateToSyllabus={() => onNavigate('syllabus')}
      />

      {/* Target Exam Date Customizer Modal */}
      <EditExamTargetModal
        isOpen={isEditExamModalOpen}
        onClose={() => setIsEditExamModalOpen(false)}
      />

    </div>
  );
};
