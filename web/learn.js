// Learning paths (the area Learn of My Universe). A path has steps; each step has a goal, a short text, a sentence about what it means for the
// visitor (worked out from their year of birth and their star, or, without them, for a person of 30), a task in the 3D view and a few
// questions with the answer explained. When the task is done and every question is answered right, the step is done (XP); when all steps
// are done, the final test opens: 10 questions from all steps, some with the visitor's own numbers, passed from 70 % (XP and a badge). The
// progress lives in the explorer's log (explorer.js: total.learnTasks, learnSteps, learnPaths and "learnBest:<path>"), so it is merged with
// the account like the rest. Every step has a box of the facts to remember and its sources (SOURCES): the facts were checked against those
// NASA pages in November 2026, so that a step can be checked again when the science changes. The rules are pure functions, tested in
// tests/learn.test.mjs. The paths: Our Solar System, and Alpha Centauri (our nearest stars); more will follow. A step may have no task in the
// 3D view when what it is about is not in the map (Alpha Centauri A and B): then the questions alone finish it.

import { track } from "./stats.js";
import { MOONS } from "./moons.js";
import { XP_LEARN } from "./explorer.js";
import { planetCanvas, starCanvas } from "./sharecard.js";

export const PATHS = {
  solar: { steps: ["sun", "inner", "outer", "moons", "scale"], minutes: 30, testSize: 10, pass: 0.7 },
  alpha: { steps: ["neighbors", "pair", "proxima", "proximaB", "travel"], minutes: 25, testSize: 10, pass: 0.7 },
};
// where each task takes the visitor (main.js does it): a place of the map, or the real scale
// ("figure:<id>" shows a constellation, "plan:<place>" opens the trip planner from the Earth to the place, null: no task)
export const TASKS = {
  sun: "Sun", inner: "Mars", outer: "Saturn", moons: "Jupiter", scale: "realScale",
  neighbors: "figure:Cen", pair: null, proxima: "Proxima Cen", proximaB: "Proxima Cen b", travel: "plan:Proxima Cen b",
};
// What the 3D view shows while a path or a step is open (main.js flies there as soon as it is clicked, My Universe stays open): the place
// of the step. The task above is the visitor's own action; this is only the picture behind the text.
export const VIEWS = {
  sun: "Sun", inner: "Mars", outer: "Saturn", moons: "Jupiter", scale: "Neptune",
  neighbors: "Proxima Cen", pair: "Proxima Cen", proxima: "Proxima Cen", proximaB: "Proxima Cen b", travel: "Proxima Cen",
};
export const PATH_VIEWS = { solar: "Sun", alpha: "Proxima Cen" };
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
};
// The numbers of Alpha Centauri: the distance of Proxima and the year of Proxima b as in the map (NASA Exoplanet Archive, web/data/stars.json;
// NASA and ESO round them to 4.2 light years and 11.2 days), the speed of Voyager 1 from NASA (17.0 km/s, August 2024). The time of the trip
// is worked out from them: about 74,800 years, "about 75,000" in the texts.
export const PROXIMA_LY = 4.24;
export const PROXIMA_B_DAYS = 11.18465;
const VOYAGER_KMS = 17.0;
export const TRAVEL_YEARS = (PROXIMA_LY * 9.4607e12) / VOYAGER_KMS / (365.25 * 86400);
const REFERENCE_AGE = 30; // without a year of birth, the sentences speak of a person of 30
const MOON_DAYS = MOONS.Earth[0].days;

