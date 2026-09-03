import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Globe,
  Bookmark,
  GraduationCap,
  FileCheck2,
  BookOpen,
  KeyRound,
  PenTool,
  Check,
  Clock
} from 'lucide-react';
import { ExternalPlatform, PlatformCategory } from '../../types/syllabus';
import { useSyllabus } from '../../context/SyllabusContext';
import { soundManager } from '../../utils/soundEffects';

interface AddPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  editPlatformData?: ExternalPlatform | null;
}

const STORAGE_KEY_SAVED_CATEGORIES = 'syllabus3d_saved_custom_categories';

// Quick Custom Category Suggestions
const CUSTOM_CATEGORY_SUGGESTIONS = [
  'Current Affairs',
  'Maths Special',
  'Reasoning Batch',
  'PYQ Practice',
  'PDF Vault',
  'Sectional Quizzes',
  'State Govt Exam',
  'Revision Marathon',
  'YouTube Playlist',
  'Telegram Study'
];

const EMOJI_OPTIONS = ['⚡', '🎓', '📝', '🎯', '🏛️', '📖', '📊', '▶️', '🏆', '🔥', '💻', '🔬', '📐', '🧠', '🌐', '📚', '🚀', '✈️'];
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
  '#FF0000', // Red
  '#11120F'  // Dark
];

