import { CloudSyncPayload, CloudBackendConfig } from '../types/cloudSync';

const CONFIG_KEY = 'syllabus3d_cloud_config';
const LAST_SYNC_KEY = 'syllabus3d_last_sync_time';
const DEVICE_ID_KEY = 'syllabus3d_device_id';
const CLOUD_SYNC_ID_KEY = 'syllabus3d_cloud_sync_id';

const PRIMARY_CLOUD_API = 'https://api.restful-api.dev/objects';

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let devId = localStorage.getItem(DEVICE_ID_KEY);
  if (!devId) {
    devId = 'dev_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(DEVICE_ID_KEY, devId);
  }
  return devId;
}

export const cloudSyncEngine = {
  getDeviceId,

  getConfig(): CloudBackendConfig {
    if (typeof window === 'undefined') return { type: 'default' };
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { type: 'default' };
  },

  saveConfig(config: CloudBackendConfig) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  },

  getCloudSyncId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(CLOUD_SYNC_ID_KEY);
  },

  setCloudSyncId(id: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CLOUD_SYNC_ID_KEY, id.trim());
  },

  getLastSyncTime(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LAST_SYNC_KEY);
  },

  setLastSyncTime(time: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LAST_SYNC_KEY, time);
  },

  // 1. Push current dataset to Cloud
  async pushToCloud(userEmail: string, payload: CloudSyncPayload): Promise<{ success: boolean; cloudId?: string }> {
    if (!navigator.onLine) return { success: false };
    const config = this.getConfig();
    let cloudId = this.getCloudSyncId();

    try {
      // If user configured custom Firebase
      if (config.type === 'firebase' && config.endpointUrl) {
        const cleanKey = 'user_' + userEmail.replace(/[^a-zA-Z0-9]/g, '_');
        const url = `${config.endpointUrl.replace(/\/$/, '')}/users/${cleanKey}.json${config.apiKey ? `?auth=${config.apiKey}` : ''}`;
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          this.setLastSyncTime(payload.updatedAt);
          return { success: true };
        }
      }

      // Default High-Performance Cloud Storage
      const cloudObj = {
        name: 'syllabus_3d_vault',
        data: {
          userEmail: userEmail || 'aspirant',
          updatedAt: payload.updatedAt,
          payload: JSON.stringify(payload)
        }
      };

      if (cloudId) {
        // Update existing cloud object
        const updateRes = await fetch(`${PRIMARY_CLOUD_API}/${cloudId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cloudObj)
        });

        if (updateRes.ok) {
          this.setLastSyncTime(payload.updatedAt);
          return { success: true, cloudId };
        }
      }

      // Create new Cloud Vault object
      const createRes = await fetch(PRIMARY_CLOUD_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloudObj)
      });

      if (createRes.ok) {
        const result = await createRes.json();
        if (result.id) {
          this.setCloudSyncId(result.id);
          this.setLastSyncTime(payload.updatedAt);
          return { success: true, cloudId: result.id };
        }
      }
    } catch (err) {
      console.warn('Cloud sync push warning:', err);
    }
    return { success: false };
  },

  // 2. Pull latest dataset from Cloud
  async fetchFromCloud(userEmail: string): Promise<CloudSyncPayload | null> {
    if (!navigator.onLine) return null;
    const config = this.getConfig();
    const cloudId = this.getCloudSyncId();

    try {
      if (config.type === 'firebase' && config.endpointUrl) {
        const cleanKey = 'user_' + userEmail.replace(/[^a-zA-Z0-9]/g, '_');
        const url = `${config.endpointUrl.replace(/\/$/, '')}/users/${cleanKey}.json${config.apiKey ? `?auth=${config.apiKey}` : ''}`;
        const res = await fetch(url);
        if (res.ok) {
          const data: CloudSyncPayload = await res.json();
          if (data && data.exams) return data;
        }
      }

      if (cloudId) {
        const res = await fetch(`${PRIMARY_CLOUD_API}/${cloudId}`);
        if (res.ok) {
          const item = await res.json();
          if (item?.data?.payload) {
            const parsed: CloudSyncPayload = JSON.parse(item.data.payload);
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('Cloud sync fetch warning:', err);
    }
    return null;
  },

  // 3. Connect & Import directly using a Cloud Sync ID
  async connectByCloudId(cloudId: string): Promise<CloudSyncPayload> {
    const cleanId = cloudId.trim();
    if (!cleanId) throw new Error('Please provide a valid Cloud Sync ID.');

    const res = await fetch(`${PRIMARY_CLOUD_API}/${cleanId}`);
    if (!res.ok) {
      throw new Error('Cloud Sync ID not found. Please verify the ID or generate a fresh link from your PC.');
    }

    const item = await res.json();
    if (!item?.data?.payload) {
      throw new Error('Cloud vault data was empty or unreadable.');
    }

    const parsed: CloudSyncPayload = JSON.parse(item.data.payload);
    this.setCloudSyncId(cleanId);
    this.setLastSyncTime(parsed.updatedAt || new Date().toISOString());
    return parsed;
  }
};
