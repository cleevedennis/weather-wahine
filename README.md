# Weather Wahine

A single-page calendar for West Auckland's West Coast beaches that shows, for the next 16 days:

- 🌊 **High tides inside your window** (default 11am–3pm)
- ☀️ **Sunny, warm weather during that window** (default 20°C+, rain chance 30% or less)
- ★ **"Tide & sun" days** when both line up
- ⚠️ **Big swell warnings** (2.5 m+ waves)

Beaches: **West Coast** — Whatipu, Karekare, Piha, Te Henga (Bethells), Muriwai — and **Manukau Harbour** — Huia Domain,
Kaitarakihi, Cornwallis. Tide times come from official LINZ predictions for every beach. Matching days can be downloaded as an `.ics` file for Outlook, Google or Apple Calendar.

> ★ means the tide and sun line up — **not** that it's safe to swim. West Coast beaches have strong rips and big surf.
> Swim between the flags at patrolled beaches and check [Safeswim](https://safeswim.org.nz/).

## Quick start

- **Use it:** open `index.html` in a browser (works straight from disk), or use the GitHub Pages link once deploys
  are switched on ([operations guide](docs/operations.md#one-time-setup-repo-owner)).
- **On an iPhone:** open the page in Safari → Share → **Add to Home Screen**. It installs as **Weather Wahine** with its own
  icon, opens full screen, and works offline with the last saved forecast ([user guide](docs/user-guide.md#install-on-your-iphone)).
- No accounts or API keys. Weather and swell come from [Open-Meteo](https://open-meteo.com/); tides from the Open-Meteo
  tide model or official [LINZ](https://www.linz.govt.nz/products-services/tides-and-tidal-streams/tide-predictions) tables.

## Documentation

| Guide | For |
|---|---|
| [User guide](docs/user-guide.md) | Using the page: beaches, settings, reading the screen, calendar export, safety |
| [Architecture](docs/architecture.md) | How the page works: files, data flow, rules, key functions, configuration |
| [Tides](docs/tides.md) | Tide sources, measured accuracy, LINZ integration, adding a beach, yearly data refresh |
| [Testing](docs/testing.md) | Test suites, how to run them, what they cover, adding tests |
| [Operations](docs/operations.md) | CI/CD workflows, deploys, one-time GitHub setup, runbook, environment |
| [Design](docs/design.md) | Colours, Māori motifs and te reo, accessibility |
| [Decisions](docs/decisions.md) | Why things are built the way they are |
| [Changelog](CHANGELOG.md) | What changed and when |
| [To do](TODO.md) | Outstanding tasks |

## Repository layout

```
index.html               The whole app: markup, styles and script
tides-data.js            Bundled LINZ tide predictions (generated — do not edit by hand)
manifest.webmanifest     Home Screen app name, colours and icons
sw.js                    Service worker: offline support
icons/                   App icons (icon.svg is the source; PNGs rendered by tools/render_icons.js)
data/                    Raw LINZ CSVs the bundle is built from
tools/                   linz_to_js.py, check_tide_data.py, validate_ics.py, render_icons.js
tests/                   Playwright tests (offline gate + live canary)
.github/                 CI, live canary and Dependabot configuration
docs/                    Documentation
```

## Developing

```bash
npm ci && npx playwright install chromium
npm run serve         # http://127.0.0.1:4173/index.html
npm test              # offline test gate (what CI runs)
```

See [Testing](docs/testing.md) for the full set of checks.

## Credits & licences

- Weather, swell and model tides: [Open-Meteo](https://open-meteo.com/) (CC BY 4.0)
- Tide predictions: © Toitū Te Whenua Land Information New Zealand (CC BY 4.0)
