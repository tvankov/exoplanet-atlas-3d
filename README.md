# Exoplanet Atlas 3D

Interactive 3D map of all confirmed exoplanets and their host stars, placed at their real positions relative to the Sun.
Includes a menu of habitable candidates, system views for the Solar System and exoplanet systems, and a short factual story
for each candidate in English and German, with audio.

## How it works

1. `src/fetch_data.py` downloads the NASA `pscomppars` table as a dated CSV.
2. `src/transform.py` cleans it, computes x, y, z in light years (Sun at the origin), star colours and the habitable flag,
   and exports `data/processed/stars.json` (copied to `web/data/`) plus a SQLite file.
3. `web/` is the Three.js map (no build step).
4. `src/export_stories.mjs` and `src/make_audio.py` build the audio clips in `web/audio/` from the same texts the app shows.

Habitable candidate rule: equilibrium temperature 180 to 310 K and radius up to 1.6 Earth radii. This only says a planet
could meet the conditions for liquid water, not that it is habitable. In the system views the same rule is drawn as a green
"candidate zone": the distances where the equilibrium temperature would be 180 to 310 K, assuming an Earth like albedo of 0.3.
It is a simple estimate and differs from the classic habitable zone, for the Sun it also covers Venus and Mars.

## Usage

```bash
python src/fetch_data.py
python src/transform.py
python -m http.server 8000 --directory web
```

## Audio

