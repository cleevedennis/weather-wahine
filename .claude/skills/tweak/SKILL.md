---
name: tweak
description: Ship a batch of small changes to Weather Wahine (wording, colours, beaches, thresholds, defaults, layout) through the repo's test → PR → auto-merge → deploy pipeline, cheaply. Use when the user asks for minor tweaks, small fixes or "change X" on this app, or types /tweak.
---

# Tweak Weather Wahine

Weather Wahine is a single-page tide + sunny-day calendar PWA for West Auckland, live at
https://cleevedennis.github.io/weather-wahine/. Everything the user sees is in `index.html`; tide predictions are
bundled in `tides-data.js`. Read only the part of a file you need — the docs below explain the rest.

## 1. Get the whole batch first
Ask for all tweaks in one message (numbered), plus a screenshot for anything visual. Ship them as **one** PR.
If a request is big (new feature, new data source, more than ~20 steps), say so with a rough cost and suggest a
separate task before starting.

## 2. Start from the latest code
```bash
git fetch origin && git checkout -B claude/tides-sunny-days-calendar-jyk0eo origin/main
```
Work on the default branch `claude/tides-sunny-days-calendar-jyk0eo` (the github-pages environment only deploys
from it). Never force-push; never commit straight to `main`.

## 3. Where things live (search for these names in `index.html`)
| Tweak | Look for |
|---|---|
| Beaches, coordinates, LINZ tide offsets, picker groups | `const ALL_LOCATIONS` (see `docs/tides.md` before changing offsets) |
| Default beach | `const DEFAULT_LOC` |
| Swell warning level | `const BIG_SWELL_M` |
| Default tide window / min temp / rain limit | inputs `id="from"`, `id="to"`, `id="minTemp"` and `function settings()` fallbacks; rain limit `const MAX_RAIN`; Best days count `const BEST_SHOWN` |
| Colours, fonts, spacing | CSS tokens in `:root { … }` and `body[data-sky=…]`; motifs are inline SVG `url(...)` in the CSS |
| Card headings (te reo · English) | `class="card-h"` |
| Weather wording / icons | `const WMO` |
| "Sunny" and tide rules | `function analyse` |
| Footer / safety wording | `<footer>` and `notice safety` |
| App name, icon | `manifest.webmanifest`, `apple-mobile-web-app-title`; icon source `icons/icon.svg` → `node tools/render_icons.js icons` |

If a change adds or renames a file the app loads, add it to `SHELL` in `sw.js`, bump `VERSION`, and add it to the
"Assemble site" step in `.github/workflows/ci.yml`.

## 4. Check it
```bash
npm ci && npm test          # offline gate (~10 s); Chromium is preinstalled in cloud sessions
```
- Tests mock all network calls and pin the clock to 23 Nov 2026; by default they blank LINZ offsets
  (`tests/helpers.js` → `openPage`). If a tweak changes a tested value (beach list, thresholds, wording asserted in
  `tests/*.spec.js`), update that test in the same PR — never skip or delete a test to get green.
- For visual tweaks, take **one** screenshot with Playwright (iPhone profile) and look at it.
- Don't run `npm run test:live` repeatedly: Open-Meteo rate-limits (HTTP 429). The daily canary covers it.

## 5. Record it
Add a line under `## Unreleased` in `CHANGELOG.md`. Update a doc in `docs/` only if the tweak changes behaviour it
describes (`docs/user-guide.md` for anything a user would notice).

## 6. Ship it
Commit (with the repo's attribution lines), `git push origin claude/tides-sunny-days-calendar-jyk0eo`, then open a
PR into `main`. You don't merge it: the **Auto-merge** workflow merges it when CI passes, fast-forwards the default
branch and starts the deploy.

## 7. Done means
Wait ~3 minutes **once**, then check once: the latest `CI` run on the default branch (event `workflow_dispatch`)
succeeded, including **Deploy to GitHub Pages** and its smoke check. Tell the user it's live and that the installed
app updates after a close-and-reopen with signal. If CI or the deploy failed, read the failing job's log, fix the
root cause in a follow-up commit on the same branch, and report — if a second attempt also fails, stop and check in.

## Keep it cheap
Batch edits; read small slices of files; one wait-and-check instead of polling; short reply (what changed + link).
Background: `docs/architecture.md`, `docs/operations.md` (pipeline, runbook), `docs/testing.md`, `TODO.md`.
