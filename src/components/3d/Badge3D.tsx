import React, { useState } from 'react';
import { AchievementBadge } from '../../types/syllabus';
import { Trophy, Flame, Target, ShieldCheck, Zap, RotateCw, Calculator, Lock } from 'lucide-react';

interface Badge3DProps {
  badge: AchievementBadge;
}

export const Badge3D: React.FC<Badge3DProps> = ({ badge }) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const iconMap: Record<string, React.ElementType> = {
    Trophy,
    Flame,
    Target,
    ShieldCheck,
    Zap,
    RotateCw,
    Calculator,
  };

  const IconComponent = iconMap[badge.icon] || Trophy;

  const tierStyles = {
    bronze: 'from-amber-700 to-amber-900 border-amber-600/40 text-amber-200',
    silver: 'from-slate-400 to-slate-600 border-slate-300/40 text-slate-100',
    gold: 'from-yellow-400 to-amber-600 border-yellow-300/60 text-yellow-100',
    platinum: 'from-cyan-400 via-indigo-400 to-purple-500 border-cyan-300/60 text-white',
  }[badge.tier];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotateX((y / rect.height) * -15);
    setRotateY((x / rect.width) * 15);
  };

  return (
    <div
      style={{ perspective: '800px' }}
      className="w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setRotateX(0); setRotateY(0); }}
    >
      <div
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
        className={`relative rounded-2xl p-5 border ${
          badge.unlocked
            ? 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-lg hover:shadow-xl'
            : 'bg-slate-50 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
        } transition-all`}
      >
        <div className="flex items-center gap-3.5 mb-3">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tierStyles} p-0.5 shadow-md flex items-center justify-center shrink-0`}
          >
            <div className="w-full h-full bg-slate-900/30 backdrop-blur-sm rounded-[14px] flex items-center justify-center">
              {badge.unlocked ? (
                <IconComponent className="w-6 h-6" />
              ) : (
                <Lock className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {badge.tier}
              </span>
              {badge.unlocked && (
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Unlocked
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              {badge.title}
            </h4>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
          {badge.description}
        </p>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-medium text-slate-500">
            <span>Progress</span>
            <span>{badge.progress} / {badge.maxProgress}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${tierStyles}`}
              style={{ width: `${Math.min(100, (badge.progress / badge.maxProgress) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
