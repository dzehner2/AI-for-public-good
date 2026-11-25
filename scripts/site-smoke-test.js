const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8080';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const results = [];
  const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
  for (const [label, viewport] of [['desktop', { width: 1280, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    await page.route('https://yfxxhiomvtiujpuxwlky.supabase.co/**', route => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '[]' }));
    await page.route('https://yfxxhiomvtiujpuxwlky.supabase.co/rest/v1/projects*', route => route.fulfill({
      status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify([{ id: 'approved-test', domain: 'Water', title: 'Approved test project', body: 'Added from a suggestion.', sources: [], channels: [], created_at: '2026-11-01T00:00:00Z' }])
    }));
    await page.goto(BASE + '/ideas.html', { waitUntil: 'networkidle' });
    await page.waitForSelector('#cards .card', { timeout: 15000 }).catch(() => {});
    const cards = await page.locator('#cards .card').count();
    check(`${label}: list shows built-in and approved projects`, cards >= 11, `${cards} cards`);
    check(`${label}: approved project from the database is listed`, (await page.locator('#cards').innerText()).includes('Approved test project'));
    check(`${label}: no database-error notice`, !(await page.locator('#notice').isVisible()), await page.locator('#notice').textContent());
    check(`${label}: sign-in link button shown`, await page.getByRole('button', { name: 'Email me a sign-in link' }).isVisible());
    check(`${label}: Google button shown`, await page.getByRole('button', { name: 'Continue with Google' }).isVisible());
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${label}: no horizontal scroll`, overflow <= 0, `overflow ${overflow}px`);

    await page.goto(BASE + '/ideas.html#project-water-disclosure-checklist', { waitUntil: 'networkidle' });
    await page.waitForSelector('#project-head h1', { timeout: 15000 }).catch(() => {});
    check(`${label}: project page title renders`, (await page.locator('#project-head h1').textContent()).includes('resident checklist'));
    check(`${label}: offer form hidden when signed out`, await page.locator('#offer-form').isHidden());
    check(`${label}: asks to sign in to offer help`, await page.locator('#offer-signin').isVisible());
    check(`${label}: asks to sign in to comment`, await page.locator('#comment-signin').isVisible());
    check(`${label}: no comment or offer entries`, (await page.locator('#comments-list .entry, #offers-list .entry').count()) === 0);
    const bodyText = await page.locator('main').innerText();
    check(`${label}: no money offer option`, !(await page.locator('#offer-type option[value="money"]').count()));

    await page.goto(BASE + '/ideas.html#suggest', { waitUntil: 'networkidle' });
    check(`${label}: suggest needs sign-in`, await page.locator('#suggest-signin').isVisible());
    check(`${label}: suggest form hidden`, await page.locator('#suggest-form').isHidden());

    await page.goto(BASE + '/ideas.html#review', { waitUntil: 'networkidle' });
    check(`${label}: review nav hidden for visitors`, await page.locator('#nav-review').isHidden());

    if (label === 'desktop') await page.screenshot({ path: process.env.SHOT_DIR + '/list-desktop.png' });
    if (label === 'phone') await page.screenshot({ path: process.env.SHOT_DIR + '/list-phone.png' });
    check(`${label}: no page errors`, errors.length === 0, errors.slice(0, 5).join(' | '));
    await ctx.close();
  }
  const landing = await browser.newPage();
  await landing.goto(BASE + '/', { waitUntil: 'networkidle' });
  check('landing page loads and links to ideas', (await landing.locator('a[href="ideas.html"]').count()) >= 1);
  check('landing shows owner contact on mockup', (await landing.locator('text=themechwhisperer@gmail.com').count()) >= 1);
  await browser.close();
  console.log(results.join('\n'));
  console.log(results.filter(r => r.startsWith('FAIL')).length ? 'SOME FAILED' : 'ALL PASSED');
})().catch(e => { console.error(e); process.exit(1); });
