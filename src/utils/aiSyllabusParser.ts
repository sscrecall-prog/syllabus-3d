import {
  ExtractedSyllabusResult,
  ExtractedSubjectItem,
  ExtractedChapterItem,
  ExtractedTopicItem,
  AiParserOptions
} from '../types/aiSyllabus';
import { parseSyllabusHeuristically } from './heuristicSyllabusParser';

export const GEMINI_API_KEY_STORAGE_KEY = 'syllabus3d_gemini_api_key';

export function getStoredGeminiApiKey(): string {
  try {
    return localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredGeminiApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to save Gemini API key:', e);
  }
}

export function clearStoredGeminiApiKey(): void {
  try {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear Gemini API key:', e);
  }
}

function generateUniqueId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

const SYSTEM_INSTRUCTION = `You are a world-class Academic Syllabus Architect, Chief Curriculum Officer, and Exam Preparation Strategist.
Your job is to take raw, messy, unstructured syllabus text (extracted from official government notifications, university brochures, coaching notes, or PDF documents) and organize it into a rigorous, human-crafted 4-tier hierarchy:
Level 1: Subject (e.g. Quantitative Aptitude, General Intelligence & Reasoning, English Language, Indian Polity, Modern History)
Level 2: Chapter (Logical module clustering, e.g. "Arithmetic & Commercial Math", "Algebra & Higher Math", "Ancient India & Harappan Civilization")
Level 3: Topic (Precise academic topic, e.g. "Percentages & Fractional Equivalents", "Preamble & Fundamental Rights")
Level 4: Granular Subtopics (A checklist of 3 to 6 actionable concepts/sub-skills that a student needs to master to solve mock questions).

RULES:
1. Always assign a suitable emoji icon for each Subject (e.g. 📐, 🧩, 📖, ⚖️, 🏛️, 🧪, 💻).
2. Always assign a vibrant hex color for each Subject (e.g. '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4').
3. For every topic, assign a realistic 'difficulty': exactly "Easy", "Medium", or "Hard".
4. For every topic, assign an exam 'weightage' integer from 1 to 5 (5 being highest frequency in exams).
5. Ensure EVERY topic has 3 to 6 specific, practical subtopics so the student has an exhaustive study roadmap.
6. Remove legal boilerplate, examination guidelines, marking schemes, age limits, and physical requirements. Focus 100% on pure academic syllabus.
7. Return strictly valid JSON adhering to the provided schema.`;

const SYLLABUS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    examName: { type: 'string' },
    targetYear: { type: 'integer' },
    subjects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          icon: { type: 'string' },
          color: { type: 'string' },
          chapters: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                topics: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
                      weightage: { type: 'integer' },
                      subtopics: {
                        type: 'array',
                        items: { type: 'string' }
                      }
                    },
                    required: ['name', 'difficulty', 'weightage', 'subtopics']
                  }
                }
              },
              required: ['name', 'topics']
            }
          }
        },
        required: ['name', 'icon', 'color', 'chapters']
      }
    }
  },
  required: ['examName', 'subjects']
};

/**
 * Parses raw syllabus text using Google Gemini API with JSON schema enforcement.
 * Falls back to offline heuristic parser if no key or on network error.
 */
export async function parseSyllabusWithAi(
  rawText: string,
  examNameSuggestion: string = 'Custom Exam Target',
  options?: AiParserOptions
): Promise<{ result: ExtractedSyllabusResult; source: 'gemini' | 'heuristic'; errorNotice?: string }> {
  const apiKey = options?.apiKey || getStoredGeminiApiKey();

  // If no API key, use offline smart heuristic parser
  if (!apiKey) {
    options?.onProgress?.('Parsing syllabus structure using Smart Offline Engine...');
    const result = parseSyllabusHeuristically(rawText, examNameSuggestion);
    return {
      result,
      source: 'heuristic',
      errorNotice: 'Processed using Smart Offline Engine (Add free Gemini API Key in Settings for deep semantic reasoning).'
    };
  }

  const model = options?.model || 'gemini-1.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  options?.onProgress?.('Synthesizing academic hierarchy with Gemini AI...');

  try {
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Please analyze this raw syllabus and generate a complete, structured academic hierarchy for exam target "${examNameSuggestion}":\n\n${rawText}`
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: SYLLABUS_JSON_SCHEMA,
        temperature: 0.2
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[AiSyllabusParser] Gemini API responded with error:', errText);
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('No content returned from Gemini API');
    }

    const parsedJson = JSON.parse(candidateText);

    // Hydrate items with unique IDs
    const formattedSubjects: ExtractedSubjectItem[] = (parsedJson.subjects || []).map((sub: any) => ({
      id: generateUniqueId('sub'),
      name: sub.name || 'Core Subject',
      icon: sub.icon || '📚',
      color: sub.color || '#3b82f6',
      chapters: (sub.chapters || []).map((chap: any) => ({
        id: generateUniqueId('chap'),
        name: chap.name || 'Chapter Module',
        description: chap.description || '',
        topics: (chap.topics || []).map((top: any) => ({
          id: generateUniqueId('topic'),
          name: top.name || 'Topic Item',
          difficulty: ['Easy', 'Medium', 'Hard'].includes(top.difficulty) ? top.difficulty : 'Medium',
          weightage: Math.min(5, Math.max(1, top.weightage || 3)),
          subtopics: Array.isArray(top.subtopics) && top.subtopics.length > 0
            ? top.subtopics
            : [`${top.name} Foundations`, `${top.name} Questions & Tricks`]
        }))
      }))
    }));

    const finalResult: ExtractedSyllabusResult = {
      examName: parsedJson.examName || examNameSuggestion,
      targetYear: parsedJson.targetYear || new Date().getFullYear(),
      subjects: formattedSubjects
    };

    return {
      result: finalResult,
      source: 'gemini'
    };
  } catch (err: any) {
    console.error('[AiSyllabusParser] Failed with Gemini API, falling back to heuristic parser:', err);
    options?.onProgress?.('AI call encountered an issue. Falling back to Smart Offline Engine...');
    const fallbackResult = parseSyllabusHeuristically(rawText, examNameSuggestion);
    return {
      result: fallbackResult,
      source: 'heuristic',
      errorNotice: `Gemini API: ${err.message || 'Error'}. Successfully parsed using Offline Engine.`
    };
  }
}
