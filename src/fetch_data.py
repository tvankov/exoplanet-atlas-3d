"""Download the confirmed exoplanet table from the NASA Exoplanet Archive.

Run from the project root:  python src/fetch_data.py
"""
from datetime import date
from pathlib import Path

import requests

TAP_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"

# Only the columns the map needs. A narrow query keeps the download small
# and makes it obvious which fields the rest of the pipeline depends on.
COLUMNS = [
    "pl_name", "hostname", "ra", "dec", "sy_dist", "glon", "glat",
    "st_teff", "st_rad", "st_mass", "st_spectype",
    "pl_rade", "pl_bmasse", "pl_orbper", "pl_eqt",
    "discoverymethod", "disc_year",
]
QUERY = f"select {','.join(COLUMNS)} from pscomppars"

RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"


def fetch_csv() -> bytes:
    # The archive updates weekly, so a failed call is worth a clear error
    # instead of silently writing an empty or half-finished file.
    response = requests.get(
        TAP_URL, params={"query": QUERY, "format": "csv"}, timeout=60
    )
    response.raise_for_status()
    return response.content


def main() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    # The date is part of the file name so older snapshots are never
    # overwritten. The NASA data changes, and this keeps runs reproducible.
    target = RAW_DIR / f"pscomppars_{date.today().isoformat()}.csv"
    target.write_bytes(fetch_csv())
    print(f"Saved {target}")


if __name__ == "__main__":
    main()
