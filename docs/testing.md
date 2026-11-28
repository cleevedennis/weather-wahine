# Testing

## Suites

| Suite | Command | Network | Runs in CI | Blocks merges |
|---|---|---|---|---|
| **Gate** (`tests/*.spec.js` except live) | `npm test` | Fully mocked — any non-local request is aborted | Every push / PR | Yes |
| **Live canary** (`tests/live.spec.js`) | `npm run test:live` | Real Open-Meteo APIs | Daily schedule | No |
| Tide data health | `python3 tools/check_tide_data.py [--warn-days N] [--today YYYY-MM-DD]` | None | Gate (`--warn-days 0`) + canary (`90`) | Gate only if malformed/expired |
| Calendar validation | `python3 tools/validate_ics.py test-results/exports` | None | Gate, after the tests | Yes |

Setup: `npm ci && npx playwright install chromium`; for the calendar validator `pip install -r requirements-dev.txt`.

Tests run in Chromium with an iPhone 15 Pro profile and are served over HTTP by `python3 -m http.server`
(the same way GitHub Pages serves the site) — see `playwright.config.js`.

Two things keep the gate deterministic:

- **Pinned clock:** `openPage()` fixes the browser's time to 9am NZDT on 23 Nov 2026 (the first mock day), so results
  don't change with the real date.
- **Service workers blocked** by default, so mocked network calls can't be bypassed. `tests/pwa.spec.js` enables them
  and mocks at the browser-context level instead, which also catches the worker's own requests.

## What the gate covers (31 tests)

**Logic** (`tests/logic.spec.js`)
- High-tide times within 3 minutes on a known curve, including a tide just before midnight
- Window edges: 11:00 and 4:00pm count; 4:06pm and 10:54am don't
- Daily fallback: exactly 22° and 39% rain count; 21.9°, overcast and 40% rain don't
- Best days: top 4 by score, best first, tagged Platinum/Gold/Silver/Bronze ("Top 4 of N", rainy day out); fewer
  than 4 shows just those
- Medal scoring: known inputs give the expected points; rain or too-cold days are out
- Hourly window: early drizzle with a clear window → sunny; drizzle at 1pm → not; warm only at 5pm → not
- Settings: re-filtering, reversed window swapped, empty values fall back, no "NaN"
- Swell ≥ 2.5 m flagged in hero, list and on selection; 1.1 m not
- Wording: no "Beach day"; no swim-safety notice; no calendar card

**LINZ** (`tests/linz.spec.js`)
- Without offsets: coast beaches use the model; picker grouped Manukau Harbour / West Coast
- Configured offsets for every beach = Onehunga + its LINZ difference (`linz: 'real'`)
- Harbour beaches without offsets: no marine request, tides "not set up yet", weather and sunny days still work
- With injected offsets: times = Onehunga + offset, full 16-day coverage, Huia appears, no model tide request
- LINZ beach still works when the swell feed is down
- **Two-year back-test:** every LINZ high tide in `data/*.csv` reproduced to the minute at offsets −100, −40 and +30,
  including daylight-saving changeover days

**Home Screen app** (`tests/pwa.spec.js`)
- Manifest linked and valid (name, standalone, start URL, scope); every icon's PNG matches its declared size;
  maskable icon present; 180px Apple touch icon; iOS meta tags present
- Offline: after one online load, an offline reload shows the saved forecast with the *Offline — showing the
  forecast saved* label; back online it refreshes
- An offline copy three days old drops the past days and starts at the real today

**UI** (`tests/ui.spec.js`)
- All beaches load distinct coordinates; beach persists by name; old index-based saves fall back to Piha
- Tapping Best days and list rows selects them
- Resumed page re-fetches when data is over an hour old
- Tide / weather service down → friendly error
- Missing forecast days and tide gaps render without errors
- No sideways scroll or clipped content on iPhone SE, Pixel 7, 320px and desktop
- No axe-core accessibility violations; all tappable days keyboard-focusable
- Calendar export: valid wrapper, `VTIMEZONE`, lines ≤ 75 bytes, unique UIDs, one event per medal day — saved for the external validator

## Mock helpers (`tests/helpers.js`)

- `marineSine(days, phase, wave)` — semi-diurnal tide with optional per-day wave height
- `marinePeaks(days, hours)` — tide peaks at exact hours, for window-edge tests
- `weatherDaily(days, f)` / `weatherHourly(days, daily, hour)` — daily-only or daily + hourly weather
- `openPage(page, { marine, weather, marineStatus, weatherStatus, linz })` — mocks the APIs and blocks all other
  external requests. By default it blanks every beach's LINZ offset so tides come from the mocked model data; pass
  `linz: { Beach: { hw, lw } }` to set some, or `linz: 'real'` to use the offsets configured in `index.html`
- `days(page)` — a compact view of `state.days` for assertions
- `MOCK_NOW` — the pinned clock time

Mock dates start 23 Nov 2026; LINZ tests rely on that date being inside the bundled data. When the bundled LINZ data
no longer covers it, move `START`/`MOCK_NOW` in `tests/helpers.js` and the expected Onehunga times in `tests/linz.spec.js`.

## Proving the tests bite (mutation check)

On 23 Nov 2026 four deliberate breaks were applied to `index.html` one at a time; each turned the gate red:

| Break | Tests failed |
|---|---|
| Window end made exclusive (`<= to` → `< to`) | 1 |
| Swell threshold raised to 3.5 m | 1 |
| LINZ offset sign flipped | 2 |
| Hourly window ignored | 1 |

Repeat this after major changes to the logic.

## Adding a test

Put offline tests in `tests/*.spec.js` and always go through `openPage()` so the network stays mocked. Anything that
must hit real services belongs in `tests/live.spec.js`, which never gates merges.
