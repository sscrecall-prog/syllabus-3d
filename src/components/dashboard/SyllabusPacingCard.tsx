import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  Flag,
  Sparkles,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sliders,
  ShieldCheck,
  ArrowRight,
  Info,
  CalendarDays
} from 'lucide-react';
import { useSyllabus } from '../../context/SyllabusContext';
import {
  calculatePacingForecast,
  simulateWhatIfPaces,
  getStoredRevisionBuffer,
  saveStoredRevisionBuffer,
  PacingForecastResult
} from '../../utils/pacingCalculator';
import { soundManager } from '../../utils/soundEffects';

interface SyllabusPacingCardProps {
  onOpenEditExamTarget?: () => void;
  onNavigateToSyllabus?: () => void;
}

export const SyllabusPacingCard: React.FC<SyllabusPacingCardProps> = ({
  onOpenEditExamTarget,
  onNavigateToSyllabus
}) => {
  const {
    currentExam,
    overallStats,
    activityHistory
  } = useSyllabus();

  // Revision buffer state (stored in localStorage)
  const [revisionBufferDays, setRevisionBufferDays] = useState<number>(() => getStoredRevisionBuffer());
  const [isWhatIfOpen, setIsWhatIfOpen] = useState<boolean>(false);
  const [selectedWhatIfPace, setSelectedWhatIfPace] = useState<number | null>(null);

  const examDateStr = currentExam?.examDate || '2026-10-15';
  const examName = currentExam?.name || 'Target Exam';

  // Calculate live pacing forecast
  const forecast: PacingForecastResult = useMemo(() => {
    return calculatePacingForecast({
      examDateStr,
      totalTopics: overallStats.totalTopics,
      completedTopics: overallStats.completedCount,
      inProgressTopics: overallStats.inProgressCount,
      activityHistory,
      revisionBufferDays
    });
  }, [examDateStr, overallStats, activityHistory, revisionBufferDays]);

  // What-If Simulations
  const simulations = useMemo(() => {
    return simulateWhatIfPaces(forecast.topicsRemaining, forecast.totalDaysLeft, revisionBufferDays);
  }, [forecast.topicsRemaining, forecast.totalDaysLeft, revisionBufferDays]);

  const handleBufferChange = (days: number) => {
    soundManager.playClick();
    setRevisionBufferDays(days);
    saveStoredRevisionBuffer(days);
  };

  const bufferOptions = [7, 14, 21, 30];

  return (
    <div className="relative rounded-3xl bg-white dark:bg-[#151620] border border-slate-200/90 dark:border-[#272738]/80 shadow-subtle-depth p-4 sm:p-6 overflow-hidden space-y-4 sm:space-y-5 select-none transition-all print:p-4 print:border print:border-black print:shadow-none">
      
      {/* Ambient Decorative Glow */}
      <div className="absolute -top-14 -right-14 w-60 h-60 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-[#7AA2F7]/15 dark:to-purple-500/10 blur-3xl pointer-events-none print:hidden" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-amber-500/5 dark:bg-emerald-500/5 blur-2xl pointer-events-none print:hidden" />

      {/* TOP HEADER ROW */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#242533]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-indigo-600 dark:from-[#7AA2F7] dark:to-[#4D76D6] text-white flex items-center justify-center font-bold shadow-md shadow-[#2563EB]/20 dark:shadow-[#7AA2F7]/25 shrink-0">
            <Clock className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[15px] sm:text-base font-black text-slate-900 dark:text-[#F5F5F7] tracking-tight">
                Finish-Line Forecast & Syllabus Pacing
              </h3>
              {/* Dynamic Status Badge */}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide border ${forecast.statusTheme.badgeBg} ${forecast.statusTheme.badgeBorder} ${forecast.statusTheme.badgeText}`}>
                <span>{forecast.statusTheme.icon}</span>
                <span>{forecast.statusLabel}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#A1A1AA] font-medium mt-0.5">
              Target: <strong className="text-slate-800 dark:text-slate-200">{examName}</strong> • Exam Date: <strong className="text-slate-800 dark:text-slate-200">{forecast.examDateFormatted}</strong> ({forecast.totalDaysLeft} days left)
            </p>
          </div>
        </div>

        {/* Quick Target Date Editor & Buffer Pill (Hidden in Print) */}
        <div className="flex items-center gap-2 shrink-0 no-print">
          {onOpenEditExamTarget && (
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenEditExamTarget();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#1E1F2C] dark:hover:bg-[#28293B] border border-slate-200 dark:border-[#2E3044] text-slate-700 dark:text-[#C0CAF5] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Change target exam or exam date"
            >
              <Calendar className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#7AA2F7]" />
              <span>Change Exam Date</span>
            </button>
          )}

          <button
            onClick={() => {
              soundManager.playClick();
              setIsWhatIfOpen(prev => !prev);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isWhatIfOpen
                ? 'bg-blue-500/10 border-blue-500/40 text-[#2563EB] dark:text-[#7AA2F7]'
                : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-[#1E1F2C] dark:hover:bg-[#28293B] border-slate-200 dark:border-[#2E3044] text-slate-700 dark:text-[#C0CAF5]'
            }`}
            title="Open interactive What-If pace simulator"
          >
            <Sliders className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#7AA2F7]" />
            <span>What-If Simulator</span>
            {isWhatIfOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 1. VISUAL SEGMENTED PACING TIMELINE */}
      <div className="relative z-10 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Today ({forecast.todayFormatted})</span>
          </span>

          <span className="flex items-center gap-1 font-mono text-indigo-600 dark:text-indigo-400">
            <Flag className="w-3.5 h-3.5" />
            <span>Finish Line: {forecast.finishLineForecastDate}</span>
          </span>

          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
            <span>🎯 Exam Day: {forecast.examDateFormatted}</span>
          </span>
        </div>

        {/* Multi-Segment Pacing Horizon Bar */}
        <div className="relative h-3.5 sm:h-4 w-full rounded-full bg-slate-100 dark:bg-[#1E1F2C] border border-slate-200/80 dark:border-[#282A3A] overflow-hidden flex shadow-inner">
          {/* Segment 1: Completed Topics */}
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-[#7AA2F7] dark:to-[#818CF8] transition-all duration-1000"
            style={{ width: `${Math.max(5, forecast.completionPercentage)}%` }}
            title={`Completed Syllabus: ${forecast.completionPercentage}% (${forecast.topicsCompleted}/${forecast.topicsTotal} Topics)`}
          />
          
          {/* Segment 2: Remaining Learning Journey */}
          <div
            className="h-full bg-gradient-to-r from-indigo-400/40 via-purple-400/30 to-indigo-400/20 dark:from-indigo-500/30 dark:to-purple-500/20 transition-all duration-1000"
            style={{ width: `${Math.max(0, 100 - forecast.completionPercentage)}%` }}
            title={`Remaining Syllabus: ${forecast.topicsRemaining} Topics`}
          />
        </div>

        {/* Legend Sub-row */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-[#9496A1] pt-0.5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-[#7AA2F7]" />
              <span>Conquered ({forecast.topicsCompleted} topics • {forecast.completionPercentage}%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400/60 dark:bg-indigo-500/50" />
              <span>To Learn ({forecast.topicsRemaining} topics)</span>
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Revision Buffer: {forecast.bufferDays} Days Reserved</span>
          </div>
        </div>
      </div>

      {/* 2. 4-COLUMN CORE DIAGNOSTIC KPI TILES */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        
        {/* TILE 1: Finish-Line Forecast Date */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-[#1A1B28] dark:to-[#171824] border border-slate-200/90 dark:border-[#272738] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-[#A1A1AA]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Finish-Line Date</span>
            <Flag className="w-4 h-4 text-indigo-500 shrink-0" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              {forecast.finishLineForecastDate}
            </div>
            <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1">
              <span>{forecast.daysUntilFinish} study days needed</span>
            </div>
          </div>
        </div>

        {/* TILE 2: Required Daily Pace */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-[#1A1B28] dark:to-[#171824] border border-slate-200/90 dark:border-[#272738] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-[#A1A1AA]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Required Velocity</span>
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
              {forecast.requiredDailyPace} <span className="text-xs font-bold font-sans">topics / day</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
              ~{forecast.requiredWeeklyPace} topics/wk • ~{forecast.requiredDailyStudyMinutes}m study/day
            </div>
          </div>
        </div>

        {/* TILE 3: Actual Velocity */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-[#1A1B28] dark:to-[#171824] border border-slate-200/90 dark:border-[#272738] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-[#A1A1AA]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Your Velocity (14d)</span>
            <TrendingUp className="w-4 h-4 text-blue-500 shrink-0" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black font-mono tracking-tight text-blue-600 dark:text-[#7AA2F7] tabular-nums">
              {forecast.actualDailyVelocity} <span className="text-xs font-bold font-sans">topics / day</span>
            </div>
            <div className="text-[11px] font-semibold mt-0.5">
              {forecast.actualDailyVelocity >= forecast.requiredDailyPace ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  +{(forecast.actualDailyVelocity - forecast.requiredDailyPace).toFixed(1)} ahead of target
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  -{(forecast.requiredDailyPace - forecast.actualDailyVelocity).toFixed(1)} below required
                </span>
              )}
            </div>
          </div>
        </div>

        {/* TILE 4: Actual Revision Buffer Window */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-[#1A1B28] dark:to-[#171824] border border-slate-200/90 dark:border-[#272738] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-[#A1A1AA]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Revision Margin</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="mt-2">
            <div className={`text-lg sm:text-xl font-black font-mono tracking-tight tabular-nums ${
              forecast.bufferMarginDays >= forecast.bufferDays
                ? 'text-emerald-600 dark:text-emerald-400'
                : forecast.bufferMarginDays > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {forecast.bufferMarginDays} <span className="text-xs font-bold font-sans">Days Free</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
              {forecast.bufferMarginDays >= forecast.bufferDays ? 'Safe revision window' : 'Revision buffer compressed'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. REVISION BUFFER SELECTOR PILLS */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50/80 dark:bg-[#1C1D2A]/80 border border-slate-200/80 dark:border-[#28293C]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Target Revision Buffer:</span>
          </span>
          <span className="text-[11px] text-slate-500 dark:text-[#A1A1AA] hidden sm:inline">
            (Days before exam reserved exclusively for revision & active recall)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {bufferOptions.map(bDays => {
            const isSelected = revisionBufferDays === bDays;
            return (
              <button
                key={bDays}
                onClick={() => handleBufferChange(bDays)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'bg-white dark:bg-[#242636] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2F3144] hover:border-emerald-500'
                }`}
                title={`Reserve ${bDays} days before exam for revision`}
              >
                {bDays}d {bDays === 14 ? '⭐ (Rec)' : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. ACTIONABLE COACHING CALLOUT / PRESCRIPTION */}
      <div className={`relative z-10 p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        forecast.status === 'ahead' || forecast.status === 'on_track'
          ? 'bg-blue-50/70 dark:bg-[#161B2E]/60 border-blue-200/80 dark:border-blue-900/40'
          : forecast.status === 'behind_mild'
          ? 'bg-amber-50/70 dark:bg-[#261E14]/60 border-amber-200/80 dark:border-amber-900/40'
          : 'bg-rose-50/70 dark:bg-[#281519]/60 border-rose-200/80 dark:border-rose-900/40'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base">{forecast.statusTheme.icon}</span>
            <h4 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white">
              {forecast.catchUpAdvice.title}
            </h4>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide ${forecast.statusTheme.badgeBg} ${forecast.statusTheme.badgeText}`}>
              {forecast.catchUpAdvice.actionBadge}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-[#A9B1D6] font-medium leading-relaxed max-w-2xl">
            {forecast.catchUpAdvice.detail}
          </p>
        </div>

        {onNavigateToSyllabus && (
          <button
            onClick={() => {
              soundManager.playClick();
              onNavigateToSyllabus();
            }}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1E2030] hover:bg-slate-50 dark:hover:bg-[#282B40] border border-slate-200 dark:border-[#2D3048] text-slate-800 dark:text-white text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>Study Next Topic</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 5. INTERACTIVE "WHAT-IF" PACE SIMULATOR DRAWER */}
      {isWhatIfOpen && (
        <div className="relative z-10 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#181926] dark:to-[#161C2C] border border-blue-200/80 dark:border-[#2D3250] space-y-3.5 animate-fade-in no-print">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2563EB] dark:text-[#7AA2F7]" />
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                "What-If" Pace Simulator — Accelerate Your Finish Line
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-[#A1A1AA] font-mono">
              Remaining: {forecast.topicsRemaining} Topics
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-[#9496A1]">
            See how completing more topics per day directly accelerates your syllabus finish line and expands your revision breathing room:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {simulations.map(sim => {
              const isCurrent = Math.abs(sim.dailyPace - forecast.actualDailyVelocity) < 0.25;
              return (
                <div
                  key={sim.dailyPace}
                  className={`p-3 rounded-2xl border transition-all ${
                    sim.isSafe
                      ? 'bg-white dark:bg-[#1E2030] border-slate-200 dark:border-[#2C3048] hover:border-blue-400'
                      : 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                      {sim.dailyPace} {sim.dailyPace === 1 ? 'Topic' : 'Topics'} / Day
                    </span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-500/20 text-blue-600 dark:text-[#7AA2F7]">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      🏁 Finish: {sim.forecastDateFormatted}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {sim.daysNeeded} Days Needed
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                      {sim.statusText}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. CLEAN INK-FRIENDLY DESK CHEATSHEET PRINT SECTION (Ctrl + P) */}
      <div className="hidden print:block pt-3 border-t-2 border-black text-black">
        <h4 className="text-xs font-black uppercase tracking-wider mb-2">
          📋 SYLLABUS PACING & FINISH-LINE TARGET SPECIFICATION
        </h4>
        <table className="w-full text-xs font-mono border-collapse border border-black">
          <tbody>
            <tr className="border-b border-black">
              <td className="p-1.5 font-bold border-r border-black w-1/2">Target Exam & Target Date:</td>
              <td className="p-1.5">{examName} • {forecast.examDateFormatted} ({forecast.totalDaysLeft} Days Left)</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 font-bold border-r border-black">Syllabus Progress:</td>
              <td className="p-1.5">{forecast.topicsCompleted} of {forecast.topicsTotal} Topics Mastered ({forecast.completionPercentage}%) • {forecast.topicsRemaining} Remaining</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 font-bold border-r border-black">Finish-Line Forecast Date:</td>
              <td className="p-1.5 font-bold">{forecast.finishLineForecastDate} ({forecast.daysUntilFinish} Study Days Required)</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 font-bold border-r border-black">Required Completion Velocity:</td>
              <td className="p-1.5 font-bold">{forecast.requiredDailyPace} Topics/Day (~{forecast.requiredWeeklyPace} Topics/Week)</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-1.5 font-bold border-r border-black">Student's Current Velocity:</td>
              <td className="p-1.5">{forecast.actualDailyVelocity} Topics/Day ({forecast.statusLabel})</td>
            </tr>
            <tr>
              <td className="p-1.5 font-bold border-r border-black">Reserved Revision Buffer:</td>
              <td className="p-1.5 font-bold">{forecast.bufferDays} Days Reserved Prior to Exam Day</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
};
