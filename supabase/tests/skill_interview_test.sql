-- Private interview answers. Rolls back; read the PASS/FAIL lines in the error message.
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
  insert into public.skill_interviews (user_id, age_band, life_stages, goals, weekly_time, skip)
  values (bob, '25-34', '{new-parent}', '{family,emergencies}', '1h', '{firearms}');
  out := out || E'PASS member saves own interview\n';
  insert into public.skill_interviews (user_id, age_band) values (bob, '35-49')
    on conflict (user_id) do update set age_band = excluded.age_band;
  select count(*) into n from public.skill_interviews where age_band = '35-49';
  out := out || case when n = 1 then E'PASS member updates own interview\n' else E'FAIL update\n' end;
  begin
    insert into public.skill_interviews (user_id, age_band) values (cara, '18-24');
    out := out || E'FAIL wrote another person''s interview\n';
  exception when others then out := out || E'PASS cannot write another person''s interview\n'; end;
  begin
    update public.skill_interviews set age_band = '42' where user_id = bob;
    out := out || E'FAIL exact age accepted\n';
  exception when others then out := out || E'PASS only age ranges are stored\n'; end;
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', cara, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.skill_interviews;
  out := out || case when n = 0 then E'PASS others cannot read your interview\n' else E'FAIL interview visible to others\n' end;
  reset role;
  set local role anon;
  begin
    perform 1 from public.skill_interviews;
    out := out || E'FAIL anon read interviews\n';
  exception when others then out := out || E'PASS signed-out visitors cannot read interviews\n'; end;
  reset role;
  raise exception E'INTERVIEW TEST RESULTS (rolled back)\n%', out;
end $$;
