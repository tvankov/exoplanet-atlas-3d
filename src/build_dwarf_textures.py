"""The surface maps of the dwarf planets Ceres and Pluto for the 3D view.

Source: the global mosaics of the USGS Astrogeology Science Center, the ready 1024 pixel versions, downloaded on 2026-11-16 into
data/raw/usgs_dwarfs/ with the permission of the owner of the project. Both product pages say "Use Constraints: Please cite authors":
- Pluto New Horizons LORRI - MVIC Global Mosaic 300m (grey). Authors: New Horizons Team; originators NASA, Johns Hopkins University
  Applied Physics Laboratory, Southwest Research Institute, Lunar and Planetary Institute. Longitude domain 0 to 360, positive east.
- Ceres Dawn FC Global Mosaic 140m (grey). Authors: NASA/JPL-Caltech/UCLA/MPS/DLR/IDA. Longitude domain -180 to 180, positive east.

Each map is made 1024 x 512 and turned so that longitude 0 is in the middle, as in the other maps. Checked on known features: on Pluto
the bright "heart" (Sputnik Planitia, about 175 E) lies near the middle of the raw map, so longitude 0 is its left edge; on Ceres the
bright spots of the crater Occator (about 239 E, that is -121) lie at about -120 in the raw map, so longitude 0 is already in the middle.

New Horizons flew past one side of Pluto in 2015, when much of the south lay in the dark: below about 30 to 40 degrees south the map is
black. On Ceres a thin strip at the south pole is black. Those strips are filled with the average colour of the map: that fill is not a
measurement, the info panel says so. Only the black that reaches the edge of the map counts as no data: Pluto's dark Cthulhu region,
inside the pictures, is nearly black too and stays as it is.

Run: python src/build_dwarf_textures.py
"""

from pathlib import Path

from PIL import Image, ImageFilter, ImageStat

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "usgs_dwarfs"
OUT = ROOT / "web" / "textures"
WIDTH, HEIGHT = 1024, 512
NO_DATA = 8  # a pixel this dark, connected to the top or bottom edge of its column, is no data

# raw file, output file, where longitude 0 lies in the raw map (0.5 the middle, 0.0 the left edge)
MAPS = [
    ("pluto_newhorizons_global_mosaic_300m_jul2017_1024.jpg", "pluto.jpg", 0.0),
    ("ceres_dawn_fc_dlr_global_feb2016_1024.jpg", "ceres.jpg", 0.5),
]


def turn(image: Image.Image, zero: float) -> Image.Image:
    """The map turned round its axis so that longitude 0 is in the middle."""
    shift = round((0.5 - zero) * WIDTH) % WIDTH
    if shift == 0:
        return image
    turned = Image.new("RGB", (WIDTH, HEIGHT))
    turned.paste(image.crop((WIDTH - shift, 0, WIDTH, HEIGHT)), (0, 0))
    turned.paste(image.crop((0, 0, WIDTH - shift, HEIGHT)), (shift, 0))
    return turned


def no_data_mask(image: Image.Image) -> Image.Image:
    """White where the map has no pictures: the dark run of each column that starts at its top or its bottom edge."""
    grey = image.convert("L").load()
    mask = Image.new("L", (WIDTH, HEIGHT), 0)
    m = mask.load()
    for x in range(WIDTH):
        y = 0
        while y < HEIGHT and grey[x, y] <= NO_DATA:
            m[x, y] = 255
            y += 1
        y = HEIGHT - 1
        while y >= 0 and grey[x, y] <= NO_DATA:
            m[x, y] = 255
            y -= 1
    return mask.filter(ImageFilter.MaxFilter(5))  # a little wider, so that the soft edge of the black goes too


def main() -> None:
    for raw, out, zero in MAPS:
        image = turn(Image.open(RAW / raw).convert("RGB").resize((WIDTH, HEIGHT), Image.LANCZOS), zero)
        mask = no_data_mask(image)
        measured = mask.point(lambda v: 0 if v else 255)
        colour = tuple(round(c) for c in ImageStat.Stat(image, mask=measured).mean)
        image.paste(Image.new("RGB", image.size, colour), mask=mask)
        share = sum(1 for v in mask.getdata() if v) / (WIDTH * HEIGHT)
        image.save(OUT / out, quality=88, optimize=True, progressive=True)
        print(f"{out}: {share:.1%} of the map filled with {colour}, {(OUT / out).stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
