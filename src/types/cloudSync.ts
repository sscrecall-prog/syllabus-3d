import { Exam, AchievementBadge, UserProgressProfile, DailyActivity, RevisionRecord, PlannerTask } from './syllabus';

export type SyncStatusType = 'synced' | 'syncing' | 'idle' | 'offline' | 'error';

export interface CloudSyncPayload {
  version: string;
  userId: string;
  userEmail: string;
  updatedAt: string;
  deviceId: string;
  exams: Exam[];
  profile: UserProgressProfile;
  achievements: AchievementBadge[];
  activityHistory: DailyActivity[];
  revisions: RevisionRecord[];
  plannerTasks: PlannerTask[];
}

export interface CloudBackendConfig {
  type: 'default' | 'firebase' | 'supabase';
  endpointUrl?: string;
  apiKey?: string;
  syncCode?: string;
}
