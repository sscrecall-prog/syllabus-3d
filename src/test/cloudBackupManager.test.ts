import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  dataUrlToBlob,
  collectFullDatabaseSnapshot,
  extractAllPhotoAttachments,
  getBackupPreparationSummary
} from '../utils/cloudBackupManager';
import {
  getGoogleClientId,
  setGoogleClientId,
  getValidAccessToken,
  storeAccessToken,
  disconnectGoogleDrive,
  DEFAULT_GOOGLE_CLIENT_ID
} from '../utils/googleDriveClient';

describe('cloudBackupManager & googleDriveClient', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('googleDriveClient config & session', () => {
    it('should return default client ID when no custom ID is configured', () => {
      expect(getGoogleClientId()).toBe(DEFAULT_GOOGLE_CLIENT_ID);
    });

    it('should save and retrieve custom client ID', () => {
      setGoogleClientId('custom-id-12345.apps.googleusercontent.com');
      expect(getGoogleClientId()).toBe('custom-id-12345.apps.googleusercontent.com');

      setGoogleClientId('');
      expect(getGoogleClientId()).toBe(DEFAULT_GOOGLE_CLIENT_ID);
    });

    it('should handle access token storage, retrieval and disconnection', () => {
      expect(getValidAccessToken()).toBeNull();

      storeAccessToken('mock_access_token_abc', 3600);
      expect(getValidAccessToken()).toBe('mock_access_token_abc');

      disconnectGoogleDrive();
      expect(getValidAccessToken()).toBeNull();
    });
  });

  describe('dataUrlToBlob', () => {
    it('should correctly convert a PNG dataURL into a binary Blob', () => {
      // 1x1 transparent PNG dataURL
      const samplePngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const blob = dataUrlToBlob(samplePngDataUrl);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('collectFullDatabaseSnapshot', () => {
    it('should collect relevant syllabus, profile, exam, and note keys', () => {
      localStorage.setItem('syllabus3d_profile', JSON.stringify({ name: 'Aspirant A', level: 5 }));
      localStorage.setItem('syllabus3d_exams', JSON.stringify([{ id: 'cgl_2026', name: 'SSC CGL' }]));
      localStorage.setItem('syllabus3d_data_cgl_2026', JSON.stringify([{ id: 'sub_math', name: 'Math' }]));
      localStorage.setItem('other_unrelated_key', 'should_not_interfere');

      const snapshot = collectFullDatabaseSnapshot();

      expect(snapshot.version).toBe('2.0');
      expect(snapshot.appName).toBe('Syllabus 3D Precision Desk');
      expect(snapshot.data['syllabus3d_profile']).toEqual({ name: 'Aspirant A', level: 5 });
      expect(snapshot.data['syllabus3d_exams']).toEqual([{ id: 'cgl_2026', name: 'SSC CGL' }]);
      expect(snapshot.data['syllabus3d_data_cgl_2026']).toEqual([{ id: 'sub_math', name: 'Math' }]);
    });
  });

  describe('extractAllPhotoAttachments', () => {
    it('should extract images attached to topics across syllabi', () => {
      const samplePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

      const mockSyllabus = [
        {
          id: 'sub_1',
          name: 'History',
          chapters: [
            {
              id: 'chap_1',
              name: 'Ancient',
              topics: [
                {
                  id: 'top_1',
                  name: 'Indus Valley',
                  images: [
                    {
                      id: 'img_1',
                      title: 'Harappa Map',
                      dataUrl: samplePng,
                      addedAt: new Date().toISOString()
                    }
                  ]
                }
              ]
            }
          ]
        }
      ];

      localStorage.setItem('syllabus3d_data_exam1', JSON.stringify(mockSyllabus));

      const photos = extractAllPhotoAttachments();
      expect(photos.length).toBe(1);
      expect(photos[0].id).toBe('img_1');
      expect(photos[0].topicName).toBe('Indus Valley');
      expect(photos[0].title).toBe('Harappa Map');
      expect(photos[0].blob.type).toBe('image/png');
    });
  });

  describe('getBackupPreparationSummary', () => {
    it('should provide total counts for topics, exams, and photos', async () => {
      localStorage.setItem('syllabus3d_exams', JSON.stringify([
        { id: 'exam1', name: 'Exam 1' },
        { id: 'exam2', name: 'Exam 2' }
      ]));

      const mockSyllabus = [
        {
          id: 'sub_1',
          chapters: [
            {
              id: 'chap_1',
              topics: [{ id: 'top_1' }, { id: 'top_2' }]
            }
          ]
        }
      ];

      localStorage.setItem('syllabus3d_data_exam1', JSON.stringify(mockSyllabus));

      const summary = await getBackupPreparationSummary();
      expect(summary.examsCount).toBe(2);
      expect(summary.topicsCount).toBe(2);
      expect(typeof summary.pdfCount).toBe('number');
      expect(typeof summary.photoCount).toBe('number');
    });
  });
});