// The visitor's numbers. ctx: { age (years, or null), years: { Mercury, Mars, Jupiter } (their year in Earth years), star: { name, dist, year } or null }.
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
    paths: {
      solar: { title: "Our Solar System", goal: "You can explain how our Solar System is built and tell its main bodies apart." },
      alpha: { title: "Our nearest stars: Alpha Centauri", goal: "You can describe the star system closest to us, its planet Proxima b, and how far away it really is." },
    },
    path: {
      meta: (m) => `about ${m} minutes · for beginners`,
      rule: "5 steps, then a final test with 10 questions; passed from 70 %.",
    },
    allPaths: "All learning paths",
    status: { done: "Done", next: "Next", open: "To do", locked: "All steps first" },
    back: "All steps", stepOf: (n, all) => `Step ${n} of ${all}`, goalLabel: "Learning goal", speak: "Read aloud", speakStop: "Stop", speakTitle: "Read with a voice on your device; nothing is sent.", rememberLabel: "Remember", sourcesLabel: "Sources", forYou: "For you", example: "An example", exampleHint: "With your date of birth (in the overview of My Universe) this becomes your own number.",
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
        task: "There is no task in the 3D view for this step: A and B are not in the map yet. Answer the questions, then the step is done.", // no task in the 3D view: A and B are not in the map
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
    },
  },
  de: {
    paths: {
      solar: { title: "Unser Sonnensystem", goal: "Du kannst erklären, wie unser Sonnensystem aufgebaut ist, und seine wichtigsten Himmelskörper unterscheiden." },
      alpha: { title: "Unsere nächsten Sterne: Alpha Centauri", goal: "Du kannst das Sternsystem beschreiben, das uns am nächsten ist, seinen Planeten Proxima b und wie weit weg es wirklich ist." },
    },
    path: {
      meta: (m) => `etwa ${m} Minuten · für Einsteiger`,
      rule: "5 Schritte, dann ein Abschlusstest mit 10 Fragen; bestanden ab 70 %.",
    },
    allPaths: "Alle Lernpfade",
    status: { done: "Erledigt", next: "Als Nächstes", open: "Offen", locked: "Erst alle Schritte" },
    back: "Alle Schritte", stepOf: (n, all) => `Schritt ${n} von ${all}`, goalLabel: "Lernziel", speak: "Vorlesen", speakStop: "Stopp", speakTitle: "Mit einer Stimme auf deinem Gerät vorlesen; es wird nichts gesendet.", rememberLabel: "Merke", sourcesLabel: "Quellen", forYou: "Für dich", example: "Ein Beispiel", exampleHint: "Mit deinem Geburtsdatum (in der Übersicht von Mein Universum) wird das deine eigene Zahl.",
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
        task: "Zu diesem Schritt gibt es keine Aufgabe in der 3D-Ansicht: A und B sind noch nicht auf der Karte. Beantworte die Fragen, dann ist der Schritt geschafft.", // no task in the 3D view: A and B are not in the map
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
    },
  },
  ja: {
    paths: {
      solar: { title: "私たちの太陽系", goal: "太陽系のしくみを説明し、おもな天体を見分けられるようになります。" },
      alpha: { title: "いちばん近い星たち：ケンタウルス座アルファ星", goal: "私たちにいちばん近い恒星系、その惑星プロキシマb、そしてそれが実際にどれほど遠いかを説明できます。" },
    },
    path: {
      meta: (m) => `約${m}分 · 初心者向け`,
      rule: "5つのステップのあと、10問の最終テスト。70 %以上で合格です。",
    },
    allPaths: "すべての学習パス",
    status: { done: "完了", next: "次はこれ", open: "未完了", locked: "先に全ステップを" },
    back: "すべてのステップ", stepOf: (n, all) => `ステップ ${n} / ${all}`, goalLabel: "学習目標", speak: "読み上げ", speakStop: "停止", speakTitle: "端末内の音声で読み上げます。何も送信されません。", rememberLabel: "覚えておこう", sourcesLabel: "出典", forYou: "あなたへ", example: "例", exampleHint: "生年月日を入れると（マイ・ユニバースの概要で）、これがあなた自身の数字になります。",
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
        task: "このステップには3D表示での課題がありません。AとBはまだ地図にないからです。問題に答えれば、ステップ完了です。", // no task in the 3D view: A and B are not in the map
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
    },
  },
  bg: {
    paths: {
      solar: { title: "Нашата Слънчева система", goal: "Можеш да обясниш как е устроена Слънчевата система и да различаваш основните ѝ тела." },
      alpha: { title: "Най-близките ни звезди: Алфа Кентавър", goal: "Можеш да опишеш най-близката до нас звездна система, нейната планета Проксима b и колко далеч е тя всъщност." },
    },
    path: {
      meta: (m) => `около ${m} минути · за начинаещи`,
      rule: "5 стъпки, после финален тест с 10 въпроса; издържан от 70 %.",
    },
    allPaths: "Всички учебни пътеки",
    status: { done: "Готово", next: "Следва", open: "Предстои", locked: "Първо всички стъпки" },
    back: "Всички стъпки", stepOf: (n, all) => `Стъпка ${n} от ${all}`, goalLabel: "Цел", speak: "Прочети на глас", speakStop: "Спри", speakTitle: "Чете се с глас на устройството ти; нищо не се изпраща.", rememberLabel: "Запомни", sourcesLabel: "Източници", forYou: "За теб", example: "Пример", exampleHint: "С датата ти на раждане (в прегледа на „Моята вселена“) това става твоето собствено число.",
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
        task: "За тази стъпка няма задача в 3D изгледа: A и B още ги няма на картата. Отговори на въпросите и стъпката е готова.", // no task in the 3D view: A and B are not in the map
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
  const ALPHA_PICTURE = { neighbors: 3000, pair: 5790, proxima: 3000, travel: 5772 }; // the temperature of the star drawn
  const pictureOf = (step) =>
    ALPHA_PICTURE[step] ? starCanvas(ALPHA_PICTURE[step], "uni-orb small star", 28)
    : step === "proximaB" ? planetCanvas({ temp: 218 }, "uni-orb small", 28)
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

  // a step counts as done once: its task done and every question answered right
  function maybeFinish(step, questions) {
    if (stepDone(step) || (TASKS[step] && !taskDone(step))) return;
    if (!questions.every((q) => answers[step]?.[q.id] === q.answer)) return;
    explorer.emit("learnStep", `${PATH}/${step}`);
    track(`learn-step-${step}`);
  }

  const pathPicture = (path, cls, size) => (path === "alpha" ? starCanvas(5790, `${cls} star`, size) : planetCanvas({ name: "Saturn" }, cls, size));

  // all the paths: a card each, with its progress
  function listView(onChange) {
    const tx = t();
    const list = el("div", "uni-list");
    for (const path of Object.keys(PATHS)) {
      const all = PATHS[path].steps.length;
      const passedIt = has("learnPaths", path);
      const row = el("button", `uni-item learn-step${passedIt ? " done" : ""}`);
      row.type = "button";
      const text = el("span", "uni-item-text");
      text.append(el("strong", "", tx.paths[path].title), el("small", "", `${tx.path.meta(PATHS[path].minutes)} · ${tx.progress(doneOf(path), all)}`));
      const arrow = el("span", "uni-arrow", passedIt ? "★" : "›");
      arrow.setAttribute("aria-hidden", "true");
      row.append(pathPicture(path, "uni-orb small", 28), text, arrow);
      row.addEventListener("click", () => (choose(path), (view = "path"), show?.(PATH_VIEWS[path]), track(`learn-path-${path}`), onChange?.()));
      list.append(row);
    }
    return [list];
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
    card.append(head, bar, el("p", "hint", tx.path.rule));
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
    for (const p of s.text) parts.push(el("p", "learn-text", p));
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
        act(TASKS[step]);
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
  return { area, stop: stopSpeaking, progress: () => ({ done: doneCount(), all: steps.length, passed: pathPassed() }) };
}
