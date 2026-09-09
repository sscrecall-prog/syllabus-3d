import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  Sparkles,
  Printer,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  Flame,
  ChevronRight,
  Play,
  Pencil,
  Trash2,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Coffee,
  BookOpen,
  CheckSquare,
  Square,
  AlertCircle,
  ExternalLink,
  Target
} from 'lucide-react';
import {
  RoutineSlot,
  RoutineDay,
  ALL_ROUTINE_DAYS,
  CATEGORY_CONFIG,
  RoutineSlotCategory
} from '../../types/routine';
import {
  useRoutine,
  formatSlotDuration,
  format12Hour,
  timeToMinutes
} from '../../context/RoutineContext';
import { RoutineSlotModal } from './RoutineSlotModal';
import { RoutineTemplatesModal } from './RoutineTemplatesModal';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

interface RoutineMakerViewProps {
  onOpenFocusChamber?: (topicId?: string) => void;
}

export const RoutineMakerView: React.FC<RoutineMakerViewProps> = ({
  onOpenFocusChamber
}) => {
  const {
    routineSlots,
    activeSlot,
    nextSlot,
    currentDay,
    currentTimeString,
    todayCompletedSlotIds,
    todayStudySlotsCount,
    todayCompletedStudySlotsCount,
    todayAdherencePercent,
    totalPlannedStudyHours,
    addSlot,
    updateSlot,
    deleteSlot,
    toggleSlotCompleteToday,
    applyTemplate,
    resetTodayRoutine,
    clearAllSlots
  } = useRoutine();

  const [selectedDayFilter, setSelectedDayFilter] = useState<RoutineDay | 'all'>('all');
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<RoutineSlot | null>(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  // Filter slots by selected day and sort chronologically by startTime
  const filteredSortedSlots = useMemo(() => {
    let slots = [...routineSlots];
    if (selectedDayFilter !== 'all') {
      slots = slots.filter(s => s.days.includes(selectedDayFilter));
    }
    return slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [routineSlots, selectedDayFilter]);

  // Group slots into 4 day phases
  const phaseGroups = useMemo(() => {
    const morning: RoutineSlot[] = [];
    const afternoon: RoutineSlot[] = [];
    const evening: RoutineSlot[] = [];
    const night: RoutineSlot[] = [];

    filteredSortedSlots.forEach(slot => {
      const mins = timeToMinutes(slot.startTime);
      if (mins >= 300 && mins < 720) {
        // 05:00 - 11:59
        morning.push(slot);
      } else if (mins >= 720 && mins < 1020) {
        // 12:00 - 16:59
        afternoon.push(slot);
      } else if (mins >= 1020 && mins < 1260) {
        // 17:00 - 20:59
        evening.push(slot);
      } else {
        // 21:00 - 04:59
        night.push(slot);
      }
    });

    return [
      {
        id: 'morning',
        title: 'Morning Focus & Concept Blocks',
        timeRange: '05:00 AM - 12:00 PM',
        icon: Sunrise,
        iconColor: 'text-amber-500 bg-amber-500/15 border-amber-500/30',
        slots: morning
      },
      {
        id: 'afternoon',
        title: 'Afternoon Practice & Speed Sprints',
        timeRange: '12:00 PM - 05:00 PM',
        icon: Sun,
        iconColor: 'text-orange-500 bg-orange-500/15 border-orange-500/30',
        slots: afternoon
      },
      {
        id: 'evening',
        title: 'Evening Deep Work & Subject Mastery',
        timeRange: '05:00 PM - 09:00 PM',
        icon: Sunset,
        iconColor: 'text-indigo-500 bg-indigo-500/15 border-indigo-500/30',
        slots: evening
      },
      {
        id: 'night',
        title: 'Night Recall, Reflection & Rest',
        timeRange: '09:00 PM - 05:00 AM',
        icon: Moon,
        iconColor: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
        slots: night
      }
    ];
  }, [filteredSortedSlots]);

  // Calculate remaining minutes in current active slot
  const activeRemainingMins = useMemo(() => {
    if (!activeSlot) return 0;
    let endMins = timeToMinutes(activeSlot.endTime);
    const currMins = timeToMinutes(currentTimeString);
    if (endMins < timeToMinutes(activeSlot.startTime)) endMins += 24 * 60;
    return Math.max(0, endMins - currMins);
  }, [activeSlot, currentTimeString]);

  const handlePrint = () => {
    soundManager.playClick();
    window.print();
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in print:space-y-2">
      
      {/* ═════════════════ 1. EXECUTIVE ROUTINE HEADER ═════════════════ */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#12141F] border border-slate-200/80 dark:border-white/10 shadow-subtle-depth relative overflow-hidden print:border-none print:shadow-none print:p-0">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none print:hidden" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none print:hidden" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/25 shrink-0 print:hidden">
              <Clock className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Master Daily Routine & Timetable
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 shrink-0">
                  {routineSlots.length} Blocks Configured
                </span>
              </div>

              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 font-medium line-clamp-1">
                Time-blocked daily schedule for uninterrupted focus, revision sprints, and maximum retention
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 flex-wrap shrink-0 print:hidden">
            <button
              onClick={() => {
                soundManager.playClick();
                setIsTemplatesModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Proven Templates</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
              title="Print Desk Routine Cheatsheet"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Cheatsheet</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setEditingSlot(null);
                setIsSlotModalOpen(true);
              }}
              className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Custom Slot</span>
            </button>
          </div>
        </div>

        {/* ═════════ Concise Metric Strip ═════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-white/10 relative z-10 print:hidden">
          {/* Daily Adherence */}
          <div className="p-3 rounded-xl sm:rounded-2xl bg-slate-50/90 dark:bg-[#181B2B] border border-slate-200/70 dark:border-white/10 space-y-0.5">
            <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
              Discipline Score
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-xl font-black font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                {todayAdherencePercent}%
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono">
                ({todayCompletedStudySlotsCount}/{todayStudySlotsCount} Done)
              </span>
            </div>
          </div>

          {/* Planned Hours */}
          <div className="p-3 rounded-xl sm:rounded-2xl bg-slate-50/90 dark:bg-[#181B2B] border border-slate-200/70 dark:border-white/10 space-y-0.5">
            <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
              Today's Study Load
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {totalPlannedStudyHours}h
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                Deep Work
              </span>
            </div>
          </div>

          {/* Today's Day */}
          <div className="p-3 rounded-xl sm:rounded-2xl bg-slate-50/90 dark:bg-[#181B2B] border border-slate-200/70 dark:border-white/10 space-y-0.5">
            <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
              Today
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-xl font-black font-mono text-amber-500 tabular-nums">
                {currentDay}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono">
                {currentTimeString}
              </span>
            </div>
          </div>

          {/* Reset Quick Action */}
          <div className="p-3 rounded-xl sm:rounded-2xl bg-slate-50/90 dark:bg-[#181B2B] border border-slate-200/70 dark:border-white/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                Daily Tracker
              </span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {todayCompletedStudySlotsCount > 0 ? 'In Progress' : 'Fresh Day'}
              </p>
            </div>
            {todayCompletedStudySlotsCount > 0 && (
              <button
                onClick={resetTodayRoutine}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center gap-1"
                title="Reset completed checkmarks for today"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═════════════════ 2. LIVE ACTIVE SLOT SPOTLIGHT HUD ═════════════════ */}
      {activeSlot ? (
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#FFFDF8] via-[#FAF3E3] to-[#F5E8CF] dark:from-blue-900/40 dark:via-indigo-900/30 dark:to-purple-900/30 border-2 border-[#E1A837] dark:border-blue-500/50 shadow-xl shadow-[#E1A837]/10 dark:shadow-blue-500/10 relative overflow-hidden animate-fade-in print:hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E1A837] via-[#C99126] to-[#8D7A02] dark:from-cyan-400 dark:via-blue-500 dark:to-indigo-500" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#E1A837] dark:bg-blue-500 text-[#38370D] dark:text-white shadow-xs animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38370D] dark:bg-white animate-ping" />
                  CURRENT ACTIVE STUDY SLOT
                </span>

                <span className="text-xs font-mono font-bold text-[#8D7A02] dark:text-cyan-300">
                  {format12Hour(activeSlot.startTime)} - {format12Hour(activeSlot.endTime)} ({formatSlotDuration(activeSlot.startTime, activeSlot.endTime)})
                </span>

                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E1A837]/20 dark:bg-white/10 text-[#38370D] dark:text-white border border-[#E1A837]/40 dark:border-transparent font-mono">
                  ⏳ {activeRemainingMins} mins remaining
                </span>
              </div>

              <h2 className="text-lg sm:text-2xl font-black text-[#38370D] dark:text-white tracking-tight truncate">
                {activeSlot.title}
              </h2>

              {activeSlot.notes && (
                <p className="text-xs text-[#524F18] dark:text-blue-100/90 font-semibold line-clamp-1">
                  💡 Strategy: {activeSlot.notes}
                </p>
              )}
            </div>

            {/* Quick Actions for Active Slot */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => toggleSlotCompleteToday(activeSlot.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  todayCompletedSlotIds.includes(activeSlot.id)
                    ? 'bg-emerald-600 text-white font-black shadow-md'
                    : 'bg-[#FFFDF8] hover:bg-[#F5E8CF] text-[#38370D] border border-[#E6D3B1] dark:bg-white/15 dark:hover:bg-white/25 dark:text-white dark:border-white/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{todayCompletedSlotIds.includes(activeSlot.id) ? 'Completed Today! ✨' : 'Mark Done'}</span>
              </button>

              {onOpenFocusChamber && (
                <button
                  onClick={() => onOpenFocusChamber(activeSlot.topicName)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#E1A837] to-[#C99126] hover:from-[#D19827] hover:to-[#B8801A] text-[#38370D] font-black text-xs shadow-md shadow-[#E1A837]/25 dark:from-emerald-500 dark:to-teal-500 dark:text-slate-950 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 border border-[#8D7A02]/30 dark:border-transparent"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Focus Chamber</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : nextSlot ? (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#151726] border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 animate-fade-in print:hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 shrink-0">
              NEXT UP
            </span>
            <span className="font-mono font-bold text-xs text-slate-500 dark:text-slate-400 shrink-0">
              {format12Hour(nextSlot.startTime)}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
              {nextSlot.title}
            </span>
          </div>

          <span className="text-[11px] font-mono font-semibold text-slate-400 shrink-0">
            Duration: {formatSlotDuration(nextSlot.startTime, nextSlot.endTime)}
          </span>
        </div>
      ) : null}

      {/* ═════════════════ 3. DAY SELECTOR FILTER STRIP ═════════════════ */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar print:hidden">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#151622] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs shrink-0">
          <button
            onClick={() => {
              soundManager.playClick();
              setSelectedDayFilter('all');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedDayFilter === 'all'
                ? 'bg-white dark:bg-[#202234] text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Days ({routineSlots.length})
          </button>

          {ALL_ROUTINE_DAYS.map(day => {
            const isToday = day === currentDay;
            const isSelected = selectedDayFilter === day;
            const count = routineSlots.filter(s => s.days.includes(day)).length;
            return (
              <button
                key={day}
                onClick={() => {
                  soundManager.playClick();
                  setSelectedDayFilter(day);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white font-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{day}</span>
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Today" />
                )}
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {routineSlots.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all routine slots?')) {
                clearAllSlots();
              }
            }}
            className="px-2.5 py-1 text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
          >
            Clear All
          </button>
        )}
      </div>

      {/* ═════════════════ 4. PHASE-WISE TIMELINE & SLOTS ═════════════════ */}
      {filteredSortedSlots.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-12 text-center rounded-2xl sm:rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-[#12141F]/50 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-3xl">
            ⏰
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              No Routine Slots for {selectedDayFilter === 'all' ? 'Your Schedule' : selectedDayFilter}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Build your customized study routine or start with one of our 5 battle-tested aspirant routines.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsTemplatesModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Choose a Proven Template</span>
            </button>
            <button
              onClick={() => {
                setEditingSlot(null);
                setIsSlotModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Slot</span>
            </button>
          </div>
        </div>
      ) : (
        /* Phase Groups */
        <div className="space-y-6 print:space-y-4">
          {phaseGroups.map(group => {
            if (group.slots.length === 0) return null;
            const Icon = group.icon;
            return (
              <div key={group.id} className="space-y-3">
                {/* Phase Header */}
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border ${group.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                      {group.title}
                    </h3>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                    {group.timeRange} • {group.slots.length} Blocks
                  </span>
                </div>

                {/* Slots Grid */}
                <div className="grid grid-cols-1 gap-2.5">
                  {group.slots.map(slot => {
                    const cfg = CATEGORY_CONFIG[slot.category];
                    const isCompleted = todayCompletedSlotIds.includes(slot.id);
                    const isCurrentlyActive = activeSlot?.id === slot.id;

                    return (
                      <div
                        key={slot.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                          isCurrentlyActive
                            ? 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/60 ring-1 ring-blue-500/40 shadow-md'
                            : isCompleted
                            ? 'bg-slate-50/70 dark:bg-[#141624] border-slate-200/70 dark:border-white/5 opacity-80'
                            : 'bg-white dark:bg-[#161826] border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-xs'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          
                          {/* Left: Timing & Details */}
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {/* Checkbox for Today */}
                            <button
                              type="button"
                              onClick={() => toggleSlotCompleteToday(slot.id)}
                              className={`p-1 rounded-xl transition-transform active:scale-90 cursor-pointer shrink-0 mt-0.5 ${
                                isCompleted
                                  ? 'text-emerald-500 dark:text-emerald-400'
                                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                              }`}
                              title={isCompleted ? 'Completed today! Click to uncheck' : 'Mark as completed today'}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 fill-emerald-500/20 stroke-[2.5]" />
                              ) : (
                                <div className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500 transition-colors" />
                              )}
                            </button>

                            <div className="space-y-1 min-w-0 flex-1">
                              {/* Meta Row: Time, Category & Subject */}
                              <div className="flex items-center gap-2 flex-wrap text-xs">
                                <span className="font-mono font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                                  {format12Hour(slot.startTime)} - {format12Hour(slot.endTime)}
                                </span>

                                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                  ({formatSlotDuration(slot.startTime, slot.endTime)})
                                </span>

                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfg.badgeBg}`}>
                                  {cfg.icon} {cfg.label}
                                </span>

                                {slot.subjectName && (
                                  <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                    <span
                                      className="w-2 h-2 rounded-full shrink-0"
                                      style={{ backgroundColor: slot.subjectColor || '#3B82F6' }}
                                    />
                                    <span>{slot.subjectName}</span>
                                  </span>
                                )}

                                {isCurrentlyActive && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-blue-500 text-white animate-pulse">
                                    CURRENT
                                  </span>
                                )}
                              </div>

                              {/* Slot Title */}
                              <h4 className={`text-xs sm:text-sm font-bold text-slate-900 dark:text-white ${isCompleted ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}>
                                {slot.title}
                              </h4>

                              {/* Strategy / Notes */}
                              {slot.notes && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                  💡 {slot.notes}
                                </p>
                              )}

                              {/* Sub-goals / Checklists */}
                              {slot.checklists && slot.checklists.length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap pt-1">
                                  {slot.checklists.map((target, tIdx) => (
                                    <span
                                      key={tIdx}
                                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-[10px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10"
                                    >
                                      ✓ {target}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Days Pills & Actions */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-white/5">
                            {/* Days Pills */}
                            <div className="flex items-center gap-0.5">
                              {ALL_ROUTINE_DAYS.map(day => {
                                const isDayActive = slot.days.includes(day);
                                return (
                                  <span
                                    key={day}
                                    className={`w-5 h-5 text-[9px] font-mono font-bold rounded flex items-center justify-center ${
                                      isDayActive
                                        ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 font-black'
                                        : 'text-slate-300 dark:text-slate-700'
                                    }`}
                                  >
                                    {day[0]}
                                  </span>
                                );
                              })}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              {onOpenFocusChamber && slot.category !== 'sleep' && slot.category !== 'break' && (
                                <button
                                  type="button"
                                  onClick={() => onOpenFocusChamber(slot.title)}
                                  className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                                  title="Launch Focus Chamber with this slot"
                                >
                                  <Play className="w-4 h-4 fill-current" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  soundManager.playClick();
                                  setEditingSlot(slot);
                                  setIsSlotModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                title="Edit Slot"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Delete "${slot.title}"?`)) {
                                    deleteSlot(slot.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Delete Slot"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═════════════════ MODALS ═════════════════ */}
      <RoutineSlotModal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        onSave={slotData => {
          if (editingSlot) {
            updateSlot(editingSlot.id, slotData);
          } else {
            addSlot(slotData);
          }
        }}
        editingSlot={editingSlot}
      />

      <RoutineTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onApplyTemplate={tplId => applyTemplate(tplId)}
        currentSlotsCount={routineSlots.length}
      />

    </div>
  );
};
