/**
 * Table & AI Note Utilities
 * Converts HTML/TSV tables into GFM Markdown, repairs broken tables from LLMs,
 * sanitizes citation clutter, and formats clean data columns.
 */

export interface ParsedTable {
  headers: string[];
  alignments: ('left' | 'center' | 'right')[];
  rows: string[][];
}

/**
 * Strips AI citation badges like PDF chips, [PDF], [1], [citation:x]
 */
export function sanitizeAiCitations(text: string): string {
  if (!text) return '';
  return text
    // Remove standalone PDF badge text often copied from NotebookLM / Gemini Canvas
    .replace(/(?:\[PDF\]|\bPDF\b|\[citation:\d+\]|\[\d+\])/gi, '')
    // Clean up excessive whitespace created by badge removal
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Checks if a string contains Tab-Separated Values (TSV) typical of web table copy
 */
export function isTsvTable(text: string): boolean {
  if (!text || !text.includes('\t')) return false;
  const lines = text.trim().split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return false;
  
  // Check if majority of lines have at least one tab and similar column counts
  const tabCounts = lines.map(l => (l.match(/\t/g) || []).length);
  const minTabs = Math.min(...tabCounts);
  return minTabs >= 1;
}

/**
 * Converts Tab-Separated Values (TSV) to clean GitHub Flavored Markdown table
 */
export function tsvToMarkdownTable(tsv: string): string {
  const lines = tsv.trim().split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return tsv;

  const rawRows = lines.map(line =>
    line.split('\t').map(c => sanitizeAiCitations(c.trim()))
  );

  const maxCols = Math.max(...rawRows.map(r => r.length), 1);

  const normalizedRows = rawRows.map(row => {
    const padded = [...row];
    while (padded.length < maxCols) {
      padded.push('');
    }
    return padded;
  });

  const headers = normalizedRows[0];
  const separator = headers.map(() => ':---');
  const dataRows = normalizedRows.length > 1 ? normalizedRows.slice(1) : [];

  const formatRow = (cells: string[]) => `| ${cells.map(c => c.replace(/\|/g, '\\|')).join(' | ')} |`;

  const output: string[] = [];
  output.push(formatRow(headers));
  output.push(formatRow(separator));
  for (const row of dataRows) {
    output.push(formatRow(row));
  }

  return output.join('\n');
}

/**
 * Converts an HTML Table string (from browser clipboard) into clean Markdown
 */
export function htmlTableToMarkdown(html: string): string {
  if (typeof DOMParser === 'undefined') return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');
    if (!table) return '';

    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length === 0) return '';

    const parsedRows: string[][] = [];

    rows.forEach(tr => {
      const cells = Array.from(tr.querySelectorAll('th, td'));
      if (cells.length > 0) {
        parsedRows.push(
          cells.map(cell => {
            cell.querySelectorAll('.citation, .badge, [aria-label*="citation"]').forEach(el => el.remove());
            const text = cell.textContent || '';
            return sanitizeAiCitations(text).replace(/\n/g, ' ').replace(/\s+/g, ' ').replace(/\|/g, '\\|');
          })
        );
      }
    });

    if (parsedRows.length === 0) return '';

    const maxCols = Math.max(...parsedRows.map(r => r.length), 1);
    const normalized = parsedRows.map(r => {
      const copy = [...r];
      while (copy.length < maxCols) copy.push('');
      return copy;
    });

    const headers = normalized[0];
    const separator = headers.map(() => ':---');
    const dataRows = normalized.length > 1 ? normalized.slice(1) : [];

    const formatRow = (cells: string[]) => `| ${cells.join(' | ')} |`;

    const out: string[] = [formatRow(headers), formatRow(separator)];
    for (const d of dataRows) {
      out.push(formatRow(d));
    }

    return out.join('\n');
  } catch (err) {
    console.warn('HTML table parsing failed:', err);
    return '';
  }
}

/**
 * Extracts alignment from markdown separator row (| :--- | :---: | ---: |)
 */
export function parseTableAlignments(separatorRow: string): ('left' | 'center' | 'right')[] {
  const rawParts = separatorRow.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
  return rawParts.map(col => {
    const trimmed = col.trim();
    const leftColon = trimmed.startsWith(':');
    const rightColon = trimmed.endsWith(':');
    if (leftColon && rightColon) return 'center';
    if (rightColon) return 'right';
    return 'left';
  });
}

/**
 * Checks if a line is a markdown table separator row like |---|---| or |:---|:---:|
 */
export function isTableSeparatorRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('-')) return false;
  const content = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  const parts = content.split('|');
  if (parts.length === 0) return false;
  return parts.every(part => /^[\s:]*-+[\s:]*$/.test(part));
}

/**
 * Cleans and repairs broken Markdown tables:
 * - Heals multiline cells caused by citation breaks (PDF chips)
 * - Merges rows split across multiple lines
 * - Restores missing leading or trailing pipes
 * - Inserts missing separator rows
 * - Balances column counts
 */
