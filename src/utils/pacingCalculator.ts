import { DailyActivity } from '../types/syllabus';

export type PacingDiagnosticStatus = 'ahead' | 'on_track' | 'behind_mild' | 'behind_critical';

export interface CatchUpAdvice {
  title: string;
  detail: string;
  dailyDeficit: number;
  recommendedDailyTarget: number;
  actionBadge: string;
}

export interface PacingForecastResult {
  todayFormatted: string;
  examDateFormatted: string;
  examDateRaw: string;
  isExamDatePast: boolean;
  totalDaysLeft: number;
  bufferDays: number;
  studyDaysLeft: number;
  topicsTotal: number;
  topicsCompleted: number;
  topicsRemaining: number;
  effectiveTopicsRemaining: number;
  completionPercentage: number;
  requiredDailyPace: number;
  requiredWeeklyPace: number;
  requiredDailyStudyMinutes: number;
  actualDailyVelocity: number;
  finishLineForecastDate: string;
  finishLineForecastISO: string;
  daysUntilFinish: number;
  bufferMarginDays: number;
  status: PacingDiagnosticStatus;
  statusLabel: string;
  statusHeadline: string;
  statusTheme: {
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    accentColor: string;
    icon: string;
  };
  catchUpAdvice: CatchUpAdvice;
}

export interface WhatIfSimulation {
  dailyPace: number;
  daysNeeded: number;
  forecastDateFormatted: string;
  bufferDaysRemaining: number;
  isSafe: boolean;
  statusText: string;
}

const STORAGE_KEY_BUFFER = 'syllabus3d_pacing_buffer_days';

/**
 * Retrieves the saved revision buffer days from localStorage (default: 14 days)
 */
export const getStoredRevisionBuffer = (): number => {
  if (typeof window === 'undefined') return 14;
  const saved = localStorage.getItem(STORAGE_KEY_BUFFER);
  if (saved) {
    const parsed = parseInt(saved, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 90) return parsed;
  }
  return 14;
};

/**
 * Saves the revision buffer days to localStorage
 */
export const saveStoredRevisionBuffer = (days: number): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_BUFFER, String(Math.max(0, Math.min(90, days))));
};

/**
 * Formats a Date or ISO string into clean readable format (e.g. "15 Oct 2026")
 */
export const formatReadableDate = (dateInput: string | Date): string => {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(dateInput);
  }
};

/**
 * Calculates actual daily velocity over the last 14 days
 */
export const calculateActualVelocity = (
  activityHistory: DailyActivity[] = [],
  completedTopics: number = 0,
  windowDays: number = 14
): number => {
  if (!activityHistory || activityHistory.length === 0) {
    // Fallback baseline: 1.0 topic/day or based on completed topics
    return completedTopics > 0 ? Math.min(2.5, Math.max(0.6, completedTopics / 30)) : 1.0;
  }

  // Sort latest first
  const sorted = [...activityHistory].sort((a, b) => (b.date > a.date ? 1 : -1));
  const recentSlice = sorted.slice(0, windowDays);

  const totalTopicsInWindow = recentSlice.reduce((sum, item) => sum + (item.topicsCompleted || 0), 0);
  const activeStudyDays = recentSlice.filter(item => (item.studyMinutes || 0) > 0 || (item.topicsCompleted || 0) > 0).length;

  if (activeStudyDays > 0) {
    // Weighted velocity: balance between active study days and overall calendar days
    const activeRate = totalTopicsInWindow / activeStudyDays;
    const calendarRate = totalTopicsInWindow / recentSlice.length;
    const blended = activeRate * 0.6 + calendarRate * 0.4;
    return Math.round(Math.max(0.3, blended) * 10) / 10;
  }

  return completedTopics > 0 ? Math.min(2.0, Math.max(0.5, completedTopics / 30)) : 1.0;
};

/**
 * Core Pacing & Finish-Line Forecast Engine
 */
