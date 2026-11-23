# Changelog

## Unreleased

### Added
- Home Screen web app: sun (te rā) app icon, web manifest (installs as "Weather Wahine"), full-screen launch.
- Offline support via a service worker: opens without signal and shows the last saved forecast per beach, labelled
  with when it was saved; past days are dropped.
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
