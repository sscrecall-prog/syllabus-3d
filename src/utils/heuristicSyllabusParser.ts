import {
  ExtractedSyllabusResult,
  ExtractedSubjectItem,
  ExtractedChapterItem,
  ExtractedTopicItem
} from '../types/aiSyllabus';
import { DifficultyLevel } from '../types/syllabus';

const KNOWN_SUBJECT_TAXONOMY: Array<{
  match: RegExp;
  name: string;
  icon: string;
  color: string;
}> = [
  { match: /(?:quantitative|math|arithmetic|algebra|calculus|geometry)/i, name: 'Quantitative Aptitude', icon: '📐', color: '#3b82f6' },
  { match: /(?:reasoning|intelligence|logical|mental\s*ability)/i, name: 'General Intelligence & Reasoning', icon: '🧩', color: '#8b5cf6' },
  { match: /(?:english|verbal|comprehension|grammar)/i, name: 'English Language & Comprehension', icon: '📖', color: '#10b981' },
  { match: /(?:general\s*awareness|general\s*studies|gs|gk|general\s*knowledge)/i, name: 'General Awareness & GS', icon: '🌍', color: '#f59e0b' },
  { match: /(?:history|ancient|medieval|modern\s*india)/i, name: 'History & Culture', icon: '🏛️', color: '#ea580c' },
  { match: /(?:geography|environment|ecology)/i, name: 'Geography & Environment', icon: '🗺️', color: '#059669' },
  { match: /(?:polity|constitution|governance)/i, name: 'Indian Polity & Constitution', icon: '⚖️', color: '#6366f1' },
  { match: /(?:economy|economics|financial|banking)/i, name: 'Indian Economy & Finance', icon: '📈', color: '#0284c7' },
  { match: /(?:physics|science|mechanics|optics)/i, name: 'Physics & General Science', icon: '⚡', color: '#e11d48' },
  { match: /(?:chemistry|organic|inorganic)/i, name: 'Chemistry', icon: '🧪', color: '#9333ea' },
  { match: /(?:biology|botany|zoology|physiology)/i, name: 'Biology & Life Sciences', icon: '🧬', color: '#16a34a' },
  { match: /(?:computer|it|cyber|information\s*tech)/i, name: 'Computer Proficiency', icon: '💻', color: '#0d9488' },
  { match: /(?:hindi)/i, name: 'General Hindi', icon: '📜', color: '#d97706' }
];

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

function cleanText(str: string): string {
  return str.replace(/^[\s•\-\*\d\.\(\)\[\]:]+/, '').trim();
}

function estimateDifficulty(topicName: string): DifficultyLevel {
  const lower = topicName.toLowerCase();
  if (lower.includes('advanced') || lower.includes('theorem') || lower.includes('calculus') || lower.includes('compound') || lower.includes('complex')) {
    return 'Hard';
  }
  if (lower.includes('basic') || lower.includes('introduction') || lower.includes('overview') || lower.includes('classification') || lower.includes('definitions')) {
    return 'Easy';
  }
  return 'Medium';
}

