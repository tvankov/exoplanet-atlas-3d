"""Download the stars near the Sun from the ESA Gaia archive (Gaia DR3) as a local CSV.

Run from the project root:
    python src/fetch_gaia.py

The file goes to data/raw/ and stays out of Git (see .gitignore): Gaia data come under the
ESA terms (CC BY-NC 3.0 IGO) and credit "ESA/Gaia/DPAC" is required, see the README.

The archive answers a synchronous query with at most 50,000 rows and kills a long one after a
minute, so the sky is read in slices of parallax. A slice that hits the cap is cut in half.
"""
import csv
import io
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
URL = "https://gea.esac.esa.int/tap-server/tap/sync"
CAP = 50_000
# teff_gspphot is the temperature that Gaia's own spectrophotometry pipeline (GSP-Phot) gives, it exists for
# part of the stars and makes better colours than a guess from the colour index alone.
COLUMNS = ["source_id", "ra", "dec", "parallax", "phot_g_mean_mag", "bp_rp", "teff_gspphot"]
# Parallax above 10 mas means closer than 100 parsecs (326 light years), a measurement good to 10 %.
MIN_PARALLAX = 10.0
MAX_PARALLAX = 800.0  # the nearest star, Proxima Centauri, is at about 768 mas
# RUWE is Gaia's quality number for the astrometric fit, 1.4 is the limit Gaia itself recommends. Without it,
# crowded fields towards the centre of the Milky Way gave a cloud of far away stars with false parallaxes.
MAX_RUWE = 1.4
# A parallax must be at least 20 times its own error, which means a distance good to 5 %. With 10 times
# there was still about three times too many stars towards the Milky Way centre (15,277 where a quiet sky
# gives about 4,100 in the same patch), with 20 times it is 4,272, and 7 % fewer stars in total.
MIN_PARALLAX_OVER_ERROR = 20


def query(lo: float, hi: float) -> list[list[str]]:
    adql = (
        f"SELECT {', '.join(COLUMNS)} FROM gaiadr3.gaia_source "
        f"WHERE parallax >= {lo} AND parallax < {hi} AND parallax_over_error > {MIN_PARALLAX_OVER_ERROR} AND ruwe < {MAX_RUWE}"
    )
    data = urllib.parse.urlencode({"REQUEST": "doQuery", "LANG": "ADQL", "FORMAT": "csv", "QUERY": adql}).encode()
    with urllib.request.urlopen(urllib.request.Request(URL, data=data), timeout=120) as response:
        rows = list(csv.reader(io.StringIO(response.read().decode("utf-8"))))
    return rows[1:]  # without the header


def slice_rows(lo: float, hi: float) -> list[list[str]]:
    rows = query(lo, hi)
    if len(rows) < CAP or hi - lo < 1e-3:
        print(f"parallax {lo:8.3f} to {hi:8.3f}: {len(rows):6d} stars", flush=True)
        return rows
    mid = (lo + hi) / 2
    return slice_rows(lo, mid) + slice_rows(mid, hi)


def main() -> None:
    rows: list[list[str]] = []
    lo = MIN_PARALLAX
    step = 2.0
    while lo < MAX_PARALLAX:
        hi = min(lo + step, MAX_PARALLAX)
        rows += slice_rows(lo, hi)
        lo = hi
        step = min(step * 1.5, 100.0)  # the stars thin out quickly towards higher parallax
    ids = {r[0] for r in rows}
    target = ROOT / "data" / "raw" / "gaia_near_stars.csv"
    with target.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(COLUMNS)
        writer.writerows(rows)
    print(f"{len(rows)} rows, {len(ids)} different stars, {target.stat().st_size // 1024} KB -> {target}")


if __name__ == "__main__":
    main()
