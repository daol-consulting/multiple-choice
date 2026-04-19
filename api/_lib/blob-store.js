import { del, get, list, put } from '@vercel/blob';

const INDEX_PATH = 'quiz/index.json';
const SET_PATH_PREFIX = 'quiz/sets/';

function nowIso() {
  return new Date().toISOString();
}

async function readJson(pathname, fallback) {
  const result = await get(pathname, { access: 'public' });
  if (!result || result.statusCode !== 200) return fallback;
  return new Response(result.stream).json();
}

async function writeJson(pathname, value) {
  await put(pathname, JSON.stringify(value), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
  });
}

export async function getIndex() {
  const index = await readJson(INDEX_PATH, { sets: [] });
  if (!index || !Array.isArray(index.sets)) return { sets: [] };
  return index;
}

export async function saveIndex(index) {
  await writeJson(INDEX_PATH, index);
}

export function createSetRecord({ title, description }) {
  const timestamp = nowIso();
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    description: description?.trim() || null,
    question_count: 0,
    attempt_count: 0,
    best_score: 0,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function setPath(id) {
  return `${SET_PATH_PREFIX}${id}.json`;
}

export async function getSetDocument(setId) {
  const empty = { quizSet: null, questions: [], attempts: [] };
  const data = await readJson(setPath(setId), empty);
  if (!data || !data.quizSet) return empty;
  return {
    quizSet: data.quizSet,
    questions: Array.isArray(data.questions) ? data.questions : [],
    attempts: Array.isArray(data.attempts) ? data.attempts : [],
  };
}

export async function saveSetDocument(setId, doc) {
  await writeJson(setPath(setId), doc);
}

export async function deleteSetDocument(setId) {
  const path = setPath(setId);
  const blobs = await list({ prefix: path, limit: 10 });
  const targets = blobs.blobs.map((blob) => blob.pathname);
  if (targets.length > 0) {
    await del(targets);
  }
}
