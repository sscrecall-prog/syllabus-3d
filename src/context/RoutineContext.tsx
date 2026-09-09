import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { RoutineSlot, RoutineDay, RoutineTemplate, ALL_ROUTINE_DAYS } from '../types/routine';
import { PROVEN_ROUTINE_TEMPLATES } from '../data/routineTemplates';
import { useSyllabus } from './SyllabusContext';
import { getTodayDateString } from '../utils/dateUtils';
import { soundManager } from '../utils/soundEffects';
import { haptics } from '../utils/haptics';
import confetti from 'canvas-confetti';

interface RoutineContextType {
  routineSlots: RoutineSlot[];
  activeSlot: RoutineSlot | null;
  nextSlot: RoutineSlot | null;
  currentDay: RoutineDay;
  currentTimeString: string;
  todayCompletedSlotIds: string[];
  todayStudySlotsCount: number;
  todayCompletedStudySlotsCount: number;
  todayAdherencePercent: number;
  totalPlannedStudyHours: number;
  addSlot: (slotData: Omit<RoutineSlot, 'id' | 'completedDates'>) => void;
  updateSlot: (slotId: string, slotData: Partial<RoutineSlot>) => void;
  deleteSlot: (slotId: string) => void;
  toggleSlotCompleteToday: (slotId: string) => void;
  applyTemplate: (templateId: string) => void;
  resetTodayRoutine: () => void;
  clearAllSlots: () => void;
}

const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

const dayIndexToRoutineDay: RoutineDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Helper to convert "HH:MM" string to minutes from midnight
export const timeToMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Helper to format minutes duration to e.g. "1h 30m"
export const formatSlotDuration = (startTime: string, endTime: string): string => {
  let start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  if (end < start) end += 24 * 60; // Crosses midnight
  const diff = end - start;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
};

// Helper to format 24h "HH:MM" to 12h "hh:mm AM/PM"
export const format12Hour = (time24: string): string => {
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10) || 0;
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
};

