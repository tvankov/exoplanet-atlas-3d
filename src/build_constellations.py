"""Builds web/data/constellations.json from the two files of d3-celestial (BSD-3, Olaf Frohn):
data/raw/constellations/constellations.json (names and the place of the label) and constellations.lines.json (the lines).
Both are GeoJSON at J2000; the longitude is the right ascension in degrees (-180 to 180), the latitude the declination.

Output, one entry per constellation (89: Serpens is in two parts):
  id (IAU abbreviation), la (Latin name), en, de, ja, rank (1 is the most important), zodiac (true for the 12 of the zodiac),
  label [lon, lat], lines [[[lon, lat], ...], ...] (rounded to 2 decimals).
The 12 constellations of the zodiac are the ones that the ecliptic runs through and that carry a sign; Ophiuchus is left out as usual.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "constellations"
OUT = ROOT / "web" / "data" / "constellations.json"

ZODIAC = {"Ari", "Tau", "Gem", "Cnc", "Leo", "Vir", "Lib", "Sco", "Sgr", "Cap", "Aqr", "Psc"}

names = json.loads((RAW / "constellations.json").read_text(encoding="utf-8"))["features"]
lines = {f["id"]: f["geometry"]["coordinates"] for f in json.loads((RAW / "constellations.lines.json").read_text(encoding="utf-8"))["features"]}

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
            "lines": [[[round(lon, 2), round(lat, 2)] for lon, lat in line] for line in lines[cid]],
        }
    )

OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(out), "constellations,", sum(1 for c in out if c["zodiac"]), "of the zodiac,", OUT.stat().st_size, "bytes")
print("rank counts:", {r: sum(1 for c in out if c["rank"] == r) for r in sorted({c["rank"] for c in out})})
