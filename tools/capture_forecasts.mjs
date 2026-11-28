// Save the exact Open-Meteo responses the app fetches, for every beach, so forecasts can later be
// compared with what happened (forecast verification). Beaches, coordinates and URLs are read from
// index.html so the capture always matches the live app.
// Usage: node tools/capture_forecasts.mjs <out_dir>   → <out_dir>/<YYYY-MM-DD>/<beach>.json
import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const locSrc = html.match(/const ALL_LOCATIONS = (\[[\s\S]*?\n\]);/)[1];
const LOCATIONS = Function(`"use strict"; return ${locSrc}`)();
const TZ = html.match(/const TZ = "([^"]+)"/)[1];
const DAYS = Number(html.match(/const DAYS = (\d+)/)[1]);
const usesLinz = (l) => l.linz?.hw != null;   // the bundled LINZ table is always present in the app
// Which medal scheme the app had at capture time, so before/after data is never mixed (verification plan, amendment 2).
const MEDAL_SCHEME = /const medalFor\b/.test(html) ? "bands" : "rank";

// Same URLs as fetchData() in index.html.
function urls(loc) {
  const q = `latitude=${loc.lat}&longitude=${loc.lon}&timezone=${encodeURIComponent(TZ)}&forecast_days=${DAYS}`;
  return {
    marine: loc.harbour ? null
      : `https://marine-api.open-meteo.com/v1/marine?${q}&hourly=${usesLinz(loc) ? "" : "sea_level_height_msl,"}wave_height&cell_selection=sea`,
    weather: `https://api.open-meteo.com/v1/forecast?${q}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunshine_duration,uv_index_max&hourly=weather_code,temperature_2m,precipitation_probability,cloud_cover`,
  };
}

async function get(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "weather-wahine-capture (github.com/cleevedennis/weather-wahine)" } });
      const body = await r.text();
      if (r.ok) return { status: r.status, body: JSON.parse(body) };
      if (attempt === 3) return { status: r.status, error: body.slice(0, 500) };
    } catch (e) { if (attempt === 3) return { status: "ERR", error: String(e) }; }
    await new Promise((res) => setTimeout(res, 5000 * attempt));
  }
}

const out = process.argv[2] || "captures";
const capturedAt = new Date().toISOString();
const day = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());   // YYYY-MM-DD, NZ date
fs.mkdirSync(path.join(out, day), { recursive: true });
let failed = 0;
for (const loc of LOCATIONS) {
  const u = urls(loc), rec = { beach: loc.name, capturedAt, appCommit: process.env.GITHUB_SHA || null, medalScheme: MEDAL_SCHEME, urls: u };
  rec.weather = await get(u.weather);
  rec.marine = u.marine ? await get(u.marine) : null;
  if (rec.weather.status !== 200 || (rec.marine && rec.marine.status !== 200)) failed++;
  fs.writeFileSync(path.join(out, day, `${loc.name.replace(/\s+/g, "-")}.json`), JSON.stringify(rec));
  console.log(loc.name, rec.weather.status, rec.marine?.status ?? "-");
}
if (failed === LOCATIONS.length) { console.error("Every beach failed"); process.exit(1); }
