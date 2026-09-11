import { describe, it, expect } from 'vitest';
import {
  transformNotesWithAiArchitect,
  verifyDataIntegrity,
  detectSourceLlm,
  detectContentType,
  normalizeMathFormulas,
  stripConversationalClutter,
  generateSmartSubjectTemplate,
  generatePyqTrapAlerts,
  generateHinglishExplainer
} from './notionAiArchitect';

describe('Notion AI Architect Engine', () => {
  it('strips AI conversational clutter', () => {
    const rawLines = [
      'Certainly! Here is a comprehensive guide on Speed, Time & Distance for SSC CGL:',
      '# Speed Time Distance',
      'Formula: Speed = Distance / Time',
      'Hope this helps! Let me know if you need further practice questions.'
    ];

    const cleaned = stripConversationalClutter(rawLines);
    expect(cleaned).toHaveLength(2);
    expect(cleaned[0]).toBe('# Speed Time Distance');
    expect(cleaned[1]).toBe('Formula: Speed = Distance / Time');
  });

  it('normalizes mathematical formulas to KaTeX', () => {
    const text = 'Average speed formula is sqrt(a^2 + b^2) and theta angle is 45 degrees.';
    const normalized = normalizeMathFormulas(text);
    expect(normalized).toContain('\\sqrt{a^2 + b^2}');
    expect(normalized).toContain('\\theta');
  });

  it('detects source LLM signature', () => {
    expect(detectSourceLlm('Copied from Gemini Canvas [citation:1]')).toBe('Gemini');
    expect(detectSourceLlm('Here is what ChatGPT generated with GPT-4')).toBe('ChatGPT');
    expect(detectSourceLlm('According to Claude Sonnet 3.5')).toBe('Claude');
  });

  it('transforms raw text into 1. Notion Master format with callouts', () => {
    const raw = `
Sure, here are your notes:
# Speed and Time
Formula: Speed = Distance / Time
Pro-Tip: Use ratio method for constant distance problems.
Warning: Never average speeds directly if distances are equal.
Example: A car travels at 60 km/h for 2 hours. Distance is 120 km.
| Method | Speed | Time |
| Ratio | 3:4 | 4:3 |
- [ ] Practice 5 PYQ problems
All the best for your exam!
    `;

    const formatted = transformNotesWithAiArchitect(raw, {
      topicName: 'Speed & Time',
      format: 'notion_master'
    });

    expect(formatted).toContain('> [!NOTE]');
    expect(formatted).toContain('> [!FORMULA]');
    expect(formatted).toContain('> [!TIP]');
    expect(formatted).toContain('> [!WARNING]');
    expect(formatted).toContain('> [!EXAMPLE]');
    expect(formatted).toContain('| Method | Speed | Time |');
  });

  it('transforms into 2. Cornell notes with cue column and bottom synthesis', () => {
    const raw = `
## Newton Laws of Motion
Force is mass times acceleration.
Formula: F = m * a
    `;

    const formatted = transformNotesWithAiArchitect(raw, {
      topicName: 'Newton Laws',
      format: 'cornell'
    });

    expect(formatted).toContain('Cornell Academic Notes');
    expect(formatted).toContain('> [!CUE]');
    expect(formatted).toContain('## 📖 Detailed Notes & Explanations');
    expect(formatted).toContain('## 💡 Bottom Line & 3-Minute Exam Synthesis');
  });

  it('transforms into 3. Active Recall Q&A format', () => {
    const raw = `
## Thermodynamics First Law
Energy cannot be created or destroyed.
Formula: dU = dQ - dW
Warning: Watch out for positive vs negative sign of work done by system.
    `;

    const formatted = transformNotesWithAiArchitect(raw, {
      topicName: 'Thermodynamics',
      format: 'active_recall'
    });

    expect(formatted).toContain('Active Recall & Flashcard Deck');
    expect(formatted).toContain('### ❓ Question');
    expect(formatted).toContain('Formula Check');
  });

  it('transforms into 4. High-Yield Speed Cheat Sheet', () => {
    const raw = `
## Quadratic Equations
Formula: x = (-b +- sqrt(D))/(2a)
Formula: D = b^2 - 4ac
Warning: If D < 0, roots are imaginary.
    `;

    const formatted = transformNotesWithAiArchitect(raw, {
      topicName: 'Quadratic Equations',
      format: 'cheat_sheet'
    });

    expect(formatted).toContain('Quick Revision Cheat Sheet');
    expect(formatted).toContain('## 📐 Formula Matrix');
    expect(formatted).toContain('## ⚠️ Exam Traps & Never-Forget Rules');
  });

  it('transforms into 5. Hierarchical Tree Outline', () => {
    const raw = `
## Introduction
Core definitions here.
### Properties
Property 1 and Property 2.
    `;

    const formatted = transformNotesWithAiArchitect(raw, {
      topicName: 'System Architecture',
      format: 'hierarchical_outline'
    });

    expect(formatted).toContain('# 1.0 Comprehensive Study Outline');
    expect(formatted).toContain('## 2.0 Introduction');
  });

  it('guarantees 100% Zero-Loss Normalizer preserves all data', () => {
    const raw = `
Certainly!
# Fundamental Rights
Article 14 guarantees equality before law.
Article 19 protects six fundamental freedoms:
- Speech and expression
- Assemble peaceably
- Form associations
Formula: Rule of Law = Equity + Justice
| Article | Subject | Scope |
| 14 | Equality | All persons |
| 19 | Freedoms | Citizens only |
Hope this helps!
    `;

    const formatted = transformNotesWithAiArchitect(raw, {
      topicName: 'Fundamental Rights',
      format: 'zero_loss_clean'
    });

    // Content checks
    expect(formatted).toContain('Article 14 guarantees equality before law');
    expect(formatted).toContain('Speech and expression');
    expect(formatted).toContain('| 14 | Equality | All persons |');
    expect(formatted).not.toContain('Certainly!');
    expect(formatted).not.toContain('Hope this helps!');

    const integrity = verifyDataIntegrity(raw, formatted);
    expect(integrity.preservationScore).toBeGreaterThanOrEqual(95);
    expect(integrity.tablesCount).toBe(1);
  });

  it('accurately detects content types: vocabulary, math, GS, and general', () => {
    // 1. Vocabulary detection
    const vocabText = `
      1. Ephemeral (adj.): Lasting for a short time. Synonyms: Transient, Fleeting. Antonyms: Permanent.
      2. Cacophony: Harsh sounds. Mnemonic: Cuckoo is sweet, caco is harsh.
    `;
    const vocabRes = detectContentType(vocabText);
    expect(vocabRes.type).toBe('vocabulary');
    expect(vocabRes.recommendedFormat).toBe('vocab_master');

    // 2. Math detection
    const mathText = `
      Compound Interest Formula: A = P(1 + r/100)^t
      Difference between CI and SI for 2 years is P(r/100)^2.
      Calculate profit and loss percentage.
    `;
    const mathRes = detectContentType(mathText);
    expect(mathRes.type).toBe('math_quant');
    expect(mathRes.recommendedFormat).toBe('math_studio');

    // 3. GS detection
    const gsText = `
      Fundamental Rights under Indian Constitution:
      Article 14 equality before law.
      Article 21 right to life.
      Article 32 remedies writs.
      Battle of Plassey in 1757.
    `;
    const gsRes = detectContentType(gsText);
    expect(gsRes.type).toBe('general_studies');
    expect(gsRes.recommendedFormat).toBe('gs_matrix');
  });

  it('transforms into interactive Vocab Master format with click-to-reveal details', () => {
    const raw = `
      Ephemeral (adjective): Lasting for a very short time.
      Synonyms: Transient, Fleeting, Evanescent
      Antonyms: Permanent, Eternal
      Hindi: अल्पकालिक
      Mnemonic: A flower lives for just one day.
      Example: Social media fame is ephemeral.
    `;

    const formatted = transformNotesWithAiArchitect(raw, {
      topicName: 'Root Words & High-Frequency Vocab',
      format: 'vocab_master'
    });

    expect(formatted).toContain('Vocabulary Power Deck');
    expect(formatted).toContain('> [!VOCAB Ephemeral]');
    expect(formatted).toContain('<details>');
    expect(formatted).toContain('Click to Reveal Hindi Meaning, Mnemonics & Synonyms');
    expect(formatted).toContain('अल्पकालिक');
    expect(formatted).toContain('High-Yield Synonyms');
    expect(formatted).toContain('Opposites / Antonyms');
    expect(formatted).toContain('Exam Usage');
  });

  it('transforms into GS & Polity Exam Matrix with timeline & traps', () => {
    const raw = `
      Article 14: Equality before law and equal protection of laws.
      Article 19: Protection of 6 democratic freedoms.
      Article 21: Protection of life and personal liberty.
      Article 32: Constitutional remedies through writs.
    `;

    const formatted = transformNotesWithAiArchitect(raw, {
      topicName: 'Fundamental Rights Matrix',
      format: 'gs_matrix'
    });

    expect(formatted).toContain('General Studies & Polity Matrix');
    expect(formatted).toContain('Timeline & Core Milestone Matrix');
    expect(formatted).toContain('Negative Marking & High-Frequency Traps');
    expect(formatted).toContain('<details>');
    expect(formatted).toContain('Article 14');
  });

  it('transforms into Maths Formula Studio with KaTeX display equations', () => {
    const raw = `
      Compound Interest Formula:
      $$ A = P (1 + r/100)^t $$
      Speed Trick: For 2 year CI - SI difference, use D = P(r/100)^2.
      Warning: When compounded semi-annually, halve the rate and double the time.
    `;

    const formatted = transformNotesWithAiArchitect(raw, {
      topicName: 'Compound Interest',
      format: 'math_studio'
    });

    expect(formatted).toContain('Maths & Quant Formula Studio');
    expect(formatted).toContain('> [!FORMULA]');
    expect(formatted).toContain('Variable Breakdown & Parameter Matrix');
    expect(formatted).toContain('5-Second Topper Shortcut / Smart Trick');
    expect(formatted).toContain('Common Calculation Traps');
    expect(formatted).toContain('View Solved PYQ Model');
  });

  it('transforms into 5-MCQ interactive self-test quiz with revealable answers', () => {
    const raw = `
      - Speed is defined as the distance traveled per unit of time.
      - Velocity is speed in a given direction and is a vector quantity.
      - Acceleration represents the rate of change of velocity with time.
      - Momentum equals mass multiplied by velocity.
    `;

    const formatted = transformNotesWithAiArchitect(raw, {
      topicName: 'Kinematics & Mechanics',
      format: 'interactive_quiz'
    });

    expect(formatted).toContain('Active Self-Testing Quiz');
    expect(formatted).toContain('### ❓ Question 1');
    expect(formatted).toContain('<details>');
    expect(formatted).toContain('Reveal Correct Answer & Examiner Trap Explanation');
    expect(formatted).toContain('Correct Answer:');
  });

  it('generates rich starter templates for English, Maths, and GS', () => {
    const englishTpl = generateSmartSubjectTemplate('Vocabulary Roots', 'English');
    expect(englishTpl).toContain('Ephemeral');
    expect(englishTpl).toContain('Cacophony');

    const mathTpl = generateSmartSubjectTemplate('Compound Interest', 'Quantitative Aptitude');
    expect(mathTpl).toContain('$$ \\text{Compound Amount');
    expect(mathTpl).toContain('5-Second Topper Shortcut');

    const gsTpl = generateSmartSubjectTemplate('Fundamental Rights', 'Polity');
    expect(gsTpl).toContain('Article 14');
    expect(gsTpl).toContain('Article 32');

    const traps = generatePyqTrapAlerts('Speed Math');
    expect(traps).toContain('Negative Marking & High-Frequency Traps');

    const hinglish = generateHinglishExplainer('Constitution');
    expect(hinglish).toContain('सरल भाषा में समझो');
  });
});

