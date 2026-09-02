import React from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { Badge3D } from '../3d/Badge3D';
import { Trophy, Target, CheckCircle2, Award, Zap} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { profile, achievements, overallStats } = useSyllabus();

  const unLockedBadges = achievements.filter(b => b.unlocked);
  const readinessScore = Math.round(
    overallStats.completionPercentage * 0.5 +
    overallStats.averageAccuracy * 0.3 +
    Math.min(100, profile.currentStreak * 4) * 0.2
  );

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      <div>
        <h2 className="text-xl sm:text-3xl font-extrabold text-[#11120F] dark:text-[#F5F5F7] font-serif flex items-center gap-2.5">
          <Trophy className="w-6 h-6 text-[#596B35] dark:text-[#8B5CF6]" />
          <span>Analytics & Exam Readiness</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#65675F] dark:text-[#85877E] mt-1">
          Measurable preparation progress, 3D achievement badges, and subject distribution.
        </p>
      </div>

      {/* Level Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#596B35] text-white flex items-center justify-center font-bold">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-[#191A17] dark:text-[#F5F5F7]">
                Level {profile.level} â€¢ {profile.levelTitle}
              </h4>
              <p className="text-[11px] text-[#65675F] dark:text-[#85877E]">
                Earn XP through active topic mastery and spaced revision.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#596B35] dark:text-[#8B5CF6] font-mono tabular-nums">
            {profile.xp} / {profile.level * 300} XP
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[#EEEEE8] dark:bg-[#23232A] overflow-hidden">
          <div className="h-full bg-[#596B35] dark:bg-[#8B5CF6] rounded-full" style={{ width: `${(profile.xp % 300) / 3}%` }} />
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth">
          <div className="flex items-center gap-2 text-[#596B35] dark:text-[#8B5CF6] mb-1">
            <Target className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Readiness Score</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#11120F] dark:text-[#F5F5F7] font-serif tabular-nums">
            {readinessScore} <span className="text-xs text-[#85877E]">/ 100</span>
          </h3>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth">
          <div className="flex items-center gap-2 text-[#4F7A45] mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Practice Accuracy</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#4F7A45] font-serif tabular-nums">
            {overallStats.averageAccuracy}%
          </h3>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth">
          <div className="flex items-center gap-2 text-[#C49A3A] mb-1">
            <Award className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Badges Unlocked</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#11120F] dark:text-[#F5F5F7] font-serif tabular-nums">
            {unLockedBadges.length} <span className="text-xs text-[#85877E]">/ {achievements.length}</span>
          </h3>
        </div>
      </div>

      {/* Achievement Medals Grid */}
      <div className="space-y-4 sm:space-y-5">
        <h3 className="text-[15px] sm:text-base font-bold text-[#191A17] dark:text-[#F5F5F7] flex items-center gap-2">
          <Award className="w-4 h-4 text-[#596B35]" />
          <span>Achievement Medals</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {achievements.map(badge => (
            <Badge3D key={badge.id} badge={badge} />
          ))}
        </div>
      </div>
    </div>
  );
};

