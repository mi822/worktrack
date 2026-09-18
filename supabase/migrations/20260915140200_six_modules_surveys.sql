-- Identified engagement surveys. No seed questions or responses.

create type public.survey_question_kind as enum (
  'rating',
  'choice',
  'yes_no',
  'text'
);

create table public.surveys (
  id bigint generated always as identity primary key,
  created_by uuid not null references public.profiles (id) on delete restrict,
  title text not null,
  description text not null default '',
  is_published boolean not null default false,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint surveys_title_check check (
    char_length(trim(title)) > 0 and char_length(title) <= 160
  ),
  constraint surveys_description_check check (char_length(description) <= 2000),
  constraint surveys_dates_check check (
    starts_on is null or ends_on is null or ends_on >= starts_on
  )
);

create index surveys_created_by_idx on public.surveys (created_by);
create index surveys_published_idx on public.surveys (is_published);

create table public.survey_questions (
  id bigint generated always as identity primary key,
  survey_id bigint not null references public.surveys (id) on delete cascade,
  sort_order integer not null default 0,
  prompt text not null,
  kind public.survey_question_kind not null,
  options jsonb not null default '[]'::jsonb,
  constraint survey_questions_prompt_check check (
    char_length(trim(prompt)) > 0 and char_length(prompt) <= 400
  ),
  constraint survey_questions_options_array check (jsonb_typeof(options) = 'array')
);

create index survey_questions_survey_id_idx on public.survey_questions (survey_id);

create table public.survey_responses (
  id bigint generated always as identity primary key,
  survey_id bigint not null references public.surveys (id) on delete cascade,
  respondent_id uuid not null references public.profiles (id) on delete cascade,
  submitted_at timestamptz not null default now(),
  unique (survey_id, respondent_id)
);

create index survey_responses_survey_id_idx on public.survey_responses (survey_id);
create index survey_responses_respondent_id_idx on public.survey_responses (respondent_id);

create table public.survey_answers (
  id bigint generated always as identity primary key,
  response_id bigint not null references public.survey_responses (id) on delete cascade,
  question_id bigint not null references public.survey_questions (id) on delete cascade,
  rating_value integer,
  choice_value text,
  yes_no_value boolean,
  text_value text,
  unique (response_id, question_id),
  constraint survey_answers_rating_check check (
    rating_value is null or rating_value between 1 and 5
  ),
  constraint survey_answers_text_check check (
    text_value is null or char_length(text_value) <= 1000
  )
);

create index survey_answers_response_id_idx on public.survey_answers (response_id);
create index survey_answers_question_id_idx on public.survey_answers (question_id);

create or replace function private.surveys_touch()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.surveys_touch() from public;

create trigger surveys_touch
  before update on public.surveys
  for each row
  execute function private.surveys_touch();

create or replace function private.survey_questions_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  published boolean;
begin
  select s.is_published into published
  from public.surveys s
  where s.id = coalesce(new.survey_id, old.survey_id);

  if published then
    raise exception 'survey_locked' using errcode = '23514';
  end if;

  return coalesce(new, old);
end;
$$;

revoke all on function private.survey_questions_guard() from public;

create trigger survey_questions_guard
  before insert or update or delete on public.survey_questions
  for each row
  execute function private.survey_questions_guard();

alter table public.surveys enable row level security;
alter table public.surveys force row level security;
alter table public.survey_questions enable row level security;
alter table public.survey_questions force row level security;
alter table public.survey_responses enable row level security;
alter table public.survey_responses force row level security;
alter table public.survey_answers enable row level security;
alter table public.survey_answers force row level security;

create policy surveys_select
  on public.surveys
  for select
  to authenticated
  using (
    (select private.get_my_role()) = 'admin'
    or created_by = (select auth.uid())
    or (
      is_published
      and (select private.get_my_role()) in ('employee', 'intern', 'manager')
    )
  );

create policy surveys_insert
  on public.surveys
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and (select private.get_my_role()) in ('admin', 'manager')
  );

create policy surveys_update
  on public.surveys
  for update
  to authenticated
  using (
    (select private.get_my_role()) = 'admin'
    or created_by = (select auth.uid())
  )
  with check (
    (select private.get_my_role()) = 'admin'
    or created_by = (select auth.uid())
  );

