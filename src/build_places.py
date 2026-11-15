"""Builds web/data/places.json, the places for the ascendant ("the sky at your birth", web/birthsky.js), from the GeoNames file cities15000.zip.

Kept: every place with at least 100,000 inhabitants, and every capital. For each: the name (as GeoNames writes it, often in the language of the
country, for example "München"), the name in plain letters, the country code, latitude and longitude (4 decimals, about 10 metres), and the time
zone (an IANA name such as "Europe/Berlin", which the browser uses to turn a local hour of birth, with the summer time and the history of that
zone, into world time). Sorted by population, so that the search shows the bigger places first.

Source: GeoNames, https://www.geonames.org, licence Creative Commons Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/). The raw
file stays local (data/raw/geonames/, see .gitignore).

    python src/build_places.py data/raw/geonames/cities15000.zip
"""

import io
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "data" / "places.json"
MIN_POPULATION = 100_000


def main() -> None:
    source = Path(sys.argv[1])
    with zipfile.ZipFile(source) as z, z.open("cities15000.txt") as raw:
        rows = []
        for line in io.TextIOWrapper(raw, encoding="utf-8"):
            f = line.rstrip("\n").split("\t")
            if len(f) < 18:
                continue
            population = int(f[14] or 0)
            capital = f[7] == "PPLC"
            if population < MIN_POPULATION and not capital:
                continue
            name, ascii_name, country, tz = f[1], f[2], f[8], f[17]
            if not tz or not name:
                continue
            lat, lon = round(float(f[4]), 4), round(float(f[5]), 4)
            rows.append((population, [name, ascii_name if ascii_name != name else "", country, lat, lon, tz]))
    rows.sort(key=lambda r: -r[0])
    places = [r[1] for r in rows]
    data = {
        "source": "GeoNames (https://www.geonames.org), CC BY 4.0, cities15000, places with at least 100,000 inhabitants and capitals",
        "fields": ["name", "ascii name (empty if the same)", "country code", "latitude", "longitude", "time zone"],
        "places": places,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(places)} places, {OUT.stat().st_size / 1024:.0f} KB -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
