/**
 * ═══════════════════════════════════════════════════════════════
 * GOOGLE DRIVE CLIENT-SIDE CLOUD BACKUP SERVICE (REST API v3)
 * ═══════════════════════════════════════════════════════════════
 * 1. Zero Third-Party Server Mediation:
 *    Direct browser-to-Google HTTPS communication.
 * 2. Scoped Permission:
 *    Uses 'https://www.googleapis.com/auth/drive.file' scope.
 *    Only accesses files/folders created by Syllabus 3D ('Syllabus 3D Backups').
 * 3. Supports live Google Identity Services (GIS) & Demo / Offline Cloud Simulation.
 * ═══════════════════════════════════════════════════════════════
 */

export interface GoogleDriveUser {
  email: string;
  name: string;
  picture?: string;
}

export interface DriveBackupFile {
  id: string;
  name: string;
  size: number;
  sizeFormatted: string;
  createdTime: string;
  modifiedTime: string;
  isAutoBackup?: boolean;
}

export interface DriveSyncConfig {
  clientId: string;
  isAutoBackup: boolean;
  frequency: 'realtime_debounced' | 'daily_end' | 'manual';
  backupFolderId: string | null;
  lastBackupAt: string | null;
  lastBackupFileId: string | null;
  useSimulatedMode: boolean;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'syllabus3d_gdrive_access_token',
  TOKEN_EXPIRES_AT: 'syllabus3d_gdrive_token_expires_at',
  USER_INFO: 'syllabus3d_gdrive_user',
  CONFIG: 'syllabus3d_gdrive_config',
  SIMULATED_BACKUPS: 'syllabus3d_gdrive_simulated_backups',
};

const DEFAULT_FOLDER_NAME = 'Syllabus 3D Backups';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

// Default config
export const DEFAULT_DRIVE_CONFIG: DriveSyncConfig = {
  clientId: '',
  isAutoBackup: false,
  frequency: 'realtime_debounced',
  backupFolderId: null,
  lastBackupAt: null,
  lastBackupFileId: null,
  useSimulatedMode: false,
};

class GoogleDriveService {
  private gisLoaded = false;
  private tokenClient: any = null;

  constructor() {
    this.initGis();
  }

