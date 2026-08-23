import React, { useState, useRef } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { Download, Upload, RotateCcw, Save, Check, Trash2, Sparkles, ShieldAlert } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { profile, updateProfile, resetToDemo, clearAllDemoData, exportData, importData } = useSyllabus();

  const [name, setName] = useState(profile.name);
  const [examDate, setExamDate] = useState(profile.targetExamDate);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [infomsg, setInfomsg] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, targetExamDate: examDate });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syllabus-3d-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setInfomsg('All syllabus data exported successfully!');
    setTimeout(() => setInfomsg(''), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = revent => {
      const content = revent.target?.result as string;
      if (content) {
        const ok = importData(content);
        if (ok) {
          setInfomsg('Data backup restored successfully!');
        } else {
          setInfomsg('Invalid JSON format.');
        }
        setTimeout(() => setInfomsg(''), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    clearAllDemoData();
    setShowClearConfirm(false);
    setInfomsg('All demo data cleared! You now have a clean & blank syllabus.');
    setTimeout(() => setInfomsg(''), 4000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 max-w-4xl">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Preferences & Data Management
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Profile settings, JSON backups, and syllabus reset controls.
        </p>
      </div>

      {infomsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{infomsg}</span>
        </div>
      )}

      {/* Aspirant Profile Card */}
      <div className="p-5 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
          Aspirant Profile
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Student Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Exam Date
              </label>
              <input
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                required
                className="w-full p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Saved!' : 'Update Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Backup & JSON Sync Card */}
      <div className="p-5 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
          Backup & Data Sync
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          All your custom subjects, topics, and study logs are stored locally in your browser. Export backups anytime.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup JSON</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Import / Restore JSON</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Clear Demo Data / Restore Sample */}
      <div className="p-5 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/85 border border-rose-200/80 dark:border-rose-900/40 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-rose-500">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-base font-extrabold">
            Data Reset & Clean Canvas
          </h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Want a completely fresh and empty tracker? You can wipe all pre-filled demo subjects and start with a clean, blank slate. You can also restore the default SSC CGL demo syllabus anytime.
        </p>

        {showClearConfirm ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">
              ⚠️ Are you sure you want to wipe all demo data?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              This will remove all pre-loaded subjects, chapters, topics, flashcards, and XP. The app will become completely blank so you can add your custom syllabus.
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md"
              >
                Yes, Wipe & Make Blank
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* Clear All Demo Data Button */}
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 active:scale-95 shadow-md shadow-rose-500/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Demo Data (Start Blank)</span>
            </button>

            {/* Restore Demo Data Button */}
            <button
              onClick={() => {
                if (confirm('Restore the default SSC CGL 2026 sample syllabus with Quant, Reasoning, English, and GA?')) {
                  resetToDemo();
                  setInfomsg('Restored sample SSC CGL 2026 syllabus successfully!');
                  setTimeout(() => setInfomsg(''), 3000);
                }
              }}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span>Restore Demo Syllabus</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