export function cleanAndRepairMarkdownTable(tableBlock: string): string {
  const rawLines = tableBlock.replace(/\r\n/g, '\n').split('\n');
  if (rawLines.length === 0) return tableBlock;

  // Filter out empty lines or orphan pipe-only lines
  const cleanedLines: string[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    // Remove orphan pipe lines with no text like "|" or "| |"
    if (/^\|[\s|]*$/.test(line)) {
      continue;
    }

    cleanedLines.push(sanitizeAiCitations(line));
  }

  if (cleanedLines.length === 0) return tableBlock;

  // Extract raw rows and find separator
  const rawRowCells: string[][] = [];
  let foundSeparator = false;

  for (let i = 0; i < cleanedLines.length; i++) {
    let line = cleanedLines[i];

    if (isTableSeparatorRow(line)) {
      foundSeparator = true;
      continue;
    }

    // Ensure leading and trailing pipes
    if (!line.startsWith('|')) line = '| ' + line;
    if (!line.endsWith('|')) line = line + ' |';

    const cells = line
      .slice(1, -1)
      .split('|')
      .map(c => c.trim().replace(/\s+/g, ' '));

    rawRowCells.push(cells);
  }

  if (rawRowCells.length === 0) return tableBlock;

  // Determine header columns
  const header = rawRowCells[0];
  const targetCols = Math.max(header.length, 2);

  // Reconcile and merge broken multiline rows
  const finalRows: string[][] = [header];
  let accumulated: string[] = [];

  for (let i = 1; i < rawRowCells.length; i++) {
    const currentCells = rawRowCells[i];

    if (accumulated.length === 0) {
      if (currentCells.length === targetCols) {
        finalRows.push(currentCells);
      } else {
        accumulated = [...currentCells];
      }
    } else {
      // If adding current cells still fits or completes the targetCols
      if (accumulated.length + currentCells.length <= targetCols) {
        accumulated.push(...currentCells);
        if (accumulated.length === targetCols) {
          finalRows.push(accumulated);
          accumulated = [];
        }
      } else {
        // Doesn't fit, pad what we had and start fresh
        while (accumulated.length < targetCols) {
          accumulated.push('');
        }
        finalRows.push(accumulated);

        if (currentCells.length === targetCols) {
          finalRows.push(currentCells);
          accumulated = [];
        } else {
          accumulated = [...currentCells];
        }
      }
    }
  }

  // If leftover accumulated cells remain
  if (accumulated.length > 0) {
    while (accumulated.length < targetCols) {
      accumulated.push('');
    }
    finalRows.push(accumulated);
  }

  // Pad all rows to targetCols
  const paddedRows = finalRows.map(row => {
    const copy = [...row];
    while (copy.length < targetCols) copy.push('');
    return copy;
  });

  const headers = paddedRows[0];
  const separator = Array(targetCols).fill(':---');
  const dataRows = paddedRows.slice(1);

  const formatRow = (cells: string[]) => `| ${cells.join(' | ')} |`;

  const result: string[] = [];
  result.push(formatRow(headers));
  result.push(formatRow(separator));
  for (const row of dataRows) {
    result.push(formatRow(row));
  }

  return result.join('\n');
}

/**
 * Scans a full Markdown document and repairs any table blocks inside it
 * while leaving headings, paragraphs, callouts, and math blocks untouched.
 */
export function repairAllTablesInDocument(docText: string): string {
  if (!docText || !docText.includes('|')) return docText;

  const lines = docText.replace(/\r\n/g, '\n').split('\n');
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    const pipeCount = (trimmed.match(/\|/g) || []).length;
    const isTableLine =
      (trimmed.startsWith('|') && pipeCount >= 1) ||
      (pipeCount >= 2 && !trimmed.startsWith('#') && !trimmed.startsWith('>') && !trimmed.startsWith('```'));

    if (isTableLine) {
      const tableLines: string[] = [line];
      let j = i + 1;

      while (j < lines.length) {
        const nextTrim = lines[j].trim();
        const nextPipes = (nextTrim.match(/\|/g) || []).length;

        if (nextPipes >= 1 || nextTrim === '') {
          if (nextTrim === '') {
            // Gap inside table: only continue if next line still has pipes
            if (j + 1 < lines.length && (lines[j + 1].match(/\|/g) || []).length >= 1) {
              j++;
              continue;
            } else {
              break;
            }
          }
          tableLines.push(lines[j]);
          j++;
        } else {
          break;
        }
      }

      if (tableLines.length >= 2) {
        const repaired = cleanAndRepairMarkdownTable(tableLines.join('\n'));
        output.push(repaired);
        i = j;
        continue;
      }
    }

    output.push(line);
    i++;
  }

  return output.join('\n');
}

/**
 * Intelligent clipboard content processor on paste:
 * - Detects HTML tables & converts to Markdown
 * - Detects TSV tables & converts to Markdown
 * - Repairs broken markdown tables within the document
 * - Cleans AI citations and PDF chips
 */
export function processPastedNotesContent(
  plainText: string,
  htmlText?: string
): { content: string; isTransformed: boolean; transformReason?: string } {
  // 1. Check for HTML Table in clipboard
  if (htmlText && htmlText.includes('<table')) {
    const mdTable = htmlTableToMarkdown(htmlText);
    if (mdTable) {
      return {
        content: mdTable,
        isTransformed: true,
        transformReason: 'HTML Table converted to Markdown'
      };
    }
  }

  // 2. Check for Tab-Separated Values (TSV)
  if (plainText && isTsvTable(plainText)) {
    const mdTable = tsvToMarkdownTable(plainText);
    if (mdTable) {
      return {
        content: mdTable,
        isTransformed: true,
        transformReason: 'TSV data converted to Markdown Table'
      };
    }
  }

  // 3. Clean stray citations like [PDF] or PDF chips
  let cleaned = sanitizeAiCitations(plainText);

  // 4. Scan and repair all table blocks in the document
  if (cleaned.includes('|')) {
    const repairedDoc = repairAllTablesInDocument(cleaned);
    if (repairedDoc !== plainText) {
      return {
        content: repairedDoc,
        isTransformed: true,
        transformReason: 'Repaired Table Formatting & Cleaned Citations'
      };
    }
  }

  if (cleaned !== plainText) {
    return {
      content: cleaned,
      isTransformed: true,
      transformReason: 'Cleaned AI citation tags'
    };
  }

  return {
    content: plainText,
    isTransformed: false
  };
}
