import React, { useState } from 'react';
import { AchievementBadge } from '../../types/syllabus';
import { Trophy, Flame, Target, ShieldCheck, Zap, RotateCw, Calculator, Lock, Check } from 'lucide-react';

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

  // Luxury Metallic Medals Color Palette
  const tierConfig = {
    bronze: {
      gradient: 'from-[#CD7F32] via-[#E8A360] to-[#8C4A15]',
      border: 'border-[#CD7F32]/50',
      badgeBg: 'bg-[#CD7F32]/15 text-[#A05518] dark:text-[#E8A360] border-[#CD7F32]/30',
      glow: 'rgba(205, 127, 50, 0.25)',
      label: 'BRONZE'
    },
    silver: {
      gradient: 'from-[#A8B2C1] via-[#E2E8F0] to-[#64748B]',
      border: 'border-[#94A3B8]/50',
      badgeBg: 'bg-slate-500/15 text-slate-700 dark:text-slate-200 border-slate-400/30',
      glow: 'rgba(168, 178, 193, 0.25)',
      label: 'SILVER'
    },
    gold: {
      gradient: 'from-[#D4AF37] via-[#F5E6C8] to-[#B89327]',
      border: 'border-[#D4AF37]/60',
      badgeBg: 'bg-[#D4AF37]/20 text-[#8C6D15] dark:text-[#D4AF37] border-[#D4AF37]/40',
      glow: 'rgba(212, 175, 55, 0.35)',
      label: 'GOLD'
    },
    platinum: {
      gradient: 'from-[#38BDF8] via-[#A78BFA] to-[#6366F1]',
      border: 'border-[#38BDF8]/60',
      badgeBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-400/30',
      glow: 'rgba(56, 189, 248, 0.35)',
      label: 'PLATINUM'
    }
  }[badge.tier];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotateX((y / rect.height) * -12);
    setRotateY((x / rect.width) * 12);
  };

  const progressPercent = Math.min(100, Math.round((badge.progress / (badge.maxProgress || 1)) * 100));

  return (
    <div
      style={{ perspective: '900px' }}
      className="w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setRotateX(0); setRotateY(0); }}
    >
      <div
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
        className={`relative rounded-3xl p-3.5 sm:p-4.5 border flex flex-col justify-between h-full transition-all shadow-md group ${
          badge.unlocked
            ? 'bg-white dark:bg-[#202020] border-[#EBD3A0] dark:border-[#333333] hover:border-[#D4AF37] hover:shadow-xl'
            : 'bg-[#FAF8F5]/60 dark:bg-[#181818]/60 border-dashed border-[#EBD3A0]/60 dark:border-[#2A2A2A] opacity-75'
        }`}
      >
        {/* 1. Top Row: Tier Tag (Left) & Status (Right) */}
        <div className="flex items-center justify-between gap-1 mb-2.5">
          <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-lg border uppercase font-mono ${tierConfig.badgeBg}`}>
            {tierConfig.label}
          </span>

          {badge.unlocked ? (
            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>Unlocked</span>
            </span>
          ) : (
            <span className="text-[9px] font-bold text-[#6B7280] flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              <span>Locked</span>
            </span>
          )}
        </div>

        {/* 2. Center: 3D Metallic Coin Medallion */}
        <div className="flex flex-col items-center justify-center my-1.5 space-y-2 text-center">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr ${tierConfig.gradient} p-0.5 shadow-lg flex items-center justify-center relative group-hover:scale-105 transition-transform`}
            style={{
              boxShadow: badge.unlocked ? `0 4px 18px ${tierConfig.glow}` : 'none'
            }}
          >
            <div className="w-full h-full bg-[#171717] rounded-[14px] flex items-center justify-center text-white border border-white/20">
              {badge.unlocked ? (
                <IconComponent className="w-6 h-6 text-[#F5E6C8] drop-shadow-md" />
              ) : (
                <Lock className="w-5 h-5 text-[#6B7280]" />
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs sm:text-sm font-black text-[#171717] dark:text-[#F5E6C8] leading-snug line-clamp-1">
              {badge.title}
            </h4>
            <p className="text-[10px] text-[#6B7280] dark:text-[#A3A3A3] line-clamp-2 mt-0.5 leading-tight">
              {badge.description}
            </p>
          </div>
        </div>

        {/* 3. Bottom Progress Bar */}
        <div className="space-y-1 pt-2 border-t border-[#EBD3A0]/40 dark:border-[#282828]">
          <div className="flex justify-between text-[10px] font-bold text-[#6B7280] font-mono">
            <span>Progress</span>
            <span className="text-[#171717] dark:text-[#F5E6C8]">
              {badge.progress} / {badge.maxProgress}
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#2A2A2A] overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${tierConfig.gradient} transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
