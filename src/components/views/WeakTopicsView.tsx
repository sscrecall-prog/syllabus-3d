import React, { useState } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Topic } from '../../types/syllabus';

interface WeakTopicsViewProps {
  onOpenTopicDrawer: (topic: Topic, subName: string, chName: string) => void;
}

export const WeakTopicsView: React.FC<WeakTopicsViewProps> = ({ onOpenTopicDrawer }) => {
  const { weakTopics, currentExam } = useSyllabus();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const filteredWeakTopics = weakTopics.filter(wt => {
    if (selectedSubject === 'all') return true;
    return wt.subjectName === selectedSubject;
  });

  let conceptual = 0;
  let calculation = 0;
  let formula = 0;
  let silly = 0;
  let timePressure = 0;

  weakTopics.forEach(item => {
    item.topic.mistakes.forEach(m => {
      if (m.mistakeType === 'conceptual') conceptual++;
      else if (m.mistakeType === 'calculation') calculation++;
      else if (m.mistakeType === 'formula') formula++;
      else if (m.mistakeType === 'silly') silly++;
      else if (m.mistakeType === 'time_pressure') timePressure++;
    });
  });

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Weak Areas Diagnostics
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Auto-detected vulnerabilities, fallible questions, and mistake logs to turn weaknesses into strengths.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Root-Cause Mistake Distribution
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Conceptual</span>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{conceptual}</h4>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Calculation</span>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{calculation}</h4>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Formula</span>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formula}</h4>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Silly Errors</span>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{silly}</h4>
          </div>

          <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase">Time Pressure</span>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{timePressure}</h4>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedSubject('all')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${selectedSubject === 'all' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
        >
          All Subjects ({weakTopics.length})
        </button>

        {currentExam?.subjects.map(s => {
          const count = weakTopics.filter(w => w.subjectName === s.name).length;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedSubject(s.name)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${selectedSubject === s.name ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
            >
              {s.name} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {filteredWeakTopics.length > 0 ? (
          filteredWeakTopics.map(item => (
            <div
              key={item.topic.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                      {item.subjectName} · {item.chapterName}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {item.topic.name}
                  </h3>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Accuracy Score</span>
                    <h4 className="text-lg font-bold text-rose-500">
                      {item.topic.accuracy}%
                    </h4>
                  </div>

                  <button
                    onClick={() => onOpenTopicDrawer(item.topic, item.subjectName, item.chapterName)}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-rose-500/20"
                  >
                    <span>Practice & Remedy</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {item.topic.mistakes.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {item.topic.mistakes.map(m => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40 flex items-start justify-between gap-3"
                    >
                      <div>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 uppercase">
                          {m.mistakeType.replace('_', ' ')}
                        </span>
                        <p className="text-xs font-medium text-slate-900 dark:text-white mt-1">
                          {m.questionDescription}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Remedy: {m.correctApproach}
                        </p>
                      </div>

                      {m.resolved ? (
                        <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Resolved
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-500">Unresolved</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-xs text-slate-400">
            ✨ No weak topics found for this filter. Excellent preparation!
          </div>
        )}
      </div>
    </div>
  );
};
