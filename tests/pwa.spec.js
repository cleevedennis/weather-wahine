// Home Screen web app: manifest, icons, and offline use via the service worker.
const fs = require('fs');
const { test, expect } = require('@playwright/test');
const { MOCK_NOW, marineSine, weatherDaily, perCoord } = require('./helpers');

const pngSize = (file) => { const b = fs.readFileSync(file); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

test('manifest and icons are linked, valid and the right sizes', async ({ page, request }) => {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.goto('/index.html');
  const href = await page.getAttribute('link[rel="manifest"]', 'href');
  const manifest = await (await request.get(href)).json();
  expect(manifest).toMatchObject({ name: 'Weather Wahine', short_name: 'Weather Wahine', display: 'standalone', start_url: './index.html', scope: './' });
  await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content', 'Weather Wahine');
  for (const icon of manifest.icons) {
    const [w, h] = pngSize(icon.src);
    expect(`${w}x${h}`).toBe(icon.sizes);
  }
  expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
  expect(pngSize(await page.getAttribute('link[rel="apple-touch-icon"]', 'href'))).toEqual([180, 180]);
  for (const sel of ['meta[name="apple-mobile-web-app-capable"]', 'meta[name="apple-mobile-web-app-title"]', 'link[rel="icon"]']) {
    await expect(page.locator(sel)).toHaveCount(1);
  }
});

// Mocked APIs that fail like a real network while `online` is false
// (route handlers otherwise keep answering even when the context is offline).
async function mockApis(context) {
  const net = { online: true };
  const cors = { 'access-control-allow-origin': '*' };
  await context.route(/^https?:\/\/(?!127\.0\.0\.1|api\.open-meteo|marine-api\.open-meteo)/, (r) => r.abort());
  await context.route('**/forecast**', (r) => (net.online ? r.fulfill({ json: perCoord(r.request().url(), weatherDaily(16)), headers: cors }) : r.abort('internetdisconnected')));
  await context.route('**/marine**', (r) => (net.online ? r.fulfill({ json: perCoord(r.request().url(), marineSine(16)), headers: cors }) : r.abort('internetdisconnected')));
  return net;
}

test.describe('offline', () => {
  test.use({ serviceWorkers: 'allow' });

  test('opens offline with the last saved forecast, clearly labelled', async ({ page, context }) => {
    // context.route also intercepts requests made by the service worker.
    const net = await mockApis(context);
    await page.clock.setFixedTime(new Date(MOCK_NOW));

    await page.goto('/index.html');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();                                       // now controlled by the worker
    await expect(page.locator('#status')).toContainText('Updated');
    expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await context.setOffline(true); net.online = false;
    await page.reload();
    await expect(page.locator('#status')).toContainText('Offline — showing the forecast saved');
    await expect(page.locator('#heroTemp')).toHaveText('22°');
    await expect(page.locator('#tour .nm')).toHaveCount(8);
    await page.selectOption('#loc', 'Piha');                   // the saved All beaches copy covers each beach
    await expect(page.locator('#list .day-row')).toHaveCount(16);

    await context.setOffline(false); net.online = true;
    await page.reload();
    await expect(page.locator('#status')).toContainText('Updated');
  });

  test('an old saved forecast drops past days; "Today" is really today', async ({ page, context }) => {
    const net = await mockApis(context);
    await page.clock.setFixedTime(new Date(MOCK_NOW));
    await page.goto('/index.html');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect(page.locator('#status')).toContainText('Updated');

    await context.setOffline(true); net.online = false;
    await page.clock.setFixedTime(new Date('2026-11-26T09:00:00+13:00'));   // three days later
    await page.reload();
    await expect(page.locator('#status')).toContainText('Offline');
    expect(await page.evaluate(() => state.beaches.every((b) => b.days[0].date === '2026-11-26'))).toBe(true);
    await expect(page.locator('#tour .nm').first().locator('~ .cell, ~ .speck')).not.toHaveCount(0);
    await page.selectOption('#loc', 'Piha');
    await expect(page.locator('#list .day-row')).toHaveCount(13);
  });
});
