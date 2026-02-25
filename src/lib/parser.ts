import type { ParsedQuestion } from '../types';

export function parseQuestions(text: string): ParsedQuestion[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = splitIntoQuestionBlocks(normalized);
  const questions: ParsedQuestion[] = [];

  for (const block of blocks) {
    const parsed = parseMCQuestion(block) ?? parseSubjectiveQuestion(block);
    if (parsed) {
      questions.push(parsed);
    }
  }

  return questions;
}

const QUESTION_START = /^\s*\*{0,2}(?:Q|q|문제\s*)?(\d+)\s*(?:[().:\s—\-–]|$)/;

function splitIntoQuestionBlocks(text: string): string[] {
  const lines = text.split('\n');
  const blocks: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (QUESTION_START.test(line) && current.length > 0) {
      blocks.push(current.join('\n'));
      current = [];
    }
    current.push(line);
  }

  if (current.length > 0) {
    blocks.push(current.join('\n'));
  }

  if (blocks.length <= 1 && text.includes('\n\n')) {
    const altBlocks = text.split(/\n{2,}/).filter(b => b.trim().length > 0);
    if (altBlocks.length > 1) return altBlocks;
  }

  return blocks.filter(b => b.trim().length > 0);
}

// Uppercase A-H: allow space as delimiter (A London, B Paris)
const OPTION_UPPER = /^\s*\*{0,2}\(?([A-H])[).:\]\s]\)?\s*\*{0,2}\s*(.+)/;
// Lowercase a-h: require punctuation delimiter only (a) text, b. text) — no bare space
const OPTION_LOWER = /^\s*\*{0,2}\(?([a-h])[).:\]]\)?\s*\*{0,2}\s*(.+)/;

function matchOption(line: string) {
  return line.match(OPTION_UPPER) || line.match(OPTION_LOWER);
}

function isOptionLine(line: string) {
  return OPTION_UPPER.test(line) || OPTION_LOWER.test(line);
}

const ANSWER_PATTERN = /^(?:\*{0,2})(?:Answer|정답|답|답안|Correct)\s*[:\s)]/i;
const EXPLANATION_PATTERN = /^(?:\*{0,2})(?:Explanation|설명|해설|풀이|Reason|이유|Note|참고|Hint|힌트)\s*[):]/i;

function hasAnswerMarker(block: string): boolean {
  return /(?:Answer|정답|답|답안|Correct)\s*[:\s)]*\s*\(?[A-Ha-h]\)?/i.test(block)
    || /[✓✅]|\(correct\)|\(정답\)/i.test(block);
}

function parseMCQuestion(block: string): ParsedQuestion | null {
  if (!hasAnswerMarker(block)) return null;

  const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 3) return null;

  let questionText = lines[0]
    .replace(/^\s*\*{0,2}(?:Q|q|문제\s*)?\d+\s*[().:\s—\-–]*\s*\*{0,2}\s*/, '')
    .replace(/\*{2}/g, '')
    .trim();

  const options: string[] = [];
  const optionLetters: string[] = [];
  let answerLine: string | null = null;
  let explanationLine: string | null = null;
  let foundFirstOption = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    if (ANSWER_PATTERN.test(line)) {
      answerLine = line;
      foundFirstOption = true;
      continue;
    }

    if (EXPLANATION_PATTERN.test(line)) {
      explanationLine = lines.slice(i).join('\n')
        .replace(/^(?:\*{0,2})(?:Explanation|설명|해설|풀이|Reason|이유|Note|참고|Why|Hint|힌트)\s*[:\s)]\s*/i, '')
        .replace(/\*{2}/g, '')
        .trim();
      break;
    }

    if (answerLine && !isOptionLine(line)) {
      explanationLine = lines.slice(i).join('\n').replace(/\*{2}/g, '').trim();
      break;
    }

    const optMatch = matchOption(line);
    if (optMatch && (questionText || foundFirstOption)) {
      foundFirstOption = true;
      const letter = optMatch[1].toUpperCase();
      const optText = optMatch[2].replace(/\*{2}/g, '').trim();
      optionLetters.push(letter);
      options.push(optText);
    } else if (!foundFirstOption) {
      questionText = questionText ? questionText + '\n' + line : line;
    }
  }

  if (!questionText || options.length < 2) return null;

  let correctIndex = -1;

  if (answerLine) {
    const ansMatch = answerLine.match(/(?:Answer|정답|답|답안|Correct)\s*[:\s)]*\s*\(?([A-Ha-h])\)?/i);
    if (ansMatch) {
      correctIndex = optionLetters.indexOf(ansMatch[1].toUpperCase());
    }
  }

  if (correctIndex === -1) {
    for (let i = 0; i < options.length; i++) {
      if (/[✓✅]|\(correct\)|\(정답\)/i.test(options[i])) {
        correctIndex = i;
        options[i] = options[i]
          .replace(/[✓✅]/g, '')
          .replace(/\(correct\)/gi, '')
          .replace(/\(정답\)/g, '')
          .trim();
        break;
      }
    }
  }

  if (correctIndex === -1) {
    const blockMatch = block.match(/(?:Answer|정답|답)\s*[:\s]*\(?([A-Ha-h])\)?/i);
    if (blockMatch) {
      correctIndex = optionLetters.indexOf(blockMatch[1].toUpperCase());
    }
  }

  if (correctIndex === -1) correctIndex = 0;

  return {
    type: 'mc',
    question_text: questionText,
    options,
    correct_index: correctIndex,
    explanation: explanationLine || undefined,
  };
}

