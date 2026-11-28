"""One-off probe: hit each candidate data source once and save the raw reply, so the backtest
is built on what each API actually returns. Writes verification/probe/<name>.txt (status line + body).
Standard library only."""
import os, time, urllib.request, urllib.error

OUT = os.path.join(os.path.dirname(__file__), "probe")
os.makedirs(OUT, exist_ok=True)
P = "latitude=-36.954&longitude=174.469&timezone=Pacific%2FAuckland"          # Piha
H = "weather_code,temperature_2m,precipitation_probability,cloud_cover"
PREV = ",".join(f"{v}{s}" for v in H.split(",") for s in ("", "_previous_day1", "_previous_day7"))
D = "start_date=2025-01-10&end_date=2025-01-11"

PROBES = {
    "prev_bestmatch": f"https://previous-runs-api.open-meteo.com/v1/forecast?{P}&{D}&hourly={PREV}",
    "prev_ecmwf025": f"https://previous-runs-api.open-meteo.com/v1/forecast?{P}&{D}&hourly={PREV}&models=ecmwf_ifs025",
    "prev_gfs": f"https://previous-runs-api.open-meteo.com/v1/forecast?{P}&{D}&hourly={PREV}&models=gfs_seamless",
    "prev_wind": f"https://previous-runs-api.open-meteo.com/v1/forecast?{P}&{D}&hourly=wind_speed_10m_previous_day1,wind_direction_10m_previous_day1",
    "prev_marine": f"https://marine-api.open-meteo.com/v1/marine?{P}&{D}&hourly=wave_height,wave_height_previous_day1&cell_selection=sea",
    "marine_archive": f"https://marine-api.open-meteo.com/v1/marine?{P}&{D}&hourly=wave_height&cell_selection=sea",
    "single_ecmwf": f"https://single-runs-api.open-meteo.com/v1/forecast?{P}&run=2025-01-10T00:00&models=ecmwf_ifs&hourly={H}&forecast_days=16",
    "single_ecmwf_ens": f"https://single-runs-api.open-meteo.com/v1/forecast?{P}&run=2025-01-10T00:00&models=ecmwf_ifs025&hourly={H}",
    "era5_default": f"https://archive-api.open-meteo.com/v1/archive?{P}&{D}&hourly=temperature_2m,precipitation,cloud_cover,wind_speed_10m,wind_direction_10m,weather_code",
    "era5_explicit": f"https://archive-api.open-meteo.com/v1/archive?{P}&{D}&hourly=temperature_2m,precipitation,cloud_cover&models=era5",
    "linz_2025": "https://static.charts.linz.govt.nz/tide-tables/maj-ports/csv/Onehunga%202025.csv",
    "linz_2024": "https://static.charts.linz.govt.nz/tide-tables/maj-ports/csv/Onehunga%202024.csv",
    "envauckland_home": "https://environmentauckland.org.nz/",
    "envauckland_list": "https://environmentauckland.org.nz/Data/Map/List",
    "lawa_piha": "https://www.lawa.org.nz/explore-data/auckland-region/water-quantity/monitoring-sites/piha-rangers-shed",
    "geonet_tilde_stations": "https://tilde.geonet.org.nz/v4/stations?domain=coastal",
}

for name, url in PROBES.items():
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "weather-wahine-verification (github.com/cleevedennis/weather-wahine)"})
        with urllib.request.urlopen(req, timeout=60) as r:
            status, body = r.status, r.read()
    except urllib.error.HTTPError as e:
        status, body = e.code, e.read()
    except Exception as e:  # network errors are results too
        status, body = "ERR", repr(e).encode()
    with open(os.path.join(OUT, f"{name}.txt"), "wb") as f:
        f.write(f"{status} {url}\n".encode() + body[:400_000])
    print(name, status, len(body))
    time.sleep(1)
