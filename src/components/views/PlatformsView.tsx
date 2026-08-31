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
  Layers,
  Compass,
  Zap,
  Tag
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

  // Dynamic aesthetic category pill theme
  const getCategoryBadgeStyle = (platform: ExternalPlatform) => {
    const custom = platform.customCategoryName?.toLowerCase() || '';
    
    if (custom.includes('ai') || custom.includes('gpt') || custom.includes('quiz')) {
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/25 dark:border-purple-400/30';
    }
    if (custom.includes('vocab') || custom.includes('english') || custom.includes('pdf')) {
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25 dark:border-amber-400/30';
    }
    if (custom.includes('math') || custom.includes('reason') || custom.includes('special')) {
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 dark:border-emerald-400/30';
    }
    if (platform.category === 'course') {
      return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25 dark:border-indigo-400/30';
    }
    if (platform.category === 'test_series') {
      return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25 dark:border-sky-400/30';
    }
    if (platform.category === 'reference') {
      return 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25 dark:border-teal-400/30';
    }
    return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25 dark:border-rose-400/30';
  };

  return (
    <div className="space-y-6 animate-fade-in select-none pb-12">
      
      {/* 1. HERO BENTO BANNER & STATS */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-br from-white via-[#FAF9F5] to-[#F2F1EB] dark:from-[#16171F] dark:via-[#111218] dark:to-[#0B0C10] border border-[#D8D8CF]/80 dark:border-[#272732] shadow-subtle-depth relative overflow-hidden">
        
        {/* Subtle Ambient Radial Lighting Orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-[#596B35]/20 dark:from-[#7AA2F7]/15 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-tr from-[#5A4FCF]/10 dark:from-[#8B5CF6]/15 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            
            {/* Top Chip Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-widest bg-[#596B35]/15 dark:bg-[#7AA2F7]/20 text-[#596B35] dark:text-[#7AA2F7] border border-[#596B35]/20 dark:border-[#7AA2F7]/30 flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#596B35] dark:text-[#7AA2F7]" />
                Connected Study Hub
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-[#65675F] dark:text-[#A1A1AA] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                {platforms.length} Platforms Linked
              </span>
            </div>

            {/* Title with Gradient Shadow */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#11120F] dark:text-white font-serif tracking-tight leading-tight">
              Course Batches & Mock Portals
            </h1>

            <p className="text-xs sm:text-sm text-[#65675F] dark:text-[#A1A1AA] leading-relaxed">
              Physics Wallah, Careerwill, Testbook, AI Tools, ya apne custom coaching batches ko yahan link karein aur 1-click me direct access payein.
            </p>
          </div>

          {/* Primary Action Button with Glowing Hover */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleOpenAdd}
              className="group relative px-6 py-3.5 rounded-2xl bg-[#11120F] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] font-black text-xs sm:text-sm shadow-lg hover:shadow-xl hover:bg-[#596B35] dark:hover:bg-[#6090F5] transition-all duration-300 cursor-pointer active:scale-95 flex items-center gap-2.5 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
              <span>Add Platform / Batch</span>
            </button>
          </div>
        </div>

        {/* Bento Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7 pt-6 border-t border-[#D8D8CF]/70 dark:border-[#272732] relative z-10">
          
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#181822]/80 backdrop-blur-md border border-[#D8D8CF]/60 dark:border-[#2A2B38] hover:border-[#5A4FCF]/40 transition-all flex items-center gap-3.5 group shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-lg font-mono font-black text-[#11120F] dark:text-white block leading-none">{coursesCount}</span>
              <span className="text-[10px] font-bold uppercase font-mono text-[#85877E] tracking-wider mt-1 block">Course Portals</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#181822]/80 backdrop-blur-md border border-[#D8D8CF]/60 dark:border-[#2A2B38] hover:border-sky-500/40 transition-all flex items-center gap-3.5 group shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-lg font-mono font-black text-[#11120F] dark:text-white block leading-none">{testsCount}</span>
              <span className="text-[10px] font-bold uppercase font-mono text-[#85877E] tracking-wider mt-1 block">Mock Test Series</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#181822]/80 backdrop-blur-md border border-[#D8D8CF]/60 dark:border-[#2A2B38] hover:border-amber-500/40 transition-all flex items-center gap-3.5 group shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bookmark className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-lg font-mono font-black text-[#11120F] dark:text-white block leading-none">{pinnedCount}</span>
              <span className="text-[10px] font-bold uppercase font-mono text-[#85877E] tracking-wider mt-1 block">Pinned Links</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#181822]/80 backdrop-blur-md border border-[#D8D8CF]/60 dark:border-[#2A2B38] hover:border-emerald-500/40 transition-all flex items-center gap-3.5 group shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PenTool className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-lg font-mono font-black text-[#11120F] dark:text-white block leading-none">{customCount}</span>
              <span className="text-[10px] font-bold uppercase font-mono text-[#85877E] tracking-wider mt-1 block">Custom Portals</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FLOATING SEGMENTED FILTER DOCK & SEARCH BAR */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
        
        {/* Sleek Segmented Category Tabs with Dynamic Count Chips */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#EBEAE3] dark:bg-[#15161E] border border-[#D8D8CF] dark:border-[#272732] overflow-x-auto custom-scrollbar shadow-inner shrink-0 max-w-full">
          {[
            { id: 'all', label: 'All', count: categoryCounts.all },
            { id: 'course', label: 'Courses 📚', count: categoryCounts.course },
            { id: 'test_series', label: 'Mock Tests 📝', count: categoryCounts.test_series },
            { id: 'reference', label: 'Tools & Reference 🔍', count: categoryCounts.reference },
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
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-1.5 active:scale-95 ${
                  isSelected
                    ? 'bg-white dark:bg-[#232430] text-[#11120F] dark:text-white shadow-md font-black border border-[#D8D8CF]/50 dark:border-white/10'
                    : 'text-[#65675F] dark:text-[#9A9CAE] hover:text-[#11120F] dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-extrabold ${
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

        {/* Sleek Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#85877E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search platform, custom category, batch name..."
            className="w-full pl-9.5 pr-8 py-2.5 rounded-2xl bg-white dark:bg-[#15161E] border border-[#D8D8CF] dark:border-[#272732] text-xs font-medium text-[#11120F] dark:text-white placeholder-[#85877E] focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] focus:ring-2 focus:ring-[#596B35]/20 dark:focus:ring-[#7AA2F7]/20 shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-[#85877E] hover:text-[#11120F] dark:hover:text-white cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. PLATFORM CARDS GRID (AESTHETIC LEVEL 100) */}
      {filteredPlatforms.length === 0 ? (
        <div className="p-14 rounded-[32px] bg-white dark:bg-[#15161E] border border-[#D8D8CF] dark:border-[#272732] text-center space-y-4 shadow-sm">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlatforms.map((platform) => {
            const hasLoginHint = Boolean(platform.loginHint);
            const isCopied = copiedId === platform.id;
            const cleanDomain = formatCleanDomain(platform.url);

            const categoryBadgeLabel = platform.customCategoryName || (
              platform.category === 'course'
                ? 'Course Batch'
                : platform.category === 'test_series'
                ? 'Mock Series'
                : platform.category === 'reference'
                ? 'Reference Tool'
                : 'Custom Portal'
            );

            const badgeStyle = getCategoryBadgeStyle(platform);

            return (
              <div
                key={platform.id}
                onClick={() => handleDirectLaunch(platform.url)}
                className="group relative rounded-[28px] bg-white dark:bg-[#15161E] border border-[#D8D8CF]/90 dark:border-[#272732] hover:border-[#596B35]/60 dark:hover:border-[#7AA2F7]/60 shadow-subtle-depth hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.45)] hover:-translate-y-1.5 transition-all duration-300 p-5.5 flex flex-col justify-between space-y-4.5 cursor-pointer active:scale-[0.98] overflow-hidden"
              >
                
                {/* 🌟 Top Subtle Ambient Glow Line */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5 transition-opacity duration-300 opacity-70 group-hover:opacity-100"
                  style={{ backgroundColor: platform.color || '#5A4FCF' }}
                />

                {/* Ambient Radial Hover Back-Glow */}
                <div
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                  style={{ backgroundColor: platform.color || '#5A4FCF' }}
                />

                {/* Card Top: Icon, Category Pill, Title & Controls */}
                <div className="space-y-3.5 relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    
                    {/* Left: 3D Squircle Icon + Title */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-13 h-13 rounded-2xl flex items-center justify-center text-2xl shadow-md border border-white/25 shrink-0 group-hover:scale-108 group-hover:rotate-3 transition-transform duration-300 relative overflow-hidden"
                        style={{ backgroundColor: platform.color || '#5A4FCF' }}
                      >
                        {/* Subtle Inner Highlight */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                        <span className="relative z-10 drop-shadow-sm">{platform.icon || '⚡'}</span>
                      </div>
                      
                      <div className="min-w-0 space-y-1">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider border shadow-xs ${badgeStyle}`}>
                          {categoryBadgeLabel}
                        </span>
                        
                        <h3 className="text-base font-black text-[#11120F] dark:text-white font-serif group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors truncate">
                          {platform.name}
                        </h3>
                      </div>
                    </div>

                    {/* Right: Glass Actions Dock & Animated Launch Arrow */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleTogglePin(e, platform.id)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          platform.pinned
                            ? 'text-amber-500 bg-amber-500/10 shadow-xs'
                            : 'text-[#85877E] hover:text-[#11120F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                        title={platform.pinned ? 'Unpin Platform' : 'Pin to Top'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${platform.pinned ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleEdit(e, platform)}
                        className="p-2 text-[#85877E] hover:text-[#11120F] dark:hover:text-white rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                        title="Edit Platform"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, platform)}
                        className="p-2 text-[#85877E] hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                        title="Remove Platform"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Animated Launch Arrow Circle */}
                      <div className="w-8.5 h-8.5 rounded-xl bg-[#F7F6F0] dark:bg-[#20212C] group-hover:bg-[#11120F] dark:group-hover:bg-white text-[#85877E] group-hover:text-white dark:group-hover:text-black flex items-center justify-center transition-all duration-300 shadow-xs ml-1">
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform stroke-[2.5]" />
                      </div>
                    </div>
                  </div>

                  {/* Description / Notes */}
                  {platform.description ? (
                    <p className="text-xs text-[#65675F] dark:text-[#A1A1AA] line-clamp-2 leading-relaxed min-h-[32px]">
                      {platform.description}
                    </p>
                  ) : (
                    <p className="text-xs text-[#85877E] italic font-mono min-h-[32px] flex items-center gap-1">
                      <span>1-Click direct launch to</span>
                      <span className="font-bold underline">{cleanDomain}</span>
                    </p>
                  )}
                </div>

                {/* Card Bottom: Domain Chip & Quick Copy ID (Tactile Bottom Dock) */}
                <div className="pt-3.5 border-t border-[#D8D8CF]/60 dark:border-[#272732] flex items-center justify-between gap-2 relative z-10">
                  
                  {/* Clean Domain Chip with Online Ping Dot */}
                  <div className="flex items-center gap-1.5 px-3 py-1.2 rounded-xl bg-[#F7F6F0] dark:bg-[#1B1C26] border border-[#D8D8CF]/80 dark:border-[#2E2F3E] text-[11px] font-mono text-[#65675F] dark:text-[#A1A1AA] group-hover:text-[#11120F] dark:group-hover:text-white transition-colors truncate shadow-2xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="truncate font-medium">{cleanDomain}</span>
                  </div>

                  {/* Login ID Copy Chip (if available) */}
                  {hasLoginHint ? (
                    <button
                      type="button"
                      onClick={(e) => handleCopyHint(e, platform.id, platform.loginHint!)}
                      className="flex items-center gap-1.5 px-2.5 py-1.2 rounded-xl bg-[#F7F6F0] dark:bg-[#1B1C26] hover:bg-[#DCE8B7] dark:hover:bg-[#252636] border border-[#D8D8CF]/80 dark:border-[#2E2F3E] text-[11px] font-mono font-bold text-[#11120F] dark:text-[#C0CAF5] transition-all cursor-pointer active:scale-95 shrink-0 shadow-2xs"
                      title="Copy Login ID"
                    >
                      <KeyRound className="w-3 h-3 text-[#85877E]" />
                      <span className="max-w-[95px] truncate">{platform.loginHint}</span>
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
                      ) : (
                        <Copy className="w-3 h-3 text-[#85877E]" />
                      )}
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono font-bold text-[#596B35] dark:text-[#7AA2F7] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1">
                      <span>Open Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
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
