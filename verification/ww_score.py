"""Python port of Weather Wahine's scoring (index.html: settings, linzTides highs, analyse, rankDays).

Ported from the live code at commit 3fc41f4, not from the handover doc. Differences from the doc that the
code makes explicit:
  * the window takes every hourly reading whose hour overlaps it: 11:00-16:00 uses the 11:00 ... 16:00 readings (6 hours)
  * a missing rain probability earns 1 point (not 0) and never excludes the day
  * no swell data (harbour beaches) earns 0 swell points
  * a day is only scored with a high tide in the window, a non-rain sky, temp >= min-6 and rain chance < 60%
"""
import json, re, datetime as dt

MEDALS = ["platinum", "gold", "silver", "bronze"]
BEST_SHOWN, MIN_SCORE = 4, 2

LOCATIONS = {  # name: (lat, lon, harbour, hw offset min, lw offset min)
    "Huia Domain": (-37.003, 174.566, True, -13, -17), "Kaitarakihi": (-37.008, 174.583, True, -13, -17),
    "Cornwallis": (-37.012, 174.600, True, -13, -17), "Whatipu": (-37.044, 174.507, False, -33, -28),
    "Karekare": (-36.988, 174.476, False, -45, -35), "Piha": (-36.954, 174.469, False, -45, -35),
    "Te Henga": (-36.887, 174.442, False, -40, -50), "Muriwai": (-36.829, 174.424, False, -40, -30),
}

def sky_class(code):
    if code in (0, 1): return "clear"
    if code == 2: return "partly"
    if code in (51, 53, 55, 56, 57, 61, 63, 66, 80, 81): return "rain"
    if code in (65, 67, 82, 95, 96, 99): return "storm"
    return "overcast"   # 3, 45, 48, snow codes, and anything unknown

SKY_PTS = {"clear": 2, "partly": 1, "overcast": 0}

def to_min(hhmm):
    h, m = hhmm.split(":")[:2]
    return int(h) * 60 + int(m or 0)

def settings(frm="11:00", to="16:00", min_temp=22):
    ok = lambda s: isinstance(s, str) and re.fullmatch(r"\d{1,2}:\d{2}", s)
    f = to_min(frm) if ok(frm) else to_min("11:00")
    t = to_min(to) if ok(to) else to_min("16:00")
    if f > t: f, t = t, f
    try:
        mt = float(min_temp)
        if mt != mt or mt in (float("inf"), float("-inf")): raise ValueError
    except (TypeError, ValueError):
        mt = 22.0
    return f, t, mt

def load_linz(path):
    txt = open(path, encoding="utf8").read()
    return json.loads(txt[txt.index("{"):txt.rindex("}") + 1])["events"]

def _naive(iso):  # local time as plain minutes since epoch (matches the JS `naive`)
    return int(dt.datetime.fromisoformat(iso).replace(tzinfo=dt.timezone.utc).timestamp() // 60)

def linz_highs(events, hw):
    out = []
    for t, h, hi in events:
        if not hi: continue
        m = _naive(t) + hw
        d = dt.datetime.fromtimestamp(m * 60, dt.timezone.utc)
        out.append((d.date().isoformat(), m % 1440, h))
    return out

def score_days(weather, marine, highs, frm, to, min_temp):
    """weather/marine: Open-Meteo-shaped dicts. highs: list of (date, mins, height). Returns list of dicts."""
    f, t, mt = settings(frm, to, min_temp)
    d, wh = weather["daily"], weather.get("hourly")
    mh = marine.get("hourly") if marine else None

    def pick(h, key, date):
        if not h or not h.get(key): return []
        return [h[key][j] for j, tm in enumerate(h["time"])
                if tm.startswith(date) and to_min(tm[11:]) + 59 >= f and to_min(tm[11:]) <= t and h[key][j] is not None]
    mx = lambda a: max(a) if a else None

    days = []
    for i, date in enumerate(d["time"]):
        in_win = [m for (dd, m, _) in highs if dd == date and f <= m <= t]
        code, tmax = d["weather_code"][i], d["temperature_2m_max"][i]
        rain = (d.get("precipitation_probability_max") or [None] * (i + 1))[i]
        has_w = code is not None and tmax is not None
        codes, temps = pick(wh, "weather_code", date), pick(wh, "temperature_2m", date)
        hourly = len(codes) > 0 and len(temps) > 0
        win_code = mx(codes) if hourly else code
        win_temp = mx(temps) if hourly else tmax
        win_rain = mx(pick(wh, "precipitation_probability", date)) if hourly else rain
        wave = mx(pick(mh, "wave_height", date))
        sky = SKY_PTS.get(sky_class(win_code)) if has_w else None
        score = None
        if in_win and sky is not None and win_temp >= mt - 6 and (win_rain is None or win_rain < 60):
            mid, quarter = (f + t) / 2, (t - f) / 4
            score = (sky
                     + (2 if win_temp >= mt else 1 if win_temp >= mt - 3 else 0)
                     + (1 if win_rain is None else 2 if win_rain < 20 else 1 if win_rain < 40 else 0)
                     + (2 if any(abs(m - mid) <= quarter for m in in_win) else 1)
                     + (0 if wave is None else 1 if wave < 1.5 else -1 if wave >= 2.5 else 0))
        days.append(dict(date=date, score=score, medal=None, winTemp=win_temp, winRain=win_rain,
                         winCode=win_code, wave=wave, tide=[round(m) for m in in_win]))
    ranked = sorted([(i, x) for i, x in enumerate(days) if x["score"] is not None and x["score"] >= MIN_SCORE],
                    key=lambda p: (-p[1]["score"], p[0]))
    for k, (_, x) in enumerate(ranked[:BEST_SHOWN]):
        x["medal"] = MEDALS[k]
    return days
