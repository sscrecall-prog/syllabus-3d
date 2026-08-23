import React, { useState } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { RotateCw, Play } from 'lucide-react';
import { getTodayDateString, formatDateReadable, isDatePastOrToday } from '../../utils/dateUtils';

interface RevisionViewProps {
  onOpenRevisionSession: () => void;
}

export const RevisionView: React.FC<RevisionViewProps> = ({ onOpenRevisionSession }) => {
  const { revisions, dueRevisions } = useSyllabus();
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'history'>('today');

  const today = getTodayDateString();
  const dueList = revisions.filter(r => !r.completedDate && (isDatePastOrToday ? isDatePastOrToday(r.scheduledDate) : r.scheduledDate <= today));
  const upcomingList = revisions.filter(r => !r.completedDate && r.scheduledDate > today);
  const historyList = revisions.filter(r => r.completedDate);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Spaced Revision Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Retain 100% of what you learn via 1 → 3 → 7 → 21 day scientific revision intervals.
          </p>
        </div>

        <button
          onClick={onOpenRevisionSession}
          disabled={dueRevisions.length === 0}
          className="flex items-center gap-2.5 px-6 py-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold shadow-md transition-all"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Start Revision Session ({dueRevisions.length})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Due Today
          </span>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {dueList.length}
          </h3>
          <p className="text-xs text-slate-500">Requires recall practice</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
            Upcoming This Week
          </span>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {upcomingList.length}
          </h3>
          <p className="text-xs text-slate-500">Scheduled next 7 days</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Mastered Cards
          </span>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {historyList.length}
          </h3>
          <p className="text-xs text-slate-500">Revisions successfully completed</p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-1">
        {[
          { id: 'today', label: `Due Today (${dueList.length})` },
          { id: 'upcoming', label: `Upcoming Schedule (${upcomingList.length})` },
          { id: 'history', label: `History (${historyList.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'today' | 'upcoming' | 'history')}
            className={`px-4.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {activeTab === 'today' && (
          dueList.length > 0 ? (
            dueList.map(rev => (
              <div
                key={rev.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      Stage {rev.stage} ({rev.intervalDays} Days)
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {rev.subjectName} · {rev.chapterName}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {rev.topicName}
                  </h4>
                </div>

                <button
                  onClick={onOpenRevisionSession}
                  className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-500/20"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Revise Now
                </button>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-xs text-slate-400">
              ✨ Nothing due for revision today! Great preparation pace.
            </div>
          )
        )}

        {activeTab === 'upcoming' && (
          upcomingList.length > 0 ? (
            upcomingList.map(rev => (
              <div
                key={rev.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {rev.topicName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {rev.subjectName} · Stage {rev.stage}
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {formatDateReadable(rev.scheduledDate)}
                </span>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-xs text-slate-400">
              No upcoming revisions scheduled yet.
            </div>
          )
        )}

        {activeTab === 'history' && (
          historyList.length > 0 ? (
            historyList.map(rev => (
              <div
                key={rev.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {rev.topicName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {rev.subjectName} · Completed on {formatDateReadable(rev.completedDate || '')}
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  Revised
                </span>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-xs text-slate-400">
              No revision history recorded yet.
            </div>
          )
        )}
      </div>
    </div>
  );
};
