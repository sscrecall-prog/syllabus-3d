import { describe, it, expect } from 'vitest';
import {
  extractGeminiShareUrl,
  isQuizContent,
  parseQuizQuestions,
  formatQuizToMarkdown,
  generateGeminiQuizPrompt,
  getDefaultSampleQuiz
} from './quizUtils';

describe('quizUtils', () => {
  it('extracts Gemini share URLs accurately', () => {
    const text1 = 'Check out this quiz: https://share.gemini.google/iMDdEutzj2LP';
    expect(extractGeminiShareUrl(text1)).toBe('https://share.gemini.google/iMDdEutzj2LP');

    const text2 = 'https://gemini.google.com/share/5b5d57764372?skid=123';
    expect(extractGeminiShareUrl(text2)).toBe('https://gemini.google.com/share/5b5d57764372?skid=123');

    const text3 = 'No url here';
    expect(extractGeminiShareUrl(text3)).toBeNull();
  });

  it('detects quiz content reliably', () => {
    const quiz1 = `
# Test Quiz
> [!QUIZ]
> Practice session
### Q1: What is 2 + 2?
- [A] 3
- [B] 4
**Answer:** B
`;
    expect(isQuizContent(quiz1)).toBe(true);

    const normalNotes = `
# Lesson 1: Fundamentals
This is a standard study note with paragraphs and formulas.
`;
    expect(isQuizContent(normalNotes)).toBe(false);
  });

  it('parses questions, options, answer and explanation from Gemini output', () => {
    const sample = `
# 🎯 Interactive Quiz: Indian Constitution

### Q1: Who was the Chairman of the Drafting Committee?
- [A] Dr. Rajendra Prasad
- [B] Dr. B.R. Ambedkar
- [C] Jawaharlal Nehru
- [D] Sardar Vallabhbhai Patel
**Answer:** B
**Explanation:** Dr. B.R. Ambedkar was appointed Chairman of the Drafting Committee on 29 August 1947.

---

### Q2: When was the Constitution adopted?
A) 15 August 1947
B) 26 November 1949
C) 26 January 1950
D) 2 October 1948
Correct Answer: (B)
Solution: The Constitution was adopted on 26 November 1949 by the Constituent Assembly.
`;

    const parsed = parseQuizQuestions(sample);
    expect(parsed.questions.length).toBe(2);

    expect(parsed.questions[0].question).toBe('Who was the Chairman of the Drafting Committee?');
    expect(parsed.questions[0].options.length).toBe(4);
    expect(parsed.questions[0].options[1].key).toBe('B');
    expect(parsed.questions[0].options[1].text).toBe('Dr. B.R. Ambedkar');
    expect(parsed.questions[0].correctAnswer).toBe('B');
    expect(parsed.questions[0].explanation).toContain('Dr. B.R. Ambedkar was appointed');

    expect(parsed.questions[1].question).toBe('When was the Constitution adopted?');
    expect(parsed.questions[1].options.length).toBe(4);
    expect(parsed.questions[1].correctAnswer).toBe('B');
    expect(parsed.questions[1].explanation).toContain('26 November 1949');
  });

  it('generates a Gemini prompt for a given topic', () => {
    const prompt = generateGeminiQuizPrompt('Time & Work', 'Quantitative Aptitude');
    expect(prompt).toContain('Time & Work');
    expect(prompt).toContain('Quantitative Aptitude');
    expect(prompt).toContain('### Q1:');
  });

  it('formats questions into markdown cleanly', () => {
    const questions = [
      {
        id: 'q-1',
        index: 1,
        question: 'Sample question?',
        options: [
          { key: 'A', text: 'Option A' },
          { key: 'B', text: 'Option B' }
        ],
        correctAnswer: 'A',
        explanation: 'Because option A is correct.'
      }
    ];

    const md = formatQuizToMarkdown('Sample Quiz', questions, 'https://share.gemini.google/test', 'Math');
    expect(md).toContain('# 🎯 Sample Quiz');
    expect(md).toContain('https://share.gemini.google/test');
    expect(md).toContain('> [!QUIZ]');
    expect(md).toContain('### Q1: Sample question?');
    expect(md).toContain('- [A] Option A');
    expect(md).toContain('**Answer:** A');
  });
});
