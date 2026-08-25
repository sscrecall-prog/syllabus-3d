import { CloudSyncPayload, CloudBackendConfig } from '../types/cloudSync';

const CONFIG_KEY = 'syllabus3d_cloud_config';
const LAST_SYNC_KEY = 'syllabus3d_last_sync_time';
const DEVICE_ID_KEY = 'syllabus3d_device_id';

// Stable CORS-enabled public cloud key-value database for syllabus syncing
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

function cleanEmailKey(email: string): string {
  return 's3d_user_' + email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
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

  getLastSyncTime(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LAST_SYNC_KEY);
  },

  setLastSyncTime(time: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LAST_SYNC_KEY, time);
  },

  // 1. PUSH to Cloud
  async pushToCloud(userEmail: string, payload: CloudSyncPayload): Promise<boolean> {
    if (!navigator.onLine || !userEmail) return false;
    const config = this.getConfig();
    const emailKey = cleanEmailKey(userEmail);

    try {
      // If user configured custom Firebase
      if (config.type === 'firebase' && config.endpointUrl) {
        const url = `${config.endpointUrl.replace(/\/$/, '')}/users/${emailKey}.json${config.apiKey ? `?auth=${config.apiKey}` : ''}`;
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          this.setLastSyncTime(payload.updatedAt);
          return true;
        }
      }

      // Default Cloud Sync Backend: Store compressed payload
      // Using browser cloud store with email key
      const cloudObj = {
        name: emailKey,
        data: {
          payload: JSON.stringify(payload),
          updatedAt: payload.updatedAt,
          email: userEmail
        }
      };

      // Check if existing object ID exists in localStorage
      const existingObjectId = localStorage.getItem(`s3d_obj_${emailKey}`);

      if (existingObjectId) {
        // Update existing record
        const updateRes = await fetch(`${PRIMARY_CLOUD_API}/${existingObjectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cloudObj)
        });
        if (updateRes.ok) {
          this.setLastSyncTime(payload.updatedAt);
          return true;
        }
      }

      // Create new record on cloud
      const createRes = await fetch(PRIMARY_CLOUD_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloudObj)
      });

      if (createRes.ok) {
        const result = await createRes.json();
        if (result.id) {
          localStorage.setItem(`s3d_obj_${emailKey}`, result.id);
        }
        this.setLastSyncTime(payload.updatedAt);
        return true;
      }
    } catch (err) {
      console.warn('Cloud sync push warning:', err);
    }
    return false;
  },

  // 2. PULL from Cloud
  async fetchFromCloud(userEmail: string): Promise<CloudSyncPayload | null> {
    if (!navigator.onLine || !userEmail) return null;
    const config = this.getConfig();
    const emailKey = cleanEmailKey(userEmail);

    try {
      if (config.type === 'firebase' && config.endpointUrl) {
        const url = `${config.endpointUrl.replace(/\/$/, '')}/users/${emailKey}.json${config.apiKey ? `?auth=${config.apiKey}` : ''}`;
        const res = await fetch(url);
        if (res.ok) {
          const data: CloudSyncPayload = await res.json();
          if (data && data.exams) return data;
        }
      }

      // Default Cloud Sync Fetch
      const existingObjectId = localStorage.getItem(`s3d_obj_${emailKey}`);

      if (existingObjectId) {
        const res = await fetch(`${PRIMARY_CLOUD_API}/${existingObjectId}`);
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

  // 3. 6-Digit Device Pairing Room (Generate PIN on PC, type on Mobile)
  async generatePairCode(payload: CloudSyncPayload): Promise<string> {
    const pairCode = Math.floor(100000 + Math.random() * 900000).toString(); // e.g. 849201
    const pairName = `s3d_pair_${pairCode}`;

    try {
      const res = await fetch(PRIMARY_CLOUD_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pairName,
          data: {
            pairCode,
            payload: JSON.stringify(payload),
            createdAt: new Date().toISOString()
          }
        })
      });

      if (res.ok) {
        const result = await res.json();
        // Save pair mapping locally as well
        localStorage.setItem(`s3d_paircode_${pairCode}`, result.id);
        return pairCode;
      }
    } catch (err) {
      console.warn('Generate pair code error:', err);
    }
    return pairCode;
  },

  // 4. Link & Import by 6-Digit Pair Code
  async importByPairCode(pairCode: string): Promise<CloudSyncPayload | null> {
    const cleanCode = pairCode.trim().replace(/[^0-9]/g, '');
    if (cleanCode.length !== 6) throw new Error('Please enter a valid 6-digit sync code.');

    try {
      // Search or fetch by pair code
      const res = await fetch(PRIMARY_CLOUD_API);
      if (res.ok) {
        const items = await res.json();
        const matched = Array.isArray(items) ? items.find((i: any) => i.name === `s3d_pair_${cleanCode}` || i?.data?.pairCode === cleanCode) : null;

        if (matched && matched.data?.payload) {
          const parsed: CloudSyncPayload = JSON.parse(matched.data.payload);
          return parsed;
        }
      }
    } catch (err: any) {
      throw new Error(err.message || 'Unable to connect to sync server.');
    }

    throw new Error('Sync code not found or expired. Please generate a new code on your PC.');
  }
};
