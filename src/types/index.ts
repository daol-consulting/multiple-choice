export interface QuizSet {
  id: string;
  title: string;
  description: string | null;
  question_count: number;
  attempt_count?: number;
  best_score?: number;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  quiz_set_id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_set_id: string;
  total_questions: number;
  correct_answers: number;
  time_seconds: number | null;
  created_at: string;
}

export type QuestionType = 'mc' | 'subjective';

export interface ParsedQuestion {
  type: QuestionType;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation?: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedIndex: number | null;
  correctIndex: number;
  isCorrect: boolean;
  skipped?: boolean;
  userText?: string;
}

export function isSubjective(q: Question | ParsedQuestion): boolean {
  return q.options.length === 0 || q.correct_index === -1;
}
