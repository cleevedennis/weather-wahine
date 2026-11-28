"""Stage 2 of the backtest: score GFS forecasts (leads 0-7) and ERA5 actuals for Piha with the app's own rules,
then verify against an independent "good day" definition. Follows the pre-registered plan and its amendment
(https://claude.ai/artifact/Amkh6956Eq4pHwztJhEvae). Outputs: out/rows.csv, out/results.json, out/summary.md."""
import csv, glob, json, os, random, statistics as st
from collections import defaultdict
from ww_score import score_days, sky_class

HERE = os.path.dirname(os.path.abspath(__file__)); RAW, OUT = f"{HERE}/raw", f"{HERE}/out"
os.makedirs(OUT, exist_ok=True)
FROM, TO, MIN_T = "11:00", "16:00", 24          # the user's settings
WIN = range(11, 17)                             # hourly readings the app uses for 11:00-16:00
HW = -45                                        # Piha LINZ high-water offset (min)
SUMMERS = {"2024-25": ("2024-12-01", "2025-02-28"), "2025-26": ("2025-12-01", "2026-02-28")}
LEADS = range(0, 8)
GROUPS = {"0": [0], "1-3": [1, 2, 3], "4-7": [4, 5, 6, 7]}
random.seed(20261128)

# ---------- tides (LINZ Onehunga + Piha offset), same parse and labelling as tools/linz_to_js.py ----------
def linz_events(paths):
    ev = []
    for p in paths:
        for r in csv.reader(open(p, encoding="utf-8-sig")):
            if len(r) < 6 or not r[0].strip().isdigit() or not r[3].strip().isdigit(): continue
            d, m, y = int(r[0]), int(r[2]), int(r[3]); v = [x.strip() for x in r[4:]]
            for i in range(0, len(v) - 1, 2):
                if v[i] and v[i + 1]: ev.append([f"{y:04d}-{m:02d}-{d:02d}T{v[i]}", float(v[i + 1])])
    ev.sort()
    return [[t, h, 1 if all(h > ev[j][1] for j in (i - 1, i + 1) if 0 <= j < len(ev)) else 0] for i, (t, h) in enumerate(ev)]

from ww_score import linz_highs
EVENTS = linz_events(sorted(glob.glob(f"{RAW}/linz_onehunga_*.csv")) + [f"{HERE}/../data/Onehunga_2026.csv"])
HIGHS = linz_highs(EVENTS, HW)

# ---------- load hourly series ----------
def load(prefix):
    h = defaultdict(dict)
    for p in sorted(glob.glob(f"{RAW}/{prefix}_*.json")):
        j = json.load(open(p))
        if "hourly" not in j: continue
        for k, vals in j["hourly"].items():
            if k == "time": continue
            for t, v in zip(j["hourly"]["time"], vals): h[k][t] = v
    return h

GFS, ERA = load("gfs_prev"), load("era5")
CLIM = load("clim_era5")

def var(h, name, lead):
    return h.get(name if lead == 0 else f"{name}_previous_day{lead}", {})

def stand_in_prob(mm):
    if mm is None: return None
    return 10 if mm < 0.1 else 30 if mm < 0.5 else 50 if mm < 1.0 else 70

def dates(a, b):
    import datetime as dt
    d, e = dt.date.fromisoformat(a), dt.date.fromisoformat(b)
    while d <= e: yield d.isoformat(); d += dt.timedelta(days=1)

def day_input(date, code, temp, prob, cloud):
    """Build an Open-Meteo-shaped weather dict for one day from hourly dicts keyed by ISO time."""
    times = [f"{date}T{h:02d}:00" for h in range(24)]
    hc = [code.get(t) for t in times]; ht = [temp.get(t) for t in times]
    hp = [prob(t) for t in times]; hcl = [cloud.get(t) for t in times]
    ok = [x for x in hc if x is not None]; okt = [x for x in ht if x is not None]
    daily = dict(time=[date], weather_code=[max(ok) if ok else None], temperature_2m_max=[max(okt) if okt else None],
                 precipitation_probability_max=[max([x for x in hp if x is not None], default=None)])
    return {"daily": daily, "hourly": dict(time=times, weather_code=hc, temperature_2m=ht, precipitation_probability=hp, cloud_cover=hcl)}

