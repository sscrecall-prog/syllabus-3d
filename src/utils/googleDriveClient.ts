/**
 * Google Drive Cloud Integration Client for Syllabus 3D
 * Handles Google Identity Services (GIS) OAuth 2.0 token flow and Google Drive REST API v3.
 * Uses restricted scope 'https://www.googleapis.com/auth/drive.file' for maximum user privacy.
 */

export interface GoogleDriveUser {
  email: string;
  name?: string;
  picture?: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  webViewLink?: string;
}

export interface GoogleDriveFolderHierarchy {
  rootFolderId: string;
  databaseFolderId: string;
  pdfsFolderId: string;
  photosFolderId: string;
}

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

const STORAGE_KEYS = {
  CLIENT_ID: 'syllabus3d_gdrive_client_id',
  ACCESS_TOKEN: 'syllabus3d_gdrive_token',
  TOKEN_EXPIRES_AT: 'syllabus3d_gdrive_token_expires',
  USER_INFO: 'syllabus3d_gdrive_user'
};

// Fallback demo client ID placeholder (users can configure their own Google Cloud OAuth Client ID)
export const DEFAULT_GOOGLE_CLIENT_ID = '388657788421-m5c88k5938n0u72vdv4u799q92i56b2s.apps.googleusercontent.com';

/**
 * Gets currently configured Google OAuth Client ID
 */
export function getGoogleClientId(): string {
  if (typeof window === 'undefined') return DEFAULT_GOOGLE_CLIENT_ID;
  return localStorage.getItem(STORAGE_KEYS.CLIENT_ID) || DEFAULT_GOOGLE_CLIENT_ID;
}

/**
 * Sets custom Google OAuth Client ID
 */
export function setGoogleClientId(clientId: string): void {
  if (typeof window === 'undefined') return;
  if (clientId.trim()) {
    localStorage.setItem(STORAGE_KEYS.CLIENT_ID, clientId.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.CLIENT_ID);
  }
}

/**
 * Dynamically loads Google Identity Services script if not already present
 */
export function loadGoogleIdentityServices(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window is not defined'));
    }

    if ((window as any).google?.accounts?.oauth2) {
      return resolve();
    }

    const existingScript = document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')));
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK'));
    document.head.appendChild(script);
  });
}

/**
 * Checks if a valid cached Google Drive access token exists
 */
export function getValidAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const expiresAt = Number(sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT) || 0);

  // Return token if valid with at least 60 seconds remaining
  if (token && Date.now() < expiresAt - 60000) {
    return token;
  }
  return null;
}

/**
 * Stores Google token with expiry
 */
export function storeAccessToken(token: string, expiresInSeconds: number): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(Date.now() + expiresInSeconds * 1000));
}

/**
 * Gets cached Google user info
 */
export function getCachedGoogleUser(): GoogleDriveUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Requests a Google Drive OAuth access token via Google Identity Services popup
 */
export async function requestGoogleDriveToken(customClientId?: string): Promise<string> {
  await loadGoogleIdentityServices();

  const clientId = (customClientId || getGoogleClientId()).trim();
  if (!clientId) {
    throw new Error('Google OAuth Client ID is missing. Please configure your Client ID.');
  }

  const google = (window as any).google;
  if (!google?.accounts?.oauth2) {
    throw new Error('Google Identity Services not initialized.');
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: DRIVE_SCOPE,
        callback: async (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }

          if (response.access_token) {
            const expiresIn = response.expires_in ? Number(response.expires_in) : 3600;
            storeAccessToken(response.access_token, expiresIn);

            // Fetch user profile info
            try {
              const userInfo = await fetchGoogleUserInfo(response.access_token);
              if (userInfo) {
                localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
              }
            } catch (err) {
              console.warn('Could not fetch Google user info:', err);
            }

            resolve(response.access_token);
          } else {
            reject(new Error('No access token received from Google'));
          }
        },
        error_callback: (err: any) => {
          reject(new Error(err.message || 'Google Authentication cancelled or failed'));
        }
      });

      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err: any) {
      reject(new Error(err.message || 'Failed to initialize Google token client'));
    }
  });
}

/**
 * Fetches basic Google user profile details using the access token
 */
export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleDriveUser | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      email: data.email,
      name: data.name,
      picture: data.picture
    };
  } catch {
    return null;
  }
}

