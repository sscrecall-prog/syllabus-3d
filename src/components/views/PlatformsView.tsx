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
  ArrowUpRight,
  PenTool,
  Lock
} from 'lucide-react';
import { ExternalPlatform, PlatformCategory } from '../../types/syllabus';
import { useSyllabus } from '../../context/SyllabusContext';
import { AddPlatformModal } from '../modals/AddPlatformModal';
import { soundManager } from '../../utils/soundEffects';

export const PlatformsView: React.FC = () => {
  const { platforms, togglePinPlatform, deletePlatform } = useSyllabus();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<ExternalPlatform | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dynamic custom categories from existing platforms
  const customCategoriesList = useMemo(() => {
    const list = new Set<string>();
    platforms.forEach(p => {
      if (p.customCategoryName && p.customCategoryName.trim()) {
        list.add(p.customCategoryName.trim());
      }
    });
    return Array.from(list);
  }, [platforms]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: platforms.length,
      course: 0,
      test_series: 0,
      reference: 0,
      pinned: 0
    };

    platforms.forEach(p => {
      if (p.pinned) counts.pinned++;
      if (p.category === 'course') counts.course++;
      if (p.category === 'test_series') counts.test_series++;
      if (p.category === 'reference') counts.reference++;

      if (p.customCategoryName && p.customCategoryName.trim()) {
        const cat = p.customCategoryName.trim();
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    return counts;
  }, [platforms]);

  // Filtered Platforms
  const filteredPlatforms = useMemo(() => {
    return platforms.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.customCategoryName && p.customCategoryName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.url.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'pinned') return p.pinned;
      if (selectedCategory === 'course') return p.category === 'course';
      if (selectedCategory === 'test_series') return p.category === 'test_series';
      if (selectedCategory === 'reference') return p.category === 'reference';
      if (selectedCategory === 'custom') return p.category === 'custom';
      
      // Match by custom category name
      if (p.customCategoryName === selectedCategory) return true;

      return p.category === selectedCategory;
    });
  }, [platforms, searchQuery, selectedCategory]);

  // Statistics
  const coursesCount = platforms.filter(p => p.category === 'course').length;
  const testsCount = platforms.filter(p => p.category === 'test_series').length;
  const customCount = platforms.filter(p => p.category === 'custom' || Boolean(p.customCategoryName)).length;
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

  const formatCleanDomain = (url: string) => {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.replace(/^www\./, '');
    } catch (e) {
      return url.replace(/^https?:\/\//, '').split('/')[0];
    }
  };

  // Dynamic aesthetic category pill styling
  const getCategoryBadgeStyle = (platform: ExternalPlatform) => {
    const custom = platform.customCategoryName?.toLowerCase() || '';
    
    if (custom.includes('ai') || custom.includes('quiz') || custom.includes('gpt')) {
      return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
    }
    if (custom.includes('vocab') || custom.includes('english') || custom.includes('word')) {
      return 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20';
    }
    if (custom.includes('math') || custom.includes('reason') || custom.includes('special')) {
      return 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20';
    }
    if (platform.category === 'course') {
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
    }
    if (platform.category === 'test_series') {
      return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20';
    }
    if (platform.category === 'reference') {
      return 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20';
    }
    return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
  };

  return (
    <div className="space-y-6 animate-fade-in select-none pb-12">
      
      {/* 1. HERO BANNER & STATS */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-white via-[#FAF9F5] to-[#F2F1EB] dark:from-[#181822] dark:via-[#13141B] dark:to-[#0C0D12] border border-[#D8D8CF] dark:border-[#272732] shadow-subtle-depth relative overflow-hidden">
        
        {/* Subtle Ambient Background Lighting */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#596B35]/10 dark:bg-[#7AA2F7]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-[#596B35]/15 dark:bg-[#7AA2F7]/20 text-[#596B35] dark:text-[#7AA2F7] border border-[#596B35]/20 dark:border-[#7AA2F7]/30 flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#596B35] dark:text-[#7AA2F7]" />
                Connected Study Hub
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-[#65675F] dark:text-[#A1A1AA] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                {platforms.length} Platforms Linked
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#11120F] dark:text-white font-serif tracking-tight">
              Course Batches & Mock Portals
            </h1>

            <p className="text-xs sm:text-sm text-[#65675F] dark:text-[#A1A1AA] max-w-2xl leading-relaxed">
              Physics Wallah, Careerwill, Testbook, AI Tools, ya apne coaching portals par 1-click me jump karein.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleOpenAdd}
              className="px-5 py-3 rounded-2xl bg-[#11120F] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] font-bold text-xs sm:text-sm shadow-md hover:bg-[#596B35] dark:hover:bg-[#6090F5] transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Platform / Batch</span>
            </button>
          </div>
        </div>

        {/* Bento Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#D8D8CF]/70 dark:border-[#272732] relative z-10">
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#1E1F2A]/80 border border-[#D8D8CF]/60 dark:border-[#2A2B38] flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-base font-mono font-black text-[#11120F] dark:text-white block leading-none">{coursesCount}</span>
              <span className="text-[10px] font-bold uppercase font-mono text-[#85877E] mt-1 block">Courses</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#1E1F2A]/80 border border-[#D8D8CF]/60 dark:border-[#2A2B38] flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <FileCheck2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-base font-mono font-black text-[#11120F] dark:text-white block leading-none">{testsCount}</span>
              <span className="text-[10px] font-bold uppercase font-mono text-[#85877E] mt-1 block">Mock Series</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#1E1F2A]/80 border border-[#D8D8CF]/60 dark:border-[#2A2B38] flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Bookmark className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-base font-mono font-black text-[#11120F] dark:text-white block leading-none">{pinnedCount}</span>
              <span className="text-[10px] font-bold uppercase font-mono text-[#85877E] mt-1 block">Pinned</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/80 dark:bg-[#1E1F2A]/80 border border-[#D8D8CF]/60 dark:border-[#2A2B38] flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PenTool className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-base font-mono font-black text-[#11120F] dark:text-white block leading-none">{customCount}</span>
              <span className="text-[10px] font-bold uppercase font-mono text-[#85877E] mt-1 block">Custom Hub</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER DOCK & SEARCH BAR */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#EAE8DF] dark:bg-[#181822] border border-[#D8D8CF] dark:border-[#272732] overflow-x-auto custom-scrollbar shadow-inner shrink-0 max-w-full">
          {[
            { id: 'all', label: 'All', count: categoryCounts.all },
            { id: 'course', label: 'Courses 📚', count: categoryCounts.course },
            { id: 'test_series', label: 'Mock Tests 📝', count: categoryCounts.test_series },
            { id: 'reference', label: 'Tools 🔍', count: categoryCounts.reference },
            ...customCategoriesList.map(cat => ({ 
              id: cat, 
              label: `✨ ${cat}`, 
              count: categoryCounts[cat] || 0 
            })),
            { id: 'pinned', label: 'Pinned ⭐', count: categoryCounts.pinned },
          ].map(tab => {
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedCategory(tab.id);
                  soundManager.playClick();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
                  isSelected
                    ? 'bg-white dark:bg-[#252634] text-[#11120F] dark:text-white shadow-sm font-extrabold border border-[#D8D8CF]/50 dark:border-white/10'
                    : 'text-[#65675F] dark:text-[#9A9CAE] hover:text-[#11120F] dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                    isSelected
                      ? 'bg-[#11120F]/10 dark:bg-white/15 text-[#11120F] dark:text-white'
                      : 'bg-black/5 dark:bg-white/5 text-[#85877E]'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#85877E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search batch, category, or URL..."
            className="w-full pl-9 pr-8 py-2 rounded-2xl bg-white dark:bg-[#181822] border border-[#D8D8CF] dark:border-[#272732] text-xs font-medium text-[#11120F] dark:text-white placeholder-[#85877E] focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-xs text-[#85877E] hover:text-[#11120F] dark:hover:text-white cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. BEAUTIFULLY PROPORTIONED APP TILES (4 COLUMNS / BALANCED BOXES) */}
      {filteredPlatforms.length === 0 ? (
        <div className="p-14 rounded-3xl bg-white dark:bg-[#181822] border border-[#D8D8CF] dark:border-[#272732] text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-[#F7F6F0] dark:bg-[#20212C] flex items-center justify-center text-3xl mx-auto border border-[#D8D8CF] dark:border-[#333]">
            🌐
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#11120F] dark:text-white font-serif">
              No study platforms found
            </h3>
            <p className="text-xs text-[#85877E] max-w-sm mx-auto">
              Aap Physics Wallah, Careerwill, Testbook, AI Tools, ya apni kisi bhi custom category me portal add kar sakte hain.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-[#11120F] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Study Platform</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPlatforms.map((platform) => {
            const hasLoginHint = Boolean(platform.loginHint);
            const isCopied = copiedId === platform.id;
            const cleanDomain = formatCleanDomain(platform.url);

            const categoryBadgeLabel = platform.customCategoryName || (
              platform.category === 'course'
                ? 'Course'
                : platform.category === 'test_series'
                ? 'Mock Series'
                : platform.category === 'reference'
                ? 'Reference'
                : 'Custom'
            );

            const badgeStyle = getCategoryBadgeStyle(platform);

            return (
              <div
                key={platform.id}
                onClick={() => handleDirectLaunch(platform.url)}
                className="group relative rounded-2xl bg-white dark:bg-[#181822] border border-[#E2E2D8] dark:border-[#272732] hover:border-[#596B35] dark:hover:border-[#7AA2F7] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 p-4.5 flex flex-col justify-between space-y-3.5 cursor-pointer active:scale-[0.98] overflow-hidden"
              >
                
                {/* Subtle Card Header */}
                <div className="space-y-3">
                  
                  {/* Top Row: Icon + Title + Actions */}
                  <div className="flex items-start justify-between gap-2.5">
                    
                    {/* App Icon + Title */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-xs border border-white/25 shrink-0 group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: platform.color || '#5A4FCF' }}
                      >
                        <span>{platform.icon || '⚡'}</span>
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block px-2 py-0.2 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider border ${badgeStyle}`}>
                            {categoryBadgeLabel}
                          </span>
                        </div>
                        <h3 className="text-sm font-extrabold text-[#191A17] dark:text-[#F5F5F7] font-serif group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors truncate">
                          {platform.name}
                        </h3>
                      </div>
                    </div>

                    {/* Actions: Pin, Edit, Delete */}
                    <div className="flex items-center gap-0.5 shrink-0 text-[#85877E]" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleTogglePin(e, platform.id)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          platform.pinned
                            ? 'text-amber-500 bg-amber-500/10'
                            : 'hover:text-[#11120F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                        title={platform.pinned ? 'Unpin' : 'Pin'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${platform.pinned ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleEdit(e, platform)}
                        className="p-1.5 rounded-lg hover:text-[#11120F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, platform)}
                        className="p-1.5 rounded-lg hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Description Box (Clean container) */}
                  <div className="p-2.5 rounded-xl bg-[#F7F6F0]/80 dark:bg-[#12131A]/80 border border-[#ECECE4] dark:border-[#22232E] min-h-[44px] flex items-center">
                    <p className="text-[11px] text-[#65675F] dark:text-[#9A9CAE] line-clamp-2 leading-relaxed">
                      {platform.description || `Click to open official ${cleanDomain} batch.`}
                    </p>
                  </div>
                </div>

                {/* Card Footer: Domain + Launch Button */}
                <div className="pt-2.5 border-t border-[#ECECE4] dark:border-[#22232E] flex items-center justify-between gap-2">
                  
                  {/* Domain Chip */}
                  <div className="flex items-center gap-1 min-w-0 pr-1 text-[11px] font-mono text-[#85877E] dark:text-[#787C99] truncate">
                    <Globe className="w-3 h-3 text-[#596B35] dark:text-[#7AA2F7] shrink-0" />
                    <span className="truncate">{cleanDomain}</span>
                  </div>

                  {/* Right Actions: Login Hint / Launch Pill */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {hasLoginHint && (
                      <button
                        type="button"
                        onClick={(e) => handleCopyHint(e, platform.id, platform.loginHint!)}
                        className="px-2 py-1 rounded-lg bg-[#F7F6F0] dark:bg-[#23232C] hover:bg-[#DCE8B7] dark:hover:bg-[#2E2E38] border border-[#D8D8CF] dark:border-[#333] text-[10px] font-mono font-bold text-[#11120F] dark:text-white transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                        title={`Copy: ${platform.loginHint}`}
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-500 stroke-[3]" /> : <Copy className="w-3 h-3" />}
                        <span className="max-w-[70px] truncate">{isCopied ? 'Copied' : platform.loginHint}</span>
                      </button>
                    )}

                    {/* Launch Indicator Button */}
                    <button
                      type="button"
                      onClick={() => handleDirectLaunch(platform.url)}
                      className="px-2.5 py-1 rounded-lg bg-[#11120F] dark:bg-white text-white dark:text-black group-hover:bg-[#596B35] dark:group-hover:bg-[#7AA2F7] text-[10px] font-bold font-mono transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <span>Open</span>
                      <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
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
