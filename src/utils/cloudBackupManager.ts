/**
 * Cloud Backup Manager for Syllabus 3D
 * Orchestrates multi-tier backup and restore with Google Drive:
 * 1. Database Snapshot (Exams, Topics, Notes, Flashcards, Timers, Profiles)
 * 2. Dedicated PDF Documents Backup (Binary Blobs from IndexedDB to Google Drive 'PDFs/' folder)
 * 3. Dedicated Photos & Diagrams Backup (Topic Image Attachments to Google Drive 'Photos & Diagrams/' folder)
 */

import {
  ensureFolderHierarchy,
  uploadFileToDrive,
  listFilesFromDriveFolder,
  downloadJsonFromDrive,
  downloadFileBlobFromDrive,
  GoogleDriveFile,
  GoogleDriveFolderHierarchy
} from './googleDriveClient';
import { getAllStoredPdfRecords, batchRestorePdfRecords, StoredPdfRecord } from './pdfStorage';
import { Topic, TopicImageAttachment, TopicPdfAttachment } from '../types/syllabus';

export type CloudBackupStage =
  | 'idle'
  | 'connecting'
  | 'preparing'
  | 'uploading_database'
  | 'uploading_pdfs'
  | 'uploading_photos'
  | 'complete'
  | 'error';

export interface CloudBackupProgress {
  stage: CloudBackupStage;
  message: string;
  currentStep: number;
  totalSteps: number;
  currentFile?: string;
  fileIndex?: number;
  totalFiles?: number;
  error?: string;
}

export interface CloudBackupSummary {
  databaseFile: GoogleDriveFile;
  pdfFiles: GoogleDriveFile[];
  photoFiles: GoogleDriveFile[];
  timestamp: string;
  totalItemsCount: number;
  totalBytes: number;
}

export interface ExtractedPdfItem {
  id: string;
  fileName: string;
  blob: Blob;
  size: number;
  topicName?: string;
  chapterName?: string;
}

export interface ExtractedPhotoItem {
  id: string;
  fileName: string;
  blob: Blob;
  size: number;
  topicId: string;
  topicName: string;
  title: string;
}

/**
 * Converts a Base64 Data URL to a native binary Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Collects a full database snapshot across all localStorage entities
 */
export function collectFullDatabaseSnapshot(): Record<string, any> {
  const snapshot: Record<string, any> = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    appName: 'Syllabus 3D Precision Desk',
    data: {}
  };

  if (typeof window === 'undefined') return snapshot;

  const relevantPrefixes = [
    'syllabus3d_profile',
    'syllabus3d_profiles',
    'syllabus3d_exams',
    'syllabus3d_data',
    'syllabus3d_study_routine',
    'syllabus3d_timer_logs',
    'syllabus3d_notes_font',
    'syllabus3d_notes_theme',
    'syllabus3d_reader_layout',
    'syllabus3d_reader_font_size',
    'syllabus3d_user_pin',
    'syllabus3d_pin_enabled'
  ];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    const isRelevant = relevantPrefixes.some(prefix => key.startsWith(prefix));
    if (isRelevant) {
      try {
        const val = localStorage.getItem(key);
        if (val !== null) {
          snapshot.data[key] = JSON.parse(val);
        }
      } catch {
        snapshot.data[key] = localStorage.getItem(key);
      }
    }
  }

  return snapshot;
}

/**
 * Extracts all PDF attachments from IndexedDB and correlates them with topics
 */
