"""Download orbit data from JPL (NASA) for comets, interstellar objects, spacecraft and the planets.

Run from the project root:
    python src/fetch_jpl.py

Writes small JSON files to data/raw/ (dated with the day of the download):
  jpl_sbdb_<date>.json        orbital elements of the comets and interstellar objects (Small-Body Database API)
  jpl_horizons_<date>.json    the flight path of the spacecraft, sun centred, ecliptic J2000, in AU (Horizons API)
  jpl_planets_<date>.html     the page "Keplerian Elements for Approximate Positions of the Major Planets"

Source: JPL Solar System Dynamics, https://ssd.jpl.nasa.gov (credit JPL/Caltech/NASA). The terms of use of
these services were not found when this was written, see the README.
"""
import datetime as dt
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
TODAY = dt.date.today().isoformat()

# Name for the Small-Body Database, then the kind. The search string finds the object.
SMALL_BODIES = [
    ("1P", "comet"),  # Halley
    ("C/1995 O1", "comet"),  # Hale-Bopp
    ("67P", "comet"),  # Churyumov-Gerasimenko
    ("109P", "comet"),  # Swift-Tuttle
    ("2P", "comet"),  # Encke
    ("C/2020 F3", "comet"),  # NEOWISE
    ("1I", "interstellar"),  # 'Oumuamua
    ("2I", "interstellar"),  # Borisov
    ("3I", "interstellar"),  # ATLAS
]

# Horizons id, name, first day of the flight path, step. The ids of spacecraft are negative.
SPACECRAFT = [
    ("-31", "Voyager 1", "1977-09-10", "60 d"),
    ("-32", "Voyager 2", "1977-08-25", "60 d"),
    ("-98", "New Horizons", "2006-01-25", "30 d"),
    ("-61", "Juno", "2011-08-06", "30 d"),
    ("-96", "Parker Solar Probe", "2018-08-13", "5 d"),
    ("-170", "James Webb Space Telescope", "2022-01-01", "10 d"),
]


def get(url: str, params: dict | None = None) -> str:
    if params:
        url += "?" + urllib.parse.urlencode(params, safe="/'")
    request = urllib.request.Request(url, headers={"User-Agent": "exoplanet-atlas-3d (portfolio project)"})
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read().decode("utf-8")


def fetch_small_bodies() -> list[dict]:
    out = []
    for name, kind in SMALL_BODIES:
        reply = json.loads(get("https://ssd-api.jpl.nasa.gov/sbdb.api", {"sstr": name, "full-prec": "1"}))
        if "orbit" not in reply:
            print(f"  {name}: no orbit in the reply: {str(reply)[:200]}")
            continue
        orbit = reply["orbit"]
        out.append(
            {
                "query": name,
                "kind": kind,
                "fullname": reply["object"]["fullname"],
                "shortname": reply["object"].get("shortname"),
                "epoch_jd": orbit["epoch"],
                "elements": {e["name"]: e["value"] for e in orbit["elements"]},
                "orbit_class": reply["object"].get("orbit_class", {}).get("name"),
                "source_version": reply.get("signature", {}).get("version"),
            }
        )
        print(f"  {reply['object']['fullname']}: e={out[-1]['elements'].get('e')}")
        time.sleep(0.5)  # be polite to the service
    return out


def fetch_spacecraft() -> list[dict]:
    out = []
    for horizons_id, name, start, step in SPACECRAFT:
        params = {
            "format": "json",
            "COMMAND": f"'{horizons_id}'",
            "OBJ_DATA": "'NO'",
            "MAKE_EPHEM": "'YES'",
            "EPHEM_TYPE": "'VECTORS'",
            "CENTER": "'500@10'",  # the Sun
            "REF_PLANE": "'ECLIPTIC'",
            "START_TIME": f"'{start}'",
            "STOP_TIME": f"'{TODAY}'",
            "STEP_SIZE": f"'{step}'",
            "OUT_UNITS": "'AU-D'",
            "VEC_TABLE": "'1'",  # position only
            "CSV_FORMAT": "'YES'",
        }
        reply = json.loads(get("https://ssd.jpl.nasa.gov/api/horizons.api", params))
        text = reply.get("result", "")
        if "$$SOE" not in text:
            print(f"  {name}: no table in the reply: {text[:300]}")
            continue
        rows = text.split("$$SOE")[1].split("$$EOE")[0].strip().splitlines()
        path = []
        for row in rows:
            cells = [c.strip() for c in row.split(",")]
            # JDTDB, calendar date, X, Y, Z
            path.append([float(cells[0]), float(cells[2]), float(cells[3]), float(cells[4])])
        out.append({"id": horizons_id, "name": name, "path": path})
        print(f"  {name}: {len(path)} points, last {path[-1]}")
        time.sleep(0.5)
    return out


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    print("Small bodies")
    (RAW / f"jpl_sbdb_{TODAY}.json").write_text(json.dumps(fetch_small_bodies(), indent=1), encoding="utf-8")
    print("Spacecraft")
    (RAW / f"jpl_horizons_{TODAY}.json").write_text(json.dumps(fetch_spacecraft()), encoding="utf-8")
    print("Planets")
    (RAW / f"jpl_planets_{TODAY}.html").write_text(get("https://ssd.jpl.nasa.gov/planets/approx_pos.html"), encoding="utf-8")


if __name__ == "__main__":
    main()
