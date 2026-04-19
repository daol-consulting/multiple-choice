import {
  createSetRecord,
  getIndex,
  saveIndex,
  saveSetDocument,
} from '../_lib/blob-store.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const index = await getIndex();
      const sets = [...index.sets].sort((a, b) => (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ));
      return res.status(200).json({ data: sets });
    }

    if (req.method === 'POST') {
      const { title, description } = req.body || {};
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required.' });
      }

      const index = await getIndex();
      const newSet = createSetRecord({ title, description });
      index.sets.push(newSet);
      await saveIndex(index);
      await saveSetDocument(newSet.id, {
        quizSet: newSet,
        questions: [],
        attempts: [],
      });

      return res.status(201).json({ data: newSet });
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
