import React, { useState } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { UserProfileItem } from '../../types/syllabus';
import { X, Users, UserPlus, Check, Flame, Trophy, Calendar, Trash2, Edit2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

interface ProfileSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreate: () => void;
  onOpenEdit?: (profile: UserProfileItem) => void;
}

export const ProfileSwitcherModal: React.FC<ProfileSwitcherModalProps> = ({
  isOpen,
  onClose,
  onOpenCreate,
  onOpenEdit
}) => {
  const { profiles, activeProfileId, switchProfile, deleteProfile, exams } = useSyllabus();
  const [profileToDelete, setProfileToDelete] = useState<UserProfileItem | null>(null);

  if (!isOpen) return null;

  const handleSwitch = (profileId: string) => {
    if (profileId === activeProfileId) return;
    soundManager.playClick();
    haptics.selection();
    switchProfile(profileId);
    onClose();
  };

  const handleConfirmDelete = () => {
    if (!profileToDelete) return;
    deleteProfile(profileToDelete.id);
    haptics.success();
    setProfileToDelete(null);
  };

  const getExamName = (examId: string) => {
    const found = exams.find(e => e.id === examId);
    return found ? found.name : 'Target Exam';
  };

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#12131C] border border-slate-200 dark:border-[#282A3E] shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#222436] flex items-center justify-between bg-slate-50/70 dark:bg-[#171824]/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500/20 to-indigo-500/20 border border-brand-500/30 flex items-center justify-center text-brand-500 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Profiles & Aspirants
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-[#222436] text-slate-600 dark:text-slate-300">
                  {profiles.length} {profiles.length === 1 ? 'Profile' : 'Profiles'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Switch between study profiles with separate syllabus progress, streaks & planner
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E2030] transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delete Confirmation Alert Banner */}
        {profileToDelete && (
          <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 block">
                  Delete &quot;{profileToDelete.name}&quot;?
                </span>
                <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80 block">
                  All syllabus topics, revisions, and task history for this profile will be removed.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={() => setProfileToDelete(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#1A1B28] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-sm hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}

        {/* Profiles List */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto custom-scrollbar flex-1">
          {profiles.map(p => {
            const isActive = p.id === activeProfileId;
            const examLabel = getExamName(p.targetExamId);

            return (
              <div
                key={p.id}
                className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-brand-500/[0.06] dark:bg-brand-500/[0.12] border-brand-500/50 shadow-md ring-1 ring-brand-500/30'
                    : 'bg-slate-50/70 dark:bg-[#171825] border-slate-200/80 dark:border-[#27293E] hover:border-slate-300 dark:hover:border-[#373A56]'
                }`}
              >
                <div className="flex items-start sm:items-center justify-between gap-3">
                  {/* Left: Mascot & Name Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${p.avatarColor || 'from-indigo-500 to-purple-600'} flex items-center justify-center text-white shadow-md text-2xl border border-white/20 shrink-0 overflow-hidden`}
                    >
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{p.avatarEmoji || '🦁'}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                          {p.name}
                        </h4>
                        {isActive && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            ACTIVE
                          </span>
                        )}
                      </div>

                      {/* Meta Tags: Exam, Level, Streak */}
                      <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          <Trophy className="w-3 h-3 text-amber-500" />
                          <span>Lvl {p.level || 1}</span>
                        </span>

                        <span className="flex items-center gap-1 font-mono text-orange-600 dark:text-orange-400 font-bold">
                          <Flame className="w-3 h-3 fill-current" />
                          <span>{p.currentStreak || 0}d streak</span>
                        </span>

                        <span className="flex items-center gap-1 truncate text-slate-600 dark:text-slate-300">
                          <Calendar className="w-3 h-3 text-brand-500 shrink-0" />
                          <span className="truncate">{examLabel}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {onOpenEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          soundManager.playClick();
                          onClose();
                          onOpenEdit(p);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-[#23253A] transition-colors cursor-pointer"
                        title="Edit Profile Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {profiles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          soundManager.playClick();
                          setProfileToDelete(p);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isActive ? (
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Active</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSwitch(p.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-brand-600 dark:bg-[#25283C] dark:hover:bg-brand-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                      >
                        <span>Switch</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: Create Profile Button */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-[#222436] bg-slate-50/50 dark:bg-[#151622]/50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Isolated local data for every profile</span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              haptics.selection();
              onClose();
              onOpenCreate();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
