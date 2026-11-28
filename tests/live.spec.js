// Live canary: real Open-Meteo APIs. Run on a schedule; never part of the merge gate.
// Catches API contract changes (renamed/missing fields), outages and implausible data.
const { test, expect } = require('@playwright/test');

test.describe.configure({ mode: 'serial' });

test('every beach loads real data with plausible tides, weather and swell', async ({ page }) => {
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/index.html');
  const names = await page.locator('#loc option').allTextContents();
  expect(names).toHaveLength(8);
  for (const n of names) {
    if ((await page.inputValue('#loc')) !== n) await page.selectOption('#loc', n);
    await page.waitForFunction((n) => (state.key === n && /Updated/.test(document.getElementById('status').textContent)) || /Couldn't/.test(document.getElementById('status').textContent), n, { timeout: 30_000 });
    await expect(page.locator('#status'), `${n} loads`).toContainText('Updated');
    const s = await page.evaluate(() => {
      const covered = state.days.filter((d) => d.hasTide);
      const highs = covered.flatMap((d) => d.highs.map((t) => Date.parse(d.date + 'T00:00Z') / 6e4 + t.mins));
      const gaps = highs.slice(1).map((h, i) => (h - highs[i]) / 60);
      return { days: state.days.length, covered: covered.length, perDay: covered.map((d) => d.highs.length),
        minGap: Math.min(...gaps), maxGap: Math.max(...gaps), hourly: state.days.slice(0, 7).every((d) => d.hourly),
        waves: state.days.slice(0, 5).every((d) => d.wave != null && d.wave >= 0 && d.wave < 15),
        pending: state.tideSource === 'pending', harbour: !!currentLoc().harbour };
    });
    expect(s.days, `${n}: 16 forecast days`).toBe(16);
    expect(s.hourly, `${n}: hourly weather fields present`).toBe(true);
    if (s.pending) continue;   // harbour beach without its LINZ offset: weather only, no tides or swell
    expect(s.covered, `${n}: tide coverage`).toBeGreaterThanOrEqual(7);
    expect(s.perDay.every((k) => k >= 1 && k <= 2), `${n}: 1–2 highs per day`).toBe(true);
    expect(s.minGap, `${n}: highs ~12h25m apart`).toBeGreaterThan(11);
    expect(s.maxGap).toBeLessThan(14);
    expect(s.hourly, `${n}: hourly weather fields present`).toBe(true);
    if (!s.harbour) expect(s.waves, `${n}: wave heights present and plausible`).toBe(true);   // no swell inside the harbour
  }
  expect(errors).toEqual([]);
});
