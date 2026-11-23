# Tides

## Sources

| Source | Accuracy | Range | Used when |
|---|---|---|---|
| **LINZ** official predictions (Onehunga standard port + secondary-port offset) | Official | Whole bundled period (currently 2026–2027) | The beach has `linz.hw` set |
| **Open-Meteo** tide model (`sea_level_height_msl`) | Roughly ±15–30 min on the open coast; **wrong inside harbours** | ~9 days | No LINZ offset yet |

## What we measured (23 Nov 2026)

Comparing the model against LINZ's official Onehunga table for 23–30 Nov 2026:

- The model gives **the same times for Huia as for Piha** (within 1–2 minutes) — it does not resolve the Manukau Harbour.
- Onehunga's official highs run a steady **1h31–1h49 later** than the model's coastal times. The steady offset suggests
  the model tracks the open-coast tide well, but this is not yet confirmed against LINZ's entrance figures.
- Therefore the harbour beaches (Huia Domain, Kaitarakihi, Cornwallis) show weather only until their LINZ offsets are
  entered, and West Coast beaches should be switched to LINZ
  once their offsets are known.

| Date | LINZ Onehunga HW | Model (Huia = Piha) |
|---|---|---|
| Mon 23 Nov | 10:09am, 10:26pm | 8:30am, 8:46pm |
| Tue 24 Nov | 11:00am, 11:18pm | 9:14am, 9:31pm |
| Wed 25 Nov | 11:49am | 10:00am, 10:20pm |

## Entering LINZ offsets

LINZ publishes **secondary ports** as time differences from a standard port. Find them at
linz.govt.nz → Tides and tidal streams → Tide predictions → **Secondary ports**.

1. Find the row (e.g. Huia, Manukau Harbour Entrance). Check its standard port is **Onehunga** — if not, that port's
   CSV must be bundled too.
2. Convert the high-water (and low-water) time differences to minutes: `-1h 34m` → `-94`, `+0h 20m` → `20`.
3. Edit `ALL_LOCATIONS` in `index.html`:

   ```js
   { name: "Huia Domain", group: "Manukau Harbour", lat: -37.003, lon: 174.566, harbour: true, linz: { hw: -94, lw: -100 } },
   ```

   `lw` may stay `null` (then `hw` is used for low waters too; only the curve shape is affected).
4. Run `npm test`. Then open the page: the tide card should read *"Official LINZ prediction (Onehunga −1h 34m)"*
   and times should equal the Onehunga table plus the offset.

Kaitarakihi and Cornwallis may not have their own LINZ rows; use the nearest listed port (e.g. Huia) and say so in a
comment. Whatipu and Karekare sit near the harbour entrance; Piha, Te Henga and Muriwai are open coast — use the closest
published secondary port for each.

## Adding a beach

Add an entry to `ALL_LOCATIONS` with `name`, `group` (picker heading), `lat`, `lon` and `linz: { hw: null, lw: null }`.
Set `harbour: true` for anywhere inside a harbour: it then shows weather only (no model tides or offshore swell) until
it has a LINZ offset. Order the list as it should appear.
Update the expected beach list in `tests/linz.spec.js`.

## Refreshing the LINZ data (yearly)

The daily canary fails **90 days** before the bundled data ends. To add a year:

```bash
curl -o data/Onehunga_2028.csv "https://static.charts.linz.govt.nz/tide-tables/maj-ports/csv/Onehunga%202028.csv"
python3 tools/linz_to_js.py data/Onehunga_*.csv
python3 tools/check_tide_data.py
npm test
```

Older years can be removed from `data/` to keep `tides-data.js` small (~37 KB per year).

## `tides-data.js` format

```js
window.LINZ_TIDES = { "port": "Onehunga", "from": "2026-01-01", "to": "2027-12-31",
  "events": [["2026-01-01T03:00", 1.0, 0], ["2026-01-01T09:24", 3.8, 1], ...] };
```

Each event is `[local time, height (m), 1 = high / 0 = low]`. LINZ CSV times are already local (NZST or NZDT).
`tools/check_tide_data.py` verifies order, strict high/low alternation, plausible heights and gaps, and remaining days.

## Licence

Tide predictions © Toitū Te Whenua Land Information New Zealand, CC BY 4.0 — attribution is shown in the page footer.