export const AddPlatformModal: React.FC<AddPlatformModalProps> = ({
  isOpen,
  onClose,
  editPlatformData
}) => {
  const { platforms, addPlatform, editPlatform, currentExam } = useSyllabus();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const customCatInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(editPlatformData?.name || '');
  const [url, setUrl] = useState(editPlatformData?.url || '');
  const [category, setCategory] = useState<PlatformCategory>(editPlatformData?.category || 'course');
  const [customCategoryName, setCustomCategoryName] = useState(editPlatformData?.customCategoryName || '');
  const [description, setDescription] = useState(editPlatformData?.description || '');
  const [icon, setIcon] = useState(editPlatformData?.icon || '⚡');
  const [color, setColor] = useState(editPlatformData?.color || '#5A4FCF');
  const [loginHint, setLoginHint] = useState(editPlatformData?.loginHint || '');
  const [notes, setNotes] = useState(editPlatformData?.notes || '');
  const [associatedSubjectId, setAssociatedSubjectId] = useState(editPlatformData?.associatedSubjectId || '');
  const [pinned, setPinned] = useState(editPlatformData?.pinned || false);
  const [error, setError] = useState<string | null>(null);

  // Load and combine all saved & existing custom categories
  const savedCustomCategories = useMemo(() => {
    const set = new Set<string>();
    
    // 1. From localStorage history
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((cat: string) => {
            if (cat && typeof cat === 'string' && cat.trim()) {
              set.add(cat.trim());
            }
          });
        }
      }
    } catch (e) {
      console.warn('Error reading saved categories:', e);
    }

    // 2. From all active platforms
    platforms.forEach(p => {
      if (p.customCategoryName && p.customCategoryName.trim()) {
        set.add(p.customCategoryName.trim());
      }
    });

    return Array.from(set);
  }, [platforms]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: PlatformCategory) => {
    setCategory(newCat);
    soundManager.playClick();
    
    if (newCat === 'custom') {
      setIcon('🌐');
      setTimeout(() => {
        customCatInputRef.current?.focus();
      }, 100);
    } else if (newCat === 'course') {
      setIcon('🎓');
      setCustomCategoryName('');
      nameInputRef.current?.focus();
    } else if (newCat === 'test_series') {
      setIcon('📝');
      setCustomCategoryName('');
      nameInputRef.current?.focus();
    } else if (newCat === 'reference') {
      setIcon('📖');
      setCustomCategoryName('');
      nameInputRef.current?.focus();
    }
  };

  const handleSelectSavedCustomCategory = (catName: string) => {
    setCategory('custom');
    setCustomCategoryName(catName);
    setIcon('🌐');
    soundManager.playClick();
    nameInputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a platform or portal name.');
      nameInputRef.current?.focus();
      return;
    }

    let cleanUrl = url.trim();
    if (!cleanUrl) {
      setError('Please enter the website or direct batch URL.');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const payloadCustomCat = category === 'custom'
      ? (customCategoryName.trim() || 'Custom Portal')
      : (customCategoryName.trim() || undefined);

    // Save custom category to localStorage history for future 1-click use
    if (payloadCustomCat && payloadCustomCat !== 'Custom Portal') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_SAVED_CATEGORIES);
        const list: string[] = saved ? JSON.parse(saved) : [];
        if (!list.includes(payloadCustomCat)) {
          list.push(payloadCustomCat);
          localStorage.setItem(STORAGE_KEY_SAVED_CATEGORIES, JSON.stringify(list));
        }
      } catch (e) {
        console.warn('Error saving category to localStorage:', e);
      }
    }

    if (editPlatformData) {
      editPlatform(editPlatformData.id, {
        name: name.trim(),
        url: cleanUrl,
        category,
        customCategoryName: payloadCustomCat,
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
        customCategoryName: payloadCustomCat,
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

  // Dynamic Labels & Placeholders based on category
  const getNameLabel = () => {
    switch (category) {
      case 'custom':
        return customCategoryName.trim() ? `${customCategoryName} Name *` : 'Custom Portal / Website Name *';
      case 'course':
        return 'Course / Batch Name *';
      case 'test_series':
        return 'Mock Test Series Name *';
      case 'reference':
        return 'Reference Tool Name *';
      default:
        return 'Platform / Website Name *';
    }
  };

  const getNamePlaceholder = () => {
    switch (category) {
      case 'custom':
        return 'e.g. Exampur, Rojgar with Ankit, Adda247, Telegram Channel...';
      case 'course':
        return 'e.g. Physics Wallah - Shaurya Batch, Careerwill Maths Special...';
      case 'test_series':
        return 'e.g. Testbook CGL Mock Pass, Oliveboard Sectional Tests...';
      case 'reference':
        return 'e.g. Formula Vault, Notion Study Workspace, Drive PDF...';
      default:
        return 'Enter platform or coaching website name...';
    }
  };

  const getUrlPlaceholder = () => {
    switch (category) {
      case 'custom':
        return 'https://your-coaching-portal.com or direct batch link...';
      case 'course':
        return 'https://pw.live/study/batches or course URL...';
      case 'test_series':
        return 'https://testbook.com/test-series...';
      case 'reference':
        return 'https://notion.so or drive.google.com...';
      default:
        return 'https://example.com...';
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#12141A] border border-[#D8D8CF] dark:border-[#272730] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#D8D8CF] dark:border-[#272730] flex items-center justify-between bg-[#F7F6F0]/60 dark:bg-[#18181D]/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-white/20 transition-transform"
              style={{ backgroundColor: color }}
            >
              {icon}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#11120F] dark:text-[#F5F5F7] font-serif">
                {editPlatformData ? 'Edit Study Platform' : 'Add Course / Test Platform'}
              </h2>
              <p className="text-xs text-[#85877E] dark:text-[#787C99]">
                Physics Wallah, Careerwill, Testbook, ya apna custom portal & category add karein
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

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 animate-shake">
              ⚠️ {error}
            </div>
          )}

          <form id="add-platform-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Category Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7]">
                  Platform Category *
                </label>
                <span className="text-[11px] text-[#596B35] dark:text-[#7AA2F7] font-mono font-bold">
                  {category === 'custom' 
                    ? (customCategoryName ? `Custom: ${customCategoryName}` : 'Custom Category Mode') 
                    : `${category} Mode`}
                </span>
              </div>

              {/* Standard 4 Category Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'course' as PlatformCategory, label: 'Course / Batches', icon: GraduationCap },
                  { id: 'test_series' as PlatformCategory, label: 'Mock Test Series', icon: FileCheck2 },
                  { id: 'reference' as PlatformCategory, label: 'Reference / Tools', icon: BookOpen },
                  { id: 'custom' as PlatformCategory, label: 'Custom Category', icon: PenTool },
                ].map(cat => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#11120F] dark:bg-white text-white dark:text-black border-transparent shadow-md scale-[1.02]'
                          : 'bg-[#F7F6F0] dark:bg-[#18181D] text-[#65675F] dark:text-[#A1A1AA] border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 🌟 SAVED CUSTOM CATEGORIES FROM PREVIOUS LOGS (Always Available) */}
              {savedCustomCategories.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-500/5 dark:bg-[#1E1E26] border border-amber-500/20 dark:border-[#333] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Your Previously Created Categories (1-Click Select):</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {savedCustomCategories.map(savedCat => {
                      const isCurrentCat = category === 'custom' && customCategoryName.trim().toLowerCase() === savedCat.toLowerCase();
                      return (
                        <button
                          key={savedCat}
                          type="button"
                          onClick={() => handleSelectSavedCustomCategory(savedCat)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs border ${
                            isCurrentCat
                              ? 'bg-[#596B35] dark:bg-[#7AA2F7] text-white dark:text-black border-transparent scale-105 ring-2 ring-[#596B35]/40'
                              : 'bg-white dark:bg-[#12141A] text-[#11120F] dark:text-[#C0CAF5] border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35]'
                          }`}
                        >
                          {isCurrentCat && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>✨ {savedCat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Category Input & Suggestions (Visible when Custom is Selected) */}
              {category === 'custom' && (
                <div className="p-3.5 rounded-2xl bg-[#F7F6F0] dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] space-y-3 animate-scale-up">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7] flex items-center justify-between">
                      <span>Type Custom Category Name *</span>
                      <span className="text-[11px] text-[#596B35] dark:text-[#7AA2F7] font-mono">e.g. Current Affairs, PYQ Vault...</span>
                    </label>
                    <input
                      ref={customCatInputRef}
                      type="text"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      placeholder="e.g. Current Affairs, Maths Special, PYQ Practice, Telegram..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#12141A] border border-[#D8D8CF] dark:border-[#272730] text-xs font-medium focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7]"
                    />
                  </div>

                  {/* Quick Custom Category Suggestions */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-[#85877E] block">1-Click Category Suggestions:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {CUSTOM_CATEGORY_SUGGESTIONS.map(catSug => (
                        <button
                          key={catSug}
                          type="button"
                          onClick={() => {
                            setCustomCategoryName(catSug);
                            soundManager.playClick();
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer border ${
                            customCategoryName.trim().toLowerCase() === catSug.toLowerCase()
                              ? 'bg-[#596B35] text-white border-transparent'
                              : 'bg-white dark:bg-[#12141A] text-[#65675F] dark:text-[#A1A1AA] border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35]'
                          }`}
                        >
                          +{catSug}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Name & URL (Dynamic labels & placeholders) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7] flex items-center justify-between">
                  <span>{getNameLabel()}</span>
                  <span className="text-[11px] text-[#596B35] dark:text-[#7AA2F7] font-mono font-bold">Required</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={getNamePlaceholder()}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-xs font-medium focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7] flex items-center justify-between">
                  <span>Website / Batch Link *</span>
                  <span className="text-[11px] text-[#596B35] dark:text-[#7AA2F7] font-mono font-bold">Required</span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-3 text-[#85877E]" />
                  <input
                    type="text"
                    required
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={getUrlPlaceholder()}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#F7F6F0] dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-xs font-mono font-medium focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Login Hint / Roll Number & Subject Association */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#11120F] dark:text-[#F5F5F7] flex items-center justify-between">
                  <span>Login ID / User Hint (Optional)</span>
                  <span className="text-[11px] text-[#85877E] font-normal">For 1-click clipboard copy</span>
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
                Batch / Portal Notes (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Math Special Batch by Gagan Pratap Sir, Tier 1 Mock analysis..."
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
    </div>,
    document.body
  );
};