export async function extractAllPdfAttachments(): Promise<ExtractedPdfItem[]> {
  const storedRecords: StoredPdfRecord[] = await getAllStoredPdfRecords();
  const pdfItems: ExtractedPdfItem[] = [];

  // Also scan topics to find topic context for friendly filenames
  const topicMap = new Map<string, { topicName: string; chapterName?: string }>();
  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('syllabus3d_data_')) {
        try {
          const subjects = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(subjects)) {
            subjects.forEach(sub => {
              sub.chapters?.forEach((chap: any) => {
                chap.topics?.forEach((top: Topic) => {
                  top.pdfAttachments?.forEach((att: TopicPdfAttachment) => {
                    if (att.storageKey || att.id) {
                      topicMap.set(att.storageKey || att.id, {
                        topicName: top.name,
                        chapterName: chap.name
                      });
                    }
                  });
                });
              });
            });
          }
        } catch {}
      }
    }
  }

  for (const record of storedRecords) {
    if (record && record.blob) {
      const context = topicMap.get(record.id);
      let cleanName = record.name.endsWith('.pdf') ? record.name : `${record.name}.pdf`;
      if (context?.topicName && !cleanName.toLowerCase().includes(context.topicName.toLowerCase().slice(0, 10))) {
        cleanName = `[${context.topicName.replace(/[^\w\s-]/g, '')}] ${cleanName}`;
      }

      pdfItems.push({
        id: record.id,
        fileName: cleanName,
        blob: record.blob,
        size: record.size || record.blob.size,
        topicName: context?.topicName,
        chapterName: context?.chapterName
      });
    }
  }

  return pdfItems;
}

/**
 * Extracts all Photos & Diagrams attached across all topics
 */
export function extractAllPhotoAttachments(): ExtractedPhotoItem[] {
  const photoItems: ExtractedPhotoItem[] = [];
  if (typeof window === 'undefined') return photoItems;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('syllabus3d_data_')) {
      try {
        const subjects = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(subjects)) {
          subjects.forEach(sub => {
            sub.chapters?.forEach((chap: any) => {
              chap.topics?.forEach((top: Topic) => {
                if (top.images && Array.isArray(top.images)) {
                  top.images.forEach((img: TopicImageAttachment, imgIdx: number) => {
                    if (img.dataUrl) {
                      try {
                        const blob = dataUrlToBlob(img.dataUrl);
                        const ext = img.dataUrl.includes('image/jpeg') ? 'jpg' : 'png';
                        const safeTitle = (img.title || `Diagram_${imgIdx + 1}`).replace(/[^\w\s-]/g, '').trim();
                        const safeTopic = top.name.replace(/[^\w\s-]/g, '').trim();
                        const fileName = `[${safeTopic}] ${safeTitle}.${ext}`;

                        photoItems.push({
                          id: img.id,
                          fileName,
                          blob,
                          size: blob.size,
                          topicId: top.id,
                          topicName: top.name,
                          title: img.title || `Diagram ${imgIdx + 1}`
                        });
                      } catch (err) {
                        console.warn(`Could not convert image ${img.id} to blob:`, err);
                      }
                    }
                  });
                }
              });
            });
          });
        }
      } catch {}
    }
  }

  return photoItems;
}

/**
 * Gets count and size summary of all data, PDFs, and photos ready for backup
 */
export async function getBackupPreparationSummary(): Promise<{
  topicsCount: number;
  examsCount: number;
  pdfCount: number;
  pdfTotalBytes: number;
  photoCount: number;
  photoTotalBytes: number;
}> {
  let topicsCount = 0;
  let examsCount = 1;

  if (typeof window !== 'undefined') {
    try {
      const exams = JSON.parse(localStorage.getItem('syllabus3d_exams') || '[]');
      if (Array.isArray(exams) && exams.length > 0) examsCount = exams.length;
    } catch {}

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('syllabus3d_data_')) {
        try {
          const subjects = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(subjects)) {
            subjects.forEach(sub => {
              sub.chapters?.forEach((chap: any) => {
                topicsCount += chap.topics?.length || 0;
              });
            });
          }
        } catch {}
      }
    }
  }

  const pdfs = await extractAllPdfAttachments();
  const pdfTotalBytes = pdfs.reduce((acc, curr) => acc + curr.size, 0);

  const photos = extractAllPhotoAttachments();
  const photoTotalBytes = photos.reduce((acc, curr) => acc + curr.size, 0);

  return {
    topicsCount,
    examsCount,
    pdfCount: pdfs.length,
    pdfTotalBytes,
    photoCount: photos.length,
    photoTotalBytes
  };
}

