/**
 * IndexedDB storage utility for Audio Voice Notes & Memos.
 * Allows storing, retrieving, and playing voice notes efficiently.
 */

const DB_NAME = 'syllabus3d_audio_store';
const STORE_NAME = 'topic_audio_memos';
const DB_VERSION = 1;

interface StoredAudioRecord {
  id: string;
  blob: Blob;
  title: string;
  duration: number;
  recordedAt: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Saves an Audio Blob to IndexedDB
 */
export async function saveAudioToStorage(
  id: string,
  blob: Blob,
  title: string,
  duration: number
): Promise<string> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record: StoredAudioRecord = {
      id,
      blob,
      title,
      duration,
      recordedAt: new Date().toISOString()
    };

    const req = store.put(record);

    req.onsuccess = () => {
      resolve(id);
    };

    req.onerror = () => {
      reject(req.error || new Error('Failed to save audio memo to storage'));
    };
  });
}

/**
 * Retrieves an Audio Blob URL from IndexedDB
 */
export async function getAudioBlobUrl(id: string): Promise<string | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        const record = req.result as StoredAudioRecord | undefined;
        if (record && record.blob) {
          const blobUrl = URL.createObjectURL(record.blob);
          resolve(blobUrl);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.error('Error getting audio blob URL:', err);
    return null;
  }
}

/**
 * Deletes an Audio memo from IndexedDB
 */
export async function deleteAudioFromStorage(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error deleting audio memo from storage:', err);
  }
}

/**
 * Direct download of an Audio file
 */
export function downloadAudioFile(blobUrl: string, fileName: string): void {
  if (!blobUrl) return;
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName.endsWith('.webm') || fileName.endsWith('.mp3') || fileName.endsWith('.wav')
    ? fileName
    : `${fileName}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Revoke a previously created Blob URL to free memory.
 * Call this in component cleanup / useEffect return.
 */
export function revokeAudioBlobUrl(url: string | null): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
