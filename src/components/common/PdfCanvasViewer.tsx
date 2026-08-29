import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Layers,
  FileText
} from 'lucide-react';
import { soundManager } from '../../utils/soundEffects';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
}

interface PdfCanvasViewerProps {
  pdfUrl: string | null;
  onLoadSuccess?: (totalPages: number) => void;
  className?: string;
  externalScale?: number;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  pdfUrl,
  onLoadSuccess,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [renderedPages, setRenderedPages] = useState<number[]>([]);
  const renderTasksRef = useRef<{ [key: number]: any }>({});

  // 1. Load PDF Document from URL / Blob
  useEffect(() => {
    let isCancelled = false;

    if (!pdfUrl) {
      setPdfDoc(null);
      setNumPages(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setRenderedPages([]);

    const loadDocument = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/cmaps/`,
          cMapPacked: true
        });

        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setIsLoading(false);
          onLoadSuccess?.(doc.numPages);
        }
      } catch (err: any) {
        console.error('Error loading PDF document in canvas:', err);
        if (!isCancelled) {
          setError(err?.message || 'Failed to parse and load PDF document.');
          setIsLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      isCancelled = true;
    };
  }, [pdfUrl]);

  // 2. Render Page to Canvas
  const renderPage = useCallback(
    async (pageNum: number, canvasEl: HTMLCanvasElement) => {
      if (!pdfDoc) return;

      try {
        // Cancel existing render task on this canvas if any
        if (renderTasksRef.current[pageNum]) {
          try {
            renderTasksRef.current[pageNum].cancel();
          } catch {}
          delete renderTasksRef.current[pageNum];
        }

        const page = await pdfDoc.getPage(pageNum);
        const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
        
        // Auto calculate base scale to fit container width nicely on mobile/desktop
        const unscaledViewport = page.getViewport({ scale: 1, rotation });
        const fitScale = Math.min((containerWidth - 32) / unscaledViewport.width, 2.5);
        const finalScale = Math.max(fitScale * scale, 0.5);

        const viewport = page.getViewport({ scale: finalScale, rotation });

        // High DPI sharpness for retina/mobile displays
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        canvasEl.width = Math.floor(viewport.width * dpr);
        canvasEl.height = Math.floor(viewport.height * dpr);
        canvasEl.style.width = `${Math.floor(viewport.width)}px`;
        canvasEl.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvasEl.getContext('2d', { alpha: false });
        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        const renderTask = page.render(renderContext);
        renderTasksRef.current[pageNum] = renderTask;

        await renderTask.promise;
        delete renderTasksRef.current[pageNum];
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`Error rendering page ${pageNum}:`, err);
        }
      }
    },
    [pdfDoc, scale, rotation]
  );

  // Zoom Helpers
  const handleZoomIn = () => {
    soundManager.playClick();
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    soundManager.playClick();
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    soundManager.playClick();
    setScale(1.0);
  };

  const handleRotate = () => {
    soundManager.playClick();
    setRotation(prev => (prev + 90) % 360);
  };

  // Scroll listener to track current page
  const handleScroll = () => {
    if (!containerRef.current || numPages === 0) return;
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const pageEls = container.querySelectorAll<HTMLDivElement>('[data-page-number]');

    for (let i = 0; i < pageEls.length; i++) {
      const el = pageEls[i];
      const offsetTop = el.offsetTop - container.offsetTop;
      if (scrollTop >= offsetTop - 100 && scrollTop < offsetTop + el.clientHeight) {
        const pNum = Number(el.getAttribute('data-page-number'));
        if (pNum && pNum !== currentPage) {
          setCurrentPage(pNum);
        }
        break;
      }
    }
  };

  const scrollToPage = (pageNum: number) => {
    soundManager.playClick();
    if (!containerRef.current) return;
    const el = containerRef.current.querySelector<HTMLDivElement>(`[data-page-number="${pageNum}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#0F0F12] select-none ${className}`}>
      
      {/* Viewer Floating Sticky Toolbar */}
      <div className="px-3 py-2 bg-[#18181D]/90 backdrop-blur-md border-b border-[#272730] flex items-center justify-between gap-2 shrink-0 z-20">
        
        {/* Left: Page Navigator */}
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => scrollToPage(currentPage - 1)}
            className="p-1 rounded-lg bg-[#23232A] hover:bg-[#2E2E38] disabled:opacity-40 text-white cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2 py-1 rounded-lg bg-[#111114] border border-[#272730] font-mono text-[11px] font-bold text-white min-w-[75px] text-center">
            {numPages > 0 ? `${currentPage} / ${numPages}` : '...'}
          </span>

          <button
            type="button"
            disabled={currentPage >= numPages}
            onClick={() => scrollToPage(currentPage + 1)}
            className="p-1 rounded-lg bg-[#23232A] hover:bg-[#2E2E38] disabled:opacity-40 text-white cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center / Right: Zoom & Rotate Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-[#23232A] hover:bg-[#2E2E38] text-[#A1A1AA] hover:text-white cursor-pointer transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2 py-1 rounded-lg bg-[#23232A] hover:bg-[#2E2E38] text-[11px] font-mono font-bold text-[#8B5CF6] cursor-pointer"
            title="Fit / Reset Zoom"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-[#23232A] hover:bg-[#2E2E38] text-[#A1A1AA] hover:text-white cursor-pointer transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-[#272730] mx-0.5" />

          <button
            type="button"
            onClick={handleRotate}
            className="p-1.5 rounded-lg bg-[#23232A] hover:bg-[#2E2E38] text-[#A1A1AA] hover:text-white cursor-pointer transition-colors"
            title="Rotate 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pages Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-auto p-3 sm:p-6 flex flex-col items-center gap-4 relative"
      >
        {isLoading && (
          <div className="m-auto flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Loader2 className="w-9 h-9 text-[#8B5CF6] animate-spin" />
            <span className="text-xs text-white font-bold">Rendering High-Resolution PDF...</span>
            <span className="text-[11px] text-[#85877E]">Optimized for mobile & desktop screens</span>
          </div>
        )}

        {error && (
          <div className="m-auto text-center p-6 max-w-sm space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">Could not display PDF</h4>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">{error}</p>
          </div>
        )}

        {!isLoading && !error && numPages > 0 && (
          Array.from({ length: numPages }, (_, idx) => idx + 1).map(pageNum => (
            <PdfPageItem
              key={`${pageNum}_${scale}_${rotation}`}
              pageNum={pageNum}
              renderPage={renderPage}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface PdfPageItemProps {
  pageNum: number;
  renderPage: (pageNum: number, canvas: HTMLCanvasElement) => Promise<void>;
}

const PdfPageItem: React.FC<PdfPageItemProps> = ({ pageNum, renderPage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (canvasRef.current) {
      setIsRendering(true);
      renderPage(pageNum, canvasRef.current).then(() => {
        if (isMounted) setIsRendering(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [pageNum, renderPage]);

  return (
    <div
      data-page-number={pageNum}
      className="relative rounded-xl overflow-hidden shadow-2xl bg-white border border-[#272730] transition-all"
    >
      {isRendering && (
        <div className="absolute inset-0 bg-[#18181D]/60 backdrop-blur-sm flex items-center justify-center text-white z-10">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Loader2 className="w-4 h-4 animate-spin text-[#8B5CF6]" />
            <span>Page {pageNum}...</span>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="block mx-auto max-w-full" />
    </div>
  );
};
