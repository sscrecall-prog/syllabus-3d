import React, { useState } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { SubjectCard3D } from '../3d/SubjectCard3D';
import { AppView } from '../layout/Sidebar';
import { Topic, Subject } from '../../types/syllabus';
import { EditSubjectModal } from '../modals/EditSubjectModal';
import { Plus } from 'lucide-react';

interface SubjectsViewProps {
  onNavigate: (view: AppView) => void;
  onOpenTopicDrawer: (topic: Topic, subName: string, chName: string) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({ onNavigate }) => {
  const { currentExam, subjectStats } = useSyllabus();
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  if (!currentExam) return null;

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Subjects & Domains
          </h2>
          <p className="text-[11px] sm:text-[13px] font-medium text-slate-500 dark:text-slate-400">
            Interactive 3D mastery cards with subject management.
          </p>
        </div>

        <button
          onClick={() => onNavigate('syllabus')}
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {currentExam.subjects.map(subject => {
          const stat = subjectStats.find(s => s.subjectId === subject.id) || {
            completedTopics: 0,
            totalTopics: 0,
            percentage: 0,
            weakCount: 0,
            lastStudied: null
          };

          return (
            <div key={subject.id} className="relative group">
              <SubjectCard3D
                subject={subject}
                completedTopics={stat.completedTopics}
                totalTopics={stat.totalTopics}
                percentage={stat.percentage}
                weakCount={stat.weakCount}
                lastStudied={stat.lastStudied}
                onClick={() => onNavigate('syllabus')}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingSubject(subject);
                }}
                className="absolute top-4 right-4 z-20 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
              >
                Edit
              </button>
            </div>
          );
        })}
      </div>

      <EditSubjectModal
        subject={editingSubject}
        isOpen={Boolean(editingSubject)}
        onClose={() => setEditingSubject(null)}
      />
    </div>
  );
};

