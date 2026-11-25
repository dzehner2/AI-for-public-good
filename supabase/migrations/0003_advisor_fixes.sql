-- Fixes from the Supabase security and performance advisors.
-- handle_new_user only runs as a trigger; nobody needs to call it through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
-- is_admin is used inside access rules for signed-in users. Signed-out visitors never need it.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
-- approve_suggestion stays callable by signed-in users on purpose: it refuses anyone who is not the admin.

-- Indexes for foreign keys (author lookups and deletes cascading from auth.users).
create index if not exists comments_author_idx on public.comments (author_id);
create index if not exists offers_author_idx on public.offers (author_id);
create index if not exists suggestions_author_idx on public.suggestions (author_id);
create index if not exists suggestions_project_idx on public.suggestions (project_id);
