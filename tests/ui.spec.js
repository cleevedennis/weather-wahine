// Controls, resilience, layout, accessibility and calendar export.
const fs = require('fs');
const { test, expect, devices } = require('@playwright/test');
const { marineSine, weatherDaily, openPage } = require('./helpers');

test('opens on All beaches: two requests cover every beach; picking one reuses them; reload returns', async ({ page }) => {
  const { requests, errors } = await openPage(page, { beach: null });
  await expect(page.locator('#loc')).toHaveValue('All beaches');
  const lats = (part) => requests.filter((u) => u.includes(part)).map((u) => new URL(u).searchParams.get('latitude').split(','));
  expect(lats('/v1/forecast')).toHaveLength(1);
  expect(lats('/v1/forecast')[0]).toHaveLength(8);
  expect(lats('/v1/marine')[0]).toHaveLength(5);                   // the harbour gets no offshore swell or model tide
  requests.length = 0;
  const names = (await page.locator('#loc option').allTextContents()).slice(1);
  for (const n of names) {
    await page.selectOption('#loc', n);
    await page.waitForFunction((n) => state.key === n, n);
  }
  expect(requests).toEqual([]);
  await page.reload();
  await page.waitForFunction(() => state.key === 'All beaches');
  await expect(page.locator('#loc')).toHaveValue('All beaches');
  expect(errors).toEqual([]);
});

test('All beaches: tournament grid, medal days grouped by best medal, tap opens that beach and day', async ({ page }) => {
  // Day 1 rains (out everywhere); days 3 and 6 are cloudy and cool (lower medals).
  const w = weatherDaily(16, (i) => (i === 1 ? { rain: 70 } : i === 3 || i === 6 ? { code: 3, tmax: 18 } : {}));
  await openPage(page, { beach: null, weather: w, marine: marineSine(16) });
  await expect(page.locator('#tideCard')).toBeHidden();
  await expect(page.locator('#listCard')).toBeHidden();
  await expect(page.locator('#tour .nm')).toHaveText(['Huia Domain', 'Kaitarakihi', 'Cornwallis', 'Whatipu', 'Karekare', 'Piha', 'Te Henga', 'Muriwai']);
  const md = await page.evaluate(() => state.medalDays.map((x) => ({ i: x.i, tier: x.tier, beach: x.best.loc.name, n: x.beaches.length })));
  expect(md.map((x) => x.i)).not.toContain(1);
  expect(new Set(md.map((x) => x.i)).size).toBe(md.length);    // each day once
  const tiers = ['platinum', 'gold', 'silver', 'bronze'].filter((t) => md.some((x) => x.tier === t));
  await expect(page.locator('#medals .tier-h .medal')).toHaveText(tiers.map((t) => t[0].toUpperCase() + t.slice(1)));
  await expect(page.locator('#medals .day-row')).toHaveCount(md.length);
  await expect(page.locator('#medalCount')).toHaveText(`${md.length} days`);
  // Harbour beaches have no tides in the gate (no LINZ offsets), so the 5 coast beaches share each medal.
  expect(md.every((x) => x.n === 5)).toBe(true);
  await expect(page.locator('#medals .day-row .beach').first()).toHaveText(`${md[0].beach} +4 more`);
  await expect(page.locator('#heroCond')).toHaveText(md[0].i === 0 ? /^Today/ : /\w+day/);
  await expect(page.locator('#heroBadges')).toContainText(`★ ${tiers[0][0].toUpperCase() + tiers[0].slice(1)} day`);
  // Dots: one per beach-day with a medal; rainy day 1 shows rings on the coast
  const medals = await page.evaluate(() => state.beaches.reduce((s, b) => s + b.days.filter((d) => d.medal).length, 0));
  await expect(page.locator('#tour .cell:not(.out)')).toHaveCount(medals);
  await expect(page.locator('#tour .cell.out[data-i="1"]')).toHaveCount(5);
  await page.click('#tour .cell[data-b="Muriwai"][data-i="3"]');
  await page.waitForFunction(() => state.key === 'Muriwai');
  await expect(page.locator('#loc')).toHaveValue('Muriwai');
  await expect(page.locator('#list .day-row.sel')).toHaveAttribute('data-i', '3');
  await expect(page.locator('#tideCard')).toBeVisible();
});

