import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { parseQuestions, detectDuplicates } from '../lib/parser';
import type { DuplicateFlag } from '../lib/parser';
import type { ParsedQuestion, QuizSet } from '../types';
import { Upload, Check, AlertCircle, Eye, Loader2, FileText, Sparkles, Plus, MessageSquarePlus, Copy, AlertTriangle } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import QuestionText from '../components/QuestionText';

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
  const { t } = useLang();

  const [existingSet, setExistingSet] = useState<QuizSet | null>(null);
  const [existingTexts, setExistingTexts] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<ParsedQuestion[]>([]);
  const [dupFlags, setDupFlags] = useState<(DuplicateFlag | null)[]>([]);
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
      supabase.from('questions').select('question_text').eq('quiz_set_id', setId).then(({ data }) => {
        if (data) {
          setExistingTexts(data.map(q => q.question_text));
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
      setError(t('import_err_empty'));
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
        setError(t('import_err_parse'));
        setParseState('error');
        setParseProgress(0);
        return;
      }

      const flags = detectDuplicates(questions, existingTexts);
      setDupFlags(flags);

      setParseProgress(100);
      setParsed(questions);

      setTimeout(() => setParseState('done'), 300);
    }, 400);
  }

  async function handleSave() {
    if (!isAddMode && !title.trim()) {
      setError(t('import_err_title'));
      return;
    }
    if (parsed.length === 0) {
      setError(t('import_err_no_q'));
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
        setError(t('import_err_create') + (createErr?.message || 'Unknown error'));
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
      setError(t('import_err_save') + qError.message);
      setSaving(false);
      return;
    }

    navigate('/');
  }

  function removeQuestion(index: number) {
    const updated = parsed.filter((_, i) => i !== index);
    setParsed(updated);
    const newFlags = detectDuplicates(updated, existingTexts);
    setDupFlags(newFlags);
  }

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const dupCount = dupFlags.filter(f => f !== null).length;

  return (
    <div className="pb-20 sm:pb-0">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
        {isAddMode ? t('import_add_title') : t('import_title')}
      </h1>
      <p className="text-gray-500 text-sm sm:text-base mb-6">
        {isAddMode && existingSet
          ? <><span className="font-medium text-primary-600">{existingSet.title}</span>{t('import_add_subtitle_prefix')}{existingSet.question_count}{t('import_add_subtitle_suffix')}</>
          : t('import_subtitle')
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
                {t('import_label_title')} <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t('import_placeholder_title')}
                className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-base sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('import_label_desc')}
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('import_placeholder_desc')}
                className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-base sm:text-sm"
              />
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">
              {t('import_label_text')} <span className="text-danger-500">*</span>
            </label>
            <button
              onClick={() => setRawText(SAMPLE_TEXT)}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('import_fill_example')}
            </button>
          </div>
          <textarea
            value={rawText}
            onChange={e => { setRawText(e.target.value); setParseState('idle'); setParsed([]); setDupFlags([]); }}
            placeholder={t('import_placeholder_text')}
            rows={10}
            className="w-full px-3.5 py-3 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all font-mono text-sm resize-y min-h-[200px]"
          />
          {rawText.trim() && (
            <p className="text-xs text-gray-400 mt-1.5">
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              {rawText.trim().split('\n').length}{t('import_lines')}
            </p>
          )}
        </div>

        {parseState === 'parsing' && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
              <span className="text-sm font-medium text-gray-700">{t('import_analyzing')}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary-500 h-2.5 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${parseProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">{t('import_analyzing_desc')}</p>
          </div>
        )}

        {parseState !== 'parsing' && parseState !== 'done' && (
          <button
            onClick={handleParse}
            disabled={!rawText.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-3 sm:py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            <Eye className="w-5 h-5" />
            {t('import_preview')}
          </button>
        )}

        {parseState === 'done' && parsed.length > 0 && (
          <div ref={previewRef} className="space-y-5">
            <div className="bg-success-50 border border-success-500/20 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-success-600">{parsed.length}{t('import_detected')}</p>
                <p className="text-xs text-success-600/70 mt-0.5">
                  {isAddMode && existingSet
                    ? `${existingSet.title}${t('import_add_to')}`
                    : t('import_detected_sub')
                  }
                </p>
              </div>
            </div>

            {dupCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-700 font-medium">
                  {dupCount}{t('import_dup_count')}
                </p>
              </div>
            )}

            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              {t('import_preview')}
            </h2>
            <div className="space-y-3 max-h-[60vh] sm:max-h-[50vh] overflow-y-auto -mx-1 px-1 overscroll-contain">
              {parsed.map((q, i) => {
                const dup = dupFlags[i];

                return (
                  <div
                    key={i}
                    className={`bg-white rounded-xl p-3.5 sm:p-4 border ${
                      dup ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-primary-600 font-bold text-sm sm:text-base">Q{i + 1}.</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-primary-100 text-primary-700">
                        {t('import_type_mc')}
                      </span>
                      {dup && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5 ${
                          dup.type === 'exact'
                            ? 'bg-danger-100 text-danger-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {dup.type === 'exact' ? <Copy className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {dup.type === 'exact' ? t('import_dup_exact') : t('import_dup_similar')}
                        </span>
                      )}
                      {dup && (
                        <button
                          onClick={() => removeQuestion(i)}
                          className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 hover:bg-danger-100 hover:text-danger-600 transition-colors font-medium"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {dup && (
                      <div className={`text-xs px-2.5 py-1.5 rounded-lg mb-2 ${
                        dup.type === 'exact' ? 'bg-danger-50 text-danger-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {dup.source === 'existing'
                          ? <>
                              {t('import_dup_existing')}:
                              <span className="block mt-0.5 font-medium truncate">{dup.matchedWith.slice(0, 80)}{dup.matchedWith.length > 80 ? '...' : ''}</span>
                            </>
                          : <>{dup.matchedWith}{t('import_dup_batch')}</>
                        }
                      </div>
                    )}

                    <QuestionText text={q.question_text} className="font-medium text-gray-900 mb-2 text-sm sm:text-base" />

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
                    <div className="mt-2 ml-2 sm:ml-4">
                      <div className="flex items-center gap-1 mb-1">
                        <MessageSquarePlus className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400 font-medium">{t('import_explanation_label')}</span>
                      </div>
                      <textarea
                        value={q.explanation || ''}
                        onChange={e => {
                          const updated = [...parsed];
                          updated[i] = { ...updated[i], explanation: e.target.value || undefined };
                          setParsed(updated);
                        }}
                        placeholder={t('import_explanation_placeholder')}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20 outline-none text-xs sm:text-sm text-gray-700 resize-y bg-gray-50/50 placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-[#f8fafc] py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:relative sm:bg-transparent sm:py-0">
              <button
                onClick={handleSave}
                disabled={saving || (!isAddMode && !title.trim())}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3.5 sm:py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('import_saving')}
                  </>
                ) : (
                  <>
                    {isAddMode ? <Plus className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                    {parsed.length}{isAddMode ? t('import_add_btn') : t('import_save')}
                  </>
                )}
              </button>
              <button
                onClick={() => { setParseState('idle'); setParsed([]); setDupFlags([]); }}
                className="sm:flex-none flex items-center justify-center gap-2 text-gray-600 bg-gray-100 px-5 py-3 sm:py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors active:scale-[0.98]"
              >
                {t('import_retry')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
