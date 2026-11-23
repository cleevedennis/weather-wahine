// Shared mock data and page helpers for the offline test gate.
const START = Date.UTC(2026, 10, 23);
const isoH = (h) => new Date(START + h * 3600e3).toISOString().slice(0, 16);
const isoD = (i) => new Date(START + i * 864e5).toISOString().slice(0, 10);

/** Semi-diurnal tide with a high at `phase` hours, optional wave height per day. */
function marineSine(days = 16, phase = 13.2, wave = () => 1.1) {
  const time = [], sea = [], waves = [];
  for (let h = 0; h < days * 24; h++) { time.push(isoH(h)); sea.push(1.4 * Math.cos(2 * Math.PI * (h - phase) / 12.42)); waves.push(wave(Math.floor(h / 24), h % 24)); }
  return { hourly: { time, sea_level_height_msl: sea, wave_height: waves } };
}
/** Tide with bumps at exact hours (for window-edge tests). */
function marinePeaks(days, peakHours) {
  const time = [], sea = [];
  for (let h = 0; h < days * 24; h++) { time.push(isoH(h)); sea.push(peakHours.reduce((s, p) => s + Math.exp(-((h - p) ** 2) / (2 * 2.2 ** 2)), 0)); }
  return { hourly: { time, sea_level_height_msl: sea } };
}
/** Daily-only weather (exercises the daily fallback). f(i) overrides per day. */
function weatherDaily(days = 16, f = () => ({})) {
  const d = { time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [], precipitation_probability_max: [], sunshine_duration: [], uv_index_max: [] };
  for (let i = 0; i < days; i++) {
    const v = { code: 0, tmax: 22, tmin: 14, rain: 5, ...f(i) };
    d.time.push(isoD(i)); d.weather_code.push(v.code); d.temperature_2m_max.push(v.tmax); d.temperature_2m_min.push(v.tmin);
    d.precipitation_probability_max.push(v.rain); d.sunshine_duration.push(30000); d.uv_index_max.push(9);
  }
  return { daily: d };
}
/** Daily + hourly weather. hour(dayIndex, hourOfDay) → { code, temp, rain }. */
function weatherHourly(days, daily, hour) {
  const w = weatherDaily(days, daily);
  const time = [], code = [], temp = [], rain = [], cloud = [];
  for (let h = 0; h < days * 24; h++) {
    const v = { code: 0, temp: 22, rain: 5, ...hour(Math.floor(h / 24), h % 24) };
    time.push(isoH(h)); code.push(v.code); temp.push(v.temp); rain.push(v.rain); cloud.push(10);
  }
  w.hourly = { time, weather_code: code, temperature_2m: temp, precipitation_probability: rain, cloud_cover: cloud };
  return w;
}

/**
 * Open the page with mocked APIs. Any other non-local request is blocked so the gate never
 * depends on the network. `linz` optionally injects LINZ offsets into named beaches.
 */
async function openPage(page, { marine = marineSine(), weather = weatherDaily(), marineStatus = 200, weatherStatus = 200, linz } = {}) {
  const errors = [], requests = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**/marine**', (r) => { requests.push(r.request().url()); return marineStatus === 'abort' ? r.abort() : r.fulfill({ status: marineStatus, json: marine }); });
  await page.route('**/forecast**', (r) => { requests.push(r.request().url()); return r.fulfill({ status: weatherStatus, json: weather }); });
  if (linz) {
    await page.route('**/index.html', async (r) => {
      let body = await (await r.fetch()).text();
      for (const [name, off] of Object.entries(linz)) {
        const re = new RegExp(`(\\{ name: "${name}",[^}]*linz: )\\{ hw: null, lw: null \\}`);
        if (!re.test(body)) throw new Error(`No LINZ slot for ${name}`);
        body = body.replace(re, `$1{ hw: ${off.hw}, lw: ${off.lw ?? null} }`);
      }
      return r.fulfill({ body, contentType: 'text/html' });
    });
  }
  await page.goto('/index.html');
  await page.waitForFunction(() => /Updated|Couldn't/.test(document.getElementById('status').textContent));
  return { errors, requests };
}
const days = (page) => page.evaluate(() => state.days.map((d) => ({
  date: d.date, highs: d.highs.map((t) => Math.round(t.mins)), tide: d.tide, sunny: d.sunny, both: d.both,
  hasTide: d.hasTide, hourly: d.hourly, winTemp: d.winTemp, wave: d.wave, bigSwell: d.bigSwell })));

module.exports = { marineSine, marinePeaks, weatherDaily, weatherHourly, openPage, days, isoD };
