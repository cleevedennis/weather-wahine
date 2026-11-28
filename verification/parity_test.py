"""Fuzz parity: Python port vs the real index.html scoring (via node app_harness.js). Exit 1 on any mismatch."""
import json, random, subprocess, sys, datetime as dt
from ww_score import LOCATIONS, load_linz, linz_highs, score_days
import os; REPO = os.environ.get("REPO", ".."); SCHEME = os.environ.get("SCHEME", "bands"); random.seed(int(sys.argv[1]) if len(sys.argv) > 1 else 1)
EV = load_linz(f"{REPO}/tides-data.js")
CODES = [0, 1, 2, 3, 45, 48, 51, 53, 61, 63, 65, 71, 80, 82, 95, 99, 7] + ([0, 1, 2, 3] * 12 if __import__("os").environ.get("FINE") else [])
EDGE_T = lambda mt: random.choice([mt, mt - 0.1, mt - 3, mt - 3.1, mt - 6, mt - 6.1, mt + 2, random.uniform(mt - 9, mt + 5)])
EDGE_R = lambda: random.choice([0, 19, 20, 39, 40, 59, 60, 100, None, random.randint(0, 100)])
EDGE_W = lambda: random.choice([1.49, 1.5, 2.49, 2.5, None, round(random.uniform(0.3, 4), 2)])

def case():
    beach = random.choice(list(LOCATIONS)); lat, lon, harbour, hw, lw = LOCATIONS[beach]
    frm, to, mt = random.choice([("11:00", "16:00", 24), ("11:00", "16:00", 22), ("09:30", "14:15", 20), ("17:00", "11:00", 26), ("x", "", "")])
    mtn = float(mt) if mt != "" else 22.0
    start = dt.date(2026, 1, 1) + dt.timedelta(days=random.randint(0, 700)); ndays = 16
    dates = [(start + dt.timedelta(days=i)).isoformat() for i in range(ndays)]
    daily = dict(time=dates, weather_code=[], temperature_2m_max=[], temperature_2m_min=[], precipitation_probability_max=[], sunshine_duration=[], uv_index_max=[])
    hourly = dict(time=[], weather_code=[], temperature_2m=[], precipitation_probability=[], cloud_cover=[])
    mar = dict(time=[], wave_height=[])
    use_hourly = random.random() < 0.85
    for dte in dates:
        dc, dtx = random.choice(CODES + [None] * (random.random() < .05)), EDGE_T(mtn)
        daily["weather_code"].append(dc); daily["temperature_2m_max"].append(dtx); daily["temperature_2m_min"].append(dtx - 8)
        daily["precipitation_probability_max"].append(EDGE_R()); daily["sunshine_duration"].append(3e4); daily["uv_index_max"].append(9)
        day_code, day_t, day_r, day_w = random.choice(CODES), EDGE_T(mtn), EDGE_R(), EDGE_W()
        for h in range(24):
            tm = f"{dte}T{h:02d}:00"
            hourly["time"].append(tm); mar["time"].append(tm)
            noisy = random.random() < 0.3
            hourly["weather_code"].append(random.choice(CODES) if noisy else day_code)
            hourly["temperature_2m"].append(EDGE_T(mtn) if noisy else day_t)
            hourly["precipitation_probability"].append(EDGE_R() if noisy else day_r)
            hourly["cloud_cover"].append(50)
            mar["wave_height"].append(EDGE_W() if noisy else day_w)
    weather = {"daily": daily, **({"hourly": hourly} if use_hourly else {})}
    marine = None if harbour else {"hourly": mar}
    return dict(beach=beach, **{"from": frm, "to": to, "minTemp": mt}, weather=weather, marine=marine, hw=hw)

N = 400
cases = [case() for _ in range(N)]
js = json.loads(subprocess.run(["node", "app_harness.js", REPO], input=json.dumps(cases), capture_output=True, text=True, check=True).stdout)
bad = days_n = scored = medals = 0
for c, jd in zip(cases, js):
    pd = score_days(c["weather"], c["marine"], linz_highs(EV, c["hw"]), c["from"], c["to"], c["minTemp"], SCHEME)
    for a, b in zip(pd, jd):
        days_n += 1; scored += a["score"] is not None; medals += a["medal"] is not None
        if any(a[k] != b[k] for k in ("date", "score", "medal", "tide", "winCode", "winRain", "wave")) or abs((a["winTemp"] or 0) - (b["winTemp"] or 0)) > 1e-9:
            bad += 1
            if bad <= 5: print("MISMATCH", c["beach"], a, b)
print(f"{N} cases, {days_n} days, {scored} scored, {medals} medals, {bad} mismatches")
sys.exit(1 if bad else 0)