function extractSubtopicsFromTopicLine(line: string): { topicName: string; subtopics: string[] } {
  // If line contains colon or parentheses with comma-separated list
  const colonMatch = line.match(/^([^:–—]+)[:–—](.+)$/);
  if (colonMatch) {
    const mainName = cleanText(colonMatch[1]);
    const items = colonMatch[2]
      .split(/[,;/]|(?:\band\b)/)
      .map(s => cleanText(s))
      .filter(s => s.length > 2 && s.length < 80);

    if (items.length > 0) {
      return { topicName: mainName, subtopics: items };
    }
  }

  // Parentheses split e.g. "Percentages (conversion, successive, price-consumption)"
  const parenMatch = line.match(/^([^\(]+)\((.+)\)$/);
  if (parenMatch) {
    const mainName = cleanText(parenMatch[1]);
    const items = parenMatch[2]
      .split(/[,;/]/)
      .map(s => cleanText(s))
      .filter(s => s.length > 2 && s.length < 80);

    if (items.length > 0) {
      return { topicName: mainName, subtopics: items };
    }
  }

  const cleanMain = cleanText(line);
  // Generate 2-3 standard subtopic items based on topic name
  const fallbackSubtopics = [
    `${cleanMain} Core Concepts & Formulas`,
    `Standard Question Patterns & Types`,
    `High-Yield Shortcuts & Exam Traps`
  ];

  return { topicName: cleanMain, subtopics: fallbackSubtopics };
}

/**
 * Offline rule-based heuristic parser for raw syllabus text
 */
export function parseSyllabusHeuristically(
  rawText: string,
  suggestedExamName: string = 'Custom Exam Target'
): ExtractedSyllabusResult {
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const subjects: ExtractedSubjectItem[] = [];
  let currentSubject: ExtractedSubjectItem | null = null;
  let currentChapter: ExtractedChapterItem | null = null;

  function ensureSubject(name: string): ExtractedSubjectItem {
    const matchedTaxonomy = KNOWN_SUBJECT_TAXONOMY.find(t => t.match.test(name));
    const cleaned = cleanText(name);
    const sub: ExtractedSubjectItem = {
      id: generateId('sub'),
      name: cleaned.length > 2 ? cleaned : (matchedTaxonomy ? matchedTaxonomy.name : 'Core Subject'),
      icon: matchedTaxonomy ? matchedTaxonomy.icon : '📚',
      color: matchedTaxonomy ? matchedTaxonomy.color : '#3b82f6',
      chapters: []
    };
    subjects.push(sub);
    currentSubject = sub;
    currentChapter = null;
    return sub;
  }

  function ensureChapter(name: string): ExtractedChapterItem {
    if (!currentSubject) {
      ensureSubject(suggestedExamName || 'General Subject');
    }
    const chap: ExtractedChapterItem = {
      id: generateId('chap'),
      name: cleanText(name) || 'Module Fundamentals',
      description: 'Comprehensive chapter module',
      topics: []
    };
    currentSubject!.chapters.push(chap);
    currentChapter = chap;
    return chap;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Check if line is a Chapter / Unit heading FIRST
    const isChapterPattern =
      /^(?:chapter|unit|module|block)\s*[-–—:\dIVX]+/i.test(line) ||
      (/^[\dA-Z]+\.\s+[A-Z\s]{4,}$/.test(line) && line.length < 50);

    if (isChapterPattern) {
      const chapterMatch = line.match(/^(?:chapter|unit|module|block)\s*[-–—:\dIVX]+\s*[:–—]?\s*(.+)$/i);
      const chapterName = chapterMatch ? chapterMatch[1] : line;
      ensureChapter(chapterName);
      continue;
    }

    // 2. Check if line is a Subject heading
    const explicitSubjectMatch = line.match(/^(?:section|paper|tier|part|subject)\s*[-–—:\dA-Z]*\s*[:–—]?\s*(.+)$/i);
    const cleanedLine = cleanText(line).toLowerCase();
    const isExactTaxonomySubject =
      line.length < 40 &&
      !line.includes(',') &&
      !line.includes(';') &&
      !line.includes('-') &&
      KNOWN_SUBJECT_TAXONOMY.some(t => {
        const tNameLower = t.name.toLowerCase();
        return cleanedLine === tNameLower || (cleanedLine.startsWith(tNameLower) && cleanedLine.length < tNameLower.length + 8);
      });

    if (explicitSubjectMatch || isExactTaxonomySubject) {
      const subjectName = explicitSubjectMatch ? explicitSubjectMatch[1] : line;
      ensureSubject(subjectName);
      continue;
    }

    // If line has comma-separated topics or bullets
    const bulletMatch = line.match(/^(?:[-•\*\d\.]+|\([a-z\d]+\))\s*(.+)$/i);
    const candidateText = bulletMatch ? bulletMatch[1] : line;

    // Split candidate by commas or semicolons if multiple topics in one line
    const topicCandidates = candidateText.includes(',') && candidateText.length > 50 && !candidateText.includes(':')
      ? candidateText.split(',').map(s => s.trim()).filter(Boolean)
      : [candidateText];

    for (const rawTopic of topicCandidates) {
      if (rawTopic.length < 3) continue;

      if (!currentSubject) {
        // Try to match subject from taxonomy or default to suggestedExamName
        const tax = KNOWN_SUBJECT_TAXONOMY.find(t => t.match.test(rawTopic));
        ensureSubject(tax ? tax.name : (suggestedExamName || 'Core Curriculum'));
        ensureChapter('Core Concepts & Modules');
      } else if (!currentChapter) {
        ensureChapter('Core Syllabus Topics');
      }

      const { topicName, subtopics } = extractSubtopicsFromTopicLine(rawTopic);

      if (!topicName || topicName.length < 2) continue;

      const topicItem: ExtractedTopicItem = {
        id: generateId('topic'),
        name: topicName,
        difficulty: estimateDifficulty(topicName),
        weightage: Math.min(5, Math.max(1, Math.ceil(subtopics.length / 2) + 1)),
        subtopics
      };

      currentChapter!.topics.push(topicItem);
    }
  }

  // If no subjects were parsed, create a default structure
  if (subjects.length === 0 || subjects.every(s => s.chapters.length === 0)) {
    const defaultSub: ExtractedSubjectItem = {
      id: generateId('sub'),
      name: 'Comprehensive Syllabus',
      icon: '📚',
      color: '#3b82f6',
      chapters: [
        {
          id: generateId('chap'),
          name: 'Core Module 1',
          description: 'Syllabus foundations',
          topics: lines.slice(0, 10).map((l, idx) => ({
            id: generateId('topic'),
            name: cleanText(l),
            difficulty: 'Medium',
            weightage: 3,
            subtopics: [
              `${cleanText(l)} Basics`,
              `${cleanText(l)} Problem Solving`,
              `${cleanText(l)} Practice Questions`
            ]
          }))
        }
      ]
    };
    subjects.push(defaultSub);
  }

  return {
    examName: suggestedExamName,
    targetYear: new Date().getFullYear(),
    subjects
  };
}
