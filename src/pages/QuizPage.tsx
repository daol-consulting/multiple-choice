import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { shuffleArray } from '../lib/parser';
import type { Question, QuizSet, QuizAnswer } from '../types';
import { isSubjective } from '../types';
import { ChevronRight, Check, X, RotateCcw, Trophy, ArrowLeft, Clock, BookOpen, Shuffle, Eye, SkipForward, Minus, AlertTriangle } from 'lucide-react';
import { useLang } from '../contexts/LangContext';

const PRESET_COUNTS = [10, 30, 50, 100];

export default function QuizPage() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const { t } = useLang();

  const [quizSet, setQuizSet] = useState<QuizSet | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [originalTotal, setOriginalTotal] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shuffledOptions, setShuffledOptions] = useState<{ text: string; originalIndex: number }[]>([]);
  const startTimeRef = useRef(Date.now());

  const [showSubjAnswer, setShowSubjAnswer] = useState(false);
  const [subjText, setSubjText] = useState('');
  const [skippedOnce, setSkippedOnce] = useState<Set<string>>(new Set());

  const loadQuiz = useCallback(async () => {
    if (!setId) return;
    setLoading(true);

    const [setRes, qRes] = await Promise.all([
      supabase.from('quiz_sets').select('*').eq('id', setId).single(),
      supabase.from('questions').select('*').eq('quiz_set_id', setId),
    ]);

    if (setRes.data) setQuizSet(setRes.data);
    if (qRes.data) setAllQuestions(qRes.data);
    setLoading(false);
  }, [setId]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      const q = questions[currentIndex];
      if (!isSubjective(q)) {
        const opts = q.options.map((text: string, i: number) => ({ text, originalIndex: i }));
        setShuffledOptions(shuffleArray(opts));
      }
    }
  }, [currentIndex, questions]);

  function startQuiz(count: number) {
    const shuffled = shuffleArray([...allQuestions]);
    const selected = shuffled.slice(0, count);
    setQuestions(selected);
    setOriginalTotal(selected.length);
    setQuizStarted(true);
    startTimeRef.current = Date.now();
  }

  function handleSelect(shuffledIndex: number) {
    if (answered) return;
    setSelectedOption(shuffledIndex);
  }

  function handleConfirm() {
    if (selectedOption === null) return;
    const question = questions[currentIndex];
    const selected = shuffledOptions[selectedOption];
    const isCorrect = selected.originalIndex === question.correct_index;

    setAnswered(true);
    setAnswers(prev => [...prev, {
      questionId: question.id,
      selectedIndex: selected.originalIndex,
      correctIndex: question.correct_index,
      isCorrect,
    }]);
  }

  function handleSubjSelfGrade(correct: boolean) {
    const question = questions[currentIndex];
    setAnswered(true);
    setAnswers(prev => [...prev, {
      questionId: question.id,
      selectedIndex: null,
      correctIndex: -1,
      isCorrect: correct,
      userText: subjText || undefined,
    }]);
  }

  function handleSkip() {
    const question = questions[currentIndex];

    if (!skippedOnce.has(question.id)) {
      setSkippedOnce(prev => new Set(prev).add(question.id));
      setQuestions(prev => [...prev, question]);
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowSubjAnswer(false);
      setSubjText('');
    } else {
      setAnswered(true);
      setAnswers(prev => [...prev, {
        questionId: question.id,
        selectedIndex: null,
        correctIndex: question.correct_index,
        isCorrect: false,
        skipped: true,
      }]);
    }
  }

  function advanceToNext() {
    if (currentIndex + 1 >= questions.length) {
      finishQuiz();
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setAnswered(false);
      setShowSubjAnswer(false);
      setSubjText('');
    }
  }

  async function finishQuiz() {
    setFinished(true);

    const finalAnswers = answers;
    const correct = finalAnswers.filter(a => a.isCorrect).length;
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);

    await supabase.from('quiz_attempts').insert({
      quiz_set_id: setId,
      total_questions: originalTotal,
      correct_answers: correct,
      time_seconds: elapsed,
    });
  }

  function handleRestart() {
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswered(false);
    setAnswers([]);
    setFinished(false);
    setQuizStarted(false);
    setShowSubjAnswer(false);
    setSubjText('');
    setSkippedOnce(new Set());
    setOriginalTotal(0);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!quizSet || allQuestions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">{t('quiz_no_questions')}</p>
        <button onClick={() => navigate('/')} className="text-primary-600 font-medium hover:underline">
          {t('quiz_go_home_link')}
        </button>
      </div>
    );
  }

  if (!quizStarted) {
    const total = allQuestions.length;
    const availableCounts = PRESET_COUNTS.filter(n => n < total);

    return (
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm p-1 -ml-1 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('quiz_back')}
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-8 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{quizSet.title}</h2>
          {quizSet.description && (
            <p className="text-gray-500 text-sm mb-2">{quizSet.description}</p>
          )}
          <p className="text-gray-400 text-sm mb-6 sm:mb-8">
            {t('quiz_total')} <span className="font-semibold text-gray-600">{total}</span>{t('quiz_total_suffix')}
          </p>

          <p className="text-sm font-medium text-gray-700 mb-3 text-left">{t('quiz_how_many')}</p>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-4">
            {availableCounts.map(count => (
              <button
                key={count}
                onClick={() => startQuiz(count)}
                className="flex flex-col items-center gap-1 py-4 sm:py-5 rounded-xl border-2 border-gray-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all active:scale-[0.97]"
              >
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">{count}</span>
                <span className="text-xs text-gray-500">{t('quiz_questions')}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => startQuiz(total)}
            className="w-full flex items-center justify-center gap-2 py-4 sm:py-5 rounded-xl border-2 border-primary-500 bg-primary-50 hover:bg-primary-100 transition-all active:scale-[0.98]"
          >
            <Shuffle className="w-5 h-5 text-primary-600" />
            <span className="font-bold text-primary-700 text-lg">{t('quiz_all')} {total}{t('quiz_total_suffix')}</span>
          </button>

          <p className="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
            <Shuffle className="w-3.5 h-3.5" />
            {t('quiz_shuffle_note')}
          </p>
        </div>
      </div>
    );
  }

  /* ==================== RESULT SCREEN ==================== */
  if (finished) {
    const correct = answers.filter(a => a.isCorrect).length;
    const skippedCount = answers.filter(a => a.skipped).length;
    const total = originalTotal;
    const percent = Math.round((correct / total) * 100);
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const optLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    const answeredQuestionIds = new Set<string>();
    const deduped: { answer: QuizAnswer; question: Question }[] = [];
    for (const answer of answers) {
      if (!answeredQuestionIds.has(answer.questionId)) {
        answeredQuestionIds.add(answer.questionId);
        const q = questions.find(qq => qq.id === answer.questionId);
        if (q) deduped.push({ answer, question: q });
      }
    }

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 text-center mb-5 sm:mb-6">
          <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center ${
            percent >= 80 ? 'bg-success-50' : percent >= 60 ? 'bg-warning-50' : 'bg-danger-50'
          }`}>
            <Trophy className={`w-8 h-8 sm:w-10 sm:h-10 ${
              percent >= 80 ? 'text-success-500' : percent >= 60 ? 'text-warning-500' : 'text-danger-500'
            }`} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5">{t('quiz_done')}</h2>
          <p className="text-gray-500 text-sm mb-3 sm:mb-4">{quizSet.title}</p>
          <div className="text-4xl sm:text-5xl font-bold mb-2" style={{
            color: percent >= 80 ? '#16a34a' : percent >= 60 ? '#f59e0b' : '#dc2626'
          }}>
            {percent}%
          </div>
          <p className="text-gray-600 text-sm sm:text-base mb-1">
            {total}{t('quiz_correct_of')} {correct}{t('quiz_correct_count')}
            {skippedCount > 0 && <span className="text-gray-400 ml-1">({t('quiz_skip')} {skippedCount})</span>}
          </p>
          <p className="text-xs sm:text-sm text-gray-400 flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {minutes > 0 ? `${minutes}m ` : ''}{seconds}s
          </p>
        </div>

        <div className="space-y-2.5 sm:space-y-3 mb-5 sm:mb-6">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{t('quiz_review')}</h3>
          {deduped.map(({ answer, question }, i) => {
            const subjective = isSubjective(question);

            const borderColor = answer.skipped
              ? 'border-gray-300'
              : answer.isCorrect
              ? 'border-success-500/30'
              : 'border-danger-500/30';

            return (
              <div key={i} className={`bg-white rounded-xl border p-3 sm:p-4 ${borderColor}`}>
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    answer.skipped
                      ? 'bg-gray-400'
                      : answer.isCorrect
                      ? 'bg-success-500'
                      : 'bg-danger-500'
                  }`}>
                    {answer.skipped
                      ? <Minus className="w-3 h-3 text-white" />
                      : answer.isCorrect
                      ? <Check className="w-3 h-3 text-white" />
                      : <X className="w-3 h-3 text-white" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    {answer.skipped && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500 mb-1 inline-block">
                        {t('quiz_skipped')}
                      </span>
                    )}
                    <pre className="font-sans font-medium text-gray-900 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{question.question_text}</pre>

                    {subjective ? (
                      <div className="mt-1.5 sm:mt-2">
                        {answer.userText && (
                          <div className="text-xs sm:text-sm text-gray-600 bg-gray-50 rounded-lg p-2.5 mb-1.5">
                            <span className="font-medium text-gray-500">{t('quiz_write_answer')}:</span>
                            <pre className="font-sans whitespace-pre-wrap mt-1">{answer.userText}</pre>
                          </div>
                        )}
                        {question.explanation && (
                          <div className="text-xs sm:text-sm text-amber-700 bg-amber-50 rounded-lg p-2.5 mt-1">
                            <span className="font-medium">{t('quiz_model_answer')}:</span>
                            <pre className="font-sans whitespace-pre-wrap mt-1">{question.explanation}</pre>
                          </div>
                        )}
                        {!answer.skipped && (
                          <p className="text-xs text-gray-400 mt-1 italic">{t('quiz_self_assessed')}</p>
                        )}
                      </div>
                    ) : (
                      <>
                        {answer.skipped ? (
                          <p className="text-success-600 text-xs sm:text-sm mt-1">
                            {t('quiz_correct_answer')}: {optLabels[answer.correctIndex]} - {question.options[answer.correctIndex]}
                          </p>
                        ) : !answer.isCorrect ? (
                          <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm space-y-0.5">
                            <p className="text-danger-600">
                              {t('quiz_my_answer')}: {optLabels[answer.selectedIndex!]} - {question.options[answer.selectedIndex!]}
                            </p>
                            <p className="text-success-600">
                              {t('quiz_correct_answer')}: {optLabels[answer.correctIndex]} - {question.options[answer.correctIndex]}
                            </p>
                          </div>
                        ) : (
                          <p className="text-success-600 text-xs sm:text-sm mt-1">
                            {t('quiz_correct_answer')}: {optLabels[answer.correctIndex]} - {question.options[answer.correctIndex]}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 sticky bottom-0 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-0 sm:relative pt-2 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-transparent -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-none">
          <button
            onClick={handleRestart}
            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-3.5 sm:py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-lg sm:shadow-sm active:scale-[0.98] min-h-[48px]"
          >
            <RotateCcw className="w-5 h-5" />
            {t('quiz_restart')}
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-700 py-3.5 sm:py-3 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-colors shadow-lg sm:shadow-sm active:scale-[0.98] min-h-[48px]"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('quiz_go_home')}
          </button>
        </div>
      </div>
    );
  }

  /* ==================== QUESTION SCREEN ==================== */
  const question = questions[currentIndex];
  const subjective = isSubjective(question);
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const displayNum = Math.min(answers.length + 1, originalTotal);
  const progress = (answers.length / originalTotal) * 100;
  const wasSkippedBefore = skippedOnce.has(question.id);

  return (
    <div className="max-w-2xl mx-auto flex flex-col min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm p-1 -ml-1"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('quiz_exit')}
        </button>
        <span className="text-sm font-medium text-gray-500 tabular-nums">
          {displayNum} / {originalTotal}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mb-5 sm:mb-8">
        <div
          className="bg-primary-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {wasSkippedBefore && !answered && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2.5 rounded-xl mb-4 text-xs sm:text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{t('quiz_skipped_once')}</span>
        </div>
      )}

      {subjective ? (
        /* ---- SUBJECTIVE QUESTION ---- */
        <>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                {t('import_type_subjective')}
              </span>
            </div>

            <pre className="font-sans text-base sm:text-lg font-semibold text-gray-900 mb-5 sm:mb-6 leading-relaxed whitespace-pre-wrap">
              {question.question_text}
            </pre>

            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">{t('quiz_write_answer')}</label>
              <textarea
                value={subjText}
                onChange={e => setSubjText(e.target.value)}
                placeholder={t('quiz_write_answer_placeholder')}
                rows={5}
                disabled={answered}
                className="w-full px-3.5 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20 outline-none text-sm text-gray-700 resize-y bg-gray-50/50 placeholder:text-gray-300 disabled:opacity-60 disabled:bg-gray-100"
              />
            </div>

            {showSubjAnswer && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {t('quiz_model_answer')}
                </p>
                {question.explanation ? (
                  <pre className="font-sans text-sm sm:text-base text-amber-900 leading-relaxed whitespace-pre-wrap">
                    {question.explanation}
                  </pre>
                ) : (
                  <p className="text-sm text-amber-600 italic">{t('quiz_no_model')}</p>
                )}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-0 sm:relative pt-2 space-y-2.5 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-transparent -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-none">
            {!showSubjAnswer && !answered ? (
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowSubjAnswer(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white px-5 py-3.5 sm:py-3 rounded-xl font-medium hover:bg-amber-600 transition-colors shadow-lg sm:shadow-sm active:scale-[0.98] min-h-[48px]"
                >
                  <Eye className="w-5 h-5" />
                  {t('quiz_show_answer')}
                </button>
                <button
                  onClick={handleSkip}
                  className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-500 px-4 py-3.5 sm:py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors active:scale-[0.98] min-h-[48px]"
                >
                  <SkipForward className="w-4 h-4" />
                  {t('quiz_skip')}
                </button>
              </div>
            ) : !answered ? (
              <div className="flex gap-2.5">
                <button
                  onClick={() => handleSubjSelfGrade(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-success-500 text-white px-5 py-3.5 sm:py-3 rounded-xl font-medium hover:bg-success-600 transition-colors shadow-lg sm:shadow-sm active:scale-[0.98] min-h-[48px]"
                >
                  <Check className="w-5 h-5" />
                  {t('quiz_self_correct')}
                </button>
                <button
                  onClick={() => handleSubjSelfGrade(false)}
                  className="flex-1 flex items-center justify-center gap-2 bg-danger-500 text-white px-5 py-3.5 sm:py-3 rounded-xl font-medium hover:bg-danger-600 transition-colors shadow-lg sm:shadow-sm active:scale-[0.98] min-h-[48px]"
                >
                  <X className="w-5 h-5" />
                  {t('quiz_self_wrong')}
                </button>
              </div>
            ) : (
              <button
                onClick={advanceToNext}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3.5 sm:py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-lg sm:shadow-sm active:scale-[0.98] min-h-[48px]"
              >
                {currentIndex + 1 >= questions.length ? t('quiz_view_result') : t('quiz_next')}
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </>
      ) : (
        /* ---- MC QUESTION ---- */
        <>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6 flex-1">
            <pre className="font-sans text-base sm:text-lg font-semibold text-gray-900 mb-5 sm:mb-6 leading-relaxed whitespace-pre-wrap">
              {question.question_text}
            </pre>

            <div className="space-y-2.5 sm:space-y-3">
              {shuffledOptions.map((opt, i) => {
                let style = 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 active:bg-primary-50';
                if (answered) {
                  if (opt.originalIndex === question.correct_index) {
                    style = 'border-success-500 bg-success-50 ring-2 ring-success-500/20';
                  } else if (i === selectedOption && opt.originalIndex !== question.correct_index) {
                    style = 'border-danger-500 bg-danger-50 ring-2 ring-danger-500/20';
                  } else {
                    style = 'border-gray-200 opacity-50';
                  }
                } else if (i === selectedOption) {
                  style = 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20';
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={answered}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border-2 transition-all ${style}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        answered && opt.originalIndex === question.correct_index
                          ? 'bg-success-500 text-white'
                          : answered && i === selectedOption
                          ? 'bg-danger-500 text-white'
                          : i === selectedOption
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {answered && opt.originalIndex === question.correct_index ? (
                          <Check className="w-4 h-4" />
                        ) : answered && i === selectedOption ? (
                          <X className="w-4 h-4" />
                        ) : (
                          optionLabels[i]
                        )}
                      </span>
                      <span className={`text-sm sm:text-base leading-relaxed ${
                        answered && opt.originalIndex === question.correct_index
                          ? 'font-medium text-success-600'
                          : 'text-gray-700'
                      }`}>
                        {opt.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {question.explanation && answered && (
              <div className="mt-4 p-3 bg-primary-50 rounded-xl text-sm text-primary-800 leading-relaxed">
                {question.explanation}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-0 sm:relative pt-2 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-transparent -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-none">
            {!answered ? (
              <div className="flex gap-2.5">
                <button
                  onClick={handleConfirm}
                  disabled={selectedOption === null}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3.5 sm:py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg sm:shadow-sm active:scale-[0.98] min-h-[48px]"
                >
                  {t('quiz_confirm')}
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSkip}
                  className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-500 px-4 py-3.5 sm:py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors active:scale-[0.98] min-h-[48px]"
                >
                  <SkipForward className="w-4 h-4" />
                  {t('quiz_skip')}
                </button>
              </div>
            ) : (
              <button
                onClick={advanceToNext}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3.5 sm:py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-lg sm:shadow-sm active:scale-[0.98] min-h-[48px]"
              >
                {currentIndex + 1 >= questions.length ? t('quiz_view_result') : t('quiz_next')}
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
