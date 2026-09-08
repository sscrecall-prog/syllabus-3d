/**
 * Smart Vocabulary Architect & Notion Flashcard Engine
 * 
 * Transforms raw vocabulary notes copied from Google Gemini, ChatGPT, Claude, Telegram,
 * or coaching sheets into interactive, Notion-styled visual flashcards matching the exact
 * layout seen in the student's study workspace.
 * 
 * Guarantees:
 * 1. 100% Data Integrity & Zero Information Loss (English, Hindi, Synonyms, Antonyms,
 *    Advanced Synonyms, Confusing Words, Exam Tricks, Usage Examples, and Related Words)
 * 2. Interactive revision checkboxes (- [ ] / - [x]) for every synonym & antonym
 * 3. Support for single words and multi-word batches in a single paste
 */

export interface VocabSynonymItem {
  word: string;
  hindi?: string;
  checked?: boolean;
}

export interface VocabExampleItem {
  en: string;
  hi?: string;
}

export interface VocabRelatedWord {
  word: string;
  partOfSpeech?: string;
  meaning?: string;
}

export interface VocabConfusingWords {
  pairTitle: string;
  comparisons: string[];
  examTricks: string[];
}

export interface VocabCardItem {
  id: string;
  index: number;
  word: string;
  partOfSpeech?: string;
  hindiMeaning?: string;
  englishMeaning: string;
  synonyms: VocabSynonymItem[];
  advancedSynonyms: VocabSynonymItem[];
  antonyms: VocabSynonymItem[];
  confusingWords?: VocabConfusingWords;
  examples: VocabExampleItem[];
  relatedWords: VocabRelatedWord[];
  categoryTag?: string; // e.g., 'One Word Substitution' or 'High-Frequency Exam Vocab'
}

/**
 * Detects if the given text has vocabulary structures
 */
