/**
 * IndexedDB storage utility for large PDF files.
 * Allows storing, retrieving, and opening PDF files directly in a new tab in Chrome.
 */

const DB_NAME = 'syllabus3d_pdf_store';
const STORE_NAME = 'topic_pdfs';
const DB_VERSION = 1;

interface StoredPdfRecord {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
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
 * Saves a PDF File or Blob to IndexedDB
 */
export async function savePdfToStorage(id: string, file: File | Blob, name: string): Promise<string> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record: StoredPdfRecord = {
      id,
      blob: file,
      name,
      type: file.type || 'application/pdf',
      size: file.size,
      uploadedAt: new Date().toISOString()
    };

    const req = store.put(record);

    req.onsuccess = () => {
      resolve(id);
    };

    req.onerror = () => {
      reject(req.error || new Error('Failed to save PDF to storage'));
    };
  });
}

/**
 * Retrieves a PDF Blob URL from IndexedDB
 */
export async function getPdfBlobUrl(id: string): Promise<string | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        const record = req.result as StoredPdfRecord | undefined;
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
    console.error('Error getting PDF Blob URL:', err);
    return null;
  }
}

/**
 * Deletes a PDF from IndexedDB
 */
export async function deletePdfFromStorage(id: string): Promise<void> {
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
    console.error('Error deleting PDF from storage:', err);
  }
}

/**
 * Open any PDF (Blob URL, Data URL, or HTTP URL) in a new Chrome tab for viewing
 */
export function openPdfInNewTab(url: string, _title?: string): void {
  if (!url) return;

  const newTab = window.open(url, '_blank', 'noopener,noreferrer');
  if (newTab) {
    newTab.focus();
  } else {
    // If popup blocked, create a temporary target=_blank link and click it
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Direct download of a PDF file
 */
export function downloadPdfFile(url: string, fileName: string): void {
  if (!url) return;
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Revoke a previously created Blob URL to free memory.
 * Call this in component cleanup / useEffect return.
 */
export function revokePdfBlobUrl(url: string | null): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