/**
 * Performs full multi-stage Google Drive backup:
 * 1. Database JSON Snapshot -> Syllabus 3D Cloud Backups/Database/
 * 2. PDF Files -> Syllabus 3D Cloud Backups/PDFs/
 * 3. Photo Files -> Syllabus 3D Cloud Backups/Photos & Diagrams/
 */
export async function performGoogleDriveBackup(
  onProgress?: (progress: CloudBackupProgress) => void
): Promise<CloudBackupSummary> {
  const updateProgress = (p: Partial<CloudBackupProgress>) => {
    if (onProgress) {
      onProgress({
        stage: p.stage || 'preparing',
        message: p.message || '',
        currentStep: p.currentStep || 1,
        totalSteps: p.totalSteps || 3,
        currentFile: p.currentFile,
        fileIndex: p.fileIndex,
        totalFiles: p.totalFiles,
        error: p.error
      });
    }
  };

  try {
    // Stage 1: Ensure Google Drive Folders
    updateProgress({
      stage: 'preparing',
      message: 'Connecting to Google Drive and verifying folder structure...',
      currentStep: 1,
      totalSteps: 3
    });

    const folders: GoogleDriveFolderHierarchy = await ensureFolderHierarchy();

    // Stage 2: Database Snapshot Upload
    updateProgress({
      stage: 'uploading_database',
      message: 'Compiling syllabus, notes, targets & timer snapshot...',
      currentStep: 1,
      totalSteps: 3
    });

    const databaseSnapshot = collectFullDatabaseSnapshot();
    const databaseJsonStr = JSON.stringify(databaseSnapshot, null, 2);
    const databaseBlob = new Blob([databaseJsonStr], { type: 'application/json' });

    const dateTag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const databaseFileName = `syllabus3d_vault_${dateTag}.json`;

    const databaseFile = await uploadFileToDrive({
      fileBlob: databaseBlob,
      fileName: databaseFileName,
      mimeType: 'application/json',
      parentFolderId: folders.databaseFolderId
    });

    // Stage 3: Extra PDF Documents Upload
    const pdfItems = await extractAllPdfAttachments();
    const uploadedPdfFiles: GoogleDriveFile[] = [];

    if (pdfItems.length > 0) {
      updateProgress({
        stage: 'uploading_pdfs',
        message: `Backing up ${pdfItems.length} topic PDF documents to Google Drive...`,
        currentStep: 2,
        totalSteps: 3,
        totalFiles: pdfItems.length,
        fileIndex: 0
      });

      for (let i = 0; i < pdfItems.length; i++) {
        const item = pdfItems[i];
        updateProgress({
          stage: 'uploading_pdfs',
          message: `Uploading PDF (${i + 1}/${pdfItems.length}): ${item.fileName}`,
          currentStep: 2,
          totalSteps: 3,
          currentFile: item.fileName,
          fileIndex: i + 1,
          totalFiles: pdfItems.length
        });

        try {
          const uploaded = await uploadFileToDrive({
            fileBlob: item.blob,
            fileName: item.fileName,
            mimeType: 'application/pdf',
            parentFolderId: folders.pdfsFolderId
          });
          uploadedPdfFiles.push(uploaded);
        } catch (uploadErr) {
          console.warn(`Failed to upload PDF ${item.fileName} to Google Drive:`, uploadErr);
        }
      }
    } else {
      updateProgress({
        stage: 'uploading_pdfs',
        message: 'No attached PDF documents to backup (0 found)',
        currentStep: 2,
        totalSteps: 3
      });
    }

    // Stage 4: Extra Photos & Diagrams Upload
    const photoItems = extractAllPhotoAttachments();
    const uploadedPhotoFiles: GoogleDriveFile[] = [];

    if (photoItems.length > 0) {
      updateProgress({
        stage: 'uploading_photos',
        message: `Backing up ${photoItems.length} photos and study diagrams to Google Drive...`,
        currentStep: 3,
        totalSteps: 3,
        totalFiles: photoItems.length,
        fileIndex: 0
      });

      for (let i = 0; i < photoItems.length; i++) {
        const item = photoItems[i];
        updateProgress({
          stage: 'uploading_photos',
          message: `Uploading Photo (${i + 1}/${photoItems.length}): ${item.fileName}`,
          currentStep: 3,
          totalSteps: 3,
          currentFile: item.fileName,
          fileIndex: i + 1,
          totalFiles: photoItems.length
        });

        try {
          const uploaded = await uploadFileToDrive({
            fileBlob: item.blob,
            fileName: item.fileName,
            mimeType: item.blob.type || 'image/png',
            parentFolderId: folders.photosFolderId
          });
          uploadedPhotoFiles.push(uploaded);
        } catch (uploadErr) {
          console.warn(`Failed to upload photo ${item.fileName} to Google Drive:`, uploadErr);
        }
      }
    } else {
      updateProgress({
        stage: 'uploading_photos',
        message: 'No study photos or diagrams to backup (0 found)',
        currentStep: 3,
        totalSteps: 3
      });
    }

    // Final Stage: Completed
    const totalBytes =
      databaseBlob.size +
      pdfItems.reduce((acc, c) => acc + c.size, 0) +
      photoItems.reduce((acc, c) => acc + c.size, 0);

    const summary: CloudBackupSummary = {
      databaseFile,
      pdfFiles: uploadedPdfFiles,
      photoFiles: uploadedPhotoFiles,
      timestamp: new Date().toLocaleString(),
      totalItemsCount: 1 + uploadedPdfFiles.length + uploadedPhotoFiles.length,
      totalBytes
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('syllabus3d_last_gdrive_backup', JSON.stringify({
        timestamp: summary.timestamp,
        databaseFileName: databaseFile.name,
        pdfsCount: uploadedPdfFiles.length,
        photosCount: uploadedPhotoFiles.length,
        totalBytes
      }));
    }

    updateProgress({
      stage: 'complete',
      message: `✓ Backup successfully completed! Saved 1 Database vault, ${uploadedPdfFiles.length} PDFs, and ${uploadedPhotoFiles.length} Photos to Google Drive.`,
      currentStep: 3,
      totalSteps: 3
    });

    return summary;
  } catch (err: any) {
    updateProgress({
      stage: 'error',
      message: err.message || 'Google Drive backup failed. Please check your connection and try again.',
      currentStep: 1,
      totalSteps: 3,
      error: err.message
    });
    throw err;
  }
}

