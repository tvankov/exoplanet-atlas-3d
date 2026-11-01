# Third party data, images, sounds and libraries

The code of this project is under the MIT licence (see `LICENSE`). Everything below belongs to others and keeps its own terms.
This list was written from the sources that were read while building the project. Where a term could not be found or confirmed,
it says so. Check the terms again before you publish or use the project commercially.

| What | From | Terms as far as known | Where it is used |
|---|---|---|---|
| Planets and stars (positions, sizes, temperatures) | NASA Exoplanet Archive, table `pscomppars` (Christiansen et al. 2025, PSJ) | The archive asks for its acknowledgement: "This research has made use of the NASA Exoplanet Archive, which is operated by the California Institute of Technology, under contract with the National Aeronautics and Space Administration under the Exoplanet Exploration Program." Not endorsed by NASA. | `web/data/stars.json`, the whole map |
| Earth maps (surface, clouds, night lights) | NASA Earth Observatory, Blue Marble / Visible Earth | NASA imagery is generally not copyrighted, credit NASA, no implied endorsement | `web/textures/earth*.jpg` |
| Moon map | NASA Scientific Visualization Studio, CGI Moon Kit (Ernie Wright), LRO data | as above | `web/textures/moon.jpg` |
| Jupiter map | NASA/JPL/Space Science Institute, Cassini (PIA07782) | as above | `web/textures/jupiter.jpg` |
| Mars map | NASA/JPL/USGS Astrogeology Science Center, Viking Orbiter mosaic ("public domain" access constraint) | as above | `web/textures/mars.jpg` |
| Mercury map | NASA/JHU APL/Carnegie Institution, MESSENGER MDIS, distributed by the USGS (cite Denevi et al., LPSC 47, abstract 1264) | as above | `web/textures/mercury.jpg` |
| Stars of the Gaia layer | ESA Gaia DR3, "This work has made use of data from the European Space Agency (ESA) mission Gaia, processed by the Gaia Data Processing and Analysis Consortium (DPAC)" | ESA terms for its archives: CC BY-NC 3.0 IGO, **not for commercial use** without the permission of ESA | `web/data/gaia_stars.bin`, `gaia_deep.bin`, `gaia_names.json` |
| Names of the Gaia stars | SIMBAD, CDS, Strasbourg (Wenger et al. 2000, A&AS 143, 9), fetched from the mirror at CfA | CDS asks for the acknowledgement "This research has made use of the SIMBAD database, operated at CDS, Strasbourg, France". Its full terms of use were not found. | `web/data/gaia_names.json` |
| Milky Way background | ESO/S. Brunier, "The Milky Way panorama" (eso0932a) | ESO states CC BY 4.0 for its images unless noted. Credit "ESO/S. Brunier" must be shown, changes must be named (shrunk to 4096 x 2048, mapped onto the sky sphere, brightened). The ESO logo is not covered, no endorsement may be implied. | `web/textures/milkyway.jpg` |
| Orbits of planets, comets, interstellar objects and spacecraft | NASA/JPL Solar System Dynamics (SBDB API, Horizons API, "Keplerian Elements for Approximate Positions of the Major Planets") | Credit "JPL/Caltech/NASA". The terms of use of these services were **not found**. | `web/data/orbits.json` |
| three.js r160 and its examples (controls, post-processing) | https://threejs.org | MIT licence, the `LICENSE` file is in `web/vendor/three/` | `web/vendor/three/` |
| Voices of the recorded stories | Piper voices `en_US-ljspeech-high` (LJ Speech, public domain) and `de_DE-mls-medium` (Multilingual LibriSpeech, Pratap et al., CC BY 4.0) | CC BY 4.0 needs the credit. The Piper engine (GPL) was only used on the computer to make the sound files, it is not part of the website. | `web/audio/` |

Things that are made up and labelled as such in the app: the surfaces of exoplanets, the painted looks of Venus, Saturn, Uranus and
Neptune (only the colours and bands follow what probes show), the fine structure of Saturn's rings, the dust disc around the Sun,
the streamers of the Sun and other stars, and the faint colour clouds in the background.
