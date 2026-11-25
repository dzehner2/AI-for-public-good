-- Offer contact choice and private messages. Rolls back; read the PASS/FAIL lines in the error message.
do $$
declare
  admin_id uuid := '00000000-0000-4000-8000-00000000000a';
  olive uuid := '00000000-0000-4000-8000-0000000000a1';  -- makes offers
  ash uuid := '00000000-0000-4000-8000-0000000000a2';    -- asks
  pat uuid := '00000000-0000-4000-8000-0000000000a3';    -- bystander
  out text := '';
  n int;
  open_offer uuid; closed_offer uuid; anon_offer uuid; mid uuid; seen uuid;
begin
  insert into auth.users (id, aud, role, email, created_at, updated_at)
  select u, 'authenticated', 'authenticated', 'test-' || u || '@example.invalid', now(), now()
  from unnest(array[admin_id, olive, ash, pat]) as u;
  insert into public.admins (user_id) values (admin_id);

  perform set_config('request.jwt.claims', json_build_object('sub', olive, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.offers (project_id, type, details, contact_ok) values ('p1', 'time', 'Open offer', true);
  insert into public.offers (project_id, type, details) values ('p1', 'time', 'Closed offer');
  insert into public.offers (project_id, type, details, contact_ok, anonymous) values ('p1', 'time', 'Anon open offer', true, true);
  select id into open_offer from public.list_offers() where details = 'Open offer';
  select id into closed_offer from public.list_offers() where details = 'Closed offer';
  select id into anon_offer from public.list_offers() where details = 'Anon open offer';
  select count(*) into n from public.list_offers() where details = 'Closed offer' and contact_ok = false;
  out := out || case when n = 1 then E'PASS contact is off unless chosen\n' else E'FAIL contact default\n' end;
  begin
    perform public.send_message(open_offer, 'Messaging myself');
    out := out || E'FAIL offerer messaged own offer\n';
  exception when others then out := out || E'PASS cannot message your own offer\n'; end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', ash, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.list_offers() where details = 'Open offer' and contact_ok;
  out := out || case when n = 1 then E'PASS members can see who is open to contact\n' else E'FAIL contact_ok not visible\n' end;
  begin
    perform public.send_message(closed_offer, 'Hello');
    out := out || E'FAIL messaged someone who said no\n';
  exception when others then out := out || E'PASS cannot message someone who did not agree\n'; end;
  begin
    perform public.send_message(open_offer, 'Reach me at ash@example.com');
    out := out || E'FAIL message with email accepted\n';
  exception when others then out := out || E'PASS message with email address rejected\n'; end;
  begin
    mid := public.send_message(open_offer, 'Could you review our draft checklist?');
    out := out || E'PASS member can message an open offer\n';
  exception when others then out := out || 'FAIL send: ' || sqlerrm || E'\n'; end;
  perform public.send_message(anon_offer, 'Question for the anonymous offerer');
  select offerer_id into seen from public.list_messages() where body like 'Question for the anonymous%';
  out := out || case when seen is null then E'PASS anonymous offerer stays hidden from the asker\n' else E'FAIL anonymous offerer revealed\n' end;
  begin
    perform 1 from public.messages;
    out := out || E'FAIL messages table readable directly\n';
  exception when others then out := out || E'PASS messages table closed to direct reads\n'; end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', pat, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.list_messages();
  out := out || case when n = 0 then E'PASS bystander sees no messages\n' else 'FAIL bystander sees ' || n || E'\n' end;
  begin
    perform public.reply_message(open_offer, ash, 'Butting in');
    out := out || E'FAIL bystander replied in a thread\n';
  exception when others then out := out || E'PASS bystander cannot reply\n'; end;
  begin
    perform public.delete_message(mid);
    out := out || E'FAIL bystander deleted a message\n';
  exception when others then out := out || E'PASS bystander cannot delete a message\n'; end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', olive, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.list_messages() where i_am_offerer and asker_id = ash;
  out := out || case when n = 2 then E'PASS offerer receives both messages\n' else 'FAIL offerer sees ' || n || E'\n' end;
  begin
    perform public.reply_message(open_offer, ash, 'Yes, send it over.');
    out := out || E'PASS offerer can reply\n';
  exception when others then out := out || 'FAIL reply: ' || sqlerrm || E'\n'; end;
  begin
    perform public.reply_message(open_offer, pat, 'Unprompted');
    out := out || E'FAIL offerer started a thread nobody asked for\n';
  exception when others then out := out || E'PASS offerer cannot start a thread unasked\n'; end;
  update public.offers set contact_ok = false where id = open_offer;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', ash, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.list_messages() where offer_id = open_offer;
  out := out || case when n = 2 then E'PASS asker sees the reply\n' else 'FAIL asker sees ' || n || E'\n' end;
  begin
    perform public.send_message(open_offer, 'One more thing');
    out := out || E'FAIL messaged after contact was turned off\n';
  exception when others then out := out || E'PASS turning contact off stops new messages\n'; end;
  begin
    perform public.delete_message(mid);
    out := out || E'PASS sender can delete own message\n';
  exception when others then out := out || 'FAIL sender delete: ' || sqlerrm || E'\n'; end;
  reset role;

  set local role anon;
  begin
    perform public.list_messages();
    out := out || E'FAIL anon can list messages\n';
  exception when others then out := out || E'PASS anon cannot list messages\n'; end;
  reset role;

  -- Deleting the offer removes its conversation.
  delete from public.offers where id = open_offer;
  select count(*) into n from public.messages where offer_id = open_offer;
  out := out || case when n = 0 then E'PASS deleting an offer removes its messages\n' else E'FAIL messages left after offer deleted\n' end;

  raise exception E'CONTACT TEST RESULTS (rolled back)\n%', out;
end $$;
