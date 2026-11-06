# Space Explorer

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

Controls: drag with the mouse to rotate, scroll to zoom, right drag to pan. Keyboard: W and S fly forward and back, A and D sideways,
Q and E down and up, the arrow keys look around, Shift is four times faster. The speed follows the distance between camera and target,
so it is slow near a planet and fast on the overview; a close-up that follows a planet ends when you fly.

## Audio

Voices are made with [Piper](https://github.com/OHF-Voice/piper1-gpl). Only voices trained from scratch on freely licensed
data are used: `en_US-ljspeech-high` (LJ Speech, public domain) and `de_DE-mls-medium` (Multilingual LibriSpeech, CC BY 4.0).

```bash
node src/export_stories.mjs
python src/make_audio.py --voices <folder with the .onnx files> --de-speaker 2
```

## Real orbits: planets, comets, interstellar objects, spacecraft

All of it comes from JPL (NASA), https://ssd.jpl.nasa.gov, credit "JPL/Caltech/NASA". I could not find the terms of use of these
services (SBDB API, Horizons API, the page of approximate planet positions) when this was built; the data are free to fetch, and the
credit is given in the app and here. If you publish this, check the terms first.

```bash
python src/fetch_jpl.py      # JPL -> data/raw/jpl_*.json and jpl_planets_*.html (170 KB)
python src/build_orbits.py   # -> web/data/orbits.json (67 KB)
```

- **Planets:** the eight planets sit where their Keplerian elements put them on the day the page is opened (JPL, "Keplerian Elements for
  Approximate Positions of the Major Planets", Table 1, valid 1800 to 2050; Earth is the Earth-Moon barycentre). The orbit lines are the
  real ellipses. The clock of the page starts on today's date and runs with the time slider. The map is still squeezed: a distance of r AU
  is drawn as 0.3 times the square root of r, in the direction it really has. The ecliptic is the flat plane of the Solar System view and is
  not tilted against the equatorial coordinates of the star map.
- **Status:** the visitors (comets, interstellar objects, spacecraft) are switched off for now, until the 3D models of the spacecraft
  are ready: `SHOW_VISITORS` in `web/main.js` is `false` and the menu in `web/index.html` is `hidden`. The planets use the real
  positions all the same. Everything below is what the visitors do when they are switched on.
- **Comets and interstellar objects:** Halley, Hale-Bopp, 67P, Swift-Tuttle, Encke and NEOWISE, and 'Oumuamua, Borisov and 3I/ATLAS.
  Their positions are computed from the elements of the Small-Body Database (ellipses for the comets, hyperbolas for the interstellar
  objects, cut at 60 AU from the Sun in the drawing). They are the elements of the day of the download, without the small pushes of the
  planets or the gas of a comet, so a position far from that day gets less exact.
- **Spacecraft:** Voyager 1 and 2, New Horizons, Juno, Parker Solar Probe and JWST. The flight paths are from Horizons (sun centred,
  ecliptic J2000) up to the day of the download. For the day on the screen the Voyagers and New Horizons fly on in a straight line at the
  speed of their last two points, Juno moves with Jupiter, JWST sits at the point L2 (1 % further from the Sun than Earth, which is about
  1.5 million km behind Earth), and Parker Solar Probe stays where the data put it on the day of the download, which is a rough place
  because it goes round the Sun in 88 days.
- The texts of the visitors use these numbers (distance, light time, period, perihelion dates, speed) plus one well known sentence per
  object; they have no recording, the browser voice reads them.

## Search, filter and honest radii

- **Search:** a field above the menus finds any star or planet of the NASA list by name (two letters are enough), nearest star first,
  with the buttons planet, star and system. The index is built on the first key press.
- **Discovered by:** a drop-down list of the telescopes and observatories that found at least 30 planets (Kepler, TESS, K2, ...,
  from the column `disc_facility`). The stars of their planets stay bright, all others are dimmed. The column comes from
  `src/fetch_nasa_extras.py`, which also fetches the second extra table below.
- **Calculated radii:** for 1,529 planets of the map the archive has no measured radius, it fills in one that is worked out from the mass
  (reference "Calculated Value"). The list is `data/raw/nasa_radius_calculated_*.csv` (`src/fetch_nasa_extras.py`), `src/transform.py`
  writes it as `radius_calculated` into `stars.json`. Of the 36 candidates 16 are such planets (GJ 1002 b and c, GJ 1061 c and d, GJ 1132 c,
  GJ 273 b, GJ 3323 b, GJ 3378 b, Kepler-138 e, L 98-59 f, Proxima Cen b and d, Ross 128 b, Teegarden's Star b and c, Wolf 1069 b).
  For them the text says "about ... but nobody has measured it, it is worked out from the mass", the type line says the type comes from a
  calculated radius, and the list shows "≈". The recordings of these 16 stories were made again with the new text.

- **Planets without an orbital period:** 348 of the planets have no period in the archive (mostly directly imaged ones far from their star, for
  example 2MASS J03590986+2009361 b), and the map used to leave them out, so 335 stars showed no planet at all. For 341 of them the same
  archive table has a measured semi-major axis (`pl_orbsmax`, AU, `data/raw/nasa_orbsmax_*.csv` from `src/fetch_nasa_extras.py`, written into
  `stars.json` by `src/transform.py`). The map takes the period from Kepler's third law, P^2 = a^3 / M (years, AU, solar masses of the star;
  a star without a mass counts as the Sun). Only 7 planets have neither value (mostly found by microlensing, for example KMT-2019-BLG-1953L b). They are drawn too, at a fixed place 0.6 map units from the star, without an orbit line, without moving, and the story says that the orbit is not known and the place is only for the picture. Gaia does not help here: it measures stars,
  not planet orbits.

## Travel planner, flight speed and star tools

The maths and all texts of this part are in `web/travel.js`, the drawing is in `web/main.js`.

- **Travel planner (planet to planet, and anywhere else):** the button "Travel planner" in the left panel opens a panel in the middle of the screen with From, To, Speed, View and the flight speed of the keys. When the trip starts the panel closes and a small box at the bottom shows the trip with a Stop button (it turns into Close at the end). From and
  To are text fields with suggestions: the eight planets, the Sun or any of the 4,819 host stars. The ship leaves the start planet where it is now and flies a straight line at constant speed to the place where the target will
  be on arrival (an intercept course, `solveIntercept`: stepping plus bisection on "distance to the target at time T equals speed times T").
  Start and target stand on their real positions of today (`planetPosition`). The line is worked out in AU and drawn through the squeezed
  map, so it looks curved; the ring marks the arrival point. The camera follows the ship, the time slider speeds it up (when you press
  "Plan and fly" the time speed is set so the trip takes about 20 seconds; change it afterwards). The panel shows the distance, the light
  travel time, the travel time and, below c, the time on board with the Lorentz factor (time dilation).
- **First person start:** the camera starts 1.3 radii (centre to centre) from the start object, but never closer than 0.03 map units to its surface (the near plane of the camera is 0.01 and cuts away anything closer, which felt like sitting inside the Earth), a bit left, above and behind it, looking along the route, so the
  start object stands at the lower right of the picture and falls behind when the ship speeds up.
  Only the start has this offset: during the first tenth of the route the camera slides into the path of the ship (the normal first person view).
- **Swap:** the button with the two arrows between From and To swaps start and target.
- **Pick on the map:** next to From and To there is a "Pick" button. It closes the planner and waits for one click on the map: on a planet of a system that is shown, or on the nearest star (the Sun counts). The name goes into the field and the planner opens again. Esc or Cancel stops it.
- **View:** "View" chooses first person (the default: the camera sits at the ship and looks at the blue ring of the target, zoom is off) or third
  person (the camera follows the ship from outside). It can be switched during the flight.
- **The trip as a short film:** (1) the start planet or system is in view (2.5 s), (2) the ship turns towards the target (2.5 s), (3) it jumps
  into hyperspace (1.2 s) and flies, with the stars as streaks all the time, (4) it comes out of hyperspace at the target system point
  (the stop point in front of the target) and (5) the camera goes on to the planet if a planet was chosen. **The turn and the hyperspace are
  fiction** (there is no hyperspace as far as we know, it is only the look of the film); the times shown are for the speed chosen. Before the
  flight the time runs in real time; during the flight it is set so that it takes about 20 seconds; at the end your setting is back.
- **Clean view while flying:** from the turn until the exit the names above the bodies, the green habitable zone and the story panel are switched
  off; afterwards they come back (the story panel with the story of the target). "Stop" brings them back too.
- **The four points of a trip to or between stars:** (1) the start (the camera at the start object), (2) the edge of the start system: the ship
  first flies out of the system (3 s), (3) the edge of the target system, where it comes out of hyperspace, and (4) the planet, to which the
  camera flies at the end. The hyperspace runs from point 2 to point 3 only. An edge lies a bit beyond the outer orbit as drawn (1.5 times it, between 0.3 and 1.8 map units; the Solar System is 1.8 because Neptune is at 1.64, Proxima Cen is 0.3), on a short route at most a third of it. A planet of ours leaves from its own place, not from the Sun. Between planets of one system
  there are no edges: the ship stops in front of the target planet as before.
- **Moving streaks and the speed in the panel:** the blur alone is made from stars that stand still, so it did not move and it did not look like we fly past
  anything. In the hyperspace (first person) a field of 1,400 thin short lines now flies out of the point we look at and past the camera, with the blur on top.
  It is an effect, not data. The result box of a trip now also says the speed that was chosen ("Speed: 100 c (FICTIONAL)"), next to the travel time.
- **Finer streaks:** the blur takes 32 samples along each line to the centre (it was 17), each moved by a small random amount per pixel (dithering), so a streak is a smooth thin line and not a row of beads.
- **Streaks run out of the target:** in first person the camera always looks at the blue ring of the target (the route is curved on the squeezed map, so the direction along the route is not the direction of the target), and the streaks of the hyperspace radiate from the point the camera looks at. The side panels shift the picture, so that point is worked out on the screen and is not the middle of the window.
- **No collisions at the start and at the end:** (1) The ship starts 1.575 radii (1.5 plus 5 %) from the middle of the start object, not in its middle (between planets of
  one system the line starts there, to and between stars the ship leaves from there). (2) In first person the camera starts 4.575 radii behind the
  ship, 1.2 radii to the left and 0.9 above (seen from the object's centre: 3 behind, 1.2 left, 0.9 above), so it passes the object at 1.5 radii from
  its middle. The offset melts away only when the camera is 6 radii past the start object (between planets of one system), then over a tenth of the
  route. (3) The flight from the stop point to the close-up of the planet does not go in a straight line: close to the planet the camera turns
  around it (its direction as seen from the planet is turned step by step), so it cannot cut through the planet when it goes to the lit side.
- **Near plane during a trip:** the camera normally cuts away everything closer than 0.01 map units. A trip ends 1.5 radii from a planet that is drawn 0.0135 wide, so the planet would be cut and the ship seemed to fly into it (Mars). During a trip the near plane is 0.002, afterwards 0.01 again.
- **Soft start and stop, and the arrival:** the ship speeds up evenly during the first tenth of the time and slows down during the last tenth
  . The area under the speed curve stays the same, so the travel time shown is right, but the
  constant speed in between is 1.11 times the chosen one. At the end the destination is in view: a planet gets its close-up with its
  story, a star or the Sun is shown as its system.
- **Exoplanets as destination, stopping in front of the target:** From and To also take the name of any exoplanet (for example Proxima Cen b).
  The ship flies to its star, and on arrival the system opens and the camera goes to the planet. The ship never flies through the
  target: it stops 1.575 radii from its centre, a bit more than a quarter of a diameter in front of its surface (the radius as drawn on the map; all host stars are drawn with the same size), then the
  close-up takes over. The blue line shows the whole route up to the ring at the target; the ship stops on it a little before the ring. The distance and travel time shown are to the target itself, the small stretch that is not flown is not subtracted.
- **Time speed:** the trip sets the time speed so that it takes about 20 seconds; when the ship arrives (or on Stop) the time speed is back
  at the value you had before, even if you moved the slider during the flight.
- **Speed steps:** Voyager 1 (17 km/s), Parker Solar Probe (about 190 km/s), 0.1 c, 0.9 c, 1 c, 10 c and 100 c. The first two are real.
  0.1 c and 0.9 c are far beyond any real spacecraft (physics does not forbid them). 1 c is the speed of light, which only light reaches, so it
  has no time on board. **10 c and 100 c are FICTIONAL**: nothing can be faster than light as far as we know. They are marked in red in the
  panel and in the menu.
- **Trips to and between stars:** if one end is a star or the Sun, the ship flies a straight line in real space (light years, the axes of
  the data); the time is distance over speed, 1 c being one light year per year. The stars are treated as standing still (their real
  motion is slow and not used here) and a planet counts as the Sun, because the planets are tiny against light years. Two extra
  fictional steps (1,000 c and 100,000 c) make star trips watchable. At the top speed of the time slider (1e8) a trip of thousands of years
  still takes hours to watch, so slow probes to a star are not watchable. After "Measure distance" with two stars, the button "Plan a trip
  between them" fills in both ends.
- **What it does not do:** no gravity, no orbit of the Sun, no speed of the start planet at launch and no time for the light to reach the
  planets. It is a straight line, not a mission plan.
- **Flight speed in c:** "Flight speed (keys)" sets how fast W, A, S, D and Q, E move: Auto (as before) or a multiple of c, where 1 c is one
  light second per second (the steps are 1, 1,000, 1e5, 1e7, 1e9 and 1e11 c). The speed is true to the real distance near the camera,
  worked out from the squeeze of the map at that place (square root of the distance), so on the screen the same speed looks different in
  different places. Everything above 1 c is marked FICTIONAL.
- **Diffraction spikes:** the brightest stars (as seen from the camera, in the NASA layer and in the near Gaia layer, also the deep layer)
  get a four-armed cross, like a telescope shows. It is an effect of the optics, not a part of the star, and an illustration.
- **Star streaks:** in the hyperspace of the planner, **only in first person** (from outside there is no motion blur) and at high speed of the key flight (1,000 c and more) the picture is smeared
  outwards from the middle, so the stars become streaks (a post-processing pass in `main.js`, off at normal speed).
- **Spectral class filter:** the classes O, B, A, F, G, K, M from the star temperature `st_teff` (limits 30,000 / 10,000 / 7,500 / 6,000 /
  5,200 / 3,700 K, the usual rounded ones). Off, highlight (the others dimmed) or isolate (the others hidden). It works together with
  "Discovered by". Stars whose temperature was only assumed (287) have no class. It applies to the host stars of the NASA list, not to the
  Gaia layers.
- **Measure distance:** press the button, click two stars (or the Sun), get the straight-line distance in light years and parsecs and the
  line between them, drawn curved because the map is squeezed. The distances are the catalogue distances with their measurement errors. It
  feeds the planner (star to star).

## Real scale (stage 1: the Solar System)

The button "Real scale: off / on" at the top of the left panel (above the Travel planner) switches between two modes.

- **Explanation mode (the default):** distances are squeezed (square root of the distance) and the planets are drawn bigger than they are, so everything
  fits on the screen and can be read.
- **Real scale:** real distances and real sizes. 1 AU is 17.2 map units, which keeps the Sun at the radius it is drawn with (0.08), and everything else
  follows from the real values: the planet radii (Earth is 109.1 times smaller than the Sun), the orbits (the real ellipses, no squeeze) and the
  Moon at 60.3 Earth radii (the explanation mode draws it at 2.6). The zone of candidates is drawn at its real distance (about 0.95 to 1.7 AU). The
  names above the planets keep their size on the screen, which is the way to find a planet that is a dot.
- **What is different in the real scale:** the asteroid belt and the dust disc are hidden (they are drawn with the squeezed distances). The stars are
  a sky: only their directions count, on a sphere around the camera (the other stars are light years away, the picture would have no depth). The
  other star systems are not drawn (yet). The near plane of the camera follows the distance to the nearest surface (a fiftieth of it), because the
  planets are 0.0007 wide next to distances of hundreds of units. The speed in c uses the real scale.
- **Trips:** between planets they work in both modes (start and end distances are real in the real scale). A trip to or between stars in the real
  scale is the same film with a cut: the ship leaves the start system towards the target star up to the edge of the system (600 map units for the
  Solar System, a bit beyond Neptune; for another star 1.5 times its outer orbit, at least 40 star radii), the hyperspace jump is the cut (the ship
  waits at the edge while the streaks run), and out of hyperspace the target system is the home and the ship is at its edge, on the side of the start
  star. The real distance in light years is in the panel, the camera does not fly it.
- **Orbit lines with enough points:** in the real scale an orbit is hundreds of units long and the camera can be a few thousandths of a unit from the planet. With 128 corners the line was a polygon whose sides lay several planet radii beside the planet. The real scale now draws 8,192 corners per orbit (the explanation mode keeps 128).
- **Trips between planets in the real scale (variant B):** at real distances 1.5 AU is 65,000 planet radii, so a flight at a constant speed is either an endless nothing or a blink at the planets. The trip is a zoom instead: the distance from the nearer planet grows and shrinks by the same factor every second, so the ship leaves the start planet slowly, rushes through the middle and slows down towards the target, where it stops exactly 1.575 radii from the planet (the stop distance is worked out exactly, not by a search). Only the picture is a zoom: the clock and the planets run as they really do, and the times shown are the real ones. There is no jump into hyperspace; the streaks only appear where the ship is far from both planets. In third person the camera keeps its direction and its distance follows the ship (a quarter of the distance to the nearer planet, at least 4 radii of it). During the exit the clock runs again at the speed of the user, so the ship and the ring follow the planet. In the exit the camera looks at the planet and comes in to the close-up distance, and the close-up that follows keeps the side the camera is on (before, it swung around the planet to the lit side in 1.4 s, which looked like a jerk). Between stars the real scale still uses the cut (see above).
- **Phones (screens up to 640 px wide):** the panel on the left starts folded to a small bar with the title and a button, so the picture is free; opened, it is as wide as the screen and folds again when something is chosen from it (a planet, the travel planner). The info window, the story panel and the travel planner use the width of the screen. The box of a trip is as wide as the screen too, with the distance, the travel time and the time on board in one row and the speed under them, and a smaller caption above it. On touch screens every control is at least 44 px high and fields use 16 px type (a smaller one makes a phone zoom into the page). There is one burger button, at the top right: it opens one panel with everything in it (travel planner, time speed, the lists, Tools with the search field, then Hints, Credits and Settings, folded). The panel on the left is only a bar with the title while it is closed. The Info button is a round button at the bottom right, in reach of the thumb: an "i" that becomes an "x" while the story panel is open (the panel sits above it); it steps aside while the box of a trip is on the screen. The entries of the info window are moved into that panel on a phone and back on a wider screen. The desktop layout is unchanged. Tested in the browser at 375 px width; not yet on a real phone.
- **Trips to another star end at the edge of its system (point 3):** the last part (point 4, the flight on to the planet and its close-up) is left out, so the film stops where the ship comes out of hyperspace and the whole system is in view. The ship brakes earlier for this: the last quarter of the time is the braking (the start still takes a tenth). In the explanation mode the target system is shown at the end (without the close-up). Between planets of one system (both modes) the third-person camera now follows the ship at a distance that shrinks near the planets (never more than 0.35, a quarter of the distance to the nearer planet, at least 4 radii), because on the squeezed map a route between two planets is a third of a unit and the fixed 0.35 put the camera at the start planet at the end; the exit looks at the planet and the close-up keeps the side of the camera.
- **Other stars (stage 2):** in the real scale one system is shown at a time (the "home"): the Solar System or the system of a host star, with the real
  star radius (`st_rad`, a missing one counts as 1 solar radius), the real planet radii (`pl_rade`; a planet without a radius keeps a drawn marker),
  the real orbits (the semi-major axis in AU, circles) and the zone at its real distance. Going to another star (search, the lists, the named stars)
  is a cut to its system, because at real distances the stars are light years apart and no picture can show that. The other stars are the sky seen from
  the home star (directions and brightness as seen from there). A named star without data of its own is a Sun-sized star without planets.

## Menus

- **Burger menu (top right):** three menus. *Hints* (controls, legend of the green zone, note on the asteroid belt), *Sources and licences* (the link to
  the imprint, privacy and licences page and the credits) and *Settings*.
- **Settings:** language (first entry), candidate zone (the green habitable band, on or off), look of the exoplanets, scale (compressed or linear), Gaia stars, deep stars and
  background. The candidate zone, the Gaia stars, the deep stars and the background are **on by default** (the deep stars are not offered on touch
  devices and narrow screens). The two star layers load in the background after the start.
- **Info button (top right, left of the burger):** the story panel of the chosen planet (bottom right, half as tall as before) is closed until
  you press "Info". The button is always there (hidden only while a trip flies); before a planet is chosen the window says so. It stays open or closed as you left it.
  The buttons Listen and Close-up (or System view) sit at the top right of that window, next to the title, and stay in view when the text scrolls.
- **Named stars:** the 16 stars of the Gaia layer with a proper name (SIMBAD) were only dots. "Fly to" now gives the star a body of its own: a ball with glow, corona and rays, in the colour of its Gaia entry. All stars of the map are drawn with the same size, which is not the real size. It is a system without planets and replaces the exoplanet system that is shown.
- **Luyten's star = GJ 273:** the archive puts GJ 273 at 5.92 pc (19.3 ly), but Gaia (and the real value, about 12.4 ly) puts Luyten's star at 12.3 ly, and the named star of the Gaia layer sat there without planets. `src/transform.py` now takes the distance of GJ 273 from the Gaia entry (`dist_from_gaia` is true for it), the direction stays the archive's, and "Fly to" on Luyten's star opens the system GJ 273 with its planets. The archive value is not changed in `data/raw`.
- **Left panel:** on top the Travel planner button, search and time speed. The menu "Tools" (closed) holds the filters (discovered by, spectral class) and measuring; a green dot after its title shows that a filter or measuring is on. Below are the lists (Solar System, named stars, habitable candidates).

## Legal

`LICENSE` (MIT for the code, not for third party material), `THIRD_PARTY_NOTICES.md` (every source with its terms and the
places where terms could not be found) and `web/legal.html` (imprint, privacy notice, licences; linked in the panel behind the burger
button). **The imprint holds placeholders** for name, address and e-mail, and for the hosting provider in the privacy notice: they need
the real data of the person who publishes the site, nothing was invented.

## Picture quality: bloom and tone mapping

The scene is drawn into a float image with 4x smoothing of the edges, a soft bloom (strength 0.3, radius 0.5, threshold 0.92) lights up
the brightest parts (Sun, bright stars, the glint on the sea), and the last pass applies the film like ACES tone curve (exposure 1.0)
and turns the result into screen colours. The shaders that wrote screen colours themselves (the star dots) convert to linear light
first (`pow(colour, 2.2)`), all the others already did it through `colorspace_fragment`. The passes come from the three.js examples
(`web/vendor/three/addons/postprocessing/` and `shaders/`, version r160, MIT licence like three.js itself): EffectComposer, RenderPass,
UnrealBloomPass, OutputPass, ShaderPass, Pass, MaskPass, CopyShader, LuminosityHighPassShader and OutputShader.

## Shadows and depth

- **Saturn:** the planet throws a dark wedge on its rings, and the rings throw a band of shadow on the planet. Both are computed from
  the real direction of the Sun (a ray is followed from each point towards the Sun, to the ring plane or past the planet), with the
  ring edges of `RING_FRAGMENT`. Uranus and Neptune have no ring shadow, their rings are too thin to show one.
- **Dust disc:** a very faint, swirled disc in the plane of the planets (`dustDisc` in `web/main.js`). The Solar System does hold a flat
  cloud of dust (the zodiacal dust), but its thickness and swirls are not drawn from data, it is a schematic mood.
- The planets do not shade each other: in this map they are too small and too far apart for that to be visible.

## Polish

- **Labels:** the names above bodies have a soft dark edge and fade out when they would lie on top of a nearer name
  (`declutterLabels`). **Orbit lines** are thin light lines that fade with the distance from the camera (`orbitLineMaterial`).
- **Sun and other stars:** soft streamers on a sheet that faces the camera (`makeStarRays`), in the colour of the star, for the Sun and
  the star of the system that is open. They are an illustration of the look, not data.
- **Candidate zone:** a soft band that fades in and out at its edges (only in the drawing, the limits of the rule are sharp). The faint
  dust disc around the Sun is dimmer and fades out sooner than before. Planets are drawn a bit bigger and a bit lighter on their
  night side so that they do not vanish in the overview.
- **Names:** the width of a label follows the length of the name. The names of the Gaia stars show only near the star or on the
  overview of the neighbourhood, not in between (`nearOnly`).
- **Nebula colours:** very faint painted clouds of purple, pink and blue near the plane of the Galaxy are added to the Milky Way photo
  (`uNebula` in the Milky Way shader, 0 switches them off). They are an illustration, no real nebulae.
- **Interface:** blurred glass panels, smoother buttons, focus rings, panels that fade in, thin scrollbars and a start screen. No
  extra font was downloaded, the font is the system font of the visitor (Segoe UI, Inter or the system default).

## Brightness of the host stars

The stars of the NASA list are drawn with a brightness from physics, like the Gaia layer: the luminosity comes from the radius and
the temperature, L = R^2 (T / 5772 K)^4 in solar units, and the absolute magnitude is M = 4.74 - 2.5 log10 L. In the shader the
apparent magnitude seen from the camera follows from M and the distance, so a bright giant stands out and a faint dwarf is a dim
dot, and far stars fade with the square of the distance. The exposure starts at magnitude 13.5 at the Sun and opens up with the distance
from the Sun (`uMagRef`), because the hosts reach out to 28,000 light years. A floor keeps every host visible. A star without a
radius or a temperature is treated like the Sun (flagged in the data). The colour is still from the temperature only.

## Far stars fade

The grid-like patch in one corner of the sky is the Kepler field: the Kepler telescope watched one small patch, more than 2,000
planet hosts stand there, and the gaps between the sensors of its camera show as a grid. It is real data, a selection effect of the
survey. So that it does not look like a pattern on the screen, the stars of the NASA list (without the glowing candidates) fade with
their distance, which is now part of the physical brightness above (`fade` in the star shader, with a floor of 18 %). Flying close to
such a star makes it clear again.

## Gaia layer (optional)

A switch in the panel shows the stars closer than 326 light years from ESA Gaia DR3 at their real positions (246,020 stars),
without the hosts of the NASA planets, which are taken out by their Gaia source ID. The layer is off at the start and
the file is only read when it is switched on.

```bash
python src/fetch_gaia.py     # Gaia archive -> data/raw/gaia_near_stars.csv (24 MB, not in Git)
python src/build_gaia.py     # + NASA host IDs -> web/data/gaia_stars.bin (3.8 MB, in the project)
```

- Selection: parallax above 10 mas with a measurement good to 5 % (parallax over error above 20), RUWE below 1.4 (Gaia's own quality
  limit), and a brightness. The first version used 10 % and no RUWE and had 372,226 stars, with a cloud of false near stars towards the
  centre of the Milky Way, where crowded fields spoil the parallax. In a test patch there (right ascension 250 to 280 degrees,
  declination -45 to -20) the counts were 47,949 without any cut, 15,277 with RUWE below 1.4 and 4,272 with the 5 % cut as well, which
  is about what a quiet sky gives for that patch (4,100). The 5 % cut costs about 7 % of the stars. 173 stars without a brightness are
  left out.
- The colours come from a temperature: for 101,299 stars the temperature that Gaia's own pipeline gives (`teff_gspphot`), for the
  other 144,721 estimated from the colour index (bp_rp) with a rough table for main sequence stars. Where both exist they agree
  well (the Gaia value is 0.95 to 1.02 times the table value for 80 % of the stars), so the colours barely changed. 4,034 stars
  with neither get a sun-like colour. The brightness of a dot follows physics: the shader works out the apparent magnitude from the
  absolute magnitude of the star and its distance from the camera in real light years, so stars fade when you fly away and the truly
  bright ones stand out. The brightness is limited softly so nothing burns out, and the size of a dot depends only on its brightness
  (a fine dot for a faint star, a few pixels for a bright one). Seen from the Sun the layer shows stars down to about magnitude 8.5
  (a bit fainter than the naked eye, which reaches 6); the limit moves up with the distance from the Sun so that the layer stays
  visible on the overview. These two numbers are looks, set in `GAIA_MAG_BASE` and in `updateGaiaCamera`.
- Licence: Gaia data come under the ESA terms, CC BY-NC 3.0 IGO, credit "ESA/Gaia/DPAC" is required (shown with the switch and in
  the credits), and commercial use needs the permission of ESA. Do not use this layer in a commercial product without asking ESA.
  Everything else in the project does not depend on it.

The named stars are also a list in the panel ("Named stars"), nearest first with their distance in light years. A click switches the
Gaia layer on and flies the camera to the star.

### Milky Way background

The Milky Way behind the stars is the panorama "The Milky Way panorama" by ESO/S. Brunier
(https://www.eso.org/public/images/eso0932a/, credit "ESO/S. Brunier"). ESO states that its images are licensed under
CC BY 4.0 unless noted otherwise (https://www.eso.org/public/outreach/copyright/), which allows reuse, also commercial, with the credit
shown and changes indicated; the image page itself names no separate licence. The ESO logo is not covered, and the project must
not suggest that ESO endorses it. Changes made here: the 6000 x 3000 pixel JPEG was shrunk to 4096 x 2048 pixels
(`web/textures/milkyway.jpg`, 2.5 MB), it is read through the viewing direction as galactic longitude and latitude, and it is
brightened by a factor of 1.1. The panorama is an equirectangular photo in galactic coordinates: the Galactic centre is in the middle,
the longitude grows to the left, the latitude runs from -90 degrees at the bottom to +90 at the top (checked against the Large
Magellanic Cloud, which sits at longitude 280 degrees and latitude -33 degrees). The shader turns the viewing direction of the
map (equatorial axes) into galactic ones with the standard J2000 rotation.

As a fallback the shader also paints a Milky Way of its own (`MILKY_WAY_FRAGMENT` in `web/main.js`), used until the photo has loaded
or if it cannot be loaded. It is an illustration: only the position of its band and of its centre are real, dust lanes, clouds,
colours and specks are invented.

### Deep Gaia layer (about a million bright stars)

A second switch, "Deep stars", shows 992,065 bright Gaia stars (G < 11, parallax over error above 5, RUWE below 1.4, parallax above
0.2 mas, so up to 16,300 light years away) at their real positions. They give the depth: stars at all distances around the camera.
The stars that are already in the near layer (and the NASA planet hosts) are taken out by their Gaia source ID (34,259 of the 1,026,324
downloaded).

```bash
python src/fetch_gaia_bright.py          # 12 minutes, resumable, slices in data/raw/gaia_bright/, 105 MB CSV, not in Git
cd src && python build_gaia_bright.py    # -> web/data/gaia_deep.bin (15 MB), sorted brightest first
```

- Brightness as for the near layer (real, from the camera distance), with an own material: a lower gain and an exposure that hardly
  opens up with the distance from the Sun, otherwise a million stars add up to a white wall on the overview.
- Speed: on the integrated graphics of the development machine the page runs at 111 frames per second without the layer and at about
  23 to 34 with it. The file is sorted brightest first, and every 8 frames the page looks at the frame time: slower than 33 ms takes away half of the
  stars (the faintest), down to 100,000. Switching it on again starts with all of them.
- Not offered on touch devices and narrow screens (under 700 pixels): a million points would be too heavy there.
- Licence as for the near layer: ESA terms, CC BY-NC 3.0 IGO, credit ESA/Gaia/DPAC, no commercial use without ESA's permission. Far
  stars are not corrected for dust on the way.

### Star names in the Gaia layer

The 16 stars of the layer that have a proper name (Luyten's star, van Maanen's star, Yildun, Zibal and so on) get a label when the layer
is on. Barnard's star and Kapteyn's star, which are planet hosts in the NASA list, are on the map as hosts and are not
in the Gaia layer. The names come from SIMBAD (CDS, Strasbourg), a one-off extract of the names that have a Gaia DR3 ID, saved as
`data/raw/simbad_star_names.csv`. The main SIMBAD server could not be reached when it was fetched, so the copy at
`simbad.cfa.harvard.edu` was used, the data are the same. A name counts as proper when it has no digits and no asterisk, which
leaves out catalogue names like "GR* 112A". Famous names such as Sirius are missing, probably because the quality cuts drop very
bright stars. CDS asks for this acknowledgement, which is in the credits: "This research has made use of the SIMBAD database,
operated at CDS, Strasbourg, France", Wenger et al. 2000, A&AS 143, 9. I could not find the full terms of use of SIMBAD, a
third party source calls its licence ODbL, which CDS has not confirmed.

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
