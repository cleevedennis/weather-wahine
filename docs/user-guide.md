# User guide

## Choosing a beach

Tap the beach name at the top to switch. Beaches are listed south to north:

| Beach | Tide source today |
|---|---|
| Whatipu, Karekare, Piha, Te Henga, Muriwai | Open-Meteo tide model until a LINZ offset is entered, then official LINZ |
| Huia Bay | Hidden until its LINZ offset is entered (the model gives wrong times inside the Manukau Harbour) |

The tide card says which source is in use, e.g. *"Official LINZ prediction (Onehunga −1h 40m)"* or
*"Open-Meteo tide model (±15–30 min)"*. Your chosen beach is remembered on that device.

## Settings (⚙︎ Tautuhinga)

| Setting | Default | Meaning |
|---|---|---|
| High tide from / until | 11:00 – 15:00 | A high tide must fall inside this window. Both ends count. If "from" is later than "until" they're swapped. |
| Minimum temp (°C) | 20 | The warmest hour inside the window must reach this. |
| Max rain chance (%) | 30 | The highest hourly rain chance inside the window must not exceed this. |

Empty or invalid entries fall back to the defaults. Settings are remembered on that device.

## Reading the screen

- **Top section** — the selected day (tap any day to change it): high temperature, the weather **during your window**
  (labelled e.g. "11am–3pm"), high/low for the day, and badges for ★ Tide & sun, high-tide time, rain chance,
  swell height and UV. A red **⚠️ Big swell** badge appears at 2.5 m+.
- **★ Ngā rā pai · Best days** — every day with both a high tide in your window and sunny weather, plus a safety note.
  If the tide source doesn't cover all 16 days, a note says when tide data ends.
- **🌊 Te tai · Tide** — the day's tide curve with your window shaded, high-tide times, whether one falls in the window,
  and the tide source. On "Today" a dotted line marks the current time.
- **📅 Maramataka · Calendar** — blue dot = high tide in window, yellow dot = sunny & warm, outlined day = both.
- **🗓 Matapae huarere · 16-day forecast** — window weather icon, rain chance, temperature range bar, and chips for
  ★ Tide & sun, the in-window high tide, "Sunny & warm", "Tide n/a" (beyond tide coverage) and big swell.

### What counts as "sunny"

Judged hour by hour **inside your tide window**: every hour must be clear, mainly clear or partly cloudy
(no fog, drizzle, rain or storms), the warmest hour must reach your minimum temperature, and no hour may exceed your
rain-chance limit. Early-morning drizzle doesn't spoil a clear afternoon, and a day that only warms up at 5pm doesn't count.

### Forecast range

- Weather: 16 days (reliability drops after about 7).
- Swell: about 10 days.
- Tides: about 9 days from the model; the whole year from LINZ tables.

## Calendar export

Settings → **⤓ Add to calendar** downloads an `.ics` file with one event per matching day:

- Tide days: a 2-hour event centred on the high tide, e.g. *"★ High tide 1:12pm · Sunny 22°C (Piha)"*.
- Sunny-only days: an all-day event.
- Big-swell days add *"⚠ 3.1 m swell"*.

Re-importing updates days that still match, but days that stop matching stay in your calendar — delete old ones.

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
