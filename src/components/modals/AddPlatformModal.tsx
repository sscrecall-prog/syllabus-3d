import React, { useState } from 'react';
import {
  X,
  Plus,
  Globe,
  Sparkles,
  Bookmark,
  GraduationCap,
  FileCheck2,
  BookOpen,
  KeyRound
} from 'lucide-react';
import { ExternalPlatform, PlatformCategory } from '../../types/syllabus';
import { useSyllabus } from '../../context/SyllabusContext';
import { soundManager } from '../../utils/soundEffects';

interface AddPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  editPlatformData?: ExternalPlatform | null;
}

const PRESET_TEMPLATES = [
  {
    name: 'Physics Wallah (PW)',
    url: 'https://www.pw.live/study/batches',
    category: 'course' as PlatformCategory,
    description: 'Live & recorded batch lectures, DPPs, and video solutions',
    color: '#5A4FCF',
    icon: '⚡',
    loginHint: 'PW Mobile / Email'
  },
  {
    name: 'Careerwill App / Web',
    url: 'https://careerwill.com/',
    category: 'course' as PlatformCategory,
    description: 'SSC, Banking & State exams video batches by top educators',
    color: '#E11D48',
    icon: '🎓',
    loginHint: 'Careerwill Phone Number'
  },
  {
    name: 'Testbook Pass & Mock Series',
    url: 'https://testbook.com/test-series',
    category: 'test_series' as PlatformCategory,
    description: 'All India Live Mocks, Previous Year Papers & Percentile Analysis',
    color: '#0284C7',
    icon: '📝',
    loginHint: 'Testbook Account Email'
  },
  {
    name: 'Oliveboard Mocks & Tests',
    url: 'https://www.oliveboard.in/',
    category: 'test_series' as PlatformCategory,
    description: 'High-difficulty mock tests, sectional tests & topic quizzes',
    color: '#16A34A',
    icon: '🎯',
    loginHint: 'Oliveboard Login Email'
  },
  {
    name: 'Unacademy Plus',
    url: 'https://unacademy.com/',
    category: 'course' as PlatformCategory,
    description: 'Live interactive classes, educator batches and doubt solving',
    color: '#08BD80',
    icon: '🏛️',
    loginHint: 'Unacademy Plus User'
  },
  {
    name: 'Khan Academy',
    url: 'https://www.khanacademy.org/',
    category: 'course' as PlatformCategory,
    description: 'Master math, algebra, geometry & science fundamentals',
    color: '#14BF96',
    icon: '📖',
    loginHint: 'Khan Academy Account'
  },
  {
    name: 'RBE Revolution By Education',
    url: 'https://rbeeducation.com/',
    category: 'test_series' as PlatformCategory,
    description: 'Exam survey analysis, rank predictor, and free sectional mocks',
    color: '#F59E0B',
    icon: '📊',
    loginHint: 'RBE Portal Login'
  },
  {
    name: 'YouTube Course / Playlist',
    url: 'https://www.youtube.com/',
    category: 'course' as PlatformCategory,
    description: 'Free dedicated educator YouTube playlist or marathon lecture',
    color: '#FF0000',
    icon: '▶️',
    loginHint: ''
  }
];

const EMOJI_OPTIONS = ['⚡', '🎓', '📝', '🎯', '🏛️', '📖', '📊', '▶️', '💻', '🔬', '📐', '🧠', '🌐', '📚', '🚀', '🔥'];
const COLOR_OPTIONS = [
  '#5A4FCF', // Purple
  '#E11D48', // Rose
  '#0284C7', // Sky
  '#16A34A', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#596B35', // Academic Olive
  '#08BD80', // Emerald
  '#FF0000'  // Red
];

