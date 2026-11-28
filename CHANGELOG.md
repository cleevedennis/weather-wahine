# Changelog

## Unreleased

### Removed
- **All beaches view removed** after user feedback that its long lists were too much: no Champion day, Tournament
  grid or Medal days card, and no "All beaches" option in the picker. Medal scoring is unchanged (score bands:
  platinum 8–9, gold 6–7, silver 4–5, bronze 2–3) and still drives Best days, the 16-day list and Add to calendar.
  The app again opens on the last beach you picked (Piha the first time) and fetches one beach at a time.

### Added
- **Canvas → PR workflow (no change to the site).** `/canvas-ship` turns edits on the Design canvas into small PRs
  through the `/tweak` pipeline, with a phone-size screenshot tool (`tools/canvas/`); `/decision-modal` puts every
  decision to the user as decision, summary, accept/decline. `docs/design.md` records the canvas baseline and the
  first audit's differences.
- **All beaches view, the new opening screen.** The top section shows the champion day across every beach; a
  **Tournament** grid shows each beach's medals over 16 days (tap a dot to open that beach on that day); and
  **Medal days** replaces the 16-day list, grouped by medal, with a switch between **All** (every beach that earns a
  medal, day by day; the default) and **Best per day** (each day once, under its best beach).
  All beaches load in two requests, and picking a beach afterwards needs no new request.
- **Daily forecast capture** (`.github/workflows/capture.yml`, `tools/capture_forecasts.mjs`): each morning at about
  6:47am NZDT, saves the exact Open-Meteo responses the app fetches for every beach to the `forecast-captures`
  branch, so medal days can later be checked against what happened. No change to the site. Each record also notes
  the medal scheme the app used that day (`medalScheme`: `bands` or `rank`).

### Changed
- **Line icons replace emoji** across the page: weather in the day rows, tide, rain and big-swell chips, and a
  gold trophy beside the picker on All beaches. Card headings lose their emoji, as on the Design canvas.
- **Medals are now score bands**, the same on every screen: platinum 8–9 points, gold 6–7, silver 4–5, bronze 2–3.
  Best days still shows the top 4, but two days can share a medal, and every medal day is tagged in the 16-day list.
- The app no longer remembers the last beach; it always opens on All beaches.
- On All beaches, **Add to calendar** exports each medal day at its top beach.
- **Add to calendar** now exports the 4 medal days (e.g. "★ Gold · High tide 1:12pm · 22°C · 5% rain · 1.1 m swell"),
  matching Best days; sunny-only all-day events are gone.
- **Best days are now ranked** platinum, gold, silver and bronze — the 4 best days in the forecast, best first. Each
  day with a high tide in your window scores up to 9 points on sky, warmth against your minimum temperature, rain
  chance, how central the tide is, and swell (light weighting). Near-misses (a little cooler, some cloud) now rank
  instead of disappearing.
- **One row layout for the whole page**: Best days and the 16-day forecast share the same row — day and date, medal
  tag, weather icon, tide, temp, rain and a new swell column — with column labels shown once per card.
- **Calendar card removed**; the 16-day list (with medal tags) replaces it.
- Removed the "Only N days line up" note and the swim-safety notice from Best days; big swell is now shown in coral in
  the swell column instead of a warning line.
- **Best days panel redesigned** as a scorecard: the next 4 qualifying days in date order, each showing tide time,
  temperature and rain chance, with the rules listed at the top.
- Rain rule is now a fixed "under 40%" (was a setting defaulting to 30% or less); the Max rain chance setting is gone.
- Default high-tide window is now 11am–4pm (was 11am–3pm) and default minimum temperature is 22°C (was 20°C).

### Tooling
- `/tweak` Claude Code skill for shipping batches of small changes (`.claude/skills/tweak/SKILL.md`).

### Changed
- **All beaches now use official LINZ tide times** (NZ Nautical Almanac secondary-port differences from Onehunga).
  The model's West Coast tide times had been about an hour early.

### Added
- Manukau Harbour beaches: Huia Domain, Kaitarakihi and Cornwallis (weather now; tides once LINZ offsets are set).
  Beach picker grouped Manukau Harbour / West Coast.
- Home Screen web app: sun (te rā) app icon, web manifest (installs as "Weather Wahine"), full-screen launch.
- Offline support via a service worker: opens without signal and shows the last saved forecast per beach, labelled
  with when it was saved; past days are dropped.
- Pages deploy split into build and deploy jobs (fixes "No artifacts named github-pages").
- Deploys run from the default branch, which Auto-merge fast-forwards to `main` after each merge; only the Pages
  source setting is needed.
- Auto-merge workflow: every PR merges as soon as CI passes on its latest commit; Dependabot PRs target `main`.
- Tests for the manifest, icons and offline behaviour; the test clock is pinned so the gate gives the same result
  on any date.

## 2026-11-23

### Added
- Calendar of high tides in a time window and sunny days, with `.ics` export (first version).
- Official LINZ tide predictions (Onehunga 2026–2027) with per-beach secondary-port offsets; Huia Bay (shown once
  its offset is set); tide source shown under the tide chart.
- Swell height from Open-Meteo Marine, with a warning at 2.5 m+; Safeswim safety note.
- CI/CD: offline Playwright test gate, independent iCalendar validation, daily live canary with LINZ expiry warning,
  GitHub Pages deploy from the default branch, Dependabot.
- Documentation in `docs/`, `TODO.md` and this changelog.

### Changed
- Redesigned as a mobile-first weather-app layout, then restyled in pounamu green with kōwhai and kōkōwai accents,
  koru / niho taniwha / poutama motifs and bilingual headings.
- Beaches limited to the West Coast (Whatipu, Karekare, Piha, Te Henga, Muriwai), listed south to north; saved by name.
- "Sunny" judged on hourly weather within the tide window instead of the day's worst weather.
- "Beach day" renamed "Tide & sun".

### Fixed
- Notice when the model tide forecast ends (~9 days) instead of silently skipping later days.
- Accessibility: contrast, page heading, keyboard access to days.
- `.ics`: `VTIMEZONE` for Pacific/Auckland; long lines folded to 75 bytes.
- Sky gradient hidden behind the page background.
- Empty or reversed settings; stale "Today" when a home-screen app resumes.
