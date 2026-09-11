/**
 * ═══════════════════════════════════════════════════════════════
 * CLOUD SERVER SYNC SERVICE (FIRESTORE & CROSS-DEVICE RECOVERY)
 * ═══════════════════════════════════════════════════════════════
 * Manages full synchronization of exams, syllabus progress, custom notes,
 * revisions, targets, and profiles directly with Google Cloud Firestore.
 * 
 * Enables students to log in with Gmail on any device and immediately
 * restore and sync their entire study workspace from the cloud server.
 * ═══════════════════════════════════════════════════════════════
 */

import { doc, getDoc, setDoc, deleteDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { initFirebase, isFirebaseConfigured } from './firebase';
import { FullAppSnapshot } from './storageManager';

export type CloudSyncStatus = 'synced' | 'syncing' | 'offline' | 'local_only' | 'error';

export interface CloudSyncResult {
  success: boolean;
  error?: string;
  timestamp?: string;
  source?: 'firestore' | 'vault';
}

const CLOUD_VAULT_PREFIX = 'syllabus3d_cloud_vault_';

/**
 * Fetch a student's full syllabus dataset from the cloud server
 */
export async function fetchUserCloudData(uid: string): Promise<FullAppSnapshot | null> {
  if (!uid) return null;

  const { db, isConfigured } = initFirebase();

  // 1. If Firebase Cloud Firestore is configured, fetch from the real server
  if (isConfigured && db) {
    try {
      const docRef = doc(db, 'users', uid, 'data', 'syllabusData');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.snapshot) {
          return data.snapshot as FullAppSnapshot;
        }
        return data as FullAppSnapshot;
      }
      return null;
    } catch (err: any) {
      console.warn('Error fetching from Firestore, falling back to local vault:', err?.message);
    }
  }

  // 2. Fallback / Cloud Vault (persistent browser vault per user ID)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`${CLOUD_VAULT_PREFIX}${uid}`);
      if (stored) {
        return JSON.parse(stored) as FullAppSnapshot;
      }
    } catch (e) {}
  }

  return null;
}

/**
 * Upload a fresh snapshot of the student's study data to the cloud server
 */
export async function saveUserCloudData(
  uid: string,
  snapshot: FullAppSnapshot
): Promise<CloudSyncResult> {
  if (!uid) {
    return { success: false, error: 'User ID is required for cloud synchronization.' };
  }

  const { db, isConfigured } = initFirebase();
  const now = new Date().toISOString();

  // Always update the persistent vault as an offline safeguard
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${CLOUD_VAULT_PREFIX}${uid}`, JSON.stringify(snapshot));
    } catch (e) {}
  }

  // 1. If Firebase is configured, persist to Google Cloud Firestore server
  if (isConfigured && db) {
    try {
      const docRef = doc(db, 'users', uid, 'data', 'syllabusData');
      await setDoc(
        docRef,
        {
          snapshot,
          version: snapshot.version || '3.0.0',
          updatedAt: now,
          examsCount: snapshot.exams?.length || 0,
          notesTimestamp: now
        },
        { merge: true }
      );

      return {
        success: true,
        timestamp: now,
        source: 'firestore'
      };
    } catch (err: any) {
      console.error('Firestore save failed:', err);
      return {
        success: false,
        error: err?.message || 'Failed to save to Firestore server.',
        timestamp: now,
        source: 'vault'
      };
    }
  }

  // 2. Simulated Cloud Vault Mode (when custom API keys are not yet configured)
  return {
    success: true,
    timestamp: now,
    source: 'vault'
  };
}

/**
 * Real-time subscription to cloud changes across tabs or devices
 */
export function subscribeUserCloudData(
  uid: string,
  onUpdate: (data: FullAppSnapshot) => void
): Unsubscribe | (() => void) {
  if (!uid) return () => {};

  const { db, isConfigured } = initFirebase();

  if (isConfigured && db) {
    try {
      const docRef = doc(db, 'users', uid, 'data', 'syllabusData');
      return onSnapshot(
        docRef,
        snapshot => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const fullData = (data?.snapshot || data) as FullAppSnapshot;
            onUpdate(fullData);
          }
        },
        error => {
          console.warn('Firestore real-time subscription error:', error);
        }
      );
    } catch (err) {
      console.warn('Could not establish real-time subscription:', err);
    }
  }

  // Multi-tab storage listener for local vault
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === `${CLOUD_VAULT_PREFIX}${uid}` && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        onUpdate(parsed);
      } catch {}
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }

  return () => {};
}

/**
 * Delete a user's dataset from the cloud server
 */
export async function deleteUserCloudData(uid: string): Promise<CloudSyncResult> {
  if (!uid) return { success: false, error: 'User ID is required.' };

  const { db, isConfigured } = initFirebase();

  if (isConfigured && db) {
    try {
      const docRef = doc(db, 'users', uid, 'data', 'syllabusData');
      await deleteDoc(docRef);
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(`${CLOUD_VAULT_PREFIX}${uid}`);
  }

  return { success: true };
}
