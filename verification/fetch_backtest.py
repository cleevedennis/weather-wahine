"""Stage 1 of the backtest: download raw data for Piha, two summers, into verification/raw/ (unchanged JSON/CSV).
Stand-in design (see plan): GFS previous runs, lead 0-7. Rain chance is not archived beyond lead 0, so
forecast rainfall amount is fetched and stands in for it (mapping fixed in the plan before results)."""
import os, json, time, urllib.request, urllib.error

RAW = os.path.join(os.path.dirname(__file__), "raw"); os.makedirs(RAW, exist_ok=True)
LAT, LON, TZ = -36.954, 174.469, "Pacific%2FAuckland"   # Piha, as in index.html
BASE = f"latitude={LAT}&longitude={LON}&timezone={TZ}"
MONTHS = [("2024-12-01", "2024-12-31"), ("2025-01-01", "2025-01-31"), ("2025-02-01", "2025-02-28"),
          ("2025-12-01", "2025-12-31"), ("2026-01-01", "2026-01-31"), ("2026-02-01", "2026-02-28")]
log = []

def get(name, url, timeout=180, tries=3):
    path = os.path.join(RAW, name)
    if os.path.exists(path): return
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "weather-wahine-verification"})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                body = r.read(); open(path, "wb").write(body); log.append([name, r.status, len(body), url]); return
        except urllib.error.HTTPError as e:
            body = e.read()[:300]; log.append([name, e.code, body.decode("utf8", "replace"), url])
            if e.code in (400, 404): return
        except Exception as e:
            log.append([name, "ERR", repr(e), url])
        time.sleep(10 * (k + 1))

lead = lambda vs, n=7: ",".join(v + ("" if d == 0 else f"_previous_day{d}") for v in vs for d in range(n + 1))
GFS_VARS = ["weather_code", "temperature_2m", "cloud_cover", "precipitation", "wind_speed_10m", "wind_direction_10m"]
for a, b in MONTHS:
    D = f"start_date={a}&end_date={b}"
    get(f"gfs_prev_{a[:7]}.json", f"https://previous-runs-api.open-meteo.com/v1/forecast?{BASE}&{D}&models=gfs_seamless"
        f"&hourly={lead(GFS_VARS)},precipitation_probability")
    get(f"bestmatch_prev_{a[:7]}.json", f"https://previous-runs-api.open-meteo.com/v1/forecast?{BASE}&{D}"
        f"&hourly={lead(['weather_code', 'temperature_2m', 'precipitation_probability'])}", timeout=300)
    get(f"era5_{a[:7]}.json", f"https://archive-api.open-meteo.com/v1/archive?{BASE}&{D}"
        "&hourly=temperature_2m,precipitation,cloud_cover,wind_speed_10m,wind_direction_10m,weather_code")
    get(f"marine_{a[:7]}.json", f"https://marine-api.open-meteo.com/v1/marine?{BASE}&{D}&hourly=wave_height&cell_selection=sea")
    time.sleep(2)

for y in range(2010, 2024):   # climatology reference: Dec y .. Feb y+1
    get(f"clim_era5_{y}.json", f"https://archive-api.open-meteo.com/v1/archive?{BASE}&start_date={y}-12-01&end_date={y+1}-02-28"
        "&hourly=temperature_2m,precipitation,cloud_cover")
    time.sleep(2)

for y in (2024, 2025):
    get(f"linz_onehunga_{y}.csv", f"https://static.charts.linz.govt.nz/tide-tables/maj-ports/csv/Onehunga%20{y}.csv")

# Auckland Council (Aquarius WebPortal) — guesses at its standard endpoints; replies saved to inspect.
EA = "https://environmentauckland.org.nz"
for i, p in enumerate(["/Data/Map/Locations", "/Map/GetLocations", "/Data/Location/List", "/api/v1/locations",
                       "/Data/Map/Parameter/Rainfall/Location/All/Interval/Latest", "/Data/Dashboard/457"]):
    get(f"ea_probe_{i}.txt", EA + p, timeout=60, tries=1)

json.dump(log, open(os.path.join(RAW, "_fetch_log.json"), "w"), indent=1)
print("\n".join(f"{n} {s} {l if isinstance(l, int) else str(l)[:120]}" for n, s, l, _ in log))
