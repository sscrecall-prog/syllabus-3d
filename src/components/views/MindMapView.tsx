import React, { useState, useMemo, useRef } from 'react';
import { useSyllabus } from '../../context/SyllabusContext';
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  BookOpen,
  ChevronRight
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

  const weakNodesCount = useMemo(() => {
    let count = 0;
    currentExam.subjects.forEach(s => s.chapters.forEach(ch => {
      count += ch.topics.filter(t => t.status === 'weak' || t.isWeak).length;
    }));
    return count;
  }, [currentExam]);

  const getNodeColor = (status: Topic['status'], isWeak: boolean) => {
    if (status === 'completed') return '#10b981'; // emerald
    if (status === 'in_progress') return '#3b82f6'; // blue
    if (status === 'revision_due') return '#f59e0b'; // amber
    if (status === 'weak' || isWeak) return '#f43f5e'; // rose
    return '#64748b'; // slate
  };

  const handleZoom = (delta: number) => {
    soundManager.playClick();
    setZoomLevel(prev => Math.max(0.6, Math.min(1.8, prev + delta)));
  };

  const handleResetZoom = () => {
    soundManager.playClick();
    setZoomLevel(1);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Network className="w-6 h-6 text-cyan-400" />
            <span>Interactive Concept Mind Map</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visual concept constellation showing subject hierarchies and live mastery status.
          </p>
        </div>

        {/* View Layout & Zoom Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layout Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setViewLayout('radial');
                soundManager.playClick();
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                viewLayout === 'radial' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Constellation Web
            </button>
            <button
              onClick={() => {
                setViewLayout('tree');
                soundManager.playClick();
              }}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                viewLayout === 'tree' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Hierarchy Tree
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => handleZoom(-0.15)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-1 text-slate-600 dark:text-slate-400">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.15)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Subject Filter Bar & HUD Badges */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          <button
            onClick={() => {
              setSelectedSubjectId('all');
              soundManager.playClick();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedSubjectId === 'all'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All Subjects ({totalTopicNodes})
          </button>

          {currentExam.subjects.map(s => {
            const isSel = selectedSubjectId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedSubjectId(s.id);
                  soundManager.playClick();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                  isSel
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-400 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-transparent'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span>{s.name}</span>
              </button>
            );
          })}
        </div>

        {/* HUD Quick Legend */}
        <div className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-500 shrink-0">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Done ({masteredNodesCount})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Weak ({weakNodesCount})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Revise
          </span>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full min-h-[560px] sm:min-h-[640px] rounded-3xl bg-[#040715] border border-slate-800 shadow-2xl overflow-hidden flex flex-col items-center justify-center p-4">
        {/* Background Cosmic Grid & Ambient Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-gradient-to-tr from-cyan-500/10 via-purple-600/10 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hovered Topic Tooltip Card (Floating) */}
        {hoveredNode && (
          <div className="absolute top-4 left-4 z-30 p-3.5 rounded-2xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl max-w-xs animate-fade-in pointer-events-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              {hoveredNode.subjectName} Â· {hoveredNode.chapterName}
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-white mt-0.5 mb-1">
              {hoveredNode.topic.name}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 font-bold">
                {hoveredNode.topic.difficulty}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 font-bold">
                {hoveredNode.topic.weightage} Marks
              </span>
              <span className="text-emerald-400 font-bold">
                {hoveredNode.topic.accuracy}% Accuracy
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Click node to open detail drawer â†—</p>
          </div>
        )}

        {/* ZOOMABLE GRAPH CONTAINER */}
        <div
          className="relative z-10 w-full h-full flex items-center justify-center transition-transform duration-300 origin-center py-8"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {viewLayout === 'radial' ? (
            /* CONSTELLATION WEB MODE */
            <div className="relative w-full max-w-3xl flex flex-col items-center justify-center">
              {/* Central Core Exam Node */}
              <div className="relative z-20 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-cyan-500 via-purple-600 to-pink-500 p-1 shadow-[0_0_40px_rgba(0,210,255,0.4)] flex items-center justify-center animate-pulse">
                <div className="w-full h-full rounded-full bg-[#05091e] flex flex-col items-center justify-center text-center p-2">
                  <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider">
                    TARGET CORE
                  </span>
                  <h3 className="text-sm sm:text-[15px] font-black text-white leading-tight mt-1">
                    {currentExam.name}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-bold mt-1">
                    {masteredNodesCount}/{totalTopicNodes} Done
                  </span>
                </div>
              </div>

              {/* Subject Clusters Around Core */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-10 mt-8 sm:mt-12">
                {activeSubjects.map(subj => (
                  <div
                    key={subj.id}
                    className="p-4 sm:p-5 rounded-3xl bg-slate-900/85 border border-slate-800 shadow-xl backdrop-blur-md relative"
                    style={{ borderColor: `${subj.color}40` }}
                  >
                    {/* Subject Header Capsule */}
                    <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: subj.color }}
                        />
                        <h4 className="text-sm sm:text-[15px] font-bold text-white">
                          {subj.name}
                        </h4>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {subj.chapters.reduce((acc, c) => acc + c.topics.length, 0)} Concepts
                      </span>
                    </div>

                    {/* Chapters & Topic Constellation Nodes */}
                    <div className="space-y-3">
                      {subj.chapters.map(chap => (
                        <div key={chap.id} className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <ChevronRight className="w-3 h-3 text-slate-600" />
                            <span>{chap.name}</span>
                          </span>

                          <div className="flex flex-wrap gap-1.5 pl-3">
                            {chap.topics.map(top => {
                              const nodeColor = getNodeColor(top.status, top.isWeak);
                              return (
                                <button
                                  key={top.id}
                                  onClick={() => {
                                    soundManager.playClick();
                                    onOpenTopicDrawer(top, subj.name, chap.name);
                                  }}
                                  onMouseEnter={() => setHoveredNode({ topic: top, subjectName: subj.name, chapterName: chap.name })}
                                  onMouseLeave={() => setHoveredNode(null)}
                                  className="group flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border text-[11px] font-medium text-slate-200 hover:text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                                  style={{ borderColor: `${nodeColor}60` }}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                                    style={{ backgroundColor: nodeColor }}
                                  />
                                  <span className="truncate max-w-[120px] sm:max-w-[150px]">{top.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* HIERARCHY TREE VIEW */
            <div className="w-full max-w-4xl space-y-6">
              {activeSubjects.map(subj => (
                <div
                  key={subj.id}
                  className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl"
                  style={{ borderLeft: `4px solid ${subj.color}` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-[15px] sm:text-base font-bold text-white">{subj.name}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                    {subj.chapters.map(chap => (
                      <div
                        key={chap.id}
                        className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2"
                      >
                        <h4 className="text-sm sm:text-[15px] font-extrabold text-slate-300">
                          {chap.name}
                        </h4>
                        <div className="space-y-1">
                          {chap.topics.map(top => {
                            const nodeColor = getNodeColor(top.status, top.isWeak);
                            return (
                              <div
                                key={top.id}
                                onClick={() => {
                                  soundManager.playClick();
                                  onOpenTopicDrawer(top, subj.name, chap.name);
                                }}
                                className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 hover:bg-slate-800 text-xs text-slate-200 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-2 truncate pr-2">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: nodeColor }} />
                                  <span className="truncate">{top.name}</span>
                                </div>
                                <span className="text-[11px] font-bold text-slate-400">{top.weightage}m</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

