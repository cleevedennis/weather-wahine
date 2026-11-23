// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  // Service workers are blocked by default so mocked network calls can't bypass page.route();
  // tests/pwa.spec.js turns them on explicitly.
  use: { baseURL: 'http://127.0.0.1:4173', ...devices['iPhone 15 Pro'], browserName: 'chromium', serviceWorkers: 'block' },
  // Serve the site the same way GitHub Pages does (plain static files over HTTP).
  webServer: { command: 'python3 -m http.server 4173 --bind 127.0.0.1', url: 'http://127.0.0.1:4173/index.html', reuseExistingServer: !process.env.CI },
  projects: [
    // Gate: runs on every push/PR. Fully offline — all external requests are mocked or blocked.
    { name: 'gate', testIgnore: /live\.spec\.js/ },
    // Live canary: runs on a schedule against the real Open-Meteo APIs. Never blocks merges.
    { name: 'live', testMatch: /live\.spec\.js/, retries: 2 },
  ],
});
