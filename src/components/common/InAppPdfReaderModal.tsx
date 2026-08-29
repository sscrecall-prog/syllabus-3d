import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  X,
  FileText,
  Download,
  Maximize2,
  Minimize2,
  ChevronDown,
  Columns,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { TopicPdfAttachment } from '../../types/syllabus';
import { getPdfBlobUrl } from '../../utils/pdfStorage';
import { soundManager } from '../../utils/soundEffects';
import { PdfCanvasViewer } from './PdfCanvasViewer';

interface InAppPdfReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicName: string;
  subjectName?: string;
  chapterName?: string;
  attachments: TopicPdfAttachment[];
  initialAttachmentId?: string;
  onOpenSplitStudy?: (attachmentId: string) => void;
}

export const InAppPdfReaderModal: React.FC<InAppPdfReaderModalProps> = ({
  isOpen,
  onClose,
  topicName,
  subjectName,
  chapterName,
  attachments = [],
  initialAttachmentId,
  onOpenSplitStudy
}) => {
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string>(
    initialAttachmentId || (attachments.length > 0 ? attachments[0].id : '')
  );
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  // Sync selected attachment when initialAttachmentId changes
  useEffect(() => {
    if (initialAttachmentId) {
      setSelectedAttachmentId(initialAttachmentId);
    } else if (attachments.length > 0 && !selectedAttachmentId) {
      setSelectedAttachmentId(attachments[0].id);
    }
  }, [initialAttachmentId, attachments]);

  // Load PDF Blob when selected attachment changes
  useEffect(() => {
    let isMounted = true;
    if (!isOpen) return;

    const current = attachments.find(a => a.id === selectedAttachmentId) || attachments[0];
    if (!current) {
      setPdfBlobUrl(null);
      return;
    }

    const loadPdfData = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        if (current.url) {
          if (isMounted) {
            setPdfBlobUrl(current.url);
          }
          return;
        }

        const id = current.storageKey || current.id;
        const blobUrl = await getPdfBlobUrl(id);

        if (isMounted) {
          if (blobUrl) {
            setPdfBlobUrl(blobUrl);
          } else {
            setLoadError('Unable to load PDF from storage. The file may need to be re-uploaded.');
          }
        }
      } catch (err) {
        console.error('Error loading PDF in in-app reader:', err);
        if (isMounted) {
          setLoadError('Failed to load PDF document.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPdfData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedAttachmentId, attachments]);

  // Keyboard shortcut listener (ESC to go back)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundManager.playClick();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fullscreen API toggle
  const toggleFullscreen = () => {
    soundManager.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (!isOpen) return null;

  const currentAttachment = attachments.find(a => a.id === selectedAttachmentId) || attachments[0];

  const handleDownload = () => {
    if (!currentAttachment) return;
    soundManager.playCompleteChime();
    const fileName = currentAttachment.name.endsWith('.pdf') ? currentAttachment.name : `${currentAttachment.name}.pdf`;

    if (pdfBlobUrl) {
      const a = document.createElement('a');
      a.href = pdfBlobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#111114] text-[#F5F5F7] animate-fade-in select-none overflow-hidden">
      
      {/* 1. SINGLE SLEEK COMPACT TOP HEADER BAR */}
      <div className="px-3 sm:px-5 py-2 bg-[#18181D]/95 backdrop-blur-md border-b border-[#272730] flex items-center justify-between gap-2 shrink-0 z-30 shadow-md">
        
        {/* Left: Back Arrow & Document Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#23232A] hover:bg-[#8B5CF6] text-white text-xs font-bold transition-all border border-[#272730] hover:border-[#8B5CF6] cursor-pointer shadow-sm active:scale-95 group shrink-0"
            title="Go back to Topic Notes (Esc)"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="min-w-0 flex items-center gap-2">
            {attachments.length > 1 ? (
              <div className="relative max-w-[200px] sm:max-w-xs">
                <select
                  value={selectedAttachmentId}
                  onChange={e => {
                    soundManager.playClick();
                    setSelectedAttachmentId(e.target.value);
                  }}
                  className="w-full pl-2.5 pr-7 py-1 rounded-xl bg-[#23232A] border border-[#272730] text-xs font-bold text-white focus:outline-none focus:border-[#8B5CF6] appearance-none cursor-pointer truncate"
                >
                  {attachments.map(att => (
                    <option key={att.id} value={att.id}>
                      📑 {att.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#A1A1AA] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <div className="truncate flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[160px] sm:max-w-sm">
                  {currentAttachment?.name || topicName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Live Page Tracker */}
        {totalPages > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#23232A] border border-[#272730] text-xs font-mono font-bold text-[#A1A1AA]">
            <span>Page</span>
            <span className="text-white">{currentPage}</span>
            <span>/</span>
            <span className="text-[#8B5CF6]">{totalPages}</span>
          </div>
        )}

        {/* Right Action Tools: Zoom, Split Study, Download & Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* Zoom Controls */}
          <div className="flex items-center bg-[#23232A] p-0.5 rounded-xl border border-[#272730]">
            <button
              type="button"
              onClick={() => setScale(s => Math.max(s - 0.2, 0.6))}
              className="p-1.5 rounded-lg hover:bg-[#2E2E38] text-[#A1A1AA] hover:text-white cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setScale(1.0)}
              className="px-2 py-0.5 text-[11px] font-mono font-bold text-[#8B5CF6] hover:bg-[#2E2E38] rounded-md cursor-pointer"
              title="Reset Zoom (100%)"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setScale(s => Math.min(s + 0.2, 2.5))}
              className="p-1.5 rounded-lg hover:bg-[#2E2E38] text-[#A1A1AA] hover:text-white cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Split Study Quick Switch */}
          {onOpenSplitStudy && (
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
                onOpenSplitStudy(selectedAttachmentId);
              }}
              title="Open Split-Screen to read this PDF and take notes side-by-side"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-[#8B5CF6] text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split Study</span>
            </button>
          )}

          {/* Download PDF Button */}
          {currentAttachment && (
            <button
              onClick={handleDownload}
              title={`Download ${currentAttachment.name}`}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Download</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-1.5 rounded-xl bg-[#23232A] hover:bg-[#2E2E38] text-[#A1A1AA] hover:text-white border border-[#272730] transition-colors cursor-pointer hidden sm:flex"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-[#23232A] hover:bg-rose-500/20 text-[#A1A1AA] hover:text-rose-400 border border-[#272730] transition-colors cursor-pointer"
            title="Close PDF View (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. PURE FULLSCREEN PDF CANVAS VIEWER (100% WIDTH EDGE-TO-EDGE) */}
      <div className="flex-1 relative min-h-0 bg-[#111114] flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="m-auto flex flex-col items-center gap-3.5 text-center p-6">
            <div className="w-10 h-10 rounded-full border-3 border-[#8B5CF6] border-t-transparent animate-spin" />
            <div>
              <h4 className="text-sm font-bold text-white">Opening Full Screen PDF...</h4>
              <p className="text-xs text-[#A1A1AA] mt-1 font-mono">Loading high-resolution pages</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="m-auto text-center p-8 max-w-md space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white">Unable to Display PDF</h4>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">{loadError}</p>
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-[#23232A] hover:bg-[#2E2E38] text-white text-xs font-bold border border-[#272730] transition-all cursor-pointer"
            >
              ← Return to Notes
            </button>
          </div>
        ) : pdfBlobUrl ? (
          <PdfCanvasViewer
            pdfUrl={pdfBlobUrl}
            scale={scale}
            onScaleChange={setScale}
            onLoadSuccess={(total) => setTotalPages(total)}
            onPageChange={(page, total) => {
              setCurrentPage(page);
              setTotalPages(total);
            }}
            showInlineControls={false}
            className="flex-1 min-h-0 w-full"
          />
        ) : (
          <div className="m-auto text-center p-6 space-y-2">
            <FileText className="w-10 h-10 text-[#383842] mx-auto" />
            <p className="text-xs text-[#A1A1AA]">No PDF document is available to view.</p>
          </div>
        )}
      </div>

      {/* 3. FLOATING QUICK-BACK PILL FOR MOBILE */}
      <button
        onClick={() => {
          soundManager.playClick();
          onClose();
        }}
        className="fixed bottom-6 right-6 sm:hidden px-4 py-2.5 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold shadow-2xl flex items-center gap-1.5 z-50 active:scale-95 cursor-pointer border border-white/20"
        title="Back to Topic"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Topic</span>
      </button>
    </div>
  );
};