  /**
   * Lazily loads Google Identity Services SDK script
   */
  public async initGis(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (this.gisLoaded && (window as any).google?.accounts?.oauth2) return true;

    // Check if script is already present
    const existingScript = document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`);
    if (existingScript) {
      this.gisLoaded = true;
      return true;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = GIS_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.gisLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        this.gisLoaded = false;
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Load stored drive configuration
   */
  public getConfig(): DriveSyncConfig {
    if (typeof window === 'undefined') return DEFAULT_DRIVE_CONFIG;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (raw) return { ...DEFAULT_DRIVE_CONFIG, ...JSON.parse(raw) };
    } catch {}
    return DEFAULT_DRIVE_CONFIG;
  }

  /**
   * Update and save drive configuration
   */
  public saveConfig(partial: Partial<DriveSyncConfig>): DriveSyncConfig {
    const updated = { ...this.getConfig(), ...partial };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
      } catch {}
    }
    return updated;
  }

  /**
   * Retrieve active access token if still valid
   */
  public getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const expiresAt = Number(localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT) || '0');
    if (!token || Date.now() > expiresAt) {
      return null;
    }
    return token;
  }

  /**
   * Get connected Google user details
   */
  public getConnectedUser(): GoogleDriveUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check whether Google Drive is connected (valid token or active simulated session)
   */
  public isConnected(): boolean {
    const config = this.getConfig();
    if (config.useSimulatedMode) {
      return !!this.getConnectedUser();
    }
    return !!this.getAccessToken() && !!this.getConnectedUser();
  }

  /**
   * Format byte size nicely
   */
  public formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Authenticate via Google Identity Services Token Client
   */
  public async requestAuth(clientIdOverride?: string): Promise<{ success: boolean; user?: GoogleDriveUser; error?: string }> {
    const config = this.getConfig();
    const effectiveClientId = clientIdOverride || config.clientId || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

    // If no client ID provided, enable interactive Demo / Offline Cloud Simulation
    if (!effectiveClientId.trim()) {
      return this.connectSimulatedAccount('aspirant.student@gmail.com', 'Aspirant Aspirations');
    }

    await this.initGis();
    const google = (window as any).google;

    if (!google?.accounts?.oauth2) {
      return { success: false, error: 'Google Identity Services SDK failed to load. Check internet connection.' };
    }

    return new Promise((resolve) => {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: effectiveClientId,
          scope: SCOPE,
          callback: async (response: any) => {
            if (response.error) {
              resolve({ success: false, error: response.error });
              return;
            }

            const token = response.access_token;
            const expiresIn = (response.expires_in || 3600) * 1000;
            const expiresAt = Date.now() + expiresIn - 60000; // 1-minute safety margin

            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
            localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(expiresAt));

            // Fetch user identity (Email, Name, Picture)
            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (userInfoRes.ok) {
                const info = await userInfoRes.json();
                const user: GoogleDriveUser = {
                  email: info.email,
                  name: info.name || info.email.split('@')[0],
                  picture: info.picture,
                };
                localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
                this.saveConfig({ clientId: effectiveClientId, useSimulatedMode: false });
                resolve({ success: true, user });
                return;
              }
            } catch {}

            // Fallback user info
            const fallbackUser: GoogleDriveUser = {
              email: 'connected.google.user@gmail.com',
              name: 'Google Drive User',
            };
            localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(fallbackUser));
            this.saveConfig({ clientId: effectiveClientId, useSimulatedMode: false });
            resolve({ success: true, user: fallbackUser });
          },
          error_callback: (err: any) => {
            resolve({ success: false, error: err?.message || 'Authentication was cancelled or failed.' });
          },
        });

        this.tokenClient = client;
        client.requestAccessToken({ prompt: '' });
      } catch (err: any) {
        resolve({ success: false, error: err?.message || 'Error initializing Google authentication.' });
      }
    });
  }

  /**
   * Connect a simulated offline/demo cloud drive account
   */
  public connectSimulatedAccount(email = 'aspirant.student@gmail.com', name = 'Aspirant Aspirations'): { success: boolean; user: GoogleDriveUser } {
    const user: GoogleDriveUser = {
      email,
      name,
      picture: undefined,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'simulated_offline_token_' + Date.now());
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(Date.now() + 86400000 * 365));
      this.saveConfig({ useSimulatedMode: true });
    }
    return { success: true, user };
  }

  /**
   * Disconnect and clear all Drive tokens
   */
  public disconnect(): void {
    if (typeof window === 'undefined') return;
    const token = this.getAccessToken();
    const google = (window as any).google;

    if (token && google?.accounts?.oauth2?.revoke) {
      try {
        google.accounts.oauth2.revoke(token, () => {});
      } catch {}
    }

    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    this.saveConfig({
      backupFolderId: null,
      useSimulatedMode: false,
    });
  }

  /**
   * Ensure 'Syllabus 3D Backups' folder exists in user's Drive
   */
  public async ensureBackupFolder(): Promise<string | null> {
    const config = this.getConfig();
    if (config.useSimulatedMode) {
      return 'simulated_folder_root';
    }

    const token = this.getAccessToken();
    if (!token) return null;

    if (config.backupFolderId) {
      return config.backupFolderId;
    }

    try {
      // Check if folder already exists
      const query = encodeURIComponent(`mimeType = 'application/vnd.google-apps.folder' and name = '${DEFAULT_FOLDER_NAME}' and trashed = false`);
      const searchRes = await fetch(`${DRIVE_API_BASE}/files?q=${query}&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.files && data.files.length > 0) {
          const folderId = data.files[0].id;
          this.saveConfig({ backupFolderId: folderId });
          return folderId;
        }
      }

      // Create folder
      const createRes = await fetch(`${DRIVE_API_BASE}/files`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: DEFAULT_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
          description: 'Automated study backups created by Syllabus 3D application',
        }),
      });

      if (createRes.ok) {
        const folder = await createRes.json();
        this.saveConfig({ backupFolderId: folder.id });
        return folder.id;
      }
    } catch (e) {
      console.error('Failed to ensure Drive backup folder:', e);
    }

    return null;
  }

  /**
   * Uploads a full JSON backup to user's Google Drive
   */
  public async uploadBackup(
    jsonData: string,
    isAuto = false
  ): Promise<{ success: boolean; fileId?: string; filename?: string; error?: string }> {
    const config = this.getConfig();

    // 1. Simulated Mode Handled Gracefully
    if (config.useSimulatedMode) {
      return this.uploadSimulatedBackup(jsonData, isAuto);
    }

    const token = this.getAccessToken();
    if (!token) {
      return { success: false, error: 'Google Drive is not connected or session expired. Please reconnect.' };
    }

    try {
      const folderId = await this.ensureBackupFolder();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = isAuto
        ? `syllabus3d_autobackup_${new Date().toISOString().slice(0, 10)}.json`
        : `syllabus3d_backup_${timestamp}.json`;

      const metadata = {
        name: filename,
        mimeType: 'application/json',
        description: `Syllabus 3D ${isAuto ? 'Automatic' : 'Manual'} Cloud Backup`,
        parents: folderId ? [folderId] : undefined,
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        jsonData +
        closeDelimiter;

      const uploadRes = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });

      if (!uploadRes.ok) {
        const errJson = await uploadRes.json().catch(() => ({}));
        return { success: false, error: errJson?.error?.message || 'Google Drive upload failed' };
      }

      const fileData = await uploadRes.json();
      const nowStr = new Date().toLocaleString();

      this.saveConfig({
        lastBackupAt: nowStr,
        lastBackupFileId: fileData.id,
      });

      return {
        success: true,
        fileId: fileData.id,
        filename,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error uploading to Google Drive.' };
    }
  }

  /**
   * List available backups in Google Drive
   */
  public async listBackups(): Promise<DriveBackupFile[]> {
    const config = this.getConfig();

    if (config.useSimulatedMode) {
      return this.listSimulatedBackups();
    }

    const token = this.getAccessToken();
    if (!token) return [];

    try {
      const folderId = await this.ensureBackupFolder();
      let query = "trashed = false and mimeType = 'application/json'";
      if (folderId) {
        query += ` and '${folderId}' in parents`;
      }

      const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(
        query
      )}&fields=files(id,name,size,createdTime,modifiedTime)&orderBy=modifiedTime desc&pageSize=20`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return [];

      const data = await res.json();
      return (data.files || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        size: Number(f.size || 0),
        sizeFormatted: this.formatBytes(Number(f.size || 0)),
        createdTime: new Date(f.createdTime || Date.now()).toLocaleString(),
        modifiedTime: new Date(f.modifiedTime || Date.now()).toLocaleString(),
        isAutoBackup: f.name.includes('autobackup'),
      }));
    } catch (e) {
      console.error('Error listing Drive backups:', e);
      return [];
    }
  }

  /**
   * Download a backup file from Google Drive
   */
  public async downloadBackup(fileId: string): Promise<string | null> {
    const config = this.getConfig();

    if (config.useSimulatedMode) {
      return this.downloadSimulatedBackup(fileId);
    }

    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return null;
      return await res.text();
    } catch (e) {
      console.error('Error downloading Drive backup:', e);
      return null;
    }
  }

  /**
   * Delete a cloud backup from Google Drive
   */
  public async deleteBackup(fileId: string): Promise<boolean> {
    const config = this.getConfig();

    if (config.useSimulatedMode) {
      return this.deleteSimulatedBackup(fileId);
    }

    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // ═════════════════════════════════════════════════════════════
  // SIMULATED / OFFLINE CLOUD STORAGE HANDLERS
  // ═════════════════════════════════════════════════════════════

  private getSimulatedBackupsStore(): Array<{ id: string; name: string; size: number; timestamp: string; isAuto: boolean; data: string }> {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SIMULATED_BACKUPS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveSimulatedBackupsStore(store: any[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.SIMULATED_BACKUPS, JSON.stringify(store));
    } catch {}
  }

  private uploadSimulatedBackup(jsonData: string, isAuto: boolean) {
    const store = this.getSimulatedBackupsStore();
    const id = 'sim_file_' + Date.now();
    const filename = isAuto
      ? `syllabus3d_autobackup_${new Date().toISOString().slice(0, 10)}.json`
      : `syllabus3d_backup_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.json`;
    const size = new Blob([jsonData]).size;
    const nowStr = new Date().toLocaleString();

    store.unshift({
      id,
      name: filename,
      size,
      timestamp: new Date().toISOString(),
      isAuto,
      data: jsonData,
    });

    // Keep max 15 simulated backups to avoid storage bloating
    this.saveSimulatedBackupsStore(store.slice(0, 15));

    this.saveConfig({
      lastBackupAt: nowStr,
      lastBackupFileId: id,
    });

    return {
      success: true,
      fileId: id,
      filename,
    };
  }

  private listSimulatedBackups(): DriveBackupFile[] {
    const store = this.getSimulatedBackupsStore();
    return store.map(item => ({
      id: item.id,
      name: item.name,
      size: item.size,
      sizeFormatted: this.formatBytes(item.size),
      createdTime: new Date(item.timestamp).toLocaleString(),
      modifiedTime: new Date(item.timestamp).toLocaleString(),
      isAutoBackup: item.isAuto,
    }));
  }

  private downloadSimulatedBackup(fileId: string): string | null {
    const store = this.getSimulatedBackupsStore();
    const found = store.find(i => i.id === fileId);
    return found ? found.data : null;
  }

  private deleteSimulatedBackup(fileId: string): boolean {
    const store = this.getSimulatedBackupsStore();
    const updated = store.filter(i => i.id !== fileId);
    this.saveSimulatedBackupsStore(updated);
    return true;
  }
}

export const googleDriveService = new GoogleDriveService();
