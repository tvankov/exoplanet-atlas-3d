"""Download the bright Gaia stars (G < 11) with a good distance, in slices that can be resumed.

Run from the project root, it can be stopped and started again at any time:
    python src/fetch_gaia_bright.py

Every finished slice of parallax is written to data/raw/gaia_bright/ at once, a new start skips the slices that exist.
When all slices are there, they are joined into data/raw/gaia_bright_stars.csv (not in Git, Gaia data come under the ESA
terms, CC BY-NC 3.0 IGO, credit ESA/Gaia/DPAC).

Selection: G < 11, parallax over error above 5 (a distance good to 20 %), RUWE below 1.4 (Gaia's own quality limit), parallax
above 0.2 mas (closer than 5 kpc, about 16,000 light years). A synchronous query gives at most 50,000 rows, a slice that hits
that cap, or that takes too long, is cut in half.
"""
import csv
import io
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SLICES = ROOT / "data" / "raw" / "gaia_bright"
OUT = ROOT / "data" / "raw" / "gaia_bright_stars.csv"
URL = "https://gea.esac.esa.int/tap-server/tap/sync"
CAP = 50_000
COLUMNS = ["source_id", "ra", "dec", "parallax", "phot_g_mean_mag", "bp_rp", "teff_gspphot"]
MIN_PARALLAX = 0.2
MAX_PARALLAX = 800.0
MAX_G = 11


def query(lo: float, hi: float) -> list[list[str]]:
    adql = (
        f"SELECT {', '.join(COLUMNS)} FROM gaiadr3.gaia_source "
        f"WHERE parallax >= {lo} AND parallax < {hi} AND phot_g_mean_mag < {MAX_G} "
        f"AND parallax_over_error > 5 AND ruwe < 1.4"
    )
    data = urllib.parse.urlencode({"REQUEST": "doQuery", "LANG": "ADQL", "FORMAT": "csv", "QUERY": adql}).encode()
    with urllib.request.urlopen(urllib.request.Request(URL, data=data), timeout=170) as response:
        rows = list(csv.reader(io.StringIO(response.read().decode("utf-8"))))
    return rows[1:]


def do_slice(lo: float, hi: float) -> None:
    target = SLICES / f"slice_{lo:012.5f}_{hi:012.5f}.csv"
    if target.exists():
        return
    try:
        rows = query(lo, hi)
    except Exception as error:  # too long, or a hiccup of the network: try smaller pieces, then give up on this one
        if hi - lo < 1e-4:
            print(f"parallax {lo:.5f} to {hi:.5f}: failed ({error}), left out", flush=True)
            return
        print(f"parallax {lo:.5f} to {hi:.5f}: {error}, cut in half", flush=True)
        mid = (lo + hi) / 2
        do_slice(lo, mid)
        do_slice(mid, hi)
        return
    if len(rows) >= CAP and hi - lo > 1e-4:
        mid = (lo + hi) / 2
        do_slice(lo, mid)
        do_slice(mid, hi)
        return
    with target.open("w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(rows)
    print(f"parallax {lo:9.4f} to {hi:9.4f}: {len(rows):6d} stars", flush=True)


def main() -> None:
    SLICES.mkdir(parents=True, exist_ok=True)
    lo = MIN_PARALLAX
    step = 0.05
    while lo < MAX_PARALLAX:
        hi = min(lo + step, MAX_PARALLAX)
        do_slice(lo, hi)
        lo = hi
        step = min(step * 1.3, 60.0)  # the stars thin out quickly towards high parallax
    rows = []
    for part in sorted(SLICES.glob("slice_*.csv")):
        with part.open(encoding="utf-8") as f:
            rows += list(csv.reader(f))
    with OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(COLUMNS)
        writer.writerows(rows)
    print(f"{len(rows)} stars -> {OUT} ({OUT.stat().st_size // 1_000_000} MB)")


if __name__ == "__main__":
    main()
