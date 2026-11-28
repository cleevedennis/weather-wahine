// Playwright config for tools/canvas/shot.spec.js only; reuses the gate's server and iPhone profile.
// PW_CHROMIUM=/opt/pw-browsers/chromium uses a preinstalled browser when the pinned one isn't installed.
const path = require('path');
const base = require('../../playwright.config.js');

module.exports = {
  ...base,
  testDir: __dirname,
  webServer: { ...base.webServer, cwd: path.resolve(__dirname, '../..') },
  projects: [{ name: 'shot', use: process.env.PW_CHROMIUM ? { launchOptions: { executablePath: process.env.PW_CHROMIUM } } : {} }],
};
