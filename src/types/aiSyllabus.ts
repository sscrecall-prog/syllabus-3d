import { DifficultyLevel } from './syllabus';

export interface ExtractedTopicItem {
  id: string;
  name: string;
  difficulty: DifficultyLevel;
  weightage: number; // 1 to 5
  subtopics: string[];
}

export interface ExtractedChapterItem {
  id: string;
  name: string;
  description?: string;
  topics: ExtractedTopicItem[];
}

export interface ExtractedSubjectItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  chapters: ExtractedChapterItem[];
}

export interface ExtractedSyllabusResult {
  examName: string;
  targetYear?: number;
  examDate?: string;
  subjects: ExtractedSubjectItem[];
}

export type AiArchitectStep = 'input' | 'processing' | 'review' | 'success';

export type AiArchitectInputMode = 'text' | 'pdf';

export type AiArchitectEngineMode = 'gemini' | 'heuristic';

export interface AiParserOptions {
  apiKey?: string;
  model?: string;
  onProgress?: (status: string, percent?: number) => void;
}
