import React, { useState, useRef } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { Download, Upload, RotateCcw, Save, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { profile, updateProfile, resetToDemo, exportData, importData } = useSyllabus();

  const [name, setName] = useState(profile.name);
  const [examDate, setExamDate] = useState(profile.targetExamDate);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [infomsg, setInfomsg] = useState('');
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
    setInfomsg('All data exported successfully!');
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
          setInfomsg('Data imported successfully!');
        } else {
          setInfomsg('Invalid JSON data format.');
        }
        setTimeout(() => setInfomsg(''), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Preferences & Data
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage profile, targets, sounds, local storage backups, and syllabus resets.
        </p>
      </div>

      {infomsg && (
        <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-600 dark:text-brand-400 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          {infomsg}
        </div>
      )}

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
          Aspirant Profile
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Student Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Target Exam Date</label>
              <input
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                required
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md transition-all"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Saved!' : 'Update Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
          Preparation Data Storage
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          All your progress is saved locally in your browser. Export a JSON backup to sync with another device or restore your preparation state.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Syllabus JSON</span>
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Import Restore JSON</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Reset all topics and progress back to the fresh demo SSC CGL 2026 dataset?')) {
                resetToDemo();
                setInfomsg('Reset to demo syllabus data successfully!');
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
