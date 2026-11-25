-- Suggestions can come from members or from the daily Scout agent.
-- Scout suggestions have no member author and are visible only to the admin until approved.
alter table public.suggestions add column origin text not null default 'member'
  check (origin in ('member', 'scout'));
alter table public.suggestions alter column author_id drop not null;
alter table public.suggestions add constraint suggestions_author_matches_origin
  check ((origin = 'member' and author_id is not null) or (origin = 'scout' and author_id is null));
create index if not exists suggestions_source_url_idx on public.suggestions (source_url);
grant select (origin) on public.suggestions to authenticated;

-- Members can only create member suggestions under their own name.
drop policy suggestions_insert_own on public.suggestions;
create policy suggestions_insert_own on public.suggestions for insert to authenticated
  with check (author_id = (select auth.uid()) and status = 'pending' and origin = 'member');

-- Non-admins also cannot change where a suggestion came from.
create or replace function public.guard_suggestion_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if new.status is distinct from old.status
     or new.project_id is distinct from old.project_id
     or new.author_id is distinct from old.author_id
     or new.origin is distinct from old.origin then
    raise exception 'only the team can change review status' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- What the agent already knows about, so it does not suggest the same thing twice.
-- Called by the agent through the SQL editor connection, not by the site.
create or replace function public.scout_known_items()
returns table (kind text, title text, source_url text, status text)
language sql stable security definer set search_path = ''
as $$
  select 'project', p.title, coalesce(p.sources -> 0 ->> 'url', ''), 'approved' from public.projects p
  union all
  select 'suggestion', s.title, s.source_url, s.status from public.suggestions s;
$$;
revoke execute on function public.scout_known_items() from public, anon, authenticated;
