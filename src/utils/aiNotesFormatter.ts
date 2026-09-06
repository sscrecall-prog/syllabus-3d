/**
 * AI Notes Formatter & Beautifier
 * Transforms raw text copied from Google Gemini, ChatGPT, Claude, or Web portals
 * into structured, high-yield professional academic notes with Notion/GitHub style callouts,
 * KaTeX formulas, exam traps, and clean comparison tables.
 */

import {
  cleanAndRepairMarkdownTable,
  isTsvTable,
  tsvToMarkdownTable,
  sanitizeAiCitations
} from './tableUtils';

export interface FormatAiNotesOptions {
  topicName?: string;
  subjectName?: string;
  chapterName?: string;
  examName?: string;
}

/**
 * Strips AI introductory chatter and conversational filler from LLM responses
 */
const AI_CONVERSATIONAL_PREFIXES = [
  /^(?:certainly|sure|here(?:'s| is| are)|below is|below are|welcome to|in this guide|as requested|of course)[^:\n]*:?\s*$/i,
  /^(?:here is a (?:complete|comprehensive|quick|structured|detailed) (?:summary|guide|notes?|overview) (?:of|for|on)).*$/i,
  /^(?:hello|hi there|greetings)[^:\n]*:?\s*$/i,
  /^(?:let'?s (?:dive in|explore|understand|break down|look at)).*$/i,
  /^(?:hope this helps|all the best|happy studying|let me know if you need|feel free to ask|good luck|best of luck|keep practicing).*[!.]?\s*$/i,
  /^(?:if you have any (?:more|further) questions|if you'd like (?:more|additional) examples).*[!.]?\s*$/i
];

/**
 * Main AI Text Beautifier & Formatter
 */
export function formatAiNotes(rawText: string, options?: FormatAiNotesOptions): string {
  if (!rawText || !rawText.trim()) return '';

  // 0. If entire text or large part is TSV, convert tables first
  let preparedText = rawText;
  if (isTsvTable(preparedText)) {
    preparedText = tsvToMarkdownTable(preparedText);
  }

  // Sanitize any citation clutter (like PDF badges from Gemini/NotebookLM)
  preparedText = sanitizeAiCitations(preparedText);

  let lines = preparedText.replace(/\r\n/g, '\n').split('\n');

  // 1. Filter out AI introductory & outro pleasantries
  const filteredLines: string[] = [];
  let isLeading = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check leading AI filler
    if (isLeading) {
      if (!line) continue;
      const isIntro = AI_CONVERSATIONAL_PREFIXES.some(pattern => pattern.test(line));
      if (isIntro) continue;
      isLeading = false;
    }

    filteredLines.push(lines[i]);
  }

  // Trim trailing AI pleasantries
  while (filteredLines.length > 0) {
    const lastLine = filteredLines[filteredLines.length - 1].trim();
    if (!lastLine) {
      filteredLines.pop();
    } else if (AI_CONVERSATIONAL_PREFIXES.some(pattern => pattern.test(lastLine))) {
      filteredLines.pop();
    } else {
      break;
    }
  }

  // 2. Process and convert lines into structured Markdown, Formulas & Callout blocks
  const outputLines: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < filteredLines.length; i++) {
    const line = filteredLines[i];
    const trimmed = line.trim();

    // Check code blocks
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      outputLines.push(line);
      continue;
    }

    if (inCodeBlock) {
      outputLines.push(line);
      continue;
    }

    // Check Multi-line Block Math ($$ or \[)
    if (trimmed === '$$' || trimmed === '\\[') {
      const mathLines: string[] = [line];
      i++;
      while (i < filteredLines.length) {
        const mLine = filteredLines[i];
        const mTrimmed = mLine.trim();
        mathLines.push(mLine);
        if (mTrimmed === '$$' || mTrimmed === '\\]') {
          break;
        }
        i++;
      }
      outputLines.push(mathLines.join('\n'));
      continue;
    }

    // Markdown Table blocks: detect and auto-repair
    if (trimmed.startsWith('|') || (trimmed.includes('|') && (i + 1 < filteredLines.length && filteredLines[i + 1].includes('|')))) {
      const tableLines: string[] = [line];
      let j = i + 1;

      while (j < filteredLines.length) {
        const nextTrimmed = filteredLines[j].trim();
        if (nextTrimmed.includes('|') || nextTrimmed === '') {
          // Check if an empty line really ends the table or if next line still has pipes
          if (nextTrimmed === '') {
            if (j + 1 < filteredLines.length && filteredLines[j + 1].trim().includes('|')) {
              // Soft gap inside table, continue
              j++;
              continue;
            } else {
              break;
            }
          }
          tableLines.push(filteredLines[j]);
          j++;
        } else {
          break;
        }
      }

      if (tableLines.length >= 2) {
        const repaired = cleanAndRepairMarkdownTable(tableLines.join('\n'));
        outputLines.push(repaired);
        i = j - 1;
        continue;
      }
    }

    // 3. Auto-convert AI callout headers (e.g. **Formula:** or **Important:** or **Tip:**)
    // Formula / Math Callout
    if (
      /^\s*(?:\*\*)?(?:formula|key formula|important formula|equations?|mathematical formula)(?:\*\*)?\s*[:\-–—]\s*(.*)$/i.test(trimmed)
    ) {
      const match = trimmed.match(/^\s*(?:\*\*)?(?:formula|key formula|important formula|equations?|mathematical formula)(?:\*\*)?\s*[:\-–—]\s*(.*)$/i);
      const rest = match ? match[1].trim() : '';
      outputLines.push(`> [!FORMULA]`);
      if (rest) outputLines.push(`> ${rest}`);
      continue;
    }

    // Pro-Tip / Shortcut Callout
    if (
      /^\s*(?:\*\*)?(?:pro[\s-]?tip|shortcut|quick trick|speed trick|exam tip|smart technique)(?:\*\*)?\s*[:\-–—]\s*(.*)$/i.test(trimmed)
    ) {
      const match = trimmed.match(/^\s*(?:\*\*)?(?:pro[\s-]?tip|shortcut|quick trick|speed trick|exam tip|smart technique)(?:\*\*)?\s*[:\-–—]\s*(.*)$/i);
      const rest = match ? match[1].trim() : '';
      outputLines.push(`> [!TIP]`);
      if (rest) outputLines.push(`> ${rest}`);
      continue;
    }

    // Warning / Exam Trap Callout
    if (
      /^\s*(?:\*\*)?(?:warning|common trap|exam trap|common mistake|pitfall|watch out|caution|confusing exception)(?:\*\*)?\s*[:\-–—]\s*(.*)$/i.test(trimmed)
    ) {
      const match = trimmed.match(/^\s*(?:\*\*)?(?:warning|common trap|exam trap|common mistake|pitfall|watch out|caution|confusing exception)(?:\*\*)?\s*[:\-–—]\s*(.*)$/i);
      const rest = match ? match[1].trim() : '';
      outputLines.push(`> [!WARNING]`);
      if (rest) outputLines.push(`> ${rest}`);
      continue;
    }

    // Golden Rule / Core Concept Callout
    if (
      /^\s*(?:\*\*)?(?:golden rule|core rule|key concept|crucial concept|fundamental rule|definition)(?:\*\*)?\s*[:\-–—]\s*(.*)$/i.test(trimmed)
    ) {
      const match = trimmed.match(/^\s*(?:\*\*)?(?:golden rule|core rule|key concept|crucial concept|fundamental rule|definition)(?:\*\*)?\s*[:\-–—]\s*(.*)$/i);
      const rest = match ? match[1].trim() : '';
      outputLines.push(`> [!RULE]`);
      if (rest) outputLines.push(`> ${rest}`);
      continue;
    }

    // Example / Practice Question Callout
    if (
      /^\s*(?:\*\*)?(?:example|sample question|practice problem|pyq example|solved illustration)(?:\*\*)?\s*[:\-–—]\s*(.*)$/i.test(trimmed)
    ) {
      const match = trimmed.match(/^\s*(?:\*\*)?(?:example|sample question|practice problem|pyq example|solved illustration)(?:\*\*)?\s*[:\-–—]\s*(.*)$/i);
      const rest = match ? match[1].trim() : '';
      outputLines.push(`> [!EXAMPLE]`);
      if (rest) outputLines.push(`> ${rest}`);
      continue;
    }

    // 4. Normalize headings: convert bold standalone headers like `**1. Overview**` or `### 1. Overview`
    if (/^\s*\*\*\d+\.\s+([^*]+)\*\*\s*$/.test(trimmed)) {
      const headingText = trimmed.replace(/^\s*\*\*\d+\.\s+/, '').replace(/\*\*\s*$/, '');
      outputLines.push(`\n## ${headingText}`);
      continue;
    }

    // Standardize bullet points (convert •, +, ▪ to -)
    if (/^\s*[•+▪]\s+(.*)$/.test(trimmed)) {
      const bulletContent = trimmed.replace(/^\s*[•+▪]\s+/, '');
      outputLines.push(`- ${bulletContent}`);
      continue;
    }

    outputLines.push(line);
  }

  // 3. If there is no top level heading and topicName is provided, add clean academic title
  let result = outputLines.join('\n').trim();

  if (options?.topicName && !result.startsWith('# ')) {
    result = `# ${options.topicName}\n\n${result}`;
  }

  // 4. Ensure clean spacing between headers and callouts
  result = result
    .replace(/\n{3,}/g, '\n\n')
    .replace(/(#+ [^\n]+)\n([^\n#\s])/g, '$1\n\n$2');

  return result;
}

/**
 * Generate a pre-engineered prompt for ChatGPT / Gemini to get 10/10 study notes
 */
export function generateAiNotesPrompt(params: {
  topicName: string;
  subjectName?: string;
  chapterName?: string;
  examName?: string;
}): string {
  const { topicName, subjectName, chapterName, examName } = params;
  
  return `Act as an expert exam coach and subject master for ${examName || 'Competitive Exams (SSC CGL / Banking / State Exams)'}.
Please provide comprehensive, high-yield, structured study notes for the topic: "${topicName}" (${chapterName ? `Chapter: ${chapterName}, ` : ''}${subjectName ? `Subject: ${subjectName}` : ''}).

Format your response strictly using clean Markdown with the following elements:
1. # ${topicName} (Concise 2-sentence core summary)
2. > [!RULE] (Core Definition & Golden Rules)
3. > [!FORMULA] (All critical formulas and equations in LaTeX: use $$ ... $$ for display equations and $ ... $ for inline variables)
4. > [!TIP] (High-speed Shortcuts, Elimination Tricks, Ratio/Venn Shortcuts)
5. > [!WARNING] (Common Exam Traps, Tricky Exceptions & Pitfalls where students lose marks)
6. Markdown Comparison Table (Clean markdown table with column headers, proper |:---| separators, and every row enclosed with | ... | with NO newlines inside table cells)
7. > [!EXAMPLE] (2 Solved Standard Exam Questions with Step-by-Step Short Solution)
8. - [ ] (5 High-Probability Practice & Revision Checklist items)

Important formatting rules for AI:
- Tables: Always use complete markdown tables with pipes on both sides (| col 1 | col 2 |). Never insert line breaks or citations inside a table cell.
- Formulas: Format mathematical formulas using standard LaTeX. Use $$ ... $$ for equations on separate lines and $ ... $ inline.
- Dense, concise, zero pleasantries or intro chatter, 100% exam-oriented.`;
}
