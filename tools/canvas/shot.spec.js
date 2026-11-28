// Phone-size screenshot of the app with the offline gate's mocked data, for comparing against the Design canvas.
// Not part of the test gate. Run:  OUT=shot.png npx playwright test -c tools/canvas/pw.config.js
// BEACH=Piha opens one beach; leave it unset for the All beaches view.
const { test } = require('@playwright/test');
const { openPage, weatherHourly } = require('../../tests/helpers');

test('canvas comparison screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // Varied temps and rain so every medal band shows up.
  const weather = weatherHourly(16, (i) => ({ tmax: 20 + (i % 6), rain: (i * 7) % 50 }),
    (d) => ({ temp: 19 + (d % 6), rain: (d * 7) % 50 }));
  await openPage(page, { beach: process.env.BEACH || null, weather });
  await page.waitForTimeout(800);
  await page.screenshot({ path: process.env.OUT || 'test-results/canvas-shot.png', fullPage: true });
});
