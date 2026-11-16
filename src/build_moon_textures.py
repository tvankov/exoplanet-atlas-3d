"""The surface maps of the four large moons of Jupiter (Io, Europa, Ganymede, Callisto) for the 3D view.

Source: the global mosaics of the USGS Astrogeology Science Center ("USGS-authored or produced data and information are considered to be
in the U.S. Public Domain"; the product pages say "Use Constraints: None"), the ready 1024 pixel versions, downloaded on 2026-11-16 into
data/raw/usgs_moons/ with the permission of the owner of the project:
- Io Galileo SSI / Voyager Color Merged Global Mosaic 1km (colour)
- Europa Voyager - Galileo SSI Global Mosaic 500m (grey)
- Ganymede Voyager - Galileo SSI Global Mosaic 1km (grey)
- Callisto Galileo / Voyager Simple Cylindrical Global Map (grey, 1024 x 498, stretched to 512 rows)

Each map is made 1024 x 512 and turned so that longitude 0, the point that always faces Jupiter, is in the middle, as in the maps of the
Earth and the Moon. The four mosaics do not agree on that: on Io and Callisto longitude 0 is already in the middle, on Europa and Ganymede
it is at the edge. This was checked on known features (on Io the red ring of Pele at 255 W and the dark Loki at 310 W, on Europa the rays
of Pwyll at 271 W, on Ganymede the crater Tros at 27 W and the dark Galileo Regio at about 145 W, on Callisto the Valhalla basin at 56 W).
Where no spacecraft took pictures (black, mostly near the poles) the map is filled with its average colour: that fill is not a
measurement, the info panel of the moon says so.

Run: python src/build_moon_textures.py
"""

from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageStat

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "usgs_moons"
OUT = ROOT / "web" / "textures"
WIDTH, HEIGHT = 1024, 512
NO_DATA = 6  # a pixel this dark is no data: the darkest real ground on these maps is far brighter

# raw file, output file, where longitude 0 lies in the raw map (0.5 the middle, 0.0 the left edge)
MAPS = [
    ("io_galileo_ssi_voyager_color_merged_1km_1024.jpg", "io.jpg", 0.5),
    ("europa_voyager_galileo_ssi_500m_1024.jpg", "europa.jpg", 0.0),
    ("ganymede_voyager_galileo_ssi_1km_1024.jpg", "ganymede.jpg", 0.0),
    ("callisto_galileo_voyager_simple_cylindrical_1024.jpg", "callisto.jpg", 0.5),
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


def fill_gaps(image: Image.Image) -> tuple[Image.Image, float, tuple[int, int, int]]:
    """The parts without pictures filled with the average colour of the rest; returns the map, the share filled and the colour."""
    dark = image.convert("L").point(lambda v: 255 if v <= NO_DATA else 0)
    mask = dark.filter(ImageFilter.MaxFilter(5))  # a little wider, so that the soft edge of the black goes too
    measured = ImageChops.invert(mask)
    colour = tuple(round(c) for c in ImageStat.Stat(image, mask=measured).mean)
    filled = image.copy()
    filled.paste(Image.new("RGB", image.size, colour), mask=mask)
    share = sum(1 for v in mask.getdata() if v) / (WIDTH * HEIGHT)
    return filled, share, colour


def main() -> None:
    for raw, out, zero in MAPS:
        image = Image.open(RAW / raw).convert("RGB").resize((WIDTH, HEIGHT), Image.LANCZOS)
        image, share, colour = fill_gaps(turn(image, zero))
        image.save(OUT / out, quality=88, optimize=True, progressive=True)
        print(f"{out}: {share:.1%} of the map filled with {colour}, {(OUT / out).stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