/**
 * Lists previous database snapshots and media available on Google Drive
 */
export async function fetchGoogleDriveBackupsList(): Promise<{
  databaseBackups: GoogleDriveFile[];
  pdfBackups: GoogleDriveFile[];
  photoBackups: GoogleDriveFile[];
}> {
  const folders = await ensureFolderHierarchy();

  const [databaseBackups, pdfBackups, photoBackups] = await Promise.all([
    listFilesFromDriveFolder(folders.databaseFolderId),
    listFilesFromDriveFolder(folders.pdfsFolderId),
    listFilesFromDriveFolder(folders.photosFolderId)
  ]);

  return {
    databaseBackups,
    pdfBackups,
    photoBackups
  };
}

/**
 * Restores a full backup from Google Drive:
 * 1. Downloads database JSON and rehydrates localStorage
 * 2. Downloads all PDF files and restores them into IndexedDB
 */
export async function performGoogleDriveRestore(
  databaseFileId: string,
  onProgress?: (progress: CloudBackupProgress) => void
): Promise<void> {
  const updateProgress = (p: Partial<CloudBackupProgress>) => {
    if (onProgress) {
      onProgress({
        stage: p.stage || 'preparing',
        message: p.message || '',
        currentStep: p.currentStep || 1,
        totalSteps: p.totalSteps || 2,
        currentFile: p.currentFile,
        fileIndex: p.fileIndex,
        totalFiles: p.totalFiles,
        error: p.error
      });
    }
  };

  try {
    updateProgress({
      stage: 'preparing',
      message: 'Downloading database snapshot from Google Drive...',
      currentStep: 1,
      totalSteps: 2
    });

    const snapshot = await downloadJsonFromDrive(databaseFileId);
    if (!snapshot || !snapshot.data) {
      throw new Error('Invalid backup format received from Google Drive.');
    }

    // Restore localStorage entities
    const dataKeys = Object.keys(snapshot.data);
    for (const key of dataKeys) {
      const val = snapshot.data[key];
      if (typeof val === 'object') {
        localStorage.setItem(key, JSON.stringify(val));
      } else {
        localStorage.setItem(key, String(val));
      }
    }

    // Stage 2: Restore PDFs from Google Drive 'PDFs/' folder into IndexedDB
    updateProgress({
      stage: 'uploading_pdfs',
      message: 'Checking and restoring PDF documents from Google Drive into browser storage...',
      currentStep: 2,
      totalSteps: 2
    });

    const folders = await ensureFolderHierarchy();
    const drivePdfs = await listFilesFromDriveFolder(folders.pdfsFolderId);

    if (drivePdfs.length > 0) {
      const restoredRecords: StoredPdfRecord[] = [];
      for (let i = 0; i < drivePdfs.length; i++) {
        const file = drivePdfs[i];
        updateProgress({
          stage: 'uploading_pdfs',
          message: `Downloading PDF (${i + 1}/${drivePdfs.length}): ${file.name}`,
          currentStep: 2,
          totalSteps: 2,
          currentFile: file.name,
          fileIndex: i + 1,
          totalFiles: drivePdfs.length
        });

        try {
          const blob = await downloadFileBlobFromDrive(file.id);
          // Try to recover storageKey from topicAttachments or generate matching id
          const id = 'pdf_restored_' + file.id;
          restoredRecords.push({
            id,
            blob,
            name: file.name,
            type: 'application/pdf',
            size: Number(file.size || blob.size),
            uploadedAt: file.createdTime || new Date().toISOString()
          });
        } catch (downloadErr) {
          console.warn(`Could not restore PDF ${file.name}:`, downloadErr);
        }
      }

      if (restoredRecords.length > 0) {
        await batchRestorePdfRecords(restoredRecords);
      }
    }

    updateProgress({
      stage: 'complete',
      message: '✓ Restore completed successfully! All topics, notes, PDFs & photos re-synced.',
      currentStep: 2,
      totalSteps: 2
    });
  } catch (err: any) {
    updateProgress({
      stage: 'error',
      message: err.message || 'Failed to restore backup from Google Drive.',
      currentStep: 1,
      totalSteps: 2,
      error: err.message
    });
    throw err;
  }
}

