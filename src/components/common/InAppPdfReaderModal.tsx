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
  AlertCircle,
  Expand,
  Shrink,
  Check
} from 'lucide-react';
import { TopicPdfAttachment } from '../../types/syllabus';
import { getPdfBlobUrl } from '../../utils/pdfStorage';
import { soundManager } from '../../utils/soundEffects';
import { PdfCanvasViewer, PdfFitMode } from './PdfCanvasViewer';

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
  const [fitMode, setFitMode] = useState<PdfFitMode>('fit-width');
  const [showZoomDropdown, setShowZoomDropdown] = useState<boolean>(false);

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
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#16161E] text-[#C0CAF5] animate-fade-in select-none overflow-hidden font-sans">
      
      {/* 1. SINGLE SLEEK COMPACT TOP HEADER BAR */}
      <div className="px-3 sm:px-5 py-2 bg-[#1F2335]/95 backdrop-blur-md border-b border-[#292E42] flex items-center justify-between gap-2 shrink-0 z-30 shadow-md">
        
        {/* Left: Back Arrow & Document Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#24283B] hover:bg-[#7AA2F7] hover:text-[#1A1B26] text-white text-xs font-bold transition-all border border-[#292E42] hover:border-[#7AA2F7] cursor-pointer shadow-sm active:scale-95 group shrink-0"
            title="Go back to Topic Notes (Esc)"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="min-w-0 flex items-center gap-2">
            {attachments.length > 1 ? (
              <div className="relative max-w-[180px] sm:max-w-xs">
                <select
                  value={selectedAttachmentId}
                  onChange={e => {
                    soundManager.playClick();
                    setSelectedAttachmentId(e.target.value);
                  }}
                  className="w-full pl-2.5 pr-7 py-1 rounded-xl bg-[#24283B] border border-[#292E42] text-xs font-bold text-white focus:outline-none focus:border-[#7AA2F7] appearance-none cursor-pointer truncate"
                >
                  {attachments.map(att => (
                    <option key={att.id} value={att.id}>
                      📑 {att.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#A9B1D6] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <div className="truncate flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#7AA2F7] shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[150px] sm:max-w-sm">
                  {currentAttachment?.name || topicName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Live Page Tracker */}
        {totalPages > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#24283B] border border-[#292E42] text-xs font-mono font-bold text-[#A9B1D6]">
            <span>Page</span>
            <span className="text-white">{currentPage}</span>
            <span>/</span>
            <span className="text-[#7AA2F7]">{totalPages}</span>
          </div>
        )}

        {/* Right Action Tools: Chrome Fit Mode, Zoom, Split Study, Download & Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* CHROME-STYLE FIT TO PAGE / FIT TO WIDTH TOGGLE */}
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              if (fitMode === 'fit-page') {
                setFitMode('fit-width');
              } else {
                setFitMode('fit-page');
                setScale(1.0);
              }
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 ${
              fitMode === 'fit-page'
                ? 'bg-[#7AA2F7] text-[#1A1B26] border-[#7AA2F7] font-black'
                : 'bg-[#24283B] hover:bg-[#2F354D] text-[#A9B1D6] hover:text-white border-[#292E42]'
            }`}
            title={fitMode === 'fit-page' ? 'Switch to Fit Width (100% full-width view)' : 'Fit Entire Page to Screen (Chrome style full page view)'}
          >
            {fitMode === 'fit-page' ? <Shrink className="w-3.5 h-3.5" /> : <Expand className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{fitMode === 'fit-page' ? 'Fit Page' : 'Fit to Page'}</span>
          </button>

          {/* Zoom Controls with Presets Dropdown */}
          <div className="relative flex items-center bg-[#24283B] p-0.5 rounded-xl border border-[#292E42]">
            <button
              type="button"
              onClick={() => {
                setFitMode('custom');
                setScale(s => Math.max(s - 0.2, 0.4));
              }}
              className="p-1.5 rounded-lg hover:bg-[#2F354D] text-[#A9B1D6] hover:text-white cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowZoomDropdown(p => !p)}
              className="px-2 py-0.5 text-[11px] font-mono font-bold text-[#7AA2F7] hover:bg-[#2F354D] rounded-md cursor-pointer flex items-center gap-0.5"
              title="Zoom Presets"
            >
              <span>{Math.round(scale * 100)}%</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-70" />
            </button>

            <button
              type="button"
              onClick={() => {
                setFitMode('custom');
                setScale(s => Math.min(s + 0.2, 3.0));
              }}
              className="p-1.5 rounded-lg hover:bg-[#2F354D] text-[#A9B1D6] hover:text-white cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {/* Zoom Presets Menu */}
            {showZoomDropdown && (
              <div className="absolute right-0 top-full mt-2 w-36 rounded-xl bg-[#1F2335] border border-[#292E42] shadow-2xl p-1.5 space-y-1 z-50 animate-fade-in">
                {[
                  { label: 'Fit to Width (↔)', mode: 'fit-width' as PdfFitMode, scale: 1.0 },
                  { label: 'Fit to Page (↕)', mode: 'fit-page' as PdfFitMode, scale: 1.0 },
                  { label: '50%', mode: 'custom' as PdfFitMode, scale: 0.5 },
                  { label: '75%', mode: 'custom' as PdfFitMode, scale: 0.75 },
                  { label: '100% (Actual)', mode: 'custom' as PdfFitMode, scale: 1.0 },
                  { label: '125%', mode: 'custom' as PdfFitMode, scale: 1.25 },
                  { label: '150%', mode: 'custom' as PdfFitMode, scale: 1.5 },
                  { label: '200%', mode: 'custom' as PdfFitMode, scale: 2.0 },
                ].map(opt => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setFitMode(opt.mode);
                      setScale(opt.scale);
                      setShowZoomDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#24283B] text-xs font-semibold text-[#A9B1D6] hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>{opt.label}</span>
                    {((opt.mode === 'fit-page' && fitMode === 'fit-page') ||
                      (opt.mode === 'fit-width' && fitMode === 'fit-width') ||
                      (opt.mode === 'custom' && fitMode === 'custom' && Math.abs(scale - opt.scale) < 0.05)) && (
                      <Check className="w-3.5 h-3.5 text-[#7AA2F7]" />
                    )}
                  </button>
                ))}
              </div>
            )}
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
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7AA2F7]/15 hover:bg-[#7AA2F7]/25 border border-[#7AA2F7]/30 text-[#7AA2F7] text-xs font-bold transition-all cursor-pointer shadow-sm"
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
            className="p-1.5 rounded-xl bg-[#24283B] hover:bg-[#2F354D] text-[#A9B1D6] hover:text-white border border-[#292E42] transition-colors cursor-pointer hidden sm:flex"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-[#24283B] hover:bg-rose-500/20 text-[#A9B1D6] hover:text-rose-400 border border-[#292E42] transition-colors cursor-pointer"
            title="Close PDF View (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. PURE FULLSCREEN PDF CANVAS VIEWER */}
      <div className="flex-1 relative min-h-0 bg-[#16161E] flex flex-col overflow-hidden" onClick={() => setShowZoomDropdown(false)}>
        {isLoading ? (
          <div className="m-auto flex flex-col items-center gap-3.5 text-center p-6">
            <div className="w-10 h-10 rounded-full border-3 border-[#7AA2F7] border-t-transparent animate-spin" />
            <div>
              <h4 className="text-sm font-bold text-white">Opening Full Screen PDF...</h4>
              <p className="text-xs text-[#A9B1D6] mt-1 font-mono">Loading high-resolution pages</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="m-auto text-center p-8 max-w-md space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white">Unable to Display PDF</h4>
            <p className="text-xs text-[#A9B1D6] leading-relaxed">{loadError}</p>
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-[#24283B] hover:bg-[#2F354D] text-white text-xs font-bold border border-[#292E42] transition-all cursor-pointer"
            >
              ← Return to Notes
            </button>
          </div>
        ) : pdfBlobUrl ? (
          <PdfCanvasViewer
            pdfUrl={pdfBlobUrl}
            scale={scale}
            onScaleChange={setScale}
            fitMode={fitMode}
            onFitModeChange={setFitMode}
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
            <p className="text-xs text-[#A9B1D6]">No PDF document is available to view.</p>
          </div>
        )}
      </div>

      {/* 3. FLOATING QUICK-BACK PILL FOR MOBILE */}
      <button
        onClick={() => {
          soundManager.playClick();
          onClose();
        }}
        className="fixed bottom-6 right-6 sm:hidden px-4 py-2.5 rounded-full bg-[#7AA2F7] hover:bg-[#6090F5] text-[#1A1B26] text-xs font-bold shadow-2xl flex items-center gap-1.5 z-50 active:scale-95 cursor-pointer border border-white/20"
        title="Back to Topic"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Topic</span>
      </button>
    </div>
  );
};
