import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { QuizSet } from '../types';
import { BookOpen, Play, Trash2, PlusCircle, Clock, BarChart3, Plus } from 'lucide-react';

export default function HomePage() {
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, { attempts: number; bestScore: number }>>({});

  useEffect(() => {
    loadQuizSets();
  }, []);

  async function loadQuizSets() {
    setLoading(true);
    const { data, error } = await supabase
      .from('quiz_sets')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setQuizSets(data);
      await loadStats(data.map(s => s.id));
    }
    setLoading(false);
  }

  async function loadStats(setIds: string[]) {
    if (setIds.length === 0) return;
    const { data } = await supabase
      .from('quiz_attempts')
      .select('*')
      .in('quiz_set_id', setIds);

    if (data) {
      const map: Record<string, { attempts: number; bestScore: number }> = {};
      for (const attempt of data) {
        const score = Math.round((attempt.correct_answers / attempt.total_questions) * 100);
        if (!map[attempt.quiz_set_id]) {
          map[attempt.quiz_set_id] = { attempts: 0, bestScore: 0 };
        }
        map[attempt.quiz_set_id].attempts++;
        map[attempt.quiz_set_id].bestScore = Math.max(map[attempt.quiz_set_id].bestScore, score);
      }
      setStats(map);
    }
  }

  async function deleteQuizSet(id: string) {
    if (!confirm('이 문제 세트를 삭제하시겠습니까?')) return;
    await supabase.from('quiz_sets').delete().eq('id', id);
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
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">내 문제 세트</h1>
          <p className="text-gray-500 text-sm mt-0.5">ChatGPT에서 가져온 문제로 반복 학습하세요</p>
        </div>
        <Link
          to="/import"
          className="hidden sm:flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-700 transition-colors shadow-sm"
        >
          <PlusCircle className="w-5 h-5" />
          문제 추가
        </Link>
      </div>

      {quizSets.length === 0 ? (
        <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-gray-200">
          <BookOpen className="w-14 h-14 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">아직 문제가 없습니다</h2>
          <p className="text-gray-500 text-sm mb-6 px-4">
            ChatGPT에서 객관식 문제를 복사해서 붙여넣기 하세요
          </p>
          <Link
            to="/import"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors active:scale-[0.98]"
          >
            <PlusCircle className="w-5 h-5" />
            첫 문제 세트 만들기
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {quizSets.map((set) => {
            const stat = stats[set.id];
            return (
              <div
                key={set.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow active:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                      {set.title}
                    </h3>
                    {set.description && (
                      <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{set.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2.5 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {set.question_count}문제
                      </span>
                      {stat && (
                        <>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {stat.attempts}회 풀이
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            최고 {stat.bestScore}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <Link
                      to={`/quiz/${set.id}`}
                      className="flex items-center gap-1.5 bg-primary-600 text-white px-3.5 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors active:scale-[0.97]"
                    >
                      <Play className="w-4 h-4" />
                      풀기
                    </Link>
                    <Link
                      to={`/import/${set.id}`}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="문제 추가"
                    >
                      <Plus className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => deleteQuizSet(set.id)}
                      className="p-2 text-gray-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
