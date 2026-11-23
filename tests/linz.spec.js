// LINZ tide tables: offsets, coverage, and a two-year back-test against the raw CSVs.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { weatherDaily, openPage, days } = require('./helpers');

function csvHighs(file) {
  const ev = [];
  for (const line of fs.readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/)) {
    const r = line.split(',').map((x) => x.trim());
    if (r.length < 6 || !/^\d+$/.test(r[0]) || !/^\d+$/.test(r[3])) continue;
    for (let i = 4; i + 1 < r.length; i += 2) if (r[i] && r[i + 1]) {
      const [h, m] = r[i].split(':').map(Number);
      ev.push([Date.UTC(+r[3], +r[2] - 1, +r[0], h, m) / 60000, +r[i + 1]]);
    }
  }
  ev.sort((a, b) => a[0] - b[0]);
  return ev.filter((e, i) => [ev[i - 1], ev[i + 1]].every((n) => !n || e[1] > n[1])).map((e) => e[0]);
}

test('coast beaches without LINZ offsets use the model; picker is grouped', async ({ page }) => {
  await openPage(page);
  await expect(page.locator('#loc optgroup')).toHaveCount(2);
  await expect(page.locator('#loc optgroup[label="Manukau Harbour"] option')).toHaveText(['Huia Domain', 'Kaitarakihi', 'Cornwallis']);
  await expect(page.locator('#loc optgroup[label="West Coast"] option')).toHaveText(['Whatipu', 'Karekare', 'Piha', 'Te Henga', 'Muriwai']);
  expect(await page.evaluate(() => state.tideSource)).toBe('model');
});

test('harbour beaches without LINZ offsets show weather only, tides marked not set up', async ({ page }) => {
  const { requests, errors } = await openPage(page, { weather: weatherDaily(16) });
  requests.length = 0;
  await page.selectOption('#loc', 'Kaitarakihi');
  await page.waitForFunction(() => state.key === 'Kaitarakihi');
  expect(requests.some((u) => u.includes('marine'))).toBe(false);          // no model tides or offshore swell
  expect(await page.evaluate(() => state.tideSource)).toBe('pending');
  const d = await days(page);
  expect(d.every((x) => !x.tide && !x.hasTide && x.wave == null)).toBe(true);
  expect(d.some((x) => x.sunny)).toBe(true);                               // weather still works
  await expect(page.locator('#best')).toContainText("Tide times for Kaitarakihi aren't set up yet");
  await expect(page.locator('#tideSvg')).toContainText("aren't set up yet");
  expect(errors).toEqual([]);
});

test('LINZ offsets: times = Onehunga + offset, full coverage, harbour beach gets tides, no model call', async ({ page }) => {
  const { requests } = await openPage(page, { linz: { Piha: { hw: -100 }, 'Huia Domain': { hw: -40, lw: -45 } }, weather: weatherDaily(16) });
  const d = await days(page);
  expect(d[0].highs).toEqual([8 * 60 + 29, 20 * 60 + 46]);       // Onehunga 10:09 & 22:26 − 1h40m
  expect(d.every((x) => x.hasTide)).toBe(true);
  expect(requests.filter((u) => u.includes('sea_level_height_msl'))).toHaveLength(0);
  await expect(page.locator('#tideSrc')).toContainText('Official LINZ prediction (Onehunga −1h 40m)');
  await page.selectOption('#loc', 'Huia Domain');
  await page.waitForFunction(() => state.key === 'Huia Domain');
  expect((await days(page))[0].highs).toEqual([9 * 60 + 29, 21 * 60 + 46]);
});

test('LINZ beach still works when the swell feed is down', async ({ page }) => {
  await openPage(page, { linz: { Piha: { hw: -100 } }, marineStatus: 'abort' });
  await expect(page.locator('#status')).toContainText('Updated');
});

test('two-year back-test: every LINZ high tide reproduced to the minute, incl. DST days', async ({ page }) => {
  await openPage(page);
  const files = fs.readdirSync('data').filter((f) => /^Onehunga_\d{4}\.csv$/.test(f)).map((f) => path.join('data', f));
  const expected = files.flatMap(csvHighs);
  const first = new Date(expected[0] * 60000).toISOString().slice(0, 10);
  const last = new Date(expected.at(-1) * 60000).toISOString().slice(0, 10);
  for (const off of [-100, -40, 30]) {
    const got = await page.evaluate(([off, first, last]) => {
      const dates = []; for (let d = Date.parse(first + 'T00:00Z') + 864e5; d < Date.parse(last + 'T00:00Z'); d += 864e5) dates.push(new Date(d).toISOString().slice(0, 10));
      const t = linzTides({ linz: { hw: off, lw: off } }, dates);
      return { highs: t.highs.filter((h) => dates.includes(h.date)).map((h) => Date.parse(h.date + 'T00:00Z') / 60000 + h.mins), from: dates[0], to: dates.at(-1), nulls: t.level.filter((v) => v == null).length };
    }, [off, first, last]);
    const lo = Date.parse(got.from + 'T00:00Z') / 60000, hi = Date.parse(got.to + 'T23:59Z') / 60000;
    const exp = expected.map((m) => m + off).filter((m) => m >= lo && m <= hi);
    expect(got.highs).toEqual(exp);
    expect(got.nulls).toBe(0);
  }
});
