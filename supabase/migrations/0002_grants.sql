-- Table privileges. Row-level security policies in 0001 decide which rows each role reaches.
-- Signed-in users get the table privileges; signed-out visitors get read access to projects only.
grant select, insert, update, delete on public.profiles, public.admins, public.projects,
  public.suggestions, public.comments, public.offers to authenticated;
grant select on public.projects to anon;
revoke all on public.profiles, public.admins, public.suggestions, public.comments, public.offers from anon;
revoke execute on function public.approve_suggestion(uuid) from public, anon;
grant execute on function public.approve_suggestion(uuid) to authenticated;
