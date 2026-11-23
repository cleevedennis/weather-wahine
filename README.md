# Weather Wahine

A single-page calendar for West Auckland beaches that highlights:

- 🌊 **High tides between 11am and 3pm** (window is adjustable)
- ☀️ **Sunny days at 20°C or warmer** (clear / mainly clear / partly cloudy, low rain chance)
- ★ **Days with both**

Covers the next 16 days for the West Coast beaches: Whatipu, Karekare, Piha, Te Henga (Bethells) and Muriwai.
You can download the matching days as an `.ics` file to import into Outlook, Google or Apple Calendar.

## Use it

Open `index.html` in a browser, or turn on GitHub Pages for this repo (Settings → Pages → deploy from branch).
No API key needed — data comes from [Open-Meteo](https://open-meteo.com/) (weather + marine tide model).

Model tide times are estimates (roughly ±15–30 min). Check the official
[LINZ tide predictions](https://www.linz.govt.nz/products-services/tides-and-tidal-streams/tide-predictions) before heading out.

## Tide data

Each beach uses **official LINZ tide predictions** once its secondary-port time difference is filled in
(`linz: { hw, lw }` in `ALL_LOCATIONS` in `index.html`, in minutes relative to Onehunga — e.g. `-1h 34m` → `-94`).
Beaches without one fall back to the Open-Meteo tide model. Huia Bay only appears once its LINZ difference is set,
because the model doesn't resolve tides inside the Manukau Harbour.

LINZ tables for Onehunga (2026–2027) are bundled in `tides-data.js`. To add a new year:

1. Download `https://static.charts.linz.govt.nz/tide-tables/maj-ports/csv/Onehunga%20<YEAR>.csv` into `data/`
2. Run `python3 tools/linz_to_js.py data/Onehunga_*.csv`

Tide predictions © Toitū Te Whenua Land Information New Zealand, CC BY 4.0.

## CI/CD

| Workflow | When | What it does | Blocks merges? |
|---|---|---|---|
| **CI** (`.github/workflows/ci.yml`) | Every push and pull request | Tide-data sanity check → 24 offline page tests (all network calls mocked) → calendar export validated by the independent `icalendar` library | Yes |
| **CI → Deploy** | Push to the default branch, after tests pass | Publishes `index.html` + `tides-data.js` to GitHub Pages, then checks the live URL | — |
| **Live canary** (`.github/workflows/live.yml`) | Daily 6:23am NZ, or on demand | Loads every beach from the real Open-Meteo APIs; fails 90 days before the LINZ tide data runs out | No |
| **Dependabot** | Monthly | Pull requests to update the Actions and test tools | — |

Run locally:

```bash
npm ci && npx playwright install chromium
npm test                                   # offline gate
npm run test:live                          # real APIs
python3 tools/check_tide_data.py           # tide data health
pip install -r requirements-dev.txt && python3 tools/validate_ics.py test-results/exports
```

### One-time setup (repo owner)

1. **Pages:** Settings → Pages → Source: **GitHub Actions**.
2. **Switch deploys on:** Settings → Secrets and variables → Actions → Variables → add `PAGES_ENABLED` = `true`.
3. **Protect the default branch:** Settings → Branches → add a rule requiring the **Offline test gate** check to pass.

### Runbook

| Alert | Likely cause | Action |
|---|---|---|
| CI red on a push | A change broke tide/weather logic, layout or the export | Open the run → download `playwright-report` → fix; don't merge until green |
| Canary: "tide data ends … days left" | Bundled LINZ table close to expiry | Download next year's Onehunga CSV into `data/`, run `tools/linz_to_js.py`, push |
| Canary: a beach doesn't load / fields missing | Open-Meteo outage, rate limit or API change | Re-run once. If it persists for a day, check open-meteo.com docs for renamed fields |
| Deploy smoke check fails | Pages not enabled or slow to publish | Check Settings → Pages; re-run the job |
