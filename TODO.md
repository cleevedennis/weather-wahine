# Weather Wahine – to do

## Waiting on you
- [ ] **LINZ secondary-port differences.** From linz.govt.nz → Tides and tidal streams → Tide predictions →
      Secondary ports, copy the high-water (and low-water) time difference and reference port for:
      Huia, Manukau Harbour Entrance (Bar/Heads), and any of Piha, Te Henga, Muriwai.
- [ ] **Decide on review recommendations** (below).
- [ ] **Check on iPhone Safari:** frosted glass, time pickers, beach dropdown, .ics import, Add to Home Screen.
- [ ] **Te reo & motif check by a speaker:** Ngā rā pai, Te tai, Maramataka (lunar-calendar nuance),
      Matapae huarere, Tautuhinga; koru / niho taniwha / poutama use.

## Then Claude does
- [ ] Fill LINZ offsets in `ALL_LOCATIONS` (index.html), verify against LINZ, confirm Huia Bay appears, rerun smoke tests.

## Review recommendations (need a decision)
- [ ] **Judge "sunny" on 11am–3pm, not the whole day.** Open-Meteo's daily weather code is the *worst* weather
      of the day, so early drizzle hides a clear afternoon (e.g. 8 Dec forecast: clear and 20° all window, marked not sunny).
- [ ] **Show swell / surf warning.** West Coast surf is the main hazard; forecast shows 3–4.4 m waves on 1–2 Dec.
      Show wave height, flag big swell, link Safeswim, and avoid "Beach day" sounding like "safe to swim".

## Later
- [ ] Optional: host on GitHub Pages for a phone link.
- [ ] Before end of 2027: add Onehunga 2028 LINZ table (steps in README).
- [ ] Note: re-importing the .ics updates matching days, but days that stop qualifying stay in your calendar — delete old ones.
