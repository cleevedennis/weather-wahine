# User guide

## All beaches (the opening screen)

The app always opens on **All beaches**, comparing every beach over the next 16 days:

- **Top section — Champion day:** the best beach-day in the forecast, with the beaches that share its medal.
- **Te whakataetae · Tournament:** a grid of beaches × days. A filled dot is a medal (platinum, gold, silver,
  bronze); a hollow ring means the high tide fits but the weather earns no medal; a faint speck means no high tide in
  your window. Tap a dot to open that beach on that day.
- **★ Ngā rā pai · Medal days:** grouped by medal and listed by date. Two views:
  - **All** (default): every beach that earns a medal, one row per beach and day, with the beach under the date.
  - **Best per day:** each day once, under its best medal at any beach. The stats are for the top beach ("Piha +4
    more" means four other beaches share that medal).

  Tap a row to open that beach on that day.

## Choosing a beach

Tap the beach name at the top to switch. Beaches are grouped **Manukau Harbour** and **West Coast**:

| Beach | Tide source today |
|---|---|
| **West Coast:** Whatipu, Karekare, Piha, Te Henga, Muriwai | Official LINZ (Karekare uses Piha's offset) |
| **Manukau Harbour:** Huia Domain, Kaitarakihi, Cornwallis | Official LINZ (Cornwallis offset; Huia and Kaitarakihi have no LINZ row of their own). No swell shown inside the harbour |

The tide card says which source is in use, e.g. *"Official LINZ prediction (Onehunga −1h 40m)"* or
*"Open-Meteo tide model (estimate; can be about an hour out)"* (only for a beach without a LINZ offset). The app opens on All beaches each time; pick a beach for its own view.

## Settings (⚙︎ Tautuhinga)

| Setting | Default | Meaning |
|---|---|---|
| High tide from / until | 11:00 – 16:00 | A high tide must fall inside this window. Both ends count. If "from" is later than "until" they're swapped. |
| Minimum temp (°C) | 22 | The warmest hour inside the window must reach this. |

Empty or invalid entries fall back to the defaults. Settings are remembered on that device.

## Reading the screen

- **Top section** — the selected day (tap any day to change it): high temperature, the weather **during your window**
  (labelled e.g. "11am–4pm"), high/low for the day, and badges for its medal (e.g. ★ Gold day), high-tide time, rain chance,
  swell height and UV. A red **⚠️ Big swell** badge appears at 2.5 m+.
- **★ Ngā rā pai · Best days** — the 4 best days in the forecast, best first, each tagged with its medal:
  **Platinum** 8–9 points, **Gold** 6–7, **Silver** 4–5, **Bronze** 2–3 (two days can share a medal). Only days with a high tide in your window and no rain forecast can rank. Each scores up
  to 9 points: sky (clear 2, partly cloudy 1, cloudy 0), warmth (at or above your minimum 2, up to 3° below 1, up to
  6° below 0, colder is out), rain chance (under 20% 2, under 40% 1, under 60% 0, more is out), tide (near the middle
  of your window 2, elsewhere in it 1) and swell (under 1.5 m +1, 2.5 m+ −1). A day needs 2 points to rank; ties go to
  the earlier date. If the tide source doesn't cover all 16 days, a note says when tide data ends.
- **🌊 Te tai · Tide** — the day's tide curve with your window shaded, high-tide times, whether one falls in the window,
  and the tide source. On "Today" a dotted line marks the current time.
- **🗓 Matapae huarere · 16-day forecast** — every day in the same row layout as Best days: weather icon, in-window
  high tide ("—" if none), window temperature, rain chance and swell (coral at 2.5 m+). Every day that earns a medal
  carries its tag.

### What counts as "sunny"

Judged hour by hour **inside your tide window**: every hour must be clear, mainly clear or partly cloudy
(no fog, drizzle, rain or storms), the warmest hour must reach your minimum temperature, and every hour's rain chance
must be under 40% (fixed; it is no longer a setting). Early-morning drizzle doesn't spoil a clear afternoon, and a day that only warms up at 5pm doesn't count.

### Forecast range

- Weather: 16 days (reliability drops after about 7).
- Swell: about 10 days.
- Tides: about 9 days from the model; the whole year from LINZ tables.

## Calendar export

Settings → **⤓ Add to calendar** downloads an `.ics` file with one event for each day in Best days (on All beaches:
each medal day, at its top beach): a 2-hour
event centred on the high tide, e.g. *"★ Gold · High tide 1:12pm · 22°C · 5% rain · 1.1 m swell (Piha)"*.

Re-importing updates days that still have a medal, but days that lose theirs stay in your calendar — delete old ones.

## Install on your iPhone

1. Open the page's link in **Safari** (other browsers can't install it on iPhone).
2. Tap **Share** → **Add to Home Screen** → **Add**.

It appears as **Weather Wahine** with a sun icon and opens full screen like an app. On some iPhones the label is
shortened (e.g. "Weather Wa…") because Home Screen names have limited room.

- **Updates:** reopening it after an hour, or on a new day, refreshes the forecast automatically.
- **Offline:** after it has loaded once with signal, it still opens without signal. It shows the last forecast it
  saved for that beach, with a yellow note: *"Offline — showing the forecast saved Mon 23 Nov, 6:10 am"*. Days that
  have already passed are dropped. LINZ tide times are built in, so they stay exact offline; model tides and weather
  are as of the saved time.
- **New versions** of the page arrive automatically the next time it opens with signal.
- **Removing it:** press and hold the icon → Remove App.

Offline mode needs the page to be served from a web address (e.g. GitHub Pages). Opening `index.html` straight from
a file works, but without offline support.

On Android, Chrome offers **Install app** from its menu.

## Safety

The page is a planning aid, not a safety forecast. Always check official tide tables before relying on tide times
for access around rocks (e.g. Whatipu, Karekare), swim between the flags, and check
[Safeswim](https://safeswim.org.nz/) and surf conditions on the day.
