-- Keep engagement aggregates off the public SECURITY DEFINER surface.

create or replace function private.engagement_overview()
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

revoke all on function private.engagement_overview() from public;
grant execute on function private.engagement_overview() to authenticated;

create or replace function public.engagement_overview()
returns table (
  response_count bigint,
  audience_count bigint,
  avg_rating numeric,
  response_rate numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.engagement_overview();
$$;

revoke all on function public.engagement_overview() from public;
grant execute on function public.engagement_overview() to authenticated;
