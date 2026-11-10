"""Builds web/data/constellations.json (version 2) from
  data/raw/constellations/*.json      d3-celestial (BSD-3, Olaf Frohn): names, label places and the lines as sky coordinates,
  data/raw/hipparcos/hip2_hpmag_lt_6.5.csv   Hipparcos new reduction (van Leeuwen 2007) by the ESA Gaia archive, stars brighter than 6.5 mag,
  web/data/stars.json                 the NASA Exoplanet Archive hosts of the map (to mark the stars of the figures that have planets).

Every end of a line is matched to the Hipparcos star that is nearest to it (749 of the 750 ends are within 0.05 degrees), so the figures can
be drawn between the real stars at their real distances. A star has: right ascension and declination of J2000 (the Hipparcos position of
epoch 1991.25 moved by its proper motion), the distance in light years from the parallax (a parallax below 0.3 mas is treated as 0.3, the
distance is then a lower limit of about 10,900 light years at most), the magnitude, and, if a host star of the NASA table is within 0.03
degrees and at a distance that agrees within 30 per cent, its name and the number of its planets.
The one end without a Hipparcos star keeps its sky position and has no distance (it is drawn on the sky sphere only).

Output: { "stars": { "<id>": [ra, dec, distance_ly or null, magnitude, host name or null, number of planets] },
          "constellations": [ { id, la, en, de, ja, rank, zodiac, label [lon, lat], lines [[id, ...], ...] } ] }
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.spatial import cKDTree

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "web" / "data" / "constellations.json"
LY_PER_PC = 3.26156
EPOCH_SHIFT = 2000.0 - 1991.25  # years from the Hipparcos epoch to J2000

ZODIAC = {"Ari", "Tau", "Gem", "Cnc", "Leo", "Vir", "Lib", "Sco", "Sgr", "Cap", "Aqr", "Psc"}


def vec(ra, dec):
    ra, dec = np.radians(ra), np.radians(dec)
    return np.c_[np.cos(dec) * np.cos(ra), np.cos(dec) * np.sin(ra), np.sin(dec)]


def chord(deg):
    return 2 * np.sin(np.radians(deg) / 2)


hip = pd.read_csv(RAW / "hipparcos" / "hip2_hpmag_lt_6.5.csv")
hip["ra2"] = (hip.ra + hip.pm_ra * EPOCH_SHIFT / 3.6e6 / np.cos(np.radians(hip.dec))) % 360
hip["dec2"] = hip.dec + hip.pm_de * EPOCH_SHIFT / 3.6e6
hip_tree = cKDTree(vec(hip.ra2.values, hip.dec2.values))

hosts = json.loads((ROOT / "web" / "data" / "stars.json").read_text(encoding="utf-8"))["stars"]
host_tree = cKDTree(vec(np.array([h["ra"] for h in hosts]), np.array([h["dec"] for h in hosts])))

names = json.loads((RAW / "constellations" / "constellations.json").read_text(encoding="utf-8"))["features"]
lines = {f["id"]: f["geometry"]["coordinates"] for f in json.loads((RAW / "constellations" / "constellations.lines.json").read_text(encoding="utf-8"))["features"]}

stars = {}
unmatched = 0


def star_id(lon, lat):
    """The id of the star at the end of a line: the Hipparcos number, or "x<n>" for an end without a star."""
    global unmatched
    ra = lon % 360
    dist, i = hip_tree.query(vec(np.array([ra]), np.array([lat]))[0], distance_upper_bound=chord(0.3))
    if i >= len(hip):
        unmatched += 1
        key = f"x{unmatched}"
        stars[key] = [round(ra, 3), round(lat, 3), None, None, None, 0]
        return key
    row = hip.iloc[i]
    key = str(int(row.hip))
    if key not in stars:
        plx = max(float(row.plx), 0.3)
        dist_ly = LY_PER_PC * 1000 / plx
        host_name, n_planets = None, 0
        q = vec(np.array([row.ra2]), np.array([row.dec2]))[0]
        for j in host_tree.query_ball_point(q, chord(0.03)):
            h = hosts[j]
            if abs(h["dist_ly"] - dist_ly) / dist_ly < 0.3:
                host_name, n_planets = h["hostname"].replace(" ", " "), len(h["planets"])
                break
        stars[key] = [round(float(row.ra2), 4), round(float(row.dec2), 4), round(dist_ly, 1), round(float(row.hp_mag), 2), host_name, n_planets]
    return key


out = []
for f in names:
    p = f["properties"]
    cid = f["id"]
    out.append(
        {
            "id": cid,
            "la": p["la"],
            "en": p["en"],
            "de": p["de"],
            "ja": p["ja"],
            "rank": int(p["rank"]),
            "zodiac": cid in ZODIAC,
            "label": [round(c, 2) for c in f["geometry"]["coordinates"]],
            "lines": [[star_id(lon, lat) for lon, lat in line] for line in lines[cid]],
        }
    )

OUT.write_text(json.dumps({"stars": stars, "constellations": out}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
with_planets = [(k, v) for k, v in stars.items() if v[5]]
print(len(stars), "stars,", len(out), "constellations,", unmatched, "ends without a star,", OUT.stat().st_size, "bytes")
print(len(with_planets), "stars of the figures with known planets:")
print("; ".join(f"{v[4]} ({v[2]:.0f} ly, {v[5]} pl.)" for k, v in sorted(with_planets, key=lambda kv: kv[1][2])))
