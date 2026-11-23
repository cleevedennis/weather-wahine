# Weather Wahine – to do

## Waiting on you
- [ ] **LINZ secondary-port differences.** From linz.govt.nz → Tides and tidal streams → Tide predictions →
      Secondary ports, copy the high-water (and low-water) time difference and reference port for:
      Huia, Manukau Harbour Entrance (Bar/Heads), and any of Piha, Te Henga, Muriwai.
- [ ] **Check on iPhone Safari:** frosted glass, time pickers, beach dropdown, .ics import.
- [ ] **Install on iPhone** (once Pages is live): Add to Home Screen → check the sun icon and "Weather Wahine" label (iOS may shorten it), full-screen
      launch, then turn on Aeroplane Mode and reopen — it should show the saved forecast with the yellow offline note.
- [ ] **Te reo & motif check by a speaker:** Ngā rā pai, Te tai, Maramataka (lunar-calendar nuance),
      Matapae huarere, Tautuhinga; koru / niho taniwha / poutama use.

## Then Claude does
- [ ] Fill LINZ offsets in `ALL_LOCATIONS` (index.html), verify against LINZ, confirm Huia Bay appears, rerun smoke tests.

## Done from the review
- [x] Sunny is judged on the hourly forecast for your tide window, not the whole day.
- [x] Swell height shown; 2.5 m+ flagged with a warning; Safeswim safety note; "Beach day" renamed "Tide & sun".
- [ ] Optional: tune the 2.5 m swell threshold (`BIG_SWELL_M` in index.html) to what you're comfortable with.

## CI/CD (one-time, repo owner)
- [ ] Merge PR #3 into `main`, then Settings → General → Default branch: `main`
- [ ] Settings → Pages → Source: GitHub Actions
- [ ] Settings → Secrets and variables → Actions → Variables: `PAGES_ENABLED` = `true`
- [ ] Settings → Branches: protect `main`, require the "Offline test gate" check

## Later
- [ ] Optional, only if wanted: App Store version (Capacitor + widget/notifications/EventKit, Apple Developer
      account, Mac or Xcode Cloud) — see docs/decisions.md #11.
- [ ] Before end of 2027: add Onehunga 2028 LINZ table (steps in docs/tides.md). The daily canary will warn 90 days ahead.
- [ ] Note: re-importing the .ics updates matching days, but days that stop qualifying stay in your calendar — delete old ones.
