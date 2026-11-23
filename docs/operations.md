# Operations

## Workflows

| Workflow | File | Trigger | Steps | Blocks merges |
|---|---|---|---|---|
| **CI → Offline test gate** | `.github/workflows/ci.yml` | Every push and pull request; manual | `npm ci` → install Chromium → tide data check (`--warn-days 0`) → `npm test` → `validate_ics.py`; uploads `playwright-report` on failure | Yes |
| **CI → Deploy to GitHub Pages** | `.github/workflows/ci.yml` | Push to the **default branch**, after the gate, when repo variable `PAGES_ENABLED` is `true` | Copies `index.html` + `tides-data.js` to `_site`, deploys, then fetches both from the live URL | — |
| **Live canary** | `.github/workflows/live.yml` | Daily 17:23 UTC (6:23am NZDT / 5:23am NZST); manual | Tide data check (`--warn-days 90`) → live Playwright suite (2 retries) | No |
| **Dependabot** | `.github/dependabot.yml` | Monthly | Grouped PRs for GitHub Actions and npm test tools | — |

Concurrency: CI cancels superseded runs on the same ref; deploys never cancel each other.
Permissions: workflows default to `contents: read`; only the deploy job gets `pages: write` and `id-token: write`.

## Branches

- `main` — what is published. Protect it and require the **Offline test gate** check.
- Feature branches — open a PR into `main`; CI runs on the PR.

## One-time setup (repo owner)

1. **Default branch:** Settings → General → Default branch → `main` (deploys follow the default branch).
2. **Pages:** Settings → Pages → Source → **GitHub Actions**.
3. **Switch deploys on:** Settings → Secrets and variables → Actions → Variables → `PAGES_ENABLED` = `true`.
4. **Branch protection:** Settings → Branches → rule for `main` requiring the **Offline test gate** status check.

Until step 3 the deploy job shows as *skipped*, which is expected.

## Runbook

| Alert | Likely cause | Action |
|---|---|---|
| Gate red on a push / PR | A change broke tide/weather logic, layout, accessibility or the export | Open the run → download `playwright-report` → reproduce with `npm test` → fix. Don't merge until green. |
| Gate red: "tide data ends … days left" or "expired" | Bundled LINZ data has run out | Refresh the data ([Tides](tides.md#refreshing-the-linz-data-yearly)). |
| Canary: "tide data ends … days left" | LINZ data within 90 days of ending | Refresh the data before it expires. |
| Canary: a beach doesn't load | Open-Meteo outage or rate limit (HTTP 429) | Re-run once. Usually clears on its own. |
| Canary: "hourly weather fields present" / "wave heights" fails | Open-Meteo renamed or dropped a field | Check the Open-Meteo docs; update `fetchData()` / `analyse()` and the mocks. |
| Canary: implausible tide gaps or highs per day | Model data problem, or LINZ offsets entered wrongly | Compare the beach's times with the LINZ tables. |
| Deploy smoke check fails | Pages not enabled, or slow to publish | Check Settings → Pages; re-run the job. |
| Dependabot PR fails CI | A tool update changed behaviour | Read the failing test; pin the previous version if needed. |

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