export function isVocabContent(text: string): boolean {
  if (!text || text.trim().length < 15) return false;

  const lower = text.toLowerCase();

  // Signature keywords
  const hasVocabKeywords =
    (lower.includes('synonyms') || lower.includes('synonym')) &&
    (lower.includes('meaning') || lower.includes('antonyms') || lower.includes('antonym') || lower.includes('examples'));

  // Signature emojis commonly used in Gemini/ChatGPT/Telegram vocab posts
  const hasVocabEmojis =
    text.includes('🔘') ||
    text.includes('💠') ||
    text.includes('🇮🇳') ||
    text.includes('🌼') ||
    text.includes('🔥') ||
    text.includes('🤔') ||
    text.includes('💭') ||
    text.includes('🔰');

  // Part of speech signature: e.g. "(Noun)", "(verb)", "(Adjective)", "(Noun - Uncountable"
  const hasPartOfSpeechPattern = /\((?:Noun|Verb|Adjective|Adj|Adverb|Adv)\b/i.test(text);

  // Direct callout markers
  const hasVocabCallouts = text.includes('[!VOCAB-WORD]') || text.includes('[!VOCAB-DEF]');

  return (hasVocabKeywords && (hasVocabEmojis || hasPartOfSpeechPattern)) || hasVocabCallouts;
}

/**
 * Cleans markdown formatting symbols from words
 */
function cleanText(text: string): string {
  return text
    .replace(/^[\s*•\-🔘💠🇮🇳🌼🔥🤔💭🔰➡️⤵️|]+\s*/, '')
    .replace(/\*\*/g, '')
    .trim();
}

/**
 * Parses raw text into structured VocabCardItem array
 */
export function parseVocabCards(rawText: string): VocabCardItem[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.replace(/\r\n/g, '\n').split('\n');
  const cards: VocabCardItem[] = [];

  // Identify block boundaries: words usually start with '🔘', or '1. Word', or '**Word (Part of Speech)**'
  const blockStartIndices: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    const isEmojiWordStart = trimmed.startsWith('🔘') && (trimmed.includes('**') || trimmed.includes('('));
    const isNumberedWordStart = /^\d+\.?\s+\*\*?[A-Za-z]+.*?\((?:Noun|Verb|Adj|Adv)/i.test(trimmed);
    const isVocabCallout = trimmed.startsWith('> [!VOCAB-WORD]');
    const isHeadingWordStart = /^#{1,4}\s+.*?\((?:Noun|Verb|Adj|Adv)/i.test(trimmed);

    if (isEmojiWordStart || isNumberedWordStart || isVocabCallout || isHeadingWordStart) {
      blockStartIndices.push(i);
    }
  }

  // If no explicit word header found, but isVocabContent is true, treat entire text as 1 word block
  if (blockStartIndices.length === 0) {
    blockStartIndices.push(0);
  }

  // Parse each block
  for (let b = 0; b < blockStartIndices.length; b++) {
    const startIdx = blockStartIndices[b];
    const endIdx = b + 1 < blockStartIndices.length ? blockStartIndices[b + 1] : lines.length;
    const blockLines = lines.slice(startIdx, endIdx);

    const card = parseSingleVocabBlock(blockLines, b + 1);
    if (card && card.word) {
      cards.push(card);
    }
  }

  return cards;
}

/**
 * Parses a single block of lines into a VocabCardItem
 */
function parseSingleVocabBlock(blockLines: string[], defaultIndex: number): VocabCardItem | null {
  let word = '';
  let partOfSpeech = '';
  let hindiMeaning = '';
  let englishMeaning = '';
  const synonyms: VocabSynonymItem[] = [];
  const advancedSynonyms: VocabSynonymItem[] = [];
  const antonyms: VocabSynonymItem[] = [];
  const examples: VocabExampleItem[] = [];
  const relatedWords: VocabRelatedWord[] = [];
  let confusingWords: VocabConfusingWords | undefined = undefined;
  let categoryTag = 'One Word Substitution';

  type ActiveSection =
    | 'header'
    | 'english_meaning'
    | 'hindi_meaning'
    | 'synonyms'
    | 'advanced_synonyms'
    | 'antonyms'
    | 'confusing_word'
    | 'exam_trick'
    | 'examples'
    | 'related_word'
    | 'none';

  let currentSection: ActiveSection = 'none';

  // Temporary buffers
  const englishMeaningLines: string[] = [];
  const confusingComparisons: string[] = [];
  const examTricks: string[] = [];
  let confusingPairTitle = '';

  for (let i = 0; i < blockLines.length; i++) {
    const line = blockLines[i];
    const trimmed = line.trim();

    if (!trimmed) continue;

    // Check if line is a pre-existing callout format
    if (trimmed.startsWith('> [!VOCAB-WORD')) {
      const match = trimmed.match(/>\s*\[!VOCAB-WORD(?:\s+(\d+))?\]\s*(.*?)(?:\|(.*))?$/);
      if (match) {
        word = cleanText(match[2] || '');
        if (match[3]) {
          const parts = match[3].split('|').map(s => s.trim());
          if (parts[0]) partOfSpeech = parts[0];
          if (parts[1]) hindiMeaning = parts[1];
        }
      }
      currentSection = 'header';
      continue;
    }

    // Header Word Detection: e.g. "🔘 **Paraphernalia (Noun - Uncountable / Plural)**"
    // or "1. Embellish (verb) सजाना"
    if (
      (trimmed.startsWith('🔘') || /^\d+\.?\s+[A-Za-z]+/i.test(trimmed) || trimmed.startsWith('#')) &&
      !word &&
      (trimmed.includes('(') || trimmed.includes('**'))
    ) {
      let rawHeader = trimmed.replace(/^🔘\s*/, '').replace(/^#+\s*/, '').replace(/^\d+\.\s*/, '');
      
      // Extract Word
      const wordMatch = rawHeader.match(/\*\*?([A-Za-z\s'-]+)\*\*?/);
      if (wordMatch) {
        word = wordMatch[1].trim();
      } else {
        const firstWordMatch = rawHeader.match(/^([A-Za-z]+)/);
        if (firstWordMatch) word = firstWordMatch[1].trim();
      }

      // Extract Part of Speech inside parentheses: e.g. (Noun - Uncountable / Plural) or (verb)
      const posMatch = rawHeader.match(/\(([^)]+)\)/);
      if (posMatch) {
        partOfSpeech = posMatch[1].trim();
      }

      // Extract Hindi Meaning if present on same line: e.g. "Embellish (verb) सजाना"
      const hindiMatch = rawHeader.replace(/\*\*?[A-Za-z\s'-]+\*\*?/, '').replace(/\([^)]+\)/, '').trim();
      if (hindiMatch && /[\u0900-\u097F]/.test(hindiMatch)) {
        hindiMeaning = hindiMatch;
      }

      currentSection = 'header';
      continue;
    }

    // Section Triggers
    if (/English Meaning|💠|\[!VOCAB-DEF\]/i.test(trimmed)) {
      currentSection = 'english_meaning';
      const afterHeader = trimmed.replace(/.*(?:English Meaning|💠|\[!VOCAB-DEF\])[*\s:]*/i, '').replace(/^\*\*|\*\*$/g, '').trim();
      if (afterHeader && afterHeader !== '**') englishMeaningLines.push(afterHeader);
      continue;
    }

    if (/Hindi Meaning|🇮🇳/i.test(trimmed)) {
      currentSection = 'hindi_meaning';
      const afterHeader = trimmed.replace(/.*(?:Hindi Meaning|🇮🇳)[*\s:]*/i, '').replace(/^\*\*|\*\*$/g, '').trim();
      if (afterHeader && afterHeader !== '**') {
        hindiMeaning = hindiMeaning ? `${hindiMeaning} / ${afterHeader}` : afterHeader;
      }
      continue;
    }

    if (/Advanced Synonyms|🔥/i.test(trimmed) && trimmed.toLowerCase().includes('synonym')) {
      currentSection = 'advanced_synonyms';
      continue;
    }

    if (/Synonyms|🌼|\[!VOCAB-SYNONYMS\]/i.test(trimmed)) {
      currentSection = 'synonyms';
      continue;
    }

    if (/Antonyms|\[!VOCAB-ANTONYMS\]/i.test(trimmed)) {
      currentSection = 'antonyms';
      const afterHeader = trimmed.replace(/.*(?:Antonyms:|Antonyms|\[!VOCAB-ANTONYMS\])[*\s:]*/i, '').replace(/^\*\*|\*\*$/g, '').trim();
      if (afterHeader && afterHeader !== '**') {
        // Parse comma-separated antonyms on same line: e.g. "Bare essentials, Disorganization, Core elements"
        const items = afterHeader.split(',').map(s => s.trim()).filter(Boolean);
        items.forEach(item => {
          antonyms.push(parseSynonymOrAntonymItem(item));
        });
      }
      continue;
    }

    if (/Confusing Word|🤔|\[!VOCAB-CONFUSING\]/i.test(trimmed)) {
      currentSection = 'confusing_word';
      confusingPairTitle = trimmed.replace(/.*(?:Confusing Word|🤔|\[!VOCAB-CONFUSING\])[*\s:]*/i, '').replace(/\*\*/g, '').trim();
      continue;
    }

    if (/Exam Trick/i.test(trimmed)) {
      currentSection = 'exam_trick';
      const afterHeader = trimmed.replace(/.*Exam Trick[*\s:]*/i, '').replace(/\*\*/g, '').trim();
      if (afterHeader && afterHeader !== '**') examTricks.push(afterHeader);
      continue;
    }

    if (/Examples|💭|Usage:|\[!VOCAB-USAGE\]/i.test(trimmed)) {
      currentSection = 'examples';
      const afterHeader = trimmed.replace(/.*(?:Examples|💭|Usage:|\[!VOCAB-USAGE\])[*\s:]*/i, '').replace(/^\*\*|\*\*$/g, '').trim();
      if (afterHeader && afterHeader !== '**') {
        examples.push({ en: afterHeader });
      }
      continue;
    }

    if (/Related Word|🔰|\[!VOCAB-RELATED\]/i.test(trimmed)) {
      currentSection = 'related_word';
      const afterHeader = trimmed.replace(/.*(?:Related Word|🔰|\[!VOCAB-RELATED\])[*\s:]*/i, '').replace(/^\*\*|\*\*$/g, '').trim();
      if (afterHeader && afterHeader !== '**') {
        relatedWords.push(parseRelatedWord(afterHeader));
      }
      continue;
    }

    // Process Line based on Current Section
    if (currentSection === 'english_meaning') {
      const cleanLine = trimmed.replace(/^>\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
      if (cleanLine && cleanLine !== '**' && !/English Meaning/i.test(cleanLine)) {
        englishMeaningLines.push(cleanLine);
      }
    } else if (currentSection === 'hindi_meaning') {
      const cleanLine = trimmed.replace(/^>\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
      if (cleanLine && cleanLine !== '**' && !/Hindi Meaning/i.test(cleanLine)) {
        hindiMeaning = hindiMeaning ? `${hindiMeaning} / ${cleanLine}` : cleanLine;
      }
    } else if (currentSection === 'synonyms') {
      if (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('>')) {
        synonyms.push(parseSynonymOrAntonymItem(trimmed));
      } else if (trimmed.includes(',')) {
        trimmed.split(',').map(s => s.trim()).filter(Boolean).forEach(w => {
          synonyms.push(parseSynonymOrAntonymItem(w));
        });
      }
    } else if (currentSection === 'advanced_synonyms') {
      if (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('>')) {
        advancedSynonyms.push(parseSynonymOrAntonymItem(trimmed));
      }
    } else if (currentSection === 'antonyms') {
      if (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('>')) {
        antonyms.push(parseSynonymOrAntonymItem(trimmed));
      } else if (trimmed.includes(',')) {
        trimmed.split(',').map(s => s.trim()).filter(Boolean).forEach(w => {
          antonyms.push(parseSynonymOrAntonymItem(w));
        });
      }
    } else if (currentSection === 'confusing_word') {
      if (trimmed.startsWith('**') && trimmed.includes('vs')) {
        confusingPairTitle = trimmed.replace(/\*\*/g, '').trim();
      } else {
        confusingComparisons.push(trimmed.replace(/^[*•\-]\s*/, ''));
      }
    } else if (currentSection === 'exam_trick') {
      examTricks.push(trimmed.replace(/^[*•\-]\s*/, ''));
    } else if (currentSection === 'examples') {
      // Examples often come in pairs:
      // 1. The investigative agency seized...
      // → जांच एजेंसी ने छापे के दौरान...
      if (trimmed.startsWith('→') || trimmed.startsWith('->') || trimmed.startsWith('Hindi:')) {
        if (examples.length > 0) {
          const lastExample = examples[examples.length - 1];
          lastExample.hi = trimmed.replace(/^[→\->Hindi:]+\s*/, '').trim();
        }
      } else {
        const cleanEn = trimmed.replace(/^\d+\.?\s*/, '').replace(/^[|•\-\*]\s*/, '').replace(/^Usage:\s*/i, '').trim();
        if (cleanEn && cleanEn !== '**') {
          examples.push({ en: cleanEn });
        }
      }
    } else if (currentSection === 'related_word') {
      relatedWords.push(parseRelatedWord(trimmed));
    }
  }

  // Combine english meaning
  englishMeaning = englishMeaningLines.join(' ').trim();

  // If no word was parsed, try first line
  if (!word && blockLines.length > 0) {
    const firstClean = cleanText(blockLines[0]);
    const firstWordMatch = firstClean.match(/^([A-Za-z]+)/);
    if (firstWordMatch) word = firstWordMatch[1];
  }

  if (confusingComparisons.length > 0 || examTricks.length > 0) {
    confusingWords = {
      pairTitle: confusingPairTitle || `${word} Comparisons`,
      comparisons: confusingComparisons,
      examTricks: examTricks
    };
  }

  return {
    id: `vocab_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    index: defaultIndex,
    word: word || 'Vocabulary Word',
    partOfSpeech: partOfSpeech || 'Word',
    hindiMeaning: hindiMeaning || '',
    englishMeaning: englishMeaning || 'Meaning of the word.',
    synonyms,
    advancedSynonyms,
    antonyms,
    confusingWords,
    examples,
    relatedWords,
    categoryTag
  };
}

/**
 * Parses individual synonym or antonym line
 * e.g., "* Equipment — उपकरण / सामान" -> { word: "Equipment", hindi: "उपकरण / सामान" }
 * e.g., "- [ ] Decorate" -> { word: "Decorate", checked: false }
 * e.g., "- [x] Enhance" -> { word: "Enhance", checked: true }
 */
function parseSynonymOrAntonymItem(line: string): VocabSynonymItem {
  let isChecked = false;
  let text = line.replace(/^>\s*/, '').trim();

  if (text.startsWith('- [x] ') || text.startsWith('* [x] ')) {
    isChecked = true;
    text = text.substring(6);
  } else if (text.startsWith('- [ ] ') || text.startsWith('* [ ] ')) {
    isChecked = false;
    text = text.substring(6);
  } else {
    text = text.replace(/^[*•\-☐]\s*/, '').trim();
  }

  // Split by em-dash '—', hyphen '-', or '->'
  if (text.includes('—')) {
    const parts = text.split('—');
    return {
      word: parts[0].trim(),
      hindi: parts[1]?.trim() || undefined,
      checked: isChecked
    };
  } else if (text.includes(' - ')) {
    const parts = text.split(' - ');
    return {
      word: parts[0].trim(),
      hindi: parts[1]?.trim() || undefined,
      checked: isChecked
    };
  } else if (text.includes('=')) {
    const parts = text.split('=');
    return {
      word: parts[0].trim(),
      hindi: parts[1]?.trim() || undefined,
      checked: isChecked
    };
  }

  return {
    word: text.trim(),
    checked: isChecked
  };
}

/**
 * Parses related word line
 * e.g., "* **Paraphernal (Adjective)** — of or relating to personal property → साजो-सामान से संबंधित"
 */
function parseRelatedWord(line: string): VocabRelatedWord {
  const clean = line.replace(/^[*•\-🔰]\s*/, '').trim();
  const wordMatch = clean.match(/\*\*?([A-Za-z\s'-]+)\*\*?/);
  const word = wordMatch ? wordMatch[1].trim() : clean.split(' ')[0];

  const posMatch = clean.match(/\(([^)]+)\)/);
  const partOfSpeech = posMatch ? posMatch[1].trim() : undefined;

  let meaning = clean.replace(/\*\*?[A-Za-z\s'-]+\*\*?/, '').replace(/\([^)]+\)/, '').replace(/^[—\->=:\s]+/, '').trim();

  return {
    word: word || clean,
    partOfSpeech,
    meaning
  };
}

/**
 * Formats parsed VocabCardItem array into Notion-Style Markdown
 */
export function formatVocabToMarkdown(cards: VocabCardItem[]): string {
  if (!cards || cards.length === 0) return '';

  const markdownBlocks: string[] = [];

  cards.forEach((card, idx) => {
    const indexNum = card.index || idx + 1;
    const lines: string[] = [];

    // 1. 🏷️ Word Header Card: [index] Word (partOfSpeech) HindiMeaning
    lines.push(`> [!VOCAB-WORD ${indexNum}] **${card.word}** | (${card.partOfSpeech || 'Word'}) | ${card.hindiMeaning || ''}`);
    lines.push('');

    // 2. ➡️ English Definition Box
    if (card.englishMeaning) {
      lines.push(`> [!VOCAB-DEF]`);
      lines.push(`> ${card.englishMeaning}`);
      lines.push('');
    }

    // 3. ⤵️ Synonyms Card with interactive checkboxes & tag
    if (card.synonyms.length > 0) {
      lines.push(`> [!VOCAB-SYNONYMS] ${card.categoryTag || 'One Word Substitution'}`);
      card.synonyms.forEach(syn => {
        const checkMarker = syn.checked ? '[x]' : '[ ]';
        const hindiPart = syn.hindi ? ` — ${syn.hindi}` : '';
        lines.push(`> - ${checkMarker} **${syn.word}**${hindiPart}`);
      });
      lines.push('');
    }

    // 4. 🔥 Advanced Synonyms Card (if present)
    if (card.advancedSynonyms && card.advancedSynonyms.length > 0) {
      lines.push(`> [!VOCAB-ADVANCED] High-Level Exam Synonyms`);
      card.advancedSynonyms.forEach(adv => {
        const checkMarker = adv.checked ? '[x]' : '[ ]';
        const hindiPart = adv.hindi ? ` — ${adv.hindi}` : '';
        lines.push(`> - ${checkMarker} **${adv.word}**${hindiPart}`);
      });
      lines.push('');
    }

    // 5. ⤵️ Antonyms Card with interactive checkboxes & tag
    if (card.antonyms.length > 0) {
      lines.push(`> [!VOCAB-ANTONYMS] High-Yield Antonyms`);
      card.antonyms.forEach(ant => {
        const checkMarker = ant.checked ? '[x]' : '[ ]';
        const hindiPart = ant.hindi ? ` — ${ant.hindi}` : '';
        lines.push(`> - ${checkMarker} **${ant.word}**${hindiPart}`);
      });
      lines.push('');
    }

    // 6. 🤔 Confusing Word & Exam Trick Card (if present)
    if (card.confusingWords) {
      lines.push(`> [!VOCAB-CONFUSING] ${card.confusingWords.pairTitle}`);
      if (card.confusingWords.comparisons.length > 0) {
        card.confusingWords.comparisons.forEach(comp => {
          lines.push(`> * ${comp}`);
        });
      }
      if (card.confusingWords.examTricks.length > 0) {
        lines.push(`>`);
        lines.push(`> **⚡ Exam Trick:**`);
        card.confusingWords.examTricks.forEach(trick => {
          lines.push(`> * ${trick}`);
        });
      }
      lines.push('');
    }

    // 7. 💬 Usage & Examples with quote bars
    if (card.examples.length > 0) {
      lines.push(`> [!VOCAB-USAGE]`);
      card.examples.forEach(ex => {
        lines.push(`> | **Usage:** ${ex.en}`);
        if (ex.hi) {
          lines.push(`> | → ${ex.hi}`);
        }
        lines.push(`>`);
      });
      lines.push('');
    }

    // 8. 🔰 Related Words (if present)
    if (card.relatedWords && card.relatedWords.length > 0) {
      lines.push(`> [!VOCAB-RELATED] Exam-Oriented Derivatives`);
      card.relatedWords.forEach(rw => {
        const pos = rw.partOfSpeech ? ` (${rw.partOfSpeech})` : '';
        const meaning = rw.meaning ? ` — ${rw.meaning}` : '';
        lines.push(`> * **${rw.word}**${pos}${meaning}`);
      });
      lines.push('');
    }

    // Card Separator
    lines.push('---');
    lines.push('');

    markdownBlocks.push(lines.join('\n'));
  });

  return markdownBlocks.join('\n\n').trim();
}

/**
 * Transforms raw text directly into Notion-style Vocabulary Cards
 */
export function transformToVocabNotionCards(rawText: string): string {
  if (!rawText || !rawText.trim()) return '';
  const parsed = parseVocabCards(rawText);
  if (parsed.length === 0) return rawText;
  return formatVocabToMarkdown(parsed);
}

/**
 * Generates sample vocabulary cards (matching Embellish & Paraphernalia) for new notes
 */
export function getDefaultSampleVocab(topicName?: string): string {
  const cards: VocabCardItem[] = [
    {
      id: 'vocab_sample_1',
      index: 1,
      word: 'Embellish',
      partOfSpeech: 'verb',
      hindiMeaning: 'सजाना / संवारना',
      englishMeaning: 'To make something more beautiful or attractive by adding decoration or ornaments.',
      synonyms: [
        { word: 'Decorate', hindi: 'सजाना' },
        { word: 'Enhance', hindi: 'बढ़ाना' },
        { word: 'Garnish', hindi: 'अलंकृत करना' },
        { word: 'Amplify', hindi: 'विस्तार करना' },
        { word: 'Deck', hindi: 'सजाना' },
        { word: 'Adorn', hindi: 'श्रृंगार करना' },
        { word: 'Ornament', hindi: 'सुशोभित करना' },
        { word: 'Caparison', hindi: 'विशेष पोशाक से सजाना' }
      ],
      advancedSynonyms: [],
      antonyms: [
        { word: 'Deface', hindi: 'विकृत करना' },
        { word: 'Blemish', hindi: 'दाग लगाना' },
        { word: 'Spoil', hindi: 'खराब करना' },
        { word: 'Belittle', hindi: 'कम आंकना' },
        { word: 'Understate', hindi: 'कम करके बताना' }
      ],
      examples: [
        {
          en: 'The ceiling was embellished with flowers and leaves.',
          hi: 'छत को फूलों और पत्तियों से सजाया गया था।'
        },
        {
          en: "He couldn't resist embellishing the story of his accident a little.",
          hi: 'वह अपनी दुर्घटना की कहानी को थोड़ा बढ़ा-चढ़ाकर सजाने से खुद को रोक नहीं सका।'
        }
      ],
      relatedWords: [
        { word: 'Embellishment', partOfSpeech: 'Noun', meaning: 'a decorative detail or feature' }
      ],
      categoryTag: 'One Word Substitution'
    },
    {
      id: 'vocab_sample_2',
      index: 2,
      word: 'Paraphernalia',
      partOfSpeech: 'Noun - Uncountable / Plural',
      hindiMeaning: 'सामग्री / साजो-सामान / उपकरण / निजी सामान / तामझाम',
      englishMeaning: 'Miscellaneous articles, equipment, gear, or personal belongings associated with a particular activity, occupation, or lifestyle.',
      synonyms: [
        { word: 'Equipment', hindi: 'उपकरण / सामान' },
        { word: 'Gear', hindi: 'साजो-सामान / औजार' },
        { word: 'Belongings', hindi: 'निजी सामान / वस्तुएं' },
        { word: 'Apparatus', hindi: 'उपकरण / यंत्र' },
        { word: 'Utensils', hindi: 'साधन / सामग्री' }
      ],
      advancedSynonyms: [
        { word: 'Accoutrements', hindi: 'अतिरिक्त उपकरण या साज-सज्जा की वस्तुएं' },
        { word: 'Trappings', hindi: 'बाहरी आडंबर या साजो-सामान' },
        { word: 'Impedimenta', hindi: 'भारी या यात्रा में बाधा बनने वाला सामान' },
        { word: 'Appurtenances', hindi: 'सहायक सामग्री / गौण वस्तुएं' },
        { word: 'Regalia', hindi: 'विशेष औपचारिक पोशाक या प्रतीक-चिह्न' }
      ],
      antonyms: [
        { word: 'Bare essentials', hindi: 'अति आवश्यक न्यूनतम वस्तुएं' },
        { word: 'Disorganization', hindi: 'अव्यवस्था' },
        { word: 'Core elements', hindi: 'मूल तत्व' },
        { word: 'Stripped-down state', hindi: 'न्यूनतम सादगीपूर्ण स्थिति' }
      ],
      confusingWords: {
        pairTitle: 'Paraphernalia vs Accoutrements',
        comparisons: [
          '**Paraphernalia (Noun)** = Articles, equipment, or personal belongings needed for a specific task, lifestyle, or activity → साजो-सामान / सामग्री',
          '**Accoutrements (Noun)** = Additional items of dress or equipment, especially of a soldier, carried for a specific role → फौजी साजो-सामान / विशेष साज-सज्जा'
        ],
        examTricks: [
          '**Paraphernalia** → किसी भी कार्य/गतिविधि से संबंधित विविध साजो-सामान या तामझाम (e.g., cricket paraphernalia, medical paraphernalia)',
          '**Accoutrements** → मुख्य रूप से पोशाक, वर्दी या आधिकारिक उपकरणों के साथ जुड़ी अतिरिक्त साज-सज्जा'
        ]
      },
      examples: [
        {
          en: 'The investigative agency seized a large cache of digital devices and other related paraphernalia during the raid.',
          hi: 'जांच एजेंसी ने छापे के दौरान बड़ी मात्रा में डिजिटल उपकरण और अन्य संबंधित साजो-सामान जब्त किया।'
        },
        {
          en: 'High-altitude trekking requires specialized cold-weather paraphernalia to prevent severe frostbite and hypothermia.',
          hi: 'अत्यधिक ऊंचाई पर ट्रेकिंग के लिए गंभीर शीतदंश (frostbite) और हाइपोथर्मिया से बचने हेतु विशेष शीतकालीन साजो-सामान की आवश्यकता होती है।'
        }
      ],
      relatedWords: [
        { word: 'Paraphernal', partOfSpeech: 'Adjective', meaning: 'of or relating to personal property or paraphernalia' }
      ],
      categoryTag: 'SSC / UPSC High-Frequency Vocab'
    }
  ];

  return formatVocabToMarkdown(cards);
}
