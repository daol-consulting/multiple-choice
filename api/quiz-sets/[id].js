import {
  deleteSetDocument,
  getIndex,
  getSetDocument,
  saveIndex,
  saveSetDocument,
} from '../_lib/blob-store.js';

function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

function normalizeQuestion(raw, setId) {
  return {
    id: crypto.randomUUID(),
    quiz_set_id: setId,
    question_text: raw.question_text,
    options: raw.options,
    correct_index: raw.correct_index,
    explanation: raw.explanation ?? null,
    created_at: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  const setId = req.query.id;
  if (!setId) return res.status(400).json({ error: 'Set id is required.' });

  try {
    const index = await getIndex();
    const setIndex = index.sets.findIndex((item) => item.id === setId);
    if (setIndex === -1) {
      return res.status(404).json({ error: 'Quiz set not found.' });
    }

    if (req.method === 'GET') {
      const doc = await getSetDocument(setId);
      return res.status(200).json({ data: doc });
    }

    if (req.method === 'DELETE') {
      index.sets.splice(setIndex, 1);
      await saveIndex(index);
      await deleteSetDocument(setId);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'PATCH') {
      const { questions, attempt } = parseBody(req.body);
      const doc = await getSetDocument(setId);
      const now = new Date().toISOString();

      if (Array.isArray(questions) && questions.length > 0) {
        const normalized = questions.map((q) => normalizeQuestion(q, setId));
        doc.questions = [...doc.questions, ...normalized];
        doc.quizSet.question_count = doc.questions.length;
      }

      if (attempt && typeof attempt.correct_answers === 'number' && typeof attempt.total_questions === 'number') {
        const score = attempt.total_questions > 0
          ? Math.round((attempt.correct_answers / attempt.total_questions) * 100)
          : 0;
        doc.attempts.push({
          id: crypto.randomUUID(),
          quiz_set_id: setId,
          total_questions: attempt.total_questions,
          correct_answers: attempt.correct_answers,
          time_seconds: attempt.time_seconds ?? null,
          created_at: now,
          score,
        });
        doc.quizSet.attempt_count = doc.attempts.length;
        doc.quizSet.best_score = Math.max(doc.quizSet.best_score || 0, score);
      }

      doc.quizSet.updated_at = now;
      index.sets[setIndex] = doc.quizSet;
      await Promise.all([saveSetDocument(setId, doc), saveIndex(index)]);
      return res.status(200).json({ data: doc });
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
