import React from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { SubjectCard3D } from '../3d/SubjectCard3D';
import { ArrowRight } from 'lucide-react';
import { AppView } from '../layout/Sidebar';
import { Topic } from '../../types/syllabus';

interface SubjectsViewProps {
  onNavigate: (view: AppView) => void;
  onOpenTopicDrawer: (topic: Topic, subName: string, chName: string) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({ onNavigate }) => {
  const { currentExam, subjectStats } = useSyllabus();

  if (!currentExam) return null;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Subject Deep Dive
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Holistic preparation across Quantitative Aptitude, Reasoning, English, and General Awareness.
        </p>
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

      <div className="space-y-6">
        {currentExam.subjects.map(subject => {
          const stat = subjectStats.find(s => s.subjectId === subject.id);
          const totalTopics = subject.chapters.reduce((acc, ch) => acc + ch.topics.length, 0);
          const doneTopics = subject.chapters.reduce(
            (acc, ch) => acc + ch.topics.filter(t => t.status === 'completed').length,
            0
          );

          return (
            <div
              key={subject.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${subject.color}20` }}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {subject.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {subject.chapters.length} Chapters · {doneTopics} / {totalTopics} Topics Completed · {stat?.avgAccuracy || 80}% Accuracy
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('syllabus')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition-colors"
                >
                  <span>Open in Explorer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subject.chapters.map(chap => {
                  const chDone = chap.topics.filter(t => t.status === 'completed').length;
                  const chPct = chap.topics.length > 0 ? Math.round((chDone / chap.topics.length) * 100) : 0;

                  return (
                    <div
                      key={chap.id}
                      className="p-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                          {chap.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                          {chap.description}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          <span>{chDone} / {chap.topics.length} Topics</span>
                          <span>{chPct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${chPct}%`, backgroundColor: subject.color }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
