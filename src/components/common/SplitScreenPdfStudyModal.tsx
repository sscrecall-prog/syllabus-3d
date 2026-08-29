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
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { TopicPdfAttachment, TopicImageAttachment } from '../../types/syllabus';
import { getPdfBlobUrl, openPdfInNewTab, downloadPdfFile } from '../../utils/pdfStorage';
import { soundManager } from '../../utils/soundEffects';
import { PdfCanvasViewer } from './PdfCanvasViewer';

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
  images?: TopicImageAttachment[];
  onAddImage?: (image: { title?: string; dataUrl: string; fileSize?: number }) => void;
  onDeleteImage?: (imageId: string) => void;
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
  onSaveNotes,
  images = [],
  onAddImage,
  onDeleteImage
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
  const [zoomImage, setZoomImage] = useState<{ src: string; title: string } | null>(null);
  const [showImageNotice, setShowImageNotice] = useState(false);

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'pdf' | 'notes'>('pdf');

  // Auto clean legacy base64 strings from notesContent
  useEffect(() => {
    if (initialNotes && initialNotes.includes('data:image/')) {
      const regex = /!\[(.*?)\]\((data:image\/[^\)]+)\)/g;
      let match;
      while ((match = regex.exec(initialNotes)) !== null) {
        const title = match[1] || 'Screenshot';
        const dataUrl = match[2];
        if (onAddImage && (!images || !images.some(img => img.dataUrl === dataUrl))) {
          onAddImage({ title, dataUrl });
        }
      }
      const cleaned = initialNotes.replace(regex, '').trim();
      setNotesContent(cleaned);
      onSaveNotes(cleaned);
    } else {
      setNotesContent(initialNotes || '');
    }
  }, [initialNotes]);

  // Load PDF Blob on select
  useEffect(() => {
    let isMounted = true;
    if (!isOpen) return;

    const loadPdf = async () => {
      const current = attachments.find(a => a.id === selectedAttachmentId) || attachments[0];
      if (!current) {
        setPdfBlobUrl(null);
        return;
      }

      setIsLoadingPdf(true);
      try {
        const url = await getPdfBlobUrl(current.id);
        if (isMounted) {
          setPdfBlobUrl(url || current.url || null);
        }
      } catch (err) {
        console.error('Failed to load PDF in Split Study:', err);
        if (isMounted) {
          setPdfBlobUrl(current.url || null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPdf(false);
        }
      }
    };

    if (attachments.length > 0) {
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
              const title = file.name && file.name !== 'image.png' ? file.name : `Screenshot ${timeStr}`;
              if (onAddImage) {
                onAddImage({ title, dataUrl: base64, fileSize: file.size });
              }
              soundManager.playCompleteChime();
              setShowImageNotice(true);
              setTimeout(() => setShowImageNotice(false), 2500);
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
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#8B5CF6] shrink-0">
            <Columns className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8B5CF6]">
              <span>{subjectName || 'Subject'}</span>
              <span>•</span>
              <span className="truncate">{chapterName || 'Chapter'}</span>
            </div>
            <h3 className="text-xs sm:text-sm font-extrabold text-white truncate">
              {topicName} <span className="font-normal text-[#A1A1AA]">(Split-Screen Study Mode)</span>
            </h3>
          </div>
        </div>

        {/* Center: Split-Ratio Quick Presets */}
        <div className="hidden md:flex items-center gap-1 bg-[#23232A] p-1 rounded-xl border border-[#272730]">
          <span className="text-[10px] font-bold text-[#A1A1AA] px-2 font-mono uppercase">
            Ratio:
          </span>
          {[
            { label: '30:70', val: 30, desc: 'More Notes' },
            { label: '50:50', val: 50, desc: 'Balanced' },
            { label: '70:30', val: 70, desc: 'More PDF' }
          ].map(preset => (
            <button
              key={preset.val}
              type="button"
              onClick={() => setPresetRatio(preset.val)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                pdfWidthPercent === preset.val
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#2E2E38]'
              }`}
              title={preset.desc}
            >
              {preset.label}
            </button>
          ))}
          <div className="h-3 w-px bg-[#383842] mx-1" />
          <span className="text-[11px] font-mono text-[#8B5CF6] font-bold pr-2">
            {pdfWidthPercent}% / {100 - pdfWidthPercent}%
          </span>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Mobile Toggle Button */}
          <div className="flex lg:hidden bg-[#23232A] p-0.5 rounded-lg border border-[#272730]">
            <button
              onClick={() => setMobileTab('pdf')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                mobileTab === 'pdf' ? 'bg-[#8B5CF6] text-white' : 'text-[#A1A1AA]'
              }`}
            >
              PDF View
            </button>
            <button
              onClick={() => setMobileTab('notes')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                mobileTab === 'notes' ? 'bg-[#8B5CF6] text-white' : 'text-[#A1A1AA]'
              }`}
            >
              Notes View
            </button>
          </div>

          <button
            onClick={handleManualSave}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isSaved ? 'Saved!' : 'Save Notes'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#23232A] hover:bg-rose-500/20 text-[#A1A1AA] hover:text-rose-400 border border-[#272730] transition-colors cursor-pointer"
            title="Close Split-Screen Study"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. SPLIT RESIZABLE MAIN WORKSPACE */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        
        {/* LEFT PANEL: PDF VIEWER */}
        <div
          style={{ width: `${pdfWidthPercent}%` }}
          className={`h-full flex flex-col bg-[#111114] min-h-0 transition-[width] ${
            isDragging ? 'transition-none' : 'duration-150'
          } ${mobileTab === 'pdf' ? 'w-full flex' : 'hidden lg:flex'}`}
        >
          {/* PDF Controls & Attachment Selector Bar */}
          <div className="p-2.5 bg-[#18181D] border-b border-[#272730] flex items-center justify-between gap-2 shrink-0">
            {attachments.length > 1 ? (
              <div className="relative flex-1 max-w-sm">
                <select
                  value={selectedAttachmentId}
                  onChange={e => setSelectedAttachmentId(e.target.value)}
                  className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-[#23232A] border border-[#272730] text-xs font-semibold text-white focus:outline-none focus:border-[#8B5CF6] appearance-none cursor-pointer"
                >
                  {attachments.map(att => (
                    <option key={att.id} value={att.id}>
                      📑 {att.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#A1A1AA] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : currentAttachment ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white truncate">
                <FileText className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                <span className="truncate">{currentAttachment.name}</span>
              </div>
            ) : (
              <span className="text-xs text-[#A1A1AA] italic">No PDF document attached</span>
            )}

            <div className="flex items-center gap-1.5 shrink-0">
              {currentAttachment && (
                <>
                  <button
                    type="button"
                    onClick={handleInsertCitation}
                    className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-[#8B5CF6] text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Insert Citation Reference into Notes"
                  >
                    <span>+ Cite PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openPdfInNewTab(pdfBlobUrl || currentAttachment.url || '', currentAttachment.name)}
                    className="p-1.5 rounded-lg bg-[#23232A] hover:bg-[#2E2E38] text-[#A1A1AA] hover:text-white cursor-pointer"
                    title="Open in Full Chrome Tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* PDF Canvas Viewer Frame */}
          <div className="flex-1 relative min-h-0 bg-[#0F0F12] flex flex-col">
            {isLoadingPdf ? (
              <div className="m-auto flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#8B5CF6] border-t-transparent animate-spin" />
                <span className="text-xs text-[#A1A1AA] font-mono">Loading PDF Notes...</span>
              </div>
            ) : pdfBlobUrl ? (
              <PdfCanvasViewer pdfUrl={pdfBlobUrl} className="flex-1 min-h-0" />
            ) : (
              <div className="m-auto text-center p-6 space-y-2">
                <FileText className="w-10 h-10 text-[#383842] mx-auto" />
                <p className="text-xs text-[#A1A1AA]">No PDF is currently loaded for this topic.</p>
              </div>
            )}
          </div>
        </div>

        {/* DRAGGABLE RESIZER HANDLE SPLITTER BAR */}
        <div
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          className={`hidden lg:flex w-2.5 relative items-center justify-center bg-[#18181D] hover:bg-[#8B5CF6]/30 cursor-col-resize select-none z-30 group transition-colors ${
            isDragging ? 'bg-[#8B5CF6]/50 shadow-[0_0_15px_rgba(139,92,246,0.5)]' : ''
          }`}
          title="Drag left or right to adjust PDF / Notes workspace width"
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

          {/* Screenshot Toast */}
          {showImageNotice && (
            <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Screenshot attached successfully to topic images!</span>
            </div>
          )}

          {/* Attached Screenshots Strip */}
          {images && images.length > 0 && (
            <div className="p-2.5 bg-[#18181D] border-b border-[#272730] space-y-1.5 shrink-0">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#A1A1AA]">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3 h-3 text-[#8B5CF6]" />
                  Attached Screenshots ({images.length})
                </span>
                <span className="text-[10px] text-[#71717A]">Ctrl+V to paste more</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative group shrink-0 w-20 h-14 rounded-lg overflow-hidden border border-[#272730] bg-black/40"
                  >
                    <img
                      src={img.dataUrl}
                      alt={img.title}
                      onClick={() => setZoomImage({ src: img.dataUrl, title: img.title })}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => setZoomImage({ src: img.dataUrl, title: img.title })}
                        className="p-1 rounded bg-white/20 hover:bg-white/40 text-white cursor-pointer"
                        title="Zoom"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                      {onDeleteImage && (
                        <button
                          type="button"
                          onClick={() => onDeleteImage(img.id)}
                          className="p-1 rounded bg-rose-500/80 hover:bg-rose-600 text-white cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              placeholder={"Type your study notes, formulas, shortcuts, and key points while reading the PDF on the left side...\n\n📸 Tip: Press Ctrl + V to paste any screenshot directly!"}
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

      {/* High-Res Image Zoom Lightbox Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center cursor-default bg-[#18181D] p-3 rounded-2xl border border-[#272730] shadow-2xl"
          >
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-[#272730] text-white">
              <span className="text-xs font-bold truncate max-w-md">{zoomImage.title}</span>
              <div className="flex items-center gap-2">
                <a
                  href={zoomImage.src}
                  download={`${zoomImage.title || 'screenshot'}.png`}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Download Image"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setZoomImage(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/80 text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <img
              src={zoomImage.src}
              alt={zoomImage.title}
              className="max-w-full max-h-[75vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

    </div>
  );
};
