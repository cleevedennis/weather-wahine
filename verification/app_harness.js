// Runs the REAL scoring code from weather-wahine/index.html (analyse + rankDays) under Node.
// Usage: node app_harness.js <repo_dir> < cases.json  → JSON results on stdout.
const fs = require("fs"), vm = require("vm"), path = require("path");
const repo = process.argv[2];
const html = fs.readFileSync(path.join(repo, "index.html"), "utf8");
const main = html.split("<script>")[1].split("</script>")[0];
const logic = main.split("/* ---------- render ---------- */")[0];          // data + scoring, no DOM rendering
const rank = main.match(/function rankDays[\s\S]*?\n}\n/)[0];
const ctx = { window: {}, console, Math, Date, JSON, Number, String, Promise, encodeURIComponent, Object, Array, Set, parseFloat, isFinite };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(repo, "tides-data.js"), "utf8"), ctx);
const els = {};
ctx.document = { getElementById: (id) => (els[id] ??= { value: "" }) };
ctx.localStorage = { getItem: () => null, setItem() {} };
vm.runInContext(logic + "\n" + rank + "\nthis.analyse = analyse; this.rankDays = rankDays; this.LOCATIONS = LOCATIONS;", ctx);
const cases = JSON.parse(fs.readFileSync(0, "utf8"));
const out = cases.map((c) => {
  els.from = { value: c.from }; els.to = { value: c.to }; els.minTemp = { value: String(c.minTemp) };
  const loc = ctx.LOCATIONS.find((l) => l.name === c.beach);
  const days = ctx.analyse({ loc, weather: c.weather, marine: c.marine });
  ctx.rankDays(days);
  return days.map((d) => ({ date: d.date, score: d.score, medal: d.medal, winTemp: d.winTemp, winRain: d.winRain, winCode: d.winCode, wave: d.wave,
    tide: d.inWindow.map((t) => Math.round(t.mins)) }));
});
process.stdout.write(JSON.stringify(out));