/**
 * Disconnects Google Drive and clears cached tokens
 */
export function disconnectGoogleDrive(): void {
  if (typeof window === 'undefined') return;
  const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (token && (window as any).google?.accounts?.oauth2?.revoke) {
    try {
      (window as any).google.accounts.oauth2.revoke(token, () => {});
    } catch {}
  }
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  localStorage.removeItem(STORAGE_KEYS.USER_INFO);
}

/**
 * Finds or creates a folder on Google Drive
 */
export async function findOrCreateFolder(
  folderName: string,
  parentFolderId?: string,
  token?: string
): Promise<string> {
  const accessToken = token || getValidAccessToken();
  if (!accessToken) throw new Error('Not connected to Google Drive. Please authorize first.');

  const parentQuery = parentFolderId
    ? `'${parentFolderId}' in parents`
    : `'root' in parents`;

  const query = `mimeType = 'application/vnd.google-apps.folder' and trashed = false and name = '${folderName.replace(/'/g, "\\'")}' and ${parentQuery}`;

  // Search existing
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!searchRes.ok) {
    const errData = await searchRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to search Google Drive folders (${searchRes.status})`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : []
    })
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to create folder on Google Drive (${createRes.status})`);
  }

  const createdFolder = await createRes.json();
  return createdFolder.id;
}

/**
 * Ensures the standard 3-tier folder hierarchy exists in Google Drive:
 * Syllabus 3D Cloud Backups/
 *   ├── Database/
 *   ├── PDFs/
 *   └── Photos & Diagrams/
 */
export async function ensureFolderHierarchy(token?: string): Promise<GoogleDriveFolderHierarchy> {
  const accessToken = token || getValidAccessToken();
  if (!accessToken) throw new Error('Not connected to Google Drive');

  // 1. Root folder
  const rootFolderId = await findOrCreateFolder('Syllabus 3D Cloud Backups', undefined, accessToken);

  // 2. Subfolders
  const [databaseFolderId, pdfsFolderId, photosFolderId] = await Promise.all([
    findOrCreateFolder('Database', rootFolderId, accessToken),
    findOrCreateFolder('PDFs', rootFolderId, accessToken),
    findOrCreateFolder('Photos & Diagrams', rootFolderId, accessToken)
  ]);

  return {
    rootFolderId,
    databaseFolderId,
    pdfsFolderId,
    photosFolderId
  };
}

/**
 * Uploads a file to Google Drive using multipart upload
 */
export async function uploadFileToDrive(options: {
  fileBlob: Blob;
  fileName: string;
  mimeType: string;
  parentFolderId: string;
  token?: string;
}): Promise<GoogleDriveFile> {
  const accessToken = options.token || getValidAccessToken();
  if (!accessToken) throw new Error('Not connected to Google Drive');

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: options.fileName,
    mimeType: options.mimeType,
    parents: [options.parentFolderId]
  };

  const multipartRequestBody = new Blob([
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify(metadata),
    delimiter,
    `Content-Type: ${options.mimeType}\r\n\r\n`,
    options.fileBlob,
    closeDelimiter
  ], { type: `multipart/related; boundary=${boundary}` });

  const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,webViewLink';

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to upload file to Google Drive (${res.status})`);
  }

  return await res.json();
}

/**
 * Lists files from a specific folder on Google Drive
 */
export async function listFilesFromDriveFolder(folderId: string, token?: string): Promise<GoogleDriveFile[]> {
  const accessToken = token || getValidAccessToken();
  if (!accessToken) throw new Error('Not connected to Google Drive');

  const query = `'${folderId}' in parents and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,createdTime,webViewLink)&orderBy=createdTime desc&pageSize=100`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to list files from Google Drive (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Downloads a file binary Blob from Google Drive by file ID
 */
export async function downloadFileBlobFromDrive(fileId: string, token?: string): Promise<Blob> {
  const accessToken = token || getValidAccessToken();
  if (!accessToken) throw new Error('Not connected to Google Drive');

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error(`Failed to download file from Google Drive (${res.status})`);
  }

  return await res.blob();
}

/**
 * Downloads and parses a JSON file from Google Drive
 */
export async function downloadJsonFromDrive<T = any>(fileId: string, token?: string): Promise<T> {
  const blob = await downloadFileBlobFromDrive(fileId, token);
  const text = await blob.text();
  return JSON.parse(text) as T;
}
