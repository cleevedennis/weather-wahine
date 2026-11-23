// Usage: node tools/render_icons.js icons   (needs Playwright: npm ci && npx playwright install chromium)
// Render icons/icon.svg to PNGs (full-bleed; the sun sits inside the maskable safe zone).
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const dir = process.argv[2]; const svg = fs.readFileSync(path.join(dir, 'icon.svg'), 'utf8');
  const b = await chromium.launch(); const p = await b.newPage();
  for (const [name, size, pad] of [['apple-touch-icon.png', 180, 0], ['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['icon-maskable-512.png', 512, 0], ['favicon-32.png', 32, 0]]) {
    await p.setViewportSize({ width: size, height: size });
    const inner = Math.round(size * (1 - 2 * pad));
    await p.setContent(`<html><body style="margin:0;background:#0b3a2c;display:grid;place-items:center;width:${size}px;height:${size}px">
      <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`);
    await p.screenshot({ path: path.join(dir, name), omitBackground: false });
  }
  await b.close();
})();
