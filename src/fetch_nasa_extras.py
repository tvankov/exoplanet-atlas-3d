"""Download two small extra tables from the NASA Exoplanet Archive, then run src/transform.py again.

Run from the project root:
    python src/fetch_nasa_extras.py

1. nasa_radius_calculated_<date>.csv: the planets whose radius is only a calculated value. The archive fills in a
   radius for planets that nobody has measured, worked out from the mass; its reference column then says
   "Calculated Value". The app says so for these planets.
2. nasa_facility_<date>.csv: the telescope or observatory that discovered each planet (column disc_facility).
3. nasa_orbsmax_<date>.csv: the semi-major axis (pl_orbsmax, AU) of the planets that have one.

Name one or more tables as arguments to fetch only those, for example: python src/fetch_nasa_extras.py nasa_orbsmax
"""
import datetime as dt
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
QUERIES = {
    "nasa_radius_calculated": "select pl_name,pl_rade,pl_bmasse,pl_rade_reflink from pscomppars where pl_rade_reflink like '%Calculated%'",
    "nasa_facility": "select pl_name,disc_facility from pscomppars",
    # The semi-major axis in AU, used for planets without an orbital period (mostly directly imaged ones far from their star).
    "nasa_orbsmax": "select pl_name,pl_orbsmax,pl_orbsmaxerr1,pl_orbsmaxerr2 from pscomppars where pl_orbsmax is not null",
}


def main() -> None:
    for name, query in QUERIES.items():
        if len(sys.argv) > 1 and name not in sys.argv[1:]:
            continue
        target = ROOT / "data" / "raw" / f"{name}_{dt.date.today().isoformat()}.csv"
        with urllib.request.urlopen(URL + "?" + urllib.parse.urlencode({"query": query, "format": "csv"}), timeout=120) as r:
            target.write_bytes(r.read())
        print(f"{len(target.read_text(encoding='utf-8').splitlines()) - 1} rows -> {target}")


if __name__ == "__main__":
    main()
