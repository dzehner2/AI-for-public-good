// Browser test for the skills profile and course progress, with a fake session and mocked Supabase.
// Database rules are tested separately in supabase/tests/skill_progress_test.sql.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8080';
const SB = 'https://yfxxhiomvtiujpuxwlky.supabase.co';
const ME = '11111111-1111-4111-8111-111111111111';

async function mockSupabase(page, sent, rows) {
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
  await page.route(SB + '/**', async route => {
    const req = route.request();
    const url = req.url();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (url.includes('/rest/v1/skill_progress')) {
      if (req.method() === 'POST') { sent.push(JSON.parse(req.postData())); return route.fulfill({ status: 201, headers: { 'access-control-allow-origin': '*' }, body: '' }); }
      return json(route, rows);
    }
    if (url.includes('/rest/v1/profiles')) return json(route, { name: 'Tester' });
    return json(route, []);
  });
}

async function signIn(page) {
  await page.addInitScript(([me]) => {
    localStorage.setItem('sb-yfxxhiomvtiujpuxwlky-auth-token', JSON.stringify({ access_token: 'test-token', token_type: 'bearer', expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'test-refresh',
      user: { id: me, aud: 'authenticated', role: 'authenticated', email: 'tester@example.invalid', app_metadata: {}, user_metadata: {} } }));
  }, [ME]);
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const results = [];
  const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
  const rows = [
    { skill_id: 'perform-cpr', level: 1, steps_done: [1, 2], completed_at: null, updated_at: '2026-11-24T00:00:00Z' },
    { skill_id: 'tie-a-bowline', level: 3, steps_done: [1, 2, 3, 4], completed_at: '2026-11-20T00:00:00Z', updated_at: '2026-11-20T00:00:00Z' },
    { skill_id: 'tell-a-joke', level: 4, steps_done: [], completed_at: null, updated_at: '2026-11-21T00:00:00Z' }
  ];

  for (const [label, viewport] of [['desktop', { width: 1200, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
    const page = await (await browser.newContext({ viewport })).newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const sent = [];
    await mockSupabase(page, sent, rows);
    await signIn(page);
    await page.goto(BASE + '/profile.html', { waitUntil: 'networkidle' });
    await page.waitForSelector('#signed-in:not([hidden])', { timeout: 10000 }).catch(() => {});
    check(`${label}: profile shows when signed in`, await page.locator('#signed-in').isVisible());
    check(`${label}: overall level from one completed course`, (await page.locator('#level-title').innerText()) === 'Level 1: Newcomer');
    check(`${label}: next level hint`, (await page.locator('#level-next').innerText()).includes('2 more courses'));
    check(`${label}: stats`, (await page.locator('#stat-completed').innerText()) === '1' && (await page.locator('#stat-progress').innerText()) === '1'
      && (await page.locator('#stat-rated').innerText()) === '3' && (await page.locator('#stat-teach').innerText()) === '1');
    check(`${label}: can-teach hint links to teacher sign-up`, await page.locator('#teach-hint').isVisible());
    check(`${label}: all 100 skills listed`, (await page.locator('.skill-row').count()) === 100);
    check(`${label}: saved levels shown`, (await page.locator('#level-perform-cpr').inputValue()) === '1' && (await page.locator('#level-tell-a-joke').inputValue()) === '4');
    await page.getByRole('button', { name: 'Completed', exact: true }).click();
    check(`${label}: Completed filter`, (await page.locator('.skill-row').count()) === 1 && (await page.locator('.skill-row').innerText()).includes('Tie a Bowline'));
    await page.getByRole('button', { name: 'In progress', exact: true }).click();
    check(`${label}: In progress filter shows steps`, (await page.locator('.skill-row').innerText()).includes('2 of 5 steps done'));
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await page.locator('#level-hunt').selectOption('2');
    await page.waitForTimeout(400);
    const saveLevel = sent.find(r => r.skill_id === 'hunt');
    check(`${label}: changing a rating saves it`, !!saveLevel && saveLevel.level === 2 && saveLevel.user_id === ME, JSON.stringify(saveLevel));
    check(`${label}: rated count updates`, (await page.locator('#stat-rated').innerText()) === '4');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${label}: no horizontal scroll on profile`, overflow <= 0, `${overflow}px`);

    // Course page: tick steps, complete, level up.
    await page.goto(BASE + '/skills.html#skill-perform-cpr', { waitUntil: 'networkidle' });
    await page.waitForSelector('#step-1', { timeout: 10000 }).catch(() => {});
    check(`${label}: course shows tick boxes when signed in`, (await page.locator('.step-list input[type=checkbox]').count()) === 5);
    check(`${label}: saved steps are ticked`, (await page.locator('#step-1').isChecked()) && (await page.locator('#step-2').isChecked()) && !(await page.locator('#step-3').isChecked()));
    check(`${label}: complete button waits for all steps`, await page.locator('#complete-course').isDisabled());
    for (const n of [3, 4, 5]) { await page.locator(`#step-${n}`).check(); await page.waitForTimeout(150); }
    const lastSteps = sent.filter(r => r.skill_id === 'perform-cpr').pop();
    check(`${label}: ticking saves steps`, !!lastSteps && lastSteps.steps_done.join(',') === '1,2,3,4,5', JSON.stringify(lastSteps));
    check(`${label}: complete button enabled after all steps`, await page.locator('#complete-course').isEnabled());
    await page.locator('#complete-course').click();
    await page.waitForTimeout(400);
    const done = sent.filter(r => r.skill_id === 'perform-cpr').pop();
    check(`${label}: completing levels the skill up one`, !!done && done.completed_at && done.level === 2, JSON.stringify(done));
    check(`${label}: completion message shows new overall level`, (await page.locator('#progress-status').innerText()).includes('Practising') && (await page.locator('#progress-status').innerText()).includes('Level 1'));
    check(`${label}: course now shows Completed`, (await page.locator('.completed-badge').count()) === 1 && await page.locator('#complete-course').isDisabled());
    check(`${label}: no page errors`, errors.length === 0, errors.join(' | '));
  }

  // Confident caps completion; and signed-out views.
  const page = await (await browser.newContext()).newPage();
  const sent = [];
  await mockSupabase(page, sent, []);
  await page.goto(BASE + '/profile.html', { waitUntil: 'networkidle' });
  await page.waitForSelector('#signed-out:not([hidden])', { timeout: 10000 }).catch(() => {});
  check('signed out: profile asks to sign in', await page.locator('#signed-out').isVisible() && await page.locator('#signed-in').isHidden());
  await page.goto(BASE + '/skills.html#skill-perform-cpr', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  check('signed out: course has no tick boxes', (await page.locator('.step-list').count()) === 0);
  check('signed out: course offers sign-in to track progress', (await page.locator('.progress-box a[href="profile.html"]').count()) === 1);
  await browser.close();
  console.log(results.join('\n'));
  console.log(results.some(r => r.startsWith('FAIL')) ? 'SOME FAILED' : 'ALL PASSED');
})().catch(e => { console.error(e); process.exit(1); });