def score(date, code, temp, prob, cloud):
    return score_days(day_input(date, code, temp, prob, cloud), None, HIGHS, FROM, TO, MIN_T)[0]

def win(h, date):
    return [h.get(f"{date}T{x:02d}:00") for x in WIN]

def good(date, cloud_max=50):
    p, t, c = win(ERA["precipitation"], date), win(ERA["temperature_2m"], date), win(ERA["cloud_cover"], date)
    if None in p or None in t or None in c: return None
    return sum(p) < 0.2 and max(t) >= 22 and st.mean(c) < cloud_max

def era_code(t):   # ERA5 weather code is itself modelled; used only to re-score the actuals
    return ERA["weather_code"].get(t)

# climatology of good days by day-of-year (+-7 days), ERA5 2010-2023 summers
import datetime as dt
clim_by_doy = defaultdict(list)
for t in CLIM["temperature_2m"]:
    if not t.endswith("T11:00"): continue
    d = t[:10]
    p = [CLIM["precipitation"].get(f"{d}T{x:02d}:00") for x in WIN]; tt = [CLIM["temperature_2m"].get(f"{d}T{x:02d}:00") for x in WIN]
    c = [CLIM["cloud_cover"].get(f"{d}T{x:02d}:00") for x in WIN]
    if None in p + tt + c: continue
    clim_by_doy[dt.date.fromisoformat(d).timetuple().tm_yday].append(sum(p) < 0.2 and max(tt) >= 22 and st.mean(c) < 50)
def clim_p(date):
    doy = dt.date.fromisoformat(date).timetuple().tm_yday; xs = []
    for k in range(-7, 8): xs += clim_by_doy.get((doy + k - 1) % 366 + 1, [])
    return sum(xs) / len(xs) if xs else None
clim_wet = defaultdict(list)
for t in CLIM["precipitation"]:
    if t.endswith("T11:00"):
        d = t[:10]; p = [CLIM["precipitation"].get(f"{d}T{x:02d}:00") for x in WIN]
        if None not in p: clim_wet[dt.date.fromisoformat(d).timetuple().tm_yday].append(sum(p) >= 0.2)
def clim_wet_p(date):
    doy = dt.date.fromisoformat(date).timetuple().tm_yday; xs = []
    for k in range(-7, 8): xs += clim_wet.get((doy + k - 1) % 366 + 1, [])
    return sum(xs) / len(xs) if xs else None

# ---------- build rows ----------
rows = []
for season, (a, b) in SUMMERS.items():
    for date in dates(a, b):
        g50, g70 = good(date), good(date, 70)
        actual = score(date, ERA["weather_code"], ERA["temperature_2m"],
                       lambda t: stand_in_prob(ERA["precipitation"].get(t)), ERA["cloud_cover"])
        tide_pts = None
        if actual["tide"]:
            mid, q = (660 + 960) / 2, (960 - 660) / 4
            tide_pts = 2 if any(abs(m - mid) <= q for m in actual["tide"]) else 1
        wsp, wdr = win(ERA["wind_speed_10m"], date), win(ERA["wind_direction_10m"], date)
        onshore = None if None in wsp + wdr else (st.mean(wsp) > 25 and 180 <= st.mean(wdr) <= 320)
        for L in LEADS:
            code, temp, cloud, pr = (var(GFS, v, L) for v in ("weather_code", "temperature_2m", "cloud_cover", "precipitation"))
            if not code: continue
            f = score(date, code, temp, lambda t: stand_in_prob(pr.get(t)), cloud)
            real_prob = None
            if L == 0:
                pp = GFS.get("precipitation_probability", {})
                fr = score(date, code, temp, lambda t: pp.get(t), cloud); real_prob = (fr["score"], fr["winRain"])
            issue = (dt.date.fromisoformat(date) - dt.timedelta(days=L)).isoformat()
            pers = score(date, {f"{date}T{h:02d}:00": ERA["weather_code"].get(f"{issue}T{h:02d}:00") for h in range(24)},
                         {f"{date}T{h:02d}:00": ERA["temperature_2m"].get(f"{issue}T{h:02d}:00") for h in range(24)},
                         lambda t: stand_in_prob(ERA["precipitation"].get(issue + t[10:])),
                         {f"{date}T{h:02d}:00": ERA["cloud_cover"].get(f"{issue}T{h:02d}:00") for h in range(24)}) if L > 0 else None
            fw = [temp.get(f"{date}T{x:02d}:00") for x in WIN]; aw = win(ERA["temperature_2m"], date)
            rows.append(dict(season=season, date=date, lead=L, tide_in_window=bool(actual["tide"]), tide_pts=tide_pts,
                             f_score=f["score"], f_winTemp=f["winTemp"], f_winRain_standin=f["winRain"], f_winCode=f["winCode"],
                             a_score=actual["score"], a_winTemp=max(aw) if None not in aw else None,
                             a_rain_mm=sum(win(ERA["precipitation"], date)) if None not in win(ERA["precipitation"], date) else None,
                             a_cloud=st.mean(win(ERA["cloud_cover"], date)) if None not in win(ERA["cloud_cover"], date) else None,
                             good50=g50, good70=g70, onshore_strong=onshore, clim_p=clim_p(date), clim_wet_p=clim_wet_p(date),
                             pers_score=pers["score"] if pers else None,
                             l0_real_score=real_prob[0] if real_prob else None, l0_real_prob=real_prob[1] if real_prob else None,
                             temp_err=(max(fw) - max(aw)) if None not in fw + aw else None))

