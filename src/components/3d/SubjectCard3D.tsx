import React, { useRef, useState } from 'react';
import { Subject } from '../../types/syllabus';
import { ProgressRing } from '../common/ProgressRing';
import { Calculator, BrainCircuit, BookOpen, Globe, ArrowRight, AlertTriangle } from 'lucide-react';

interface SubjectCard3DProps {
  subject: Subject;
  completedTopics: number;
  totalTopics: number;
  percentage: number;
  weakCount: number;
  lastStudied: string | null;
  onClick: () => void;
}

export const SubjectCard3D: React.FC<SubjectCard3DProps> = ({
  subject,
  completedTopics,
  totalTopics,
  percentage,
  weakCount,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const iconMap: Record<string, React.ElementType> = {
    Calculator,
    BrainCircuit,
    BookOpen,
    Globe,
  };

  const IconComponent = iconMap[subject.icon] || BookOpen;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rX = ((y - centerY) / centerY) * -10;
    const rY = ((x - centerX) / centerX) * 10;
    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  return (
    <div
      style={{ perspective: '1000px' }}
      className="w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cardRef}
        onClick={onClick}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${isHovered ? 'translateZ(12px)' : 'translateZ(0px)'}`,
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
        }}
        className="group relative cursor-pointer rounded-3xl bg-white dark:bg-slate-900/90 p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden"
      >
        <div
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40"
          style={{ backgroundColor: subject.color }}
        />

        <div className="flex items-start justify-between mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: `${subject.color}18`, color: subject.color }}
          >
            <IconComponent className="w-6 h-6" />
          </div>
          <ProgressRing progress={percentage} size={54} strokeWidth={5} color={subject.color} />
        </div>

        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1.5 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
          {subject.name}
        </h3>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4">
          <span>{completedTopics} of {totalTopics} topics</span>
          <span className="font-semibold">{subject.chapters.length} chapters</span>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percentage}%`, backgroundColor: subject.color }}
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          {weakCount > 0 ? (
            <span className="flex items-center gap-1 font-semibold text-rose-500 dark:text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              {weakCount} weak {weakCount === 1 ? 'topic' : 'topics'}
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              All concepts on track
            </span>
          )}

          <span className="flex items-center gap-1 font-semibold text-brand-500 group-hover:translate-x-1 transition-transform">
            Explore <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
