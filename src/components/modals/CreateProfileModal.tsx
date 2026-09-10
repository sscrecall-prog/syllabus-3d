import React, { useState, useEffect } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import { useAuth } from '../../context/AuthContext';
import { UserProfileItem } from '../../types/syllabus';
import { X, Sparkles, User, Calendar, Target, Copy, Plus, Check, Camera, Image, Trash2 } from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';
import { haptics } from '../../utils/haptics';

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProfile?: UserProfileItem | null;
  onSuccess?: (profileId: string) => void;
}

const EMOJI_PRESETS = ['🦁', '🚀', '🦅', '⚡', '🎯', '👑', '🔥', '🦉', '🐺', '🐅', '🌟', '💎', '🎓', '⚔️', '🏆', '💡'];

const GRADIENT_PRESETS = [
  { label: 'Royal Indigo', class: 'from-indigo-500 to-purple-600', border: 'border-indigo-500' },
  { label: 'Amber Fire', class: 'from-amber-500 to-orange-600', border: 'border-amber-500' },
  { label: 'Emerald Forest', class: 'from-emerald-500 to-teal-600', border: 'border-emerald-500' },
  { label: 'Crimson Rose', class: 'from-rose-500 to-pink-600', border: 'border-rose-500' },
  { label: 'Electric Cyan', class: 'from-cyan-500 to-blue-600', border: 'border-cyan-500' },
  { label: 'Sunset Magenta', class: 'from-fuchsia-500 to-purple-700', border: 'border-fuchsia-500' },
  { label: 'Royal Blue', class: 'from-blue-600 to-indigo-700', border: 'border-blue-600' },
  { label: 'Dark Stealth', class: 'from-slate-700 to-slate-900', border: 'border-slate-600' },
];

const PRESET_EXAMS = [
  { id: 'exam_ssc_cgl_2025', name: 'SSC CGL 2026', date: '2026-10-15' },
  { id: 'exam_ssc_chsl_2026', name: 'SSC CHSL 2026', date: '2026-07-20' },
  { id: 'exam_upsc_cse_2026', name: 'UPSC CSE 2026', date: '2026-05-25' },
  { id: 'exam_ibps_po_2026', name: 'IBPS PO / Banking 2026', date: '2026-11-10' },
  { id: 'exam_rrb_ntpc_2026', name: 'Railway NTPC 2026', date: '2026-09-18' },
  { id: 'exam_state_pcs_2026', name: 'State PCS 2026', date: '2026-12-05' },
];

