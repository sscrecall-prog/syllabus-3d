/**
 * ═══════════════════════════════════════════════════════════════
 * GOOGLE DRIVE CLOUD BACKUP CONTEXT & AUTO-SYNC ENGINE
 * ═══════════════════════════════════════════════════════════════
 * Manages OAuth connection status, automated background cloud
 * persistence, Google Drive backup listing, and 1-click restore.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  googleDriveService,
  GoogleDriveUser,
  DriveBackupFile,
  DriveSyncConfig,
  DEFAULT_DRIVE_CONFIG
} from '../services/googleDriveService';
import { storageManager } from '../services/storageManager';
import { useSyllabus } from './SyllabusContext';
import { soundManager } from '../utils/soundEffects';
import { haptics } from '../utils/haptics';

export type DriveSyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface GoogleDriveContextValue {
  isDriveConnected: boolean;
  connectedUser: GoogleDriveUser | null;
  config: DriveSyncConfig;
  syncStatus: DriveSyncStatus;
  isSyncing: boolean;
  lastSyncError: string | null;
  availableBackups: DriveBackupFile[];
  isLoadingBackups: boolean;
  connectDrive: (clientIdOverride?: string) => Promise<{ success: boolean; error?: string }>;
  disconnectDrive: () => void;
  toggleAutoBackup: (enabled: boolean) => void;
  setBackupFrequency: (freq: 'realtime_debounced' | 'daily_end' | 'manual') => void;
  setCustomClientId: (clientId: string) => void;
  backupNow: (isAuto?: boolean) => Promise<{ success: boolean; error?: string }>;
  restoreFromCloud: (fileId: string) => Promise<boolean>;
  refreshBackupsList: () => Promise<void>;
  deleteCloudBackup: (fileId: string) => Promise<boolean>;
  triggerMilestoneBackup: (reason: string) => Promise<void>;
}

const GoogleDriveContext = createContext<GoogleDriveContextValue | null>(null);

export const GoogleDriveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { exportData, importData } = useSyllabus();

  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(() => googleDriveService.isConnected());
  const [connectedUser, setConnectedUser] = useState<GoogleDriveUser | null>(() => googleDriveService.getConnectedUser());
  const [config, setConfig] = useState<DriveSyncConfig>(() => googleDriveService.getConfig());
  const [syncStatus, setSyncStatus] = useState<DriveSyncStatus>('idle');
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [availableBackups, setAvailableBackups] = useState<DriveBackupFile[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState<boolean>(false);

  // Debounce ref for background auto-saves (throttled to 2 minutes between cloud uploads)
  const lastAutoBackupTimeRef = useRef<number>(0);
  const autoBackupTimerRef = useRef<number | null>(null);

  // Refresh available backups from Google Drive
  const refreshBackupsList = useCallback(async () => {
    if (!googleDriveService.isConnected()) {
      setAvailableBackups([]);
      return;
    }
    setIsLoadingBackups(true);
    try {
      const files = await googleDriveService.listBackups();
      setAvailableBackups(files);
    } catch {
      setAvailableBackups([]);
    } finally {
      setIsLoadingBackups(false);
    }
  }, []);

  // Connect Google Drive
  const connectDrive = async (clientIdOverride?: string): Promise<{ success: boolean; error?: string }> => {
    setSyncStatus('syncing');
    setLastSyncError(null);

    const result = await googleDriveService.requestAuth(clientIdOverride);
    if (result.success && result.user) {
      setIsDriveConnected(true);
      setConnectedUser(result.user);
      setConfig(googleDriveService.getConfig());
      setSyncStatus('synced');
      soundManager.playCompleteChime();
      haptics.success();

      // Refresh list
      await refreshBackupsList();
      setTimeout(() => setSyncStatus('idle'), 3000);
      return { success: true };
    } else {
      setIsDriveConnected(false);
      setSyncStatus('error');
      setLastSyncError(result.error || 'Failed to connect Google Drive.');
      soundManager.playError();
      haptics.error();
      return { success: false, error: result.error };
    }
  };

  // Disconnect Google Drive
  const disconnectDrive = () => {
    googleDriveService.disconnect();
    setIsDriveConnected(false);
    setConnectedUser(null);
    setConfig(googleDriveService.getConfig());
    setAvailableBackups([]);
    setSyncStatus('idle');
    setLastSyncError(null);
    soundManager.playClick();
  };

  // Toggle Auto-Backup
  const toggleAutoBackup = (enabled: boolean) => {
    const updated = googleDriveService.saveConfig({ isAutoBackup: enabled });
    setConfig(updated);
    soundManager.playClick();
    if (enabled) {
      haptics.success();
      // If newly enabled and connected, trigger initial cloud backup
      if (googleDriveService.isConnected()) {
        backupNow(true);
      }
    }
  };

  // Set Backup Frequency
  const setBackupFrequency = (freq: 'realtime_debounced' | 'daily_end' | 'manual') => {
    const updated = googleDriveService.saveConfig({ frequency: freq });
    setConfig(updated);
    soundManager.playClick();
  };

  // Set Custom Google Cloud OAuth Client ID
  const setCustomClientId = (clientId: string) => {
    const updated = googleDriveService.saveConfig({ clientId: clientId.trim() });
    setConfig(updated);
  };

  // Manual or Auto Backup trigger
  const backupNow = async (isAuto = false): Promise<{ success: boolean; error?: string }> => {
    if (!googleDriveService.isConnected()) {
      return { success: false, error: 'Google Drive is not connected.' };
    }

    setSyncStatus('syncing');
    setLastSyncError(null);

    try {
      const dataStr = exportData();
      const uploadRes = await googleDriveService.uploadBackup(dataStr, isAuto);

      if (uploadRes.success) {
        setConfig(googleDriveService.getConfig());
        setSyncStatus('synced');
        if (!isAuto) {
          soundManager.playCompleteChime();
          haptics.success();
        }
        await refreshBackupsList();
        setTimeout(() => setSyncStatus('idle'), 3500);
        return { success: true };
      } else {
        setSyncStatus('error');
        setLastSyncError(uploadRes.error || 'Failed to upload backup.');
        if (!isAuto) {
          soundManager.playError();
          haptics.error();
        }
        return { success: false, error: uploadRes.error };
      }
    } catch (err: any) {
      setSyncStatus('error');
      setLastSyncError(err?.message || 'Unexpected backup error.');
      return { success: false, error: err?.message };
    }
  };

  // 1-Click Restore from Cloud Backup
  const restoreFromCloud = async (fileId: string): Promise<boolean> => {
    if (!googleDriveService.isConnected()) return false;

    setSyncStatus('syncing');
    try {
      const jsonContent = await googleDriveService.downloadBackup(fileId);
      if (!jsonContent) {
        setSyncStatus('error');
        setLastSyncError('Could not download selected cloud backup.');
        soundManager.playError();
        return false;
      }

      const success = importData(jsonContent);
      if (success) {
        setSyncStatus('synced');
        soundManager.playCompleteChime();
        haptics.success();
        setTimeout(() => setSyncStatus('idle'), 3000);
        return true;
      } else {
        setSyncStatus('error');
        setLastSyncError('Downloaded file was not a valid Syllabus 3D backup format.');
        soundManager.playError();
        return false;
      }
    } catch (err: any) {
      setSyncStatus('error');
      setLastSyncError(err?.message || 'Restore error occurred.');
      return false;
    }
  };

  // Delete a cloud backup
  const deleteCloudBackup = async (fileId: string): Promise<boolean> => {
    const ok = await googleDriveService.deleteBackup(fileId);
    if (ok) {
      await refreshBackupsList();
      soundManager.playClick();
      return true;
    }
    return false;
  };

  // Milestone Backup (e.g. daily reflection completed)
  const triggerMilestoneBackup = async (reason: string): Promise<void> => {
    if (!googleDriveService.isConnected() || !config.isAutoBackup) return;
    if (config.frequency === 'manual') return;

    console.log(`[Drive Cloud Sync] Milestone backup triggered: ${reason}`);
    await backupNow(true);
  };

  // Hook into local storage auto-saves for debounced continuous cloud syncing
  useEffect(() => {
    if (!isDriveConnected || !config.isAutoBackup || config.frequency !== 'realtime_debounced') {
      return;
    }

    const unsubscribe = storageManager.onAutoSave(() => {
      const now = Date.now();
      // Throttle: don't auto-upload to Google Drive more often than once every 2 minutes
      if (now - lastAutoBackupTimeRef.current < 120000) {
        // Schedule trailing debounced upload if not already scheduled
        if (autoBackupTimerRef.current) clearTimeout(autoBackupTimerRef.current);
        autoBackupTimerRef.current = window.setTimeout(() => {
          lastAutoBackupTimeRef.current = Date.now();
          backupNow(true);
        }, 120000);
        return;
      }

      lastAutoBackupTimeRef.current = now;
      backupNow(true);
    });

    return () => {
      unsubscribe();
      if (autoBackupTimerRef.current) clearTimeout(autoBackupTimerRef.current);
    };
  }, [isDriveConnected, config.isAutoBackup, config.frequency]);

  // Load backups list when connected
  useEffect(() => {
    if (isDriveConnected) {
      refreshBackupsList();
    }
  }, [isDriveConnected, refreshBackupsList]);

  const value: GoogleDriveContextValue = {
    isDriveConnected,
    connectedUser,
    config,
    syncStatus,
    isSyncing: syncStatus === 'syncing',
    lastSyncError,
    availableBackups,
    isLoadingBackups,
    connectDrive,
    disconnectDrive,
    toggleAutoBackup,
    setBackupFrequency,
    setCustomClientId,
    backupNow,
    restoreFromCloud,
    refreshBackupsList,
    deleteCloudBackup,
    triggerMilestoneBackup,
  };

  return <GoogleDriveContext.Provider value={value}>{children}</GoogleDriveContext.Provider>;
};

export const useGoogleDrive = (): GoogleDriveContextValue => {
  const context = useContext(GoogleDriveContext);
  if (!context) {
    throw new Error('useGoogleDrive must be used within a GoogleDriveProvider');
  }
  return context;
};