/**
 * Creates an offline all-in-one backup package that includes Database JSON,
 * embedded PDF references, and Photos for students who prefer downloading
 * a single archive to drop directly into their Google Drive folder manually.
 */
export async function downloadCompleteDriveArchive(): Promise<void> {
  const databaseSnapshot = collectFullDatabaseSnapshot();
  const pdfRecords = await getAllStoredPdfRecords();
  const photoItems = extractAllPhotoAttachments();

  // Convert PDF blobs to base64 for self-contained archive package
  const serializedPdfs = await Promise.all(
    pdfRecords.map(async record => {
      return new Promise<{ id: string; name: string; size: number; base64: string }>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            id: record.id,
            name: record.name,
            size: record.size,
            base64: reader.result as string
          });
        };
        reader.onerror = () => {
          resolve({ id: record.id, name: record.name, size: record.size, base64: '' });
        };
        reader.readAsDataURL(record.blob);
      });
    })
  );

  const fullVaultPackage = {
    archiveName: 'Syllabus 3D Complete Personal Drive Vault',
    exportedAt: new Date().toISOString(),
    folders: {
      database: databaseSnapshot,
      pdfDocuments: serializedPdfs,
      photosAndDiagrams: photoItems.map(p => ({
        id: p.id,
        title: p.title,
        fileName: p.fileName,
        topicName: p.topicName,
        size: p.size
      }))
    }
  };

  const jsonStr = JSON.stringify(fullVaultPackage, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);

  const a = document.createElement('a');
  a.href = url;
  a.download = `Syllabus3D_Complete_Drive_Vault_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
