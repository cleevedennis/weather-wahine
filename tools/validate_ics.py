"""Validate exported .ics files with the independent `icalendar` library."""
import sys
from pathlib import Path
from icalendar import Calendar

files = [p for arg in sys.argv[1:] for p in (Path(arg).glob("*.ics") if Path(arg).is_dir() else [Path(arg)])]
if not files:
    sys.exit("FAIL: no .ics files to validate")
bad = 0
for f in files:
    raw = f.read_bytes()
    cal = Calendar.from_ical(raw)
    events = list(cal.walk("VEVENT"))
    errs = []
    if not events:
        errs.append("no events")
    if [str(t["TZID"]) for t in cal.walk("VTIMEZONE")] != ["Pacific/Auckland"]:
        errs.append("missing Pacific/Auckland VTIMEZONE")
    for e in events:
        s, t = e.decoded("DTSTART"), e.decoded("DTEND")
        if t <= s:
            errs.append(f"{e['UID']}: ends before it starts")
        if hasattr(s, "tzinfo") and s.tzinfo is None:
            errs.append(f"{e['UID']}: floating time")
    if any(len(l) > 75 for l in raw.split(b"\r\n")):
        errs.append("line longer than 75 bytes")
    print(f"{f.name}: {len(events)} events", "OK" if not errs else "FAIL")
    for x in errs:
        print("  FAIL:", x)
    bad += bool(errs)
sys.exit(1 if bad else 0)
