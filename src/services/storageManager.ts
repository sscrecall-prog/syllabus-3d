/**
 * ═══════════════════════════════════════════════════════════════
 * HIGH-PERFORMANCE DEBOUNCED STORAGE & SAFETY ENGINE
 * ═══════════════════════════════════════════════════════════════
 * 1. Debounced Batch Persistence: Coalesces rapid keystrokes/state updates (350ms)
 *    to prevent main-thread freeze and CPU throttling during typing.
 * 2. Lifecycle Flusher: Immediately writes pending data on tab close or app switch.
 * 3. QuotaExceeded Protection: Gracefully catches 5MB browser quota errors.
 * 4. Dual-Tier IndexedDB Safety Snapshot: Mirrors full state to IndexedDB asynchronously.
 * 5. Storage Health Telemetry: Computes real-time byte usage & health status.
 * ═══════════════════════════════════════════════════════════════
 */

import { appDB } from './db';

export interface StorageHealthMetrics {
  usedBytes: number;
  usedFormatted: string;
  totalBytes: number;
  totalFormatted: string;
  percentage: number;
  status: 'healthy' | 'moderate' | 'critical';
  lastSnapshotAt: string | null;
  breakdown: {
    exams: number;
    planner: number;
    revisions: number;
    activity: number;
    other: number;
  };
}

export interface FullAppSnapshot {
  version: string;
  timestamp: string;
  exams: any[];
  profile: any;
  achievements: any[];
  activityHistory: any[];
  revisions: any[];
  plannerTasks: any[];
  platforms: any[];
  top3Targets: any[];
  reflectionsHistory: any[];
}

type SaveListener = () => void;

class StorageManager {
  private pendingWrites = new Map<string, any>();
  private debounceTimers = new Map<string, number>();
  private saveListeners = new Set<SaveListener>();
  private isQuotaExceeded = false;
  private isInitialized = false;

  constructor() {
    this.initLifecycleListeners();
  }

