import React, { useState, useMemo, useRef } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Calculator,
  BrainCircuit,
  Globe,
  Layers,
  Sparkles,
  CheckCircle2,
  Zap,
  AlertTriangle,
  Clock,
  Circle,
  Target,
  Search,
  X,
  Orbit,
  RotateCcw,
  FileText
} from 'lucide-react';
import { Topic, Subject, Chapter } from '../../types/syllabus';
import { soundManager } from '../../utils/soundEffects';

interface MindMapViewProps {
  onOpenTopicDrawer: (topic: Topic, subName: string, chName: string) => void;
}

export const MindMapView: React.FC<MindMapViewProps> = ({ onOpenTopicDrawer }) => {
  const { currentExam } = useSyllabus();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredNode, setHoveredNode] = useState<{
    topic: Topic;
    subjectName: string;
    chapterName: string;
  } | null>(null);

  const [viewLayout, setViewLayout] = useState<'radial' | 'tree'>('radial');

  if (!currentExam) return null;

  // Filtered Subjects
  const activeSubjects = useMemo(() => {
    if (selectedSubjectId === 'all') return currentExam.subjects;
    return currentExam.subjects.filter(s => s.id === selectedSubjectId);
  }, [currentExam, selectedSubjectId]);

  // Overall counts
  const totalTopicNodes = useMemo(() => {
    let count = 0;
    currentExam.subjects.forEach(s => s.chapters.forEach(ch => { count += ch.topics.length; }));
    return count;
  }, [currentExam]);

  const masteredNodesCount = useMemo(() => {
    let count = 0;
    currentExam.subjects.forEach(s => s.chapters.forEach(ch => {
      count += ch.topics.filter(t => t.status === 'completed').length;
    }));
    return count;
  }, [currentExam]);

  const inProgressNodesCount = useMemo(() => {
    let count = 0;
    currentExam.subjects.forEach(s => s.chapters.forEach(ch => {
      count += ch.topics.filter(t => t.status === 'in_progress').length;
    }));
    return count;
  }, [currentExam]);

  const weakNodesCount = useMemo(() => {
    let count = 0;
    currentExam.subjects.forEach(s => s.chapters.forEach(ch => {
      count += ch.topics.filter(t => t.status === 'weak' || t.isWeak).length;
    }));
    return count;
  }, [currentExam]);

  const overallPercent = totalTopicNodes > 0 ? Math.round((masteredNodesCount / totalTopicNodes) * 100) : 0;

  // Subject Icon & Theme Helper
  const getSubjectMeta = (name: string, fallbackColor?: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('quant') || lower.includes('math')) {
      return {
        icon: Calculator,
        color: fallbackColor || '#EF4444',
        gradient: 'from-[#3b0b11] via-[#5c131c] to-[#25070b]',
        border: 'border-red-500/40',
        text: 'text-red-300'
      };
    }
    if (lower.includes('gk') || lower.includes('general awareness') || lower.includes('knowledge') || lower.includes('gs') || lower.includes('pyq')) {
      return {
        icon: Globe,
        color: fallbackColor || '#0EA5E9',
        gradient: 'from-[#0c2340] via-[#113563] to-[#08172c]',
        border: 'border-sky-500/40',
        text: 'text-sky-300'
      };
    }
    if (lower.includes('reasoning') || lower.includes('intelligence')) {
      return {
        icon: BrainCircuit,
        color: fallbackColor || '#A855F7',
        gradient: 'from-[#2a134a] via-[#3e1a6e] to-[#1a0c2e]',
        border: 'border-purple-500/40',
        text: 'text-purple-300'
      };
    }
    if (lower.includes('english') || lower.includes('editorial') || lower.includes('comprehension')) {
      return {
        icon: BookOpen,
        color: fallbackColor || '#10B981',
        gradient: 'from-[#0a3225] via-[#104b38] to-[#062017]',
        border: 'border-emerald-500/40',
        text: 'text-emerald-300'
      };
    }
    return {
      icon: Layers,
      color: fallbackColor || '#7AA2F7',
      gradient: 'from-[#181926] via-[#24263a] to-[#12131d]',
      border: 'border-[#3b3d56]',
      text: 'text-indigo-300'
    };
  };

  const getNodeDetails = (status: Topic['status'], isWeak: boolean) => {
    if (status === 'completed') {
      return {
        color: '#10B981',
        label: 'Mastered',
        icon: CheckCircle2,
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      };
    }
    if (status === 'in_progress') {
      return {
        color: '#F59E0B',
        label: 'In Progress',
        icon: Zap,
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      };
    }
    if (status === 'revision_due') {
      return {
        color: '#A855F7',
        label: 'Revise Due',
        icon: Clock,
        badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
      };
    }
    if (status === 'weak' || isWeak) {
      return {
        color: '#F43F5E',
        label: 'Weak Focus',
        icon: AlertTriangle,
        badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30'
      };
    }
    return {
      color: '#64748B',
      label: 'Not Started',
      icon: Circle,
      badgeClass: 'bg-slate-800/80 text-slate-300 border-slate-700/80'
    };
  };

  const handleZoom = (delta: number) => {
    soundManager.playClick();
    setZoomLevel(prev => Math.max(0.6, Math.min(1.8, Number((prev + delta).toFixed(2)))));
  };

  const handleResetZoom = () => {
    soundManager.playClick();
    setZoomLevel(1);
  };

  return (
    <div className="space-y-5 pb-16 animate-fade-in select-none max-w-full overflow-x-hidden font-sans">
      
      {/* 1. EXECUTIVE HEADER & CONTROLS */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1E1F2E] border border-[#D8D8CF] dark:border-[#262738] shadow-subtle-depth space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Left Title Capsule */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0c2340] via-[#113563] to-[#08172c] border border-cyan-500/40 text-cyan-300 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)] shrink-0">
              <Orbit className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2] animate-spin-slow" />
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#596B35] dark:text-[#7AA2F7]">
                <span>{currentExam.name}</span>
                <span>•</span>
                <span>Neural Concept Graph</span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-[#11120F] dark:text-[#F5F5F7] tracking-tight uppercase truncate">
                Interactive Concept Mind Map
              </h2>
              <p className="text-xs text-[#65675F] dark:text-[#94A3B8] font-medium hidden sm:block">
                Visual constellation displaying subject hierarchies, topic connections & live mastery status
              </p>
            </div>
          </div>

          {/* Right Toolbar: Search, Mode Switcher & Zoom */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
            
            {/* Quick Concept Filter */}
            <div className="relative min-w-[160px] sm:min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-[#85877E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter concept nodes..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[#FAF9F5] dark:bg-[#151622] border border-[#D8D8CF] dark:border-[#262738] text-xs font-medium text-[#11120F] dark:text-white placeholder-[#85877E] focus:outline-none focus:border-[#596B35] dark:focus:border-[#7AA2F7]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#85877E] hover:text-[#11120F] dark:hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Layout Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-[#FAF9F5] dark:bg-[#151622] border border-[#D8D8CF] dark:border-[#262738] shadow-2xs">
              <button
                onClick={() => {
                  setViewLayout('radial');
                  soundManager.playClick();
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewLayout === 'radial'
                    ? 'bg-[#11120F] dark:bg-white text-white dark:text-black shadow-xs font-black'
                    : 'text-[#65675F] dark:text-[#94A3B8] hover:text-[#11120F] dark:hover:text-white'
                }`}
              >
                <Orbit className="w-3.5 h-3.5" />
                <span>Constellation Web</span>
              </button>
              <button
                onClick={() => {
                  setViewLayout('tree');
                  soundManager.playClick();
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewLayout === 'tree'
                    ? 'bg-[#11120F] dark:bg-white text-white dark:text-black shadow-xs font-black'
                    : 'text-[#65675F] dark:text-[#94A3B8] hover:text-[#11120F] dark:hover:text-white'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Hierarchy Tree</span>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FAF9F5] dark:bg-[#151622] border border-[#D8D8CF] dark:border-[#262738] shadow-2xs">
              <button
                onClick={() => handleZoom(-0.15)}
                className="p-1 rounded-lg text-[#65675F] dark:text-[#94A3B8] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold px-1.5 text-[#11120F] dark:text-[#F5F5F7] tabular-nums">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => handleZoom(0.15)}
                className="p-1 rounded-lg text-[#65675F] dark:text-[#94A3B8] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1 rounded-lg text-[#65675F] dark:text-[#94A3B8] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. SUBJECT FILTER PILLS & HUD QUICK LEGEND */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-3 border-t border-[#EEEEE8] dark:border-[#262738]">
          
          {/* Subject Pills (Scrollable) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 w-full md:w-auto">
            <button
              onClick={() => {
                setSelectedSubjectId('all');
                soundManager.playClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 active:scale-95 ${
                selectedSubjectId === 'all'
                  ? 'bg-[#11120F] dark:bg-white text-white dark:text-black border-transparent shadow-xs font-black'
                  : 'bg-[#FAF9F5] dark:bg-[#151622] text-[#65675F] dark:text-[#A1A1B2] border-[#D8D8CF] dark:border-[#262738] hover:border-[#596B35] dark:hover:border-[#7AA2F7]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Subjects</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono tabular-nums ${
                selectedSubjectId === 'all' ? 'bg-white/20 dark:bg-black/20' : 'bg-[#EEEEE8] dark:bg-[#1E1F2E] text-[#85877E]'
              }`}>
                {totalTopicNodes}
              </span>
            </button>

            {currentExam.subjects.map(s => {
              const isSel = selectedSubjectId === s.id;
              const meta = getSubjectMeta(s.name, s.color);
              const SubjIcon = meta.icon;
              const sTotalTopics = s.chapters.reduce((acc, c) => acc + c.topics.length, 0);

              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSubjectId(s.id);
                    soundManager.playClick();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer shrink-0 active:scale-95 ${
                    isSel
                      ? 'bg-[#11120F] dark:bg-white text-white dark:text-black border-transparent shadow-xs font-black'
                      : 'bg-[#FAF9F5] dark:bg-[#151622] text-[#65675F] dark:text-[#A1A1B2] border-[#D8D8CF] dark:border-[#262738] hover:border-[#596B35] dark:hover:border-[#7AA2F7]'
                  }`}
                >
                  <SubjIcon className="w-3.5 h-3.5" style={{ color: isSel ? undefined : meta.color }} />
                  <span>{s.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono tabular-nums ${
                    isSel ? 'bg-white/20 dark:bg-black/20' : 'bg-[#EEEEE8] dark:bg-[#1E1F2E] text-[#85877E]'
                  }`}>
                    {sTotalTopics}
                  </span>
                </button>
              );
            })}
          </div>

          {/* HUD Status Legend (Zero raw emojis) */}
          <div className="flex items-center gap-2 text-[11px] font-mono font-bold shrink-0 flex-wrap">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
              <span>Mastered ({masteredNodesCount})</span>
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
              <Zap className="w-3 h-3 fill-current" />
              <span>In Progress ({inProgressNodesCount})</span>
            </span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
              <AlertTriangle className="w-3 h-3" />
              <span>Weak ({weakNodesCount})</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONSTELLATION CANVAS CONTAINER */}
      <div className="relative w-full min-h-[580px] sm:min-h-[680px] rounded-3xl bg-gradient-to-b from-[#080B14] via-[#0D1120] to-[#080B14] border border-[#1E2640] shadow-2xl overflow-hidden flex flex-col items-center justify-start p-4 sm:p-6 select-none">
        
        {/* Futuristic Cosmic Grid & Ambient Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(#253352_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] bg-gradient-to-tr from-cyan-500/10 via-purple-600/10 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hovered Node Floating HUD Card */}
        {hoveredNode && (
          <div className="absolute top-4 left-4 z-40 p-4 rounded-2xl bg-[#0F1426]/95 border border-cyan-500/50 shadow-[0_10px_35px_rgba(0,0,0,0.7)] backdrop-blur-xl max-w-xs animate-fade-in pointer-events-none space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              <span>{hoveredNode.subjectName}</span>
              <span>·</span>
              <span className="truncate max-w-[120px]">{hoveredNode.chapterName}</span>
            </div>

            <h4 className="text-sm font-black text-white leading-snug">
              {hoveredNode.topic.name}
            </h4>

            <div className="flex items-center gap-1.5 text-[10px] font-mono flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200 font-bold uppercase">
                {hoveredNode.topic.difficulty || 'Medium'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-bold">
                {hoveredNode.topic.weightage || 0}m Weight
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                {hoveredNode.topic.accuracy || 0}% Acc
              </span>
            </div>

            <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Status: <strong className="text-white uppercase">{hoveredNode.topic.status.replace('_', ' ')}</strong></span>
              <span className="text-cyan-400">Click to study ↗</span>
            </div>
          </div>
        )}

        {/* ZOOMABLE GRAPH CONTENT WRAPPER */}
        <div
          className="relative z-10 w-full flex flex-col items-center justify-start transition-transform duration-300 origin-top py-4"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {viewLayout === 'radial' ? (
            /* CONSTELLATION WEB MODE */
            <div className="relative w-full max-w-4xl flex flex-col items-center">
              
              {/* 1. CENTRAL TARGET CORE PLANETARY ORB */}
              <div className="relative z-20 flex flex-col items-center">
                
                {/* Outer Rotating Constellation Ring */}
                <div className="w-36 sm:w-44 h-36 sm:h-44 rounded-full border border-dashed border-cyan-500/40 p-2 flex items-center justify-center relative animate-spin-slow">
                  {/* Orbiting Satellite Light */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff]" />
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_10px_#ff007f]" />
                </div>

                {/* Inner Glowing Core Container */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 sm:w-36 h-28 sm:h-36 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-pink-500 p-[2px] shadow-[0_0_45px_rgba(6,182,212,0.45)]">
                  <div className="w-full h-full rounded-full bg-[#070A18] flex flex-col items-center justify-center text-center p-2.5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-radial from-cyan-500/15 via-transparent to-transparent pointer-events-none" />
                    
                    <span className="text-[9px] sm:text-[10px] font-black text-cyan-400 uppercase tracking-widest font-mono flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      TARGET CORE
                    </span>

                    <h3 className="text-xs sm:text-[14px] font-black text-white leading-tight mt-1 uppercase tracking-tight line-clamp-1">
                      {currentExam.name}
                    </h3>

                    <div className="mt-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono font-bold text-cyan-300">
                      {masteredNodesCount}/{totalTopicNodes} ({overallPercent}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic SVG Energy Connector Beams */}
              <div className="w-full h-12 sm:h-16 relative flex items-center justify-center pointer-events-none">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="beamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  <line
                    x1="50%"
                    y1="0"
                    x2="50%"
                    y2="100%"
                    stroke="url(#beamGradient)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                </svg>
              </div>

              {/* 2. SUBJECT CONSTELLATION MODULES GRID */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mt-2">
                {activeSubjects.map(subj => {
                  const meta = getSubjectMeta(subj.name, subj.color);
                  const SubjIcon = meta.icon;
                  const totalInSubj = subj.chapters.reduce((acc, c) => acc + c.topics.length, 0);
                  const completedInSubj = subj.chapters.reduce((acc, c) => acc + c.topics.filter(t => t.status === 'completed').length, 0);
                  const subjPercent = totalInSubj > 0 ? Math.round((completedInSubj / totalInSubj) * 100) : 0;

                  return (
                    <div
                      key={subj.id}
                      className="group relative p-4 sm:p-5 rounded-3xl bg-[#0F1426]/90 hover:bg-[#131930] border border-[#212C4A] hover:border-cyan-500/50 shadow-xl backdrop-blur-xl transition-all duration-300 overflow-hidden space-y-3.5"
                    >
                      {/* Ambient Glowing Top Border */}
                      <div
                        className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)`
                        }}
                      />

                      {/* Subject Module Header */}
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
                        <div className="flex items-center gap-3 min-w-0">
                          
                          {/* 3D Squircle Icon Badge */}
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.gradient} border ${meta.border} ${meta.text} flex items-center justify-center shadow-md shrink-0`}
                          >
                            <SubjIcon className="w-5 h-5 stroke-[2.2]" />
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-sm sm:text-base font-black text-white tracking-tight uppercase truncate group-hover:text-cyan-300 transition-colors">
                              {subj.name}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400">
                              {subj.chapters.length} {subj.chapters.length === 1 ? 'Chapter' : 'Chapters'} · {totalInSubj} Concepts
                            </span>
                          </div>
                        </div>

                        {/* Subject Progress Pill */}
                        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 text-xs font-mono font-bold text-slate-300">
                          <span className={subjPercent === 100 ? 'text-emerald-400' : 'text-cyan-300'}>
                            {subjPercent}%
                          </span>
                        </div>
                      </div>

                      {/* Chapters & Neural Concept Nodes */}
                      <div className="space-y-3">
                        {subj.chapters.map(chap => {
                          const matchingTopics = searchQuery
                            ? chap.topics.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            : chap.topics;

                          if (searchQuery && matchingTopics.length === 0) return null;

                          return (
                            <div key={chap.id} className="space-y-2">
                              
                              {/* Chapter Branch Tag */}
                              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                                <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span className="truncate">{chap.name}</span>
                                <span className="text-slate-600 text-[10px]">({matchingTopics.length})</span>
                              </div>

                              {/* Interactive Concept Node Chips */}
                              <div className="flex flex-wrap gap-1.5 pl-3 sm:pl-4">
                                {matchingTopics.map(top => {
                                  const node = getNodeDetails(top.status, top.isWeak);
                                  const NodeIcon = node.icon;
                                  const isQueryMatch = searchQuery && top.name.toLowerCase().includes(searchQuery.toLowerCase());

                                  return (
                                    <button
                                      key={top.id}
                                      onClick={() => {
                                        soundManager.playClick();
                                        onOpenTopicDrawer(top, subj.name, chap.name);
                                      }}
                                      onMouseEnter={() => setHoveredNode({ topic: top, subjectName: subj.name, chapterName: chap.name })}
                                      onMouseLeave={() => setHoveredNode(null)}
                                      className={`group/chip flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer active:scale-95 border ${node.badgeClass} ${
                                        isQueryMatch
                                          ? 'ring-2 ring-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)] bg-cyan-950/80 text-white'
                                          : 'hover:bg-white/10 hover:text-white'
                                      }`}
                                    >
                                      <NodeIcon className="w-3 h-3 shrink-0 stroke-[2.2]" style={{ color: node.color }} />
                                      <span className="truncate max-w-[130px] sm:max-w-[160px]">{top.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* HIERARCHY TREE VIEW */
            <div className="w-full max-w-4xl space-y-4">
              {activeSubjects.map(subj => {
                const meta = getSubjectMeta(subj.name, subj.color);
                const SubjIcon = meta.icon;
                const totalInSubj = subj.chapters.reduce((acc, c) => acc + c.topics.length, 0);
                const completedInSubj = subj.chapters.reduce((acc, c) => acc + c.topics.filter(t => t.status === 'completed').length, 0);
                const subjPercent = totalInSubj > 0 ? Math.round((completedInSubj / totalInSubj) * 100) : 0;

                return (
                  <div
                    key={subj.id}
                    className="p-5 rounded-3xl bg-[#0F1426]/90 border border-[#212C4A] shadow-xl space-y-3.5 backdrop-blur-md relative overflow-hidden"
                  >
                    {/* Top Accent line */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{ background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }}
                    />

                    {/* Subject Header */}
                    <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.gradient} border ${meta.border} ${meta.text} flex items-center justify-center shrink-0`}>
                          <SubjIcon className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-white tracking-tight uppercase">
                            {subj.name}
                          </h3>
                          <span className="text-[10px] font-mono text-slate-400">
                            {subj.chapters.length} Chapters · {totalInSubj} Topics
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 text-xs font-mono font-bold text-cyan-300">
                        <span>{completedInSubj}/{totalInSubj}</span>
                        <span className="text-slate-500">·</span>
                        <span>{subjPercent}%</span>
                      </div>
                    </div>

                    {/* Chapters Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-1 sm:pl-2">
                      {subj.chapters.map(chap => {
                        const matchingTopics = searchQuery
                          ? chap.topics.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          : chap.topics;

                        if (searchQuery && matchingTopics.length === 0) return null;

                        return (
                          <div
                            key={chap.id}
                            className="p-3.5 rounded-2xl bg-[#080B16]/80 border border-white/5 space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-slate-300 font-mono">
                              <span className="flex items-center gap-1 truncate uppercase">
                                <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                                {chap.name}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {matchingTopics.length}
                              </span>
                            </div>

                            <div className="space-y-1">
                              {matchingTopics.map(top => {
                                const node = getNodeDetails(top.status, top.isWeak);
                                const NodeIcon = node.icon;

                                return (
                                  <div
                                    key={top.id}
                                    onClick={() => {
                                      soundManager.playClick();
                                      onOpenTopicDrawer(top, subj.name, chap.name);
                                    }}
                                    className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-200 cursor-pointer transition-colors group"
                                  >
                                    <div className="flex items-center gap-2 truncate pr-2">
                                      <NodeIcon className="w-3.5 h-3.5 shrink-0" style={{ color: node.color }} />
                                      <span className="truncate group-hover:text-white">{top.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 shrink-0">
                                      <span className="px-1 rounded bg-black/40 text-slate-300">{top.weightage || 0}m</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

