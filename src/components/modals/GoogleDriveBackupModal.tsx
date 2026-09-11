import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  FileText,
  Image as ImageIcon,
  Database,
  ArrowRight,
  RefreshCw,
  Download,
  ExternalLink,
  Lock,
  X,
  Check,
  FolderSync,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Settings,
  HelpCircle
} from 'lucide-react';
import {
  getValidAccessToken,
  requestGoogleDriveToken,
  disconnectGoogleDrive,
  getCachedGoogleUser,
  getGoogleClientId,
  setGoogleClientId,
  GoogleDriveUser,
  GoogleDriveFile
} from '../../utils/googleDriveClient';
import {
  performGoogleDriveBackup,
  performGoogleDriveRestore,
  fetchGoogleDriveBackupsList,
  getBackupPreparationSummary,
  downloadCompleteDriveArchive,
  CloudBackupProgress,
  CloudBackupSummary
} from '../../utils/cloudBackupManager';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

interface GoogleDriveBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess?: () => void;
}

type ModalTab = 'backup' | 'restore' | 'offline';

export const GoogleDriveBackupModal: React.FC<GoogleDriveBackupModalProps> = ({
  isOpen,
  onClose,
  onRestoreSuccess
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('backup');
  const [isConnected, setIsConnected] = useState<boolean>(Boolean(getValidAccessToken()));
  const [googleUser, setGoogleUser] = useState<GoogleDriveUser | null>(getCachedGoogleUser());
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Custom Client ID configuration state
  const [showConfigClientId, setShowConfigClientId] = useState<boolean>(false);
  const [customClientIdInput, setCustomClientIdInput] = useState<string>(getGoogleClientId());
  const [clientIdSavedNotice, setClientIdSavedNotice] = useState<boolean>(false);

  // Backup state
  const [summaryData, setSummaryData] = useState<{
    topicsCount: number;
    examsCount: number;
    pdfCount: number;
    pdfTotalBytes: number;
    photoCount: number;
    photoTotalBytes: number;
  }>({
    topicsCount: 0,
    examsCount: 1,
    pdfCount: 0,
    pdfTotalBytes: 0,
    photoCount: 0,
    photoTotalBytes: 0
  });

  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [backupProgress, setBackupProgress] = useState<CloudBackupProgress | null>(null);
  const [backupSummary, setBackupSummary] = useState<CloudBackupSummary | null>(null);

  // Restore state
  const [isLoadingBackups, setIsLoadingBackups] = useState<boolean>(false);
  const [driveBackups, setDriveBackups] = useState<{
    databaseBackups: GoogleDriveFile[];
    pdfBackups: GoogleDriveFile[];
    photoBackups: GoogleDriveFile[];
  }>({
    databaseBackups: [],
    pdfBackups: [],
    photoBackups: []
  });
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreProgress, setRestoreProgress] = useState<CloudBackupProgress | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);

  // Refresh data on open
  useEffect(() => {
    if (isOpen) {
      setIsConnected(Boolean(getValidAccessToken()));
      setGoogleUser(getCachedGoogleUser());
      getBackupPreparationSummary().then(setSummaryData).catch(() => {});
      setConnectError(null);
    }
  }, [isOpen]);

  // Load backups when switching to restore tab
  useEffect(() => {
    if (isOpen && activeTab === 'restore' && isConnected) {
      setIsLoadingBackups(true);
      fetchGoogleDriveBackupsList()
        .then(setDriveBackups)
        .catch(err => {
          console.warn('Could not load drive backups:', err);
        })
        .finally(() => setIsLoadingBackups(false));
    }
  }, [isOpen, activeTab, isConnected]);

  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setConnectError(null);
      await requestGoogleDriveToken(customClientIdInput.trim());
      setIsConnected(true);
      setGoogleUser(getCachedGoogleUser());
      soundManager.playCompleteChime();
      haptics.success();
    } catch (err: any) {
      console.error('Google Drive connection error:', err);
      setConnectError(err.message || 'Failed to connect with Google Drive.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectGoogleDrive();
    setIsConnected(false);
    setGoogleUser(null);
    soundManager.playClick();
    haptics.light();
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleClientId(customClientIdInput.trim());
    setClientIdSavedNotice(true);
    soundManager.playClick();
    setTimeout(() => setClientIdSavedNotice(false), 2500);
  };

  const handleStartBackup = async () => {
    if (!isConnected) {
      await handleConnect();
      if (!getValidAccessToken()) return;
    }

    try {
      setIsBackingUp(true);
      setBackupSummary(null);
      soundManager.playClick();
      haptics.selection();

      const res = await performGoogleDriveBackup(progress => {
        setBackupProgress(progress);
      });

      setBackupSummary(res);
      soundManager.playLevelUp();
      haptics.success();
    } catch (err: any) {
      console.error('Backup error:', err);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExecuteRestore = async (fileId: string) => {
    try {
      setIsRestoring(true);
      setConfirmRestoreId(null);
      soundManager.playClick();
      haptics.selection();

      await performGoogleDriveRestore(fileId, progress => {
        setRestoreProgress(progress);
      });

      soundManager.playLevelUp();
      haptics.success();

      setTimeout(() => {
        if (onRestoreSuccess) onRestoreSuccess();
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error('Restore error:', err);
    } finally {
      setIsRestoring(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#12131C] border border-[#E2E8F0] dark:border-[#272738] shadow-2xl overflow-hidden animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] dark:border-[#272738] bg-[#F8FAFC]/90 dark:bg-[#161726]/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Google Drive SVG Tri-color Icon */}
            <div className="w-9 h-9 rounded-2xl bg-white dark:bg-[#1F2032] border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A8.9 8.9 0 0 0 0 53h27.5z" fill="#00ac47"/>
                <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.15z" fill="#ea4335"/>
                <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="M59.8 53H87.3c0-1.55-.4-3.1-1.2-4.5l-25.4-44c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25z" fill="#ffba00"/>
                <path d="M27.5 53h46.05l-13.75 23.8c-1.35.8-2.9 1.2-4.5 1.2h-18.5c-1.6 0-3.15-.45-4.5-1.2z" fill="#2684fc"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Google Drive Cloud Vault
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Direct Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Backup syllabus, notes, attached PDFs & diagrams to your personal Google Drive
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#202133] text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-0 border-b border-[#E2E8F0] dark:border-[#272738] bg-slate-50/50 dark:bg-[#141522] overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'backup'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#1A1B2E]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>1-Click Cloud Backup</span>
          </button>

          <button
            onClick={() => setActiveTab('restore')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'restore'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#1A1B2E]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restore from Drive</span>
          </button>

          <button
            onClick={() => setActiveTab('offline')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'offline'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#1A1B2E]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Offline Archive (.json)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">

          {/* Google Account Connection Status Bar */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#181928] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                {googleUser?.picture ? (
                  <img
                    src={googleUser.picture}
                    alt="Google User"
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                    {googleUser?.name ? googleUser.name[0].toUpperCase() : 'G'}
                  </div>
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#181928] ${
                    isConnected ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {isConnected
                      ? googleUser?.name || 'Google Drive Connected'
                      : 'Google Drive Disconnected'}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                      isConnected
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isConnected ? 'READY' : 'OFFLINE'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {isConnected && googleUser?.email
                    ? googleUser.email
                    : 'Authorize to backup files directly to Google Drive'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Cloud className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
                  <span>{isConnecting ? 'Connecting...' : 'Authorize Google Drive'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowConfigClientId(!showConfigClientId)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                title="Configure Google OAuth Client ID"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {connectError && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Authorization Note:</span>
                <span>{connectError}</span>
              </div>
            </div>
          )}

          {/* Client ID Setting Drawer (Optional for advanced users or custom GCP) */}
          {showConfigClientId && (
            <form
              onSubmit={handleSaveClientId}
              className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-[#1A1B30] border border-indigo-200 dark:border-indigo-900/60 space-y-3 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-500" />
                  Custom Google OAuth Client ID (Optional)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Web Application</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                To use your own private Google Cloud project, enter your OAuth 2.0 Client ID below. (Authorized Origins: your current app domain).
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customClientIdInput}
                  onChange={e => setCustomClientIdInput(e.target.value)}
                  placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  Save ID
                </button>
              </div>
              {clientIdSavedNotice && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Client ID saved for this browser!</span>
                </div>
              )}
            </form>
          )}

          {/* TAB 1: 1-CLICK BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              {/* 3 Categories Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Database Entity */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#181928] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      1. Syllabus & Notes
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {summaryData.topicsCount} Topics across {summaryData.examsCount} Exams
                    </span>
                  </div>
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Folder: /Database</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Included ✓</span>
                  </div>
                </div>

                {/* 2. Extra PDF Documents */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#181928] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      2. Topic PDF Notes
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {summaryData.pdfCount} PDFs ({formatBytes(summaryData.pdfTotalBytes)})
                    </span>
                  </div>
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Folder: /PDFs</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Included ✓</span>
                  </div>
                </div>

                {/* 3. Extra Photos & Diagrams */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#181928] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      3. Photos & Diagrams
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {summaryData.photoCount} Images ({formatBytes(summaryData.photoTotalBytes)})
                    </span>
                  </div>
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Folder: /Photos</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Included ✓</span>
                  </div>
                </div>
              </div>

              {/* Progress Stepper & Live Status */}
              {isBackingUp && backupProgress && (
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-950 dark:text-blue-200">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                      <span>{backupProgress.message}</span>
                    </span>
                    <span className="font-mono tabular-nums">
                      Step {backupProgress.currentStep} of {backupProgress.totalSteps}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-blue-200 dark:bg-blue-900/60 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300 rounded-full"
                      style={{
                        width: `${(backupProgress.currentStep / backupProgress.totalSteps) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Success Result Card */}
              {backupSummary && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-xs sm:text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span>Google Drive Cloud Backup Successful!</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      {backupSummary.timestamp}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Your entire study ecosystem is safely backed up to Google Drive under folder:
                    <strong className="text-slate-900 dark:text-white"> "Syllabus 3D Cloud Backups"</strong>.
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center text-xs">
                    <div className="p-2 rounded-xl bg-white/80 dark:bg-[#161726]/80 border border-emerald-200/60 dark:border-emerald-900/40">
                      <span className="text-[10px] text-slate-400 block font-sans">Database Vault</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">1 JSON File</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white/80 dark:bg-[#161726]/80 border border-emerald-200/60 dark:border-emerald-900/40">
                      <span className="text-[10px] text-slate-400 block font-sans">PDF Documents</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{backupSummary.pdfFiles.length} Uploaded</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white/80 dark:bg-[#161726]/80 border border-emerald-200/60 dark:border-emerald-900/40">
                      <span className="text-[10px] text-slate-400 block font-sans">Photos & Diagrams</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{backupSummary.photoFiles.length} Uploaded</strong>
                    </div>
                  </div>

                  {backupSummary.databaseFile.webViewLink && (
                    <div className="pt-2 flex justify-end">
                      <a
                        href={backupSummary.databaseFile.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <span>View Backup in Google Drive</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Action Trigger Button */}
              <button
                type="button"
                onClick={handleStartBackup}
                disabled={isBackingUp}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm tracking-wide shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Cloud className={`w-5 h-5 ${isBackingUp ? 'animate-spin' : ''}`} />
                <span>
                  {isBackingUp
                    ? 'Backing Up to Google Drive...'
                    : 'Start Full Backup to Google Drive'}
                </span>
              </button>
            </div>
          )}

          {/* TAB 2: RESTORE FROM DRIVE */}
          {activeTab === 'restore' && (
            <div className="space-y-4">
              {!isConnected ? (
                <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-[#181928] border border-slate-200 dark:border-slate-800 space-y-3">
                  <Cloud className="w-10 h-10 text-slate-400 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Connect Google Drive to View Backups
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                      Authorize your Google account to discover and restore your previous backups, notes, and attached PDFs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-all cursor-pointer"
                  >
                    Authorize Google Drive
                  </button>
                </div>
              ) : isLoadingBackups ? (
                <div className="p-8 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  <span className="text-xs text-slate-500 font-bold block">
                    Searching Google Drive for backups...
                  </span>
                </div>
              ) : driveBackups.databaseBackups.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-[#181928] border border-slate-200 dark:border-slate-800 space-y-2">
                  <HardDrive className="w-8 h-8 text-slate-400 mx-auto" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    No Google Drive Backups Found Yet
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Switch to the "1-Click Cloud Backup" tab and take your first backup to Google Drive.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Available Backups in Google Drive ({driveBackups.databaseBackups.length}):
                  </span>

                  <div className="space-y-2">
                    {driveBackups.databaseBackups.map(file => {
                      const isConfirming = confirmRestoreId === file.id;
                      return (
                        <div
                          key={file.id}
                          className="p-3.5 rounded-2xl bg-white dark:bg-[#181928] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-blue-500 shrink-0" />
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[260px]">
                                {file.name}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Created: {new Date(file.createdTime).toLocaleString()} • Size: {formatBytes(Number(file.size || 0))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {isConfirming ? (
                              <div className="flex items-center gap-1.5 animate-fade-in">
                                <button
                                  type="button"
                                  onClick={() => handleExecuteRestore(file.id)}
                                  disabled={isRestoring}
                                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer shadow-xs"
                                >
                                  {isRestoring ? 'Restoring...' : 'Confirm Restore'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmRestoreId(null)}
                                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmRestoreId(file.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-bold transition-all cursor-pointer"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Restore Snapshot</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isRestoring && restoreProgress && (
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-950 dark:text-blue-200">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                      <span>{restoreProgress.message}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OFFLINE ARCHIVE PACKAGE */}
          {activeTab === 'offline' && (
            <div className="p-5 rounded-2xl bg-[#F8FAFC] dark:bg-[#181928] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-500" />
                  <span>Standalone Personal Drive Vault Bundle</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  If you do not wish to authenticate via Google OAuth, you can download a complete, self-contained vault package containing all your syllabi, notes, embedded PDF records, and diagram photos to save into your Google Drive, OneDrive, or personal backup folder manually.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-[#12131C] border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 font-mono">
                <div className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Vault Contents:</div>
                <div className="text-slate-800 dark:text-slate-200">✓ Database: All {summaryData.topicsCount} Topics & Notes</div>
                <div className="text-slate-800 dark:text-slate-200">✓ Documents: {summaryData.pdfCount} Attached PDFs (Base64 preserved)</div>
                <div className="text-slate-800 dark:text-slate-200">✓ Media: {summaryData.photoCount} Study Photos & Diagrams</div>
              </div>

              <button
                type="button"
                onClick={() => {
                  downloadCompleteDriveArchive();
                  soundManager.playCompleteChime();
                  haptics.success();
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Complete Drive Vault Package (.json)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E2E8F0] dark:border-[#272738] bg-[#F8FAFC] dark:bg-[#161726] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted with Google OAuth 2.0 • Restricted app-scoped folder</span>
          </div>
          <button
            onClick={onClose}
            className="font-bold hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
