import React, { useState } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { ArrowRight, CheckCircle2, ShieldAlert, Brain, Calculator, Compass, Eye, Clock, AlertTriangle } from 'lucide-react';
import { Topic } from '../../types/syllabus';
import { soundManager } from '../../utils/soundEffects';

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
    item.topic.mistakes?.forEach(m => {
      if (m.mistakeType === 'conceptual') conceptual++;
      else if (m.mistakeType === 'calculation') calculation++;
      else if (m.mistakeType === 'formula') formula++;
      else if (m.mistakeType === 'silly') silly++;
      else if (m.mistakeType === 'time_pressure') timePressure++;
    });
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      <div>
        <h2 className="text-xl sm:text-3xl font-extrabold text-[#11120F] dark:text-[#F4F4ED] tracking-tight font-serif flex items-center gap-2.5">
          <ShieldAlert className="w-6 h-6 text-[#B94A48]" />
          <span>Weak Areas & Examiner Traps Diagnostics</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#65675F] dark:text-[#85877E] mt-1">
          Auto-detected vulnerabilities, logged traps, and error analytics to transform mistakes into strengths.
        </p>
      </div>

      {/* Root Cause Distribution Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] shadow-subtle-depth space-y-4">
        <h3 className="text-xs sm:text-sm font-bold text-[#11120F] dark:text-[#F4F4ED] font-serif uppercase tracking-wider">
          Root-Cause Fallacy Breakdown
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
          <div className="p-3 rounded-xl bg-[#B94A48]/10 border border-[#B94A48]/25 text-center">
            <span className="text-[10px] font-bold text-[#B94A48] uppercase font-mono block">Conceptual</span>
            <h4 className="text-xl sm:text-2xl font-extrabold text-[#11120F] dark:text-[#F4F4ED] font-mono mt-0.5">{conceptual}</h4>
          </div>

          <div className="p-3 rounded-xl bg-[#C49A3A]/10 border border-[#C49A3A]/25 text-center">
            <span className="text-[10px] font-bold text-[#C49A3A] uppercase font-mono block">Calculation</span>
            <h4 className="text-xl sm:text-2xl font-extrabold text-[#11120F] dark:text-[#F4F4ED] font-mono mt-0.5">{calculation}</h4>
          </div>

          <div className="p-3 rounded-xl bg-[#596B35]/10 border border-[#596B35]/25 text-center">
            <span className="text-[10px] font-bold text-[#596B35] dark:text-[#A4B879] uppercase font-mono block">Formula</span>
            <h4 className="text-xl sm:text-2xl font-extrabold text-[#11120F] dark:text-[#F4F4ED] font-mono mt-0.5">{formula}</h4>
          </div>

          <div className="p-3 rounded-xl bg-[#EEEEE8] dark:bg-[#1D201A] border border-[#D8D8CF] dark:border-[#30342B] text-center">
            <span className="text-[10px] font-bold text-[#65675F] dark:text-[#A7AA9C] uppercase font-mono block">Silly Traps</span>
            <h4 className="text-xl sm:text-2xl font-extrabold text-[#11120F] dark:text-[#F4F4ED] font-mono mt-0.5">{silly}</h4>
          </div>

          <div className="p-3 rounded-xl bg-[#8C773E]/10 border border-[#8C773E]/25 text-center">
            <span className="text-[10px] font-bold text-[#8C773E] uppercase font-mono block">Time Crunch</span>
            <h4 className="text-xl sm:text-2xl font-extrabold text-[#11120F] dark:text-[#F4F4ED] font-mono mt-0.5">{timePressure}</h4>
          </div>
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => {
            soundManager.playClick();
            setSelectedSubject('all');
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
            selectedSubject === 'all'
              ? 'bg-[#11120F] text-white border-transparent'
              : 'bg-white dark:bg-[#151713] text-[#65675F] dark:text-[#A7AA9C] border-[#D8D8CF] dark:border-[#30342B]'
          }`}
        >
          All Subjects ({weakTopics.length})
        </button>

        {currentExam?.subjects.map(s => {
          const count = weakTopics.filter(w => w.subjectName === s.name).length;
          return (
            <button
              key={s.id}
              onClick={() => {
                soundManager.playClick();
                setSelectedSubject(s.name);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                selectedSubject === s.name
                  ? 'bg-[#11120F] text-white border-transparent'
                  : 'bg-white dark:bg-[#151713] text-[#65675F] dark:text-[#A7AA9C] border-[#D8D8CF] dark:border-[#30342B]'
              }`}
            >
              {s.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Weak Topics List */}
      <div className="space-y-3">
        {filteredWeakTopics.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#151713] border border-dashed border-[#D8D8CF] dark:border-[#30342B] text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#4F7A45] mx-auto" />
            <h4 className="text-sm font-bold text-[#11120F] dark:text-[#F4F4ED] font-serif">
              Zero Weak Vulnerabilities Detected!
            </h4>
            <p className="text-xs text-[#85877E]">
              All topics are currently on track with solid accuracy.
            </p>
          </div>
        ) : (
          filteredWeakTopics.map(({ topic, subjectName, chapterName }) => (
            <div
              key={topic.id}
              onClick={() => onOpenTopicDrawer(topic, subjectName, chapterName)}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151713] border border-[#D8D8CF] dark:border-[#30342B] hover:border-[#596B35] transition-all shadow-subtle-depth flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer group active:scale-99"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#596B35] dark:text-[#A4B879]">
                    {subjectName} • {chapterName}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#B94A48]/15 text-[#B94A48]">
                    {topic.accuracy}% Accuracy
                  </span>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-[#11120F] dark:text-[#F4F4ED] group-hover:text-[#596B35] transition-colors truncate">
                  {topic.name}
                </h4>

                {topic.mistakes && topic.mistakes.length > 0 && (
                  <p className="text-xs text-[#85877E] line-clamp-1">
                    {topic.mistakes.length} logged traps ({topic.mistakes.filter(m => !m.resolved).length} active)
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-[#596B35] dark:text-[#A4B879] group-hover:translate-x-1 transition-transform shrink-0">
                <span>Inspect Traps</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
