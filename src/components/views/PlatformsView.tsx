import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  ExternalLink,
  Bookmark,
  Sparkles,
  GraduationCap,
  FileCheck2,
  BookOpen,
  Globe,
  Copy,
  Check,
  Trash2,
  Edit2,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { ExternalPlatform, PlatformCategory } from '../../types/syllabus';
import { useSyllabus } from '../../context/SyllabusContext';
import { AddPlatformModal } from '../modals/AddPlatformModal';
import { soundManager } from '../../utils/soundEffects';

export const PlatformsView: React.FC = () => {
  const { platforms, togglePinPlatform, deletePlatform } = useSyllabus();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | PlatformCategory | 'pinned'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<ExternalPlatform | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered Platforms
  const filteredPlatforms = useMemo(() => {
    return platforms.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.url.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'pinned') return p.pinned;
      return p.category === selectedCategory;
    });
  }, [platforms, searchQuery, selectedCategory]);

  // Statistics
  const coursesCount = platforms.filter(p => p.category === 'course').length;
  const testsCount = platforms.filter(p => p.category === 'test_series').length;
  const pinnedCount = platforms.filter(p => p.pinned).length;

  const handleCopyHint = (e: React.MouseEvent, platformId: string, hint: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hint);
    setCopiedId(platformId);
    soundManager.playClick();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAdd = () => {
    setEditingPlatform(null);
    setIsAddModalOpen(true);
    soundManager.playClick();
  };

  const handleEdit = (e: React.MouseEvent, p: ExternalPlatform) => {
    e.stopPropagation();
    setEditingPlatform(p);
    setIsAddModalOpen(true);
    soundManager.playClick();
  };

  const handleDelete = (e: React.MouseEvent, p: ExternalPlatform) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove "${p.name}" from your Study Station?`)) {
      deletePlatform(p.id);
    }
  };

  const handleTogglePin = (e: React.MouseEvent, platformId: string) => {
    e.stopPropagation();
    togglePinPlatform(platformId);
  };

  const handleDirectLaunch = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    soundManager.playClick();
  };

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* 1. Header Banner & Quick Actions */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-white via-[#F7F6F0] to-[#EEEEE8] dark:from-[#18181D] dark:via-[#12141A] dark:to-[#0B0B0D] border border-[#D8D8CF] dark:border-[#272730] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#596B35]/15 dark:from-[#7AA2F7]/10 to-transparent rounded-full blur-3xl -z-0 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider bg-[#596B35]/10 dark:bg-[#7AA2F7]/20 text-[#596B35] dark:text-[#7AA2F7] border border-[#596B35]/20 dark:border-[#7AA2F7]/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Multi-Platform Study Hub
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-[#85877E] bg-black/5 dark:bg-white/5">
                {platforms.length} Platforms Linked
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#11120F] dark:text-white font-serif">
              Course Batches & Mock Test Portals
            </h1>

            <p className="text-xs sm:text-sm text-[#65675F] dark:text-[#A1A1AA] max-w-2xl leading-relaxed">
              Physics Wallah, Careerwill, Testbook, ya Oliveboard ke kisi bhi card par click karke direct apni batch ya test series open karein.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenAdd}
              className="px-5 py-3 rounded-2xl bg-[#11120F] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] font-bold text-xs sm:text-sm shadow-md hover:bg-[#596B35] dark:hover:bg-[#6090F5] transition-all cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Platform / Batch</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-5 border-t border-[#D8D8CF]/60 dark:border-[#272730]/60 relative z-10">
          <div className="p-3 rounded-2xl bg-white/70 dark:bg-[#18181D]/70 border border-[#D8D8CF]/60 dark:border-[#272730] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-mono font-black text-[#11120F] dark:text-white block">{coursesCount}</span>
              <span className="text-[10px] font-bold uppercase font-mono text-[#85877E]">Course Portals</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 dark:bg-[#18181D]/70 border border-[#D8D8CF]/60 dark:border-[#272730] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-mono font-black text-[#11120F] dark:text-white block">{testsCount}</span>
              <span className="text-[10px] font-bold uppercase font-mono text-[#85877E]">Mock Test Series</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 dark:bg-[#18181D]/70 border border-[#D8D8CF]/60 dark:border-[#272730] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-mono font-black text-[#11120F] dark:text-white block">{pinnedCount}</span>
              <span className="text-[10px] font-bold uppercase font-mono text-[#85877E]">Pinned Quick Links</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 dark:bg-[#18181D]/70 border border-[#D8D8CF]/60 dark:border-[#272730] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-mono font-black text-[#11120F] dark:text-white block">1-Click</span>
              <span className="text-[10px] font-bold uppercase font-mono text-[#85877E]">Direct Redirect</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter Tabs & Search Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#EEEEE8] dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] overflow-x-auto custom-scrollbar shrink-0">
          {[
            { id: 'all', label: 'All', icon: Globe },
            { id: 'course', label: 'Courses 📚', icon: GraduationCap },
            { id: 'test_series', label: 'Mock Tests 📝', icon: FileCheck2 },
            { id: 'reference', label: 'Tools & Reference 🔍', icon: BookOpen },
            { id: 'pinned', label: 'Pinned ⭐', icon: Bookmark },
          ].map(tab => {
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedCategory(tab.id as any);
                  soundManager.playClick();
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-white dark:bg-[#23232A] text-[#11120F] dark:text-white shadow-sm'
                    : 'text-[#65675F] dark:text-[#A1A1AA] hover:text-[#11120F] dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#85877E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search platform, batch name, or URL..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-xs font-medium text-[#11120F] dark:text-white focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-[#85877E] hover:text-[#11120F]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 3. Platform Cards Grid */}
      {filteredPlatforms.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-[#F7F6F0] dark:bg-[#23232A] flex items-center justify-center text-3xl mx-auto border border-[#D8D8CF] dark:border-[#333]">
            🌐
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#11120F] dark:text-white font-serif">
              No study platforms found
            </h3>
            <p className="text-xs text-[#85877E] max-w-sm mx-auto">
              Aap apne Physics Wallah batches, Testbook pass, Careerwill ya kisi bhi portal ko yahan add kar sakte hain.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-[#11120F] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Study Platform</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlatforms.map((platform) => {
            const hasLoginHint = Boolean(platform.loginHint);
            const isCopied = copiedId === platform.id;

            return (
              <div
                key={platform.id}
                onClick={() => handleDirectLaunch(platform.url)}
                className="group relative rounded-3xl bg-white dark:bg-[#18181D] border border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35] dark:hover:border-[#7AA2F7] shadow-sm hover:shadow-lg transition-all p-5 flex flex-col justify-between space-y-4 cursor-pointer active:scale-[0.99]"
              >
                
                {/* Card Top: Icon, Title, Actions */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    
                    {/* Brand Icon & Category Badge */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-white/20 shrink-0 group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: platform.color || '#5A4FCF' }}
                      >
                        {platform.icon || '⚡'}
                      </div>
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#F7F6F0] dark:bg-[#23232A] text-[#65675F] dark:text-[#A1A1AA] border border-[#D8D8CF] dark:border-[#272730]">
                          {platform.category === 'course'
                            ? 'Course Batch'
                            : platform.category === 'test_series'
                            ? 'Mock Series'
                            : platform.category === 'reference'
                            ? 'Reference Tool'
                            : 'Portal'}
                        </span>
                        <h3 className="text-sm font-black text-[#11120F] dark:text-white font-serif mt-1 group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors line-clamp-1">
                          {platform.name}
                        </h3>
                      </div>
                    </div>

                    {/* Pin & Options (stopPropagation to not trigger card redirect) */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleTogglePin(e, platform.id)}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                          platform.pinned
                            ? 'text-amber-500 bg-amber-500/10'
                            : 'text-[#85877E] hover:text-[#11120F] dark:hover:text-white'
                        }`}
                        title={platform.pinned ? 'Unpin Platform' : 'Pin to Top'}
                      >
                        <Bookmark className={`w-4 h-4 ${platform.pinned ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleEdit(e, platform)}
                        className="p-1.5 text-[#85877E] hover:text-[#11120F] dark:hover:text-white rounded-xl hover:bg-[#EEEEE8] dark:hover:bg-[#23232A] cursor-pointer"
                        title="Edit Platform"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, platform)}
                        className="p-1.5 text-[#85877E] hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Remove Platform"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description / Notes */}
                  {platform.description && (
                    <p className="text-xs text-[#65675F] dark:text-[#A1A1AA] line-clamp-2 leading-relaxed">
                      {platform.description}
                    </p>
                  )}

                  {/* Login ID Helper (if provided) */}
                  {hasLoginHint && (
                    <div
                      onClick={(e) => handleCopyHint(e, platform.id, platform.loginHint!)}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F7F6F0] dark:bg-[#12141A] border border-[#D8D8CF] dark:border-[#272730] hover:border-[#596B35] dark:hover:border-[#7AA2F7] transition-all cursor-pointer group/hint"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <KeyRound className="w-3.5 h-3.5 text-[#85877E] shrink-0" />
                        <span className="text-[11px] font-mono text-[#11120F] dark:text-[#C0CAF5] truncate font-medium">
                          {platform.loginHint}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-bold font-mono text-[#596B35] dark:text-[#7AA2F7] shrink-0">
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                            <span className="text-emerald-500">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Copy ID</span>
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Bottom: Direct Launch Action */}
                <div className="pt-3 border-t border-[#D8D8CF] dark:border-[#272730]">
                  <div className="w-full py-2.5 px-4 rounded-2xl bg-[#11120F] dark:bg-white text-white dark:text-black group-hover:bg-[#596B35] dark:group-hover:bg-[#7AA2F7] text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2">
                    <span>Launch {platform.category === 'course' ? 'Course Portal' : 'Test Series'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Platform Modal */}
      {isAddModalOpen && (
        <AddPlatformModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          editPlatformData={editingPlatform}
        />
      )}
    </div>
  );
};
