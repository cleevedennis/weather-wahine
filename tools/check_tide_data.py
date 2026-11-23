"""Check the bundled LINZ tide data in tides-data.js.

Fails if the data is malformed, or if it runs out within --warn-days (default 90) of today,
so there is time to add next year's LINZ table. Override today with --today YYYY-MM-DD.
"""
import argparse, datetime as dt, json, re, sys
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument("--file", default=str(Path(__file__).resolve().parent.parent / "tides-data.js"))
ap.add_argument("--warn-days", type=int, default=90)
ap.add_argument("--today", default=None)
a = ap.parse_args()

m = re.search(r"window\.LINZ_TIDES = (\{.*\});", Path(a.file).read_text())
if not m:
    sys.exit("FAIL: tides-data.js has no LINZ_TIDES object")
d = json.loads(m.group(1))
ev = d["events"]
problems = []
times = [e[0] for e in ev]
if times != sorted(times):
    problems.append("events not in time order")
if any(ev[i][2] == ev[i + 1][2] for i in range(len(ev) - 1)):
    problems.append("high/low tides do not alternate")
if any(not (-1 <= e[1] <= 6) for e in ev):
    problems.append("implausible tide height")
gaps = [(dt.datetime.fromisoformat(times[i + 1]) - dt.datetime.fromisoformat(times[i])).total_seconds() / 3600 for i in range(len(times) - 1)]
if max(gaps) > 8 or min(gaps) < 3:
    problems.append(f"implausible gap between tides ({min(gaps):.1f}–{max(gaps):.1f} h)")

today = dt.date.fromisoformat(a.today) if a.today else dt.date.today()
end = dt.date.fromisoformat(d["to"])
left = (end - today).days
print(f"{d['port']}: {len(ev)} tides, {d['from']} → {d['to']} ({left} days left as of {today})")
if left < a.warn_days:
    problems.append(f"tide data ends {end} — only {left} days left. Add next year's LINZ table (see README).")
if problems:
    for p in problems:
        print("FAIL:", p)
    sys.exit(1)
print("OK")
