"""Turn the Gaia CSV into the small binary file the map reads, without the stars we already have.

Run from the project root, after src/fetch_gaia.py and src/transform.py:
    python src/build_gaia.py

Input:  data/raw/gaia_near_stars.csv      (ESA Gaia DR3, not in Git)
        data/raw/nasa_gaia_ids_*.csv      (NASA Exoplanet Archive, the Gaia ID of every planet host)
Output: web/data/gaia_stars.bin

The stars of our own list (the hosts of the NASA planets) are taken out by their Gaia source ID, so a
host is never drawn twice. The map shows them with their glow, the Gaia layer shows the others.

File layout, N stars: N * 3 float32 (x, y, z in light years, same axes as stars.json), then N * 4 uint8
(red, green, blue, absolute magnitude scaled to 0..255, see MAG_MIN and MAG_MAX).

Credit that has to go with these data: "This work has made use of data from the European Space Agency
(ESA) mission Gaia, processed by the Gaia Data Processing and Analysis Consortium (DPAC)." The data come
under the ESA terms, CC BY-NC 3.0 IGO.
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd

from transform import PC_TO_LY, RGB_ANCHORS, TEMP_ANCHORS

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "web" / "data" / "gaia_stars.bin"

# Rough colour index to temperature for ordinary stars, used where Gaia gives no temperature of its own
# (teff_gspphot). The values are typical ones for main sequence stars and are approximate: giants and
# white dwarfs of the same colour have other temperatures.
BP_RP = [-0.3, 0.0, 0.5, 0.82, 1.2, 1.7, 2.2, 3.0, 4.0]
TEFF = [20000, 9700, 7000, 5800, 4900, 4200, 3700, 3200, 2800]

# Absolute magnitude range stored in one byte. Brighter than the first and fainter than the second are clipped.
MAG_MIN, MAG_MAX = -2.0, 18.0


def host_ids() -> set[int]:
    table = pd.read_csv(sorted(RAW.glob("nasa_gaia_ids_*.csv"))[-1])
    ids = table["gaia_dr3_id"].dropna().str.extract(r"(\d+)$")[0].dropna().astype("int64")
    return set(ids)


def write_names(stars: pd.DataFrame) -> None:
    """Labels for the stars of the layer that have a proper name, from data/raw/simbad_star_names.csv (SIMBAD).

    A name counts as proper when it has no digits and no star in it: "Barnard's star" yes, "GR* 112A" and
    "DENIS 1058-1548" no. When a star has several names the longest one is taken ("Proxima Centauri").
    """
    names = pd.read_csv(sorted(RAW.glob("simbad_star_names*.csv"))[-1])
    names["source_id"] = names["gaia"].str.extract(r"(\d+)$")[0].astype("int64")
    names["label"] = names["name"].str.replace(r"^NAME\s+", "", regex=True)
    names = names[~names["label"].str.contains(r"\d|\*|\bTO Star")]
    # Names that are really a component letter of a known double star are no help on a map.
    names = names[~names["label"].str.contains(r"\s[A-Z]$")]
    names = names.sort_values("label", key=lambda s: s.str.len(), ascending=False).drop_duplicates("source_id")
    named = names.merge(stars, on="source_id")
    labels = [
        {"name": r.label, "x": round(r.x, 2), "y": round(r.y, 2), "z": round(r.z, 2)} for r in named.itertuples()
    ]
    target = ROOT / "web" / "data" / "gaia_names.json"
    target.write_text(json.dumps(labels, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(labels)} stars with a proper name -> {target}: {', '.join(sorted(l['name'] for l in labels))}")


def main() -> None:
    gaia = pd.read_csv(RAW / "gaia_near_stars.csv")
    total = len(gaia)
    hosts = host_ids()
    gaia = gaia[~gaia["source_id"].isin(hosts)]
    print(f"{total} Gaia stars, {total - len(gaia)} of them are hosts we already have, {len(gaia)} left")
    no_mag = gaia["phot_g_mean_mag"].isna()
    gaia = gaia[~no_mag]  # without a brightness a dot cannot be drawn
    print(f"{no_mag.sum()} stars have no brightness and are left out")

    d = 1000.0 / gaia["parallax"].to_numpy() * PC_TO_LY  # light years
    ra, dec = np.radians(gaia["ra"].to_numpy()), np.radians(gaia["dec"].to_numpy())
    xyz = np.column_stack([d * np.cos(dec) * np.cos(ra), d * np.cos(dec) * np.sin(ra), d * np.sin(dec)])

    bp_rp = gaia["bp_rp"].to_numpy()
    missing = np.isnan(bp_rp)
    teff = np.interp(np.where(missing, 0.82, bp_rp), BP_RP, TEFF)  # no colour: sun-like, flagged below
    # Gaia's own temperature (GSP-Phot) where it exists, it knows giants from dwarfs, the colour table does not.
    gsp = gaia["teff_gspphot"].to_numpy()
    has_gsp = ~np.isnan(gsp)
    teff = np.where(has_gsp, np.clip(gsp, TEMP_ANCHORS[0], TEMP_ANCHORS[-1]), teff)
    print(f"{has_gsp.sum()} stars use the Gaia temperature, {(~has_gsp).sum()} use the colour table")
    rgb = np.column_stack([np.interp(teff, TEMP_ANCHORS, [c[i] for c in RGB_ANCHORS]) for i in range(3)])
    print(f"{(missing & ~has_gsp).sum()} stars have neither a temperature nor a colour and get a sun-like one")

    # Absolute magnitude from the apparent one and the distance, M = G + 5 * log10(parallax in arcsec) + 5.
    absmag = gaia["phot_g_mean_mag"].to_numpy() + 5 * np.log10(gaia["parallax"].to_numpy() / 1000.0) + 5
    mag = np.clip((absmag - MAG_MIN) / (MAG_MAX - MAG_MIN), 0, 1) * 255

    write_names(gaia.assign(x=xyz[:, 0], y=xyz[:, 1], z=xyz[:, 2]))

    attributes = np.column_stack([rgb, mag]).round().astype(np.uint8)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("wb") as f:
        f.write(xyz.astype("<f4").tobytes())
        f.write(attributes.tobytes())
    print(f"{len(gaia)} stars -> {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
