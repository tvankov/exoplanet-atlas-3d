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


# The archive gives GJ 273 (Luyten's Star) a distance of 5.92 pc (19.3 ly), but its Gaia parallax puts it at 12.3 ly (the real value is
# about 12.4), and the Gaia layer of the map has the star there as a named star. For the hosts below the distance is taken from the
# Gaia entry of the named star (web/data/gaia_names.json, made by src/build_gaia.py), the direction stays the archive's. The change is flagged.
DISTANCE_FROM_GAIA_NAME = {"GJ 273": "Luyten's star"}


def build_stars(planets: pd.DataFrame) -> pd.DataFrame:
    # In pscomppars the star columns repeat on every planet row of a system,
    # so taking the first row per hostname loses nothing.
    stars = planets.groupby("hostname", as_index=False).first()
    stars = stars[
        ["hostname", "ra", "dec", "sy_dist", "glon", "glat", "st_teff", "st_rad", "st_mass", "st_spectype"]
    ].copy()

    stars["dist_from_gaia"] = False
    names_file = ROOT / "web" / "data" / "gaia_names.json"
    if names_file.exists():
        named = {n["name"]: n for n in json.loads(names_file.read_text(encoding="utf-8"))}
        for host, name in DISTANCE_FROM_GAIA_NAME.items():
            if host in set(stars["hostname"]) and name in named:
                n = named[name]
                gaia_pc = float(np.sqrt(n["x"] ** 2 + n["y"] ** 2 + n["z"] ** 2)) / PC_TO_LY
                row = stars["hostname"] == host
                print(f"{host}: distance {stars.loc[row, 'sy_dist'].iloc[0]:.2f} pc in the archive, {gaia_pc:.2f} pc from Gaia ({name}); the Gaia value is used")
                stars.loc[row, "sy_dist"] = gaia_pc
                stars.loc[row, "dist_from_gaia"] = True

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

    # The archive fills in a radius for planets that nobody has measured, worked out from the mass (marked
    # "Calculated Value" in its reference column). That file comes from src/fetch_nasa_extras.py. Such a
    # radius is an estimate, so the app says so.
    calculated = sorted(RAW_DIR.glob("nasa_radius_calculated_*.csv"))
    names = set(pd.read_csv(calculated[-1])["pl_name"]) if calculated else set()
    planets["radius_calculated"] = planets["pl_name"].isin(names) & planets["pl_rade"].notna()
    print(f"{planets['radius_calculated'].sum()} planets have a radius that is only calculated from the mass")

    # The telescope or observatory that found each planet, from the same extras (src/fetch_nasa_extras.py).
    facilities = sorted(RAW_DIR.glob("nasa_facility_*.csv"))
    if facilities:
        facility = pd.read_csv(facilities[-1]).drop_duplicates("pl_name").set_index("pl_name")["disc_facility"]
        planets["disc_facility"] = planets["pl_name"].map(facility)
    else:
        planets["disc_facility"] = None

    # The semi-major axis in AU (src/fetch_nasa_extras.py). The map needs it for the planets without an orbital period,
    # mostly directly imaged ones far from their star: with the axis and the star mass the period follows from Kepler's law.
    orbsmax = sorted(RAW_DIR.glob("nasa_orbsmax_*.csv"))
    if orbsmax:
        axis = pd.read_csv(orbsmax[-1]).drop_duplicates("pl_name").set_index("pl_name")["pl_orbsmax"]
        planets["pl_orbsmax"] = planets["pl_name"].map(axis)
    else:
        planets["pl_orbsmax"] = None

    planet_cols = ["pl_name", "pl_rade", "pl_bmasse", "pl_orbper", "pl_orbsmax", "pl_eqt", "discoverymethod", "disc_year", "disc_facility", "habitable", "radius_calculated"]
    by_star = {
        host: grp[planet_cols].astype(object).where(grp[planet_cols].notna(), None).to_dict("records")
        for host, grp in planets.groupby("hostname")
    }

    records = []
    for row in stars.astype(object).where(stars.notna(), None).to_dict("records"):
        row["planets"] = by_star[row["hostname"]]
        records.append(row)

    # The web map shows the same rule as a zone around the star, so the numbers travel with the data.
    rule = {"temp_min": HAB_TEMP_MIN, "temp_max": HAB_TEMP_MAX, "radius_max": HAB_RADIUS_MAX}
    payload = json.dumps({"source": source.name, "rule": rule, "stars": records}, separators=(",", ":"))
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