export const calculatePacingForecast = (params: {
  examDateStr: string;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics?: number;
  activityHistory?: DailyActivity[];
  revisionBufferDays?: number;
}): PacingForecastResult => {
  const {
    examDateStr,
    totalTopics,
    completedTopics,
    inProgressTopics = 0,
    activityHistory = [],
    revisionBufferDays
  } = params;

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let targetDate = new Date(examDateStr);
  let isExamDatePast = false;

  // Handle invalid or past exam date gracefully
  if (isNaN(targetDate.getTime()) || targetDate.getTime() < todayMidnight.getTime()) {
    isExamDatePast = true;
    // Default fallback: 90 days from today for simulation purposes
    targetDate = new Date(todayMidnight.getTime() + 90 * 86400000);
  }

  const examMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const diffMs = examMidnight.getTime() - todayMidnight.getTime();
  const totalDaysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  // Revision Buffer handling
  const configuredBuffer = revisionBufferDays !== undefined ? revisionBufferDays : getStoredRevisionBuffer();
  // Buffer cannot exceed 75% of remaining days
  const maxAllowableBuffer = Math.max(0, Math.floor(totalDaysLeft * 0.75));
  const bufferDays = Math.min(configuredBuffer, maxAllowableBuffer);

  // Net days for fresh syllabus learning
  const studyDaysLeft = Math.max(1, totalDaysLeft - bufferDays);

  // Topics calculations
  const topicsTotal = Math.max(1, totalTopics);
  const topicsCompleted = Math.max(0, completedTopics);
  const topicsRemaining = Math.max(0, topicsTotal - topicsCompleted);
  const effectiveTopicsRemaining = Math.max(0, topicsTotal - topicsCompleted - Math.round(inProgressTopics * 0.4));
  const completionPercentage = Math.min(100, Math.round((topicsCompleted / topicsTotal) * 100));

  // Required Velocity to finish BEFORE the revision buffer begins
  const rawDailyPace = topicsRemaining / studyDaysLeft;
  const requiredDailyPace = Math.round(rawDailyPace * 10) / 10;
  const requiredWeeklyPace = Math.round(requiredDailyPace * 7);
  // Assume ~40 mins active study/practice needed per topic
  const requiredDailyStudyMinutes = Math.round(requiredDailyPace * 40);

  // Actual Student Velocity
  const actualDailyVelocity = calculateActualVelocity(activityHistory, topicsCompleted, 14);

  // Finish Line Forecast (based on actual velocity)
  const daysNeededToFinish = topicsRemaining === 0
    ? 0
    : Math.ceil(topicsRemaining / Math.max(0.2, actualDailyVelocity));

  const forecastDate = new Date(todayMidnight.getTime() + daysNeededToFinish * 86400000);
  const finishLineForecastDate = formatReadableDate(forecastDate);
  const finishLineForecastISO = forecastDate.toISOString().split('T')[0];
  const daysUntilFinish = daysNeededToFinish;

  // Buffer margin: how many days remain between syllabus finish and exam day
  const bufferMarginDays = totalDaysLeft - daysUntilFinish;

  // Status Diagnostic Logic
  let status: PacingDiagnosticStatus = 'on_track';
  let statusLabel = 'On Track';
  let statusHeadline = 'Syllabus finishes on schedule with healthy revision time';

  if (topicsRemaining === 0) {
    status = 'ahead';
    statusLabel = 'Syllabus Conquered! 🏆';
    statusHeadline = '100% Complete! Dedicate full time to active recall & revision';
  } else if (bufferMarginDays >= bufferDays + 4) {
    status = 'ahead';
    statusLabel = 'Ahead of Schedule ⚡';
    statusHeadline = `Finishing ${bufferMarginDays - bufferDays} days ahead of target! Bonus revision buffer gained`;
  } else if (bufferMarginDays >= bufferDays - 2) {
    status = 'on_track';
    statusLabel = 'On Track 🎯';
    statusHeadline = `Finishing with ${Math.max(0, bufferMarginDays)} full days reserved for revision`;
  } else if (bufferMarginDays > 0) {
    status = 'behind_mild';
    statusLabel = 'Revision Buffer Squeezed ⚠️';
    statusHeadline = `Syllabus will finish before exam, but only ${bufferMarginDays} days left for revision (target: ${bufferDays}d)`;
  } else {
    status = 'behind_critical';
    statusLabel = 'Behind Schedule 🚨';
    statusHeadline = `At current pace, finish line overshoots exam date by ${Math.abs(bufferMarginDays)} days`;
  }

  // Color theme per status
  const statusTheme = (() => {
    switch (status) {
      case 'ahead':
        return {
          badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
          badgeBorder: 'border-emerald-500/30',
          badgeText: 'text-emerald-700 dark:text-emerald-300',
          accentColor: '#10B981',
          icon: '⚡'
        };
      case 'on_track':
        return {
          badgeBg: 'bg-blue-500/10 dark:bg-[#7AA2F7]/15',
          badgeBorder: 'border-blue-500/30 dark:border-[#7AA2F7]/30',
          badgeText: 'text-blue-700 dark:text-[#7AA2F7]',
          accentColor: '#2563EB',
          icon: '🎯'
        };
      case 'behind_mild':
        return {
          badgeBg: 'bg-amber-500/10 dark:bg-amber-500/15',
          badgeBorder: 'border-amber-500/30',
          badgeText: 'text-amber-700 dark:text-amber-400',
          accentColor: '#F59E0B',
          icon: '⚠️'
        };
      case 'behind_critical':
      default:
        return {
          badgeBg: 'bg-rose-500/10 dark:bg-rose-500/15',
          badgeBorder: 'border-rose-500/30',
          badgeText: 'text-rose-700 dark:text-rose-400',
          accentColor: '#EF4444',
          icon: '🚨'
        };
    }
  })();

  // Catch-Up Advice Engine
  const dailyDeficit = Math.max(0, Math.round((requiredDailyPace - actualDailyVelocity) * 10) / 10);
  const recommendedDailyTarget = Math.max(requiredDailyPace, Math.round((actualDailyVelocity + dailyDeficit) * 10) / 10);

  const catchUpAdvice: CatchUpAdvice = (() => {
    if (topicsRemaining === 0) {
      return {
        title: 'Mastery Phase Active',
        detail: 'Your syllabus coverage is 100% complete. Transition entirely to timed chapter revisions, formula sheets, and mind maps.',
        dailyDeficit: 0,
        recommendedDailyTarget: 0,
        actionBadge: '🏆 Full Revision Mode'
      };
    }

    if (status === 'ahead') {
      return {
        title: 'Velocity Superpower',
        detail: `You are clearing topics faster than required! You will have ${bufferMarginDays} days of calm, unhurried revision before exam day.`,
        dailyDeficit: 0,
        recommendedDailyTarget: actualDailyVelocity,
        actionBadge: '⚡ Maintain Current Tempo'
      };
    }

    if (status === 'on_track') {
      return {
        title: 'Optimal Momentum',
        detail: `Keep up your current pace of ~${actualDailyVelocity} topics/day (${Math.round(actualDailyVelocity * 7)}/wk). You will safely enter your ${bufferDays}-day revision window on ${finishLineForecastDate}.`,
        dailyDeficit: 0,
        recommendedDailyTarget: requiredDailyPace,
        actionBadge: '🎯 Steady Execution'
      };
    }

    if (status === 'behind_mild') {
      const extraMins = Math.round(dailyDeficit * 40);
      return {
        title: 'Pace Catch-Up Prescription',
        detail: `To protect your full ${bufferDays}-day revision window, complete +${dailyDeficit} extra topic daily (approx. +${Math.max(25, extraMins)} mins study time) or finish 2 extra topics this weekend.`,
        dailyDeficit,
        recommendedDailyTarget,
        actionBadge: `+${dailyDeficit} Topic/Day Needed`
      };
    }

    // behind_critical
    const extraMins = Math.round(dailyDeficit * 40);
    return {
      title: 'Emergency Pacing Realignment',
      detail: `Current completion velocity will push study past the exam date. Increase target to ${requiredDailyPace} topics/day (+${Math.max(35, extraMins)} mins daily) to wrap up before exam week.`,
      dailyDeficit,
      recommendedDailyTarget: requiredDailyPace,
      actionBadge: `🚨 Accelerate to ${requiredDailyPace} Topics/Day`
    };
  })();

  return {
    todayFormatted: formatReadableDate(todayMidnight),
    examDateFormatted: formatReadableDate(targetDate),
    examDateRaw: examDateStr,
    isExamDatePast,
    totalDaysLeft,
    bufferDays,
    studyDaysLeft,
    topicsTotal,
    topicsCompleted,
    topicsRemaining,
    effectiveTopicsRemaining,
    completionPercentage,
    requiredDailyPace,
    requiredWeeklyPace,
    requiredDailyStudyMinutes,
    actualDailyVelocity,
    finishLineForecastDate,
    finishLineForecastISO,
    daysUntilFinish,
    bufferMarginDays,
    status,
    statusLabel,
    statusHeadline,
    statusTheme,
    catchUpAdvice
  };
};

