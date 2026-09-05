import React, { useState } from 'react';
import {
  Clock,
  Target,
  Calendar,
  Sparkles,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Printer,
  ChevronRight,
  Layers
} from 'lucide-react';
import { useSyllabus } from '../../context/SyllabusContext';
import { SyllabusPacingCard } from '../dashboard/SyllabusPacingCard';
import { ExamCountdown3D } from '../3d/ExamCountdown3D';
import { EditExamTargetModal } from '../modals/EditExamTargetModal';
import { AppFooter } from '../common/AppFooter';
import { AppView } from '../layout/Sidebar';
import { soundManager } from '../../utils/soundEffects';

interface PacingViewProps {
  onNavigate: (view: AppView) => void;
  onNavigateToSubject?: (subjectId: string) => void;
}

export const PacingView: React.FC<PacingViewProps> = ({
  onNavigate,
  onNavigateToSubject
}) => {
  const { currentExam, subjectStats, overallStats } = useSyllabus();
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
    <div className="space-y-5 sm:space-y-6 pb-20 font-sans">
      
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
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-white via-slate-50/90 to-white dark:from-[#181926]/90 dark:via-[#141522]/85 dark:to-[#0F1019]/95 backdrop-blur-xl border border-slate-200/90 dark:border-[#272738]/80 shadow-elevated-card print:p-0 print:border-none print:shadow-none">
        
        {/* Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-gradient-to-br from-[#2563EB]/15 to-[#3B82F6]/10 dark:from-[#7AA2F7]/20 dark:to-[#8B5CF6]/15 blur-3xl pointer-events-none print:hidden" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-[#7AA2F7]/15 border border-blue-500/20 dark:border-[#7AA2F7]/30 text-[#2563EB] dark:text-[#7AA2F7] text-xs font-black tracking-wide uppercase">
              <Clock className="w-3.5 h-3.5" />
              <span>Target Date & Pacing Calculator</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-[#F5F5F7] tracking-tight">
              Finish-Line Forecast & Target Pacing
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-[#9496A1] font-medium max-w-2xl leading-relaxed">
              Calculate exactly when your syllabus will finish based on your real daily velocity. Protect your 14–30 day active recall revision buffer so you finish well before exam week.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 shrink-0 no-print flex-wrap">
            <button
              onClick={() => {
                soundManager.playClick();
                setIsEditExamModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] dark:from-[#7AA2F7] dark:to-[#5B8BF5] text-white dark:text-[#0A0B10] text-xs sm:text-[13px] font-extrabold shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
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
              className="px-3 py-2 rounded-xl bg-white dark:bg-[#20212F] border border-slate-200 dark:border-[#2E2F40] text-slate-700 dark:text-[#E2E8F0] text-xs sm:text-[13px] font-bold shadow-xs hover:border-[#2563EB] dark:hover:border-[#7AA2F7] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
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

      {/* 3. FLIP-CLOCK COUNTDOWN */}
      <ExamCountdown3D />

      {/* 4. SUBJECT-BY-SUBJECT COMPLETION & VELOCITY DISTRIBUTION */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#151620] border border-[#E2E8F0] dark:border-[#272730] shadow-subtle-depth space-y-4 print:p-0 print:border-none">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#EEEEE8] dark:border-[#242533]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20 shrink-0">
              <Layers className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h3 className="text-[15px] sm:text-base font-black text-[#11120F] dark:text-[#F5F5F7] tracking-tight">
                Subject Pacing & Syllabus Coverage
              </h3>
              <span className="text-xs text-[#65675F] dark:text-[#A1A1AA] font-medium">
                Individual subject completion status and remaining topic load
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('syllabus')}
            className="text-xs font-bold text-[#2563EB] dark:text-[#7AA2F7] hover:underline flex items-center gap-1 cursor-pointer no-print"
          >
            <span>Explore Syllabus</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {subjectStats.map(subj => {
            const remaining = Math.max(0, subj.totalTopics - subj.completedTopics);
            return (
              <div
                key={subj.subjectId}
                onClick={() => {
                  if (onNavigateToSubject) {
                    onNavigateToSubject(subj.subjectId);
                  } else {
                    onNavigate('syllabus');
                  }
                }}
                className="p-4 rounded-2xl bg-[#F8FAFC]/90 dark:bg-[#1C1D2A] border border-slate-200/80 dark:border-[#28293C] hover:border-[#2563EB] dark:hover:border-[#7AA2F7] transition-all cursor-pointer space-y-3 shadow-2xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate group-hover:text-[#2563EB] dark:group-hover:text-[#7AA2F7] transition-colors">
                    {subj.subjectName}
                  </span>
                  <span className="text-xs font-mono font-black tabular-nums text-[#2563EB] dark:text-[#7AA2F7]">
                    {subj.percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#2A2C3E] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${subj.percentage}%`,
                      backgroundColor: subj.color || '#2563EB'
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
                  <span><strong>{subj.completedTopics}</strong>/{subj.totalTopics} Done</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{remaining} Left</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Exam Date Customizer Modal */}
      <EditExamTargetModal
        isOpen={isEditExamModalOpen}
        onClose={() => setIsEditExamModalOpen(false)}
      />

      {/* Professional Footer */}
      <AppFooter onNavigate={onNavigate} />

    </div>
  );
};
