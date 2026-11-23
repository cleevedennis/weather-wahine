# Operations

## Workflows

| Workflow | File | Trigger | Steps | Blocks merges |
|---|---|---|---|---|
| **CI → Offline test gate** | `.github/workflows/ci.yml` | Every push and pull request; manual | `npm ci` → install Chromium → tide data check (`--warn-days 0`) → `npm test` → `validate_ics.py`; uploads `playwright-report` on failure | Yes |
| **CI → Deploy to GitHub Pages** | `.github/workflows/ci.yml` | Push or manual run on **`main`**, after the gate | Copies `index.html`, `tides-data.js`, `manifest.webmanifest`, `sw.js` and `icons/` to `_site`, deploys, then fetches them from the live URL | — |
| **Live canary** | `.github/workflows/live.yml` | Daily 17:23 UTC (6:23am NZDT / 5:23am NZST); manual | Tide data check (`--warn-days 90`) → live Playwright suite (2 retries) | No |
| **Auto-merge** | `.github/workflows/auto-merge.yml` | When a CI run on a PR succeeds | Merges the PR if it's still at the tested commit, then starts CI on the base branch | — |
| **Dependabot** | `.github/dependabot.yml` | Monthly | Grouped PRs (into `main`) for GitHub Actions and npm test tools | — |

Concurrency: CI cancels superseded runs on the same ref; deploys never cancel each other.
Permissions: workflows default to `contents: read`; only the deploy job gets `pages: write` and `id-token: write`.

## Merge policy

**Every pull request is merged as soon as CI passes on its latest commit.** This is enforced by
`.github/workflows/auto-merge.yml`, so it keeps working without anyone watching:

1. CI runs on the PR (the **Offline test gate**).
2. When CI finishes successfully, the Auto-merge workflow checks the PR is still at the commit that was tested, is not
   a draft and comes from this repo — then merges it (merge commit) into its base branch.
3. It then starts CI on the base branch, which re-runs the tests and deploys if that branch is the default.

A red or cancelled run never merges. Pushing a new commit to a PR restarts the cycle. To hold a PR back, mark it as a
**draft**. Dependabot PRs follow the same rule (they target `main`).

Note: GitHub may run workflows triggered by Dependabot with a read-only token. If a green Dependabot PR is not
merged automatically, merge it by hand or turn on Settings → General → **Allow auto-merge** and protect `main`.

## Branches

- `main` — what is published. Protect it and require the **Offline test gate** check.
- Feature branches — open a PR into `main`; CI runs on the PR.

## One-time setup (repo owner)

1. **Pages (required):** Settings → Pages → Source → **GitHub Actions**. Until this is set, the deploy job fails on `main`.
2. **Default branch (recommended):** Settings → General → Default branch → `main`, so new branches and PRs start from it.
3. **Branch protection (recommended):** Settings → Branches → rule for `main` requiring the **Offline test gate** check.

The site is published at https://cleevedennis.github.io/weather-wahine/.

## Runbook

| Alert | Likely cause | Action |
|---|---|---|
| Gate red on a push / PR | A change broke tide/weather logic, layout, accessibility or the export | Open the run → download `playwright-report` → reproduce with `npm test` → fix. Don't merge until green. |
| Gate red: "tide data ends … days left" or "expired" | Bundled LINZ data has run out | Refresh the data ([Tides](tides.md#refreshing-the-linz-data-yearly)). |
| Canary: "tide data ends … days left" | LINZ data within 90 days of ending | Refresh the data before it expires. |
| Canary: a beach doesn't load | Open-Meteo outage or rate limit (HTTP 429) | Re-run once. Usually clears on its own. |
| Canary: "hourly weather fields present" / "wave heights" fails | Open-Meteo renamed or dropped a field | Check the Open-Meteo docs; update `fetchData()` / `analyse()` and the mocks. |
| Canary: implausible tide gaps or highs per day | Model data problem, or LINZ offsets entered wrongly | Compare the beach's times with the LINZ tables. |
| Deploy job fails ("Get Pages site failed" / 404) | Pages source not set to GitHub Actions | Settings → Pages → Source → GitHub Actions, then re-run CI on `main`. |
| Deploy smoke check fails | Pages slow to publish | Re-run the job. |
| Dependabot PR fails CI | A tool update changed behaviour | Read the failing test; pin the previous version if needed. |
| Installed app shows an old version | Service worker served a cached copy while offline or on slow signal | Open it once with good signal; if `SHELL` in `sw.js` changed, make sure `VERSION` was bumped. |

GitHub emails the repo owner when a scheduled workflow fails.

## Versions

- Node 22 in CI; `@playwright/test` 1.63.0 and `axe-core` 4.10.2 pinned in `package.json` / `package-lock.json`.
- Python 3.12 in CI; `icalendar` 6.1.0 pinned in `requirements-dev.txt`.
- Actions are pinned to major versions and kept current by Dependabot.

## Claude Code cloud environment

Development sessions use a personal cloud environment named **weather-wahine** that allows these hosts in addition to
package registries: `api.open-meteo.com`, `marine-api.open-meteo.com`, `www.linz.govt.nz`,
`static.charts.linz.govt.nz`. LINZ's main website blocks automated requests, so secondary-port offsets have to be
copied by hand; the CSV host works.
