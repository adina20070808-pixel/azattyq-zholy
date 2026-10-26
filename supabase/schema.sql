-- Supabase SQL Editor ішіне қойып, Run басыңыз.
create table if not exists public.survey_responses (
 id bigint generated always as identity primary key,
 answers jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.survey_responses enable row level security;
drop policy if exists "Anyone can submit survey" on public.survey_responses;
create policy "Anyone can submit survey" on public.survey_responses
 for insert to anon, authenticated
 with check (jsonb_typeof(answers)='object' and jsonb_object_length(answers)<=10);
-- Қоғамдық интерфейске тек жиынтық статистика беріледі, шикі жауаптар оқылмайды.
create or replace function public.get_survey_stats()
returns jsonb language sql security definer set search_path=public as $$
 select jsonb_build_object(
  'total',(select count(*) from public.survey_responses),
  'questions',coalesce((
   select jsonb_object_agg(qkey,qvalue) from (
    select qkey, case when qkey='q10' then jsonb_build_object('type','open','answers',
      coalesce((select jsonb_agg(answer_text) from (
       select left(trim(s.answers->>qkey),500) answer_text from public.survey_responses s
       where nullif(trim(s.answers->>qkey),'') is not null order by s.created_at desc limit 100
      ) a),'[]'::jsonb))
    else jsonb_build_object('type','choice','counts',coalesce((
      select jsonb_object_agg(opt,cnt) from (
       select val opt,count(*) cnt from public.survey_responses s
       cross join lateral (select jsonb_array_elements_text(
        case when jsonb_typeof(s.answers->qkey)='array' then s.answers->qkey
        when s.answers ? qkey then jsonb_build_array(s.answers->>qkey) else '[]'::jsonb end
       ) val) x where val is not null and val<>'' group by val
      ) c
    ),'{}'::jsonb)) end qvalue
    from (values ('q1'),('q2'),('q3'),('q4'),('q5'),('q6'),('q7'),('q8'),('q9'),('q10')) k(qkey)
   ) d
  ),'{}'::jsonb)
 );
$$;
revoke all on function public.get_survey_stats() from public;
grant execute on function public.get_survey_stats() to anon, authenticated;
grant insert on public.survey_responses to anon, authenticated;
