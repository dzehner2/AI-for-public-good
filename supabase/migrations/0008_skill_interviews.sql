-- Private interview answers used to suggest courses: age range (not exact age), life stage,
-- goals, weekly time and topics to skip. Only the person can read or change their own answers.
create table public.skill_interviews (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  age_band text check (age_band in ('13-17', '18-24', '25-34', '35-49', '50-64', '65+')),
  life_stages text[] not null default '{}' check (cardinality(life_stages) <= 12),
  goals text[] not null default '{}' check (cardinality(goals) <= 11),
  weekly_time text check (weekly_time in ('1h', '2-4h', '5h+')),
  skip text[] not null default '{}' check (cardinality(skip) <= 6),
  updated_at timestamptz not null default now()
);

alter table public.skill_interviews enable row level security;
create policy skill_interviews_select_own on public.skill_interviews for select to authenticated
  using (user_id = (select auth.uid()));
create policy skill_interviews_insert_own on public.skill_interviews for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy skill_interviews_update_own on public.skill_interviews for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy skill_interviews_delete_own on public.skill_interviews for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.skill_interviews from anon;
grant select, insert, update, delete on public.skill_interviews to authenticated;

create trigger skill_interviews_touch before update on public.skill_interviews
  for each row execute function public.touch_skill_progress();
