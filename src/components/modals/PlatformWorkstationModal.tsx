import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ExternalLink,
  RotateCw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Split,
  Play,
  Pause,
  Save,
  Flame,
  AlertTriangle,
  Sparkles,
  Lock,
  Globe,
  Clock
} from 'lucide-react';
import { ExternalPlatform } from '../../types/syllabus';
import { useSyllabus } from '../../context/SyllabusContext';
import { useTimer } from '../../context/TimerContext';
import { soundManager } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';

interface PlatformWorkstationModalProps {
  platform: ExternalPlatform;
  isOpen: boolean;
  onClose: () => void;
}

export const PlatformWorkstationModal: React.FC<PlatformWorkstationModalProps> = ({
  platform,
  isOpen,
  onClose
}) => {
  const { allTopics, updateTopicNotes, updateTopicMetrics, addTopicMistake, recordPlatformAccess } = useSyllabus();
  const { showFloatingOverlay } = useTimer();

  const [isSplitView, setIsSplitView] = useState(true);
  const [copiedLogin, setCopiedLogin] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [hasIframeBlockedNotice, setHasIframeBlockedNotice] = useState(false);

  // Selected Topic for Notes & Progress
  const [selectedTopicId, setSelectedTopicId] = useState<string>(() => {
    if (platform.associatedSubjectId) {
      const match = allTopics.find(t => t.topic.name.toLowerCase().includes('mock') || t.subjectName.toLowerCase().includes('math'));
      return match?.topic.id || allTopics[0]?.topic.id || '';
    }
    return allTopics[0]?.topic.id || '';
  });

  // Local Notes State
  const activeTopicItem = allTopics.find(t => t.topic.id === selectedTopicId);
  const [sessionNotes, setSessionNotes] = useState(activeTopicItem?.topic.notes || '');
  const [notesSaveStatus, setNotesSaveStatus] = useState<'saved' | 'saving'>('saved');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Live Stopwatch
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);

  // Quick Mistake Logger popup
  const [showMistakeLogger, setShowMistakeLogger] = useState(false);
  const [mistakeDesc, setMistakeDesc] = useState('');
  const [mistakeType, setMistakeType] = useState<'calculation' | 'conceptual' | 'formula' | 'silly' | 'time_pressure'>('conceptual');
  const [mistakeApproach, setMistakeApproach] = useState('');
  const [mistakeLoggedSuccess, setMistakeLoggedSuccess] = useState(false);

  // Record access on mount
  useEffect(() => {
    if (isOpen && platform.id) {
      recordPlatformAccess(platform.id);
    }
  }, [isOpen, platform.id, recordPlatformAccess]);

  // Sync initial notes when selected topic changes
  useEffect(() => {
    if (activeTopicItem) {
      setSessionNotes(activeTopicItem.topic.notes || '');
    }
  }, [selectedTopicId]);

  // Stopwatch Interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerActive && isOpen) {
      interval = setInterval(() => {
        setStopwatchSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, isOpen]);

  // Debounced Notes Auto-Save
  const handleNotesChange = (val: string) => {
    setSessionNotes(val);
    setNotesSaveStatus('saving');
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (selectedTopicId) {
        updateTopicNotes(selectedTopicId, val);
      }
      setNotesSaveStatus('saved');
    }, 600);
  };

  // Log study time
  const handleLogStudyMinutes = (mins: number) => {
    if (selectedTopicId && updateTopicMetrics) {
      updateTopicMetrics(selectedTopicId, { addMinutes: mins });
    }
    soundManager.playCompleteChime();
    confetti({ particleCount: 20, spread: 45, origin: { y: 0.8 } });
  };

  const handleSaveStopwatchTime = () => {
    const mins = Math.max(1, Math.round(stopwatchSeconds / 60));
    handleLogStudyMinutes(mins);
    setStopwatchSeconds(0);
    setIsTimerActive(false);
  };

  const handleCopyLogin = () => {
    if (!platform.loginHint) return;
    navigator.clipboard.writeText(platform.loginHint);
    setCopiedLogin(true);
    soundManager.playClick();
    setTimeout(() => setCopiedLogin(false), 2000);
  };

  const handleDirectLaunchCompanion = () => {
    // Launch external platform window
    window.open(platform.url, '_blank', 'noopener,noreferrer');
    soundManager.playClick();
    // Also trigger floating overlay for distraction-free tracking
    if (showFloatingOverlay) {
      showFloatingOverlay();
    }
  };

  const handleSaveMistakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mistakeDesc.trim() || !selectedTopicId) return;

    addTopicMistake(selectedTopicId, {
      questionDescription: mistakeDesc.trim(),
      mistakeType,
      correctApproach: mistakeApproach.trim() || 'Review concept and re-solve accurately.',
      mockSource: platform.name
    });

    setMistakeDesc('');
    setMistakeApproach('');
    setMistakeLoggedSuccess(true);
    soundManager.playCompleteChime();
    setTimeout(() => {
      setMistakeLoggedSuccess(false);
      setShowMistakeLogger(false);
    }, 1500);
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/85 backdrop-blur-md flex flex-col animate-fade-in select-none">
      
      {/* Top Studio Action Bar */}
      <header className="h-14 px-4 bg-[#11120F] dark:bg-[#0B0B0D] border-b border-[#272730] flex items-center justify-between text-white shrink-0 z-20">
        
        {/* Left: Platform Branding & Status */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base border border-white/20 shrink-0"
            style={{ backgroundColor: platform.color || '#5A4FCF' }}
          >
            {platform.icon || '⚡'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-black font-serif truncate max-w-[180px] sm:max-w-xs text-white">
                {platform.name}
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase bg-[#23232A] text-[#A1A1AA] border border-[#333]">
                {platform.category === 'course' ? 'Course Batch' : 'Mock Test Series'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#85877E] truncate block max-w-[200px] sm:max-w-xs">
              {platform.url.replace(/^https?:\/\//, '')}
            </span>
          </div>
        </div>

        {/* Center: Live Session Stopwatch & Study Logger */}
        <div className="hidden md:flex items-center gap-2 bg-[#18181D] px-3 py-1.5 rounded-2xl border border-[#272730]">
          <Clock className="w-3.5 h-3.5 text-[#596B35] dark:text-[#7AA2F7]" />
          <span className="text-xs font-mono font-extrabold text-white">
            {formatTimer(stopwatchSeconds)}
          </span>
          <button
            type="button"
            onClick={() => setIsTimerActive(!isTimerActive)}
            className="p-1 rounded-lg text-[#A1A1AA] hover:text-white cursor-pointer"
            title={isTimerActive ? 'Pause Timer' : 'Resume Timer'}
          >
            {isTimerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
          {stopwatchSeconds >= 30 && (
            <button
              type="button"
              onClick={handleSaveStopwatchTime}
              className="ml-1 px-2 py-0.5 rounded-lg bg-[#596B35] hover:bg-[#4a5a2b] text-[11px] font-bold text-white transition-all cursor-pointer"
            >
              Log Time
            </button>
          )}
        </div>

        {/* Right: Controls & Launchers */}
        <div className="flex items-center gap-2">
          {/* Quick Copy Login ID */}
          {platform.loginHint && (
            <button
              type="button"
              onClick={handleCopyLogin}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#23232A] hover:bg-[#2E2E38] text-xs font-mono font-bold text-white transition-all cursor-pointer active:scale-95 border border-[#333]"
              title={`Copy: ${platform.loginHint}`}
            >
              {copiedLogin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#85877E]" />}
              <span className="hidden lg:inline text-[11px] truncate max-w-[120px]">{platform.loginHint}</span>
              <span className="lg:hidden text-[11px]">{copiedLogin ? 'Copied' : 'ID'}</span>
            </button>
          )}

          {/* Quick Mock Mistake Logger Action */}
          <button
            type="button"
            onClick={() => setShowMistakeLogger(!showMistakeLogger)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95"
            title="Log question error directly to Mistake Journal"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Log Mistake</span>
          </button>

          {/* View Mode Toggle (Split / Full) */}
          <button
            type="button"
            onClick={() => {
              setIsSplitView(!isSplitView);
              soundManager.playClick();
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#23232A] hover:bg-[#2E2E38] text-xs font-bold text-white border border-[#333] cursor-pointer"
            title={isSplitView ? 'Switch to Full Webview' : 'Switch to Dual Split View'}
          >
            {isSplitView ? <Maximize2 className="w-3.5 h-3.5" /> : <Split className="w-3.5 h-3.5" />}
            <span>{isSplitView ? 'Full' : 'Split'}</span>
          </button>

          {/* External Dedicated Companion Window Launch */}
          <button
            type="button"
            onClick={handleDirectLaunchCompanion}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#596B35] dark:bg-[#7AA2F7] hover:bg-[#47572a] dark:hover:bg-[#6090F5] text-white dark:text-[#0B0B0D] text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
            title="Launch in Dedicated Companion Window (Supports All Logins)"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Window</span>
          </button>

          {/* Close Studio */}
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 text-[#85877E] hover:text-white rounded-xl hover:bg-[#23232A] transition-colors cursor-pointer ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* LEFT PANE: Split Study Companion (Notes & Topic Linkage) */}
        {isSplitView && (
          <div className="w-full md:w-80 lg:w-96 bg-[#18181D] border-r border-[#272730] flex flex-col shrink-0 h-full overflow-hidden z-10">
            
            {/* Associated Topic Selector */}
            <div className="p-3.5 border-b border-[#272730] bg-[#12141A] space-y-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#85877E] block">
                Study Target & Topic Linking
              </span>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#1F2335] border border-[#292E42] text-xs font-semibold text-white focus:outline-none focus:border-[#7AA2F7]"
              >
                {allTopics.map(item => (
                  <option key={item.topic.id} value={item.topic.id}>
                    {item.subjectName}: {item.topic.name}
                  </option>
                ))}
              </select>

              {/* Quick 1-Tap Study Adders */}
              <div className="flex items-center gap-1.5 pt-1">
                {[15, 30, 45, 60].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleLogStudyMinutes(mins)}
                    className="flex-1 py-1.5 rounded-lg bg-[#23232A] hover:bg-[#596B35] dark:hover:bg-[#7AA2F7] hover:text-white dark:hover:text-black text-[11px] font-mono font-bold text-[#A1A1AA] transition-all cursor-pointer active:scale-95 text-center border border-[#333]"
                  >
                    +{mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Live Markdown Notes Editor */}
            <div className="p-3.5 flex-1 flex flex-col overflow-hidden space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white font-serif flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#7AA2F7]" />
                  Live Study Notes
                </span>
                <span className="text-[11px] font-mono text-[#85877E]">
                  {notesSaveStatus === 'saving' ? '💾 Auto-saving...' : '✓ Synced'}
                </span>
              </div>
              <textarea
                value={sessionNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Type your lecture notes, formulas, teacher tricks, or test solution notes here..."
                className="flex-1 w-full p-3 rounded-2xl bg-[#12141A] border border-[#272730] text-xs font-mono text-[#C0CAF5] focus:outline-none focus:border-[#7AA2F7] resize-none leading-relaxed custom-scrollbar placeholder-[#555]"
              />
            </div>

            {/* Platform Quick Hint Footer */}
            {platform.notes && (
              <div className="p-3 bg-[#12141A] border-t border-[#272730] text-[11px] text-[#A1A1AA] font-mono flex items-center gap-2">
                <span className="text-sm">📌</span>
                <span className="truncate">{platform.notes}</span>
              </div>
            )}
          </div>
        )}

        {/* RIGHT PANE: Platform Embedded Webview & Smart Companion Engine */}
        <div className="flex-1 flex flex-col bg-[#0B0B0D] overflow-hidden relative">
          
          {/* Webview Toolbar */}
          <div className="h-9 px-3 bg-[#18181D] border-b border-[#272730] flex items-center justify-between text-xs text-[#85877E]">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-[11px] font-mono font-bold text-white truncate max-w-[240px] sm:max-w-md">
                  {platform.url}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIframeLoaded(false);
                  setIframeKey(k => k + 1);
                }}
                className="p-1 hover:text-white rounded-md cursor-pointer transition-colors"
                title="Reload Page"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDirectLaunchCompanion}
                className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#7AA2F7] hover:underline cursor-pointer"
              >
                <span>Launch Popout</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Iframe Viewport with Fallback Smart Companion Card */}
          <div className="flex-1 relative w-full h-full bg-[#12141A] overflow-hidden">
            
            {/* Embedded Iframe */}
            <iframe
              key={iframeKey}
              src={platform.url}
              title={platform.name}
              className="w-full h-full border-0 relative z-10"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => setIframeLoaded(true)}
            />

            {/* Smart Companion Focus Card (Permanent Background / Fallback if Iframe is Blocked by X-Frame-Options) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0 bg-gradient-to-br from-[#12141A] via-[#18181D] to-[#0B0B0D]">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-xl mb-4 border border-white/20"
                style={{ backgroundColor: platform.color || '#5A4FCF' }}
              >
                {platform.icon || '⚡'}
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white font-serif mb-2">
                {platform.name} Study Workstation
              </h3>
              
              <p className="text-xs sm:text-sm text-[#85877E] max-w-md mb-6 leading-relaxed">
                Padhai aur mock tests ke liye niche diye gaye button se dedicated focused window open karein. Aapka timer aur live notes yahan background me real-time sync hote rahenge!
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDirectLaunchCompanion}
                  className="px-6 py-3 rounded-2xl bg-white text-black font-extrabold text-xs sm:text-sm shadow-xl hover:bg-[#DCE8B7] transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                  <span>Launch Dedicated Companion Window</span>
                </button>

                {platform.loginHint && (
                  <button
                    type="button"
                    onClick={handleCopyLogin}
                    className="px-4 py-3 rounded-2xl bg-[#23232A] hover:bg-[#2E2E38] text-white font-mono font-bold text-xs border border-[#333] transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                  >
                    {copiedLogin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#85877E]" />}
                    <span>Copy Login ID</span>
                  </button>
                )}
              </div>

              <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#18181D] border border-[#272730] text-[11px] font-mono text-[#85877E]">
                <Lock className="w-3.5 h-3.5 text-[#596B35]" />
                <span>Zero Distraction • Real-time Stopwatch • Mistake Auto-Logger</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Mock Mistake Logger Modal */}
      {showMistakeLogger && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#18181D] border border-[#272730] rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-[#272730] pb-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm font-black text-white font-serif">
                  Log Mock Test Mistake
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMistakeLogger(false)}
                className="p-1 text-[#85877E] hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {mistakeLoggedSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-center space-y-1">
                <Check className="w-8 h-8 text-emerald-400 mx-auto stroke-[3]" />
                <span className="text-xs font-bold text-emerald-300 block">Mistake Logged to Journal!</span>
              </div>
            ) : (
              <form onSubmit={handleSaveMistakeSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#A1A1AA]">
                    Target Topic:
                  </label>
                  <span className="text-xs font-mono font-bold text-white block bg-[#12141A] p-2 rounded-xl border border-[#272730]">
                    {activeTopicItem ? `${activeTopicItem.subjectName}: ${activeTopicItem.topic.name}` : 'General Topic'}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#A1A1AA]">
                    Question / Error Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={mistakeDesc}
                    onChange={(e) => setMistakeDesc(e.target.value)}
                    placeholder="What went wrong in the question? (e.g. Formula forgot, wrong calculation in step 3...)"
                    className="w-full p-2.5 rounded-xl bg-[#12141A] border border-[#272730] text-xs font-medium text-white focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#A1A1AA]">
                      Mistake Type
                    </label>
                    <select
                      value={mistakeType}
                      onChange={(e) => setMistakeType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-[#12141A] border border-[#272730] text-xs font-medium text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="conceptual">Conceptual 🧠</option>
                      <option value="calculation">Calculation 🧮</option>
                      <option value="formula">Formula 📐</option>
                      <option value="silly">Silly Error 🤦‍♂️</option>
                      <option value="time_pressure">Time Pressure ⏱️</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#A1A1AA]">
                      Mock Test Source
                    </label>
                    <input
                      type="text"
                      disabled
                      value={platform.name}
                      className="w-full px-3 py-2 rounded-xl bg-[#12141A] border border-[#272730] text-xs font-medium text-[#85877E]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#A1A1AA]">
                    Correct Approach / Solution Rule
                  </label>
                  <input
                    type="text"
                    value={mistakeApproach}
                    onChange={(e) => setMistakeApproach(e.target.value)}
                    placeholder="e.g. Always apply alternate angle theorem before calculating..."
                    className="w-full px-3 py-2 rounded-xl bg-[#12141A] border border-[#272730] text-xs font-medium text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMistakeLogger(false)}
                    className="px-4 py-2 rounded-xl bg-[#23232A] text-xs font-bold text-[#A1A1AA] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    Save to Mistake Journal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

