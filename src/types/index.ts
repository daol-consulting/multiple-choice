export interface QuizSet {
  id: string;
  title: string;
  description: string | null;
  question_count: number;
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

export interface ParsedQuestion {
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
}
