# QuizDrill - 반복 학습 퀴즈 앱

ChatGPT에서 생성한 객관식 문제를 붙여넣기 하면, 랜덤으로 섞어서 반복 풀 수 있는 학습 웹앱입니다.

## 시작하기

### 1. Supabase 설정

1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `supabase-schema.sql` 실행
3. `.env` 파일 생성:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. 실행

```bash
npm install
npm run dev
```

## 사용법

1. **문제 추가**: ChatGPT에서 객관식 문제를 복사 → "문제 추가" 페이지에서 붙여넣기 → 미리보기 → 저장
2. **퀴즈 풀기**: 홈에서 문제 세트 선택 → "풀기" 클릭 → 랜덤 순서로 풀기
3. **반복 학습**: 결과 확인 후 "다시 풀기"로 반복

## 지원 형식 (ChatGPT 출력)

```
1. What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid
Answer: B
```

`A)`, `A.`, `(A)`, 한국어 `정답: B` 등 다양한 형식을 자동 파싱합니다.

## 기술 스택

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (PostgreSQL)
- React Router
