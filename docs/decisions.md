# Decisions

Short records of why things are the way they are. Newest last.

### 1. A single static page, no framework or build step
The app is small and personal. One `index.html` opens from disk, hosts anywhere (GitHub Pages) and has nothing to
upgrade. Trade-off: all code is in one file.

### 2. Open-Meteo for weather, swell and model tides
Free, no API key, sends CORS headers so the browser can call it directly, and has hourly forecasts plus a marine API.

### 3. Scope to West Coast beaches, listed south to north
The app is for West Coast beach trips. Te Atatū (Waitematā) was removed. Beaches are saved by name so
reordering doesn't change someone's saved choice.

### 4. Bundle LINZ tables instead of fetching them
Testing showed the model gives Huia the same times as Piha, while LINZ Onehunga runs ~1h40m later — the model doesn't
resolve the Manukau. LINZ is the official source, but its CSV host sends no CORS headers, so the page can't fetch it.
The yearly CSVs are bundled as `tides-data.js` (a script, so `file://` works) with a converter in `tools/`.

### 5. Per-beach LINZ offsets; model as fallback; harbour beaches hidden until set
Offsets must be copied by hand from LINZ (its website blocks automated requests). Until then the model is used on the
open coast, where it appears consistent, and Huia Bay stays hidden because model times there are wrong.

### 6. Judge "sunny" on the tide window's hours
Open-Meteo's daily weather code is the worst weather of the whole day, so early drizzle hid clear afternoons
(e.g. 8 Dec 2026 forecast). The rule now uses hourly code, temperature and rain chance within the window, with the
daily summary only as a fallback.

### 7. Swell warning at 2.5 m, without changing the ★ criteria
The user asked for tide + sun. Swell is shown and flagged rather than silently excluding days. "Beach day" was renamed
"Tide & sun" and a Safeswim note added so ★ isn't read as "safe to swim". The threshold is one constant (`BIG_SWELL_M`).

### 8. Offline test gate, live checks on a schedule
Open-Meteo rate-limited us (HTTP 429) during development; live calls in the merge gate would be flaky. The gate mocks
all network calls; a daily canary checks the real APIs and the LINZ expiry without blocking merges.

### 9. Independent validation of outputs
The calendar export is validated by the Python `icalendar` library, and LINZ handling is back-tested against the raw
CSVs — so correctness doesn't rest only on our own code's view of itself.

### 10. Deploy from the default branch, kept in sync with `main`
PRs merge into `main`. GitHub's `github-pages` environment only accepts deploys from the repository's default branch,
and switching the default branch to `main` failed in the GitHub UI. So the deploy runs from whatever the default branch
is, and the Auto-merge workflow fast-forwards the default branch to `main` after each merge and then starts the
deploy. Deploys never start from ordinary pushes, so unmerged work isn't published. If the default branch is later
switched to `main`, this keeps working unchanged. (Earlier versions waited for a `PAGES_ENABLED` variable, then
deployed from `main` directly; both were blocked by the environment rule.)

### 11. A Home Screen web app instead of an App Store app
For personal use, installing from Safari gives an icon, full-screen launch and offline use for free, with no Mac,
Apple Developer account (US$99/year) or App Review. A plain wrapped web page would likely be rejected under App Review
guideline 4.2 (minimum functionality), Open-Meteo's free API is for non-commercial use, and the `.ics` download doesn't
work inside an app's web view. If App Store distribution is wanted later, the route is Capacitor plus native features
(widget, notifications, EventKit calendar), built on a Mac or Xcode Cloud and tested via TestFlight.

### 12. Merge every PR once it's green, enforced by a workflow
The owner wants PRs merged as soon as CI passes. A `workflow_run` workflow does this rather than a person or this
chat, so it outlasts any session, needs no extra repo settings, and only merges the exact commit CI tested. Because
merges made with the workflow token don't trigger other workflows, it dispatches CI on the base branch afterwards so
deploys still happen.