with open(f"{OUT}/rows.csv", "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)

# ---------- verification ----------
def table(pairs):  # pairs of (forecast_yes, observed_yes)
    h = sum(f and o for f, o in pairs); m = sum((not f) and o for f, o in pairs)
    fa = sum(f and not o for f, o in pairs); cn = sum((not f) and (not o) for f, o in pairs)
    pod = h / (h + m) if h + m else None; pofd = fa / (fa + cn) if fa + cn else None
    far = fa / (h + fa) if h + fa else None
    return dict(n=len(pairs), hits=h, misses=m, false_alarms=fa, correct_no=cn, POD=pod, FAR=far,
                Peirce=(pod - pofd) if pod is not None and pofd is not None else None)

def boot(by_date, fn, n=2000):
    keys = list(by_date); vals = []
    for _ in range(n):
        pick = [by_date[random.choice(keys)] for _ in keys]
        v = fn([x for grp in pick for x in grp])
        if v is not None: vals.append(v)
    vals.sort()
    return [vals[int(.025 * len(vals))], vals[int(.975 * len(vals)) - 1]] if vals else [None, None]

def peirce_of(sel, fcast, truth="good50"):
    return table([(fcast(r), r[truth]) for r in sel])["Peirce"]

FORECASTS = {
    "app (GFS stand-in), score>=6": lambda r: r["f_score"] is not None and r["f_score"] >= 6,
    "tide only (central tide)":     lambda r: r["tide_pts"] == 2,
    "climatology (p>=0.5)":         lambda r: (r["clim_p"] or 0) >= 0.5,
    "persistence, score>=6":        lambda r: r["pers_score"] is not None and r["pers_score"] >= 6,
}
res = {"n_dates": len({r['date'] for r in rows}), "groups": {}}
for truth in ("good50", "good70"):
    for g, Ls in GROUPS.items():
        sel = [r for r in rows if r["lead"] in Ls and r["tide_in_window"] and r[truth] is not None]
        by_date = defaultdict(list)
        for r in sel: by_date[r["date"]].append(r)
        out = {}
        for name, fc in FORECASTS.items():
            if name.startswith("persistence") and g == "0": continue
            t = table([(fc(r), r[truth]) for r in sel])
            t["Peirce_CI95"] = boot(by_date, lambda xs, fc=fc: peirce_of(xs, fc, truth))
            out[name] = t
        app = FORECASTS["app (GFS stand-in), score>=6"]; tide = FORECASTS["tide only (central tide)"]
        out["app minus tide-only Peirce, CI95"] = boot(by_date, lambda xs: (lambda a, b: None if a is None or b is None else a - b)(peirce_of(xs, app, truth), peirce_of(xs, tide, truth)))
        out["app Peirce by threshold"] = {k: table([(r["f_score"] is not None and r["f_score"] >= k, r[truth]) for r in sel])["Peirce"] for k in range(2, 9)}
        out["good-day rate by forecast score"] = {str(k): (lambda xs: [round(sum(xs) / len(xs), 2), len(xs)] if xs else None)([r[truth] for r in sel if r["f_score"] == k]) for k in [None] + list(range(0, 9))}
        res["groups"][f"{truth} lead {g}"] = out
# temperature, per lead
res["temp"] = {}
for L in LEADS:
    e = [r["temp_err"] for r in rows if r["lead"] == L and r["temp_err"] is not None]
    by_date = defaultdict(list)
    for r in rows:
        if r["lead"] == L and r["temp_err"] is not None: by_date[r["date"]].append(r)
    res["temp"][L] = dict(n=len(e), bias=st.mean(e), MAE=st.mean(abs(x) for x in e),
                          bias_CI95=boot(by_date, lambda xs: st.mean(x["temp_err"] for x in xs) if xs else None),
                          bias_by_season={s: st.mean([r["temp_err"] for r in rows if r["lead"] == L and r["season"] == s and r["temp_err"] is not None]) for s in SUMMERS})
# lead 0: real rain probability vs stand-in, Brier vs climatology
l0 = [r for r in rows if r["lead"] == 0 and r["a_rain_mm"] is not None]
wet = lambda r: r["a_rain_mm"] >= 0.2
pr = [(r["l0_real_prob"] / 100, wet(r)) for r in l0 if r["l0_real_prob"] is not None]
cl = [(r["clim_wet_p"], wet(r)) for r in l0 if r["l0_real_prob"] is not None and r["clim_wet_p"] is not None]
bs = st.mean((p - o) ** 2 for p, o in pr) if pr else None; bsc = st.mean((p - o) ** 2 for p, o in cl) if cl else None
bins = defaultdict(list)
for p, o in pr: bins[min(int(p * 10), 9)].append(o)
pts = lambda p: None if p is None else (1 if p is None else 2 if p < 20 else 1 if p < 40 else 0 if p < 60 else "out")
agree = [(pts(r["l0_real_prob"]) == pts(r["f_winRain_standin"])) for r in l0 if r["l0_real_prob"] is not None and r["f_winRain_standin"] is not None]
res["rain_lead0"] = dict(n=len(pr), Brier=bs, Brier_climatology=bsc, BSS=(1 - bs / bsc) if bs is not None and bsc else None,
                         reliability={f"{k*10}-{k*10+9}%": [round(sum(v) / len(v), 2), len(v)] for k, v in sorted(bins.items())},
                         standin_points_agree_with_real=(sum(agree) / len(agree)) if agree else None, n_agree=len(agree))
# medal stability: would the day keep its band on the actual weather? (band = score >=6 / 4-5 / 2-3 / not ranked)
band = lambda s: "not ranked" if s is None or s < 2 else "6+" if s >= 6 else "4-5" if s >= 4 else "2-3"
res["band_kept"] = {}
for g, Ls in GROUPS.items():
    sel = [r for r in rows if r["lead"] in Ls and r["f_score"] is not None and r["f_score"] >= 6]
    res["band_kept"][g] = dict(n=len(sel), **{k: sum(band(r["a_score"]) == k for r in sel) for k in ("6+", "4-5", "2-3", "not ranked")})
# wind check
res["wind"] = {}
for g, Ls in GROUPS.items():
    fail = [r for r in rows if r["lead"] in Ls and r["f_score"] is not None and r["f_score"] >= 6 and r["good50"] is False and r["onshore_strong"] is not None]
    gd = [r for r in rows if r["lead"] in Ls and r["good50"] and r["onshore_strong"] is not None]
    res["wind"][g] = dict(failed_medal_days=len(fail), failed_with_strong_onshore=sum(r["onshore_strong"] for r in fail),
                          good_days=len(gd), good_with_strong_onshore=sum(r["onshore_strong"] for r in gd))
json.dump(res, open(f"{OUT}/results.json", "w"), indent=1, default=str)
print(json.dumps(res, indent=1, default=str)[:12000])
