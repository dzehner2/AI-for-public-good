// Browser test for signed-in screens: offer contact choice and messages.
// Uses a fake session and mocked Supabase responses, so it checks the page, not the database.
// The database rules are tested separately in supabase/tests/*.sql.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8080';
const SB = 'https://yfxxhiomvtiujpuxwlky.supabase.co';
const ME = '11111111-1111-4111-8111-111111111111';
const OLIVE = '22222222-2222-4222-8222-222222222222';
const ASH = '33333333-3333-4333-8333-333333333333';
const PROJECT = 'water-disclosure-checklist';

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  const results = [];
  const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const sent = [];

  const json = (route, body) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
  await page.route(SB + '/**', async route => {
    const req = route.request();
    const url = req.url();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (req.method() === 'POST' || req.method() === 'PATCH') sent.push({ url, body: req.postData() });
    if (url.includes('/rest/v1/projects')) return json(route, []);
    if (url.includes('/rest/v1/profiles')) return json(route, [{ id: ME, name: 'Me Tester' }, { id: OLIVE, name: 'Olive' }, { id: ASH, name: 'Ash' }]);
    if (url.includes('/rest/v1/admins')) return json(route, []);
    if (url.includes('/rest/v1/comments')) return json(route, []);
    if (url.includes('/rest/v1/suggestions')) return json(route, []);
    if (url.includes('/rpc/hot_project_ids')) return json(route, []);
    if (url.includes('/rpc/list_offers')) return json(route, [
      { id: 'o-open', project_id: PROJECT, type: 'expertise', details: 'Olive can review drafts', available: '', anonymous: false, contact_ok: true, created_at: '2026-11-20T00:00:00Z', author_id: OLIVE, is_mine: false },
      { id: 'o-closed', project_id: PROJECT, type: 'time', details: 'Anonymous helper, no contact', available: '', anonymous: true, contact_ok: false, created_at: '2026-11-21T00:00:00Z', author_id: null, is_mine: false },
      { id: 'o-mine', project_id: PROJECT, type: 'ideas', details: 'My own offer', available: '', anonymous: false, contact_ok: true, created_at: '2026-11-22T00:00:00Z', author_id: ME, is_mine: true }
    ]);
    if (url.includes('/rpc/list_messages')) return json(route, [
      { id: 'm1', offer_id: 'o-mine', project_id: PROJECT, asker_id: ASH, offerer_id: ME, i_am_offerer: true, from_me: false, body: 'Hi, could we talk about your idea?', created_at: '2026-11-23T10:00:00Z' }
    ]);
    if (url.includes('/rpc/send_message') || url.includes('/rpc/reply_message')) return json(route, '00000000-0000-4000-8000-000000000999');
    if (url.includes('/rest/v1/offers')) return route.fulfill({ status: 201, headers: { 'access-control-allow-origin': '*' }, body: '' });
    return json(route, {});
  });

  // A stored session so the page starts signed in. Not a real token; every request is mocked.
  await page.addInitScript(([me]) => {
    const session = { access_token: 'test-token', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'test-refresh', user: { id: me, aud: 'authenticated', role: 'authenticated', email: 'tester@example.invalid', app_metadata: {}, user_metadata: {} } };
    localStorage.setItem('sb-yfxxhiomvtiujpuxwlky-auth-token', JSON.stringify(session));
  }, [ME]);

  await page.goto(BASE + '/ideas.html#project-' + PROJECT, { waitUntil: 'networkidle' });
  await page.waitForSelector('#offers-list .entry', { timeout: 15000 }).catch(() => {});
  check('signed-in: offer form visible', await page.locator('#offer-form').isVisible());
  check('offer form has the contact choice', await page.locator('#offer-contact').isVisible());
  check('contact choice starts unticked', !(await page.locator('#offer-contact').isChecked()));
  const offers = page.locator('#offers-list .entry');
  check('three offers listed', (await offers.count()) === 3, String(await offers.count()));
  check('open offer says open to contact', (await offers.nth(0).innerText()).includes('Open to being contacted'));
  check('open offer has Send a message', await offers.nth(0).getByRole('button', { name: 'Send a message' }).isVisible());
  check('closed offer has no Send a message', (await offers.nth(1).getByRole('button', { name: 'Send a message' }).count()) === 0);
  check('closed offer says not taking messages', (await offers.nth(1).innerText()).includes('Not taking messages'));
  check('own offer has no Send a message', (await offers.nth(2).getByRole('button', { name: 'Send a message' }).count()) === 0);
  check('Messages link shows one conversation', (await page.locator('#nav-messages').innerText()) === 'Messages (1)');

  await offers.nth(0).getByRole('button', { name: 'Send a message' }).click();
  await page.locator('#compose-o-open').fill('Write to me at me@example.com');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  check('message with an email is stopped in the page', (await page.locator('#offers-list').innerText()).includes("can't include email"));
  check('blocked message was not sent', !sent.some(s => s.url.includes('send_message')));
  await page.locator('#compose-o-open').fill('Could you review our checklist this week?');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.waitForTimeout(500);
  const send = sent.find(s => s.url.includes('/rpc/send_message'));
  check('send_message called with the offer and text', !!send && JSON.parse(send.body).p_offer === 'o-open' && JSON.parse(send.body).p_body.startsWith('Could you'), send && send.body);
  check('sent notice shown', (await page.locator('#notice').innerText()).includes('Message sent'));

  // Edit own offer: contact toggle present and saved.
  await offers.nth(2).getByRole('button', { name: 'Edit' }).click();
  check('editing own offer shows contact toggle', await page.locator('#edit-contact_ok').isVisible());
  check('toggle reflects current choice', await page.locator('#edit-contact_ok').isChecked());
  await page.locator('#edit-contact_ok').uncheck();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForTimeout(500);
  const patch = sent.find(s => s.url.includes('/rest/v1/offers') && s.url.includes('o-mine'));
  check('saving sends contact_ok false', !!patch && JSON.parse(patch.body).contact_ok === false, patch && patch.body);

  // New offer includes the choice.
  await page.locator('#offer-details').fill('I can map local water permits');
  await page.locator('#offer-contact').check();
  await page.getByRole('button', { name: 'Offer help' }).click();
  await page.waitForTimeout(500);
  const ins = sent.find(s => s.url.includes('/rest/v1/offers') && !s.url.includes('o-mine'));
  check('new offer sends contact_ok true', !!ins && JSON.parse(ins.body).contact_ok === true, ins && ins.body);
  check('contact choice resets after sending', !(await page.locator('#offer-contact').isChecked()));

  // Messages page: thread and reply.
  await page.goto(BASE + '/ideas.html#messages', { waitUntil: 'networkidle' });
  await page.waitForSelector('#messages-list .thread', { timeout: 10000 }).catch(() => {});
  const thread = page.locator('#messages-list .thread');
  check('messages page shows the conversation', (await thread.count()) === 1);
  check('conversation names the other person', (await thread.innerText()).includes('About your offer, with Ash'));
  await thread.locator('textarea').fill('Happy to. Tuesday works.');
  await thread.getByRole('button', { name: 'Reply' }).click();
  await page.waitForTimeout(500);
  const reply = sent.find(s => s.url.includes('/rpc/reply_message'));
  check('offerer reply calls reply_message for that asker', !!reply && JSON.parse(reply.body).p_asker === ASH && JSON.parse(reply.body).p_offer === 'o-mine', reply && reply.body);

  check('no page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  console.log(results.join('\n'));
  console.log(results.some(r => r.startsWith('FAIL')) ? 'SOME FAILED' : 'ALL PASSED');
})().catch(e => { console.error(e); process.exit(1); });
