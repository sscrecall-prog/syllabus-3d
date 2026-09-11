import { describe, it, expect, beforeEach } from 'vitest';
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

  it('should manage custom Firebase configuration in localStorage', () => {
    expect(isFirebaseConfigured()).toBe(false);

    const testConfig = {
      apiKey: 'AIzaSyFakeKeyForTesting123456',
      authDomain: 'syllabus-3d-test.firebaseapp.com',
      projectId: 'syllabus-3d-test',
      appId: '1:123456789:web:abcdef123'
    };

    saveCustomFirebaseConfig(testConfig);
    expect(isFirebaseConfigured()).toBe(true);

    const retrieved = getFirebaseConfig();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.apiKey).toBe('AIzaSyFakeKeyForTesting123456');
    expect(retrieved?.projectId).toBe('syllabus-3d-test');

    clearCustomFirebaseConfig();
    expect(isFirebaseConfigured()).toBe(false);
  });

  it('should return null when fetching cloud data for non-existent or empty user ID', async () => {
    const res = await fetchUserCloudData('');
    expect(res).toBeNull();

    const notFound = await fetchUserCloudData('non_existent_uid_9999');
    expect(notFound).toBeNull();
  });

  it('should save and recover full app snapshot in cloud vault mode', async () => {
    const testUid = 'user_google_test_12345';
    const mockSnapshot: FullAppSnapshot = {
      version: '3.0.0',
      timestamp: new Date().toISOString(),
      exams: [
        {
          id: 'exam_upsc_2026',
          name: 'UPSC Civil Services 2026',
          examDate: '2026-05-24',
          targetYear: '2026',
          subjects: [
            {
              id: 'subj_polity',
              name: 'Indian Polity & Governance',
              icon: 'Scale',
              color: '#3B82F6',
              chapters: [
                {
                  id: 'chap_preamble',
                  name: 'Preamble & Basic Structure',
                  topics: [
                    {
                      id: 'top_preamble_essence',
                      name: 'Preamble Philosophies & Key Amendments',
                      status: 'mastered',
                      confidence: 'high',
                      notes: '# Preamble Notes\n- Sovereign, Socialist, Secular, Democratic, Republic',
                      customNotes: '# Preamble Notes\n- Sovereign, Socialist, Secular, Democratic, Republic',
                      priority: 'high',
                      revisionCount: 3
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      profile: {
        name: 'Aspirant Topper',
        email: 'topper@gmail.com',
        xp: 1250,
        level: 5,
        streakDays: 14,
        selectedExamId: 'exam_upsc_2026'
      },
      achievements: [],
      activityHistory: [],
      revisions: [
        {
          topicId: 'top_preamble_essence',
          topicName: 'Preamble Philosophies & Key Amendments',
          subjectName: 'Indian Polity & Governance',
          subjectColor: '#3B82F6',
          examId: 'exam_upsc_2026',
          stage: 2,
          intervalDays: 7,
          lastRevisedAt: '2026-09-01T10:00:00.000Z',
          nextDueDate: '2026-09-08T10:00:00.000Z',
          completedStages: [1, 2],
          totalReviews: 2
        }
      ],
      plannerTasks: [],
      platforms: [],
      top3Targets: [],
      reflectionsHistory: []
    };

    // Save snapshot
    const saveRes = await saveUserCloudData(testUid, mockSnapshot);
    expect(saveRes.success).toBe(true);
    expect(saveRes.timestamp).toBeDefined();

    // Recover / Fetch snapshot
    const recovered = await fetchUserCloudData(testUid);
    expect(recovered).not.toBeNull();
    expect(recovered?.version).toBe('3.0.0');
    expect(recovered?.exams.length).toBe(1);
    expect(recovered?.exams[0].name).toBe('UPSC Civil Services 2026');
    expect(recovered?.exams[0].subjects[0].chapters[0].topics[0].customNotes).toContain('Sovereign, Socialist');
    expect(recovered?.profile.name).toBe('Aspirant Topper');
    expect(recovered?.revisions.length).toBe(1);
  });

  it('should delete user cloud data correctly', async () => {
    const testUid = 'user_delete_test_777';
    const mockSnapshot: FullAppSnapshot = {
      version: '3.0.0',
      timestamp: new Date().toISOString(),
      exams: [],
      profile: { name: 'Temp Aspirant', xp: 0, level: 1, streakDays: 0, selectedExamId: '' },
      achievements: [],
      activityHistory: [],
      revisions: [],
      plannerTasks: [],
      platforms: [],
      top3Targets: [],
      reflectionsHistory: []
    };

    await saveUserCloudData(testUid, mockSnapshot);
    const before = await fetchUserCloudData(testUid);
    expect(before).not.toBeNull();

    const delRes = await deleteUserCloudData(testUid);
    expect(delRes.success).toBe(true);

    const after = await fetchUserCloudData(testUid);
    expect(after).toBeNull();
  });
});
