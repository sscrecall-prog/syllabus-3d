/**
 * IndexedDB Core Storage Engine for Relational & Bulk State Entities
 * Provides async persistence with transparent fallback and migration from localStorage.
 */

const DB_NAME = 'syllabus3d_app_db';
const DB_VERSION = 1;

export interface DBEntityStore {
  get<T>(storeName: string, key: string): Promise<T | null>;
  set<T>(storeName: string, key: string, value: T): Promise<void>;
  delete(storeName: string, key: string): Promise<void>;
  clear(storeName: string): Promise<void>;
}

let dbInstance: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const storeNames = ['app_state', 'exams', 'planner_tasks', 'reflections', 'mistakes'];
      storeNames.forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name);
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });

  return dbInstance;
}

export const appDB: DBEntityStore = {
  async get<T>(storeName: string, key: string): Promise<T | null> {
    try {
      const db = await getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve((req.result as T) ?? null);
        req.onerror = () => resolve(null);
      });
    } catch {
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(`${storeName}_${key}`);
        if (raw) {
          try { return JSON.parse(raw); } catch {}
        }
      }
      return null;
    }
  },

  async set<T>(storeName: string, key: string, value: T): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`${storeName}_${key}`, JSON.stringify(value));
        } catch {}
      }
    }
  },

  async delete(storeName: string, key: string): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`${storeName}_${key}`);
      }
    }
  },

  async clear(storeName: string): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {}
  }
};
