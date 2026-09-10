import * as pdfjsLib from 'pdfjs-dist';

// Ensure PDF.js worker is properly configured
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
}

export interface PdfExtractionOptions {
  onProgress?: (current: number, total: number, message: string) => void;
  maxPages?: number;
}

export interface PdfExtractionResult {
  text: string;
  totalPages: number;
  extractedPages: number;
  filename?: string;
}

/**
 * Strips common header, footer, page number patterns, and watermark artifacts
 */
function cleanPageText(text: string): string {
  let cleaned = text;

  // Remove common page numbering artifacts
  cleaned = cleaned.replace(/\bPage\s*\d+\s*(?:of|\/)\s*\d+\b/gi, '');
  cleaned = cleaned.replace(/\bPage\s*[-–—]?\s*\d+\s*[-–—]?\b/gi, '');
  cleaned = cleaned.replace(/^\s*\d+\s*$/gm, '');

  // Normalize excessive whitespaces and line breaks
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

/**
 * Extracts all readable text from a PDF file using client-side PDF.js
 */
export async function extractTextFromPdf(
  fileOrBuffer: File | ArrayBuffer,
  options?: PdfExtractionOptions
): Promise<PdfExtractionResult> {
  let arrayBuffer: ArrayBuffer;
  let filename: string | undefined;

  if (fileOrBuffer instanceof File) {
    filename = fileOrBuffer.name;
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    arrayBuffer = fileOrBuffer;
  }

  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;
  const pagesToExtract = options?.maxPages ? Math.min(options.maxPages, totalPages) : totalPages;

  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pagesToExtract; pageNum++) {
    options?.onProgress?.(
      pageNum,
      pagesToExtract,
      `Reading page ${pageNum} of ${pagesToExtract}...`
    );

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group items by vertical position or simply join lines
    let lastY: number | null = null;
    let pageStr = '';

    for (const item of textContent.items as any[]) {
      if (!item.str) continue;

      // Detect line break if vertical coordinate (item.transform[5]) changes significantly
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        pageStr += '\n';
      } else if (pageStr.length > 0 && !pageStr.endsWith(' ') && !pageStr.endsWith('\n')) {
        pageStr += ' ';
      }

      pageStr += item.str;
      lastY = item.transform[5];
    }

    const cleaned = cleanPageText(pageStr);
    if (cleaned) {
      pageTexts.push(cleaned);
    }
  }

  const combinedText = pageTexts.join('\n\n--- [Next Page] ---\n\n');

  return {
    text: combinedText,
    totalPages,
    extractedPages: pagesToExtract,
    filename
  };
}
