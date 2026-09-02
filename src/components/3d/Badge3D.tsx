import React, { useState } from 'react';
import { AchievementBadge } from '../../types/syllabus';
import { Trophy, Flame, Target, ShieldCheck, Zap, RotateCw, Calculator, Lock, Check } from 'lucide-react';

interface Badge3DProps {
  badge: AchievementBadge;
}

export const Badge3D: React.FC<Badge3DProps> = ({ badge }) => {
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

  return (
    <div className={`p-4 rounded-xl border transition-all shadow-subtle-depth flex flex-col justify-between h-full ${
      badge.unlocked
        ? 'bg-white dark:bg-[#18181D] border-[#596B35]/40'
        : 'bg-[#F7F6F0] dark:bg-[#23232A] border-dashed border-[#D8D8CF] dark:border-[#272730] opacity-70'
    }`}>
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EEEEE8] dark:bg-[#23232A] text-[#596B35] dark:text-[#8B5CF6] uppercase font-mono">
          {badge.tier}
        </span>
        {badge.unlocked ? (
          <span className="text-[11px] font-bold text-[#4F7A45] flex items-center gap-1">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>Unlocked</span>
          </span>
        ) : (
          <span className="text-[11px] text-[#85877E] flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            <span>Locked</span>
          </span>
        )}
      </div>

      <div className="flex flex-col items-center text-center my-2 space-y-1.5">
        <div className="w-11 h-11 rounded-xl bg-[#DCE8B7] dark:bg-[#8B5CF6]/20 text-[#596B35] dark:text-[#8B5CF6] flex items-center justify-center shadow-sm">
          {badge.unlocked ? <IconComponent className="w-5 h-5" /> : <Lock className="w-4 h-4 text-[#85877E]" />}
        </div>
        <h4 className="text-xs sm:text-sm font-bold text-[#191A17] dark:text-[#F5F5F7] line-clamp-1">
          {badge.title}
        </h4>
        <p className="text-[11px] text-[#65675F] dark:text-[#85877E] line-clamp-2">
          {badge.description}
        </p>
      </div>

      <div className="space-y-1 pt-2 border-t border-[#EEEEE8] dark:border-[#1D201A]">
        <div className="flex justify-between text-[11px] text-[#85877E] font-mono">
          <span>Progress</span>
          <span className="font-bold text-[#191A17] dark:text-[#F5F5F7]">{badge.progress} / {badge.maxProgress}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[#EEEEE8] dark:bg-[#23232A] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#596B35] dark:bg-[#8B5CF6]"
            style={{ width: `${Math.min(100, (badge.progress / (badge.maxProgress || 1)) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

