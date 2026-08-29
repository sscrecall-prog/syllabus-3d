import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Maximize2,
  Minimize2,
  ExternalLink,
  Save,
  Check,
  Columns,
  BookOpen,
  Sparkles,
  ChevronDown,
  Download,
  Copy,
  Plus,
  Zap,
  ShieldAlert,
  Edit3,
  Eye,
  CheckSquare,
  GripVertical,
  ChevronsLeftRight,
  RotateCcw,
  Image as ImageIcon
} from 'lucide-react';
import { TopicPdfAttachment } from '../../types/syllabus';
import { getPdfBlobUrl, openPdfInNewTab, downloadPdfFile } from '../../utils/pdfStorage';
import { soundManager } from '../../utils/soundEffects';

interface SplitScreenPdfStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicName: string;
  subjectName?: string;
  chapterName?: string;
  initialNotes: string;
  attachments: TopicPdfAttachment[];
  initialAttachmentId?: string;
  onSaveNotes: (newNotes: string) => void;
}

export const SplitScreenPdfStudyModal: React.FC<SplitScreenPdfStudyModalProps> = ({
  isOpen,
  onClose,
  topicName,
  subjectName,
  chapterName,
  initialNotes,
  attachments = [],
  initialAttachmentId,
  onSaveNotes
}) => {
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string>(
    initialAttachmentId || (attachments.length > 0 ? attachments[0].id : '')
  );
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  // Notes Editor State
  const [notesContent, setNotesContent] = useState(initialNotes || '');
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Free Draggable Split Ratio Percentage (15% to 85%)
  const [pdfWidthPercent, setPdfWidthPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('syllabus_split_study_width_percent');
      return saved ? Math.min(Math.max(Number(saved), 15), 85) : 50;
    } catch {
      return 50;
    }
  });

  const [isDragging, setIsDragging] = useState(false);
  
  // Mobile Active Tab: 'pdf' | 'notes'
  const [mobileTab, setMobileTab] = useState<'pdf' | 'notes'>('pdf');

  // Update initial selected attachment when modal opens or initialAttachmentId changes
  useEffect(() => {
    if (initialAttachmentId) {
      setSelectedAttachmentId(initialAttachmentId);
    } else if (attachments.length > 0 && !selectedAttachmentId) {
      setSelectedAttachmentId(attachments[0].id);
    }
  }, [initialAttachmentId, attachments]);

  useEffect(() => {
    setNotesContent(initialNotes || '');
  }, [initialNotes]);

  // Load PDF Blob URL for current selected attachment
  useEffect(() => {
    let isMounted = true;
    const loadPdf = async () => {
      const activeAttachment = attachments.find(a => a.id === selectedAttachmentId);
      if (!activeAttachment) {
        setPdfBlobUrl(null);
        return;
      }

      setIsLoadingPdf(true);
      if (activeAttachment.url) {
        setPdfBlobUrl(activeAttachment.url);
        setIsLoadingPdf(false);
      } else if (activeAttachment.storageKey) {
        const blobUrl = await getPdfBlobUrl(activeAttachment.storageKey);
        if (isMounted) {
          setPdfBlobUrl(blobUrl);
          setIsLoadingPdf(false);
        }
      } else {
        setIsLoadingPdf(false);
      }
    };

    if (isOpen && selectedAttachmentId) {
      loadPdf();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedAttachmentId, attachments]);

  // Global mousemove & mouseup listeners for smooth dragging resizer
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const windowWidth = window.innerWidth;
      if (windowWidth < 1024) return; // Only desktop side-by-side
      const newPercent = (e.clientX / windowWidth) * 100;
      const clampedPercent = Math.min(Math.max(newPercent, 15), 85);
      setPdfWidthPercent(Math.round(clampedPercent));
    };

    const handleTouchMove = (e: TouchEvent) => {
      const windowWidth = window.innerWidth;
      if (windowWidth < 1024 || !e.touches[0]) return;
      const newPercent = (e.touches[0].clientX / windowWidth) * 100;
      const clampedPercent = Math.min(Math.max(newPercent, 15), 85);
      setPdfWidthPercent(Math.round(clampedPercent));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      try {
        localStorage.setItem('syllabus_split_study_width_percent', String(pdfWidthPercent));
      } catch (err) {
        console.error(err);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, pdfWidthPercent]);

  if (!isOpen) return null;

  const currentAttachment = attachments.find(a => a.id === selectedAttachmentId) || attachments[0];

  const handleManualSave = () => {
    onSaveNotes(notesContent);
    soundManager.playCompleteChime();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleInsertSnippet = (snippet: string) => {
    soundManager.playClick();
    setNotesContent(prev => prev + '\n' + snippet);
  };

  const handleCopyNotes = () => {
    soundManager.playClick();
    navigator.clipboard.writeText(notesContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsertCitation = () => {
    if (!currentAttachment) return;
    soundManager.playClick();
    const citation = `\n> 📌 **Ref [${currentAttachment.name}]**: \n`;
    setNotesContent(prev => prev + citation);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          soundManager.playClick();

          const reader = new FileReader();
          reader.onload = (loadEvt) => {
            const base64 = loadEvt.target?.result as string;
            if (base64) {
              const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
              const markdownImage = `\n![Screenshot ${timeStr}](${base64})\n`;
              setNotesContent(prev => {
                const updated = prev + markdownImage;
                onSaveNotes(updated);
                return updated;
              });
              soundManager.playCompleteChime();
            }
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    }
  };

  const setPresetRatio = (percent: number) => {
    soundManager.playClick();
    setPdfWidthPercent(percent);
    try {
      localStorage.setItem('syllabus_split_study_width_percent', String(percent));
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B0B0D] text-[#F5F5F7] animate-fade-in select-none">
      
      {/* Invisible overlay during dragging to prevent iframe from capturing mouse pointer */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none" />
      )}

      {/* 1. TOP HEADER TOOLBAR */}
      <div className="px-3 sm:px-6 py-2.5 bg-[#18181D] border-b border-[#272730] flex items-center justify-between gap-3 shrink-0">
        
        {/* Left: Topic & Breadcrumb info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 flex items-center justify-center shrink-0">
            <Columns className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#A1A1AA] truncate">
              <span>{subjectName || 'Subject'}</span>
              <span>•</span>
              <span className="truncate">{chapterName || 'Chapter'}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#8B5CF6]/20 text-[#C4B5FD] hidden xs:inline">
                Drag to Resize
              </span>
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-[#F5F5F7] truncate font-serif">
              {topicName}
            </h2>
          </div>
        </div>

        {/* Center: PDF Selector Dropdown if multiple attachments exist */}
        {attachments.length > 1 && (
          <div className="hidden md:flex items-center gap-2 bg-[#23232A] px-3 py-1.5 rounded-xl border border-[#272730]">
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <select
              value={selectedAttachmentId}
              onChange={e => {
                soundManager.playClick();
                setSelectedAttachmentId(e.target.value);
              }}
              className="bg-transparent text-xs font-semibold text-[#F5F5F7] focus:outline-none cursor-pointer max-w-xs truncate"
            >
              {attachments.map(att => (
                <option key={att.id} value={att.id} className="bg-[#18181D] text-white">
                  {att.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Right: Quick Adjust Presets & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Quick Split Ratio Presets (Desktop) */}
          <div className="hidden lg:flex items-center gap-1 bg-[#23232A] p-1 rounded-xl border border-[#272730]">
            <span className="text-[10px] font-mono font-bold text-[#C4B5FD] px-2">
              {pdfWidthPercent}% PDF : {100 - pdfWidthPercent}% Notes
            </span>
            <button
              onClick={() => setPresetRatio(50)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                pdfWidthPercent === 50
                  ? 'bg-[#8B5CF6] text-white shadow-sm font-bold'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
              title="50% PDF - 50% Notes (Balanced)"
            >
              50:50
            </button>
            <button
              onClick={() => setPresetRatio(65)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                pdfWidthPercent === 65
                  ? 'bg-[#8B5CF6] text-white shadow-sm font-bold'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
              title="65% PDF - 35% Notes (Reading Focus)"
            >
              PDF Focus
            </button>
            <button
              onClick={() => setPresetRatio(35)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                pdfWidthPercent === 35
                  ? 'bg-[#8B5CF6] text-white shadow-sm font-bold'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
              title="35% PDF - 65% Notes (Writing Focus)"
            >
              Notes Focus
            </button>
          </div>

          {/* Open in Chrome Tab Button */}
          {pdfBlobUrl && (
            <button
              onClick={() => openPdfInNewTab(pdfBlobUrl, currentAttachment?.name)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#23232A] hover:bg-[#2E2E38] text-[#F5F5F7] border border-[#272730] text-xs font-semibold transition-all cursor-pointer"
              title="Open PDF in Chrome New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>New Tab</span>
            </button>
          )}

          {/* Save Notes Button */}
          <button
            onClick={handleManualSave}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Saved!' : 'Save Notes'}</span>
          </button>

          {/* Close Modal Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-[#23232A] hover:bg-rose-500/20 text-[#A1A1AA] hover:text-rose-400 border border-[#272730] transition-colors cursor-pointer"
            title="Exit Split Study Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. MOBILE TAB SWITCHER (For Small Screens) */}
      <div className="lg:hidden flex items-center bg-[#18181D] border-b border-[#272730] px-3 py-1.5 gap-2">
        <button
          onClick={() => setMobileTab('pdf')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            mobileTab === 'pdf'
              ? 'bg-[#8B5CF6] text-white shadow-sm'
              : 'bg-[#23232A] text-[#A1A1AA]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>📑 PDF Viewer</span>
        </button>
        <button
          onClick={() => setMobileTab('notes')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            mobileTab === 'notes'
              ? 'bg-[#8B5CF6] text-white shadow-sm'
              : 'bg-[#23232A] text-[#A1A1AA]'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>📝 Notes & Formulas</span>
        </button>
      </div>

      {/* 3. MAIN SPLIT BODY CONTAINER WITH DRAGGABLE RESIZER */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        
        {/* LEFT PANEL: IN-APP PDF READER */}
        <div
          style={{ width: `${pdfWidthPercent}%` }}
          className={`h-full flex flex-col bg-[#121216] min-h-0 transition-[width] ${
            isDragging ? 'transition-none' : 'duration-150'
          } ${mobileTab === 'pdf' ? 'w-full flex' : 'hidden lg:flex'}`}
        >
          {/* PDF Subheader Bar */}
          <div className="px-4 py-2 bg-[#18181D]/90 border-b border-[#272730] flex items-center justify-between text-xs text-[#A1A1AA] shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="font-semibold text-white truncate max-w-xs">
                {currentAttachment?.name || 'Document'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInsertCitation}
                className="px-2.5 py-1 rounded-lg bg-[#23232A] hover:bg-[#8B5CF6]/20 text-[#C4B5FD] hover:text-white border border-[#272730] text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                title="Insert reference citation to your notes"
              >
                <span>+ Ref Citation</span>
              </button>

              {pdfBlobUrl && (
                <button
                  onClick={() => downloadPdfFile(pdfBlobUrl, currentAttachment?.name || 'notes.pdf')}
                  className="p-1 rounded-lg hover:bg-[#23232A] text-[#A1A1AA] hover:text-white cursor-pointer"
                  title="Download PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* PDF Viewer Canvas */}
          <div className="flex-1 relative bg-[#0B0B0D] min-h-0">
            {isLoadingPdf ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-[#A1A1AA] font-medium">Loading In-App PDF Document...</p>
              </div>
            ) : pdfBlobUrl ? (
              <iframe
                src={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
                title={currentAttachment?.name || 'PDF Viewer'}
                className={`w-full h-full border-0 bg-[#222] ${isDragging ? 'pointer-events-none' : ''}`}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 text-[#A1A1AA]">
                <FileText className="w-12 h-12 stroke-[1.5] text-[#71717A]" />
                <p className="text-xs font-semibold text-white">No PDF file selected or available.</p>
                <p className="text-[11px] text-[#71717A] max-w-xs">
                  Attach or upload a PDF document to view and study it side-by-side with your notes.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 🎛️ INTERACTIVE DRAGGABLE RESIZER DIVIDER (DESKTOP) */}
        <div
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          className={`hidden lg:flex items-center justify-center relative w-3.5 hover:w-4 -mx-1.5 z-30 cursor-col-resize group transition-all shrink-0 ${
            isDragging ? 'bg-[#8B5CF6]' : 'bg-transparent'
          }`}
          title="Drag left/right to resize PDF vs Notes area"
        >
          {/* Vertical line indicator */}
          <div
            className={`w-1 h-full transition-colors ${
              isDragging
                ? 'bg-[#8B5CF6]'
                : 'bg-[#272730] group-hover:bg-[#8B5CF6] group-hover:shadow-[0_0_10px_rgba(139,92,246,0.8)]'
            }`}
          />

          {/* Central Handle Grip Badge */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-6 h-12 rounded-xl flex items-center justify-center shadow-lg border transition-all ${
              isDragging
                ? 'bg-[#8B5CF6] border-white text-white scale-110 shadow-[#8B5CF6]/50'
                : 'bg-[#18181D] border-[#383842] group-hover:border-[#8B5CF6] text-[#A1A1AA] group-hover:text-white group-hover:scale-105'
            }`}
          >
            <ChevronsLeftRight className="w-3.5 h-3.5" />
          </div>

          {/* Floating Live Percentage Tooltip during Hover/Drag */}
          <div
            className={`absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-[#18181D] border border-[#8B5CF6] shadow-xl text-[10px] font-mono font-bold text-white whitespace-nowrap pointer-events-none transition-opacity ${
              isDragging ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {pdfWidthPercent}% PDF ⟷ {100 - pdfWidthPercent}% Notes
          </div>
        </div>

        {/* RIGHT PANEL: LIVE NOTES & FORMULAS WORKSPACE */}
        <div
          style={{ width: `${100 - pdfWidthPercent}%` }}
          className={`h-full flex flex-col bg-[#18181D] min-h-0 border-l border-[#272730] transition-[width] ${
            isDragging ? 'transition-none' : 'duration-150'
          } ${mobileTab === 'notes' ? 'w-full flex' : 'hidden lg:flex'}`}
        >
          {/* Notes Subheader & Quick Tools */}
          <div className="p-3 bg-[#1C1C22] border-b border-[#272730] space-y-2 shrink-0">
            
            {/* Quick Actions Row */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleInsertSnippet('> [!FORMULA]\n> **Formula Name**: `Write equation here`\n> - Concept: \n')}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <span>Σ Formula</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertSnippet('> [!SHORTCUT]\n> **Fast Trick**: \n')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Zap className="w-3 h-3" />
                  <span>Shortcut</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertSnippet('> [!WARNING]\n> **Examiner Trap / Silly Mistake**: \n')}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>Trap</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertSnippet('- [ ] Review key concepts from PDF\n- [ ] Memorize formulas\n- [ ] Practice 10 PYQs\n')}
                  className="px-2.5 py-1 rounded-lg bg-[#23232A] hover:bg-[#2E2E38] text-[#A1A1AA] hover:text-white border border-[#272730] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>Checklist</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleCopyNotes}
                  className="p-1.5 rounded-lg bg-[#23232A] hover:bg-[#2E2E38] text-[#A1A1AA] hover:text-white cursor-pointer"
                  title="Copy All Notes"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Notes Live Textarea */}
          <div className="flex-1 p-4 relative flex flex-col min-h-0 bg-[#141418]">
            <textarea
              value={notesContent}
              onChange={e => {
                setNotesContent(e.target.value);
                // Trigger auto-save debounce
                onSaveNotes(e.target.value);
              }}
              onPaste={handlePaste}
              placeholder="Type your study notes, formulas, shortcuts, and key points while reading the PDF on the left side...\n\n📸 Tip: Press Ctrl + V to paste any screenshot directly!"
              className="w-full flex-1 p-3.5 rounded-xl bg-[#18181D] border border-[#272730] text-xs sm:text-sm font-medium text-[#F5F5F7] placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6] resize-none leading-relaxed font-sans"
            />

            {/* Bottom Status Bar */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-[#A1A1AA]">
              <span>
                {notesContent.trim() ? notesContent.trim().split(/\s+/).length : 0} words • {notesContent.length} chars
              </span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Auto-saved in real-time</span>
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
