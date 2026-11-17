// Learning paths (the area Learn of My Universe). A path has steps; each step has a goal, a short text, a sentence about what it means for the
// visitor (worked out from their year of birth and their star, or, without them, for a person of 30), a task in the 3D view and a few
// questions with the answer explained. When the task is done and every question is answered right, the step is done (XP); when all steps
// are done, the final test opens: 10 questions from all steps, some with the visitor's own numbers, passed from 70 % (XP and a badge). The
// progress lives in the explorer's log (explorer.js: total.learnTasks, learnSteps, learnPaths and "learnBest:<path>"), so it is merged with
// the account like the rest. Every step has a box of the facts to remember and its sources (SOURCES): the facts were checked against those
// NASA pages in November 2026, so that a step can be checked again when the science changes. The rules are pure functions, tested in
// tests/learn.test.mjs. The paths: Our Solar System, Alpha Centauri (our nearest stars), Exoplanets and the search for habitable worlds. A step may have no task in the
// 3D view when what it is about is not in the map (Alpha Centauri A and B): then the questions alone finish it.

import { track } from "./stats.js";
import { MOONS } from "./moons.js";
import { XP_LEARN } from "./explorer.js";
import { planetCanvas, starCanvas } from "./sharecard.js";
import { sunLongitude, tropicalSign, sunConstellation } from "./birthsky.js";

export const PATHS = {
  solar: { steps: ["sun", "inner", "outer", "moons", "scale"], minutes: 30, testSize: 10, pass: 0.7 },
  alpha: { steps: ["neighbors", "pair", "proxima", "proximaB", "travel"], minutes: 25, testSize: 10, pass: 0.7 },
  exo: { steps: ["exoWhat", "exoHow", "exoRocky", "exoGiants", "exoStrange", "exoSystems", "exoFamous"], minutes: 35, testSize: 10, pass: 0.7 },
  hab: { steps: ["habWhat", "habZone", "habWater", "habAtmos", "habIngredients", "habExtreme", "habLife"], minutes: 35, testSize: 10, pass: 0.7 },
  zod: { steps: ["zodWhat", "zodPath", "zodShift", "zodScience", "zodLight"], minutes: 25, testSize: 10, pass: 0.7 },
  names: { steps: ["nameLetters", "nameStars", "nameGreek", "nameCatalog", "nameStories"], minutes: 25, testSize: 10, pass: 0.7 },
  stars: { steps: ["starWhat", "starColor", "starClass", "starSize", "starHosts"], minutes: 25, testSize: 10, pass: 0.7 },
  birth: { steps: ["birthCloud", "birthProto", "birthDisk", "birthCluster", "birthSun"], minutes: 25, testSize: 10, pass: 0.7 },
  life: { steps: ["lifeMain", "lifeMass", "lifeGiant", "lifeWhite", "lifeNova"], minutes: 25, testSize: 10, pass: 0.7 },
  compact: { steps: ["nsWhat", "nsPulsar", "bhWhat", "bhCenter", "bhImage"], minutes: 25, testSize: 10, pass: 0.7 },
  nebula: { steps: ["nebWhat", "nebPillars", "nebDark", "nebRing", "nebCrab"], minutes: 25, testSize: 10, pass: 0.7 },
  milky: { steps: ["mwWhat", "mwArm", "mwOrbit", "mwBand", "mwGaia"], minutes: 25, testSize: 10, pass: 0.7 },
  local: { steps: ["locGroup", "locMagellan", "locAndromeda", "locApproach", "locFuture"], minutes: 25, testSize: 10, pass: 0.7 },
};
// where each task takes the visitor (main.js does it): a place of the map, or the real scale
// ("figure:<id>" shows a constellation, "plan:<place>" opens the trip planner from the Earth to the place, null: no task)
export const TASKS = {
  sun: "Sun", inner: "Mars", outer: "Saturn", moons: "Jupiter", scale: "realScale",
  neighbors: "figure:Cen", pair: "Alpha Centauri A", proxima: "Proxima Cen", proximaB: "Proxima Cen b", travel: "plan:Proxima Cen b",
  exoWhat: "51 Peg b", exoHow: "Kepler-22 b", exoRocky: "TRAPPIST-1 e", exoGiants: "HD 209458 b", exoStrange: "55 Cnc e", exoSystems: "KOI-351", exoFamous: "HD 189733 b",
  habWhat: "Earth", habZone: "TOI-700 d", habWater: "Jupiter", habAtmos: "Venus", habIngredients: "Mars", habExtreme: "moon:Europa", habLife: "Proxima Cen b",
  zodWhat: "figure:birth", zodPath: "figure:Oph", zodShift: "figure:birthSign", zodScience: null, zodLight: "figure:birth",
  nameLetters: "Proxima Cen", nameStars: "Alpha Centauri A", nameGreek: "figure:Cen", nameCatalog: "TRAPPIST-1", nameStories: "51 Peg b",
  starWhat: "Sun", starColor: "TRAPPIST-1", starClass: "51 Peg", starSize: "Proxima Cen", starHosts: "TOI-700",
  birthCloud: "figure:Ori", birthProto: "AU Mic", birthDisk: "PDS 70", birthCluster: "figure:Tau", birthSun: "Sun",
  lifeMain: "Sun", lifeMass: "Proxima Cen", lifeGiant: "Sun", lifeWhite: "WD 1856+534", lifeNova: null,
  nsWhat: "PSR B0329+54", nsPulsar: "PSR B1257+12", bhWhat: null, bhCenter: "figure:Sgr", bhImage: "figure:Vir",
  nebWhat: "figure:Ori", nebPillars: "figure:Ser", nebDark: "figure:Ori", nebRing: "figure:Lyr", nebCrab: "figure:Tau",
  mwWhat: "figure:Sgr", mwArm: "Sun", mwOrbit: "Sun", mwBand: "figure:Sgr", mwGaia: null,
  locGroup: "figure:Tri", locMagellan: "figure:Tuc", locAndromeda: "figure:And", locApproach: "figure:And", locFuture: null,
};
// What the 3D view shows while a path or a step is open (main.js flies there as soon as it is clicked, My Universe stays open): the place
// of the step. The task above is the visitor's own action; this is only the picture behind the text. "view:neighborhood" is the Sun, Proxima
// and Alpha Centauri A and B from the side, with lines and their distances (main.js).
export const VIEWS = {
  sun: "Sun", inner: "Mars", outer: "Saturn", moons: "Jupiter", scale: "Neptune",
  neighbors: "view:neighborhood", pair: "Alpha Centauri A", proxima: "Proxima Cen", proximaB: "Proxima Cen b", travel: "Proxima Cen",
  exoWhat: "51 Peg b", exoHow: "Kepler-22 b", exoRocky: "TRAPPIST-1 e", exoGiants: "HD 209458 b", exoStrange: "55 Cnc e", exoSystems: "KOI-351", exoFamous: "HD 189733 b",
  habWhat: "Earth", habZone: "TOI-700 d", habWater: "Jupiter", habAtmos: "Venus", habIngredients: "Mars", habExtreme: "moon:Europa", habLife: "Proxima Cen b",
  zodWhat: "Earth", zodPath: "Sun", zodShift: "Sun", zodScience: "Earth", zodLight: "Earth",
  nameLetters: "Proxima Cen", nameStars: "Alpha Centauri A", nameGreek: "Earth", nameCatalog: "TRAPPIST-1", nameStories: "51 Peg b",
  starWhat: "Sun", starColor: "TRAPPIST-1", starClass: "51 Peg", starSize: "Proxima Cen", starHosts: "TOI-700",
  birthCloud: "Earth", birthProto: "AU Mic", birthDisk: "PDS 70", birthCluster: "Earth", birthSun: "Sun",
  lifeMain: "Sun", lifeMass: "Proxima Cen", lifeGiant: "Sun", lifeWhite: "WD 1856+534", lifeNova: "Sun",
  nsWhat: "PSR B0329+54", nsPulsar: "PSR B1257+12", bhWhat: "Earth", bhCenter: "Earth", bhImage: "Earth",
  nebWhat: "Earth", nebPillars: "Earth", nebDark: "Earth", nebRing: "Earth", nebCrab: "Earth",
  mwWhat: "Earth", mwArm: "Sun", mwOrbit: "Sun", mwBand: "Earth", mwGaia: "Sun",
  locGroup: "Earth", locMagellan: "Earth", locAndromeda: "Earth", locApproach: "Earth", locFuture: "Earth",
};
// The parts of the plan the paths belong to, in the order of the list (learn.js, listView); "sky" are the paths beside the plan
export const PARTS = [
  { id: "basics", paths: ["solar", "alpha", "exo", "hab"] },
  { id: "starLives", paths: ["stars", "birth", "life", "compact"] },
  { id: "galaxy", paths: ["nebula", "milky", "local"] },
  { id: "sky", paths: ["zod", "names"] },
];
export const PATH_VIEWS = { solar: "Sun", alpha: "view:neighborhood", exo: "51 Peg b", hab: "TOI-700 d", zod: "Earth", names: "Proxima Cen", stars: "Sun", birth: "PDS 70", life: "Sun", compact: "PSR B1257+12", nebula: "Earth", milky: "Sun", local: "Earth" };
// The names in the texts of the steps that are places of the map: a click on one flies there (main.js, show), the step stays open. Per
// language the forms the texts use (a regular expression each) and the place: a name main.js resolves (a planet, a star, an exoplanet) or
// "moon:<id>" (moons.js). The first mention of a place in a step is a link, the others stay text. Left out on purpose: the Moon (in German
// and Japanese also the word for any moon, and 月 is also "month"), Io in Japanese (イオ is also in イオン, "ion"), and what the map does not
// have (Enceladus, Charon, Voyager 1). "Without a sun" means any star, not ours, and is no link.
const EXO_WORDS = [
  ["Proxima Centauri b", "Proxima Cen b"],
  ["Alpha Centauri A", "Alpha Centauri A"],
  ["Alpha Centauri B", "Alpha Centauri B"],
  ["TRAPPIST-1 ?e", "TRAPPIST-1 e"],
  ["TRAPPIST-1 ?b", "TRAPPIST-1 b"],
  ["HD 189733 b", "HD 189733 b"],
  ["Kepler-16 b", "Kepler-16 b"],
  ["Kepler-90", "KOI-351"],
  ["KOI-351", "KOI-351"],
  ["TRAPPIST-1", "TRAPPIST-1"],
  ["HD 209458 b", "HD 209458 b"],
  ["TOI-700 d", "TOI-700 d"],
  ["Kepler-22 b", "Kepler-22 b"],
];
export const PLACE_WORDS = {
  en: [
    ...EXO_WORDS,
    ["Proxima b", "Proxima Cen b"], ["Proxima Centauri", "Proxima Cen"], ["Proxima", "Proxima Cen"],
    ["51 Pegasi b", "51 Peg b"], ["55 Cancri e", "55 Cnc e"],
    ["Sun", "Sun"], ["Mercury", "Mercury"], ["Venus", "Venus"], ["Earth", "Earth"], ["Mars", "Mars"], ["Jupiter", "Jupiter"], ["Saturn", "Saturn"],
    ["Uranus", "Uranus"], ["Neptune", "Neptune"], ["Ceres", "Ceres"], ["Pluto", "Pluto"],
    ["Io", "moon:Io"], ["Europa", "moon:Europa"], ["Ganymede", "moon:Ganymede"], ["Callisto", "moon:Callisto"],
  ],
  de: [
    ...EXO_WORDS,
    ["Proxima b", "Proxima Cen b"], ["Proxima Centauri", "Proxima Cen"], ["Proxima", "Proxima Cen"],
    ["51 Pegasi b", "51 Peg b"], ["55 Cancri e", "55 Cnc e"],
    ["(?<!(?:ohne|eine|keine) )Sonne", "Sun"], ["Merkurs?", "Mercury"], ["Venus", "Venus"], ["Erde", "Earth"], ["Mars", "Mars"], ["Jupiters?", "Jupiter"], ["Saturns?", "Saturn"],
    ["Uranus", "Uranus"], ["Neptuns?", "Neptune"], ["Ceres", "Ceres"], ["Plutos?", "Pluto"],
    ["Io", "moon:Io"], ["Europa", "moon:Europa"], ["Ganymed", "moon:Ganymede"], ["Kallisto", "moon:Callisto"],
  ],
  ja: [
    ...EXO_WORDS,
    ["プロキシマb", "Proxima Cen b"], ["プロキシマ", "Proxima Cen"], ["アルファ・ケンタウリA", "Alpha Centauri A"], ["アルファ・ケンタウリB", "Alpha Centauri B"],
    ["ペガスス座51番星b", "51 Peg b"], ["かに座55番星e", "55 Cnc e"],
    ["太陽(?!系|をもた|がある|が2つ)", "Sun"], ["水星", "Mercury"], ["金星", "Venus"], ["地球", "Earth"], ["火星", "Mars"], ["木星", "Jupiter"], ["土星", "Saturn"],
    ["天王星", "Uranus"], ["海王星", "Neptune"], ["ケレス", "Ceres"], ["冥王星", "Pluto"],
    ["エウロパ", "moon:Europa"], ["ガニメデ", "moon:Ganymede"], ["カリスト", "moon:Callisto"],
  ],
  bg: [
    ...EXO_WORDS,
    ["Проксима b", "Proxima Cen b"], ["Проксима Кентавър", "Proxima Cen"], ["Проксима", "Proxima Cen"],
    ["Алфа Кентавър A", "Alpha Centauri A"], ["Алфа Кентавър B", "Alpha Centauri B"], ["51 Пегас b", "51 Peg b"], ["55 Рак e", "55 Cnc e"],
    ["Слънце(?:то)?", "Sun"], ["Меркурий", "Mercury"], ["Венера", "Venus"], ["Земя(?:та)?", "Earth"], ["Марс", "Mars"], ["Юпитер", "Jupiter"], ["Сатурн", "Saturn"],
    ["Уран", "Uranus"], ["Нептун", "Neptune"], ["Церера", "Ceres"], ["Плутон", "Pluto"],
    ["Йо", "moon:Io"], ["Европа", "moon:Europa"], ["Ганимед", "moon:Ganymede"], ["Калисто", "moon:Callisto"],
  ],
};
// Japanese has no spaces between words, so a name there is found as it is; elsewhere a name is a whole word (not "Earth" in "Earth-sized",
// not "Sonne" in "Sonnensystem").
const placePattern = {};
function placeRegex(lang) {
  if (placePattern[lang]) return placePattern[lang];
  const words = PLACE_WORDS[lang] ?? PLACE_WORDS.en;
  const edge = lang === "ja" ? ["", ""] : ["(?<![\\p{L}\\p{N}-])", "(?![\\p{L}\\p{N}-])"];
  return (placePattern[lang] = new RegExp(words.map(([w]) => `${edge[0]}(${w})${edge[1]}`).join("|"), "gu"));
}
// A text cut into pieces: { text } and, for the first mention of each place, { text, place }. `seen` keeps the places already linked in the
// step, so that a place is a link once.
export function placePieces(text, lang, seen = new Set()) {
  const words = PLACE_WORDS[lang] ?? PLACE_WORDS.en;
  const re = placeRegex(lang);
  re.lastIndex = 0;
  const pieces = [];
  let at = 0;
  for (const m of text.matchAll(re)) {
    const i = m.slice(1).findIndex((g) => g !== undefined);
    const place = words[i][1];
    if (seen.has(place)) continue;
    seen.add(place);
    if (m.index > at) pieces.push({ text: text.slice(at, m.index) });
    pieces.push({ text: m[0], place });
    at = m.index + m[0].length;
  }
  if (at < text.length) pieces.push({ text: text.slice(at) });
  return pieces;
}
const pathOf = (step) => Object.keys(PATHS).find((p) => PATHS[p].steps.includes(step));

// From a place of the map to the step that fits it (the info panel of a place shows it, main.js): the bodies of the Solar System by name,
// the places of the steps (VIEWS and TASKS above), the other planets of Proxima Centauri by their star, and every other exoplanet by its kind:
// a candidate of the zone to the habitable zone, a rocky world or a mini-Neptune to the rocky worlds, a Neptune or a giant to the giants.
// The first step of the list that is not done yet wins; when all are done, the first.
const SOLAR_STEPS = {
  Sun: ["sun"], Mercury: ["inner"], Venus: ["inner", "habAtmos"], Earth: ["inner", "habWhat"], Mars: ["inner", "habIngredients"],
  Jupiter: ["outer", "moons", "habWater"], Saturn: ["outer"], Uranus: ["outer", "scale"], Neptune: ["outer", "scale"],
  Ceres: ["moons"], Pluto: ["moons"],
};
const HOST_STEPS = { "Proxima Cen": ["proxima", "neighbors"], "KOI-351": ["exoSystems"], "Kepler-16": ["exoFamous"] };
export function stepsForPlace({ name, host, solar, moon, habitable, radius }) {
  if (moon) return ["moons"];
  if (SOLAR_STEPS[name]) return SOLAR_STEPS[name];
  const own = Object.keys(VIEWS).filter((step) => (TASKS[step] === name || VIEWS[step] === name) && !solar);
  if (own.length) return own;
  if (solar) return [];
  if (HOST_STEPS[host]) return HOST_STEPS[host];
  if (habitable) return ["habZone"];
  if (radius == null) return ["exoWhat"];
  return radius <= 4 ? ["exoRocky"] : ["exoGiants"]; // the limits of planetType (story.js): up to 4 Earth radii rocky or a mini-Neptune
}
// The sources of each step, against which its texts, facts to remember and questions were checked (titles as on the pages).
export const SOURCES = {
  sun: [
    { label: "NASA Science: Sun, Facts", url: "https://science.nasa.gov/sun/facts/" },
    { label: "NASA NSSDCA: Sun Fact Sheet", url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html" },
  ],
  inner: [
    { label: "NASA Science: Planets", url: "https://science.nasa.gov/solar-system/planets/" },
    { label: "NASA Science: Venus, Facts", url: "https://science.nasa.gov/venus/facts/" },
    { label: "NASA Science: Mars, Facts", url: "https://science.nasa.gov/mars/facts/" },
  ],
  outer: [
    { label: "NASA Science: Planets", url: "https://science.nasa.gov/solar-system/planets/" },
    { label: "NASA Science: Jupiter, Facts", url: "https://science.nasa.gov/jupiter/facts/" },
    { label: "NASA Science: Saturn, Facts", url: "https://science.nasa.gov/saturn/facts/" },
    { label: "NASA Science: Neptune, Facts", url: "https://science.nasa.gov/neptune/facts/" },
  ],
  moons: [
    { label: "NASA Science: Moon, Facts", url: "https://science.nasa.gov/moon/facts/" },
    { label: "NASA Science: Ganymede", url: "https://science.nasa.gov/jupiter/jupiter-moons/ganymede/" },
    { label: "NASA Science: Pluto, Facts", url: "https://science.nasa.gov/dwarf-planets/pluto/facts/" },
    { label: "NASA Science: Ceres, Facts", url: "https://science.nasa.gov/dwarf-planets/ceres/facts/" },
  ],
  scale: [
    { label: "NASA Science: Neptune, Facts", url: "https://science.nasa.gov/neptune/facts/" },
    { label: "NASA Science: Asteroids, Facts", url: "https://science.nasa.gov/solar-system/asteroids/facts/" },
    { label: "NASA Science: Comets, Facts", url: "https://science.nasa.gov/solar-system/comets/facts/" },
    { label: "NASA Science: Planets", url: "https://science.nasa.gov/solar-system/planets/" },
  ],
  neighbors: [
    { label: "ESO: Planet Found in Habitable Zone Around Nearest Star (eso1629)", url: "https://www.eso.org/public/news/eso1629/" },
    { label: "NASA Science: Hubble's Best Image of Alpha Centauri A and B", url: "https://science.nasa.gov/missions/hubble/hubbles-best-image-of-alpha-centauri-a-and-b/" },
  ],
  pair: [
    { label: "NASA Science: Hubble's Best Image of Alpha Centauri A and B", url: "https://science.nasa.gov/missions/hubble/hubbles-best-image-of-alpha-centauri-a-and-b/" },
    { label: "NASA Science: Alpha Centauri A Planet Candidate (Webb)", url: "https://science.nasa.gov/asset/webb/alpha-centauri-a-planet-candidate-artists-concept/" },
  ],
  proxima: [
    { label: "ESO: Planet Found in Habitable Zone Around Nearest Star (eso1629)", url: "https://www.eso.org/public/news/eso1629/" },
    { label: "ESO: VLT to Search for Planets in Alpha Centauri System (eso1702)", url: "https://www.eso.org/public/news/eso1702/" },
  ],
  proximaB: [
    { label: "NASA Science: Proxima Centauri b", url: "https://science.nasa.gov/exoplanet-catalog/proxima-centauri-b/" },
    { label: "ESO: Planet Found in Habitable Zone Around Nearest Star (eso1629)", url: "https://www.eso.org/public/news/eso1629/" },
  ],
  travel: [
    { label: "NASA Science: Voyager 1", url: "https://science.nasa.gov/mission/voyager/voyager-1/" },
    { label: "ESO: Planet Found in Habitable Zone Around Nearest Star (eso1629)", url: "https://www.eso.org/public/news/eso1629/" },
  ],
  exoWhat: [
    { label: "NASA Science: What is an Exoplanet?", url: "https://science.nasa.gov/exoplanets/what-is-an-exoplanet/" },
    { label: "NASA Science: Nobel Winners Changed Our Understanding with Exoplanet Discovery", url: "https://science.nasa.gov/universe/exoplanets/nobel-winners-changed-our-understanding-with-exoplanet-discovery/" },
    { label: "NASA Science: Exoplanet Catalog", url: "https://science.nasa.gov/exoplanets/exoplanet-catalog/" },
  ],
  exoHow: [
    { label: "NASA Science: What's a Transit?", url: "https://science.nasa.gov/exoplanets/whats-a-transit/" },
    { label: "NASA Science: How We Find and Characterize", url: "https://science.nasa.gov/exoplanets/how-we-find-and-characterize/" },
  ],
  exoRocky: [
    { label: "NASA Science: Planet Types", url: "https://science.nasa.gov/exoplanets/planet-types/" },
    { label: "NASA Science: TRAPPIST-1", url: "https://science.nasa.gov/exoplanets/trappist1/" },
    { label: "NASA Science: TRAPPIST-1 e", url: "https://science.nasa.gov/exoplanet-catalog/trappist-1-e/" },
  ],
  exoGiants: [
    { label: "NASA Science: Planet Types", url: "https://science.nasa.gov/exoplanets/planet-types/" },
    { label: "NASA Science: 51 Pegasi b", url: "https://science.nasa.gov/exoplanet-catalog/51-pegasi-b/" },
    { label: "NASA Science: HD 209458 b", url: "https://science.nasa.gov/exoplanet-catalog/hd-209458-b/" },
  ],
  exoStrange: [
    { label: "NASA Science: 55 Cancri e", url: "https://science.nasa.gov/exoplanet-catalog/55-cancri-e/" },
    { label: "NASA Science: What is an Exoplanet?", url: "https://science.nasa.gov/exoplanets/what-is-an-exoplanet/" },
  ],
  nebWhat: [
    { label: "NASA Space Place: What Is a Nebula?", url: "https://spaceplace.nasa.gov/nebula/en/" },
  ],
  nebPillars: [
    { label: "NASA Science: Hubble Messier Catalog, Messier 16 (Eagle Nebula)", url: "https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-16/" },
    { label: "ESA/Webb: Pillars of Creation (2022)", url: "https://esawebb.org/images/weic2216a/" },
  ],
  nebDark: [
    { label: "ESA/Hubble: The Horsehead Nebula", url: "https://esahubble.org/images/heic1307a/" },
  ],
  nebRing: [
    { label: "NASA Science: Hubble Messier Catalog, Messier 57 (Ring Nebula)", url: "https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-57/" },
    { label: "NASA Science: Star Types", url: "https://science.nasa.gov/universe/stars/types/" },
  ],
  nebCrab: [
    { label: "NASA Science: Hubble Messier Catalog, Messier 1 (Crab Nebula)", url: "https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-1/" },
    { label: "NASA Space Place: What Is a Nebula?", url: "https://spaceplace.nasa.gov/nebula/en/" },
  ],
  mwWhat: [
    { label: "NASA Imagine the Universe: The Milky Way Galaxy", url: "https://imagine.gsfc.nasa.gov/features/cosmic/milkyway_info.html" },
    { label: "NASA Science: Galaxies", url: "https://science.nasa.gov/universe/galaxies/" },
    { label: "ESA: Our galaxy", url: "https://www.esa.int/what-we-do/explore-discover-space/our-galaxy" },
  ],
  mwArm: [
    { label: "NASA Science: The Milky Way Galaxy", url: "https://science.nasa.gov/resource/the-milky-way-galaxy/" },
    { label: "NASA Imagine the Universe: The Milky Way Galaxy", url: "https://imagine.gsfc.nasa.gov/features/cosmic/milkyway_info.html" },
    { label: "NASA Science: Galaxies", url: "https://science.nasa.gov/universe/galaxies/" },
  ],
  mwOrbit: [
    { label: "NASA Science: Sun Facts", url: "https://science.nasa.gov/sun/facts/" },
    { label: "NASA Science: Galaxies", url: "https://science.nasa.gov/universe/galaxies/" },
    { label: "ESA: Our galaxy", url: "https://www.esa.int/what-we-do/explore-discover-space/our-galaxy" },
  ],
  mwBand: [
    { label: "NASA Science: Galaxies", url: "https://science.nasa.gov/universe/galaxies/" },
  ],
  mwGaia: [
    { label: "ESA: Gaia", url: "https://www.esa.int/Science_Exploration/Space_Science/Gaia" },
    { label: "ESA: Gaia Data Release 3", url: "https://www.cosmos.esa.int/web/gaia/dr3" },
  ],
  locGroup: [
    { label: "NASA Science: Galaxies", url: "https://science.nasa.gov/universe/galaxies/" },
    { label: "NASA Science: Hubble Messier Catalog, Messier 33 (Triangulum Galaxy)", url: "https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-33/" },
  ],
  locMagellan: [
    { label: "ESA/Hubble: Hubble casts doubt on certainty of galactic collision (2025)", url: "https://esahubble.org/news/heic2508/" },
    { label: "ESA/Hubble: the Small Magellanic Cloud (2025)", url: "https://esahubble.org/news/heic2502/" },
  ],
  locAndromeda: [
    { label: "NASA Science: Hubble Messier Catalog, Messier 31 (Andromeda Galaxy)", url: "https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/" },
  ],
  locApproach: [
    { label: "NASA: Hubble Shows Milky Way is Destined for Head-on Collision (2012)", url: "https://science.nasa.gov/missions/hubble/nasas-hubble-shows-milky-way-is-destined-for-head-on-collision/" },
  ],
  locFuture: [
    { label: "ESA/Hubble: Hubble casts doubt on certainty of galactic collision (2025)", url: "https://esahubble.org/news/heic2508/" },
    { label: "NASA: Hubble Shows Milky Way is Destined for Head-on Collision (2012)", url: "https://science.nasa.gov/missions/hubble/nasas-hubble-shows-milky-way-is-destined-for-head-on-collision/" },
  ],
  nsWhat: [
    { label: "NASA Imagine the Universe: Neutron Stars", url: "https://imagine.gsfc.nasa.gov/science/objects/neutron_stars1.html" },
    { label: "NASA Science: Star Types", url: "https://science.nasa.gov/universe/stars/types/" },
  ],
  nsPulsar: [
    { label: "NASA Imagine the Universe: Neutron Stars", url: "https://imagine.gsfc.nasa.gov/science/objects/neutron_stars1.html" },
    { label: "NASA Science: Exoplanet Catalog, PSR B1257+12 b", url: "https://science.nasa.gov/exoplanet-catalog/psr-b125712-b/" },
  ],
  bhWhat: [
    { label: "NASA Science: Black Holes", url: "https://science.nasa.gov/universe/black-holes/" },
    { label: "NASA Science: Black Hole Types", url: "https://science.nasa.gov/universe/black-holes/types/" },
  ],
  bhCenter: [
    { label: "NASA Science: Black Hole Types", url: "https://science.nasa.gov/universe/black-holes/types/" },
    { label: "NASA Science: Black Holes", url: "https://science.nasa.gov/universe/black-holes/" },
    { label: "ESO: Astronomers reveal first image of the black hole at the heart of our galaxy (2022)", url: "https://www.eso.org/public/news/eso2208-eht-mw/" },
  ],
  bhImage: [
    { label: "ESO: Astronomers Capture First Image of a Black Hole (2019)", url: "https://www.eso.org/public/news/eso1907/" },
    { label: "ESO: Astronomers reveal first image of the black hole at the heart of our galaxy (2022)", url: "https://www.eso.org/public/news/eso2208-eht-mw/" },
  ],
  lifeMain: [
    { label: "NASA Science: Stars", url: "https://science.nasa.gov/universe/stars/" },
    { label: "NASA Science: Star Types", url: "https://science.nasa.gov/universe/stars/types/" },
    { label: "NASA Imagine the Universe: Stars", url: "https://imagine.gsfc.nasa.gov/science/objects/stars1.html" },
  ],
  lifeMass: [
    { label: "NASA Imagine the Universe: Stars", url: "https://imagine.gsfc.nasa.gov/science/objects/stars1.html" },
    { label: "NASA Science: Stars", url: "https://science.nasa.gov/universe/stars/" },
  ],
  lifeGiant: [
    { label: "NASA Science: Stars", url: "https://science.nasa.gov/universe/stars/" },
    { label: "NASA Science: Star Types", url: "https://science.nasa.gov/universe/stars/types/" },
  ],
  lifeWhite: [
    { label: "NASA Science: Star Types", url: "https://science.nasa.gov/universe/stars/types/" },
    { label: "NASA Imagine the Universe: Stars", url: "https://imagine.gsfc.nasa.gov/science/objects/stars1.html" },
  ],
  lifeNova: [
    { label: "NASA Science: Black Hole Types", url: "https://science.nasa.gov/universe/black-holes/types/" },
    { label: "NASA Imagine the Universe: Stars", url: "https://imagine.gsfc.nasa.gov/science/objects/stars1.html" },
    { label: "NASA Imagine the Universe: Supernovae", url: "https://imagine.gsfc.nasa.gov/science/objects/supernovae1.html" },
    { label: "NASA Imagine the Universe: Supernovae (advanced)", url: "https://imagine.gsfc.nasa.gov/science/objects/supernovae2.html" },
    { label: "NASA Science: Stars", url: "https://science.nasa.gov/universe/stars/" },
  ],
  birthCloud: [
    { label: "NASA Science: Stars", url: "https://science.nasa.gov/universe/stars/" },
    { label: "NASA Science: Hubble Messier Catalog, Messier 42 (Orion Nebula)", url: "https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-42/" },
  ],
  birthProto: [
    { label: "NASA Science: Stars", url: "https://science.nasa.gov/universe/stars/" },
    { label: "NASA: TESS, Spitzer Missions Discover a World Orbiting a Unique Young Star (AU Mic, 2020)", url: "https://www.nasa.gov/universe/nasas-tess-spitzer-missions-discover-a-world-orbiting-a-unique-young-star/" },
  ],
  birthDisk: [
    { label: "NASA: TESS, Spitzer Missions Discover a World Orbiting a Unique Young Star (AU Mic, 2020)", url: "https://www.nasa.gov/universe/nasas-tess-spitzer-missions-discover-a-world-orbiting-a-unique-young-star/" },
    { label: "NASA Science: Planetary Systems", url: "https://science.nasa.gov/universe/stars/planetary-system/" },
    { label: "ESO: First Confirmed Image of Newborn Planet Caught with ESO's VLT (2018)", url: "https://www.eso.org/public/news/eso1821/" },
    { label: "ESO: Astronomers make first clear detection of a moon-forming disc around an exoplanet (2021)", url: "https://www.eso.org/public/news/eso2111/" },
  ],
  birthCluster: [
    { label: "NASA Science: Stars", url: "https://science.nasa.gov/universe/stars/" },
    { label: "NASA Science: Hubble Messier Catalog, Messier 45 (Pleiades)", url: "https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-45/" },
  ],
  birthSun: [
    { label: "NASA Science: Sun Facts", url: "https://science.nasa.gov/sun/facts/" },
  ],
  starWhat: [
    { label: "NASA Science: Stars", url: "https://science.nasa.gov/universe/stars/" },
    { label: "NASA Imagine the Universe: Stars", url: "https://imagine.gsfc.nasa.gov/science/objects/stars1.html" },
    { label: "NASA Science: Sun Facts", url: "https://science.nasa.gov/sun/facts/" },
  ],
  starColor: [
    { label: "NASA Science: Stars in an Exoplanet World", url: "https://science.nasa.gov/exoplanets/stars/" },
    { label: "NASA Science: Sun Facts", url: "https://science.nasa.gov/sun/facts/" },
  ],
  starClass: [
    { label: "NASA Science: Stars in an Exoplanet World", url: "https://science.nasa.gov/exoplanets/stars/" },
  ],
  starSize: [
    { label: "NASA Science: Star Types", url: "https://science.nasa.gov/universe/stars/types/" },
    { label: "NASA Science: Stars in an Exoplanet World", url: "https://science.nasa.gov/exoplanets/stars/" },
  ],
  starHosts: [
    { label: "NASA Science: Stars in an Exoplanet World", url: "https://science.nasa.gov/exoplanets/stars/" },
  ],
  nameLetters: [
    { label: "NASA Science: How do exoplanets get their names?", url: "https://science.nasa.gov/exoplanets/how-do-exoplanets-get-their-names/" },
  ],
  nameStars: [
    { label: "NASA Science: How do exoplanets get their names?", url: "https://science.nasa.gov/exoplanets/how-do-exoplanets-get-their-names/" },
  ],
  nameGreek: [
    { label: "IAU: The Constellations", url: "https://www.iau.org/IAU/IAU/Astronomy-FAQs/Constellations.aspx" },
  ],
  nameCatalog: [
    { label: "NASA Science: How do exoplanets get their names?", url: "https://science.nasa.gov/exoplanets/how-do-exoplanets-get-their-names/" },
    { label: "NASA HEASARC: Gliese Catalog of Nearby Stars, 3rd Edition", url: "https://heasarc.gsfc.nasa.gov/W3Browse/star-catalog/cns3.html" },
    { label: "ESA: Hipparcos catalogues", url: "https://www.cosmos.esa.int/web/hipparcos/catalogues" },
    { label: "NASA Science: Space Telescope Delivers the Goods: 2,200 Possible Planets (TOI)", url: "https://science.nasa.gov/universe/exoplanets/space-telescope-delivers-the-goods-2200-possible-planets/" },
    { label: "NASA JPL: New Clues to Compositions of TRAPPIST-1 Planets", url: "https://www.jpl.nasa.gov/news/new-clues-to-compositions-of-trappist-1-planets/" },
  ],
  nameStories: [
    { label: "NASA StarChild: The Planets", url: "https://starchild.gsfc.nasa.gov/docs/StarChild/solar_system_level2/planets.html" },
    { label: "NASA Science: How do exoplanets get their names?", url: "https://science.nasa.gov/exoplanets/how-do-exoplanets-get-their-names/" },
    { label: "IAU: Selects Names for 20 Exoplanetary Systems (2023)", url: "https://www.iau.org/IAU/IAU/News/PR2023/iau-names-exoplanetary-systems.aspx" },
    { label: "IAU: Frequently Asked Questions (Can I buy a star?)", url: "https://www.iau.org/IAU/Astronomy-FAQs/FAQs.aspx" },
  ],
  zodWhat: [
    { label: "NASA Space Place: What Are Constellations?", url: "https://spaceplace.nasa.gov/constellations/en/" },
  ],
  zodPath: [
    { label: "NASA Space Place: What Are Constellations?", url: "https://spaceplace.nasa.gov/constellations/en/" },
  ],
  zodShift: [
    { label: "NASA Science: Milankovitch (Orbital) Cycles and Their Role in Earth's Climate", url: "https://science.nasa.gov/science-research/earth-science/climate-science/milankovitch-orbital-cycles-and-their-role-in-earths-climate/" },
  ],
  zodScience: [
    { label: "NASA Space Place: What Are Constellations?", url: "https://spaceplace.nasa.gov/constellations/en/" },
  ],
  zodLight: [
    { label: "NASA Space Place: What Are Constellations?", url: "https://spaceplace.nasa.gov/constellations/en/" },
  ],
  exoSystems: [
    { label: "NASA Science: TRAPPIST-1", url: "https://science.nasa.gov/exoplanets/trappist1/" },
    { label: "NASA: Artificial Intelligence, NASA Data Used to Discover Eighth Planet Circling Distant Star (2017)", url: "https://www.nasa.gov/news-release/artificial-intelligence-nasa-data-used-to-discover-eighth-planet-circling-distant-star/" },
  ],
  exoFamous: [
    { label: "NASA Science: HD 189733 b", url: "https://science.nasa.gov/exoplanet-catalog/hd-189733-b/" },
    { label: "Center for Astrophysics, Harvard & Smithsonian: From Star Wars to Science Fact, Tatooine-like Planet Discovered (2011)", url: "https://www.cfa.harvard.edu/news/star-wars-science-fact-tatooine-planet-discovered" },
  ],
  habWhat: [
    { label: "NASA Science: Habitable Zone", url: "https://science.nasa.gov/exoplanets/habitable-zone/" },
    { label: "NASA Science: Can We Find Life?", url: "https://science.nasa.gov/exoplanets/can-we-find-life/" },
  ],
  habZone: [
    { label: "NASA Science: Habitable Zone", url: "https://science.nasa.gov/exoplanets/habitable-zone/" },
    { label: "NASA Science: TOI-700 d", url: "https://science.nasa.gov/exoplanet-catalog/toi-700-d/" },
  ],
  habWater: [
    { label: "USGS Water Science School: The Water in You", url: "https://www.usgs.gov/special-topics/water-science-school/science/water-you-water-and-human-body" },
    { label: "NASA Science: Europa", url: "https://science.nasa.gov/jupiter/jupiter-moons/europa/" },
    { label: "NASA Science: Enceladus", url: "https://science.nasa.gov/saturn/moons/enceladus/" },
  ],
  habAtmos: [
    { label: "NASA Science: Venus, Facts", url: "https://science.nasa.gov/venus/facts/" },
    { label: "NASA Science: Mars, Facts", url: "https://science.nasa.gov/mars/facts/" },
  ],
  habIngredients: [
    { label: "NASA: NASA Finds Ancient Organic Material, Mysterious Methane on Mars (2018)", url: "https://www.nasa.gov/news-release/nasa-finds-ancient-organic-material-mysterious-methane-on-mars/" },
  ],
  habExtreme: [
    { label: "NASA Science: NASA-Funded Research Finds Complex Life Defying Record Heat (2026)", url: "https://science.nasa.gov/science-research/planetary-science/astrobiology/nasa-funded-research-finds-complex-life-defying-record-heat/" },
    { label: "NOAA Ocean Exploration: What is the difference between cold seeps and hydrothermal vents?", url: "https://oceanexplorer.noaa.gov/ocean-fact/seeps-vents/" },
  ],
  habLife: [
    { label: "NASA Science: Can We Find Life?", url: "https://science.nasa.gov/exoplanets/can-we-find-life/" },
    { label: "NASA Science: Exoplanet Catalog", url: "https://science.nasa.gov/exoplanets/exoplanet-catalog/" },
  ],
};
// The years of the planets of the path Exoplanets, in days, from the catalogue of the map (NASA Exoplanet Archive, web/data/stars.json).
const EXO_DAYS = { trappist: 6.101013, trappistB: 1.510826, peg: 4.2307966, cancri: 0.7365474, toi: 37.423457, kepler16: 228.776 };
// The rocks of Gale crater in which Curiosity found organic molecules: about three billion years old (NASA, 2018).
const GALE_ROCK_YEARS = 3e9;
const EUROPA_DAYS = MOONS.Jupiter.find((m) => m.id === "Europa").days; // NASA Jovian Satellite Fact Sheet (moons.js)
// The numbers of Alpha Centauri: the distance of Proxima and the year of Proxima b as in the map (NASA Exoplanet Archive, web/data/stars.json;
// NASA and ESO round them to 4.2 light years and 11.2 days), the speed of Voyager 1 from NASA (17.0 km/s, August 2024). The time of the trip
// is worked out from them: about 74,800 years, "about 75,000" in the texts.
export const PROXIMA_LY = 4.24;
export const PROXIMA_B_DAYS = 11.18465;
const VOYAGER_KMS = 17.0;
export const TRAVEL_YEARS = (PROXIMA_LY * 9.4607e12) / VOYAGER_KMS / (365.25 * 86400);
const REFERENCE_AGE = 30; // without a year of birth, the sentences speak of a person of 30
const MOON_DAYS = MOONS.Earth[0].days;

// The visitor's numbers. ctx: { age (years, or null), years: { Mercury, Mars, Jupiter } (their year in Earth years), star: { name, dist, year } or null,
// birthYear (or null), discoveries: [[year, method, candidate], ...] of the planets of the catalogue, thisYear }.
export function personalNumbers(ctx) {
  const age = ctx.age ?? REFERENCE_AGE;
  return {
    you: ctx.age != null,
    orbits: Math.floor(age), // full trips round the Sun
    mars: Math.round(age / ctx.years.Mars), // the age on Mars, rounded as on the tiles of "your age on the planets"
    mercury: Math.round(age / ctx.years.Mercury),
    jupiterLaps: Math.floor(age / ctx.years.Jupiter),
    moonLaps: Math.floor((age * 365.25) / MOON_DAYS),
    star: ctx.age != null ? ctx.star ?? null : null,
    // Alpha Centauri
    proximaLeft: age >= 5 ? Math.floor(age - PROXIMA_LY) : null, // how old the visitor was when the light of Proxima set off (none for a small child)
    lapShare: Math.round((age / 80) * 100), // the share of one lap of A and B round each other, in %
    lightTrips: Math.floor(age / PROXIMA_LY), // how often light could have come from Proxima to us
    proximaBAge: Math.round((age * 365.25) / PROXIMA_B_DAYS), // the age on Proxima b
    lifetimes: Math.round(TRAVEL_YEARS / Math.max(age, 1)), // the trip at the speed of Voyager 1, in lives so far
    // Exoplanets: what the catalogue knew in the year of the birth (or 30 years ago), and the age on three of its planets
    ...exoNumbers(ctx, age),
    ...zodNumbers(ctx),
    ...nameNumbers(ctx, age),
    ...starNumbers(ctx),
    ...birthNumbers(ctx, age),
    sunYearSeconds: (age / SUN_MAIN_YEARS) * 365.25 * 86400, // the visitor's life if the Sun's 10 billion years were one year
    giantLives: twoDigits(SUN_GIANT_IN / Math.max(age, 1)),
    ...compactNumbers(ctx, age),
    ...galaxyNumbers(ctx, age),
  };
}
// Part III: nebulae, the Milky Way and its neighbours, against the visitor's life. The distances and years are those of the sources of the
// steps (NASA, ESA): the Orion Nebula 1,500 light years, the Webb image of the Pillars of Creation 2022, the Horsehead 1,300, the Ring
// Nebula 2,000, the supernova of the Crab Nebula 1054, the Milky Way 100,000 light years across, the Sun 8 kpc (about 26,000 light years)
// from its centre at 720,000 km/h, one lap 230 million years, Gaia DR3 2022, the Small Magellanic Cloud 200,000 light years, Andromeda
// 2.5 million, Triangulum 3 million, Andromeda coming closer at 250,000 miles an hour, the collision of the 2012 forecast in 4 billion years.
const KM_PER_HOUR_YEAR = 24 * 365.25;
function galaxyNumbers(ctx, age) {
  const thisYear = ctx.thisYear ?? new Date().getFullYear();
  const born = ctx.age != null ? ctx.birthYear ?? thisYear - Math.floor(age) : null;
  const since = (year) => (born != null ? born - year : null); // years an event came before the birth (below 0: at that age)
  return {
    orionShare: (age / 1500) * 100,
    webbBefore: since(2022),
    webbAgo: thisYear - 2022,
    horseYear: thisYear - 1300,
    ringTimes: Math.round(2000 / Math.max(age, 1)),
    crabBefore: since(1054),
    crabAgo: thisYear - 1054,
    mwShare: (age / 100000) * 100,
    centerShare: (age / 26000) * 100,
    sunKm: twoDigits(720000 * KM_PER_HOUR_YEAR * age) / 1e9, // in billions of km
    lapTimes: twoDigits(230e6 / Math.max(age, 1)),
    gaiaBefore: since(2022),
    gaiaAgo: thisYear - 2022,
    smcTimes: twoDigits(200000 / Math.max(age, 1)),
    andTimes: twoDigits(2.5e6 / Math.max(age, 1)),
    m33Times: twoDigits(3e6 / Math.max(age, 1)),
    andKm: twoDigits(250000 * 1.609344 * KM_PER_HOUR_YEAR * age) / 1e9, // in billions of km
    collideTimes: twoDigits(4e9 / Math.max(age, 1)),
  };
}
// Neutron stars and black holes: the blinks of a pulsar that blinks once a second, over the visitor's life (worked out), the light of the
// region of Sagittarius A* (about 27,000 light years, ESO) against the visitor's life, and the year of the first image of a black hole
// (2019, ESO).
const SGR_A_LY = 27000;
const EHT_IMAGE = 2019;
function compactNumbers(ctx, age) {
  const thisYear = ctx.thisYear ?? new Date().getFullYear();
  const born = ctx.age != null ? ctx.birthYear ?? thisYear - Math.floor(age) : null;
  return {
    pulsarBlinks: twoDigits(age * 365.25 * 86400),
    sgrBefore: Math.round(SGR_A_LY - age),
    ehtBefore: born != null ? born - EHT_IMAGE : null, // years the image was shown before the birth (below 0: at that age)
    ehtAgo: thisYear - EHT_IMAGE,
  };
}
// Life and death of stars: about 10 billion years of the Sun on the main sequence (NASA Imagine), a red giant in about 5 billion years
// (NASA), white dwarfs from stars up to about 7 times the mass of the Sun (NASA Imagine), a supernova above 8 (NASA; Imagine says 7)
const SUN_MAIN_YEARS = 1e10;
const SUN_GIANT_IN = 5e9;
export const fateOf = (mass) => (mass == null ? null : mass <= 7 ? "white" : mass > 8 ? "nova" : "edge");
// The birth of stars: the light of the Orion Nebula (about 1,500 light years, NASA) and of the Pleiades (roughly 445, NASA) against the
// visitor's life, the age of AU Mic (20 to 30 million years, NASA: its middle, 25) as a multiple of the visitor's age, the year PDS 70 b
// was photographed (2018, ESO), and the age of the Sun (4.6 billion years, NASA) as one day.
const ORION_LY = 1500;
const PLEIADES_LY = 445;
const AU_MIC_YEARS = 25e6;
const PDS_SEEN = 2018;
const SUN_YEARS = 4.6e9;
// a big number rounded to its first two digits (806,452 to 810,000)
const twoDigits = (x) => {
  const p = 10 ** Math.max(0, Math.floor(Math.log10(x)) - 1);
  return Math.round(x / p) * p;
};
function birthNumbers(ctx, age) {
  const thisYear = ctx.thisYear ?? new Date().getFullYear();
  const born = ctx.age != null ? ctx.birthYear ?? thisYear - Math.floor(age) : null;
  return {
    orionBefore: Math.round(ORION_LY - age),
    auMicTimes: twoDigits(AU_MIC_YEARS / Math.max(age, 1)),
    pdsBefore: born != null ? born - PDS_SEEN : null, // years the planet was photographed before the birth (below 0: at that age)
    pdsAgo: thisYear - PDS_SEEN,
    pleiadesYear: thisYear - PLEIADES_LY,
    pleiadesBefore: born != null ? born - (thisYear - PLEIADES_LY) : null,
    sunDayMs: (age / SUN_YEARS) * 86400 * 1000,
  };
}
// Understanding stars: the temperature, the radius and the spectral type of the visitor's star, from the NASA table of the map
// (ctx.starInfo(host): { teff in kelvin, rad in radii of the Sun, spec }, main.js). Without a year of birth the sentences speak of Proxima
// Centauri, with its values from the same table (PROXIMA_INFO).
export const PROXIMA_INFO = { teff: 2900, rad: 0.141, spec: "M5.5 V", mass: 0.1221 };
const SUN_SURFACE_C = 5500; // NASA, Sun Facts: "a relatively cool 10,000 °F (5,500 °C)"
function starNumbers(ctx) {
  const name = ctx.age != null ? ctx.star?.name ?? null : null;
  const info = name ? ctx.starInfo?.(name) ?? null : null;
  return { starName: name, starTeff: info?.teff ?? null, starRad: info?.rad ?? null, starSpec: info?.spec ?? null, starMass: info?.mass ?? null };
}
// The class of a spectral type: its first letter (O, B, A, F, G, K, M), or null
export const starClassOf = (spec) => /^[OBAFGKM]/.exec(spec ?? "")?.[0] ?? null;
// A temperature in kelvin as degrees Celsius, rounded to hundreds (the table gives kelvin; 0 °C is 273.15 K)
export const celsius = (k) => Math.round((k - 273.15) / 100) * 100;
// Names in space: the name of the visitor's star ("Your star", from the year of birth) and the planets the NASA table knows round it
// (ctx.planetsOf(host), main.js); without a year of birth Proxima Centauri. The light of Alpha Centauri A and B (4.37 light years, as in the
// lines of the neighbourhood) and the year 51 Pegasi b was found (1995, NASA), against the visitor's age.
const ALPHA_CEN_LY = 4.37;
const PEG_FOUND = 1995;
function nameNumbers(ctx, age) {
  const star = ctx.age != null ? ctx.star?.name ?? null : null;
  const thisYear = ctx.thisYear ?? new Date().getFullYear();
  const born = ctx.age != null ? ctx.birthYear ?? thisYear - Math.floor(age) : null;
  return {
    nameStar: star,
    namePlanets: (ctx.planetsOf?.(star ?? "Proxima Cen") ?? []).slice().sort(),
    alphaLeft: age >= ALPHA_CEN_LY ? Math.floor(age - ALPHA_CEN_LY) : null,
    pegBefore: born != null ? born - PEG_FOUND : null, // years the planet was found before the birth (below 0: at that age)
    pegAgo: thisYear - PEG_FOUND,
  };
}
// The catalogue at the front of a star's name (the ones the step explains), or null
export function catalogOf(name) {
  if (!name) return null;
  if (/^HD\s/.test(name)) return "HD";
  if (/^(GJ|Gl|Gliese)\s/.test(name)) return "GJ";
  if (/^HIP\s/.test(name)) return "HIP";
  if (/^TOI-/.test(name)) return "TOI";
  if (/^Kepler-/.test(name)) return "Kepler";
  if (/^TRAPPIST-/.test(name)) return "TRAPPIST";
  return null;
}
// The Latin genitive of the constellations of the Sun's path (IAU, The Constellations): "Alpha Tauri" is the alpha of Taurus
export const GENITIVE = {
  Ari: "Arietis", Tau: "Tauri", Gem: "Geminorum", Cnc: "Cancri", Leo: "Leonis", Vir: "Virginis", Lib: "Librae", Sco: "Scorpii", Oph: "Ophiuchi",
  Sgr: "Sagittarii", Cap: "Capricorni", Aqr: "Aquarii", Psc: "Piscium",
};
// Constellations and zodiac signs: from the date of birth (ctx.birthDate { year, month, day }, kept in this browser) the constellation the Sun
// stood in and the sign of astrology; without a date an example, the 1st of April (sign Aries, the Sun in Pisces). ctx.figureInfo(id): the
// nearest and the farthest star of the figure in light years, from the map (main.js); a distance above 10,000 light years is only the floor
// of a tiny parallax (src/build_constellation_stars.py) and is not shown.
function zodNumbers(ctx) {
  const b = ctx.birthDate ?? null;
  const month = b?.month ?? 4;
  const day = b?.day ?? 1;
  const real = sunConstellation(month, day);
  const sign = tropicalSign(sunLongitude(new Date(Date.UTC(b?.year ?? 2000, month - 1, day, 12)))).id;
  const info = ctx.figureInfo?.(real) ?? null;
  return { zodYou: !!b, zodReal: real, zodSign: sign, zodNear: info?.near ?? null, zodFar: info?.far != null && info.far < 10000 ? info.far : null };
}
// The names of the constellations of the Sun's path (the 12 of the zodiac and Ophiuchus), as the map shows them: English and Bulgarian in Latin
export const ZOD_NAMES = {
  Ari: ["Aries", "Widder", "おひつじ座", "Aries"], Tau: ["Taurus", "Stier", "おうし座", "Taurus"], Gem: ["Gemini", "Zwillinge", "ふたご座", "Gemini"],
  Cnc: ["Cancer", "Krebs", "かに座", "Cancer"], Leo: ["Leo", "Löwe", "しし座", "Leo"], Vir: ["Virgo", "Jungfrau", "おとめ座", "Virgo"],
  Lib: ["Libra", "Waage", "てんびん座", "Libra"], Sco: ["Scorpius", "Skorpion", "さそり座", "Scorpius"], Oph: ["Ophiuchus", "Schlangenträger", "へびつかい座", "Ophiuchus"],
  Sgr: ["Sagittarius", "Schütze", "いて座", "Sagittarius"], Cap: ["Capricornus", "Steinbock", "やぎ座", "Capricornus"], Aqr: ["Aquarius", "Wassermann", "みずがめ座", "Aquarius"],
  Psc: ["Pisces", "Fische", "うお座", "Pisces"],
};
const zodName = (id, lang) => ZOD_NAMES[id]?.[Math.max(0, ["en", "de", "ja", "bg"].indexOf(lang))] ?? id;
function exoNumbers(ctx, age) {
  const thisYear = ctx.thisYear ?? new Date().getFullYear();
  const born = ctx.age != null ? ctx.birthYear ?? thisYear - Math.floor(age) : thisYear - REFERENCE_AGE;
  const found = ctx.discoveries ?? [];
  return {
    birthYear: born,
    knownAtBirth: found.filter(([year]) => year <= born).length,
    knownNow: found.length,
    transitSince: found.filter(([year, method]) => year >= born && method === "Transit").length,
    trappistAge: Math.round((age * 365.25) / EXO_DAYS.trappist),
    pegAge: Math.round((age * 365.25) / EXO_DAYS.peg),
    cancriAge: Math.round((age * 365.25) / EXO_DAYS.cancri),
    trappistBLaps: Math.floor((age * 365.25) / EXO_DAYS.trappistB),
    kepler16Age: Math.round((age * 365.25) / EXO_DAYS.kepler16),
    rockFactor: Math.round(GALE_ROCK_YEARS / age / 1e6) * 1e6, // how many times as old as the visitor, in whole millions
    // the search for habitable worlds: the candidates of the map (in a habitable zone, see the rule of stars.json) then and now, and three ages
    candidatesAtBirth: found.filter(([year, , candidate]) => candidate && year <= born).length,
    candidatesNow: found.filter(([, , candidate]) => candidate).length,
    toiAge: Math.round((age * 365.25) / EXO_DAYS.toi),
    europaLaps: Math.floor((age * 365.25) / EUROPA_DAYS),
    venusAge: Math.round(age / (ctx.years.Venus ?? 0.615)),
  };
}

// Two wrong answers near a right number: different from it and from each other, never below 0.
export function distractors(n) {
  const out = [];
  for (const d of [Math.round(n * 2), Math.round(n / 2), n + Math.max(2, Math.round(n * 0.3)), n - Math.max(2, Math.round(n * 0.3)), n + 7, n + 13])
    if (d >= 0 && d !== n && !out.includes(d)) out.push(d);
  return out.slice(0, 2);
}

// A fixed order for a seed: the options of a question keep their places when the panel is drawn again.
function hash(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.codePointAt(0), 16777619);
  return h >>> 0;
}
export function seededOrder(items, seed) {
  return items
    .map((item, i) => ({ item, key: hash(`${seed}:${i}`) }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.item);
}

// The questions of each step: a fact (texts in LEARN_TEXT.q: the first option is the right one) or a personal number.
export const QUESTIONS = {
  sun: [{ id: "sunLight" }, { id: "sunEnergy" }, { id: "sunOrbits", number: "orbits" }],
  inner: [{ id: "venusDay" }, { id: "marsAge", number: "mars" }, { id: "closest" }],
  outer: [{ id: "largest" }, { id: "saturnDensity" }, { id: "jupiterLaps", number: "jupiterLaps" }],
  moons: [{ id: "largestMoon" }, { id: "galileo" }, { id: "sameSide" }, { id: "dwarf" }, { id: "moonLaps", number: "moonLaps" }],
  scale: [{ id: "neptune" }, { id: "starLight", number: "starLight" }, { id: "sunSize" }, { id: "asteroidBelt" }, { id: "cometTail" }],
  // Alpha Centauri; a personal number that does not exist (a small child) takes its fallback question
  neighbors: [{ id: "nearestStar" }, { id: "lightYear" }, { id: "proximaLeft", number: "proximaLeft", fallback: "proximaLight" }],
  pair: [{ id: "pairPeriod" }, { id: "pairSun" }, { id: "constellation" }],
  proxima: [{ id: "redDwarf" }, { id: "proximaEye" }, { id: "thirdStar" }, { id: "lightTrips", number: "lightTrips" }],
  proximaB: [{ id: "proximaBYear" }, { id: "habitable" }, { id: "howFound" }, { id: "proximaBAge", number: "proximaBAge" }],
  travel: [{ id: "voyagerSpeed" }, { id: "travelTime" }, { id: "lifetimes", number: "lifetimes" }],
  // Exoplanets
  exoWhat: [{ id: "exoDefinition" }, { id: "firstSunLike" }, { id: "firstPulsar" }, { id: "knownAtBirth", number: "knownAtBirth" }],
  exoHow: [{ id: "transitDim" }, { id: "wobble" }, { id: "mostMethod" }, { id: "transitSince", number: "transitSince" }],
  exoRocky: [{ id: "superEarth" }, { id: "terrestrialMade" }, { id: "trappistSeven" }, { id: "trappistAge", number: "trappistAge" }],
  exoGiants: [{ id: "hotJupiter" }, { id: "pegYear" }, { id: "gasGiantSize" }, { id: "pegAge", number: "pegAge" }],
  exoStrange: [{ id: "lavaWorld" }, { id: "rogue" }, { id: "keplerScope" }, { id: "cancriAge", number: "cancriAge" }],
  // Nebulae
  nebWhat: [{ id: "nebulaWhat" }, { id: "nebulaDeath" }, { id: "nebulaBirth" }],
  nebPillars: [{ id: "pillarsWhere" }, { id: "pillarsDist" }, { id: "pillarsWebb" }],
  nebDark: [{ id: "horseType" }, { id: "horseWhere" }, { id: "horseDist" }],
  nebRing: [{ id: "ringType" }, { id: "ringWhere" }, { id: "ringFrom" }],
  nebCrab: [{ id: "crabType" }, { id: "crabYear" }, { id: "crabCore" }],
  // The Milky Way
  mwWhat: [{ id: "mwShape" }, { id: "mwSize" }, { id: "mwStars" }],
  mwArm: [{ id: "orionArm" }, { id: "armBetween" }, { id: "centerDist" }],
  mwOrbit: [{ id: "lapTime" }, { id: "sunSpeed" }, { id: "lapDiffer" }],
  mwBand: [{ id: "bandWhat" }, { id: "bandEdge" }, { id: "bandDir" }],
  mwGaia: [{ id: "gaiaWhat" }, { id: "gaiaCount" }, { id: "gaiaEnd" }],
  // The galactic neighbourhood
  locGroup: [{ id: "localGroup" }, { id: "groupCount" }, { id: "m33Third" }],
  locMagellan: [{ id: "lmcSat" }, { id: "smcDist" }, { id: "smcWhere" }],
  locAndromeda: [{ id: "andDist" }, { id: "andEye" }, { id: "andWhere" }],
  locApproach: [{ id: "andSpeed" }, { id: "collide2012" }, { id: "merge2012" }],
  locFuture: [{ id: "chance2025" }, { id: "dataNew" }, { id: "scienceChange" }],
  // Neutron stars and black holes
  nsWhat: [{ id: "nsForm" }, { id: "nsSize" }, { id: "nsSugar" }],
  nsPulsar: [{ id: "pulsarWhat" }, { id: "lighthouse" }, { id: "pulseTime" }],
  bhWhat: [{ id: "noLight" }, { id: "noVacuum" }, { id: "sunSwap" }],
  bhCenter: [{ id: "smbh" }, { id: "sgrMass" }, { id: "sgrDist" }],
  bhImage: [{ id: "firstImage" }, { id: "m87Dist" }, { id: "sgrImage" }],
  // Life and death of stars
  lifeMain: [{ id: "mainSequence" }, { id: "longestPhase" }, { id: "sunMidway" }],
  lifeMass: [{ id: "massFuel" }, { id: "massiveShort" }, { id: "lowMassLong" }],
  lifeGiant: [{ id: "noHydrogen" }, { id: "redGiant" }, { id: "giantWhen" }],
  lifeWhite: [{ id: "whiteDwarf" }, { id: "teaspoon" }, { id: "planetaryNebula" }],
  lifeNova: [{ id: "supernova" }, { id: "novaMass" }, { id: "stardust" }],
  // The birth of stars
  birthCloud: [{ id: "molecularCloud" }, { id: "clumpCollapse" }, { id: "orionNursery" }],
  birthProto: [{ id: "protostar" }, { id: "protoHeat" }, { id: "auMicAge" }],
  birthDisk: [{ id: "diskYoung" }, { id: "planetsMerge" }, { id: "pdsImage" }],
  birthCluster: [{ id: "clusters" }, { id: "pleiades" }, { id: "pleiadesDist" }],
  birthSun: [{ id: "sunAge" }, { id: "solarNebula" }, { id: "planetsLeft" }],
  // Understanding stars
  starWhat: [{ id: "starGas" }, { id: "starFusion" }, { id: "starGravity" }],
  starColor: [{ id: "colorTemp" }, { id: "blueHot" }, { id: "sunTemp" }],
  starClass: [{ id: "classOrder" }, { id: "sunClass" }, { id: "mColor" }],
  starSize: [{ id: "commonStars" }, { id: "sunLike" }, { id: "proximaSize" }],
  starHosts: [{ id: "orangeLife" }, { id: "redLong" }, { id: "bakedDry" }],
  // Names in space
  nameLetters: [{ id: "firstLetter" }, { id: "sameTime" }, { id: "letterOrder" }],
  nameStars: [{ id: "capitals" }, { id: "hostA" }, { id: "starOrPlanet" }],
  nameGreek: [{ id: "alphaAries" }, { id: "alphaCen" }, { id: "iau1922" }],
  nameCatalog: [{ id: "hdMeaning" }, { id: "toiMeaning" }, { id: "trappistWhat" }, { id: "gjMeaning" }],
  nameStories: [{ id: "romanGods" }, { id: "dimidium" }, { id: "buyStar" }, { id: "notReplace" }],
  // Constellations and zodiac signs
  zodWhat: [{ id: "constCount" }, { id: "notConnected" }, { id: "constShape" }],
  zodPath: [{ id: "thirteen" }, { id: "ophName" }, { id: "ophDates" }, { id: "ophPasses", number: "orbits" }],
  zodShift: [{ id: "wobble" }, { id: "wobbleTime" }, { id: "signSize" }],
  zodScience: [{ id: "astronomyMethod" }, { id: "astroEvidence" }, { id: "astroBelief" }],
  zodLight: [{ id: "lightTravel" }, { id: "starsSpread" }, { id: "nightSky" }],
  exoSystems: [{ id: "trappistFit" }, { id: "kepler90Eight" }, { id: "kepler90AI" }, { id: "trappistBLaps", number: "trappistBLaps" }],
  exoFamous: [{ id: "hdBlue" }, { id: "kepler16Suns" }, { id: "kepler16Saturn" }, { id: "kepler16Age", number: "kepler16Age" }],
  // the search for habitable worlds
  habWhat: [{ id: "hzDef" }, { id: "waterNeed" }, { id: "firstCut" }, { id: "habOrbits", number: "orbits" }],
  habZone: [{ id: "zoneHot" }, { id: "redDwarfZone" }, { id: "toiYear" }, { id: "toiAge", number: "toiAge" }],
  habWater: [{ id: "europaOcean" }, { id: "enceladusJets" }, { id: "bodyWater" }, { id: "europaLaps", number: "europaLaps" }],
  habAtmos: [{ id: "venusGreenhouse" }, { id: "marsThin" }, { id: "venusTemp" }, { id: "venusAge", number: "venusAge" }],
  habIngredients: [{ id: "lifeNeeds" }, { id: "marsOrganics" }, { id: "organicNotLife" }, { id: "rockFactor", number: "rockFactor" }],
  habExtreme: [{ id: "extremophile" }, { id: "fireAmoeba" }, { id: "chemosynthesis" }, { id: "tubeWorms" }],
  habLife: [{ id: "onlyEarth" }, { id: "vents" }, { id: "biosignature" }, { id: "candidatesAtBirth", number: "candidatesAtBirth" }],
};

// The questions of a step, ready to show: [{ id, text, options (labels), answer (the right label), explain }].
export function buildQuestions(step, nums, lang) {
  const tx = LEARN_TEXT[lang] ?? LEARN_TEXT.en;
  const fmt = (x) => x.toLocaleString(lang);
  return QUESTIONS[step].map((spec) => {
    // the light of your star; without a star the one of Proxima Centauri
    if (spec.number === "starLight" && !nums.star) spec = { id: "proximaLight" };
    if (spec.fallback && nums[spec.number] == null) spec = { id: spec.fallback };
    if (spec.number === "starLight") {
      const n = Math.round(nums.star.dist);
      const q = tx.q.starLight;
      return { id: spec.id, text: q.you(nums.star.name), options: seededOrder([n, ...distractors(n)].map(fmt), spec.id), answer: fmt(n), explain: q.e(fmt(n), nums.star.name) };
    }
    if (spec.number) {
      const n = nums[spec.number];
      const q = tx.q[spec.id];
      return { id: spec.id, text: nums.you ? q.you : q.ref, options: seededOrder([n, ...distractors(n)].map(fmt), spec.id), answer: fmt(n), explain: q.e(fmt(n)) };
    }
    const q = tx.q[spec.id];
    return { id: spec.id, text: q.q, options: seededOrder(q.o, spec.id), answer: q.o[0], explain: q.e };
  });
}

// The final test: `size` questions from all steps, a different choice and order for every attempt.
export function testQuestions(path, nums, lang, attempt) {
  const all = PATHS[path].steps.flatMap((step) => buildQuestions(step, nums, lang));
  return seededOrder(all, `test-${attempt}`).slice(0, PATHS[path].testSize);
}
export const passed = (right, total, path) => total > 0 && right / total >= PATHS[path].pass;

export const LEARN_TEXT = {
  en: {
    parts: { basics: "Part I, Foundations of planetary science", starLives: "Part II, The life of stars", galaxy: "Part III, Our home galaxy", sky: "Reading the sky" },
    paths: {
      solar: { title: "Our Solar System", goal: "You can explain how our Solar System is built and tell its main bodies apart." },
      alpha: { title: "Our nearest stars: Alpha Centauri", goal: "You can describe the star system closest to us, its planet Proxima b, and how far away it really is." },
      exo: { title: "Exoplanets: worlds beyond the Solar System", goal: "You know what exoplanets are, how they are found and how different they can be." },
      hab: { title: "The search for habitable worlds", goal: "You know what makes a planet possibly habitable, and why the habitable zone alone does not mean life." },
      zod: { title: "Constellations and zodiac signs", goal: "You can explain what a constellation is, why your zodiac sign and the sky disagree, and what the light of your constellation tells you." },
      names: { title: "Names in space", goal: "You can read the names of planets and stars: the letters, the Greek letters, the catalogues and the names with a story." },
      stars: { title: "Understanding stars", goal: "You can explain what a star is, what its colour says, how stars are sorted, and which stars are good homes for planets." },
      birth: { title: "The birth of stars", goal: "You can explain how a star is born from a cloud of gas and dust, how planets form round it, and how the Sun was born." },
      life: { title: "Life and death of stars", goal: "You can explain how a star lives, why its mass decides its life, and how stars end: as white dwarfs or in a supernova." },
      compact: { title: "Neutron stars and black holes", goal: "You can explain what neutron stars, pulsars and black holes are, where the black hole of the Milky Way sits, and how it was photographed." },
      nebula: { title: "Nebulae", goal: "You know what nebulae are, where stars are born in them and how dying stars leave them behind." },
      milky: { title: "The Milky Way", goal: "You can describe our galaxy: its shape and size, where the Sun lies in it, how it travels round the centre, and how Gaia mapped it." },
      local: { title: "The galactic neighbourhood", goal: "You know the galaxies near ours, the Local Group, and what science says about the future with Andromeda." },
    },
    path: {
      meta: (m) => `about ${m} minutes · for beginners`,
      rule: (n) => `${n} steps, then a final test with 10 questions; passed from 70 %.`,
    },
    // the lines of the neighbourhood in the 3D view (main.js): the distances of the NASA table (Proxima), of Kervella et al. 2017 (A and B),
    // and between the two as worked out from these positions (0.20 light years, about 12,900 AU)
    neighborhood: {
      sunProxima: "Sun → Proxima Centauri: 4.24 light years",
      sunAlpha: "Sun → Alpha Centauri A and B: 4.37 light years",
      system: "One system: Proxima ↔ A, B 0.2 light years (13,000 AU)",
    },
    allPaths: "All learning paths",
    status: { done: "Done", next: "Next", open: "To do", locked: "All steps first" },
    back: "All steps", placeLabel: "Learn about it", stepOf: (n, all) => `Step ${n} of ${all}`, goalLabel: "Learning goal", speak: "Read aloud", speakStop: "Stop", speakTitle: "Read with a voice on your device; nothing is sent.", rememberLabel: "Remember", sourcesLabel: "Sources", forYou: "For you", example: "An example", exampleHint: "With your date of birth (in the overview of My Universe) this becomes your own number.",
    taskLabel: "In the 3D view", taskGo: "Show in 3D", scaleBack: "Back to the explanation scale", taskDone: "Done", check: "Check your understanding", right: "Right.", wrong: "Not quite.",
    stepDone: (xp) => `Step done · +${xp} XP`, nextStep: "Next step", toTest: "To the final test",
    needTask: "Do the task in the 3D view too, then the step is done.", progress: (d, all) => `${d} of ${all} steps`,
    test: {
      title: "Final test", intro: (n, p) => `${n} questions from all steps, some with your own numbers. Passed from ${p} %.`,
      locked: "Finish all five steps first.", evaluate: "Check the answers", score: (r, n, p) => `${r} of ${n} right (${p} %)`,
      passed: (xp) => `Passed · +${xp} XP and a new badge`, failed: "Not passed yet. Read the explanations and try again.",
      retry: "Try again", best: (p) => `Best result: ${p} %`, answerAll: "Answer every question first.",
    },
    steps: {
      sun: {
        title: "The Sun", goal: "You can say what the Sun is and where its energy comes from.",
        text: [
          "The Sun is a star: a ball of hot gas, so big that about 109 Earths would fit side by side across it. It holds more than 99 % of all the mass of the Solar System.",
          "In its core hydrogen fuses into helium. That frees the energy that reaches us as light and warmth, from about 150 million kilometres away.",
        ],
        task: "Fly to the Sun and look at it from close by.",
        remember: [
          "The Sun is a star, a ball of hot gas. It formed about 4.6 billion years ago.",
          "Its energy comes from nuclear fusion: in its core, at about 15 million °C, hydrogen fuses into helium.",
          "It holds 99.8 % of the mass of the Solar System; about 109 Earths fit side by side across it.",
          "Its light needs about 8 minutes and 20 seconds to reach the Earth.",
        ],
        you: (n) => `The light falling on you right now left the Sun about 8 minutes and 20 seconds ago. Since you were born, the Earth has carried you round it ${n} times.`,
        ref: (n) => `The light falling on you right now left the Sun about 8 minutes and 20 seconds ago. A person of 30 has been carried round it by the Earth ${n} times.`,
      },
      inner: {
        title: "The inner planets", goal: "You can name the four rocky planets and tell them apart.",
        text: [
          "Mercury, Venus, Earth and Mars are the rocky planets: small, with solid ground. Mercury is the closest to the Sun, Venus the hottest, because its thick air of carbon dioxide holds the heat.",
          "Mars has the largest volcano of the Solar System, Olympus Mons, several times as tall as Mount Everest. A day on Venus lasts longer than its year.",
        ],
        task: "Fly to Mars and compare it with the Earth.",
        remember: [
          "Mercury, Venus, Earth and Mars are the inner planets: they have solid surfaces.",
          "Venus is the hottest planet, about 467 °C at the surface, though Mercury is closer to the Sun.",
          "A day on Venus (243 Earth days) is longer than its year (225 Earth days).",
          "Olympus Mons on Mars is the largest volcano of the Solar System.",
        ],
        you: (mars, mercury) => `On Mars you would be ${mars}, on Mercury ${mercury}: a year there is longer or shorter than ours.`,
        ref: (mars, mercury) => `A person of 30 would be ${mars} on Mars and ${mercury} on Mercury: a year there is longer or shorter than ours.`,
      },
      outer: {
        title: "The outer planets", goal: "You can tell the gas giants from the ice giants.",
        text: [
          "Jupiter and Saturn are gas giants, made mostly of hydrogen and helium; Uranus and Neptune are ice giants. None of them has solid ground like the Earth.",
          "Jupiter has more than twice the mass of all the other planets together. Saturn is so light for its size that it is less dense than water.",
        ],
        task: "Fly to Saturn and look at its rings.",
        remember: [
          "Jupiter and Saturn are gas giants, Uranus and Neptune ice giants.",
          "Jupiter is the largest planet, with more than twice the mass of all the other planets together.",
          "Saturn is the only planet less dense than water.",
          "Saturn is not the only one with rings: Jupiter and Neptune have rings too.",
        ],
        you: (n) => `Since you were born, Jupiter has gone round the Sun only ${n} times: one of its years lasts almost 12 of ours.`,
        ref: (n) => `In 30 years Jupiter goes round the Sun only ${n} times: one of its years lasts almost 12 of ours.`,
      },
      moons: {
        title: "Moons and dwarf planets", goal: "You know what a moon is, why our Moon always shows us the same side, and what a dwarf planet is.",
        text: [
          "A moon goes round a planet. The Earth has one, Jupiter dozens, and Galileo Galilei found the four largest of them in 1610 with one of the first telescopes.",
          "Most large moons turn exactly once per orbit, so they always show their planet the same side. That is why we never see the far side of our Moon from the Earth.",
          "Not every body that goes round the Sun on its own is a planet. Ceres in the asteroid belt and Pluto beyond Neptune are dwarf planets. Pluto counted as the ninth planet until 2006, when the International Astronomical Union made it a dwarf planet, because other objects might cross its orbit. It has five known moons; the largest, Charon, is about half its size.",
        ],
        task: "Fly to Jupiter and click one of its four large moons.",
        remember: [
          "A moon is a body that goes round a planet.",
          "Ganymede, a moon of Jupiter, is the largest moon of the Solar System, bigger than the planet Mercury.",
          "Our Moon always shows the Earth the same side: it turns exactly once per orbit.",
          "Galileo Galilei found the four largest moons of Jupiter in 1610.",
          "Ceres and Pluto are dwarf planets. Pluto counted as the ninth planet until 2006.",
        ],
        you: (n) => `Since you were born, the Moon has gone round the Earth about ${n} times.`,
        ref: (n) => `In 30 years the Moon goes round the Earth about ${n} times.`,
      },
      scale: {
        title: "Small bodies, scale and distance", goal: "You can describe how big and how empty the Solar System is, and what asteroids and comets are.",
        text: [
          "The Solar System is mostly empty space. The distance from the Earth to the Sun, 150 million kilometres, is called one astronomical unit (AU). Neptune, the outermost planet, is about 30 AU from the Sun.",
          "Light from the Sun needs a little over 8 minutes to the Earth and about 4 hours to Neptune. In the real scale of the 3D view the planets become tiny dots in a huge space.",
          "Between Mars and Jupiter lies the main asteroid belt, where most asteroids go round the Sun; its largest object, Ceres, is a dwarf planet. Comets are mostly ice with dust. When one comes near the Sun it warms up and grows an atmosphere, the coma; sunlight and the solar wind blow its dust and gas away from the Sun into long tails.",
        ],
        task: "Switch on the real scale and see how far apart the planets are.",
        remember: [
          "One astronomical unit (AU) is the mean distance from the Earth to the Sun, about 150 million kilometres.",
          "Neptune is 30 AU from the Sun; sunlight needs about 4 hours to get there.",
          "Most asteroids go round the Sun between Mars and Jupiter. The largest object there, Ceres, is a dwarf planet.",
          "Comets are mostly ice and dust; near the Sun they grow tails that point away from the Sun.",
        ],
        you: (name, dist, year) => `The light of your star, ${name}, that reaches you today set off around ${year}, about the year you were born. It has travelled ${dist} light years.`,
        ref: "The light of the nearest star, Proxima Centauri, needs 4.2 years to reach us.",
      },
      neighbors: {
        title: "Our nearest stars", goal: "You know which stars are closest to us and what a light year is.",
        text: [
          "After the Sun, the nearest star to us is Proxima Centauri, about 4.2 light years away. A light year is not a time but a distance: how far light travels in a year, nearly 9.5 trillion kilometres.",
          "Proxima belongs to Alpha Centauri, the closest star system to the Earth, in the constellation of Centaurus. Besides Proxima it has two bright stars, Alpha Centauri A and B, about 4.3 light years away.",
        ],
        task: "Look at the constellation of Centaurus: in that direction lie our nearest neighbours.",
        remember: [
          "After the Sun, Proxima Centauri is the nearest star, about 4.2 light years away.",
          "A light year is a distance: how far light travels in one year.",
          "Alpha Centauri is the closest star system to the Earth; it lies in the constellation of Centaurus.",
        ],
        you: (left) => (left == null ? "The light of Proxima Centauri that reaches you today set off about 4.2 years ago, before you were born." : `The light of Proxima Centauri that reaches you today set off about 4.2 years ago, when you were ${left}.`),
        ref: (left) => `The light of Proxima Centauri that reaches us today set off about 4.2 years ago: a person of 30 today was ${left} then.`,
      },
      pair: {
        title: "Alpha Centauri A and B", goal: "You can describe the two bright stars of Alpha Centauri and how they move.",
        text: [
          "Alpha Centauri A and B are a pair of stars that go round a common centre of gravity once every 80 years. At their closest they are about 11 times as far apart as the Earth and the Sun.",
          "A is the same type of star as our Sun (G2) and a little bigger; B (type K1) is a little smaller. In 2025 the James Webb Space Telescope found signs of a possible giant planet round A, about as heavy as Saturn. Whether it is really there is still an open question.",
        ],
        task: "Fly to Alpha Centauri A: B shines beside it. The gap between the two is drawn smaller than it is.",
        remember: [
          "Alpha Centauri A and B go round each other once every 80 years.",
          "A is the same type of star as the Sun and a little bigger, B a little smaller.",
          "A possible planet round A, seen by the Webb telescope in 2025, is not confirmed yet.",
        ],
        you: (share) => `A and B need 80 years for one lap round each other: in your life so far they have done ${share} % of one.`,
        ref: (share) => `A and B need 80 years for one lap round each other: in 30 years they do ${share} % of one.`,
      },
      proxima: {
        title: "Proxima Centauri", goal: "You know what a red dwarf is and why Proxima cannot be seen with the naked eye.",
        text: [
          "Proxima Centauri is a red dwarf: a small, cool star, far fainter than the Sun. Although it is our nearest star, it is too faint to be seen with the naked eye.",
          "It is the third and faintest star of the Alpha Centauri system. It sends out flares of ultraviolet light and X-rays, which matter a lot for its planet.",
        ],
        task: "Fly to Proxima Centauri and look at the small red star.",
        remember: [
          "Proxima Centauri is a red dwarf: small, cool and far fainter than the Sun.",
          "It cannot be seen with the naked eye, although it is the nearest star.",
          "It is the third and faintest star of the Alpha Centauri system, and it sends out flares of ultraviolet light and X-rays.",
        ],
        you: (trips) => `In your life so far, light could have made the way from Proxima to us ${trips} times.`,
        ref: (trips) => `In 30 years, light can make the way from Proxima to us ${trips} times.`,
      },
      proximaB: {
        title: "Proxima b", goal: "You know what is known about Proxima b, and why the habitable zone does not mean life.",
        text: [
          "In 2016 astronomers of the European Southern Observatory (ESO) announced a planet round Proxima Centauri: Proxima b. They found it from tiny shifts in the light of the star, which wobbles a little as the planet pulls on it. The planet goes round its star in 11.2 days and is at least about as heavy as the Earth.",
          "Proxima b lies in the habitable zone of its star: the temperature there could allow liquid water, under the right conditions. But the flares of Proxima could strip away an atmosphere. Whether Proxima b has air, water or even life is unknown.",
        ],
        task: "Fly to Proxima b and look at it from close by.",
        remember: [
          "Proxima b, the planet of the nearest star, was announced by ESO in 2016.",
          "A year on Proxima b lasts 11.2 days.",
          "It was found from small wobbles of its star, not from a photo.",
          "In the habitable zone does not mean inhabited: whether it has air or water is unknown.",
        ],
        you: (age) => `On Proxima b you would be ${age} years old: a year there lasts only 11.2 days.`,
        ref: (age) => `A person of 30 would be ${age} years old on Proxima b: a year there lasts only 11.2 days.`,
      },
      travel: {
        title: "Could we ever go there?", goal: "You can say how long a trip to our nearest star would take today.",
        text: [
          "Voyager 1, the farthest spacecraft, moves away from the Sun at about 17 kilometres per second, more than 61,000 kilometres per hour. At that speed a trip of 4.2 light years would take about 75,000 years (worked out from the distance and the speed).",
          "Light needs about 4.2 years for the same way. That is how far apart the stars are: even our nearest neighbour is out of reach of today's spacecraft.",
        ],
        task: "Plan a trip from the Earth to Proxima b in the trip planner.",
        remember: [
          "Voyager 1 moves at about 17 kilometres per second.",
          "At that speed the trip to Proxima would take about 75,000 years.",
          "Light needs about 4.2 years for the same way.",
        ],
        you: (n) => `At the speed of Voyager 1 the trip would take about 75,000 years: ${n} times your life so far.`,
        ref: (n) => `At the speed of Voyager 1 the trip would take about 75,000 years: ${n} times the life of a person of 30.`,
      },
      exoWhat: {
        title: "What are exoplanets?", goal: "You know what an exoplanet is and when the first ones were found.",
        text: [
          "An exoplanet is a planet outside our Solar System. Usually it goes round another star, but some are sunless rogues that wander through the galaxy in permanent darkness.",
          "The first exoplanets were found in 1992, round a pulsar. In 1995 followed 51 Pegasi b, the first round a star like the Sun; its discoverers, Michel Mayor and Didier Queloz, shared the Nobel Prize in Physics in 2019. The catalogue of this map, NASA's Exoplanet Archive, lists 6,423 confirmed planets (October 2026).",
        ],
        task: "Fly to 51 Pegasi b, the first planet found round a star like the Sun.",
        remember: [
          "An exoplanet is a planet outside our Solar System; usually it goes round another star.",
          "The first exoplanets were found in 1992, round a pulsar.",
          "51 Pegasi b (1995) was the first found round a star like the Sun: Nobel Prize in Physics 2019.",
        ],
        you: (at, now, year) => `In ${year}, the year you were born, ${at} of the planets in this catalogue had been found; today there are ${now}.`,
        ref: (at, now, year) => `In ${year}, when a person of 30 today was born, ${at} of the planets in this catalogue had been found; today there are ${now}.`,
      },
      exoHow: {
        title: "How are they found?", goal: "You can explain the transit method and the radial velocity method.",
        text: [
          "Exoplanets are hard to see directly: their stars are far brighter. The transit method watches the light of a star: when a planet passes in front of it, the star dims ever so slightly. Most known exoplanets were found this way, thousands of them with NASA's Kepler telescope.",
          "The radial velocity method looks at the star itself: a planet pulls on it, and the star wobbles a little. Its light is then squeezed and stretched in turn, shifted a little towards blue and towards red. That is how 51 Pegasi b and Proxima b were found.",
        ],
        task: "Fly to Kepler-22 b, a planet the Kepler telescope found with the transit method.",
        remember: [
          "Transit: a planet passing in front of its star dims its light a little.",
          "Radial velocity: the planet makes its star wobble, and the star's light shifts.",
          "Most known exoplanets were found with the transit method.",
        ],
        you: (n) => `Since the year you were born, ${n} planets of this catalogue have been found with the transit method.`,
        ref: (n) => `Since the year a person of 30 today was born, ${n} planets of this catalogue have been found with the transit method.`,
      },
      exoRocky: {
        title: "Rocky worlds and super-Earths", goal: "You can tell terrestrial planets and super-Earths apart.",
        text: [
          "Terrestrial planets are Earth-sized or smaller, made of rock, silicate, water or carbon. Super-Earths are more massive than the Earth but lighter than Neptune; they can be made of gas, rock or both.",
          "Seven Earth-sized planets go round TRAPPIST-1, a small red dwarf about 40 light years away. Several of them lie in its habitable zone; how many exactly differs from study to study. TRAPPIST-1 e goes round its star in 6.1 days.",
        ],
        task: "Fly to TRAPPIST-1 e, an Earth-sized planet of a small red dwarf.",
        remember: [
          "Terrestrial planets: Earth-sized or smaller, of rock, silicate, water or carbon.",
          "Super-Earths: more massive than the Earth, lighter than Neptune.",
          "TRAPPIST-1 has seven Earth-sized planets, about 40 light years from us.",
        ],
        you: (n) => `On TRAPPIST-1 e you would be ${n} years old: a year there lasts 6.1 days.`,
        ref: (n) => `A person of 30 would be ${n} years old on TRAPPIST-1 e: a year there lasts 6.1 days.`,
      },
      exoGiants: {
        title: "Gas giants and hot Jupiters", goal: "You know what gas giants and hot Jupiters are.",
        text: [
          "Gas giants are the size of Saturn or Jupiter, or much larger. Neptune-like planets are about as big as Neptune or Uranus.",
          "51 Pegasi b is a hot Jupiter: a gas giant that goes round its star in only 4.2 days, at 0.05 AU, far closer than Mercury is to the Sun (0.39 AU). HD 209458 b is another gas giant close to its star: its year lasts 3.5 days.",
        ],
        task: "Fly to HD 209458 b, a gas giant whose year lasts 3.5 days.",
        remember: [
          "Gas giants are the size of Saturn or Jupiter, or much larger.",
          "A hot Jupiter is a gas giant very close to its star.",
          "51 Pegasi b goes round its star in 4.2 days.",
        ],
        you: (n) => `On 51 Pegasi b you would be ${n} years old: a year there lasts 4.2 days.`,
        ref: (n) => `A person of 30 would be ${n} years old on 51 Pegasi b: a year there lasts 4.2 days.`,
      },
      exoStrange: {
        title: "Strange worlds", goal: "You know a few worlds unlike anything in our Solar System.",
        text: [
          "55 Cancri e is a super-Earth that goes round its star in 0.74 days, less than 18 hours. NASA describes it as a super hot world covered in a global ocean of lava.",
          "Not every exoplanet has a sun: some wander alone through the galaxy, in permanent darkness. New worlds are added to the catalogue every year; all 6,423 of this map can be explored in the 3D view.",
        ],
        task: "Fly to 55 Cancri e, the world with an ocean of lava.",
        remember: [
          "55 Cancri e: a super-Earth with a year of less than 18 hours and an ocean of lava.",
          "Some exoplanets have no sun and wander through the galaxy in darkness.",
          "New exoplanets are found every year.",
        ],
        you: (n) => `On 55 Cancri e you would have had ${n} birthdays: a year there lasts less than 18 hours.`,
        ref: (n) => `A person of 30 would have had ${n} birthdays on 55 Cancri e: a year there lasts less than 18 hours.`,
      },
      exoSystems: {
        title: "Planetary systems", goal: "You know that many stars have several planets, and you know two special systems.",
        text: [
          "Many stars have more than one planet: in this map 1,069 stars have more than one (October 2026). The seven planets of TRAPPIST-1 circle their small star so closely that, according to NASA, all of them would fit inside the orbit of Mercury.",
          "Around the Sun-like star Kepler-90, eight planets are known, as many as in our Solar System. The eighth was found in 2017 by an artificial neural network from Google that searched the data of the Kepler telescope. In this map the star is listed under its other name, KOI-351.",
        ],
        task: "Fly to KOI-351, the star Kepler-90 with its eight planets.",
        remember: [
          "Many stars have several planets.",
          "All seven planets of TRAPPIST-1 would fit inside the orbit of Mercury.",
          "Kepler-90 has eight planets, as many as our Solar System; the eighth was found in 2017 by artificial intelligence.",
        ],
        you: (n, e) => `Since you were born, TRAPPIST-1 b has gone round its star about ${n} times, the Earth round the Sun ${e} times.`,
        ref: (n, e) => `In 30 years TRAPPIST-1 b goes round its star about ${n} times, the Earth round the Sun ${e} times.`,
      },
      exoFamous: {
        title: "Famous exoplanets", goal: "You know two exoplanets that look different from what you would expect.",
        text: [
          "HD 189733 b is a gas giant that goes round its star in 2.2 days. According to NASA it is cobalt blue: its colour comes from a hazy, scorching atmosphere with clouds that contain glass. It was found in 2005 with the radial velocity method.",
          "Kepler-16 b circles two stars at once, an orange and a red dwarf that go round each other every 41 days. It takes 229 days to go round both and is like Saturn in size and mass. When it was announced in 2011, the researchers compared it to Tatooine from Star Wars, the world with two suns.",
        ],
        task: "Fly to HD 189733 b, the blue planet with clouds of glass.",
        remember: [
          "HD 189733 b is cobalt blue; its clouds contain glass.",
          "Kepler-16 b circles two stars, like Tatooine in Star Wars.",
          "Kepler-16 b is like Saturn in size and mass.",
        ],
        you: (n) => `On Kepler-16 b, the world with two suns, you would be ${n} years old: a year there lasts 229 days.`,
        ref: (n) => `A person of 30 would be ${n} on Kepler-16 b, the world with two suns: a year there lasts 229 days.`,
      },
      nebWhat: {
        title: "What is a nebula?", goal: "You know what a nebula is and the two ways nebulae come about.",
        text: [
          "According to NASA a nebula is a giant cloud of dust and gas in space.",
          "Some nebulae come from the gas and dust thrown out by the explosion of a dying star, such as a supernova. Others are regions where new stars are beginning to form, like the Orion Nebula of the path on the birth of stars.",
        ],
        task: "Look at the constellation Orion: below its belt lies the Orion Nebula, a nebula where stars are born.",
        remember: [
          "A nebula is a giant cloud of dust and gas in space.",
          "Some nebulae come from dying stars, for example from a supernova.",
          "Others are regions where new stars form.",
        ],
        you: (p) => `The light of the Orion Nebula is about 1,500 years on its way. In your life so far it has covered about ${p} % of that way.`,
        ref: (p) => `The light of the Orion Nebula is about 1,500 years on its way. In 30 years it covers about ${p} % of that way.`,
      },
      nebPillars: {
        title: "The Pillars of Creation", goal: "You know the most famous picture of a star nursery.",
        text: [
          "In the Eagle Nebula (M16) in the constellation Serpens stand the Pillars of Creation: towers of gas and dust in which new stars form. NASA gives a distance of 7,000 light years, ESA 6,500: the two pages disagree.",
          "Hubble photographed the pillars several times. On 19 October 2022 the Webb space telescope showed them in a new picture, full of young stars.",
        ],
        task: "Look at the constellation Serpens: the Eagle Nebula lies in it.",
        remember: [
          "The Pillars of Creation stand in the Eagle Nebula (M16) in Serpens.",
          "They are 6,500 (ESA) or 7,000 (NASA) light years away.",
          "Webb showed them in a new picture in October 2022.",
        ],
        you: (before, at) => (before != null ? `Webb's picture of the pillars came out in 2022, ${before} years before you were born.` : at === "0" ? "Webb's picture of the pillars came out in 2022, the year you were born." : `Webb's picture of the pillars came out in 2022, when you were ${at}.`),
        ref: (ago) => `Webb's picture of the pillars came out in 2022, ${ago} years ago.`,
      },
      nebDark: {
        title: "Dark nebulae", goal: "You know that some nebulae are dark.",
        text: [
          "Not every nebula glows. The Horsehead Nebula in Orion is a dark nebula: a dark cloud of dust and gas in the shape of a horse's head.",
          "According to ESA/Hubble it is about 1,300 light years away, a little closer than the Orion Nebula in the same constellation.",
        ],
        task: "Look at the constellation Orion again: the Horsehead Nebula lies in it too.",
        remember: [
          "Some nebulae are dark: dark clouds of dust and gas.",
          "The Horsehead Nebula is a dark nebula in Orion.",
          "It is about 1,300 light years away.",
        ],
        you: (year) => `The light of the Horsehead Nebula that arrives today set off around the year ${year}, long before you were born.`,
        ref: (year) => `The light of the Horsehead Nebula that arrives today set off around the year ${year}.`,
      },
      nebRing: {
        title: "The Ring Nebula", goal: "You know what a planetary nebula looks like and where it comes from.",
        text: [
          "When a star like the Sun dies, it sheds its outer layers; according to NASA they form an expanding cloud, a planetary nebula. The Sun will end like this too.",
          "The best known is the Ring Nebula (M57) in the constellation Lyra, according to NASA about 2,000 light years away.",
        ],
        task: "Look at the constellation Lyra: the Ring Nebula lies in it.",
        remember: [
          "A planetary nebula is the shed layers of a dying star like the Sun.",
          "The Ring Nebula (M57) is a planetary nebula in Lyra.",
          "It is about 2,000 light years away.",
        ],
        you: (n) => `The light of the Ring Nebula is about 2,000 years on its way: about ${n} times as long as you have lived.`,
        ref: (n) => `The light of the Ring Nebula is about 2,000 years on its way: about ${n} times as long as a life of 30 years.`,
      },
      nebCrab: {
        title: "The Crab Nebula", goal: "You know a nebula that is left from a supernova seen on the Earth.",
        text: [
          "The Crab Nebula (M1) in Taurus is a supernova remnant, according to NASA 6,500 light years away. In 1054 Chinese astronomers noticed a \"guest star\" there: it was a supernova explosion.",
          "In the middle of the nebula sits a rapidly spinning neutron star, a pulsar: the core of the star that exploded.",
        ],
        task: "Look at the constellation Taurus: the Crab Nebula lies in it.",
        remember: [
          "The Crab Nebula is the remnant of a supernova, in Taurus.",
          "Chinese astronomers saw the supernova in 1054 as a \"guest star\".",
          "In its middle spins a neutron star, a pulsar.",
        ],
        you: (before) => `Chinese astronomers saw the guest star in 1054, ${before} years before you were born.`,
        ref: (ago) => `Chinese astronomers saw the guest star in 1054, ${ago} years ago.`,
      },
      mwWhat: {
        title: "Our galaxy", goal: "You know the shape and size of the Milky Way.",
        text: [
          "The Milky Way is our galaxy. According to NASA it is a barred spiral: a disk with spiral arms and a central bar of stars. It spans more than 100,000 light years.",
          "According to ESA it contains more than a hundred thousand million stars, more than 100 billion. The Sun is one of them.",
        ],
        task: "Look at the constellation Sagittarius: in its direction lies the centre of the Milky Way.",
        remember: [
          "The Milky Way is a barred spiral galaxy.",
          "It spans more than 100,000 light years.",
          "According to ESA it has more than 100 billion stars.",
        ],
        you: (p) => `Light needs about 100,000 years to cross the Milky Way (worked out from its size). Your life so far is about ${p} % of that.`,
        ref: (p) => `Light needs about 100,000 years to cross the Milky Way (worked out from its size). A life of 30 years is about ${p} % of that.`,
      },
      mwArm: {
        title: "Our place: the Orion Arm", goal: "You know where the Sun lies in the Milky Way.",
        text: [
          "According to NASA the Sun lies near a small, partial arm called the Orion Arm, between the Sagittarius and Perseus arms, about halfway from the centre to the edge.",
          "NASA gives the distance to the centre as about 8 kiloparsecs, about 26,000 light years worked out; ESO gives about 27,000 light years for the black hole in the middle.",
        ],
        task: "Look at the Sun: it lies in the Orion Arm, far out from the centre.",
        remember: [
          "The Sun lies near the Orion Arm, a small, partial arm.",
          "It lies between the Sagittarius and Perseus arms.",
          "The centre is about 26,000 to 27,000 light years away.",
        ],
        you: (ly, p) => `In your life light has come ${ly} light years far: about ${p} % of the way to the centre.`,
        ref: (ly, p) => `In ${ly} years light comes ${ly} light years far: about ${p} % of the way to the centre.`,
      },
      mwOrbit: {
        title: "The journey round the centre", goal: "You know that the Sun travels round the centre of the Milky Way.",
        text: [
          "The Sun travels round the centre of the Milky Way and takes the planets with it. According to NASA it moves at an average of 720,000 kilometres per hour.",
          "One lap takes a very long time: NASA's page on the Sun says about 230 million years, NASA's page on galaxies and ESA say about 240 million. The pages disagree.",
        ],
        task: "Look at the Sun: with all its planets it travels round the centre of the Milky Way.",
        remember: [
          "The Sun travels round the centre of the Milky Way.",
          "It moves at about 720,000 km/h.",
          "One lap takes about 230 to 240 million years.",
        ],
        you: (km, n) => `Since you were born the Sun has carried you about ${km} billion km round the centre (worked out with 720,000 km/h). One lap takes about ${n} times your life so far.`,
        ref: (km, n) => `In 30 years the Sun carries us about ${km} billion km round the centre (worked out with 720,000 km/h). One lap takes about ${n} times as long.`,
      },
      mwBand: {
        title: "The band in the sky", goal: "You know what the band of light across the night sky is.",
        text: [
          "In a dark night a pale band of light stretches across the sky. According to NASA it is the central disk of our home galaxy, seen edge on.",
          "We see it from the inside: the Sun lies in the disk itself. In the direction of Sagittarius we look towards the centre.",
        ],
        task: "Look at the constellation Sagittarius: there the band points to the centre.",
        remember: [
          "The band of light in the night sky is the disk of the Milky Way.",
          "We see the disk edge on, from the inside.",
          "In the direction of Sagittarius lies the centre.",
        ],
        you: () => "The band you can see in a dark night is the disk you live in yourself.",
        ref: () => "The band you can see in a dark night is the disk we all live in.",
      },
      mwGaia: {
        title: "Gaia's map", goal: "You know how ESA's Gaia mapped the Milky Way, and where the stars of this map come from.",
        text: [
          "ESA's space telescope Gaia measured the positions and distances of stars to make a precise three-dimensional map of the Milky Way. Its Data Release 3 of 13 June 2022 has 1,811,709,771 sources; ESA's mission page speaks of two billion stars and other objects.",
          "Gaia ended its science observations on 15 January 2025. Most stars of this map come from Gaia DR3: the near stars up to 326 light years and about a million bright stars.",
        ],
        task: "There is no task in the 3D view for this step: the whole map is the task. Answer the questions, then the step is done.",
        remember: [
          "Gaia made a precise 3D map of the Milky Way.",
          "Gaia DR3 (2022) has about 1.8 billion sources.",
          "Most stars of this map come from Gaia DR3.",
        ],
        you: (before, at) => (before != null ? `Gaia DR3 came out in 2022, ${before} years before you were born.` : at === "0" ? "Gaia DR3 came out in 2022, the year you were born." : `Gaia DR3 came out in 2022, when you were ${at}.`),
        ref: (ago) => `Gaia DR3 came out in 2022, ${ago} years ago.`,
      },
      locGroup: {
        title: "The Local Group", goal: "You know the group of galaxies the Milky Way belongs to.",
        text: [
          "According to NASA the Milky Way belongs to a group of over 50 galaxies called the Local Group. The biggest members are the Andromeda Galaxy, the Milky Way and the Triangulum Galaxy (M33), the third largest.",
          "Triangulum is about 3 million light years away. According to NASA it is one of the most distant objects keen-eyed observers can view.",
        ],
        task: "Look at the constellation Triangulum: the Triangulum Galaxy lies in it.",
        remember: [
          "The Milky Way belongs to the Local Group of over 50 galaxies.",
          "The biggest are Andromeda, the Milky Way and Triangulum.",
          "Triangulum (M33) is about 3 million light years away.",
        ],
        you: (n) => `The light of Triangulum is about 3 million years on its way: about ${n} times your life so far.`,
        ref: (n) => `The light of Triangulum is about 3 million years on its way: about ${n} times a life of 30 years.`,
      },
      locMagellan: {
        title: "The Magellanic Clouds", goal: "You know the companions of the Milky Way.",
        text: [
          "The Milky Way has small companions. According to ESA/Hubble the Large Magellanic Cloud is a satellite galaxy of the Milky Way.",
          "The Small Magellanic Cloud lies 200,000 light years away in the constellation Tucana.",
        ],
        task: "Look at the constellation Tucana: the Small Magellanic Cloud lies in it.",
        remember: [
          "The Large Magellanic Cloud is a satellite galaxy of the Milky Way.",
          "The Small Magellanic Cloud is 200,000 light years away.",
          "It lies in the constellation Tucana.",
        ],
        you: (n) => `The light of the Small Magellanic Cloud is 200,000 years on its way: about ${n} times your life so far.`,
        ref: (n) => `The light of the Small Magellanic Cloud is 200,000 years on its way: about ${n} times a life of 30 years.`,
      },
      locAndromeda: {
        title: "The Andromeda Galaxy", goal: "You know our big neighbour galaxy.",
        text: [
          "The Andromeda Galaxy (M31) is the biggest galaxy of the Local Group. According to NASA it is 2.5 million light years away, in the constellation Andromeda.",
          "Even so it is easily visible with the unaided eye from a dark sky site. The light you see then set off 2.5 million years ago.",
        ],
        task: "Look at the constellation Andromeda: the Andromeda Galaxy lies in it.",
        remember: [
          "The Andromeda Galaxy is the biggest galaxy of the Local Group.",
          "It is 2.5 million light years away.",
          "From a dark site it can be seen with the unaided eye.",
        ],
        you: (n) => `The light of Andromeda is 2.5 million years on its way: about ${n} times your life so far.`,
        ref: (n) => `The light of Andromeda is 2.5 million years on its way: about ${n} times a life of 30 years.`,
      },
      locApproach: {
        title: "Andromeda is coming closer", goal: "You know what NASA forecast in 2012 for the Milky Way and Andromeda.",
        text: [
          "According to NASA Andromeda is moving towards the Milky Way at about 250,000 miles per hour, about 400,000 kilometres per hour.",
          "In 2012 NASA forecast with Hubble data a head-on collision in about four billion years. Around 6 billion years from now the two galaxies would merge into one.",
        ],
        task: "Look at the constellation Andromeda again: from there our neighbour is coming closer.",
        remember: [
          "Andromeda is moving towards us at about 400,000 km/h.",
          "NASA forecast in 2012 a collision in about 4 billion years.",
          "In about 6 billion years the two would merge into one.",
        ],
        you: (km) => `Since you were born Andromeda has come about ${km} billion km closer (worked out with 250,000 miles per hour).`,
        ref: (km) => `In 30 years Andromeda comes about ${km} billion km closer (worked out with 250,000 miles per hour).`,
      },
      locFuture: {
        title: "How sure is the future?", goal: "You know that a forecast in science can change with new data.",
        text: [
          "In 2025 a team led by Till Sawala looked again, with data from Hubble and ESA's Gaia. According to ESA/Hubble there is only a 50-50 chance of the two galaxies colliding within the next 10 billion years.",
          "That is how science works: a forecast holds as long as the data hold. With better measurements the collision of 2012 became a possibility.",
        ],
        task: "There is no task in the 3D view for this step. Answer the questions, then the step is done.",
        remember: [
          "A 2025 study gives only a 50-50 chance of a collision within 10 billion years.",
          "It used data from Hubble and ESA's Gaia.",
          "Forecasts in science can change with new data.",
        ],
        you: (n) => `The four billion years of the forecast of 2012 are about ${n} times your life so far.`,
        ref: (n) => `The four billion years of the forecast of 2012 are about ${n} times a life of 30 years.`,
      },
      nsWhat: {
        title: "Neutron stars", goal: "You know what a neutron star is and how dense it is.",
        text: [
          "According to NASA neutron stars form when a massive star runs out of fuel and collapses. They pack more mass than the Sun into a sphere only about 20 kilometres across.",
          "Their material is unimaginably dense: according to NASA one sugar cube of it would weigh about 1 trillion kilograms. The map has neutron stars with planets, for example PSR B0329+54.",
        ],
        task: "Look at PSR B0329+54, a neutron star with a planet.",
        remember: [
          "A neutron star forms when a massive star runs out of fuel and collapses.",
          "It packs more mass than the Sun into a sphere about 20 km across.",
          "A sugar cube of its material would weigh about 1 trillion kilograms.",
        ],
        you: (name, m) => `Your star ${name} has ${m} times the mass of the Sun and is far bigger than a city. A neutron star packs more than a whole Sun into about 20 km.`,
        ref: (name, m) => `${name} has ${m} times the mass of the Sun and is far bigger than a city. A neutron star packs more than a whole Sun into about 20 km.`,
        none: () => "A neutron star packs more than a whole Sun into about 20 km.",
      },
      nsPulsar: {
        title: "Pulsars", goal: "You know what a pulsar is and why it blinks.",
        text: [
          "According to NASA pulsars are rotating neutron stars that send out pulses of radiation. You can think of one like a lighthouse: its beam sweeps past us again and again. The time between the pulses is typically milliseconds to seconds.",
          "Round the pulsar PSR B1257+12 planets were found; NASA counts them among the first to be discovered. The NASA table of this map gives 1992 for two of them and 1994 for the third.",
        ],
        task: "Look at PSR B1257+12, a pulsar with three planets.",
        remember: [
          "A pulsar is a rotating neutron star that sends out pulses of radiation.",
          "It works like a lighthouse: its beam sweeps past us.",
          "Its pulses come every few milliseconds to seconds.",
        ],
        you: (n) => `A pulsar that blinks once a second would have blinked about ${n} times since you were born. (Worked out.)`,
        ref: (n) => `A pulsar that blinks once a second blinks about ${n} times in 30 years. (Worked out.)`,
      },
      bhWhat: {
        title: "What is a black hole?", goal: "You know what a black hole is, and what it is not.",
        text: [
          "According to NASA a black hole's gravity is so strong that nothing, not even light, can escape. A star with more than eight times the mass of the Sun can leave one behind: its core collapses into a stellar-mass black hole.",
          "But black holes are no cosmic vacuum cleaners: according to NASA they don't suck in other matter. If the Sun were replaced by a black hole of the same mass, the planets would stay in their orbits.",
        ],
        task: "There is no task in the 3D view for this step: a black hole cannot be seen. Answer the questions, then the step is done.",
        remember: [
          "From a black hole nothing escapes, not even light.",
          "The core of a very heavy star can collapse into a black hole.",
          "Black holes don't suck in matter; the planets would keep their orbits.",
        ],
        you: (ly) => `Light is so fast that in your life it has come ${ly} light years far. Out of a black hole it does not come.`,
        ref: (ly) => `Light is so fast that in ${ly} years it comes ${ly} light years far. Out of a black hole it does not come.`,
      },
      bhCenter: {
        title: "The black hole in our middle", goal: "You know the black hole at the centre of the Milky Way.",
        text: [
          "According to NASA supermassive black holes have hundreds of thousands to billions of times the mass of the Sun, and galaxies have one at their centre.",
          "Ours is called Sagittarius A*. According to ESO it is four million times more massive than the Sun and about 27,000 light years away, in the direction of the constellation Sagittarius.",
        ],
        task: "Look at the constellation Sagittarius: in its direction lies the centre of the Milky Way.",
        remember: [
          "Supermassive black holes sit at the centres of galaxies.",
          "Sagittarius A* is four million times more massive than the Sun.",
          "It is about 27,000 light years away, towards Sagittarius.",
        ],
        you: (before) => `Light from the region of Sagittarius A* that arrives today is about 27,000 years on its way: it set off about ${before} years before you were born.`,
        ref: () => "Light from the region of Sagittarius A* that arrives today is about 27,000 years on its way.",
      },
      bhImage: {
        title: "The first image of a black hole", goal: "You know how black holes were photographed.",
        text: [
          "On 10 April 2019 the Event Horizon Telescope showed the first image of a black hole: the one in the galaxy M87, according to ESO 55 million light years away and 6.5 billion times the mass of the Sun. It shows a ring-like structure with a dark central region.",
          "On 12 May 2022 followed the first image of Sagittarius A*, the black hole at the centre of our own Milky Way.",
        ],
        task: "Look at the constellation Virgo: in its direction lies the galaxy M87.",
        remember: [
          "The first image of a black hole was shown on 10 April 2019 (M87).",
          "It shows a ring-like structure with a dark central region.",
          "The image of Sagittarius A* followed on 12 May 2022.",
        ],
        you: (before, at) => (before != null ? `The first image of a black hole was shown in 2019, ${before} years before you were born.` : at === "0" ? "The first image of a black hole was shown in 2019, the year you were born." : `The first image of a black hole was shown in 2019, when you were ${at}.`),
        ref: (ago) => `The first image of a black hole was shown in 2019, ${ago} years ago.`,
      },
      lifeMain: {
        title: "The main sequence", goal: "You know the longest phase in the life of a star.",
        text: [
          "According to NASA stars that are stably fusing hydrogen into helium in their core are called main sequence stars. It is the longest phase of a star's life, and around 90 % of the stars are in it.",
          "The Sun is one of them, roughly midway through its main sequence stage. According to NASA it will spend about 10 billion years on the main sequence.",
        ],
        task: "Look at the Sun, halfway through its main sequence.",
        remember: [
          "On the main sequence a star stably fuses hydrogen into helium.",
          "It is the longest phase of a star's life.",
          "The Sun is roughly halfway through its about 10 billion years there.",
        ],
        you: (sec) => `If the Sun's 10 billion years on the main sequence were one year, your life so far would have lasted about ${sec} seconds. (Worked out.)`,
        ref: (sec) => `If the Sun's 10 billion years on the main sequence were one year, a life of 30 years would have lasted about ${sec} seconds. (Worked out.)`,
      },
      lifeMass: {
        title: "Mass decides", goal: "You know why heavy stars live short lives and light ones long lives.",
        text: [
          "According to NASA a more massive star uses its fuel faster. So the heaviest stars live only a few million years.",
          "Light stars are thrifty: according to NASA some low-mass stars will shine for trillions of years. Proxima Centauri is such a light star: a red dwarf with about an eighth of the mass of the Sun, by the NASA table of this map.",
        ],
        task: "Look at Proxima Centauri, a light red dwarf with a very long life ahead.",
        remember: [
          "A more massive star uses its fuel faster.",
          "The heaviest stars live only a few million years.",
          "Some light stars shine for trillions of years.",
        ],
        you: (name, m, light) => `Your star ${name} has ${m} times the mass of the Sun, ${light ? "less: it uses its fuel more slowly and lives longer than the Sun" : "more: it uses its fuel faster and lives a shorter life than the Sun"}.`,
        ref: (name, m, light) => `${name} has ${m} times the mass of the Sun, ${light ? "less: it uses its fuel more slowly and lives longer than the Sun" : "more: it uses its fuel faster and lives a shorter life than the Sun"}.`,
        none: (name) => `The table gives no mass for ${name}.`,
      },
      lifeGiant: {
        title: "The red giant", goal: "You know what happens when a star runs out of hydrogen in its core.",
        text: [
          "When the core of a star runs out of hydrogen to fuse into helium, the core starts to collapse, and the star slowly puffs up. According to NASA the result is a red giant.",
          "This will happen to the Sun too: according to NASA it will become a red giant in about 5 billion years.",
        ],
        task: "Look at the Sun: in about 5 billion years it will be a red giant.",
        remember: [
          "Without hydrogen in its core the core collapses and the star puffs up.",
          "The result is a red giant.",
          "The Sun will become a red giant in about 5 billion years.",
        ],
        you: (n) => `5 billion years until the red giant are about ${n} times your life so far.`,
        ref: (n) => `5 billion years until the red giant are about ${n} times a life of 30 years.`,
      },
      lifeWhite: {
        title: "White dwarfs", goal: "You know how stars like the Sun end.",
        text: [
          "When a red giant has shed all its atmosphere, only the core remains: a white dwarf. According to NASA it is usually Earth-sized, and a teaspoon of its material would weigh more than a pickup truck. It gradually cools over billions of years; the shed layers form an expanding cloud, a planetary nebula.",
          "According to NASA stars up to about 7 times the mass of the Sun end as white dwarfs; the Sun too. The map has white dwarfs with planets: round WD 1856+534 the NASA table knows one, found in 2020.",
        ],
        task: "Look at WD 1856+534, a white dwarf with a planet.",
        remember: [
          "A white dwarf is the core left of a star, usually Earth-sized.",
          "A teaspoon of its material would weigh more than a pickup truck.",
          "Stars up to about 7 times the mass of the Sun end as white dwarfs.",
        ],
        you: (name, m, fate) => `Your star ${name} has ${m} times the mass of the Sun: ${fate === "white" ? "it will end as a white dwarf." : fate === "nova" ? "it is heavy enough for a supernova." : "it is near the border between a white dwarf and a supernova."}`,
        ref: (name, m, fate) => `${name} has ${m} times the mass of the Sun: ${fate === "white" ? "it will end as a white dwarf." : fate === "nova" ? "it is heavy enough for a supernova." : "it is near the border between a white dwarf and a supernova."}`,
        none: (name) => `The table gives no mass for ${name}.`,
      },
      lifeNova: {
        title: "Supernova and stardust", goal: "You know how heavy stars end and where the elements come from.",
        text: [
          "According to NASA a star with more than eight times the mass of the Sun explodes as a supernova at its end; another NASA page puts the border at seven. Its core can collapse into a black hole: more on that in the next path.",
          "In their cores stars fuse carbon into heavier elements like oxygen, neon and magnesium, and supernovae scatter the elements through space. According to NASA everything on the Earth, our bodies too, is made of elements made in the cores of stars.",
        ],
        task: "There is no task in the 3D view for this step. Answer the questions, then the step is done.",
        remember: [
          "Stars with more than about eight times the mass of the Sun end in a supernova.",
          "Stars fuse heavier elements like oxygen; supernovae scatter them.",
          "According to NASA our bodies too are made of elements from stars.",
        ],
        you: (name, m, fate) => `The elements of your body were made in stars. Your star ${name} (${m} masses of the Sun) ${fate === "nova" ? "will one day explode itself." : "is too light to explode as a supernova."}`,
        ref: (name, m, fate) => `The elements of every human body were made in stars. ${name} (${m} masses of the Sun) ${fate === "nova" ? "will one day explode itself." : "is too light to explode as a supernova."}`,
        none: () => "The elements of your body were made in stars.",
      },
      birthCloud: {
        title: "Clouds of gas and dust", goal: "You know where stars are born.",
        text: [
          "According to NASA stars form in large clouds of gas and dust called molecular clouds. They are cold, so the gas clumps into pockets of high density. Eventually gravity makes some of these clumps collapse.",
          "The Orion Nebula is such a stellar nursery: according to NASA the closest large star-forming region to the Earth, about 1,500 light years away, just below the belt of Orion.",
        ],
        task: "Look at the constellation Orion: the Orion Nebula lies just below its belt.",
        remember: [
          "Stars form in cold clouds of gas and dust, the molecular clouds.",
          "Gravity makes clumps in these clouds collapse.",
          "The Orion Nebula is the closest large star-forming region, about 1,500 light years away.",
        ],
        you: (before) => `The light of the Orion Nebula that arrives today is about 1,500 years on its way: it set off about ${before} years before you were born.`,
        ref: () => "The light of the Orion Nebula that arrives today is about 1,500 years on its way.",
      },
      birthProto: {
        title: "From a clump to a protostar", goal: "You know how a collapsing clump becomes a star.",
        text: [
          "When a clump collapses, friction heats the material up, and a protostar forms: according to NASA a baby star. After millions of years the temperatures in its core squeeze hydrogen nuclei together: the fusion begins, the star shines.",
          "AU Mic, about 32 light years away, is such a young star. NASA gives it an age of 20 to 30 million years: a stellar infant, the Sun is at least 150 times older.",
        ],
        task: "Look at AU Mic, a young star with planets.",
        remember: [
          "A collapsing clump heats up and becomes a protostar, a baby star.",
          "After millions of years the fusion of hydrogen begins in its core.",
          "AU Mic is only 20 to 30 million years old; the Sun is at least 150 times older.",
        ],
        you: (x) => `AU Mic is 20 to 30 million years old: counted from the middle, about ${x} times as old as you. For a star that is a baby.`,
        ref: (x) => `AU Mic is 20 to 30 million years old: counted from the middle, about ${x} times as old as a person of 30. For a star that is a baby.`,
      },
      birthDisk: {
        title: "The disk and the planets", goal: "You know how planets grow round a young star.",
        text: [
          "A young star is still surrounded by a disk of gas and dust left over from its birth; according to NASA AU Mic has one too. In such a disk solid particles of rock and ice collide and merge: so planets grow.",
          "In 2018 ESO showed the first confirmed image of a planet caught in the act of forming in such a disk: PDS 70 b, round a star ESO puts nearly 400 light years away (the NASA table of this map gives 369). In 2021 ALMA found a disk round its sibling PDS 70 c in which moons may form.",
        ],
        task: "Look at PDS 70 with its two young planets.",
        remember: [
          "A young star is surrounded by a disk of gas and dust.",
          "In the disk particles of rock and ice collide and merge into planets.",
          "PDS 70 b was the first confirmed image of a planet still forming (2018).",
        ],
        you: (before, at) => (before != null ? `PDS 70 b was photographed in 2018, ${before} years before you were born.` : at === "0" ? "PDS 70 b was photographed in 2018, the year you were born." : `PDS 70 b was photographed in 2018, when you were ${at}.`),
        ref: (ago) => `PDS 70 b was photographed in 2018, ${ago} years ago.`,
      },
      birthCluster: {
        title: "Stars are born in groups", goal: "You know that stars are often born together, in clusters.",
        text: [
          "According to NASA stars often form in groups; such groups are called stellar clusters.",
          "The best known is the Pleiades, an open star cluster in Taurus. NASA gives its distance as roughly 445 light years and adds that this number is not universally agreed upon.",
        ],
        task: "Look at the constellation Taurus: the Pleiades are in it.",
        remember: [
          "Stars are often born in groups, the stellar clusters.",
          "The Pleiades are an open star cluster in Taurus.",
          "They are roughly 445 light years away; the number is not agreed upon by all.",
        ],
        you: (year, before) => `The light of the Pleiades that arrives today set off around the year ${year}, about ${before} years before you were born.`,
        ref: (year) => `The light of the Pleiades that arrives today set off around the year ${year}.`,
      },
      birthSun: {
        title: "The birth of the Sun", goal: "You know how and when the Sun and its planets were born.",
        text: [
          "According to NASA the Sun formed about 4.6 billion years ago in a giant, spinning cloud of gas and dust, the solar nebula. Much of the remaining material formed the planets and the other bodies of the Solar System, the Earth too.",
          "The same NASA page calls the Sun 4.5 billion years old in its introduction: the two numbers are rounded differently, both mean about four and a half billion years.",
        ],
        task: "Look at the Sun, born 4.6 billion years ago.",
        remember: [
          "The Sun formed about 4.6 billion years ago.",
          "It was born in a spinning cloud of gas and dust, the solar nebula.",
          "Much of the remaining material formed the planets, the Earth too.",
        ],
        you: (ms) => `If the Sun's life so far were a single day, your life so far would have lasted about ${ms} thousandths of a second. (Worked out from 4.6 billion years.)`,
        ref: (ms) => `If the Sun's life so far were a single day, a life of 30 years would have lasted about ${ms} thousandths of a second. (Worked out from 4.6 billion years.)`,
      },
      starWhat: {
        title: "What is a star?", goal: "You know what a star is and where its light comes from.",
        text: [
          "According to NASA stars are giant balls of hot gas, held together by their own gravity. The Sun is one of them: the star closest to us.",
          "Deep in its core a star squeezes the nuclei of hydrogen atoms together to form helium. This fusion releases the energy that makes the star shine. The Sun has done this for about 4.6 billion years.",
        ],
        task: "Look at the Sun, the star closest to us.",
        remember: [
          "A star is a giant ball of hot gas, held together by its own gravity.",
          "In its core hydrogen is fused into helium; that makes it shine.",
          "The Sun is a star, the one closest to us.",
        ],
        you: (n) => `Since you were born the Earth has gone round the Sun ${n} times. All that time the Sun has fused hydrogen into helium in its core: that is its light.`,
        ref: (n) => `In ${n} years the Earth goes round the Sun ${n} times. All that time the Sun fuses hydrogen into helium in its core: that is its light.`,
      },
      starColor: {
        title: "Colour and temperature", goal: "You can tell from the colour of a star whether it is hot or cool.",
        text: [
          "According to NASA stars vary in colour because they vary in temperature: hotter stars look blue or white, cooler stars orange or red.",
          "The surface of the Sun is about 5,500 °C. TRAPPIST-1 is much cooler: the NASA table of this map gives it 2,566 kelvin, about 2,300 °C. That is why it glows red.",
        ],
        task: "Look at TRAPPIST-1, a cool red star.",
        remember: [
          "The colour of a star shows its temperature.",
          "Hot stars look blue or white, cool stars orange or red.",
          "The surface of the Sun is about 5,500 °C.",
        ],
        you: (name, c, hotter) => `Your star ${name} is about ${c} °C on its surface, ${hotter ? "hotter" : "cooler"} than the Sun (about 5,500 °C).`,
        ref: (name, c, hotter) => `${name} is about ${c} °C on its surface, ${hotter ? "hotter" : "cooler"} than the Sun (about 5,500 °C).`,
        none: (name) => `The table gives no temperature for ${name}.`,
      },
      starClass: {
        title: "The classes of stars", goal: "You can sort a star by its letter: O, B, A, F, G, K, M.",
        text: [
          "Astronomers sort stars into classes with letters, from the hottest to the coolest: O (blue), B (blue-white), A (white), F (yellow-white), G (yellow), K (orange) and M (red).",
          "According to NASA the Sun is a G-type yellow dwarf. 51 Pegasi is a G star too: round it the first planet round a star like the Sun was found.",
        ],
        task: "Look at 51 Pegasi, a G star like the Sun.",
        remember: [
          "The classes from hot to cool: O, B, A, F, G, K, M.",
          "O stars are blue, M stars red.",
          "The Sun is a G star, a yellow dwarf.",
        ],
        colors: { O: "blue", B: "blue-white", A: "white", F: "yellow-white", G: "yellow", K: "orange", M: "red" },
        you: (name, spec, color) => `Your star ${name} has the type ${spec} in the table: the first letter is its class, its colour ${color}.`,
        ref: (name, spec, color) => `${name} has the type ${spec} in the table: the first letter is its class, its colour ${color}.`,
        none: (name) => `The table gives no type for ${name}.`,
      },
      starSize: {
        title: "Big and small", goal: "You know how different the sizes of stars are, and which stars are the most common.",
        text: [
          "Stars come in very different sizes. Proxima Centauri is a red dwarf: the NASA table of this map gives it 0.141 times the radius of the Sun, about a seventh. The biggest star of the map with a planet, HD 18438, is about 88 times as big as the Sun.",
          "Red dwarfs are the most common stars. NASA gives their share of the stars of the Milky Way as about 73 % on one page and 75 % on another; stars like the Sun are only about 6 %.",
        ],
        task: "Look at Proxima Centauri, a small red dwarf.",
        remember: [
          "Stars have very different sizes, from small red dwarfs to giants.",
          "About three quarters of the stars of the Milky Way are red dwarfs.",
          "Only about 6 % are stars like the Sun.",
        ],
        you: (name, x, small) => (small ? `Your star ${name} has about ${x} % of the radius of the Sun.` : `Your star ${name} is about ${x} times as big as the Sun.`),
        ref: (name, x, small) => (small ? `${name} has about ${x} % of the radius of the Sun.` : `${name} is about ${x} times as big as the Sun.`),
        none: (name) => `The table gives no size for ${name}.`,
      },
      starHosts: {
        title: "Stars as homes for planets", goal: "You know which stars NASA thinks are good homes for life.",
        text: [
          "According to NASA stars a little cooler than the Sun, the orange dwarfs of class K, are considered better for advanced life.",
          "Red dwarfs (class M) live even longer: NASA gives more than 100 billion years. But planets in their habitable zone can be baked bone dry. TOI-700, an M star, has a planet in its zone all the same.",
        ],
        task: "Look at TOI-700, a red dwarf with a planet in its habitable zone.",
        remember: [
          "Orange dwarfs (class K) are considered good for advanced life.",
          "Red dwarfs (class M) live longest, more than 100 billion years.",
          "Planets in the zone of a red dwarf can be baked dry.",
        ],
        hint: { G: "It is similar to the Sun.", K: "According to NASA orange dwarfs like it are considered better for advanced life.", M: "Red dwarfs like it live very long, but planets in their zone can be baked dry." },
        you: (name, cls, hint) => `Your star ${name} is a star of class ${cls}, and at least one planet goes round it. ${hint}`.trim(),
        ref: (name, cls, hint) => `${name} is a star of class ${cls}, and two planets go round it. ${hint}`.trim(),
        none: (name) => `The table gives no type for ${name}.`,
      },
      nameLetters: {
        title: "Planets get letters", goal: "You can read the name of an exoplanet: the star and a letter.",
        text: [
          "An exoplanet is usually called like its star, with a small letter after it. According to NASA the first planet found is always named b, the next ones c, d, e and so on. The star itself is the undeclared \"A\".",
          "If several planets of a star are found at the same time, the one closest to the star gets the b. At TRAPPIST-1 the seven planets are called b to h, from the inside out. So the letter tells the order of discovery, not the distance: at Proxima Centauri the NASA table of this map has b and d, and d goes round the star closer than b, but was found later.",
        ],
        task: "Look at Proxima Centauri with its planets b and d.",
        remember: [
          "An exoplanet is called like its star, with a small letter.",
          "The first planet found is b, the next ones c, d, e.",
          "If several are found at once, the one closest to the star gets the b.",
        ],
        you: (star, list, n) => (n ? `Your star is called ${star}. The NASA table knows ${n === 1 ? "one planet" : `${n} planets`} round it: ${list}.` : `Your star is called ${star}. Its planets are called ${star} b, ${star} c and so on, in the order they were found.`),
        ref: () => "At Proxima Centauri the planets are called Proxima Cen b and Proxima Cen d: the star is Proxima Cen, the letters count its planets.",
      },
      nameStars: {
        title: "Stars get capital letters", goal: "You know how the stars of a system with several stars are called.",
        text: [
          "Many stars have companions: two, three or more stars that belong together. According to NASA stars get capital letters and planets small ones. The star with the planets is usually the undeclared A, the other stars may be called B, C.",
          "Our nearest neighbours show it: Alpha Centauri A and Alpha Centauri B go round each other, and Proxima Centauri belongs to the same system as a third star. Capital and small letters keep stars and planets apart: Alpha Centauri B is a star, Proxima Cen b a planet.",
        ],
        task: "Look at Alpha Centauri A, with B beside it and Proxima marked nearby.",
        remember: [
          "Stars get capital letters, planets small ones.",
          "The star with the planets is usually the undeclared A.",
          "Alpha Centauri A and B are two stars; Proxima Cen b is a planet.",
        ],
        you: (left) => (left == null ? "The light of Alpha Centauri A and B that arrives today is 4.37 years on its way: it set off before you were born." : `The light of Alpha Centauri A and B that arrives today is 4.37 years on its way: it set off when you were ${left}.`),
        ref: (left) => `The light of Alpha Centauri A and B is 4.37 years on its way to us. Someone who is 30 today was ${left} when it set off.`,
      },
      nameGreek: {
        title: "Greek letters and constellations", goal: "You can read a star name like Alpha Centauri.",
        text: [
          "Many bright stars carry a Greek letter and the Latin name of their constellation in the form \"of ...\". The IAU gives Hamal, the brightest star in Aries, as an example: it is also called Alpha Arietis, \"the alpha of Aries\".",
          "Alpha Centauri is read the same way: the alpha of Centaurus. The IAU agreed on the list of the 88 constellations that give these names in 1922, and on their boundaries in 1928.",
        ],
        task: "Look at the constellation Centaurus, the home of Alpha Centauri.",
        remember: [
          "A name like Alpha Arietis means: the alpha of Aries.",
          "After the Greek letter comes the constellation in its Latin form \"of ...\".",
          "The IAU agreed on the 88 constellations in 1922.",
        ],
        you: (name, gen) => `At your birth the Sun stood in ${name}. In Latin its stars are called Alpha ${gen}, Beta ${gen} and so on.`,
        ref: (name, gen) => `On the 1st of April the Sun stands in ${name}. In Latin its stars are called Alpha ${gen}, Beta ${gen} and so on.`,
      },
      nameCatalog: {
        title: "Catalogues and telescopes", goal: "You know what HD, GJ, HIP, TOI, Kepler and TRAPPIST mean in a name.",
        text: [
          "Most stars have no name of their own but a number in a catalogue. According to NASA the first part of a planet's name is usually the telescope or survey that found it, or the catalogue of its star. HD stands for the Henry Draper Catalogue, GJ for the catalogue of nearby stars by Wilhelm Gliese and Hartmut Jahreiss, HIP for the catalogue of ESA's satellite Hipparcos.",
          "Kepler stands for NASA's Kepler space telescope (2009 to 2018), TOI for \"TESS Objects of Interest\", the candidates of NASA's satellite TESS. TRAPPIST is a small telescope in Chile: it gave the system TRAPPIST-1 its name.",
        ],
        task: "Look at TRAPPIST-1, named after a telescope.",
        remember: [
          "At the front of a name there is usually a catalogue, a telescope or a survey.",
          "HD is the Henry Draper Catalogue, GJ the catalogue of nearby stars by Gliese and Jahreiss.",
          "TOI are the candidates of the satellite TESS; TRAPPIST is a telescope in Chile.",
        ],
        cat: {
          HD: "HD stands for the Henry Draper Catalogue.", GJ: "GJ (or Gl, Gliese) stands for the catalogue of nearby stars by Gliese and Jahreiss.",
          HIP: "HIP stands for the catalogue of the satellite Hipparcos.", TOI: "TOI stands for the candidates of the satellite TESS.",
          Kepler: "Kepler stands for the Kepler space telescope.", TRAPPIST: "TRAPPIST is a telescope in Chile.",
          other: "Its name comes from another catalogue, or it is a name of its own.",
        },
        you: (star, what) => `Your star is called ${star}. ${what}`,
        ref: (star, what) => `An example: ${star}. ${what}`,
      },
      nameStories: {
        title: "Names with a story", goal: "You know where names in space come from and who gives them.",
        text: [
          "The planets of our Solar System carry old names. According to NASA every planet except the Earth is named after a Roman god or goddess. Mars, for example, is the Roman god of war.",
          "Exoplanets can get names of their own too. In a public contest of the IAU, 51 Pegasi b, the first giant planet found round a star like the Sun (1995), got the name Dimidium, its star the name Helvetios. Such names do not replace the scientific designations. And star names cannot be bought: the IAU sells no names and distances itself from such offers.",
        ],
        task: "Look at 51 Pegasi b, the planet called Dimidium.",
        remember: [
          "According to NASA every planet except the Earth is named after a Roman god or goddess.",
          "51 Pegasi b is also called Dimidium, its star Helvetios.",
          "The IAU sells no star names.",
        ],
        you: (before, at) => (before != null ? `51 Pegasi b was found in 1995, ${before} years before you were born.` : at === "0" ? "51 Pegasi b was found in 1995, the year you were born." : `51 Pegasi b was found in 1995, when you were ${at}.`),
        ref: (ago) => `51 Pegasi b was found in 1995, ${ago} years ago.`,
      },
      zodWhat: {
        title: "What is a constellation?", goal: "You know what a constellation is and why its stars do not belong together.",
        text: [
          "A constellation is a group of stars that seems to show a shape in the sky and has been given a name. According to NASA there are 88 officially recognised constellations today.",
          "The stars of a constellation are not connected: some are close, others very far away. In Taurus, for example, the stars of the figure lie between 46 and 484 light years from us, by the Hipparcos data of this map. Only from the Earth do they look like a picture.",
        ],
        task: "Look at your constellation (without a date of birth an example) and turn it to the side: then the figure falls apart.",
        remember: [
          "A constellation is a group of stars with a shape and a name.",
          "There are 88 officially recognised constellations.",
          "The stars of a constellation are at different distances and do not belong together.",
        ],
        you: (name, near, far) => (near == null ? `At your birth the Sun stood in ${name}.` : `At your birth the Sun stood in ${name}. Its stars look close together, but the nearest is ${near} light years away${far ? `, the farthest ${far}` : ""}.`),
        ref: (name, near, far) => (near == null ? `On the 1st of April the Sun stands in ${name}.` : `On the 1st of April the Sun stands in ${name}. Its stars look close together, but the nearest is ${near} light years away${far ? `, the farthest ${far}` : ""}.`),
      },
      zodPath: {
        title: "The path of the Sun", goal: "You know which constellations the Sun passes in a year, and you know the thirteenth.",
        text: [
          "The Earth goes round the Sun once a year. From here it looks as if the Sun travelled in front of the stars, through the constellations of the zodiac. That is why the constellations of the night change with the seasons: what stands behind the Sun cannot be seen.",
          "By the boundaries of the International Astronomical Union (IAU), which this map uses too, the Sun passes 13 constellations, not 12. The thirteenth is Ophiuchus, the Serpent Bearer: the Sun stands in front of its stars from about the 30th of November to the 17th of December. Astrology does not have it.",
        ],
        task: "Look at Ophiuchus, the thirteenth constellation on the path of the Sun.",
        remember: [
          "In a year the Sun passes in front of 13 constellations, not 12.",
          "The thirteenth is Ophiuchus, from about the 30th of November to the 17th of December.",
          "Which constellations we see at night depends on the season.",
        ],
        you: (n) => `Since you were born, the Sun has passed through Ophiuchus about ${n} times, once every year.`,
        ref: (n) => `In 30 years the Sun passes through Ophiuchus ${n} times, once every year.`,
      },
      zodShift: {
        title: "Zodiac sign and constellation", goal: "You know why your zodiac sign and the constellation behind the Sun usually disagree.",
        text: [
          "The signs of astrology are not constellations: they cut the path of the Sun into twelve equal parts of 30 degrees each, counted from the start of spring. The constellations are of different sizes.",
          "And the Earth's axis wobbles slowly, like a spinning top. According to NASA one wobble takes about 25,800 years. With the axis the start of spring moves along the stars, and the signs move with it. So on your birthday the Sun usually stands in front of another constellation than your sign is called.",
        ],
        task: "Look at the constellation that has the name of your sign, and compare it with the one the Sun really stood in.",
        remember: [
          "A sign is exactly 30 degrees long, a constellation of any size.",
          "The Earth's axis wobbles; one wobble takes about 25,800 years.",
          "That is why sign and constellation usually disagree.",
        ],
        you: (sign, real, same) => (same ? `For you they agree: your sign is ${sign}, and at your birth the Sun stood in ${real} too.` : `Your sign is ${sign}. But at your birth the Sun stood in front of the stars of ${real}.`),
        ref: (sign, real) => `Someone born on the 1st of April has the sign ${sign}. But on that day the Sun stands in ${real}.`,
      },
      zodScience: {
        title: "Astronomy and astrology", goal: "You can tell astronomy and astrology apart.",
        text: [
          "Astronomy is the science of everything in space. It follows the scientific method: evidence and data decide, and every claim can be tested.",
          "Astrology is something else. It rests on the belief that the positions of stars and planets can foretell the future or describe a person. It matters to some cultural traditions, but according to NASA its claims are not based on scientific evidence.",
        ],
        task: "There is no task in the 3D view for this step. Answer the questions, then the step is done.",
        remember: [
          "Astronomy is a science: evidence and data decide.",
          "Astrology is a belief; its claims are not based on scientific evidence.",
          "That a sign says something about a person has not been shown by science.",
        ],
        you: (sign) => `That your sign, ${sign}, says something about you has not been shown by science. What it really is: a stretch of 30 degrees on the path of the Sun.`,
        ref: (sign) => `That a sign like ${sign} says something about a person has not been shown by science. What it really is: a stretch of 30 degrees on the path of the Sun.`,
      },
      zodLight: {
        title: "The light of your constellation", goal: "You know that you see the stars as they were many years ago.",
        text: [
          "A light year is the distance light travels in a year. If a star is 46 light years away, its light has been on its way to us for 46 years: we see the star as it was 46 years ago.",
          "Within a constellation this light has different ages. In Taurus the light of the nearest star of the figure arrives after 46 years, that of the farthest after almost 500 years. A look at a constellation is a look into many different times.",
        ],
        task: "Look at your constellation from the side: every star in it shows you another time.",
        remember: [
          "A light year is a distance: how far light travels in a year.",
          "We see a star as it was when its light set off.",
          "The light of the stars of a constellation has different ages.",
        ],
        you: (name, ly, before, at) => (ly == null ? `The light of the stars of ${name}, where the Sun stood at your birth, has different ages.` : before != null ? `The light of the nearest star of ${name} has been travelling for ${ly} years: it set off ${before} years before you were born.` : at === "0" ? `The light of the nearest star of ${name} has been travelling for ${ly} years: it set off in the year you were born.` : `The light of the nearest star of ${name} has been travelling for ${ly} years: it set off when you were ${at}.`),
        ref: (name, ly) => (ly == null ? `On the 1st of April the Sun stands in ${name}; the light of its stars has different ages.` : `On the 1st of April the Sun stands in ${name}. The light of its nearest star has been travelling to us for ${ly} years.`),
      },
      habWhat: {
        title: "What does habitable mean?", goal: "You can explain the habitable zone and why liquid water matters.",
        text: [
          "NASA defines the habitable zone as the distance from a star at which liquid water could exist on the surfaces of orbiting planets. Liquid water is essential for life as we know it.",
          "But the zone is only a first cut, as NASA puts it. A planet also needs a suitable size, a suitable atmosphere and a calm star that does not sterilise it with flares.",
        ],
        task: "Fly to the Earth, the one planet we know with life.",
        remember: [
          "The habitable zone: the distances from a star at which liquid water could exist on a planet's surface.",
          "Liquid water is essential for life as we know it.",
          "The zone is only a first cut: size, atmosphere and a calm star matter too.",
        ],
        you: (n) => `Since you were born, the Earth has carried you round the Sun ${n} times, all the time inside its habitable zone.`,
        ref: (n) => `In 30 years the Earth carries a person round the Sun ${n} times, all the time inside its habitable zone.`,
      },
      habZone: {
        title: "The habitable zone", goal: "You know why the habitable zone differs from star to star.",
        text: [
          "The habitable zone depends on the star. Around hotter stars it is wider; around red dwarfs it is narrow and very close to the star.",
          "TOI-700 d, for example, goes round a small M-type star in only 37.4 days and lies in its habitable zone. In the 3D view a green ring shows the habitable zone of a system.",
        ],
        task: "Fly to TOI-700 d and look at the green ring of its habitable zone.",
        remember: [
          "Around hotter stars the habitable zone is wider.",
          "Around red dwarfs it is narrow and very close to the star.",
          "TOI-700 d goes round its small star in 37.4 days.",
        ],
        you: (n) => `On TOI-700 d you would be ${n} years old: a year there lasts 37.4 days.`,
        ref: (n) => `A person of 30 would be ${n} years old on TOI-700 d: a year there lasts 37.4 days.`,
      },
      habWater: {
        title: "Liquid water", goal: "You know why water is sought, and where there may be oceans in our own Solar System.",
        text: [
          "Water is essential for all life on the Earth; up to 60 % of the adult human body is water. That is why the search for life is a search for liquid water first.",
          "Oceans may hide under ice, too: there is strong evidence that Jupiter's moon Europa has a saltwater ocean, and Saturn's moon Enceladus has a global ocean inside, with jets that spew water vapour and ice particles into space.",
        ],
        task: "Fly to Jupiter and click its moon Europa.",
        remember: [
          "Water is essential for all life on the Earth; up to 60 % of the adult body is water.",
          "There is strong evidence for a saltwater ocean in Jupiter's moon Europa.",
          "Saturn's moon Enceladus has a global ocean and jets of water vapour and ice.",
        ],
        you: (n) => `Since you were born, Europa, the moon with the ocean, has gone round Jupiter ${n} times.`,
        ref: (n) => `In 30 years Europa, the moon with the ocean, goes round Jupiter ${n} times.`,
      },
      habAtmos: {
        title: "Atmospheres", goal: "You can explain why the air of a planet decides whether water can stay liquid.",
        text: [
          "Venus shows how much the air matters: its thick atmosphere, mostly carbon dioxide, traps heat in a runaway greenhouse effect, and the surface is about 467 °C.",
          "Mars shows the other extreme: its thin atmosphere is too thin for liquid water to exist there for long. The Earth lies in between, and that is one reason why water stays liquid here.",
        ],
        task: "Fly to Venus, the planet with too much air.",
        remember: [
          "Venus: a thick atmosphere of carbon dioxide traps heat; the surface is about 467 °C.",
          "Mars: the atmosphere is too thin for liquid water to last long.",
          "The air of a planet decides whether water can stay liquid.",
        ],
        you: (n) => `On Venus you would be ${n} years old, on a world where the air traps the heat.`,
        ref: (n) => `A person of 30 would be ${n} years old on Venus, on a world where the air traps the heat.`,
      },
      habIngredients: {
        title: "The ingredients of life", goal: "You know what life as we know it needs, and what the rover Curiosity found on Mars.",
        text: [
          "Life as we know it needs liquid water, chemical building blocks and a source of energy. NASA calls liquid water an essential ingredient for life as we know it.",
          "In 2018 the rover Curiosity found organic molecules in three-billion-year-old rock in Gale crater on Mars, the floor of a former lake. According to NASA that lake held all the ingredients needed for life, chemical building blocks and sources of energy. But organic molecules can also form without life: they are no proof of it.",
        ],
        task: "Fly to Mars, where Curiosity found the organic molecules.",
        remember: [
          "Life as we know it needs liquid water, chemical building blocks and energy.",
          "In 2018 Curiosity found organic molecules in three-billion-year-old rock on Mars.",
          "Organic molecules are no proof of life: they can also form without it.",
        ],
        you: (n) => `The rock in which Curiosity found the molecules is about three billion years old: about ${n} times as old as you.`,
        ref: (n) => `The rock in which Curiosity found the molecules is about three billion years old: about ${n} times as old as a person of 30.`,
      },
      habExtreme: {
        title: "Extreme life on Earth", goal: "You know living things that live where we could not.",
        text: [
          "Living things that endure at the edges of habitability, at extreme temperatures, acidity or radiation, are called extremophiles. In 2026 NASA reported an amoeba from hot springs in California that still divides at 63 °C: a record for all known living things with a cell nucleus.",
          "On the sea floor, water hotter than 400 °C streams out of hydrothermal vents. According to NOAA the communities there live mainly on chemosynthesis: bacteria draw energy from chemical reactions, usually without sunlight. Giant tube worms there grow faster than any other sea invertebrate on Earth.",
        ],
        task: "Fly to Jupiter's moon Europa: an ocean is thought to lie under its ice. Whether there is life in it, nobody knows.",
        remember: [
          "Extremophiles live at extreme temperatures, acidity or radiation.",
          "An amoeba from hot springs still divides at 63 °C.",
          "At deep-sea vents whole communities live without sunlight, on chemosynthesis.",
        ],
        you: () => "Water at 63 °C would be far too hot for you to bathe in. The amoeba still divides in it.",
        ref: () => "Water at 63 °C would be far too hot for anyone to bathe in. The amoeba still divides in it.",
      },
      habLife: {
        title: "Is there life out there?", goal: "You know how scientists look for life, and that the answer is still open.",
        text: [
          "So far the only life we know of is on the Earth. Life here even thrives at superheated vents on the ocean floor, which gives hope that it could exist in strange places elsewhere.",
          "The James Webb Space Telescope could get the first glimpses of the gases in the air of Earth-sized exoplanets. Oxygen, carbon dioxide and methane together would be a strong indication of possible life. Whether we will find it is an open question.",
        ],
        task: "Fly to Proxima b, the nearest candidate of the map.",
        remember: [
          "So far we know of life only on the Earth.",
          "Life on the Earth even lives at superheated vents on the ocean floor.",
          "Gases in the air of an exoplanet (oxygen, carbon dioxide, methane together) could hint at life: an open question.",
        ],
        you: (at, now, year) => `In ${year}, the year you were born, this map knew ${at} candidates in a habitable zone; today it knows ${now}.`,
        ref: (at, now, year) => `In ${year}, when a person of 30 today was born, this map knew ${at} candidates in a habitable zone; today it knows ${now}.`,
      },
    },
    q: {
      sunLight: { q: "How long does sunlight need to reach the Earth?", o: ["About 8 minutes", "About 8 seconds", "About 8 hours"], e: "About 8 minutes and 20 seconds: the Sun is 150 million kilometres away, and light travels about 300,000 kilometres per second." },
      sunEnergy: { q: "Where does the Sun's energy come from?", o: ["Hydrogen fusing into helium in its core", "Burning coal and gas", "The light of other stars"], e: "In the core of the Sun hydrogen nuclei fuse into helium. That is nuclear fusion; it frees the energy that shines." },
      sunOrbits: { you: "How many times has the Earth carried you round the Sun since you were born?", ref: "How many times has a person of 30 been carried round the Sun?", e: (n) => `${n} times: the Earth goes round the Sun once a year, and you travel with it.` },
      venusDay: { q: "On which planet is a day longer than a year?", o: ["Venus", "Mercury", "Mars"], e: "Venus turns very slowly: one turn takes longer than one trip round the Sun." },
      marsAge: { you: "How old would you be on Mars?", ref: "How old would a person of 30 be on Mars?", e: (n) => `${n}: a year on Mars lasts 1.88 Earth years, so there are fewer birthdays there.` },
      closest: { q: "Which planet is closest to the Sun?", o: ["Mercury", "Venus", "Earth"], e: "Mercury, at 0.39 AU. It goes round the Sun in 88 days." },
      largest: { q: "Which is the largest planet?", o: ["Jupiter", "Saturn", "Neptune"], e: "Jupiter: about 11 Earths would fit side by side across it." },
      saturnDensity: { q: "Which planet is less dense than water?", o: ["Saturn", "Jupiter", "Uranus"], e: "Saturn: its mean density is lower than that of water." },
      jupiterLaps: { you: "How many times has Jupiter gone round the Sun since you were born?", ref: "How many times does Jupiter go round the Sun in 30 years?", e: (n) => `${n} times: one year of Jupiter lasts almost 12 Earth years.` },
      largestMoon: { q: "Which is the largest moon of the Solar System?", o: ["Ganymede", "Our Moon", "Europa"], e: "Ganymede, a moon of Jupiter: it is even larger than the planet Mercury." },
      galileo: { q: "Who found the four large moons of Jupiter in 1610?", o: ["Galileo Galilei", "Isaac Newton", "Johannes Kepler"], e: "Galileo Galilei, with one of the first telescopes. They are called the Galilean moons." },
      sameSide: { q: "Why do we always see the same side of the Moon?", o: ["It turns exactly once per orbit", "It does not turn at all", "The other side is always dark"], e: "The Moon turns once each time it goes round the Earth, so the same side always faces us. The far side gets sunlight too." },
      dwarf: { q: "Which of these is a dwarf planet?", o: ["Pluto", "Mars", "Neptune"], e: "Pluto. Since 2006 it counts as a dwarf planet, like Ceres in the asteroid belt." },
      moonLaps: { you: "About how many times has the Moon gone round the Earth since you were born?", ref: "About how many times does the Moon go round the Earth in 30 years?", e: (n) => `About ${n} times: one orbit takes 27.3 days.` },
      neptune: { q: "About how far is Neptune from the Sun?", o: ["30 AU", "3 AU", "300 AU"], e: "About 30 AU, 30 times as far as the Earth. The light of the Sun needs about 4 hours to get there." },
      starLight: { you: (name) => `For how many years did the light of your star, ${name}, travel to reach you?`, e: (n, name) => `About ${n} years: ${name} is about ${n} light years away, and a light year is the distance light travels in a year.` },
      proximaLight: { q: "How long does the light of Proxima Centauri, the nearest star after the Sun, travel to us?", o: ["About 4.2 years", "About 4.2 days", "About 42 years"], e: "About 4.2 years: Proxima Centauri is 4.24 light years away." },
      sunSize: { q: "About how many Earths would fit side by side across the Sun?", o: ["About 109", "About 11", "About 1,000"], e: "About 109: the radius of the Sun is about 109 times that of the Earth." },
      asteroidBelt: { q: "Where do most asteroids go round the Sun?", o: ["Between Mars and Jupiter", "Between the Earth and Mars", "Between Saturn and Uranus"], e: "In the main asteroid belt between Mars and Jupiter. Its largest object, Ceres, is a dwarf planet." },
      cometTail: { q: "Which way does the tail of a comet point?", o: ["Away from the Sun", "Towards the Sun", "Always towards the Earth"], e: "Away from the Sun: sunlight and the solar wind blow the dust and gas of the coma away from it." },
      nearestStar: { q: "Which is the nearest star after the Sun?", o: ["Proxima Centauri", "Sirius", "Polaris"], e: "Proxima Centauri, about 4.2 light years away." },
      lightYear: { q: "What is a light year?", o: ["A distance: how far light travels in a year", "A time: one year in space", "The age of a star"], e: "A distance. Light travels nearly 9.5 trillion kilometres in a year." },
      pairPeriod: { q: "How long do Alpha Centauri A and B take to go round each other?", o: ["About 80 years", "About 80 days", "About 8,000 years"], e: "About 80 years. At their closest they are about 11 times as far apart as the Earth and the Sun." },
      pairSun: { q: "Which star is the same type as our Sun?", o: ["Alpha Centauri A", "Alpha Centauri B", "Proxima Centauri"], e: "Alpha Centauri A, type G2 like the Sun, and a little bigger." },
      constellation: { q: "In which constellation does Alpha Centauri lie?", o: ["Centaurus", "Orion", "Ursa Major"], e: "In Centaurus, the Centaur." },
      redDwarf: { q: "What kind of star is Proxima Centauri?", o: ["A red dwarf", "A red giant", "A star like the Sun"], e: "A red dwarf: small, cool and far fainter than the Sun." },
      proximaEye: { q: "Can you see Proxima Centauri with the naked eye?", o: ["No, it is too faint", "Yes, it is the brightest star in the sky", "Only in the daytime"], e: "No: although it is the nearest star, it is too faint for the naked eye." },
      thirdStar: { q: "How many stars does the Alpha Centauri system have?", o: ["Three", "Two", "One"], e: "Three: Alpha Centauri A and B, and Proxima Centauri, the faintest." },
      proximaBYear: { q: "How long is a year on Proxima b?", o: ["About 11 days", "About 11 months", "About 11 years"], e: "About 11.2 days: that is how fast it goes round its star." },
      habitable: { q: "What does \"in the habitable zone\" mean?", o: ["Liquid water could exist there under the right conditions", "Life has been found there", "The planet certainly has air"], e: "Only that the temperature could allow liquid water. Whether Proxima b has air, water or life is unknown." },
      howFound: { q: "How was Proxima b found?", o: ["From tiny wobbles of its star", "From a photo of the planet", "From a radio signal"], e: "From tiny shifts in the light of the star, which wobbles as the planet pulls on it." },
      voyagerSpeed: { q: "About how fast does Voyager 1 move away from the Sun?", o: ["About 17 km per second", "About 17 km per hour", "About 17,000 km per second"], e: "About 17 kilometres per second, more than 61,000 kilometres per hour." },
      travelTime: { q: "About how long would Voyager 1 need to reach Proxima Centauri?", o: ["About 75,000 years", "About 750 years", "About 7.5 million years"], e: "About 75,000 years: 4.2 light years at 17 kilometres per second." },
      proximaLeft: { you: "How old were you when the light of Proxima that reaches you today set off?", ref: "How old was a person of 30 today when the light of Proxima that reaches us now set off?", e: (n) => `${n}: the light set off about 4.2 years ago.` },
      lightTrips: { you: "How many times could light have made the way from Proxima to us in your life so far?", ref: "How many times can light make the way from Proxima to us in 30 years?", e: (n) => `${n} times: it needs about 4.2 years for the way.` },
      proximaBAge: { you: "How old would you be on Proxima b?", ref: "How old would a person of 30 be on Proxima b?", e: (n) => `${n}: a year on Proxima b lasts only 11.2 days.` },
      lifetimes: { you: "How many times your life so far would the trip at the speed of Voyager 1 take?", ref: "How many times the life of a person of 30 would the trip at the speed of Voyager 1 take?", e: (n) => `About ${n} times: the trip would take about 75,000 years.` },
      exoDefinition: { q: "What is an exoplanet?", o: ["A planet outside our Solar System", "A moon of a big planet", "A star without light"], e: "A planet outside our Solar System; usually it goes round another star." },
      firstSunLike: { q: "In which year was the first planet found round a star like the Sun?", o: ["1995", "1965", "2015"], e: "1995: 51 Pegasi b. Its discoverers shared the Nobel Prize in Physics in 2019." },
      firstPulsar: { q: "Round what kind of object were the first exoplanets found in 1992?", o: ["A pulsar", "A star like the Sun", "A black hole"], e: "A pulsar. Three years later came 51 Pegasi b, the first round a star like the Sun." },
      transitDim: { q: "What does the transit method measure?", o: ["The slight dimming of a star when a planet passes in front of it", "The light of the planet itself", "Radio signals from the planet"], e: "The slight dimming of the star while the planet passes in front of it." },
      wobble: { q: "What does the radial velocity method look for?", o: ["The wobble of the star, pulled by its planet", "A shadow on the Earth", "The moons of the planet"], e: "The wobble of the star: its light shifts a little towards blue and towards red." },
      mostMethod: { q: "With which method were most known exoplanets found?", o: ["Transit", "Radial velocity", "Photos"], e: "Transit: in this map 4,770 of the 6,423 planets." },
      superEarth: { q: "What is a super-Earth?", o: ["A planet more massive than the Earth but lighter than Neptune", "A planet with a super hot core", "Any planet bigger than Jupiter"], e: "More massive than the Earth, lighter than Neptune; it can be made of gas, rock or both." },
      terrestrialMade: { q: "What are terrestrial planets made of?", o: ["Rock, silicate, water or carbon", "Mostly hydrogen and helium", "Only ice"], e: "Rock, silicate, water or carbon; they are Earth-sized or smaller." },
      trappistSeven: { q: "How many Earth-sized planets go round TRAPPIST-1?", o: ["Seven", "Two", "Twelve"], e: "Seven, round a small red dwarf about 40 light years away." },
      hotJupiter: { q: "What is a hot Jupiter?", o: ["A gas giant very close to its star", "A Jupiter with volcanoes", "A star that looks like Jupiter"], e: "A gas giant very close to its star, like 51 Pegasi b." },
      pegYear: { q: "How long is a year on 51 Pegasi b?", o: ["About 4 days", "About 4 years", "About 40 years"], e: "About 4.2 days." },
      gasGiantSize: { q: "How big are gas giants?", o: ["The size of Saturn or Jupiter, or much larger", "The size of the Earth", "The size of the Moon"], e: "The size of Saturn or Jupiter, or much larger." },
      lavaWorld: { q: "What covers 55 Cancri e, according to NASA?", o: ["A global ocean of lava", "A thick sheet of ice", "Forests"], e: "A global ocean of lava: it is a super hot world." },
      rogue: { q: "Do all exoplanets go round a star?", o: ["No, some wander through the galaxy without a sun", "Yes, all of them", "None of them do"], e: "No: usually they go round a star, but some are sunless rogues in permanent darkness." },
      keplerScope: { q: "Which space telescope found thousands of exoplanets with the transit method?", o: ["Kepler", "Hubble", "Voyager"], e: "NASA's Kepler telescope." },
      knownAtBirth: { you: "How many planets of this catalogue had been found by the year you were born?", ref: "How many planets of this catalogue had been found by the year a person of 30 today was born?", e: (n) => `${n}: the catalogue grows every year.` },
      transitSince: { you: "How many planets of this catalogue have been found with the transit method since the year you were born?", ref: "How many planets of this catalogue have been found with the transit method in the last 30 years?", e: (n) => `${n}: many of them with the Kepler telescope.` },
      trappistAge: { you: "How old would you be on TRAPPIST-1 e?", ref: "How old would a person of 30 be on TRAPPIST-1 e?", e: (n) => `${n}: a year on TRAPPIST-1 e lasts 6.1 days.` },
      pegAge: { you: "How old would you be on 51 Pegasi b?", ref: "How old would a person of 30 be on 51 Pegasi b?", e: (n) => `${n}: a year on 51 Pegasi b lasts 4.2 days.` },
      cancriAge: { you: "How many birthdays would you have had on 55 Cancri e?", ref: "How many birthdays would a person of 30 have had on 55 Cancri e?", e: (n) => `${n}: a year on 55 Cancri e lasts less than 18 hours.` },
      hzDef: { q: "What is the habitable zone?", o: ["The distances from a star at which liquid water could exist on a planet's surface", "The part of a planet where people live", "The area around a black hole"], e: "The distances from a star at which liquid water could exist on the surface of a planet, as NASA defines it." },
      waterNeed: { q: "Why do scientists look for liquid water first?", o: ["It is essential for life as we know it", "It makes planets shine", "It keeps planets in their orbits"], e: "Liquid water is essential for life as we know it." },
      firstCut: { q: "Is every planet in the habitable zone habitable?", o: ["No, the zone is only a first cut", "Yes, always", "Only if it has moons"], e: "No: size, atmosphere and a calm star matter too." },
      zoneHot: { q: "Around which stars is the habitable zone wider?", o: ["Hotter stars", "Cooler stars", "It is the same for all stars"], e: "Around hotter stars." },
      redDwarfZone: { q: "Where is the habitable zone of a red dwarf?", o: ["Narrow and very close to the star", "Far away from the star", "A red dwarf has none"], e: "Narrow and very close to the star: its planets go round in days or weeks." },
      toiYear: { q: "How long is a year on TOI-700 d?", o: ["About 37 days", "About 37 years", "About 37 hours"], e: "About 37.4 days." },
      europaOcean: { q: "What is there strong evidence for under the surface of Europa?", o: ["A saltwater ocean", "A sea of lava", "A frozen forest"], e: "A saltwater ocean." },
      enceladusJets: { q: "What do the jets of Enceladus spew into space?", o: ["Water vapour and ice particles", "Lava", "Sand"], e: "Water vapour and ice particles, from its ocean inside." },
      bodyWater: { q: "How much of the adult human body is water, according to the USGS?", o: ["Up to 60 %", "About 10 %", "Over 95 %"], e: "Up to 60 %." },
      venusGreenhouse: { q: "Why is Venus so hot?", o: ["Its thick air of carbon dioxide traps the heat", "It is the planet closest to the Sun", "It has volcanoes everywhere"], e: "Its thick atmosphere traps heat in a runaway greenhouse effect; Mercury is closer to the Sun but not as hot." },
      marsThin: { q: "Why can liquid water not last long on Mars today?", o: ["Its atmosphere is too thin", "It has no water at all", "It is too close to the Sun"], e: "Its atmosphere is too thin for liquid water to exist there for long." },
      venusTemp: { q: "About how hot is the surface of Venus?", o: ["About 467 °C", "About 46 °C", "About -46 °C"], e: "About 467 °C." },
      onlyEarth: { q: "Where do we know of life so far?", o: ["Only on the Earth", "On Mars", "On Proxima b"], e: "Only on the Earth, so far." },
      vents: { q: "Where does life on the Earth thrive at superheated vents?", o: ["On the ocean floor", "On mountain tops", "In the clouds"], e: "On the ocean floor: a hint that life could exist in strange places elsewhere." },
      biosignature: { q: "Which telescope could get the first glimpses of the gases in the air of Earth-sized exoplanets?", o: ["The James Webb Space Telescope", "Voyager 1", "Galileo's telescope"], e: "The James Webb Space Telescope, launched in 2021." },
      trappistFit: { q: "Where would all seven planets of TRAPPIST-1 fit, according to NASA?", o: ["Inside the orbit of Mercury", "Inside the orbit of Jupiter", "Only beyond Neptune"], e: "Inside the orbit of Mercury: they circle their small star very closely." },
      kepler90Eight: { q: "How many planets are known around Kepler-90?", o: ["Eight, as many as in our Solar System", "Two", "Fifty"], e: "Eight, as many as in our Solar System." },
      kepler90AI: { q: "How was the eighth planet of Kepler-90 found in 2017?", o: ["A neural network from Google searched the Kepler data", "With the naked eye", "A space probe flew there"], e: "An artificial neural network from Google searched the data of the Kepler telescope." },
      hdBlue: { q: "What colour is HD 189733 b, according to NASA?", o: ["Cobalt blue", "Fiery red", "Grass green"], e: "Cobalt blue: its hazy sky has clouds that contain glass." },
      kepler16Suns: { q: "What is special about Kepler-16 b?", o: ["It circles two stars", "It has no star", "It is made of diamond"], e: "It circles two stars at once, like Tatooine in Star Wars." },
      kepler16Saturn: { q: "Which planet of our Solar System is Kepler-16 b like in size and mass?", o: ["Saturn", "Earth", "Mercury"], e: "Saturn." },
      lifeNeeds: { q: "What did the old lake in Gale crater on Mars hold, according to NASA?", o: ["All the ingredients for life: chemical building blocks and sources of energy", "Living fish", "Only ice"], e: "All the ingredients needed for life; whether there was life is not known." },
      marsOrganics: { q: "What did Curiosity find in three-billion-year-old rock in 2018?", o: ["Organic molecules", "Fossil bones", "Gold"], e: "Organic molecules, in the mudstone of an old lake." },
      organicNotLife: { q: "Are organic molecules a proof of life?", o: ["No, they can also form without life", "Yes, always", "Only on Mars"], e: "No: they are often linked with life, but they can also form without it." },
      extremophile: { q: "What are living things called that live at the edges of habitability?", o: ["Extremophiles", "Exoplanets", "Asteroids"], e: "Extremophiles: they endure extreme temperatures, acidity or radiation." },
      fireAmoeba: { q: "Up to what temperature does the amoeba from the hot springs of California still divide?", o: ["63 °C", "6 °C", "630 °C"], e: "63 °C, a record for all known living things with a cell nucleus." },
      chemosynthesis: { q: "Where do the communities at deep-sea vents get their energy from?", o: ["From chemical reactions, usually without sunlight", "From sunlight", "From moonlight"], e: "From chemosynthesis: bacteria draw energy from chemical reactions." },
      tubeWorms: { q: "Which animals at deep-sea vents grow faster than any other sea invertebrate?", o: ["Giant tube worms", "Jellyfish", "Starfish"], e: "Giant tube worms." },
      trappistBLaps: { you: "About how many times has TRAPPIST-1 b gone round its star since you were born?", ref: "About how many times does TRAPPIST-1 b go round its star in 30 years?", e: (n) => `About ${n} times: a year there lasts 1.5 days.` },
      kepler16Age: { you: "How old would you be on Kepler-16 b?", ref: "How old would a person of 30 be on Kepler-16 b?", e: (n) => `${n}: a year on Kepler-16 b lasts 229 days.` },
      rockFactor: { you: "About how many times as old as you is the rock in which Curiosity found organic molecules?", ref: "About how many times as old as a person of 30 is the rock in which Curiosity found organic molecules?", e: (n) => `About ${n} times: it is about three billion years old.` },
      nebulaWhat: { q: "What is a nebula, according to NASA?", o: ["A giant cloud of dust and gas in space", "A planet covered in fog", "A small star"], e: "A giant cloud of dust and gas in space." },
      nebulaDeath: { q: "Where do some nebulae come from?", o: ["From the gas and dust of an exploding dying star", "From the oceans of planets", "From the Moon"], e: "From the gas and dust thrown out by the explosion of a dying star, such as a supernova." },
      nebulaBirth: { q: "What happens in other nebulae?", o: ["New stars begin to form", "Planets die", "Nothing at all"], e: "New stars begin to form." },
      pillarsWhere: { q: "Where are the Pillars of Creation?", o: ["In the Eagle Nebula in Serpens", "On Mars", "In the Andromeda Galaxy"], e: "In the Eagle Nebula (M16) in the constellation Serpens." },
      pillarsDist: { q: "How far away is the Eagle Nebula?", o: ["6,500 (ESA) or 7,000 (NASA) light years", "65 light years", "6.5 million light years"], e: "6,500 light years by ESA, 7,000 by NASA: the pages disagree." },
      pillarsWebb: { q: "Which telescope showed the pillars in a new picture in 2022?", o: ["Webb", "Galileo's telescope", "TRAPPIST"], e: "The Webb space telescope, on 19 October 2022." },
      horseType: { q: "What kind of nebula is the Horsehead Nebula?", o: ["A dark nebula", "A planetary nebula", "A supernova remnant"], e: "A dark nebula: a dark cloud of dust and gas." },
      horseWhere: { q: "In which constellation is the Horsehead Nebula?", o: ["Orion", "Taurus", "Lyra"], e: "In Orion." },
      horseDist: { q: "How far away is the Horsehead Nebula, according to ESA/Hubble?", o: ["About 1,300 light years", "About 13 light years", "About 13 million light years"], e: "About 1,300 light years." },
      ringType: { q: "What kind of nebula is the Ring Nebula?", o: ["A planetary nebula", "A dark nebula", "A star nursery"], e: "A planetary nebula." },
      ringWhere: { q: "In which constellation is the Ring Nebula?", o: ["Lyra", "Orion", "Andromeda"], e: "In Lyra, about 2,000 light years away." },
      ringFrom: { q: "Where does a planetary nebula come from?", o: ["From the shed layers of a dying star like the Sun", "From a planet that exploded", "From a black hole"], e: "From the outer layers a dying star like the Sun sheds." },
      crabType: { q: "What is the Crab Nebula?", o: ["The remnant of a supernova", "A star nursery", "A galaxy"], e: "The remnant of a supernova, in Taurus." },
      crabYear: { q: "When did Chinese astronomers see the supernova of the Crab Nebula?", o: ["In 1054", "In 1954", "In 54 BC"], e: "In 1054, as a \"guest star\"." },
      crabCore: { q: "What sits in the middle of the Crab Nebula?", o: ["A rapidly spinning neutron star, a pulsar", "A planet", "Nothing"], e: "A rapidly spinning neutron star, a pulsar." },
      mwShape: { q: "What shape does the Milky Way have?", o: ["A barred spiral", "A ball", "A ring"], e: "A barred spiral: a disk with spiral arms and a central bar of stars." },
      mwSize: { q: "How big is the Milky Way?", o: ["More than 100,000 light years", "About 100 light years", "About 100 million km"], e: "More than 100,000 light years across." },
      mwStars: { q: "How many stars does the Milky Way have, according to ESA?", o: ["More than 100 billion", "About 8", "About 100,000"], e: "More than a hundred thousand million: over 100 billion." },
      orionArm: { q: "Near which arm of the Milky Way does the Sun lie?", o: ["The Orion Arm", "The Andromeda Arm", "The arm of the Moon"], e: "Near the Orion Arm, a small, partial arm." },
      armBetween: { q: "Between which arms does the Orion Arm lie?", o: ["The Sagittarius and Perseus arms", "Taurus and Lyra", "There are no other arms"], e: "Between the Sagittarius and Perseus arms." },
      centerDist: { q: "How far is the centre of the Milky Way from us?", o: ["About 26,000 to 27,000 light years", "About 4 light years", "About 2.5 million light years"], e: "About 26,000 (NASA, 8 kpc) to 27,000 (ESO) light years." },
      lapTime: { q: "How long does one lap of the Sun round the centre take?", o: ["About 230 to 240 million years", "One year", "About 4.6 billion years"], e: "About 230 million (NASA's Sun page) or 240 million years (NASA's galaxy page, ESA)." },
      sunSpeed: { q: "How fast does the Sun travel round the centre, according to NASA?", o: ["About 720,000 km/h", "About 72 km/h", "At the speed of light"], e: "At an average of about 720,000 km/h." },
      lapDiffer: { q: "What do the NASA and ESA pages say about the time of one lap?", o: ["They disagree: 230 or 240 million years", "They all say exactly 230 million", "They give no number"], e: "They disagree: 230 million on one page, 240 million on others." },
      bandWhat: { q: "What is the band of light across the night sky?", o: ["The disk of our galaxy", "A cloud of the Earth", "The light of the Moon"], e: "The central disk of our home galaxy." },
      bandEdge: { q: "From where do we see the Milky Way's disk?", o: ["From the inside, edge on", "From above", "From outside the galaxy"], e: "From the inside, edge on: the Sun lies in the disk." },
      bandDir: { q: "In which direction lies the centre of the Milky Way?", o: ["Towards Sagittarius", "Towards Andromeda", "Towards the North Star"], e: "Towards the constellation Sagittarius." },
      gaiaWhat: { q: "What did ESA's Gaia make?", o: ["A precise 3D map of the Milky Way", "The first image of a black hole", "A landing on Mars"], e: "A precise three-dimensional map of the Milky Way." },
      gaiaCount: { q: "How many sources does Gaia DR3 (2022) have?", o: ["About 1.8 billion", "About 1,800", "About 18"], e: "1,811,709,771, about 1.8 billion." },
      gaiaEnd: { q: "When did Gaia end its science observations?", o: ["On 15 January 2025", "In 1990", "It is still observing"], e: "On 15 January 2025." },
      localGroup: { q: "What is the Local Group?", o: ["The group of galaxies the Milky Way belongs to", "The planets of the Sun", "The stars of a constellation"], e: "The group of galaxies the Milky Way belongs to." },
      groupCount: { q: "How many galaxies does the Local Group have, according to NASA?", o: ["Over 50", "Exactly 3", "About a million"], e: "Over 50." },
      m33Third: { q: "Which is the third largest galaxy of the Local Group?", o: ["The Triangulum Galaxy (M33)", "The Small Magellanic Cloud", "M87"], e: "The Triangulum Galaxy (M33), about 3 million light years away." },
      lmcSat: { q: "What is the Large Magellanic Cloud?", o: ["A satellite galaxy of the Milky Way", "A nebula in Orion", "A cloud on the Earth"], e: "A satellite galaxy of the Milky Way." },
      smcDist: { q: "How far away is the Small Magellanic Cloud, according to ESA/Hubble?", o: ["200,000 light years", "200 light years", "200 million light years"], e: "200,000 light years." },
      smcWhere: { q: "In which constellation is the Small Magellanic Cloud?", o: ["Tucana", "Andromeda", "Orion"], e: "In Tucana." },
      andDist: { q: "How far away is the Andromeda Galaxy, according to NASA?", o: ["2.5 million light years", "2,500 light years", "25 billion light years"], e: "2.5 million light years." },
      andEye: { q: "Can you see the Andromeda Galaxy without a telescope?", o: ["Yes, from a dark site with the unaided eye", "No, never", "Only from the Moon"], e: "Yes: from a dark site it is easily visible with the unaided eye." },
      andWhere: { q: "Which is the biggest galaxy of the Local Group?", o: ["The Andromeda Galaxy", "The Milky Way", "The Small Magellanic Cloud"], e: "The Andromeda Galaxy." },
      andSpeed: { q: "How fast is Andromeda coming towards us, according to NASA?", o: ["About 250,000 miles (400,000 km) per hour", "About 25 km per hour", "It is moving away"], e: "About 250,000 miles per hour, about 400,000 km per hour." },
      collide2012: { q: "What did NASA forecast in 2012?", o: ["A head-on collision in about 4 billion years", "A collision next year", "No collision ever"], e: "A head-on collision in about four billion years." },
      merge2012: { q: "By the forecast of 2012, when would the two galaxies merge into one?", o: ["In about 6 billion years", "In about 6,000 years", "Never"], e: "In about 6 billion years." },
      chance2025: { q: "What chance of a collision within 10 billion years did the 2025 study find?", o: ["Only 50-50", "100 %", "0 %"], e: "Only a 50-50 chance." },
      dataNew: { q: "Which data did the 2025 study use?", o: ["From Hubble and ESA's Gaia", "Only old drawings", "From a probe on Andromeda"], e: "Data from Hubble and ESA's Gaia." },
      scienceChange: { q: "What does the new study show about science?", o: ["Forecasts can change with better data", "Forecasts never change", "Science is guessing"], e: "A forecast holds as long as the data hold; better data can change it." },
      nsForm: { q: "How does a neutron star form, according to NASA?", o: ["A massive star runs out of fuel and collapses", "Two planets collide", "A comet freezes"], e: "A massive star runs out of fuel and collapses." },
      nsSize: { q: "About how big is a neutron star across?", o: ["About 20 km", "About as big as the Sun", "About 20 m"], e: "About 20 kilometres, with more mass than the Sun." },
      nsSugar: { q: "How much would a sugar cube of neutron star material weigh, according to NASA?", o: ["About 1 trillion kilograms", "About one gram", "About one tonne"], e: "About 1 trillion kilograms." },
      pulsarWhat: { q: "What is a pulsar?", o: ["A rotating neutron star that sends out pulses of radiation", "A planet that blinks", "A young star"], e: "A rotating neutron star that sends out pulses of radiation." },
      lighthouse: { q: "What can you compare a pulsar with, according to NASA?", o: ["A lighthouse", "A candle", "A mirror"], e: "A lighthouse: its beam sweeps past us again and again." },
      pulseTime: { q: "How much time lies between the pulses of a pulsar, typically?", o: ["Milliseconds to seconds", "Years", "Centuries"], e: "Typically milliseconds to seconds." },
      noLight: { q: "What can escape from a black hole?", o: ["Nothing, not even light", "Only light", "Everything that is fast enough"], e: "Nothing, not even light." },
      noVacuum: { q: "Do black holes suck in everything round them, according to NASA?", o: ["No, they don't suck in other matter", "Yes, like a vacuum cleaner", "Only planets"], e: "No: black holes don't suck in other matter." },
      sunSwap: { q: "If the Sun were replaced by a black hole of the same mass, what would the planets do?", o: ["Stay in their orbits", "Fall in at once", "Fly away"], e: "They would stay in their orbits." },
      smbh: { q: "How heavy are supermassive black holes, according to NASA?", o: ["Hundreds of thousands to billions of times the Sun", "As heavy as the Earth", "As heavy as the Moon"], e: "Hundreds of thousands to billions of times the mass of the Sun." },
      sgrMass: { q: "How massive is Sagittarius A*, according to ESO?", o: ["Four million times the Sun", "As massive as the Sun", "Four times the Sun"], e: "Four million times more massive than the Sun." },
      sgrDist: { q: "How far away is Sagittarius A*, according to ESO?", o: ["About 27,000 light years", "About 27 light years", "About 27 million light years"], e: "About 27,000 light years, in the direction of Sagittarius." },
      firstImage: { q: "When was the first image of a black hole shown?", o: ["On 10 April 2019", "In 1969", "In 2001"], e: "On 10 April 2019: the black hole in M87." },
      m87Dist: { q: "How far away is the black hole in M87, according to ESO?", o: ["55 million light years", "55 light years", "55 billion light years"], e: "55 million light years." },
      sgrImage: { q: "When was the first image of Sagittarius A* shown?", o: ["On 12 May 2022", "On 10 April 2019", "In 1995"], e: "On 12 May 2022." },
      mainSequence: { q: "What does a star do on the main sequence?", o: ["It stably fuses hydrogen into helium", "It explodes", "It cools down slowly"], e: "It stably fuses hydrogen into helium in its core." },
      longestPhase: { q: "Which is the longest phase of a star's life?", o: ["The main sequence", "The red giant", "The supernova"], e: "The main sequence." },
      sunMidway: { q: "Where is the Sun in its life?", o: ["Roughly midway through its main sequence", "At its very end", "Just born"], e: "Roughly midway through its about 10 billion years on the main sequence." },
      massFuel: { q: "Which star uses its fuel faster?", o: ["The more massive one", "The lighter one", "Both the same"], e: "The more massive one." },
      massiveShort: { q: "How long do the heaviest stars live?", o: ["Only a few million years", "Trillions of years", "Forever"], e: "Only a few million years." },
      lowMassLong: { q: "How long can some low-mass stars shine, according to NASA?", o: ["Trillions of years", "A few thousand years", "A few days"], e: "Trillions of years." },
      noHydrogen: { q: "What happens when the core of a star runs out of hydrogen?", o: ["The core collapses and the star puffs up", "The star goes out at once", "Nothing changes"], e: "The core starts to collapse and the star slowly puffs up." },
      redGiant: { q: "What does a star like the Sun become after the main sequence?", o: ["A red giant", "A black hole", "A planet"], e: "A red giant." },
      giantWhen: { q: "When will the Sun become a red giant, according to NASA?", o: ["In about 5 billion years", "In about 5,000 years", "Next century"], e: "In about 5 billion years." },
      whiteDwarf: { q: "What is a white dwarf?", o: ["The core left of a star, usually Earth-sized", "A small white planet", "A young star"], e: "The core left after a red giant has shed its atmosphere, usually Earth-sized." },
      teaspoon: { q: "How heavy would a teaspoon of white dwarf material be, according to NASA?", o: ["Heavier than a pickup truck", "As heavy as sugar", "Lighter than air"], e: "Heavier than a pickup truck." },
      planetaryNebula: { q: "What do the layers a dying Sun-like star sheds form?", o: ["A planetary nebula", "New planets at once", "A black hole"], e: "An expanding cloud of dust and gas, a planetary nebula." },
      supernova: { q: "What is a supernova?", o: ["The explosion of a star", "A new star being born", "A bright planet"], e: "The explosion of a star." },
      novaMass: { q: "Which stars end in a supernova, according to NASA?", o: ["Stars with more than about 8 times the mass of the Sun", "Every star", "Only red dwarfs"], e: "Stars with more than about eight times the mass of the Sun; another NASA page says seven." },
      stardust: { q: "Where were the elements of our bodies made, according to NASA?", o: ["In the cores of stars", "On the Moon", "In the oceans of the Earth"], e: "In the cores of stars; supernovae scattered them." },
      molecularCloud: { q: "Where do stars form, according to NASA?", o: ["In large clouds of gas and dust, the molecular clouds", "Inside planets", "In the rings of Saturn"], e: "In large cold clouds of gas and dust, the molecular clouds." },
      clumpCollapse: { q: "What makes clumps in a molecular cloud collapse?", o: ["Gravity", "Wind from the Earth", "Light from the Moon"], e: "Gravity." },
      orionNursery: { q: "What is the Orion Nebula?", o: ["The closest large star-forming region, about 1,500 light years away", "A planet of the Solar System", "A black hole"], e: "The closest large star-forming region to the Earth, about 1,500 light years away." },
      protostar: { q: "What is a protostar?", o: ["A baby star", "A dead star", "A planet without a star"], e: "A baby star, before the fusion in its core begins." },
      protoHeat: { q: "Why does a collapsing clump heat up?", o: ["Friction heats the material", "The Sun shines on it", "It burns like wood"], e: "Friction heats the material up." },
      auMicAge: { q: "How old is AU Mic, according to NASA?", o: ["20 to 30 million years", "4.6 billion years", "300 years"], e: "20 to 30 million years: the Sun is at least 150 times older." },
      diskYoung: { q: "What surrounds a young star?", o: ["A disk of gas and dust", "A hard shell of ice", "Nothing"], e: "A disk of gas and dust left over from its birth." },
      planetsMerge: { q: "How do planets grow in such a disk?", o: ["Particles of rock and ice collide and merge", "The star spits them out", "They come from other galaxies"], e: "Solid particles of rock and ice collide and merge." },
      pdsImage: { q: "What did ESO show in 2018 at PDS 70?", o: ["The first confirmed image of a planet still forming", "A new star in the Solar System", "A black hole"], e: "The first confirmed image of a planet caught forming in the disk: PDS 70 b." },
      clusters: { q: "How are stars often born, according to NASA?", o: ["In groups, the stellar clusters", "Always alone", "Inside planets"], e: "In groups: stellar clusters." },
      pleiades: { q: "What are the Pleiades?", o: ["An open star cluster in Taurus", "A planet", "A galaxy far away"], e: "An open star cluster in Taurus." },
      pleiadesDist: { q: "How far are the Pleiades, according to NASA?", o: ["Roughly 445 light years", "Roughly 4 light years", "Roughly 4 million light years"], e: "Roughly 445 light years; the number is not universally agreed upon." },
      sunAge: { q: "When did the Sun form, according to NASA?", o: ["About 4.6 billion years ago", "About 4,600 years ago", "About 46 million years ago"], e: "About 4.6 billion years ago." },
      solarNebula: { q: "What is the cloud called in which the Sun formed?", o: ["The solar nebula", "The Orion Nebula", "The Milky Way"], e: "The solar nebula, a giant spinning cloud of gas and dust." },
      planetsLeft: { q: "What did the planets form from?", o: ["Much of the material left over from the Sun's birth", "Pieces of the Moon", "Other stars"], e: "Much of the remaining material formed the planets, the Earth too." },
      starGas: { q: "What is a star, according to NASA?", o: ["A giant ball of hot gas", "A big rock that shines", "A hole in the sky"], e: "A giant ball of hot gas, held together by its own gravity." },
      starFusion: { q: "What happens in the core of a star?", o: ["Hydrogen is fused into helium", "Iron burns like coal", "Nothing, the light comes from the surface"], e: "Hydrogen nuclei are squeezed together into helium; that releases the energy of its light." },
      starGravity: { q: "What holds a star together?", o: ["Its own gravity", "A hard shell", "The magnetic field of the Earth"], e: "Its own gravity." },
      colorTemp: { q: "Why do stars have different colours?", o: ["Because they have different temperatures", "Because of their names", "Because some are made of glass"], e: "Because they have different temperatures." },
      blueHot: { q: "Which stars are hotter?", o: ["Blue and white ones", "Red ones", "Orange ones"], e: "Blue and white stars are hotter, orange and red ones cooler." },
      sunTemp: { q: "How hot is the surface of the Sun, according to NASA?", o: ["About 5,500 °C", "About 55 °C", "About 5.5 million °C"], e: "About 5,500 °C." },
      classOrder: { q: "What is the order of the classes of stars, from hot to cool?", o: ["O, B, A, F, G, K, M", "A, B, C, D, E, F, G", "M, K, G, F, A, B, O"], e: "O, B, A, F, G, K, M." },
      sunClass: { q: "Which class is the Sun?", o: ["G, a yellow dwarf", "M, a red dwarf", "O, a blue giant"], e: "G: a yellow dwarf." },
      mColor: { q: "What colour are stars of class M?", o: ["Red", "Blue", "White"], e: "Red: M stars are the coolest." },
      commonStars: { q: "Which stars are the most common in the Milky Way?", o: ["Red dwarfs", "Stars like the Sun", "Blue giants"], e: "Red dwarfs, about three quarters of all stars." },
      sunLike: { q: "About how many stars of the Milky Way are like the Sun, according to NASA?", o: ["About 6 %", "About 60 %", "Every second one"], e: "Only about 6 %." },
      proximaSize: { q: "How big is Proxima Centauri compared with the Sun?", o: ["About a seventh of its radius", "Twice as big", "Exactly as big"], e: "About a seventh: 0.141 times the radius of the Sun." },
      orangeLife: { q: "Which stars does NASA consider better for advanced life?", o: ["Orange dwarfs of class K", "Blue giants of class O", "No star at all"], e: "Orange dwarfs of class K, a little cooler than the Sun." },
      redLong: { q: "Which stars live the longest?", o: ["Red dwarfs, more than 100 billion years", "Blue giants", "Stars like the Sun"], e: "Red dwarfs: NASA gives more than 100 billion years." },
      bakedDry: { q: "What can happen to planets in the habitable zone of a red dwarf?", o: ["They can be baked bone dry", "They turn into stars", "Nothing at all"], e: "They can be baked bone dry." },
      firstLetter: { q: "What is the first planet found round a star called?", o: ["The star's name with b", "The star's name with a", "The star's name with 1"], e: "b: the star itself is the undeclared A." },
      sameTime: { q: "Several planets of a star are found at the same time. Which one gets the b?", o: ["The one closest to the star", "The biggest", "The one farthest out"], e: "The one closest to the star." },
      letterOrder: { q: "What do the letters b, c, d follow?", o: ["The order of discovery", "The size of the planets", "Their colour"], e: "The order of discovery: Proxima d goes round closer than b, but was found later." },
      capitals: { q: "What does a star in a system of several stars get?", o: ["A capital letter: A, B, C", "A small letter: b, c, d", "A colour"], e: "A capital letter; planets get small ones." },
      hostA: { q: "Which letter is the star with the planets usually, even when it is not written?", o: ["A", "B", "Z"], e: "A: the undeclared A of the system." },
      starOrPlanet: { q: "What is Proxima Cen b?", o: ["A planet", "A star", "A constellation"], e: "A planet: the small letter shows it." },
      alphaAries: { q: "What does Alpha Arietis mean?", o: ["The alpha of Aries", "The Aries of the alpha", "The brightest planet"], e: "The alpha of Aries; the IAU's example is Hamal." },
      alphaCen: { q: "Which constellation does Alpha Centauri belong to?", o: ["Centaurus", "Aries", "Ursa Major"], e: "Centaurus: Alpha Centauri is the alpha of Centaurus." },
      iau1922: { q: "When did the IAU agree on the list of the 88 constellations?", o: ["1922", "1610", "1995"], e: "In 1922; their boundaries followed in 1928." },
      hdMeaning: { q: "What does HD in a star's name stand for?", o: ["The Henry Draper Catalogue", "High Definition", "A bright double star"], e: "The Henry Draper Catalogue." },
      toiMeaning: { q: "What does TOI stand for?", o: ["TESS Objects of Interest, candidates of the satellite TESS", "A constellation", "A probe to the Moon"], e: "TESS Objects of Interest: candidates of NASA's satellite TESS." },
      trappistWhat: { q: "What is TRAPPIST?", o: ["A small telescope in Chile", "A star in Centaurus", "A planet of the Solar System"], e: "A small telescope in Chile; it gave TRAPPIST-1 its name." },
      gjMeaning: { q: "What is the GJ catalogue?", o: ["A catalogue of nearby stars by Gliese and Jahreiss", "A catalogue of galaxies", "A list of the moons of Jupiter"], e: "A catalogue of nearby stars by Wilhelm Gliese and Hartmut Jahreiss." },
      romanGods: { q: "According to NASA, what is every planet except the Earth named after?", o: ["A Roman god or goddess", "The person who found it", "A constellation"], e: "A Roman god or goddess; Mars is the god of war." },
      dimidium: { q: "What is the name of its own of 51 Pegasi b?", o: ["Dimidium", "Helvetios", "Proxima"], e: "Dimidium; its star is called Helvetios." },
      buyStar: { q: "Can you buy a star name from the IAU?", o: ["No, the IAU sells no names", "Yes, for any star", "Yes, but only for bright stars"], e: "No: the IAU sells no names and distances itself from such offers." },
      notReplace: { q: "Does a name like Dimidium replace the scientific designation?", o: ["No, both are used side by side", "Yes, the old one is deleted", "Only in Europe"], e: "No: such names do not replace the scientific designations." },
      constCount: { q: "How many officially recognised constellations are there, according to NASA?", o: ["88", "12", "1,000"], e: "88." },
      notConnected: { q: "Are the stars of a constellation connected?", o: ["No, some are close, others very far away", "Yes, they are bound together", "Yes, they are all equally far away"], e: "No: they are not connected; some are close, others very far away." },
      constShape: { q: "What is a constellation?", o: ["A group of stars that seems to show a shape and has a name", "A cluster of stars that go round each other", "A galaxy"], e: "A group of stars that seems to show a shape in the sky and has been given a name." },
      thirteen: { q: "Through how many constellations does the Sun pass in a year, by the boundaries of the IAU?", o: ["13", "12", "88"], e: "13: the twelve of the zodiac and Ophiuchus." },
      ophName: { q: "Which constellation does the Sun pass although it is no sign of astrology?", o: ["Ophiuchus", "Ursa Major", "Orion"], e: "Ophiuchus, the Serpent Bearer, from the end of November to the middle of December." },
      ophDates: { q: "When does the Sun stand in Ophiuchus, about?", o: ["End of November to the middle of December", "In July", "In March"], e: "From about the 30th of November to the 17th of December." },
      ophPasses: { you: "How often has the Sun passed through Ophiuchus since you were born?", ref: "How often does the Sun pass through Ophiuchus in 30 years?", e: (n) => `About ${n} times: once every year.` },
      wobble: { q: "What is precession?", o: ["The slow wobble of the Earth's axis", "The orbit of the Moon", "A constellation"], e: "The slow wobble of the Earth's axis, like a spinning top." },
      wobbleTime: { q: "How long does one wobble of the Earth's axis take, according to NASA?", o: ["About 25,800 years", "About 26 years", "About 2.6 million years"], e: "About 25,800 years." },
      signSize: { q: "How big is each sign of astrology?", o: ["A twelfth of the Sun's path: 30 degrees", "As big as its constellation", "Each of a different size, like the constellations"], e: "Each sign is exactly 30 degrees; the constellations are of different sizes." },
      astronomyMethod: { q: "How does astronomy work?", o: ["By the scientific method, with evidence and data", "With predictions from the hour of birth", "By luck"], e: "By the scientific method, with evidence and data." },
      astroEvidence: { q: "Are the claims of astrology based on scientific evidence?", o: ["No", "Yes", "Only for summer signs"], e: "No. It matters to some cultural traditions, but its claims are not based on scientific evidence." },
      astroBelief: { q: "What does astrology rest on?", o: ["The belief that stars and planets show the future or a person's character", "Measurements with telescopes", "The boundaries of the IAU"], e: "On the belief that the positions of stars and planets can foretell the future or describe a person." },
      lightTravel: { q: "A star is 46 light years away. How long has its light been on its way to us?", o: ["46 years", "46 days", "46 minutes"], e: "46 years: a light year is the distance light travels in a year." },
      starsSpread: { q: "How far are the stars of Taurus from us, by the data of this map?", o: ["Between 46 and 484 light years", "All exactly 100 light years", "Less than one light year"], e: "Between 46 and 484 light years: seen from the side the figure falls apart." },
      nightSky: { q: "Why do we see other constellations in summer than in winter?", o: ["Because the Earth goes round the Sun in a year", "Because the stars move", "Because the constellations sleep in summer"], e: "Because the Earth goes round the Sun once a year: what stands behind the Sun cannot be seen at night." },
      habOrbits: { you: "How many times has the Earth carried you round the Sun inside its habitable zone?", ref: "How many times does the Earth carry a person round the Sun in 30 years?", e: (n) => `${n} times: once a year, always inside the habitable zone of the Sun.` },
      toiAge: { you: "How old would you be on TOI-700 d?", ref: "How old would a person of 30 be on TOI-700 d?", e: (n) => `${n}: a year on TOI-700 d lasts 37.4 days.` },
      europaLaps: { you: "How many times has Europa gone round Jupiter since you were born?", ref: "How many times does Europa go round Jupiter in 30 years?", e: (n) => `${n} times: one orbit takes 3.55 days.` },
      venusAge: { you: "How old would you be on Venus?", ref: "How old would a person of 30 be on Venus?", e: (n) => `${n}: a year on Venus lasts 0.615 Earth years.` },
      candidatesAtBirth: { you: "How many candidates in a habitable zone did this map know in the year you were born?", ref: "How many candidates in a habitable zone did this map know in the year a person of 30 today was born?", e: (n) => `${n}: most of them were found in the last few years.` },
    },
  },
  de: {
    parts: { basics: "Teil I, Grundlagen der Planetenwissenschaft", starLives: "Teil II, Das Leben der Sterne", galaxy: "Teil III, Unsere Heimatgalaxie", sky: "Den Himmel lesen" },
    paths: {
      solar: { title: "Unser Sonnensystem", goal: "Du kannst erklären, wie unser Sonnensystem aufgebaut ist, und seine wichtigsten Himmelskörper unterscheiden." },
      alpha: { title: "Unsere nächsten Sterne: Alpha Centauri", goal: "Du kannst das Sternsystem beschreiben, das uns am nächsten ist, seinen Planeten Proxima b und wie weit weg es wirklich ist." },
      exo: { title: "Exoplaneten: Welten jenseits des Sonnensystems", goal: "Du weißt, was Exoplaneten sind, wie man sie findet und wie verschieden sie sein können." },
      hab: { title: "Die Suche nach bewohnbaren Welten", goal: "Du weißt, was einen Planeten möglicherweise bewohnbar macht und warum die bewohnbare Zone allein noch kein Leben bedeutet." },
      zod: { title: "Sternbilder und Sternzeichen", goal: "Du kannst erklären, was ein Sternbild ist, warum dein Sternzeichen und der Himmel nicht übereinstimmen und was dir das Licht deines Sternbilds erzählt." },
      names: { title: "Namen im All", goal: "Du kannst die Namen von Planeten und Sternen lesen: die Buchstaben, die griechischen Buchstaben, die Kataloge und die Namen mit Geschichte." },
      stars: { title: "Sterne verstehen", goal: "Du kannst erklären, was ein Stern ist, was seine Farbe verrät, wie man Sterne ordnet und welche Sterne gute Heimaten für Planeten sind." },
      birth: { title: "Die Geburt der Sterne", goal: "Du kannst erklären, wie ein Stern aus einer Wolke aus Gas und Staub entsteht, wie um ihn Planeten wachsen und wie die Sonne entstand." },
      life: { title: "Leben und Tod der Sterne", goal: "Du kannst erklären, wie ein Stern lebt, warum seine Masse über sein Leben entscheidet und wie Sterne enden: als Weiße Zwerge oder in einer Supernova." },
      compact: { title: "Neutronensterne und Schwarze Löcher", goal: "Du kannst erklären, was Neutronensterne, Pulsare und Schwarze Löcher sind, wo das Schwarze Loch der Milchstraße sitzt und wie es fotografiert wurde." },
      nebula: { title: "Nebel", goal: "Du weißt, was Nebel sind, wie in ihnen Sterne entstehen und wie sterbende Sterne sie hinterlassen." },
      milky: { title: "Die Milchstraße", goal: "Du kannst unsere Galaxie beschreiben: ihre Form und Größe, wo die Sonne in ihr liegt, wie sie um die Mitte reist und wie Gaia sie vermessen hat." },
      local: { title: "Die galaktische Nachbarschaft", goal: "Du kennst die Galaxien in unserer Nähe, die Lokale Gruppe und was die Forschung über die Zukunft mit Andromeda sagt." },
    },
    path: {
      meta: (m) => `etwa ${m} Minuten · für Einsteiger`,
      rule: (n) => `${n} Schritte, dann ein Abschlusstest mit 10 Fragen; bestanden ab 70 %.`,
    },
    neighborhood: {
      sunProxima: "Sonne → Proxima Centauri: 4,24 Lichtjahre",
      sunAlpha: "Sonne → Alpha Centauri A und B: 4,37 Lichtjahre",
      system: "Ein System: Proxima ↔ A, B 0,2 Lichtjahre (13.000 AE)",
    },
    allPaths: "Alle Lernpfade",
    status: { done: "Erledigt", next: "Als Nächstes", open: "Offen", locked: "Erst alle Schritte" },
    back: "Alle Schritte", placeLabel: "Dazu lernen", stepOf: (n, all) => `Schritt ${n} von ${all}`, goalLabel: "Lernziel", speak: "Vorlesen", speakStop: "Stopp", speakTitle: "Mit einer Stimme auf deinem Gerät vorlesen; es wird nichts gesendet.", rememberLabel: "Merke", sourcesLabel: "Quellen", forYou: "Für dich", example: "Ein Beispiel", exampleHint: "Mit deinem Geburtsdatum (in der Übersicht von Mein Universum) wird das deine eigene Zahl.",
    taskLabel: "In der 3D-Ansicht", taskGo: "In 3D zeigen", scaleBack: "Zurück zum Erklär-Maßstab", taskDone: "Erledigt", check: "Hast du es verstanden?", right: "Richtig.", wrong: "Nicht ganz.",
    stepDone: (xp) => `Schritt geschafft · +${xp} XP`, nextStep: "Nächster Schritt", toTest: "Zum Abschlusstest",
    needTask: "Mach noch die Aufgabe in der 3D-Ansicht, dann ist der Schritt geschafft.", progress: (d, all) => `${d} von ${all} Schritten`,
    test: {
      title: "Abschlusstest", intro: (n, p) => `${n} Fragen aus allen Schritten, einige mit deinen eigenen Zahlen. Bestanden ab ${p} %.`,
      locked: "Schließe zuerst alle fünf Schritte ab.", evaluate: "Auswerten", score: (r, n, p) => `${r} von ${n} richtig (${p} %)`,
      passed: (xp) => `Bestanden · +${xp} XP und ein neues Abzeichen`, failed: "Noch nicht bestanden. Lies die Erklärungen und versuch es noch einmal.",
      retry: "Noch einmal", best: (p) => `Bestes Ergebnis: ${p} %`, answerAll: "Beantworte zuerst alle Fragen.",
    },
    steps: {
      sun: {
        title: "Die Sonne", goal: "Du kannst sagen, was die Sonne ist und woher ihre Energie kommt.",
        text: [
          "Die Sonne ist ein Stern: eine Kugel aus heißem Gas, so groß, dass etwa 109 Erden nebeneinander quer hineinpassen. Sie enthält mehr als 99 % der gesamten Masse des Sonnensystems.",
          "In ihrem Kern verschmilzt Wasserstoff zu Helium. Dabei wird die Energie frei, die uns als Licht und Wärme erreicht, aus etwa 150 Millionen Kilometern Entfernung.",
        ],
        task: "Flieg zur Sonne und sieh sie dir aus der Nähe an.",
        remember: [
          "Die Sonne ist ein Stern, eine Kugel aus heißem Gas. Sie entstand vor etwa 4,6 Milliarden Jahren.",
          "Ihre Energie kommt aus Kernfusion: In ihrem Kern verschmilzt bei etwa 15 Millionen °C Wasserstoff zu Helium.",
          "Sie enthält 99,8 % der Masse des Sonnensystems; etwa 109 Erden passen quer nebeneinander hinein.",
          "Ihr Licht braucht etwa 8 Minuten und 20 Sekunden bis zur Erde.",
        ],
        you: (n) => `Das Licht, das gerade auf dich fällt, hat die Sonne vor etwa 8 Minuten und 20 Sekunden verlassen. Seit deiner Geburt hat dich die Erde ${n}-mal um sie getragen.`,
        ref: (n) => `Das Licht, das gerade auf dich fällt, hat die Sonne vor etwa 8 Minuten und 20 Sekunden verlassen. Einen 30-jährigen Menschen hat die Erde schon ${n}-mal um sie getragen.`,
      },
      inner: {
        title: "Die inneren Planeten", goal: "Du kannst die vier Gesteinsplaneten nennen und unterscheiden.",
        text: [
          "Merkur, Venus, Erde und Mars sind die Gesteinsplaneten: klein und mit festem Boden. Merkur ist der Sonne am nächsten, Venus der heißeste, weil ihre dichte Luft aus Kohlendioxid die Wärme festhält.",
          "Auf dem Mars steht der größte Vulkan des Sonnensystems, Olympus Mons, um ein Vielfaches höher als der Mount Everest. Ein Tag auf der Venus dauert länger als ihr Jahr.",
        ],
        task: "Flieg zum Mars und vergleiche ihn mit der Erde.",
        remember: [
          "Merkur, Venus, Erde und Mars sind die inneren Planeten: Sie haben eine feste Oberfläche.",
          "Venus ist der heißeste Planet, etwa 467 °C an der Oberfläche, obwohl Merkur näher an der Sonne ist.",
          "Ein Tag auf der Venus (243 Erdtage) dauert länger als ihr Jahr (225 Erdtage).",
          "Olympus Mons auf dem Mars ist der größte Vulkan des Sonnensystems.",
        ],
        you: (mars, mercury) => `Auf dem Mars wärst du ${mars}, auf dem Merkur ${mercury}: Ein Jahr dauert dort länger oder kürzer als bei uns.`,
        ref: (mars, mercury) => `Ein 30-jähriger Mensch wäre auf dem Mars ${mars} und auf dem Merkur ${mercury}: Ein Jahr dauert dort länger oder kürzer als bei uns.`,
      },
      outer: {
        title: "Die äußeren Planeten", goal: "Du kannst Gasriesen und Eisriesen unterscheiden.",
        text: [
          "Jupiter und Saturn sind Gasriesen, vor allem aus Wasserstoff und Helium, Uranus und Neptun sind Eisriesen. Keiner von ihnen hat festen Boden wie die Erde.",
          "Jupiter hat mehr als doppelt so viel Masse wie alle anderen Planeten zusammen. Saturn ist für seine Größe so leicht, dass seine Dichte geringer ist als die von Wasser.",
        ],
        task: "Flieg zum Saturn und sieh dir seine Ringe an.",
        remember: [
          "Jupiter und Saturn sind Gasriesen, Uranus und Neptun Eisriesen.",
          "Jupiter ist der größte Planet, mit mehr als doppelt so viel Masse wie alle anderen Planeten zusammen.",
          "Saturn ist der einzige Planet mit geringerer Dichte als Wasser.",
          "Nicht nur Saturn hat Ringe: Auch Jupiter und Neptun haben welche.",
        ],
        you: (n) => `Seit deiner Geburt ist Jupiter erst ${n}-mal um die Sonne gelaufen: Eines seiner Jahre dauert fast 12 von unseren.`,
        ref: (n) => `In 30 Jahren läuft Jupiter nur ${n}-mal um die Sonne: Eines seiner Jahre dauert fast 12 von unseren.`,
      },
      moons: {
        title: "Monde und Zwergplaneten", goal: "Du weißt, was ein Mond ist, warum unser Mond uns immer dieselbe Seite zeigt und was ein Zwergplanet ist.",
        text: [
          "Ein Mond kreist um einen Planeten. Die Erde hat einen, Jupiter Dutzende, und die vier größten davon entdeckte Galileo Galilei 1610 mit einem der ersten Fernrohre.",
          "Die meisten großen Monde drehen sich bei jedem Umlauf genau einmal um sich selbst und zeigen ihrem Planeten deshalb immer dieselbe Seite. Darum sehen wir von der Erde nie die Rückseite unseres Mondes.",
          "Nicht jeder Himmelskörper, der selbst um die Sonne läuft, ist ein Planet. Ceres im Asteroidengürtel und Pluto jenseits des Neptun sind Zwergplaneten. Pluto galt bis 2006 als neunter Planet; dann machte ihn die Internationale Astronomische Union zum Zwergplaneten, weil andere Objekte seine Bahn kreuzen können. Er hat fünf bekannte Monde, der größte, Charon, ist etwa halb so groß wie er.",
        ],
        task: "Flieg zum Jupiter und klicke auf einen seiner vier großen Monde.",
        remember: [
          "Ein Mond ist ein Himmelskörper, der um einen Planeten kreist.",
          "Ganymed, ein Mond des Jupiter, ist der größte Mond des Sonnensystems, größer als der Planet Merkur.",
          "Unser Mond zeigt der Erde immer dieselbe Seite: Er dreht sich bei jedem Umlauf genau einmal.",
          "Galileo Galilei entdeckte 1610 die vier größten Monde des Jupiter.",
          "Ceres und Pluto sind Zwergplaneten. Pluto galt bis 2006 als neunter Planet.",
        ],
        you: (n) => `Seit deiner Geburt hat der Mond die Erde etwa ${n}-mal umrundet.`,
        ref: (n) => `In 30 Jahren umrundet der Mond die Erde etwa ${n}-mal.`,
      },
      scale: {
        title: "Kleine Körper, Maßstab und Entfernungen", goal: "Du kannst beschreiben, wie groß und wie leer das Sonnensystem ist und was Asteroiden und Kometen sind.",
        text: [
          "Das Sonnensystem ist vor allem leerer Raum. Der Abstand von der Erde zur Sonne, 150 Millionen Kilometer, heißt eine Astronomische Einheit (AE). Neptun, der äußerste Planet, ist etwa 30 AE von der Sonne entfernt.",
          "Das Licht der Sonne braucht gut 8 Minuten bis zur Erde und etwa 4 Stunden bis zum Neptun. Im echten Maßstab der 3D-Ansicht werden die Planeten zu winzigen Punkten in einem riesigen Raum.",
          "Zwischen Mars und Jupiter liegt der Asteroidengürtel, in dem die meisten Asteroiden um die Sonne laufen; sein größtes Objekt, Ceres, ist ein Zwergplanet. Kometen bestehen vor allem aus Eis mit Staub. Kommt einer der Sonne nahe, erwärmt er sich und bildet eine Hülle, die Koma; Sonnenlicht und Sonnenwind blasen Staub und Gas von der Sonne weg zu langen Schweifen.",
        ],
        task: "Schalte den echten Maßstab ein und sieh, wie weit die Planeten auseinanderliegen.",
        remember: [
          "Eine Astronomische Einheit (AE) ist der mittlere Abstand von der Erde zur Sonne, etwa 150 Millionen Kilometer.",
          "Neptun ist 30 AE von der Sonne entfernt; das Sonnenlicht braucht etwa 4 Stunden bis dorthin.",
          "Die meisten Asteroiden laufen zwischen Mars und Jupiter um die Sonne. Das größte Objekt dort, Ceres, ist ein Zwergplanet.",
          "Kometen bestehen vor allem aus Eis und Staub; nahe der Sonne bilden sie Schweife, die von der Sonne weg zeigen.",
        ],
        you: (name, dist, year) => `Das Licht deines Sterns, ${name}, das heute bei dir ankommt, brach um ${year} auf, etwa in deinem Geburtsjahr. Es ist ${dist} Lichtjahre gereist.`,
        ref: "Das Licht des nächsten Sterns, Proxima Centauri, braucht 4,2 Jahre bis zu uns.",
      },
      neighbors: {
        title: "Unsere nächsten Sterne", goal: "Du weißt, welche Sterne uns am nächsten sind und was ein Lichtjahr ist.",
        text: [
          "Nach der Sonne ist Proxima Centauri der nächste Stern, etwa 4,2 Lichtjahre entfernt. Ein Lichtjahr ist keine Zeit, sondern eine Strecke: wie weit das Licht in einem Jahr kommt, fast 9,5 Billionen Kilometer.",
          "Proxima gehört zu Alpha Centauri, dem Sternsystem, das der Erde am nächsten ist, im Sternbild Zentaur. Außer Proxima hat es zwei helle Sterne, Alpha Centauri A und B, etwa 4,3 Lichtjahre entfernt.",
        ],
        task: "Sieh dir das Sternbild Zentaur an: In dieser Richtung liegen unsere nächsten Nachbarn.",
        remember: [
          "Nach der Sonne ist Proxima Centauri der nächste Stern, etwa 4,2 Lichtjahre entfernt.",
          "Ein Lichtjahr ist eine Strecke: wie weit das Licht in einem Jahr kommt.",
          "Alpha Centauri ist das Sternsystem, das der Erde am nächsten ist; es liegt im Sternbild Zentaur.",
        ],
        you: (left) => (left == null ? "Das Licht von Proxima Centauri, das heute bei dir ankommt, ist vor etwa 4,2 Jahren losgeflogen, noch vor deiner Geburt." : `Das Licht von Proxima Centauri, das heute bei dir ankommt, ist vor etwa 4,2 Jahren losgeflogen, als du ${left} warst.`),
        ref: (left) => `Das Licht von Proxima Centauri, das heute bei uns ankommt, ist vor etwa 4,2 Jahren losgeflogen: Ein heute 30-jähriger Mensch war damals ${left}.`,
      },
      pair: {
        title: "Alpha Centauri A und B", goal: "Du kannst die beiden hellen Sterne von Alpha Centauri beschreiben und wie sie sich bewegen.",
        text: [
          "Alpha Centauri A und B sind ein Sternpaar, das alle 80 Jahre einmal um einen gemeinsamen Schwerpunkt läuft. Am nächsten kommen sie sich auf etwa den 11-fachen Abstand von Erde und Sonne.",
          "A ist ein Stern derselben Art wie unsere Sonne (G2) und etwas größer; B (Typ K1) ist etwas kleiner. 2025 fand das James-Webb-Weltraumteleskop Hinweise auf einen möglichen Riesenplaneten um A, etwa so schwer wie Saturn. Ob es ihn wirklich gibt, ist noch eine offene Frage.",
        ],
        task: "Flieg zu Alpha Centauri A: Daneben leuchtet B. Der Abstand zwischen den beiden ist kleiner gezeichnet, als er ist.",
        remember: [
          "Alpha Centauri A und B laufen alle 80 Jahre einmal umeinander.",
          "A ist ein Stern derselben Art wie die Sonne und etwas größer, B etwas kleiner.",
          "Ein möglicher Planet um A, 2025 vom Webb-Teleskop gesehen, ist noch nicht bestätigt.",
        ],
        you: (share) => `A und B brauchen 80 Jahre für eine Runde umeinander: In deinem bisherigen Leben haben sie ${share} % davon geschafft.`,
        ref: (share) => `A und B brauchen 80 Jahre für eine Runde umeinander: In 30 Jahren schaffen sie ${share} % davon.`,
      },
      proxima: {
        title: "Proxima Centauri", goal: "Du weißt, was ein Roter Zwerg ist und warum man Proxima nicht mit bloßem Auge sieht.",
        text: [
          "Proxima Centauri ist ein Roter Zwerg: ein kleiner, kühler Stern, viel lichtschwächer als die Sonne. Obwohl er unser nächster Stern ist, ist er zu schwach, um ihn mit bloßem Auge zu sehen.",
          "Er ist der dritte und schwächste Stern des Systems Alpha Centauri. Er sendet Ausbrüche von ultraviolettem Licht und Röntgenstrahlen aus, und das ist für seinen Planeten sehr wichtig.",
        ],
        task: "Flieg zu Proxima Centauri und sieh dir den kleinen roten Stern an.",
        remember: [
          "Proxima Centauri ist ein Roter Zwerg: klein, kühl und viel lichtschwächer als die Sonne.",
          "Man sieht ihn nicht mit bloßem Auge, obwohl er der nächste Stern ist.",
          "Er ist der dritte und schwächste Stern von Alpha Centauri und sendet Ausbrüche von ultraviolettem Licht und Röntgenstrahlen aus.",
        ],
        you: (trips) => `In deinem bisherigen Leben hätte das Licht den Weg von Proxima zu uns ${trips}-mal zurücklegen können.`,
        ref: (trips) => `In 30 Jahren kann das Licht den Weg von Proxima zu uns ${trips}-mal zurücklegen.`,
      },
      proximaB: {
        title: "Proxima b", goal: "Du weißt, was über Proxima b bekannt ist und warum die bewohnbare Zone kein Leben bedeutet.",
        text: [
          "2016 gaben Astronomen der Europäischen Südsternwarte (ESO) einen Planeten um Proxima Centauri bekannt: Proxima b. Sie fanden ihn an winzigen Verschiebungen im Licht des Sterns, der ein wenig wackelt, weil der Planet an ihm zieht. Der Planet läuft in 11,2 Tagen um seinen Stern und ist mindestens etwa so schwer wie die Erde.",
          "Proxima b liegt in der bewohnbaren Zone seines Sterns: Die Temperatur dort könnte unter den richtigen Bedingungen flüssiges Wasser erlauben. Aber die Ausbrüche von Proxima könnten eine Atmosphäre wegreißen. Ob Proxima b Luft, Wasser oder sogar Leben hat, weiß niemand.",
        ],
        task: "Flieg zu Proxima b und sieh ihn dir aus der Nähe an.",
        remember: [
          "Proxima b, der Planet des nächsten Sterns, wurde 2016 von der ESO bekanntgegeben.",
          "Ein Jahr auf Proxima b dauert 11,2 Tage.",
          "Man fand ihn am Wackeln seines Sterns, nicht auf einem Foto.",
          "In der bewohnbaren Zone heißt nicht bewohnt: Ob er Luft oder Wasser hat, ist unbekannt.",
        ],
        you: (age) => `Auf Proxima b wärst du ${age} Jahre alt: Ein Jahr dauert dort nur 11,2 Tage.`,
        ref: (age) => `Ein 30-jähriger Mensch wäre auf Proxima b ${age} Jahre alt: Ein Jahr dauert dort nur 11,2 Tage.`,
      },
      travel: {
        title: "Könnten wir je dorthin?", goal: "Du kannst sagen, wie lange eine Reise zu unserem nächsten Stern heute dauern würde.",
        text: [
          "Voyager 1, die fernste Raumsonde, entfernt sich mit etwa 17 Kilometern pro Sekunde von der Sonne, mehr als 61.000 Kilometer pro Stunde. Mit diesem Tempo würde eine Reise über 4,2 Lichtjahre etwa 75.000 Jahre dauern (aus Entfernung und Geschwindigkeit berechnet).",
          "Das Licht braucht für denselben Weg etwa 4,2 Jahre. So weit liegen die Sterne auseinander: Selbst unser nächster Nachbar ist für heutige Raumsonden unerreichbar.",
        ],
        task: "Plane im Reiseplaner eine Reise von der Erde zu Proxima b.",
        remember: [
          "Voyager 1 fliegt mit etwa 17 Kilometern pro Sekunde.",
          "Mit diesem Tempo würde die Reise zu Proxima etwa 75.000 Jahre dauern.",
          "Das Licht braucht für denselben Weg etwa 4,2 Jahre.",
        ],
        you: (n) => `Mit dem Tempo von Voyager 1 würde die Reise etwa 75.000 Jahre dauern: ${n}-mal so lang wie dein bisheriges Leben.`,
        ref: (n) => `Mit dem Tempo von Voyager 1 würde die Reise etwa 75.000 Jahre dauern: ${n}-mal so lang wie das Leben eines 30-jährigen Menschen.`,
      },
      exoWhat: {
        title: "Was sind Exoplaneten?", goal: "Du weißt, was ein Exoplanet ist und wann die ersten gefunden wurden.",
        text: [
          "Ein Exoplanet ist ein Planet außerhalb unseres Sonnensystems. Meist kreist er um einen anderen Stern, aber manche wandern ohne Sonne durch die Galaxie, in ewiger Dunkelheit.",
          "Die ersten Exoplaneten wurden 1992 gefunden, um einen Pulsar. 1995 folgte 51 Pegasi b, der erste um einen Stern wie die Sonne; seine Entdecker Michel Mayor und Didier Queloz erhielten dafür 2019 den Nobelpreis für Physik. Der Katalog dieser Karte, das Exoplanet Archive der NASA, zählt 6.423 bestätigte Planeten (Oktober 2026).",
        ],
        task: "Flieg zu 51 Pegasi b, dem ersten Planeten, der um einen Stern wie die Sonne gefunden wurde.",
        remember: [
          "Ein Exoplanet ist ein Planet außerhalb unseres Sonnensystems; meist kreist er um einen anderen Stern.",
          "Die ersten Exoplaneten wurden 1992 gefunden, um einen Pulsar.",
          "51 Pegasi b (1995) war der erste um einen Stern wie die Sonne: Nobelpreis für Physik 2019.",
        ],
        you: (at, now, year) => `${year}, im Jahr deiner Geburt, waren ${at} der Planeten dieses Katalogs entdeckt; heute sind es ${now}.`,
        ref: (at, now, year) => `${year}, als ein heute 30-jähriger Mensch geboren wurde, waren ${at} der Planeten dieses Katalogs entdeckt; heute sind es ${now}.`,
      },
      exoHow: {
        title: "Wie findet man sie?", goal: "Du kannst die Transitmethode und die Radialgeschwindigkeitsmethode erklären.",
        text: [
          "Exoplaneten sind schwer direkt zu sehen: Ihre Sterne sind viel heller. Die Transitmethode beobachtet das Licht eines Sterns: Zieht ein Planet vor ihm vorbei, wird der Stern ganz leicht dunkler. Die meisten bekannten Exoplaneten wurden so gefunden, Tausende davon mit dem Kepler-Teleskop der NASA.",
          "Die Radialgeschwindigkeitsmethode schaut auf den Stern selbst: Ein Planet zieht an ihm, und der Stern wackelt ein wenig. Sein Licht wird dabei abwechselnd gestaucht und gedehnt, ein wenig ins Blaue und ins Rote verschoben. So wurden 51 Pegasi b und Proxima b gefunden.",
        ],
        task: "Flieg zu Kepler-22 b, einem Planeten, den das Kepler-Teleskop mit der Transitmethode fand.",
        remember: [
          "Transit: Ein Planet, der vor seinem Stern vorbeizieht, macht dessen Licht ein wenig schwächer.",
          "Radialgeschwindigkeit: Der Planet bringt seinen Stern zum Wackeln, und das Licht des Sterns verschiebt sich.",
          "Die meisten bekannten Exoplaneten wurden mit der Transitmethode gefunden.",
        ],
        you: (n) => `Seit deinem Geburtsjahr wurden ${n} Planeten dieses Katalogs mit der Transitmethode gefunden.`,
        ref: (n) => `Seit dem Geburtsjahr eines heute 30-jährigen Menschen wurden ${n} Planeten dieses Katalogs mit der Transitmethode gefunden.`,
      },
      exoRocky: {
        title: "Gesteinswelten und Supererden", goal: "Du kannst Gesteinsplaneten und Supererden unterscheiden.",
        text: [
          "Gesteinsplaneten sind so groß wie die Erde oder kleiner und bestehen aus Gestein, Silikaten, Wasser oder Kohlenstoff. Supererden haben mehr Masse als die Erde, aber weniger als Neptun; sie können aus Gas, Gestein oder beidem bestehen.",
          "Sieben erdgroße Planeten kreisen um TRAPPIST-1, einen kleinen Roten Zwerg etwa 40 Lichtjahre entfernt. Mehrere davon liegen in seiner bewohnbaren Zone; wie viele genau, ist von Studie zu Studie verschieden. TRAPPIST-1 e läuft in 6,1 Tagen um seinen Stern.",
        ],
        task: "Flieg zu TRAPPIST-1 e, einem erdgroßen Planeten eines kleinen Roten Zwergs.",
        remember: [
          "Gesteinsplaneten: so groß wie die Erde oder kleiner, aus Gestein, Silikaten, Wasser oder Kohlenstoff.",
          "Supererden: mehr Masse als die Erde, weniger als Neptun.",
          "TRAPPIST-1 hat sieben erdgroße Planeten, etwa 40 Lichtjahre von uns.",
        ],
        you: (n) => `Auf TRAPPIST-1 e wärst du ${n} Jahre alt: Ein Jahr dauert dort 6,1 Tage.`,
        ref: (n) => `Ein 30-jähriger Mensch wäre auf TRAPPIST-1 e ${n} Jahre alt: Ein Jahr dauert dort 6,1 Tage.`,
      },
      exoGiants: {
        title: "Gasriesen und heiße Jupiter", goal: "Du weißt, was Gasriesen und heiße Jupiter sind.",
        text: [
          "Gasriesen sind so groß wie Saturn oder Jupiter oder noch viel größer. Neptunähnliche Planeten sind etwa so groß wie Neptun oder Uranus.",
          "51 Pegasi b ist ein heißer Jupiter: ein Gasriese, der in nur 4,2 Tagen um seinen Stern läuft, in 0,05 AE Abstand, viel näher als Merkur an der Sonne (0,39 AE). HD 209458 b ist ein weiterer Gasriese nah an seinem Stern: Sein Jahr dauert 3,5 Tage.",
        ],
        task: "Flieg zu HD 209458 b, einem Gasriesen, dessen Jahr 3,5 Tage dauert.",
        remember: [
          "Gasriesen sind so groß wie Saturn oder Jupiter oder noch viel größer.",
          "Ein heißer Jupiter ist ein Gasriese sehr nah an seinem Stern.",
          "51 Pegasi b läuft in 4,2 Tagen um seinen Stern.",
        ],
        you: (n) => `Auf 51 Pegasi b wärst du ${n} Jahre alt: Ein Jahr dauert dort 4,2 Tage.`,
        ref: (n) => `Ein 30-jähriger Mensch wäre auf 51 Pegasi b ${n} Jahre alt: Ein Jahr dauert dort 4,2 Tage.`,
      },
      exoStrange: {
        title: "Seltsame Welten", goal: "Du kennst ein paar Welten, die anders sind als alles in unserem Sonnensystem.",
        text: [
          "55 Cancri e ist eine Supererde, die in 0,74 Tagen um ihren Stern läuft, in weniger als 18 Stunden. Die NASA beschreibt sie als superheiße Welt, bedeckt von einem weltweiten Ozean aus Lava.",
          "Nicht jeder Exoplanet hat eine Sonne: Manche wandern allein durch die Galaxie, in ewiger Dunkelheit. Jedes Jahr kommen neue Welten in den Katalog; alle 6.423 dieser Karte kannst du in der 3D-Ansicht erkunden.",
        ],
        task: "Flieg zu 55 Cancri e, der Welt mit dem Lavaozean.",
        remember: [
          "55 Cancri e: eine Supererde mit einem Jahr von weniger als 18 Stunden und einem Ozean aus Lava.",
          "Manche Exoplaneten haben keine Sonne und wandern im Dunkeln durch die Galaxie.",
          "Jedes Jahr werden neue Exoplaneten gefunden.",
        ],
        you: (n) => `Auf 55 Cancri e hättest du schon ${n} Geburtstage gefeiert: Ein Jahr dauert dort weniger als 18 Stunden.`,
        ref: (n) => `Ein 30-jähriger Mensch hätte auf 55 Cancri e schon ${n} Geburtstage gefeiert: Ein Jahr dauert dort weniger als 18 Stunden.`,
      },
      exoSystems: {
        title: "Planetensysteme", goal: "Du weißt, dass viele Sterne mehrere Planeten haben, und kennst zwei besondere Systeme.",
        text: [
          "Viele Sterne haben mehr als einen Planeten: In dieser Karte sind es 1.069 Sterne (Oktober 2026). Die sieben Planeten von TRAPPIST-1 kreisen so eng um ihren kleinen Stern, dass sie laut NASA alle innerhalb der Bahn des Merkur Platz hätten.",
          "Um den sonnenähnlichen Stern Kepler-90 kennt man acht Planeten, so viele wie in unserem Sonnensystem. Den achten fand 2017 ein künstliches neuronales Netz von Google, das die Daten des Kepler-Teleskops durchsuchte. In dieser Karte steht der Stern unter seinem zweiten Namen KOI-351.",
        ],
        task: "Flieg zu KOI-351, dem Stern Kepler-90 mit seinen acht Planeten.",
        remember: [
          "Viele Sterne haben mehrere Planeten.",
          "Alle sieben Planeten von TRAPPIST-1 hätten innerhalb der Bahn des Merkur Platz.",
          "Kepler-90 hat acht Planeten, so viele wie unser Sonnensystem; den achten fand 2017 eine künstliche Intelligenz.",
        ],
        you: (n, e) => `Seit deiner Geburt ist TRAPPIST-1 b etwa ${n}-mal um seinen Stern gelaufen, die Erde ${e}-mal um die Sonne.`,
        ref: (n, e) => `In 30 Jahren läuft TRAPPIST-1 b etwa ${n}-mal um seinen Stern, die Erde ${e}-mal um die Sonne.`,
      },
      exoFamous: {
        title: "Berühmte Exoplaneten", goal: "Du kennst zwei Exoplaneten, die anders aussehen, als man denkt.",
        text: [
          "HD 189733 b ist ein Gasriese, der in 2,2 Tagen um seinen Stern läuft. Laut NASA ist er kobaltblau: Die Farbe kommt von einer dunstigen, glühend heißen Atmosphäre mit Wolken, die Glas enthalten. Gefunden wurde er 2005 mit der Radialgeschwindigkeitsmethode.",
          "Kepler-16 b umkreist zwei Sterne zugleich, einen orangen und einen roten Zwerg, die alle 41 Tage umeinander laufen. Für eine Runde um beide braucht er 229 Tage, und in Größe und Masse ähnelt er dem Saturn. Als er 2011 bekanntgegeben wurde, verglichen die Forscher ihn mit Tatooine aus Star Wars, der Welt mit zwei Sonnen.",
        ],
        task: "Flieg zu HD 189733 b, dem blauen Planeten mit Wolken aus Glas.",
        remember: [
          "HD 189733 b ist kobaltblau; seine Wolken enthalten Glas.",
          "Kepler-16 b umkreist zwei Sterne, wie Tatooine in Star Wars.",
          "Kepler-16 b ähnelt in Größe und Masse dem Saturn.",
        ],
        you: (n) => `Auf Kepler-16 b, der Welt mit zwei Sonnen, wärst du ${n} Jahre alt: Ein Jahr dort dauert 229 Tage.`,
        ref: (n) => `Ein Mensch von 30 wäre auf Kepler-16 b, der Welt mit zwei Sonnen, ${n} Jahre alt: Ein Jahr dort dauert 229 Tage.`,
      },
      nebWhat: {
        title: "Was ist ein Nebel?", goal: "Du weißt, was ein Nebel ist und auf welche zwei Arten Nebel entstehen.",
        text: [
          "Laut NASA ist ein Nebel eine riesige Wolke aus Staub und Gas im All.",
          "Manche Nebel stammen aus dem Gas und Staub, den die Explosion eines sterbenden Sterns hinausschleudert, etwa eine Supernova. Andere sind Gebiete, in denen neue Sterne zu entstehen beginnen, wie der Orionnebel aus dem Pfad über die Geburt der Sterne.",
        ],
        task: "Sieh dir das Sternbild Orion an: Unter seinem Gürtel liegt der Orionnebel, ein Nebel, in dem Sterne geboren werden.",
        remember: [
          "Ein Nebel ist eine riesige Wolke aus Staub und Gas im All.",
          "Manche Nebel stammen von sterbenden Sternen, zum Beispiel aus einer Supernova.",
          "Andere sind Gebiete, in denen neue Sterne entstehen.",
        ],
        you: (p) => `Das Licht des Orionnebels ist etwa 1.500 Jahre unterwegs. In deinem bisherigen Leben hat es etwa ${p} % dieses Weges geschafft.`,
        ref: (p) => `Das Licht des Orionnebels ist etwa 1.500 Jahre unterwegs. In 30 Jahren schafft es etwa ${p} % dieses Weges.`,
      },
      nebPillars: {
        title: "Die Säulen der Schöpfung", goal: "Du kennst das berühmteste Bild einer Kinderstube der Sterne.",
        text: [
          "Im Adlernebel (M16) im Sternbild Schlange stehen die Säulen der Schöpfung: Türme aus Gas und Staub, in denen neue Sterne entstehen. Die NASA nennt eine Entfernung von 7.000 Lichtjahren, die ESA 6.500: Die beiden Seiten stimmen nicht überein.",
          "Hubble hat die Säulen mehrmals fotografiert. Am 19. Oktober 2022 zeigte das Weltraumteleskop Webb sie in einem neuen Bild, voller junger Sterne.",
        ],
        task: "Sieh dir das Sternbild Schlange an: Darin liegt der Adlernebel.",
        remember: [
          "Die Säulen der Schöpfung stehen im Adlernebel (M16) in der Schlange.",
          "Sie sind 6.500 (ESA) oder 7.000 (NASA) Lichtjahre entfernt.",
          "Webb zeigte sie im Oktober 2022 in einem neuen Bild.",
        ],
        you: (before, at) => (before != null ? `Webbs Bild der Säulen erschien 2022, ${before} Jahre vor deiner Geburt.` : at === "0" ? "Webbs Bild der Säulen erschien 2022, im Jahr deiner Geburt." : `Webbs Bild der Säulen erschien 2022, als du ${at} Jahre alt warst.`),
        ref: (ago) => `Webbs Bild der Säulen erschien 2022, vor ${ago} Jahren.`,
      },
      nebDark: {
        title: "Dunkelnebel", goal: "Du weißt, dass manche Nebel dunkel sind.",
        text: [
          "Nicht jeder Nebel leuchtet. Der Pferdekopfnebel im Orion ist ein Dunkelnebel: eine dunkle Wolke aus Staub und Gas in der Form eines Pferdekopfs.",
          "Laut ESA/Hubble ist er etwa 1.300 Lichtjahre entfernt, etwas näher als der Orionnebel im selben Sternbild.",
        ],
        task: "Sieh dir noch einmal das Sternbild Orion an: Auch der Pferdekopfnebel liegt darin.",
        remember: [
          "Manche Nebel sind dunkel: dunkle Wolken aus Staub und Gas.",
          "Der Pferdekopfnebel ist ein Dunkelnebel im Orion.",
          "Er ist etwa 1.300 Lichtjahre entfernt.",
        ],
        you: (year) => `Das Licht des Pferdekopfnebels, das heute ankommt, flog um das Jahr ${year} los, lange vor deiner Geburt.`,
        ref: (year) => `Das Licht des Pferdekopfnebels, das heute ankommt, flog um das Jahr ${year} los.`,
      },
      nebRing: {
        title: "Der Ringnebel", goal: "Du weißt, wie ein planetarischer Nebel aussieht und woher er kommt.",
        text: [
          "Stirbt ein Stern wie die Sonne, stößt er seine äußeren Schichten ab; laut NASA bilden sie eine wachsende Wolke, einen planetarischen Nebel. So wird auch die Sonne enden.",
          "Der bekannteste ist der Ringnebel (M57) im Sternbild Leier, laut NASA etwa 2.000 Lichtjahre entfernt.",
        ],
        task: "Sieh dir das Sternbild Leier an: Darin liegt der Ringnebel.",
        remember: [
          "Ein planetarischer Nebel sind die abgestoßenen Schichten eines sterbenden Sterns wie der Sonne.",
          "Der Ringnebel (M57) ist ein planetarischer Nebel in der Leier.",
          "Er ist etwa 2.000 Lichtjahre entfernt.",
        ],
        you: (n) => `Das Licht des Ringnebels ist etwa 2.000 Jahre unterwegs: etwa ${n}-mal so lange, wie du lebst.`,
        ref: (n) => `Das Licht des Ringnebels ist etwa 2.000 Jahre unterwegs: etwa ${n}-mal so lange wie ein Leben von 30 Jahren.`,
      },
      nebCrab: {
        title: "Der Krebsnebel", goal: "Du kennst einen Nebel, der von einer auf der Erde gesehenen Supernova übrig ist.",
        text: [
          "Der Krebsnebel (M1) im Stier ist der Überrest einer Supernova, laut NASA 6.500 Lichtjahre entfernt. 1054 bemerkten chinesische Astronomen dort einen „Gaststern“: Es war die Explosion einer Supernova.",
          "In der Mitte des Nebels sitzt ein schnell rotierender Neutronenstern, ein Pulsar: der Kern des explodierten Sterns.",
        ],
        task: "Sieh dir das Sternbild Stier an: Darin liegt der Krebsnebel.",
        remember: [
          "Der Krebsnebel ist der Überrest einer Supernova, im Stier.",
          "Chinesische Astronomen sahen die Supernova 1054 als „Gaststern“.",
          "In seiner Mitte dreht sich ein Neutronenstern, ein Pulsar.",
        ],
        you: (before) => `Chinesische Astronomen sahen den Gaststern 1054, ${before} Jahre vor deiner Geburt.`,
        ref: (ago) => `Chinesische Astronomen sahen den Gaststern 1054, vor ${ago} Jahren.`,
      },
      mwWhat: {
        title: "Unsere Galaxie", goal: "Du kennst Form und Größe der Milchstraße.",
        text: [
          "Die Milchstraße ist unsere Galaxie. Laut NASA ist sie eine Balkenspirale: eine Scheibe mit Spiralarmen und einem Balken aus Sternen in der Mitte. Sie ist mehr als 100.000 Lichtjahre groß.",
          "Laut ESA enthält sie mehr als hundert Milliarden Sterne. Die Sonne ist einer davon.",
        ],
        task: "Sieh dir das Sternbild Schütze an: In seiner Richtung liegt das Zentrum der Milchstraße.",
        remember: [
          "Die Milchstraße ist eine Balkenspiralgalaxie.",
          "Sie ist mehr als 100.000 Lichtjahre groß.",
          "Laut ESA hat sie mehr als 100 Milliarden Sterne.",
        ],
        you: (p) => `Licht braucht etwa 100.000 Jahre, um die Milchstraße zu durchqueren (gerechnet aus ihrer Größe). Dein bisheriges Leben ist etwa ${p} % davon.`,
        ref: (p) => `Licht braucht etwa 100.000 Jahre, um die Milchstraße zu durchqueren (gerechnet aus ihrer Größe). Ein Leben von 30 Jahren ist etwa ${p} % davon.`,
      },
      mwArm: {
        title: "Unser Platz: der Orionarm", goal: "Du weißt, wo die Sonne in der Milchstraße liegt.",
        text: [
          "Laut NASA liegt die Sonne nahe einem kleinen, unvollständigen Arm, dem Orionarm, zwischen dem Schütze- und dem Perseusarm, etwa auf halbem Weg von der Mitte zum Rand.",
          "Die NASA gibt die Entfernung zur Mitte mit etwa 8 Kiloparsec an, gerechnet etwa 26.000 Lichtjahre; die ESO nennt für das Schwarze Loch in der Mitte etwa 27.000 Lichtjahre.",
        ],
        task: "Sieh dir die Sonne an: Sie liegt im Orionarm, weit draußen von der Mitte.",
        remember: [
          "Die Sonne liegt nahe dem Orionarm, einem kleinen, unvollständigen Arm.",
          "Er liegt zwischen dem Schütze- und dem Perseusarm.",
          "Die Mitte ist etwa 26.000 bis 27.000 Lichtjahre entfernt.",
        ],
        you: (ly, p) => `In deinem Leben ist Licht ${ly} Lichtjahre weit gekommen: etwa ${p} % des Weges zur Mitte.`,
        ref: (ly, p) => `In ${ly} Jahren kommt Licht ${ly} Lichtjahre weit: etwa ${p} % des Weges zur Mitte.`,
      },
      mwOrbit: {
        title: "Die Reise um die Mitte", goal: "Du weißt, dass die Sonne um das Zentrum der Milchstraße reist.",
        text: [
          "Die Sonne reist um das Zentrum der Milchstraße und nimmt die Planeten mit. Laut NASA bewegt sie sich im Mittel mit 720.000 Kilometern pro Stunde.",
          "Eine Runde dauert sehr lange: Die NASA-Seite zur Sonne sagt etwa 230 Millionen Jahre, die NASA-Seite zu Galaxien und die ESA etwa 240 Millionen. Die Seiten stimmen nicht überein.",
        ],
        task: "Sieh dir die Sonne an: Mit allen Planeten reist sie um das Zentrum der Milchstraße.",
        remember: [
          "Die Sonne reist um das Zentrum der Milchstraße.",
          "Sie bewegt sich mit etwa 720.000 km/h.",
          "Eine Runde dauert etwa 230 bis 240 Millionen Jahre.",
        ],
        you: (km, n) => `Seit deiner Geburt hat die Sonne dich rund ${km} Milliarden km um die Mitte getragen (gerechnet mit 720.000 km/h). Eine Runde dauert etwa ${n}-mal so lange wie dein bisheriges Leben.`,
        ref: (km, n) => `In 30 Jahren trägt die Sonne uns rund ${km} Milliarden km um die Mitte (gerechnet mit 720.000 km/h). Eine Runde dauert etwa ${n}-mal so lange.`,
      },
      mwBand: {
        title: "Das Band am Himmel", goal: "Du weißt, was das Lichtband am Nachthimmel ist.",
        text: [
          "In einer dunklen Nacht zieht sich ein blasses Lichtband über den Himmel. Laut NASA ist es die zentrale Scheibe unserer Heimatgalaxie, von der Kante gesehen.",
          "Wir sehen sie von innen: Die Sonne liegt selbst in der Scheibe. In Richtung Schütze blicken wir zur Mitte.",
        ],
        task: "Sieh dir das Sternbild Schütze an: Dort zeigt das Band zur Mitte.",
        remember: [
          "Das Lichtband am Nachthimmel ist die Scheibe der Milchstraße.",
          "Wir sehen die Scheibe von der Kante, von innen.",
          "In Richtung Schütze liegt die Mitte.",
        ],
        you: () => "Das Band, das du in einer dunklen Nacht sehen kannst, ist die Scheibe, in der du selbst wohnst.",
        ref: () => "Das Band, das man in einer dunklen Nacht sehen kann, ist die Scheibe, in der wir alle wohnen.",
      },
      mwGaia: {
        title: "Gaias Karte", goal: "Du weißt, wie Gaia von der ESA die Milchstraße vermessen hat und woher die Sterne dieser Karte stammen.",
        text: [
          "Das Weltraumteleskop Gaia der ESA hat Orte und Entfernungen von Sternen gemessen, für eine genaue dreidimensionale Karte der Milchstraße. Seine dritte Datenveröffentlichung vom 13. Juni 2022 enthält 1.811.709.771 Quellen; die Missionsseite der ESA spricht von zwei Milliarden Sternen und anderen Objekten.",
          "Gaia beendete seine wissenschaftlichen Beobachtungen am 15. Januar 2025. Die meisten Sterne dieser Karte stammen aus Gaia DR3: die nahen Sterne bis 326 Lichtjahre und etwa eine Million helle Sterne.",
        ],
        task: "Zu diesem Schritt gibt es keine Aufgabe in der 3D-Ansicht: Die ganze Karte ist die Aufgabe. Beantworte die Fragen, dann ist der Schritt geschafft.",
        remember: [
          "Gaia hat eine genaue 3D-Karte der Milchstraße gemacht.",
          "Gaia DR3 (2022) enthält etwa 1,8 Milliarden Quellen.",
          "Die meisten Sterne dieser Karte stammen aus Gaia DR3.",
        ],
        you: (before, at) => (before != null ? `Gaia DR3 erschien 2022, ${before} Jahre vor deiner Geburt.` : at === "0" ? "Gaia DR3 erschien 2022, im Jahr deiner Geburt." : `Gaia DR3 erschien 2022, als du ${at} Jahre alt warst.`),
        ref: (ago) => `Gaia DR3 erschien 2022, vor ${ago} Jahren.`,
      },
      locGroup: {
        title: "Die Lokale Gruppe", goal: "Du kennst die Gruppe von Galaxien, zu der die Milchstraße gehört.",
        text: [
          "Laut NASA gehört die Milchstraße zu einer Gruppe von über 50 Galaxien, der Lokalen Gruppe. Die größten Mitglieder sind die Andromedagalaxie, die Milchstraße und die Dreiecksgalaxie (M33), die drittgrößte.",
          "Die Dreiecksgalaxie ist etwa 3 Millionen Lichtjahre entfernt. Laut NASA ist sie eines der fernsten Objekte, die scharfäugige Beobachter sehen können.",
        ],
        task: "Sieh dir das Sternbild Dreieck an: Darin liegt die Dreiecksgalaxie.",
        remember: [
          "Die Milchstraße gehört zur Lokalen Gruppe aus über 50 Galaxien.",
          "Die größten sind Andromeda, die Milchstraße und die Dreiecksgalaxie.",
          "Die Dreiecksgalaxie (M33) ist etwa 3 Millionen Lichtjahre entfernt.",
        ],
        you: (n) => `Das Licht der Dreiecksgalaxie ist etwa 3 Millionen Jahre unterwegs: etwa ${n}-mal dein bisheriges Leben.`,
        ref: (n) => `Das Licht der Dreiecksgalaxie ist etwa 3 Millionen Jahre unterwegs: etwa ${n}-mal ein Leben von 30 Jahren.`,
      },
      locMagellan: {
        title: "Die Magellanschen Wolken", goal: "Du kennst die Begleiter der Milchstraße.",
        text: [
          "Die Milchstraße hat kleine Begleiter. Laut ESA/Hubble ist die Große Magellansche Wolke eine Satellitengalaxie der Milchstraße.",
          "Die Kleine Magellansche Wolke liegt 200.000 Lichtjahre entfernt im Sternbild Tukan.",
        ],
        task: "Sieh dir das Sternbild Tukan an: Darin liegt die Kleine Magellansche Wolke.",
        remember: [
          "Die Große Magellansche Wolke ist eine Satellitengalaxie der Milchstraße.",
          "Die Kleine Magellansche Wolke ist 200.000 Lichtjahre entfernt.",
          "Sie liegt im Sternbild Tukan.",
        ],
        you: (n) => `Das Licht der Kleinen Magellanschen Wolke ist 200.000 Jahre unterwegs: etwa ${n}-mal dein bisheriges Leben.`,
        ref: (n) => `Das Licht der Kleinen Magellanschen Wolke ist 200.000 Jahre unterwegs: etwa ${n}-mal ein Leben von 30 Jahren.`,
      },
      locAndromeda: {
        title: "Die Andromedagalaxie", goal: "Du kennst unsere große Nachbargalaxie.",
        text: [
          "Die Andromedagalaxie (M31) ist die größte Galaxie der Lokalen Gruppe. Laut NASA ist sie 2,5 Millionen Lichtjahre entfernt, im Sternbild Andromeda.",
          "Trotzdem sieht man sie an einem dunklen Ort leicht mit bloßem Auge. Das Licht, das man dann sieht, flog vor 2,5 Millionen Jahren los.",
        ],
        task: "Sieh dir das Sternbild Andromeda an: Darin liegt die Andromedagalaxie.",
        remember: [
          "Die Andromedagalaxie ist die größte Galaxie der Lokalen Gruppe.",
          "Sie ist 2,5 Millionen Lichtjahre entfernt.",
          "An einem dunklen Ort sieht man sie mit bloßem Auge.",
        ],
        you: (n) => `Das Licht von Andromeda ist 2,5 Millionen Jahre unterwegs: etwa ${n}-mal dein bisheriges Leben.`,
        ref: (n) => `Das Licht von Andromeda ist 2,5 Millionen Jahre unterwegs: etwa ${n}-mal ein Leben von 30 Jahren.`,
      },
      locApproach: {
        title: "Andromeda kommt näher", goal: "Du weißt, was die NASA 2012 für Milchstraße und Andromeda vorhergesagt hat.",
        text: [
          "Laut NASA bewegt sich Andromeda mit etwa 250.000 Meilen pro Stunde auf die Milchstraße zu, rund 400.000 Kilometer pro Stunde.",
          "2012 sagte die NASA mit Hubble-Daten einen Frontalzusammenstoß in etwa vier Milliarden Jahren voraus. In rund 6 Milliarden Jahren würden die beiden Galaxien zu einer verschmelzen.",
        ],
        task: "Sieh dir noch einmal das Sternbild Andromeda an: Von dort kommt unser Nachbar näher.",
        remember: [
          "Andromeda kommt mit etwa 400.000 km/h auf uns zu.",
          "Die NASA sagte 2012 einen Zusammenstoß in etwa 4 Milliarden Jahren voraus.",
          "In etwa 6 Milliarden Jahren würden beide zu einer verschmelzen.",
        ],
        you: (km) => `Seit deiner Geburt ist Andromeda uns rund ${km} Milliarden km näher gekommen (gerechnet mit 250.000 Meilen pro Stunde).`,
        ref: (km) => `In 30 Jahren kommt Andromeda uns rund ${km} Milliarden km näher (gerechnet mit 250.000 Meilen pro Stunde).`,
      },
      locFuture: {
        title: "Wie sicher ist die Zukunft?", goal: "Du weißt, dass sich eine Vorhersage der Wissenschaft mit neuen Daten ändern kann.",
        text: [
          "2025 sah ein Team um Till Sawala noch einmal hin, mit Daten von Hubble und Gaia der ESA. Laut ESA/Hubble liegt die Chance, dass die beiden Galaxien in den nächsten 10 Milliarden Jahren zusammenstoßen, nur bei 50 zu 50.",
          "So arbeitet die Wissenschaft: Eine Vorhersage gilt, solange die Daten sie tragen. Mit besseren Messungen wurde aus dem Zusammenstoß von 2012 eine Möglichkeit.",
        ],
        task: "Zu diesem Schritt gibt es keine Aufgabe in der 3D-Ansicht. Beantworte die Fragen, dann ist der Schritt geschafft.",
        remember: [
          "Eine Studie von 2025 gibt nur 50 zu 50 für einen Zusammenstoß in 10 Milliarden Jahren.",
          "Sie nutzte Daten von Hubble und Gaia der ESA.",
          "Vorhersagen der Wissenschaft können sich mit neuen Daten ändern.",
        ],
        you: (n) => `Die vier Milliarden Jahre der Vorhersage von 2012 sind etwa ${n}-mal dein bisheriges Leben.`,
        ref: (n) => `Die vier Milliarden Jahre der Vorhersage von 2012 sind etwa ${n}-mal ein Leben von 30 Jahren.`,
      },
      nsWhat: {
        title: "Neutronensterne", goal: "Du weißt, was ein Neutronenstern ist und wie dicht er ist.",
        text: [
          "Laut NASA entstehen Neutronensterne, wenn einem massereichen Stern der Brennstoff ausgeht und er in sich zusammenstürzt. Sie packen mehr Masse als die Sonne in eine Kugel von nur etwa 20 Kilometern Durchmesser.",
          "Ihr Material ist unvorstellbar dicht: Laut NASA wöge ein Würfelzucker davon etwa 1 Billion Kilogramm. Die Karte hat Neutronensterne mit Planeten, zum Beispiel PSR B0329+54.",
        ],
        task: "Sieh dir PSR B0329+54 an, einen Neutronenstern mit einem Planeten.",
        remember: [
          "Ein Neutronenstern entsteht, wenn einem massereichen Stern der Brennstoff ausgeht und er zusammenstürzt.",
          "Er packt mehr Masse als die Sonne in eine Kugel von etwa 20 km.",
          "Ein Würfelzucker seines Materials wöge etwa 1 Billion Kilogramm.",
        ],
        you: (name, m) => `Dein Stern ${name} hat das ${m}-Fache der Sonnenmasse und ist viel größer als eine Stadt. Ein Neutronenstern packt mehr als eine ganze Sonne in etwa 20 km.`,
        ref: (name, m) => `${name} hat das ${m}-Fache der Sonnenmasse und ist viel größer als eine Stadt. Ein Neutronenstern packt mehr als eine ganze Sonne in etwa 20 km.`,
        none: () => "Ein Neutronenstern packt mehr als eine ganze Sonne in etwa 20 km.",
      },
      nsPulsar: {
        title: "Pulsare", goal: "Du weißt, was ein Pulsar ist und warum er blinkt.",
        text: [
          "Laut NASA sind Pulsare sich drehende Neutronensterne, die Strahlungspulse aussenden. Man kann sie sich wie einen Leuchtturm vorstellen: Ihr Strahl streicht immer wieder an uns vorbei. Zwischen den Pulsen liegen meist Millisekunden bis Sekunden.",
          "Um den Pulsar PSR B1257+12 wurden Planeten gefunden; die NASA zählt sie zu den ersten entdeckten. Die NASA-Tabelle dieser Karte nennt für zwei von ihnen 1992, für den dritten 1994.",
        ],
        task: "Sieh dir PSR B1257+12 an, einen Pulsar mit drei Planeten.",
        remember: [
          "Ein Pulsar ist ein sich drehender Neutronenstern, der Strahlungspulse aussendet.",
          "Er wirkt wie ein Leuchtturm: Sein Strahl streicht an uns vorbei.",
          "Seine Pulse kommen alle paar Millisekunden bis Sekunden.",
        ],
        you: (n) => `Ein Pulsar, der einmal pro Sekunde blinkt, hätte seit deiner Geburt etwa ${n}-mal geblinkt. (Gerechnet.)`,
        ref: (n) => `Ein Pulsar, der einmal pro Sekunde blinkt, blinkt in 30 Jahren etwa ${n}-mal. (Gerechnet.)`,
      },
      bhWhat: {
        title: "Was ist ein Schwarzes Loch?", goal: "Du weißt, was ein Schwarzes Loch ist und was es nicht ist.",
        text: [
          "Laut NASA ist die Schwerkraft eines Schwarzen Lochs so stark, dass nichts entkommt, nicht einmal Licht. Ein Stern mit mehr als der achtfachen Sonnenmasse kann eines hinterlassen: Sein Kern stürzt zu einem stellaren Schwarzen Loch zusammen.",
          "Aber Schwarze Löcher sind keine kosmischen Staubsauger: Laut NASA saugen sie keine andere Materie an. Würde man die Sonne durch ein Schwarzes Loch gleicher Masse ersetzen, blieben die Planeten auf ihren Bahnen.",
        ],
        task: "Zu diesem Schritt gibt es keine Aufgabe in der 3D-Ansicht: Ein Schwarzes Loch kann man nicht sehen. Beantworte die Fragen, dann ist der Schritt geschafft.",
        remember: [
          "Aus einem Schwarzen Loch entkommt nichts, nicht einmal Licht.",
          "Der Kern eines sehr schweren Sterns kann zu einem Schwarzen Loch zusammenstürzen.",
          "Schwarze Löcher saugen keine Materie an; die Planeten blieben auf ihren Bahnen.",
        ],
        you: (ly) => `Licht ist so schnell, dass es in deinem Leben ${ly} Lichtjahre weit gekommen ist. Aus einem Schwarzen Loch kommt es nicht heraus.`,
        ref: (ly) => `Licht ist so schnell, dass es in ${ly} Jahren ${ly} Lichtjahre weit kommt. Aus einem Schwarzen Loch kommt es nicht heraus.`,
      },
      bhCenter: {
        title: "Das Schwarze Loch in unserer Mitte", goal: "Du kennst das Schwarze Loch im Zentrum der Milchstraße.",
        text: [
          "Laut NASA haben supermassereiche Schwarze Löcher das Hunderttausend- bis Milliardenfache der Sonnenmasse, und Galaxien haben eines in ihrem Zentrum.",
          "Unseres heißt Sagittarius A*. Laut ESO ist es viermillionenmal massereicher als die Sonne und etwa 27.000 Lichtjahre entfernt, in Richtung des Sternbilds Schütze.",
        ],
        task: "Sieh dir das Sternbild Schütze an: In seiner Richtung liegt das Zentrum der Milchstraße.",
        remember: [
          "Supermassereiche Schwarze Löcher sitzen in den Zentren von Galaxien.",
          "Sagittarius A* ist viermillionenmal massereicher als die Sonne.",
          "Es ist etwa 27.000 Lichtjahre entfernt, in Richtung Schütze.",
        ],
        you: (before) => `Licht aus der Gegend von Sagittarius A*, das heute ankommt, ist etwa 27.000 Jahre unterwegs: Es flog rund ${before} Jahre vor deiner Geburt los.`,
        ref: () => "Licht aus der Gegend von Sagittarius A*, das heute ankommt, ist etwa 27.000 Jahre unterwegs.",
      },
      bhImage: {
        title: "Das erste Bild eines Schwarzen Lochs", goal: "Du weißt, wie Schwarze Löcher fotografiert wurden.",
        text: [
          "Am 10. April 2019 zeigte das Event Horizon Telescope das erste Bild eines Schwarzen Lochs: das in der Galaxie M87, laut ESO 55 Millionen Lichtjahre entfernt und 6,5 Milliarden Sonnenmassen schwer. Es zeigt eine ringartige Struktur mit einer dunklen Mitte.",
          "Am 12. Mai 2022 folgte das erste Bild von Sagittarius A*, dem Schwarzen Loch im Zentrum unserer eigenen Milchstraße.",
        ],
        task: "Sieh dir das Sternbild Jungfrau an: In seiner Richtung liegt die Galaxie M87.",
        remember: [
          "Das erste Bild eines Schwarzen Lochs wurde am 10. April 2019 gezeigt (M87).",
          "Es zeigt eine ringartige Struktur mit einer dunklen Mitte.",
          "Das Bild von Sagittarius A* folgte am 12. Mai 2022.",
        ],
        you: (before, at) => (before != null ? `Das erste Bild eines Schwarzen Lochs wurde 2019 gezeigt, ${before} Jahre vor deiner Geburt.` : at === "0" ? "Das erste Bild eines Schwarzen Lochs wurde 2019 gezeigt, im Jahr deiner Geburt." : `Das erste Bild eines Schwarzen Lochs wurde 2019 gezeigt, als du ${at} Jahre alt warst.`),
        ref: (ago) => `Das erste Bild eines Schwarzen Lochs wurde 2019 gezeigt, vor ${ago} Jahren.`,
      },
      lifeMain: {
        title: "Die Hauptreihe", goal: "Du kennst die längste Phase im Leben eines Sterns.",
        text: [
          "Laut NASA heißen Sterne, die in ihrem Kern gleichmäßig Wasserstoff zu Helium verschmelzen, Hauptreihensterne. Es ist die längste Phase im Leben eines Sterns, und rund 90 % der Sterne sind in ihr.",
          "Die Sonne ist einer davon, etwa in der Mitte ihrer Hauptreihenzeit. Laut NASA verbringt sie etwa 10 Milliarden Jahre auf der Hauptreihe.",
        ],
        task: "Sieh dir die Sonne an, in der Mitte ihrer Hauptreihe.",
        remember: [
          "Auf der Hauptreihe verschmilzt ein Stern gleichmäßig Wasserstoff zu Helium.",
          "Es ist die längste Phase im Leben eines Sterns.",
          "Die Sonne ist etwa in der Mitte ihrer rund 10 Milliarden Jahre dort.",
        ],
        you: (sec) => `Wären die 10 Milliarden Hauptreihenjahre der Sonne ein einziges Jahr, dann hätte dein Leben bisher etwa ${sec} Sekunden gedauert. (Gerechnet.)`,
        ref: (sec) => `Wären die 10 Milliarden Hauptreihenjahre der Sonne ein einziges Jahr, dann hätte ein Leben von 30 Jahren etwa ${sec} Sekunden gedauert. (Gerechnet.)`,
      },
      lifeMass: {
        title: "Die Masse entscheidet", goal: "Du weißt, warum schwere Sterne kurz und leichte lange leben.",
        text: [
          "Laut NASA verbraucht ein massereicherer Stern seinen Brennstoff schneller. Darum leben die schwersten Sterne nur wenige Millionen Jahre.",
          "Leichte Sterne sind sparsam: Laut NASA werden manche massearme Sterne Billionen Jahre leuchten. Proxima Centauri ist so ein leichter Stern: ein roter Zwerg mit etwa einem Achtel der Sonnenmasse, nach der NASA-Tabelle dieser Karte.",
        ],
        task: "Sieh dir Proxima Centauri an, einen leichten roten Zwerg mit einem sehr langen Leben vor sich.",
        remember: [
          "Ein massereicherer Stern verbraucht seinen Brennstoff schneller.",
          "Die schwersten Sterne leben nur wenige Millionen Jahre.",
          "Manche leichten Sterne leuchten Billionen Jahre.",
        ],
        you: (name, m, light) => `Dein Stern ${name} hat das ${m}-Fache der Sonnenmasse, ${light ? "weniger: Er verbraucht seinen Brennstoff langsamer und lebt länger als die Sonne" : "mehr: Er verbraucht seinen Brennstoff schneller und lebt kürzer als die Sonne"}.`,
        ref: (name, m, light) => `${name} hat das ${m}-Fache der Sonnenmasse, ${light ? "weniger: Er verbraucht seinen Brennstoff langsamer und lebt länger als die Sonne" : "mehr: Er verbraucht seinen Brennstoff schneller und lebt kürzer als die Sonne"}.`,
        none: (name) => `Für ${name} nennt die Tabelle keine Masse.`,
      },
      lifeGiant: {
        title: "Der Rote Riese", goal: "Du weißt, was passiert, wenn einem Stern im Kern der Wasserstoff ausgeht.",
        text: [
          "Geht dem Kern eines Sterns der Wasserstoff aus, den er zu Helium verschmelzen kann, beginnt der Kern einzustürzen, und der Stern bläht sich langsam auf. Laut NASA ist das Ergebnis ein Roter Riese.",
          "Das passiert auch der Sonne: Laut NASA wird sie in etwa 5 Milliarden Jahren ein Roter Riese.",
        ],
        task: "Sieh dir die Sonne an: In etwa 5 Milliarden Jahren wird sie ein Roter Riese.",
        remember: [
          "Ohne Wasserstoff im Kern stürzt der Kern ein, und der Stern bläht sich auf.",
          "Das Ergebnis ist ein Roter Riese.",
          "Die Sonne wird in etwa 5 Milliarden Jahren ein Roter Riese.",
        ],
        you: (n) => `5 Milliarden Jahre bis zum Roten Riesen sind etwa ${n}-mal dein bisheriges Leben.`,
        ref: (n) => `5 Milliarden Jahre bis zum Roten Riesen sind etwa ${n}-mal ein Leben von 30 Jahren.`,
      },
      lifeWhite: {
        title: "Weiße Zwerge", goal: "Du weißt, wie Sterne wie die Sonne enden.",
        text: [
          "Hat ein Roter Riese seine ganze Hülle abgestoßen, bleibt nur der Kern: ein Weißer Zwerg. Laut NASA ist er meist so groß wie die Erde, und ein Teelöffel seines Materials wöge mehr als ein Pick-up. Er kühlt über Milliarden Jahre langsam ab; die abgestoßene Hülle bildet eine wachsende Wolke, einen planetarischen Nebel.",
          "Laut NASA enden Sterne bis etwa zur siebenfachen Sonnenmasse als Weiße Zwerge, auch die Sonne. Die Karte hat Weiße Zwerge mit Planeten: Um WD 1856+534 kennt die NASA-Tabelle einen, gefunden 2020.",
        ],
        task: "Sieh dir WD 1856+534 an, einen Weißen Zwerg mit einem Planeten.",
        remember: [
          "Ein Weißer Zwerg ist der übrige Kern eines Sterns, meist so groß wie die Erde.",
          "Ein Teelöffel seines Materials wöge mehr als ein Pick-up.",
          "Sterne bis etwa zur siebenfachen Sonnenmasse enden als Weiße Zwerge.",
        ],
        you: (name, m, fate) => `Dein Stern ${name} hat das ${m}-Fache der Sonnenmasse: ${fate === "white" ? "Er wird einmal als Weißer Zwerg enden." : fate === "nova" ? "Er ist schwer genug für eine Supernova." : "Er liegt an der Grenze zwischen Weißem Zwerg und Supernova."}`,
        ref: (name, m, fate) => `${name} hat das ${m}-Fache der Sonnenmasse: ${fate === "white" ? "Er wird einmal als Weißer Zwerg enden." : fate === "nova" ? "Er ist schwer genug für eine Supernova." : "Er liegt an der Grenze zwischen Weißem Zwerg und Supernova."}`,
        none: (name) => `Für ${name} nennt die Tabelle keine Masse.`,
      },
      lifeNova: {
        title: "Supernova und Sternenstaub", goal: "Du weißt, wie schwere Sterne enden und woher die Elemente kommen.",
        text: [
          "Laut NASA explodiert ein Stern mit mehr als der achtfachen Sonnenmasse an seinem Ende als Supernova; eine andere NASA-Seite setzt die Grenze bei sieben. Sein Kern kann zu einem Schwarzen Loch einstürzen: mehr dazu im nächsten Pfad.",
          "In ihrem Kern verschmelzen Sterne Kohlenstoff zu schwereren Elementen wie Sauerstoff, Neon und Magnesium, und Supernovae verstreuen die Elemente im All. Laut NASA besteht alles auf der Erde, auch unser Körper, aus Elementen, die in den Kernen von Sternen entstanden sind.",
        ],
        task: "Zu diesem Schritt gibt es keine Aufgabe in der 3D-Ansicht. Beantworte die Fragen, dann ist der Schritt geschafft.",
        remember: [
          "Sterne mit mehr als etwa der achtfachen Sonnenmasse enden in einer Supernova.",
          "Sterne verschmelzen schwerere Elemente wie Sauerstoff; Supernovae verstreuen sie.",
          "Laut NASA besteht auch unser Körper aus Elementen aus Sternen.",
        ],
        you: (name, m, fate) => `Die Elemente deines Körpers sind in Sternen entstanden. Dein Stern ${name} (${m} Sonnenmassen) ${fate === "nova" ? "wird selbst einmal explodieren." : "ist zu leicht, um als Supernova zu explodieren."}`,
        ref: (name, m, fate) => `Die Elemente jedes menschlichen Körpers sind in Sternen entstanden. ${name} (${m} Sonnenmassen) ${fate === "nova" ? "wird selbst einmal explodieren." : "ist zu leicht, um als Supernova zu explodieren."}`,
        none: () => "Die Elemente deines Körpers sind in Sternen entstanden.",
      },
      birthCloud: {
        title: "Wolken aus Gas und Staub", goal: "Du weißt, wo Sterne geboren werden.",
        text: [
          "Laut NASA entstehen Sterne in großen Wolken aus Gas und Staub, den Molekülwolken. Sie sind kalt, darum ballt sich das Gas zu dichten Klumpen. Irgendwann bringt die Schwerkraft manche dieser Klumpen zum Einstürzen.",
          "Der Orionnebel ist so eine Kinderstube der Sterne: laut NASA das nächste große Sternentstehungsgebiet bei der Erde, etwa 1.500 Lichtjahre entfernt, knapp unter dem Gürtel des Orion.",
        ],
        task: "Sieh dir das Sternbild Orion an: Der Orionnebel liegt knapp unter seinem Gürtel.",
        remember: [
          "Sterne entstehen in kalten Wolken aus Gas und Staub, den Molekülwolken.",
          "Die Schwerkraft bringt Klumpen in diesen Wolken zum Einstürzen.",
          "Der Orionnebel ist das nächste große Sternentstehungsgebiet, etwa 1.500 Lichtjahre entfernt.",
        ],
        you: (before) => `Das Licht des Orionnebels, das heute ankommt, ist etwa 1.500 Jahre unterwegs: Es flog rund ${before} Jahre vor deiner Geburt los.`,
        ref: () => "Das Licht des Orionnebels, das heute ankommt, ist etwa 1.500 Jahre unterwegs.",
      },
      birthProto: {
        title: "Vom Klumpen zum Protostern", goal: "Du weißt, wie aus einem einstürzenden Klumpen ein Stern wird.",
        text: [
          "Stürzt ein Klumpen ein, heizt die Reibung das Material auf, und es entsteht ein Protostern: laut NASA ein Sternenbaby. Nach Millionen Jahren pressen die Temperaturen in seinem Kern Wasserstoffkerne zusammen: Die Kernfusion beginnt, der Stern leuchtet.",
          "AU Mic, etwa 32 Lichtjahre entfernt, ist so ein junger Stern. Die NASA gibt sein Alter mit 20 bis 30 Millionen Jahren an: ein Sternenkind, die Sonne ist mindestens 150-mal älter.",
        ],
        task: "Sieh dir AU Mic an, einen jungen Stern mit Planeten.",
        remember: [
          "Ein einstürzender Klumpen heizt sich auf und wird ein Protostern, ein Sternenbaby.",
          "Nach Millionen Jahren beginnt in seinem Kern die Kernfusion von Wasserstoff.",
          "AU Mic ist erst 20 bis 30 Millionen Jahre alt; die Sonne ist mindestens 150-mal älter.",
        ],
        you: (x) => `AU Mic ist 20 bis 30 Millionen Jahre alt: von der Mitte gerechnet etwa ${x}-mal so alt wie du. Für einen Stern ist das ein Baby.`,
        ref: (x) => `AU Mic ist 20 bis 30 Millionen Jahre alt: von der Mitte gerechnet etwa ${x}-mal so alt wie ein Mensch von 30. Für einen Stern ist das ein Baby.`,
      },
      birthDisk: {
        title: "Die Scheibe und die Planeten", goal: "Du weißt, wie um einen jungen Stern Planeten wachsen.",
        text: [
          "Ein junger Stern ist noch von einer Scheibe aus Gas und Staub umgeben, die von seiner Geburt übrig ist; laut NASA hat auch AU Mic eine. In so einer Scheibe stoßen feste Teilchen aus Gestein und Eis zusammen und verschmelzen: So wachsen Planeten.",
          "2018 zeigte die ESO das erste bestätigte Bild eines Planeten, der gerade in so einer Scheibe entsteht: PDS 70 b, um einen Stern, den die ESO fast 400 Lichtjahre entfernt sieht (die NASA-Tabelle dieser Karte nennt 369). 2021 fand ALMA um seinen Geschwisterplaneten PDS 70 c eine Scheibe, in der Monde entstehen könnten.",
        ],
        task: "Sieh dir PDS 70 mit seinen zwei jungen Planeten an.",
        remember: [
          "Ein junger Stern ist von einer Scheibe aus Gas und Staub umgeben.",
          "In der Scheibe stoßen Teilchen aus Gestein und Eis zusammen und wachsen zu Planeten.",
          "PDS 70 b war das erste bestätigte Bild eines Planeten im Entstehen (2018).",
        ],
        you: (before, at) => (before != null ? `PDS 70 b wurde 2018 fotografiert, ${before} Jahre vor deiner Geburt.` : at === "0" ? "PDS 70 b wurde 2018 fotografiert, im Jahr deiner Geburt." : `PDS 70 b wurde 2018 fotografiert, als du ${at} Jahre alt warst.`),
        ref: (ago) => `PDS 70 b wurde 2018 fotografiert, vor ${ago} Jahren.`,
      },
      birthCluster: {
        title: "Sterne werden in Gruppen geboren", goal: "Du weißt, dass Sterne oft gemeinsam entstehen, in Sternhaufen.",
        text: [
          "Laut NASA entstehen Sterne oft in Gruppen; solche Gruppen heißen Sternhaufen.",
          "Der bekannteste sind die Plejaden, ein offener Sternhaufen im Stier. Die NASA gibt ihre Entfernung mit rund 445 Lichtjahren an und fügt hinzu, dass diese Zahl nicht allgemein anerkannt ist.",
        ],
        task: "Sieh dir das Sternbild Stier an: Die Plejaden liegen darin.",
        remember: [
          "Sterne entstehen oft in Gruppen, den Sternhaufen.",
          "Die Plejaden sind ein offener Sternhaufen im Stier.",
          "Sie sind rund 445 Lichtjahre entfernt; die Zahl ist nicht allgemein anerkannt.",
        ],
        you: (year, before) => `Das Licht der Plejaden, das heute ankommt, flog um das Jahr ${year} los, etwa ${before} Jahre vor deiner Geburt.`,
        ref: (year) => `Das Licht der Plejaden, das heute ankommt, flog um das Jahr ${year} los.`,
      },
      birthSun: {
        title: "Die Geburt der Sonne", goal: "Du weißt, wie und wann die Sonne und ihre Planeten entstanden.",
        text: [
          "Laut NASA entstand die Sonne vor etwa 4,6 Milliarden Jahren in einer riesigen, sich drehenden Wolke aus Gas und Staub, dem Sonnennebel. Aus einem Großteil des übrigen Materials entstanden die Planeten und die anderen Körper des Sonnensystems, auch die Erde.",
          "Dieselbe NASA-Seite nennt die Sonne in ihrer Einleitung 4,5 Milliarden Jahre alt: Die beiden Zahlen sind verschieden gerundet, beide meinen etwa viereinhalb Milliarden Jahre.",
        ],
        task: "Sieh dir die Sonne an, geboren vor 4,6 Milliarden Jahren.",
        remember: [
          "Die Sonne entstand vor etwa 4,6 Milliarden Jahren.",
          "Sie wurde in einer sich drehenden Wolke aus Gas und Staub geboren, dem Sonnennebel.",
          "Aus einem Großteil des übrigen Materials entstanden die Planeten, auch die Erde.",
        ],
        you: (ms) => `Wäre das bisherige Leben der Sonne ein einziger Tag, dann hätte dein Leben bisher etwa ${ms} Tausendstelsekunden gedauert. (Gerechnet mit 4,6 Milliarden Jahren.)`,
        ref: (ms) => `Wäre das bisherige Leben der Sonne ein einziger Tag, dann hätte ein Leben von 30 Jahren etwa ${ms} Tausendstelsekunden gedauert. (Gerechnet mit 4,6 Milliarden Jahren.)`,
      },
      starWhat: {
        title: "Was ist ein Stern?", goal: "Du weißt, was ein Stern ist und woher sein Licht kommt.",
        text: [
          "Laut NASA sind Sterne riesige Kugeln aus heißem Gas, die von ihrer eigenen Schwerkraft zusammengehalten werden. Die Sonne ist einer davon: der Stern, der uns am nächsten ist.",
          "Tief in seinem Kern presst ein Stern die Kerne von Wasserstoffatomen zu Helium zusammen. Diese Kernfusion setzt die Energie frei, mit der er leuchtet. Die Sonne tut das seit etwa 4,6 Milliarden Jahren.",
        ],
        task: "Sieh dir die Sonne an, den Stern, der uns am nächsten ist.",
        remember: [
          "Ein Stern ist eine riesige Kugel aus heißem Gas, von seiner eigenen Schwerkraft zusammengehalten.",
          "In seinem Kern verschmilzt Wasserstoff zu Helium; davon leuchtet er.",
          "Die Sonne ist ein Stern, der uns am nächsten.",
        ],
        you: (n) => `Seit deiner Geburt ist die Erde ${n}-mal um die Sonne gelaufen. Die ganze Zeit hat die Sonne in ihrem Kern Wasserstoff zu Helium verschmolzen: Das ist ihr Licht.`,
        ref: (n) => `In ${n} Jahren läuft die Erde ${n}-mal um die Sonne. Die ganze Zeit verschmilzt die Sonne in ihrem Kern Wasserstoff zu Helium: Das ist ihr Licht.`,
      },
      starColor: {
        title: "Farbe und Temperatur", goal: "Du kannst an der Farbe eines Sterns erkennen, ob er heiß oder kühl ist.",
        text: [
          "Laut NASA haben Sterne verschiedene Farben, weil sie verschieden heiß sind: Heißere Sterne sehen blau oder weiß aus, kühlere orange oder rot.",
          "Die Oberfläche der Sonne ist etwa 5.500 °C heiß. TRAPPIST-1 ist viel kühler: Die NASA-Tabelle dieser Karte gibt 2.566 Kelvin an, etwa 2.300 °C. Darum leuchtet er rot.",
        ],
        task: "Sieh dir TRAPPIST-1 an, einen kühlen roten Stern.",
        remember: [
          "Die Farbe eines Sterns zeigt seine Temperatur.",
          "Heiße Sterne sehen blau oder weiß aus, kühle orange oder rot.",
          "Die Oberfläche der Sonne ist etwa 5.500 °C heiß.",
        ],
        you: (name, c, hotter) => `Dein Stern ${name} ist an der Oberfläche etwa ${c} °C heiß, ${hotter ? "heißer" : "kühler"} als die Sonne (etwa 5.500 °C).`,
        ref: (name, c, hotter) => `${name} ist an der Oberfläche etwa ${c} °C heiß, ${hotter ? "heißer" : "kühler"} als die Sonne (etwa 5.500 °C).`,
        none: (name) => `Für ${name} nennt die Tabelle keine Temperatur.`,
      },
      starClass: {
        title: "Die Klassen der Sterne", goal: "Du kannst einen Stern nach seinem Buchstaben einordnen: O, B, A, F, G, K, M.",
        text: [
          "Die Astronomie ordnet Sterne in Klassen mit Buchstaben, vom heißesten zum kühlsten: O (blau), B (blauweiß), A (weiß), F (gelbweiß), G (gelb), K (orange) und M (rot).",
          "Laut NASA ist die Sonne ein gelber Zwerg der Klasse G. Auch 51 Pegasi ist ein G-Stern: Um ihn wurde der erste Planet um einen sonnenähnlichen Stern gefunden.",
        ],
        task: "Sieh dir 51 Pegasi an, einen G-Stern wie die Sonne.",
        remember: [
          "Die Klassen von heiß nach kühl: O, B, A, F, G, K, M.",
          "O-Sterne sind blau, M-Sterne rot.",
          "Die Sonne ist ein G-Stern, ein gelber Zwerg.",
        ],
        colors: { O: "blau", B: "blauweiß", A: "weiß", F: "gelbweiß", G: "gelb", K: "orange", M: "rot" },
        you: (name, spec, color) => `Dein Stern ${name} hat in der Tabelle den Typ ${spec}: Der erste Buchstabe ist seine Klasse, seine Farbe ${color}.`,
        ref: (name, spec, color) => `${name} hat in der Tabelle den Typ ${spec}: Der erste Buchstabe ist seine Klasse, seine Farbe ${color}.`,
        none: (name) => `Für ${name} nennt die Tabelle keinen Typ.`,
      },
      starSize: {
        title: "Groß und klein", goal: "Du weißt, wie verschieden groß Sterne sind und welche am häufigsten sind.",
        text: [
          "Sterne sind sehr verschieden groß. Proxima Centauri ist ein roter Zwerg: Die NASA-Tabelle dieser Karte gibt ihm das 0,141-Fache des Sonnenradius, etwa ein Siebtel. Der größte Stern der Karte mit einem Planeten, HD 18438, ist etwa 88-mal so groß wie die Sonne.",
          "Rote Zwerge sind die häufigsten Sterne. Ihren Anteil an den Sternen der Milchstraße gibt die NASA auf einer Seite mit etwa 73 %, auf einer anderen mit 75 % an; Sterne wie die Sonne sind nur etwa 6 %.",
        ],
        task: "Sieh dir Proxima Centauri an, einen kleinen roten Zwerg.",
        remember: [
          "Sterne sind sehr verschieden groß, von kleinen roten Zwergen bis zu Riesen.",
          "Etwa drei Viertel der Sterne der Milchstraße sind rote Zwerge.",
          "Nur etwa 6 % sind Sterne wie die Sonne.",
        ],
        you: (name, x, small) => (small ? `Dein Stern ${name} hat etwa ${x} % des Sonnenradius.` : `Dein Stern ${name} ist etwa ${x}-mal so groß wie die Sonne.`),
        ref: (name, x, small) => (small ? `${name} hat etwa ${x} % des Sonnenradius.` : `${name} ist etwa ${x}-mal so groß wie die Sonne.`),
        none: (name) => `Für ${name} nennt die Tabelle keine Größe.`,
      },
      starHosts: {
        title: "Sterne als Heimat für Planeten", goal: "Du weißt, welche Sterne die NASA für gute Heimaten von Leben hält.",
        text: [
          "Laut NASA gelten Sterne, die etwas kühler sind als die Sonne, die orangen Zwerge der Klasse K, als besser für höheres Leben.",
          "Rote Zwerge (Klasse M) leben noch länger: Die NASA nennt mehr als 100 Milliarden Jahre. Aber Planeten in ihrer bewohnbaren Zone können völlig austrocknen. Trotzdem hat TOI-700, ein M-Stern, einen Planeten in seiner Zone.",
        ],
        task: "Sieh dir TOI-700 an, einen roten Zwerg mit einem Planeten in der bewohnbaren Zone.",
        remember: [
          "Orange Zwerge (Klasse K) gelten als gut für höheres Leben.",
          "Rote Zwerge (Klasse M) leben am längsten, mehr als 100 Milliarden Jahre.",
          "Planeten in der Zone eines roten Zwergs können austrocknen.",
        ],
        hint: { G: "Er ist der Sonne ähnlich.", K: "Orange Zwerge wie er gelten laut NASA als besser für höheres Leben.", M: "Rote Zwerge wie er leben sehr lange, aber Planeten in ihrer Zone können austrocknen." },
        you: (name, cls, hint) => `Dein Stern ${name} ist ein Stern der Klasse ${cls}, und mindestens ein Planet kreist um ihn. ${hint}`.trim(),
        ref: (name, cls, hint) => `${name} ist ein Stern der Klasse ${cls}, und zwei Planeten kreisen um ihn. ${hint}`.trim(),
        none: (name) => `Für ${name} nennt die Tabelle keinen Typ.`,
      },
      nameLetters: {
        title: "Planeten bekommen Buchstaben", goal: "Du kannst den Namen eines Exoplaneten lesen: Stern und Buchstabe.",
        text: [
          "Ein Exoplanet heißt meist wie sein Stern, mit einem kleinen Buchstaben dahinter. Laut NASA heißt der erste gefundene Planet immer b, die nächsten c, d, e und so weiter. Der Stern selbst ist das ungenannte „A“.",
          "Werden mehrere Planeten eines Sterns zur gleichen Zeit gefunden, bekommt der Planet, der dem Stern am nächsten ist, das b. Bei TRAPPIST-1 heißen die sieben Planeten von innen nach außen b bis h. Der Buchstabe nennt also die Reihenfolge der Entdeckung, nicht den Abstand: Bei Proxima Centauri stehen in der NASA-Tabelle dieser Karte b und d, und d kreist näher am Stern als b, wurde aber später gefunden.",
        ],
        task: "Sieh dir Proxima Centauri mit seinen Planeten b und d an.",
        remember: [
          "Ein Exoplanet heißt wie sein Stern, mit einem kleinen Buchstaben.",
          "Der erste gefundene Planet heißt b, die nächsten c, d, e.",
          "Werden mehrere auf einmal gefunden, bekommt der innerste das b.",
        ],
        you: (star, list, n) => (n ? `Dein Stern heißt ${star}. Die NASA-Tabelle kennt um ihn ${n === 1 ? "einen Planeten" : `${n} Planeten`}: ${list}.` : `Dein Stern heißt ${star}. Seine Planeten heißen ${star} b, ${star} c und so weiter, in der Reihenfolge ihrer Entdeckung.`),
        ref: () => "Bei Proxima Centauri heißen die Planeten Proxima Cen b und Proxima Cen d: Der Stern heißt Proxima Cen, die Buchstaben zählen seine Planeten.",
      },
      nameStars: {
        title: "Sterne bekommen Großbuchstaben", goal: "Du weißt, wie die Sterne eines Systems mit mehreren Sternen heißen.",
        text: [
          "Viele Sterne haben Begleiter: zwei, drei oder mehr Sterne, die zusammengehören. Laut NASA bekommen Sterne große Buchstaben und Planeten kleine. Der Stern mit den Planeten ist meist das ungenannte A, die anderen Sterne können B, C heißen.",
          "Unsere nächsten Nachbarn zeigen es: Alpha Centauri A und Alpha Centauri B umkreisen einander, und Proxima Centauri gehört als dritter Stern zum selben System. Große und kleine Buchstaben halten Sterne und Planeten auseinander: Alpha Centauri B ist ein Stern, Proxima Cen b ein Planet.",
        ],
        task: "Sieh dir Alpha Centauri A an, mit B daneben und Proxima in der Nähe markiert.",
        remember: [
          "Sterne bekommen große Buchstaben, Planeten kleine.",
          "Der Stern mit den Planeten ist meist das ungenannte A.",
          "Alpha Centauri A und B sind zwei Sterne, Proxima Cen b ist ein Planet.",
        ],
        you: (left) => (left == null ? "Das Licht von Alpha Centauri A und B, das heute ankommt, ist 4,37 Jahre unterwegs: Es flog los, bevor du geboren wurdest." : `Das Licht von Alpha Centauri A und B, das heute ankommt, ist 4,37 Jahre unterwegs: Es flog los, als du ${left} Jahre alt warst.`),
        ref: (left) => `Das Licht von Alpha Centauri A und B ist 4,37 Jahre zu uns unterwegs. Wer heute 30 ist, war ${left}, als es losflog.`,
      },
      nameGreek: {
        title: "Griechische Buchstaben und Sternbilder", goal: "Du kannst einen Sternnamen wie Alpha Centauri lesen.",
        text: [
          "Viele helle Sterne tragen einen griechischen Buchstaben und den lateinischen Namen ihres Sternbilds in der Form „des …“. Die IAU nennt als Beispiel Hamal, den hellsten Stern im Widder: Er heißt auch Alpha Arietis, „das Alpha des Widders“.",
          "Genauso ist Alpha Centauri zu lesen: das Alpha des Zentauren. Auf die Liste der 88 Sternbilder, die diese Namen geben, hat sich die IAU 1922 geeinigt, auf ihre Grenzen 1928.",
        ],
        task: "Sieh dir das Sternbild Zentaur an, die Heimat von Alpha Centauri.",
        remember: [
          "Ein Name wie Alpha Arietis heißt: das Alpha des Widders.",
          "Nach dem griechischen Buchstaben kommt das Sternbild in der lateinischen Form „des …“.",
          "Die IAU hat sich 1922 auf die 88 Sternbilder geeinigt.",
        ],
        you: (name, gen) => `Bei deiner Geburt stand die Sonne im Sternbild ${name}. Auf Latein heißen seine Sterne Alpha ${gen}, Beta ${gen} und so weiter.`,
        ref: (name, gen) => `Am 1. April steht die Sonne im Sternbild ${name}. Auf Latein heißen seine Sterne Alpha ${gen}, Beta ${gen} und so weiter.`,
      },
      nameCatalog: {
        title: "Kataloge und Teleskope", goal: "Du weißt, was HD, GJ, HIP, TOI, Kepler und TRAPPIST in einem Namen bedeuten.",
        text: [
          "Die meisten Sterne haben keinen eigenen Namen, sondern eine Nummer in einem Katalog. Laut NASA steht vorne im Namen eines Planeten meist das Teleskop oder die Himmelsdurchmusterung, die ihn gefunden hat, oder der Katalog seines Sterns. HD steht für den Henry-Draper-Katalog, GJ für den Katalog naher Sterne von Wilhelm Gliese und Hartmut Jahreiß, HIP für den Katalog des ESA-Satelliten Hipparcos.",
          "Kepler steht für das Weltraumteleskop Kepler der NASA (2009 bis 2018), TOI für „TESS Objects of Interest“, die Kandidaten des NASA-Satelliten TESS. TRAPPIST ist ein kleines Teleskop in Chile: Es gab dem System TRAPPIST-1 seinen Namen.",
        ],
        task: "Sieh dir TRAPPIST-1 an, benannt nach einem Teleskop.",
        remember: [
          "Vorne im Namen steht meist ein Katalog, ein Teleskop oder eine Durchmusterung.",
          "HD ist der Henry-Draper-Katalog, GJ der Katalog naher Sterne von Gliese und Jahreiß.",
          "TOI sind die Kandidaten des Satelliten TESS, TRAPPIST ist ein Teleskop in Chile.",
        ],
        cat: {
          HD: "HD steht für den Henry-Draper-Katalog.", GJ: "GJ (oder Gl, Gliese) steht für den Katalog naher Sterne von Gliese und Jahreiß.",
          HIP: "HIP steht für den Katalog des Satelliten Hipparcos.", TOI: "TOI steht für die Kandidaten des Satelliten TESS.",
          Kepler: "Kepler steht für das Weltraumteleskop Kepler.", TRAPPIST: "TRAPPIST ist ein Teleskop in Chile.",
          other: "Sein Name kommt aus einem anderen Katalog, oder es ist ein eigener Name.",
        },
        you: (star, what) => `Dein Stern heißt ${star}. ${what}`,
        ref: (star, what) => `Ein Beispiel: ${star}. ${what}`,
      },
      nameStories: {
        title: "Namen mit Geschichte", goal: "Du weißt, woher Eigennamen im All kommen und wer sie vergibt.",
        text: [
          "Die Planeten unseres Sonnensystems tragen alte Namen. Laut NASA ist jeder Planet außer der Erde nach einem römischen Gott oder einer römischen Göttin benannt. Mars zum Beispiel ist der römische Kriegsgott.",
          "Auch Exoplaneten können eigene Namen bekommen. In einem öffentlichen Wettbewerb der IAU bekam 51 Pegasi b, der erste Riesenplanet um einen sonnenähnlichen Stern (1995), den Namen Dimidium, sein Stern den Namen Helvetios. Solche Namen ersetzen die wissenschaftlichen Bezeichnungen nicht. Und Sternnamen kann man nicht kaufen: Die IAU verkauft keine Namen und distanziert sich von solchen Angeboten.",
        ],
        task: "Sieh dir 51 Pegasi b an, den Planeten mit dem Namen Dimidium.",
        remember: [
          "Laut NASA ist jeder Planet außer der Erde nach einem römischen Gott oder einer Göttin benannt.",
          "51 Pegasi b heißt auch Dimidium, sein Stern Helvetios.",
          "Die IAU verkauft keine Sternnamen.",
        ],
        you: (before, at) => (before != null ? `51 Pegasi b wurde 1995 gefunden, ${before} Jahre vor deiner Geburt.` : at === "0" ? "51 Pegasi b wurde 1995 gefunden, im Jahr deiner Geburt." : `51 Pegasi b wurde 1995 gefunden, als du ${at} Jahre alt warst.`),
        ref: (ago) => `51 Pegasi b wurde 1995 gefunden, vor ${ago} Jahren.`,
      },
      zodWhat: {
        title: "Was ist ein Sternbild?", goal: "Du weißt, was ein Sternbild ist und warum seine Sterne nicht zusammengehören.",
        text: [
          "Ein Sternbild ist eine Gruppe von Sternen, die am Himmel eine Form zu zeigen scheint und einen Namen bekommen hat. Laut NASA gibt es heute 88 offiziell anerkannte Sternbilder.",
          "Die Sterne eines Sternbilds hängen nicht zusammen: Manche sind nah, andere sehr weit weg. Im Stier zum Beispiel liegen die Sterne der Figur laut den Hipparcos-Daten dieser Karte zwischen 46 und 484 Lichtjahren von uns entfernt. Nur von der Erde aus sehen sie aus wie ein Bild.",
        ],
        task: "Sieh dir dein Sternbild an (ohne Geburtsdatum ein Beispiel) und dreh es zur Seite: Dann fällt die Figur auseinander.",
        remember: [
          "Ein Sternbild ist eine Gruppe von Sternen mit einer Form und einem Namen.",
          "Es gibt 88 offiziell anerkannte Sternbilder.",
          "Die Sterne eines Sternbilds sind verschieden weit weg und gehören nicht zusammen.",
        ],
        you: (name, near, far) => (near == null ? `Bei deiner Geburt stand die Sonne im Sternbild ${name}.` : `Bei deiner Geburt stand die Sonne im Sternbild ${name}. Seine Sterne sehen nah beieinander aus, aber der nächste ist ${near} Lichtjahre entfernt${far ? `, der fernste ${far}` : ""}.`),
        ref: (name, near, far) => (near == null ? `Am 1. April steht die Sonne im Sternbild ${name}.` : `Am 1. April steht die Sonne im Sternbild ${name}. Seine Sterne sehen nah beieinander aus, aber der nächste ist ${near} Lichtjahre entfernt${far ? `, der fernste ${far}` : ""}.`),
      },
      zodPath: {
        title: "Der Weg der Sonne", goal: "Du weißt, durch welche Sternbilder die Sonne im Jahr zieht, und kennst das dreizehnte.",
        text: [
          "Die Erde läuft in einem Jahr einmal um die Sonne. Von hier aus sieht es so aus, als wandere die Sonne vor den Sternen entlang, durch die Sternbilder des Tierkreises. Darum sieht man nachts je nach Jahreszeit andere Sternbilder: Was gerade hinter der Sonne steht, bleibt unsichtbar.",
          "Nach den Grenzen der Internationalen Astronomischen Union (IAU), die auch diese Karte verwendet, zieht die Sonne durch 13 Sternbilder, nicht durch 12. Das dreizehnte ist der Schlangenträger: Die Sonne steht etwa vom 30. November bis zum 17. Dezember vor seinen Sternen. Die Astrologie hat ihn nicht.",
        ],
        task: "Sieh dir den Schlangenträger an, das dreizehnte Sternbild auf dem Weg der Sonne.",
        remember: [
          "Die Sonne zieht im Jahr vor 13 Sternbildern entlang, nicht vor 12.",
          "Das dreizehnte ist der Schlangenträger, etwa vom 30. November bis zum 17. Dezember.",
          "Welche Sternbilder man nachts sieht, hängt von der Jahreszeit ab.",
        ],
        you: (n) => `Seit deiner Geburt ist die Sonne etwa ${n}-mal durch den Schlangenträger gezogen, einmal in jedem Jahr.`,
        ref: (n) => `In 30 Jahren zieht die Sonne ${n}-mal durch den Schlangenträger, einmal in jedem Jahr.`,
      },
      zodShift: {
        title: "Sternzeichen und Sternbild", goal: "Du weißt, warum dein Sternzeichen und das Sternbild hinter der Sonne meist nicht übereinstimmen.",
        text: [
          "Die Sternzeichen der Astrologie sind keine Sternbilder: Sie teilen den Weg der Sonne in zwölf gleich große Stücke von je 30 Grad, gezählt vom Frühlingsanfang. Die Sternbilder dagegen sind verschieden groß.",
          "Dazu taumelt die Erdachse langsam wie ein Kreisel. Ein Taumeln dauert laut NASA etwa 25.800 Jahre. Mit der Achse wandert der Frühlingsanfang an den Sternen entlang, und mit ihm wandern die Sternzeichen. Darum steht die Sonne an deinem Geburtstag meist vor einem anderen Sternbild, als dein Sternzeichen heißt.",
        ],
        task: "Sieh dir das Sternbild an, das so heißt wie dein Sternzeichen, und vergleiche es mit dem, in dem die Sonne wirklich stand.",
        remember: [
          "Ein Sternzeichen ist genau 30 Grad groß, ein Sternbild verschieden groß.",
          "Die Erdachse taumelt; ein Taumeln dauert etwa 25.800 Jahre.",
          "Darum stimmen Sternzeichen und Sternbild meist nicht überein.",
        ],
        you: (sign, real, same) => (same ? `Bei dir stimmen sie überein: Dein Sternzeichen ist ${sign}, und die Sonne stand bei deiner Geburt auch im Sternbild ${real}.` : `Dein Sternzeichen ist ${sign}. Bei deiner Geburt stand die Sonne aber vor den Sternen des Sternbilds ${real}.`),
        ref: (sign, real) => `Wer am 1. April geboren ist, hat das Sternzeichen ${sign}. Die Sonne steht an diesem Tag aber im Sternbild ${real}.`,
      },
      zodScience: {
        title: "Astronomie und Astrologie", goal: "Du kannst Astronomie und Astrologie auseinanderhalten.",
        text: [
          "Die Astronomie ist die Wissenschaft von allem im Weltraum. Sie folgt der wissenschaftlichen Methode: Belege und Daten entscheiden, und jede Aussage lässt sich prüfen.",
          "Die Astrologie ist etwas anderes. Sie beruht auf dem Glauben, dass die Stellung von Sternen und Planeten die Zukunft vorhersagen oder einen Menschen beschreiben kann. Für manche kulturelle Traditionen ist sie wichtig, aber ihre Aussagen beruhen laut NASA nicht auf wissenschaftlichen Belegen.",
        ],
        task: "Zu diesem Schritt gibt es keine Aufgabe in der 3D-Ansicht. Beantworte die Fragen, dann ist der Schritt geschafft.",
        remember: [
          "Astronomie ist eine Wissenschaft: Belege und Daten entscheiden.",
          "Astrologie ist ein Glaube; ihre Aussagen beruhen nicht auf wissenschaftlichen Belegen.",
          "Dass ein Sternzeichen etwas über einen Menschen sagt, ist wissenschaftlich nicht belegt.",
        ],
        you: (sign) => `Dass dein Sternzeichen ${sign} etwas über dich sagt, ist wissenschaftlich nicht belegt. Was es wirklich ist: ein Stück von 30 Grad auf dem Weg der Sonne.`,
        ref: (sign) => `Dass ein Sternzeichen wie ${sign} etwas über einen Menschen sagt, ist wissenschaftlich nicht belegt. Was es wirklich ist: ein Stück von 30 Grad auf dem Weg der Sonne.`,
      },
      zodLight: {
        title: "Das Licht deines Sternbilds", goal: "Du weißt, dass du die Sterne so siehst, wie sie vor vielen Jahren waren.",
        text: [
          "Ein Lichtjahr ist die Strecke, die das Licht in einem Jahr zurücklegt. Ist ein Stern 46 Lichtjahre entfernt, war sein Licht 46 Jahre zu uns unterwegs: Wir sehen ihn, wie er vor 46 Jahren war.",
          "In einem Sternbild ist dieses Licht verschieden alt. Im Stier kommt das Licht des nächsten Sterns der Figur nach 46 Jahren an, das des fernsten nach fast 500 Jahren. Ein Blick auf ein Sternbild ist ein Blick in viele verschiedene Zeiten.",
        ],
        task: "Sieh dir dein Sternbild von der Seite an: Jeder Stern darin zeigt dir eine andere Zeit.",
        remember: [
          "Ein Lichtjahr ist eine Strecke: wie weit das Licht in einem Jahr kommt.",
          "Wir sehen einen Stern so, wie er war, als sein Licht losflog.",
          "Das Licht der Sterne eines Sternbilds ist verschieden alt.",
        ],
        you: (name, ly, before, at) => (ly == null ? `Das Licht der Sterne im Sternbild ${name}, in dem die Sonne bei deiner Geburt stand, ist verschieden alt.` : before != null ? `Das Licht des nächsten Sterns im Sternbild ${name} ist ${ly} Jahre unterwegs: Es flog ${before} Jahre vor deiner Geburt los.` : at === "0" ? `Das Licht des nächsten Sterns im Sternbild ${name} ist ${ly} Jahre unterwegs: Es flog im Jahr deiner Geburt los.` : `Das Licht des nächsten Sterns im Sternbild ${name} ist ${ly} Jahre unterwegs: Es flog los, als du ${at} Jahre alt warst.`),
        ref: (name, ly) => (ly == null ? `Am 1. April steht die Sonne im Sternbild ${name}; das Licht seiner Sterne ist verschieden alt.` : `Am 1. April steht die Sonne im Sternbild ${name}. Das Licht seines nächsten Sterns ist ${ly} Jahre zu uns unterwegs.`),
      },
      habWhat: {
        title: "Was heißt bewohnbar?", goal: "Du kannst die bewohnbare Zone erklären und warum flüssiges Wasser so wichtig ist.",
        text: [
          "Die NASA definiert die bewohnbare Zone als den Abstand zu einem Stern, in dem auf der Oberfläche umlaufender Planeten flüssiges Wasser existieren könnte. Flüssiges Wasser ist für Leben, wie wir es kennen, unverzichtbar.",
          "Aber die Zone ist nur eine erste Auswahl, wie die NASA sagt. Ein Planet braucht auch die passende Größe, eine passende Atmosphäre und einen ruhigen Stern, der ihn nicht mit Ausbrüchen sterilisiert.",
        ],
        task: "Flieg zur Erde, dem einzigen Planeten, den wir mit Leben kennen.",
        remember: [
          "Die bewohnbare Zone: die Abstände zu einem Stern, in denen auf der Oberfläche eines Planeten flüssiges Wasser existieren könnte.",
          "Flüssiges Wasser ist für Leben, wie wir es kennen, unverzichtbar.",
          "Die Zone ist nur eine erste Auswahl: Größe, Atmosphäre und ein ruhiger Stern zählen auch.",
        ],
        you: (n) => `Seit deiner Geburt hat dich die Erde ${n}-mal um die Sonne getragen, die ganze Zeit innerhalb ihrer bewohnbaren Zone.`,
        ref: (n) => `In 30 Jahren trägt die Erde einen Menschen ${n}-mal um die Sonne, die ganze Zeit innerhalb ihrer bewohnbaren Zone.`,
      },
      habZone: {
        title: "Die bewohnbare Zone", goal: "Du weißt, warum die bewohnbare Zone von Stern zu Stern verschieden ist.",
        text: [
          "Die bewohnbare Zone hängt vom Stern ab. Um heißere Sterne ist sie breiter, um Rote Zwerge ist sie schmal und liegt sehr nah am Stern.",
          "TOI-700 d zum Beispiel läuft in nur 37,4 Tagen um einen kleinen M-Stern und liegt in dessen bewohnbarer Zone. In der 3D-Ansicht zeigt ein grüner Ring die bewohnbare Zone eines Systems.",
        ],
        task: "Flieg zu TOI-700 d und sieh dir den grünen Ring seiner bewohnbaren Zone an.",
        remember: [
          "Um heißere Sterne ist die bewohnbare Zone breiter.",
          "Um Rote Zwerge ist sie schmal und liegt sehr nah am Stern.",
          "TOI-700 d läuft in 37,4 Tagen um seinen kleinen Stern.",
        ],
        you: (n) => `Auf TOI-700 d wärst du ${n} Jahre alt: Ein Jahr dauert dort 37,4 Tage.`,
        ref: (n) => `Ein 30-jähriger Mensch wäre auf TOI-700 d ${n} Jahre alt: Ein Jahr dauert dort 37,4 Tage.`,
      },
      habWater: {
        title: "Flüssiges Wasser", goal: "Du weißt, warum man nach Wasser sucht und wo es in unserem eigenen Sonnensystem Ozeane geben könnte.",
        text: [
          "Wasser ist für alles Leben auf der Erde unverzichtbar; bis zu 60 % des Körpers eines Erwachsenen sind Wasser. Darum ist die Suche nach Leben zuerst eine Suche nach flüssigem Wasser.",
          "Ozeane können sich auch unter Eis verbergen: Es gibt starke Hinweise, dass der Jupitermond Europa einen Salzwasserozean hat, und der Saturnmond Enceladus hat innen einen weltweiten Ozean, mit Fontänen, die Wasserdampf und Eisteilchen ins All schleudern.",
        ],
        task: "Flieg zum Jupiter und klicke auf seinen Mond Europa.",
        remember: [
          "Wasser ist für alles Leben auf der Erde unverzichtbar; bis zu 60 % des Körpers eines Erwachsenen sind Wasser.",
          "Es gibt starke Hinweise auf einen Salzwasserozean im Jupitermond Europa.",
          "Der Saturnmond Enceladus hat einen weltweiten Ozean und Fontänen aus Wasserdampf und Eis.",
        ],
        you: (n) => `Seit deiner Geburt ist Europa, der Mond mit dem Ozean, ${n}-mal um Jupiter gelaufen.`,
        ref: (n) => `In 30 Jahren läuft Europa, der Mond mit dem Ozean, ${n}-mal um Jupiter.`,
      },
      habAtmos: {
        title: "Atmosphären", goal: "Du kannst erklären, warum die Luft eines Planeten darüber entscheidet, ob Wasser flüssig bleiben kann.",
        text: [
          "Die Venus zeigt, wie viel die Luft ausmacht: Ihre dichte Atmosphäre, vor allem aus Kohlendioxid, hält die Wärme in einem sich selbst verstärkenden Treibhauseffekt fest, und die Oberfläche ist etwa 467 °C heiß.",
          "Der Mars zeigt das andere Extrem: Seine Atmosphäre ist zu dünn, als dass flüssiges Wasser dort lange bestehen könnte. Die Erde liegt dazwischen, und das ist ein Grund, warum Wasser hier flüssig bleibt.",
        ],
        task: "Flieg zur Venus, dem Planeten mit zu viel Luft.",
        remember: [
          "Venus: Eine dichte Atmosphäre aus Kohlendioxid hält die Wärme fest; die Oberfläche ist etwa 467 °C heiß.",
          "Mars: Die Atmosphäre ist zu dünn, als dass flüssiges Wasser lange bestehen könnte.",
          "Die Luft eines Planeten entscheidet, ob Wasser flüssig bleiben kann.",
        ],
        you: (n) => `Auf der Venus wärst du ${n} Jahre alt, auf einer Welt, deren Luft die Hitze festhält.`,
        ref: (n) => `Ein 30-jähriger Mensch wäre auf der Venus ${n} Jahre alt, auf einer Welt, deren Luft die Hitze festhält.`,
      },
      habIngredients: {
        title: "Die Zutaten für Leben", goal: "Du weißt, was Leben, wie wir es kennen, braucht, und was der Rover Curiosity auf dem Mars fand.",
        text: [
          "Leben, wie wir es kennen, braucht flüssiges Wasser, chemische Bausteine und eine Energiequelle. Die NASA nennt flüssiges Wasser eine unverzichtbare Zutat für Leben, wie wir es kennen.",
          "2018 fand der Rover Curiosity im Gale-Krater auf dem Mars organische Moleküle in drei Milliarden Jahre altem Gestein, dem Boden eines früheren Sees. Laut NASA hielt dieser See alle Zutaten für Leben bereit, chemische Bausteine und Energiequellen. Aber organische Moleküle können auch ohne Leben entstehen: Sie sind kein Beweis dafür.",
        ],
        task: "Flieg zum Mars, wo Curiosity die organischen Moleküle fand.",
        remember: [
          "Leben, wie wir es kennen, braucht flüssiges Wasser, chemische Bausteine und Energie.",
          "Curiosity fand 2018 auf dem Mars organische Moleküle in drei Milliarden Jahre altem Gestein.",
          "Organische Moleküle sind kein Beweis für Leben: Sie können auch ohne Leben entstehen.",
        ],
        you: (n) => `Das Gestein, in dem Curiosity die Moleküle fand, ist etwa drei Milliarden Jahre alt: rund ${n}-mal so alt wie du.`,
        ref: (n) => `Das Gestein, in dem Curiosity die Moleküle fand, ist etwa drei Milliarden Jahre alt: rund ${n}-mal so alt wie ein Mensch von 30.`,
      },
      habExtreme: {
        title: "Extremes Leben auf der Erde", goal: "Du kennst Lebewesen, die dort leben, wo wir es nicht könnten.",
        text: [
          "Lebewesen, die an den Grenzen des Bewohnbaren leben, bei extremen Temperaturen, Säure oder Strahlung, heißen Extremophile. 2026 berichtete die NASA von einer Amöbe aus heißen Quellen in Kalifornien, die sich noch bei 63 °C teilt: ein Rekord für alle bekannten Lebewesen mit Zellkern.",
          "Am Meeresboden strömt an Hydrothermalquellen über 400 °C heißes Wasser aus. Die Lebensgemeinschaften dort leben laut NOAA vor allem von Chemosynthese: Bakterien gewinnen Energie aus chemischen Reaktionen, meist ohne Sonnenlicht. Riesenröhrenwürmer wachsen dort schneller als alle anderen wirbellosen Meerestiere der Erde.",
        ],
        task: "Flieg zum Jupitermond Europa: Unter seinem Eis vermutet man einen Ozean. Ob es darin Leben gibt, weiß niemand.",
        remember: [
          "Extremophile leben bei extremen Temperaturen, Säure oder Strahlung.",
          "Eine Amöbe aus heißen Quellen teilt sich noch bei 63 °C.",
          "An Tiefseequellen leben ganze Lebensgemeinschaften ohne Sonnenlicht, von Chemosynthese.",
        ],
        you: () => "Wasser mit 63 °C wäre für dich viel zu heiß zum Baden. Die Amöbe teilt sich darin noch.",
        ref: () => "Wasser mit 63 °C wäre für jeden Menschen viel zu heiß zum Baden. Die Amöbe teilt sich darin noch.",
      },
      habLife: {
        title: "Gibt es Leben da draußen?", goal: "Du weißt, wie die Forschung nach Leben sucht und dass die Antwort noch offen ist.",
        text: [
          "Bisher kennen wir Leben nur auf der Erde. Hier gedeiht es sogar an superheißen Quellen am Meeresboden, und das macht Hoffnung, dass es auch an seltsamen Orten anderswo existieren könnte.",
          "Das James-Webb-Weltraumteleskop könnte erste Blicke auf die Gase in der Luft erdgroßer Exoplaneten werfen. Sauerstoff, Kohlendioxid und Methan zusammen wären ein starker Hinweis auf mögliches Leben. Ob wir es finden, ist eine offene Frage.",
        ],
        task: "Flieg zu Proxima b, dem nächsten Kandidaten der Karte.",
        remember: [
          "Bisher kennen wir Leben nur auf der Erde.",
          "Leben auf der Erde lebt sogar an superheißen Quellen am Meeresboden.",
          "Gase in der Luft eines Exoplaneten (Sauerstoff, Kohlendioxid und Methan zusammen) könnten auf Leben hinweisen: eine offene Frage.",
        ],
        you: (at, now, year) => `${year}, im Jahr deiner Geburt, kannte diese Karte ${at} Kandidaten in einer bewohnbaren Zone; heute kennt sie ${now}.`,
        ref: (at, now, year) => `${year}, als ein heute 30-jähriger Mensch geboren wurde, kannte diese Karte ${at} Kandidaten in einer bewohnbaren Zone; heute kennt sie ${now}.`,
      },
    },
    q: {
      sunLight: { q: "Wie lange braucht Sonnenlicht bis zur Erde?", o: ["Etwa 8 Minuten", "Etwa 8 Sekunden", "Etwa 8 Stunden"], e: "Etwa 8 Minuten und 20 Sekunden: Die Sonne ist 150 Millionen Kilometer entfernt, und Licht legt etwa 300.000 Kilometer pro Sekunde zurück." },
      sunEnergy: { q: "Woher kommt die Energie der Sonne?", o: ["Wasserstoff verschmilzt in ihrem Kern zu Helium", "Sie verbrennt Kohle und Gas", "Vom Licht anderer Sterne"], e: "Im Kern der Sonne verschmelzen Wasserstoffkerne zu Helium. Das ist Kernfusion; dabei wird die Energie frei, die leuchtet." },
      sunOrbits: { you: "Wie oft hat dich die Erde seit deiner Geburt um die Sonne getragen?", ref: "Wie oft hat die Erde einen 30-jährigen Menschen um die Sonne getragen?", e: (n) => `${n}-mal: Die Erde läuft einmal im Jahr um die Sonne, und du reist mit.` },
      venusDay: { q: "Auf welchem Planeten dauert ein Tag länger als ein Jahr?", o: ["Venus", "Merkur", "Mars"], e: "Venus dreht sich sehr langsam: Eine Drehung dauert länger als ein Umlauf um die Sonne." },
      marsAge: { you: "Wie alt wärst du auf dem Mars?", ref: "Wie alt wäre ein 30-jähriger Mensch auf dem Mars?", e: (n) => `${n}: Ein Jahr auf dem Mars dauert 1,88 Erdjahre, dort gibt es also seltener Geburtstage.` },
      closest: { q: "Welcher Planet ist der Sonne am nächsten?", o: ["Merkur", "Venus", "Erde"], e: "Merkur, in 0,39 AE Abstand. Er läuft in 88 Tagen um die Sonne." },
      largest: { q: "Welcher ist der größte Planet?", o: ["Jupiter", "Saturn", "Neptun"], e: "Jupiter: Etwa 11 Erden passen quer nebeneinander hinein." },
      saturnDensity: { q: "Welcher Planet hat eine geringere Dichte als Wasser?", o: ["Saturn", "Jupiter", "Uranus"], e: "Saturn: Seine mittlere Dichte ist geringer als die von Wasser." },
      jupiterLaps: { you: "Wie oft ist Jupiter seit deiner Geburt um die Sonne gelaufen?", ref: "Wie oft läuft Jupiter in 30 Jahren um die Sonne?", e: (n) => `${n}-mal: Ein Jupiterjahr dauert fast 12 Erdjahre.` },
      largestMoon: { q: "Welcher ist der größte Mond des Sonnensystems?", o: ["Ganymed", "Unser Mond", "Europa"], e: "Ganymed, ein Mond des Jupiter: Er ist sogar größer als der Planet Merkur." },
      galileo: { q: "Wer entdeckte 1610 die vier großen Jupitermonde?", o: ["Galileo Galilei", "Isaac Newton", "Johannes Kepler"], e: "Galileo Galilei, mit einem der ersten Fernrohre. Man nennt sie die Galileischen Monde." },
      sameSide: { q: "Warum sehen wir vom Mond immer dieselbe Seite?", o: ["Er dreht sich bei jedem Umlauf genau einmal", "Er dreht sich gar nicht", "Die andere Seite ist immer dunkel"], e: "Der Mond dreht sich bei jedem Umlauf um die Erde einmal um sich selbst, darum ist uns immer dieselbe Seite zugewandt. Auch die Rückseite bekommt Sonnenlicht." },
      dwarf: { q: "Welcher dieser Himmelskörper ist ein Zwergplanet?", o: ["Pluto", "Mars", "Neptun"], e: "Pluto. Seit 2006 gilt er als Zwergplanet, wie Ceres im Asteroidengürtel." },
      moonLaps: { you: "Wie oft hat der Mond die Erde seit deiner Geburt etwa umrundet?", ref: "Wie oft umrundet der Mond die Erde in 30 Jahren etwa?", e: (n) => `Etwa ${n}-mal: Ein Umlauf dauert 27,3 Tage.` },
      neptune: { q: "Wie weit ist Neptun etwa von der Sonne entfernt?", o: ["30 AE", "3 AE", "300 AE"], e: "Etwa 30 AE, 30-mal so weit wie die Erde. Das Licht der Sonne braucht etwa 4 Stunden bis dorthin." },
      starLight: { you: (name) => `Wie viele Jahre war das Licht deines Sterns, ${name}, bis zu dir unterwegs?`, e: (n, name) => `Etwa ${n} Jahre: ${name} ist etwa ${n} Lichtjahre entfernt, und ein Lichtjahr ist die Strecke, die das Licht in einem Jahr zurücklegt.` },
      proximaLight: { q: "Wie lange braucht das Licht von Proxima Centauri, dem nächsten Stern nach der Sonne, bis zu uns?", o: ["Etwa 4,2 Jahre", "Etwa 4,2 Tage", "Etwa 42 Jahre"], e: "Etwa 4,2 Jahre: Proxima Centauri ist 4,24 Lichtjahre entfernt." },
      sunSize: { q: "Wie viele Erden passen etwa quer nebeneinander in die Sonne?", o: ["Etwa 109", "Etwa 11", "Etwa 1.000"], e: "Etwa 109: Der Radius der Sonne ist etwa 109-mal so groß wie der der Erde." },
      asteroidBelt: { q: "Wo laufen die meisten Asteroiden um die Sonne?", o: ["Zwischen Mars und Jupiter", "Zwischen Erde und Mars", "Zwischen Saturn und Uranus"], e: "Im Asteroidengürtel zwischen Mars und Jupiter. Sein größtes Objekt, Ceres, ist ein Zwergplanet." },
      cometTail: { q: "In welche Richtung zeigt der Schweif eines Kometen?", o: ["Von der Sonne weg", "Zur Sonne hin", "Immer zur Erde"], e: "Von der Sonne weg: Sonnenlicht und Sonnenwind blasen Staub und Gas der Koma von ihr fort." },
      nearestStar: { q: "Welcher ist nach der Sonne der nächste Stern?", o: ["Proxima Centauri", "Sirius", "Polarstern"], e: "Proxima Centauri, etwa 4,2 Lichtjahre entfernt." },
      lightYear: { q: "Was ist ein Lichtjahr?", o: ["Eine Strecke: wie weit das Licht in einem Jahr kommt", "Eine Zeit: ein Jahr im Weltraum", "Das Alter eines Sterns"], e: "Eine Strecke. Das Licht legt in einem Jahr fast 9,5 Billionen Kilometer zurück." },
      pairPeriod: { q: "Wie lange brauchen Alpha Centauri A und B für eine Runde umeinander?", o: ["Etwa 80 Jahre", "Etwa 80 Tage", "Etwa 8.000 Jahre"], e: "Etwa 80 Jahre. Am nächsten kommen sie sich auf etwa den 11-fachen Abstand von Erde und Sonne." },
      pairSun: { q: "Welcher Stern ist von derselben Art wie unsere Sonne?", o: ["Alpha Centauri A", "Alpha Centauri B", "Proxima Centauri"], e: "Alpha Centauri A, Typ G2 wie die Sonne, und etwas größer." },
      constellation: { q: "In welchem Sternbild liegt Alpha Centauri?", o: ["Zentaur", "Orion", "Großer Bär"], e: "Im Zentaur." },
      redDwarf: { q: "Was für ein Stern ist Proxima Centauri?", o: ["Ein Roter Zwerg", "Ein Roter Riese", "Ein Stern wie die Sonne"], e: "Ein Roter Zwerg: klein, kühl und viel lichtschwächer als die Sonne." },
      proximaEye: { q: "Kann man Proxima Centauri mit bloßem Auge sehen?", o: ["Nein, er ist zu schwach", "Ja, er ist der hellste Stern am Himmel", "Nur am Tag"], e: "Nein: Obwohl er der nächste Stern ist, ist er für das bloße Auge zu schwach." },
      thirdStar: { q: "Wie viele Sterne hat das System Alpha Centauri?", o: ["Drei", "Zwei", "Einen"], e: "Drei: Alpha Centauri A und B und Proxima Centauri, den schwächsten." },
      proximaBYear: { q: "Wie lange dauert ein Jahr auf Proxima b?", o: ["Etwa 11 Tage", "Etwa 11 Monate", "Etwa 11 Jahre"], e: "Etwa 11,2 Tage: So schnell läuft er um seinen Stern." },
      habitable: { q: "Was bedeutet „in der bewohnbaren Zone“?", o: ["Dort könnte unter den richtigen Bedingungen flüssiges Wasser sein", "Dort wurde Leben gefunden", "Der Planet hat sicher Luft"], e: "Nur, dass die Temperatur flüssiges Wasser erlauben könnte. Ob Proxima b Luft, Wasser oder Leben hat, ist unbekannt." },
      howFound: { q: "Wie wurde Proxima b gefunden?", o: ["Am winzigen Wackeln seines Sterns", "Auf einem Foto des Planeten", "Durch ein Funksignal"], e: "An winzigen Verschiebungen im Licht des Sterns, der wackelt, weil der Planet an ihm zieht." },
      voyagerSpeed: { q: "Wie schnell entfernt sich Voyager 1 etwa von der Sonne?", o: ["Etwa 17 km pro Sekunde", "Etwa 17 km pro Stunde", "Etwa 17.000 km pro Sekunde"], e: "Etwa 17 Kilometer pro Sekunde, mehr als 61.000 Kilometer pro Stunde." },
      travelTime: { q: "Wie lange bräuchte Voyager 1 etwa bis Proxima Centauri?", o: ["Etwa 75.000 Jahre", "Etwa 750 Jahre", "Etwa 7,5 Millionen Jahre"], e: "Etwa 75.000 Jahre: 4,2 Lichtjahre mit 17 Kilometern pro Sekunde." },
      proximaLeft: { you: "Wie alt warst du, als das Licht von Proxima losflog, das heute bei dir ankommt?", ref: "Wie alt war ein heute 30-jähriger Mensch, als das Licht von Proxima losflog, das jetzt bei uns ankommt?", e: (n) => `${n}: Das Licht ist vor etwa 4,2 Jahren losgeflogen.` },
      lightTrips: { you: "Wie oft hätte das Licht in deinem bisherigen Leben den Weg von Proxima zu uns zurücklegen können?", ref: "Wie oft kann das Licht in 30 Jahren den Weg von Proxima zu uns zurücklegen?", e: (n) => `${n}-mal: Es braucht für den Weg etwa 4,2 Jahre.` },
      proximaBAge: { you: "Wie alt wärst du auf Proxima b?", ref: "Wie alt wäre ein 30-jähriger Mensch auf Proxima b?", e: (n) => `${n}: Ein Jahr auf Proxima b dauert nur 11,2 Tage.` },
      lifetimes: { you: "Wie oft so lang wie dein bisheriges Leben würde die Reise mit dem Tempo von Voyager 1 dauern?", ref: "Wie oft so lang wie das Leben eines 30-jährigen Menschen würde die Reise mit dem Tempo von Voyager 1 dauern?", e: (n) => `Etwa ${n}-mal: Die Reise würde etwa 75.000 Jahre dauern.` },
      exoDefinition: { q: "Was ist ein Exoplanet?", o: ["Ein Planet außerhalb unseres Sonnensystems", "Ein Mond eines großen Planeten", "Ein Stern ohne Licht"], e: "Ein Planet außerhalb unseres Sonnensystems; meist kreist er um einen anderen Stern." },
      firstSunLike: { q: "In welchem Jahr wurde der erste Planet um einen Stern wie die Sonne gefunden?", o: ["1995", "1965", "2015"], e: "1995: 51 Pegasi b. Seine Entdecker erhielten 2019 den Nobelpreis für Physik." },
      firstPulsar: { q: "Um was für ein Objekt wurden 1992 die ersten Exoplaneten gefunden?", o: ["Einen Pulsar", "Einen Stern wie die Sonne", "Ein Schwarzes Loch"], e: "Einen Pulsar. Drei Jahre später kam 51 Pegasi b, der erste um einen Stern wie die Sonne." },
      transitDim: { q: "Was misst die Transitmethode?", o: ["Wie ein Stern leicht dunkler wird, wenn ein Planet vor ihm vorbeizieht", "Das Licht des Planeten selbst", "Funksignale des Planeten"], e: "Wie der Stern leicht dunkler wird, während der Planet vor ihm vorbeizieht." },
      wobble: { q: "Wonach sucht die Radialgeschwindigkeitsmethode?", o: ["Nach dem Wackeln des Sterns, an dem sein Planet zieht", "Nach einem Schatten auf der Erde", "Nach den Monden des Planeten"], e: "Nach dem Wackeln des Sterns: Sein Licht verschiebt sich ein wenig ins Blaue und ins Rote." },
      mostMethod: { q: "Mit welcher Methode wurden die meisten bekannten Exoplaneten gefunden?", o: ["Transit", "Radialgeschwindigkeit", "Fotos"], e: "Transit: in dieser Karte 4.770 der 6.423 Planeten." },
      superEarth: { q: "Was ist eine Supererde?", o: ["Ein Planet mit mehr Masse als die Erde, aber weniger als Neptun", "Ein Planet mit superheißem Kern", "Jeder Planet, der größer ist als Jupiter"], e: "Mehr Masse als die Erde, weniger als Neptun; sie kann aus Gas, Gestein oder beidem bestehen." },
      terrestrialMade: { q: "Woraus bestehen Gesteinsplaneten?", o: ["Aus Gestein, Silikaten, Wasser oder Kohlenstoff", "Vor allem aus Wasserstoff und Helium", "Nur aus Eis"], e: "Aus Gestein, Silikaten, Wasser oder Kohlenstoff; sie sind so groß wie die Erde oder kleiner." },
      trappistSeven: { q: "Wie viele erdgroße Planeten kreisen um TRAPPIST-1?", o: ["Sieben", "Zwei", "Zwölf"], e: "Sieben, um einen kleinen Roten Zwerg etwa 40 Lichtjahre entfernt." },
      hotJupiter: { q: "Was ist ein heißer Jupiter?", o: ["Ein Gasriese sehr nah an seinem Stern", "Ein Jupiter mit Vulkanen", "Ein Stern, der wie Jupiter aussieht"], e: "Ein Gasriese sehr nah an seinem Stern, wie 51 Pegasi b." },
      pegYear: { q: "Wie lange dauert ein Jahr auf 51 Pegasi b?", o: ["Etwa 4 Tage", "Etwa 4 Jahre", "Etwa 40 Jahre"], e: "Etwa 4,2 Tage." },
      gasGiantSize: { q: "Wie groß sind Gasriesen?", o: ["So groß wie Saturn oder Jupiter oder noch viel größer", "So groß wie die Erde", "So groß wie der Mond"], e: "So groß wie Saturn oder Jupiter oder noch viel größer." },
      lavaWorld: { q: "Was bedeckt 55 Cancri e laut NASA?", o: ["Ein weltweiter Ozean aus Lava", "Eine dicke Eisschicht", "Wälder"], e: "Ein weltweiter Ozean aus Lava: Es ist eine superheiße Welt." },
      rogue: { q: "Kreisen alle Exoplaneten um einen Stern?", o: ["Nein, manche wandern ohne Sonne durch die Galaxie", "Ja, alle", "Keiner von ihnen"], e: "Nein: Meist kreisen sie um einen Stern, aber manche wandern ohne Sonne in ewiger Dunkelheit." },
      keplerScope: { q: "Welches Weltraumteleskop fand Tausende Exoplaneten mit der Transitmethode?", o: ["Kepler", "Hubble", "Voyager"], e: "Das Kepler-Teleskop der NASA." },
      knownAtBirth: { you: "Wie viele Planeten dieses Katalogs waren bis zu deinem Geburtsjahr entdeckt?", ref: "Wie viele Planeten dieses Katalogs waren bis zum Geburtsjahr eines heute 30-jährigen Menschen entdeckt?", e: (n) => `${n}: Der Katalog wächst jedes Jahr.` },
      transitSince: { you: "Wie viele Planeten dieses Katalogs wurden seit deinem Geburtsjahr mit der Transitmethode gefunden?", ref: "Wie viele Planeten dieses Katalogs wurden in den letzten 30 Jahren mit der Transitmethode gefunden?", e: (n) => `${n}: viele davon mit dem Kepler-Teleskop.` },
      trappistAge: { you: "Wie alt wärst du auf TRAPPIST-1 e?", ref: "Wie alt wäre ein 30-jähriger Mensch auf TRAPPIST-1 e?", e: (n) => `${n}: Ein Jahr auf TRAPPIST-1 e dauert 6,1 Tage.` },
      pegAge: { you: "Wie alt wärst du auf 51 Pegasi b?", ref: "Wie alt wäre ein 30-jähriger Mensch auf 51 Pegasi b?", e: (n) => `${n}: Ein Jahr auf 51 Pegasi b dauert 4,2 Tage.` },
      cancriAge: { you: "Wie viele Geburtstage hättest du auf 55 Cancri e schon gefeiert?", ref: "Wie viele Geburtstage hätte ein 30-jähriger Mensch auf 55 Cancri e schon gefeiert?", e: (n) => `${n}: Ein Jahr auf 55 Cancri e dauert weniger als 18 Stunden.` },
      hzDef: { q: "Was ist die bewohnbare Zone?", o: ["Die Abstände zu einem Stern, in denen auf einer Planetenoberfläche flüssiges Wasser existieren könnte", "Der Teil eines Planeten, in dem Menschen wohnen", "Der Bereich um ein Schwarzes Loch"], e: "Die Abstände zu einem Stern, in denen auf der Oberfläche eines Planeten flüssiges Wasser existieren könnte, so definiert es die NASA." },
      waterNeed: { q: "Warum sucht die Forschung zuerst nach flüssigem Wasser?", o: ["Es ist für Leben, wie wir es kennen, unverzichtbar", "Es lässt Planeten leuchten", "Es hält Planeten auf ihren Bahnen"], e: "Flüssiges Wasser ist für Leben, wie wir es kennen, unverzichtbar." },
      firstCut: { q: "Ist jeder Planet in der bewohnbaren Zone bewohnbar?", o: ["Nein, die Zone ist nur eine erste Auswahl", "Ja, immer", "Nur wenn er Monde hat"], e: "Nein: Größe, Atmosphäre und ein ruhiger Stern zählen auch." },
      zoneHot: { q: "Um welche Sterne ist die bewohnbare Zone breiter?", o: ["Um heißere Sterne", "Um kühlere Sterne", "Sie ist bei allen Sternen gleich"], e: "Um heißere Sterne." },
      redDwarfZone: { q: "Wo liegt die bewohnbare Zone eines Roten Zwergs?", o: ["Schmal und sehr nah am Stern", "Weit weg vom Stern", "Ein Roter Zwerg hat keine"], e: "Schmal und sehr nah am Stern: Seine Planeten laufen in Tagen oder Wochen um ihn." },
      toiYear: { q: "Wie lange dauert ein Jahr auf TOI-700 d?", o: ["Etwa 37 Tage", "Etwa 37 Jahre", "Etwa 37 Stunden"], e: "Etwa 37,4 Tage." },
      europaOcean: { q: "Wofür gibt es unter der Oberfläche von Europa starke Hinweise?", o: ["Einen Salzwasserozean", "Ein Meer aus Lava", "Einen gefrorenen Wald"], e: "Einen Salzwasserozean." },
      enceladusJets: { q: "Was schleudern die Fontänen von Enceladus ins All?", o: ["Wasserdampf und Eisteilchen", "Lava", "Sand"], e: "Wasserdampf und Eisteilchen, aus seinem Ozean im Inneren." },
      bodyWater: { q: "Wie viel des Körpers eines Erwachsenen ist laut USGS Wasser?", o: ["Bis zu 60 %", "Etwa 10 %", "Über 95 %"], e: "Bis zu 60 %." },
      venusGreenhouse: { q: "Warum ist die Venus so heiß?", o: ["Ihre dichte Luft aus Kohlendioxid hält die Wärme fest", "Sie ist der Sonne am nächsten", "Sie hat überall Vulkane"], e: "Ihre dichte Atmosphäre hält die Wärme in einem sich selbst verstärkenden Treibhauseffekt fest; Merkur ist näher an der Sonne, aber nicht so heiß." },
      marsThin: { q: "Warum kann flüssiges Wasser auf dem Mars heute nicht lange bestehen?", o: ["Seine Atmosphäre ist zu dünn", "Er hat gar kein Wasser", "Er ist zu nah an der Sonne"], e: "Seine Atmosphäre ist zu dünn, als dass flüssiges Wasser dort lange bestehen könnte." },
      venusTemp: { q: "Wie heiß ist die Oberfläche der Venus etwa?", o: ["Etwa 467 °C", "Etwa 46 °C", "Etwa -46 °C"], e: "Etwa 467 °C." },
      onlyEarth: { q: "Wo kennen wir bisher Leben?", o: ["Nur auf der Erde", "Auf dem Mars", "Auf Proxima b"], e: "Bisher nur auf der Erde." },
      vents: { q: "Wo gedeiht Leben auf der Erde an superheißen Quellen?", o: ["Am Meeresboden", "Auf Berggipfeln", "In den Wolken"], e: "Am Meeresboden: ein Hinweis, dass Leben auch an seltsamen Orten anderswo existieren könnte." },
      biosignature: { q: "Welches Teleskop könnte erste Blicke auf die Gase in der Luft erdgroßer Exoplaneten werfen?", o: ["Das James-Webb-Weltraumteleskop", "Voyager 1", "Galileis Fernrohr"], e: "Das James-Webb-Weltraumteleskop, gestartet 2021." },
      trappistFit: { q: "Wo hätten laut NASA alle sieben Planeten von TRAPPIST-1 Platz?", o: ["Innerhalb der Bahn des Merkur", "Innerhalb der Bahn des Jupiter", "Erst jenseits des Neptun"], e: "Innerhalb der Bahn des Merkur: Sie kreisen sehr eng um ihren kleinen Stern." },
      kepler90Eight: { q: "Wie viele Planeten kennt man um Kepler-90?", o: ["Acht, so viele wie in unserem Sonnensystem", "Zwei", "Fünfzig"], e: "Acht, so viele wie in unserem Sonnensystem." },
      kepler90AI: { q: "Wie wurde 2017 der achte Planet von Kepler-90 gefunden?", o: ["Ein neuronales Netz von Google durchsuchte die Kepler-Daten", "Mit bloßem Auge", "Eine Raumsonde flog hin"], e: "Ein künstliches neuronales Netz von Google durchsuchte die Daten des Kepler-Teleskops." },
      hdBlue: { q: "Welche Farbe hat HD 189733 b laut NASA?", o: ["Kobaltblau", "Feuerrot", "Grasgrün"], e: "Kobaltblau: Sein dunstiger Himmel hat Wolken, die Glas enthalten." },
      kepler16Suns: { q: "Was ist besonders an Kepler-16 b?", o: ["Er umkreist zwei Sterne", "Er hat keinen Stern", "Er besteht aus Diamant"], e: "Er umkreist zwei Sterne zugleich, wie Tatooine in Star Wars." },
      kepler16Saturn: { q: "Welchem Planeten unseres Sonnensystems ähnelt Kepler-16 b in Größe und Masse?", o: ["Saturn", "Erde", "Merkur"], e: "Saturn." },
      lifeNeeds: { q: "Was hielt der alte See im Gale-Krater auf dem Mars laut NASA bereit?", o: ["Alle Zutaten für Leben: chemische Bausteine und Energiequellen", "Lebende Fische", "Nur Eis"], e: "Alle Zutaten für Leben; ob es dort Leben gab, weiß man nicht." },
      marsOrganics: { q: "Was fand Curiosity 2018 in drei Milliarden Jahre altem Gestein?", o: ["Organische Moleküle", "Fossile Knochen", "Gold"], e: "Organische Moleküle, im Tonstein eines alten Sees." },
      organicNotLife: { q: "Sind organische Moleküle ein Beweis für Leben?", o: ["Nein, sie können auch ohne Leben entstehen", "Ja, immer", "Nur auf dem Mars"], e: "Nein: Man verbindet sie oft mit Leben, aber sie können auch ohne Leben entstehen." },
      extremophile: { q: "Wie heißen Lebewesen, die an den Grenzen des Bewohnbaren leben?", o: ["Extremophile", "Exoplaneten", "Asteroiden"], e: "Extremophile: Sie halten extreme Temperaturen, Säure oder Strahlung aus." },
      fireAmoeba: { q: "Bis zu welcher Temperatur teilt sich die Amöbe aus den heißen Quellen Kaliforniens noch?", o: ["63 °C", "6 °C", "630 °C"], e: "63 °C, ein Rekord für alle bekannten Lebewesen mit Zellkern." },
      chemosynthesis: { q: "Woher nehmen die Lebensgemeinschaften an Tiefseequellen ihre Energie?", o: ["Aus chemischen Reaktionen, meist ohne Sonnenlicht", "Aus dem Sonnenlicht", "Aus dem Mondlicht"], e: "Aus Chemosynthese: Bakterien gewinnen Energie aus chemischen Reaktionen." },
      tubeWorms: { q: "Welche Tiere an Tiefseequellen wachsen schneller als alle anderen wirbellosen Meerestiere?", o: ["Riesenröhrenwürmer", "Quallen", "Seesterne"], e: "Riesenröhrenwürmer." },
      trappistBLaps: { you: "Etwa wie oft ist TRAPPIST-1 b seit deiner Geburt um seinen Stern gelaufen?", ref: "Etwa wie oft läuft TRAPPIST-1 b in 30 Jahren um seinen Stern?", e: (n) => `Etwa ${n}-mal: Ein Jahr dort dauert 1,5 Tage.` },
      kepler16Age: { you: "Wie alt wärst du auf Kepler-16 b?", ref: "Wie alt wäre ein Mensch von 30 auf Kepler-16 b?", e: (n) => `${n}: Ein Jahr auf Kepler-16 b dauert 229 Tage.` },
      rockFactor: { you: "Etwa wie viele Male so alt wie du ist das Gestein, in dem Curiosity organische Moleküle fand?", ref: "Etwa wie viele Male so alt wie ein Mensch von 30 ist das Gestein, in dem Curiosity organische Moleküle fand?", e: (n) => `Etwa ${n}-mal: Es ist rund drei Milliarden Jahre alt.` },
      nebulaWhat: { q: "Was ist ein Nebel laut NASA?", o: ["Eine riesige Wolke aus Staub und Gas im All", "Ein Planet voller Nebel", "Ein kleiner Stern"], e: "Eine riesige Wolke aus Staub und Gas im All." },
      nebulaDeath: { q: "Woher stammen manche Nebel?", o: ["Aus Gas und Staub eines explodierenden sterbenden Sterns", "Aus den Meeren von Planeten", "Vom Mond"], e: "Aus dem Gas und Staub, den die Explosion eines sterbenden Sterns hinausschleudert, etwa eine Supernova." },
      nebulaBirth: { q: "Was passiert in anderen Nebeln?", o: ["Neue Sterne beginnen zu entstehen", "Planeten sterben", "Gar nichts"], e: "Neue Sterne beginnen zu entstehen." },
      pillarsWhere: { q: "Wo stehen die Säulen der Schöpfung?", o: ["Im Adlernebel in der Schlange", "Auf dem Mars", "In der Andromedagalaxie"], e: "Im Adlernebel (M16) im Sternbild Schlange." },
      pillarsDist: { q: "Wie weit ist der Adlernebel entfernt?", o: ["6.500 (ESA) oder 7.000 (NASA) Lichtjahre", "65 Lichtjahre", "6,5 Millionen Lichtjahre"], e: "6.500 Lichtjahre laut ESA, 7.000 laut NASA: Die Seiten stimmen nicht überein." },
      pillarsWebb: { q: "Welches Teleskop zeigte die Säulen 2022 in einem neuen Bild?", o: ["Webb", "Galileis Fernrohr", "TRAPPIST"], e: "Das Weltraumteleskop Webb, am 19. Oktober 2022." },
      horseType: { q: "Was für ein Nebel ist der Pferdekopfnebel?", o: ["Ein Dunkelnebel", "Ein planetarischer Nebel", "Der Überrest einer Supernova"], e: "Ein Dunkelnebel: eine dunkle Wolke aus Staub und Gas." },
      horseWhere: { q: "In welchem Sternbild liegt der Pferdekopfnebel?", o: ["Orion", "Stier", "Leier"], e: "Im Orion." },
      horseDist: { q: "Wie weit ist der Pferdekopfnebel laut ESA/Hubble entfernt?", o: ["Etwa 1.300 Lichtjahre", "Etwa 13 Lichtjahre", "Etwa 13 Millionen Lichtjahre"], e: "Etwa 1.300 Lichtjahre." },
      ringType: { q: "Was für ein Nebel ist der Ringnebel?", o: ["Ein planetarischer Nebel", "Ein Dunkelnebel", "Eine Kinderstube der Sterne"], e: "Ein planetarischer Nebel." },
      ringWhere: { q: "In welchem Sternbild liegt der Ringnebel?", o: ["Leier", "Orion", "Andromeda"], e: "In der Leier, etwa 2.000 Lichtjahre entfernt." },
      ringFrom: { q: "Woher kommt ein planetarischer Nebel?", o: ["Von den abgestoßenen Schichten eines sterbenden Sterns wie der Sonne", "Von einem explodierten Planeten", "Von einem Schwarzen Loch"], e: "Von den äußeren Schichten, die ein sterbender Stern wie die Sonne abstößt." },
      crabType: { q: "Was ist der Krebsnebel?", o: ["Der Überrest einer Supernova", "Eine Kinderstube der Sterne", "Eine Galaxie"], e: "Der Überrest einer Supernova, im Stier." },
      crabYear: { q: "Wann sahen chinesische Astronomen die Supernova des Krebsnebels?", o: ["1054", "1954", "54 vor Christus"], e: "1054, als „Gaststern“." },
      crabCore: { q: "Was sitzt in der Mitte des Krebsnebels?", o: ["Ein schnell rotierender Neutronenstern, ein Pulsar", "Ein Planet", "Nichts"], e: "Ein schnell rotierender Neutronenstern, ein Pulsar." },
      mwShape: { q: "Welche Form hat die Milchstraße?", o: ["Eine Balkenspirale", "Eine Kugel", "Ein Ring"], e: "Eine Balkenspirale: eine Scheibe mit Spiralarmen und einem Balken aus Sternen in der Mitte." },
      mwSize: { q: "Wie groß ist die Milchstraße?", o: ["Mehr als 100.000 Lichtjahre", "Etwa 100 Lichtjahre", "Etwa 100 Millionen km"], e: "Mehr als 100.000 Lichtjahre." },
      mwStars: { q: "Wie viele Sterne hat die Milchstraße laut ESA?", o: ["Mehr als 100 Milliarden", "Etwa 8", "Etwa 100.000"], e: "Mehr als hundert Milliarden." },
      orionArm: { q: "Nahe welchem Arm der Milchstraße liegt die Sonne?", o: ["Dem Orionarm", "Dem Andromedaarm", "Dem Arm des Mondes"], e: "Nahe dem Orionarm, einem kleinen, unvollständigen Arm." },
      armBetween: { q: "Zwischen welchen Armen liegt der Orionarm?", o: ["Dem Schütze- und dem Perseusarm", "Stier und Leier", "Es gibt keine anderen Arme"], e: "Zwischen dem Schütze- und dem Perseusarm." },
      centerDist: { q: "Wie weit ist das Zentrum der Milchstraße von uns entfernt?", o: ["Etwa 26.000 bis 27.000 Lichtjahre", "Etwa 4 Lichtjahre", "Etwa 2,5 Millionen Lichtjahre"], e: "Etwa 26.000 (NASA, 8 kpc) bis 27.000 (ESO) Lichtjahre." },
      lapTime: { q: "Wie lange dauert eine Runde der Sonne um die Mitte?", o: ["Etwa 230 bis 240 Millionen Jahre", "Ein Jahr", "Etwa 4,6 Milliarden Jahre"], e: "Etwa 230 Millionen (NASA-Seite zur Sonne) oder 240 Millionen Jahre (NASA-Seite zu Galaxien, ESA)." },
      sunSpeed: { q: "Wie schnell reist die Sonne laut NASA um die Mitte?", o: ["Etwa 720.000 km/h", "Etwa 72 km/h", "Mit Lichtgeschwindigkeit"], e: "Im Mittel mit etwa 720.000 km/h." },
      lapDiffer: { q: "Was sagen die Seiten von NASA und ESA zur Dauer einer Runde?", o: ["Sie stimmen nicht überein: 230 oder 240 Millionen Jahre", "Alle sagen genau 230 Millionen", "Sie nennen keine Zahl"], e: "Sie stimmen nicht überein: 230 Millionen auf einer Seite, 240 Millionen auf anderen." },
      bandWhat: { q: "Was ist das Lichtband am Nachthimmel?", o: ["Die Scheibe unserer Galaxie", "Eine Wolke der Erde", "Das Licht des Mondes"], e: "Die zentrale Scheibe unserer Heimatgalaxie." },
      bandEdge: { q: "Von wo sehen wir die Scheibe der Milchstraße?", o: ["Von innen, von der Kante", "Von oben", "Von außerhalb der Galaxie"], e: "Von innen, von der Kante: Die Sonne liegt in der Scheibe." },
      bandDir: { q: "In welcher Richtung liegt das Zentrum der Milchstraße?", o: ["In Richtung Schütze", "In Richtung Andromeda", "In Richtung Polarstern"], e: "In Richtung des Sternbilds Schütze." },
      gaiaWhat: { q: "Was hat Gaia von der ESA gemacht?", o: ["Eine genaue 3D-Karte der Milchstraße", "Das erste Bild eines Schwarzen Lochs", "Eine Landung auf dem Mars"], e: "Eine genaue dreidimensionale Karte der Milchstraße." },
      gaiaCount: { q: "Wie viele Quellen enthält Gaia DR3 (2022)?", o: ["Etwa 1,8 Milliarden", "Etwa 1.800", "Etwa 18"], e: "1.811.709.771, etwa 1,8 Milliarden." },
      gaiaEnd: { q: "Wann beendete Gaia seine wissenschaftlichen Beobachtungen?", o: ["Am 15. Januar 2025", "1990", "Es beobachtet noch"], e: "Am 15. Januar 2025." },
      localGroup: { q: "Was ist die Lokale Gruppe?", o: ["Die Gruppe von Galaxien, zu der die Milchstraße gehört", "Die Planeten der Sonne", "Die Sterne eines Sternbilds"], e: "Die Gruppe von Galaxien, zu der die Milchstraße gehört." },
      groupCount: { q: "Wie viele Galaxien hat die Lokale Gruppe laut NASA?", o: ["Über 50", "Genau 3", "Etwa eine Million"], e: "Über 50." },
      m33Third: { q: "Welche ist die drittgrößte Galaxie der Lokalen Gruppe?", o: ["Die Dreiecksgalaxie (M33)", "Die Kleine Magellansche Wolke", "M87"], e: "Die Dreiecksgalaxie (M33), etwa 3 Millionen Lichtjahre entfernt." },
      lmcSat: { q: "Was ist die Große Magellansche Wolke?", o: ["Eine Satellitengalaxie der Milchstraße", "Ein Nebel im Orion", "Eine Wolke auf der Erde"], e: "Eine Satellitengalaxie der Milchstraße." },
      smcDist: { q: "Wie weit ist die Kleine Magellansche Wolke laut ESA/Hubble entfernt?", o: ["200.000 Lichtjahre", "200 Lichtjahre", "200 Millionen Lichtjahre"], e: "200.000 Lichtjahre." },
      smcWhere: { q: "In welchem Sternbild liegt die Kleine Magellansche Wolke?", o: ["Tukan", "Andromeda", "Orion"], e: "Im Tukan." },
      andDist: { q: "Wie weit ist die Andromedagalaxie laut NASA entfernt?", o: ["2,5 Millionen Lichtjahre", "2.500 Lichtjahre", "25 Milliarden Lichtjahre"], e: "2,5 Millionen Lichtjahre." },
      andEye: { q: "Kann man die Andromedagalaxie ohne Teleskop sehen?", o: ["Ja, an einem dunklen Ort mit bloßem Auge", "Nein, nie", "Nur vom Mond aus"], e: "Ja: An einem dunklen Ort sieht man sie leicht mit bloßem Auge." },
      andWhere: { q: "Welche ist die größte Galaxie der Lokalen Gruppe?", o: ["Die Andromedagalaxie", "Die Milchstraße", "Die Kleine Magellansche Wolke"], e: "Die Andromedagalaxie." },
      andSpeed: { q: "Wie schnell kommt Andromeda laut NASA auf uns zu?", o: ["Etwa 250.000 Meilen (400.000 km) pro Stunde", "Etwa 25 km pro Stunde", "Sie entfernt sich"], e: "Etwa 250.000 Meilen pro Stunde, rund 400.000 km pro Stunde." },
      collide2012: { q: "Was sagte die NASA 2012 voraus?", o: ["Einen Frontalzusammenstoß in etwa 4 Milliarden Jahren", "Einen Zusammenstoß im nächsten Jahr", "Nie einen Zusammenstoß"], e: "Einen Frontalzusammenstoß in etwa vier Milliarden Jahren." },
      merge2012: { q: "Wann würden die beiden Galaxien nach der Vorhersage von 2012 zu einer verschmelzen?", o: ["In etwa 6 Milliarden Jahren", "In etwa 6.000 Jahren", "Nie"], e: "In etwa 6 Milliarden Jahren." },
      chance2025: { q: "Welche Chance für einen Zusammenstoß in 10 Milliarden Jahren fand die Studie von 2025?", o: ["Nur 50 zu 50", "100 %", "0 %"], e: "Nur 50 zu 50." },
      dataNew: { q: "Welche Daten nutzte die Studie von 2025?", o: ["Von Hubble und Gaia der ESA", "Nur alte Zeichnungen", "Von einer Sonde auf Andromeda"], e: "Daten von Hubble und Gaia der ESA." },
      scienceChange: { q: "Was zeigt die neue Studie über die Wissenschaft?", o: ["Vorhersagen können sich mit besseren Daten ändern", "Vorhersagen ändern sich nie", "Wissenschaft ist Raten"], e: "Eine Vorhersage gilt, solange die Daten sie tragen; bessere Daten können sie ändern." },
      nsForm: { q: "Wie entsteht laut NASA ein Neutronenstern?", o: ["Einem massereichen Stern geht der Brennstoff aus und er stürzt zusammen", "Zwei Planeten stoßen zusammen", "Ein Komet gefriert"], e: "Einem massereichen Stern geht der Brennstoff aus, und er stürzt zusammen." },
      nsSize: { q: "Wie groß ist ein Neutronenstern etwa im Durchmesser?", o: ["Etwa 20 km", "Etwa so groß wie die Sonne", "Etwa 20 m"], e: "Etwa 20 Kilometer, mit mehr Masse als die Sonne." },
      nsSugar: { q: "Wie schwer wäre laut NASA ein Würfelzucker Neutronenstern-Material?", o: ["Etwa 1 Billion Kilogramm", "Etwa ein Gramm", "Etwa eine Tonne"], e: "Etwa 1 Billion Kilogramm." },
      pulsarWhat: { q: "Was ist ein Pulsar?", o: ["Ein sich drehender Neutronenstern, der Strahlungspulse aussendet", "Ein blinkender Planet", "Ein junger Stern"], e: "Ein sich drehender Neutronenstern, der Strahlungspulse aussendet." },
      lighthouse: { q: "Womit kann man einen Pulsar laut NASA vergleichen?", o: ["Mit einem Leuchtturm", "Mit einer Kerze", "Mit einem Spiegel"], e: "Mit einem Leuchtturm: Sein Strahl streicht immer wieder an uns vorbei." },
      pulseTime: { q: "Wie viel Zeit liegt meist zwischen den Pulsen eines Pulsars?", o: ["Millisekunden bis Sekunden", "Jahre", "Jahrhunderte"], e: "Meist Millisekunden bis Sekunden." },
      noLight: { q: "Was kann einem Schwarzen Loch entkommen?", o: ["Nichts, nicht einmal Licht", "Nur Licht", "Alles, was schnell genug ist"], e: "Nichts, nicht einmal Licht." },
      noVacuum: { q: "Saugen Schwarze Löcher laut NASA alles um sich herum an?", o: ["Nein, sie saugen keine andere Materie an", "Ja, wie ein Staubsauger", "Nur Planeten"], e: "Nein: Schwarze Löcher saugen keine andere Materie an." },
      sunSwap: { q: "Würde man die Sonne durch ein Schwarzes Loch gleicher Masse ersetzen, was täten die Planeten?", o: ["Sie blieben auf ihren Bahnen", "Sie fielen sofort hinein", "Sie flögen davon"], e: "Sie blieben auf ihren Bahnen." },
      smbh: { q: "Wie schwer sind supermassereiche Schwarze Löcher laut NASA?", o: ["Hunderttausend- bis milliardenfach die Sonne", "So schwer wie die Erde", "So schwer wie der Mond"], e: "Das Hunderttausend- bis Milliardenfache der Sonnenmasse." },
      sgrMass: { q: "Wie massereich ist Sagittarius A* laut ESO?", o: ["Viermillionenmal die Sonne", "So massereich wie die Sonne", "Viermal die Sonne"], e: "Viermillionenmal massereicher als die Sonne." },
      sgrDist: { q: "Wie weit ist Sagittarius A* laut ESO entfernt?", o: ["Etwa 27.000 Lichtjahre", "Etwa 27 Lichtjahre", "Etwa 27 Millionen Lichtjahre"], e: "Etwa 27.000 Lichtjahre, in Richtung Schütze." },
      firstImage: { q: "Wann wurde das erste Bild eines Schwarzen Lochs gezeigt?", o: ["Am 10. April 2019", "1969", "2001"], e: "Am 10. April 2019: das Schwarze Loch in M87." },
      m87Dist: { q: "Wie weit ist das Schwarze Loch in M87 laut ESO entfernt?", o: ["55 Millionen Lichtjahre", "55 Lichtjahre", "55 Milliarden Lichtjahre"], e: "55 Millionen Lichtjahre." },
      sgrImage: { q: "Wann wurde das erste Bild von Sagittarius A* gezeigt?", o: ["Am 12. Mai 2022", "Am 10. April 2019", "1995"], e: "Am 12. Mai 2022." },
      mainSequence: { q: "Was macht ein Stern auf der Hauptreihe?", o: ["Er verschmilzt gleichmäßig Wasserstoff zu Helium", "Er explodiert", "Er kühlt langsam ab"], e: "Er verschmilzt in seinem Kern gleichmäßig Wasserstoff zu Helium." },
      longestPhase: { q: "Welches ist die längste Phase im Leben eines Sterns?", o: ["Die Hauptreihe", "Der Rote Riese", "Die Supernova"], e: "Die Hauptreihe." },
      sunMidway: { q: "Wo steht die Sonne in ihrem Leben?", o: ["Etwa in der Mitte ihrer Hauptreihe", "Ganz am Ende", "Gerade geboren"], e: "Etwa in der Mitte ihrer rund 10 Milliarden Jahre auf der Hauptreihe." },
      massFuel: { q: "Welcher Stern verbraucht seinen Brennstoff schneller?", o: ["Der massereichere", "Der leichtere", "Beide gleich"], e: "Der massereichere." },
      massiveShort: { q: "Wie lange leben die schwersten Sterne?", o: ["Nur wenige Millionen Jahre", "Billionen Jahre", "Ewig"], e: "Nur wenige Millionen Jahre." },
      lowMassLong: { q: "Wie lange können manche massearme Sterne laut NASA leuchten?", o: ["Billionen Jahre", "Ein paar tausend Jahre", "Ein paar Tage"], e: "Billionen Jahre." },
      noHydrogen: { q: "Was passiert, wenn dem Kern eines Sterns der Wasserstoff ausgeht?", o: ["Der Kern stürzt ein und der Stern bläht sich auf", "Der Stern erlischt sofort", "Nichts ändert sich"], e: "Der Kern beginnt einzustürzen, und der Stern bläht sich langsam auf." },
      redGiant: { q: "Was wird ein Stern wie die Sonne nach der Hauptreihe?", o: ["Ein Roter Riese", "Ein Schwarzes Loch", "Ein Planet"], e: "Ein Roter Riese." },
      giantWhen: { q: "Wann wird die Sonne laut NASA ein Roter Riese?", o: ["In etwa 5 Milliarden Jahren", "In etwa 5.000 Jahren", "Im nächsten Jahrhundert"], e: "In etwa 5 Milliarden Jahren." },
      whiteDwarf: { q: "Was ist ein Weißer Zwerg?", o: ["Der übrige Kern eines Sterns, meist so groß wie die Erde", "Ein kleiner weißer Planet", "Ein junger Stern"], e: "Der Kern, der bleibt, wenn ein Roter Riese seine Hülle abgestoßen hat, meist so groß wie die Erde." },
      teaspoon: { q: "Wie schwer wäre laut NASA ein Teelöffel Material eines Weißen Zwergs?", o: ["Schwerer als ein Pick-up", "So schwer wie Zucker", "Leichter als Luft"], e: "Schwerer als ein Pick-up." },
      planetaryNebula: { q: "Was bilden die Schichten, die ein sterbender sonnenähnlicher Stern abstößt?", o: ["Einen planetarischen Nebel", "Sofort neue Planeten", "Ein Schwarzes Loch"], e: "Eine wachsende Wolke aus Staub und Gas, einen planetarischen Nebel." },
      supernova: { q: "Was ist eine Supernova?", o: ["Die Explosion eines Sterns", "Die Geburt eines neuen Sterns", "Ein heller Planet"], e: "Die Explosion eines Sterns." },
      novaMass: { q: "Welche Sterne enden laut NASA in einer Supernova?", o: ["Sterne mit mehr als etwa der achtfachen Sonnenmasse", "Jeder Stern", "Nur rote Zwerge"], e: "Sterne mit mehr als etwa der achtfachen Sonnenmasse; eine andere NASA-Seite sagt sieben." },
      stardust: { q: "Wo sind laut NASA die Elemente unseres Körpers entstanden?", o: ["In den Kernen von Sternen", "Auf dem Mond", "In den Meeren der Erde"], e: "In den Kernen von Sternen; Supernovae haben sie verstreut." },
      molecularCloud: { q: "Wo entstehen Sterne laut NASA?", o: ["In großen Wolken aus Gas und Staub, den Molekülwolken", "Im Inneren von Planeten", "In den Ringen des Saturn"], e: "In großen, kalten Wolken aus Gas und Staub, den Molekülwolken." },
      clumpCollapse: { q: "Was bringt Klumpen in einer Molekülwolke zum Einstürzen?", o: ["Die Schwerkraft", "Wind von der Erde", "Licht vom Mond"], e: "Die Schwerkraft." },
      orionNursery: { q: "Was ist der Orionnebel?", o: ["Das nächste große Sternentstehungsgebiet, etwa 1.500 Lichtjahre entfernt", "Ein Planet des Sonnensystems", "Ein Schwarzes Loch"], e: "Das nächste große Sternentstehungsgebiet bei der Erde, etwa 1.500 Lichtjahre entfernt." },
      protostar: { q: "Was ist ein Protostern?", o: ["Ein Sternenbaby", "Ein toter Stern", "Ein Planet ohne Stern"], e: "Ein Sternenbaby, bevor in seinem Kern die Kernfusion beginnt." },
      protoHeat: { q: "Warum heizt sich ein einstürzender Klumpen auf?", o: ["Reibung heizt das Material auf", "Die Sonne scheint darauf", "Er brennt wie Holz"], e: "Reibung heizt das Material auf." },
      auMicAge: { q: "Wie alt ist AU Mic laut NASA?", o: ["20 bis 30 Millionen Jahre", "4,6 Milliarden Jahre", "300 Jahre"], e: "20 bis 30 Millionen Jahre: Die Sonne ist mindestens 150-mal älter." },
      diskYoung: { q: "Was umgibt einen jungen Stern?", o: ["Eine Scheibe aus Gas und Staub", "Eine harte Eisschale", "Nichts"], e: "Eine Scheibe aus Gas und Staub, die von seiner Geburt übrig ist." },
      planetsMerge: { q: "Wie wachsen Planeten in so einer Scheibe?", o: ["Teilchen aus Gestein und Eis stoßen zusammen und verschmelzen", "Der Stern spuckt sie aus", "Sie kommen aus anderen Galaxien"], e: "Feste Teilchen aus Gestein und Eis stoßen zusammen und verschmelzen." },
      pdsImage: { q: "Was zeigte die ESO 2018 bei PDS 70?", o: ["Das erste bestätigte Bild eines Planeten im Entstehen", "Einen neuen Stern im Sonnensystem", "Ein Schwarzes Loch"], e: "Das erste bestätigte Bild eines Planeten, der gerade in der Scheibe entsteht: PDS 70 b." },
      clusters: { q: "Wie werden Sterne laut NASA oft geboren?", o: ["In Gruppen, den Sternhaufen", "Immer allein", "In Planeten"], e: "In Gruppen: in Sternhaufen." },
      pleiades: { q: "Was sind die Plejaden?", o: ["Ein offener Sternhaufen im Stier", "Ein Planet", "Eine ferne Galaxie"], e: "Ein offener Sternhaufen im Stier." },
      pleiadesDist: { q: "Wie weit sind die Plejaden laut NASA entfernt?", o: ["Rund 445 Lichtjahre", "Rund 4 Lichtjahre", "Rund 4 Millionen Lichtjahre"], e: "Rund 445 Lichtjahre; die Zahl ist nicht allgemein anerkannt." },
      sunAge: { q: "Wann entstand die Sonne laut NASA?", o: ["Vor etwa 4,6 Milliarden Jahren", "Vor etwa 4.600 Jahren", "Vor etwa 46 Millionen Jahren"], e: "Vor etwa 4,6 Milliarden Jahren." },
      solarNebula: { q: "Wie heißt die Wolke, in der die Sonne entstand?", o: ["Der Sonnennebel", "Der Orionnebel", "Die Milchstraße"], e: "Der Sonnennebel, eine riesige, sich drehende Wolke aus Gas und Staub." },
      planetsLeft: { q: "Woraus entstanden die Planeten?", o: ["Aus einem Großteil des Materials, das von der Geburt der Sonne übrig war", "Aus Stücken des Mondes", "Aus anderen Sternen"], e: "Aus einem Großteil des übrigen Materials entstanden die Planeten, auch die Erde." },
      starGas: { q: "Was ist ein Stern laut NASA?", o: ["Eine riesige Kugel aus heißem Gas", "Ein großer leuchtender Felsen", "Ein Loch im Himmel"], e: "Eine riesige Kugel aus heißem Gas, von ihrer eigenen Schwerkraft zusammengehalten." },
      starFusion: { q: "Was passiert im Kern eines Sterns?", o: ["Wasserstoff verschmilzt zu Helium", "Eisen brennt wie Kohle", "Nichts, das Licht kommt von der Oberfläche"], e: "Wasserstoffkerne werden zu Helium zusammengepresst; das setzt die Energie seines Lichts frei." },
      starGravity: { q: "Was hält einen Stern zusammen?", o: ["Seine eigene Schwerkraft", "Eine harte Schale", "Das Magnetfeld der Erde"], e: "Seine eigene Schwerkraft." },
      colorTemp: { q: "Warum haben Sterne verschiedene Farben?", o: ["Weil sie verschieden heiß sind", "Wegen ihrer Namen", "Weil manche aus Glas sind"], e: "Weil sie verschieden heiß sind." },
      blueHot: { q: "Welche Sterne sind heißer?", o: ["Blaue und weiße", "Rote", "Orange"], e: "Blaue und weiße Sterne sind heißer, orange und rote kühler." },
      sunTemp: { q: "Wie heiß ist die Oberfläche der Sonne laut NASA?", o: ["Etwa 5.500 °C", "Etwa 55 °C", "Etwa 5,5 Millionen °C"], e: "Etwa 5.500 °C." },
      classOrder: { q: "Wie lautet die Reihenfolge der Sternklassen von heiß nach kühl?", o: ["O, B, A, F, G, K, M", "A, B, C, D, E, F, G", "M, K, G, F, A, B, O"], e: "O, B, A, F, G, K, M." },
      sunClass: { q: "Welche Klasse hat die Sonne?", o: ["G, ein gelber Zwerg", "M, ein roter Zwerg", "O, ein blauer Riese"], e: "G: ein gelber Zwerg." },
      mColor: { q: "Welche Farbe haben Sterne der Klasse M?", o: ["Rot", "Blau", "Weiß"], e: "Rot: M-Sterne sind die kühlsten." },
      commonStars: { q: "Welche Sterne sind in der Milchstraße am häufigsten?", o: ["Rote Zwerge", "Sterne wie die Sonne", "Blaue Riesen"], e: "Rote Zwerge, etwa drei Viertel aller Sterne." },
      sunLike: { q: "Wie viele Sterne der Milchstraße sind laut NASA etwa wie die Sonne?", o: ["Etwa 6 %", "Etwa 60 %", "Jeder zweite"], e: "Nur etwa 6 %." },
      proximaSize: { q: "Wie groß ist Proxima Centauri im Vergleich zur Sonne?", o: ["Etwa ein Siebtel ihres Radius", "Doppelt so groß", "Genau gleich groß"], e: "Etwa ein Siebtel: das 0,141-Fache des Sonnenradius." },
      orangeLife: { q: "Welche Sterne hält die NASA für besser für höheres Leben?", o: ["Orange Zwerge der Klasse K", "Blaue Riesen der Klasse O", "Gar keine"], e: "Orange Zwerge der Klasse K, etwas kühler als die Sonne." },
      redLong: { q: "Welche Sterne leben am längsten?", o: ["Rote Zwerge, mehr als 100 Milliarden Jahre", "Blaue Riesen", "Sterne wie die Sonne"], e: "Rote Zwerge: Die NASA nennt mehr als 100 Milliarden Jahre." },
      bakedDry: { q: "Was kann Planeten in der bewohnbaren Zone eines roten Zwergs passieren?", o: ["Sie können völlig austrocknen", "Sie werden zu Sternen", "Gar nichts"], e: "Sie können völlig austrocknen." },
      firstLetter: { q: "Wie heißt der erste gefundene Planet eines Sterns?", o: ["Name des Sterns mit b", "Name des Sterns mit a", "Name des Sterns mit 1"], e: "b: Der Stern selbst ist das ungenannte A." },
      sameTime: { q: "Mehrere Planeten eines Sterns werden zur gleichen Zeit gefunden. Welcher bekommt das b?", o: ["Der dem Stern am nächsten ist", "Der größte", "Der äußerste"], e: "Der Planet, der dem Stern am nächsten ist." },
      letterOrder: { q: "Wonach richten sich die Buchstaben b, c, d?", o: ["Nach der Reihenfolge der Entdeckung", "Nach der Größe der Planeten", "Nach ihrer Farbe"], e: "Nach der Reihenfolge der Entdeckung: Proxima d kreist näher als b, wurde aber später gefunden." },
      capitals: { q: "Was bekommt ein Stern in einem System mit mehreren Sternen?", o: ["Einen großen Buchstaben: A, B, C", "Einen kleinen Buchstaben: b, c, d", "Eine Farbe"], e: "Einen großen Buchstaben; Planeten bekommen kleine." },
      hostA: { q: "Welcher Buchstabe ist meist der Stern mit den Planeten, auch wenn er nicht dasteht?", o: ["A", "B", "Z"], e: "A: das ungenannte A des Systems." },
      starOrPlanet: { q: "Was ist Proxima Cen b?", o: ["Ein Planet", "Ein Stern", "Ein Sternbild"], e: "Ein Planet: Der kleine Buchstabe zeigt es." },
      alphaAries: { q: "Was bedeutet Alpha Arietis?", o: ["Das Alpha des Widders", "Der Widder des Alpha", "Der hellste Planet"], e: "Das Alpha des Widders; das Beispiel der IAU ist Hamal." },
      alphaCen: { q: "Zu welchem Sternbild gehört Alpha Centauri?", o: ["Zum Zentaur", "Zum Widder", "Zum Großen Bären"], e: "Zum Zentaur: Alpha Centauri ist das Alpha des Zentauren." },
      iau1922: { q: "Wann hat sich die IAU auf die Liste der 88 Sternbilder geeinigt?", o: ["1922", "1610", "1995"], e: "1922; ihre Grenzen folgten 1928." },
      hdMeaning: { q: "Wofür steht HD in einem Sternnamen?", o: ["Für den Henry-Draper-Katalog", "Für „High Definition“", "Für einen hellen Doppelstern"], e: "Für den Henry-Draper-Katalog." },
      toiMeaning: { q: "Wofür steht TOI?", o: ["TESS Objects of Interest, Kandidaten des Satelliten TESS", "Ein Sternbild", "Eine Sonde zum Mond"], e: "TESS Objects of Interest: Kandidaten des NASA-Satelliten TESS." },
      trappistWhat: { q: "Was ist TRAPPIST?", o: ["Ein kleines Teleskop in Chile", "Ein Stern im Zentaur", "Ein Planet des Sonnensystems"], e: "Ein kleines Teleskop in Chile; es gab TRAPPIST-1 seinen Namen." },
      gjMeaning: { q: "Was ist der GJ-Katalog?", o: ["Ein Katalog naher Sterne von Gliese und Jahreiß", "Ein Katalog von Galaxien", "Eine Liste der Jupitermonde"], e: "Ein Katalog naher Sterne von Wilhelm Gliese und Hartmut Jahreiß." },
      romanGods: { q: "Wonach ist laut NASA jeder Planet außer der Erde benannt?", o: ["Nach einem römischen Gott oder einer Göttin", "Nach seinem Entdecker", "Nach einem Sternbild"], e: "Nach einem römischen Gott oder einer Göttin; Mars ist der Kriegsgott." },
      dimidium: { q: "Welchen eigenen Namen hat 51 Pegasi b?", o: ["Dimidium", "Helvetios", "Proxima"], e: "Dimidium; sein Stern heißt Helvetios." },
      buyStar: { q: "Kann man bei der IAU einen Sternnamen kaufen?", o: ["Nein, die IAU verkauft keine Namen", "Ja, für jeden Stern", "Ja, aber nur für helle Sterne"], e: "Nein: Die IAU verkauft keine Namen und distanziert sich von solchen Angeboten." },
      notReplace: { q: "Ersetzt ein Name wie Dimidium die wissenschaftliche Bezeichnung?", o: ["Nein, beide gelten nebeneinander", "Ja, die alte wird gelöscht", "Nur in Europa"], e: "Nein: Solche Namen ersetzen die wissenschaftlichen Bezeichnungen nicht." },
      constCount: { q: "Wie viele offiziell anerkannte Sternbilder gibt es laut NASA?", o: ["88", "12", "1.000"], e: "88." },
      notConnected: { q: "Hängen die Sterne eines Sternbilds zusammen?", o: ["Nein, manche sind nah, andere sehr weit weg", "Ja, sie sind aneinander gebunden", "Ja, sie sind alle gleich weit weg"], e: "Nein: Sie sind nicht miteinander verbunden; manche sind nah, andere sehr weit weg." },
      constShape: { q: "Was ist ein Sternbild?", o: ["Eine Gruppe von Sternen, die eine Form zu zeigen scheint und einen Namen hat", "Ein Haufen von Sternen, die einander umkreisen", "Eine Galaxie"], e: "Eine Gruppe von Sternen, die am Himmel eine Form zu zeigen scheint und einen Namen bekommen hat." },
      thirteen: { q: "Durch wie viele Sternbilder zieht die Sonne im Jahr, nach den Grenzen der IAU?", o: ["13", "12", "88"], e: "13: die zwölf des Tierkreises und der Schlangenträger." },
      ophName: { q: "Durch welches Sternbild zieht die Sonne, obwohl es kein Sternzeichen ist?", o: ["Den Schlangenträger", "Den Großen Bären", "Den Orion"], e: "Den Schlangenträger, Ende November bis Mitte Dezember." },
      ophDates: { q: "Wann steht die Sonne etwa im Schlangenträger?", o: ["Ende November bis Mitte Dezember", "Im Juli", "Im März"], e: "Etwa vom 30. November bis zum 17. Dezember." },
      ophPasses: { you: "Wie oft ist die Sonne seit deiner Geburt durch den Schlangenträger gezogen?", ref: "Wie oft zieht die Sonne in 30 Jahren durch den Schlangenträger?", e: (n) => `Etwa ${n}-mal: einmal in jedem Jahr.` },
      wobble: { q: "Was ist die Präzession?", o: ["Das langsame Taumeln der Erdachse", "Der Umlauf des Mondes", "Ein Sternbild"], e: "Das langsame Taumeln der Erdachse, wie bei einem Kreisel." },
      wobbleTime: { q: "Wie lange dauert ein Taumeln der Erdachse laut NASA?", o: ["Etwa 25.800 Jahre", "Etwa 26 Jahre", "Etwa 2,6 Millionen Jahre"], e: "Etwa 25.800 Jahre." },
      signSize: { q: "Wie groß ist jedes Sternzeichen?", o: ["Ein Zwölftel des Weges der Sonne: 30 Grad", "So groß wie sein Sternbild", "Jedes verschieden groß, wie die Sternbilder"], e: "Jedes Sternzeichen ist genau 30 Grad groß; die Sternbilder sind verschieden groß." },
      astronomyMethod: { q: "Wie arbeitet die Astronomie?", o: ["Nach der wissenschaftlichen Methode, mit Belegen und Daten", "Mit Vorhersagen aus der Geburtsstunde", "Mit Glück"], e: "Nach der wissenschaftlichen Methode, mit Belegen und Daten." },
      astroEvidence: { q: "Beruhen die Aussagen der Astrologie auf wissenschaftlichen Belegen?", o: ["Nein", "Ja", "Nur bei den Sommerzeichen"], e: "Nein. Für manche kulturelle Traditionen ist sie wichtig, aber ihre Aussagen beruhen nicht auf wissenschaftlichen Belegen." },
      astroBelief: { q: "Worauf beruht die Astrologie?", o: ["Auf dem Glauben, dass Sterne und Planeten die Zukunft oder den Charakter zeigen", "Auf Messungen mit Teleskopen", "Auf den Grenzen der IAU"], e: "Auf dem Glauben, dass die Stellung von Sternen und Planeten die Zukunft vorhersagen oder einen Menschen beschreiben kann." },
      lightTravel: { q: "Ein Stern ist 46 Lichtjahre entfernt. Wie lange war sein Licht zu uns unterwegs?", o: ["46 Jahre", "46 Tage", "46 Minuten"], e: "46 Jahre: Ein Lichtjahr ist die Strecke, die das Licht in einem Jahr zurücklegt." },
      starsSpread: { q: "Wie weit sind die Sterne des Stiers laut dieser Karte von uns entfernt?", o: ["Zwischen 46 und 484 Lichtjahren", "Alle genau 100 Lichtjahre", "Weniger als ein Lichtjahr"], e: "Zwischen 46 und 484 Lichtjahren: Von der Seite gesehen fällt die Figur auseinander." },
      nightSky: { q: "Warum sieht man im Sommer andere Sternbilder als im Winter?", o: ["Weil die Erde in einem Jahr um die Sonne läuft", "Weil die Sterne wandern", "Weil die Sternbilder im Sommer schlafen"], e: "Weil die Erde einmal im Jahr um die Sonne läuft: Was hinter der Sonne steht, sieht man nachts nicht." },
      habOrbits: { you: "Wie oft hat dich die Erde innerhalb ihrer bewohnbaren Zone um die Sonne getragen?", ref: "Wie oft trägt die Erde einen Menschen in 30 Jahren um die Sonne?", e: (n) => `${n}-mal: einmal im Jahr, immer innerhalb der bewohnbaren Zone der Sonne.` },
      toiAge: { you: "Wie alt wärst du auf TOI-700 d?", ref: "Wie alt wäre ein 30-jähriger Mensch auf TOI-700 d?", e: (n) => `${n}: Ein Jahr auf TOI-700 d dauert 37,4 Tage.` },
      europaLaps: { you: "Wie oft ist Europa seit deiner Geburt um Jupiter gelaufen?", ref: "Wie oft läuft Europa in 30 Jahren um Jupiter?", e: (n) => `${n}-mal: Ein Umlauf dauert 3,55 Tage.` },
      venusAge: { you: "Wie alt wärst du auf der Venus?", ref: "Wie alt wäre ein 30-jähriger Mensch auf der Venus?", e: (n) => `${n}: Ein Jahr auf der Venus dauert 0,615 Erdjahre.` },
      candidatesAtBirth: { you: "Wie viele Kandidaten in einer bewohnbaren Zone kannte diese Karte in deinem Geburtsjahr?", ref: "Wie viele Kandidaten in einer bewohnbaren Zone kannte diese Karte im Geburtsjahr eines heute 30-jährigen Menschen?", e: (n) => `${n}: Die meisten wurden in den letzten Jahren gefunden.` },
    },
  },
  ja: {
    parts: { basics: "第1部　惑星科学の基礎", starLives: "第2部　恒星の一生", galaxy: "第3部　私たちの銀河", sky: "空を読む" },
    paths: {
      solar: { title: "私たちの太陽系", goal: "太陽系のしくみを説明し、おもな天体を見分けられるようになります。" },
      alpha: { title: "いちばん近い星たち：ケンタウルス座アルファ星", goal: "私たちにいちばん近い恒星系、その惑星プロキシマb、そしてそれが実際にどれほど遠いかを説明できます。" },
      exo: { title: "系外惑星：太陽系の外の世界", goal: "系外惑星とは何か、どのように見つけるのか、そしてどれほど多様なのかがわかります。" },
      hab: { title: "住める世界をさがして", goal: "惑星が住める可能性をもつ条件と、ハビタブルゾーンにあるだけでは生命を意味しない理由がわかります。" },
      zod: { title: "星座と黄道十二宮", goal: "星座とは何か、星占いの星座と実際の空がなぜずれるのか、そしてあなたの星座の光が何を語るのかを説明できます。" },
      names: { title: "宇宙の名前", goal: "惑星や恒星の名前が読めます。アルファベット、ギリシャ文字、カタログ、そして物語のある名前です。" },
      stars: { title: "恒星を知る", goal: "恒星とは何か、色が何を語るか、恒星をどう分けるか、そしてどの恒星が惑星にとってよい家なのかを説明できます。" },
      birth: { title: "星の誕生", goal: "ガスとちりの雲から恒星がどう生まれ、そのまわりで惑星がどう育ち、太陽がどう生まれたのかを説明できます。" },
      life: { title: "星の一生と死", goal: "恒星がどう生き、なぜ質量が一生を決め、恒星がどう終わるのか（白色わい星か超新星か）を説明できます。" },
      compact: { title: "中性子星とブラックホール", goal: "中性子星、パルサー、ブラックホールとは何か、天の川銀河のブラックホールがどこにあり、どう撮影されたのかを説明できます。" },
      nebula: { title: "星雲", goal: "星雲とは何か、その中で恒星がどう生まれ、死にゆく恒星がどう星雲を残すのかを知っています。" },
      milky: { title: "天の川銀河", goal: "私たちの銀河の形と大きさ、太陽の場所、中心をまわる旅、そしてガイアの地図を説明できます。" },
      local: { title: "銀河のご近所", goal: "近くの銀河、局所銀河群、そしてアンドロメダとの未来について科学が言っていることを知っています。" },
    },
    path: {
      meta: (m) => `約${m}分 · 初心者向け`,
      rule: (n) => `${n}つのステップのあと、10問の最終テスト。70 %以上で合格です。`,
    },
    neighborhood: {
      sunProxima: "太陽 → プロキシマ・ケンタウリ：4.24光年",
      sunAlpha: "太陽 → アルファ・ケンタウリA・B：4.37光年",
      system: "ひとつの恒星系：プロキシマ ↔ A・B 0.2光年（約1万3000天文単位）",
    },
    allPaths: "すべての学習パス",
    status: { done: "完了", next: "次はこれ", open: "未完了", locked: "先に全ステップを" },
    back: "すべてのステップ", placeLabel: "これについて学ぶ", stepOf: (n, all) => `ステップ ${n} / ${all}`, goalLabel: "学習目標", speak: "読み上げ", speakStop: "停止", speakTitle: "端末内の音声で読み上げます。何も送信されません。", rememberLabel: "覚えておこう", sourcesLabel: "出典", forYou: "あなたへ", example: "例", exampleHint: "生年月日を入れると（マイ・ユニバースの概要で）、これがあなた自身の数字になります。",
    taskLabel: "3D表示で", taskGo: "3Dで見る", scaleBack: "説明用の縮尺に戻す", taskDone: "完了", check: "理解できたか確かめよう", right: "正解です。", wrong: "ちょっと違います。",
    stepDone: (xp) => `ステップ完了 · +${xp} XP`, nextStep: "次のステップ", toTest: "最終テストへ",
    needTask: "3D表示での課題もやってみましょう。それでステップ完了です。", progress: (d, all) => `${all}ステップ中${d}完了`,
    test: {
      title: "最終テスト", intro: (n, p) => `すべてのステップから${n}問。あなた自身の数字を使った問題もあります。${p} %以上で合格です。`,
      locked: "先に5つのステップをすべて終えてください。", evaluate: "採点する", score: (r, n, p) => `${n}問中${r}問正解（${p} %）`,
      passed: (xp) => `合格 · +${xp} XPと新しいバッジ`, failed: "まだ合格ではありません。解説を読んで、もう一度挑戦しましょう。",
      retry: "もう一度", best: (p) => `最高成績：${p} %`, answerAll: "先にすべての問題に答えてください。",
    },
    steps: {
      sun: {
        title: "太陽", goal: "太陽が何であり、そのエネルギーがどこから来るのかを説明できます。",
        text: [
          "太陽は恒星です。熱いガスの球で、直径には地球が約109個並ぶほどの大きさがあります。太陽系の質量の99 %以上が太陽に集まっています。",
          "中心部では水素が融合してヘリウムになります。そのとき生まれるエネルギーが、約1億5000万キロメートル離れた私たちに光と熱として届きます。",
        ],
        task: "太陽まで飛んで、近くから見てみましょう。",
        remember: [
          "太陽は恒星で、熱いガスの球です。約46億年前に生まれました。",
          "エネルギーは核融合から来ます。約1500万℃の中心部で、水素がヘリウムに融合します。",
          "太陽系の質量の99.8 %が太陽にあります。直径には地球が約109個並びます。",
          "太陽の光は約8分20秒で地球に届きます。",
        ],
        you: (n) => `いまあなたに当たっている光は、約8分20秒前に太陽を出発しました。生まれてから、あなたは地球とともに太陽のまわりを${n}周しています。`,
        ref: (n) => `いまあなたに当たっている光は、約8分20秒前に太陽を出発しました。30歳の人は、地球とともに太陽のまわりをすでに${n}周しています。`,
      },
      inner: {
        title: "内側の惑星", goal: "4つの岩石惑星の名前を挙げ、見分けられます。",
        text: [
          "水星、金星、地球、火星は岩石惑星です。小さく、かたい地面があります。太陽にいちばん近いのは水星、いちばん熱いのは金星です。厚い二酸化炭素の大気が熱を閉じこめるからです。",
          "火星には太陽系最大の火山、オリンポス山があり、エベレストの何倍もの高さがあります。金星の1日は、金星の1年より長いのです。",
        ],
        task: "火星まで飛んで、地球とくらべてみましょう。",
        remember: [
          "水星、金星、地球、火星は内側の惑星で、かたい地表をもっています。",
          "いちばん熱い惑星は金星で、地表は約467℃です。太陽に近いのは水星なのに、です。",
          "金星の1日（地球の243日）は、金星の1年（地球の225日）より長いのです。",
          "火星のオリンポス山は太陽系最大の火山です。",
        ],
        you: (mars, mercury) => `火星ではあなたは${mars}歳、水星では${mercury}歳です。1年の長さが私たちとはちがうからです。`,
        ref: (mars, mercury) => `30歳の人は、火星では${mars}歳、水星では${mercury}歳です。1年の長さが私たちとはちがうからです。`,
      },
      outer: {
        title: "外側の惑星", goal: "巨大ガス惑星と巨大氷惑星を見分けられます。",
        text: [
          "木星と土星はおもに水素とヘリウムからなる巨大ガス惑星、天王星と海王星は巨大氷惑星です。どれも地球のようなかたい地面をもちません。",
          "木星の質量は、ほかのすべての惑星を合わせた質量の2倍以上です。土星は大きさのわりにとても軽く、密度は水より小さいのです。",
        ],
        task: "土星まで飛んで、環を見てみましょう。",
        remember: [
          "木星と土星は巨大ガス惑星、天王星と海王星は巨大氷惑星です。",
          "木星はいちばん大きな惑星で、質量はほかのすべての惑星を合わせた2倍以上です。",
          "土星は、密度が水より小さい唯一の惑星です。",
          "環をもつのは土星だけではありません。木星と海王星にも環があります。",
        ],
        you: (n) => `あなたが生まれてから、木星は太陽のまわりをまだ${n}周しかしていません。木星の1年は地球の約12年だからです。`,
        ref: (n) => `30年のあいだに、木星は太陽のまわりを${n}周しかしません。木星の1年は地球の約12年だからです。`,
      },
      moons: {
        title: "衛星と準惑星", goal: "衛星とは何か、月がいつも同じ面を向けている理由、そして準惑星とは何かがわかります。",
        text: [
          "衛星は惑星のまわりを回る天体です。地球には1つ、木星には数十の衛星があり、そのうち大きな4つは1610年にガリレオ・ガリレイが初期の望遠鏡で発見しました。",
          "大きな衛星の多くは、1周するあいだにちょうど1回自転するため、いつも惑星に同じ面を向けています。だから地球から月の裏側は見えません。",
          "太陽のまわりを自分で回る天体が、すべて惑星というわけではありません。小惑星帯のケレスと海王星の外側の冥王星は準惑星です。冥王星は2006年まで9番目の惑星とされていましたが、ほかの天体がその軌道を横切る可能性があるため、国際天文学連合が準惑星に分類しました。冥王星には5つの衛星が知られていて、最大のカロンは冥王星の約半分の大きさです。",
        ],
        task: "木星まで飛んで、4つの大きな衛星のどれかをクリックしてみましょう。",
        remember: [
          "衛星とは、惑星のまわりを回る天体です。",
          "木星の衛星ガニメデは太陽系最大の衛星で、惑星の水星より大きいのです。",
          "月はいつも地球に同じ面を向けています。1周するあいだにちょうど1回自転するからです。",
          "1610年、ガリレオ・ガリレイが木星の4つの大きな衛星を発見しました。",
          "ケレスと冥王星は準惑星です。冥王星は2006年まで9番目の惑星とされていました。",
        ],
        you: (n) => `あなたが生まれてから、月は地球のまわりを約${n}周しました。`,
        ref: (n) => `30年のあいだに、月は地球のまわりを約${n}周します。`,
      },
      scale: {
        title: "小天体、大きさと距離", goal: "太陽系がどれほど大きく、がらんとしているか、そして小惑星と彗星が何かを説明できます。",
        text: [
          "太陽系のほとんどは何もない空間です。地球から太陽までの距離、約1億5000万キロメートルを1天文単位（au）と呼びます。いちばん外側の惑星である海王星は、太陽から約30 auの距離にあります。",
          "太陽の光は地球まで8分あまり、海王星まで約4時間かかります。3D表示の実寸モードでは、惑星は広大な空間の中の小さな点になります。",
          "火星と木星のあいだには小惑星帯があり、ほとんどの小惑星がそこで太陽のまわりを回っています。その中で最大の天体ケレスは準惑星です。彗星はおもに氷とちりでできています。太陽に近づくとあたためられて、コマと呼ばれる大気ができ、太陽の光と太陽風がちりとガスを太陽と反対の方向へ吹き流して、長い尾をつくります。",
        ],
        task: "実寸表示をオンにして、惑星どうしがどれほど離れているか見てみましょう。",
        remember: [
          "1天文単位（au）は地球と太陽の平均距離で、約1億5000万キロメートルです。",
          "海王星は太陽から30 auの距離にあり、太陽の光が届くまで約4時間かかります。",
          "ほとんどの小惑星は火星と木星のあいだで太陽のまわりを回っています。そこで最大の天体ケレスは準惑星です。",
          "彗星はおもに氷とちりでできていて、太陽に近づくと太陽と反対の方向に尾がのびます。",
        ],
        you: (name, dist, year) => `あなたの星${name}から今日届く光は、${year}年ごろ、あなたが生まれた頃に出発しました。${dist}光年を旅してきたのです。`,
        ref: "太陽の次に近い恒星プロキシマ・ケンタウリの光は、私たちに届くまで4.2年かかります。",
      },
      neighbors: {
        title: "いちばん近い星たち", goal: "私たちにいちばん近い恒星がどれか、そして光年とは何かがわかります。",
        text: [
          "太陽の次に近い恒星はプロキシマ・ケンタウリで、約4.2光年の距離にあります。光年は時間ではなく距離です。光が1年に進む距離で、約9兆5000億キロメートルです。",
          "プロキシマは、地球にいちばん近い恒星系であるケンタウルス座アルファ星の一員です。プロキシマのほかに、約4.3光年の距離にある明るい2つの星、アルファ・ケンタウリAとBがあります。",
        ],
        task: "ケンタウルス座を見てみましょう。その方向に私たちのいちばん近い隣人たちがいます。",
        remember: [
          "太陽の次に近い恒星はプロキシマ・ケンタウリで、約4.2光年の距離にあります。",
          "光年は距離です。光が1年に進む距離です。",
          "ケンタウルス座アルファ星は地球にいちばん近い恒星系で、ケンタウルス座にあります。",
        ],
        you: (left) => (left == null ? "今日あなたに届いたプロキシマ・ケンタウリの光は、約4.2年前、あなたが生まれる前に出発しました。" : `今日あなたに届いたプロキシマ・ケンタウリの光は、約4.2年前、あなたが${left}歳のときに出発しました。`),
        ref: (left) => `今日私たちに届いたプロキシマ・ケンタウリの光は、約4.2年前に出発しました。いま30歳の人は、そのとき${left}歳でした。`,
      },
      pair: {
        title: "アルファ・ケンタウリAとB", goal: "ケンタウルス座アルファ星の明るい2つの星と、その動きを説明できます。",
        text: [
          "アルファ・ケンタウリAとBは、共通の重心のまわりを80年に1回まわる2つの星です。いちばん近づくときの間隔は、地球と太陽の距離の約11倍です。",
          "Aは私たちの太陽と同じタイプの星（G2）で、少し大きく、B（K1型）は少し小さい星です。2025年、ジェームズ・ウェッブ宇宙望遠鏡が、Aのまわりに土星くらいの重さの巨大惑星があるかもしれない手がかりを見つけました。本当にあるかどうかは、まだ未解決の問いです。",
        ],
        task: "ケンタウルス座アルファ星Aへ飛んでみましょう。となりでBが光っています。2つの星の間の距離は、実際より小さく描かれています。",
        remember: [
          "アルファ・ケンタウリAとBは、80年に1回たがいのまわりをまわります。",
          "Aは太陽と同じタイプの星で少し大きく、Bは少し小さい星です。",
          "2025年にウェッブ望遠鏡が見つけたAのまわりの惑星候補は、まだ確認されていません。",
        ],
        you: (share) => `AとBがたがいのまわりを1周するには80年かかります。あなたのこれまでの人生で、その${share} %をまわりました。`,
        ref: (share) => `AとBがたがいのまわりを1周するには80年かかります。30年でその${share} %をまわります。`,
      },
      proxima: {
        title: "プロキシマ・ケンタウリ", goal: "赤色矮星とは何か、そしてプロキシマが肉眼で見えない理由がわかります。",
        text: [
          "プロキシマ・ケンタウリは赤色矮星です。小さくて温度の低い星で、太陽よりずっと暗いのです。いちばん近い恒星なのに、暗すぎて肉眼では見えません。",
          "ケンタウルス座アルファ星の3番目の、いちばん暗い星です。紫外線やX線のフレアを放ち、それはその惑星にとってとても重要です。",
        ],
        task: "プロキシマ・ケンタウリまで飛んで、小さな赤い星を見てみましょう。",
        remember: [
          "プロキシマ・ケンタウリは赤色矮星で、小さく、温度が低く、太陽よりずっと暗い星です。",
          "いちばん近い恒星なのに、肉眼では見えません。",
          "ケンタウルス座アルファ星の3番目でいちばん暗い星で、紫外線やX線のフレアを放ちます。",
        ],
        you: (trips) => `あなたのこれまでの人生のあいだに、光はプロキシマから私たちまでの道のりを${trips}回進めたことになります。`,
        ref: (trips) => `30年のあいだに、光はプロキシマから私たちまでの道のりを${trips}回進めます。`,
      },
      proximaB: {
        title: "プロキシマb", goal: "プロキシマbについてわかっていること、そしてハビタブルゾーンが生命を意味しない理由がわかります。",
        text: [
          "2016年、ヨーロッパ南天天文台（ESO）の天文学者が、プロキシマ・ケンタウリをまわる惑星プロキシマbを発表しました。惑星に引っぱられて星がわずかにゆれ、その光が少しずれることから見つけたのです。この惑星は11.2日で星を1周し、少なくとも地球と同じくらいの重さがあります。",
          "プロキシマbは星のハビタブルゾーンにあります。条件がそろえば、液体の水がありえる温度だということです。しかしプロキシマのフレアが大気をはぎ取るかもしれません。プロキシマbに空気や水、まして生命があるかどうかは、わかっていません。",
        ],
        task: "プロキシマbまで飛んで、近くから見てみましょう。",
        remember: [
          "いちばん近い恒星の惑星プロキシマbは、2016年にESOが発表しました。",
          "プロキシマbの1年は11.2日です。",
          "写真ではなく、星のわずかなゆれから見つかりました。",
          "ハビタブルゾーンにあることは、生命がいることを意味しません。空気や水があるかはわかっていません。",
        ],
        you: (age) => `プロキシマbでは、あなたは${age}歳です。そこでの1年はたった11.2日だからです。`,
        ref: (age) => `30歳の人は、プロキシマbでは${age}歳です。そこでの1年はたった11.2日だからです。`,
      },
      travel: {
        title: "いつか行けるでしょうか？", goal: "いちばん近い恒星への旅が、いまならどれくらいかかるかを説明できます。",
        text: [
          "いちばん遠くにある探査機ボイジャー1号は、秒速約17キロメートル、時速6万1000キロメートル以上で太陽から遠ざかっています。この速さだと、4.2光年の旅には約7万5000年かかります（距離と速さから計算した値）。",
          "光なら同じ道のりを約4.2年で進みます。星と星はそれほど離れているのです。いちばん近い隣人でさえ、いまの探査機では届きません。",
        ],
        task: "旅行プランナーで、地球からプロキシマbへの旅を計画してみましょう。",
        remember: [
          "ボイジャー1号は秒速約17キロメートルで飛んでいます。",
          "その速さだと、プロキシマまでの旅は約7万5000年かかります。",
          "光なら同じ道のりを約4.2年で進みます。",
        ],
        you: (n) => `ボイジャー1号の速さだと、旅は約7万5000年かかります。あなたのこれまでの人生の${n}倍です。`,
        ref: (n) => `ボイジャー1号の速さだと、旅は約7万5000年かかります。30歳の人の人生の${n}倍です。`,
      },
      exoWhat: {
        title: "系外惑星とは？", goal: "系外惑星とは何か、そして最初の系外惑星がいつ見つかったかがわかります。",
        text: [
          "系外惑星とは、私たちの太陽系の外にある惑星です。ふつうはほかの恒星のまわりをまわっていますが、太陽をもたず、永遠の暗闇の中で銀河をさまよう惑星もあります。",
          "最初の系外惑星は1992年、パルサーのまわりで見つかりました。1995年には、太陽のような恒星をまわる初めての惑星、ペガスス座51番星bが続きました。発見者のミシェル・マイヨールとディディエ・ケローは、2019年にノーベル物理学賞を受賞しました。この地図のカタログ（NASAの系外惑星アーカイブ）には、確認された惑星が6,423個あります（2026年10月）。",
        ],
        task: "太陽のような恒星のまわりで初めて見つかった惑星、ペガスス座51番星bまで飛んでみましょう。",
        remember: [
          "系外惑星は太陽系の外の惑星で、ふつうはほかの恒星をまわっています。",
          "最初の系外惑星は1992年、パルサーのまわりで見つかりました。",
          "ペガスス座51番星b（1995年）は太陽のような恒星をまわる初めての惑星で、2019年のノーベル物理学賞につながりました。",
        ],
        you: (at, now, year) => `あなたが生まれた${year}年には、このカタログの惑星のうち${at}個が見つかっていました。今日では${now}個です。`,
        ref: (at, now, year) => `いま30歳の人が生まれた${year}年には、このカタログの惑星のうち${at}個が見つかっていました。今日では${now}個です。`,
      },
      exoHow: {
        title: "どうやって見つけるの？", goal: "トランジット法と視線速度法を説明できます。",
        text: [
          "系外惑星を直接見るのはむずかしいことです。恒星のほうがずっと明るいからです。トランジット法は恒星の光を見張ります。惑星が前を横切ると、恒星はほんのわずかに暗くなります。知られている系外惑星の多くはこの方法で見つかり、そのうち何千個もがNASAのケプラー宇宙望遠鏡によるものです。",
          "視線速度法は恒星そのものを見ます。惑星に引っぱられて恒星はわずかにゆれ、その光は交互に縮んだりのびたりして、少し青や赤の方へずれます。ペガスス座51番星bやプロキシマbは、この方法で見つかりました。",
        ],
        task: "ケプラー望遠鏡がトランジット法で見つけた惑星、ケプラー22bまで飛んでみましょう。",
        remember: [
          "トランジット：惑星が恒星の前を横切ると、恒星の光がわずかに暗くなります。",
          "視線速度：惑星が恒星をゆらし、恒星の光がずれます。",
          "知られている系外惑星の多くはトランジット法で見つかりました。",
        ],
        you: (n) => `あなたが生まれた年から、このカタログの惑星のうち${n}個がトランジット法で見つかりました。`,
        ref: (n) => `いま30歳の人が生まれた年から、このカタログの惑星のうち${n}個がトランジット法で見つかりました。`,
      },
      exoRocky: {
        title: "岩石の世界とスーパーアース", goal: "地球型惑星とスーパーアースを見分けられます。",
        text: [
          "地球型惑星は地球と同じくらいかそれより小さく、岩石、ケイ酸塩、水、炭素などでできています。スーパーアースは地球より重く、海王星より軽い惑星で、ガスや岩石、またはその両方でできていることがあります。",
          "地球ほどの大きさの惑星が7つ、約40光年離れた小さな赤色矮星TRAPPIST-1のまわりをまわっています。そのうちいくつかはハビタブルゾーンにありますが、正確にいくつかは研究によってちがいます。TRAPPIST-1eは6.1日で恒星を1周します。",
        ],
        task: "小さな赤色矮星をまわる地球ほどの大きさの惑星、TRAPPIST-1eまで飛んでみましょう。",
        remember: [
          "地球型惑星：地球と同じくらいかそれより小さく、岩石、ケイ酸塩、水、炭素などでできています。",
          "スーパーアース：地球より重く、海王星より軽い惑星です。",
          "TRAPPIST-1には地球ほどの大きさの惑星が7つあり、約40光年の距離にあります。",
        ],
        you: (n) => `TRAPPIST-1eでは、あなたは${n}歳です。そこでの1年は6.1日だからです。`,
        ref: (n) => `30歳の人は、TRAPPIST-1eでは${n}歳です。そこでの1年は6.1日だからです。`,
      },
      exoGiants: {
        title: "巨大ガス惑星とホット・ジュピター", goal: "巨大ガス惑星とホット・ジュピターが何かわかります。",
        text: [
          "巨大ガス惑星は土星や木星くらいの大きさか、それよりずっと大きい惑星です。海王星型の惑星は、海王星や天王星と同じくらいの大きさです。",
          "ペガスス座51番星bはホット・ジュピターです。たった4.2日で恒星を1周する巨大ガス惑星で、距離は0.05 au。水星と太陽の距離（0.39 au）よりずっと近いのです。HD 209458 bも恒星に近い巨大ガス惑星で、1年は3.5日です。",
        ],
        task: "1年が3.5日の巨大ガス惑星、HD 209458 bまで飛んでみましょう。",
        remember: [
          "巨大ガス惑星は土星や木星くらいの大きさか、それよりずっと大きい惑星です。",
          "ホット・ジュピターは恒星のすぐ近くをまわる巨大ガス惑星です。",
          "ペガスス座51番星bは4.2日で恒星を1周します。",
        ],
        you: (n) => `ペガスス座51番星bでは、あなたは${n}歳です。そこでの1年は4.2日だからです。`,
        ref: (n) => `30歳の人は、ペガスス座51番星bでは${n}歳です。そこでの1年は4.2日だからです。`,
      },
      exoStrange: {
        title: "ふしぎな世界", goal: "私たちの太陽系にはない、いくつかの世界を知っています。",
        text: [
          "かに座55番星eは、0.74日、つまり18時間足らずで恒星を1周するスーパーアースです。NASAは、全体が溶岩の海におおわれた超高温の世界だと説明しています。",
          "すべての系外惑星に太陽があるわけではありません。永遠の暗闇の中、ひとりで銀河をさまよう惑星もあります。カタログには毎年新しい世界が加わります。この地図の6,423個すべてを3D表示で探検できます。",
        ],
        task: "溶岩の海をもつ世界、かに座55番星eまで飛んでみましょう。",
        remember: [
          "かに座55番星e：1年が18時間足らずで、溶岩の海をもつスーパーアースです。",
          "太陽をもたず、暗闇の中で銀河をさまよう系外惑星もあります。",
          "新しい系外惑星は毎年見つかっています。",
        ],
        you: (n) => `かに座55番星eでは、あなたはもう${n}回誕生日を迎えています。そこでの1年は18時間足らずだからです。`,
        ref: (n) => `30歳の人は、かに座55番星eではもう${n}回誕生日を迎えています。そこでの1年は18時間足らずだからです。`,
      },
      exoSystems: {
        title: "惑星系", goal: "多くの恒星が複数の惑星をもつことを知り、2つの特別な惑星系を知っています。",
        text: [
          "2つ以上の惑星をもつ恒星はたくさんあります。この地図では1,069個です（2026年10月）。TRAPPIST-1の7つの惑星は小さな恒星のすぐ近くをまわっていて、NASAによると、7つすべてが水星の軌道の内側におさまります。",
          "太陽に似た恒星Kepler-90には8つの惑星が知られていて、私たちの太陽系と同じ数です。8つめは2017年、ケプラー望遠鏡のデータを調べたGoogleの人工ニューラルネットワークが見つけました。この地図では、この恒星はもうひとつの名前KOI-351で載っています。",
        ],
        task: "8つの惑星をもつ恒星Kepler-90、KOI-351へ飛んでみましょう。",
        remember: [
          "多くの恒星が複数の惑星をもっています。",
          "TRAPPIST-1の7つの惑星は、すべて水星の軌道の内側におさまります。",
          "Kepler-90には太陽系と同じ8つの惑星があり、8つめは2017年に人工知能が見つけました。",
        ],
        you: (n, e) => `あなたが生まれてから、TRAPPIST-1 bは恒星のまわりを約${n}回まわりました。地球が太陽をまわったのは${e}回です。`,
        ref: (n, e) => `30年のあいだに、TRAPPIST-1 bは恒星のまわりを約${n}回まわります。地球が太陽をまわるのは${e}回です。`,
      },
      exoFamous: {
        title: "有名な系外惑星", goal: "思っているのとはちがう姿をした系外惑星を2つ知っています。",
        text: [
          "HD 189733 bは、2.2日で恒星を1周する巨大ガス惑星です。NASAによると、この惑星はコバルトブルーです。その色は、ガラスをふくむ雲がある、かすんだ灼熱の大気から来ています。2005年に視線速度法で発見されました。",
          "Kepler-16 bは、41日ごとにたがいをまわるオレンジ色の星と赤色矮星の、2つの恒星を同時にまわっています。2つのまわりを229日で1周し、大きさと質量は土星に似ています。2011年に発表されたとき、研究者たちはこの惑星を、太陽が2つあるスター・ウォーズの惑星タトゥイーンにたとえました。",
        ],
        task: "ガラスをふくむ雲をもつ青い惑星、HD 189733 bへ飛んでみましょう。",
        remember: [
          "HD 189733 bはコバルトブルーで、雲にはガラスがふくまれています。",
          "Kepler-16 bは、スター・ウォーズのタトゥイーンのように2つの恒星をまわっています。",
          "Kepler-16 bは、大きさと質量が土星に似ています。",
        ],
        you: (n) => `太陽が2つある世界Kepler-16 bでは、あなたは${n}歳です。そこでは1年が229日です。`,
        ref: (n) => `30歳の人は、太陽が2つある世界Kepler-16 bでは${n}歳です。そこでは1年が229日です。`,
      },
      nebWhat: {
        title: "星雲とは？", goal: "星雲とは何か、星雲ができる2つのしかたを知っています。",
        text: [
          "NASAによると、星雲は宇宙にあるちりとガスの巨大な雲です。",
          "星雲の中には、超新星のような死にゆく恒星の爆発で放り出されたガスやちりからできたものがあります。ほかに、新しい恒星が生まれはじめている場所もあります。星の誕生のパスに出てきたオリオン大星雲がそうです。",
        ],
        task: "オリオン座を見てみましょう。ベルトの下に、恒星が生まれる星雲、オリオン大星雲があります。",
        remember: [
          "星雲は、宇宙にあるちりとガスの巨大な雲です。",
          "死にゆく恒星、たとえば超新星からできた星雲があります。",
          "新しい恒星が生まれる場所の星雲もあります。",
        ],
        you: (p) => `オリオン大星雲の光は約1,500年かけて来ます。あなたのこれまでの人生で、その道のりの約${p} %を進みました。`,
        ref: (p) => `オリオン大星雲の光は約1,500年かけて来ます。30年で、その道のりの約${p} %を進みます。`,
      },
      nebPillars: {
        title: "創造の柱", goal: "星のゆりかごのいちばん有名な写真を知っています。",
        text: [
          "へび座のわし星雲（M16）には、創造の柱があります。新しい恒星が生まれる、ガスとちりの塔です。距離はNASAが7,000光年、ESAが6,500光年としていて、2つのページは一致していません。",
          "ハッブルは柱を何度も撮影しました。2022年10月19日には、ウェッブ宇宙望遠鏡が、若い恒星でいっぱいの新しい画像を発表しました。",
        ],
        task: "へび座を見てみましょう。わし星雲はその中にあります。",
        remember: [
          "創造の柱は、へび座のわし星雲（M16）にあります。",
          "距離は6,500光年（ESA）または7,000光年（NASA）です。",
          "ウェッブは2022年10月に新しい画像を発表しました。",
        ],
        you: (before, at) => (before != null ? `ウェッブの柱の画像は2022年、あなたが生まれる${before}年前に発表されました。` : at === "0" ? "ウェッブの柱の画像は2022年、あなたが生まれた年に発表されました。" : `ウェッブの柱の画像は2022年、あなたが${at}歳のときに発表されました。`),
        ref: (ago) => `ウェッブの柱の画像は2022年、いまから${ago}年前に発表されました。`,
      },
      nebDark: {
        title: "暗黒星雲", goal: "暗い星雲もあることを知っています。",
        text: [
          "すべての星雲が光るわけではありません。オリオン座の馬頭星雲は暗黒星雲で、馬の頭の形をした、ちりとガスの暗い雲です。",
          "ESA/ハッブルによると約1,300光年はなれていて、同じ星座のオリオン大星雲より少し近くにあります。",
        ],
        task: "もう一度オリオン座を見てみましょう。馬頭星雲もその中にあります。",
        remember: [
          "暗い星雲もあります。ちりとガスの暗い雲です。",
          "馬頭星雲はオリオン座の暗黒星雲です。",
          "約1,300光年はなれています。",
        ],
        you: (year) => `今日とどく馬頭星雲の光は、${year}年ごろ、あなたが生まれるずっと前に出発しました。`,
        ref: (year) => `今日とどく馬頭星雲の光は、${year}年ごろに出発しました。`,
      },
      nebRing: {
        title: "環状星雲", goal: "惑星状星雲がどんな姿で、どこから来るのかを知っています。",
        text: [
          "太陽のような恒星が死ぬと、外側の層を放り出します。NASAによると、それは広がる雲、惑星状星雲になります。太陽もこうして終わります。",
          "いちばん有名なのは、こと座の環状星雲（M57）で、NASAによると約2,000光年はなれています。",
        ],
        task: "こと座を見てみましょう。環状星雲はその中にあります。",
        remember: [
          "惑星状星雲は、太陽のような死にゆく恒星が放り出した層です。",
          "環状星雲（M57）は、こと座の惑星状星雲です。",
          "約2,000光年はなれています。",
        ],
        you: (n) => `環状星雲の光は約2,000年かけて来ます。あなたが生きてきた時間の約${n}倍です。`,
        ref: (n) => `環状星雲の光は約2,000年かけて来ます。30年の人生の約${n}倍です。`,
      },
      nebCrab: {
        title: "かに星雲", goal: "地球で見られた超新星から残った星雲を知っています。",
        text: [
          "おうし座のかに星雲（M1）は超新星残骸で、NASAによると6,500光年はなれています。1054年、中国の天文学者がそこに「客星」を見つけました。それは超新星の爆発でした。",
          "星雲のまんなかには、高速で回転する中性子星、パルサーがあります。爆発した恒星の中心です。",
        ],
        task: "おうし座を見てみましょう。かに星雲はその中にあります。",
        remember: [
          "かに星雲は、おうし座にある超新星の残骸です。",
          "中国の天文学者は1054年、その超新星を「客星」として見ました。",
          "まんなかでは中性子星、パルサーが回っています。",
        ],
        you: (before) => `中国の天文学者が客星を見たのは1054年、あなたが生まれる${before}年前です。`,
        ref: (ago) => `中国の天文学者が客星を見たのは1054年、いまから${ago}年前です。`,
      },
      mwWhat: {
        title: "私たちの銀河", goal: "天の川銀河の形と大きさを知っています。",
        text: [
          "天の川銀河は私たちの銀河です。NASAによると、棒渦巻銀河で、渦巻く腕と、まんなかに恒星の棒がある円盤です。大きさは10万光年をこえます。",
          "ESAによると、1000億個をこえる恒星があります。太陽もそのひとつです。",
        ],
        task: "いて座を見てみましょう。その方向に天の川銀河の中心があります。",
        remember: [
          "天の川銀河は棒渦巻銀河です。",
          "大きさは10万光年をこえます。",
          "ESAによると、1000億個をこえる恒星があります。",
        ],
        you: (p) => `光が天の川銀河をよこぎるには約10万年かかります（大きさから計算）。あなたのこれまでの人生はその約${p} %です。`,
        ref: (p) => `光が天の川銀河をよこぎるには約10万年かかります（大きさから計算）。30年の人生はその約${p} %です。`,
      },
      mwArm: {
        title: "私たちの場所：オリオン腕", goal: "天の川銀河の中で太陽がどこにあるかを知っています。",
        text: [
          "NASAによると、太陽はオリオン腕という小さな、とぎれた腕の近くにあります。いて座腕とペルセウス腕のあいだで、中心から外のふちまでのほぼまんなかです。",
          "NASAは中心までの距離を約8キロパーセクとしています。計算すると約26,000光年です。ESOは中心のブラックホールまで約27,000光年としています。",
        ],
        task: "太陽を見てみましょう。中心から遠くはなれたオリオン腕にあります。",
        remember: [
          "太陽は、小さな、とぎれた腕、オリオン腕の近くにあります。",
          "オリオン腕は、いて座腕とペルセウス腕のあいだにあります。",
          "中心までは約26,000〜27,000光年です。",
        ],
        you: (ly, p) => `あなたの人生のあいだに、光は${ly}光年進みました。中心までの道のりの約${p} %です。`,
        ref: (ly, p) => `${ly}年で光は${ly}光年進みます。中心までの道のりの約${p} %です。`,
      },
      mwOrbit: {
        title: "中心をまわる旅", goal: "太陽が天の川銀河の中心のまわりを旅していることを知っています。",
        text: [
          "太陽は惑星をつれて、天の川銀河の中心のまわりを旅しています。NASAによると、平均時速72万キロメートルで動いています。",
          "1周にはとても長い時間がかかります。NASAの太陽のページは約2億3000万年、NASAの銀河のページとESAは約2億4000万年としていて、一致していません。",
        ],
        task: "太陽を見てみましょう。すべての惑星をつれて、天の川銀河の中心のまわりを旅しています。",
        remember: [
          "太陽は天の川銀河の中心のまわりを旅しています。",
          "時速約72万kmで動いています。",
          "1周には約2億3000万〜2億4000万年かかります。",
        ],
        you: (km, n) => `あなたが生まれてから、太陽はあなたを中心のまわりに約${km}0億km運びました（時速72万kmで計算）。1周には、あなたのこれまでの人生の約${n}倍の時間がかかります。`,
        ref: (km, n) => `30年で、太陽は私たちを中心のまわりに約${km}0億km運びます（時速72万kmで計算）。1周にはその約${n}倍の時間がかかります。`,
      },
      mwBand: {
        title: "空の帯", goal: "夜空をよこぎる光の帯が何かを知っています。",
        text: [
          "暗い夜には、うすい光の帯が空をよこぎっています。NASAによると、それは私たちの銀河の中心の円盤を、ふちから見たものです。",
          "私たちは内側から見ています。太陽そのものが円盤の中にあるからです。いて座の方向には中心があります。",
        ],
        task: "いて座を見てみましょう。そこで帯は中心をさしています。",
        remember: [
          "夜空の光の帯は、天の川銀河の円盤です。",
          "私たちは円盤をふちから、内側から見ています。",
          "いて座の方向に中心があります。",
        ],
        you: () => "暗い夜に見える帯は、あなた自身が住んでいる円盤です。",
        ref: () => "暗い夜に見える帯は、私たちみんなが住んでいる円盤です。",
      },
      mwGaia: {
        title: "ガイアの地図", goal: "ESAのガイアが天の川銀河をどう測ったのか、そしてこの地図の恒星がどこから来たのかを知っています。",
        text: [
          "ESAの宇宙望遠鏡ガイアは、恒星の位置と距離を測り、天の川銀河のくわしい3次元地図をつくりました。2022年6月13日の第3回データ公開には1,811,709,771個の天体があります。ESAのミッションのページは、20億個の恒星やほかの天体としています。",
          "ガイアは2025年1月15日に科学観測を終えました。この地図の恒星の多くはガイアDR3から来ています。326光年までの近くの恒星と、約100万個の明るい恒星です。",
        ],
        task: "このステップには3Dのタスクはありません。地図そのものがタスクです。質問に答えれば完了です。",
        remember: [
          "ガイアは天の川銀河のくわしい3D地図をつくりました。",
          "ガイアDR3（2022年）には約18億個の天体があります。",
          "この地図の恒星の多くはガイアDR3から来ています。",
        ],
        you: (before, at) => (before != null ? `ガイアDR3は2022年、あなたが生まれる${before}年前に公開されました。` : at === "0" ? "ガイアDR3は2022年、あなたが生まれた年に公開されました。" : `ガイアDR3は2022年、あなたが${at}歳のときに公開されました。`),
        ref: (ago) => `ガイアDR3は2022年、いまから${ago}年前に公開されました。`,
      },
      locGroup: {
        title: "局所銀河群", goal: "天の川銀河が属する銀河のグループを知っています。",
        text: [
          "NASAによると、天の川銀河は50をこえる銀河のグループ、局所銀河群に属しています。いちばん大きいのはアンドロメダ銀河、天の川銀河、そして3番めのさんかく座銀河（M33）です。",
          "さんかく座銀河は約300万光年はなれています。NASAによると、目のよい人が見られる、いちばん遠い天体のひとつです。",
        ],
        task: "さんかく座を見てみましょう。さんかく座銀河はその中にあります。",
        remember: [
          "天の川銀河は、50をこえる銀河の局所銀河群に属しています。",
          "いちばん大きいのはアンドロメダ、天の川、さんかく座銀河です。",
          "さんかく座銀河（M33）は約300万光年はなれています。",
        ],
        you: (n) => `さんかく座銀河の光は約300万年かけて来ます。あなたのこれまでの人生の約${n}倍です。`,
        ref: (n) => `さんかく座銀河の光は約300万年かけて来ます。30年の人生の約${n}倍です。`,
      },
      locMagellan: {
        title: "マゼラン雲", goal: "天の川銀河の仲間を知っています。",
        text: [
          "天の川銀河には小さな仲間がいます。ESA/ハッブルによると、大マゼラン雲は天の川銀河の伴銀河です。",
          "小マゼラン雲は、きょしちょう座の方向に20万光年はなれています。",
        ],
        task: "きょしちょう座を見てみましょう。小マゼラン雲はその中にあります。",
        remember: [
          "大マゼラン雲は天の川銀河の伴銀河です。",
          "小マゼラン雲は20万光年はなれています。",
          "きょしちょう座にあります。",
        ],
        you: (n) => `小マゼラン雲の光は20万年かけて来ます。あなたのこれまでの人生の約${n}倍です。`,
        ref: (n) => `小マゼラン雲の光は20万年かけて来ます。30年の人生の約${n}倍です。`,
      },
      locAndromeda: {
        title: "アンドロメダ銀河", goal: "私たちの大きなとなりの銀河を知っています。",
        text: [
          "アンドロメダ銀河（M31）は、局所銀河群でいちばん大きな銀河です。NASAによると、アンドロメダ座の方向に250万光年はなれています。",
          "それでも、暗い場所からなら肉眼でかんたんに見えます。そのとき見える光は、250万年前に出発した光です。",
        ],
        task: "アンドロメダ座を見てみましょう。アンドロメダ銀河はその中にあります。",
        remember: [
          "アンドロメダ銀河は、局所銀河群でいちばん大きな銀河です。",
          "250万光年はなれています。",
          "暗い場所からなら肉眼で見えます。",
        ],
        you: (n) => `アンドロメダの光は250万年かけて来ます。あなたのこれまでの人生の約${n}倍です。`,
        ref: (n) => `アンドロメダの光は250万年かけて来ます。30年の人生の約${n}倍です。`,
      },
      locApproach: {
        title: "近づくアンドロメダ", goal: "2012年にNASAが天の川とアンドロメダについて予測したことを知っています。",
        text: [
          "NASAによると、アンドロメダは時速約25万マイル、約40万キロメートルで天の川銀河に近づいています。",
          "2012年、NASAはハッブルのデータで、約40億年後に正面衝突すると予測しました。約60億年後には、2つの銀河は1つにまとまるとされました。",
        ],
        task: "もう一度アンドロメダ座を見てみましょう。そこからとなりの銀河が近づいています。",
        remember: [
          "アンドロメダは時速約40万kmで近づいています。",
          "NASAは2012年、約40億年後の衝突を予測しました。",
          "約60億年後には2つは1つにまとまるとされました。",
        ],
        you: (km) => `あなたが生まれてから、アンドロメダは約${km}0億km近づきました（時速25万マイルで計算）。`,
        ref: (km) => `30年で、アンドロメダは約${km}0億km近づきます（時速25万マイルで計算）。`,
      },
      locFuture: {
        title: "未来はどれくらい確か？", goal: "科学の予測は、新しいデータで変わることがあると知っています。",
        text: [
          "2025年、ティル・サワラのチームが、ハッブルとESAのガイアのデータでもう一度調べました。ESA/ハッブルによると、2つの銀河がこれから100億年のうちに衝突する確率は50パーセントしかありません。",
          "これが科学のやり方です。予測はデータが支えるかぎり正しいとされます。よりよい測定によって、2012年の衝突は「起こるかもしれないこと」になりました。",
        ],
        task: "このステップには3Dのタスクはありません。質問に答えれば完了です。",
        remember: [
          "2025年の研究では、100億年のうちの衝突の確率は50パーセントです。",
          "ハッブルとESAのガイアのデータを使いました。",
          "科学の予測は新しいデータで変わることがあります。",
        ],
        you: (n) => `2012年の予測の40億年は、あなたのこれまでの人生の約${n}倍です。`,
        ref: (n) => `2012年の予測の40億年は、30年の人生の約${n}倍です。`,
      },
      nsWhat: {
        title: "中性子星", goal: "中性子星とは何か、どれほど密度が高いかを知っています。",
        text: [
          "NASAによると、中性子星は、重い恒星の燃料がつきてつぶれたときにできます。太陽より大きな質量を、直径わずか約20キロメートルの球におしこめています。",
          "その物質は想像できないほど密度が高く、NASAによると角砂糖1個分で約1兆キログラムになります。地図には惑星をもつ中性子星があり、たとえばPSR B0329+54です。",
        ],
        task: "惑星をもつ中性子星、PSR B0329+54を見てみましょう。",
        remember: [
          "中性子星は、重い恒星の燃料がつきてつぶれたときにできます。",
          "太陽より大きな質量を、直径約20 kmの球におしこめています。",
          "その物質は角砂糖1個分で約1兆キログラムになります。",
        ],
        you: (name, m) => `あなたの星${name}の質量は太陽の${m}倍で、都市よりずっと大きな星です。中性子星は、太陽まるごとより多くの質量を約20 kmにおしこめています。`,
        ref: (name, m) => `${name}の質量は太陽の${m}倍で、都市よりずっと大きな星です。中性子星は、太陽まるごとより多くの質量を約20 kmにおしこめています。`,
        none: () => "中性子星は、太陽まるごとより多くの質量を約20 kmにおしこめています。",
      },
      nsPulsar: {
        title: "パルサー", goal: "パルサーとは何か、なぜ点滅するのかを知っています。",
        text: [
          "NASAによると、パルサーは放射のパルスを出しながら回転する中性子星です。灯台のようなもので、その光線が何度も私たちの前を通りすぎます。パルスの間隔はふつう数ミリ秒から数秒です。",
          "パルサーPSR B1257+12のまわりでは惑星が見つかり、NASAはそれを最初に発見された惑星の仲間としています。この地図のNASAの表では、2つが1992年、3つめが1994年です。",
        ],
        task: "3つの惑星をもつパルサー、PSR B1257+12を見てみましょう。",
        remember: [
          "パルサーは、放射のパルスを出す回転する中性子星です。",
          "灯台のように、その光線が私たちの前を通りすぎます。",
          "パルスは数ミリ秒から数秒ごとに来ます。",
        ],
        you: (n) => `1秒に1回点滅するパルサーなら、あなたが生まれてから約${n}回点滅したことになります。（計算）`,
        ref: (n) => `1秒に1回点滅するパルサーは、30年で約${n}回点滅します。（計算）`,
      },
      bhWhat: {
        title: "ブラックホールとは？", goal: "ブラックホールとは何か、そして何でないかを知っています。",
        text: [
          "NASAによると、ブラックホールの重力はとても強く、何も、光さえも逃げられません。太陽の8倍をこえる質量の恒星は、ブラックホールを残すことがあります。中心がつぶれて恒星質量ブラックホールになるのです。",
          "でもブラックホールは宇宙の掃除機ではありません。NASAによると、ほかの物質を吸いこむわけではありません。太陽を同じ質量のブラックホールにおきかえても、惑星は軌道を回りつづけます。",
        ],
        task: "このステップには3Dのタスクはありません。ブラックホールは見えないからです。質問に答えれば完了です。",
        remember: [
          "ブラックホールからは何も、光さえも逃げられません。",
          "とても重い恒星の中心は、つぶれてブラックホールになることがあります。",
          "ブラックホールは物質を吸いこみません。惑星は軌道を回りつづけます。",
        ],
        you: (ly) => `光はとても速く、あなたの人生のあいだに${ly}光年進みました。それでもブラックホールからは出られません。`,
        ref: (ly) => `光はとても速く、${ly}年で${ly}光年進みます。それでもブラックホールからは出られません。`,
      },
      bhCenter: {
        title: "天の川銀河の中心のブラックホール", goal: "天の川銀河の中心にあるブラックホールを知っています。",
        text: [
          "NASAによると、超大質量ブラックホールは太陽の数十万倍から数十億倍の質量をもち、銀河の中心にあります。",
          "私たちの銀河のものはいて座A*とよばれます。ESOによると、太陽の400万倍の質量で、約27,000光年はなれ、いて座の方向にあります。",
        ],
        task: "いて座を見てみましょう。その方向に天の川銀河の中心があります。",
        remember: [
          "超大質量ブラックホールは銀河の中心にあります。",
          "いて座A*は太陽の400万倍の質量です。",
          "約27,000光年はなれた、いて座の方向にあります。",
        ],
        you: (before) => `今日とどく、いて座A*のあたりからの光は約27,000年かけて来ました。あなたが生まれる約${before}年前に出発した光です。`,
        ref: () => "今日とどく、いて座A*のあたりからの光は約27,000年かけて来ました。",
      },
      bhImage: {
        title: "はじめてのブラックホールの画像", goal: "ブラックホールがどう撮影されたのかを知っています。",
        text: [
          "2019年4月10日、イベント・ホライズン・テレスコープが、はじめてのブラックホールの画像を発表しました。銀河M87のブラックホールで、ESOによると5500万光年はなれ、太陽の65億倍の質量です。画像には、暗い中心をもつ輪のような構造が写っています。",
          "2022年5月12日には、私たちの天の川銀河の中心のブラックホール、いて座A*のはじめての画像がつづきました。",
        ],
        task: "おとめ座を見てみましょう。その方向に銀河M87があります。",
        remember: [
          "はじめてのブラックホールの画像は2019年4月10日に発表されました（M87）。",
          "暗い中心をもつ輪のような構造が写っています。",
          "いて座A*の画像は2022年5月12日につづきました。",
        ],
        you: (before, at) => (before != null ? `はじめてのブラックホールの画像は2019年、あなたが生まれる${before}年前に発表されました。` : at === "0" ? "はじめてのブラックホールの画像は2019年、あなたが生まれた年に発表されました。" : `はじめてのブラックホールの画像は2019年、あなたが${at}歳のときに発表されました。`),
        ref: (ago) => `はじめてのブラックホールの画像は2019年、いまから${ago}年前に発表されました。`,
      },
      lifeMain: {
        title: "主系列", goal: "恒星の一生でいちばん長い時期を知っています。",
        text: [
          "NASAによると、中心で水素をヘリウムに安定して融合している恒星を主系列星とよびます。恒星の一生でいちばん長い時期で、恒星の約90 %がこの時期にあります。",
          "太陽もそのひとつで、主系列の時期のほぼまんなかにいます。NASAによると、太陽は約100億年を主系列ですごします。",
        ],
        task: "主系列のまんなかにいる太陽を見てみましょう。",
        remember: [
          "主系列では、恒星は水素を安定してヘリウムに融合しています。",
          "恒星の一生でいちばん長い時期です。",
          "太陽は、約100億年の主系列のほぼまんなかにいます。",
        ],
        you: (sec) => `太陽の主系列の100億年を1年とすると、あなたのこれまでの人生は約${sec}秒です。（計算）`,
        ref: (sec) => `太陽の主系列の100億年を1年とすると、30年の人生は約${sec}秒です。（計算）`,
      },
      lifeMass: {
        title: "質量が決める", goal: "重い恒星は短く、軽い恒星は長く生きる理由を知っています。",
        text: [
          "NASAによると、質量の大きい恒星ほど燃料を速く使います。だから、いちばん重い恒星は数百万年しか生きません。",
          "軽い恒星は節約家です。NASAによると、質量の小さい恒星の中には何兆年も輝くものがあります。プロキシマ・ケンタウリはそんな軽い恒星で、この地図のNASAの表では太陽の約8分の1の質量の赤色わい星です。",
        ],
        task: "とても長い一生がこれから待つ軽い赤色わい星、プロキシマ・ケンタウリを見てみましょう。",
        remember: [
          "質量の大きい恒星ほど、燃料を速く使います。",
          "いちばん重い恒星は数百万年しか生きません。",
          "軽い恒星の中には何兆年も輝くものがあります。",
        ],
        you: (name, m, light) => `あなたの星${name}の質量は太陽の${m}倍で、${light ? "太陽より軽いので、燃料をゆっくり使い、太陽より長く生きます" : "太陽より重いので、燃料を速く使い、太陽より短く生きます"}。`,
        ref: (name, m, light) => `${name}の質量は太陽の${m}倍で、${light ? "太陽より軽いので、燃料をゆっくり使い、太陽より長く生きます" : "太陽より重いので、燃料を速く使い、太陽より短く生きます"}。`,
        none: (name) => `表には${name}の質量がありません。`,
      },
      lifeGiant: {
        title: "赤色巨星", goal: "恒星の中心の水素がなくなると何が起きるかを知っています。",
        text: [
          "恒星の中心で、ヘリウムに融合する水素がなくなると、中心はちぢみはじめ、恒星はゆっくりふくらみます。NASAによると、こうして赤色巨星になります。",
          "太陽にも同じことが起きます。NASAによると、太陽は約50億年後に赤色巨星になります。",
        ],
        task: "太陽を見てみましょう。約50億年後には赤色巨星になります。",
        remember: [
          "中心の水素がなくなると、中心はちぢみ、恒星はふくらみます。",
          "こうして赤色巨星になります。",
          "太陽は約50億年後に赤色巨星になります。",
        ],
        you: (n) => `赤色巨星までの50億年は、あなたのこれまでの人生の約${n}倍です。`,
        ref: (n) => `赤色巨星までの50億年は、30年の人生の約${n}倍です。`,
      },
      lifeWhite: {
        title: "白色わい星", goal: "太陽のような恒星がどう終わるのかを知っています。",
        text: [
          "赤色巨星が外側の層をすべて放り出すと、中心だけが残ります。白色わい星です。NASAによると、ふつう地球くらいの大きさで、その物質はティースプーン1杯でピックアップトラックより重くなります。何十億年もかけてゆっくり冷え、放り出された層は広がる雲、惑星状星雲になります。",
          "NASAによると、太陽の約7倍までの質量の恒星は白色わい星で終わります。太陽もそうです。地図には惑星をもつ白色わい星があります。WD 1856+534のまわりには、NASAの表で2020年に見つかった惑星が1つあります。",
        ],
        task: "惑星をもつ白色わい星、WD 1856+534を見てみましょう。",
        remember: [
          "白色わい星は恒星の残った中心で、ふつう地球くらいの大きさです。",
          "その物質はティースプーン1杯でピックアップトラックより重くなります。",
          "太陽の約7倍までの質量の恒星は、白色わい星で終わります。",
        ],
        you: (name, m, fate) => `あなたの星${name}の質量は太陽の${m}倍です。${fate === "white" ? "いつか白色わい星で終わります。" : fate === "nova" ? "超新星になれるほど重い恒星です。" : "白色わい星と超新星の境目にいます。"}`,
        ref: (name, m, fate) => `${name}の質量は太陽の${m}倍です。${fate === "white" ? "いつか白色わい星で終わります。" : fate === "nova" ? "超新星になれるほど重い恒星です。" : "白色わい星と超新星の境目にいます。"}`,
        none: (name) => `表には${name}の質量がありません。`,
      },
      lifeNova: {
        title: "超新星と星くず", goal: "重い恒星がどう終わり、元素がどこから来るのかを知っています。",
        text: [
          "NASAによると、太陽の8倍をこえる質量の恒星は、最後に超新星として爆発します。NASAの別のページは、その境目を7倍としています。中心はつぶれてブラックホールになることがあります。くわしくは次のパスで。",
          "恒星は中心で炭素を、酸素、ネオン、マグネシウムのようなもっと重い元素に融合し、超新星はその元素を宇宙にまき散らします。NASAによると、地球のすべてのもの、私たちの体も、恒星の中心でできた元素からできています。",
        ],
        task: "このステップには3Dのタスクはありません。質問に答えれば完了です。",
        remember: [
          "太陽の約8倍をこえる質量の恒星は、超新星で終わります。",
          "恒星は酸素のような重い元素をつくり、超新星がそれをまき散らします。",
          "NASAによると、私たちの体も恒星でできた元素からできています。",
        ],
        you: (name, m, fate) => `あなたの体の元素は恒星の中でできました。あなたの星${name}（太陽の${m}倍の質量）は${fate === "nova" ? "いつか自分も爆発します。" : "超新星として爆発するには軽すぎます。"}`,
        ref: (name, m, fate) => `すべての人の体の元素は恒星の中でできました。${name}（太陽の${m}倍の質量）は${fate === "nova" ? "いつか自分も爆発します。" : "超新星として爆発するには軽すぎます。"}`,
        none: () => "あなたの体の元素は恒星の中でできました。",
      },
      birthCloud: {
        title: "ガスとちりの雲", goal: "恒星がどこで生まれるかを知っています。",
        text: [
          "NASAによると、恒星は分子雲とよばれる、ガスとちりの大きな雲の中で生まれます。分子雲は冷たいので、ガスは密度の高いかたまりになります。やがて重力によって、そのかたまりのいくつかがつぶれます。",
          "オリオン大星雲はそのような星のゆりかごです。NASAによると、地球にいちばん近い大きな星形成領域で、約1,500光年はなれ、オリオンのベルトのすぐ下にあります。",
        ],
        task: "オリオン座を見てみましょう。オリオン大星雲はベルトのすぐ下にあります。",
        remember: [
          "恒星は、ガスとちりの冷たい雲、分子雲の中で生まれます。",
          "重力によって、雲の中のかたまりがつぶれます。",
          "オリオン大星雲はいちばん近い大きな星形成領域で、約1,500光年はなれています。",
        ],
        you: (before) => `今日とどくオリオン大星雲の光は、約1,500年かけて来ました。あなたが生まれる約${before}年前に出発した光です。`,
        ref: () => "今日とどくオリオン大星雲の光は、約1,500年かけて来ました。",
      },
      birthProto: {
        title: "かたまりから原始星へ", goal: "つぶれるかたまりが、どうやって恒星になるのかを知っています。",
        text: [
          "かたまりがつぶれると、摩擦で物質が熱くなり、原始星ができます。NASAによると、恒星の赤ちゃんです。数百万年たつと、中心の温度で水素の原子核がおしつけられ、核融合が始まって、恒星が輝きます。",
          "約32光年はなれたAU Micは、そんな若い恒星です。NASAによると年齢は2000万〜3000万年で、恒星の赤ちゃんです。太陽は少なくとも150倍も年上です。",
        ],
        task: "惑星をもつ若い恒星、AU Micを見てみましょう。",
        remember: [
          "つぶれるかたまりは熱くなり、恒星の赤ちゃん、原始星になります。",
          "数百万年たつと、中心で水素の核融合が始まります。",
          "AU Micはまだ2000万〜3000万歳で、太陽は少なくとも150倍年上です。",
        ],
        you: (x) => `AU Micは2000万〜3000万歳です。まんなかで数えると、あなたの約${x}倍の年齢です。恒星としては赤ちゃんです。`,
        ref: (x) => `AU Micは2000万〜3000万歳です。まんなかで数えると、30歳の人の約${x}倍の年齢です。恒星としては赤ちゃんです。`,
      },
      birthDisk: {
        title: "円盤と惑星", goal: "若い恒星のまわりで惑星がどう育つのかを知っています。",
        text: [
          "若い恒星のまわりには、誕生のときに残ったガスとちりの円盤があります。NASAによると、AU Micにもあります。そうした円盤の中で、岩や氷のつぶがぶつかって合体し、惑星が育ちます。",
          "2018年、ESOは、そうした円盤の中で生まれつつある惑星の、はじめて確認された画像を発表しました。ESOが約400光年はなれているとする恒星をまわるPDS 70 bです（この地図のNASAの表では369光年）。2021年にはALMAが、兄弟惑星PDS 70 cのまわりに、衛星が生まれるかもしれない円盤を見つけました。",
        ],
        task: "2つの若い惑星をもつPDS 70を見てみましょう。",
        remember: [
          "若い恒星は、ガスとちりの円盤にかこまれています。",
          "円盤の中で岩や氷のつぶがぶつかって合体し、惑星になります。",
          "PDS 70 bは、生まれつつある惑星のはじめて確認された画像です（2018年）。",
        ],
        you: (before, at) => (before != null ? `PDS 70 bは2018年、あなたが生まれる${before}年前に撮影されました。` : at === "0" ? "PDS 70 bは2018年、あなたが生まれた年に撮影されました。" : `PDS 70 bは2018年、あなたが${at}歳のときに撮影されました。`),
        ref: (ago) => `PDS 70 bは2018年、いまから${ago}年前に撮影されました。`,
      },
      birthCluster: {
        title: "恒星はグループで生まれる", goal: "恒星がよくいっしょに、星団で生まれることを知っています。",
        text: [
          "NASAによると、恒星はよくグループで生まれます。そうしたグループを星団とよびます。",
          "いちばん有名なのは、おうし座の散開星団プレアデス星団（すばる）です。NASAはその距離を約445光年とし、この数字はみんなが認めているわけではないとそえています。",
        ],
        task: "おうし座を見てみましょう。プレアデス星団はその中にあります。",
        remember: [
          "恒星はよくグループ、つまり星団で生まれます。",
          "プレアデス星団は、おうし座の散開星団です。",
          "約445光年はなれていますが、この数字はみんなが認めているわけではありません。",
        ],
        you: (year, before) => `今日とどくプレアデス星団の光は、${year}年ごろ、あなたが生まれる約${before}年前に出発しました。`,
        ref: (year) => `今日とどくプレアデス星団の光は、${year}年ごろに出発しました。`,
      },
      birthSun: {
        title: "太陽の誕生", goal: "太陽とその惑星が、いつ、どうやって生まれたのかを知っています。",
        text: [
          "NASAによると、太陽は約46億年前、回転するガスとちりの巨大な雲、原始太陽系星雲の中で生まれました。残った物質の多くから、地球をふくむ惑星や太陽系のほかの天体ができました。",
          "同じNASAのページは、はじめの部分で太陽を45億歳としています。2つの数字はまるめ方がちがうだけで、どちらも約45億〜46億年という意味です。",
        ],
        task: "46億年前に生まれた太陽を見てみましょう。",
        remember: [
          "太陽は約46億年前に生まれました。",
          "回転するガスとちりの雲、原始太陽系星雲の中で生まれました。",
          "残った物質の多くから、地球をふくむ惑星ができました。",
        ],
        you: (ms) => `太陽のこれまでの一生を1日とすると、あなたのこれまでの人生は約${ms}ミリ秒です。（46億年で計算）`,
        ref: (ms) => `太陽のこれまでの一生を1日とすると、30年の人生は約${ms}ミリ秒です。（46億年で計算）`,
      },
      starWhat: {
        title: "恒星とは？", goal: "恒星とは何か、その光がどこから来るのかを知っています。",
        text: [
          "NASAによると、恒星は熱いガスでできた巨大な球で、自分の重力でまとまっています。太陽もそのひとつで、私たちにいちばん近い恒星です。",
          "恒星は中心の奥深くで、水素の原子核をおしつけてヘリウムにします。この核融合で出るエネルギーで、恒星は輝きます。太陽はこれを約46億年つづけています。",
        ],
        task: "私たちにいちばん近い恒星、太陽を見てみましょう。",
        remember: [
          "恒星は熱いガスの巨大な球で、自分の重力でまとまっています。",
          "中心で水素がヘリウムに融合し、それで輝きます。",
          "太陽は恒星で、私たちにいちばん近い恒星です。",
        ],
        you: (n) => `あなたが生まれてから、地球は太陽のまわりを${n}回まわりました。そのあいだずっと、太陽は中心で水素をヘリウムに融合してきました。それが太陽の光です。`,
        ref: (n) => `${n}年で地球は太陽のまわりを${n}回まわります。そのあいだずっと、太陽は中心で水素をヘリウムに融合しています。それが太陽の光です。`,
      },
      starColor: {
        title: "色と温度", goal: "恒星の色から、熱いか冷たいかがわかります。",
        text: [
          "NASAによると、恒星の色がちがうのは温度がちがうからです。熱い恒星は青や白に、冷たい恒星はオレンジや赤に見えます。",
          "太陽の表面は約5,500 °Cです。TRAPPIST-1はずっと冷たく、この地図のNASAの表では2,566ケルビン、約2,300 °Cです。だから赤く光ります。",
        ],
        task: "冷たい赤い恒星、TRAPPIST-1を見てみましょう。",
        remember: [
          "恒星の色は、その温度を示します。",
          "熱い恒星は青や白、冷たい恒星はオレンジや赤に見えます。",
          "太陽の表面は約5,500 °Cです。",
        ],
        you: (name, c, hotter) => `あなたの星${name}の表面は約${c} °Cで、太陽（約5,500 °C）より${hotter ? "熱い" : "冷たい"}です。`,
        ref: (name, c, hotter) => `${name}の表面は約${c} °Cで、太陽（約5,500 °C）より${hotter ? "熱い" : "冷たい"}です。`,
        none: (name) => `表には${name}の温度がありません。`,
      },
      starClass: {
        title: "恒星のクラス", goal: "恒星を文字で分けられます：O、B、A、F、G、K、M。",
        text: [
          "天文学では、恒星をいちばん熱いものから冷たいものへ、文字のクラスに分けます。O（青）、B（青白）、A（白）、F（黄白）、G（黄）、K（オレンジ）、M（赤）です。",
          "NASAによると、太陽はGクラスの黄色わい星です。ペガスス座51番星もG型の恒星で、そのまわりで、太陽に似た恒星をまわる最初の惑星が見つかりました。",
        ],
        task: "太陽と同じG型の恒星、ペガスス座51番星を見てみましょう。",
        remember: [
          "熱い順のクラス：O、B、A、F、G、K、M。",
          "O型の恒星は青く、M型は赤い。",
          "太陽はG型の恒星、黄色わい星です。",
        ],
        colors: { O: "青", B: "青白", A: "白", F: "黄白", G: "黄", K: "オレンジ", M: "赤" },
        you: (name, spec, color) => `表では、あなたの星${name}のタイプは${spec}です。最初の文字がクラスで、色は${color}です。`,
        ref: (name, spec, color) => `表では、${name}のタイプは${spec}です。最初の文字がクラスで、色は${color}です。`,
        none: (name) => `表には${name}のタイプがありません。`,
      },
      starSize: {
        title: "大きい星、小さい星", goal: "恒星の大きさがどれほどちがうか、どの恒星がいちばん多いかを知っています。",
        text: [
          "恒星の大きさはさまざまです。プロキシマ・ケンタウリは赤色わい星で、この地図のNASAの表では太陽の半径の0.141倍、約7分の1です。惑星をもつ恒星で地図の中でいちばん大きいHD 18438は、太陽の約88倍の大きさです。",
          "いちばん多いのは赤色わい星です。天の川銀河の恒星にしめる割合を、NASAはあるページで約73 %、別のページで75 %としています。太陽のような恒星は約6 %だけです。",
        ],
        task: "小さな赤色わい星、プロキシマ・ケンタウリを見てみましょう。",
        remember: [
          "恒星の大きさは、小さな赤色わい星から巨星までさまざまです。",
          "天の川銀河の恒星の約4分の3は赤色わい星です。",
          "太陽のような恒星は約6 %だけです。",
        ],
        you: (name, x, small) => (small ? `あなたの星${name}の半径は、太陽の約${x} %です。` : `あなたの星${name}は、太陽の約${x}倍の大きさです。`),
        ref: (name, x, small) => (small ? `${name}の半径は、太陽の約${x} %です。` : `${name}は、太陽の約${x}倍の大きさです。`),
        none: (name) => `表には${name}の大きさがありません。`,
      },
      starHosts: {
        title: "惑星の家としての恒星", goal: "NASAが生命によい家と考える恒星を知っています。",
        text: [
          "NASAによると、太陽より少し冷たいK型のオレンジわい星は、高度な生命により向いていると考えられています。",
          "赤色わい星（M型）はもっと長生きで、NASAは1000億年以上としています。でも、そのハビタブルゾーンの惑星はからからに干上がることがあります。それでもM型のTOI-700には、ゾーンの中に惑星があります。",
        ],
        task: "ハビタブルゾーンに惑星をもつ赤色わい星、TOI-700を見てみましょう。",
        remember: [
          "オレンジわい星（K型）は高度な生命に向いていると考えられています。",
          "赤色わい星（M型）はいちばん長生きで、1000億年以上です。",
          "赤色わい星のゾーンの惑星は干上がることがあります。",
        ],
        hint: { G: "太陽に似ています。", K: "NASAによると、このようなオレンジわい星は高度な生命により向いていると考えられています。", M: "このような赤色わい星はとても長生きですが、ゾーンの惑星は干上がることがあります。" },
        you: (name, cls, hint) => `あなたの星${name}は${cls}型の恒星で、少なくとも1つの惑星がまわっています。${hint}`,
        ref: (name, cls, hint) => `${name}は${cls}型の恒星で、2つの惑星がまわっています。${hint}`,
        none: (name) => `表には${name}のタイプがありません。`,
      },
      nameLetters: {
        title: "惑星にはアルファベット", goal: "系外惑星の名前が読めます。恒星の名前とアルファベットです。",
        text: [
          "系外惑星はふつう、その恒星の名前に小文字のアルファベットをつけて呼ばれます。NASAによると、最初に見つかった惑星はかならずb、次はc、d、eと続きます。恒星そのものは、書かれない「A」です。",
          "ひとつの恒星の惑星がいくつか同時に見つかると、恒星にいちばん近い惑星がbになります。TRAPPIST-1の7つの惑星は、内側から外側へbからhです。つまり文字は見つかった順番で、距離ではありません。プロキシマ・ケンタウリには、この地図のNASAの表でbとdがあり、dはbより恒星の近くを回っていますが、あとから見つかりました。",
        ],
        task: "プロキシマ・ケンタウリと、その惑星bとdを見てみましょう。",
        remember: [
          "系外惑星は、恒星の名前に小文字をつけて呼ばれます。",
          "最初に見つかった惑星はb、次はc、d、eです。",
          "いくつか同時に見つかると、恒星にいちばん近い惑星がbになります。",
        ],
        you: (star, list, n) => (n ? `あなたの星は${star}です。NASAの表には、そのまわりに${n}個の惑星があります：${list}。` : `あなたの星は${star}です。その惑星は、見つかった順に${star} b、${star} cと呼ばれます。`),
        ref: () => "プロキシマ・ケンタウリの惑星はProxima Cen bとProxima Cen dです。恒星がProxima Cenで、文字が惑星を数えています。",
      },
      nameStars: {
        title: "恒星には大文字", goal: "いくつかの恒星でできた系の、恒星の呼び方を知っています。",
        text: [
          "多くの恒星には仲間がいます。2つ、3つ、またはもっと多くの恒星がいっしょになっています。NASAによると、恒星には大文字、惑星には小文字がつきます。惑星をもつ恒星はふつう書かれない「A」で、ほかの恒星はB、Cと呼ばれることがあります。",
          "いちばん近い隣人がその例です。アルファ・ケンタウリAとアルファ・ケンタウリBはおたがいのまわりを回り、プロキシマ・ケンタウリは3つめの恒星として同じ系に入っています。大文字と小文字で恒星と惑星を区別できます。アルファ・ケンタウリBは恒星、Proxima Cen bは惑星です。",
        ],
        task: "アルファ・ケンタウリAを見てみましょう。となりにB、近くにプロキシマの印があります。",
        remember: [
          "恒星には大文字、惑星には小文字がつきます。",
          "惑星をもつ恒星は、ふつう書かれない「A」です。",
          "アルファ・ケンタウリAとBは2つの恒星、Proxima Cen bは惑星です。",
        ],
        you: (left) => (left == null ? "今日とどくアルファ・ケンタウリAとBの光は4.37年かけて来ました。あなたが生まれる前に出発した光です。" : `今日とどくアルファ・ケンタウリAとBの光は4.37年かけて来ました。あなたが${left}歳のときに出発した光です。`),
        ref: (left) => `アルファ・ケンタウリAとBの光は、4.37年かけて私たちにとどきます。いま30歳の人は、光が出発したとき${left}歳でした。`,
      },
      nameGreek: {
        title: "ギリシャ文字と星座", goal: "アルファ・ケンタウリのような星の名前が読めます。",
        text: [
          "明るい星の多くは、ギリシャ文字と、星座のラテン語の名前を「〜の」の形でもっています。IAUは、おひつじ座でいちばん明るい星ハマルを例にあげています。この星はアルファ・アリエティス（Alpha Arietis）、つまり「おひつじ座のアルファ」とも呼ばれます。",
          "アルファ・ケンタウリも同じように読めます。ケンタウルス座のアルファです。こうした名前のもとになる88星座のリストは、IAUが1922年に決め、その境界は1928年に決めました。",
        ],
        task: "アルファ・ケンタウリのふるさと、ケンタウルス座を見てみましょう。",
        remember: [
          "Alpha Arietisのような名前は「おひつじ座のアルファ」という意味です。",
          "ギリシャ文字のあとに、星座のラテン語の「〜の」の形が来ます。",
          "IAUは1922年に88星座を決めました。",
        ],
        you: (name, gen) => `あなたが生まれたとき、太陽は${name}にありました。その星はラテン語でAlpha ${gen}、Beta ${gen}のように呼ばれます。`,
        ref: (name, gen) => `4月1日、太陽は${name}にあります。その星はラテン語でAlpha ${gen}、Beta ${gen}のように呼ばれます。`,
      },
      nameCatalog: {
        title: "カタログと望遠鏡", goal: "名前の中のHD、GJ、HIP、TOI、Kepler、TRAPPISTの意味を知っています。",
        text: [
          "ほとんどの恒星には固有の名前がなく、カタログの番号があります。NASAによると、惑星の名前の最初の部分はふつう、それを見つけた望遠鏡や観測計画、またはその恒星のカタログです。HDはヘンリー・ドレイパー星表、GJはヴィルヘルム・グリーゼとハルトムート・ヤーライスの近くの星のカタログ、HIPはESAの衛星ヒッパルコスのカタログです。",
          "KeplerはNASAのケプラー宇宙望遠鏡（2009年〜2018年）、TOIは「TESS Objects of Interest」、つまりNASAの衛星TESSの候補です。TRAPPISTはチリにある小さな望遠鏡で、TRAPPIST-1という系の名前のもとになりました。",
        ],
        task: "望遠鏡から名前がついたTRAPPIST-1を見てみましょう。",
        remember: [
          "名前の最初には、ふつうカタログ、望遠鏡、観測計画の名前があります。",
          "HDはヘンリー・ドレイパー星表、GJはグリーゼとヤーライスの近くの星のカタログです。",
          "TOIは衛星TESSの候補、TRAPPISTはチリの望遠鏡です。",
        ],
        cat: {
          HD: "HDはヘンリー・ドレイパー星表です。", GJ: "GJ（またはGl、Gliese）は、グリーゼとヤーライスの近くの星のカタログです。",
          HIP: "HIPは衛星ヒッパルコスのカタログです。", TOI: "TOIは衛星TESSの候補です。",
          Kepler: "Keplerはケプラー宇宙望遠鏡です。", TRAPPIST: "TRAPPISTはチリの望遠鏡です。",
          other: "その名前は別のカタログから来ているか、固有の名前です。",
        },
        you: (star, what) => `あなたの星は${star}です。${what}`,
        ref: (star, what) => `たとえば${star}。${what}`,
      },
      nameStories: {
        title: "物語のある名前", goal: "宇宙の固有の名前がどこから来て、だれがつけるのかを知っています。",
        text: [
          "太陽系の惑星には古い名前があります。NASAによると、地球以外のすべての惑星は、ローマの神または女神から名前がつけられました。たとえば火星（マーズ）はローマの戦いの神です。",
          "系外惑星も固有の名前をもらえます。IAUの公開コンテストで、太陽に似た恒星のまわりで最初に見つかった巨大惑星ペガスス座51番星b（1995年）はディミディウム、その恒星はヘルヴェティオスと名づけられました。こうした名前は科学的な符号にとってかわるものではありません。そして星の名前は買えません。IAUは名前を売らず、そうした商売とは関係ないとしています。",
        ],
        task: "ディミディウムと呼ばれる惑星、ペガスス座51番星bを見てみましょう。",
        remember: [
          "NASAによると、地球以外のすべての惑星はローマの神または女神の名前です。",
          "ペガスス座51番星bはディミディウム、その恒星はヘルヴェティオスとも呼ばれます。",
          "IAUは星の名前を売りません。",
        ],
        you: (before, at) => (before != null ? `ペガスス座51番星bは1995年、あなたが生まれる${before}年前に見つかりました。` : at === "0" ? "ペガスス座51番星bは1995年、あなたが生まれた年に見つかりました。" : `ペガスス座51番星bは1995年、あなたが${at}歳のときに見つかりました。`),
        ref: (ago) => `ペガスス座51番星bは1995年、いまから${ago}年前に見つかりました。`,
      },
      zodWhat: {
        title: "星座とは？", goal: "星座とは何か、そしてその星たちがなぜ仲間ではないのかを知っています。",
        text: [
          "星座とは、空で形をつくっているように見え、名前がつけられた星のグループです。NASAによると、いま公式に認められている星座は88あります。",
          "星座の星どうしはつながっていません。近い星もあれば、とても遠い星もあります。たとえばおうし座の星は、この地図のヒッパルコスのデータによると、私たちから46光年から484光年のところにあります。地球から見たときだけ、絵のように見えるのです。",
        ],
        task: "あなたの星座（誕生日がなければ例）を見て、横から見てみましょう。すると形がばらばらになります。",
        remember: [
          "星座とは、形と名前のある星のグループです。",
          "公式に認められた星座は88あります。",
          "星座の星はそれぞれちがう距離にあり、仲間ではありません。",
        ],
        you: (name, near, far) => (near == null ? `あなたが生まれたとき、太陽は${name}にありました。` : `あなたが生まれたとき、太陽は${name}にありました。その星たちは近くに見えますが、いちばん近い星は${near}光年${far ? `、いちばん遠い星は${far}光年` : ""}はなれています。`),
        ref: (name, near, far) => (near == null ? `4月1日、太陽は${name}にあります。` : `4月1日、太陽は${name}にあります。その星たちは近くに見えますが、いちばん近い星は${near}光年${far ? `、いちばん遠い星は${far}光年` : ""}はなれています。`),
      },
      zodPath: {
        title: "太陽の通り道", goal: "太陽が1年に通る星座と、13番めの星座を知っています。",
        text: [
          "地球は1年で太陽のまわりを1周します。地球から見ると、太陽が星の前を動いて、黄道の星座を通っていくように見えます。だから夜に見える星座は季節によって変わります。太陽のうしろにある星座は見えません。",
          "国際天文学連合（IAU）の境界によると（この地図も使っています）、太陽が通る星座は12ではなく13です。13番めはへびつかい座で、太陽は11月30日ごろから12月17日ごろまで、その星の前にあります。星占いにはこの星座がありません。",
        ],
        task: "太陽の通り道にある13番めの星座、へびつかい座を見てみましょう。",
        remember: [
          "太陽は1年で、12ではなく13の星座の前を通ります。",
          "13番めはへびつかい座で、11月30日ごろから12月17日ごろまでです。",
          "夜に見える星座は季節によって変わります。",
        ],
        you: (n) => `あなたが生まれてから、太陽はへびつかい座を約${n}回通りました。毎年1回です。`,
        ref: (n) => `30年のあいだに、太陽はへびつかい座を${n}回通ります。毎年1回です。`,
      },
      zodShift: {
        title: "星占いの星座と本当の星座", goal: "あなたの星占いの星座と、太陽のうしろの星座がたいていずれる理由を知っています。",
        text: [
          "星占いの星座（黄道十二宮）は本当の星座ではありません。太陽の通り道を、春分から数えて30度ずつ、12の同じ大きさに分けたものです。本当の星座は、大きさがまちまちです。",
          "さらに地球の自転軸は、こまのようにゆっくりとみそすり運動をしています。NASAによると、1回の首振りには約25,800年かかります。軸といっしょに春分の位置が星の前を動き、星占いの星座もいっしょに動きます。そのため、あなたの誕生日に太陽が前にある星座は、たいてい星占いの星座とはちがいます。",
        ],
        task: "あなたの星占いの星座と同じ名前の星座を見て、太陽が本当にあった星座とくらべてみましょう。",
        remember: [
          "星占いの星座はちょうど30度、本当の星座は大きさがまちまちです。",
          "地球の軸は首振り運動をし、1回に約25,800年かかります。",
          "だから星占いの星座と本当の星座は、たいていずれます。",
        ],
        you: (sign, real, same) => (same ? `あなたの場合は一致しています。星占いの星座は${sign}で、生まれたとき太陽も${real}にありました。` : `あなたの星占いの星座は${sign}です。でも生まれたとき、太陽は${real}の星の前にありました。`),
        ref: (sign, real) => `4月1日生まれの人の星占いの星座は${sign}です。でもその日、太陽は${real}にあります。`,
      },
      zodScience: {
        title: "天文学と星占い", goal: "天文学と星占いを区別できます。",
        text: [
          "天文学は、宇宙にあるすべてのものを調べる科学です。科学の方法にしたがい、証拠とデータで決め、どの主張もたしかめることができます。",
          "星占いは別のものです。星や惑星の位置が未来を予言したり、人がどんな人かを表したりできる、という信念にもとづいています。いくつかの文化の伝統では大切なものですが、NASAによると、その主張は科学的な証拠にもとづいていません。",
        ],
        task: "このステップには3D表示での課題がありません。問題に答えれば、ステップ完了です。",
        remember: [
          "天文学は科学で、証拠とデータで決めます。",
          "星占いは信念で、その主張は科学的な証拠にもとづいていません。",
          "星占いの星座が人について何かを語るということは、科学ではたしかめられていません。",
        ],
        you: (sign) => `あなたの星占いの星座${sign}があなたについて何かを語るということは、科学ではたしかめられていません。本当の姿は、太陽の通り道の30度ぶんの区間です。`,
        ref: (sign) => `${sign}のような星占いの星座が人について何かを語るということは、科学ではたしかめられていません。本当の姿は、太陽の通り道の30度ぶんの区間です。`,
      },
      zodLight: {
        title: "あなたの星座の光", goal: "星を、何年も前の姿で見ていることを知っています。",
        text: [
          "1光年は、光が1年で進む距離です。46光年はなれた星の光は、46年かけて私たちにとどきます。私たちはその星の46年前の姿を見ているのです。",
          "1つの星座の中でも、光の年齢はちがいます。おうし座では、いちばん近い星の光は46年、いちばん遠い星の光は500年近くかけてとどきます。星座を見ることは、たくさんのちがう時代を見ることなのです。",
        ],
        task: "あなたの星座を横から見てみましょう。その中の星はそれぞれ、ちがう時代を見せてくれます。",
        remember: [
          "1光年は距離で、光が1年で進む長さです。",
          "私たちは星を、その光が出発したときの姿で見ています。",
          "1つの星座の星の光は、それぞれ年齢がちがいます。",
        ],
        you: (name, ly, before, at) => (ly == null ? `あなたが生まれたときに太陽があった${name}の星の光は、それぞれ年齢がちがいます。` : before != null ? `${name}でいちばん近い星の光は${ly}年かけてとどいています。あなたが生まれる${before}年前に出発しました。` : at === "0" ? `${name}でいちばん近い星の光は${ly}年かけてとどいています。あなたが生まれた年に出発しました。` : `${name}でいちばん近い星の光は${ly}年かけてとどいています。あなたが${at}歳のときに出発しました。`),
        ref: (name, ly) => (ly == null ? `4月1日、太陽は${name}にあります。その星の光は、それぞれ年齢がちがいます。` : `4月1日、太陽は${name}にあります。そのいちばん近い星の光は、${ly}年かけて私たちにとどいています。`),
      },
      habWhat: {
        title: "「住める」とはどういうこと？", goal: "ハビタブルゾーンと、液体の水が大切な理由を説明できます。",
        text: [
          "NASAはハビタブルゾーンを、まわる惑星の表面に液体の水が存在しうる、恒星からの距離と定義しています。液体の水は、私たちの知る生命にとって欠かせません。",
          "でもNASAによれば、ゾーンは最初のふるい分けにすぎません。惑星には、ちょうどよい大きさ、ちょうどよい大気、そしてフレアで惑星を不毛にしない穏やかな恒星も必要です。",
        ],
        task: "生命が知られている唯一の惑星、地球まで飛んでみましょう。",
        remember: [
          "ハビタブルゾーン：惑星の表面に液体の水が存在しうる、恒星からの距離の範囲です。",
          "液体の水は、私たちの知る生命にとって欠かせません。",
          "ゾーンは最初のふるい分けにすぎず、大きさ、大気、穏やかな恒星も大切です。",
        ],
        you: (n) => `生まれてから、あなたは地球とともに太陽のまわりを${n}周しました。ずっとハビタブルゾーンの中で。`,
        ref: (n) => `30年のあいだに、人は地球とともに太陽のまわりを${n}周します。ずっとハビタブルゾーンの中で。`,
      },
      habZone: {
        title: "ハビタブルゾーン", goal: "ハビタブルゾーンが恒星ごとにちがう理由がわかります。",
        text: [
          "ハビタブルゾーンは恒星によって変わります。熱い恒星のまわりでは広く、赤色矮星のまわりではせまく、恒星のすぐ近くにあります。",
          "たとえばTOI-700 dは、小さなM型星のまわりをたった37.4日でまわり、そのハビタブルゾーンの中にあります。3D表示では、緑の輪が恒星系のハビタブルゾーンを示します。",
        ],
        task: "TOI-700 dまで飛んで、ハビタブルゾーンの緑の輪を見てみましょう。",
        remember: [
          "熱い恒星のまわりでは、ハビタブルゾーンは広くなります。",
          "赤色矮星のまわりでは、せまく、恒星のすぐ近くにあります。",
          "TOI-700 dは37.4日で小さな恒星をまわります。",
        ],
        you: (n) => `TOI-700 dでは、あなたは${n}歳です。そこでの1年は37.4日だからです。`,
        ref: (n) => `30歳の人は、TOI-700 dでは${n}歳です。そこでの1年は37.4日だからです。`,
      },
      habWater: {
        title: "液体の水", goal: "水がさがされる理由と、私たちの太陽系のどこに海があるかもしれないかがわかります。",
        text: [
          "水は地球上のすべての生命に欠かせません。大人の体の最大60 %は水です。だから生命さがしは、まず液体の水さがしなのです。",
          "海は氷の下にかくれていることもあります。木星の衛星エウロパには塩水の海があるという強い証拠があり、土星の衛星エンケラドゥスは内部に全球的な海をもち、水蒸気と氷の粒を宇宙へふき出しています。",
        ],
        task: "木星まで飛んで、衛星エウロパをクリックしてみましょう。",
        remember: [
          "水は地球上のすべての生命に欠かせません。大人の体の最大60 %は水です。",
          "木星の衛星エウロパには塩水の海がある強い証拠があります。",
          "土星の衛星エンケラドゥスには全球的な海と、水蒸気と氷のふき出しがあります。",
        ],
        you: (n) => `あなたが生まれてから、海をもつ衛星エウロパは木星のまわりを${n}周しました。`,
        ref: (n) => `30年のあいだに、海をもつ衛星エウロパは木星のまわりを${n}周します。`,
      },
      habAtmos: {
        title: "大気", goal: "惑星の大気が、水が液体のままでいられるかを決める理由を説明できます。",
        text: [
          "金星は、大気がどれほど大切かを示しています。おもに二酸化炭素からなる厚い大気が暴走温室効果で熱を閉じこめ、地表は約467℃です。",
          "火星は逆の極端です。大気がうすすぎて、液体の水は長くは存在できません。地球はその中間にあり、それが水がここで液体のままでいられる理由のひとつです。",
        ],
        task: "大気が多すぎる惑星、金星まで飛んでみましょう。",
        remember: [
          "金星：二酸化炭素の厚い大気が熱を閉じこめ、地表は約467℃です。",
          "火星：大気がうすすぎて、液体の水は長くはもちません。",
          "惑星の大気が、水が液体のままでいられるかを決めます。",
        ],
        you: (n) => `金星では、あなたは${n}歳です。大気が熱を閉じこめる世界で。`,
        ref: (n) => `30歳の人は、金星では${n}歳です。大気が熱を閉じこめる世界で。`,
      },
      habIngredients: {
        title: "生命の材料", goal: "私たちが知っている生命に何が必要か、そして探査車キュリオシティが火星で何を見つけたかを知っています。",
        text: [
          "私たちが知っている生命には、液体の水、化学的な材料、そしてエネルギー源が必要です。NASAは、液体の水を、私たちが知っている生命に欠かせない材料と呼んでいます。",
          "探査車キュリオシティは2018年、火星のゲール・クレーターで、かつての湖の底だった30億年前の岩石から有機分子を見つけました。NASAによると、この湖には化学的な材料やエネルギー源など、生命に必要な材料がすべてそろっていました。ただし、有機分子は生命がなくてもできることがあり、生命の証拠ではありません。",
        ],
        task: "キュリオシティが有機分子を見つけた火星へ飛んでみましょう。",
        remember: [
          "私たちが知っている生命には、液体の水、化学的な材料、エネルギーが必要です。",
          "キュリオシティは2018年、火星の30億年前の岩石から有機分子を見つけました。",
          "有機分子は生命の証拠ではありません。生命がなくてもできることがあります。",
        ],
        you: (n) => `キュリオシティが分子を見つけた岩石は約30億年前のもので、あなたの年齢の約${n}倍です。`,
        ref: (n) => `キュリオシティが分子を見つけた岩石は約30億年前のもので、30歳の人の年齢の約${n}倍です。`,
      },
      habExtreme: {
        title: "地球の極限の生命", goal: "私たちには無理な場所で生きる生き物を知っています。",
        text: [
          "極端な温度や酸性度、放射線など、住めるかどうかの限界で生きる生き物を極限環境生物といいます。2026年、NASAは、カリフォルニアの温泉にすむアメーバが63 °Cでもまだ分裂すると伝えました。核をもつ既知のすべての生き物の中での記録です。",
          "海底の熱水噴出孔からは、400 °Cをこえる熱水が噴き出しています。NOAAによると、そこの生き物たちはおもに化学合成で生きています。細菌が、ふつうは太陽の光のないところで、化学反応からエネルギーを得るのです。ジャイアントチューブワームはそこで、地球上の海の無脊椎動物でいちばん速く成長します。",
        ],
        task: "木星の衛星エウロパへ飛んでみましょう。氷の下に海があると考えられています。そこに生命がいるかどうかは、だれにもわかりません。",
        remember: [
          "極限環境生物は、極端な温度や酸性度、放射線の中で生きています。",
          "温泉にすむアメーバは、63 °Cでもまだ分裂します。",
          "熱水噴出孔では、生き物たちが太陽の光なしに、化学合成で生きています。",
        ],
        you: () => "63 °Cのお湯は、あなたがお風呂に入るには熱すぎます。でもこのアメーバは、その中でまだ分裂します。",
        ref: () => "63 °Cのお湯は、だれにとってもお風呂には熱すぎます。でもこのアメーバは、その中でまだ分裂します。",
      },
      habLife: {
        title: "宇宙に生命はいるの？", goal: "科学者がどのように生命をさがしているか、そしてその答えがまだ出ていないことがわかります。",
        text: [
          "今のところ、私たちが知っている生命は地球だけです。ここでは海底の超高温の噴出口でさえ生命が栄えていて、ほかの場所のふしぎな環境にも生命がいるかもしれないという希望を与えてくれます。",
          "ジェームズ・ウェッブ宇宙望遠鏡は、地球ほどの大きさの系外惑星の大気にある気体を初めて垣間見るかもしれません。酸素、二酸化炭素、メタンがそろえば、生命の可能性を強く示すでしょう。見つかるかどうかは、まだわからない問いです。",
        ],
        task: "地図でいちばん近い候補、プロキシマbまで飛んでみましょう。",
        remember: [
          "今のところ、生命が知られているのは地球だけです。",
          "地球の生命は、海底の超高温の噴出口にさえいます。",
          "系外惑星の大気の気体（酸素、二酸化炭素、メタンがそろうこと）が生命の手がかりになるかもしれません。答えはまだわかりません。",
        ],
        you: (at, now, year) => `あなたが生まれた${year}年、この地図にはハビタブルゾーンの候補が${at}個ありました。今日は${now}個です。`,
        ref: (at, now, year) => `いま30歳の人が生まれた${year}年、この地図にはハビタブルゾーンの候補が${at}個ありました。今日は${now}個です。`,
      },
    },
    q: {
      sunLight: { q: "太陽の光が地球に届くまでどれくらいかかりますか？", o: ["約8分", "約8秒", "約8時間"], e: "約8分20秒です。太陽は1億5000万キロメートル離れていて、光は1秒に約30万キロメートル進みます。" },
      sunEnergy: { q: "太陽のエネルギーはどこから来ますか？", o: ["中心部で水素がヘリウムに融合すること", "石炭やガスが燃えること", "ほかの星の光"], e: "太陽の中心部では水素の原子核が融合してヘリウムになります。これが核融合で、そのとき輝くエネルギーが生まれます。" },
      sunOrbits: { you: "生まれてから、あなたは地球とともに太陽のまわりを何周しましたか？", ref: "30歳の人は、太陽のまわりを何周していますか？", e: (n) => `${n}周です。地球は1年に1回太陽のまわりを回り、あなたもいっしょに旅しています。` },
      venusDay: { q: "1日が1年より長いのはどの惑星ですか？", o: ["金星", "水星", "火星"], e: "金星はとてもゆっくり自転していて、1回の自転に太陽を1周するより長い時間がかかります。" },
      marsAge: { you: "火星では、あなたは何歳ですか？", ref: "30歳の人は、火星では何歳ですか？", e: (n) => `${n}歳です。火星の1年は地球の1.88年なので、誕生日が少なくなります。` },
      closest: { q: "太陽にいちばん近い惑星はどれですか？", o: ["水星", "金星", "地球"], e: "水星で、距離は0.39 auです。88日で太陽を1周します。" },
      largest: { q: "いちばん大きな惑星はどれですか？", o: ["木星", "土星", "海王星"], e: "木星です。直径に地球が約11個並びます。" },
      saturnDensity: { q: "水より密度が小さい惑星はどれですか？", o: ["土星", "木星", "天王星"], e: "土星です。平均密度が水より小さいのです。" },
      jupiterLaps: { you: "あなたが生まれてから、木星は太陽のまわりを何周しましたか？", ref: "30年のあいだに、木星は太陽のまわりを何周しますか？", e: (n) => `${n}周です。木星の1年は地球の約12年です。` },
      largestMoon: { q: "太陽系でいちばん大きな衛星はどれですか？", o: ["ガニメデ", "月", "エウロパ"], e: "木星の衛星ガニメデです。惑星の水星より大きいのです。" },
      galileo: { q: "1610年に木星の4つの大きな衛星を発見したのはだれですか？", o: ["ガリレオ・ガリレイ", "アイザック・ニュートン", "ヨハネス・ケプラー"], e: "初期の望遠鏡を使ったガリレオ・ガリレイです。これらはガリレオ衛星と呼ばれます。" },
      sameSide: { q: "なぜ月はいつも同じ面を地球に向けているのですか？", o: ["1周するあいだにちょうど1回自転するから", "まったく自転していないから", "裏側はいつも暗いから"], e: "月は地球を1周するあいだに1回自転するので、いつも同じ面がこちらを向いています。裏側にも太陽の光は当たります。" },
      dwarf: { q: "次のうち準惑星はどれですか？", o: ["冥王星", "火星", "海王星"], e: "冥王星です。2006年から、小惑星帯のケレスと同じく準惑星とされています。" },
      moonLaps: { you: "あなたが生まれてから、月は地球のまわりを約何周しましたか？", ref: "30年のあいだに、月は地球のまわりを約何周しますか？", e: (n) => `約${n}周です。1周は27.3日です。` },
      neptune: { q: "海王星は太陽からおよそどれくらい離れていますか？", o: ["30 au", "3 au", "300 au"], e: "約30 auで、地球の30倍の距離です。太陽の光が届くまで約4時間かかります。" },
      starLight: { you: (name) => `あなたの星${name}の光は、あなたに届くまで何年旅しましたか？`, e: (n, name) => `約${n}年です。${name}までは約${n}光年で、1光年は光が1年に進む距離です。` },
      proximaLight: { q: "太陽の次に近い恒星プロキシマ・ケンタウリの光は、私たちに届くまでどれくらいかかりますか？", o: ["約4.2年", "約4.2日", "約42年"], e: "約4.2年です。プロキシマ・ケンタウリまでは4.24光年です。" },
      sunSize: { q: "太陽の直径には、地球がおよそいくつ並びますか？", o: ["約109個", "約11個", "約1000個"], e: "約109個です。太陽の半径は地球の約109倍です。" },
      asteroidBelt: { q: "ほとんどの小惑星は、どこで太陽のまわりを回っていますか？", o: ["火星と木星のあいだ", "地球と火星のあいだ", "土星と天王星のあいだ"], e: "火星と木星のあいだの小惑星帯です。その中で最大の天体ケレスは準惑星です。" },
      cometTail: { q: "彗星の尾はどちらを向いていますか？", o: ["太陽と反対の方向", "太陽の方向", "いつも地球の方向"], e: "太陽と反対の方向です。太陽の光と太陽風が、コマのちりとガスを太陽から吹き流すからです。" },
      nearestStar: { q: "太陽の次に近い恒星はどれですか？", o: ["プロキシマ・ケンタウリ", "シリウス", "北極星"], e: "プロキシマ・ケンタウリで、約4.2光年の距離です。" },
      lightYear: { q: "光年とは何ですか？", o: ["距離：光が1年に進む距離", "時間：宇宙での1年", "星の年齢"], e: "距離です。光は1年に約9兆5000億キロメートル進みます。" },
      pairPeriod: { q: "アルファ・ケンタウリAとBがたがいのまわりを1周するのに、どれくらいかかりますか？", o: ["約80年", "約80日", "約8000年"], e: "約80年です。いちばん近づくときの間隔は、地球と太陽の距離の約11倍です。" },
      pairSun: { q: "私たちの太陽と同じタイプの星はどれですか？", o: ["アルファ・ケンタウリA", "アルファ・ケンタウリB", "プロキシマ・ケンタウリ"], e: "アルファ・ケンタウリAです。太陽と同じG2型で、少し大きい星です。" },
      constellation: { q: "ケンタウルス座アルファ星は、どの星座にありますか？", o: ["ケンタウルス座", "オリオン座", "おおぐま座"], e: "ケンタウルス座です。" },
      redDwarf: { q: "プロキシマ・ケンタウリはどんな星ですか？", o: ["赤色矮星", "赤色巨星", "太陽のような星"], e: "赤色矮星です。小さく、温度が低く、太陽よりずっと暗い星です。" },
      proximaEye: { q: "プロキシマ・ケンタウリは肉眼で見えますか？", o: ["いいえ、暗すぎます", "はい、空でいちばん明るい星です", "昼間だけ見えます"], e: "いいえ。いちばん近い恒星ですが、肉眼で見るには暗すぎます。" },
      thirdStar: { q: "ケンタウルス座アルファ星にはいくつの星がありますか？", o: ["3つ", "2つ", "1つ"], e: "3つです。アルファ・ケンタウリAとB、そしていちばん暗いプロキシマ・ケンタウリです。" },
      proximaBYear: { q: "プロキシマbの1年はどれくらいですか？", o: ["約11日", "約11か月", "約11年"], e: "約11.2日です。それほど速く星のまわりをまわっています。" },
      habitable: { q: "「ハビタブルゾーンにある」とはどういう意味ですか？", o: ["条件がそろえば液体の水がありえる", "そこで生命が見つかった", "その惑星にはかならず空気がある"], e: "温度が液体の水を許すかもしれない、という意味だけです。プロキシマbに空気や水、生命があるかはわかっていません。" },
      howFound: { q: "プロキシマbはどのように見つかりましたか？", o: ["星のわずかなゆれから", "惑星の写真から", "電波信号から"], e: "惑星に引っぱられてゆれる星の、光のわずかなずれから見つかりました。" },
      voyagerSpeed: { q: "ボイジャー1号は、およそどれくらいの速さで太陽から遠ざかっていますか？", o: ["秒速約17キロメートル", "時速約17キロメートル", "秒速約1万7000キロメートル"], e: "秒速約17キロメートル、時速6万1000キロメートル以上です。" },
      travelTime: { q: "ボイジャー1号がプロキシマ・ケンタウリに着くには、およそどれくらいかかりますか？", o: ["約7万5000年", "約750年", "約750万年"], e: "約7万5000年です。4.2光年を秒速17キロメートルで進んだ場合です。" },
      proximaLeft: { you: "今日あなたに届いたプロキシマの光が出発したとき、あなたは何歳でしたか？", ref: "いま私たちに届いたプロキシマの光が出発したとき、いま30歳の人は何歳でしたか？", e: (n) => `${n}歳です。光は約4.2年前に出発しました。` },
      lightTrips: { you: "あなたのこれまでの人生で、光はプロキシマから私たちまでの道のりを何回進めたでしょうか？", ref: "30年のあいだに、光はプロキシマから私たちまでの道のりを何回進めますか？", e: (n) => `${n}回です。その道のりには約4.2年かかります。` },
      proximaBAge: { you: "プロキシマbでは、あなたは何歳ですか？", ref: "30歳の人は、プロキシマbでは何歳ですか？", e: (n) => `${n}歳です。プロキシマbの1年はたった11.2日です。` },
      lifetimes: { you: "ボイジャー1号の速さでの旅は、あなたのこれまでの人生の何倍かかりますか？", ref: "ボイジャー1号の速さでの旅は、30歳の人の人生の何倍かかりますか？", e: (n) => `約${n}倍です。旅は約7万5000年かかります。` },
      exoDefinition: { q: "系外惑星とは何ですか？", o: ["太陽系の外にある惑星", "大きな惑星の衛星", "光をもたない恒星"], e: "太陽系の外にある惑星です。ふつうはほかの恒星をまわっています。" },
      firstSunLike: { q: "太陽のような恒星をまわる惑星が初めて見つかったのは何年ですか？", o: ["1995年", "1965年", "2015年"], e: "1995年、ペガスス座51番星bです。発見者は2019年にノーベル物理学賞を受賞しました。" },
      firstPulsar: { q: "1992年に最初の系外惑星が見つかったのは、どんな天体のまわりですか？", o: ["パルサー", "太陽のような恒星", "ブラックホール"], e: "パルサーです。その3年後、太陽のような恒星をまわる初めての惑星、ペガスス座51番星bが見つかりました。" },
      transitDim: { q: "トランジット法は何を測りますか？", o: ["惑星が前を横切るときの、恒星のわずかな減光", "惑星そのものの光", "惑星からの電波"], e: "惑星が前を横切るあいだ、恒星がわずかに暗くなることです。" },
      wobble: { q: "視線速度法は何をさがしますか？", o: ["惑星に引っぱられた恒星のゆれ", "地球にうつる影", "惑星の衛星"], e: "恒星のゆれです。その光が少し青や赤の方へずれます。" },
      mostMethod: { q: "知られている系外惑星の多くは、どの方法で見つかりましたか？", o: ["トランジット法", "視線速度法", "写真"], e: "トランジット法です。この地図では6,423個のうち4,770個です。" },
      superEarth: { q: "スーパーアースとは何ですか？", o: ["地球より重く、海王星より軽い惑星", "超高温の核をもつ惑星", "木星より大きい惑星すべて"], e: "地球より重く、海王星より軽い惑星で、ガスや岩石、またはその両方でできていることがあります。" },
      terrestrialMade: { q: "地球型惑星は何でできていますか？", o: ["岩石、ケイ酸塩、水、炭素など", "おもに水素とヘリウム", "氷だけ"], e: "岩石、ケイ酸塩、水、炭素などです。地球と同じくらいかそれより小さい惑星です。" },
      trappistSeven: { q: "TRAPPIST-1のまわりには、地球ほどの大きさの惑星がいくつありますか？", o: ["7つ", "2つ", "12個"], e: "7つです。約40光年離れた小さな赤色矮星のまわりをまわっています。" },
      hotJupiter: { q: "ホット・ジュピターとは何ですか？", o: ["恒星のすぐ近くをまわる巨大ガス惑星", "火山のある木星", "木星のように見える恒星"], e: "ペガスス座51番星bのように、恒星のすぐ近くをまわる巨大ガス惑星です。" },
      pegYear: { q: "ペガスス座51番星bの1年はどれくらいですか？", o: ["約4日", "約4年", "約40年"], e: "約4.2日です。" },
      gasGiantSize: { q: "巨大ガス惑星はどれくらいの大きさですか？", o: ["土星や木星くらいか、それよりずっと大きい", "地球くらい", "月くらい"], e: "土星や木星くらいか、それよりずっと大きい惑星です。" },
      lavaWorld: { q: "NASAによると、かに座55番星eをおおっているものは何ですか？", o: ["全体をおおう溶岩の海", "厚い氷の層", "森"], e: "全体をおおう溶岩の海です。超高温の世界です。" },
      rogue: { q: "すべての系外惑星が恒星をまわっていますか？", o: ["いいえ、太陽をもたずに銀河をさまよう惑星もあります", "はい、すべてです", "どれもまわっていません"], e: "いいえ。ふつうは恒星をまわっていますが、太陽をもたずに永遠の暗闇の中をさまよう惑星もあります。" },
      keplerScope: { q: "トランジット法で何千個もの系外惑星を見つけた宇宙望遠鏡はどれですか？", o: ["ケプラー", "ハッブル", "ボイジャー"], e: "NASAのケプラー宇宙望遠鏡です。" },
      knownAtBirth: { you: "あなたが生まれた年までに、このカタログの惑星はいくつ見つかっていましたか？", ref: "いま30歳の人が生まれた年までに、このカタログの惑星はいくつ見つかっていましたか？", e: (n) => `${n}個です。カタログは毎年増えています。` },
      transitSince: { you: "あなたが生まれた年から、このカタログの惑星はいくつトランジット法で見つかりましたか？", ref: "この30年で、このカタログの惑星はいくつトランジット法で見つかりましたか？", e: (n) => `${n}個です。その多くはケプラー望遠鏡によるものです。` },
      trappistAge: { you: "TRAPPIST-1eでは、あなたは何歳ですか？", ref: "30歳の人は、TRAPPIST-1eでは何歳ですか？", e: (n) => `${n}歳です。TRAPPIST-1eの1年は6.1日です。` },
      pegAge: { you: "ペガスス座51番星bでは、あなたは何歳ですか？", ref: "30歳の人は、ペガスス座51番星bでは何歳ですか？", e: (n) => `${n}歳です。ペガスス座51番星bの1年は4.2日です。` },
      cancriAge: { you: "かに座55番星eでは、あなたはもう何回誕生日を迎えていますか？", ref: "30歳の人は、かに座55番星eではもう何回誕生日を迎えていますか？", e: (n) => `${n}回です。かに座55番星eの1年は18時間足らずです。` },
      hzDef: { q: "ハビタブルゾーンとは何ですか？", o: ["惑星の表面に液体の水が存在しうる、恒星からの距離", "惑星の中で人が住んでいる部分", "ブラックホールのまわりの領域"], e: "NASAの定義では、惑星の表面に液体の水が存在しうる、恒星からの距離です。" },
      waterNeed: { q: "科学者がまず液体の水をさがすのはなぜですか？", o: ["私たちの知る生命に欠かせないから", "惑星を光らせるから", "惑星を軌道にとどめるから"], e: "液体の水は、私たちの知る生命に欠かせません。" },
      firstCut: { q: "ハビタブルゾーンにある惑星はすべて住めますか？", o: ["いいえ、ゾーンは最初のふるい分けにすぎません", "はい、いつも住めます", "衛星があるときだけ"], e: "いいえ。大きさ、大気、穏やかな恒星も大切です。" },
      zoneHot: { q: "ハビタブルゾーンが広いのは、どんな恒星のまわりですか？", o: ["熱い恒星", "冷たい恒星", "どの恒星でも同じ"], e: "熱い恒星のまわりです。" },
      redDwarfZone: { q: "赤色矮星のハビタブルゾーンはどこにありますか？", o: ["せまく、恒星のすぐ近く", "恒星から遠く", "赤色矮星にはない"], e: "せまく、恒星のすぐ近くです。その惑星は数日から数週間で恒星をまわります。" },
      toiYear: { q: "TOI-700 dの1年はどれくらいですか？", o: ["約37日", "約37年", "約37時間"], e: "約37.4日です。" },
      europaOcean: { q: "エウロパの表面の下には、何がある強い証拠がありますか？", o: ["塩水の海", "溶岩の海", "凍った森"], e: "塩水の海です。" },
      enceladusJets: { q: "エンケラドゥスのふき出しは、宇宙へ何をふき出していますか？", o: ["水蒸気と氷の粒", "溶岩", "砂"], e: "内部の海から来る、水蒸気と氷の粒です。" },
      bodyWater: { q: "USGSによると、大人の体のどれくらいが水ですか？", o: ["最大60 %", "約10 %", "95 %以上"], e: "最大60 %です。" },
      venusGreenhouse: { q: "金星はなぜそんなに熱いのですか？", o: ["二酸化炭素の厚い大気が熱を閉じこめるから", "太陽にいちばん近い惑星だから", "いたるところに火山があるから"], e: "厚い大気が暴走温室効果で熱を閉じこめるからです。水星のほうが太陽に近いのに、金星ほど熱くありません。" },
      marsThin: { q: "今の火星で、液体の水が長くもたないのはなぜですか？", o: ["大気がうすすぎるから", "水がまったくないから", "太陽に近すぎるから"], e: "大気がうすすぎて、液体の水が長く存在できないからです。" },
      venusTemp: { q: "金星の地表はおよそ何度ですか？", o: ["約467℃", "約46℃", "約-46℃"], e: "約467℃です。" },
      onlyEarth: { q: "今のところ、生命が知られているのはどこですか？", o: ["地球だけ", "火星", "プロキシマb"], e: "今のところ地球だけです。" },
      vents: { q: "地球の生命が超高温の噴出口で栄えているのはどこですか？", o: ["海底", "山の頂上", "雲の中"], e: "海底です。ほかのふしぎな場所にも生命がいるかもしれないという手がかりです。" },
      biosignature: { q: "地球ほどの大きさの系外惑星の大気の気体を初めて垣間見るかもしれない望遠鏡はどれですか？", o: ["ジェームズ・ウェッブ宇宙望遠鏡", "ボイジャー1号", "ガリレオの望遠鏡"], e: "2021年に打ち上げられたジェームズ・ウェッブ宇宙望遠鏡です。" },
      trappistFit: { q: "NASAによると、TRAPPIST-1の7つの惑星はすべてどこにおさまりますか？", o: ["水星の軌道の内側", "木星の軌道の内側", "海王星よりも外側"], e: "水星の軌道の内側です。小さな恒星のすぐ近くをまわっています。" },
      kepler90Eight: { q: "Kepler-90のまわりには、いくつの惑星が知られていますか？", o: ["8つ。太陽系と同じ数", "2つ", "50個"], e: "8つで、太陽系と同じ数です。" },
      kepler90AI: { q: "2017年、Kepler-90の8つめの惑星はどうやって見つかりましたか？", o: ["Googleのニューラルネットワークがケプラーのデータを調べた", "肉眼で", "探査機が飛んでいった"], e: "Googleの人工ニューラルネットワークが、ケプラー望遠鏡のデータを調べて見つけました。" },
      hdBlue: { q: "NASAによると、HD 189733 bは何色ですか？", o: ["コバルトブルー", "炎のような赤", "草のような緑"], e: "コバルトブルーです。かすんだ空には、ガラスをふくむ雲があります。" },
      kepler16Suns: { q: "Kepler-16 bの特別なところは何ですか？", o: ["2つの恒星をまわっている", "恒星がない", "ダイヤモンドでできている"], e: "スター・ウォーズのタトゥイーンのように、2つの恒星を同時にまわっています。" },
      kepler16Saturn: { q: "Kepler-16 bは、大きさと質量が太陽系のどの惑星に似ていますか？", o: ["土星", "地球", "水星"], e: "土星です。" },
      lifeNeeds: { q: "NASAによると、火星のゲール・クレーターにあった昔の湖には何がそろっていましたか？", o: ["化学的な材料やエネルギー源など、生命の材料すべて", "生きた魚", "氷だけ"], e: "生命に必要な材料すべてです。そこに生命がいたかどうかはわかっていません。" },
      marsOrganics: { q: "2018年、キュリオシティは30億年前の岩石から何を見つけましたか？", o: ["有機分子", "骨の化石", "金"], e: "昔の湖の泥岩から、有機分子を見つけました。" },
      organicNotLife: { q: "有機分子は生命の証拠ですか？", o: ["いいえ。生命がなくてもできることがある", "はい、いつも", "火星でだけ"], e: "いいえ。よく生命と結びつけられますが、生命がなくてもできることがあります。" },
      extremophile: { q: "住めるかどうかの限界で生きる生き物を何といいますか？", o: ["極限環境生物", "系外惑星", "小惑星"], e: "極限環境生物です。極端な温度や酸性度、放射線にたえます。" },
      fireAmoeba: { q: "カリフォルニアの温泉にすむアメーバは、何 °Cまで分裂しますか？", o: ["63 °C", "6 °C", "630 °C"], e: "63 °Cです。核をもつ既知のすべての生き物の中での記録です。" },
      chemosynthesis: { q: "深海の熱水噴出孔の生き物たちは、どこからエネルギーを得ていますか？", o: ["化学反応から。ふつうは太陽の光なしに", "太陽の光から", "月の光から"], e: "化学合成です。細菌が化学反応からエネルギーを得ます。" },
      tubeWorms: { q: "熱水噴出孔で、海のほかのどの無脊椎動物よりも速く成長する生き物は？", o: ["ジャイアントチューブワーム", "クラゲ", "ヒトデ"], e: "ジャイアントチューブワームです。" },
      trappistBLaps: { you: "あなたが生まれてから、TRAPPIST-1 bは恒星のまわりを約何回まわりましたか？", ref: "30年のあいだに、TRAPPIST-1 bは恒星のまわりを約何回まわりますか？", e: (n) => `約${n}回です。そこでは1年が1.5日です。` },
      kepler16Age: { you: "Kepler-16 bでは、あなたは何歳ですか？", ref: "30歳の人は、Kepler-16 bでは何歳ですか？", e: (n) => `${n}歳です。Kepler-16 bの1年は229日です。` },
      rockFactor: { you: "キュリオシティが有機分子を見つけた岩石は、あなたの年齢の約何倍古いですか？", ref: "キュリオシティが有機分子を見つけた岩石は、30歳の人の年齢の約何倍古いですか？", e: (n) => `約${n}倍です。約30億年前の岩石です。` },
      nebulaWhat: { q: "NASAによると、星雲とは何ですか？", o: ["宇宙にあるちりとガスの巨大な雲", "霧でおおわれた惑星", "小さな恒星"], e: "宇宙にあるちりとガスの巨大な雲です。" },
      nebulaDeath: { q: "星雲の中には、何からできたものがありますか？", o: ["爆発した死にゆく恒星のガスとちり", "惑星の海", "月"], e: "超新星のような、死にゆく恒星の爆発で放り出されたガスとちりです。" },
      nebulaBirth: { q: "ほかの星雲では何が起きていますか？", o: ["新しい恒星が生まれはじめている", "惑星が死んでいる", "何も起きていない"], e: "新しい恒星が生まれはじめています。" },
      pillarsWhere: { q: "創造の柱はどこにありますか？", o: ["へび座のわし星雲", "火星", "アンドロメダ銀河"], e: "へび座のわし星雲（M16）です。" },
      pillarsDist: { q: "わし星雲までの距離は？", o: ["6,500光年（ESA）または7,000光年（NASA）", "65光年", "650万光年"], e: "ESAは6,500光年、NASAは7,000光年で、ページは一致していません。" },
      pillarsWebb: { q: "2022年に柱の新しい画像を発表した望遠鏡は？", o: ["ウェッブ", "ガリレオの望遠鏡", "TRAPPIST"], e: "ウェッブ宇宙望遠鏡で、2022年10月19日です。" },
      horseType: { q: "馬頭星雲はどんな星雲ですか？", o: ["暗黒星雲", "惑星状星雲", "超新星残骸"], e: "暗黒星雲で、ちりとガスの暗い雲です。" },
      horseWhere: { q: "馬頭星雲はどの星座にありますか？", o: ["オリオン座", "おうし座", "こと座"], e: "オリオン座です。" },
      horseDist: { q: "ESA/ハッブルによると、馬頭星雲までの距離は？", o: ["約1,300光年", "約13光年", "約1300万光年"], e: "約1,300光年です。" },
      ringType: { q: "環状星雲はどんな星雲ですか？", o: ["惑星状星雲", "暗黒星雲", "星のゆりかご"], e: "惑星状星雲です。" },
      ringWhere: { q: "環状星雲はどの星座にありますか？", o: ["こと座", "オリオン座", "アンドロメダ座"], e: "こと座で、約2,000光年はなれています。" },
      ringFrom: { q: "惑星状星雲はどこから来ますか？", o: ["太陽のような死にゆく恒星が放り出した層", "爆発した惑星", "ブラックホール"], e: "太陽のような死にゆく恒星が放り出した外側の層です。" },
      crabType: { q: "かに星雲とは何ですか？", o: ["超新星の残骸", "星のゆりかご", "銀河"], e: "おうし座にある超新星の残骸です。" },
      crabYear: { q: "中国の天文学者が、かに星雲の超新星を見たのはいつですか？", o: ["1054年", "1954年", "紀元前54年"], e: "1054年で、「客星」として見ました。" },
      crabCore: { q: "かに星雲のまんなかには何がありますか？", o: ["高速で回転する中性子星、パルサー", "惑星", "何もない"], e: "高速で回転する中性子星、パルサーです。" },
      mwShape: { q: "天の川銀河はどんな形ですか？", o: ["棒渦巻", "球", "環"], e: "棒渦巻です。渦巻く腕と、まんなかに恒星の棒がある円盤です。" },
      mwSize: { q: "天の川銀河の大きさは？", o: ["10万光年をこえる", "約100光年", "約1億km"], e: "10万光年をこえます。" },
      mwStars: { q: "ESAによると、天の川銀河には恒星がいくつありますか？", o: ["1000億個をこえる", "約8個", "約10万個"], e: "1000億個をこえます。" },
      orionArm: { q: "太陽は天の川銀河のどの腕の近くにありますか？", o: ["オリオン腕", "アンドロメダ腕", "月の腕"], e: "小さな、とぎれた腕、オリオン腕の近くです。" },
      armBetween: { q: "オリオン腕はどの腕のあいだにありますか？", o: ["いて座腕とペルセウス腕", "おうし座とこと座", "ほかの腕はない"], e: "いて座腕とペルセウス腕のあいだです。" },
      centerDist: { q: "天の川銀河の中心までの距離は？", o: ["約26,000〜27,000光年", "約4光年", "約250万光年"], e: "約26,000光年（NASA、8 kpc）から27,000光年（ESO）です。" },
      lapTime: { q: "太陽が中心のまわりを1周するのにかかる時間は？", o: ["約2億3000万〜2億4000万年", "1年", "約46億年"], e: "約2億3000万年（NASAの太陽のページ）または2億4000万年（NASAの銀河のページ、ESA）です。" },
      sunSpeed: { q: "NASAによると、太陽はどれくらいの速さで中心のまわりを旅していますか？", o: ["時速約72万km", "時速約72km", "光の速さ"], e: "平均時速約72万kmです。" },
      lapDiffer: { q: "1周の時間について、NASAとESAのページは何と言っていますか？", o: ["一致していない：2億3000万年か2億4000万年", "みな正確に2億3000万年", "数字がない"], e: "一致していません。あるページは2億3000万年、ほかは2億4000万年です。" },
      bandWhat: { q: "夜空をよこぎる光の帯は何ですか？", o: ["私たちの銀河の円盤", "地球の雲", "月の光"], e: "私たちの銀河の中心の円盤です。" },
      bandEdge: { q: "私たちは天の川銀河の円盤をどこから見ていますか？", o: ["内側から、ふちから", "上から", "銀河の外から"], e: "内側から、ふちから見ています。太陽は円盤の中にあります。" },
      bandDir: { q: "天の川銀河の中心はどの方向にありますか？", o: ["いて座の方向", "アンドロメダの方向", "北極星の方向"], e: "いて座の方向です。" },
      gaiaWhat: { q: "ESAのガイアは何をつくりましたか？", o: ["天の川銀河のくわしい3D地図", "はじめてのブラックホールの画像", "火星への着陸"], e: "天の川銀河のくわしい3次元地図です。" },
      gaiaCount: { q: "ガイアDR3（2022年）には何個の天体がありますか？", o: ["約18億個", "約1,800個", "約18個"], e: "1,811,709,771個、約18億個です。" },
      gaiaEnd: { q: "ガイアが科学観測を終えたのはいつですか？", o: ["2025年1月15日", "1990年", "まだ観測している"], e: "2025年1月15日です。" },
      localGroup: { q: "局所銀河群とは何ですか？", o: ["天の川銀河が属する銀河のグループ", "太陽の惑星", "星座の恒星"], e: "天の川銀河が属する銀河のグループです。" },
      groupCount: { q: "NASAによると、局所銀河群にはいくつの銀河がありますか？", o: ["50をこえる", "ちょうど3つ", "約100万"], e: "50をこえます。" },
      m33Third: { q: "局所銀河群で3番めに大きい銀河はどれですか？", o: ["さんかく座銀河（M33）", "小マゼラン雲", "M87"], e: "さんかく座銀河（M33）で、約300万光年はなれています。" },
      lmcSat: { q: "大マゼラン雲とは何ですか？", o: ["天の川銀河の伴銀河", "オリオン座の星雲", "地球の雲"], e: "天の川銀河の伴銀河です。" },
      smcDist: { q: "ESA/ハッブルによると、小マゼラン雲までの距離は？", o: ["20万光年", "200光年", "2億光年"], e: "20万光年です。" },
      smcWhere: { q: "小マゼラン雲はどの星座にありますか？", o: ["きょしちょう座", "アンドロメダ座", "オリオン座"], e: "きょしちょう座です。" },
      andDist: { q: "NASAによると、アンドロメダ銀河までの距離は？", o: ["250万光年", "2,500光年", "250億光年"], e: "250万光年です。" },
      andEye: { q: "アンドロメダ銀河は望遠鏡なしで見えますか？", o: ["はい、暗い場所なら肉眼で", "いいえ、けっして", "月からだけ"], e: "はい。暗い場所なら肉眼でかんたんに見えます。" },
      andWhere: { q: "局所銀河群でいちばん大きな銀河はどれですか？", o: ["アンドロメダ銀河", "天の川銀河", "小マゼラン雲"], e: "アンドロメダ銀河です。" },
      andSpeed: { q: "NASAによると、アンドロメダはどれくらいの速さで近づいていますか？", o: ["時速約25万マイル（40万km）", "時速約25km", "遠ざかっている"], e: "時速約25万マイル、約40万kmです。" },
      collide2012: { q: "2012年、NASAは何を予測しましたか？", o: ["約40億年後の正面衝突", "来年の衝突", "衝突はけっして起きない"], e: "約40億年後の正面衝突です。" },
      merge2012: { q: "2012年の予測では、2つの銀河はいつ1つにまとまりますか？", o: ["約60億年後", "約6,000年後", "けっしてない"], e: "約60億年後です。" },
      chance2025: { q: "2025年の研究では、100億年のうちに衝突する確率は？", o: ["50パーセントだけ", "100 %", "0 %"], e: "50パーセントだけです。" },
      dataNew: { q: "2025年の研究はどのデータを使いましたか？", o: ["ハッブルとESAのガイア", "古い絵だけ", "アンドロメダの探査機"], e: "ハッブルとESAのガイアのデータです。" },
      scienceChange: { q: "新しい研究は、科学について何を示していますか？", o: ["予測はよりよいデータで変わることがある", "予測はけっして変わらない", "科学はあてずっぽう"], e: "予測はデータが支えるかぎり正しく、よりよいデータで変わることがあります。" },
      nsForm: { q: "NASAによると、中性子星はどうやってできますか？", o: ["重い恒星の燃料がつきてつぶれる", "2つの惑星がぶつかる", "彗星がこおる"], e: "重い恒星の燃料がつきてつぶれたときにできます。" },
      nsSize: { q: "中性子星の直径はどれくらいですか？", o: ["約20 km", "太陽くらい", "約20 m"], e: "約20キロメートルで、太陽より大きな質量をもっています。" },
      nsSugar: { q: "NASAによると、中性子星の物質角砂糖1個分の重さは？", o: ["約1兆キログラム", "約1グラム", "約1トン"], e: "約1兆キログラムです。" },
      pulsarWhat: { q: "パルサーとは何ですか？", o: ["放射のパルスを出す回転する中性子星", "点滅する惑星", "若い恒星"], e: "放射のパルスを出す回転する中性子星です。" },
      lighthouse: { q: "NASAによると、パルサーは何にたとえられますか？", o: ["灯台", "ろうそく", "鏡"], e: "灯台です。その光線が何度も私たちの前を通りすぎます。" },
      pulseTime: { q: "パルサーのパルスの間隔はふつうどれくらいですか？", o: ["数ミリ秒から数秒", "数年", "数百年"], e: "ふつう数ミリ秒から数秒です。" },
      noLight: { q: "ブラックホールから逃げられるものは何ですか？", o: ["何もない、光さえも", "光だけ", "速いものなら何でも"], e: "何もありません。光さえも逃げられません。" },
      noVacuum: { q: "NASAによると、ブラックホールはまわりのものを何でも吸いこみますか？", o: ["いいえ、ほかの物質を吸いこむわけではない", "はい、掃除機のように", "惑星だけ"], e: "いいえ。ブラックホールはほかの物質を吸いこむわけではありません。" },
      sunSwap: { q: "太陽を同じ質量のブラックホールにおきかえたら、惑星はどうなりますか？", o: ["軌道を回りつづける", "すぐに落ちこむ", "飛んでいく"], e: "軌道を回りつづけます。" },
      smbh: { q: "NASAによると、超大質量ブラックホールの質量は？", o: ["太陽の数十万倍から数十億倍", "地球くらい", "月くらい"], e: "太陽の数十万倍から数十億倍です。" },
      sgrMass: { q: "ESOによると、いて座A*の質量は？", o: ["太陽の400万倍", "太陽と同じ", "太陽の4倍"], e: "太陽の400万倍です。" },
      sgrDist: { q: "ESOによると、いて座A*までの距離は？", o: ["約27,000光年", "約27光年", "約2700万光年"], e: "約27,000光年で、いて座の方向にあります。" },
      firstImage: { q: "はじめてのブラックホールの画像が発表されたのはいつですか？", o: ["2019年4月10日", "1969年", "2001年"], e: "2019年4月10日、M87のブラックホールです。" },
      m87Dist: { q: "ESOによると、M87のブラックホールまでの距離は？", o: ["5500万光年", "55光年", "550億光年"], e: "5500万光年です。" },
      sgrImage: { q: "いて座A*のはじめての画像が発表されたのはいつですか？", o: ["2022年5月12日", "2019年4月10日", "1995年"], e: "2022年5月12日です。" },
      mainSequence: { q: "主系列の恒星は何をしていますか？", o: ["水素を安定してヘリウムに融合している", "爆発している", "ゆっくり冷えている"], e: "中心で水素を安定してヘリウムに融合しています。" },
      longestPhase: { q: "恒星の一生でいちばん長い時期はどれですか？", o: ["主系列", "赤色巨星", "超新星"], e: "主系列です。" },
      sunMidway: { q: "太陽は一生のどこにいますか？", o: ["主系列のほぼまんなか", "いちばん最後", "生まれたばかり"], e: "約100億年の主系列のほぼまんなかです。" },
      massFuel: { q: "燃料を速く使うのはどちらの恒星ですか？", o: ["質量の大きい恒星", "軽い恒星", "どちらも同じ"], e: "質量の大きい恒星です。" },
      massiveShort: { q: "いちばん重い恒星はどれくらい生きますか？", o: ["数百万年だけ", "何兆年", "永遠に"], e: "数百万年だけです。" },
      lowMassLong: { q: "NASAによると、質量の小さい恒星の中には、どれくらい輝くものがありますか？", o: ["何兆年", "数千年", "数日"], e: "何兆年です。" },
      noHydrogen: { q: "恒星の中心の水素がなくなると、どうなりますか？", o: ["中心がちぢみ、恒星がふくらむ", "すぐに消える", "何も変わらない"], e: "中心がちぢみはじめ、恒星はゆっくりふくらみます。" },
      redGiant: { q: "太陽のような恒星は、主系列のあと何になりますか？", o: ["赤色巨星", "ブラックホール", "惑星"], e: "赤色巨星です。" },
      giantWhen: { q: "NASAによると、太陽が赤色巨星になるのはいつですか？", o: ["約50億年後", "約5,000年後", "次の世紀"], e: "約50億年後です。" },
      whiteDwarf: { q: "白色わい星とは何ですか？", o: ["恒星の残った中心で、ふつう地球くらいの大きさ", "小さな白い惑星", "若い恒星"], e: "赤色巨星が外側の層を放り出したあとに残る中心で、ふつう地球くらいの大きさです。" },
      teaspoon: { q: "NASAによると、白色わい星の物質ティースプーン1杯の重さは？", o: ["ピックアップトラックより重い", "砂糖と同じくらい", "空気より軽い"], e: "ピックアップトラックより重くなります。" },
      planetaryNebula: { q: "死にゆく太陽のような恒星が放り出した層は、何になりますか？", o: ["惑星状星雲", "すぐに新しい惑星", "ブラックホール"], e: "広がるちりとガスの雲、惑星状星雲になります。" },
      supernova: { q: "超新星とは何ですか？", o: ["恒星の爆発", "新しい恒星の誕生", "明るい惑星"], e: "恒星の爆発です。" },
      novaMass: { q: "NASAによると、超新星で終わるのはどの恒星ですか？", o: ["太陽の約8倍をこえる質量の恒星", "すべての恒星", "赤色わい星だけ"], e: "太陽の約8倍をこえる質量の恒星です。NASAの別のページは7倍としています。" },
      stardust: { q: "NASAによると、私たちの体の元素はどこでできましたか？", o: ["恒星の中心", "月", "地球の海"], e: "恒星の中心です。超新星がそれをまき散らしました。" },
      molecularCloud: { q: "NASAによると、恒星はどこで生まれますか？", o: ["ガスとちりの大きな雲、分子雲の中", "惑星の内部", "土星の環の中"], e: "ガスとちりの冷たい大きな雲、分子雲の中です。" },
      clumpCollapse: { q: "分子雲の中のかたまりをつぶすのは何ですか？", o: ["重力", "地球からの風", "月の光"], e: "重力です。" },
      orionNursery: { q: "オリオン大星雲とは何ですか？", o: ["いちばん近い大きな星形成領域、約1,500光年", "太陽系の惑星", "ブラックホール"], e: "地球にいちばん近い大きな星形成領域で、約1,500光年はなれています。" },
      protostar: { q: "原始星とは何ですか？", o: ["恒星の赤ちゃん", "死んだ恒星", "恒星のない惑星"], e: "中心で核融合が始まる前の、恒星の赤ちゃんです。" },
      protoHeat: { q: "つぶれるかたまりが熱くなるのはなぜですか？", o: ["摩擦で物質が熱くなるから", "太陽に照らされるから", "木のように燃えるから"], e: "摩擦で物質が熱くなるからです。" },
      auMicAge: { q: "NASAによると、AU Micは何歳ですか？", o: ["2000万〜3000万歳", "46億歳", "300歳"], e: "2000万〜3000万歳です。太陽は少なくとも150倍年上です。" },
      diskYoung: { q: "若い恒星のまわりには何がありますか？", o: ["ガスとちりの円盤", "かたい氷の殻", "何もない"], e: "誕生のときに残ったガスとちりの円盤です。" },
      planetsMerge: { q: "そうした円盤の中で、惑星はどう育ちますか？", o: ["岩や氷のつぶがぶつかって合体する", "恒星がはき出す", "ほかの銀河から来る"], e: "岩や氷の固いつぶがぶつかって合体します。" },
      pdsImage: { q: "2018年、ESOはPDS 70で何を発表しましたか？", o: ["生まれつつある惑星のはじめて確認された画像", "太陽系の新しい恒星", "ブラックホール"], e: "円盤の中で生まれつつある惑星、PDS 70 bのはじめて確認された画像です。" },
      clusters: { q: "NASAによると、恒星はよくどう生まれますか？", o: ["グループ、つまり星団で", "いつもひとりで", "惑星の中で"], e: "グループ、つまり星団で生まれます。" },
      pleiades: { q: "プレアデス星団とは何ですか？", o: ["おうし座の散開星団", "惑星", "遠い銀河"], e: "おうし座の散開星団です。" },
      pleiadesDist: { q: "NASAによると、プレアデス星団までの距離は？", o: ["約445光年", "約4光年", "約400万光年"], e: "約445光年です。この数字はみんなが認めているわけではありません。" },
      sunAge: { q: "NASAによると、太陽はいつ生まれましたか？", o: ["約46億年前", "約4,600年前", "約4600万年前"], e: "約46億年前です。" },
      solarNebula: { q: "太陽が生まれた雲は何とよばれますか？", o: ["原始太陽系星雲", "オリオン大星雲", "天の川"], e: "原始太陽系星雲、回転するガスとちりの巨大な雲です。" },
      planetsLeft: { q: "惑星は何からできましたか？", o: ["太陽の誕生で残った物質の多くから", "月のかけらから", "ほかの恒星から"], e: "残った物質の多くから、地球をふくむ惑星ができました。" },
      starGas: { q: "NASAによると、恒星とは何ですか？", o: ["熱いガスの巨大な球", "光る大きな岩", "空の穴"], e: "熱いガスの巨大な球で、自分の重力でまとまっています。" },
      starFusion: { q: "恒星の中心では何が起きていますか？", o: ["水素がヘリウムに融合している", "鉄が石炭のように燃えている", "何も起きず、光は表面から来る"], e: "水素の原子核がおしつけられてヘリウムになり、光のエネルギーが出ます。" },
      starGravity: { q: "恒星をまとめているものは何ですか？", o: ["自分の重力", "かたい殻", "地球の磁場"], e: "自分の重力です。" },
      colorTemp: { q: "恒星の色がちがうのはなぜですか？", o: ["温度がちがうから", "名前のせい", "ガラスでできた星があるから"], e: "温度がちがうからです。" },
      blueHot: { q: "熱いのはどの恒星ですか？", o: ["青や白の恒星", "赤い恒星", "オレンジの恒星"], e: "青や白の恒星が熱く、オレンジや赤の恒星は冷たいです。" },
      sunTemp: { q: "NASAによると、太陽の表面は何度ですか？", o: ["約5,500 °C", "約55 °C", "約550万 °C"], e: "約5,500 °Cです。" },
      classOrder: { q: "熱い順の恒星のクラスはどれですか？", o: ["O、B、A、F、G、K、M", "A、B、C、D、E、F、G", "M、K、G、F、A、B、O"], e: "O、B、A、F、G、K、Mです。" },
      sunClass: { q: "太陽はどのクラスですか？", o: ["G、黄色わい星", "M、赤色わい星", "O、青色巨星"], e: "Gで、黄色わい星です。" },
      mColor: { q: "M型の恒星は何色ですか？", o: ["赤", "青", "白"], e: "赤です。M型はいちばん冷たい恒星です。" },
      commonStars: { q: "天の川銀河でいちばん多い恒星はどれですか？", o: ["赤色わい星", "太陽のような恒星", "青色巨星"], e: "赤色わい星で、すべての恒星の約4分の3です。" },
      sunLike: { q: "NASAによると、天の川銀河の恒星のうち、太陽のような恒星はどれくらいですか？", o: ["約6 %", "約60 %", "2つに1つ"], e: "約6 %だけです。" },
      proximaSize: { q: "プロキシマ・ケンタウリは太陽とくらべてどれくらいの大きさですか？", o: ["半径が約7分の1", "2倍", "まったく同じ"], e: "約7分の1、太陽の半径の0.141倍です。" },
      orangeLife: { q: "NASAが高度な生命により向いていると考える恒星はどれですか？", o: ["K型のオレンジわい星", "O型の青色巨星", "どれもない"], e: "太陽より少し冷たい、K型のオレンジわい星です。" },
      redLong: { q: "いちばん長生きなのはどの恒星ですか？", o: ["赤色わい星、1000億年以上", "青色巨星", "太陽のような恒星"], e: "赤色わい星です。NASAは1000億年以上としています。" },
      bakedDry: { q: "赤色わい星のハビタブルゾーンの惑星には、何が起こることがありますか？", o: ["からからに干上がる", "恒星になる", "何も起こらない"], e: "からからに干上がることがあります。" },
      firstLetter: { q: "ある恒星のまわりで最初に見つかった惑星は、何と呼ばれますか？", o: ["恒星の名前＋b", "恒星の名前＋a", "恒星の名前＋1"], e: "bです。恒星そのものが書かれないAです。" },
      sameTime: { q: "ひとつの恒星の惑星がいくつか同時に見つかりました。bになるのはどれですか？", o: ["恒星にいちばん近い惑星", "いちばん大きい惑星", "いちばん外側の惑星"], e: "恒星にいちばん近い惑星です。" },
      letterOrder: { q: "b、c、dの文字は何の順番ですか？", o: ["見つかった順番", "惑星の大きさの順番", "色の順番"], e: "見つかった順番です。プロキシマdはbより近くを回っていますが、あとから見つかりました。" },
      capitals: { q: "いくつかの恒星でできた系の恒星には、何がつきますか？", o: ["大文字：A、B、C", "小文字：b、c、d", "色"], e: "大文字です。惑星には小文字がつきます。" },
      hostA: { q: "書かれていなくても、惑星をもつ恒星はふつうどの文字ですか？", o: ["A", "B", "Z"], e: "Aです。系の書かれないAです。" },
      starOrPlanet: { q: "Proxima Cen bは何ですか？", o: ["惑星", "恒星", "星座"], e: "惑星です。小文字がそれを示しています。" },
      alphaAries: { q: "Alpha Arietisはどういう意味ですか？", o: ["おひつじ座のアルファ", "アルファのおひつじ座", "いちばん明るい惑星"], e: "おひつじ座のアルファです。IAUの例はハマルです。" },
      alphaCen: { q: "アルファ・ケンタウリはどの星座の星ですか？", o: ["ケンタウルス座", "おひつじ座", "おおぐま座"], e: "ケンタウルス座です。アルファ・ケンタウリはケンタウルス座のアルファです。" },
      iau1922: { q: "IAUが88星座のリストを決めたのはいつですか？", o: ["1922年", "1610年", "1995年"], e: "1922年です。境界は1928年に決まりました。" },
      hdMeaning: { q: "星の名前のHDは何を表しますか？", o: ["ヘンリー・ドレイパー星表", "ハイビジョン", "明るい二重星"], e: "ヘンリー・ドレイパー星表です。" },
      toiMeaning: { q: "TOIは何を表しますか？", o: ["TESS Objects of Interest、衛星TESSの候補", "星座", "月への探査機"], e: "TESS Objects of Interest、NASAの衛星TESSの候補です。" },
      trappistWhat: { q: "TRAPPISTとは何ですか？", o: ["チリにある小さな望遠鏡", "ケンタウルス座の恒星", "太陽系の惑星"], e: "チリにある小さな望遠鏡で、TRAPPIST-1の名前のもとです。" },
      gjMeaning: { q: "GJカタログとは何ですか？", o: ["グリーゼとヤーライスの近くの星のカタログ", "銀河のカタログ", "木星の衛星のリスト"], e: "ヴィルヘルム・グリーゼとハルトムート・ヤーライスの近くの星のカタログです。" },
      romanGods: { q: "NASAによると、地球以外のすべての惑星は何から名前がつけられましたか？", o: ["ローマの神または女神", "見つけた人", "星座"], e: "ローマの神または女神です。火星（マーズ）は戦いの神です。" },
      dimidium: { q: "ペガスス座51番星bの固有の名前は何ですか？", o: ["ディミディウム", "ヘルヴェティオス", "プロキシマ"], e: "ディミディウムです。恒星はヘルヴェティオスです。" },
      buyStar: { q: "IAUから星の名前を買えますか？", o: ["いいえ、IAUは名前を売りません", "はい、どの星でも", "はい、明るい星だけ"], e: "いいえ。IAUは名前を売らず、そうした商売とは関係ないとしています。" },
      notReplace: { q: "ディミディウムのような名前は、科学的な符号にとってかわりますか？", o: ["いいえ、両方がならんで使われます", "はい、古い符号は消されます", "ヨーロッパでだけ"], e: "いいえ。こうした名前は科学的な符号にとってかわりません。" },
      constCount: { q: "NASAによると、公式に認められた星座はいくつありますか？", o: ["88", "12", "1,000"], e: "88です。" },
      notConnected: { q: "星座の星どうしはつながっていますか？", o: ["いいえ。近い星も、とても遠い星もある", "はい、たがいに結びついている", "はい、みんな同じ距離にある"], e: "いいえ。つながってはいません。近い星も、とても遠い星もあります。" },
      constShape: { q: "星座とは何ですか？", o: ["形をつくっているように見え、名前のある星のグループ", "たがいにまわりあう星の集まり", "銀河"], e: "空で形をつくっているように見え、名前がつけられた星のグループです。" },
      thirteen: { q: "IAUの境界によると、太陽は1年にいくつの星座を通りますか？", o: ["13", "12", "88"], e: "13です。黄道の12星座とへびつかい座です。" },
      ophName: { q: "星占いの星座ではないのに、太陽が通る星座はどれですか？", o: ["へびつかい座", "おおぐま座", "オリオン座"], e: "へびつかい座です。11月の終わりから12月の中ごろまでです。" },
      ophDates: { q: "太陽がへびつかい座にあるのは、だいたいいつですか？", o: ["11月の終わりから12月の中ごろ", "7月", "3月"], e: "11月30日ごろから12月17日ごろまでです。" },
      ophPasses: { you: "あなたが生まれてから、太陽はへびつかい座を何回通りましたか？", ref: "30年のあいだに、太陽はへびつかい座を何回通りますか？", e: (n) => `約${n}回です。毎年1回です。` },
      wobble: { q: "歳差運動とは何ですか？", o: ["地球の軸のゆっくりとした首振り", "月の公転", "星座のひとつ"], e: "こまのような、地球の軸のゆっくりとした首振りです。" },
      wobbleTime: { q: "NASAによると、地球の軸の首振り1回には、どのくらいかかりますか？", o: ["約25,800年", "約26年", "約260万年"], e: "約25,800年です。" },
      signSize: { q: "星占いの星座は、それぞれどのくらいの大きさですか？", o: ["太陽の通り道の12分の1、30度", "その星座と同じ大きさ", "本当の星座のように、それぞれちがう"], e: "星占いの星座はどれもちょうど30度です。本当の星座は大きさがまちまちです。" },
      astronomyMethod: { q: "天文学はどのように研究しますか？", o: ["科学の方法で、証拠とデータを使って", "生まれた時刻からの予言で", "運で"], e: "科学の方法で、証拠とデータを使います。" },
      astroEvidence: { q: "星占いの主張は、科学的な証拠にもとづいていますか？", o: ["いいえ", "はい", "夏の星座だけ"], e: "いいえ。いくつかの文化の伝統では大切ですが、その主張は科学的な証拠にもとづいていません。" },
      astroBelief: { q: "星占いは何にもとづいていますか？", o: ["星や惑星が未来や性格を示すという信念", "望遠鏡での測定", "IAUの境界"], e: "星や惑星の位置が未来を予言したり、人を表したりできるという信念です。" },
      lightTravel: { q: "46光年はなれた星があります。その光は、どのくらいかけて私たちにとどいていますか？", o: ["46年", "46日", "46分"], e: "46年です。1光年は、光が1年で進む距離です。" },
      starsSpread: { q: "この地図のデータで、おうし座の星は私たちからどのくらいはなれていますか？", o: ["46光年から484光年", "どれもちょうど100光年", "1光年より近い"], e: "46光年から484光年です。横から見ると形がばらばらになります。" },
      nightSky: { q: "夏と冬で見える星座がちがうのはなぜですか？", o: ["地球が1年で太陽のまわりをまわるから", "星が動くから", "星座が夏に眠るから"], e: "地球が1年に1回太陽のまわりをまわるからです。太陽のうしろにあるものは、夜には見えません。" },
      habOrbits: { you: "地球はハビタブルゾーンの中で、あなたを太陽のまわりに何周運びましたか？", ref: "30年のあいだに、地球は人を太陽のまわりに何周運びますか？", e: (n) => `${n}周です。1年に1周、いつも太陽のハビタブルゾーンの中で。` },
      toiAge: { you: "TOI-700 dでは、あなたは何歳ですか？", ref: "30歳の人は、TOI-700 dでは何歳ですか？", e: (n) => `${n}歳です。TOI-700 dの1年は37.4日です。` },
      europaLaps: { you: "あなたが生まれてから、エウロパは木星のまわりを何周しましたか？", ref: "30年のあいだに、エウロパは木星のまわりを何周しますか？", e: (n) => `${n}周です。1周は3.55日です。` },
      venusAge: { you: "金星では、あなたは何歳ですか？", ref: "30歳の人は、金星では何歳ですか？", e: (n) => `${n}歳です。金星の1年は地球の0.615年です。` },
      candidatesAtBirth: { you: "あなたが生まれた年、この地図はハビタブルゾーンの候補をいくつ知っていましたか？", ref: "いま30歳の人が生まれた年、この地図はハビタブルゾーンの候補をいくつ知っていましたか？", e: (n) => `${n}個です。そのほとんどはここ数年で見つかりました。` },
    },
  },
  bg: {
    parts: { basics: "Част I, Основи на планетологията", starLives: "Част II, Животът на звездите", galaxy: "Част III, Нашата галактика", sky: "Да четем небето" },
    paths: {
      solar: { title: "Нашата Слънчева система", goal: "Можеш да обясниш как е устроена Слънчевата система и да различаваш основните ѝ тела." },
      alpha: { title: "Най-близките ни звезди: Алфа Кентавър", goal: "Можеш да опишеш най-близката до нас звездна система, нейната планета Проксима b и колко далеч е тя всъщност." },
      exo: { title: "Екзопланети: светове отвъд Слънчевата система", goal: "Знаеш какво са екзопланетите, как се откриват и колко различни могат да бъдат." },
      hab: { title: "Търсенето на обитаеми светове", goal: "Знаеш какво прави една планета вероятно обитаема и защо самата обитаема зона още не означава живот." },
      zod: { title: "Съзвездия и зодии", goal: "Можеш да обясниш какво е съзвездие, защо зодията ти и небето не съвпадат и какво ти разказва светлината на твоето съзвездие." },
      names: { title: "Имена в космоса", goal: "Можеш да четеш имената на планети и звезди: буквите, гръцките букви, каталозите и имената с история." },
      stars: { title: "Да разберем звездите", goal: "Можеш да обясниш какво е звезда, какво казва цветът ѝ, как се подреждат звездите и кои звезди са добър дом за планети." },
      birth: { title: "Раждането на звездите", goal: "Можеш да обясниш как от облак газ и прах се ражда звезда, как около нея растат планети и как се е родило Слънцето." },
      life: { title: "Животът и смъртта на звездите", goal: "Можеш да обясниш как живее една звезда, защо масата ѝ решава живота ѝ и как свършват звездите: като бели джуджета или в свръхнова." },
      compact: { title: "Неутронни звезди и черни дупки", goal: "Можеш да обясниш какво са неутронните звезди, пулсарите и черните дупки, къде е черната дупка на Млечния път и как е снимана." },
      nebula: { title: "Мъглявини", goal: "Знаеш какво са мъглявините, как в тях се раждат звезди и как умиращите звезди ги оставят след себе си." },
      milky: { title: "Млечният път", goal: "Можеш да опишеш нашата галактика: формата и размера ѝ, къде е Слънцето в нея, как обикаля центъра и как Гая я е измерила." },
      local: { title: "Галактическото съседство", goal: "Познаваш галактиките около нашата, Местната група и какво казва науката за бъдещето с Андромеда." },
    },
    path: {
      meta: (m) => `около ${m} минути · за начинаещи`,
      rule: (n) => `${n} стъпки, после финален тест с 10 въпроса; издържан от 70 %.`,
    },
    neighborhood: {
      sunProxima: "Слънце → Проксима Кентавър: 4,24 светлинни години",
      sunAlpha: "Слънце → Алфа Кентавър A и B: 4,37 светлинни години",
      system: "Една система: Проксима ↔ A, B 0,2 светлинни години (13 000 АЕ)",
    },
    allPaths: "Всички учебни пътеки",
    status: { done: "Готово", next: "Следва", open: "Предстои", locked: "Първо всички стъпки" },
    back: "Всички стъпки", placeLabel: "Научи повече", stepOf: (n, all) => `Стъпка ${n} от ${all}`, goalLabel: "Цел", speak: "Прочети на глас", speakStop: "Спри", speakTitle: "Чете се с глас на устройството ти; нищо не се изпраща.", rememberLabel: "Запомни", sourcesLabel: "Източници", forYou: "За теб", example: "Пример", exampleHint: "С датата ти на раждане (в прегледа на „Моята вселена“) това става твоето собствено число.",
    taskLabel: "В 3D изгледа", taskGo: "Покажи в 3D", scaleBack: "Обратно към обяснителния мащаб", taskDone: "Готово", check: "Провери какво разбра", right: "Вярно.", wrong: "Не съвсем.",
    stepDone: (xp) => `Стъпката е готова · +${xp} XP`, nextStep: "Следваща стъпка", toTest: "Към финалния тест",
    needTask: "Направи и задачата в 3D изгледа и стъпката е готова.", progress: (d, all) => `${d} от ${all} стъпки`,
    test: {
      title: "Финален тест", intro: (n, p) => `${n} въпроса от всички стъпки, някои с твоите собствени числа. Издържан от ${p} %.`,
      locked: "Първо завърши всичките пет стъпки.", evaluate: "Провери отговорите", score: (r, n, p) => `${r} от ${n} верни (${p} %)`,
      passed: (xp) => `Издържан · +${xp} XP и нова значка`, failed: "Още не е издържан. Прочети обясненията и опитай отново.",
      retry: "Опитай отново", best: (p) => `Най-добър резултат: ${p} %`, answerAll: "Първо отговори на всички въпроси.",
    },
    steps: {
      sun: {
        title: "Слънцето", goal: "Можеш да кажеш какво е Слънцето и откъде идва енергията му.",
        text: [
          "Слънцето е звезда: кълбо от горещ газ, толкова голямо, че в диаметъра му се нареждат около 109 Земи. В него е събрана над 99 % от цялата маса на Слънчевата система.",
          "В ядрото му водородът се слива в хелий. Така се освобождава енергията, която достига до нас като светлина и топлина, от около 150 милиона километра.",
        ],
        task: "Полети до Слънцето и го разгледай отблизо.",
        remember: [
          "Слънцето е звезда, кълбо от горещ газ. Образувало се е преди около 4,6 милиарда години.",
          "Енергията му идва от ядрен синтез: в ядрото, при около 15 милиона °C, водородът се слива в хелий.",
          "В него е 99,8 % от масата на Слънчевата система; в диаметъра му се нареждат около 109 Земи.",
          "Светлината му стига до Земята за около 8 минути и 20 секунди.",
        ],
        you: (n) => `Светлината, която пада върху теб сега, е напуснала Слънцето преди около 8 минути и 20 секунди. От раждането ти Земята те е пренесла около него ${n} пъти.`,
        ref: (n) => `Светлината, която пада върху теб сега, е напуснала Слънцето преди около 8 минути и 20 секунди. Човек на 30 години вече е пренесен от Земята около него ${n} пъти.`,
      },
      inner: {
        title: "Вътрешните планети", goal: "Можеш да назовеш и различиш четирите скалисти планети.",
        text: [
          "Меркурий, Венера, Земята и Марс са скалистите планети: малки, с твърда повърхност. Меркурий е най-близо до Слънцето, Венера е най-горещата, защото плътната ѝ атмосфера от въглероден диоксид задържа топлината.",
          "На Марс е най-големият вулкан в Слънчевата система, Олимп, няколко пъти по-висок от Еверест. Денят на Венера е по-дълъг от нейната година.",
        ],
        task: "Полети до Марс и го сравни със Земята.",
        remember: [
          "Меркурий, Венера, Земята и Марс са вътрешните планети: имат твърда повърхност.",
          "Венера е най-горещата планета, около 467 °C на повърхността, макар че Меркурий е по-близо до Слънцето.",
          "Денят на Венера (243 земни дни) е по-дълъг от годината ѝ (225 земни дни).",
          "Олимп на Марс е най-големият вулкан в Слънчевата система.",
        ],
        you: (mars, mercury) => `На Марс щеше да си на ${mars}, на Меркурий на ${mercury}: годината там е по-дълга или по-къса от нашата.`,
        ref: (mars, mercury) => `Човек на 30 години щеше да е на ${mars} на Марс и на ${mercury} на Меркурий: годината там е по-дълга или по-къса от нашата.`,
      },
      outer: {
        title: "Външните планети", goal: "Можеш да различаваш газовите гиганти от ледените гиганти.",
        text: [
          "Юпитер и Сатурн са газови гиганти, главно от водород и хелий, а Уран и Нептун са ледени гиганти. Никой от тях няма твърда повърхност като Земята.",
          "Юпитер има повече от два пъти масата на всички други планети взети заедно. Сатурн е толкова лек за размера си, че плътността му е по-малка от тази на водата.",
        ],
        task: "Полети до Сатурн и разгледай пръстените му.",
        remember: [
          "Юпитер и Сатурн са газови гиганти, Уран и Нептун ледени гиганти.",
          "Юпитер е най-голямата планета, с повече от два пъти масата на всички други планети заедно.",
          "Сатурн е единствената планета с плътност по-малка от тази на водата.",
          "Не само Сатурн има пръстени: Юпитер и Нептун също имат.",
        ],
        you: (n) => `От раждането ти Юпитер е обиколил Слънцето само ${n} пъти: една негова година трае почти 12 наши.`,
        ref: (n) => `За 30 години Юпитер обикаля Слънцето само ${n} пъти: една негова година трае почти 12 наши.`,
      },
      moons: {
        title: "Луни и джудже планети", goal: "Знаеш какво е луна, защо Луната винаги ни показва една и съща страна и какво е джудже планета.",
        text: [
          "Една луна обикаля около планета. Земята има една, Юпитер десетки, а четирите най-големи от тях открива Галилео Галилей през 1610 г. с един от първите телескопи.",
          "Повечето големи луни се завъртат точно веднъж около себе си при всяка обиколка и затова винаги са обърнати към планетата си с една и съща страна. Затова от Земята никога не виждаме обратната страна на Луната.",
          "Не всяко тяло, което само обикаля Слънцето, е планета. Церера в астероидния пояс и Плутон отвъд Нептун са джудже планети. Плутон се смяташе за девета планета до 2006 г., когато Международният астрономически съюз го определи като джудже планета, защото други обекти могат да пресичат орбитата му. Той има пет известни луни; най-голямата, Харон, е около половината от неговия размер.",
        ],
        task: "Полети до Юпитер и щракни върху една от четирите му големи луни.",
        remember: [
          "Луната е тяло, което обикаля около планета.",
          "Ганимед, луна на Юпитер, е най-голямата луна в Слънчевата система, по-голяма от планетата Меркурий.",
          "Нашата Луна винаги е обърната към Земята с една и съща страна: завърта се точно веднъж при всяка обиколка.",
          "Галилео Галилей открива четирите най-големи луни на Юпитер през 1610 г.",
          "Церера и Плутон са джудже планети. Плутон се смяташе за девета планета до 2006 г.",
        ],
        you: (n) => `От раждането ти Луната е обиколила Земята около ${n} пъти.`,
        ref: (n) => `За 30 години Луната обикаля Земята около ${n} пъти.`,
      },
      scale: {
        title: "Малки тела, мащаб и разстояния", goal: "Можеш да опишеш колко голяма и колко празна е Слънчевата система и какво са астероидите и кометите.",
        text: [
          "Слънчевата система е предимно празно пространство. Разстоянието от Земята до Слънцето, 150 милиона километра, се нарича астрономическа единица (а.е.). Нептун, най-външната планета, е на около 30 а.е. от Слънцето.",
          "Светлината на Слънцето пътува малко над 8 минути до Земята и около 4 часа до Нептун. В истинския мащаб на 3D изгледа планетите стават мънички точки в огромно пространство.",
          "Между Марс и Юпитер е астероидният пояс, където обикалят Слънцето повечето астероиди; най-голямото тяло там, Церера, е джудже планета. Кометите са главно от лед и прах. Когато някоя наближи Слънцето, тя се затопля и образува обвивка, кома; слънчевата светлина и слънчевият вятър отнасят праха и газа далеч от Слънцето в дълги опашки.",
        ],
        task: "Включи истинския мащаб и виж колко далеч една от друга са планетите.",
        remember: [
          "Една астрономическа единица (а.е.) е средното разстояние от Земята до Слънцето, около 150 милиона километра.",
          "Нептун е на 30 а.е. от Слънцето; слънчевата светлина пътува около 4 часа дотам.",
          "Повечето астероиди обикалят Слънцето между Марс и Юпитер. Най-голямото тяло там, Церера, е джудже планета.",
          "Кометите са главно от лед и прах; близо до Слънцето образуват опашки, насочени далеч от Слънцето.",
        ],
        you: (name, dist, year) => `Светлината на твоята звезда, ${name}, която пристига днес, е тръгнала около ${year} г., приблизително в годината на раждането ти. Пътувала е ${dist} светлинни години.`,
        ref: "Светлината на най-близката звезда, Проксима Кентавър, пътува 4,2 години до нас.",
      },
      neighbors: {
        title: "Най-близките ни звезди", goal: "Знаеш кои звезди са най-близо до нас и какво е светлинна година.",
        text: [
          "След Слънцето най-близката до нас звезда е Проксима Кентавър, на около 4,2 светлинни години. Светлинната година не е време, а разстояние: колко далеч стига светлината за една година, почти 9,5 трилиона километра.",
          "Проксима е част от Алфа Кентавър, най-близката до Земята звездна система, в съзвездието Кентавър. Освен Проксима в нея има две ярки звезди, Алфа Кентавър A и B, на около 4,3 светлинни години.",
        ],
        task: "Разгледай съзвездието Кентавър: в тази посока са най-близките ни съседи.",
        remember: [
          "След Слънцето Проксима Кентавър е най-близката звезда, на около 4,2 светлинни години.",
          "Светлинната година е разстояние: колко далеч стига светлината за една година.",
          "Алфа Кентавър е най-близката до Земята звездна система; тя е в съзвездието Кентавър.",
        ],
        you: (left) => (left == null ? "Светлината на Проксима Кентавър, която стига до теб днес, е тръгнала преди около 4,2 години, още преди да се родиш." : `Светлината на Проксима Кентавър, която стига до теб днес, е тръгнала преди около 4,2 години, когато беше на ${left}.`),
        ref: (left) => `Светлината на Проксима Кентавър, която стига до нас днес, е тръгнала преди около 4,2 години: човек, който днес е на 30, тогава е бил на ${left}.`,
      },
      pair: {
        title: "Алфа Кентавър A и B", goal: "Можеш да опишеш двете ярки звезди на Алфа Кентавър и как се движат.",
        text: [
          "Алфа Кентавър A и B са двойка звезди, които обикалят около общ център на тежестта веднъж на 80 години. Когато са най-близо, разстоянието между тях е около 11 пъти разстоянието Земя–Слънце.",
          "A е звезда от същия вид като нашето Слънце (G2) и е малко по-голяма; B (тип K1) е малко по-малка. През 2025 г. космическият телескоп „Джеймс Уеб“ откри следи от възможна гигантска планета около A, тежка колкото Сатурн. Дали тя наистина съществува, е още открит въпрос.",
        ],
        task: "Полети до Алфа Кентавър A: до нея свети B. Разстоянието между двете е нарисувано по-малко, отколкото е.",
        remember: [
          "Алфа Кентавър A и B обикалят една около друга веднъж на 80 години.",
          "A е звезда от същия вид като Слънцето и е малко по-голяма, B е малко по-малка.",
          "Възможна планета около A, видяна от телескопа „Уеб“ през 2025 г., още не е потвърдена.",
        ],
        you: (share) => `A и B имат нужда от 80 години за една обиколка една около друга: през досегашния ти живот са изминали ${share} % от нея.`,
        ref: (share) => `A и B имат нужда от 80 години за една обиколка една около друга: за 30 години изминават ${share} % от нея.`,
      },
      proxima: {
        title: "Проксима Кентавър", goal: "Знаеш какво е червено джудже и защо Проксима не се вижда с просто око.",
        text: [
          "Проксима Кентавър е червено джудже: малка, хладна звезда, много по-слаба от Слънцето. Макар да е най-близката ни звезда, тя е твърде слаба, за да се види с просто око.",
          "Тя е третата и най-слабата звезда на системата Алфа Кентавър. Изпраща изблици на ултравиолетова светлина и рентгенови лъчи, а това е много важно за нейната планета.",
        ],
        task: "Полети до Проксима Кентавър и разгледай малката червена звезда.",
        remember: [
          "Проксима Кентавър е червено джудже: малка, хладна и много по-слаба от Слънцето.",
          "Не се вижда с просто око, макар да е най-близката звезда.",
          "Тя е третата и най-слабата звезда на Алфа Кентавър и изпраща изблици на ултравиолетова светлина и рентгенови лъчи.",
        ],
        you: (trips) => `През досегашния ти живот светлината би могла да измине пътя от Проксима до нас ${trips} пъти.`,
        ref: (trips) => `За 30 години светлината може да измине пътя от Проксима до нас ${trips} пъти.`,
      },
      proximaB: {
        title: "Проксима b", goal: "Знаеш какво се знае за Проксима b и защо обитаемата зона не означава живот.",
        text: [
          "През 2016 г. астрономи от Европейската южна обсерватория (ESO) обявиха планета около Проксима Кентавър: Проксима b. Откриха я по мънички отмествания в светлината на звездата, която леко се клати, защото планетата я дърпа. Планетата обикаля звездата си за 11,2 дни и е поне горе-долу колкото Земята по маса.",
          "Проксима b е в обитаемата зона на звездата си: температурата там би могла да позволи течна вода при подходящи условия. Но изблиците на Проксима може да отнесат атмосферата ѝ. Дали Проксима b има въздух, вода или дори живот, не е известно.",
        ],
        task: "Полети до Проксима b и я разгледай отблизо.",
        remember: [
          "Проксима b, планетата на най-близката звезда, е обявена от ESO през 2016 г.",
          "Една година на Проксима b трае 11,2 дни.",
          "Открита е по клатенето на звездата си, а не на снимка.",
          "В обитаемата зона не значи обитавана: не е известно дали има въздух или вода.",
        ],
        you: (age) => `На Проксима b щеше да си на ${age} години: годината там трае само 11,2 дни.`,
        ref: (age) => `Човек на 30 години щеше да е на ${age} години на Проксима b: годината там трае само 11,2 дни.`,
      },
      travel: {
        title: "Бихме ли стигнали някога дотам?", goal: "Можеш да кажеш колко дълго би траело днес пътуване до най-близката звезда.",
        text: [
          "„Вояджър 1“, най-далечната космическа сонда, се отдалечава от Слънцето с около 17 километра в секунда, над 61 000 километра в час. С тази скорост пътуване от 4,2 светлинни години би траело около 75 000 години (изчислено от разстоянието и скоростта).",
          "Светлината изминава същия път за около 4,2 години. Толкова далеч са звездите една от друга: дори най-близкият ни съсед е недостижим за днешните сонди.",
        ],
        task: "Планирай в планера за пътувания пътуване от Земята до Проксима b.",
        remember: [
          "„Вояджър 1“ лети с около 17 километра в секунда.",
          "С тази скорост пътуването до Проксима би траело около 75 000 години.",
          "Светлината изминава същия път за около 4,2 години.",
        ],
        you: (n) => `Със скоростта на „Вояджър 1“ пътуването би траело около 75 000 години: ${n} пъти колкото досегашния ти живот.`,
        ref: (n) => `Със скоростта на „Вояджър 1“ пътуването би траело около 75 000 години: ${n} пъти колкото живота на човек на 30.`,
      },
      exoWhat: {
        title: "Какво са екзопланетите?", goal: "Знаеш какво е екзопланета и кога са открити първите.",
        text: [
          "Екзопланетата е планета извън нашата Слънчева система. Обикновено обикаля друга звезда, но някои се скитат без слънце из галактиката, във вечен мрак.",
          "Първите екзопланети са открити през 1992 г., около пулсар. През 1995 г. последва 51 Пегас b, първата около звезда като Слънцето; откривателите ѝ Мишел Майор и Дидие Кело получиха за това Нобелова награда за физика през 2019 г. Каталогът на тази карта, архивът на екзопланетите на NASA, съдържа 6423 потвърдени планети (октомври 2026 г.).",
        ],
        task: "Полети до 51 Пегас b, първата планета, открита около звезда като Слънцето.",
        remember: [
          "Екзопланетата е планета извън нашата Слънчева система; обикновено обикаля друга звезда.",
          "Първите екзопланети са открити през 1992 г., около пулсар.",
          "51 Пегас b (1995) е първата около звезда като Слънцето: Нобелова награда за физика 2019.",
        ],
        you: (at, now, year) => `През ${year} г., годината на раждането ти, са били открити ${at} от планетите в този каталог; днес са ${now}.`,
        ref: (at, now, year) => `През ${year} г., когато се е родил човек, който днес е на 30, са били открити ${at} от планетите в този каталог; днес са ${now}.`,
      },
      exoHow: {
        title: "Как се откриват?", goal: "Можеш да обясниш транзитния метод и метода на радиалната скорост.",
        text: [
          "Екзопланетите трудно се виждат пряко: звездите им са много по-ярки. Транзитният метод следи светлината на звезда: когато планета мине пред нея, звездата съвсем леко отслабва. Повечето известни екзопланети са открити така, хиляди от тях с телескопа „Кеплер“ на NASA.",
          "Методът на радиалната скорост гледа самата звезда: планетата я дърпа и звездата леко се клати. Светлината ѝ се свива и разтяга на смени, леко се отмества към синьото и към червеното. Така са открити 51 Пегас b и Проксима b.",
        ],
        task: "Полети до Кеплер-22 b, планета, която телескопът „Кеплер“ откри с транзитния метод.",
        remember: [
          "Транзит: планета, която минава пред звездата си, леко отслабва светлината ѝ.",
          "Радиална скорост: планетата клати звездата си и светлината на звездата се отмества.",
          "Повечето известни екзопланети са открити с транзитния метод.",
        ],
        you: (n) => `От годината на раждането ти досега ${n} планети от този каталог са открити с транзитния метод.`,
        ref: (n) => `От годината на раждане на човек, който днес е на 30, досега ${n} планети от този каталог са открити с транзитния метод.`,
      },
      exoRocky: {
        title: "Скалисти светове и суперземи", goal: "Можеш да различиш земеподобните планети от суперземите.",
        text: [
          "Земеподобните планети са колкото Земята или по-малки и са от скали, силикати, вода или въглерод. Суперземите са по-масивни от Земята, но по-леки от Нептун; може да са от газ, скали или и двете.",
          "Седем планети с размера на Земята обикалят TRAPPIST-1, малко червено джудже на около 40 светлинни години. Няколко от тях са в обитаемата му зона; колко точно, е различно в различните изследвания. TRAPPIST-1 e обикаля звездата си за 6,1 дни.",
        ],
        task: "Полети до TRAPPIST-1 e, планета с размера на Земята около малко червено джудже.",
        remember: [
          "Земеподобни планети: колкото Земята или по-малки, от скали, силикати, вода или въглерод.",
          "Суперземи: по-масивни от Земята, по-леки от Нептун.",
          "TRAPPIST-1 има седем планети с размера на Земята, на около 40 светлинни години от нас.",
        ],
        you: (n) => `На TRAPPIST-1 e щеше да си на ${n} години: годината там трае 6,1 дни.`,
        ref: (n) => `Човек на 30 години щеше да е на ${n} години на TRAPPIST-1 e: годината там трае 6,1 дни.`,
      },
      exoGiants: {
        title: "Газови гиганти и горещи юпитери", goal: "Знаеш какво са газовите гиганти и горещите юпитери.",
        text: [
          "Газовите гиганти са големи колкото Сатурн или Юпитер или много по-големи. Нептуноподобните планети са горе-долу колкото Нептун или Уран.",
          "51 Пегас b е горещ юпитер: газов гигант, който обикаля звездата си само за 4,2 дни, на 0,05 а.е., много по-близо, отколкото е Меркурий до Слънцето (0,39 а.е.). HD 209458 b е друг газов гигант близо до звездата си: годината му трае 3,5 дни.",
        ],
        task: "Полети до HD 209458 b, газов гигант, чиято година трае 3,5 дни.",
        remember: [
          "Газовите гиганти са колкото Сатурн или Юпитер или много по-големи.",
          "Горещият юпитер е газов гигант много близо до звездата си.",
          "51 Пегас b обикаля звездата си за 4,2 дни.",
        ],
        you: (n) => `На 51 Пегас b щеше да си на ${n} години: годината там трае 4,2 дни.`,
        ref: (n) => `Човек на 30 години щеше да е на ${n} години на 51 Пегас b: годината там трае 4,2 дни.`,
      },
      exoStrange: {
        title: "Странни светове", goal: "Познаваш няколко свята, различни от всичко в нашата Слънчева система.",
        text: [
          "55 Рак e е суперземя, която обикаля звездата си за 0,74 дни, по-малко от 18 часа. NASA я описва като свръхгорещ свят, покрит с океан от лава.",
          "Не всяка екзопланета има слънце: някои се скитат сами из галактиката, във вечен мрак. Всяка година в каталога влизат нови светове; всичките 6423 от тази карта можеш да разгледаш в 3D изгледа.",
        ],
        task: "Полети до 55 Рак e, света с океан от лава.",
        remember: [
          "55 Рак e: суперземя с година под 18 часа и океан от лава.",
          "Някои екзопланети нямат слънце и се скитат в мрака из галактиката.",
          "Всяка година се откриват нови екзопланети.",
        ],
        you: (n) => `На 55 Рак e вече щеше да имаш ${n} рождени дни: годината там трае по-малко от 18 часа.`,
        ref: (n) => `Човек на 30 години вече щеше да има ${n} рождени дни на 55 Рак e: годината там трае по-малко от 18 часа.`,
      },
      exoSystems: {
        title: "Планетни системи", goal: "Знаеш, че много звезди имат по няколко планети, и познаваш две особени системи.",
        text: [
          "Много звезди имат повече от една планета: в тази карта такива са 1069 звезди (октомври 2026). Седемте планети на TRAPPIST-1 обикалят толкова близо до малката си звезда, че според НАСА всички биха се събрали вътре в орбитата на Меркурий.",
          "Около подобната на Слънцето звезда Kepler-90 са известни осем планети, колкото в нашата Слънчева система. Осмата е открита през 2017 г. от изкуствена невронна мрежа на Google, която претърсва данните на телескопа „Кеплер“. В тази карта звездата е записана с другото си име KOI-351.",
        ],
        task: "Полети до KOI-351, звездата Kepler-90 с осемте ѝ планети.",
        remember: [
          "Много звезди имат по няколко планети.",
          "Всичките седем планети на TRAPPIST-1 биха се събрали вътре в орбитата на Меркурий.",
          "Kepler-90 има осем планети, колкото нашата Слънчева система; осмата е открита през 2017 г. от изкуствен интелект.",
        ],
        you: (n, e) => `От раждането ти TRAPPIST-1 b е обиколил звездата си около ${n} пъти, а Земята Слънцето ${e} пъти.`,
        ref: (n, e) => `За 30 години TRAPPIST-1 b обикаля звездата си около ${n} пъти, а Земята Слънцето ${e} пъти.`,
      },
      exoFamous: {
        title: "Прочути екзопланети", goal: "Познаваш две екзопланети, които изглеждат различно от това, което очакваш.",
        text: [
          "HD 189733 b е газов гигант, който обикаля звездата си за 2,2 дни. Според НАСА той е кобалтовосин: цветът идва от мъглява, нажежена атмосфера с облаци, които съдържат стъкло. Открит е през 2005 г. по метода на радиалната скорост.",
          "Kepler-16 b обикаля едновременно две звезди, оранжево и червено джудже, които се обикалят една друга на всеки 41 дни. Една обиколка около двете му отнема 229 дни, а по размер и маса прилича на Сатурн. Когато е обявен през 2011 г., изследователите го сравняват с Татуин от „Междузвездни войни“, светът с две слънца.",
        ],
        task: "Полети до HD 189733 b, синята планета с облаци от стъкло.",
        remember: [
          "HD 189733 b е кобалтовосин; облаците му съдържат стъкло.",
          "Kepler-16 b обикаля две звезди, като Татуин в „Междузвездни войни“.",
          "Kepler-16 b прилича на Сатурн по размер и маса.",
        ],
        you: (n) => `На Kepler-16 b, светът с две слънца, щеше да си на ${n} години: една година там трае 229 дни.`,
        ref: (n) => `Човек на 30 години щеше да е на ${n} на Kepler-16 b, светът с две слънца: една година там трае 229 дни.`,
      },
      nebWhat: {
        title: "Какво е мъглявина?", goal: "Знаеш какво е мъглявина и двата начина, по които се образуват мъглявини.",
        text: [
          "Според НАСА мъглявината е огромен облак от прах и газ в космоса.",
          "Някои мъглявини идват от газа и праха, изхвърлени при експлозията на умираща звезда, например свръхнова. Други са области, в които започват да се образуват нови звезди, като мъглявината Орион от пътеката за раждането на звездите.",
        ],
        task: "Разгледай съзвездието Орион: под пояса му е мъглявината Орион, мъглявина, в която се раждат звезди.",
        remember: [
          "Мъглявината е огромен облак от прах и газ в космоса.",
          "Някои мъглявини идват от умиращи звезди, например от свръхнова.",
          "Други са области, в които се образуват нови звезди.",
        ],
        you: (p) => `Светлината на мъглявината Орион пътува около 1500 години. През досегашния ти живот тя е изминала около ${p} % от този път.`,
        ref: (p) => `Светлината на мъглявината Орион пътува около 1500 години. За 30 години тя изминава около ${p} % от този път.`,
      },
      nebPillars: {
        title: "Стълбовете на сътворението", goal: "Познаваш най-известната снимка на звездна детска градина.",
        text: [
          "В мъглявината Орел (M16) в съзвездието Змия са Стълбовете на сътворението: кули от газ и прах, в които се раждат нови звезди. НАСА дава разстояние 7000 светлинни години, ЕКА 6500: двете страници не съвпадат.",
          "Хъбъл е снимал стълбовете няколко пъти. На 19 октомври 2022 г. космическият телескоп „Уеб“ ги показва в нова снимка, пълна с млади звезди.",
        ],
        task: "Разгледай съзвездието Змия: мъглявината Орел е в него.",
        remember: [
          "Стълбовете на сътворението са в мъглявината Орел (M16) в Змия.",
          "Те са на 6500 (ЕКА) или 7000 (НАСА) светлинни години.",
          "„Уеб“ ги показва в нова снимка през октомври 2022 г.",
        ],
        you: (before, at) => (before != null ? `Снимката на „Уеб“ излиза през 2022 г., ${before} години преди раждането ти.` : at === "0" ? "Снимката на „Уеб“ излиза през 2022 г., в годината на раждането ти." : `Снимката на „Уеб“ излиза през 2022 г., на твоите ${at} години.`),
        ref: (ago) => `Снимката на „Уеб“ излиза през 2022 г., преди ${ago} години.`,
      },
      nebDark: {
        title: "Тъмни мъглявини", goal: "Знаеш, че някои мъглявини са тъмни.",
        text: [
          "Не всяка мъглявина свети. Мъглявината Конска глава в Орион е тъмна мъглявина: тъмен облак от прах и газ във формата на конска глава.",
          "Според ЕКА/Хъбъл тя е на около 1300 светлинни години, малко по-близо от мъглявината Орион в същото съзвездие.",
        ],
        task: "Разгледай още веднъж съзвездието Орион: и мъглявината Конска глава е в него.",
        remember: [
          "Някои мъглявини са тъмни: тъмни облаци от прах и газ.",
          "Конската глава е тъмна мъглявина в Орион.",
          "Тя е на около 1300 светлинни години.",
        ],
        you: (year) => `Светлината на Конската глава, която пристига днес, е тръгнала около ${year} г., много преди раждането ти.`,
        ref: (year) => `Светлината на Конската глава, която пристига днес, е тръгнала около ${year} г.`,
      },
      nebRing: {
        title: "Мъглявината Пръстен", goal: "Знаеш как изглежда планетарна мъглявина и откъде идва.",
        text: [
          "Когато звезда като Слънцето умира, тя изхвърля външните си слоеве; според НАСА те образуват разширяващ се облак, планетарна мъглявина. Така ще свърши и Слънцето.",
          "Най-известната е мъглявината Пръстен (M57) в съзвездието Лира, според НАСА на около 2000 светлинни години.",
        ],
        task: "Разгледай съзвездието Лира: мъглявината Пръстен е в него.",
        remember: [
          "Планетарната мъглявина са изхвърлените слоеве на умираща звезда като Слънцето.",
          "Мъглявината Пръстен (M57) е планетарна мъглявина в Лира.",
          "Тя е на около 2000 светлинни години.",
        ],
        you: (n) => `Светлината на мъглявината Пръстен пътува около 2000 години: около ${n} пъти колкото си живял досега.`,
        ref: (n) => `Светлината на мъглявината Пръстен пътува около 2000 години: около ${n} пъти колкото един живот от 30 години.`,
      },
      nebCrab: {
        title: "Мъглявината Рак", goal: "Познаваш мъглявина, останала от свръхнова, видяна от Земята.",
        text: [
          "Мъглявината Рак (M1) в Телец е остатък от свръхнова, според НАСА на 6500 светлинни години. През 1054 г. китайски астрономи забелязват там „звезда гостенка“: това е експлозия на свръхнова.",
          "В средата на мъглявината има бързо въртяща се неутронна звезда, пулсар: ядрото на избухналата звезда.",
        ],
        task: "Разгледай съзвездието Телец: мъглявината Рак е в него.",
        remember: [
          "Мъглявината Рак е остатък от свръхнова, в Телец.",
          "Китайски астрономи виждат свръхновата през 1054 г. като „звезда гостенка“.",
          "В средата ѝ се върти неутронна звезда, пулсар.",
        ],
        you: (before) => `Китайски астрономи виждат звездата гостенка през 1054 г., ${before} години преди раждането ти.`,
        ref: (ago) => `Китайски астрономи виждат звездата гостенка през 1054 г., преди ${ago} години.`,
      },
      mwWhat: {
        title: "Нашата галактика", goal: "Знаеш формата и размера на Млечния път.",
        text: [
          "Млечният път е нашата галактика. Според НАСА той е спирала с пречка: диск със спирални ръкави и пречка от звезди в средата. Голям е над 100 000 светлинни години.",
          "Според ЕКА в него има над сто милиарда звезди. Слънцето е една от тях.",
        ],
        task: "Разгледай съзвездието Стрелец: в неговата посока е центърът на Млечния път.",
        remember: [
          "Млечният път е спирална галактика с пречка.",
          "Голям е над 100 000 светлинни години.",
          "Според ЕКА има над 100 милиарда звезди.",
        ],
        you: (p) => `На светлината ѝ трябват около 100 000 години, за да прекоси Млечния път (изчислено от размера му). Досегашният ти живот е около ${p} % от това.`,
        ref: (p) => `На светлината ѝ трябват около 100 000 години, за да прекоси Млечния път (изчислено от размера му). Един живот от 30 години е около ${p} % от това.`,
      },
      mwArm: {
        title: "Нашето място: ръкавът на Орион", goal: "Знаеш къде е Слънцето в Млечния път.",
        text: [
          "Според НАСА Слънцето е близо до малък, непълен ръкав, ръкава на Орион, между ръкавите на Стрелец и Персей, около средата на пътя от центъра до края.",
          "НАСА дава разстоянието до центъра около 8 килопарсека, изчислено около 26 000 светлинни години; ЕЮО дава за черната дупка в средата около 27 000 светлинни години.",
        ],
        task: "Разгледай Слънцето: то е в ръкава на Орион, далеч от центъра.",
        remember: [
          "Слънцето е близо до ръкава на Орион, малък, непълен ръкав.",
          "Той е между ръкавите на Стрелец и Персей.",
          "Центърът е на около 26 000 до 27 000 светлинни години.",
        ],
        you: (ly, p) => `През живота ти светлината е изминала ${ly} светлинни години: около ${p} % от пътя до центъра.`,
        ref: (ly, p) => `За ${ly} години светлината изминава ${ly} светлинни години: около ${p} % от пътя до центъра.`,
      },
      mwOrbit: {
        title: "Пътуването около центъра", goal: "Знаеш, че Слънцето обикаля центъра на Млечния път.",
        text: [
          "Слънцето обикаля центъра на Млечния път и носи планетите със себе си. Според НАСА то се движи средно с 720 000 километра в час.",
          "Една обиколка трае много дълго: страницата на НАСА за Слънцето казва около 230 милиона години, страницата на НАСА за галактиките и ЕКА около 240 милиона. Страниците не съвпадат.",
        ],
        task: "Разгледай Слънцето: с всичките си планети то обикаля центъра на Млечния път.",
        remember: [
          "Слънцето обикаля центъра на Млечния път.",
          "То се движи с около 720 000 km/h.",
          "Една обиколка трае около 230 до 240 милиона години.",
        ],
        you: (km, n) => `От раждането ти Слънцето те е пренесло около ${km} милиарда km около центъра (изчислено с 720 000 km/h). Една обиколка трае около ${n} пъти досегашния ти живот.`,
        ref: (km, n) => `За 30 години Слънцето ни пренася около ${km} милиарда km около центъра (изчислено с 720 000 km/h). Една обиколка трае около ${n} пъти повече.`,
      },
      mwBand: {
        title: "Ивицата на небето", goal: "Знаеш какво е светлата ивица на нощното небе.",
        text: [
          "В тъмна нощ бледа светла ивица се простира през небето. Според НАСА това е централният диск на нашата галактика, погледнат откъм ръба.",
          "Виждаме го отвътре: самото Слънце е в диска. В посока Стрелец гледаме към центъра.",
        ],
        task: "Разгледай съзвездието Стрелец: там ивицата сочи към центъра.",
        remember: [
          "Светлата ивица на нощното небе е дискът на Млечния път.",
          "Виждаме диска откъм ръба, отвътре.",
          "В посока Стрелец е центърът.",
        ],
        you: () => "Ивицата, която можеш да видиш в тъмна нощ, е дискът, в който живееш самият ти.",
        ref: () => "Ивицата, която може да се види в тъмна нощ, е дискът, в който живеем всички.",
      },
      mwGaia: {
        title: "Картата на Гая", goal: "Знаеш как „Гая“ на ЕКА е измерила Млечния път и откъде са звездите на тази карта.",
        text: [
          "Космическият телескоп „Гая“ на ЕКА е измерил местата и разстоянията на звезди за точна триизмерна карта на Млечния път. Третото му публикуване на данни от 13 юни 2022 г. съдържа 1 811 709 771 източника; страницата на мисията на ЕКА говори за два милиарда звезди и други обекти.",
          "„Гая“ приключва научните си наблюдения на 15 януари 2025 г. Повечето звезди на тази карта са от Gaia DR3: близките звезди до 326 светлинни години и около един милион ярки звезди.",
        ],
        task: "За тази стъпка няма задача в 3D изгледа: цялата карта е задачата. Отговори на въпросите и стъпката е изпълнена.",
        remember: [
          "„Гая“ е направила точна 3D карта на Млечния път.",
          "Gaia DR3 (2022 г.) съдържа около 1,8 милиарда източника.",
          "Повечето звезди на тази карта са от Gaia DR3.",
        ],
        you: (before, at) => (before != null ? `Gaia DR3 излиза през 2022 г., ${before} години преди раждането ти.` : at === "0" ? "Gaia DR3 излиза през 2022 г., в годината на раждането ти." : `Gaia DR3 излиза през 2022 г., на твоите ${at} години.`),
        ref: (ago) => `Gaia DR3 излиза през 2022 г., преди ${ago} години.`,
      },
      locGroup: {
        title: "Местната група", goal: "Познаваш групата галактики, към която принадлежи Млечният път.",
        text: [
          "Според НАСА Млечният път принадлежи към група от над 50 галактики, Местната група. Най-големите членове са галактиката Андромеда, Млечният път и галактиката Триъгълник (M33), третата по големина.",
          "Галактиката Триъгълник е на около 3 милиона светлинни години. Според НАСА тя е един от най-далечните обекти, които наблюдатели с остро зрение могат да видят.",
        ],
        task: "Разгледай съзвездието Триъгълник: галактиката Триъгълник е в него.",
        remember: [
          "Млечният път принадлежи към Местната група от над 50 галактики.",
          "Най-големите са Андромеда, Млечният път и Триъгълник.",
          "Галактиката Триъгълник (M33) е на около 3 милиона светлинни години.",
        ],
        you: (n) => `Светлината на галактиката Триъгълник пътува около 3 милиона години: около ${n} пъти досегашния ти живот.`,
        ref: (n) => `Светлината на галактиката Триъгълник пътува около 3 милиона години: около ${n} пъти един живот от 30 години.`,
      },
      locMagellan: {
        title: "Магелановите облаци", goal: "Познаваш спътниците на Млечния път.",
        text: [
          "Млечният път има малки спътници. Според ЕКА/Хъбъл Големият Магеланов облак е галактика спътник на Млечния път.",
          "Малкият Магеланов облак е на 200 000 светлинни години в съзвездието Тукан.",
        ],
        task: "Разгледай съзвездието Тукан: Малкият Магеланов облак е в него.",
        remember: [
          "Големият Магеланов облак е галактика спътник на Млечния път.",
          "Малкият Магеланов облак е на 200 000 светлинни години.",
          "Той е в съзвездието Тукан.",
        ],
        you: (n) => `Светлината на Малкия Магеланов облак пътува 200 000 години: около ${n} пъти досегашния ти живот.`,
        ref: (n) => `Светлината на Малкия Магеланов облак пътува 200 000 години: около ${n} пъти един живот от 30 години.`,
      },
      locAndromeda: {
        title: "Галактиката Андромеда", goal: "Познаваш голямата ни съседна галактика.",
        text: [
          "Галактиката Андромеда (M31) е най-голямата галактика в Местната група. Според НАСА тя е на 2,5 милиона светлинни години, в съзвездието Андромеда.",
          "Въпреки това от тъмно място лесно се вижда с просто око. Светлината, която виждаш тогава, е тръгнала преди 2,5 милиона години.",
        ],
        task: "Разгледай съзвездието Андромеда: галактиката Андромеда е в него.",
        remember: [
          "Галактиката Андромеда е най-голямата галактика в Местната група.",
          "Тя е на 2,5 милиона светлинни години.",
          "От тъмно място се вижда с просто око.",
        ],
        you: (n) => `Светлината на Андромеда пътува 2,5 милиона години: около ${n} пъти досегашния ти живот.`,
        ref: (n) => `Светлината на Андромеда пътува 2,5 милиона години: около ${n} пъти един живот от 30 години.`,
      },
      locApproach: {
        title: "Андромеда се приближава", goal: "Знаеш какво предсказва НАСА през 2012 г. за Млечния път и Андромеда.",
        text: [
          "Според НАСА Андромеда се движи към Млечния път с около 250 000 мили в час, около 400 000 километра в час.",
          "През 2012 г. НАСА предсказва с данни от „Хъбъл“ челен сблъсък след около четири милиарда години. След около 6 милиарда години двете галактики биха се слели в една.",
        ],
        task: "Разгледай още веднъж съзвездието Андромеда: оттам съседката ни се приближава.",
        remember: [
          "Андромеда се приближава към нас с около 400 000 km/h.",
          "НАСА предсказва през 2012 г. сблъсък след около 4 милиарда години.",
          "След около 6 милиарда години двете биха се слели в една.",
        ],
        you: (km) => `От раждането ти Андромеда се е приближила с около ${km} милиарда km (изчислено с 250 000 мили в час).`,
        ref: (km) => `За 30 години Андромеда се приближава с около ${km} милиарда km (изчислено с 250 000 мили в час).`,
      },
      locFuture: {
        title: "Колко сигурно е бъдещето?", goal: "Знаеш, че една прогноза на науката може да се промени с нови данни.",
        text: [
          "През 2025 г. екип на Тил Савала проверява отново, с данни от „Хъбъл“ и „Гая“ на ЕКА. Според ЕКА/Хъбъл шансът двете галактики да се сблъскат през следващите 10 милиарда години е само 50 на 50.",
          "Така работи науката: прогнозата важи, докато данните я подкрепят. С по-добри измервания сблъсъкът от 2012 г. става възможност.",
        ],
        task: "За тази стъпка няма задача в 3D изгледа. Отговори на въпросите и стъпката е изпълнена.",
        remember: [
          "Проучване от 2025 г. дава само 50 на 50 за сблъсък в рамките на 10 милиарда години.",
          "То използва данни от „Хъбъл“ и „Гая“ на ЕКА.",
          "Прогнозите на науката може да се променят с нови данни.",
        ],
        you: (n) => `Четирите милиарда години от прогнозата от 2012 г. са около ${n} пъти досегашния ти живот.`,
        ref: (n) => `Четирите милиарда години от прогнозата от 2012 г. са около ${n} пъти един живот от 30 години.`,
      },
      nsWhat: {
        title: "Неутронни звезди", goal: "Знаеш какво е неутронна звезда и колко е плътна.",
        text: [
          "Според НАСА неутронните звезди се образуват, когато на масивна звезда ѝ свърши горивото и тя се срути. Те събират повече маса от Слънцето в кълбо с диаметър само около 20 километра.",
          "Материята им е невъобразимо плътна: според НАСА една бучка захар от нея би тежала около 1 трилион килограма. Картата има неутронни звезди с планети, например PSR B0329+54.",
        ],
        task: "Разгледай PSR B0329+54, неутронна звезда с планета.",
        remember: [
          "Неутронната звезда се образува, когато на масивна звезда ѝ свърши горивото и тя се срути.",
          "Тя събира повече маса от Слънцето в кълбо от около 20 km.",
          "Бучка захар от материята ѝ би тежала около 1 трилион килограма.",
        ],
        you: (name, m) => `Твоята звезда ${name} има ${m} пъти масата на Слънцето и е много по-голяма от град. Неутронната звезда събира повече от цяло Слънце в около 20 km.`,
        ref: (name, m) => `${name} има ${m} пъти масата на Слънцето и е много по-голяма от град. Неутронната звезда събира повече от цяло Слънце в около 20 km.`,
        none: () => "Неутронната звезда събира повече от цяло Слънце в около 20 km.",
      },
      nsPulsar: {
        title: "Пулсари", goal: "Знаеш какво е пулсар и защо мига.",
        text: [
          "Според НАСА пулсарите са въртящи се неутронни звезди, които изпращат импулси от лъчение. Можеш да си ги представиш като фар: лъчът им минава покрай нас отново и отново. Между импулсите обикновено има от милисекунди до секунди.",
          "Около пулсара PSR B1257+12 са открити планети; НАСА ги брои сред първите открити. Таблицата на НАСА в тази карта дава 1992 г. за две от тях и 1994 г. за третата.",
        ],
        task: "Разгледай PSR B1257+12, пулсар с три планети.",
        remember: [
          "Пулсарът е въртяща се неутронна звезда, която изпраща импулси от лъчение.",
          "Действа като фар: лъчът му минава покрай нас.",
          "Импулсите му идват на всеки няколко милисекунди до секунди.",
        ],
        you: (n) => `Пулсар, който мига веднъж в секунда, би мигнал около ${n} пъти от раждането ти. (Изчислено.)`,
        ref: (n) => `Пулсар, който мига веднъж в секунда, мига около ${n} пъти за 30 години. (Изчислено.)`,
      },
      bhWhat: {
        title: "Какво е черна дупка?", goal: "Знаеш какво е черна дупка и какво не е.",
        text: [
          "Според НАСА гравитацията на черната дупка е толкова силна, че нищо, дори светлината, не може да избяга. Звезда с повече от осем пъти масата на Слънцето може да остави такава: ядрото ѝ се срутва в черна дупка със звездна маса.",
          "Но черните дупки не са космически прахосмукачки: според НАСА те не засмукват друга материя. Ако Слънцето бъде заменено с черна дупка със същата маса, планетите ще останат на орбитите си.",
        ],
        task: "За тази стъпка няма задача в 3D изгледа: черната дупка не се вижда. Отговори на въпросите и стъпката е изпълнена.",
        remember: [
          "От черна дупка нищо не избягва, дори светлината.",
          "Ядрото на много тежка звезда може да се срути в черна дупка.",
          "Черните дупки не засмукват материя; планетите биха останали на орбитите си.",
        ],
        you: (ly) => `Светлината е толкова бърза, че през живота ти е изминала ${ly} светлинни години. От черна дупка не излиза.`,
        ref: (ly) => `Светлината е толкова бърза, че за ${ly} години изминава ${ly} светлинни години. От черна дупка не излиза.`,
      },
      bhCenter: {
        title: "Черната дупка в нашия център", goal: "Познаваш черната дупка в центъра на Млечния път.",
        text: [
          "Според НАСА свръхмасивните черни дупки имат от стотици хиляди до милиарди пъти масата на Слънцето, а галактиките имат по една в центъра си.",
          "Нашата се казва Стрелец A*. Според ЕЮО тя е четири милиона пъти по-масивна от Слънцето и е на около 27 000 светлинни години, в посока на съзвездието Стрелец.",
        ],
        task: "Разгледай съзвездието Стрелец: в неговата посока е центърът на Млечния път.",
        remember: [
          "Свръхмасивните черни дупки са в центровете на галактиките.",
          "Стрелец A* е четири милиона пъти по-масивна от Слънцето.",
          "Тя е на около 27 000 светлинни години, в посока Стрелец.",
        ],
        you: (before) => `Светлината от областта на Стрелец A*, която пристига днес, пътува около 27 000 години: тръгнала е около ${before} години преди раждането ти.`,
        ref: () => "Светлината от областта на Стрелец A*, която пристига днес, пътува около 27 000 години.",
      },
      bhImage: {
        title: "Първото изображение на черна дупка", goal: "Знаеш как са снимани черните дупки.",
        text: [
          "На 10 април 2019 г. Event Horizon Telescope показва първото изображение на черна дупка: тази в галактиката M87, според ЕЮО на 55 милиона светлинни години и с 6,5 милиарда пъти масата на Слънцето. Вижда се пръстеновидна структура с тъмна среда.",
          "На 12 май 2022 г. следва първото изображение на Стрелец A*, черната дупка в центъра на собствения ни Млечен път.",
        ],
        task: "Разгледай съзвездието Дева: в неговата посока е галактиката M87.",
        remember: [
          "Първото изображение на черна дупка е показано на 10 април 2019 г. (M87).",
          "Вижда се пръстеновидна структура с тъмна среда.",
          "Изображението на Стрелец A* следва на 12 май 2022 г.",
        ],
        you: (before, at) => (before != null ? `Първото изображение на черна дупка е показано през 2019 г., ${before} години преди раждането ти.` : at === "0" ? "Първото изображение на черна дупка е показано през 2019 г., в годината на раждането ти." : `Първото изображение на черна дупка е показано през 2019 г., на твоите ${at} години.`),
        ref: (ago) => `Първото изображение на черна дупка е показано през 2019 г., преди ${ago} години.`,
      },
      lifeMain: {
        title: "Главната последователност", goal: "Знаеш най-дългата фаза в живота на една звезда.",
        text: [
          "Според НАСА звездите, които стабилно сливат водород в хелий в ядрото си, се наричат звезди от главната последователност. Това е най-дългата фаза в живота на звездата и около 90 % от звездите са в нея.",
          "Слънцето е една от тях, приблизително в средата на тази фаза. Според НАСА то ще прекара около 10 милиарда години в главната последователност.",
        ],
        task: "Разгледай Слънцето, в средата на главната си последователност.",
        remember: [
          "В главната последователност звездата стабилно слива водород в хелий.",
          "Това е най-дългата фаза в живота на звездата.",
          "Слънцето е приблизително в средата на своите около 10 милиарда години там.",
        ],
        you: (sec) => `Ако 10-те милиарда години на Слънцето в главната последователност бяха една година, досегашният ти живот щеше да е траял около ${sec} секунди. (Изчислено.)`,
        ref: (sec) => `Ако 10-те милиарда години на Слънцето в главната последователност бяха една година, един живот от 30 години щеше да е траял около ${sec} секунди. (Изчислено.)`,
      },
      lifeMass: {
        title: "Масата решава", goal: "Знаеш защо тежките звезди живеят кратко, а леките дълго.",
        text: [
          "Според НАСА по-масивната звезда изразходва горивото си по-бързо. Затова най-тежките звезди живеят само няколко милиона години.",
          "Леките звезди са пестеливи: според НАСА някои звезди с малка маса ще светят трилиони години. Проксима Кентавър е такава лека звезда: червено джудже с около една осма от масата на Слънцето според таблицата на НАСА в тази карта.",
        ],
        task: "Разгледай Проксима Кентавър, леко червено джудже с много дълъг живот пред себе си.",
        remember: [
          "По-масивната звезда изразходва горивото си по-бързо.",
          "Най-тежките звезди живеят само няколко милиона години.",
          "Някои леки звезди светят трилиони години.",
        ],
        you: (name, m, light) => `Твоята звезда ${name} има ${m} пъти масата на Слънцето, ${light ? "по-малко: изразходва горивото си по-бавно и живее по-дълго от Слънцето" : "повече: изразходва горивото си по-бързо и живее по-кратко от Слънцето"}.`,
        ref: (name, m, light) => `${name} има ${m} пъти масата на Слънцето, ${light ? "по-малко: изразходва горивото си по-бавно и живее по-дълго от Слънцето" : "повече: изразходва горивото си по-бързо и живее по-кратко от Слънцето"}.`,
        none: (name) => `Таблицата не дава маса за ${name}.`,
      },
      lifeGiant: {
        title: "Червеният гигант", goal: "Знаеш какво става, когато в ядрото на звездата свърши водородът.",
        text: [
          "Когато в ядрото на звездата свърши водородът за сливане в хелий, ядрото започва да се свива, а звездата бавно се раздува. Според НАСА резултатът е червен гигант.",
          "Това ще се случи и със Слънцето: според НАСА то ще стане червен гигант след около 5 милиарда години.",
        ],
        task: "Разгледай Слънцето: след около 5 милиарда години то ще е червен гигант.",
        remember: [
          "Без водород в ядрото ядрото се свива, а звездата се раздува.",
          "Резултатът е червен гигант.",
          "Слънцето ще стане червен гигант след около 5 милиарда години.",
        ],
        you: (n) => `5-те милиарда години до червения гигант са около ${n} пъти досегашния ти живот.`,
        ref: (n) => `5-те милиарда години до червения гигант са около ${n} пъти един живот от 30 години.`,
      },
      lifeWhite: {
        title: "Бели джуджета", goal: "Знаеш как свършват звезди като Слънцето.",
        text: [
          "Когато червеният гигант изхвърли цялата си атмосфера, остава само ядрото: бяло джудже. Според НАСА то обикновено е голямо колкото Земята, а една чаена лъжичка от материята му би тежала повече от пикап. То бавно изстива милиарди години; изхвърлените слоеве образуват разширяващ се облак, планетарна мъглявина.",
          "Според НАСА звездите до около 7 пъти масата на Слънцето свършват като бели джуджета, и Слънцето. Картата има бели джуджета с планети: около WD 1856+534 таблицата на НАСА познава една, открита през 2020 г.",
        ],
        task: "Разгледай WD 1856+534, бяло джудже с планета.",
        remember: [
          "Бялото джудже е останалото ядро на звезда, обикновено голямо колкото Земята.",
          "Една чаена лъжичка от материята му би тежала повече от пикап.",
          "Звездите до около 7 пъти масата на Слънцето свършват като бели джуджета.",
        ],
        you: (name, m, fate) => `Твоята звезда ${name} има ${m} пъти масата на Слънцето: ${fate === "white" ? "тя ще свърши като бяло джудже." : fate === "nova" ? "тя е достатъчно тежка за свръхнова." : "тя е на границата между бяло джудже и свръхнова."}`,
        ref: (name, m, fate) => `${name} има ${m} пъти масата на Слънцето: ${fate === "white" ? "тя ще свърши като бяло джудже." : fate === "nova" ? "тя е достатъчно тежка за свръхнова." : "тя е на границата между бяло джудже и свръхнова."}`,
        none: (name) => `Таблицата не дава маса за ${name}.`,
      },
      lifeNova: {
        title: "Свръхнова и звезден прах", goal: "Знаеш как свършват тежките звезди и откъде идват елементите.",
        text: [
          "Според НАСА звезда с повече от осем пъти масата на Слънцето избухва накрая като свръхнова; друга страница на НАСА поставя границата при седем. Ядрото ѝ може да се свие в черна дупка: повече за това в следващата пътека.",
          "В ядрото си звездите сливат въглерод в по-тежки елементи като кислород, неон и магнезий, а свръхновите разпръскват елементите в космоса. Според НАСА всичко на Земята, и телата ни, е от елементи, създадени в ядрата на звездите.",
        ],
        task: "За тази стъпка няма задача в 3D изгледа. Отговори на въпросите и стъпката е изпълнена.",
        remember: [
          "Звездите с повече от около осем пъти масата на Слънцето свършват в свръхнова.",
          "Звездите създават по-тежки елементи като кислород; свръхновите ги разпръскват.",
          "Според НАСА и телата ни са от елементи от звездите.",
        ],
        you: (name, m, fate) => `Елементите на тялото ти са създадени в звезди. Твоята звезда ${name} (${m} слънчеви маси) ${fate === "nova" ? "един ден сама ще избухне." : "е твърде лека, за да избухне като свръхнова."}`,
        ref: (name, m, fate) => `Елементите на всяко човешко тяло са създадени в звезди. ${name} (${m} слънчеви маси) ${fate === "nova" ? "един ден сама ще избухне." : "е твърде лека, за да избухне като свръхнова."}`,
        none: () => "Елементите на тялото ти са създадени в звезди.",
      },
      birthCloud: {
        title: "Облаци от газ и прах", goal: "Знаеш къде се раждат звездите.",
        text: [
          "Според НАСА звездите се образуват в големи облаци от газ и прах, наречени молекулярни облаци. Те са студени, затова газът се събира на плътни бучки. В един момент гравитацията кара някои от тези бучки да се свият.",
          "Мъглявината Орион е такава звездна детска градина: според НАСА най-близката до Земята голяма област на звездообразуване, на около 1500 светлинни години, точно под пояса на Орион.",
        ],
        task: "Разгледай съзвездието Орион: мъглявината Орион е точно под пояса му.",
        remember: [
          "Звездите се раждат в студени облаци от газ и прах, молекулярните облаци.",
          "Гравитацията кара бучките в тези облаци да се свиват.",
          "Мъглявината Орион е най-близката голяма област на звездообразуване, на около 1500 светлинни години.",
        ],
        you: (before) => `Светлината на мъглявината Орион, която пристига днес, пътува около 1500 години: тръгнала е около ${before} години преди раждането ти.`,
        ref: () => "Светлината на мъглявината Орион, която пристига днес, пътува около 1500 години.",
      },
      birthProto: {
        title: "От бучка до протозвезда", goal: "Знаеш как свиваща се бучка става звезда.",
        text: [
          "Когато една бучка се свие, триенето нагрява материала и се образува протозвезда: според НАСА бебе звезда. След милиони години температурите в ядрото ѝ притискат водородните ядра: започва ядреният синтез, звездата свети.",
          "AU Mic, на около 32 светлинни години, е такава млада звезда. НАСА ѝ дава възраст от 20 до 30 милиона години: звездно бебе, Слънцето е поне 150 пъти по-старо.",
        ],
        task: "Разгледай AU Mic, млада звезда с планети.",
        remember: [
          "Свиващата се бучка се нагрява и става протозвезда, бебе звезда.",
          "След милиони години в ядрото ѝ започва синтезът на водород.",
          "AU Mic е само на 20 до 30 милиона години; Слънцето е поне 150 пъти по-старо.",
        ],
        you: (x) => `AU Mic е на 20 до 30 милиона години: смятано от средата, около ${x} пъти колкото теб. За звезда това е бебе.`,
        ref: (x) => `AU Mic е на 20 до 30 милиона години: смятано от средата, около ${x} пъти колкото човек на 30. За звезда това е бебе.`,
      },
      birthDisk: {
        title: "Дискът и планетите", goal: "Знаеш как около млада звезда растат планети.",
        text: [
          "Младата звезда още е заобиколена от диск от газ и прах, останал от раждането ѝ; според НАСА и AU Mic има такъв. В такъв диск твърди частици от скали и лед се сблъскват и сливат: така растат планетите.",
          "През 2018 г. ЕЮО показва първото потвърдено изображение на планета, която тъкмо се образува в такъв диск: PDS 70 b, около звезда, която ЕЮО поставя на почти 400 светлинни години (таблицата на НАСА в тази карта дава 369). През 2021 г. ALMA открива около сестринската ѝ планета PDS 70 c диск, в който може да се образуват луни.",
        ],
        task: "Разгледай PDS 70 с двете ѝ млади планети.",
        remember: [
          "Младата звезда е заобиколена от диск от газ и прах.",
          "В диска частици от скали и лед се сблъскват и растат в планети.",
          "PDS 70 b е първото потвърдено изображение на планета в процес на образуване (2018 г.).",
        ],
        you: (before, at) => (before != null ? `PDS 70 b е снимана през 2018 г., ${before} години преди раждането ти.` : at === "0" ? "PDS 70 b е снимана през 2018 г., в годината на раждането ти." : `PDS 70 b е снимана през 2018 г., на твоите ${at} години.`),
        ref: (ago) => `PDS 70 b е снимана през 2018 г., преди ${ago} години.`,
      },
      birthCluster: {
        title: "Звездите се раждат на групи", goal: "Знаеш, че звездите често се раждат заедно, в звездни купове.",
        text: [
          "Според НАСА звездите често се образуват на групи; такива групи се наричат звездни купове.",
          "Най-известният са Плеядите, разсеян звезден куп в Телец. НАСА дава разстоянието им около 445 светлинни години и добавя, че това число не е общоприето.",
        ],
        task: "Разгледай съзвездието Телец: Плеядите са в него.",
        remember: [
          "Звездите често се раждат на групи, звездните купове.",
          "Плеядите са разсеян звезден куп в Телец.",
          "Те са на около 445 светлинни години; числото не е общоприето.",
        ],
        you: (year, before) => `Светлината на Плеядите, която пристига днес, е тръгнала около ${year} г., около ${before} години преди раждането ти.`,
        ref: (year) => `Светлината на Плеядите, която пристига днес, е тръгнала около ${year} г.`,
      },
      birthSun: {
        title: "Раждането на Слънцето", goal: "Знаеш как и кога са се родили Слънцето и планетите му.",
        text: [
          "Според НАСА Слънцето се е образувало преди около 4,6 милиарда години в огромен въртящ се облак от газ и прах, слънчевата мъглявина. От голяма част от останалия материал са се образували планетите и другите тела на Слънчевата система, и Земята.",
          "Същата страница на НАСА в увода си нарича Слънцето на 4,5 милиарда години: двете числа са закръглени различно, и двете означават около четири милиарда и половина години.",
        ],
        task: "Разгледай Слънцето, родено преди 4,6 милиарда години.",
        remember: [
          "Слънцето се е образувало преди около 4,6 милиарда години.",
          "То се е родило във въртящ се облак от газ и прах, слънчевата мъглявина.",
          "От голяма част от останалия материал са се образували планетите, и Земята.",
        ],
        you: (ms) => `Ако досегашният живот на Слънцето беше един ден, досегашният ти живот щеше да е траял около ${ms} хилядни от секундата. (Смятано с 4,6 милиарда години.)`,
        ref: (ms) => `Ако досегашният живот на Слънцето беше един ден, един живот от 30 години щеше да е траял около ${ms} хилядни от секундата. (Смятано с 4,6 милиарда години.)`,
      },
      starWhat: {
        title: "Какво е звезда?", goal: "Знаеш какво е звезда и откъде идва светлината ѝ.",
        text: [
          "Според НАСА звездите са огромни кълба от горещ газ, които собствената им гравитация държи заедно. Слънцето е една от тях: най-близката до нас звезда.",
          "Дълбоко в ядрото си звездата притиска ядрата на водородни атоми и образува хелий. Този ядрен синтез освобождава енергията, с която тя свети. Слънцето го прави от около 4,6 милиарда години.",
        ],
        task: "Разгледай Слънцето, най-близката до нас звезда.",
        remember: [
          "Звездата е огромно кълбо от горещ газ, държано заедно от собствената му гравитация.",
          "В ядрото ѝ водородът се слива в хелий; от това тя свети.",
          "Слънцето е звезда, най-близката до нас.",
        ],
        you: (n) => `От раждането ти Земята е обиколила Слънцето ${n} пъти. През цялото това време Слънцето е сливало водород в хелий в ядрото си: това е светлината му.`,
        ref: (n) => `За ${n} години Земята обикаля Слънцето ${n} пъти. През цялото това време Слънцето слива водород в хелий в ядрото си: това е светлината му.`,
      },
      starColor: {
        title: "Цвят и температура", goal: "Можеш да познаеш по цвета на звездата дали е гореща или хладна.",
        text: [
          "Според НАСА звездите имат различни цветове, защото са с различна температура: по-горещите изглеждат сини или бели, по-хладните оранжеви или червени.",
          "Повърхността на Слънцето е около 5500 °C. TRAPPIST-1 е много по-хладна: таблицата на НАСА в тази карта ѝ дава 2566 келвина, около 2300 °C. Затова свети в червено.",
        ],
        task: "Разгледай TRAPPIST-1, хладна червена звезда.",
        remember: [
          "Цветът на звездата показва температурата ѝ.",
          "Горещите звезди изглеждат сини или бели, хладните оранжеви или червени.",
          "Повърхността на Слънцето е около 5500 °C.",
        ],
        you: (name, c, hotter) => `Твоята звезда ${name} е около ${c} °C на повърхността, ${hotter ? "по-гореща" : "по-хладна"} от Слънцето (около 5500 °C).`,
        ref: (name, c, hotter) => `${name} е около ${c} °C на повърхността, ${hotter ? "по-гореща" : "по-хладна"} от Слънцето (около 5500 °C).`,
        none: (name) => `Таблицата не дава температура за ${name}.`,
      },
      starClass: {
        title: "Класовете на звездите", goal: "Можеш да подредиш звезда по буквата ѝ: O, B, A, F, G, K, M.",
        text: [
          "Астрономията подрежда звездите в класове с букви, от най-горещите към най-хладните: O (синя), B (синьо-бяла), A (бяла), F (жълто-бяла), G (жълта), K (оранжева) и M (червена).",
          "Според НАСА Слънцето е жълто джудже от клас G. И 51 Пегас е звезда от клас G: около нея е открита първата планета около звезда като Слънцето.",
        ],
        task: "Разгледай 51 Пегас, звезда от клас G като Слънцето.",
        remember: [
          "Класовете от горещо към хладно: O, B, A, F, G, K, M.",
          "Звездите O са сини, звездите M червени.",
          "Слънцето е звезда от клас G, жълто джудже.",
        ],
        colors: { O: "синя", B: "синьо-бяла", A: "бяла", F: "жълто-бяла", G: "жълта", K: "оранжева", M: "червена" },
        you: (name, spec, color) => `В таблицата твоята звезда ${name} е от тип ${spec}: първата буква е класът ѝ, цветът ѝ е ${color}.`,
        ref: (name, spec, color) => `В таблицата ${name} е от тип ${spec}: първата буква е класът ѝ, цветът ѝ е ${color}.`,
        none: (name) => `Таблицата не дава тип за ${name}.`,
      },
      starSize: {
        title: "Големи и малки", goal: "Знаеш колко различни по размер са звездите и кои са най-чести.",
        text: [
          "Звездите са много различни по размер. Проксима Кентавър е червено джудже: таблицата на НАСА в тази карта ѝ дава 0,141 от радиуса на Слънцето, около една седма. Най-голямата звезда с планета в картата, HD 18438, е около 88 пъти по-голяма от Слънцето.",
          "Червените джуджета са най-честите звезди. НАСА дава дела им сред звездите на Млечния път на една страница около 73 %, на друга 75 %; звездите като Слънцето са само около 6 %.",
        ],
        task: "Разгледай Проксима Кентавър, малко червено джудже.",
        remember: [
          "Звездите са много различни по размер, от малки червени джуджета до гиганти.",
          "Около три четвърти от звездите на Млечния път са червени джуджета.",
          "Само около 6 % са звезди като Слънцето.",
        ],
        you: (name, x, small) => (small ? `Твоята звезда ${name} има около ${x} % от радиуса на Слънцето.` : `Твоята звезда ${name} е около ${x} пъти по-голяма от Слънцето.`),
        ref: (name, x, small) => (small ? `${name} има около ${x} % от радиуса на Слънцето.` : `${name} е около ${x} пъти по-голяма от Слънцето.`),
        none: (name) => `Таблицата не дава размер за ${name}.`,
      },
      starHosts: {
        title: "Звездите като дом за планети", goal: "Знаеш кои звезди НАСА смята за добър дом за живот.",
        text: [
          "Според НАСА звездите, малко по-хладни от Слънцето, оранжевите джуджета от клас K, се смятат за по-добри за развит живот.",
          "Червените джуджета (клас M) живеят още по-дълго: НАСА дава над 100 милиарда години. Но планетите в обитаемата им зона може напълно да изсъхнат. Въпреки това TOI-700, звезда M, има планета в зоната си.",
        ],
        task: "Разгледай TOI-700, червено джудже с планета в обитаемата зона.",
        remember: [
          "Оранжевите джуджета (клас K) се смятат за добри за развит живот.",
          "Червените джуджета (клас M) живеят най-дълго, над 100 милиарда години.",
          "Планетите в зоната на червено джудже може да изсъхнат.",
        ],
        hint: { G: "Тя прилича на Слънцето.", K: "Според НАСА оранжеви джуджета като нея се смятат за по-добри за развит живот.", M: "Червени джуджета като нея живеят много дълго, но планетите в зоната им може да изсъхнат." },
        you: (name, cls, hint) => `Твоята звезда ${name} е звезда от клас ${cls} и около нея обикаля поне една планета. ${hint}`.trim(),
        ref: (name, cls, hint) => `${name} е звезда от клас ${cls} и около нея обикалят две планети. ${hint}`.trim(),
        none: (name) => `Таблицата не дава тип за ${name}.`,
      },
      nameLetters: {
        title: "Планетите получават букви", goal: "Можеш да прочетеш името на екзопланета: звездата и една буква.",
        text: [
          "Една екзопланета обикновено носи името на звездата си, с малка буква след него. Според НАСА първата открита планета винаги се казва b, следващите c, d, e и така нататък. Самата звезда е неизписаното „A“.",
          "Ако няколко планети на една звезда бъдат открити едновременно, b получава най-близката до звездата. При TRAPPIST-1 седемте планети се казват от b до h, отвътре навън. Значи буквата казва реда на откриване, а не разстоянието: при Проксима Кентавър таблицата на НАСА в тази карта има b и d, а d обикаля по-близо до звездата от b, но е открита по-късно.",
        ],
        task: "Разгледай Проксима Кентавър с нейните планети b и d.",
        remember: [
          "Екзопланетата носи името на звездата си, с малка буква.",
          "Първата открита планета е b, следващите c, d, e.",
          "Ако няколко бъдат открити наведнъж, b получава най-близката до звездата.",
        ],
        you: (star, list, n) => (n ? `Твоята звезда се казва ${star}. Таблицата на НАСА познава ${n === 1 ? "една планета" : `${n} планети`} около нея: ${list}.` : `Твоята звезда се казва ${star}. Планетите ѝ се казват ${star} b, ${star} c и така нататък, по реда на откриването им.`),
        ref: () => "При Проксима Кентавър планетите се казват Proxima Cen b и Proxima Cen d: звездата е Proxima Cen, буквите броят планетите ѝ.",
      },
      nameStars: {
        title: "Звездите получават главни букви", goal: "Знаеш как се казват звездите в система с няколко звезди.",
        text: [
          "Много звезди имат спътници: две, три или повече звезди, които са заедно. Според НАСА звездите получават главни букви, а планетите малки. Звездата с планетите обикновено е неизписаното A, другите звезди може да се казват B, C.",
          "Най-близките ни съседи го показват: Алфа Кентавър A и Алфа Кентавър B обикалят една около друга, а Проксима Кентавър е трета звезда в същата система. Главните и малките букви разделят звездите от планетите: Алфа Кентавър B е звезда, Proxima Cen b е планета.",
        ],
        task: "Разгледай Алфа Кентавър A, с B до нея и отбелязаната наблизо Проксима.",
        remember: [
          "Звездите получават главни букви, планетите малки.",
          "Звездата с планетите обикновено е неизписаното A.",
          "Алфа Кентавър A и B са две звезди, Proxima Cen b е планета.",
        ],
        you: (left) => (left == null ? "Светлината на Алфа Кентавър A и B, която пристига днес, пътува 4,37 години: тръгнала е преди раждането ти." : `Светлината на Алфа Кентавър A и B, която пристига днес, пътува 4,37 години: тръгнала е на твоите ${left} години.`),
        ref: (left) => `Светлината на Алфа Кентавър A и B пътува до нас 4,37 години. Който днес е на 30, е бил на ${left}, когато е тръгнала.`,
      },
      nameGreek: {
        title: "Гръцки букви и съзвездия", goal: "Можеш да прочетеш име на звезда като Алфа Кентавър.",
        text: [
          "Много ярки звезди носят гръцка буква и латинското име на съзвездието си във формата „на …“. МАС дава за пример Хамал, най-ярката звезда в Овен: тя се казва и Alpha Arietis, „алфата на Овен“.",
          "Така се чете и Алфа Кентавър: алфата на Кентавър. За списъка на 88-те съзвездия, които дават тези имена, МАС се е договорил през 1922 г., а за границите им през 1928 г.",
        ],
        task: "Разгледай съзвездието Кентавър, дома на Алфа Кентавър.",
        remember: [
          "Име като Alpha Arietis означава: алфата на Овен.",
          "След гръцката буква идва съзвездието в латинската форма „на …“.",
          "МАС се е договорил за 88-те съзвездия през 1922 г.",
        ],
        you: (name, gen) => `При раждането ти Слънцето е било в съзвездието ${name}. На латински звездите му се казват Alpha ${gen}, Beta ${gen} и така нататък.`,
        ref: (name, gen) => `На 1 април Слънцето е в съзвездието ${name}. На латински звездите му се казват Alpha ${gen}, Beta ${gen} и така нататък.`,
      },
      nameCatalog: {
        title: "Каталози и телескопи", goal: "Знаеш какво означават HD, GJ, HIP, TOI, Kepler и TRAPPIST в едно име.",
        text: [
          "Повечето звезди нямат собствено име, а номер в каталог. Според НАСА първата част от името на една планета обикновено е телескопът или обзорът, който я е открил, или каталогът на звездата ѝ. HD означава каталога на Хенри Дрейпър, GJ каталога на близките звезди на Вилхелм Глизе и Хартмут Ярайс, HIP каталога на спътника Хипаркос на ЕКА.",
          "Kepler означава космическия телескоп „Кеплер“ на НАСА (2009 до 2018 г.), TOI означава „TESS Objects of Interest“, кандидатите на спътника TESS на НАСА. TRAPPIST е малък телескоп в Чили: той е дал името на системата TRAPPIST-1.",
        ],
        task: "Разгледай TRAPPIST-1, наречена на един телескоп.",
        remember: [
          "В началото на името обикновено стои каталог, телескоп или обзор.",
          "HD е каталогът на Хенри Дрейпър, GJ каталогът на близките звезди на Глизе и Ярайс.",
          "TOI са кандидатите на спътника TESS, TRAPPIST е телескоп в Чили.",
        ],
        cat: {
          HD: "HD означава каталога на Хенри Дрейпър.", GJ: "GJ (или Gl, Gliese) означава каталога на близките звезди на Глизе и Ярайс.",
          HIP: "HIP означава каталога на спътника Хипаркос.", TOI: "TOI означава кандидатите на спътника TESS.",
          Kepler: "Kepler означава космическия телескоп „Кеплер“.", TRAPPIST: "TRAPPIST е телескоп в Чили.",
          other: "Името ѝ идва от друг каталог или е собствено име.",
        },
        you: (star, what) => `Твоята звезда се казва ${star}. ${what}`,
        ref: (star, what) => `Пример: ${star}. ${what}`,
      },
      nameStories: {
        title: "Имена с история", goal: "Знаеш откъде идват собствените имена в космоса и кой ги дава.",
        text: [
          "Планетите на Слънчевата система носят стари имена. Според НАСА всяка планета освен Земята е наречена на римски бог или богиня. Марс например е римският бог на войната.",
          "И екзопланетите могат да получат собствени имена. В публичен конкурс на МАС 51 Пегас b, първата гигантска планета около звезда като Слънцето (1995 г.), получава името Димидиум, а звездата ѝ името Хелветиос. Такива имена не заменят научните обозначения. А имена на звезди не могат да се купят: МАС не продава имена и се разграничава от такива предложения.",
        ],
        task: "Разгледай 51 Пегас b, планетата с името Димидиум.",
        remember: [
          "Според НАСА всяка планета освен Земята е наречена на римски бог или богиня.",
          "51 Пегас b се казва и Димидиум, звездата ѝ Хелветиос.",
          "МАС не продава имена на звезди.",
        ],
        you: (before, at) => (before != null ? `51 Пегас b е открита през 1995 г., ${before} години преди раждането ти.` : at === "0" ? "51 Пегас b е открита през 1995 г., в годината на раждането ти." : `51 Пегас b е открита през 1995 г., на твоите ${at} години.`),
        ref: (ago) => `51 Пегас b е открита през 1995 г., преди ${ago} години.`,
      },
      zodWhat: {
        title: "Какво е съзвездие?", goal: "Знаеш какво е съзвездие и защо звездите му не са свързани.",
        text: [
          "Съзвездието е група звезди, която на небето сякаш образува фигура и е получила име. Според НАСА днес има 88 официално признати съзвездия.",
          "Звездите на едно съзвездие не са свързани: някои са близо, други много далеч. В Телец например звездите на фигурата са на 46 до 484 светлинни години от нас според данните на „Хипаркос“ в тази карта. Само от Земята изглеждат като картина.",
        ],
        task: "Разгледай своето съзвездие (без дата на раждане пример) и го завърти настрани: тогава фигурата се разпада.",
        remember: [
          "Съзвездието е група звезди с фигура и име.",
          "Има 88 официално признати съзвездия.",
          "Звездите на едно съзвездие са на различно разстояние и не са свързани.",
        ],
        you: (name, near, far) => (near == null ? `При раждането ти Слънцето е било в съзвездието ${name}.` : `При раждането ти Слънцето е било в съзвездието ${name}. Звездите му изглеждат близо една до друга, но най-близката е на ${near} светлинни години${far ? `, най-далечната на ${far}` : ""}.`),
        ref: (name, near, far) => (near == null ? `На 1 април Слънцето е в съзвездието ${name}.` : `На 1 април Слънцето е в съзвездието ${name}. Звездите му изглеждат близо една до друга, но най-близката е на ${near} светлинни години${far ? `, най-далечната на ${far}` : ""}.`),
      },
      zodPath: {
        title: "Пътят на Слънцето", goal: "Знаеш през кои съзвездия минава Слънцето за една година и познаваш тринадесетото.",
        text: [
          "Земята обикаля Слънцето веднъж годишно. Оттук изглежда, сякаш Слънцето се движи пред звездите, през съзвездията на зодиака. Затова нощем според сезона виждаме различни съзвездия: това, което е зад Слънцето, не се вижда.",
          "Според границите на Международния астрономически съюз (МАС), които използва и тази карта, Слънцето минава през 13 съзвездия, не през 12. Тринадесетото е Змиеносец: Слънцето стои пред звездите му приблизително от 30 ноември до 17 декември. Астрологията го няма.",
        ],
        task: "Разгледай Змиеносец, тринадесетото съзвездие по пътя на Слънцето.",
        remember: [
          "За една година Слънцето минава пред 13 съзвездия, не пред 12.",
          "Тринадесетото е Змиеносец, приблизително от 30 ноември до 17 декември.",
          "Кои съзвездия виждаме нощем, зависи от сезона.",
        ],
        you: (n) => `От раждането ти Слънцето е минало през Змиеносец около ${n} пъти, веднъж всяка година.`,
        ref: (n) => `За 30 години Слънцето минава през Змиеносец ${n} пъти, веднъж всяка година.`,
      },
      zodShift: {
        title: "Зодия и съзвездие", goal: "Знаеш защо зодията ти и съзвездието зад Слънцето обикновено не съвпадат.",
        text: [
          "Зодиите на астрологията не са съзвездия: те делят пътя на Слънцето на дванадесет равни части от по 30 градуса, броени от началото на пролетта. Съзвездията пък са с различна големина.",
          "Освен това земната ос бавно се люшка като пумпал. Според НАСА едно люшкане трае около 25 800 години. С оста началото на пролетта се движи покрай звездите, а с него и зодиите. Затова на рождения ти ден Слънцето обикновено стои пред друго съзвездие, а не пред това, на което е кръстена зодията ти.",
        ],
        task: "Разгледай съзвездието, което се казва като зодията ти, и го сравни с онова, в което Слънцето наистина е било.",
        remember: [
          "Зодията е точно 30 градуса, съзвездието е с различна големина.",
          "Земната ос се люшка; едно люшкане трае около 25 800 години.",
          "Затова зодия и съзвездие обикновено не съвпадат.",
        ],
        you: (sign, real, same) => (same ? `При теб съвпадат: зодията ти е ${sign}, и при раждането ти Слънцето също е било в съзвездието ${real}.` : `Зодията ти е ${sign}. Но при раждането ти Слънцето е стояло пред звездите на съзвездието ${real}.`),
        ref: (sign, real) => `Роденият на 1 април е зодия ${sign}. Но на този ден Слънцето е в съзвездието ${real}.`,
      },
      zodScience: {
        title: "Астрономия и астрология", goal: "Можеш да различаваш астрономия и астрология.",
        text: [
          "Астрономията е науката за всичко в космоса. Тя следва научния метод: решават доказателствата и данните, и всяко твърдение може да се провери.",
          "Астрологията е нещо друго. Тя се основава на вярата, че положението на звездите и планетите може да предскаже бъдещето или да опише човека. За някои културни традиции е важна, но според НАСА твърденията ѝ не се основават на научни доказателства.",
        ],
        task: "За тази стъпка няма задача в 3D изгледа. Отговори на въпросите и стъпката е готова.",
        remember: [
          "Астрономията е наука: решават доказателствата и данните.",
          "Астрологията е вяра; твърденията ѝ не се основават на научни доказателства.",
          "Че зодията казва нещо за човека, не е доказано от науката.",
        ],
        you: (sign) => `Че зодията ти ${sign} казва нещо за теб, не е доказано от науката. Какво е тя наистина: отрязък от 30 градуса от пътя на Слънцето.`,
        ref: (sign) => `Че зодия като ${sign} казва нещо за човека, не е доказано от науката. Какво е тя наистина: отрязък от 30 градуса от пътя на Слънцето.`,
      },
      zodLight: {
        title: "Светлината на твоето съзвездие", goal: "Знаеш, че виждаш звездите такива, каквито са били преди много години.",
        text: [
          "Светлинната година е разстоянието, което светлината изминава за една година. Ако една звезда е на 46 светлинни години, светлината ѝ е пътувала до нас 46 години: виждаме я такава, каквато е била преди 46 години.",
          "В едно съзвездие тази светлина е на различна възраст. В Телец светлината на най-близката звезда от фигурата пристига след 46 години, а на най-далечната след почти 500 години. Поглед към съзвездие е поглед в много различни времена.",
        ],
        task: "Разгледай своето съзвездие отстрани: всяка звезда в него ти показва различно време.",
        remember: [
          "Светлинната година е разстояние: колко далеч стига светлината за една година.",
          "Виждаме звездата такава, каквато е била, когато светлината ѝ е тръгнала.",
          "Светлината на звездите в едно съзвездие е на различна възраст.",
        ],
        you: (name, ly, before, at) => (ly == null ? `Светлината на звездите в съзвездието ${name}, където е било Слънцето при раждането ти, е на различна възраст.` : before != null ? `Светлината на най-близката звезда в съзвездието ${name} пътува ${ly} години: тръгнала е ${before} години преди раждането ти.` : at === "0" ? `Светлината на най-близката звезда в съзвездието ${name} пътува ${ly} години: тръгнала е в годината на раждането ти.` : `Светлината на най-близката звезда в съзвездието ${name} пътува ${ly} години: тръгнала е, когато си бил на ${at} години.`),
        ref: (name, ly) => (ly == null ? `На 1 април Слънцето е в съзвездието ${name}; светлината на звездите му е на различна възраст.` : `На 1 април Слънцето е в съзвездието ${name}. Светлината на най-близката му звезда пътува до нас ${ly} години.`),
      },
      habWhat: {
        title: "Какво значи обитаемо?", goal: "Можеш да обясниш обитаемата зона и защо течната вода е толкова важна.",
        text: [
          "NASA определя обитаемата зона като разстоянието от звезда, на което по повърхността на обикалящите планети би могла да съществува течна вода. Течната вода е незаменима за живота, какъвто го познаваме.",
          "Но зоната е само първо пресяване, както казва NASA. Планетата има нужда и от подходящ размер, подходяща атмосфера и спокойна звезда, която не я стерилизира с изблици.",
        ],
        task: "Полети до Земята, единствената планета, на която познаваме живот.",
        remember: [
          "Обитаемата зона: разстоянията от звезда, на които по повърхността на планета би могла да има течна вода.",
          "Течната вода е незаменима за живота, какъвто го познаваме.",
          "Зоната е само първо пресяване: размерът, атмосферата и спокойната звезда също имат значение.",
        ],
        you: (n) => `От раждането ти Земята те е пренесла около Слънцето ${n} пъти, през цялото време в неговата обитаема зона.`,
        ref: (n) => `За 30 години Земята пренася човек около Слънцето ${n} пъти, през цялото време в неговата обитаема зона.`,
      },
      habZone: {
        title: "Обитаемата зона", goal: "Знаеш защо обитаемата зона е различна при различните звезди.",
        text: [
          "Обитаемата зона зависи от звездата. Около по-горещите звезди тя е по-широка, около червените джуджета е тясна и много близо до звездата.",
          "TOI-700 d например обикаля малка звезда от тип M само за 37,4 дни и е в нейната обитаема зона. В 3D изгледа зелен пръстен показва обитаемата зона на системата.",
        ],
        task: "Полети до TOI-700 d и разгледай зеления пръстен на обитаемата ѝ зона.",
        remember: [
          "Около по-горещите звезди обитаемата зона е по-широка.",
          "Около червените джуджета тя е тясна и много близо до звездата.",
          "TOI-700 d обикаля малката си звезда за 37,4 дни.",
        ],
        you: (n) => `На TOI-700 d щеше да си на ${n} години: годината там трае 37,4 дни.`,
        ref: (n) => `Човек на 30 години щеше да е на ${n} години на TOI-700 d: годината там трае 37,4 дни.`,
      },
      habWater: {
        title: "Течна вода", goal: "Знаеш защо се търси вода и къде в нашата Слънчева система може да има океани.",
        text: [
          "Водата е незаменима за всичкия живот на Земята; до 60 % от тялото на възрастен човек е вода. Затова търсенето на живот е най-напред търсене на течна вода.",
          "Океани може да се крият и под леда: има сериозни доказателства, че луната на Юпитер Европа има океан от солена вода, а луната на Сатурн Енцелад има вътре океан по цялото си кълбо, с фонтани, които изхвърлят водна пара и ледени частици в космоса.",
        ],
        task: "Полети до Юпитер и щракни върху луната му Европа.",
        remember: [
          "Водата е незаменима за всичкия живот на Земята; до 60 % от тялото на възрастния е вода.",
          "Има сериозни доказателства за океан от солена вода в луната на Юпитер Европа.",
          "Луната на Сатурн Енцелад има океан по цялото си кълбо и фонтани от водна пара и лед.",
        ],
        you: (n) => `От раждането ти Европа, луната с океана, е обиколила Юпитер ${n} пъти.`,
        ref: (n) => `За 30 години Европа, луната с океана, обикаля Юпитер ${n} пъти.`,
      },
      habAtmos: {
        title: "Атмосфери", goal: "Можеш да обясниш защо въздухът на една планета решава дали водата може да остане течна.",
        text: [
          "Венера показва колко важен е въздухът: плътната ѝ атмосфера, главно от въглероден диоксид, задържа топлината в неудържим парников ефект и повърхността е около 467 °C.",
          "Марс показва другата крайност: атмосферата му е твърде рядка, за да може течна вода да съществува там дълго. Земята е по средата и това е една от причините водата тук да остава течна.",
        ],
        task: "Полети до Венера, планетата с твърде много въздух.",
        remember: [
          "Венера: плътна атмосфера от въглероден диоксид задържа топлината; повърхността е около 467 °C.",
          "Марс: атмосферата е твърде рядка, за да издържи течна вода дълго.",
          "Въздухът на една планета решава дали водата може да остане течна.",
        ],
        you: (n) => `На Венера щеше да си на ${n} години, на свят, чийто въздух задържа жегата.`,
        ref: (n) => `Човек на 30 години щеше да е на ${n} години на Венера, на свят, чийто въздух задържа жегата.`,
      },
      habIngredients: {
        title: "Съставките на живота", goal: "Знаеш от какво се нуждае животът, какъвто го познаваме, и какво откри роувърът „Кюриосити“ на Марс.",
        text: [
          "Животът, какъвто го познаваме, се нуждае от течна вода, химични градивни елементи и източник на енергия. НАСА нарича течната вода незаменима съставка на живота, какъвто го познаваме.",
          "През 2018 г. роувърът „Кюриосити“ откри в кратера Гейл на Марс органични молекули в скали на три милиарда години, дъното на някогашно езеро. Според НАСА това езеро е съдържало всички съставки за живот, химични градивни елементи и източници на енергия. Но органичните молекули могат да възникнат и без живот: те не са доказателство за него.",
        ],
        task: "Полети до Марс, където „Кюриосити“ откри органичните молекули.",
        remember: [
          "Животът, какъвто го познаваме, се нуждае от течна вода, химични градивни елементи и енергия.",
          "През 2018 г. „Кюриосити“ откри на Марс органични молекули в скали на три милиарда години.",
          "Органичните молекули не са доказателство за живот: могат да възникнат и без него.",
        ],
        you: (n) => `Скалите, в които „Кюриосити“ откри молекулите, са на около три милиарда години: около ${n} пъти колкото теб.`,
        ref: (n) => `Скалите, в които „Кюриосити“ откри молекулите, са на около три милиарда години: около ${n} пъти колкото човек на 30.`,
      },
      habExtreme: {
        title: "Екстремен живот на Земята", goal: "Познаваш живи същества, които живеят там, където ние не бихме могли.",
        text: [
          "Живите същества, които живеят на границите на обитаемото, при екстремни температури, киселинност или радиация, се наричат екстремофили. През 2026 г. НАСА съобщи за амеба от горещи извори в Калифорния, която се дели дори при 63 °C: рекорд за всички известни живи същества с клетъчно ядро.",
          "На морското дъно от хидротермалните извори излиза вода, по-гореща от 400 °C. Според NOAA тамошните общности живеят главно от хемосинтеза: бактерии получават енергия от химични реакции, обикновено без слънчева светлина. Гигантските тръбести червеи там растат по-бързо от всички други морски безгръбначни на Земята.",
        ],
        task: "Полети до Европа, луната на Юпитер: под леда ѝ се предполага океан. Дали в него има живот, никой не знае.",
        remember: [
          "Екстремофилите живеят при екстремни температури, киселинност или радиация.",
          "Амеба от горещи извори се дели дори при 63 °C.",
          "При дълбоководните извори цели общности живеят без слънчева светлина, от хемосинтеза.",
        ],
        you: () => "Вода от 63 °C би била твърде гореща за теб, за да се къпеш в нея. Амебата обаче още се дели в нея.",
        ref: () => "Вода от 63 °C би била твърде гореща за всеки човек, за да се къпе в нея. Амебата обаче още се дели в нея.",
      },
      habLife: {
        title: "Има ли живот там навън?", goal: "Знаеш как учените търсят живот и че отговорът е още открит.",
        text: [
          "Засега познаваме живот само на Земята. Тук той вирее дори при свръхгорещите извори на океанското дъно и това дава надежда, че може да съществува и на странни места другаде.",
          "Космическият телескоп „Джеймс Уеб“ може за първи път да зърне газовете във въздуха на екзопланети с размера на Земята. Кислород, въглероден диоксид и метан заедно биха били силен знак за възможен живот. Дали ще го намерим, е открит въпрос.",
        ],
        task: "Полети до Проксима b, най-близкия кандидат на картата.",
        remember: [
          "Засега познаваме живот само на Земята.",
          "Животът на Земята живее дори при свръхгорещите извори на океанското дъно.",
          "Газовете във въздуха на екзопланета (кислород, въглероден диоксид и метан заедно) може да подсказват за живот: открит въпрос.",
        ],
        you: (at, now, year) => `През ${year} г., годината на раждането ти, тази карта е познавала ${at} кандидати в обитаема зона; днес познава ${now}.`,
        ref: (at, now, year) => `През ${year} г., когато се е родил човек, който днес е на 30, тази карта е познавала ${at} кандидати в обитаема зона; днес познава ${now}.`,
      },
    },
    q: {
      sunLight: { q: "Колко време пътува слънчевата светлина до Земята?", o: ["Около 8 минути", "Около 8 секунди", "Около 8 часа"], e: "Около 8 минути и 20 секунди: Слънцето е на 150 милиона километра, а светлината изминава около 300 000 километра в секунда." },
      sunEnergy: { q: "Откъде идва енергията на Слънцето?", o: ["Водородът в ядрото му се слива в хелий", "Изгаря въглища и газ", "От светлината на други звезди"], e: "В ядрото на Слънцето водородните ядра се сливат в хелий. Това е ядрен синтез; при него се освобождава енергията, която свети." },
      sunOrbits: { you: "Колко пъти Земята те е пренесла около Слънцето от раждането ти?", ref: "Колко пъти Земята е пренесла около Слънцето човек на 30 години?", e: (n) => `${n} пъти: Земята обикаля Слънцето веднъж годишно, а ти пътуваш с нея.` },
      venusDay: { q: "На коя планета денят е по-дълъг от годината?", o: ["Венера", "Меркурий", "Марс"], e: "Венера се върти много бавно: едно завъртане трае по-дълго от една обиколка около Слънцето." },
      marsAge: { you: "На колко години щеше да си на Марс?", ref: "На колко години щеше да е на Марс човек на 30?", e: (n) => `${n}: годината на Марс трае 1,88 земни години, така че там рождените дни са по-редки.` },
      closest: { q: "Коя планета е най-близо до Слънцето?", o: ["Меркурий", "Венера", "Земята"], e: "Меркурий, на 0,39 а.е. Обикаля Слънцето за 88 дни." },
      largest: { q: "Коя е най-голямата планета?", o: ["Юпитер", "Сатурн", "Нептун"], e: "Юпитер: в диаметъра му се нареждат около 11 Земи." },
      saturnDensity: { q: "Коя планета е с по-малка плътност от водата?", o: ["Сатурн", "Юпитер", "Уран"], e: "Сатурн: средната му плътност е по-малка от тази на водата." },
      jupiterLaps: { you: "Колко пъти Юпитер е обиколил Слънцето от раждането ти?", ref: "Колко пъти Юпитер обикаля Слънцето за 30 години?", e: (n) => `${n} пъти: една година на Юпитер трае почти 12 земни години.` },
      largestMoon: { q: "Коя е най-голямата луна в Слънчевата система?", o: ["Ганимед", "Нашата Луна", "Европа"], e: "Ганимед, луна на Юпитер: тя е дори по-голяма от планетата Меркурий." },
      galileo: { q: "Кой откри четирите големи луни на Юпитер през 1610 г.?", o: ["Галилео Галилей", "Исак Нютон", "Йоханес Кеплер"], e: "Галилео Галилей, с един от първите телескопи. Наричат ги Галилееви луни." },
      sameSide: { q: "Защо винаги виждаме една и съща страна на Луната?", o: ["Завърта се точно веднъж при всяка обиколка", "Изобщо не се върти", "Другата страна е винаги тъмна"], e: "Луната се завърта веднъж около себе си при всяка обиколка около Земята, затова към нас винаги е обърната една и съща страна. Обратната страна също получава слънчева светлина." },
      dwarf: { q: "Кое от тези тела е джудже планета?", o: ["Плутон", "Марс", "Нептун"], e: "Плутон. От 2006 г. се смята за джудже планета, като Церера в астероидния пояс." },
      moonLaps: { you: "Около колко пъти Луната е обиколила Земята от раждането ти?", ref: "Около колко пъти Луната обикаля Земята за 30 години?", e: (n) => `Около ${n} пъти: една обиколка трае 27,3 дни.` },
      neptune: { q: "Приблизително колко далеч е Нептун от Слънцето?", o: ["30 а.е.", "3 а.е.", "300 а.е."], e: "Около 30 а.е., 30 пъти по-далеч от Земята. Слънчевата светлина пътува около 4 часа дотам." },
      starLight: { you: (name) => `Колко години е пътувала светлината на твоята звезда, ${name}, до теб?`, e: (n, name) => `Около ${n} години: ${name} е на около ${n} светлинни години, а светлинна година е разстоянието, което светлината изминава за една година.` },
      proximaLight: { q: "Колко време пътува до нас светлината на Проксима Кентавър, най-близката звезда след Слънцето?", o: ["Около 4,2 години", "Около 4,2 дни", "Около 42 години"], e: "Около 4,2 години: Проксима Кентавър е на 4,24 светлинни години." },
      sunSize: { q: "Около колко Земи се нареждат в диаметъра на Слънцето?", o: ["Около 109", "Около 11", "Около 1000"], e: "Около 109: радиусът на Слънцето е около 109 пъти по-голям от този на Земята." },
      asteroidBelt: { q: "Къде обикалят Слънцето повечето астероиди?", o: ["Между Марс и Юпитер", "Между Земята и Марс", "Между Сатурн и Уран"], e: "В астероидния пояс между Марс и Юпитер. Най-голямото тяло там, Церера, е джудже планета." },
      cometTail: { q: "Накъде сочи опашката на кометата?", o: ["Далеч от Слънцето", "Към Слънцето", "Винаги към Земята"], e: "Далеч от Слънцето: слънчевата светлина и слънчевият вятър отнасят праха и газа на комата далеч от него." },
      nearestStar: { q: "Коя е най-близката звезда след Слънцето?", o: ["Проксима Кентавър", "Сириус", "Полярната звезда"], e: "Проксима Кентавър, на около 4,2 светлинни години." },
      lightYear: { q: "Какво е светлинна година?", o: ["Разстояние: колко далеч стига светлината за година", "Време: една година в космоса", "Възрастта на звезда"], e: "Разстояние. Светлината изминава почти 9,5 трилиона километра за година." },
      pairPeriod: { q: "За колко време Алфа Кентавър A и B обикалят една около друга?", o: ["За около 80 години", "За около 80 дни", "За около 8000 години"], e: "За около 80 години. Когато са най-близо, разстоянието между тях е около 11 пъти разстоянието Земя–Слънце." },
      pairSun: { q: "Коя звезда е от същия вид като нашето Слънце?", o: ["Алфа Кентавър A", "Алфа Кентавър B", "Проксима Кентавър"], e: "Алфа Кентавър A, тип G2 като Слънцето, и малко по-голяма." },
      constellation: { q: "В кое съзвездие е Алфа Кентавър?", o: ["Кентавър", "Орион", "Голямата мечка"], e: "В Кентавър." },
      redDwarf: { q: "Каква звезда е Проксима Кентавър?", o: ["Червено джудже", "Червен гигант", "Звезда като Слънцето"], e: "Червено джудже: малка, хладна и много по-слаба от Слънцето." },
      proximaEye: { q: "Може ли Проксима Кентавър да се види с просто око?", o: ["Не, твърде слаба е", "Да, тя е най-ярката звезда на небето", "Само през деня"], e: "Не: макар да е най-близката звезда, тя е твърде слаба за просто око." },
      thirdStar: { q: "Колко звезди има системата Алфа Кентавър?", o: ["Три", "Две", "Една"], e: "Три: Алфа Кентавър A и B и Проксима Кентавър, най-слабата." },
      proximaBYear: { q: "Колко трае една година на Проксима b?", o: ["Около 11 дни", "Около 11 месеца", "Около 11 години"], e: "Около 11,2 дни: толкова бързо обикаля звездата си." },
      habitable: { q: "Какво означава „в обитаемата зона“?", o: ["При подходящи условия там би могло да има течна вода", "Там е открит живот", "Планетата със сигурност има въздух"], e: "Само че температурата би могла да позволи течна вода. Дали Проксима b има въздух, вода или живот, не е известно." },
      howFound: { q: "Как е открита Проксима b?", o: ["По мъничкото клатене на звездата ѝ", "На снимка на планетата", "По радиосигнал"], e: "По мънички отмествания в светлината на звездата, която се клати, защото планетата я дърпа." },
      voyagerSpeed: { q: "Приблизително колко бързо се отдалечава „Вояджър 1“ от Слънцето?", o: ["Около 17 км в секунда", "Около 17 км в час", "Около 17 000 км в секунда"], e: "Около 17 километра в секунда, над 61 000 километра в час." },
      travelTime: { q: "Приблизително колко време би му трябвало на „Вояджър 1“ до Проксима Кентавър?", o: ["Около 75 000 години", "Около 750 години", "Около 7,5 милиона години"], e: "Около 75 000 години: 4,2 светлинни години със 17 километра в секунда." },
      proximaLeft: { you: "На колко години беше, когато е тръгнала светлината на Проксима, която стига до теб днес?", ref: "На колко години е бил човек, който днес е на 30, когато е тръгнала светлината на Проксима, която стига до нас сега?", e: (n) => `На ${n}: светлината е тръгнала преди около 4,2 години.` },
      lightTrips: { you: "Колко пъти светлината би могла да измине пътя от Проксима до нас през досегашния ти живот?", ref: "Колко пъти светлината може да измине пътя от Проксима до нас за 30 години?", e: (n) => `${n} пъти: за пътя са ѝ нужни около 4,2 години.` },
      proximaBAge: { you: "На колко години щеше да си на Проксима b?", ref: "На колко години щеше да е на Проксима b човек на 30?", e: (n) => `${n}: годината на Проксима b трае само 11,2 дни.` },
      lifetimes: { you: "Колко пъти колкото досегашния ти живот би траело пътуването със скоростта на „Вояджър 1“?", ref: "Колко пъти колкото живота на човек на 30 би траело пътуването със скоростта на „Вояджър 1“?", e: (n) => `Около ${n} пъти: пътуването би траело около 75 000 години.` },
      exoDefinition: { q: "Какво е екзопланета?", o: ["Планета извън нашата Слънчева система", "Луна на голяма планета", "Звезда без светлина"], e: "Планета извън нашата Слънчева система; обикновено обикаля друга звезда." },
      firstSunLike: { q: "През коя година е открита първата планета около звезда като Слънцето?", o: ["1995", "1965", "2015"], e: "1995: 51 Пегас b. Откривателите ѝ получиха Нобелова награда за физика през 2019 г." },
      firstPulsar: { q: "Около какъв обект са открити първите екзопланети през 1992 г.?", o: ["Пулсар", "Звезда като Слънцето", "Черна дупка"], e: "Пулсар. Три години по-късно дойде 51 Пегас b, първата около звезда като Слънцето." },
      transitDim: { q: "Какво измерва транзитният метод?", o: ["Лекото отслабване на звезда, когато планета мине пред нея", "Светлината на самата планета", "Радиосигнали от планетата"], e: "Лекото отслабване на звездата, докато планетата минава пред нея." },
      wobble: { q: "Какво търси методът на радиалната скорост?", o: ["Клатенето на звездата, която планетата ѝ дърпа", "Сянка върху Земята", "Луните на планетата"], e: "Клатенето на звездата: светлината ѝ леко се отмества към синьото и към червеното." },
      mostMethod: { q: "С кой метод са открити повечето известни екзопланети?", o: ["Транзит", "Радиална скорост", "Снимки"], e: "Транзит: в тази карта 4770 от 6423 планети." },
      superEarth: { q: "Какво е суперземя?", o: ["Планета, по-масивна от Земята, но по-лека от Нептун", "Планета със свръхгорещо ядро", "Всяка планета, по-голяма от Юпитер"], e: "По-масивна от Земята, по-лека от Нептун; може да е от газ, скали или и двете." },
      terrestrialMade: { q: "От какво са земеподобните планети?", o: ["От скали, силикати, вода или въглерод", "Главно от водород и хелий", "Само от лед"], e: "От скали, силикати, вода или въглерод; те са колкото Земята или по-малки." },
      trappistSeven: { q: "Колко планети с размера на Земята обикалят TRAPPIST-1?", o: ["Седем", "Две", "Дванадесет"], e: "Седем, около малко червено джудже на около 40 светлинни години." },
      hotJupiter: { q: "Какво е горещ юпитер?", o: ["Газов гигант много близо до звездата си", "Юпитер с вулкани", "Звезда, която прилича на Юпитер"], e: "Газов гигант много близо до звездата си, като 51 Пегас b." },
      pegYear: { q: "Колко трае една година на 51 Пегас b?", o: ["Около 4 дни", "Около 4 години", "Около 40 години"], e: "Около 4,2 дни." },
      gasGiantSize: { q: "Колко големи са газовите гиганти?", o: ["Колкото Сатурн или Юпитер или много по-големи", "Колкото Земята", "Колкото Луната"], e: "Колкото Сатурн или Юпитер или много по-големи." },
      lavaWorld: { q: "Какво покрива 55 Рак e според NASA?", o: ["Океан от лава по цялата планета", "Дебел слой лед", "Гори"], e: "Океан от лава по цялата планета: това е свръхгорещ свят." },
      rogue: { q: "Всички екзопланети ли обикалят звезда?", o: ["Не, някои се скитат из галактиката без слънце", "Да, всички", "Нито една"], e: "Не: обикновено обикалят звезда, но някои се скитат без слънце във вечен мрак." },
      keplerScope: { q: "Кой космически телескоп откри хиляди екзопланети с транзитния метод?", o: ["Кеплер", "Хъбъл", "Вояджър"], e: "Телескопът „Кеплер“ на NASA." },
      knownAtBirth: { you: "Колко планети от този каталог са били открити до годината на раждането ти?", ref: "Колко планети от този каталог са били открити до годината на раждане на човек, който днес е на 30?", e: (n) => `${n}: каталогът расте всяка година.` },
      transitSince: { you: "Колко планети от този каталог са открити с транзитния метод от годината на раждането ти?", ref: "Колко планети от този каталог са открити с транзитния метод през последните 30 години?", e: (n) => `${n}: много от тях с телескопа „Кеплер“.` },
      trappistAge: { you: "На колко години щеше да си на TRAPPIST-1 e?", ref: "На колко години щеше да е на TRAPPIST-1 e човек на 30?", e: (n) => `${n}: годината на TRAPPIST-1 e трае 6,1 дни.` },
      pegAge: { you: "На колко години щеше да си на 51 Пегас b?", ref: "На колко години щеше да е на 51 Пегас b човек на 30?", e: (n) => `${n}: годината на 51 Пегас b трае 4,2 дни.` },
      cancriAge: { you: "Колко рождени дни щеше вече да имаш на 55 Рак e?", ref: "Колко рождени дни щеше вече да има на 55 Рак e човек на 30?", e: (n) => `${n}: годината на 55 Рак e трае по-малко от 18 часа.` },
      hzDef: { q: "Какво е обитаемата зона?", o: ["Разстоянията от звезда, на които по повърхността на планета би могла да има течна вода", "Частта от планетата, в която живеят хора", "Областта около черна дупка"], e: "Разстоянията от звезда, на които по повърхността на планета би могла да има течна вода, както я определя NASA." },
      waterNeed: { q: "Защо учените търсят най-напред течна вода?", o: ["Тя е незаменима за живота, какъвто го познаваме", "Тя кара планетите да светят", "Тя държи планетите в орбитите им"], e: "Течната вода е незаменима за живота, какъвто го познаваме." },
      firstCut: { q: "Всяка планета в обитаемата зона ли е обитаема?", o: ["Не, зоната е само първо пресяване", "Да, винаги", "Само ако има луни"], e: "Не: размерът, атмосферата и спокойната звезда също имат значение." },
      zoneHot: { q: "Около кои звезди обитаемата зона е по-широка?", o: ["Около по-горещите звезди", "Около по-хладните звезди", "При всички звезди е еднаква"], e: "Около по-горещите звезди." },
      redDwarfZone: { q: "Къде е обитаемата зона на червено джудже?", o: ["Тясна и много близо до звездата", "Далеч от звездата", "Червеното джудже няма такава"], e: "Тясна и много близо до звездата: планетите му го обикалят за дни или седмици." },
      toiYear: { q: "Колко трае една година на TOI-700 d?", o: ["Около 37 дни", "Около 37 години", "Около 37 часа"], e: "Около 37,4 дни." },
      europaOcean: { q: "За какво има сериозни доказателства под повърхността на Европа?", o: ["Океан от солена вода", "Море от лава", "Замръзнала гора"], e: "Океан от солена вода." },
      enceladusJets: { q: "Какво изхвърлят фонтаните на Енцелад в космоса?", o: ["Водна пара и ледени частици", "Лава", "Пясък"], e: "Водна пара и ледени частици, от океана във вътрешността му." },
      bodyWater: { q: "Каква част от тялото на възрастен човек е вода според USGS?", o: ["До 60 %", "Около 10 %", "Над 95 %"], e: "До 60 %." },
      venusGreenhouse: { q: "Защо Венера е толкова гореща?", o: ["Плътният ѝ въздух от въглероден диоксид задържа топлината", "Тя е най-близката планета до Слънцето", "Навсякъде има вулкани"], e: "Плътната ѝ атмосфера задържа топлината в неудържим парников ефект; Меркурий е по-близо до Слънцето, но не е толкова горещ." },
      marsThin: { q: "Защо днес течната вода не може да издържи дълго на Марс?", o: ["Атмосферата му е твърде рядка", "Изобщо няма вода", "Твърде близо е до Слънцето"], e: "Атмосферата му е твърде рядка, за да може течна вода да съществува там дълго." },
      venusTemp: { q: "Около колко гореща е повърхността на Венера?", o: ["Около 467 °C", "Около 46 °C", "Около -46 °C"], e: "Около 467 °C." },
      onlyEarth: { q: "Къде познаваме живот засега?", o: ["Само на Земята", "На Марс", "На Проксима b"], e: "Засега само на Земята." },
      vents: { q: "Къде на Земята животът вирее при свръхгорещи извори?", o: ["На океанското дъно", "По върховете на планините", "В облаците"], e: "На океанското дъно: знак, че животът може да съществува и на странни места другаде." },
      biosignature: { q: "Кой телескоп може за първи път да зърне газовете във въздуха на екзопланети с размера на Земята?", o: ["Космическият телескоп „Джеймс Уеб“", "„Вояджър 1“", "Телескопът на Галилей"], e: "Космическият телескоп „Джеймс Уеб“, изстрелян през 2021 г." },
      trappistFit: { q: "Според НАСА къде биха се събрали всичките седем планети на TRAPPIST-1?", o: ["Вътре в орбитата на Меркурий", "Вътре в орбитата на Юпитер", "Чак отвъд Нептун"], e: "Вътре в орбитата на Меркурий: те обикалят много близо до малката си звезда." },
      kepler90Eight: { q: "Колко планети са известни около Kepler-90?", o: ["Осем, колкото в нашата Слънчева система", "Две", "Петдесет"], e: "Осем, колкото в нашата Слънчева система." },
      kepler90AI: { q: "Как е открита през 2017 г. осмата планета на Kepler-90?", o: ["Невронна мрежа на Google претърсва данните на „Кеплер“", "С просто око", "Космическа сонда лети дотам"], e: "Изкуствена невронна мрежа на Google претърсва данните на телескопа „Кеплер“." },
      hdBlue: { q: "Какъв цвят е HD 189733 b според НАСА?", o: ["Кобалтовосин", "Огненочервен", "Тревистозелен"], e: "Кобалтовосин: мъгливото му небе има облаци, които съдържат стъкло." },
      kepler16Suns: { q: "Какво е особеното на Kepler-16 b?", o: ["Обикаля две звезди", "Няма звезда", "Направен е от диамант"], e: "Обикаля едновременно две звезди, като Татуин в „Междузвездни войни“." },
      kepler16Saturn: { q: "На коя планета от нашата Слънчева система прилича Kepler-16 b по размер и маса?", o: ["Сатурн", "Земята", "Меркурий"], e: "Сатурн." },
      lifeNeeds: { q: "Какво е съдържало старото езеро в кратера Гейл на Марс според НАСА?", o: ["Всички съставки за живот: химични градивни елементи и източници на енергия", "Живи риби", "Само лед"], e: "Всички съставки, нужни за живот; дали там е имало живот, не се знае." },
      marsOrganics: { q: "Какво откри „Кюриосити“ през 2018 г. в скали на три милиарда години?", o: ["Органични молекули", "Вкаменени кости", "Злато"], e: "Органични молекули, в глинестата скала на старо езеро." },
      organicNotLife: { q: "Доказателство за живот ли са органичните молекули?", o: ["Не, могат да възникнат и без живот", "Да, винаги", "Само на Марс"], e: "Не: често ги свързват с живота, но могат да възникнат и без него." },
      extremophile: { q: "Как се наричат живите същества, които живеят на границите на обитаемото?", o: ["Екстремофили", "Екзопланети", "Астероиди"], e: "Екстремофили: издържат екстремни температури, киселинност или радиация." },
      fireAmoeba: { q: "До каква температура се дели още амебата от горещите извори в Калифорния?", o: ["63 °C", "6 °C", "630 °C"], e: "63 °C, рекорд за всички известни живи същества с клетъчно ядро." },
      chemosynthesis: { q: "Откъде получават енергия общностите при дълбоководните извори?", o: ["От химични реакции, обикновено без слънчева светлина", "От слънчевата светлина", "От лунната светлина"], e: "От хемосинтеза: бактерии получават енергия от химични реакции." },
      tubeWorms: { q: "Кои животни при дълбоководните извори растат по-бързо от всички други морски безгръбначни?", o: ["Гигантските тръбести червеи", "Медузите", "Морските звезди"], e: "Гигантските тръбести червеи." },
      trappistBLaps: { you: "Около колко пъти е обиколил TRAPPIST-1 b звездата си от раждането ти?", ref: "Около колко пъти обикаля TRAPPIST-1 b звездата си за 30 години?", e: (n) => `Около ${n} пъти: една година там трае 1,5 дни.` },
      kepler16Age: { you: "На колко години щеше да си на Kepler-16 b?", ref: "На колко години щеше да е на Kepler-16 b човек на 30?", e: (n) => `${n}: една година на Kepler-16 b трае 229 дни.` },
      rockFactor: { you: "Около колко пъти по-стари от теб са скалите, в които „Кюриосити“ откри органични молекули?", ref: "Около колко пъти по-стари от човек на 30 са скалите, в които „Кюриосити“ откри органични молекули?", e: (n) => `Около ${n} пъти: те са на около три милиарда години.` },
      nebulaWhat: { q: "Какво е мъглявина според НАСА?", o: ["Огромен облак от прах и газ в космоса", "Планета, покрита с мъгла", "Малка звезда"], e: "Огромен облак от прах и газ в космоса." },
      nebulaDeath: { q: "Откъде идват някои мъглявини?", o: ["От газа и праха на избухваща умираща звезда", "От моретата на планети", "От Луната"], e: "От газа и праха, изхвърлени при експлозията на умираща звезда, например свръхнова." },
      nebulaBirth: { q: "Какво става в други мъглявини?", o: ["Започват да се образуват нови звезди", "Умират планети", "Нищо"], e: "Започват да се образуват нови звезди." },
      pillarsWhere: { q: "Къде са Стълбовете на сътворението?", o: ["В мъглявината Орел в Змия", "На Марс", "В галактиката Андромеда"], e: "В мъглявината Орел (M16) в съзвездието Змия." },
      pillarsDist: { q: "Колко далеч е мъглявината Орел?", o: ["6500 (ЕКА) или 7000 (НАСА) светлинни години", "65 светлинни години", "6,5 милиона светлинни години"], e: "6500 светлинни години според ЕКА, 7000 според НАСА: страниците не съвпадат." },
      pillarsWebb: { q: "Кой телескоп показва стълбовете в нова снимка през 2022 г.?", o: ["„Уеб“", "Телескопът на Галилей", "TRAPPIST"], e: "Космическият телескоп „Уеб“, на 19 октомври 2022 г." },
      horseType: { q: "Каква мъглявина е Конската глава?", o: ["Тъмна мъглявина", "Планетарна мъглявина", "Остатък от свръхнова"], e: "Тъмна мъглявина: тъмен облак от прах и газ." },
      horseWhere: { q: "В кое съзвездие е Конската глава?", o: ["Орион", "Телец", "Лира"], e: "В Орион." },
      horseDist: { q: "Колко далеч е Конската глава според ЕКА/Хъбъл?", o: ["Около 1300 светлинни години", "Около 13 светлинни години", "Около 13 милиона светлинни години"], e: "Около 1300 светлинни години." },
      ringType: { q: "Каква мъглявина е мъглявината Пръстен?", o: ["Планетарна мъглявина", "Тъмна мъглявина", "Звездна детска градина"], e: "Планетарна мъглявина." },
      ringWhere: { q: "В кое съзвездие е мъглявината Пръстен?", o: ["Лира", "Орион", "Андромеда"], e: "В Лира, на около 2000 светлинни години." },
      ringFrom: { q: "Откъде идва планетарната мъглявина?", o: ["От изхвърлените слоеве на умираща звезда като Слънцето", "От избухнала планета", "От черна дупка"], e: "От външните слоеве, които изхвърля умираща звезда като Слънцето." },
      crabType: { q: "Какво е мъглявината Рак?", o: ["Остатък от свръхнова", "Звездна детска градина", "Галактика"], e: "Остатък от свръхнова, в Телец." },
      crabYear: { q: "Кога китайски астрономи виждат свръхновата на мъглявината Рак?", o: ["През 1054 г.", "През 1954 г.", "През 54 г. пр.н.е."], e: "През 1054 г., като „звезда гостенка“." },
      crabCore: { q: "Какво има в средата на мъглявината Рак?", o: ["Бързо въртяща се неутронна звезда, пулсар", "Планета", "Нищо"], e: "Бързо въртяща се неутронна звезда, пулсар." },
      mwShape: { q: "Каква форма има Млечният път?", o: ["Спирала с пречка", "Кълбо", "Пръстен"], e: "Спирала с пречка: диск със спирални ръкави и пречка от звезди в средата." },
      mwSize: { q: "Колко голям е Млечният път?", o: ["Над 100 000 светлинни години", "Около 100 светлинни години", "Около 100 милиона km"], e: "Над 100 000 светлинни години." },
      mwStars: { q: "Колко звезди има Млечният път според ЕКА?", o: ["Над 100 милиарда", "Около 8", "Около 100 000"], e: "Над сто милиарда." },
      orionArm: { q: "Близо до кой ръкав на Млечния път е Слънцето?", o: ["Ръкава на Орион", "Ръкава на Андромеда", "Ръкава на Луната"], e: "Близо до ръкава на Орион, малък, непълен ръкав." },
      armBetween: { q: "Между кои ръкави е ръкавът на Орион?", o: ["Ръкавите на Стрелец и Персей", "Телец и Лира", "Няма други ръкави"], e: "Между ръкавите на Стрелец и Персей." },
      centerDist: { q: "Колко далеч е центърът на Млечния път?", o: ["Около 26 000 до 27 000 светлинни години", "Около 4 светлинни години", "Около 2,5 милиона светлинни години"], e: "Около 26 000 (НАСА, 8 kpc) до 27 000 (ЕЮО) светлинни години." },
      lapTime: { q: "Колко трае една обиколка на Слънцето около центъра?", o: ["Около 230 до 240 милиона години", "Една година", "Около 4,6 милиарда години"], e: "Около 230 милиона (страницата на НАСА за Слънцето) или 240 милиона години (страницата на НАСА за галактиките, ЕКА)." },
      sunSpeed: { q: "Колко бързо обикаля Слънцето около центъра според НАСА?", o: ["С около 720 000 km/h", "С около 72 km/h", "Със скоростта на светлината"], e: "Средно с около 720 000 km/h." },
      lapDiffer: { q: "Какво казват страниците на НАСА и ЕКА за времето на една обиколка?", o: ["Не съвпадат: 230 или 240 милиона години", "Всички казват точно 230 милиона", "Не дават число"], e: "Не съвпадат: 230 милиона на една страница, 240 милиона на други." },
      bandWhat: { q: "Какво е светлата ивица на нощното небе?", o: ["Дискът на нашата галактика", "Облак на Земята", "Светлината на Луната"], e: "Централният диск на нашата галактика." },
      bandEdge: { q: "Откъде виждаме диска на Млечния път?", o: ["Отвътре, откъм ръба", "Отгоре", "Извън галактиката"], e: "Отвътре, откъм ръба: Слънцето е в диска." },
      bandDir: { q: "В каква посока е центърът на Млечния път?", o: ["В посока Стрелец", "В посока Андромеда", "В посока Полярната звезда"], e: "В посока на съзвездието Стрелец." },
      gaiaWhat: { q: "Какво е направила „Гая“ на ЕКА?", o: ["Точна 3D карта на Млечния път", "Първото изображение на черна дупка", "Кацане на Марс"], e: "Точна триизмерна карта на Млечния път." },
      gaiaCount: { q: "Колко източника съдържа Gaia DR3 (2022 г.)?", o: ["Около 1,8 милиарда", "Около 1800", "Около 18"], e: "1 811 709 771, около 1,8 милиарда." },
      gaiaEnd: { q: "Кога „Гая“ приключва научните си наблюдения?", o: ["На 15 януари 2025 г.", "През 1990 г.", "Още наблюдава"], e: "На 15 януари 2025 г." },
      localGroup: { q: "Какво е Местната група?", o: ["Групата галактики, към която принадлежи Млечният път", "Планетите на Слънцето", "Звездите на едно съзвездие"], e: "Групата галактики, към която принадлежи Млечният път." },
      groupCount: { q: "Колко галактики има в Местната група според НАСА?", o: ["Над 50", "Точно 3", "Около милион"], e: "Над 50." },
      m33Third: { q: "Коя е третата по големина галактика в Местната група?", o: ["Галактиката Триъгълник (M33)", "Малкият Магеланов облак", "M87"], e: "Галактиката Триъгълник (M33), на около 3 милиона светлинни години." },
      lmcSat: { q: "Какво е Големият Магеланов облак?", o: ["Галактика спътник на Млечния път", "Мъглявина в Орион", "Облак на Земята"], e: "Галактика спътник на Млечния път." },
      smcDist: { q: "Колко далеч е Малкият Магеланов облак според ЕКА/Хъбъл?", o: ["200 000 светлинни години", "200 светлинни години", "200 милиона светлинни години"], e: "200 000 светлинни години." },
      smcWhere: { q: "В кое съзвездие е Малкият Магеланов облак?", o: ["Тукан", "Андромеда", "Орион"], e: "В Тукан." },
      andDist: { q: "Колко далеч е галактиката Андромеда според НАСА?", o: ["2,5 милиона светлинни години", "2500 светлинни години", "25 милиарда светлинни години"], e: "2,5 милиона светлинни години." },
      andEye: { q: "Може ли галактиката Андромеда да се види без телескоп?", o: ["Да, от тъмно място с просто око", "Не, никога", "Само от Луната"], e: "Да: от тъмно място лесно се вижда с просто око." },
      andWhere: { q: "Коя е най-голямата галактика в Местната група?", o: ["Галактиката Андромеда", "Млечният път", "Малкият Магеланов облак"], e: "Галактиката Андромеда." },
      andSpeed: { q: "Колко бързо се приближава Андромеда според НАСА?", o: ["С около 250 000 мили (400 000 km) в час", "С около 25 km в час", "Тя се отдалечава"], e: "С около 250 000 мили в час, около 400 000 km в час." },
      collide2012: { q: "Какво предсказва НАСА през 2012 г.?", o: ["Челен сблъсък след около 4 милиарда години", "Сблъсък догодина", "Никога сблъсък"], e: "Челен сблъсък след около четири милиарда години." },
      merge2012: { q: "Според прогнозата от 2012 г. кога двете галактики биха се слели в една?", o: ["След около 6 милиарда години", "След около 6000 години", "Никога"], e: "След около 6 милиарда години." },
      chance2025: { q: "Какъв шанс за сблъсък в рамките на 10 милиарда години намира проучването от 2025 г.?", o: ["Само 50 на 50", "100 %", "0 %"], e: "Само 50 на 50." },
      dataNew: { q: "Какви данни използва проучването от 2025 г.?", o: ["От „Хъбъл“ и „Гая“ на ЕКА", "Само стари рисунки", "От сонда на Андромеда"], e: "Данни от „Хъбъл“ и „Гая“ на ЕКА." },
      scienceChange: { q: "Какво показва новото проучване за науката?", o: ["Прогнозите може да се променят с по-добри данни", "Прогнозите никога не се променят", "Науката е гадаене"], e: "Прогнозата важи, докато данните я подкрепят; по-добри данни може да я променят." },
      nsForm: { q: "Как се образува неутронна звезда според НАСА?", o: ["На масивна звезда ѝ свършва горивото и тя се срутва", "Две планети се сблъскват", "Комета замръзва"], e: "На масивна звезда ѝ свършва горивото и тя се срутва." },
      nsSize: { q: "Какъв е приблизително диаметърът на неутронна звезда?", o: ["Около 20 km", "Колкото Слънцето", "Около 20 m"], e: "Около 20 километра, с повече маса от Слънцето." },
      nsSugar: { q: "Колко би тежала според НАСА бучка захар от материя на неутронна звезда?", o: ["Около 1 трилион килограма", "Около един грам", "Около един тон"], e: "Около 1 трилион килограма." },
      pulsarWhat: { q: "Какво е пулсар?", o: ["Въртяща се неутронна звезда, която изпраща импулси от лъчение", "Мигаща планета", "Млада звезда"], e: "Въртяща се неутронна звезда, която изпраща импулси от лъчение." },
      lighthouse: { q: "С какво може да се сравни пулсар според НАСА?", o: ["С фар", "Със свещ", "С огледало"], e: "С фар: лъчът му минава покрай нас отново и отново." },
      pulseTime: { q: "Колко време обикновено има между импулсите на пулсар?", o: ["От милисекунди до секунди", "Години", "Векове"], e: "Обикновено от милисекунди до секунди." },
      noLight: { q: "Какво може да избяга от черна дупка?", o: ["Нищо, дори светлината", "Само светлината", "Всичко достатъчно бързо"], e: "Нищо, дори светлината." },
      noVacuum: { q: "Засмукват ли черните дупки всичко около себе си според НАСА?", o: ["Не, не засмукват друга материя", "Да, като прахосмукачка", "Само планети"], e: "Не: черните дупки не засмукват друга материя." },
      sunSwap: { q: "Ако Слънцето бъде заменено с черна дупка със същата маса, какво ще правят планетите?", o: ["Ще останат на орбитите си", "Веднага ще паднат в нея", "Ще отлетят"], e: "Ще останат на орбитите си." },
      smbh: { q: "Колко тежки са свръхмасивните черни дупки според НАСА?", o: ["От стотици хиляди до милиарди пъти Слънцето", "Колкото Земята", "Колкото Луната"], e: "От стотици хиляди до милиарди пъти масата на Слънцето." },
      sgrMass: { q: "Колко масивна е Стрелец A* според ЕЮО?", o: ["Четири милиона пъти Слънцето", "Колкото Слънцето", "Четири пъти Слънцето"], e: "Четири милиона пъти по-масивна от Слънцето." },
      sgrDist: { q: "Колко далеч е Стрелец A* според ЕЮО?", o: ["Около 27 000 светлинни години", "Около 27 светлинни години", "Около 27 милиона светлинни години"], e: "Около 27 000 светлинни години, в посока Стрелец." },
      firstImage: { q: "Кога е показано първото изображение на черна дупка?", o: ["На 10 април 2019 г.", "През 1969 г.", "През 2001 г."], e: "На 10 април 2019 г.: черната дупка в M87." },
      m87Dist: { q: "Колко далеч е черната дупка в M87 според ЕЮО?", o: ["55 милиона светлинни години", "55 светлинни години", "55 милиарда светлинни години"], e: "55 милиона светлинни години." },
      sgrImage: { q: "Кога е показано първото изображение на Стрелец A*?", o: ["На 12 май 2022 г.", "На 10 април 2019 г.", "През 1995 г."], e: "На 12 май 2022 г." },
      mainSequence: { q: "Какво прави звездата в главната последователност?", o: ["Стабилно слива водород в хелий", "Избухва", "Бавно изстива"], e: "Стабилно слива водород в хелий в ядрото си." },
      longestPhase: { q: "Коя е най-дългата фаза в живота на звездата?", o: ["Главната последователност", "Червеният гигант", "Свръхновата"], e: "Главната последователност." },
      sunMidway: { q: "Къде е Слънцето в живота си?", o: ["Приблизително в средата на главната си последователност", "Съвсем в края", "Току-що родено"], e: "Приблизително в средата на около 10-те си милиарда години в главната последователност." },
      massFuel: { q: "Коя звезда изразходва горивото си по-бързо?", o: ["По-масивната", "По-леката", "Еднакво"], e: "По-масивната." },
      massiveShort: { q: "Колко дълго живеят най-тежките звезди?", o: ["Само няколко милиона години", "Трилиони години", "Вечно"], e: "Само няколко милиона години." },
      lowMassLong: { q: "Колко дълго може да светят някои звезди с малка маса според НАСА?", o: ["Трилиони години", "Няколко хиляди години", "Няколко дни"], e: "Трилиони години." },
      noHydrogen: { q: "Какво става, когато в ядрото на звездата свърши водородът?", o: ["Ядрото се свива, а звездата се раздува", "Звездата веднага угасва", "Нищо не се променя"], e: "Ядрото започва да се свива, а звездата бавно се раздува." },
      redGiant: { q: "Какво става звезда като Слънцето след главната последователност?", o: ["Червен гигант", "Черна дупка", "Планета"], e: "Червен гигант." },
      giantWhen: { q: "Кога Слънцето ще стане червен гигант според НАСА?", o: ["След около 5 милиарда години", "След около 5000 години", "През следващия век"], e: "След около 5 милиарда години." },
      whiteDwarf: { q: "Какво е бяло джудже?", o: ["Останалото ядро на звезда, обикновено голямо колкото Земята", "Малка бяла планета", "Млада звезда"], e: "Ядрото, което остава, след като червеният гигант изхвърли атмосферата си, обикновено голямо колкото Земята." },
      teaspoon: { q: "Колко би тежала според НАСА една чаена лъжичка материя от бяло джудже?", o: ["Повече от пикап", "Колкото захар", "По-малко от въздух"], e: "Повече от пикап." },
      planetaryNebula: { q: "Какво образуват слоевете, които изхвърля умираща звезда като Слънцето?", o: ["Планетарна мъглявина", "Веднага нови планети", "Черна дупка"], e: "Разширяващ се облак от прах и газ, планетарна мъглявина." },
      supernova: { q: "Какво е свръхнова?", o: ["Избухването на звезда", "Раждането на нова звезда", "Ярка планета"], e: "Избухването на звезда." },
      novaMass: { q: "Кои звезди свършват в свръхнова според НАСА?", o: ["Звездите с повече от около 8 пъти масата на Слънцето", "Всяка звезда", "Само червените джуджета"], e: "Звездите с повече от около осем пъти масата на Слънцето; друга страница на НАСА казва седем." },
      stardust: { q: "Къде са създадени елементите на телата ни според НАСА?", o: ["В ядрата на звездите", "На Луната", "В моретата на Земята"], e: "В ядрата на звездите; свръхновите са ги разпръснали." },
      molecularCloud: { q: "Къде се образуват звездите според НАСА?", o: ["В големи облаци от газ и прах, молекулярните облаци", "Във вътрешността на планети", "В пръстените на Сатурн"], e: "В големи студени облаци от газ и прах, молекулярните облаци." },
      clumpCollapse: { q: "Какво кара бучките в молекулярния облак да се свиват?", o: ["Гравитацията", "Вятър от Земята", "Светлина от Луната"], e: "Гравитацията." },
      orionNursery: { q: "Какво е мъглявината Орион?", o: ["Най-близката голяма област на звездообразуване, на около 1500 светлинни години", "Планета от Слънчевата система", "Черна дупка"], e: "Най-близката до Земята голяма област на звездообразуване, на около 1500 светлинни години." },
      protostar: { q: "Какво е протозвезда?", o: ["Бебе звезда", "Мъртва звезда", "Планета без звезда"], e: "Бебе звезда, преди в ядрото ѝ да започне синтезът." },
      protoHeat: { q: "Защо свиващата се бучка се нагрява?", o: ["Триенето нагрява материала", "Слънцето я огрява", "Гори като дърво"], e: "Триенето нагрява материала." },
      auMicAge: { q: "На колко години е AU Mic според НАСА?", o: ["На 20 до 30 милиона години", "На 4,6 милиарда години", "На 300 години"], e: "На 20 до 30 милиона години: Слънцето е поне 150 пъти по-старо." },
      diskYoung: { q: "Какво заобикаля младата звезда?", o: ["Диск от газ и прах", "Твърда ледена обвивка", "Нищо"], e: "Диск от газ и прах, останал от раждането ѝ." },
      planetsMerge: { q: "Как растат планетите в такъв диск?", o: ["Частици от скали и лед се сблъскват и сливат", "Звездата ги изплюва", "Идват от други галактики"], e: "Твърди частици от скали и лед се сблъскват и сливат." },
      pdsImage: { q: "Какво показва ЕЮО през 2018 г. при PDS 70?", o: ["Първото потвърдено изображение на планета в процес на образуване", "Нова звезда в Слънчевата система", "Черна дупка"], e: "Първото потвърдено изображение на планета, която се образува в диска: PDS 70 b." },
      clusters: { q: "Как често се раждат звездите според НАСА?", o: ["На групи, звездните купове", "Винаги сами", "В планети"], e: "На групи: в звездни купове." },
      pleiades: { q: "Какво са Плеядите?", o: ["Разсеян звезден куп в Телец", "Планета", "Далечна галактика"], e: "Разсеян звезден куп в Телец." },
      pleiadesDist: { q: "Колко далеч са Плеядите според НАСА?", o: ["Около 445 светлинни години", "Около 4 светлинни години", "Около 4 милиона светлинни години"], e: "Около 445 светлинни години; числото не е общоприето." },
      sunAge: { q: "Кога се е образувало Слънцето според НАСА?", o: ["Преди около 4,6 милиарда години", "Преди около 4600 години", "Преди около 46 милиона години"], e: "Преди около 4,6 милиарда години." },
      solarNebula: { q: "Как се нарича облакът, в който се е образувало Слънцето?", o: ["Слънчевата мъглявина", "Мъглявината Орион", "Млечният път"], e: "Слънчевата мъглявина, огромен въртящ се облак от газ и прах." },
      planetsLeft: { q: "От какво са се образували планетите?", o: ["От голяма част от материала, останал от раждането на Слънцето", "От парчета от Луната", "От други звезди"], e: "От голяма част от останалия материал са се образували планетите, и Земята." },
      starGas: { q: "Какво е звезда според НАСА?", o: ["Огромно кълбо от горещ газ", "Голяма светеща скала", "Дупка в небето"], e: "Огромно кълбо от горещ газ, държано заедно от собствената си гравитация." },
      starFusion: { q: "Какво става в ядрото на една звезда?", o: ["Водородът се слива в хелий", "Желязото гори като въглища", "Нищо, светлината идва от повърхността"], e: "Водородните ядра се притискат в хелий; това освобождава енергията на светлината ѝ." },
      starGravity: { q: "Какво държи звездата заедно?", o: ["Собствената ѝ гравитация", "Твърда обвивка", "Магнитното поле на Земята"], e: "Собствената ѝ гравитация." },
      colorTemp: { q: "Защо звездите имат различни цветове?", o: ["Защото са с различна температура", "Заради имената си", "Защото някои са от стъкло"], e: "Защото са с различна температура." },
      blueHot: { q: "Кои звезди са по-горещи?", o: ["Сините и белите", "Червените", "Оранжевите"], e: "Сините и белите звезди са по-горещи, оранжевите и червените по-хладни." },
      sunTemp: { q: "Колко гореща е повърхността на Слънцето според НАСА?", o: ["Около 5500 °C", "Около 55 °C", "Около 5,5 милиона °C"], e: "Около 5500 °C." },
      classOrder: { q: "Какъв е редът на звездните класове от горещо към хладно?", o: ["O, B, A, F, G, K, M", "A, B, C, D, E, F, G", "M, K, G, F, A, B, O"], e: "O, B, A, F, G, K, M." },
      sunClass: { q: "От кой клас е Слънцето?", o: ["G, жълто джудже", "M, червено джудже", "O, син гигант"], e: "G: жълто джудже." },
      mColor: { q: "Какъв цвят са звездите от клас M?", o: ["Червени", "Сини", "Бели"], e: "Червени: звездите M са най-хладните." },
      commonStars: { q: "Кои звезди са най-чести в Млечния път?", o: ["Червените джуджета", "Звездите като Слънцето", "Сините гиганти"], e: "Червените джуджета, около три четвърти от всички звезди." },
      sunLike: { q: "Колко от звездите на Млечния път са като Слънцето според НАСА?", o: ["Около 6 %", "Около 60 %", "Всяка втора"], e: "Само около 6 %." },
      proximaSize: { q: "Колко голяма е Проксима Кентавър в сравнение със Слънцето?", o: ["Около една седма от радиуса му", "Два пъти по-голяма", "Точно толкова голяма"], e: "Около една седма: 0,141 от радиуса на Слънцето." },
      orangeLife: { q: "Кои звезди НАСА смята за по-добри за развит живот?", o: ["Оранжевите джуджета от клас K", "Сините гиганти от клас O", "Никои"], e: "Оранжевите джуджета от клас K, малко по-хладни от Слънцето." },
      redLong: { q: "Кои звезди живеят най-дълго?", o: ["Червените джуджета, над 100 милиарда години", "Сините гиганти", "Звездите като Слънцето"], e: "Червените джуджета: НАСА дава над 100 милиарда години." },
      bakedDry: { q: "Какво може да се случи с планетите в обитаемата зона на червено джудже?", o: ["Може напълно да изсъхнат", "Стават звезди", "Нищо"], e: "Може напълно да изсъхнат." },
      firstLetter: { q: "Как се казва първата открита планета около една звезда?", o: ["Името на звездата с b", "Името на звездата с a", "Името на звездата с 1"], e: "b: самата звезда е неизписаното A." },
      sameTime: { q: "Няколко планети на една звезда са открити едновременно. Коя получава b?", o: ["Най-близката до звездата", "Най-голямата", "Най-външната"], e: "Най-близката до звездата." },
      letterOrder: { q: "По какво се подреждат буквите b, c, d?", o: ["По реда на откриване", "По големината на планетите", "По цвета им"], e: "По реда на откриване: Проксима d обикаля по-близо от b, но е открита по-късно." },
      capitals: { q: "Какво получава звезда в система с няколко звезди?", o: ["Главна буква: A, B, C", "Малка буква: b, c, d", "Цвят"], e: "Главна буква; планетите получават малки." },
      hostA: { q: "Коя буква обикновено е звездата с планетите, дори да не е изписана?", o: ["A", "B", "Z"], e: "A: неизписаното A на системата." },
      starOrPlanet: { q: "Какво е Proxima Cen b?", o: ["Планета", "Звезда", "Съзвездие"], e: "Планета: малката буква го показва." },
      alphaAries: { q: "Какво означава Alpha Arietis?", o: ["Алфата на Овен", "Овенът на алфата", "Най-ярката планета"], e: "Алфата на Овен; примерът на МАС е Хамал." },
      alphaCen: { q: "Към кое съзвездие принадлежи Алфа Кентавър?", o: ["Кентавър", "Овен", "Голямата мечка"], e: "Кентавър: Алфа Кентавър е алфата на Кентавър." },
      iau1922: { q: "Кога МАС се е договорил за списъка на 88-те съзвездия?", o: ["1922 г.", "1610 г.", "1995 г."], e: "През 1922 г.; границите им следват през 1928 г." },
      hdMeaning: { q: "Какво означава HD в името на звезда?", o: ["Каталога на Хенри Дрейпър", "„High Definition“", "Ярка двойна звезда"], e: "Каталога на Хенри Дрейпър." },
      toiMeaning: { q: "Какво означава TOI?", o: ["TESS Objects of Interest, кандидати на спътника TESS", "Съзвездие", "Сонда до Луната"], e: "TESS Objects of Interest: кандидатите на спътника TESS на НАСА." },
      trappistWhat: { q: "Какво е TRAPPIST?", o: ["Малък телескоп в Чили", "Звезда в Кентавър", "Планета от Слънчевата система"], e: "Малък телескоп в Чили; той е дал името на TRAPPIST-1." },
      gjMeaning: { q: "Какво е каталогът GJ?", o: ["Каталог на близките звезди на Глизе и Ярайс", "Каталог на галактики", "Списък на спътниците на Юпитер"], e: "Каталог на близките звезди на Вилхелм Глизе и Хартмут Ярайс." },
      romanGods: { q: "Според НАСА на какво е наречена всяка планета освен Земята?", o: ["На римски бог или богиня", "На откривателя си", "На съзвездие"], e: "На римски бог или богиня; Марс е богът на войната." },
      dimidium: { q: "Какво е собственото име на 51 Пегас b?", o: ["Димидиум", "Хелветиос", "Проксима"], e: "Димидиум; звездата ѝ се казва Хелветиос." },
      buyStar: { q: "Може ли да се купи име на звезда от МАС?", o: ["Не, МАС не продава имена", "Да, за всяка звезда", "Да, но само за ярки звезди"], e: "Не: МАС не продава имена и се разграничава от такива предложения." },
      notReplace: { q: "Заменя ли име като Димидиум научното обозначение?", o: ["Не, двете се използват едно до друго", "Да, старото се изтрива", "Само в Европа"], e: "Не: такива имена не заменят научните обозначения." },
      constCount: { q: "Колко официално признати съзвездия има според НАСА?", o: ["88", "12", "1000"], e: "88." },
      notConnected: { q: "Свързани ли са звездите на едно съзвездие?", o: ["Не, някои са близо, други много далеч", "Да, свързани са помежду си", "Да, всички са на еднакво разстояние"], e: "Не: те не са свързани; някои са близо, други много далеч." },
      constShape: { q: "Какво е съзвездие?", o: ["Група звезди, която сякаш образува фигура и има име", "Купчина звезди, които се обикалят", "Галактика"], e: "Група звезди, която на небето сякаш образува фигура и е получила име." },
      thirteen: { q: "През колко съзвездия минава Слънцето за една година според границите на МАС?", o: ["13", "12", "88"], e: "13: дванадесетте на зодиака и Змиеносец." },
      ophName: { q: "През кое съзвездие минава Слънцето, макар че то не е зодия?", o: ["Змиеносец", "Голямата мечка", "Орион"], e: "Змиеносец, от края на ноември до средата на декември." },
      ophDates: { q: "Кога приблизително Слънцето е в Змиеносец?", o: ["От края на ноември до средата на декември", "През юли", "През март"], e: "Приблизително от 30 ноември до 17 декември." },
      ophPasses: { you: "Колко пъти е минало Слънцето през Змиеносец от раждането ти?", ref: "Колко пъти минава Слънцето през Змиеносец за 30 години?", e: (n) => `Около ${n} пъти: веднъж всяка година.` },
      wobble: { q: "Какво е прецесията?", o: ["Бавното люшкане на земната ос", "Обиколката на Луната", "Едно съзвездие"], e: "Бавното люшкане на земната ос, като на пумпал." },
      wobbleTime: { q: "Колко трае едно люшкане на земната ос според НАСА?", o: ["Около 25 800 години", "Около 26 години", "Около 2,6 милиона години"], e: "Около 25 800 години." },
      signSize: { q: "Колко голяма е всяка зодия?", o: ["Една дванадесета от пътя на Слънцето: 30 градуса", "Колкото съзвездието ѝ", "Всяка с различна големина, като съзвездията"], e: "Всяка зодия е точно 30 градуса; съзвездията са с различна големина." },
      astronomyMethod: { q: "Как работи астрономията?", o: ["По научния метод, с доказателства и данни", "С предсказания по часа на раждане", "С късмет"], e: "По научния метод, с доказателства и данни." },
      astroEvidence: { q: "Основават ли се твърденията на астрологията на научни доказателства?", o: ["Не", "Да", "Само за летните зодии"], e: "Не. За някои културни традиции е важна, но твърденията ѝ не се основават на научни доказателства." },
      astroBelief: { q: "На какво се основава астрологията?", o: ["На вярата, че звездите и планетите показват бъдещето или характера", "На измервания с телескопи", "На границите на МАС"], e: "На вярата, че положението на звездите и планетите може да предскаже бъдещето или да опише човека." },
      lightTravel: { q: "Една звезда е на 46 светлинни години. Колко дълго е пътувала светлината ѝ до нас?", o: ["46 години", "46 дни", "46 минути"], e: "46 години: светлинната година е разстоянието, което светлината изминава за една година." },
      starsSpread: { q: "Колко далеч са звездите на Телец от нас според данните на тази карта?", o: ["Между 46 и 484 светлинни години", "Всички точно на 100 светлинни години", "По-малко от една светлинна година"], e: "Между 46 и 484 светлинни години: погледната отстрани, фигурата се разпада." },
      nightSky: { q: "Защо лятото виждаме други съзвездия, отколкото зимата?", o: ["Защото Земята обикаля Слънцето за една година", "Защото звездите се движат", "Защото съзвездията спят през лятото"], e: "Защото Земята обикаля Слънцето веднъж годишно: това, което е зад Слънцето, не се вижда нощем." },
      habOrbits: { you: "Колко пъти Земята те е пренесла около Слънцето в своята обитаема зона?", ref: "Колко пъти Земята пренася човек около Слънцето за 30 години?", e: (n) => `${n} пъти: веднъж годишно, винаги в обитаемата зона на Слънцето.` },
      toiAge: { you: "На колко години щеше да си на TOI-700 d?", ref: "На колко години щеше да е на TOI-700 d човек на 30?", e: (n) => `${n}: годината на TOI-700 d трае 37,4 дни.` },
      europaLaps: { you: "Колко пъти Европа е обиколила Юпитер от раждането ти?", ref: "Колко пъти Европа обикаля Юпитер за 30 години?", e: (n) => `${n} пъти: една обиколка трае 3,55 дни.` },
      venusAge: { you: "На колко години щеше да си на Венера?", ref: "На колко години щеше да е на Венера човек на 30?", e: (n) => `${n}: годината на Венера трае 0,615 земни години.` },
      candidatesAtBirth: { you: "Колко кандидати в обитаема зона е познавала тази карта в годината на раждането ти?", ref: "Колко кандидати в обитаема зона е познавала тази карта в годината на раждане на човек, който днес е на 30?", e: (n) => `${n}: повечето са открити през последните години.` },
    },
  },
};

// The personal sentence of a step, in the language of the page.
export function personalLine(step, nums, lang) {
  const s = (LEARN_TEXT[lang] ?? LEARN_TEXT.en).steps[step];
  const fmt = (x, d = 0) => x.toLocaleString(lang, { maximumFractionDigits: d, minimumFractionDigits: d });
  if (step === "sun") return (nums.you ? s.you : s.ref)(fmt(nums.orbits));
  if (step === "inner") return (nums.you ? s.you : s.ref)(fmt(nums.mars), fmt(nums.mercury));
  if (step === "outer") return (nums.you ? s.you : s.ref)(fmt(nums.jupiterLaps));
  if (step === "moons") return (nums.you ? s.you : s.ref)(fmt(nums.moonLaps));
  if (step === "exoWhat") return (nums.you ? s.you : s.ref)(fmt(nums.knownAtBirth), fmt(nums.knownNow), String(nums.birthYear)); // a year without a thousands separator
  if (step === "habLife") return (nums.you ? s.you : s.ref)(fmt(nums.candidatesAtBirth), fmt(nums.candidatesNow), String(nums.birthYear));
  if (PATHS.nebula.steps.includes(step) || PATHS.milky.steps.includes(step) || PATHS.local.steps.includes(step)) {
    const f = nums.you ? s.you : s.ref;
    // an event before the birth, in its year, or at an age; without a year of birth: how long ago
    const when = (before, ago) => (before == null ? s.ref(fmt(ago)) : s.you(before > 0 ? fmt(before) : null, before <= 0 ? fmt(Math.abs(before)) : null));
    switch (step) {
      case "nebWhat": return f(fmt(nums.orionShare, 1));
      case "nebPillars": return when(nums.webbBefore, nums.webbAgo);
      case "nebDark": return f(String(nums.horseYear));
      case "nebRing": return f(fmt(nums.ringTimes));
      case "nebCrab": return nums.crabBefore == null ? s.ref(fmt(nums.crabAgo)) : s.you(fmt(nums.crabBefore));
      case "mwWhat": return f(fmt(nums.mwShare, 3));
      case "mwArm": return f(fmt(nums.orbits), fmt(nums.centerShare, 2));
      case "mwOrbit": return f(fmt(Math.round(nums.sunKm)), fmt(nums.lapTimes));
      case "mwBand": return f(fmt(nums.orbits));
      case "mwGaia": return when(nums.gaiaBefore, nums.gaiaAgo);
      case "locGroup": return f(fmt(nums.m33Times));
      case "locMagellan": return f(fmt(nums.smcTimes));
      case "locAndromeda": return f(fmt(nums.andTimes));
      case "locApproach": return f(fmt(Math.round(nums.andKm)));
      default: return f(fmt(nums.collideTimes));
    }
  }
  if (PATHS.compact.steps.includes(step)) {
    const f = nums.you ? s.you : s.ref;
    if (step === "nsWhat") {
      const mine = nums.starName != null;
      const mass = mine ? nums.starMass : PROXIMA_INFO.mass;
      const name = mine ? nums.starName : "Proxima Centauri";
      return mass == null ? s.none(name) : (mine ? s.you : s.ref)(name, fmt(mass, 2));
    }
    if (step === "nsPulsar") return f(fmt(nums.pulsarBlinks));
    if (step === "bhWhat") return f(fmt(nums.orbits));
    if (step === "bhCenter") return nums.you ? s.you(fmt(nums.sgrBefore)) : s.ref();
    if (nums.ehtBefore == null) return s.ref(fmt(nums.ehtAgo));
    return s.you(nums.ehtBefore > 0 ? fmt(nums.ehtBefore) : null, nums.ehtBefore <= 0 ? fmt(Math.abs(nums.ehtBefore)) : null);
  }
  if (PATHS.life.steps.includes(step)) {
    if (step === "lifeMain") return (nums.you ? s.you : s.ref)(fmt(nums.sunYearSeconds, 2));
    if (step === "lifeGiant") return (nums.you ? s.you : s.ref)(fmt(nums.giantLives));
    // the visitor's star with its mass from the table, or Proxima Centauri
    const mine = nums.starName != null;
    const name = mine ? nums.starName : "Proxima Centauri";
    const mass = mine ? nums.starMass : PROXIMA_INFO.mass;
    if (mass == null) return s.none(name);
    const f = mine ? s.you : s.ref;
    if (step === "lifeMass") return f(name, fmt(mass, 2), mass < 1);
    return f(name, fmt(mass, 2), fateOf(mass));
  }
  if (PATHS.birth.steps.includes(step)) {
    const f = nums.you ? s.you : s.ref;
    if (step === "birthCloud") return f(fmt(nums.orionBefore));
    if (step === "birthProto") return f(fmt(nums.auMicTimes));
    if (step === "birthDisk") {
      if (nums.pdsBefore == null) return s.ref(fmt(nums.pdsAgo));
      return s.you(nums.pdsBefore > 0 ? fmt(nums.pdsBefore) : null, nums.pdsBefore <= 0 ? fmt(Math.abs(nums.pdsBefore)) : null);
    }
    if (step === "birthCluster") return nums.pleiadesBefore != null ? s.you(String(nums.pleiadesYear), fmt(nums.pleiadesBefore)) : s.ref(String(nums.pleiadesYear));
    return f(fmt(nums.sunDayMs, 2));
  }
  if (PATHS.stars.steps.includes(step)) {
    if (step === "starWhat") return (nums.you ? s.you : s.ref)(fmt(nums.orbits));
    // the visitor's star with its value from the table, or Proxima Centauri
    const mine = nums.starName != null;
    const info = mine ? { teff: nums.starTeff, rad: nums.starRad, spec: nums.starSpec } : PROXIMA_INFO;
    const name = mine ? nums.starName : "Proxima Centauri";
    const f = mine ? s.you : s.ref;
    const cls = starClassOf(info.spec);
    if (step === "starColor") {
      if (info.teff == null) return s.none(name);
      const c = celsius(info.teff);
      return f(name, fmt(c), c > SUN_SURFACE_C);
    }
    if (step === "starClass") return cls ? f(name, info.spec, s.colors[cls]) : s.none(name);
    if (step === "starSize") {
      if (info.rad == null) return s.none(name);
      return f(name, info.rad < 1 ? fmt(Math.round(info.rad * 100)) : fmt(info.rad, 1), info.rad < 1);
    }
    return cls ? f(name, cls, s.hint[cls] ?? "") : s.none(name);
  }
  if (PATHS.names.steps.includes(step)) {
    if (step === "nameLetters") {
      const list = nums.namePlanets.join(", ");
      return nums.nameStar ? s.you(nums.nameStar, list, nums.namePlanets.length) : s.ref();
    }
    if (step === "nameStars") return nums.you ? s.you(nums.alphaLeft == null ? null : fmt(nums.alphaLeft)) : s.ref(fmt(REFERENCE_AGE - Math.ceil(ALPHA_CEN_LY)));
    if (step === "nameGreek") return (nums.zodYou ? s.you : s.ref)(zodName(nums.zodReal, lang), GENITIVE[nums.zodReal]);
    if (step === "nameCatalog") return nums.nameStar ? s.you(nums.nameStar, s.cat[catalogOf(nums.nameStar) ?? "other"]) : s.ref("HD 209458", s.cat.HD);
    // 51 Pegasi b: found before the birth, in its year, or at an age
    if (nums.pegBefore == null) return s.ref(fmt(nums.pegAgo));
    return s.you(nums.pegBefore > 0 ? fmt(nums.pegBefore) : null, nums.pegBefore <= 0 ? fmt(Math.abs(nums.pegBefore)) : null);
  }
  if (PATHS.zod.steps.includes(step)) {
    const f = nums.zodYou ? s.you : s.ref;
    const name = (id) => zodName(id, lang);
    const ly = (x) => (x == null ? null : fmt(Math.round(x)));
    if (step === "zodWhat") return f(name(nums.zodReal), ly(nums.zodNear), ly(nums.zodFar));
    if (step === "zodPath") return (nums.you ? s.you : s.ref)(fmt(nums.orbits));
    if (step === "zodShift") return f(name(nums.zodSign), name(nums.zodReal), nums.zodSign === nums.zodReal);
    if (step === "zodScience") return f(name(nums.zodSign));
    // the light of the nearest star of the constellation: how long before the birth it set off, or at what age of the visitor
    const near = nums.zodNear == null ? null : Math.round(nums.zodNear);
    const before = near != null && nums.you && near > nums.orbits ? fmt(near - nums.orbits) : null;
    const at = near != null && nums.you && near <= nums.orbits ? fmt(nums.orbits - near) : null;
    return f(name(nums.zodReal), ly(near), before, at);
  }
  if (step === "exoSystems") return (nums.you ? s.you : s.ref)(fmt(nums.trappistBLaps), fmt(nums.orbits));
  if (step === "habExtreme") return (nums.you ? s.you : s.ref)();
  const hab = { habWhat: "orbits", habZone: "toiAge", habWater: "europaLaps", habAtmos: "venusAge", habIngredients: "rockFactor" }[step];
  if (hab) return (nums.you ? s.you : s.ref)(fmt(nums[hab]));
  const exo = { exoHow: "transitSince", exoRocky: "trappistAge", exoGiants: "pegAge", exoStrange: "cancriAge", exoFamous: "kepler16Age" }[step];
  if (exo) return (nums.you ? s.you : s.ref)(fmt(nums[exo]));
  const alpha = { neighbors: "proximaLeft", pair: "lapShare", proxima: "lightTrips", proximaB: "proximaBAge", travel: "lifetimes" }[step];
  if (alpha) return (nums.you ? s.you : s.ref)(nums[alpha] == null ? null : fmt(nums[alpha]));
  return nums.star ? s.you(nums.star.name, fmt(nums.star.dist, 1), nums.star.year) : s.ref;
}

// The area Learn: the path with its steps, a step, or the final test. personal(): the context of personalNumbers; act(task): do a task
// (TASKS) in the 3D view, or "explanationScale" (back from the real scale); isRealScale(): whether the real scale is on; closePanel():
// close My Universe.
export function initLearn({ getLang, explorer, personal, act, show, isRealScale, closePanel }) {
  const t = () => LEARN_TEXT[getLang()] ?? LEARN_TEXT.en;
  const el = (tag, cls, content) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (content != null) e.textContent = content;
    return e;
  };
  const button = (label, cls, onClick) => {
    const b = el("button", cls, label);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  };
  let PATH = "solar"; // the path open now
  let view = "list"; // "list" (all the paths), "path", a step, or "test"
  const answers = {}; // step -> question -> the label chosen last (for this visit)
  let attempt = 0;
  let testChosen = {};
  let testChecked = false;

  const total = () => explorer.getState().total ?? {};
  const has = (list, id) => (total()[list] ?? []).includes(id);
  const stepDone = (step) => has("learnSteps", `${PATH}/${step}`);
  const taskDone = (step) => has("learnTasks", `${PATH}/${step}`);
  let steps = PATHS[PATH].steps;
  const doneOf = (path) => PATHS[path].steps.filter((step) => has("learnSteps", `${path}/${step}`)).length;
  function choose(path) {
    PATH = path;
    steps = PATHS[path].steps;
    attempt = 0;
    testChosen = {};
    testChecked = false;
  }
  const doneCount = () => steps.filter(stepDone).length;
  const best = () => total()[`learnBest:${PATH}`] ?? 0;
  const pathPassed = () => has("learnPaths", PATH);
  const nums = () => personalNumbers(personal());

  // a small picture for each step, from the same drawings as the rest of My Universe
  const HAB_PICTURE = { habWhat: { name: "Earth" }, habZone: { temp: 269 }, habWater: { name: "Jupiter" }, habAtmos: { name: "Venus" }, habIngredients: { name: "Mars" }, habExtreme: { name: "Earth" }, habLife: { temp: 218 } };
  const EXO_PICTURE = { exoWhat: 1329, exoHow: 279, exoRocky: 250, exoGiants: 1459, exoStrange: 1958, exoSystems: 398, exoFamous: 1209 }; // the temperatures of their planets (K)
  const ALPHA_PICTURE = { neighbors: 3000, pair: 5790, proxima: 3000, travel: 5772 }; // the temperature of the star drawn
  const GALAXY_PICTURE = {
    nebWhat: 20000, nebPillars: 25000, nebDark: 15000, nebRing: 60000, nebCrab: 30000,
    mwWhat: 6500, mwArm: 5772, mwOrbit: 5772, mwBand: 8000, mwGaia: 7000,
    locGroup: 9000, locMagellan: 12000, locAndromeda: 7000, locApproach: 7000, locFuture: 9000,
  }; // the temperatures of the stars drawn
  const COMPACT_PICTURE = { nsWhat: 30000, nsPulsar: 30000, bhWhat: 3500, bhCenter: 3500, bhImage: 3500 }; // the temperatures of the stars drawn
  const LIFE_PICTURE = { lifeMain: 5772, lifeMass: 2900, lifeGiant: 3500, lifeWhite: 9000, lifeNova: 25000 }; // the temperatures of the stars drawn
  const BIRTH_PICTURE = { birthCloud: 20000, birthProto: 3540, birthDisk: 4109, birthCluster: 12000, birthSun: 5772 }; // the temperatures of the stars drawn
  const STAR_PICTURE = { starWhat: 5772, starColor: 2566, starClass: 5761, starSize: 2900, starHosts: 3459 }; // the temperatures of the stars drawn
  const NAME_PICTURE = { nameLetters: 3050, nameStars: 5790, nameGreek: 9600, nameCatalog: 2566, nameStories: 5770 }; // the temperatures of the stars drawn
  const ZOD_PICTURE = { zodWhat: 9600, zodPath: 5772, zodShift: 5772, zodScience: 4200, zodLight: 9600 }; // the temperatures of the stars drawn
  const pictureOf = (step) =>
    GALAXY_PICTURE[step] ? starCanvas(GALAXY_PICTURE[step], "uni-orb small star", 28)
    : COMPACT_PICTURE[step] ? starCanvas(COMPACT_PICTURE[step], "uni-orb small star", 28)
    : LIFE_PICTURE[step] ? starCanvas(LIFE_PICTURE[step], "uni-orb small star", 28)
    : BIRTH_PICTURE[step] ? starCanvas(BIRTH_PICTURE[step], "uni-orb small star", 28)
    : STAR_PICTURE[step] ? starCanvas(STAR_PICTURE[step], "uni-orb small star", 28)
    : NAME_PICTURE[step] ? starCanvas(NAME_PICTURE[step], "uni-orb small star", 28)
    : ZOD_PICTURE[step] ? starCanvas(ZOD_PICTURE[step], "uni-orb small star", 28)
    : ALPHA_PICTURE[step] ? starCanvas(ALPHA_PICTURE[step], "uni-orb small star", 28)
    : step === "proximaB" ? planetCanvas({ temp: 218 }, "uni-orb small", 28)
    : EXO_PICTURE[step] ? planetCanvas({ temp: EXO_PICTURE[step] }, "uni-orb small", 28)
    : HAB_PICTURE[step] ? planetCanvas(HAB_PICTURE[step], "uni-orb small", 28)
    : step === "sun" ? starCanvas(5772, "uni-orb small star", 28)
    : planetCanvas({ name: { inner: "Mars", outer: "Saturn", moons: "Moon", scale: "Neptune" }[step] }, "uni-orb small", 28);
  // Reading a step aloud: only with a voice that runs on the device. An online voice (some of Chrome's) would send the text, with the
  // visitor's own numbers in it, to a server; without a voice on the device there is no button.
  let speaking = null; // the step being read
  let speakToken = 0; // a stopped reading must not report its end
  let waitingForVoices = false;
  const localVoice = () => {
    const synth = window.speechSynthesis;
    if (!synth) return null;
    return synth.getVoices().find((v) => v.localService && v.lang.toLowerCase().startsWith(getLang())) ?? null;
  };
  function stopSpeaking() {
    speakToken += 1;
    if (speaking) window.speechSynthesis?.cancel();
    speaking = null;
  }
  function speakButton(step, texts, onChange) {
    const voice = localVoice();
    if (!voice) {
      // some browsers load their voices late: draw again once they are there
      if (window.speechSynthesis && !waitingForVoices) {
        waitingForVoices = true;
        speechSynthesis.addEventListener("voiceschanged", () => onChange?.(), { once: true });
      }
      return null;
    }
    const tx = t();
    const on = speaking === step;
    const b = button(on ? `■ ${tx.speakStop}` : `▶ ${tx.speak}`, `learn-speak${on ? " on" : ""}`, () => {
      if (speaking === step) return stopSpeaking(), onChange?.();
      stopSpeaking();
      speaking = step;
      const token = speakToken;
      // one utterance per paragraph: some browsers cut long texts off
      texts.forEach((text, i) => {
        const u = new SpeechSynthesisUtterance(text);
        u.voice = voice;
        u.lang = voice.lang;
        if (i === texts.length - 1)
          u.onend = u.onerror = () => {
            if (token !== speakToken) return;
            speaking = null;
            onChange?.();
          };
        speechSynthesis.speak(u);
      });
      track(`learn-speak-${step}`);
      onChange?.();
    });
    b.title = tx.speakTitle;
    b.setAttribute("aria-pressed", String(on));
    return b;
  }
  const statusIcon = (glyph) => {
    const i = el("i", "uni-orb small icon learn-status", glyph);
    i.setAttribute("aria-hidden", "true");
    return i;
  };

  // the task of a step, with "figure:birth" and "figure:birthSign" turned into the visitor's constellations (zodNumbers)
  const taskOf = (step) => {
    const task = TASKS[step];
    if (task !== "figure:birth" && task !== "figure:birthSign") return task;
    const n = personalNumbers(personal());
    return `figure:${task === "figure:birth" ? n.zodReal : n.zodSign}`;
  };
  // a step counts as done once: its task done and every question answered right
  function maybeFinish(step, questions) {
    if (stepDone(step) || (TASKS[step] && !taskDone(step))) return;
    if (!questions.every((q) => answers[step]?.[q.id] === q.answer)) return;
    explorer.emit("learnStep", `${PATH}/${step}`);
    track(`learn-step-${step}`);
  }

  const pathPicture = (path, cls, size) =>
    path === "alpha" ? starCanvas(5790, `${cls} star`, size)
    : path === "zod" ? starCanvas(9600, `${cls} star`, size)
    : path === "names" ? starCanvas(3050, `${cls} star`, size)
    : path === "stars" ? starCanvas(9000, `${cls} star`, size)
    : path === "birth" ? starCanvas(4109, `${cls} star`, size)
    : path === "life" ? starCanvas(3500, `${cls} star`, size)
    : path === "compact" ? starCanvas(30000, `${cls} star`, size)
    : path === "nebula" ? starCanvas(20000, `${cls} star`, size)
    : path === "milky" ? starCanvas(6500, `${cls} star`, size)
    : path === "local" ? starCanvas(9000, `${cls} star`, size)
    : path === "exo" ? planetCanvas({ temp: 1329 }, cls, size)
    : path === "hab" ? planetCanvas({ name: "Earth" }, cls, size)
    : planetCanvas({ name: "Saturn" }, cls, size);

  // the picture of a path in a ring that fills with its steps and its final test (share from 0 to 1)
  function ringed(picture, share) {
    const NS = "http://www.w3.org/2000/svg";
    const box = el("span", "learn-ring");
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("aria-hidden", "true");
    for (const [cls, len] of [["track", 100], ["fill", share * 100]]) {
      if (len <= 0) continue;
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", "50");
      c.setAttribute("cy", "50");
      c.setAttribute("r", "46");
      c.setAttribute("pathLength", "100");
      c.setAttribute("class", cls);
      c.setAttribute("stroke-dasharray", `${len} ${100 - len}`);
      svg.append(c);
    }
    box.append(svg, picture);
    return box;
  }

  // all the paths: a card each, its picture in a ring of its progress
  function listView(onChange) {
    const tx = t();
    // the paths by the parts of the plan, each part with its title; a part without a path yet is left out
    const out = [];
    for (const part of PARTS) {
      const paths = part.paths.filter((p) => PATHS[p]);
      if (paths.length) out.push(el("h4", "learn-part", tx.parts[part.id]), cards(paths, onChange));
    }
    return out;
  }
  function cards(paths, onChange) {
    const tx = t();
    const list = el("div", "learn-cards");
    for (const path of paths) {
      const all = PATHS[path].steps.length;
      const done = doneOf(path);
      const passedIt = has("learnPaths", path);
      const card = el("button", `learn-card${passedIt ? " done" : ""}`);
      card.type = "button";
      card.append(
        ringed(pathPicture(path, "learn-card-pic", 56), passedIt ? 1 : done / (all + 1)),
        el("strong", "", tx.paths[path].title),
        el("small", "", passedIt ? `★ ${tx.status.done}` : tx.progress(done, all)),
        el("small", "learn-card-meta", tx.path.meta(PATHS[path].minutes))
      );
      card.addEventListener("click", () => (choose(path), (view = "path"), show?.(PATH_VIEWS[path]), track(`learn-path-${path}`), onChange?.()));
      list.append(card);
    }
    return list;
  }

  function pathView(onChange) {
    const tx = t();
    const back = button(`‹ ${tx.allPaths}`, "uni-link learn-back", () => ((view = "list"), onChange?.()));
    const card = el("div", "learn-path");
    const head = el("div", "learn-path-head");
    const text = el("div", "");
    text.append(el("strong", "", tx.paths[PATH].title), el("p", "", tx.paths[PATH].goal), el("small", "", `${tx.path.meta(PATHS[PATH].minutes)} · ${tx.progress(doneCount(), steps.length)}`));
    head.append(pathPicture(PATH, "learn-path-pic", 64), text);
    const bar = el("div", "uni-bar");
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", String(steps.length));
    bar.setAttribute("aria-valuenow", String(doneCount()));
    bar.setAttribute("aria-label", tx.progress(doneCount(), steps.length));
    const fill = el("i", "");
    fill.style.width = `${Math.max(2, (doneCount() / steps.length) * 100)}%`;
    bar.append(fill);
    card.append(head, bar, el("p", "hint", tx.path.rule(steps.length)));
    const list = el("div", "uni-list");
    const firstOpen = steps.find((s) => !stepDone(s));
    steps.forEach((step, i) => {
      const s = tx.steps[step];
      const state = stepDone(step) ? tx.status.done : step === firstOpen ? tx.status.next : tx.status.open;
      const row = el("button", `uni-item learn-step${stepDone(step) ? " done" : ""}${step === firstOpen ? " next" : ""}`);
      row.type = "button";
      const t2 = el("span", "uni-item-text");
      t2.append(el("strong", "", `${i + 1}. ${s.title}`), el("small", "", `${state} · ${s.goal}`));
      const arrow = el("span", "uni-arrow", stepDone(step) ? "✓" : "›");
      arrow.setAttribute("aria-hidden", "true");
      row.append(pictureOf(step), t2, arrow);
      row.addEventListener("click", () => ((view = step), show?.(VIEWS[step]), track(`learn-open-${step}`), onChange?.()));
      list.append(row);
    });
    // the final test, open when all steps are done
    const open = doneCount() === steps.length;
    const testRow = el("button", `uni-item learn-step${pathPassed() ? " done" : ""}`);
    testRow.type = "button";
    testRow.disabled = !open;
    const tt = el("span", "uni-item-text");
    tt.append(el("strong", "", `${steps.length + 1}. ${tx.test.title}`), el("small", "", !open ? tx.status.locked : best() ? tx.test.best(best()) : tx.test.intro(PATHS[PATH].testSize, PATHS[PATH].pass * 100)));
    testRow.append(statusIcon(pathPassed() ? "★" : "?"), tt, el("span", "uni-arrow", open ? "›" : ""));
    if (open) testRow.addEventListener("click", () => ((view = "test"), onChange?.()));
    list.append(testRow);
    return [back, card, list];
  }

  function questionBlock(q, chosen, onPick, reveal) {
    const box = el("div", "learn-q");
    box.append(el("p", "learn-q-text", q.text));
    const options = el("div", "learn-options");
    for (const label of q.options) {
      const b = button(label, "learn-option", () => onPick(label));
      if (chosen === label) b.classList.add(reveal ? (label === q.answer ? "right" : "wrong") : "chosen");
      if (reveal && chosen && chosen !== q.answer && label === q.answer) b.classList.add("answer");
      b.setAttribute("aria-pressed", String(chosen === label));
      options.append(b);
    }
    box.append(options);
    if (reveal && chosen) {
      const ok = chosen === q.answer;
      const f = el("p", `learn-feedback ${ok ? "right" : "wrong"}`);
      f.append(el("strong", "", ok ? t().right : t().wrong), ` ${q.explain}`);
      f.setAttribute("role", "status");
      box.append(f);
    }
    return box;
  }

  function stepView(step, onChange) {
    const tx = t();
    const s = tx.steps[step];
    const n = nums();
    const questions = buildQuestions(step, n, getLang());
    const parts = [];
    parts.push(button(`‹ ${tx.back}`, "uni-link learn-back", () => ((view = "path"), onChange?.())));
    const head = el("div", "learn-step-head");
    const ht = el("div", "");
    // the title, and right of it the button to read the step aloud: title, goal, the sentence for the visitor, the text, the facts to remember
    const titleRow = el("div", "learn-title-row");
    titleRow.append(el("h3", "learn-title", s.title));
    const speak = speakButton(step, [s.title, `${tx.goalLabel}: ${s.goal}`, personalLine(step, n, getLang()), ...s.text, tx.rememberLabel, ...s.remember], onChange);
    if (speak) titleRow.append(speak);
    ht.append(el("small", "", tx.stepOf(steps.indexOf(step) + 1, steps.length)), titleRow);
    head.append(pictureOf(step), ht);
    parts.push(head);
    const goal = el("p", "learn-goal");
    goal.append(el("strong", "", `${tx.goalLabel}: `), s.goal);
    parts.push(goal);
    // what it means for the visitor: their own numbers, or an example
    const you = el("div", "learn-you");
    const own = n.you || (step === "scale" && n.star);
    you.append(el("small", "", own ? tx.forYou : tx.example), el("p", "", personalLine(step, n, getLang())));
    if (!own) you.append(el("p", "hint", tx.exampleHint));
    parts.push(you);
    // the text, with the places of the map in it as links: a click flies there, the step stays open
    const seen = new Set();
    for (const text of s.text) {
      const p = el("p", "learn-text");
      for (const piece of placePieces(text, getLang(), seen)) {
        if (!piece.place) {
          p.append(piece.text);
          continue;
        }
        const link = button(piece.text, "learn-place", () => (show?.(piece.place), track("learn-place-click")));
        p.append(link);
      }
      parts.push(p);
    }
    // the facts to remember
    const remember = el("div", "learn-remember");
    const facts = el("ul", "");
    for (const f of s.remember) facts.append(el("li", "", f));
    remember.append(el("small", "", tx.rememberLabel), facts);
    parts.push(remember);
    // the task in the 3D view (a step without one says so)
    if (!TASKS[step]) parts.push(el("p", "hint", s.task));
    const task = el("div", `learn-task${taskDone(step) ? " done" : ""}`);
    const tt = el("div", "");
    tt.append(el("small", "", tx.taskLabel), el("p", "", s.task));
    const buttons = el("div", "learn-task-buttons");
    buttons.append(
      button(taskDone(step) ? `✓ ${tx.taskDone}` : tx.taskGo, taskDone(step) ? "uni-link" : "uni-primary", () => {
        explorer.emit("learnTask", `${PATH}/${step}`);
        maybeFinish(step, questions);
        track(`learn-task-${step}`);
        stopSpeaking();
        closePanel?.();
        act(taskOf(step));
      })
    );
    // the real scale is switched back here too, not only in the menu
    if (TASKS[step] === "realScale" && isRealScale?.())
      buttons.append(
        button(tx.scaleBack, "uni-link", () => {
          closePanel?.();
          act("explanationScale");
        })
      );
    task.append(tt, buttons);
    if (TASKS[step]) parts.push(task);
    // the questions: an answer can be changed until it is right; the explanation comes with every answer
    parts.push(el("h3", "learn-check", tx.check));
    for (const q of questions)
      parts.push(
        questionBlock(q, answers[step]?.[q.id], (label) => {
          if (answers[step]?.[q.id] === q.answer) return; // a right answer stays
          (answers[step] ??= {})[q.id] = label;
          maybeFinish(step, questions);
          onChange?.();
        }, true)
      );
    // done, or what is still missing
    const allRight = questions.every((q) => answers[step]?.[q.id] === q.answer);
    if (stepDone(step)) {
      const done = el("div", "learn-done");
      const next = steps[steps.indexOf(step) + 1];
      done.append(el("strong", "", tx.stepDone(XP_LEARN.step)));
      done.append(
        next
          ? button(tx.nextStep, "uni-primary", () => ((view = next), show?.(VIEWS[next]), onChange?.()))
          : button(tx.toTest, "uni-primary", () => ((view = doneCount() === steps.length ? "test" : "path"), onChange?.()))
      );
      parts.push(done);
    } else if (allRight && TASKS[step] && !taskDone(step)) parts.push(el("p", "hint learn-missing", tx.needTask));
    // where the facts come from
    const sources = el("p", "hint learn-sources");
    sources.append(`${tx.sourcesLabel}: `);
    SOURCES[step].forEach((src, i) => {
      const a = el("a", "", src.label);
      a.href = src.url;
      a.target = "_blank";
      a.rel = "noopener";
      sources.append(...(i ? [" · ", a] : [a]));
    });
    parts.push(sources);
    return parts;
  }

  function testView(onChange) {
    const tx = t();
    const n = nums();
    const questions = testQuestions(PATH, n, getLang(), attempt);
    const parts = [button(`‹ ${tx.back}`, "uni-link learn-back", () => ((view = "path"), onChange?.()))];
    parts.push(el("h3", "learn-title", tx.test.title), el("p", "learn-text", tx.test.intro(questions.length, PATHS[PATH].pass * 100)));
    for (const q of questions)
      parts.push(
        questionBlock(q, testChosen[q.id], (label) => {
          if (testChecked) return;
          testChosen[q.id] = label;
          onChange?.();
        }, testChecked)
      );
    if (!testChecked) {
      const all = questions.every((q) => testChosen[q.id]);
      const go = button(tx.test.evaluate, "uni-primary", () => {
        if (!all) return;
        testChecked = true;
        const right = questions.filter((q) => testChosen[q.id] === q.answer).length;
        const pct = Math.round((right / questions.length) * 100);
        explorer.update((st) => {
          st.total[`learnBest:${PATH}`] = Math.max(st.total[`learnBest:${PATH}`] ?? 0, pct);
        });
        track(`learn-test-${pct >= PATHS[PATH].pass * 100 ? "passed" : "failed"}`);
        if (passed(right, questions.length, PATH)) explorer.emit("learnPath", PATH);
        onChange?.();
      });
      go.disabled = !all;
      const row = el("div", "uni-actions");
      row.append(go);
      if (!all) row.append(el("span", "hint", tx.test.answerAll));
      parts.push(row);
      return parts;
    }
    const right = questions.filter((q) => testChosen[q.id] === q.answer).length;
    const pct = Math.round((right / questions.length) * 100);
    const result = el("div", `learn-done${passed(right, questions.length, PATH) ? "" : " failed"}`);
    result.append(el("strong", "", tx.test.score(right, questions.length, pct)), el("p", "", passed(right, questions.length, PATH) ? tx.test.passed(XP_LEARN.path) : tx.test.failed));
    result.append(
      button(tx.test.retry, passed(right, questions.length, PATH) ? "uni-link" : "uni-primary", () => {
        attempt += 1;
        testChosen = {};
        testChecked = false;
        onChange?.();
      })
    );
    parts.push(result);
    return parts;
  }

  // the nodes of the area: the path (with `overview` true, so that the rest of Learn shows below it), a step, or the test
  function area(onChange) {
    if (speaking && view !== speaking) stopSpeaking(); // another step, the path or the test: the reading stops
    if (view === "test") return { nodes: testView(onChange), overview: false };
    if (steps.includes(view)) return { nodes: stepView(view, onChange), overview: false };
    if (view === "path") return { nodes: pathView(onChange), overview: false };
    return { nodes: listView(onChange), overview: true };
  }
  // every path with its progress, for the certificates (universe.js)
  const paths = () =>
    Object.keys(PATHS).map((path) => ({
      id: path,
      title: t().paths[path].title,
      goal: t().paths[path].goal,
      done: doneOf(path),
      all: PATHS[path].steps.length,
      passed: has("learnPaths", path),
      best: total()[`learnBest:${path}`] ?? 0,
    }));
  // the step for a place, with what its button shows (main.js), or null
  const forPlace = (place) => {
    const list = stepsForPlace(place);
    if (!list.length) return null;
    const step = list.find((s) => !has("learnSteps", `${pathOf(s)}/${s}`)) ?? list[0];
    const path = pathOf(step);
    const tx = t();
    const n = PATHS[path].steps.indexOf(step) + 1;
    return { step, path, label: tx.placeLabel, title: tx.steps[step].title, line: `${tx.paths[path].title} · ${tx.stepOf(n, PATHS[path].steps.length)}` };
  };
  // open a step in the area Learn (from the info of a place): the view stays where it is, the visitor is already there
  const openStep = (step) => {
    const path = pathOf(step);
    if (!path) return false;
    choose(path);
    view = step;
    track(`learn-from-place-${step}`);
    return true;
  };
  // open a path in the area Learn (from the certificates)
  const open = (path) => {
    if (!PATHS[path]) return false;
    choose(path);
    view = "path";
    show?.(PATH_VIEWS[path]);
    return true;
  };
  return { area, paths, open, openStep, forPlace, neighborhoodText: () => t().neighborhood, stop: stopSpeaking, progress: () => ({ done: doneCount(), all: steps.length, passed: pathPassed() }) };
}
