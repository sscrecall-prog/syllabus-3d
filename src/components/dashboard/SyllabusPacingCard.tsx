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
    <div className="relative rounded-3xl bg-white dark:bg-[#151620] border border-slate-200/90 dark:border-[#272738]/80 shadow-subtle-depth p-3.5 sm:p-6 overflow-hidden space-y-3.5 sm:space-y-5 select-none transition-all print:p-4 print:border print:border-black print:shadow-none">
      
      {/* Ambient Decorative Glow */}
      <div className="absolute -top-14 -right-14 w-60 h-60 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-[#7AA2F7]/15 dark:to-purple-500/10 blur-3xl pointer-events-none print:hidden" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-amber-500/5 dark:bg-emerald-500/5 blur-2xl pointer-events-none print:hidden" />

      {/* TOP HEADER ROW */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#242533]">
        <div className="flex items-start sm:items-center gap-3">
          {/* 3D App Icon */}
          <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#2563EB] via-indigo-600 to-purple-600 dark:from-[#7AA2F7] dark:via-[#6366F1] dark:to-[#8B5CF6] text-white flex items-center justify-center font-bold shadow-md shadow-[#2563EB]/25 dark:shadow-[#7AA2F7]/30 shrink-0 mt-0.5 sm:mt-0">
            <Clock className="w-5 sm:w-6 h-5 sm:h-6 stroke-[2.3]" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-[#F5F5F7] tracking-tight leading-tight">
                Finish-Line Forecast & Pacing
              </h3>

              {/* Dynamic Status Chip */}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] font-black tracking-wide border shadow-2xs shrink-0 ${forecast.statusTheme.badgeBg} ${forecast.statusTheme.badgeBorder} ${forecast.statusTheme.badgeText}`}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-current" />
                <span>{forecast.statusLabel}</span>
              </span>
            </div>

            {/* Clean Meta Pills on Mobile */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 dark:text-[#A1A1AA] font-mono">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1E1F2C] text-slate-700 dark:text-slate-300 font-bold border border-slate-200/60 dark:border-slate-800">
                🎯 {examName}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1E1F2C] text-slate-700 dark:text-slate-300 font-bold border border-slate-200/60 dark:border-slate-800">
                📅 {forecast.examDateFormatted}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 dark:bg-[#7AA2F7]/15 text-[#2563EB] dark:text-[#7AA2F7] font-bold border border-blue-500/20 dark:border-[#7AA2F7]/25">
                ⏳ {forecast.totalDaysLeft}d left
              </span>
            </div>
          </div>
        </div>

        {/* Quick Target Date Editor & What-If Actions (Grid on Mobile) */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0 no-print pt-0.5">
          {onOpenEditExamTarget && (
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenEditExamTarget();
              }}
              className="px-3 py-2 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#1C1D2A] dark:hover:bg-[#252738] border border-slate-200 dark:border-[#2D2E42] text-slate-700 dark:text-[#CBD5E1] hover:text-[#2563EB] dark:hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              title="Change target exam or exam date"
            >
              <Calendar className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#7AA2F7] shrink-0" />
              <span className="truncate">Change Target</span>
            </button>
          )}

          <button
            onClick={() => {
              soundManager.playClick();
              setIsWhatIfOpen(prev => !prev);
            }}
            className={`px-3 py-2 sm:py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
              isWhatIfOpen
                ? 'bg-[#2563EB] dark:bg-[#7AA2F7] text-white dark:text-black border-transparent shadow-xs font-black'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-[#1C1D2A] dark:hover:bg-[#252738] border-slate-200 dark:border-[#2D2E42] text-slate-700 dark:text-[#CBD5E1]'
            }`}
            title="Open interactive What-If pace simulator"
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">What-If Pace</span>
            {isWhatIfOpen ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
          </button>
        </div>
      </div>

      {/* 1. VISUAL SEGMENTED PACING TIMELINE & 3 MILESTONE CARDS */}
      <div className="relative z-10 space-y-2.5">
        
        {/* Mobile-Optimized 3-Milestone Stepper Cards */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 text-center">
          {/* Step 1: Today */}
          <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-[#1A1B28] border border-slate-200/80 dark:border-[#272738] flex flex-col justify-center shadow-2xs">
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-[#A1A1AA] uppercase flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span>Today</span>
            </span>
            <span className="text-xs sm:text-sm font-black font-mono text-slate-800 dark:text-slate-100 tabular-nums truncate mt-0.5">
              {forecast.todayFormatted}
            </span>
          </div>

          {/* Step 2: Forecast Finish Line */}
          <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border flex flex-col justify-center shadow-2xs ${
            forecast.status === 'ahead' || forecast.status === 'on_track'
              ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : forecast.status === 'behind_mild'
              ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
              : 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}>
            <span className="text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1">
              <Flag className="w-3 h-3" />
              <span>Finish Line</span>
            </span>
            <span className="text-xs sm:text-sm font-black font-mono tabular-nums truncate mt-0.5">
              {forecast.finishLineForecastDate}
            </span>
          </div>

          {/* Step 3: Target Exam Day */}
          <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-indigo-500/10 dark:bg-[#7AA2F7]/15 border border-indigo-500/20 dark:border-[#7AA2F7]/30 text-[#2563EB] dark:text-[#7AA2F7] flex flex-col justify-center shadow-2xs">
            <span className="text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1">
              <span>🎯 Exam Day</span>
            </span>
            <span className="text-xs sm:text-sm font-black font-mono tabular-nums truncate mt-0.5">
              {forecast.examDateFormatted}
            </span>
          </div>
        </div>

        {/* Multi-Segment Pacing Horizon Bar */}
        <div className="space-y-1.5 pt-0.5">
          <div className="relative h-3 sm:h-3.5 w-full rounded-full bg-slate-100 dark:bg-[#1E1F2C] border border-slate-200/80 dark:border-[#282A3A] overflow-hidden flex shadow-inner">
            {/* Segment 1: Completed Topics */}
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-[#7AA2F7] dark:via-[#6366F1] dark:to-[#818CF8] transition-all duration-1000 shadow-sm"
              style={{ width: `${Math.max(4, forecast.completionPercentage)}%` }}
              title={`Completed Syllabus: ${forecast.completionPercentage}% (${forecast.topicsCompleted}/${forecast.topicsTotal} Topics)`}
            />
            
            {/* Segment 2: Remaining Learning Journey */}
            <div
              className="h-full bg-slate-200/50 dark:bg-white/5 transition-all duration-1000"
              style={{ width: `${Math.max(0, 100 - forecast.completionPercentage)}%` }}
              title={`Remaining Syllabus: ${forecast.topicsRemaining} Topics`}
            />
          </div>

          {/* Clean Legend Chips */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] pt-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-[#7AA2F7] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-[#7AA2F7]" />
                <span>{forecast.topicsCompleted} Mastered ({forecast.completionPercentage}%)</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1E1F2C] text-slate-600 dark:text-slate-400 font-mono font-bold">
                <span>⏳ {forecast.topicsRemaining} Remaining</span>
              </span>
            </div>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
              <ShieldCheck className="w-3 h-3" />
              <span>{forecast.bufferDays}d Buffer</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. 4-COLUMN CORE DIAGNOSTIC KPI BENTO TILES */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        
        {/* TILE 1: Finish-Line Forecast Date */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#191A28] border border-slate-200/90 dark:border-[#272738] shadow-2xs flex flex-col justify-between hover:border-indigo-400 transition-colors">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-[#A1A1AA]">
              Finish-Line Date
            </span>
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Flag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="text-base sm:text-xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-nums truncate">
              {forecast.finishLineForecastDate}
            </div>
            <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
              {forecast.daysUntilFinish} study days needed
            </div>
          </div>
        </div>

        {/* TILE 2: Required Daily Pace */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#191A28] border border-slate-200/90 dark:border-[#272738] shadow-2xs flex flex-col justify-between hover:border-amber-400 transition-colors">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-[#A1A1AA]">
              Required Velocity
            </span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="text-base sm:text-xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400 tabular-nums truncate">
              {forecast.requiredDailyPace} <span className="text-[11px] font-bold font-sans">topics/day</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5 truncate">
              ~{forecast.requiredWeeklyPace} topics/wk • ~{forecast.requiredDailyStudyMinutes}m/day
            </div>
          </div>
        </div>

        {/* TILE 3: Actual Velocity */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#191A28] border border-slate-200/90 dark:border-[#272738] shadow-2xs flex flex-col justify-between hover:border-blue-400 transition-colors">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-[#A1A1AA]">
              Your Pace (14d)
            </span>
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-[#7AA2F7] flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="text-base sm:text-xl font-black font-mono tracking-tight text-blue-600 dark:text-[#7AA2F7] tabular-nums truncate">
              {forecast.actualDailyVelocity} <span className="text-[11px] font-bold font-sans">topics/day</span>
            </div>
            <div className="text-[11px] font-semibold mt-0.5 truncate">
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

        {/* TILE 4: Revision Margin */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#191A28] border border-slate-200/90 dark:border-[#272738] shadow-2xs flex flex-col justify-between hover:border-emerald-400 transition-colors">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-[#A1A1AA]">
              Revision Margin
            </span>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              forecast.bufferMarginDays >= forecast.bufferDays
                ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : forecast.bufferMarginDays > 0
                ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className={`text-base sm:text-xl font-black font-mono tracking-tight tabular-nums truncate ${
              forecast.bufferMarginDays >= forecast.bufferDays
                ? 'text-emerald-600 dark:text-emerald-400'
                : forecast.bufferMarginDays > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {forecast.bufferMarginDays < 0 ? (
                <span>{forecast.bufferMarginDays}d Overrun</span>
              ) : (
                <span>+{forecast.bufferMarginDays}d Safe</span>
              )}
            </div>
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5 truncate">
              {forecast.bufferMarginDays >= forecast.bufferDays ? 'Safe revision window' : 'Revision buffer compressed'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. REVISION BUFFER SEGMENTED CONTROL */}
      <div className="relative z-10 p-3 sm:p-3.5 rounded-2xl bg-slate-50/90 dark:bg-[#181928] border border-slate-200/80 dark:border-[#272738] space-y-2 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              Target Revision Buffer
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-[#A1A1AA] hidden xs:inline">
            Days before exam reserved for active recall
          </span>
        </div>

        {/* Segmented Control */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-[#10111A] border border-slate-200/60 dark:border-white/5">
          {bufferOptions.map(bDays => {
            const isSelected = revisionBufferDays === bDays;
            return (
              <button
                key={bDays}
                type="button"
                onClick={() => handleBufferChange(bDays)}
                className={`py-1.5 sm:py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 text-center flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 ${
                  isSelected
                    ? 'bg-white dark:bg-[#25273A] text-emerald-600 dark:text-emerald-400 shadow-xs font-black border border-slate-200/80 dark:border-white/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={`Reserve ${bDays} days before exam for revision`}
              >
                <span>{bDays}d</span>
                {bDays === 14 && (
                  <span className="text-[9px] text-amber-500 font-sans font-black">★Rec</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. ACTIONABLE COACHING CALLOUT / PRESCRIPTION */}
      <div className={`relative z-10 p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
        forecast.status === 'ahead' || forecast.status === 'on_track'
          ? 'bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-transparent border-emerald-500/30'
          : forecast.status === 'behind_mild'
          ? 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/30'
          : 'bg-gradient-to-br from-rose-500/10 via-red-500/5 to-transparent border-rose-500/30'
      }`}>
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">{forecast.statusTheme.icon}</span>
            <h4 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white">
              {forecast.catchUpAdvice.title}
            </h4>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide ${forecast.statusTheme.badgeBg} ${forecast.statusTheme.badgeText} border ${forecast.statusTheme.badgeBorder}`}>
              {forecast.catchUpAdvice.actionBadge}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-[#CBD5E1] font-medium leading-relaxed">
            {forecast.catchUpAdvice.detail}
          </p>
        </div>

        {onNavigateToSyllabus && (
          <button
            onClick={() => {
              soundManager.playClick();
              onNavigateToSyllabus();
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#0F172A] dark:bg-white text-white dark:text-black hover:bg-[#2563EB] dark:hover:bg-[#CBD5E1] text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95 tap-bounce"
          >
            <span>Study Next Topic</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* 5. INTERACTIVE "WHAT-IF" PACE SIMULATOR DRAWER */}
      {isWhatIfOpen && (
        <div className="relative z-10 p-3.5 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#181926] dark:to-[#161C2C] border border-blue-200/80 dark:border-[#2D3250] space-y-3 animate-fade-in no-print">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2563EB] dark:text-[#7AA2F7]" />
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                "What-If" Pace Simulator
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-[#A1A1AA] font-mono">
              {forecast.topicsRemaining} Topics Left
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-[#9496A1]">
            See how increasing daily pace accelerates your finish line and expands revision time:
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
            {simulations.map(sim => {
              const isCurrent = Math.abs(sim.dailyPace - forecast.actualDailyVelocity) < 0.25;
              return (
                <div
                  key={sim.dailyPace}
                  className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all ${
                    sim.isSafe
                      ? 'bg-white dark:bg-[#1E2030] border-slate-200 dark:border-[#2C3048]'
                      : 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                      {sim.dailyPace} {sim.dailyPace === 1 ? 'Topic' : 'Topics'}/d
                    </span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-blue-500/20 text-blue-600 dark:text-[#7AA2F7]">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 space-y-0.5">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      🏁 {sim.forecastDateFormatted}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {sim.daysNeeded} Days Needed
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 pt-0.5">
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
