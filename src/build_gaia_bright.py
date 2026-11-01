"""Make web/data/gaia_deep.bin, the deep Gaia layer of about a million bright stars, from the bright star download.

Run from the src folder, after src/fetch_gaia_bright.py:
    cd src && python build_gaia_bright.py

Input:  data/raw/gaia_bright_stars.csv      (ESA Gaia DR3, G < 11, not in Git)
        data/raw/gaia_near_stars.csv        (the near layer, to take its stars out, they are drawn there)
        data/raw/nasa_gaia_ids_*.csv        (the Gaia IDs of the NASA planet hosts, to take them out)
Output: web/data/gaia_deep.bin

Same layout as gaia_stars.bin: N * 3 float32 (x, y, z in light years, the axes of stars.json), then N * 4 uint8 (red, green,
blue, absolute magnitude scaled to 0..255). The magnitude range is wider here, bright giants reach M = -8: see MAG_MIN, MAG_MAX.

Credit that goes with these data: "This work has made use of data from the European Space Agency (ESA) mission Gaia, processed by
the Gaia Data Processing and Analysis Consortium (DPAC)". The data come under the ESA terms, CC BY-NC 3.0 IGO.
"""
from pathlib import Path

import numpy as np
import pandas as pd

from build_gaia import BP_RP, TEFF, host_ids
from transform import PC_TO_LY, RGB_ANCHORS, TEMP_ANCHORS

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "web" / "data" / "gaia_deep.bin"

MAG_MIN, MAG_MAX = -8.0, 12.0  # absolute magnitudes stored in one byte


def main() -> None:
    stars = pd.read_csv(RAW / "gaia_bright_stars.csv")
    total = len(stars)
    near = set(pd.read_csv(RAW / "gaia_near_stars.csv", usecols=["source_id"])["source_id"])
    taken = near | host_ids()
    stars = stars[~stars["source_id"].isin(taken)]
    print(f"{total} bright stars, {total - len(stars)} are in the near layer or are planet hosts, {len(stars)} left")
    stars = stars[stars["phot_g_mean_mag"].notna()]
    # Brightest first (by the G magnitude seen from here), so that the app can draw just the first N stars on a slow computer.
    stars = stars.sort_values("phot_g_mean_mag", kind="stable")

    parallax = stars["parallax"].to_numpy()
    d = 1000.0 / parallax * PC_TO_LY  # light years
    ra, dec = np.radians(stars["ra"].to_numpy()), np.radians(stars["dec"].to_numpy())
    xyz = np.column_stack([d * np.cos(dec) * np.cos(ra), d * np.cos(dec) * np.sin(ra), d * np.sin(dec)])

    bp_rp = stars["bp_rp"].to_numpy()
    teff = np.interp(np.where(np.isnan(bp_rp), 0.82, bp_rp), BP_RP, TEFF)
    gsp = stars["teff_gspphot"].to_numpy()
    has_gsp = ~np.isnan(gsp)
    teff = np.where(has_gsp, np.clip(gsp, TEMP_ANCHORS[0], TEMP_ANCHORS[-1]), teff)
    print(f"{has_gsp.sum()} stars use the Gaia temperature, the others the colour table")
    rgb = np.column_stack([np.interp(teff, TEMP_ANCHORS, [c[i] for c in RGB_ANCHORS]) for i in range(3)])

    # Far stars are dimmed by dust on the way: nothing is done about that, the absolute magnitude is only G and the distance.
    absmag = stars["phot_g_mean_mag"].to_numpy() + 5 * np.log10(parallax / 1000.0) + 5
    mag = np.clip((absmag - MAG_MIN) / (MAG_MAX - MAG_MIN), 0, 1) * 255
    attributes = np.column_stack([rgb, mag]).round().astype(np.uint8)

    with OUT.open("wb") as f:
        f.write(xyz.astype("<f4").tobytes())
        f.write(attributes.tobytes())
    print(f"{len(stars)} stars -> {OUT} ({OUT.stat().st_size // 1_000_000} MB), farthest {d.max():.0f} light years")


if __name__ == "__main__":
    main()