create policy survey_questions_select
  on public.survey_questions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.surveys s
      where s.id = survey_id
        and (
          (select private.get_my_role()) = 'admin'
          or s.created_by = (select auth.uid())
          or (
            s.is_published
            and (select private.get_my_role()) in ('employee', 'intern', 'manager')
          )
        )
    )
  );

create policy survey_questions_insert
  on public.survey_questions
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.surveys s
      where s.id = survey_id
        and not s.is_published
        and (
          (select private.get_my_role()) = 'admin'
          or s.created_by = (select auth.uid())
        )
    )
  );

create policy survey_questions_update
  on public.survey_questions
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.surveys s
      where s.id = survey_id
        and not s.is_published
        and (
          (select private.get_my_role()) = 'admin'
          or s.created_by = (select auth.uid())
        )
    )
  )
  with check (
    exists (
      select 1
      from public.surveys s
      where s.id = survey_id
        and not s.is_published
        and (
          (select private.get_my_role()) = 'admin'
          or s.created_by = (select auth.uid())
        )
    )
  );

create policy survey_questions_delete
  on public.survey_questions
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.surveys s
      where s.id = survey_id
        and not s.is_published
        and (
          (select private.get_my_role()) = 'admin'
          or s.created_by = (select auth.uid())
        )
    )
  );

create policy survey_responses_select
  on public.survey_responses
  for select
  to authenticated
  using (
    respondent_id = (select auth.uid())
    or (select private.get_my_role()) = 'admin'
    or exists (
      select 1
      from public.surveys s
      where s.id = survey_id
        and s.created_by = (select auth.uid())
    )
  );

create policy survey_responses_insert
  on public.survey_responses
  for insert
  to authenticated
  with check (
    respondent_id = (select auth.uid())
    and (select private.get_my_role()) in ('employee', 'intern')
    and exists (
      select 1
      from public.surveys s
      where s.id = survey_id
        and s.is_published
        and (s.starts_on is null or s.starts_on <= (timezone('utc', now()))::date)
        and (s.ends_on is null or s.ends_on >= (timezone('utc', now()))::date)
    )
  );

create policy survey_answers_select
  on public.survey_answers
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.survey_responses r
      where r.id = response_id
        and (
          r.respondent_id = (select auth.uid())
          or (select private.get_my_role()) = 'admin'
          or exists (
            select 1
            from public.surveys s
            where s.id = r.survey_id
              and s.created_by = (select auth.uid())
          )
        )
    )
  );

create policy survey_answers_insert
  on public.survey_answers
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.survey_responses r
      where r.id = response_id
        and r.respondent_id = (select auth.uid())
    )
  );

grant select, insert, update on table public.surveys to authenticated;
grant usage, select on sequence public.surveys_id_seq to authenticated;
grant select, insert, update, delete on table public.survey_questions to authenticated;
grant usage, select on sequence public.survey_questions_id_seq to authenticated;
grant select, insert on table public.survey_responses to authenticated;
grant usage, select on sequence public.survey_responses_id_seq to authenticated;
grant select, insert on table public.survey_answers to authenticated;
grant usage, select on sequence public.survey_answers_id_seq to authenticated;

create or replace function public.engagement_overview()
returns table (
  response_count bigint,
  audience_count bigint,
  avg_rating numeric,
  response_rate numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_role public.app_role;
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  caller_role := private.get_my_role();
  if caller_role not in ('admin', 'manager', 'project_head') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with audience as (
    select count(*)::bigint as n
    from public.profiles p
    where p.is_active
      and p.role in ('employee', 'intern')
  ),
  respondents as (
    select count(distinct r.respondent_id)::bigint as n
    from public.survey_responses r
    join public.surveys s on s.id = r.survey_id
    where s.is_published
  ),
  ratings as (
    select avg(a.rating_value)::numeric as v
    from public.survey_answers a
    join public.survey_questions q on q.id = a.question_id
    join public.survey_responses r on r.id = a.response_id
    join public.surveys s on s.id = r.survey_id
    where s.is_published
      and q.kind = 'rating'
      and a.rating_value is not null
  )
  select
    respondents.n,
    audience.n,
    ratings.v,
    case
      when audience.n = 0 then null
      else round(respondents.n::numeric / audience.n, 4)
    end
  from audience, respondents, ratings;
end;
$$;

revoke all on function public.engagement_overview() from public;
grant execute on function public.engagement_overview() to authenticated;
