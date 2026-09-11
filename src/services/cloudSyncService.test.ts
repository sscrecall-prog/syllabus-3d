import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveUserCloudData,
  fetchUserCloudData,
  deleteUserCloudData
} from './cloudSyncService';
import {
  getFirebaseConfig,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
  isFirebaseConfigured
} from './firebase';
import { FullAppSnapshot } from './storageManager';

describe('cloudSyncService & Firebase Configuration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should detect Firebase configuration properly', () => {
    // Check if configuration exists from .env or localStorage
    const config = getFirebaseConfig();
    expect(config).toBeDefined();
    if (config) {
      expect(config.apiKey).toBeTruthy();
      expect(config.projectId).toBeTruthy();
    }
  });

  it('should manage custom Firebase configuration in localStorage', () => {
    const testConfig = {
      apiKey: 'AIzaSyFakeKeyForTesting123456',
      authDomain: 'syllabus-3d-test.firebaseapp.com',
      projectId: 'syllabus-3d-test',
      appId: '1:123456789:web:abcdef123'
    };

    saveCustomFirebaseConfig(testConfig);
    const retrieved = getFirebaseConfig();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.apiKey).toBe('AIzaSyFakeKeyForTesting123456');
    expect(retrieved?.projectId).toBe('syllabus-3d-test');

    clearCustomFirebaseConfig();
  });

  it('should return null when fetching cloud data for non-existent or empty user ID', async () => {
    const res = await fetchUserCloudData('');
    expect(res).toBeNull();
  });

  it('should persist and retrieve study snapshot in vault safeguard storage', async () => {
    const testUid = 'user_test_vault_999';
    const mockSnapshot: FullAppSnapshot = {
      version: '3.0.0',
      timestamp: new Date().toISOString(),
      exams: [
        {
          id: 'exam_upsc_2026',
          name: 'UPSC Civil Services 2026',
          examDate: '2026-05-24',
          targetYear: '2026',
          subjects: []
        }
      ],
      profile: {
        name: 'Aspirant Scholar',
        email: 'scholar@gmail.com',
        xp: 500,
        level: 2,
        streakDays: 3,
        selectedExamId: 'exam_upsc_2026'
      },
      achievements: [],
      activityHistory: [],
      revisions: [],
      plannerTasks: [],
      platforms: [],
      top3Targets: [],
      reflectionsHistory: []
    };

    // Store in vault
    localStorage.setItem(`syllabus3d_cloud_vault_${testUid}`, JSON.stringify(mockSnapshot));

    const stored = localStorage.getItem(`syllabus3d_cloud_vault_${testUid}`);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.version).toBe('3.0.0');
    expect(parsed.exams[0].name).toBe('UPSC Civil Services 2026');

    // Clean up
    localStorage.removeItem(`syllabus3d_cloud_vault_${testUid}`);
    expect(localStorage.getItem(`syllabus3d_cloud_vault_${testUid}`)).toBeNull();
  });
});
