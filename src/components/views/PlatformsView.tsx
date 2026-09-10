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
  Filter,
  X
} from 'lucide-react';
import { ExternalPlatform, PlatformCategory } from '../../types/syllabus';
import { useSyllabus } from '../../context/SyllabusContext';
import { AddPlatformModal } from '../modals/AddPlatformModal';
import { soundManager } from '../../utils/soundEffects';

export const stripEmojis = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}✨⭐📚📝🔍🔥🎓🏛️📖📊▶️🏆💻🔬📐🧠🌐🚀✈️]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const PlatformsView: React.FC = () => {
  const { platforms, togglePinPlatform, deletePlatform } = useSyllabus();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<ExternalPlatform | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dynamic custom categories from existing platforms (Cleaned from emojis)
  const customCategoriesList = useMemo(() => {
    const list = new Set<string>();
    platforms.forEach(p => {
      if (p.customCategoryName && p.customCategoryName.trim()) {
        const clean = stripEmojis(p.customCategoryName.trim());
        if (clean) list.add(clean);
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
      custom: 0,
      pinned: 0
    };

    platforms.forEach(p => {
      if (p.pinned) counts.pinned++;
      if (p.category === 'course') counts.course++;
      if (p.category === 'test_series') counts.test_series++;
      if (p.category === 'reference') counts.reference++;
      if (p.category === 'custom' || Boolean(p.customCategoryName)) counts.custom++;

      if (p.customCategoryName && p.customCategoryName.trim()) {
        const cat = stripEmojis(p.customCategoryName.trim());
        if (cat) {
          counts[cat] = (counts[cat] || 0) + 1;
        }
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
      if (selectedCategory === 'custom') return p.category === 'custom' || Boolean(p.customCategoryName);
      
      // Match by custom category name
      if (p.customCategoryName && stripEmojis(p.customCategoryName).toLowerCase() === selectedCategory.toLowerCase()) return true;

      return p.category === selectedCategory;
    });
  }, [platforms, searchQuery, selectedCategory]);

  // Statistics
  const coursesCount = categoryCounts.course;
  const testsCount = categoryCounts.test_series;
  const customCount = categoryCounts.custom;
  const pinnedCount = categoryCounts.pinned;

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

  // Toggle KPI filter
  const handleKpiFilter = (catKey: string) => {
    soundManager.playClick();
    setSelectedCategory(prev => prev === catKey ? 'all' : catKey);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-8 sm:pb-12">
      
      {/* 1. HERO BENTO BANNER WITH 3D AMBIENT NODES */}
      <div className="study-hub-hero-banner p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-[#080911] border border-white/[0.12] shadow-2xl relative overflow-hidden text-white">
        
        {/* Full High-Fidelity 3D Portal Artwork (Right-aligned with natural depth) */}
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-4/5 md:w-3/5 lg:w-[54%] pointer-events-none overflow-hidden flex items-center justify-end z-0">
          <img
            src="/study_hub_banner.png"
            alt="Connected Study Portals"
            className="h-[120%] sm:h-[135%] w-auto max-w-none object-contain object-right-bottom sm:object-right translate-y-1 sm:translate-y-0 opacity-40 sm:opacity-95 select-none"
            loading="eager"
            decoding="async"
            width={600}
            height={320}
          />
        </div>

        {/* Multi-layered Vignette & Legibility Protection Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080911] via-[#080911]/90 md:via-[#080911]/55 to-transparent pointer-events-none z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080911]/85 via-transparent to-transparent pointer-events-none z-0" />
        
        {/* Ambient Glow Accents */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-2.5 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 backdrop-blur-md shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                Connected Study Hub
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-medium text-slate-300 bg-white/[0.06] border border-white/10 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span><strong className="text-white font-bold tabular-nums">{platforms.length}</strong> Platforms Linked</span>
              </span>
            </div>

            <h1 className="study-hub-banner-title text-2xl sm:text-3xl lg:text-4xl font-black text-white font-sans tracking-tight leading-tight">
              Course Batches & Mock Portals
            </h1>
            <p className="study-hub-banner-subtitle text-xs sm:text-[13.5px] text-slate-300 font-normal leading-relaxed">
              Centralized launchpad for your linked courses, mock test platforms, and study portals.
            </p>
          </div>

          <div className="flex items-center shrink-0">
            <button
              onClick={handleOpenAdd}
              className="study-hub-add-btn group relative px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-[13px] shadow-[0_4px_20px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_25px_rgba(99,102,241,0.5)] transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-2.5 border border-white/20 backdrop-blur-md tap-bounce"
            >
              <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Plus className="w-3.5 h-3.5 stroke-[3] text-white group-hover:rotate-90 transition-transform duration-300" />
              </div>
              <span className="tracking-tight">Add Platform / Batch</span>
            </button>
          </div>
        </div>

        {/* Interactive KPI Filter Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mt-5 sm:mt-7 pt-4 sm:pt-5 border-t border-white/10 relative z-10">
          
          {/* Courses */}
          <div
            onClick={() => handleKpiFilter('course')}
            title="Filter by Courses"
            className={`study-hub-bento-tile p-3 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all duration-200 flex items-center gap-3 cursor-pointer shadow-sm group active:scale-95 tap-bounce border ${
              selectedCategory === 'course'
                ? 'bg-purple-500/25 border-purple-400 ring-2 ring-purple-400/50 shadow-purple-500/20 shadow-lg'
                : 'bg-[#121320]/75 hover:bg-[#18192a]/90 border-purple-500/20 hover:border-purple-500/45'
            }`}
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-purple-500/30">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="study-hub-tile-count text-base sm:text-xl font-mono font-black tabular-nums text-white block leading-tight">
                {coursesCount}
              </span>
              <span className="study-hub-label-purple text-[10px] sm:text-[11px] font-bold uppercase font-mono text-purple-200/70 tracking-wider block truncate">
                Courses
              </span>
            </div>
          </div>

          {/* Mock Series */}
          <div
            onClick={() => handleKpiFilter('test_series')}
            title="Filter by Mock Series"
            className={`study-hub-bento-tile p-3 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all duration-200 flex items-center gap-3 cursor-pointer shadow-sm group active:scale-95 tap-bounce border ${
              selectedCategory === 'test_series'
                ? 'bg-sky-500/25 border-sky-400 ring-2 ring-sky-400/50 shadow-sky-500/20 shadow-lg'
                : 'bg-[#121320]/75 hover:bg-[#18192a]/90 border-sky-500/20 hover:border-sky-500/45'
            }`}
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-sky-500/30">
              <FileCheck2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="study-hub-tile-count text-base sm:text-xl font-mono font-black tabular-nums text-white block leading-tight">
                {testsCount}
              </span>
              <span className="study-hub-label-sky text-[10px] sm:text-[11px] font-bold uppercase font-mono text-sky-200/70 tracking-wider block truncate">
                Mock Series
              </span>
            </div>
          </div>

          {/* Pinned Links */}
          <div
            onClick={() => handleKpiFilter('pinned')}
            title="Filter by Pinned Platforms"
            className={`study-hub-bento-tile p-3 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all duration-200 flex items-center gap-3 cursor-pointer shadow-sm group active:scale-95 tap-bounce border ${
              selectedCategory === 'pinned'
                ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400/50 shadow-amber-500/20 shadow-lg'
                : 'bg-[#121320]/75 hover:bg-[#18192a]/90 border-amber-500/20 hover:border-amber-500/45'
            }`}
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-amber-500/30">
              <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="study-hub-tile-count text-base sm:text-xl font-mono font-black tabular-nums text-white block leading-tight">
                {pinnedCount}
              </span>
              <span className="study-hub-label-amber text-[10px] sm:text-[11px] font-bold uppercase font-mono text-amber-200/70 tracking-wider block truncate">
                Pinned
              </span>
            </div>
          </div>

          {/* Custom Portals */}
          <div
            onClick={() => handleKpiFilter('custom')}
            title="Filter by Custom Portals"
            className={`study-hub-bento-tile p-3 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all duration-200 flex items-center gap-3 cursor-pointer shadow-sm group active:scale-95 tap-bounce border ${
              selectedCategory === 'custom'
                ? 'bg-emerald-500/25 border-emerald-400 ring-2 ring-emerald-400/50 shadow-emerald-500/20 shadow-lg'
                : 'bg-[#121320]/75 hover:bg-[#18192a]/90 border-emerald-500/20 hover:border-emerald-500/45'
            }`}
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-emerald-500/30">
              <PenTool className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="study-hub-tile-count text-base sm:text-xl font-mono font-black tabular-nums text-white block leading-tight">
                {customCount}
              </span>
              <span className="study-hub-label-emerald text-[10px] sm:text-[11px] font-bold uppercase font-mono text-emerald-200/70 tracking-wider block truncate">
                Custom
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ADVANCED TOOLBAR: PROMINENT SEARCH & SEGMENTED CATEGORY TRACK */}
      <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#151620] border border-[#E2E8F0] dark:border-[#272730] shadow-xs sm:shadow-subtle-depth space-y-2.5 sm:space-y-3">
        
        {/* Row 1: Search Bar + Live Portals Count */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          {/* Prominent Search Bar (Full Width / Never Hidden) */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#85877E] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by platform name, subject, batch, or URL..."
              className="w-full pl-9 pr-8 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#F8FAFC] dark:bg-[#1B1C28] border border-[#E2E8F0] dark:border-[#2A2C3E] text-xs sm:text-[13px] font-medium text-[#11120F] dark:text-white placeholder-[#85877E] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#7AA2F7] focus:ring-2 focus:ring-[#2563EB]/10 dark:focus:ring-[#7AA2F7]/15 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#85877E] hover:text-[#11120F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Metrics & Reset Filter */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <span className="text-[11px] sm:text-xs font-mono font-bold text-[#65675F] dark:text-[#A1A1B2] bg-[#F8FAFC] dark:bg-[#1B1C28] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-[#E2E8F0] dark:border-[#2A2C3E]">
              <strong className="text-[#11120F] dark:text-white font-black">{filteredPlatforms.length}</strong>
              <span className="text-[#85877E]"> of {platforms.length} Portals</span>
            </span>

            {selectedCategory !== 'all' && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  soundManager.playClick();
                }}
                className="text-[11px] sm:text-xs font-bold text-[#2563EB] dark:text-[#7AA2F7] hover:underline cursor-pointer px-1.5 sm:px-2 active:scale-95 tap-bounce"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Full-Width Category Filter Pills Track (Smooth Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:custom-scrollbar pb-0.5 sm:pb-1 pt-0.5 -mx-1 px-1 sm:mx-0 sm:px-0">
          {[
            { id: 'all', label: 'All Portals', count: categoryCounts.all },
            { id: 'course', label: 'Courses', count: categoryCounts.course },
            { id: 'test_series', label: 'Mock Tests', count: categoryCounts.test_series },
            { id: 'reference', label: 'Tools & Reference', count: categoryCounts.reference },
            ...customCategoriesList.map(cat => ({ 
              id: cat, 
              label: cat,
              count: categoryCounts[cat] || 0
            })),
            { id: 'pinned', label: 'Pinned', count: categoryCounts.pinned },
          ].map(tab => {
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedCategory(tab.id);
                  soundManager.playClick();
                }}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5 shrink-0 tap-bounce ${
                  isSelected
                    ? 'bg-[#0F172A] dark:bg-white text-white dark:text-black shadow-sm font-black'
                    : 'bg-[#F8FAFC] dark:bg-[#1B1C28] text-[#65675F] dark:text-[#CBD5E1] hover:text-[#11120F] dark:hover:text-white border border-[#E2E8F0] dark:border-[#2A2C3E] hover:border-[#2563EB] dark:hover:border-[#7AA2F7]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-md text-[9px] sm:text-[10px] font-mono tabular-nums ${
                    isSelected
                      ? 'bg-white/20 dark:bg-black/15 text-white dark:text-black font-bold'
                      : 'bg-black/5 dark:bg-white/5 text-[#85877E] dark:text-[#94A3B8]'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* 3. PLATFORM CARDS GRID (Sleek SaaS Cards) */}
      {filteredPlatforms.length === 0 ? (
        <div className="p-6 sm:p-14 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#161722] border border-[#E2E8F0] dark:border-[#272838] text-center space-y-3.5 sm:space-y-4 shadow-xs sm:shadow-sm">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-500/15 via-[#2563EB]/15 to-purple-500/10 text-[#2563EB] dark:text-[#7AA2F7] border border-[#2563EB]/20 flex items-center justify-center mx-auto shadow-xs">
            <Globe className="w-6 h-6 sm:w-8 sm:h-8 stroke-[1.8]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-lg font-bold text-[#11120F] dark:text-white font-sans">
              {searchQuery.trim() || selectedCategory !== 'all' ? 'No study platforms found' : 'No Study Platforms Linked'}
            </h3>
            <p className="text-[11px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] max-w-xs sm:max-w-sm mx-auto font-medium">
              {searchQuery.trim() || selectedCategory !== 'all'
                ? `No portals match "${searchQuery || selectedCategory}". Try resetting your filter.`
                : 'Link your coaching batches, mock test series, and study portals for 1-click launch.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1 w-full sm:w-auto">
            {(searchQuery.trim() || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  soundManager.playClick();
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#232435] border border-[#E2E8F0] dark:border-[#333] text-xs font-bold text-[#2563EB] dark:text-[#7AA2F7] hover:bg-[#EFF6FF] cursor-pointer active:scale-95 tap-bounce"
              >
                Clear Search & Filter
              </button>
            )}
            <button
              onClick={handleOpenAdd}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#0F172A] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] text-xs font-bold shadow-sm cursor-pointer inline-flex items-center justify-center gap-1.5 hover:bg-[#2563EB] active:scale-95 transition-all tap-bounce"
            >
              <Plus className="w-4 h-4" />
              <span>Add Platform / Batch</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {filteredPlatforms.map((platform) => {
            const hasLoginHint = Boolean(platform.loginHint);
            const isCopied = copiedId === platform.id;
            const cleanDomain = formatCleanDomain(platform.url);

            const categoryBadgeLabel = stripEmojis(platform.customCategoryName || '') || (
              platform.category === 'course'
                ? 'Course Batch'
                : platform.category === 'test_series'
                ? 'Mock Series'
                : platform.category === 'reference'
                ? 'Reference Tool'
                : 'Custom Portal'
            );

            return (
              <div
                key={platform.id}
                onClick={() => handleDirectLaunch(platform.url)}
                className="group relative rounded-2xl sm:rounded-3xl bg-white dark:bg-[#171822] border border-[#E2E8F0] dark:border-[#272838] hover:border-[#2563EB] dark:hover:border-[#7AA2F7] shadow-xs sm:shadow-sm hover:shadow-md transition-all duration-200 p-3.5 sm:p-5 flex flex-col justify-between space-y-3 sm:space-y-3.5 cursor-pointer active:scale-[0.98] sm:active:scale-[0.99] overflow-hidden"
              >
                {/* Brand Color Top Glow Accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
                  style={{ backgroundColor: platform.color || '#5A4FCF' }}
                />

                {/* Top Section: Icon, Titles, Badges & Quick Action Controls */}
                <div className="space-y-2 sm:space-y-2.5 pt-0.5">
                  <div className="flex items-start justify-between gap-2 sm:gap-2.5">
                    
                    {/* Brand Icon & Platform Info */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl shadow-xs border border-white/20 shrink-0 group-hover:scale-105 transition-transform"
                        style={{
                          backgroundColor: platform.color || '#5A4FCF',
                          boxShadow: `0 4px 14px ${(platform.color || '#5A4FCF')}35`
                        }}
                      >
                        {platform.icon || '⚡'}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <span className="w-1 h-1 rounded-full bg-amber-500" />
                          <span className="truncate max-w-[110px] sm:max-w-[150px]">{categoryBadgeLabel}</span>
                        </span>
                        
                        <h3 className="text-sm sm:text-base font-bold text-[#11120F] dark:text-white font-sans tracking-tight truncate group-hover:text-[#2563EB] dark:group-hover:text-[#7AA2F7] transition-colors">
                          {platform.name}
                        </h3>
                      </div>
                    </div>

                    {/* Action Bar (Pin, Edit, Delete, Launch) */}
                    <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleTogglePin(e, platform.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer active:scale-90 tap-bounce ${
                          platform.pinned
                            ? 'text-amber-500 bg-amber-500/10'
                            : 'text-[#85877E] hover:text-[#11120F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                        title={platform.pinned ? 'Unpin' : 'Pin to top'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${platform.pinned ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleEdit(e, platform)}
                        className="p-1.5 text-[#85877E] hover:text-[#11120F] dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors active:scale-90 tap-bounce"
                        title="Edit Platform"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, platform)}
                        className="p-1.5 text-[#85877E] hover:text-rose-500 rounded-lg hover:bg-rose-500/10 cursor-pointer transition-colors active:scale-90 tap-bounce"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Smooth Launch Squircle */}
                      <div className="w-7 h-7 rounded-lg bg-[#F8FAFC] dark:bg-[#232435] group-hover:bg-[#2563EB] dark:group-hover:bg-[#7AA2F7] text-[#85877E] group-hover:text-white dark:group-hover:text-black flex items-center justify-center transition-all duration-200 shadow-xs ml-0.5 sm:ml-1 active:scale-90 tap-bounce">
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] sm:text-xs text-[#65675F] dark:text-[#A1A1AA] line-clamp-2 leading-relaxed min-h-[28px] sm:min-h-[32px]">
                    {platform.description || `Click to launch official ${cleanDomain} batch directly.`}
                  </p>
                </div>

                {/* Bottom Domain & Quick Credentials Row */}
                <div className="pt-2 sm:pt-2.5 border-t border-[#EEEEE8] dark:border-[#242535] flex items-center justify-between gap-2">
                  
                  {/* Clean Domain Tag */}
                  <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-[#F8FAFC] dark:bg-[#202130] border border-[#E2E8F0] dark:border-[#2D2E40] text-[10px] sm:text-[11px] font-mono text-[#65675F] dark:text-[#A1A1AA] truncate">
                    <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#2563EB] dark:text-[#7AA2F7] shrink-0" />
                    <span className="truncate max-w-[120px] sm:max-w-none">{cleanDomain}</span>
                  </div>

                  {/* Credentials / Login Hint or Hover CTA */}
                  {hasLoginHint ? (
                    <button
                      type="button"
                      onClick={(e) => handleCopyHint(e, platform.id, platform.loginHint!)}
                      className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-[#F8FAFC] dark:bg-[#202130] hover:bg-[#EFF6FF] dark:hover:bg-[#2D2E40] border border-[#E2E8F0] dark:border-[#2D2E40] text-[9px] sm:text-[10px] font-mono font-bold text-[#11120F] dark:text-white transition-all cursor-pointer active:scale-95 shrink-0 tap-bounce"
                      title={`Click to copy: ${platform.loginHint}`}
                    >
                      <KeyRound className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#85877E]" />
                      <span className="max-w-[70px] sm:max-w-[80px] truncate">{isCopied ? 'Copied!' : platform.loginHint}</span>
                      {isCopied ? <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-500 stroke-[3]" /> : <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#85877E]" />}
                    </button>
                  ) : (
                    <span className="text-[10px] sm:text-[11px] font-bold font-mono text-[#2563EB] dark:text-[#7AA2F7] opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <span>Launch</span>
                      <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
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
