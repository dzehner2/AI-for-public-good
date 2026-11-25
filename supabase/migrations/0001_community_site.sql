-- Community Ideas Commons: schema, row-level security, and the approval function.
-- Owner decisions this file encodes:
--   * Signed-out visitors read projects only. Comments, offers and suggestions need sign-in.
--   * Everyone signed in can comment, offer help and suggest. Authors can edit or delete their own entries.
--   * Only the admin (rows in public.admins) approves suggestions, adds projects, and can remove anything.
--   * Offers store no contact details (an email-address check blocks the obvious case).
--   * Money is not an offer type yet.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text check (name is null or char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.projects (
  id text primary key check (id ~ '^[a-z0-9-]{1,80}$'),
  domain text not null,
  title text not null check (char_length(title) between 1 and 160),
  body text not null check (char_length(body) between 1 and 2000),
  sources jsonb not null default '[]'::jsonb,
  channels jsonb not null default '[]'::jsonb,
  suggestion_id uuid,
  created_at timestamptz not null default now()
);

create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  domain text not null,
  body text not null check (char_length(body) between 1 and 1500),
  source_url text not null default '' check (source_url = '' or (source_url ~ '^https://' and char_length(source_url) <= 300)),
  help_needed text not null default '' check (char_length(help_needed) <= 600),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  project_id text references public.projects(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Project ids for built-in projects are not rows here, so comments and offers keep a plain text id.
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id text not null check (char_length(project_id) between 1 and 80),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  project_id text not null check (char_length(project_id) between 1 and 80),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('time', 'expertise', 'resources', 'ideas', 'network')),
  details text not null check (
    char_length(details) between 1 and 1000
    and details !~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
  ),
  available text not null default '' check (
    char_length(available) <= 120
    and available !~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
  ),
  anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

create index offers_project_created_idx on public.offers (project_id, created_at);
create index comments_project_created_idx on public.comments (project_id, created_at);
create index suggestions_status_created_idx on public.suggestions (status, created_at);

-- Non-admins can edit their own suggestion text, but not its review status, project link or author.
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
     or new.author_id is distinct from old.author_id then
    raise exception 'only the team can change review status' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger suggestions_guard
  before update on public.suggestions
  for each row execute function public.guard_suggestion_update();

-- Approval is one step: create the project and mark the suggestion approved.
create or replace function public.approve_suggestion(p_id uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  s public.suggestions;
  base text;
  new_id text;
  n int := 2;
begin
  if not public.is_admin() then
    raise exception 'only the team can approve suggestions' using errcode = '42501';
  end if;
  select * into s from public.suggestions where id = p_id for update;
  if not found then
    raise exception 'suggestion not found' using errcode = 'P0002';
  end if;
  if s.status <> 'pending' then
    raise exception 'suggestion is not pending' using errcode = '22023';
  end if;
  base := left(trim(both '-' from regexp_replace(lower(s.title), '[^a-z0-9]+', '-', 'g')), 60);
  if base = '' then base := 'project'; end if;
  new_id := base;
  while exists (select 1 from public.projects where id = new_id) loop
    new_id := base || '-' || n;
    n := n + 1;
  end loop;
  insert into public.projects (id, domain, title, body, sources, channels, suggestion_id)
  values (
    new_id, s.domain, s.title, s.body,
    case when s.source_url = '' then '[]'::jsonb
         else jsonb_build_array(jsonb_build_object('name', 'Suggested source', 'url', s.source_url)) end,
    case when s.help_needed = '' then '[]'::jsonb
         else jsonb_build_array(s.help_needed) end,
    s.id
  );
  update public.suggestions set status = 'approved', project_id = new_id where id = p_id;
  return new_id;
end;
$$;

-- Row-level security ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.projects enable row level security;
alter table public.suggestions enable row level security;
alter table public.comments enable row level security;
alter table public.offers enable row level security;

-- Admins table: readable only by admins (so the owner can check), written only in the SQL editor.
create policy admins_select on public.admins for select to authenticated using (public.is_admin());

-- Profiles: signed-in people see names; each person edits only their own name.
create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Projects: public read; only the admin writes.
create policy projects_select_public on public.projects for select to anon, authenticated using (true);
create policy projects_admin_insert on public.projects for insert to authenticated with check (public.is_admin());
create policy projects_admin_update on public.projects for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy projects_admin_delete on public.projects for delete to authenticated using (public.is_admin());

-- Suggestions: visible to the author and the admin only.
create policy suggestions_select on public.suggestions for select to authenticated
  using (author_id = (select auth.uid()) or public.is_admin());
create policy suggestions_insert_own on public.suggestions for insert to authenticated
  with check (author_id = (select auth.uid()) and status = 'pending');
create policy suggestions_update on public.suggestions for update to authenticated
  using (author_id = (select auth.uid()) or public.is_admin())
  with check (author_id = (select auth.uid()) or public.is_admin());
create policy suggestions_delete on public.suggestions for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_admin());

-- Comments: signed-in people read; authors write their own; admin can remove any.
create policy comments_select on public.comments for select to authenticated using (true);
create policy comments_insert_own on public.comments for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy comments_update_own on public.comments for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy comments_delete on public.comments for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_admin());

-- Offers: signed-in people read (anonymity is a display choice, the author is still recorded for the hot count).
create policy offers_select on public.offers for select to authenticated using (true);
create policy offers_insert_own on public.offers for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy offers_update_own on public.offers for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy offers_delete on public.offers for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_admin());

-- Grants: anon reads projects only. Revoke the default table grants that would widen access.
revoke all on all tables in schema public from anon;
grant select on public.projects to anon;
revoke execute on function public.approve_suggestion(uuid) from anon;
grant execute on function public.approve_suggestion(uuid) to authenticated;
