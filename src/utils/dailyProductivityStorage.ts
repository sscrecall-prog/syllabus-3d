import { Top3Target, DailyReflection } from '../types/syllabus';

const TOP3_STORAGE_KEY = 'syllabus3d_daily_top3_targets_v1';
const REFLECTIONS_STORAGE_KEY = 'syllabus3d_reflections_history_v1';

export const getTodayDateKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export interface StoredTop3Data {
  date: string; // YYYY-MM-DD
  targets: Top3Target[];
}

const createDefaultTargets = (): Top3Target[] => [
  { id: 'target-1', text: '', completed: false },
  { id: 'target-2', text: '', completed: false },
  { id: 'target-3', text: '', completed: false }
];

export const loadStoredTop3Targets = (): Top3Target[] => {
  try {
    const raw = localStorage.getItem(TOP3_STORAGE_KEY);
    if (!raw) return createDefaultTargets();

    const data: StoredTop3Data = JSON.parse(raw);
    const today = getTodayDateKey();

    // If it's a new day, auto-archive previous day's targets into history if needed, and reset 3 slots
    if (data.date !== today) {
      const resetTargets = createDefaultTargets();
      saveStoredTop3Targets(resetTargets);
      return resetTargets;
    }

    // Ensure exactly 3 slots exist
    if (!Array.isArray(data.targets) || data.targets.length !== 3) {
      return createDefaultTargets();
    }

    return data.targets;
  } catch (e) {
    console.error('Failed to load Top 3 targets from localStorage:', e);
    return createDefaultTargets();
  }
};

export const saveStoredTop3Targets = (targets: Top3Target[]): void => {
  try {
    const data: StoredTop3Data = {
      date: getTodayDateKey(),
      targets
    };
    localStorage.setItem(TOP3_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save Top 3 targets to localStorage:', e);
  }
};

export const loadStoredReflections = (): DailyReflection[] => {
  try {
    const raw = localStorage.getItem(REFLECTIONS_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('Failed to load daily reflections history:', e);
    return [];
  }
};

export const saveStoredReflection = (reflection: DailyReflection): DailyReflection[] => {
  try {
    const existing = loadStoredReflections();
    // Replace if reflection for today already exists, otherwise prepend
    const filtered = existing.filter(r => r.date !== reflection.date);
    const updated = [reflection, ...filtered];
    localStorage.setItem(REFLECTIONS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save daily reflection:', e);
    return [];
  }
};

export const deleteStoredReflection = (id: string): DailyReflection[] => {
  try {
    const existing = loadStoredReflections();
    const updated = existing.filter(r => r.id !== id);
    localStorage.setItem(REFLECTIONS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete daily reflection:', e);
    return [];
  }
};
