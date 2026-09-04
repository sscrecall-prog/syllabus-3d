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
   */
  public safeSetItem(key: string, value: any): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
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
        console.warn(`[StorageManager] LocalStorage Quota Exceeded for key: ${key}. Routing to IndexedDB backup.`);
        this.isQuotaExceeded = true;
      } else {
        console.warn(`[StorageManager] Failed to write to localStorage for key: ${key}`, err);
      }

      // Automatically fallback-write to IndexedDB
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
}

export const storageManager = new StorageManager();