test('tapping a best day or list row selects it', async ({ page }) => {
  await openPage(page);
  await page.click('#list .day-row[data-i="5"]');
  await expect(page.locator('#dayLabel')).not.toHaveText('Today');
  await page.click('#best .day-row >> nth=0');
  const i = await page.locator('#best .day-row').first().getAttribute('data-i');
  await expect(page.locator('#list .day-row.sel')).toHaveAttribute('data-i', i);
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
  await expect(page.locator('#list .day-row.skeleton')).toHaveCount(6);
  await page.click('#list .day-row[data-i="1"]');
  await page.click('#list .day-row[data-i="12"]');
  await expect(page.locator('#heroCond')).toHaveText('No forecast yet');
  expect(errors).toEqual([]);
});

for (const [name, use] of [['iPhone SE', devices['iPhone SE']], ['Pixel 7', devices['Pixel 7']], ['320px', { viewport: { width: 320, height: 640 } }], ['desktop', { viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false }]]) {
  test.describe(name, () => {
    const { defaultBrowserType, ...rest } = use;  // browser type is fixed in the config
    test.use(rest);
    test(`no sideways scroll or clipped content (${name})`, async ({ page }) => {
      await openPage(page, { beach: null });
      for (const beach of [null, 'Piha']) {
        if (beach) { await page.selectOption('#loc', beach); await page.waitForFunction((b) => state.key === b, beach); }
        const [sw, iw, clipped] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth,
          [...document.querySelectorAll('.card, .day-row, .tour')].filter((e) => e.offsetParent && e.scrollWidth > e.clientWidth + 1).length]);
        expect(sw, `${beach || 'All beaches'}`).toBeLessThanOrEqual(iw);
        expect(clipped, `${beach || 'All beaches'}`).toBe(0);
      }
    });
  });
}

test('accessibility: no axe violations, days keyboard-focusable', async ({ page }) => {
  await openPage(page, { beach: null });
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  for (const beach of [null, 'Piha']) {
    if (beach) { await page.selectOption('#loc', beach); await page.waitForFunction((b) => state.key === b, beach); }
    const violations = await page.evaluate(async () => (await axe.run(document)).violations.map((v) => `${v.id}: ${v.nodes.length}`));
    expect(violations, `${beach || 'All beaches'}`).toEqual([]);
    expect(await page.locator('[data-i]:not([tabindex="0"])').count()).toBe(0);
  }
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
  // One event per Best day, each with its medal
  expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(4);
  const summaries = ics.replace(/\r\n /g, '').split('\r\n').filter((l) => l.startsWith('SUMMARY:'));
  const want = await page.evaluate(() => state.ranked.slice(0, 4).map(({ d }) => d.medal[0].toUpperCase() + d.medal.slice(1)));
  expect(summaries.map((l) => l.match(/★ (\w+)/)[1])).toEqual(want);
  expect(summaries.every((l) => /High tide \d/.test(l) && l.endsWith('(Piha)'))).toBe(true);
  fs.mkdirSync('test-results/exports', { recursive: true });
  fs.writeFileSync(`test-results/exports/${info.project.name}-export.ics`, ics);
  // All beaches: one event per medal day, at its top beach
  await page.selectOption('#loc', 'All beaches'); await page.waitForFunction(() => state.key === 'All beaches');
  const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('#ics')]);
  const all = fs.readFileSync(await dl2.path(), 'utf8');
  const n = await page.evaluate(() => state.medalDays.length);
  expect(all.match(/BEGIN:VEVENT/g)).toHaveLength(n);
  expect(all).toContain('X-WR-CALNAME:Weather Wahine – All beaches');
  const allUids = all.split('\r\n').filter((l) => l.startsWith('UID:'));
  expect(new Set(allUids).size).toBe(n);
  fs.writeFileSync(`test-results/exports/${info.project.name}-all-export.ics`, all);
});
