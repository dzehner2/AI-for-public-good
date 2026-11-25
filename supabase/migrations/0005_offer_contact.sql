-- Offerers choose whether other members may contact them about an offer.
-- Contact happens through private messages on the site, so no contact details are stored.
-- Messages are reachable only through the functions below; the table itself is closed to the API.

alter table public.offers add column contact_ok boolean not null default false;
grant select (contact_ok) on public.offers to authenticated;

-- list_offers gains contact_ok (dropped and recreated because its result columns change).
drop function public.list_offers();
create function public.list_offers()
returns table (
  id uuid, project_id text, type text, details text, available text,
  anonymous boolean, contact_ok boolean, created_at timestamptz, author_id uuid, is_mine boolean
)
language sql stable security definer set search_path = ''
as $$
  select o.id, o.project_id, o.type, o.details, o.available, o.anonymous, o.contact_ok, o.created_at,
         case when o.anonymous and o.author_id <> (select auth.uid()) then null else o.author_id end,
         o.author_id = (select auth.uid())
  from public.offers o
  where (select auth.uid()) is not null
  order by o.created_at;
$$;
revoke execute on function public.list_offers() from public, anon;
grant execute on function public.list_offers() to authenticated;

-- One thread per (offer, asker). The offerer is the offer's author.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  asker_id uuid not null references auth.users(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (
    char_length(body) between 1 and 1000
    and body !~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
  ),
  created_at timestamptz not null default now()
);
create index messages_offer_asker_idx on public.messages (offer_id, asker_id, created_at);
create index messages_asker_idx on public.messages (asker_id);
create index messages_sender_idx on public.messages (sender_id, created_at);
alter table public.messages enable row level security;
revoke all on public.messages from anon, authenticated;

-- Shared rate limit: at most 20 messages an hour per person.
create or replace function public.check_message_rate()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if (select count(*) from public.messages
      where sender_id = (select auth.uid()) and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'too many messages, try again later' using errcode = '54000';
  end if;
end;
$$;
revoke execute on function public.check_message_rate() from public, anon, authenticated;

-- A member writes to the person who made an offer (first message or follow-up).
create or replace function public.send_message(p_offer uuid, p_body text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  o public.offers;
  new_id uuid;
begin
  if me is null then raise exception 'sign in first' using errcode = '42501'; end if;
  select * into o from public.offers where id = p_offer;
  if not found then raise exception 'offer not found' using errcode = 'P0002'; end if;
  if o.author_id = me then raise exception 'you cannot message yourself' using errcode = '22023'; end if;
  if not o.contact_ok then raise exception 'this person has not agreed to be contacted' using errcode = '42501'; end if;
  perform public.check_message_rate();
  insert into public.messages (offer_id, asker_id, sender_id, body)
  values (p_offer, me, me, trim(p_body)) returning id into new_id;
  return new_id;
end;
$$;

-- The offerer replies in an existing thread. Works even if they later turn contact off.
create or replace function public.reply_message(p_offer uuid, p_asker uuid, p_body text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  new_id uuid;
begin
  if me is null then raise exception 'sign in first' using errcode = '42501'; end if;
  if not exists (select 1 from public.offers where id = p_offer and author_id = me) then
    raise exception 'only the person who made the offer can reply' using errcode = '42501';
  end if;
  if not exists (select 1 from public.messages where offer_id = p_offer and asker_id = p_asker and sender_id = p_asker) then
    raise exception 'no conversation to reply to' using errcode = 'P0002';
  end if;
  perform public.check_message_rate();
  insert into public.messages (offer_id, asker_id, sender_id, body)
  values (p_offer, p_asker, me, trim(p_body)) returning id into new_id;
  return new_id;
end;
$$;

-- Messages the caller is part of. An anonymous offerer stays hidden from the asker.
create or replace function public.list_messages()
returns table (
  id uuid, offer_id uuid, project_id text, asker_id uuid, offerer_id uuid,
  i_am_offerer boolean, from_me boolean, body text, created_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select m.id, m.offer_id, o.project_id, m.asker_id,
         case when o.anonymous and o.author_id <> (select auth.uid()) then null else o.author_id end,
         o.author_id = (select auth.uid()),
         m.sender_id = (select auth.uid()),
         m.body, m.created_at
  from public.messages m
  join public.offers o on o.id = m.offer_id
  where (select auth.uid()) is not null
    and (m.asker_id = (select auth.uid()) or o.author_id = (select auth.uid()))
  order by m.created_at;
$$;

-- People delete their own messages; the admin can delete any message by id (for reports).
create or replace function public.delete_message(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.messages
  where id = p_id and (sender_id = (select auth.uid()) or public.is_admin());
  if not found then raise exception 'not your message' using errcode = '42501'; end if;
end;
$$;

revoke execute on function public.send_message(uuid, text) from public, anon;
revoke execute on function public.reply_message(uuid, uuid, text) from public, anon;
revoke execute on function public.list_messages() from public, anon;
revoke execute on function public.delete_message(uuid) from public, anon;
grant execute on function public.send_message(uuid, text) to authenticated;
grant execute on function public.reply_message(uuid, uuid, text) to authenticated;
grant execute on function public.list_messages() to authenticated;
grant execute on function public.delete_message(uuid) to authenticated;
