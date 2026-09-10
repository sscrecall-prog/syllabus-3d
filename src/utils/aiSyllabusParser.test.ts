import { describe, it, expect, beforeEach } from 'vitest';
import { parseSyllabusHeuristically } from './heuristicSyllabusParser';
import {
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  clearStoredGeminiApiKey
} from './aiSyllabusParser';

describe('Heuristic Syllabus Parser', () => {
  it('should parse a structured multi-subject syllabus with chapters and subtopics', () => {
    const rawSyllabus = `
Subject: Advanced Physics
Chapter 1: Electromagnetism
- Coulomb's Law, Electric Field Lines, Gauss's Theorem
- Electric Potential, Capacitors, Dielectrics

Chapter 2: Optics & Wave Mechanics
- Huygens Principle, Young's Double Slit Experiment
- Polarization, Brewster's Law

Subject: Physical Chemistry
Chapter 1: Thermodynamics & Chemical Energetics
- First Law of Thermodynamics, Enthalpy, Heat Capacity
- Hess's Law, Entropy, Gibbs Free Energy
    `;

    const result = parseSyllabusHeuristically(rawSyllabus, 'Test Exam');

    expect(result.subjects.length).toBe(2);
    
    // Physics
    const physics = result.subjects.find(s => s.name.includes('Physics'));
    expect(physics).toBeDefined();
    expect(physics?.chapters.length).toBe(2);
    expect(physics?.chapters[0].name).toContain('Electromagnetism');
    expect(physics?.chapters[0].topics.length).toBeGreaterThan(0);
    
    // Check subtopics extracted
    const firstTopic = physics?.chapters[0].topics[0];
    expect(firstTopic?.subtopics.length).toBeGreaterThan(0);

    // Chemistry
    const chem = result.subjects.find(s => s.name.includes('Chemistry'));
    expect(chem).toBeDefined();
    expect(chem?.chapters[0].name).toContain('Thermodynamics');
  });

  it('should handle unlabelled topics by creating an overarching subject and chapter', () => {
    const rawLines = `
Linear Equations in Two Variables
Quadratic Equations and Roots
Arithmetic Progressions
Coordinate Geometry
Trigonometric Ratios & Identities
    `;

    const result = parseSyllabusHeuristically(rawLines, 'Class 10 Math');

    expect(result.subjects.length).toBeGreaterThan(0);
    const totalTopics = result.subjects.reduce(
      (acc, s) => acc + s.chapters.reduce((cAcc, c) => cAcc + c.topics.length, 0),
      0
    );
    expect(totalTopics).toBe(5);
  });

  it('should assign reasonable difficulty levels and weightage percentages', () => {
    const text = `
Chapter 1: Foundations of Quantum Physics
Photoelectric Effect, Compton Scattering, De Broglie Hypothesis
Heisenberg Uncertainty Principle, Schrodinger Wave Equation
    `;

    const result = parseSyllabusHeuristically(text);
    expect(result.subjects.length).toBeGreaterThan(0);
    const topics = result.subjects[0].chapters[0].topics;

    for (const t of topics) {
      expect(['Easy', 'Medium', 'Hard']).toContain(t.difficulty);
      expect(t.weightage).toBeGreaterThanOrEqual(1);
      expect(t.weightage).toBeLessThanOrEqual(5);
    }
  });
});

describe('Gemini API Key Manager', () => {
  beforeEach(() => {
    clearStoredGeminiApiKey();
  });

  it('should store, retrieve, and clear Gemini API key from localStorage', () => {
    expect(getStoredGeminiApiKey()).toBe('');

    setStoredGeminiApiKey('AIzaSyD-mock-key-12345');
    expect(getStoredGeminiApiKey()).toBe('AIzaSyD-mock-key-12345');

    clearStoredGeminiApiKey();
    expect(getStoredGeminiApiKey()).toBe('');
  });
});
