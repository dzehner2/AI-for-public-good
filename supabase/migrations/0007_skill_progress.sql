-- Private skill profile: each person's self-rated proficiency and course progress.
-- Only the person can read or change their own rows. Levels and badges are not public.
create table public.skill_progress (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  skill_id text not null check (skill_id ~ '^[a-z0-9-]{1,80}$'),
  level smallint not null default 0 check (level between 0 and 4),  -- 0 not yet, 1 beginner, 2 practising, 3 confident, 4 can teach
  steps_done smallint[] not null default '{}' check (cardinality(steps_done) <= 20),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

alter table public.skill_progress enable row level security;
create policy skill_progress_select_own on public.skill_progress for select to authenticated
  using (user_id = (select auth.uid()));
create policy skill_progress_insert_own on public.skill_progress for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy skill_progress_update_own on public.skill_progress for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy skill_progress_delete_own on public.skill_progress for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.skill_progress from anon;
grant select, insert, update, delete on public.skill_progress to authenticated;

create or replace function public.touch_skill_progress()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke execute on function public.touch_skill_progress() from public, anon, authenticated;
create trigger skill_progress_touch before update on public.skill_progress
  for each row execute function public.touch_skill_progress();
