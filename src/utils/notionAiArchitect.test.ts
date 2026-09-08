import { describe, it, expect } from 'vitest';
import {
  transformNotesWithAiArchitect,
  verifyDataIntegrity,
  detectSourceLlm,
  normalizeMathFormulas,
  stripConversationalClutter
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
});
