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
      if (selectedCategory === 'custom') return p.category === 'custom' || Boolean(p.customCategoryName);
      
      // Match by custom category name
      if (p.customCategoryName === selectedCategory) return true;

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
    <div className="space-y-6 animate-fade-in select-none pb-16">
      
      {/* 1. HERO BENTO BANNER WITH 3D AMBIENT NODES */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0C15] border border-[#242636] shadow-xl relative overflow-hidden text-white">
        
        {/* Full Uncropped High-Fidelity 3D Portal Artwork (Zero crop, fits card perfectly) */}
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-3/4 md:w-3/5 lg:w-1/2 pointer-events-none overflow-hidden flex items-center justify-end z-0">
          <img
            src="/study_hub_banner.png"
            alt="Connected Study Portals"
            className="h-full w-auto max-w-none object-contain object-right opacity-80 sm:opacity-95 select-none"
            loading="eager"
          />
        </div>

        {/* Ambient Gradient Overlays for 100% Text Legibility & Smooth Blend */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C15] via-[#0B0C15]/80 md:via-[#0B0C15]/40 to-transparent pointer-events-none z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C15]/70 via-transparent to-transparent pointer-events-none z-0" />
        
        {/* Ambient Glow Accents */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#7AA2F7]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-white/10 text-[#7AA2F7] border border-white/15 backdrop-blur-md flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#7AA2F7] animate-pulse" />
                Connected Study Hub
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold text-[#A1A1B2] bg-white/5 border border-white/10 backdrop-blur-md">
                {platforms.length} Platforms Linked
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-sans tracking-tight">
              Course Batches & Mock Portals
            </h1>

            <p className="text-xs sm:text-sm text-[#B4B7CA] leading-relaxed">
              Physics Wallah, Careerwill, Testbook, AI Tools, ya apne coaching batches ko 1-click me direct launch karein.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleOpenAdd}
              className="group relative px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-[#7AA2F7] to-[#8B5CF6] hover:from-[#6B96F5] hover:to-[#7C3AED] text-black font-extrabold text-xs sm:text-[13px] shadow-[0_0_20px_rgba(122,162,247,0.3)] hover:shadow-[0_0_28px_rgba(122,162,247,0.5)] transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-2 overflow-hidden"
            >
              <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
              <span>Add Platform / Batch</span>
            </button>
          </div>
        </div>

        {/* Interactive KPI Filter Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 mt-6 pt-5 border-t border-white/10 relative z-10">
          
          {/* Courses */}
          <div
            onClick={() => handleKpiFilter('course')}
            className={`p-3 sm:p-3.5 rounded-2xl transition-all flex items-center gap-3 cursor-pointer shadow-md group ${
              selectedCategory === 'course'
                ? 'bg-purple-500/20 border-2 border-purple-400 ring-2 ring-purple-400/30'
                : 'bg-[#141524]/80 backdrop-blur-md border border-white/10 hover:border-purple-500/40 hover:bg-[#181A2D]'
            }`}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-purple-500/30">
              <GraduationCap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-base sm:text-lg font-mono font-black tabular-nums text-white block leading-tight">{coursesCount}</span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase font-mono text-[#A1A1B2] tracking-wider block truncate">Courses</span>
            </div>
          </div>

          {/* Mock Series */}
          <div
            onClick={() => handleKpiFilter('test_series')}
            className={`p-3 sm:p-3.5 rounded-2xl transition-all flex items-center gap-3 cursor-pointer shadow-md group ${
              selectedCategory === 'test_series'
                ? 'bg-sky-500/20 border-2 border-sky-400 ring-2 ring-sky-400/30'
                : 'bg-[#141524]/80 backdrop-blur-md border border-white/10 hover:border-sky-500/40 hover:bg-[#181A2D]'
            }`}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-sky-500/30">
              <FileCheck2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-base sm:text-lg font-mono font-black tabular-nums text-white block leading-tight">{testsCount}</span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase font-mono text-[#A1A1B2] tracking-wider block truncate">Mock Series</span>
            </div>
          </div>

          {/* Pinned Links */}
          <div
            onClick={() => handleKpiFilter('pinned')}
            className={`p-3 sm:p-3.5 rounded-2xl transition-all flex items-center gap-3 cursor-pointer shadow-md group ${
              selectedCategory === 'pinned'
                ? 'bg-amber-500/20 border-2 border-amber-400 ring-2 ring-amber-400/30'
                : 'bg-[#141524]/80 backdrop-blur-md border border-white/10 hover:border-amber-500/40 hover:bg-[#181A2D]'
            }`}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-amber-500/30">
              <Bookmark className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-base sm:text-lg font-mono font-black tabular-nums text-white block leading-tight">{pinnedCount}</span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase font-mono text-[#A1A1B2] tracking-wider block truncate">Pinned</span>
            </div>
          </div>

          {/* Custom Portals */}
          <div
            onClick={() => handleKpiFilter('custom')}
            className={`p-3 sm:p-3.5 rounded-2xl transition-all flex items-center gap-3 cursor-pointer shadow-md group ${
              selectedCategory === 'custom'
                ? 'bg-emerald-500/20 border-2 border-emerald-400 ring-2 ring-emerald-400/30'
                : 'bg-[#141524]/80 backdrop-blur-md border border-white/10 hover:border-emerald-500/40 hover:bg-[#181A2D]'
            }`}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-emerald-500/30">
              <PenTool className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-base sm:text-lg font-mono font-black tabular-nums text-white block leading-tight">{customCount}</span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase font-mono text-[#A1A1B2] tracking-wider block truncate">Custom</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER TABS & SLEEK SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Category Tabs (No scrollbar line, clean floating pills) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#EFEFE8] dark:bg-[#161722] border border-[#D8D8CF] dark:border-[#272838] overflow-x-auto no-scrollbar shadow-xs shrink-0 max-w-full">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white dark:bg-[#252636] text-[#11120F] dark:text-white shadow-xs font-black border border-[#D8D8CF]/60 dark:border-white/10'
                    : 'text-[#65675F] dark:text-[#9A9CAE] hover:text-[#11120F] dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono tabular-nums ${
                    isSelected
                      ? 'bg-[#11120F]/10 dark:bg-white/15 text-[#11120F] dark:text-white font-bold'
                      : 'bg-black/5 dark:bg-white/5 text-[#85877E] dark:text-[#7A7C8E]'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#85877E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search portals, batches, URLs..."
            className="w-full pl-9 pr-8 py-2 rounded-2xl bg-white dark:bg-[#161722] border border-[#D8D8CF] dark:border-[#272838] text-xs font-medium text-[#11120F] dark:text-white placeholder-[#85877E] focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7] shadow-xs transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-[#85877E] hover:text-[#11120F] dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. PLATFORM CARDS GRID (Sleek SaaS Cards) */}
      {filteredPlatforms.length === 0 ? (
        <div className="p-12 sm:p-16 rounded-3xl bg-white dark:bg-[#161722] border border-[#D8D8CF] dark:border-[#272838] text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#F7F6F0] dark:bg-[#20212F] flex items-center justify-center text-2xl mx-auto border border-[#D8D8CF] dark:border-[#333]">
            🌐
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#11120F] dark:text-white font-sans">
              No study platforms found
            </h3>
            <p className="text-xs text-[#85877E] max-w-sm mx-auto">
              {searchQuery ? `No results matching "${searchQuery}".` : 'Add your coaching batches, mock portals, or AI study tools.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-[#F7F6F0] dark:bg-[#232435] border border-[#D8D8CF] dark:border-[#333] text-xs font-bold text-[#65675F] dark:text-white hover:bg-[#EEEEE8] cursor-pointer"
              >
                Clear Search
              </button>
            )}
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-[#11120F] dark:bg-[#7AA2F7] text-white dark:text-[#0B0B0D] text-xs font-bold shadow-sm cursor-pointer inline-flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Platform</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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

            return (
              <div
                key={platform.id}
                onClick={() => handleDirectLaunch(platform.url)}
                className="group relative rounded-2xl sm:rounded-3xl bg-white dark:bg-[#171822] border border-[#D8D8CF] dark:border-[#272838] hover:border-[#596B35] dark:hover:border-[#7AA2F7] shadow-sm hover:shadow-md transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between space-y-3.5 cursor-pointer active:scale-[0.99] overflow-hidden"
              >
                {/* Brand Color Top Glow Accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
                  style={{ backgroundColor: platform.color || '#5A4FCF' }}
                />

                {/* Top Section: Icon, Titles, Badges & Quick Action Controls */}
                <div className="space-y-2.5 pt-0.5">
                  <div className="flex items-start justify-between gap-2.5">
                    
                    {/* Brand Icon & Platform Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-xs border border-white/20 shrink-0 group-hover:scale-105 transition-transform"
                        style={{
                          backgroundColor: platform.color || '#5A4FCF',
                          boxShadow: `0 4px 14px ${(platform.color || '#5A4FCF')}35`
                        }}
                      >
                        {platform.icon || '⚡'}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <span className="w-1 h-1 rounded-full bg-amber-500" />
                          <span className="truncate max-w-[120px] sm:max-w-[150px]">{categoryBadgeLabel}</span>
                        </span>
                        
                        <h3 className="text-[15px] sm:text-base font-bold text-[#11120F] dark:text-white font-sans tracking-tight truncate group-hover:text-[#596B35] dark:group-hover:text-[#7AA2F7] transition-colors">
                          {platform.name}
                        </h3>
                      </div>
                    </div>

                    {/* Action Bar (Pin, Edit, Delete, Launch) */}
                    <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleTogglePin(e, platform.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
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
                        className="p-1.5 text-[#85877E] hover:text-[#11120F] dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                        title="Edit Platform"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, platform)}
                        className="p-1.5 text-[#85877E] hover:text-rose-500 rounded-lg hover:bg-rose-500/10 cursor-pointer transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Smooth Launch Squircle */}
                      <div className="w-7 h-7 rounded-lg bg-[#F7F6F0] dark:bg-[#232435] group-hover:bg-[#596B35] dark:group-hover:bg-[#7AA2F7] text-[#85877E] group-hover:text-white dark:group-hover:text-black flex items-center justify-center transition-all duration-200 shadow-xs ml-1">
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#65675F] dark:text-[#A1A1AA] line-clamp-2 leading-relaxed min-h-[32px]">
                    {platform.description || `Click to launch official ${cleanDomain} batch directly.`}
                  </p>
                </div>

                {/* Bottom Domain & Quick Credentials Row */}
                <div className="pt-2.5 border-t border-[#EEEEE8] dark:border-[#242535] flex items-center justify-between gap-2">
                  
                  {/* Clean Domain Tag */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7F6F0] dark:bg-[#202130] border border-[#E5E5DC] dark:border-[#2D2E40] text-[11px] font-mono text-[#65675F] dark:text-[#A1A1AA] truncate">
                    <Globe className="w-3 h-3 text-[#596B35] dark:text-[#7AA2F7] shrink-0" />
                    <span className="truncate">{cleanDomain}</span>
                  </div>

                  {/* Credentials / Login Hint or Hover CTA */}
                  {hasLoginHint ? (
                    <button
                      type="button"
                      onClick={(e) => handleCopyHint(e, platform.id, platform.loginHint!)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F7F6F0] dark:bg-[#202130] hover:bg-[#DCE8B7] dark:hover:bg-[#2D2E40] border border-[#E5E5DC] dark:border-[#2D2E40] text-[10px] font-mono font-bold text-[#11120F] dark:text-white transition-all cursor-pointer active:scale-95 shrink-0"
                      title={`Click to copy: ${platform.loginHint}`}
                    >
                      <KeyRound className="w-3 h-3 text-[#85877E]" />
                      <span className="max-w-[80px] truncate">{isCopied ? 'Copied!' : platform.loginHint}</span>
                      {isCopied ? <Check className="w-3 h-3 text-emerald-500 stroke-[3]" /> : <Copy className="w-3 h-3 text-[#85877E]" />}
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold font-mono text-[#596B35] dark:text-[#7AA2F7] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <span>Launch</span>
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
