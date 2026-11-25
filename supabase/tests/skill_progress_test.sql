-- Private skill profiles. Rolls back; read the PASS/FAIL lines in the error message.
do $$
declare
  bob uuid := '00000000-0000-4000-8000-00000000000b';
  cara uuid := '00000000-0000-4000-8000-00000000000c';
  out text := '';
  n int;
begin
  insert into auth.users (id, aud, role, email, created_at, updated_at)
  select u, 'authenticated', 'authenticated', 'test-' || u || '@example.invalid', now(), now()
  from unnest(array[bob, cara]) as u;

  perform set_config('request.jwt.claims', json_build_object('sub', bob, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.skill_progress (user_id, skill_id, level, steps_done) values (bob, 'perform-cpr', 1, '{1,2}');
  out := out || E'PASS member saves own progress\n';
  insert into public.skill_progress (user_id, skill_id, level, steps_done) values (bob, 'perform-cpr', 2, '{1,2,3}')
    on conflict (user_id, skill_id) do update set level = excluded.level, steps_done = excluded.steps_done;
  select level into n from public.skill_progress where skill_id = 'perform-cpr';
  out := out || case when n = 2 then E'PASS upsert updates own row\n' else E'FAIL upsert\n' end;
  begin
    insert into public.skill_progress (user_id, skill_id, level) values (cara, 'tie-a-bowline', 4);
    out := out || E'FAIL wrote another person''s profile\n';
  exception when others then out := out || E'PASS cannot write another person''s profile\n'; end;
  begin
    insert into public.skill_progress (user_id, skill_id, level) values (bob, 'tie-a-bowline', 9);
    out := out || E'FAIL level 9 accepted\n';
  exception when others then out := out || E'PASS level must be 0 to 4\n'; end;
  begin
    insert into public.skill_progress (user_id, skill_id) values (bob, 'Bad Id!');
    out := out || E'FAIL bad skill id accepted\n';
  exception when others then out := out || E'PASS skill id format enforced\n'; end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', cara, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.skill_progress;
  out := out || case when n = 0 then E'PASS others cannot see your profile\n' else E'FAIL profile visible to others\n' end;
  update public.skill_progress set level = 4 where user_id = bob;
  get diagnostics n = row_count;
  out := out || case when n = 0 then E'PASS others cannot change your profile\n' else E'FAIL profile changed by others\n' end;
  reset role;

  set local role anon;
  begin
    perform 1 from public.skill_progress;
    out := out || E'FAIL anon read profiles\n';
  exception when others then out := out || E'PASS signed-out visitors cannot read profiles\n'; end;
  reset role;

  raise exception E'SKILL PROGRESS TEST RESULTS (rolled back)\n%', out;
end $$;
