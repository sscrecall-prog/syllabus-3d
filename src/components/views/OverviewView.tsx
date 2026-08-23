import React from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { ProgressOrb } from '../3d/ProgressOrb';
import { SubjectCard3D } from '../3d/SubjectCard3D';
import { RotateCw, AlertTriangle, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { AppView } from '../layout/Sidebar';
import { Topic } from '../../types/syllabus';

interface OverviewViewProps {
  onNavigate: (view: AppView) => void;
  onOpenTopicDrawer: (topic: Topic, subName: string, chName: string) => void;
  onOpenRevisionSession: () => void;
  onOpenAddTopic: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onOpenTopicDrawer,
  onOpenRevisionSession,
  onOpenAddTopic,
}) => {
  const {
    profile,
    currentExam,
    overallStats,
    subjectStats,
    dueRevisions,
    weakTopics,
  } = useSyllabus();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (!currentExam) return null;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}, <span className="text-brand-500">{profile.name}</span> 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            You are on a <span className="font-semibold text-orange-500">{profile.currentStreak}-day consistency streak</span>. {dueRevisions.length} revisions warming up in your spaced queue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenRevisionSession}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold transition-all"
          >
            <RotateCw className="w-4 h-4" />
            <span>Revise Now ({dueRevisions.length})</span>
          </button>

          <button
            onClick={onOpenAddTopic}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md transition-all"
          >
            <span>+ Add Topic</span>
          </button>
        </div>
      </div>

      <div className="relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <ProgressOrb percentage={overallStats.completionPercentage} size="lg" />
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Overall Syllabus Mastery
                </span>
                <span className="text-sm font-bold text-brand-500">
                  {overallStats.completedCount} / {overallStats.totalTopics} Topics Completed
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 via-purple-500 to-emerald-500 transition-all duration-1000"
                  style={{ width: `${overallStats.completionPercentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                <div className="flex items-center gap-2 text-emerald-500 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">Mastered</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {overallStats.completedCount}
                </h3>
                <p className="text-[10px] text-slate-500">Topics done</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                  <RotateCw className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">Revisions</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {dueRevisions.length}
                </h3>
                <p className="text-[10px] text-slate-500">Due for review</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                <div className="flex items-center gap-2 text-rose-500 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">Weak</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {weakTopics.length}
                </h3>
                <p className="text-[10px] text-slate-500">Accuracy &lt; 60%</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                <div className="flex items-center gap-2 text-brand-500 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">Study Time</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {overallStats.totalStudyHours}h
                </h3>
                <p className="text-[10px] text-slate-500">{overallStats.averageAccuracy}% Avg Accuracy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Subject Tracking
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Move your mouse over cards to experience 3D parallax tilt
            </p>
          </div>

          <button
            onClick={() => onNavigate('subjects')}
            className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentExam.subjects.map(subject => {
            const stat = subjectStats.find(s => s.subjectId === subject.id) || {
              completedTopics: 0,
              totalTopics: 0,
              percentage: 0,
              weakCount: 0,
              lastStudied: null
            };

            return (
              <SubjectCard3D
                key={subject.id}
                subject={subject}
                completedTopics={stat.completedTopics}
                totalTopics={stat.totalTopics}
                percentage={stat.percentage}
                weakCount={stat.weakCount}
                lastStudied={stat.lastStudied}
                onClick={() => onNavigate('syllabus')}
              />
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <RotateCw className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Spaced Revision Queue
                </h4>
                <p className="text-xs text-slate-500">
                  {dueRevisions.length} topics due for recall
                </p>
              </div>
            </div>

            <button
              onClick={onOpenRevisionSession}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/20"
            >
              Revise All
            </button>
          </div>

          <div className="space-y-2.5">
            {dueRevisions.slice(0, 4).map(rev => (
              <div
                key={rev.id}
                onClick={onOpenRevisionSession}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40 cursor-pointer hover:scale-[1.01] transition-all"
              >
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    {rev.topicName}
                  </h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {rev.subjectName} · Stage {rev.stage}
                  </p>
                </div>

                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                  Due Today
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Weak Topics Alert
                </h4>
                <p className="text-xs text-slate-500">
                  Auto-detected from accuracy &lt; 60%
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('weak')}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-500/20"
            >
              Diagnose
            </button>
          </div>

          <div className="space-y-2.5">
            {weakTopics.slice(0, 4).map(w => (
              <div
                key={w.topic.id}
                onClick={() => onOpenTopicDrawer(w.topic, w.subjectName, w.chapterName)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40 cursor-pointer hover:scale-[1.01] transition-all"
              >
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    {w.topic.name}
                  </h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {w.subjectName} · {w.chapterName}
                  </p>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-500 text-[10px] font-bold">
                    {w.topic.accuracy}% Accuracy
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
