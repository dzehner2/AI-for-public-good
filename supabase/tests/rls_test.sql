-- Access-rule tests. Run in the SQL editor or with execute_sql.
-- Everything is created inside one transaction and the test ends by raising an error that
-- carries the results, so nothing is left behind. Read the message: PASS lines are the goal.
do $$
declare
  admin_id uuid := '00000000-0000-4000-8000-00000000000a';
  bob uuid := '00000000-0000-4000-8000-00000000000b';
  cara uuid := '00000000-0000-4000-8000-00000000000c';
  dan uuid := '00000000-0000-4000-8000-0000000000d1';
  eve uuid := '00000000-0000-4000-8000-0000000000e1';
  out text := '';
  n int;
  sid uuid;
  cid uuid;
  new_project text;
begin
  insert into auth.users (id, aud, role, email, created_at, updated_at)
  select u, 'authenticated', 'authenticated', 'test-' || u || '@example.invalid', now(), now()
  from unnest(array[admin_id, bob, cara, dan, eve]) as u;
  insert into public.projects (id, domain, title, body) values ('seed-project', 'Water', 'Seed', 'Seed body');
  insert into public.admins (user_id) values (admin_id);

  -- helper pattern: each check runs as the given role with the given JWT subject.
  -- Bob (signed in) suggests a project.
  perform set_config('request.jwt.claims', json_build_object('sub', bob, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.suggestions (title, domain, body, source_url) values ('Bob idea', 'Water', 'Body', 'https://example.org/x');
    out := out || E'PASS bob can suggest\n';
  exception when others then out := out || 'FAIL bob can suggest: ' || sqlerrm || E'\n'; end;
  begin
    insert into public.suggestions (author_id, title, domain, body) values (cara, 'Forged', 'Water', 'Body');
    out := out || E'FAIL bob forged another author\n';
  exception when others then out := out || E'PASS bob cannot forge another author\n'; end;
  begin
    insert into public.suggestions (title, domain, body, status) values ('Pre-approved', 'Water', 'Body', 'approved');
    out := out || E'FAIL suggestion inserted as approved\n';
  exception when others then out := out || E'PASS suggestion must start pending\n'; end;
  begin
    insert into public.suggestions (title, domain, body, source_url) values ('Http', 'Water', 'Body', 'http://insecure.example');
    out := out || E'FAIL non-https source accepted\n';
  exception when others then out := out || E'PASS non-https source rejected\n'; end;
  begin
    insert into public.comments (project_id, body) values ('seed-project', 'Bob comment');
    out := out || E'PASS bob can comment\n';
  exception when others then out := out || 'FAIL bob can comment: ' || sqlerrm || E'\n'; end;
  begin
    insert into public.offers (project_id, type, details) values ('seed-project', 'time', 'Write me at bob@example.com');
    out := out || E'FAIL offer with an email address accepted\n';
  exception when others then out := out || E'PASS offer with email rejected\n'; end;
  begin
    insert into public.offers (project_id, type, details) values ('seed-project', 'money', 'I can pay');
    out := out || E'FAIL money offer accepted\n';
  exception when others then out := out || E'PASS money is not an offer type\n'; end;
  begin
    insert into public.offers (project_id, type, details) values ('seed-project', 'time', 'I can review the method two hours a month');
    out := out || E'PASS bob can offer help\n';
  exception when others then out := out || 'FAIL bob can offer: ' || sqlerrm || E'\n'; end;
  reset role;

  -- Bob's suggestion is hidden from Cara but visible to Bob and the admin.
  perform set_config('request.jwt.claims', json_build_object('sub', cara, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.suggestions;
  out := out || case when n = 0 then E'PASS other members cannot see pending suggestions\n' else 'FAIL other members see ' || n || E' suggestions\n' end;
  begin
    update public.suggestions set title = 'Hijacked' where author_id = bob;
    get diagnostics n = row_count;
    out := out || case when n = 0 then E'PASS cara cannot edit bob suggestion\n' else E'FAIL cara edited bob suggestion\n' end;
  exception when others then out := out || E'PASS cara cannot edit bob suggestion (error)\n'; end;
  begin
    update public.comments set body = 'Cara edits' where author_id = bob;
    get diagnostics n = row_count;
    out := out || case when n = 0 then E'PASS cara cannot edit bob comment\n' else E'FAIL cara edited bob comment\n' end;
  exception when others then out := out || E'PASS cara cannot edit bob comment (error)\n'; end;
  begin
    delete from public.comments where author_id = bob;
    get diagnostics n = row_count;
    out := out || case when n = 0 then E'PASS cara cannot delete bob comment\n' else E'FAIL cara deleted bob comment\n' end;
  exception when others then out := out || E'PASS cara cannot delete bob comment (error)\n'; end;
  begin
    insert into public.comments (project_id, body) values ('seed-project', 'Cara comment');
    out := out || E'PASS cara can comment\n';
  exception when others then out := out || 'FAIL cara comment: ' || sqlerrm || E'\n'; end;
  begin
    perform public.approve_suggestion((select id from public.suggestions limit 1));
    out := out || E'FAIL non-admin approved a suggestion\n';
  exception when others then out := out || E'PASS non-admin cannot approve\n'; end;
  reset role;

  -- Admin approves Bob's suggestion; the project appears and the suggestion is marked approved.
  perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select id into sid from public.suggestions where title = 'Bob idea';
  select count(*) into n from public.suggestions;
  out := out || case when n >= 1 then E'PASS admin sees suggestions\n' else E'FAIL admin cannot see suggestions\n' end;
  begin
    new_project := public.approve_suggestion(sid);
    out := out || 'PASS admin approves -> project ' || new_project || E'\n';
  exception when others then out := out || 'FAIL admin approve: ' || sqlerrm || E'\n'; end;
  begin
    perform public.approve_suggestion(sid);
    out := out || E'FAIL approving twice allowed\n';
  exception when others then out := out || E'PASS cannot approve twice\n'; end;
  begin
    delete from public.comments where author_id = bob;
    get diagnostics n = row_count;
    out := out || case when n = 1 then E'PASS admin can remove any comment\n' else 'FAIL admin removed ' || n || E' comments\n' end;
  exception when others then out := out || 'FAIL admin remove comment: ' || sqlerrm || E'\n'; end;
  reset role;

  -- Bob's approved project row exists and the suggestion points at it.
  select count(*) into n from public.projects where id = new_project and suggestion_id = sid;
  out := out || case when n = 1 then E'PASS approved project is linked to its suggestion\n' else E'FAIL project link missing\n' end;

  -- Hot rule input: three different people offer on one project.
  perform set_config('request.jwt.claims', json_build_object('sub', dan, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.offers (project_id, type, details) values ('seed-project', 'expertise', 'Dan offer');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', eve, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.offers (project_id, type, details) values ('seed-project', 'ideas', 'Eve offer');
  select count(distinct author_id) into n from public.offers where project_id = 'seed-project';
  out := out || case when n = 3 then E'PASS three distinct offerers visible to a member\n' else 'FAIL offerers visible: ' || n || E'\n' end;
  reset role;

  -- Signed-out visitors (anon) read projects only.
  set local role anon;
  select count(*) into n from public.projects;
  out := out || case when n >= 1 then E'PASS anon reads projects\n' else E'FAIL anon cannot read projects\n' end;
  begin
    perform 1 from public.comments;
    out := out || E'FAIL anon read comments\n';
  exception when others then out := out || E'PASS anon cannot read comments\n'; end;
  begin
    perform 1 from public.offers;
    out := out || E'FAIL anon read offers\n';
  exception when others then out := out || E'PASS anon cannot read offers\n'; end;
  begin
    perform 1 from public.suggestions;
    out := out || E'FAIL anon read suggestions\n';
  exception when others then out := out || E'PASS anon cannot read suggestions\n'; end;
  reset role;

  raise exception E'RLS TEST RESULTS (rolled back)\n%', out;
end $$;
