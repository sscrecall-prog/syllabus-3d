import React, { useState } from 'react';
import {
  Cloud,
  CloudOff,
  CloudUpload,
  CheckCircle2,
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FolderArchive,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  X,
  Check
} from 'lucide-react';
import { useGoogleDrive } from '../../context/GoogleDriveContext';
import { DriveBackupFile } from '../../services/googleDriveService';

export const GoogleDriveBackupCard: React.FC = () => {
  const {
    isDriveConnected,
    connectedUser,
    config,
    syncStatus,
    isSyncing,
    lastSyncError,
    availableBackups,
    isLoadingBackups,
    connectDrive,
    disconnectDrive,
    toggleAutoBackup,
    setBackupFrequency,
    setCustomClientId,
    backupNow,
    restoreFromCloud,
    refreshBackupsList,
    deleteCloudBackup
  } = useGoogleDrive();

  // Local UI State
  const [showBackupsModal, setShowBackupsModal] = useState(false);
  const [showConfigAccordion, setShowConfigAccordion] = useState(false);
  const [customClientIdInput, setCustomClientIdInput] = useState(config.clientId || '');
  const [clientIdSaved, setClientIdSaved] = useState(false);
  const [restoringFileId, setRestoringFileId] = useState<string | null>(null);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomClientId(customClientIdInput);
    setClientIdSaved(true);
    setTimeout(() => setClientIdSaved(false), 3000);
  };

  const handleBackupNowClick = async () => {
    setActionNotice(null);
    const res = await backupNow(false);
    if (res.success) {
      setActionNotice('Backup successfully uploaded to your Google Drive!');
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleRestoreFile = async (file: DriveBackupFile) => {
    if (!window.confirm(`Restore your data from "${file.name}"? Current local data will be replaced by this cloud snapshot.`)) {
      return;
    }
    setRestoringFileId(file.id);
    setRestoreSuccessMsg(null);
    try {
      const ok = await restoreFromCloud(file.id);
      if (ok) {
        setRestoreSuccessMsg(`Successfully restored from ${file.name}!`);
        setTimeout(() => {
          setRestoreSuccessMsg(null);
          setShowBackupsModal(false);
        }, 3000);
      }
    } finally {
      setRestoringFileId(null);
    }
  };

  const handleDeleteFile = async (file: DriveBackupFile) => {
    if (!window.confirm(`Permanently delete "${file.name}" from Google Drive?`)) {
      return;
    }
    await deleteCloudBackup(file.id);
  };

  return (
    <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[#F8FAFC] dark:bg-[#1F2335] border border-slate-200 dark:border-[#292E42] space-y-3.5 sm:space-y-4 transition-all">
      {/* ── CARD HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200 dark:border-[#292E42]/60">
        <div className="flex items-center gap-2.5">
          {/* Google Drive Multi-Color Icon Badge */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white dark:bg-[#16161E] border border-slate-200 dark:border-[#292E42] flex items-center justify-center shadow-xs shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-[14px] font-bold text-slate-900 dark:text-[#C0CAF5] leading-tight">
                Google Drive Cloud Backup (Gmail)
              </h4>
              <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-[#7AA2F7] border border-blue-500/20">
                Optional
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-[#A9B1D6]">
              Securely save your study syllabus, custom notes & daily reflections to your personal Google Drive.
            </p>
          </div>
        </div>

        {/* Client-Side Privacy Badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium shrink-0 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>100% Client-Side • Scoped Only</span>
        </div>
      </div>

      {/* ── NOT CONNECTED STATE ── */}
      {!isDriveConnected && (
        <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-[#16161E] border border-slate-200 dark:border-[#24283B] space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-[#C0CAF5] block">
                Connect your Google Account
              </span>
              <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-[#A9B1D6] max-w-xl">
                Only accesses its own dedicated folder (<code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-blue-600 dark:text-[#7AA2F7]">Syllabus 3D Backups</code>).
                Never touches your personal photos, files, or emails.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => connectDrive()}
                disabled={isSyncing}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-700 text-white dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] dark:text-[#0B0B0D] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Connect Google Drive</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {lastSyncError && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{lastSyncError}</span>
            </div>
          )}

          {/* Self-Host / Custom Google Cloud Client ID Drawer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowConfigAccordion(!showConfigAccordion)}
              className="flex items-center justify-between w-full text-left text-[11px] text-slate-500 dark:text-[#787C99] hover:text-slate-700 dark:hover:text-[#C0CAF5] font-medium cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                Custom Google Cloud OAuth Client ID (Optional for custom domains / self-host)
              </span>
              {showConfigAccordion ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showConfigAccordion && (
              <div className="mt-2.5 p-3 rounded-lg bg-slate-50 dark:bg-[#12141F] border border-slate-200 dark:border-[#24283B] space-y-2 text-[11px]">
                <p className="text-slate-600 dark:text-[#A9B1D6]">
                  By default, 1-click cloud sync works out-of-the-box. If you deploy on your own domain or want full ownership via Google Cloud Console:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-500 dark:text-[#787C99] pl-1">
                  <li>Create a project in <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-[#7AA2F7] underline inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink className="w-2.5 h-2.5" /></a></li>
                  <li>Enable <strong>Google Drive API</strong> in APIs & Services.</li>
                  <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web Application) with your origin URL.</li>
                  <li>Paste the generated Client ID below:</li>
                </ol>

                <form onSubmit={handleSaveClientId} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customClientIdInput}
                    onChange={(e) => setCustomClientIdInput(e.target.value)}
                    placeholder="e.g. 123456789-xxxx.apps.googleusercontent.com"
                    className="flex-1 px-2.5 py-1.5 rounded-md bg-white dark:bg-[#1A1D2D] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-md bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </form>

                {clientIdSaved && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold block">
                    ✓ Custom Google Client ID saved successfully!
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CONNECTED STATE ── */}
      {isDriveConnected && (
        <div className="space-y-3">
          {/* Account & Connection Bar */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#16161E] border border-slate-200 dark:border-[#24283B] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-[#7AA2F7] font-bold text-xs flex items-center justify-center border border-blue-200 dark:border-blue-800 shrink-0">
                {connectedUser?.email?.charAt(0).toUpperCase() || 'G'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-[#C0CAF5] truncate">
                    {connectedUser?.email}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Connected
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-[#787C99] block">
                  Folder: Google Drive / {config.useSimulatedMode ? 'Syllabus 3D Backups (Local Vault)' : 'Syllabus 3D Backups'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={disconnectDrive}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1F2335] hover:bg-rose-500/15 hover:text-rose-600 text-slate-600 dark:text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <CloudOff className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>

          {/* ── AUTOMATIC BACKUP SETTINGS (OPTIONAL, DEFAULT OFF) ── */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#16161E] border border-slate-200 dark:border-[#24283B] space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-[#C0CAF5] block leading-tight">
                  Automatic Google Drive Backup
                </span>
                <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-[#A9B1D6]">
                  Seamlessly uploads fresh snapshots of your syllabus progress to your Google Drive.
                </p>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={config.isAutoBackup}
                  onChange={(e) => toggleAutoBackup(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-[#7AA2F7]"></div>
              </label>
            </div>

            {/* Backup Frequency Config (when Auto-Backup is enabled) */}
            {config.isAutoBackup && (
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#12141F] border border-slate-200 dark:border-[#24283B] space-y-2 animate-fade-in">
                <span className="text-[11px] font-bold text-slate-700 dark:text-[#C0CAF5] block">
                  Auto-Backup Frequency:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBackupFrequency('realtime_debounced')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-left transition-all border cursor-pointer ${
                      config.frequency === 'realtime_debounced'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-[#93C5FD] border-blue-300 dark:border-blue-700 shadow-xs'
                        : 'bg-white dark:bg-[#1A1D2D] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold">Continuous Auto-Sync</div>
                    <div className="text-[9px] opacity-80">Debounced after active study</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBackupFrequency('daily_end')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-left transition-all border cursor-pointer ${
                      config.frequency === 'daily_end'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-[#93C5FD] border-blue-300 dark:border-blue-700 shadow-xs'
                        : 'bg-white dark:bg-[#1A1D2D] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold">Daily Night Journal</div>
                    <div className="text-[9px] opacity-80">Saves with daily reflection</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBackupFrequency('manual')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-left transition-all border cursor-pointer ${
                      config.frequency === 'manual'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-[#93C5FD] border-blue-300 dark:border-blue-700 shadow-xs'
                        : 'bg-white dark:bg-[#1A1D2D] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold">Manual Trigger Only</div>
                    <div className="text-[9px] opacity-80">Sync only on button click</div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── LIVE STATUS TELEMETRY & ACTIONS ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="text-[11px] font-mono flex items-center gap-1.5 text-slate-600 dark:text-[#A9B1D6]">
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                  <span>Syncing with Google Drive...</span>
                </>
              ) : syncStatus === 'synced' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Last Synced: {config.lastBackupAt || 'Just now'}</span>
                </>
              ) : config.lastBackupAt ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-blue-500" />
                  <span>Last Drive Backup: {config.lastBackupAt}</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-slate-400" />
                  <span>No Drive backups created yet</span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleBackupNowClick}
                disabled={isSyncing}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-700 text-white dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] dark:text-[#0B0B0D] text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>{isSyncing ? 'Uploading...' : 'Backup to Drive Now'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  refreshBackupsList();
                  setShowBackupsModal(true);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg sm:rounded-xl bg-white dark:bg-[#16161E] hover:bg-slate-100 dark:hover:bg-[#24283B] text-slate-900 dark:text-[#C0CAF5] text-xs font-bold border border-slate-200 dark:border-[#292E42] transition-all cursor-pointer active:scale-95"
              >
                <FolderArchive className="w-3.5 h-3.5 text-blue-600 dark:text-[#7AA2F7]" />
                <span>Manage Backups ({availableBackups.length})</span>
              </button>
            </div>
          </div>

          {actionNotice && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>{actionNotice}</span>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: MANAGE & RESTORE CLOUD BACKUPS
          ═══════════════════════════════════════════════════════ */}
      {showBackupsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#16161E] border border-slate-200 dark:border-[#24283B] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-[#24283B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-blue-600 dark:text-[#7AA2F7]" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Google Drive Cloud Backups
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                    Folder: <span className="font-mono">Syllabus 3D Backups</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBackupsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Notice */}
            {restoreSuccessMsg && (
              <div className="m-3 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{restoreSuccessMsg}</span>
              </div>
            )}

            {/* Modal Body / Backups List */}
            <div className="p-3 sm:p-4 overflow-y-auto space-y-2 flex-1">
              {isLoadingBackups ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-xs gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                  <span>Fetching backups from Google Drive...</span>
                </div>
              ) : availableBackups.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs space-y-2">
                  <Cloud className="w-8 h-8 mx-auto text-slate-400 stroke-1" />
                  <p>No backups found in your Google Drive folder yet.</p>
                  <button
                    type="button"
                    onClick={async () => {
                      await backupNow(false);
                      refreshBackupsList();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    Create First Backup Now
                  </button>
                </div>
              ) : (
                availableBackups.map((file) => (
                  <div
                    key={file.id}
                    className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-[#1A1D2D] border border-slate-200 dark:border-[#24283B] flex items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {file.name}
                        </span>
                        {file.isAutoBackup ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Auto
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            Manual
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{file.modifiedTime}</span>
                        <span>•</span>
                        <span>{file.sizeFormatted}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRestoreFile(file)}
                        disabled={restoringFileId === file.id}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white dark:bg-[#7AA2F7] dark:hover:bg-[#6090F5] dark:text-[#0B0B0D] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        {restoringFileId === file.id ? 'Restoring...' : 'Restore'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFile(file)}
                        title="Delete from Drive"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-[#24283B] bg-slate-50 dark:bg-[#12141F] flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                {availableBackups.length} backup{availableBackups.length === 1 ? '' : 's'} available
              </span>
              <button
                type="button"
                onClick={() => setShowBackupsModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