Voices are made with [Piper](https://github.com/OHF-Voice/piper1-gpl). Only voices trained from scratch on freely licensed
data are used: `en_US-ljspeech-high` (LJ Speech, public domain) and `de_DE-mls-medium` (Multilingual LibriSpeech, CC BY 4.0).

```bash
node src/export_stories.mjs
python src/make_audio.py --voices <folder with the .onnx files> --de-speaker 2
```

## Credits

- Data: This research has made use of the NASA Exoplanet Archive, which is operated by the California Institute of
  Technology, under contract with the National Aeronautics and Space Administration under the Exoplanet Exploration Program.
  This project is not affiliated with or endorsed by NASA. The archive asks to cite Christiansen et al. (2025),
  Planetary Science Journal. The individual parameters in the table come from published literature, see the references
  on the archive's planet pages.
- Earth maps, all from the NASA Earth Observatory "Blue Marble" set, 2048 x 1024:
  `web/textures/earth.jpg` (Land Surface, Shallow Water, and Shaded Topography), `earth_day.jpg` (Land Surface, Ocean Color,
  and Sea Ice), `earth_clouds.jpg` (Clouds) and `earth_lights.jpg` (night lights). NASA says its imagery, including texture
  maps, is generally not subject to copyright and may be used if NASA is acknowledged as the source and no endorsement is
  implied. The mountain relief is an approximation made from the shaded topography map, not a height map. Exoplanets have no
  such pictures, their looks are invented and labelled as such.
- Moon texture: NASA Scientific Visualization Studio, "CGI Moon Kit" by Ernie Wright, built from Lunar Reconnaissance
  Orbiter data (`web/textures/moon.jpg`, `lroc_color_2k.jpg`). Same NASA terms as the Earth texture: acknowledge NASA as the
  source, imply no endorsement. The Moon's distance from Earth is not to scale (see the code comment).
- Jupiter map: Cassini's global colour map (PIA07782, NASA/JPL/Space Science Institute, 3601 x 1801), taken in December
  2000. The clouds of a gas giant change, so it shows Jupiter as it looked then (`web/textures/jupiter.jpg`).
  Jupiter is drawn flattened at the poles by the real 6.5 % (polar radius 0.935 of the equatorial one), its edge is darkened
  and glows to suggest the thick atmosphere. The map itself does not move.
- Mars map: Viking Orbiter global colour mosaic at 925 m per pixel, NASA/JPL/USGS Astrogeology Science Center, access
  constraint "public domain". The original is 23,059 x 11,530 pixels (798 MB), it was shrunk to 4096 x 2048 by averaging
  (`web/textures/mars.jpg`). The green layer of the mosaic was made up from the red and violet pictures, so the colours are
  close to natural and not exact. Like Mercury, its relief shading is a bump map made from the brightness of the map, an
  approximation and not measured topography.
- Mercury map: MESSENGER MDIS 3-colour global mosaic (MD3, 665 m per pixel), NASA/Johns Hopkins University Applied Physics
  Laboratory/Carnegie Institution of Washington, distributed by the USGS Astrogeology Science Center. The USGS asks to cite the
  authors, see Denevi, B.W. et al., "Final calibration and multispectral map products from the Mercury Dual Imaging System
  Wide-Angle Camera on MESSENGER", Lunar and Planetary Science 47, abstract 1264. The colours are enhanced: the 1000, 750 and
  430 nm filters are put on red, green and blue, so they show differences in the rock and are not what the eye would see. The
  original (23,040 x 11,520, 797 MB) was shrunk to 4096 x 2048. The mosaic has no data near the poles (about 5 % of the map), that
  part is filled with the average grey of the map, which is invented and not a measurement (`web/textures/mercury.jpg`).
  The relief shading uses the brightness of this map as a height guess (bump map), so it is an approximation and not
  measured topography.
- Venus, Saturn, Uranus and Neptune have no map file. They are painted by the program in the colours and bands that
  telescopes and probes show, the fine pattern is invented (`SOLAR_LOOK_FRAGMENT` in `web/main.js`), and the panel says so.
  No usable global map was found: Venus is hidden by clouds and radar maps do not show what the eye would see, and the clouds
  of the gas giants change all the time.
- Saturn is drawn flattened by the real 9.8 % (polar radius 0.902 of the equatorial one, rounded in `PLANETS`). Its colours and
  band pattern follow the Cassini pictures in a loose way, the exact bands are invented.
- Uranus and Neptune are drawn slightly flattened (polar radius 0.977 and 0.983 of the equatorial one, rounded). Neptune's
  colours, dark oval and bright streaks follow the Voyager 2 pictures in a loose way, the exact pattern is invented. The
  oval sits where the close-up camera looks, because the planets do not spin.
- The eight planets spin with their real rotation periods (hours, from the NASA Planetary Fact Sheet at nssdc.gsfc.nasa.gov,
  as printed there; Earth and Mars from their own sheets). Venus and Uranus turn the other way. The speed follows the time
  slider. The tilt of the axes is not applied yet, every planet spins about its own vertical axis (Saturn's tilt with its
  rings aside), and the Moon does not turn with its orbit yet. Exoplanets do not spin, their rotation is unknown.
- Neptune has its faint rings: Galle, Le Verrier, Lassell, Arago and Adams, radii from the NASA NSSDC Neptunian Rings Fact
  Sheet and the PDS Rings Node, divided by 24,764 km. The narrow ones are drawn wider than they are. The bright arcs of the
  Adams ring are not drawn, it is shown as an even ring. The tilt is the display tilt of Saturn's rings again.
- Uranus has its ten narrow rings. Radii: NASA PDS Rings Node, "Vital Statistics for Uranus's Rings" (Showalter and
  Lissauer 2006), ring 6 from arXiv 1307.3230, divided by the equatorial radius of 25,559 km. The real rings are a few
  kilometres wide, so the lines are drawn about 100 times wider to be visible. The ring tilt is the same display tilt as
  Saturn's; the real axis of Uranus is tipped by 98 degrees, which would show the rings edge on.
- Saturn's rings use the known ring boundaries; the fine streaks inside them are schematic.
- 3D: [three.js](https://threejs.org/) r160 (MIT), served from `web/vendor/three/` with its licence file, so no
  visitor data goes to a CDN.
- Voices: Piper, trained on LJ Speech (public domain) and Multilingual LibriSpeech, Pratap et al.,
  licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The German audio was synthesized with a
  voice model trained on that dataset, the clips are new recordings made by the model.
