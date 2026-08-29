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
  Sparkles,
  BookOpen,
  Eye,
  AlertCircle
} from 'lucide-react';
import { TopicPdfAttachment } from '../../types/syllabus';
import { getPdfBlobUrl, downloadPdfFile } from '../../utils/pdfStorage';
import { soundManager } from '../../utils/soundEffects';

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

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return 'PDF Document';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

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
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0B0B0D] text-[#F5F5F7] animate-fade-in select-none overflow-hidden">
      {/* TOP HEADER: NAVIGATION, TITLE & ACTIONS */}
      <div className="px-3 sm:px-6 py-2.5 bg-[#18181D] border-b border-[#272730] flex items-center justify-between gap-3 shrink-0 shadow-lg">
        
        {/* Left: Back Button & Topic Info */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[#23232A] hover:bg-[#8B5CF6] text-white text-xs font-bold transition-all border border-[#272730] hover:border-[#8B5CF6] cursor-pointer shadow-sm active:scale-95 group"
            title="Go back to Topic Notes (Esc)"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back to Topic</span>
            <span className="sm:hidden">Back</span>
          </button>

          <div className="h-6 w-px bg-[#272730] hidden sm:block" />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8B5CF6]">
              <span>{subjectName || 'Subject'}</span>
              <span>•</span>
              <span className="truncate">{chapterName || 'Chapter'}</span>
            </div>
            <h3 className="text-xs sm:text-sm font-extrabold text-white truncate flex items-center gap-2">
              <span className="truncate">{topicName}</span>
              <span className="hidden md:inline px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                In-App PDF Reader Mode
              </span>
            </h3>
          </div>
        </div>

        {/* Center: Multi-PDF Attachment Switcher Dropdown */}
        {attachments.length > 1 && (
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#A1A1AA] uppercase font-mono">
              Switch PDF:
            </span>
            <div className="relative min-w-[220px]">
              <select
                value={selectedAttachmentId}
                onChange={e => {
                  soundManager.playClick();
                  setSelectedAttachmentId(e.target.value);
                }}
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
          </div>
        )}

        {/* Right Actions: Split Study, Download, Fullscreen & Close */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Split Study Quick Switch */}
          {onOpenSplitStudy && (
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
                onOpenSplitStudy(selectedAttachmentId);
              }}
              title="Open Split-Screen to read this PDF and take notes side-by-side"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 text-[#8B5CF6] dark:text-[#C4B5FD] text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split Study</span>
            </button>
          )}

          {/* Download PDF Button */}
          {currentAttachment && (
            <button
              onClick={handleDownload}
              title={`Download ${currentAttachment.name}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Download</span>
            </button>
          )}

          {/* Native Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2 rounded-xl bg-[#23232A] hover:bg-[#2E2E38] text-[#A1A1AA] hover:text-white border border-[#272730] transition-colors cursor-pointer hidden sm:flex"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-[#23232A] hover:bg-rose-500/20 text-[#A1A1AA] hover:text-rose-400 border border-[#272730] transition-colors cursor-pointer"
            title="Close PDF View (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SUB-BAR FOR MOBILE PDF SELECTOR & METRICS */}
      <div className="px-4 py-2 bg-[#141418] border-b border-[#272730] flex items-center justify-between text-xs text-[#A1A1AA]">
        <div className="flex items-center gap-2 truncate">
          <FileText className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
          <span className="font-semibold text-[#F5F5F7] truncate">
            {currentAttachment?.name || 'Document'}
          </span>
          {currentAttachment?.fileSize ? (
            <span className="text-[10px] font-mono text-[#85877E] shrink-0">
              ({formatFileSize(currentAttachment.fileSize)})
            </span>
          ) : null}
        </div>

        {attachments.length > 1 && (
          <div className="flex lg:hidden items-center gap-1">
            <select
              value={selectedAttachmentId}
              onChange={e => {
                soundManager.playClick();
                setSelectedAttachmentId(e.target.value);
              }}
              className="px-2 py-1 rounded-lg bg-[#23232A] border border-[#272730] text-[11px] font-semibold text-white focus:outline-none focus:border-[#8B5CF6]"
            >
              {attachments.map(att => (
                <option key={att.id} value={att.id}>
                  📑 {att.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* MAIN PDF VIEWER DISPLAY (EDGE-TO-EDGE DISTRACTION FREE) */}
      <div className="flex-1 relative min-h-0 bg-[#0F0F12] flex items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3.5 text-center p-6">
            <div className="w-10 h-10 rounded-full border-3 border-[#8B5CF6] border-t-transparent animate-spin" />
            <div>
              <h4 className="text-sm font-bold text-white">Opening PDF in App...</h4>
              <p className="text-xs text-[#A1A1AA] mt-1 font-mono">Loading document data seamlessly</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="text-center p-8 max-w-md space-y-3">
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
          <iframe
            src={`${pdfBlobUrl}#toolbar=1&navpanes=0&view=FitH`}
            className="w-full h-full border-none bg-white"
            title={currentAttachment?.name || 'In-App PDF Reader'}
          />
        ) : (
          <div className="text-center p-6 space-y-2">
            <FileText className="w-10 h-10 text-[#383842] mx-auto" />
            <p className="text-xs text-[#A1A1AA]">No PDF document is available to view.</p>
          </div>
        )}
      </div>

      {/* FLOATING QUICK-BACK PILL ON MOBILE FOR FAST EXIT */}
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
