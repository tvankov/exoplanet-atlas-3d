"""Make web/data/orbits.json from the JPL downloads of src/fetch_jpl.py.

Run from the project root:
    python src/build_orbits.py

The file holds three things for the app:
  planets      the Keplerian elements and their rates of the eight planets (Table 1 of "Keplerian Elements for
               Approximate Positions of the Major Planets", valid 1800 to 2050), the Earth row is the Earth-Moon
               barycentre
  bodies       the comets and interstellar objects with the elements of the Small-Body Database
  spacecraft   the flight paths from Horizons, [julian day, x, y, z] in AU, sun centred, ecliptic J2000
  retrieved    the day of the download, the positions of the spacecraft are valid for this day
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "web" / "data" / "orbits.json"

PLANET_ROWS = ["Mercury", "Venus", "EM Bary", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"]
KEYS = ["a", "e", "I", "L", "peri", "node"]  # the columns of the table, in this order


def latest(pattern: str) -> Path:
    return sorted(RAW.glob(pattern))[-1]


def planets() -> dict:
    text = latest("jpl_planets_*.html").read_text(encoding="utf-8")
    text = html.unescape(re.sub(r"<[^>]+>", " ", text))
    table = text[text.index("Table 1") : text.index("Table 2a")]
    out = {}
    for name in PLANET_ROWS:
        # A row: the name and six values, the next line six rates. Numbers like 0.38709927 or -0.00594749.
        match = re.search(re.escape(name) + r"\s+((?:-?[\d.]+\s+){6})\s*((?:-?[\d.]+\s+){5}-?[\d.]+)", table)
        values = [float(v) for v in match.group(1).split()]
        rates = [float(v) for v in match.group(2).split()]
        out[name] = {"value": dict(zip(KEYS, values)), "rate": dict(zip(KEYS, rates))}
    return out


def bodies() -> list[dict]:
    data = json.loads(latest("jpl_sbdb_*.json").read_text(encoding="utf-8"))
    wanted = ["e", "a", "q", "i", "om", "w", "tp", "per", "n"]
    out = []
    for b in data:
        el = {k: float(b["elements"][k]) for k in wanted if b["elements"].get(k) is not None}
        out.append({"name": b["fullname"].strip(), "short": (b.get("shortname") or b["fullname"]).strip(), "kind": b["kind"], "el": el})
    return out


def spacecraft() -> list[dict]:
    data = json.loads(latest("jpl_horizons_*.json").read_text(encoding="utf-8"))
    return [
        {"name": s["name"], "path": [[r[0], round(r[1], 4), round(r[2], 4), round(r[3], 4)] for r in s["path"]]}
        for s in data
    ]


def main() -> None:
    horizons = latest("jpl_horizons_*.json")
    result = {
        "retrieved": horizons.stem.split("_")[-1],
        "planets": planets(),
        "bodies": bodies(),
        "spacecraft": spacecraft(),
    }
    OUT.write_text(json.dumps(result, separators=(",", ":")), encoding="utf-8")
    print(f"{len(result['planets'])} planets, {len(result['bodies'])} small bodies, {len(result['spacecraft'])} spacecraft")
    print(f"-> {OUT} ({OUT.stat().st_size // 1024} KB), retrieved {result['retrieved']}")
    for b in result["bodies"]:
        print(f"  {b['name']}: {b['el']}")


if __name__ == "__main__":
    main()
