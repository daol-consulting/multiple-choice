import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { QuizSet } from '../types';
import { BookOpen, Play, Trash2, PlusCircle, Clock, BarChart3, Plus } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import { deleteQuizSet as deleteQuizSetApi, listQuizSets } from '../lib/blobApi';

export default function HomePage() {
  const { t } = useLang();
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizSets();
  }, []);

  async function loadQuizSets() {
    setLoading(true);
    try {
      const data = await listQuizSets();
      setQuizSets(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function deleteQuizSet(id: string) {
    if (!confirm(t('home_delete_confirm'))) return;
    await deleteQuizSetApi(id);
    setQuizSets(prev => prev.filter(s => s.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="pb-20 sm:pb-0">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('home_title')}</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">{t('home_subtitle')}</p>
        </div>
        <Link
          to="/import"
          className="hidden sm:flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm flex-shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          {t('home_add')}
        </Link>
      </div>

      {quizSets.length === 0 ? (
        <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-gray-200">
          <BookOpen className="w-14 h-14 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">{t('home_empty_title')}</h2>
          <p className="text-gray-500 text-sm mb-6 px-4">{t('home_empty_desc')}</p>
          <Link
            to="/import"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors active:scale-[0.98]"
          >
            <PlusCircle className="w-5 h-5" />
            {t('home_empty_cta')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {quizSets.map((set) => {
            const stat = {
              attempts: set.attempt_count || 0,
              bestScore: set.best_score || 0,
            };
            return (
              <div
                key={set.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0 mb-3">
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                    {set.title}
                  </h3>
                  {set.description && (
                    <p className="text-gray-500 text-xs sm:text-sm mt-0.5 line-clamp-1">{set.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {set.question_count}{t('home_questions')}
                    </span>
                    {stat.attempts > 0 && (
                      <>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {stat.attempts}{t('home_attempts')}
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3.5 h-3.5" />
                          {t('home_best')} {stat.bestScore}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/quiz/${set.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors active:scale-[0.97] min-h-[44px]"
                  >
                    <Play className="w-4 h-4" />
                    {t('home_start')}
                  </Link>
                  <Link
                    to={`/import/${set.id}`}
                    className="flex items-center justify-center w-11 h-11 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors active:bg-primary-100"
                    title={t('home_add')}
                  >
                    <Plus className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => deleteQuizSet(set.id)}
                    className="flex items-center justify-center w-11 h-11 text-gray-400 hover:text-danger-500 hover:bg-danger-50 rounded-xl transition-colors active:bg-danger-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
