export interface QuizOption {
  key: string; // 'A', 'B', 'C', 'D'
  text: string;
}

export interface QuizQuestion {
  id: string;
  index: number;
  question: string;
  options: QuizOption[];
  correctAnswer: string; // 'A', 'B', 'C', etc.
  explanation: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface ParsedQuiz {
  title: string;
  sourceUrl?: string;
  questions: QuizQuestion[];
}

/**
 * Extracts a Gemini share URL from text or raw input.
 * Supports: https://share.gemini.google/... and https://gemini.google.com/share/...
 */
export function extractGeminiShareUrl(input: string): string | null {
  if (!input) return null;
  const match = input.match(/https?:\/\/(?:share\.gemini\.google|gemini\.google\.com\/share)\/[a-zA-Z0-9_\-\?=&]+/i);
  return match ? match[0] : null;
}

/**
 * Checks if the given text contains a quiz structure (questions, options A-D, answers).
 */
export function isQuizContent(text: string): boolean {
  if (!text) return false;
  const hasQuizCallout = />\s*\[!QUIZ\]/i.test(text);
  const hasMultipleQuestions = (text.match(/(?:(?:###\s*(?:Q|Question)\s*\d+)|(?:\b(?:Q|Question)\s*\d+[:.])|(?:\b\d+\.\s+[^\n]+\?))/gi) || []).length >= 1;
  const hasOptions = (text.match(/(?:^[ \t]*(?:[-*]\s*)?[\(\[]?[A-D][\)\]][\s.:])/gmi) || []).length >= 2;
  const hasAnswer = /(?:(?:\*\*|#|\b)(?:Correct\s*)?Answer\s*[:*]+)/i.test(text);

  return hasQuizCallout || (hasMultipleQuestions && hasOptions) || (hasOptions && hasAnswer);
}

/**
 * Robustly parses markdown notes or Gemini/ChatGPT raw text into structured QuizQuestion items.
 */
export function parseQuizQuestions(markdown: string): ParsedQuiz {
  if (!markdown) {
    return { title: 'Practice Quiz', questions: [] };
  }

  const sourceUrl = extractGeminiShareUrl(markdown) || undefined;

  // Extract title if present in top heading
  let title = 'Interactive Quiz & MCQ Practice';
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    title = titleMatch[1].replace(/^[🎯📝⚡❓\s]+/, '').trim();
  }

  const lines = markdown.split('\n');
  const questions: QuizQuestion[] = [];

  let currentQuestion: Partial<QuizQuestion> | null = null;
  let currentOptions: QuizOption[] = [];
  let currentExplanation = '';
  let isParsingExplanation = false;

  const finalizeCurrentQuestion = () => {
    if (currentQuestion && currentQuestion.question && currentOptions.length >= 2) {
      questions.push({
        id: `q-${questions.length + 1}`,
        index: questions.length + 1,
        question: currentQuestion.question.trim(),
        options: [...currentOptions],
        correctAnswer: (currentQuestion.correctAnswer || 'A').toUpperCase().trim(),
        explanation: currentExplanation.trim(),
        difficulty: currentQuestion.difficulty || 'Medium'
      });
    }
    currentQuestion = null;
    currentOptions = [];
    currentExplanation = '';
    isParsingExplanation = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      if (isParsingExplanation && currentExplanation) {
        currentExplanation += '\n';
      }
      continue;
    }

    // Check for start of a new question:
    // Matches: "### Q1: ...", "### Question 1: ...", "1. Question ...?", "Q1. Question ...", "1) Question ..."
    const questionMatch = line.match(/^(?:###\s*)?(?:(?:Q|Question)\s*(\d+)[:.]?\s*|\b(\d+)[\.\)]\s+)(.+)$/i);
    const isNewQuestionHeading = Boolean(
      (line.startsWith('###') && (line.toLowerCase().includes('q') || line.toLowerCase().includes('question'))) ||
      questionMatch
    );

    if (isNewQuestionHeading) {
      finalizeCurrentQuestion();

      let qText = '';
      if (questionMatch) {
        qText = questionMatch[3] || questionMatch[0];
      } else {
        qText = line.replace(/^###\s*(?:Q|Question\s*\d+[:.]?)?\s*/i, '');
      }

      currentQuestion = {
        question: qText.replace(/^\*+|\*+$/g, '').trim(),
        difficulty: 'Medium'
      };
      continue;
    }

    // Check for options:
    // Matches: "A) Option", "- [A] Option", "- (A) Option", "(A) Option", "A. Option", "- A) Option"
    const optionMatch = line.match(/^(?:[-*]\s*)?[\(\[]?([A-Ea-e])[\)\]][\s.:\t]+(.*)$/);
    if (optionMatch && currentQuestion) {
      isParsingExplanation = false;
      const key = optionMatch[1].toUpperCase();
      const text = optionMatch[2].replace(/^\*+|\*+$/g, '').trim();
      currentOptions.push({ key, text });
      continue;
    }

    // Check for Correct Answer:
    // Matches: "**Answer:** B", "Correct Answer: (C)", "Answer: Option D", "**Ans:** A"
    const answerMatch = line.match(/(?:(?:\*\*|__)?(?:Correct\s*)?Ans(?:wer)?(?:\*\*|__)?\s*[:*]+)\s*[\(\[]?([A-Ea-e])[\)\]]?(?:\s*[:.]\s*(.*))?/i);
    if (answerMatch && currentQuestion) {
      currentQuestion.correctAnswer = answerMatch[1].toUpperCase();
      if (answerMatch[2]) {
        currentExplanation = answerMatch[2].trim();
      }
      isParsingExplanation = true;
      continue;
    }

    // Check for Explanation / Solution:
    // Matches: "**Explanation:** ...", "Solution: ...", "> Explanation: ..."
    const explanationMatch = line.match(/^(?:>\s*)?(?:(?:\*\*|__)?(?:Explanation|Solution|Rationale)(?:\*\*|__)?\s*[:*]+)\s*(.*)$/i);
    if (explanationMatch && currentQuestion) {
      currentExplanation = explanationMatch[1].trim();
      isParsingExplanation = true;
      continue;
    }

    // If we are currently parsing the explanation of a question
    if (isParsingExplanation && currentQuestion) {
      // Ignore horizontal rules or callout wrappers
      if (line === '---' || line.startsWith('> [!')) {
        continue;
      }
      currentExplanation += (currentExplanation ? '\n' : '') + rawLine.replace(/^>\s*/, '');
    }
  }

  // Finalize last question
  finalizeCurrentQuestion();

  return {
    title,
    sourceUrl,
    questions
  };
}

/**
 * Formats structured questions into a clean, markdown note format that works seamlessly
 * in both the Interactive Quiz Station and normal Markdown reader/editor.
 */
export function formatQuizToMarkdown(
  title: string,
  questions: QuizQuestion[],
  geminiUrl?: string,
  topicName?: string
): string {
  const parts: string[] = [];

  parts.push(`# 🎯 ${title || 'Interactive Quiz & MCQ Practice'}`);
  parts.push('');

  if (geminiUrl) {
    parts.push(`> [!NOTE]`);
    parts.push(`> **Gemini Quiz Source:** [Open in Google Gemini](${geminiUrl})`);
    parts.push('');
  }

  parts.push(`> [!QUIZ]`);
  parts.push(`> **Topic:** ${topicName || 'General Exam Practice'} | **Questions:** ${questions.length} | **Passing Score:** 70%`);
  parts.push('');

  questions.forEach((q, idx) => {
    parts.push(`### Q${idx + 1}: ${q.question}`);
    q.options.forEach(opt => {
      parts.push(`- [${opt.key}] ${opt.text}`);
    });
    parts.push(`**Answer:** ${q.correctAnswer}`);
    if (q.explanation) {
      parts.push(`**Explanation:** ${q.explanation}`);
    }
    parts.push('');
    parts.push('---');
    parts.push('');
  });

  return parts.join('\n').trim();
}

/**
 * Generates an optimized, ready-to-copy AI prompt for Google Gemini or ChatGPT
 * to create a perfectly formatted, high-yield exam quiz for the specific topic.
 */
export function generateGeminiQuizPrompt(topicName: string, subjectName?: string): string {
  const subjectContext = subjectName ? `for the subject "${subjectName}"` : '';
  return `Please create an interactive, high-yield practice quiz with 5 exam-standard multiple-choice questions (MCQs) ${subjectContext} on the topic: "${topicName}".

Format each question strictly in this clean Markdown format so it imports cleanly into my study workstation:

### Q1: [Question text here]
- [A] [Option A]
- [B] [Option B]
- [C] [Option C]
- [D] [Option D]
**Answer:** [Correct option letter A, B, C, or D]
**Explanation:** [Detailed concept explanation, golden rule, or shortcut method]

---

Ensure the questions cover high-frequency previous year exam patterns, tricky traps, and core concepts with detailed explanations!`;
}

/**
 * Returns a high-yield default sample quiz when the user creates a quiz note from scratch.
 */
export function getDefaultSampleQuiz(topicName: string = 'Topic Fundamentals', geminiUrl?: string): string {
  const urlNote = geminiUrl ? `\n> [!NOTE]\n> **Gemini Quiz Source:** [Open in Google Gemini](${geminiUrl})\n` : '';
  return `# 🎯 Interactive Quiz: ${topicName}
${urlNote}
> [!QUIZ]
> **Topic:** ${topicName} | **Questions:** 3 | **Format:** High-Yield MCQ Practice

### Q1: What is the primary objective of understanding ${topicName}?
- [A] Memorizing formulas without conceptual understanding
- [B] Building clear foundational concepts and rapid problem-solving speed
- [C] Skipping previous year exam questions
- [D] Relying purely on guess work in exam conditions
**Answer:** B
**Explanation:** Conceptual clarity combined with shortcut techniques and regular PYQ practice ensures maximum accuracy and speed.

---

### Q2: How should you approach high-frequency exam traps in ${topicName}?
- [A] Read the question carefully to identify exceptions before answering
- [B] Rush through options to save time
- [C] Mark the first plausible answer without reading all 4 options
- [D] Ignore units and dimensions in calculations
**Answer:** A
**Explanation:** Reading the question thoroughly prevents negative marking from common examiner traps and unit mismatch errors.

---

### Q3: What is the most effective revision strategy for competitive exams?
- [A] Revising only once before the exam
- [B] Spaced repetition active recall combined with daily timed quizzes
- [C] Re-reading passive notes repeatedly
- [D] Avoiding mock tests to prevent anxiety
**Answer:** B
**Explanation:** Active recall with spaced revision and mock quiz tests produces significantly higher retention compared to passive reading.
`;
}