const SUBJ_ANSWER_PATTERN = /^(?:\*{0,2})(?:Answer|정답|답|답안|Correct|해설|설명|풀이|Explanation)\s*[:\s)]/i;

function parseSubjectiveQuestion(block: string): ParsedQuestion | null {
  const rawLines = block.split('\n');
  const nonEmpty = rawLines.filter(l => l.trim().length > 0);
  if (nonEmpty.length < 2) return null;

  const titleLine = nonEmpty[0]
    .replace(/^\s*\*{0,2}(?:Q|q|문제\s*)?\d+\s*[().:\s—\-–]*\s*\*{0,2}\s*/, '')
    .replace(/\*{2}/g, '')
    .trim();

  const firstNewline = block.indexOf('\n');
  if (firstNewline === -1) return null;

  const bodyRaw = block.slice(firstNewline + 1);

  let questionBody = '';
  let explanation: string | undefined;

  const bodyLines = bodyRaw.split('\n');
  let answerStartIdx = -1;

  for (let i = 0; i < bodyLines.length; i++) {
    if (SUBJ_ANSWER_PATTERN.test(bodyLines[i].trim())) {
      answerStartIdx = i;
      break;
    }
  }

  if (answerStartIdx !== -1) {
    questionBody = bodyLines.slice(0, answerStartIdx).join('\n');

    const answerRaw = bodyLines.slice(answerStartIdx).join('\n');
    explanation = answerRaw
      .replace(SUBJ_ANSWER_PATTERN, '')
      .replace(/^\n+/, '')
      .replace(/\n+$/, '')
      .trim();

    if (!explanation) {
      explanation = bodyLines.slice(answerStartIdx + 1).join('\n').trim() || undefined;
    }
  } else {
    questionBody = bodyRaw;
  }

  questionBody = questionBody.replace(/^\n+/, '').replace(/\n+$/, '');

  const fullText = titleLine
    ? (questionBody ? titleLine + '\n\n' + questionBody : titleLine)
    : questionBody;

  if (!fullText.trim()) return null;

  return {
    type: 'subjective',
    question_text: fullText,
    options: [],
    correct_index: -1,
    explanation,
  };
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): Set<string> {
  return new Set(normalizeText(text).split(' ').filter(w => w.length > 1));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export type DuplicateFlag = {
  type: 'exact' | 'similar';
  matchedWith: string;
  source: 'batch' | 'existing';
};

export function detectDuplicates(
  newQuestions: { question_text: string }[],
  existingTexts: string[],
): (DuplicateFlag | null)[] {
  const results: (DuplicateFlag | null)[] = new Array(newQuestions.length).fill(null);

  const newNormalized = newQuestions.map(q => normalizeText(q.question_text));
  const newTokens = newQuestions.map(q => tokenize(q.question_text));
  const existingNormalized = existingTexts.map(normalizeText);
  const existingTokens = existingTexts.map(t => tokenize(t));

  for (let i = 0; i < newQuestions.length; i++) {
    for (let j = 0; j < existingNormalized.length; j++) {
      if (newNormalized[i] === existingNormalized[j]) {
        results[i] = { type: 'exact', matchedWith: existingTexts[j], source: 'existing' };
        break;
      }
      const sim = jaccardSimilarity(newTokens[i], existingTokens[j]);
      if (sim >= 0.7) {
        results[i] = { type: 'similar', matchedWith: existingTexts[j], source: 'existing' };
        break;
      }
    }
    if (results[i]) continue;

    for (let j = 0; j < i; j++) {
      if (newNormalized[i] === newNormalized[j]) {
        results[i] = { type: 'exact', matchedWith: `Q${j + 1}`, source: 'batch' };
        break;
      }
      const sim = jaccardSimilarity(newTokens[i], newTokens[j]);
      if (sim >= 0.7) {
        results[i] = { type: 'similar', matchedWith: `Q${j + 1}`, source: 'batch' };
        break;
      }
    }
  }

  return results;
}
