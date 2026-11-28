# Forecast verification (study branch)

Checks whether Weather Wahine's medal days hold up against what actually happened.
Plan, fixed before any data was pulled: https://claude.ai/artifact/Amkh6956Eq4pHwztJhEvae

- `ww_score.py` — Python port of the scoring in `index.html` (commit 3fc41f4)
- `app_harness.js` + `parity_test.py` — fuzz test: the port must match the real page code on every day
- `probe.py` — one request per candidate data source, raw replies in `probe/`
- `run.sh` — the current step; `.github/workflows/verify.yml` runs it on push and commits outputs here

This branch changes nothing in the app and is not to be merged without the owner's approval.