  /**
   * Initializes visibilitychange and beforeunload listeners to ensure zero data loss.
   */
  public initLifecycleListeners(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Flush immediately when user minimizes browser, locks phone, or switches tabs
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushAll();
      }
    });

    // Flush immediately before browser window / tab closes
    window.addEventListener('beforeunload', () => {
      this.flushAll();
    });

    // Mobile freeze event
    window.addEventListener('pagehide', () => {
      this.flushAll();
    });
  }

  /**
   * Register a listener notified whenever a debounced save operation completes.
   */
  public onAutoSave(listener: SaveListener): () => void {
    this.saveListeners.add(listener);
    return () => this.saveListeners.delete(listener);
  }

  private notifySave(): void {
    this.saveListeners.forEach(listener => {
      try { listener(); } catch {}
    });
  }

  /**
   * Safely writes to localStorage, catching QuotaExceededError without crashing.
   * On quota limit, automatically triggers auto-healing storage to free space and retries.
   */
  public safeSetItem(key: string, value: any): boolean {
    if (typeof window === 'undefined') return false;

    let serialized: string;
    try {
      serialized = typeof value === 'string' ? value : JSON.stringify(value);
    } catch (serErr) {
      console.warn(`[StorageManager] Serialization failed for key: ${key}`, serErr);
      return false;
    }

    try {
      localStorage.setItem(key, serialized);
      this.isQuotaExceeded = false;
      return true;
    } catch (err: any) {
      const isQuota =
        err &&
        (err.name === 'QuotaExceededError' ||
          err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          err.code === 22 ||
          err.code === 1014);

      if (isQuota) {
        console.warn(`[StorageManager] LocalStorage Quota Exceeded for key: ${key}. Auto-healing storage cache...`);
        // 🛡️ Auto-heal: Purge disposable caches and compact non-critical history
        const healResult = this.autoHealStorage();

        if (healResult.healed) {
          try {
            localStorage.setItem(key, serialized);
            this.isQuotaExceeded = false;
            console.log(`[StorageManager] Successfully saved ${key} after auto-healing (${healResult.freedBytes} bytes freed).`);
            return true;
          } catch {
            // Still full after prune, route to IndexedDB
          }
        }

        this.isQuotaExceeded = true;
      } else {
        console.warn(`[StorageManager] Failed to write to localStorage for key: ${key}`, err);
      }

      // Indestructible fallback: mirror safely to IndexedDB
      try {
        appDB.set('app_state', key, value).catch(() => {});
      } catch {}

      return false;
    }
  }

  /**
   * Debounced save: Coalesces rapid sequential changes (e.g. typing notes, dragging sliders)
   * into a single deferred serialized write. Default debounce: 350ms.
   */
  public debouncedSave(key: string, value: any, delay: number = 350): void {
    this.pendingWrites.set(key, value);

    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer !== undefined) {
      window.clearTimeout(existingTimer);
    }

    const timer = window.setTimeout(() => {
      this.debounceTimers.delete(key);
      this.executeWrite(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Executes a single pending write immediately.
   */
  private executeWrite(key: string): void {
    if (!this.pendingWrites.has(key)) return;

    const value = this.pendingWrites.get(key);
    this.pendingWrites.delete(key);

    const success = this.safeSetItem(key, value);
    if (success) {
      this.notifySave();
    }
  }

  /**
   * Synchronously flushes all pending debounced writes to storage immediately.
   */
  public flushAll(): void {
    this.debounceTimers.forEach(timer => window.clearTimeout(timer));
    this.debounceTimers.clear();

    if (this.pendingWrites.size === 0) return;

    this.pendingWrites.forEach((value, key) => {
      this.safeSetItem(key, value);
    });

    this.pendingWrites.clear();
    this.notifySave();
  }

  /**
   * Computes comprehensive storage usage metrics and health status.
   */
  public getStorageHealthMetrics(): StorageHealthMetrics {
    const totalCapacity = 5 * 1024 * 1024; // 5 MB standard browser limit
    let usedBytes = 0;
    const breakdown = {
      exams: 0,
      planner: 0,
      revisions: 0,
      activity: 0,
      other: 0
    };

    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const val = localStorage.getItem(key) || '';
            const keyBytes = (key.length + val.length) * 2; // UTF-16
            usedBytes += keyBytes;

            if (key.includes('exams')) breakdown.exams += keyBytes;
            else if (key.includes('planner')) breakdown.planner += keyBytes;
            else if (key.includes('revisions')) breakdown.revisions += keyBytes;
            else if (key.includes('activity')) breakdown.activity += keyBytes;
            else breakdown.other += keyBytes;
          }
        }
      } catch {}
    }

    const percentage = Math.min(100, Math.round((usedBytes / totalCapacity) * 1000) / 10);
    const status: StorageHealthMetrics['status'] =
      this.isQuotaExceeded || percentage >= 85 ? 'critical' : percentage >= 60 ? 'moderate' : 'healthy';

    const lastSnapshotAt =
      typeof window !== 'undefined' ? localStorage.getItem('syllabus3d_last_snapshot_at') : null;

    return {
      usedBytes,
      usedFormatted: this.formatBytes(usedBytes),
      totalBytes: totalCapacity,
      totalFormatted: '5.0 MB',
      percentage,
      status,
      lastSnapshotAt,
      breakdown
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Writes an asynchronous safety snapshot to IndexedDB.
   * This is completely detached from localStorage and provides 50MB-1GB+ of bulletproof storage.
   */
  public async createSafetySnapshot(snapshot: FullAppSnapshot): Promise<boolean> {
    try {
      await appDB.set('app_state', 'safety_snapshot_latest', snapshot);
      const nowStr = new Date().toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('syllabus3d_last_snapshot_at', nowStr);
      }
      return true;
    } catch (err) {
      console.warn('[StorageManager] Failed to write safety snapshot to IndexedDB', err);
      return false;
    }
  }

  /**
   * Retrieves the latest automated safety snapshot from IndexedDB.
   */
  public async getLatestSafetySnapshot(): Promise<FullAppSnapshot | null> {
    try {
      return await appDB.get<FullAppSnapshot>('app_state', 'safety_snapshot_latest');
    } catch {
      return null;
    }
  }

  /**
   * 🛡️ AUTO-HEALING STORAGE ENGINE
   * Safely reclaims storage space when quota is nearing limit without touching
   * student syllabus notes, revisions, or mistake logs.
   */
  public autoHealStorage(): { healed: boolean; freedBytes: number; prunedKeys: string[] } {
    if (typeof window === 'undefined') {
      return { healed: false, freedBytes: 0, prunedKeys: [] };
    }

    let freedBytes = 0;
    const prunedKeys: string[] = [];

    // Keys that are strictly PROTECTED from eviction
    const PROTECTED_PREFIXES = [
      'syllabus3d_exams',
      'syllabus3d_revisions',
      'syllabus3d_planner',
      'syllabus3d_profile',
      'syllabus3d_auth',
      'syllabus3d_users',
      'syllabus3d_platforms',
      'syllabus3d_pdf_highlights',
      'syllabus3d_top3',
      'syllabus3d_audio_settings',
      'syllabus3d_theme'
    ];

    const isProtected = (k: string) => PROTECTED_PREFIXES.some(prefix => k.startsWith(prefix));

    try {
      // 1. Evict known disposable / ephemeral keys
      const DISPOSABLE_EXACT_KEYS = [
        'syllabus3d_pwa_dismissed_until',
        'syllabus3d_intro_seen',
        'syllabus_split_study_width_percent',
        'syllabus_split_lecture_width_percent',
        'syllabus3d_notes_font',
        'syllabus3d_notes_theme'
      ];

      for (const key of DISPOSABLE_EXACT_KEYS) {
        const val = localStorage.getItem(key);
        if (val !== null) {
          freedBytes += (key.length + val.length) * 2;
          localStorage.removeItem(key);
          prunedKeys.push(key);
        }
      }

      // 2. Evict transient / scratch / preview cache keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !isProtected(key)) {
          if (
            key.startsWith('temp_') ||
            key.startsWith('cache_') ||
            key.startsWith('scratch_') ||
            key.startsWith('pdf_preview_') ||
            key.startsWith('pdf_canvas_')
          ) {
            keysToRemove.push(key);
          }
        }
      }

      for (const key of keysToRemove) {
        const val = localStorage.getItem(key) || '';
        freedBytes += (key.length + val.length) * 2;
        localStorage.removeItem(key);
        prunedKeys.push(key);
      }

      // 3. Compact historical activity logs (keep latest 40 entries)
      const activityKey = 'syllabus3d_activity';
      const rawActivity = localStorage.getItem(activityKey);
      if (rawActivity) {
        try {
          const acts = JSON.parse(rawActivity);
          if (Array.isArray(acts) && acts.length > 40) {
            const trimmed = acts.slice(-40);
            const serializedTrimmed = JSON.stringify(trimmed);
            const saved = (rawActivity.length - serializedTrimmed.length) * 2;
            if (saved > 0) {
              localStorage.setItem(activityKey, serializedTrimmed);
              freedBytes += saved;
              prunedKeys.push(`${activityKey} (compacted from ${acts.length} to 40)`);
            }
          }
        } catch {}
      }

      // 4. Compact daily reflections history (keep latest 60 days)
      const reflectionsKey = 'syllabus3d_daily_reflections';
      const rawReflections = localStorage.getItem(reflectionsKey);
      if (rawReflections) {
        try {
          const refs = JSON.parse(rawReflections);
          if (Array.isArray(refs) && refs.length > 60) {
            const trimmed = refs.slice(-60);
            const serializedTrimmed = JSON.stringify(trimmed);
            const saved = (rawReflections.length - serializedTrimmed.length) * 2;
            if (saved > 0) {
              localStorage.setItem(reflectionsKey, serializedTrimmed);
              freedBytes += saved;
              prunedKeys.push(`${reflectionsKey} (compacted from ${refs.length} to 60)`);
            }
          }
        } catch {}
      }

      console.info(`[StorageManager] Auto-heal finished. Reclaimed ${this.formatBytes(freedBytes)}.`, prunedKeys);
      return { healed: freedBytes > 0 || prunedKeys.length > 0, freedBytes, prunedKeys };
    } catch (err) {
      console.warn('[StorageManager] Auto-healing encountered an error:', err);
      return { healed: false, freedBytes, prunedKeys };
    }
  }

  /**
   * 🩹 REPAIRS CORRUPT OR MALFORMED STATE
   * Called when a view error boundary catches an unexpected crash.
   * Clears volatile temporary draft state that may have caused unparseable renders.
   */
  public healCorruptState(sectionHint?: string): { repaired: boolean; message: string } {
    if (typeof window === 'undefined') return { repaired: false, message: 'SSR' };

    try {
      // 1. Clear volatile session storage keys that could store corrupt navigation / modal state
      sessionStorage.removeItem('syllabus3d_intro_seen');
      sessionStorage.removeItem('syllabus3d_last_active_subtab');
      sessionStorage.removeItem('syllabus3d_transient_query');

      // 2. Remove any draft scratchpad or corrupt edit keys in localStorage
      const draftKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('draft_note_') || k.startsWith('temp_lecture_'))) {
          draftKeys.push(k);
        }
      }
      draftKeys.forEach(k => localStorage.removeItem(k));

      return {
        repaired: true,
        message: `Section "${sectionHint || 'General'}" state sanitized and repaired successfully.`
      };
    } catch (err: any) {
      return { repaired: false, message: err?.message || 'Repair attempt failed' };
    }
  }

  /**
   * Proactive quota monitor: Checks storage quota via StorageManager API
   * and auto-heals if usage exceeds 85%.
   */
  public async checkStorageHealthAndAutoHeal(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return;

    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.usage) {
        const ratio = estimate.usage / estimate.quota;
        if (ratio > 0.85) {
          console.warn(`[StorageManager] Proactive storage warning: ${(ratio * 100).toFixed(1)}% full. Initiating auto-heal.`);
          this.autoHealStorage();
        }
      }
    } catch {}
  }
}

export const storageManager = new StorageManager();

/**
 * Sanitizes a topic object to guarantee no missing arrays or undefined fields
 * that could cause runtime crashes during rendering.
 */
export function sanitizeTopicData(topic: any): any {
  if (!topic || typeof topic !== 'object') return topic;
  return {
    ...topic,
    lectures: Array.isArray(topic.lectures) ? topic.lectures : [],
    noteItems: Array.isArray(topic.noteItems) ? topic.noteItems : [],
    audioMemos: Array.isArray(topic.audioMemos) ? topic.audioMemos : [],
    pdfAttachments: Array.isArray(topic.pdfAttachments) ? topic.pdfAttachments : [],
    subtopics: Array.isArray(topic.subtopics) ? topic.subtopics : [],
    status: topic.status || 'not_started',
    rating: typeof topic.rating === 'number' ? topic.rating : 0,
    confidence: typeof topic.confidence === 'number' ? topic.confidence : 1
  };
}
