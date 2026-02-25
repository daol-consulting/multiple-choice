-- QuizDrill Supabase Schema
-- Run this in your Supabase SQL Editor

create table if not exists quiz_sets (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  question_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists questions (
  id uuid default gen_random_uuid() primary key,
  quiz_set_id uuid references quiz_sets(id) on delete cascade not null,
  question_text text not null,
  options jsonb not null, -- ["option1", "option2", "option3", "option4"]
  correct_index int not null, -- 0-based index
  explanation text,
  created_at timestamptz default now()
);

create table if not exists quiz_attempts (
  id uuid default gen_random_uuid() primary key,
  quiz_set_id uuid references quiz_sets(id) on delete cascade not null,
  total_questions int not null,
  correct_answers int not null,
  time_seconds int,
  created_at timestamptz default now()
);

-- Auto-update question_count on quiz_sets
create or replace function update_question_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update quiz_sets set question_count = question_count + 1, updated_at = now()
    where id = NEW.quiz_set_id;
  elsif TG_OP = 'DELETE' then
    update quiz_sets set question_count = question_count - 1, updated_at = now()
    where id = OLD.quiz_set_id;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists on_question_change on questions;
create trigger on_question_change
after insert or delete on questions
for each row execute function update_question_count();

-- Enable RLS but allow all for now (no auth)
alter table quiz_sets enable row level security;
alter table questions enable row level security;
alter table quiz_attempts enable row level security;

drop policy if exists "Allow all on quiz_sets" on quiz_sets;
drop policy if exists "Allow all on questions" on questions;
drop policy if exists "Allow all on quiz_attempts" on quiz_attempts;

create policy "Allow all on quiz_sets" on quiz_sets for all using (true) with check (true);
create policy "Allow all on questions" on questions for all using (true) with check (true);
create policy "Allow all on quiz_attempts" on quiz_attempts for all using (true) with check (true);
