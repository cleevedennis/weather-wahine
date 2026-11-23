// Controls, resilience, layout, accessibility and calendar export.
const fs = require('fs');
const { test, expect, devices } = require('@playwright/test');
const { marineSine, weatherDaily, openPage } = require('./helpers');

test('all beaches load and persist by name across reloads', async ({ page }) => {
  const { requests, errors } = await openPage(page);
  const names = await page.locator('#loc option').allTextContents();
  const lats = new Set();
  for (const n of [...names].reverse()) {
    requests.length = 0;
    await page.selectOption('#loc', n);
    await page.waitForFunction((n) => state.key === n, n);
    requests.forEach((u) => lats.add(new URL(u).searchParams.get('latitude')));
  }
  expect(lats.size).toBe(names.length);
  await page.selectOption('#loc', 'Te Henga');
  await page.reload();
  await page.waitForFunction(() => state.key === 'Te Henga');
  expect(errors).toEqual([]);
});

test('old saved beach index falls back to Piha', async ({ page }) => {
  await openPage(page);
  await page.evaluate(() => localStorage.setItem('ww-prefs', JSON.stringify({ loc: '5' })));
  await page.reload();
  await expect(page.locator('#loc')).toHaveValue('Piha');
});

test('tapping a calendar day or list row selects it', async ({ page }) => {
  await openPage(page);
  await page.click('.cal .cell[data-i="5"]');
  await expect(page.locator('#dayLabel')).not.toHaveText('Today');
  await page.click('#list .row[data-i="2"]');
  await expect(page.locator('.cal .cell.sel')).toHaveAttribute('data-i', '2');
});

test('resumed page refetches when data is over an hour old', async ({ page }) => {
  const { requests } = await openPage(page);
  requests.length = 0;
  await page.evaluate(() => { state.fetchedAt = Date.now() - 2 * 3600e3; document.dispatchEvent(new Event('visibilitychange')); });
  await expect.poll(() => requests.length).toBe(2);
});

for (const [name, status] of [['tide', 'marine'], ['weather', 'weather']]) {
  test(`${name} service down shows a friendly error`, async ({ page }) => {
    const opts = status === 'marine' ? { marineStatus: 500 } : { weatherStatus: 502 };
    await openPage(page, opts);
    await expect(page.locator('#status')).toContainText("Couldn't load the forecast");
  });
}

test('missing forecast days and tide gaps render without errors', async ({ page }) => {
  const m = marineSine(); for (let h = 30; h < 60; h++) m.hourly.sea_level_height_msl[h] = null;
  const { errors } = await openPage(page, { marine: m, weather: weatherDaily(16, (i) => (i > 9 ? { code: null, tmax: null, tmin: null, rain: null } : {})) });
  await expect(page.locator('#list .row.skeleton')).toHaveCount(6);
  await page.click('.cal .cell[data-i="1"]');
  await page.click('.cal .cell[data-i="12"]');
  await expect(page.locator('#heroCond')).toHaveText('No forecast yet');
  expect(errors).toEqual([]);
});

for (const [name, use] of [['iPhone SE', devices['iPhone SE']], ['Pixel 7', devices['Pixel 7']], ['320px', { viewport: { width: 320, height: 640 } }], ['desktop', { viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false }]]) {
  test.describe(name, () => {
    const { defaultBrowserType, ...rest } = use;  // browser type is fixed in the config
    test.use(rest);
    test(`no sideways scroll or clipped content (${name})`, async ({ page }) => {
      await openPage(page);
      const [sw, iw, clipped] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth,
        [...document.querySelectorAll('.card, .row, .cal .cell')].filter((e) => e.scrollWidth > e.clientWidth + 1).length]);
      expect(sw).toBeLessThanOrEqual(iw);
      expect(clipped).toBe(0);
    });
  });
}

test('accessibility: no axe violations, days keyboard-focusable', async ({ page }) => {
  await openPage(page);
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const violations = await page.evaluate(async () => (await axe.run(document)).violations.map((v) => `${v.id}: ${v.nodes.length}`));
  expect(violations).toEqual([]);
  expect(await page.locator('[data-i]:not([tabindex="0"])').count()).toBe(0);
});

test('calendar export: valid structure, folded lines; saved for the external validator', async ({ page }, info) => {
  await openPage(page, { marine: marineSine(16, 13.2, (d) => (d === 3 ? 3.4 : 1)), weather: weatherDaily(16, (i) => ({ code: i % 3 ? 0 : 3 })) });
  await page.click('#settings summary');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#ics')]);
  const ics = fs.readFileSync(await dl.path(), 'utf8');
  const lines = ics.split('\r\n');
  expect(lines[0]).toBe('BEGIN:VCALENDAR');
  expect(lines.at(-1)).toBe('END:VCALENDAR');
  expect(ics).toContain('BEGIN:VTIMEZONE');
  expect(lines.filter((l) => Buffer.byteLength(l) > 75)).toEqual([]);
  const uids = lines.filter((l) => l.startsWith('UID:'));
  expect(new Set(uids).size).toBe(uids.length);
  fs.mkdirSync('test-results/exports', { recursive: true });
  fs.writeFileSync(`test-results/exports/${info.project.name}-export.ics`, ics);
});
