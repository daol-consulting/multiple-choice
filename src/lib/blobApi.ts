import type { ParsedQuestion, QuizSet, Question } from '../types';

type QuizSetDoc = {
  quizSet: QuizSet;
  questions: Question[];
  attempts: Array<{
    id: string;
    quiz_set_id: string;
    total_questions: number;
    correct_answers: number;
    time_seconds: number | null;
    created_at: string;
    score: number;
  }>;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error || 'Request failed.');
  }
  return body as T;
}

export async function listQuizSets(): Promise<QuizSet[]> {
  const body = await request<{ data: QuizSet[] }>('/api/quiz-sets');
  return body.data;
}

export async function createQuizSet(input: { title: string; description?: string | null }): Promise<QuizSet> {
  const body = await request<{ data: QuizSet }>('/api/quiz-sets', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return body.data;
}

export async function getQuizSetDoc(setId: string): Promise<QuizSetDoc> {
  const body = await request<{ data: QuizSetDoc }>(`/api/quiz-sets/${setId}`);
  return body.data;
}

export async function appendQuestions(setId: string, parsed: ParsedQuestion[]): Promise<void> {
  await request<{ data: QuizSetDoc }>(`/api/quiz-sets/${setId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      questions: parsed.map((q) => ({
        question_text: q.question_text,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation || null,
      })),
    }),
  });
}

export async function saveAttempt(setId: string, attempt: {
  total_questions: number;
  correct_answers: number;
  time_seconds: number | null;
}): Promise<void> {
  await request<{ data: QuizSetDoc }>(`/api/quiz-sets/${setId}`, {
    method: 'PATCH',
    body: JSON.stringify({ attempt }),
  });
}

export async function deleteQuizSet(setId: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/quiz-sets/${setId}`, { method: 'DELETE' });
}