export const RoutineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, activeProfileId } = useSyllabus();

  const storageKey = useMemo(() => {
    return `syllabus3d_routine_${activeProfileId || 'profile_default'}`;
  }, [activeProfileId]);

  // Load initial slots
  const [routineSlots, setRoutineSlots] = useState<RoutineSlot[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    // Seed default with the Early Bird template
    const defaultTpl = PROVEN_ROUTINE_TEMPLATES[0];
    return defaultTpl.slots.map((s, idx) => ({
      ...s,
      id: `slot_seed_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`,
      completedDates: []
    }));
  });

  // Re-load when activeProfileId changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRoutineSlots(parsed);
          return;
        }
      } catch (e) {}
    }
    // Fallback if brand new profile
    const defaultTpl = PROVEN_ROUTINE_TEMPLATES[0];
    setRoutineSlots(defaultTpl.slots.map((s, idx) => ({
      ...s,
      id: `slot_prof_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`,
      completedDates: []
    })));
  }, [storageKey]);

  // Save to localStorage whenever slots change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(routineSlots));
    } catch (e) {}
  }, [routineSlots, storageKey]);

  // Live Clock Tick (Every 15s)
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const currentDay: RoutineDay = useMemo(() => {
    return dayIndexToRoutineDay[now.getDay()];
  }, [now]);

  const currentTimeString = useMemo(() => {
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }, [now]);

  const todayStr = useMemo(() => getTodayDateString(), []);

  // Compute Active & Next Slot
  const { activeSlot, nextSlot } = useMemo(() => {
    const currentMins = timeToMinutes(currentTimeString);
    const todaySlots = routineSlots.filter(s => s.days.includes(currentDay));

    let active: RoutineSlot | null = null;
    let next: RoutineSlot | null = null;
    let minFutureDiff = Infinity;

    for (const slot of todaySlots) {
      const sMins = timeToMinutes(slot.startTime);
      let eMins = timeToMinutes(slot.endTime);
      if (eMins < sMins) eMins += 24 * 60; // overnight slot

      if (currentMins >= sMins && currentMins < eMins) {
        active = slot;
      } else if (sMins > currentMins) {
        const diff = sMins - currentMins;
        if (diff < minFutureDiff) {
          minFutureDiff = diff;
          next = slot;
        }
      }
    }

    return { activeSlot: active, nextSlot: next };
  }, [routineSlots, currentDay, currentTimeString]);

  // Compute Adherence & Stats for Today
  const todayStudySlots = useMemo(() => {
    return routineSlots.filter(s => 
      s.days.includes(currentDay) && s.category !== 'sleep' && s.category !== 'break'
    );
  }, [routineSlots, currentDay]);

  const todayCompletedSlotIds = useMemo(() => {
    return routineSlots
      .filter(s => (s.completedDates || []).includes(todayStr))
      .map(s => s.id);
  }, [routineSlots, todayStr]);

  const todayStudySlotsCount = todayStudySlots.length;
  const todayCompletedStudySlotsCount = todayStudySlots.filter(s => 
    (s.completedDates || []).includes(todayStr)
  ).length;

  const todayAdherencePercent = useMemo(() => {
    if (todayStudySlotsCount === 0) return 0;
    return Math.round((todayCompletedStudySlotsCount / todayStudySlotsCount) * 100);
  }, [todayCompletedStudySlotsCount, todayStudySlotsCount]);

  const totalPlannedStudyHours = useMemo(() => {
    let totalMins = 0;
    todayStudySlots.forEach(s => {
      let start = timeToMinutes(s.startTime);
      let end = timeToMinutes(s.endTime);
      if (end < start) end += 24 * 60;
      totalMins += (end - start);
    });
    return Math.round((totalMins / 60) * 10) / 10;
  }, [todayStudySlots]);

  // Actions
  const addSlot = useCallback((slotData: Omit<RoutineSlot, 'id' | 'completedDates'>) => {
    const newSlot: RoutineSlot = {
      ...slotData,
      id: `slot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      completedDates: []
    };
    setRoutineSlots(prev => [...prev, newSlot]);
    soundManager.playClick();
    haptics.light();
  }, []);

  const updateSlot = useCallback((slotId: string, slotData: Partial<RoutineSlot>) => {
    setRoutineSlots(prev => prev.map(s => s.id === slotId ? { ...s, ...slotData } : s));
    soundManager.playClick();
    haptics.light();
  }, []);

  const deleteSlot = useCallback((slotId: string) => {
    setRoutineSlots(prev => prev.filter(s => s.id !== slotId));
    soundManager.playClick();
    haptics.light();
  }, []);

  const toggleSlotCompleteToday = useCallback((slotId: string) => {
    setRoutineSlots(prev => prev.map(s => {
      if (s.id !== slotId) return s;
      const dates = s.completedDates || [];
      const isCompleted = dates.includes(todayStr);

      if (!isCompleted) {
        soundManager.playCompleteChime();
        haptics.medium();
        confetti({
          particleCount: 40,
          spread: 55,
          origin: { y: 0.75 }
        });
        return {
          ...s,
          completedDates: [...dates, todayStr]
        };
      } else {
        soundManager.playClick();
        haptics.light();
        return {
          ...s,
          completedDates: dates.filter(d => d !== todayStr)
        };
      }
    }));
  }, [todayStr]);

  const applyTemplate = useCallback((templateId: string) => {
    const tpl = PROVEN_ROUTINE_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;

    const newSlots: RoutineSlot[] = tpl.slots.map((s, idx) => ({
      ...s,
      id: `slot_${templateId}_${idx + 1}_${Date.now()}`,
      completedDates: []
    }));

    setRoutineSlots(newSlots);
    soundManager.playCompleteChime();
    haptics.success();
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  const resetTodayRoutine = useCallback(() => {
    setRoutineSlots(prev => prev.map(s => ({
      ...s,
      completedDates: (s.completedDates || []).filter(d => d !== todayStr)
    })));
    soundManager.playClick();
  }, [todayStr]);

  const clearAllSlots = useCallback(() => {
    setRoutineSlots([]);
    soundManager.playClick();
  }, []);

  const value = {
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
  };

  return (
    <RoutineContext.Provider value={value}>
      {children}
    </RoutineContext.Provider>
  );
};

export const useRoutine = (): RoutineContextType => {
  const context = useContext(RoutineContext);
  if (!context) {
    throw new Error('useRoutine must be used within a RoutineProvider');
  }
  return context;
};
