-- Anonymous offers: members must not be able to read who made them.
-- Members lose direct read access to offers.author_id. They read offers through list_offers(),
-- which hides the author of anonymous offers from everyone except the author.
-- The hot rule still counts real authors, inside hot_project_ids().
revoke select on public.offers from authenticated;
grant select (id, project_id, type, details, available, anonymous, created_at) on public.offers to authenticated;

create or replace function public.list_offers()
returns table (
  id uuid, project_id text, type text, details text, available text,
  anonymous boolean, created_at timestamptz, author_id uuid, is_mine boolean
)
language sql stable security definer set search_path = ''
as $$
  select o.id, o.project_id, o.type, o.details, o.available, o.anonymous, o.created_at,
         case when o.anonymous and o.author_id <> (select auth.uid()) then null else o.author_id end,
         o.author_id = (select auth.uid())
  from public.offers o
  where (select auth.uid()) is not null
  order by o.created_at;
$$;

-- Projects with offers from at least three different people in the last 30 days.
create or replace function public.hot_project_ids()
returns setof text
language sql stable security definer set search_path = ''
as $$
  select o.project_id
  from public.offers o
  where (select auth.uid()) is not null
    and o.created_at > now() - interval '30 days'
  group by o.project_id
  having count(distinct o.author_id) >= 3;
$$;

revoke execute on function public.list_offers() from public, anon;
revoke execute on function public.hot_project_ids() from public, anon;
grant execute on function public.list_offers() to authenticated;
grant execute on function public.hot_project_ids() to authenticated;

-- Removing a project removes its comments and offers (built-in ids are not rows, so no foreign key).
create or replace function public.remove_project_entries()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.comments where project_id = old.id;
  delete from public.offers where project_id = old.id;
  return old;
end;
$$;
revoke execute on function public.remove_project_entries() from public, anon, authenticated;

create trigger projects_remove_entries
  after delete on public.projects
  for each row execute function public.remove_project_entries();
