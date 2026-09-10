import { describe, it, expect, beforeEach } from 'vitest';
import { googleDriveService, DEFAULT_DRIVE_CONFIG } from './googleDriveService';

describe('googleDriveService', () => {
  beforeEach(() => {
    localStorage.clear();
    googleDriveService.disconnect();
  });

  it('should return default config initially', () => {
    const config = googleDriveService.getConfig();
    expect(config.isAutoBackup).toBe(false);
    expect(config.frequency).toBe('realtime_debounced');
    expect(config.backupFolderId).toBeNull();
  });

  it('should update and persist config', () => {
    googleDriveService.saveConfig({
      isAutoBackup: true,
      frequency: 'daily_end',
      clientId: 'test-client-id.apps.googleusercontent.com'
    });

    const updated = googleDriveService.getConfig();
    expect(updated.isAutoBackup).toBe(true);
    expect(updated.frequency).toBe('daily_end');
    expect(updated.clientId).toBe('test-client-id.apps.googleusercontent.com');
  });

  it('should format bytes accurately', () => {
    expect(googleDriveService.formatBytes(0)).toBe('0 B');
    expect(googleDriveService.formatBytes(1024)).toBe('1 KB');
    expect(googleDriveService.formatBytes(1024 * 1024)).toBe('1 MB');
    expect(googleDriveService.formatBytes(500 * 1024)).toBe('500 KB');
  });

  it('should handle simulated cloud account connection and disconnection', () => {
    expect(googleDriveService.isConnected()).toBe(false);

    const authRes = googleDriveService.connectSimulatedAccount('topper.aspirant@gmail.com', 'Topper Aspirant');
    expect(authRes.success).toBe(true);
    expect(authRes.user.email).toBe('topper.aspirant@gmail.com');
    expect(googleDriveService.isConnected()).toBe(true);
    expect(googleDriveService.getConnectedUser()?.email).toBe('topper.aspirant@gmail.com');

    googleDriveService.disconnect();
    expect(googleDriveService.isConnected()).toBe(false);
    expect(googleDriveService.getConnectedUser()).toBeNull();
  });

  it('should upload, list, download, and delete backups in cloud simulation mode', async () => {
    googleDriveService.connectSimulatedAccount('cloud.student@gmail.com', 'Cloud Student');

    const sampleBackupData = JSON.stringify({
      version: '2.1.0',
      exportedAt: new Date().toISOString(),
      activeProfileId: 'prof_default',
      profiles: [{ id: 'prof_default', name: 'Cloud Student' }],
      exams: [{ id: 'cgl_2026', name: 'SSC CGL 2026' }],
      profile: { name: 'Cloud Student', xp: 500, level: 3 },
      achievements: [],
      activityHistory: [],
      revisions: [],
      plannerTasks: [],
      platforms: [],
      top3Targets: [{ id: 't1', text: 'Master Number Systems', completed: true }],
      reflectionsHistory: [{ id: 'r1', timestamp: new Date().toISOString(), summary: 'Great study day' }]
    });

    // 1. Upload backup
    const uploadRes = await googleDriveService.uploadBackup(sampleBackupData, false);
    expect(uploadRes.success).toBe(true);
    expect(uploadRes.fileId).toBeDefined();
    expect(uploadRes.filename).toContain('syllabus3d_backup_');

    // 2. List backups
    const backups = await googleDriveService.listBackups();
    expect(backups.length).toBe(1);
    expect(backups[0].id).toBe(uploadRes.fileId);
    expect(backups[0].size).toBeGreaterThan(0);
    expect(backups[0].isAutoBackup).toBe(false);

    // 3. Download backup
    const downloaded = await googleDriveService.downloadBackup(uploadRes.fileId!);
    expect(downloaded).toBe(sampleBackupData);
    const parsed = JSON.parse(downloaded!);
    expect(parsed.version).toBe('2.1.0');
    expect(parsed.profile.name).toBe('Cloud Student');
    expect(parsed.top3Targets[0].text).toBe('Master Number Systems');

    // 4. Delete backup
    const deleteRes = await googleDriveService.deleteBackup(uploadRes.fileId!);
    expect(deleteRes).toBe(true);
    const backupsAfterDelete = await googleDriveService.listBackups();
    expect(backupsAfterDelete.length).toBe(0);
  });

  it('should correctly flag automatic backups vs manual backups', async () => {
    googleDriveService.connectSimulatedAccount();

    const sampleData = JSON.stringify({ test: 'auto-backup' });
    const autoRes = await googleDriveService.uploadBackup(sampleData, true);
    expect(autoRes.success).toBe(true);
    expect(autoRes.filename).toContain('syllabus3d_autobackup_');

    const backups = await googleDriveService.listBackups();
    expect(backups[0].isAutoBackup).toBe(true);
  });
});