export const AddPlatformModal: React.FC<AddPlatformModalProps> = ({
  isOpen,
  onClose,
  editPlatformData
}) => {
  const { addPlatform, editPlatform, currentExam } = useSyllabus();

  const [name, setName] = useState(editPlatformData?.name || '');
  const [url, setUrl] = useState(editPlatformData?.url || '');
  const [category, setCategory] = useState<PlatformCategory>(editPlatformData?.category || 'course');
  const [description, setDescription] = useState(editPlatformData?.description || '');
  const [icon, setIcon] = useState(editPlatformData?.icon || '⚡');
  const [color, setColor] = useState(editPlatformData?.color || '#5A4FCF');
  const [loginHint, setLoginHint] = useState(editPlatformData?.loginHint || '');
  const [notes, setNotes] = useState(editPlatformData?.notes || '');
  const [associatedSubjectId, setAssociatedSubjectId] = useState(editPlatformData?.associatedSubjectId || '');
  const [pinned, setPinned] = useState(editPlatformData?.pinned || false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setName(preset.name);
    setUrl(preset.url);
    setCategory(preset.category);
    setDescription(preset.description);
    setColor(preset.color);
    setIcon(preset.icon);
    if (preset.loginHint) setLoginHint(preset.loginHint);
    soundManager.playClick();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a platform or batch name.');
      return;
    }

    let cleanUrl = url.trim();
    if (!cleanUrl) {
      setError('Please enter the website or batch URL.');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    if (editPlatformData) {
      editPlatform(editPlatformData.id, {
        name: name.trim(),
        url: cleanUrl,
        category,
        description: description.trim() || undefined,
        icon,
        color,
        loginHint: loginHint.trim() || undefined,
        notes: notes.trim() || undefined,
        associatedSubjectId: associatedSubjectId || undefined,
        pinned
      });
    } else {
      addPlatform({
        name: name.trim(),
        url: cleanUrl,
        category,
        description: description.trim() || undefined,
        icon,
        color,
        loginHint: loginHint.trim() || undefined,
        notes: notes.trim() || undefined,
        associatedSubjectId: associatedSubjectId || undefined,
        pinned
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#12141A] border border-[#D8D8CF] dark:border-[#272730] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#D8D8CF] dark:border-[#272730] flex items-center justify-between bg-[#F7F6F0]/60 dark:bg-[#18181D]/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-white/20"
              style={{ backgroundColor: color }}
            >
              {icon}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#11120F] dark:text-[#F5F5F7] font-serif">
                {editPlatformData ? 'Edit Study Platform' : 'Add Course / Test Platform'}
              </h2>
              <p className="text-xs text-[#85877E] dark:text-[#787C99]">
                Integrate Physics Wallah, Careerwill, Testbook, or any custom study website
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-2 text-[#85877E] hover:text-[#11120F] dark:hover:text-white rounded-xl hover:bg-[#EEEEE8] dark:hover:bg-[#23232A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Quick Presets (Only on Add) */}
          {!editPlatformData && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-[#85877E] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#596B35] dark:text-[#7AA2F7]" />
                  Popular Quick Presets (1-Click Fill)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_TEMPLATES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="p-2.5 rounded-2xl border border-[#D8D8CF] dark:border-[#272730] bg-[#F7F6F0] dark:bg-[#18181D] hover:border-[#596B35] dark:hover:border-[#7AA2F7] text-left transition-all active:scale-95 flex items-center gap-2 cursor-pointer group"
                  >
                    <span className="text-lg shrink-0">{preset.icon}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7] truncate block group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7]">
                        {preset.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-[#85877E] uppercase font-mono font-bold block">
                        {preset.category === 'course' ? 'Course' : 'Mock Test'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <form id="add-platform-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7]">
                Platform Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'course' as PlatformCategory, label: 'Course / Batches', icon: GraduationCap },
                  { id: 'test_series' as PlatformCategory, label: 'Mock Test Series', icon: FileCheck2 },
                  { id: 'reference' as PlatformCategory, label: 'Reference / Tools', icon: BookOpen },
                  { id: 'custom' as PlatformCategory, label: 'Custom Portal', icon: Globe },
                ].map(cat => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#11120F] dark:bg-white text-white dark:text-black border-transparent shadow-md'
                          : 'bg-[#F7F6F0] dark:bg-[#18181D] text-[#65675F] dark:text-[#A1A1AA] border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name & URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7]">
                  Platform / Batch Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Physics Wallah - Lakshya Batch"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-xs font-medium focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7]">
                  Website / Direct Batch Link *
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-3 text-[#85877E]" />
                  <input
                    type="text"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://pw.live/study/batches..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-xs font-mono font-medium focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7]"
                  />
                </div>
              </div>
            </div>

            {/* Login Hint / Roll Number & Subject Association */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7] flex items-center justify-between">
                  <span>Login ID / User Hint (Optional)</span>
                  <span className="text-[10px] text-[#85877E] font-normal">For 1-click clipboard copy</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-[#85877E]" />
                  <input
                    type="text"
                    value={loginHint}
                    onChange={(e) => setLoginHint(e.target.value)}
                    placeholder="e.g. 9876543210 or student@email.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-xs font-medium focus:outline-none focus:border-[#596B35]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7]">
                  Link with Subject (Optional)
                </label>
                <select
                  value={associatedSubjectId}
                  onChange={(e) => setAssociatedSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-xs font-medium focus:outline-none focus:border-[#596B35]"
                >
                  <option value="">General (All Subjects / Full Mock)</option>
                  {currentExam?.subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description / Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7]">
                Batch / Test Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Tier 1 + Tier 2 Complete Course by Gagan Pratap Sir"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-xs font-medium focus:outline-none focus:border-[#596B35]"
              />
            </div>

            {/* Icon & Color Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7]">
                  Platform Emoji Icon
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[#F7F6F0] dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730]">
                  {EMOJI_OPTIONS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setIcon(em)}
                      className={`w-7 h-7 rounded-lg text-base flex items-center justify-center transition-all cursor-pointer ${
                        icon === em
                          ? 'bg-white dark:bg-[#2A2E3D] shadow-sm scale-110 border border-[#596B35]'
                          : 'hover:bg-white/60 dark:hover:bg-[#222]'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7]">
                  Theme Color Accent
                </label>
                <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-[#F7F6F0] dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730]">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-all cursor-pointer ${
                        color === c ? 'scale-125 ring-2 ring-offset-2 ring-[#596B35]' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Pin to Top Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-[#596B35] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7] flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Pin to Top of Study Station for Instant 1-Click Access
                </span>
              </label>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#D8D8CF] dark:border-[#272730] bg-[#F7F6F0] dark:bg-[#18181D] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#65675F] dark:text-[#A1A1AA] hover:bg-[#EEEEE8] dark:hover:bg-[#23232A] cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            form="add-platform-form"
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#11120F] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] text-xs font-bold shadow-md hover:bg-[#596B35] dark:hover:bg-[#6090F5] cursor-pointer transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{editPlatformData ? 'Save Changes' : 'Add Platform'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
