// Browser test for the interview, "what to learn next" and the skill tree, with a fake session and mocked Supabase.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8080';
const SB = 'https://yfxxhiomvtiujpuxwlky.supabase.co';
const ME = '11111111-1111-4111-8111-111111111111';

async function setup(browser, viewport, { interview, progress }) {
  const page = await (await browser.newContext({ viewport })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const sent = { interview: [], progress: [] };
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
  await page.route(SB + '/**', async route => {
    const req = route.request(); const url = req.url();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (url.includes('/rest/v1/skill_interviews')) {
      if (req.method() === 'POST') { sent.interview.push(JSON.parse(req.postData())); return route.fulfill({ status: 201, headers: { 'access-control-allow-origin': '*' }, body: '' }); }
      if (!interview) return json(route, { code: 'PGRST116', message: 'no rows' }, 406);
      return json(route, interview);
    }
    if (url.includes('/rest/v1/skill_progress')) {
      if (req.method() === 'POST') { sent.progress.push(JSON.parse(req.postData())); return route.fulfill({ status: 201, headers: { 'access-control-allow-origin': '*' }, body: '' }); }
      return json(route, progress);
    }
    if (url.includes('/rest/v1/profiles')) return json(route, { name: 'Tester' });
    return json(route, []);
  });
  await page.addInitScript(([me]) => {
    localStorage.setItem('sb-yfxxhiomvtiujpuxwlky-auth-token', JSON.stringify({ access_token: 'test-token', token_type: 'bearer', expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'test-refresh',
      user: { id: me, aud: 'authenticated', role: 'authenticated', email: 'tester@example.invalid', app_metadata: {}, user_metadata: {} } }));
  }, [ME]);
  await page.goto(BASE + '/profile.html', { waitUntil: 'networkidle' });
  await page.waitForSelector('#signed-in:not([hidden])', { timeout: 10000 }).catch(() => {});
  return { page, errors, sent };
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const results = [];
  const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
  const progress = [{ skill_id: 'build-a-campfire', level: 2, steps_done: [1, 2, 3, 4, 5], completed_at: '2026-11-20T00:00:00Z', updated_at: '2026-11-20T00:00:00Z' }];

  for (const [label, viewport] of [['desktop', { width: 1200, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
    const { page, errors, sent } = await setup(browser, viewport, { interview: null, progress });
    check(`${label}: interview form shows before any answers`, await page.locator('#interview-form').isVisible());
    check(`${label}: no suggestions before the interview`, (await page.locator('#recommendations').innerText()).includes('Answer the questions'));
    await page.locator('#save-interview').click();
    check(`${label}: age is required`, (await page.locator('#interview-form .status').innerText()).includes('age range'));
    await page.locator('#age-25-34').check();
    await page.locator('#stage-new-parent').check();
    await page.locator('#goal-family').check();
    await page.locator('#goal-emergencies').check();
    await page.locator('#time-1h').check();
    await page.locator('#skip-firearms').check();
    await page.locator('#save-interview').click();
    await page.waitForTimeout(500);
    const saved = sent.interview[0];
    check(`${label}: interview saves age range, stage, goals, time and skips`, !!saved && saved.age_band === '25-34' && saved.life_stages.join() === 'new-parent'
      && saved.goals.sort().join() === 'emergencies,family' && saved.weekly_time === '1h' && saved.skip.join() === 'firearms' && saved.user_id === ME, JSON.stringify(saved));
    check(`${label}: answers summary replaces the form`, (await page.locator('#interview .answers').count()) === 1 && (await page.locator('#interview-form').count()) === 0);
    const recs = page.locator('#recommendations .rec');
    check(`${label}: three suggestions`, (await recs.count()) === 3, String(await recs.count()));
    const first = await recs.first().innerText();
    check(`${label}: first suggestion is first aid with reasons`, /medic/i.test(first) && /lifesaving|goal/i.test(first), first.split('\n').slice(0, 3).join(' / '));
    check(`${label}: suggestions explain why`, (await page.locator('#recommendations .reasons li').count()) >= 3);
    check(`${label}: 13 branches in the tree`, (await page.locator('.branch').count()) === 13);
    check(`${label}: completed skill shows as done`, (await page.locator('.node[data-skill="build-a-campfire"]').getAttribute('class')).includes('done'));
    check(`${label}: completing a prerequisite unlocks the next skill`, (await page.locator('.node[data-skill="make-fire-without-matches"]').getAttribute('class')).includes('available'));
    check(`${label}: unmet prerequisites lock a skill`, (await page.locator('.node[data-skill="survive-a-bear-attack"]').getAttribute('class')).includes('locked'));
    check(`${label}: locked skill says what to learn first`, ((await page.locator('.node[data-skill="survive-a-bear-attack"]').getAttribute('aria-label')) || '').includes('Learn first'));
    check(`${label}: skipped topics are greyed out`, (await page.locator('.node[data-skill="shoot-a-gun"]').getAttribute('class')).includes('skipped'));
    check(`${label}: suggested skills are highlighted in the tree`, (await page.locator('.node.next').count()) === 3);
    check(`${label}: Survivor branch rank`, (await page.locator('.branch[data-branch="survivor"] .branch-rank').innerText()).startsWith('Novice · 1/10'));
    check(`${label}: tree nodes link to courses`, (await page.locator('.node[data-skill="perform-cpr"]').getAttribute('href')) === 'skills.html#skill-perform-cpr');
    await page.locator('#level-tie-a-bowline').selectOption('2');
    await page.waitForTimeout(400);
    check(`${label}: rating a prerequisite Practising unlocks its next skill`, (await page.locator('.node[data-skill="build-a-shelter"]').getAttribute('class')).includes('available'));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${label}: no horizontal scroll`, overflow <= 0, `${overflow}px`);
    check(`${label}: no page errors`, errors.length === 0, errors.join(' | '));
  }

  // Returning user with saved answers; a teenager never sees adult-only suggestions.
  const teen = { age_band: '13-17', life_stages: ['student'], goals: ['fun', 'outdoors', 'cooking'], weekly_time: '5h+', skip: [] };
  const { page, errors } = await setup(browser, { width: 1200, height: 900 }, { interview: teen, progress: [] });
  check('returning: saved answers shown', (await page.locator('#interview .answers').innerText()).includes('13 to 17'));
  check('teen: adult-only skills greyed out in tree', (await page.locator('.node[data-skill="mix-two-classic-cocktails"]').getAttribute('class')).includes('skipped')
    && (await page.locator('.node[data-skill="shoot-a-gun"]').getAttribute('class')).includes('skipped'));
  const teenRecs = await page.locator('#recommendations').innerText();
  check('teen: no adult-only suggestions', !/Pour Beer|Cocktail|Shoot a Gun|Hunt|Chainsaw|Motorcycle/i.test(teenRecs));
  await page.locator('#edit-interview').click();
  check('returning: change answers opens a prefilled form', await page.locator('#age-13-17').isChecked() && await page.locator('#goal-fun').isChecked());
  check('returning: no page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  console.log(results.join('\n'));
  console.log(results.some(r => r.startsWith('FAIL')) ? 'SOME FAILED' : 'ALL PASSED');
})().catch(e => { console.error(e); process.exit(1); });
