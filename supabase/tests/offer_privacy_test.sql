-- Offer privacy, the hot rule, and project removal. Rolls back; read the PASS/FAIL lines in the error message.
do $$
declare
  admin_id uuid := '00000000-0000-4000-8000-00000000000a';
  bob uuid := '00000000-0000-4000-8000-00000000000b';
  cara uuid := '00000000-0000-4000-8000-00000000000c';
  dan uuid := '00000000-0000-4000-8000-0000000000d1';
  out text := '';
  n int;
  oid uuid;
  shown uuid;
begin
  insert into auth.users (id, aud, role, email, created_at, updated_at)
  select u, 'authenticated', 'authenticated', 'test-' || u || '@example.invalid', now(), now()
  from unnest(array[admin_id, bob, cara, dan]) as u;
  insert into public.admins (user_id) values (admin_id);
  insert into public.projects (id, domain, title, body) values ('seed-project', 'Water', 'Seed', 'Seed body');

  perform set_config('request.jwt.claims', json_build_object('sub', bob, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.offers (project_id, type, details, anonymous) values ('seed-project', 'time', 'Bob anon', true);
  select id, author_id into oid, shown from public.list_offers() where details = 'Bob anon';
  out := out || case when shown = bob then E'PASS author sees own anonymous offer\n' else E'FAIL author cannot see own offer\n' end;
  begin
    update public.offers set details = 'Bob anon edited' where id = oid;
    get diagnostics n = row_count;
    out := out || case when n = 1 then E'PASS author can edit own offer\n' else E'FAIL author edit affected ' || n || E'\n' end;
  exception when others then out := out || 'FAIL author edit: ' || sqlerrm || E'\n'; end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', cara, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.offers (project_id, type, details) values ('seed-project', 'expertise', 'Cara named');
  begin
    perform author_id from public.offers;
    out := out || E'FAIL member can read offers.author_id directly\n';
  exception when others then out := out || E'PASS member cannot read offers.author_id directly\n'; end;
  select author_id into shown from public.list_offers() where details like 'Bob anon%';
  out := out || case when shown is null then E'PASS anonymous author hidden from other members\n' else E'FAIL anonymous author exposed\n' end;
  select count(*) into n from public.list_offers() where details = 'Cara named' and author_id = cara and is_mine;
  out := out || case when n = 1 then E'PASS named offer shows author and is_mine\n' else E'FAIL named offer fields\n' end;
  begin
    delete from public.offers where id = oid;
    get diagnostics n = row_count;
    out := out || case when n = 0 then E'PASS member cannot delete another offer\n' else E'FAIL member deleted another offer\n' end;
  exception when others then out := out || E'PASS member cannot delete another offer (error)\n'; end;
  select count(*) into n from public.hot_project_ids() h where h = 'seed-project';
  out := out || case when n = 0 then E'PASS two people is not hot\n' else E'FAIL hot with two people\n' end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', dan, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.offers (project_id, type, details) values ('seed-project', 'ideas', 'Dan named');
  select count(*) into n from public.hot_project_ids() h where h = 'seed-project';
  out := out || case when n = 1 then E'PASS three people (one anonymous) is hot\n' else E'FAIL not hot with three people\n' end;
  insert into public.comments (project_id, body) values ('seed-project', 'Dan comment');
  reset role;

  update public.offers set created_at = now() - interval '31 days' where details = 'Dan named';
  perform set_config('request.jwt.claims', json_build_object('sub', cara, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.hot_project_ids() h where h = 'seed-project';
  out := out || case when n = 0 then E'PASS offers older than 30 days do not count\n' else E'FAIL old offer counted\n' end;
  reset role;

  set local role anon;
  begin
    perform public.list_offers();
    out := out || E'FAIL anon can call list_offers\n';
  exception when others then out := out || E'PASS anon cannot call list_offers\n'; end;
  begin
    perform public.hot_project_ids();
    out := out || E'FAIL anon can call hot_project_ids\n';
  exception when others then out := out || E'PASS anon cannot call hot_project_ids\n'; end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.projects where id = 'seed-project';
  reset role;
  select (select count(*) from public.offers where project_id = 'seed-project') + (select count(*) from public.comments where project_id = 'seed-project') into n;
  out := out || case when n = 0 then E'PASS removing a project removes its comments and offers\n' else 'FAIL ' || n || E' entries left after removal\n' end;

  raise exception E'OFFER PRIVACY TEST RESULTS (rolled back)\n%', out;
end $$;
