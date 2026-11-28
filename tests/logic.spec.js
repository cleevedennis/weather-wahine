// Tide maths and the sunny / tide / swell rules.
const { test, expect } = require('@playwright/test');
const { marineSine, marinePeaks, weatherDaily, weatherHourly, openPage, days } = require('./helpers');

test('high-tide times are accurate on a known curve, including near midnight', async ({ page }) => {
  await openPage(page);
  const r = await page.evaluate(() => {
    const t = [], l = [];
    for (let h = 0; h < 72; h++) { t.push(`2026-11-${23 + Math.floor(h / 24)}T${String(h % 24).padStart(2, '0')}:00`); l.push(Math.cos(2 * Math.PI * (h - 23.83) / 12.42)); }
    return findHighTides(t, l);
  });
  const expected = [-1, 0, 1, 2, 3].map((k) => 23.83 + k * 12.42).filter((h) => h > 1 && h < 71);
  expect(r).toHaveLength(expected.length);
  r.forEach((got, i) => {
    const gotH = (Date.parse(got.date + 'T00:00Z') - Date.parse('2026-11-23T00:00Z')) / 3600e3 + got.mins / 60;
    expect(Math.abs(gotH - expected[i]) * 60).toBeLessThan(3);
  });
  expect(r[1]).toMatchObject({ date: '2026-11-23' });
  expect(r[1].mins).toBeGreaterThan(1420);
});

test('tide window edges: 11:00 and 4:00pm count, 4:06pm and 10:54am do not', async ({ page }) => {
  await openPage(page, { marine: marinePeaks(4, [11, 24 + 16, 48 + 16.1, 72 + 10.9]), weather: weatherDaily(4) });
  expect((await days(page)).map((d) => d.tide)).toEqual([true, true, false, false]);
});

test('daily fallback rules: 22° and 39% rain count, 21.9° / overcast / 40% rain do not', async ({ page }) => {
  const w = weatherDaily(5, (i) => [{ tmax: 22, rain: 39 }, { tmax: 21.9 }, { code: 3 }, { code: 2, rain: 40 }, { code: 1, rain: null }][i]);
  await openPage(page, { weather: w, marine: marineSine(5) });
  expect((await days(page)).map((d) => d.sunny)).toEqual([true, false, false, false, true]);
});

test('sunny is judged on the tide window hours, not the whole day', async ({ page }) => {
  const w = weatherHourly(3, (i) => ({ code: 53, rain: 40 }), (d, h) => {
    if (d === 0 && h >= 6 && h <= 8) return { code: 53, rain: 60 };   // early drizzle only
    if (d === 1 && h === 13) return { code: 53, rain: 60 };            // drizzle at 1pm
    if (d === 2) return { temp: h === 17 ? 23 : 19 };                  // warm only at 5pm
    return {};
  });
  await openPage(page, { weather: w, marine: marineSine(3) });
  const d = await days(page);
  expect(d.map((x) => x.hourly)).toEqual([true, true, true]);
  expect(d.map((x) => x.sunny)).toEqual([true, false, false]);
});

test('settings re-filter days; reversed or empty settings are handled', async ({ page }) => {
  await openPage(page, { marine: marinePeaks(3, [13, 24 + 13, 48 + 16]), weather: weatherDaily(3) });
  await page.click('#settings summary');
  await page.fill('#minTemp', '26'); await page.dispatchEvent('#minTemp', 'change');
  expect((await days(page)).every((d) => !d.sunny)).toBe(true);
  await page.fill('#from', '17:00'); await page.fill('#to', '11:00'); await page.dispatchEvent('#to', 'change');
  expect((await days(page)).map((d) => d.tide)).toEqual([true, true, true]);  // swapped to 11:00–17:00
  await page.fill('#minTemp', ''); await page.dispatchEvent('#minTemp', 'change');
  expect((await days(page)).every((d) => d.sunny)).toBe(true);                 // falls back to 22°
  await expect(page.locator('#best')).not.toContainText('NaN');
});

test('best days lists the next 4 qualifying days in date order', async ({ page }) => {
  // Day 1 is rainy, so the panel should skip it and show days 0, 2, 3, 4.
  await openPage(page, { marine: marineSine(16), weather: weatherDaily(16, (i) => (i === 1 ? { rain: 60 } : {})) });
  const qualifying = (await days(page)).map((d, i) => (d.both ? i : null)).filter((i) => i != null);
  expect(qualifying.length).toBeGreaterThan(4);
  const shown = await page.locator('#best .best-row').evaluateAll((els) => els.map((e) => +e.dataset.i));
  expect(shown).toEqual(qualifying.slice(0, 4));
  expect(shown).not.toContain(1);
  await expect(page.locator('#bestCount')).toHaveText(`Next 4 of ${qualifying.length}`);
  await expect(page.locator('#best .best-row').first()).toContainText('Today');
  await expect(page.locator('#maxRain')).toHaveCount(0);
});

test('best days with fewer than 4 matches says so', async ({ page }) => {
  await openPage(page, { marine: marineSine(3), weather: weatherDaily(3, (i) => (i === 2 ? { rain: 50 } : {})) });
  await expect(page.locator('#best .best-row')).toHaveCount(2);
  await expect(page.locator('#best')).toContainText('Only 2 days line up');
});

test('big swell (≥ 2.5 m) is flagged everywhere; small swell is not', async ({ page }) => {
  await openPage(page, { marine: marineSine(3, 13.2, (d) => (d === 2 ? 3.2 : 1.1)), weather: weatherDaily(3) });
  const d = await days(page);
  expect(d.map((x) => x.bigSwell)).toEqual([false, false, true]);
  await expect(page.locator('#heroBadges')).toContainText('Swell 1.1 m');
  await expect(page.locator('#list')).toContainText('3.2 m swell');
  await page.click('.cal .cell[data-i="2"]');
  await expect(page.locator('#heroBadges')).toContainText('⚠️ Big swell 3.2 m');
});

test('safety wording: no "Beach day", Safeswim link present', async ({ page }) => {
  await openPage(page);
  expect(await page.content()).not.toContain('Beach day');
  await expect(page.locator('#best a[href*="safeswim.org.nz"]')).toHaveCount(1);
});
