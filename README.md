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