export const CreateProfileModal: React.FC<CreateProfileModalProps> = ({
  isOpen,
  onClose,
  editingProfile,
  onSuccess
}) => {
  const { createProfile, updateProfileById, activeProfileId, exams } = useSyllabus();
  const { updateUserSession } = useAuth();

  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🦁');
  const [selectedColor, setSelectedColor] = useState('from-indigo-500 to-purple-600');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [targetExamId, setTargetExamId] = useState('exam_ssc_cgl_2025');
  const [targetExamDate, setTargetExamDate] = useState('2026-10-15');
  const [cloneCurrentSyllabus, setCloneCurrentSyllabus] = useState(false);
  const [avatarTab, setAvatarTab] = useState<'emoji' | 'upload'>('emoji');

  useEffect(() => {
    if (editingProfile) {
      setName(editingProfile.name || '');
      setSelectedEmoji(editingProfile.avatarEmoji || '🦁');
      setSelectedColor(editingProfile.avatarColor || 'from-indigo-500 to-purple-600');
      setAvatarUrl(editingProfile.avatarUrl);
      setTargetExamId(editingProfile.targetExamId || 'exam_ssc_cgl_2025');
      setTargetExamDate(editingProfile.targetExamDate || '2026-10-15');
      setAvatarTab(editingProfile.avatarUrl ? 'upload' : 'emoji');
    } else {
      setName('');
      setSelectedEmoji('🦁');
      setSelectedColor('from-indigo-500 to-purple-600');
      setAvatarUrl(undefined);
      setTargetExamId(exams[0]?.id || 'exam_ssc_cgl_2025');
      setTargetExamDate('2026-10-15');
      setCloneCurrentSyllabus(false);
      setAvatarTab('emoji');
    }
  }, [editingProfile, isOpen, exams]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo is too large. Please choose an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatarUrl(result);
      soundManager.playClick();
      haptics.light();
    };
    reader.readAsDataURL(file);
  };

  const handleSelectExamPreset = (preset: typeof PRESET_EXAMS[0]) => {
    setTargetExamId(preset.id);
    setTargetExamDate(preset.date);
    soundManager.playClick();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (editingProfile) {
      const newAvatarUrl = avatarTab === 'upload' ? avatarUrl : undefined;
      updateProfileById(editingProfile.id, {
        name: trimmedName,
        avatarEmoji: selectedEmoji,
        avatarColor: selectedColor,
        avatarUrl: newAvatarUrl,
        targetExamId,
        targetExamDate
      });
      if (editingProfile.id === activeProfileId) {
        updateUserSession({
          name: trimmedName,
          avatarUrl: newAvatarUrl
        });
      }
      soundManager.playCompleteChime();
      haptics.success();
      onSuccess?.(editingProfile.id);
      onClose();
    } else {
      const newId = createProfile({
        name: name.trim(),
        avatarEmoji: selectedEmoji,
        avatarColor: selectedColor,
        avatarUrl: avatarTab === 'upload' ? avatarUrl : undefined,
        targetExamId,
        targetExamDate,
        cloneCurrentSyllabus
      });
      onSuccess?.(newId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#12131C] border border-slate-200 dark:border-[#282A3E] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#222436] flex items-center justify-between bg-slate-50/70 dark:bg-[#171824]/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${selectedColor} flex items-center justify-center text-white shadow-md text-xl border border-white/20 overflow-hidden shrink-0`}>
              {avatarTab === 'upload' && avatarUrl ? (
                <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <span>{selectedEmoji}</span>
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{editingProfile ? 'Edit Profile' : 'Create New Profile'}</span>
                {!editingProfile && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                    NEW
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {editingProfile
                  ? 'Update your name, avatar, and target exam'
                  : 'Add a new student or track a separate exam syllabus'}
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Profile Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-500" />
              <span>Profile Name / Aspirant Name</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma, SSC CGL Track, Banking 2026"
              required
              maxLength={40}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#1A1B28] border border-slate-200 dark:border-[#2D3048] text-[13px] font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Avatar Selector Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Choose Avatar Style:
              </label>
              <div className="flex items-center p-1 bg-slate-100 dark:bg-[#1A1B28] rounded-xl border border-slate-200 dark:border-[#2D3048]">
                <button
                  type="button"
                  onClick={() => {
                    setAvatarTab('emoji');
                    soundManager.playClick();
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    avatarTab === 'emoji'
                      ? 'bg-white dark:bg-[#25283C] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  Emoji & Color
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarTab('upload');
                    soundManager.playClick();
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    avatarTab === 'upload'
                      ? 'bg-white dark:bg-[#25283C] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  Photo Upload
                </button>
              </div>
            </div>

            {avatarTab === 'emoji' ? (
              <div className="space-y-3 bg-slate-50 dark:bg-[#161724] p-3.5 rounded-2xl border border-slate-200/80 dark:border-[#26283C]">
                <div>
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Select Avatar Mascot:
                  </span>
                  <div className="grid grid-cols-8 gap-1.5">
                    {EMOJI_PRESETS.map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => {
                          setSelectedEmoji(em);
                          soundManager.playClick();
                        }}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform active:scale-90 cursor-pointer ${
                          selectedEmoji === em
                            ? 'bg-brand-500/20 ring-2 ring-brand-500 scale-110 shadow-xs'
                            : 'hover:bg-slate-200 dark:hover:bg-[#23253A]'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Profile Theme Gradient:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {GRADIENT_PRESETS.map(g => (
                      <button
                        key={g.class}
                        type="button"
                        onClick={() => {
                          setSelectedColor(g.class);
                          soundManager.playClick();
                        }}
                        className={`h-8 rounded-xl bg-gradient-to-r ${g.class} flex items-center justify-center transition-all cursor-pointer ${
                          selectedColor === g.class ? 'ring-2 ring-white dark:ring-slate-300 scale-105 shadow-md' : 'opacity-85 hover:opacity-100'
                        }`}
                        title={g.label}
                      >
                        {selectedColor === g.class && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-[#161724] p-4 rounded-2xl border border-slate-200/80 dark:border-[#26283C] text-center space-y-3">
                {avatarUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={avatarUrl}
                      alt="Uploaded Avatar"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-500 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(undefined)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/25 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Photo</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-[#333650] rounded-2xl hover:border-brand-500 transition-colors cursor-pointer group">
                    <Camera className="w-8 h-8 text-slate-400 group-hover:text-brand-500 transition-colors mb-2" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Upload Custom Avatar
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      PNG, JPG or WebP up to 2MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Target Exam Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-brand-500" />
              <span>Target Exam:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_EXAMS.map(p => {
                const isSelected = targetExamId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectExamPreset(p)}
                    className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-500/15 border-brand-500 text-brand-600 dark:text-brand-400 shadow-xs'
                        : 'bg-slate-50 dark:bg-[#1A1B28] border-slate-200 dark:border-[#2D3048] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-[#3D4060]'
                    }`}
                  >
                    <span className="block text-xs font-bold truncate">{p.name}</span>
                    <span className="block text-[10px] font-mono text-slate-400 mt-0.5">{p.date}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Exam Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-500" />
              <span>Target Exam Date:</span>
            </label>
            <input
              type="date"
              value={targetExamDate}
              onChange={e => setTargetExamDate(e.target.value)}
              required
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#1A1B28] border border-slate-200 dark:border-[#2D3048] text-[13px] font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Syllabus Setup Mode (Only for New Profiles) */}
          {!editingProfile && (
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-[#222436]">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Syllabus Template:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setCloneCurrentSyllabus(false);
                    soundManager.playClick();
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    !cloneCurrentSyllabus
                      ? 'bg-brand-500/10 border-brand-500 ring-1 ring-brand-500'
                      : 'bg-slate-50 dark:bg-[#1A1B28] border-slate-200 dark:border-[#2D3048]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-brand-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Fresh Syllabus</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Start fresh with 0% progress and clean official topics.
                    </p>
                  </div>
                  <span className="mt-2 text-[10px] font-mono font-bold text-brand-600 dark:text-brand-400">
                    Recommended
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCloneCurrentSyllabus(true);
                    soundManager.playClick();
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    cloneCurrentSyllabus
                      ? 'bg-purple-500/10 border-purple-500 ring-1 ring-purple-500'
                      : 'bg-slate-50 dark:bg-[#1A1B28] border-slate-200 dark:border-[#2D3048]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Copy className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Clone Current Topics</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Duplicate current chapters & custom added topics.
                    </p>
                  </div>
                  <span className="mt-2 text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">
                    Duplicate Structure
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222436] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#2D3048] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1A1B28] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition-all cursor-pointer active:scale-95"
            >
              {editingProfile ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
