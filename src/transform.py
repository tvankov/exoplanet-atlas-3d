"""Clean the raw NASA snapshot, compute 3D positions and export for the web map.

Run from the project root:  python src/transform.py
Output: data/processed/stars.json and data/processed/exoplanets.sqlite
"""
import json
import sqlite3
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data" / "raw"
OUT_DIR = ROOT / "data" / "processed"

PC_TO_LY = 3.2616

# Anchor points (Kelvin -> RGB) for a rough blackbody look: red, orange, yellow, white, blue.
# Interpolating between a few anchors is enough for a map and avoids a physics dependency.
TEMP_ANCHORS = [2500, 3500, 5000, 6000, 7500, 10000, 30000]
RGB_ANCHORS = [
    (255, 110, 60),
    (255, 165, 90),
    (255, 220, 150),
    (255, 245, 230),
    (220, 230, 255),
    (170, 200, 255),
    (150, 180, 255),
]
# Stars without a temperature get a neutral sun-like colour, flagged so the UI can say so.
DEFAULT_TEFF = 5800

# Equilibrium temperature range (K) and maximum radius (Earth radii) for habitable candidates.
# 1.6 Earth radii is roughly where planets stop being mostly rocky.
HAB_TEMP_MIN, HAB_TEMP_MAX = 180, 310
HAB_RADIUS_MAX = 1.6


def latest_snapshot() -> Path:
    # File names carry the download date, so sorting by name finds the newest one.
    return sorted(RAW_DIR.glob("pscomppars_*.csv"))[-1]


def teff_to_hex(teff: pd.Series) -> pd.Series:
    rgb = [np.interp(teff, TEMP_ANCHORS, [c[i] for c in RGB_ANCHORS]) for i in range(3)]
    return pd.Series(
        [f"#{int(r):02x}{int(g):02x}{int(b):02x}" for r, g, b in zip(*rgb)],
        index=teff.index,
    )


def build_stars(planets: pd.DataFrame) -> pd.DataFrame:
    # In pscomppars the star columns repeat on every planet row of a system,
    # so taking the first row per hostname loses nothing.
    stars = planets.groupby("hostname", as_index=False).first()
    stars = stars[
        ["hostname", "ra", "dec", "sy_dist", "glon", "glat", "st_teff", "st_rad", "st_mass", "st_spectype"]
    ].copy()

    d = stars["sy_dist"] * PC_TO_LY
    ra, dec = np.radians(stars["ra"]), np.radians(stars["dec"])
    stars["dist_ly"] = d.round(2)
    stars["x"] = (d * np.cos(dec) * np.cos(ra)).round(2)
    stars["y"] = (d * np.cos(dec) * np.sin(ra)).round(2)
    stars["z"] = (d * np.sin(dec)).round(2)

    # Flags let the UI say "unknown" instead of presenting a default as a measured value.
    stars["rad_missing"] = stars["st_rad"].isna()
    stars["teff_missing"] = stars["st_teff"].isna()
    stars["color"] = teff_to_hex(stars["st_teff"].fillna(DEFAULT_TEFF))
    return stars


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    source = latest_snapshot()
    raw = pd.read_csv(source)

    # Without a distance there is no 3D position. These rows stay in SQLite but not on the map.
    no_distance = raw["sy_dist"].isna()
    planets = raw[~no_distance].copy()
    # Candidate rule: temperature where liquid water is possible and small enough to be rocky.
    # It says "could meet the conditions", not "is habitable". Missing values compare as False.
    planets["habitable"] = planets["pl_eqt"].between(HAB_TEMP_MIN, HAB_TEMP_MAX) & (planets["pl_rade"] <= HAB_RADIUS_MAX)
    print(f"{source.name}: {len(raw)} planets, {no_distance.sum()} without distance dropped from the map")

    stars = build_stars(planets)

    planet_cols = ["pl_name", "pl_rade", "pl_bmasse", "pl_orbper", "pl_eqt", "discoverymethod", "disc_year", "habitable"]
    by_star = {
        host: grp[planet_cols].astype(object).where(grp[planet_cols].notna(), None).to_dict("records")
        for host, grp in planets.groupby("hostname")
    }

    records = []
    for row in stars.astype(object).where(stars.notna(), None).to_dict("records"):
        row["planets"] = by_star[row["hostname"]]
        records.append(row)

    payload = json.dumps({"source": source.name, "stars": records}, separators=(",", ":"))
    (OUT_DIR / "stars.json").write_text(payload, encoding="utf-8")
    # GitHub Pages only serves the web/ folder, so the map needs its own copy of the data.
    web_data = ROOT / "web" / "data"
    web_data.mkdir(parents=True, exist_ok=True)
    (web_data / "stars.json").write_text(payload, encoding="utf-8")

    # Raw rows go to SQLite unfiltered, so no information is lost for later analysis.
    with sqlite3.connect(OUT_DIR / "exoplanets.sqlite") as con:
        raw.to_sql("pscomppars", con, if_exists="replace", index=False)

    print(f"{len(stars)} stars exported")


if __name__ == "__main__":
    main()
