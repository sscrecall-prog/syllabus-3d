import React from 'react';
import { AchievementBadge } from '../../types/syllabus';
import { Trophy, Flame, Target, ShieldCheck, Zap, RotateCw, Calculator, Lock, Check, Sparkles } from 'lucide-react';

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

  // Tier Theme Styling
  const getTierMeta = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'bronze':
        return {
          pill: 'bg-amber-700/15 text-amber-600 dark:text-amber-500 border-amber-600/30',
          accent: '#D97706',
          gradient: 'from-[#78350f] via-[#b45309] to-[#451a03]',
          iconBorder: 'border-amber-600/50',
          iconColor: 'text-amber-400',
          glow: 'group-hover:border-amber-500/50 group-hover:shadow-[0_0_20px_rgba(217,119,6,0.2)]',
          topLine: 'linear-gradient(90deg, transparent, #D97706, transparent)'
        };
      case 'silver':
        return {
          pill: 'bg-slate-400/15 text-slate-600 dark:text-slate-300 border-slate-400/30',
          accent: '#94A3B8',
          gradient: 'from-[#334155] via-[#475569] to-[#1e293b]',
          iconBorder: 'border-slate-400/50',
          iconColor: 'text-slate-200',
          glow: 'group-hover:border-slate-400/50 group-hover:shadow-[0_0_20px_rgba(148,163,184,0.2)]',
          topLine: 'linear-gradient(90deg, transparent, #94A3B8, transparent)'
        };
      case 'gold':
        return {
          pill: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
          accent: '#EAB308',
          gradient: 'from-[#713f12] via-[#a16207] to-[#422006]',
          iconBorder: 'border-yellow-500/50',
          iconColor: 'text-yellow-300',
          glow: 'group-hover:border-yellow-500/50 group-hover:shadow-[0_0_25px_rgba(234,179,8,0.25)]',
          topLine: 'linear-gradient(90deg, transparent, #EAB308, transparent)'
        };
      case 'platinum':
      default:
        return {
          pill: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-400/30',
          accent: '#06B6D4',
          gradient: 'from-[#083344] via-[#0e7490] to-[#041c26]',
          iconBorder: 'border-cyan-400/50',
          iconColor: 'text-cyan-200',
          glow: 'group-hover:border-cyan-400/50 group-hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]',
          topLine: 'linear-gradient(90deg, transparent, #06B6D4, transparent)'
        };
    }
  };

  const tierMeta = getTierMeta(badge.tier);
  const progressPercent = Math.min(100, Math.round((badge.progress / (badge.maxProgress || 1)) * 100));

  return (
    <div
      className={`group relative p-4 sm:p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between h-full overflow-hidden select-none ${
        badge.unlocked
          ? `bg-white dark:bg-[#18181D] border-[#D8D8CF] dark:border-[#272730] shadow-subtle-depth ${tierMeta.glow} hover:-translate-y-1`
          : 'bg-[#FAF9F5]/60 dark:bg-[#13141C] border-[#D8D8CF]/60 dark:border-[#20212C] opacity-65 hover:opacity-85'
      }`}
    >
      {/* Top Ambient Glow Line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-70 group-hover:opacity-100 transition-opacity"
        style={{ background: tierMeta.topLine }}
      />

      {/* Header Pill & Unlock Status */}
      <div className="flex items-center justify-between gap-1.5 mb-3">
        <span className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded-lg border uppercase tracking-wider ${tierMeta.pill}`}>
          {badge.tier}
        </span>
        {badge.unlocked ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>Unlocked</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-[#85877E] dark:text-[#71717A] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-lg">
            <Lock className="w-2.5 h-2.5" />
            <span>Locked</span>
          </span>
        )}
      </div>

      {/* 3D Metallic Center Emblem */}
      <div className="flex flex-col items-center text-center my-2 space-y-2">
        <div className="relative">
          {/* Ambient Outer Halo */}
          {badge.unlocked && (
            <div
              className="absolute -inset-1 rounded-2xl blur-md opacity-30 group-hover:opacity-75 transition-opacity"
              style={{ backgroundColor: tierMeta.accent }}
            />
          )}

          <div
            className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105 border ${
              badge.unlocked
                ? `bg-gradient-to-br ${tierMeta.gradient} ${tierMeta.iconBorder} ${tierMeta.iconColor}`
                : 'bg-[#EEEEE8] dark:bg-[#1E1F2A] border-[#D8D8CF] dark:border-[#2C2E3E] text-[#85877E]'
            }`}
          >
            {badge.unlocked ? (
              <IconComponent className="w-6 h-6 stroke-[2.2] drop-shadow-md" />
            ) : (
              <Lock className="w-5 h-5 stroke-[2] text-[#85877E] dark:text-[#65675F]" />
            )}
          </div>
        </div>

        <h4 className="text-xs sm:text-[13px] font-black text-[#11120F] dark:text-[#F5F5F7] tracking-tight uppercase line-clamp-1 group-hover:text-amber-500 transition-colors">
          {badge.title}
        </h4>
        <p className="text-[11px] text-[#65675F] dark:text-[#94A3B8] line-clamp-2 leading-relaxed font-medium">
          {badge.description}
        </p>
      </div>

      {/* Progress Track & Subtext */}
      <div className="space-y-1.5 pt-3 border-t border-[#EEEEE8] dark:border-[#242533]">
        <div className="flex justify-between text-[10px] font-mono font-bold text-[#85877E] dark:text-[#94A3B8]">
          <span>Progress</span>
          <span className="tabular-nums text-[#11120F] dark:text-white">
            {badge.progress} / {badge.maxProgress}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#EEEEE8] dark:bg-[#20212E] overflow-hidden p-0.5 border border-[#D8D8CF]/50 dark:border-[#2D2F3F]/50">
          <div
            className="h-full rounded-full transition-all duration-500 shadow-sm"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: badge.unlocked ? '#10B981' : tierMeta.accent,
              boxShadow: badge.unlocked ? '0 0 8px rgba(16,185,129,0.5)' : undefined
            }}
          />
        </div>
      </div>
    </div>
  );
};

