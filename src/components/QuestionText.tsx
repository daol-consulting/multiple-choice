type Segment = { type: 'text' | 'code'; content: string };

const CODE_PATTERNS: RegExp[] = [
  /[{};]/,
  /^\s*(int|void|char|float|double|bool|boolean|string|var|let|const|return|if|else|for|while|do|switch|case|break|continue|class|def|function|print|printf|println|cout|cin|static|public|private|protected|import|from|export|struct|enum|try|catch|throw|new|delete|unsigned|signed|long|short|typedef|sizeof|namespace|using|virtual|override|abstract|interface|extends|implements)\b/,
  /^\s*\w+\s*\([^)]*\)\s*[;{]?\s*$/,
  /→|::=/,
  /^\s*#\s*(include|define|ifdef|ifndef|endif|pragma)/,
  /^\s*[})\]]\s*$/,
];

function isCodeLike(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return CODE_PATTERNS.some(p => p.test(trimmed));
}

function findLastType(marks: ('code' | 'text' | 'empty')[], end: number): 'code' | 'text' | null {
  for (let i = end - 1; i >= 0; i--) {
    if (marks[i] !== 'empty') return marks[i] as 'code' | 'text';
  }
  return null;
}

function findNextType(marks: ('code' | 'text' | 'empty')[], start: number): 'code' | 'text' | null {
  for (let i = start; i < marks.length; i++) {
    if (marks[i] !== 'empty') return marks[i] as 'code' | 'text';
  }
  return null;
}

function segmentText(text: string): Segment[] {
  const lines = text.split('\n');

  const marks: ('code' | 'text' | 'empty')[] = lines.map(l => {
    if (!l.trim()) return 'empty';
    return isCodeLike(l.trim()) ? 'code' : 'text';
  });

  for (let i = 0; i < marks.length; i++) {
    if (marks[i] !== 'empty') continue;
    if (findLastType(marks, i) === 'code' && findNextType(marks, i + 1) === 'code') {
      marks[i] = 'code';
    }
  }

  const segments: Segment[] = [];
  let curType: 'code' | 'text' | null = null;
  let curLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const type: 'code' | 'text' = marks[i] === 'empty' ? (curType || 'text') : (marks[i] as 'code' | 'text');
    if (type !== curType && curLines.length > 0) {
      segments.push({ type: curType!, content: curLines.join('\n') });
      curLines = [];
    }
    curType = type;
    curLines.push(lines[i]);
  }

  if (curLines.length > 0 && curType) {
    segments.push({ type: curType, content: curLines.join('\n') });
  }

  return segments;
}

interface QuestionTextProps {
  text: string;
  className?: string;
}

export default function QuestionText({ text, className = '' }: QuestionTextProps) {
  const segments = segmentText(text);
  const hasCode = segments.some(s => s.type === 'code');

  if (!hasCode) {
    return (
      <p className={`whitespace-pre-wrap ${className}`}>
        {text}
      </p>
    );
  }

  return (
    <div className={className}>
      {segments.map((seg, i) => {
        const trimmed = seg.content.replace(/^\n+|\n+$/g, '');
        if (!trimmed) return null;

        return seg.type === 'code' ? (
          <pre
            key={i}
            className="bg-[#1e1e2e] text-[#cdd6f4] rounded-xl px-4 py-3 my-3 text-[13px] sm:text-sm font-mono leading-relaxed overflow-x-auto border border-[#313244] shadow-sm"
          >
            <code>{trimmed}</code>
          </pre>
        ) : (
          <p key={i} className="whitespace-pre-wrap leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}