/**
 * Runs a What-If pace simulation for arbitrary daily rates
 */
export const simulateWhatIfPaces = (
  topicsRemaining: number,
  totalDaysLeft: number,
  bufferDays: number
): WhatIfSimulation[] => {
  const paceRates = [1.0, 1.5, 2.0, 3.0];
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return paceRates.map(dailyPace => {
    const daysNeeded = topicsRemaining === 0 ? 0 : Math.ceil(topicsRemaining / dailyPace);
    const forecast = new Date(todayMidnight.getTime() + daysNeeded * 86400000);
    const bufferRemaining = totalDaysLeft - daysNeeded;
    const isSafe = bufferRemaining >= bufferDays;

    let statusText = '';
    if (bufferRemaining >= bufferDays + 5) {
      statusText = `⚡ Finishes very early (+${bufferRemaining - bufferDays}d extra)`;
    } else if (bufferRemaining >= bufferDays) {
      statusText = `🎯 On track (${bufferRemaining}d buffer intact)`;
    } else if (bufferRemaining > 0) {
      statusText = `⚠️ Squeezes buffer (${bufferRemaining}d left)`;
    } else {
      statusText = `🚨 Overshoots by ${Math.abs(bufferRemaining)}d`;
    }

    return {
      dailyPace,
      daysNeeded,
      forecastDateFormatted: formatReadableDate(forecast),
      bufferDaysRemaining: bufferRemaining,
      isSafe,
      statusText
    };
  });
};
