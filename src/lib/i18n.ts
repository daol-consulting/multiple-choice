export type Lang = 'ko' | 'en';

const translations = {
  // Layout
  nav_home: { ko: '홈', en: 'Home' },
  nav_import: { ko: '문제 추가', en: 'Import' },

  // HomePage
  home_title: { ko: '내 문제 세트', en: 'My Quiz Sets' },
  home_subtitle: { ko: 'ChatGPT에서 가져온 문제로 반복 학습하세요', en: 'Practice with questions imported from ChatGPT' },
  home_add: { ko: '문제 추가', en: 'Add Questions' },
  home_empty_title: { ko: '아직 문제가 없습니다', en: 'No quiz sets yet' },
  home_empty_desc: { ko: 'ChatGPT에서 객관식 문제를 복사해서 붙여넣기 하세요', en: 'Copy and paste multiple-choice questions from ChatGPT' },
  home_empty_cta: { ko: '첫 문제 세트 만들기', en: 'Create your first set' },
  home_questions: { ko: '문제', en: 'Q' },
  home_attempts: { ko: '회 풀이', en: ' attempts' },
  home_best: { ko: '최고', en: 'Best' },
  home_start: { ko: '풀기', en: 'Start' },
  home_delete_confirm: { ko: '이 문제 세트를 삭제하시겠습니까?', en: 'Delete this quiz set?' },

  // ImportPage
  import_title: { ko: '문제 가져오기', en: 'Import Questions' },
  import_add_title: { ko: '문제 추가하기', en: 'Add Questions' },
  import_subtitle: { ko: 'ChatGPT에서 생성한 객관식/주관식 문제를 붙여넣기 하세요', en: 'Paste multiple-choice or subjective questions from ChatGPT' },
  import_add_subtitle_prefix: { ko: '에 문제를 추가합니다 (현재 ', en: ' — adding questions (currently ' },
  import_add_subtitle_suffix: { ko: '문제)', en: ' questions)' },
  import_label_title: { ko: '제목', en: 'Title' },
  import_label_desc: { ko: '설명 (선택)', en: 'Description (optional)' },
  import_label_text: { ko: '문제 텍스트', en: 'Question Text' },
  import_placeholder_title: { ko: '예: 컴퓨터네트워크 중간고사', en: 'e.g. Computer Networks Midterm' },
  import_placeholder_desc: { ko: '예: Chapter 1~5 범위', en: 'e.g. Chapters 1-5' },
  import_placeholder_text: { ko: 'ChatGPT에서 복사한 문제를 여기에 붙여넣기 하세요...', en: 'Paste questions copied from ChatGPT here...' },
  import_fill_example: { ko: '예시 채우기', en: 'Fill example' },
  import_lines: { ko: '줄 입력됨', en: ' lines entered' },
  import_preview: { ko: '미리보기', en: 'Preview' },
  import_analyzing: { ko: '문제 분석 중...', en: 'Analyzing questions...' },
  import_analyzing_desc: { ko: '텍스트에서 문제, 선택지, 정답을 추출하고 있습니다', en: 'Extracting questions, options, and answers from text' },
  import_detected: { ko: '개 문제 감지 완료!', en: ' questions detected!' },
  import_detected_sub: { ko: '아래에서 파싱된 문제를 확인하세요', en: 'Review the parsed questions below' },
  import_add_to: { ko: '에 추가됩니다', en: '' },
  import_saving: { ko: '저장 중...', en: 'Saving...' },
  import_save: { ko: '개 문제 저장하기', en: ' questions — Save' },
  import_add_btn: { ko: '개 문제 추가하기', en: ' questions — Add' },
  import_retry: { ko: '다시 입력', en: 'Re-enter' },
  import_explanation_placeholder: { ko: '해설을 입력하세요 (선택)', en: 'Add explanation (optional)' },
  import_explanation_label: { ko: '해설', en: 'Explanation' },
  import_model_answer_placeholder: { ko: '모범답안을 입력하세요', en: 'Enter model answer' },
  import_model_answer_label: { ko: '모범답안', en: 'Model Answer' },
  import_type_mc: { ko: '객관식', en: 'MC' },
  import_type_subjective: { ko: '주관식', en: 'Subjective' },
  import_dup_exact: { ko: '중복 문제', en: 'Duplicate' },
  import_dup_similar: { ko: '유사 문제', en: 'Similar' },
  import_dup_batch: { ko: '과(와) 중복', en: ' is similar' },
  import_dup_existing: { ko: '기존 문제와 중복', en: 'Matches existing question' },
  import_dup_count: { ko: '개 중복/유사 문제 감지됨', en: ' duplicate/similar questions detected' },
  import_err_empty: { ko: '문제 텍스트를 입력해주세요', en: 'Please enter question text' },
  import_err_parse: { ko: '파싱할 수 있는 문제를 찾지 못했습니다. 형식을 확인해주세요.', en: 'No questions found. Please check the format.' },
  import_err_title: { ko: '제목을 입력해주세요', en: 'Please enter a title' },
  import_err_no_q: { ko: '저장할 문제가 없습니다', en: 'No questions to save' },
  import_err_create: { ko: '문제 세트 생성 실패: ', en: 'Failed to create quiz set: ' },
  import_err_save: { ko: '문제 저장 실패: ', en: 'Failed to save questions: ' },

  // QuizPage — setup
  quiz_back: { ko: '돌아가기', en: 'Back' },
  quiz_total: { ko: '총', en: 'Total' },
  quiz_total_suffix: { ko: '문제', en: ' questions' },
  quiz_how_many: { ko: '몇 문제를 풀까요?', en: 'How many questions?' },
  quiz_questions: { ko: '문제', en: 'Q' },
  quiz_all: { ko: '전체', en: 'All' },
  quiz_shuffle_note: { ko: '문제와 선택지 순서가 랜덤으로 섞입니다', en: 'Questions and options are randomly shuffled' },

  // QuizPage — in progress
  quiz_exit: { ko: '나가기', en: 'Exit' },
  quiz_confirm: { ko: '확인', en: 'Check' },
  quiz_next: { ko: '다음', en: 'Next' },
  quiz_view_result: { ko: '결과 보기', en: 'View Results' },

  // QuizPage — result
  quiz_done: { ko: '퀴즈 완료!', en: 'Quiz Complete!' },
  quiz_correct_of: { ko: '문제 중', en: ' of ' },
  quiz_correct_count: { ko: '개 정답', en: ' correct' },
  quiz_review: { ko: '문제 리뷰', en: 'Review' },
  quiz_my_answer: { ko: '내 답', en: 'Your answer' },
  quiz_correct_answer: { ko: '정답', en: 'Correct' },
  quiz_restart: { ko: '다시 풀기', en: 'Try Again' },
  quiz_go_home: { ko: '홈으로', en: 'Home' },
  quiz_no_questions: { ko: '문제를 찾을 수 없습니다', en: 'No questions found' },
  quiz_go_home_link: { ko: '홈으로 돌아가기', en: 'Go back home' },

  // Subjective
  quiz_show_answer: { ko: '답 보기', en: 'Show Answer' },
  quiz_self_correct: { ko: '맞았어요', en: 'Got it' },
  quiz_self_wrong: { ko: '틀렸어요', en: 'Missed it' },
  quiz_skip: { ko: '패스', en: 'Skip' },
  quiz_skipped: { ko: '패스', en: 'Skipped' },
  quiz_skipped_once: { ko: '한번 패스한 문제입니다. 다시 패스하면 틀린 것으로 처리됩니다.', en: 'Skipped once. Skip again to mark as wrong.' },
  quiz_write_answer: { ko: '내 답변', en: 'Your answer' },
  quiz_write_answer_placeholder: { ko: '답변을 작성하세요...', en: 'Write your answer...' },
  quiz_your_note: { ko: '내 메모', en: 'Your notes' },
  quiz_your_note_placeholder: { ko: '생각을 정리해보세요...', en: 'Write your thoughts...' },
  quiz_model_answer: { ko: '모범답안', en: 'Model Answer' },
  quiz_no_model: { ko: '모범답안이 없습니다', en: 'No model answer provided' },
  quiz_self_assessed: { ko: '자가채점', en: 'Self-assessed' },
} as const;

type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Lang): string {
  return translations[key][lang];
}

export function getLangFromStorage(): Lang {
  const stored = localStorage.getItem('quizdrill-lang');
  if (stored === 'en' || stored === 'ko') return stored;
  return navigator.language.startsWith('ko') ? 'ko' : 'en';
}

export function setLangToStorage(lang: Lang) {
  localStorage.setItem('quizdrill-lang', lang);
}
