# Weather Wahine – to do

## Waiting on you
- [x] **LINZ secondary-port differences** — supplied (NZNA table, `data/NZNA_Secondary-ports-2026-27.csv`).
- [ ] **Check on iPhone Safari:** frosted glass, time pickers, beach dropdown, .ics import.
- [ ] **Install on iPhone** (once Pages is live): Add to Home Screen → check the sun icon and "Weather Wahine" label (iOS may shorten it), full-screen
      launch, then turn on Aeroplane Mode and reopen — it should show the saved forecast with the yellow offline note.
- [ ] **Te reo & motif check by a speaker:** Ngā rā pai, Te whakataetae, Te tai, Maramataka (lunar-calendar nuance),
      Matapae huarere, Tautuhinga; koru / niho taniwha / poutama use.

## Then Claude does
- [x] LINZ offsets entered for all beaches and checked against the Onehunga table (see docs/tides.md).
- [ ] When the 2028 NZNA secondary-ports table is out, check whether the differences changed.

## Done from the review
- [x] Sunny is judged on the hourly forecast for your tide window, not the whole day.
- [x] Swell height shown; 2.5 m+ flagged with a warning; Safeswim safety note; "Beach day" renamed "Tide & sun".
- [ ] Optional: tune the 2.5 m swell threshold (`BIG_SWELL_M` in index.html) to what you're comfortable with.

## CI/CD (one-time, repo owner)
- [ ] **Settings → Pages → Source: GitHub Actions** (the only step needed for the app link to work)
- [ ] Recommended: Settings → General → Default branch: `main`
- [ ] Recommended: Settings → Branches: protect `main`, require the "Offline test gate" check

## Later
- [ ] Optional, only if wanted: App Store version (Capacitor + widget/notifications/EventKit, Apple Developer
      account, Mac or Xcode Cloud) — see docs/decisions.md #11.
- [ ] Before end of 2027: add Onehunga 2028 LINZ table (steps in docs/tides.md). The daily canary will warn 90 days ahead.
- [ ] Note: re-importing the .ics updates matching days, but days that stop qualifying stay in your calendar — delete old ones.
