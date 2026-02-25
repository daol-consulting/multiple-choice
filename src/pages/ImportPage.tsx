import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { parseQuestions } from '../lib/parser';
import type { ParsedQuestion, QuizSet } from '../types';
import { Upload, Check, AlertCircle, Eye, Loader2, FileText, Sparkles, Plus } from 'lucide-react';

const SAMPLE_TEXT = `1. What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid
Answer: B

2. Which planet is closest to the Sun?
A) Venus
B) Earth
C) Mercury
D) Mars
Answer: C

3. What is 2 + 2?
A) 3
B) 4
C) 5
D) 6
Answer: B`;

type ParseState = 'idle' | 'parsing' | 'done' | 'error';

export default function ImportPage() {
  const navigate = useNavigate();
  const { setId } = useParams<{ setId: string }>();
  const isAddMode = !!setId;

  const [existingSet, setExistingSet] = useState<QuizSet | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<ParsedQuestion[]>([]);
  const [parseState, setParseState] = useState<ParseState>('idle');
  const [parseProgress, setParseProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (setId) {
      supabase.from('quiz_sets').select('*').eq('id', setId).single().then(({ data }) => {
        if (data) {
          setExistingSet(data);
          setTitle(data.title);
          setDescription(data.description || '');
        }
      });
    }
  }, [setId]);

  useEffect(() => {
    if (parseState === 'done' && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [parseState]);

  function handleParse() {
    if (!rawText.trim()) {
      setError('문제 텍스트를 입력해주세요');
      setParseState('error');
      return;
    }

    setError('');
    setParseState('parsing');
    setParseProgress(0);

    const progressInterval = setInterval(() => {
      setParseProgress(prev => {
        if (prev >= 90) { clearInterval(progressInterval); return 90; }
        return prev + Math.random() * 25;
      });
    }, 80);

    setTimeout(() => {
      const questions = parseQuestions(rawText);
      clearInterval(progressInterval);

      if (questions.length === 0) {
        setError('파싱할 수 있는 문제를 찾지 못했습니다. 형식을 확인해주세요.');
        setParseState('error');
        setParseProgress(0);
        return;
      }

      setParseProgress(100);
      setParsed(questions);

      setTimeout(() => setParseState('done'), 300);
    }, 400);
  }

  async function handleSave() {
    if (!isAddMode && !title.trim()) {
      setError('제목을 입력해주세요');
      return;
    }
    if (parsed.length === 0) {
      setError('저장할 문제가 없습니다');
      return;
    }

    setSaving(true);
    setError('');

    let targetSetId = setId;

    if (!isAddMode) {
      const { data: quizSet, error: createErr } = await supabase
        .from('quiz_sets')
        .insert({ title: title.trim(), description: description.trim() || null })
        .select()
        .single();

      if (createErr || !quizSet) {
        setError('문제 세트 생성 실패: ' + (createErr?.message || '알 수 없는 오류'));
        setSaving(false);
        return;
      }
      targetSetId = quizSet.id;
    }

    const questions = parsed.map(q => ({
      quiz_set_id: targetSetId!,
      question_text: q.question_text,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation || null,
    }));

    const { error: qError } = await supabase.from('questions').insert(questions);

    if (qError) {
      setError('문제 저장 실패: ' + qError.message);
      setSaving(false);
      return;
    }

    navigate('/');
  }

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  return (
    <div className="pb-20 sm:pb-0">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
        {isAddMode ? '문제 추가하기' : '문제 가져오기'}
      </h1>
      <p className="text-gray-500 text-sm sm:text-base mb-6">
        {isAddMode && existingSet
          ? <><span className="font-medium text-primary-600">{existingSet.title}</span>에 문제를 추가합니다 (현재 {existingSet.question_count}문제)</>
          : 'ChatGPT에서 생성한 객관식 문제를 붙여넣기 하세요'
        }
      </p>

      {error && (
        <div className="bg-danger-50 border border-danger-500/20 text-danger-600 px-3 sm:px-4 py-3 rounded-xl mb-5 flex items-start gap-2 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-5">
        {!isAddMode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                제목 <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="예: 컴퓨터네트워크 중간고사"
                className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                설명 (선택)
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="예: Chapter 1~5 범위"
                className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-base sm:text-sm"
              />
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">
              문제 텍스트 <span className="text-danger-500">*</span>
            </label>
            <button
              onClick={() => setRawText(SAMPLE_TEXT)}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              예시 채우기
            </button>
          </div>
          <textarea
            value={rawText}
            onChange={e => { setRawText(e.target.value); setParseState('idle'); setParsed([]); }}
            placeholder={`ChatGPT에서 복사한 문제를 여기에 붙여넣기 하세요...\n\n예시 형식:\n1. What is the capital of France?\nA) London\nB) Paris\nC) Berlin\nD) Madrid\nAnswer: B`}
            rows={10}
            className="w-full px-3.5 py-3 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all font-mono text-sm resize-y min-h-[200px]"
          />
          {rawText.trim() && (
            <p className="text-xs text-gray-400 mt-1.5">
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              {rawText.trim().split('\n').length}줄 입력됨
            </p>
          )}
        </div>

        {parseState === 'parsing' && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
              <span className="text-sm font-medium text-gray-700">문제 분석 중...</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary-500 h-2.5 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${parseProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">텍스트에서 문제, 선택지, 정답을 추출하고 있습니다</p>
          </div>
        )}

        {parseState !== 'parsing' && parseState !== 'done' && (
          <button
            onClick={handleParse}
            disabled={!rawText.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-3 sm:py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            <Eye className="w-5 h-5" />
            미리보기
          </button>
        )}

        {parseState === 'done' && parsed.length > 0 && (
          <div ref={previewRef} className="space-y-5">
            <div className="bg-success-50 border border-success-500/20 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-success-600">{parsed.length}개 문제 감지 완료!</p>
                <p className="text-xs text-success-600/70 mt-0.5">
                  {isAddMode && existingSet
                    ? `${existingSet.title}에 추가됩니다`
                    : '아래에서 파싱된 문제를 확인하세요'
                  }
                </p>
              </div>
            </div>

            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              미리보기
            </h2>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto -mx-1 px-1">
              {parsed.map((q, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4">
                  <p className="font-medium text-gray-900 mb-2 text-sm sm:text-base leading-relaxed">
                    <span className="text-primary-600 mr-1.5 font-bold">Q{i + 1}.</span>
                    {q.question_text}
                  </p>
                  <div className="space-y-1 ml-2 sm:ml-4">
                    {q.options.map((opt, j) => (
                      <div
                        key={j}
                        className={`text-sm py-1.5 px-2.5 rounded-lg ${
                          j === q.correct_index
                            ? 'bg-success-50 text-success-600 font-medium'
                            : 'text-gray-600'
                        }`}
                      >
                        <span className="font-medium mr-1">{optionLabels[j]}.</span> {opt}
                        {j === q.correct_index && <Check className="w-3.5 h-3.5 inline ml-1.5" />}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="text-xs text-gray-500 mt-2 ml-2 sm:ml-4 bg-gray-50 p-2 rounded-lg">
                      💡 {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-[#f8fafc] py-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:relative sm:bg-transparent sm:py-0">
              <button
                onClick={handleSave}
                disabled={saving || (!isAddMode && !title.trim())}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3.5 sm:py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    {isAddMode ? <Plus className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                    {parsed.length}개 문제 {isAddMode ? '추가하기' : '저장하기'}
                  </>
                )}
              </button>
              <button
                onClick={() => { setParseState('idle'); setParsed([]); }}
                className="sm:flex-none flex items-center justify-center gap-2 text-gray-600 bg-gray-100 px-5 py-3 sm:py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors active:scale-[0.98]"
              >
                다시 입력
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
