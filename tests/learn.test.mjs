// Tests of the learning paths (web/learn.js): the visitor's numbers, the questions (one right answer among different options, the personal
// ones with the visitor's own numbers), the final test and its pass mark, and the personal sentence of every step in four languages.
// Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { PATHS, TASKS, VIEWS, PATH_VIEWS, QUESTIONS, LEARN_TEXT, SOURCES, TRAVEL_YEARS, personalNumbers, distractors, seededOrder, buildQuestions, testQuestions, passed, personalLine, stepsForPlace, placePieces, PLACE_WORDS, ZOD_NAMES, GENITIVE, catalogOf, celsius, starClassOf, PROXIMA_INFO, fateOf, PARTS } from "../web/learn.js";

const YEARS = { Mercury: 0.241, Venus: 0.615, Earth: 1, Mars: 1.881, Jupiter: 11.86 }; // as in main.js
const STAR = { name: "HD 3651", dist: 36.3, year: 1991 };
const you = personalNumbers({ age: 36.4, years: YEARS, star: STAR, birthDate: { year: 1990, month: 7, day: 2 } }); // a date for the path of the constellations
const nobody = personalNumbers({ age: null, years: YEARS, star: null });
const LANGS = ["en", "de", "ja", "bg"];

test("the visitor's numbers, from the age: trips round the Sun, the age on Mars and Mercury, Jupiter's and the Moon's laps", () => {
  assert.equal(you.you, true);
  assert.equal(you.orbits, 36); // full trips round the Sun
  assert.equal(you.mars, Math.round(36.4 / 1.881)); // 19, rounded as on the tiles
  assert.equal(you.mercury, Math.round(36.4 / 0.241)); // 151
  assert.equal(you.jupiterLaps, 3);
  assert.equal(you.moonLaps, Math.floor((36.4 * 365.25) / 27.322)); // 486
  assert.deepEqual(you.star, STAR);
});

test("without a year of birth: the numbers of a person of 30, and no star", () => {
  assert.equal(nobody.you, false);
  assert.equal(nobody.orbits, 30);
  assert.equal(nobody.mars, 16);
  assert.equal(nobody.jupiterLaps, 2);
  assert.equal(nobody.star, null);
  // a star without an age does not count: the star belongs to the year of birth
  assert.equal(personalNumbers({ age: null, years: YEARS, star: STAR }).star, null);
});

test("wrong answers next to a right number: two of them, different, never the right one, never below 0", () => {
  for (let n = 0; n <= 2000; n += n < 30 ? 1 : 37) {
    const d = distractors(n);
    assert.equal(d.length, 2, `${n}`);
    assert.ok(!d.includes(n) && d[0] !== d[1] && d.every((x) => x >= 0 && Number.isInteger(x)), `${n}: ${d}`);
  }
});

test("a fixed order for a seed, a different one for another seed, and nothing lost", () => {
  const items = ["a", "b", "c", "d", "e", "f"];
  assert.deepEqual(seededOrder(items, "x"), seededOrder(items, "x"));
  assert.deepEqual([...seededOrder(items, "x")].sort(), items);
  assert.notDeepEqual(seededOrder(items, "x"), seededOrder(items, "y"));
});

test("every question of every step, in every language: one right answer among different options, and an explanation", () => {
  for (const lang of LANGS)
    for (const nums of [you, nobody])
      for (const step of Object.values(PATHS).flatMap((p) => p.steps)) {
        const qs = buildQuestions(step, nums, lang);
        assert.equal(qs.length, QUESTIONS[step].length);
        for (const q of qs) {
          const where = `${lang} ${step} ${q.id} (${nums.you ? "you" : "nobody"})`;
          assert.ok(q.options.includes(q.answer), `${where}: the answer is one of the options`);
          assert.equal(new Set(q.options).size, q.options.length, `${where}: no option twice`);
          assert.ok(q.options.length >= 3, where);
          for (const text of [q.text, q.explain, ...q.options]) assert.ok(typeof text === "string" && text.trim() && !/undefined|NaN|null/.test(text), `${where}: "${text}"`);
        }
        assert.deepEqual(buildQuestions(step, nums, lang), qs, "the same questions in the same order every time they are drawn");
      }
});

test("the personal questions ask with the visitor's own numbers, or with those of a person of 30", () => {
  const byId = (qs) => Object.fromEntries(qs.map((q) => [q.id, q]));
  const mine = byId(buildQuestions("inner", you, "en"));
  assert.equal(mine.marsAge.answer, String(you.mars));
  assert.match(mine.marsAge.text, /you/);
  const other = byId(buildQuestions("inner", nobody, "en"));
  assert.equal(other.marsAge.answer, "16");
  assert.match(other.marsAge.text, /30/);
  // the light of your star; without a star, the one of Proxima Centauri
  const scale = byId(buildQuestions("scale", you, "de"));
  assert.ok(scale.starLight.text.includes("HD 3651") && scale.starLight.answer === "36");
  const plain = byId(buildQuestions("scale", nobody, "de"));
  assert.ok(!plain.starLight && plain.proximaLight.answer === "Etwa 4,2 Jahre");
  assert.equal(byId(buildQuestions("moons", you, "de")).moonLaps.answer, you.moonLaps.toLocaleString("de"));
});

test("the final test: 10 questions from the steps, each once, another choice for another attempt, passed from 7 of 10", () => {
  const all = new Set(PATHS.solar.steps.flatMap((s) => buildQuestions(s, you, "en").map((q) => q.id)));
  const t1 = testQuestions("solar", you, "en", 0);
  const t2 = testQuestions("solar", you, "en", 1);
  assert.equal(t1.length, 10);
  assert.equal(new Set(t1.map((q) => q.id)).size, 10, "no question twice");
  assert.ok(t1.every((q) => all.has(q.id)));
  assert.deepEqual(testQuestions("solar", you, "en", 0), t1, "the same attempt keeps its questions");
  assert.notDeepEqual(t2.map((q) => q.id), t1.map((q) => q.id), "a new attempt draws again");
  assert.equal(passed(7, 10, "solar"), true);
  assert.equal(passed(6, 10, "solar"), false);
  assert.equal(passed(0, 0, "solar"), false);
});

test("every step has a task in the 3D view (or none on purpose) and a sentence for the visitor in every language", () => {
  for (const step of Object.values(PATHS).flatMap((p) => p.steps)) {
    assert.ok(step in TASKS, `${step} has a task, or null`);
    for (const lang of LANGS) {
      const mine = personalLine(step, you, lang);
      const other = personalLine(step, nobody, lang);
      assert.ok(mine && other && mine !== other, `${step} ${lang}: one sentence for you, another without a year of birth`);
      assert.ok(!/undefined|NaN|null/.test(mine + other), `${step} ${lang}`);
      assert.ok(LEARN_TEXT[lang].steps[step].text.length >= 2 && LEARN_TEXT[lang].steps[step].goal, `${step} ${lang}`);
    }
  }
  assert.ok(personalLine("sun", you, "en").includes("36 times"));
  assert.ok(personalLine("inner", you, "de").includes(`Mars wärst du ${you.mars}`));
  assert.ok(personalLine("scale", you, "en").includes("HD 3651") && personalLine("scale", you, "en").includes("1991"));
});

test("every step has 3 to 5 facts to remember in every language, and its sources on NASA's or ESO's pages", () => {
  for (const step of Object.values(PATHS).flatMap((p) => p.steps)) {
    const count = LEARN_TEXT.en.steps[step].remember.length;
    assert.ok(count >= 3 && count <= 5, `${step}: ${count} facts`);
    for (const lang of LANGS) {
      const facts = LEARN_TEXT[lang].steps[step].remember;
      assert.equal(facts.length, count, `${step} ${lang}: as many facts as in English`);
      assert.ok(facts.every((f) => typeof f === "string" && f.trim().length > 10 && !f.includes("—")), `${step} ${lang}`);
    }
    assert.ok(SOURCES[step]?.length >= 1, `${step} has a source`);
    for (const src of SOURCES[step]) assert.match(src.url, /^https:\/\/(science\.nasa\.gov|www\.nasa\.gov|spaceplace\.nasa\.gov|nssdc\.gsfc\.nasa\.gov|www\.eso\.org|www\.usgs\.gov|oceanexplorer\.noaa\.gov|www\.cfa\.harvard\.edu|www\.iau\.org|heasarc\.gsfc\.nasa\.gov|starchild\.gsfc\.nasa\.gov|esahubble.org|esawebb.org|www.esa.int|www\.jpl\.nasa\.gov|www.cosmos.esa.int|imagine.gsfc.nasa.gov)\//, `${step}: ${src.url}`);
  }
});

test("the step on scale asks about asteroids and comets too", () => {
  const ids = buildQuestions("scale", nobody, "de").map((q) => q.id);
  assert.ok(ids.includes("asteroidBelt") && ids.includes("cometTail"));
  const belt = buildQuestions("scale", nobody, "de").find((q) => q.id === "asteroidBelt");
  assert.equal(belt.answer, "Zwischen Mars und Jupiter");
});

test("the step on moons asks about the dwarf planets too", () => {
  const q = buildQuestions("moons", nobody, "de").find((x) => x.id === "dwarf");
  assert.equal(q.answer, "Pluto");
  assert.ok(LEARN_TEXT.de.steps.moons.text.some((p) => p.includes("Zwergplaneten")));
});

test("Alpha Centauri: the visitor's numbers, the trip at the speed of Voyager 1, and a small child", () => {
  assert.ok(TRAVEL_YEARS > 74000 && TRAVEL_YEARS < 75500, `${TRAVEL_YEARS}`); // "about 75,000 years" in the texts
  assert.equal(nobody.proximaLeft, 25); // 30 - 4.24
  assert.equal(nobody.lapShare, 38); // 30 of 80 years
  assert.equal(nobody.lightTrips, 7);
  assert.equal(nobody.proximaBAge, 980); // 30 years of 11.18 days
  assert.equal(nobody.lifetimes, Math.round(TRAVEL_YEARS / 30));
  // a child of 3: the light of Proxima set off before the birth, and the question about it is replaced
  const child = personalNumbers({ age: 3, years: YEARS, star: null });
  assert.equal(child.proximaLeft, null);
  assert.ok(personalLine("neighbors", child, "en").includes("before you were born"));
  const ids = buildQuestions("neighbors", child, "en").map((q) => q.id);
  assert.ok(ids.includes("proximaLight") && !ids.includes("proximaLeft"));
});

test("Alpha Centauri: a final test of 10 different questions, and the pair A and B as a place of the map", () => {
  const t1 = testQuestions("alpha", you, "de", 0);
  assert.equal(t1.length, 10);
  assert.equal(new Set(t1.map((q) => q.id)).size, 10);
  assert.equal(TASKS.pair, "Alpha Centauri A");
  assert.equal(VIEWS.pair, "Alpha Centauri A");
  assert.ok(LEARN_TEXT.de.paths.alpha.title.includes("Alpha Centauri"));
});

test("every path and every step has a place for the 3D view behind it", () => {
  for (const [path, p] of Object.entries(PATHS)) {
    assert.ok(PATH_VIEWS[path], path);
    for (const step of p.steps) assert.ok(VIEWS[step], step);
  }
});

test("Exoplanets: what the catalogue knew in the year of the birth, and the ages on three of its planets", () => {
  const found = [[1992, "Pulsar Timing"], [1995, "Radial Velocity"], [1999, "Transit"], [2009, "Transit"], [2017, "Transit"], [2020, "Radial Velocity"]];
  const mine = personalNumbers({ age: 31.4, years: YEARS, star: null, birthYear: 1995, discoveries: found, thisYear: 2026 });
  assert.deepEqual([mine.knownAtBirth, mine.knownNow, mine.transitSince], [2, 6, 3]);
  const plain = personalNumbers({ age: null, years: YEARS, star: null, birthYear: null, discoveries: found, thisYear: 2026 });
  assert.equal(plain.birthYear, 1996); // 30 years ago
  assert.equal(plain.pegAge, Math.round((30 * 365.25) / 4.2307966));
  // the year is written without a thousands separator
  assert.ok(personalLine("exoWhat", mine, "en").includes("In 1995,"));
  assert.ok(personalLine("exoWhat", plain, "de").includes("1996, als"));
  const t = testQuestions("exo", mine, "en", 0);
  assert.equal(new Set(t.map((q) => q.id)).size, 10);
});

test("The search for habitable worlds: the candidates of the map then and now, and the ages", () => {
  const found = [[2016, "Radial Velocity", true], [2017, "Transit", true], [1995, "Radial Velocity", false], [2020, "Transit", true]];
  const mine = personalNumbers({ age: 31.4, years: YEARS, star: null, birthYear: 1995, discoveries: found, thisYear: 2026 });
  assert.deepEqual([mine.candidatesAtBirth, mine.candidatesNow], [0, 3]);
  assert.equal(mine.toiAge, Math.round((31.4 * 365.25) / 37.423457));
  assert.equal(mine.venusAge, Math.round(31.4 / 0.615));
  assert.ok(personalLine("habLife", mine, "de").includes("1995, im Jahr deiner Geburt, kannte diese Karte 0 Kandidaten"));
  assert.equal(new Set(testQuestions("hab", mine, "en", 0).map((q) => q.id)).size, 10);
});

test("from a place to its step: the Solar System by name, the places of the steps, Proxima by its star, the other exoplanets by their kind", () => {
  const solar = (name) => stepsForPlace({ name, solar: true });
  const exo = (o) => stepsForPlace({ solar: false, host: "Some star", ...o });
  assert.deepEqual(solar("Sun"), ["sun"]);
  assert.deepEqual(solar("Mars"), ["inner", "habIngredients"]);
  assert.deepEqual(solar("Jupiter"), ["outer", "moons", "habWater"]);
  assert.deepEqual(solar("Pluto"), ["moons"]);
  assert.deepEqual(stepsForPlace({ name: "Europa", solar: true, moon: true }), ["moons"]);
  assert.deepEqual(solar("Voyager 1"), []); // a visitor of the Solar System has no step
  assert.deepEqual(exo({ name: "Proxima Cen b", host: "Proxima Cen", habitable: true, radius: 1.1 }), ["proximaB", "habLife"]);
  assert.deepEqual(exo({ name: "Proxima Cen d", host: "Proxima Cen", radius: 0.8 }), ["proxima", "neighbors"]);
  assert.deepEqual(exo({ name: "55 Cnc e", radius: 1.9 }), ["exoStrange"]);
  assert.deepEqual(exo({ name: "Kepler-442 b", habitable: true, radius: 1.3 }), ["habZone"]);
  assert.deepEqual(exo({ name: "Kepler-10 b", radius: 1.5 }), ["exoRocky"]);
  assert.deepEqual(exo({ name: "GJ 436 b", radius: 4.2 }), ["exoGiants"]);
  assert.deepEqual(exo({ name: "Unknown b", radius: null }), ["exoWhat"]);
  // every place of a step leads to at least one step, and every step named exists
  for (const step of Object.keys(VIEWS)) {
    const place = TASKS[step] && !String(TASKS[step]).includes(":") && TASKS[step] !== "realScale" ? TASKS[step] : VIEWS[step];
    const isSolar = ["Sun", "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Ceres", "Pluto"].includes(place);
    const host = place.startsWith("Proxima Cen") ? "Proxima Cen" : "x";
    const steps = stepsForPlace({ name: place, host, solar: isSolar });
    assert.ok(steps.length > 0, place);
    for (const s of steps) assert.ok(Object.values(PATHS).some((p) => p.steps.includes(s)), s);
  }
  for (const lang of LANGS) assert.ok(LEARN_TEXT[lang].placeLabel, lang);
});

test("the Centaur of path 2 is drawn through Alpha Centauri A, the bright star of the pair, with its name (not B, 15 arcseconds beside it)", async () => {
  const { readFileSync } = await import("node:fs");
  const data = JSON.parse(readFileSync(new URL("../web/data/constellations.json", import.meta.url), "utf-8"));
  const names = JSON.parse(readFileSync(new URL("../web/data/star-names.json", import.meta.url), "utf-8"));
  const cen = data.constellations.find((c) => c.id === "Cen");
  const ids = cen.lines.flat();
  assert.ok(ids.includes("71683"), "Alpha Centauri A is in the figure");
  assert.ok(!ids.includes("71681"), "B is not");
  const [, , dist, mag] = data.stars["71683"];
  assert.ok(mag < 0.5, `bright: ${mag}`);
  assert.ok(dist > 4.2 && dist < 4.5, `about 4.3 light years: ${dist}`);
  assert.equal(names["71683"], "Alpha Centauri A");
});

test("the places in the texts of the steps: whole words, the first mention a link, our Sun only when it is meant, and every place on the map", async () => {
  const { readFileSync } = await import("node:fs");
  const { MOONS } = await import("../web/moons.js");
  const links = (text, lang) => placePieces(text, lang).filter((p) => p.place).map((p) => `${p.text}=${p.place}`);
  assert.deepEqual(links("Merkur, Venus, Erde und Mars; dann wieder Mars.", "de"), ["Merkur=Mercury", "Venus=Venus", "Erde=Earth", "Mars=Mars"]);
  assert.deepEqual(links("Das Sonnensystem hat 109 Erden, erdgroße Welten und Earth-sized ones.", "de"), []);
  assert.deepEqual(links("manche wandern ohne Sonne durch die Galaxie, nicht wie die Sonne", "de"), ["Sonne=Sun"]);
  assert.deepEqual(links("Proxima Centauri b, Proxima b and Proxima", "en"), ["Proxima Centauri b=Proxima Cen b", "Proxima=Proxima Cen"]);
  assert.deepEqual(links("太陽系の外、太陽をもたず。太陽のような恒星", "ja"), ["太陽=Sun"]);
  assert.deepEqual(links("Слънцето и Земята", "bg"), ["Слънцето=Sun", "Земята=Earth"]);
  // the pieces put back together are the text
  const text = "TRAPPIST-1 e läuft in 6,1 Tagen um TRAPPIST-1.";
  assert.equal(placePieces(text, "de").map((p) => p.text).join(""), text);
  // every place is one the map has: a body of the Solar System, a moon, a star or a planet of the NASA table, or Alpha Centauri A and B
  const data = JSON.parse(readFileSync(new URL("../web/data/stars.json", import.meta.url), "utf-8"));
  const known = new Set(["Sun", "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Ceres", "Pluto", "Alpha Centauri A", "Alpha Centauri B"]);
  for (const s of data.stars) (known.add(s.hostname), s.planets.forEach((p) => known.add(p.pl_name)));
  for (const list of Object.values(MOONS)) for (const m of list) known.add(`moon:${m.id}`);
  for (const lang of LANGS) for (const [, place] of PLACE_WORDS[lang]) assert.ok(known.has(place), `${lang}: ${place}`);
});

test("the neighbourhood of path 2: its view and the three labels of its lines in four languages", () => {
  assert.equal(VIEWS.neighbors, "view:neighborhood");
  assert.equal(PATH_VIEWS.alpha, "view:neighborhood");
  for (const lang of LANGS) {
    const n = LEARN_TEXT[lang].neighborhood;
    assert.ok(n.sunProxima.includes("4") && n.sunProxima.includes("24"), lang);
    assert.ok(n.sunAlpha.includes("37"), lang);
    assert.ok(n.system.includes("0") && n.system.includes("2"), lang);
  }
});

test("paths 3 and 4 have the seven steps of the plan, the rule counts them, and the new steps speak of the visitor", () => {
  assert.deepEqual(PATHS.exo.steps.slice(5), ["exoSystems", "exoFamous"]);
  assert.deepEqual(PATHS.hab.steps.slice(4, 6), ["habIngredients", "habExtreme"]);
  assert.equal(LEARN_TEXT.de.path.rule(7), "7 Schritte, dann ein Abschlusstest mit 10 Fragen; bestanden ab 70 %.");
  assert.equal(you.trappistBLaps, Math.floor((36.4 * 365.25) / 1.510826));
  assert.equal(you.kepler16Age, Math.round((36.4 * 365.25) / 228.776));
  assert.equal(you.rockFactor, Math.round(3e9 / 36.4 / 1e6) * 1e6);
  assert.ok(personalLine("exoFamous", you, "de").includes("Kepler-16 b"));
  assert.equal(TASKS.habExtreme, "moon:Europa");
  for (const lang of LANGS) for (const step of ["exoSystems", "exoFamous", "habIngredients", "habExtreme"]) assert.ok(!personalLine(step, you, lang).includes("undefined"), `${lang} ${step}`);
});

test("constellations and zodiac signs: the sign and the constellation of the Sun from the date of birth, and an example without one", () => {
  const born = (month, day) => personalNumbers({ age: 30, years: YEARS, star: null, birthDate: { year: 1995, month, day } });
  // 2 July 1995: sign Cancer (from about 21 June), the Sun in Gemini (until 20 July by the IAU boundaries)
  assert.deepEqual([born(7, 2).zodSign, born(7, 2).zodReal], ["Cnc", "Gem"]);
  // 5 December: the Sun in Ophiuchus, which astrology does not have (sign Sagittarius)
  assert.deepEqual([born(12, 5).zodSign, born(12, 5).zodReal], ["Sgr", "Oph"]);
  assert.ok(personalLine("zodShift", born(12, 5), "de").includes("Schlangenträger"));
  // without a date: the example of the 1st of April (sign Aries, the Sun in Pisces), said as an example
  const none = personalNumbers({ age: null, years: YEARS, star: null });
  assert.deepEqual([none.zodYou, none.zodSign, none.zodReal], [false, "Ari", "Psc"]);
  assert.ok(personalLine("zodShift", none, "de").startsWith("Wer am 1. April geboren ist"));
  // the distances of the figure come from the map; a floor of 10,000 light years and more is not shown
  const far = personalNumbers({ age: 30, years: YEARS, star: null, birthDate: { year: 1995, month: 12, day: 25 }, figureInfo: () => ({ near: 78, far: 10872 }) });
  assert.equal(far.zodFar, null);
  assert.ok(!personalLine("zodWhat", far, "de").includes("10"));
  // the light of the nearest star: before the birth, or at an age
  const near = personalNumbers({ age: 30, years: YEARS, star: null, birthDate: { year: 1995, month: 5, day: 20 }, figureInfo: () => ({ near: 46, far: 484 }) });
  assert.ok(personalLine("zodLight", near, "de").includes("16 Jahre vor deiner Geburt"));
  for (const id of Object.keys(ZOD_NAMES)) assert.equal(ZOD_NAMES[id].length, 4, id);
  assert.equal(PATHS.zod.steps.length, 5);
  const t = testQuestions("zod", you, "ja", 0);
  assert.equal(new Set(t.map((q) => q.id)).size, 10);
});

test("names in space: the visitor's star and its planets, the catalogue of its name, the genitive of the constellation, and 51 Pegasi b", () => {
  const ctx = { age: 31.4, years: YEARS, star: { name: "GJ 667 C", dist: 23.6, year: 1995 }, birthYear: 1995, birthDate: { year: 1995, month: 6, day: 14 } };
  const n = personalNumbers({ ...ctx, planetsOf: (h) => (h === "GJ 667 C" ? ["GJ 667 C c", "GJ 667 C b"] : []) });
  assert.ok(personalLine("nameLetters", n, "de").includes("2 Planeten: GJ 667 C b, GJ 667 C c"));
  assert.ok(personalLine("nameCatalog", n, "de").includes("Gliese und Jahreiß"));
  // 14 June: the Sun in Taurus, Alpha Tauri
  assert.equal(GENITIVE[n.zodReal], "Tauri");
  assert.ok(personalLine("nameGreek", n, "en").includes("Alpha Tauri"));
  // 51 Pegasi b: found in the year of the birth, before it, or at an age (never "-0")
  const born = (y) => personalLine("nameStories", personalNumbers({ ...ctx, age: 2026 - y, birthYear: y }), "de");
  assert.ok(born(1995).includes("im Jahr deiner Geburt"));
  assert.ok(born(1990).includes("als du 5 Jahre alt warst"));
  assert.ok(born(2000).includes("5 Jahre vor deiner Geburt"));
  // without a year of birth: Proxima and the example HD 209458
  assert.ok(personalLine("nameLetters", nobody, "de").includes("Proxima Cen d"));
  assert.ok(personalLine("nameCatalog", nobody, "en").includes("Henry Draper"));
  assert.deepEqual(["HD 3651", "Gl 581", "HIP 65426", "TOI-700", "Kepler-22", "TRAPPIST-1", "Proxima Cen"].map(catalogOf), ["HD", "GJ", "HIP", "TOI", "Kepler", "TRAPPIST", null]);
  for (const id of Object.keys(ZOD_NAMES)) assert.ok(GENITIVE[id], id);
  for (const lang of LANGS) for (const step of PATHS.names.steps) for (const nums of [you, nobody, n]) {
    const line = personalLine(step, nums, lang);
    assert.ok(line && !line.includes("undefined") && !line.includes("null") && !line.includes("-0"), `${lang} ${step}: ${line}`);
  }
  assert.equal(TASKS.nameGreek, "figure:Cen");
  const t = testQuestions("names", you, "bg", 0);
  assert.equal(new Set(t.map((q) => q.id)).size, 10);
});

test("understanding stars: the temperature, size and class of the visitor's star from the table, and Proxima without a year of birth", () => {
  assert.equal(celsius(2566), 2300);
  assert.equal(celsius(5761), 5500);
  assert.deepEqual(["K5", "M5.5 V", "G0 V", "", null, "DA"].map(starClassOf), ["K", "M", "G", null, null, null]);
  const info = { "GJ 680": { teff: 3563, rad: 0.45933, spec: "K5" }, "HD 18438": { teff: 3860, rad: 88.475, spec: null } };
  const of = (name) => personalNumbers({ age: 31.4, years: YEARS, star: { name, dist: 31.6, year: 1995 }, starInfo: (h) => info[h] ?? null });
  assert.ok(personalLine("starColor", of("GJ 680"), "de").includes("etwa 3.300 °C heiß, kühler als die Sonne"));
  assert.ok(personalLine("starClass", of("GJ 680"), "de").includes("Typ K5") && personalLine("starClass", of("GJ 680"), "de").includes("orange"));
  assert.ok(personalLine("starSize", of("GJ 680"), "de").includes("etwa 46 % des Sonnenradius"));
  assert.ok(personalLine("starSize", of("HD 18438"), "de").includes("88,5-mal so groß"));
  assert.ok(personalLine("starHosts", of("GJ 680"), "de").includes("Orange Zwerge"));
  assert.ok(personalLine("starClass", of("HD 18438"), "de").includes("keinen Typ"));
  // without a year of birth: Proxima Centauri, with its values from the table
  assert.ok(personalLine("starSize", nobody, "en").includes("Proxima Centauri has about 14 %"));
  assert.ok(personalLine("starClass", nobody, "de").includes(PROXIMA_INFO.spec));
  for (const lang of LANGS) for (const step of PATHS.stars.steps) for (const nums of [you, nobody, of("GJ 680"), of("HD 18438"), of("Nowhere")]) {
    const line = personalLine(step, nums, lang);
    assert.ok(line && !/undefined|null|NaN/.test(line), `${lang} ${step}: ${line}`);
  }
  const t = testQuestions("stars", you, "ja", 0);
  assert.equal(new Set(t.map((q) => q.id)).size, 10);
});

test("the birth of stars: the light of the Orion Nebula and the Pleiades, AU Mic, PDS 70 and the Sun's age as one day", () => {
  const at = (y) => personalNumbers({ age: 2026 - y, years: YEARS, star: null, birthYear: y, thisYear: 2026 });
  const n = at(1995);
  assert.ok(personalLine("birthCloud", n, "de").includes("rund 1.469 Jahre vor deiner Geburt"));
  assert.ok(personalLine("birthProto", n, "de").includes("etwa 810.000-mal so alt wie du"));
  assert.ok(personalLine("birthDisk", n, "de").includes("23 Jahre alt"));
  assert.ok(personalLine("birthDisk", at(2018), "de").includes("im Jahr deiner Geburt"));
  assert.ok(personalLine("birthDisk", at(2020), "de").includes("2 Jahre vor deiner Geburt"));
  assert.ok(personalLine("birthCluster", n, "de").includes("um das Jahr 1581 los, etwa 414 Jahre vor deiner Geburt"));
  assert.ok(personalLine("birthSun", n, "de").includes("etwa 0,58 Tausendstelsekunden"));
  for (const lang of LANGS) for (const step of PATHS.birth.steps) for (const nums of [you, nobody, n, at(2018)]) {
    const line = personalLine(step, nums, lang);
    assert.ok(line && !/undefined|null|NaN|-0/.test(line), `${lang} ${step}: ${line}`);
  }
  const t = testQuestions("birth", you, "en", 0);
  assert.equal(new Set(t.map((q) => q.id)).size, 10);
});

test("life and death of stars: the visitor's life against the Sun's, and the fate of the visitor's star by its mass", () => {
  assert.deepEqual([0.46, 1, 7, 7.5, 8.2, null].map(fateOf), ["white", "white", "white", "edge", "nova", null]);
  const info = { "GJ 680": { mass: 0.456 }, Big: { mass: 9.1 }, Edge: { mass: 7.4 }, Sunny: { mass: 1.07 } };
  const of = (name) => personalNumbers({ age: 31, years: YEARS, star: { name, dist: 31, year: 1995 }, starInfo: (h) => info[h] ?? null });
  assert.ok(personalLine("lifeMain", of("GJ 680"), "de").includes("etwa 0,10 Sekunden"));
  assert.ok(personalLine("lifeGiant", of("GJ 680"), "de").includes("etwa 160.000.000-mal"));
  assert.ok(personalLine("lifeMass", of("GJ 680"), "de").includes("0,46-Fache der Sonnenmasse, weniger"));
  assert.ok(personalLine("lifeMass", of("Sunny"), "de").includes("mehr:"));
  assert.ok(personalLine("lifeWhite", of("GJ 680"), "de").includes("als Weißer Zwerg enden"));
  assert.ok(personalLine("lifeWhite", of("Edge"), "de").includes("an der Grenze"));
  assert.ok(personalLine("lifeNova", of("Big"), "de").includes("wird selbst einmal explodieren"));
  assert.ok(personalLine("lifeNova", nobody, "en").includes("Proxima Centauri (0.12 masses of the Sun) is too light"));
  for (const lang of LANGS) for (const step of PATHS.life.steps) for (const nums of [you, nobody, of("GJ 680"), of("Big"), of("Edge"), of("Nowhere")]) {
    const line = personalLine(step, nums, lang);
    assert.ok(line && !/undefined|null|NaN/.test(line), `${lang} ${step}: ${line}`);
  }
  const t = testQuestions("life", you, "de", 0);
  assert.equal(new Set(t.map((q) => q.id)).size, 10);
});

test("neutron stars and black holes: the visitor's star against a neutron star, a pulsar's blinks, Sagittarius A* and the first image", () => {
  const at = (y) => personalNumbers({ age: 2026 - y, years: YEARS, star: { name: "GJ 680", dist: 31, year: y }, birthYear: y, thisYear: 2026, starInfo: () => ({ mass: 0.456 }) });
  const n = at(1995);
  assert.ok(personalLine("nsWhat", n, "de").includes("0,46-Fache der Sonnenmasse"));
  assert.ok(personalLine("nsPulsar", n, "de").includes("etwa 980.000.000-mal"));
  assert.ok(personalLine("bhWhat", n, "de").includes("31 Lichtjahre"));
  assert.ok(personalLine("bhCenter", n, "de").includes("rund 26.969 Jahre vor deiner Geburt"));
  assert.ok(personalLine("bhImage", n, "de").includes("als du 24 Jahre alt warst"));
  assert.ok(personalLine("bhImage", at(2019), "de").includes("im Jahr deiner Geburt"));
  assert.ok(personalLine("bhImage", at(2021), "de").includes("2 Jahre vor deiner Geburt"));
  for (const lang of LANGS) for (const step of PATHS.compact.steps) for (const nums of [you, nobody, n, at(2019)]) {
    const line = personalLine(step, nums, lang);
    assert.ok(line && !/undefined|null|NaN|-0/.test(line), `${lang} ${step}: ${line}`);
  }
  const t = testQuestions("compact", you, "bg", 0);
  assert.equal(new Set(t.map((q) => q.id)).size, 10);
});

test("every learning path belongs to exactly one part of the plan, and every part has a title in every language", () => {
  const all = PARTS.flatMap((p) => p.paths);
  for (const path of Object.keys(PATHS)) assert.equal(all.filter((p) => p === path).length, 1, path);
  for (const lang of LANGS) for (const part of PARTS) assert.ok(LEARN_TEXT[lang].parts[part.id]?.length > 3, `${lang} ${part.id}`);
});

test("part III: nebulae, the Milky Way and the neighbourhood, each step with the visitor's life", () => {
  const at = (y) => personalNumbers({ age: 2026 - y + 0.4, years: YEARS, star: null, birthYear: y, thisYear: 2026 });
  const n = at(1995);
  assert.ok(personalLine("nebCrab", n, "de").includes("941 Jahre vor deiner Geburt"));
  assert.ok(personalLine("nebDark", n, "de").includes("um das Jahr 726"));
  assert.ok(personalLine("nebPillars", at(2022), "de").includes("im Jahr deiner Geburt"));
  assert.ok(personalLine("mwOrbit", n, "de").includes("rund 200 Milliarden km"));
  assert.ok(personalLine("locApproach", n, "de").includes("rund 110 Milliarden km"));
  assert.ok(personalLine("locAndromeda", n, "de").includes("80.000-mal"));
  for (const lang of LANGS) for (const path of ["nebula", "milky", "local"]) for (const step of PATHS[path].steps) for (const nums of [you, nobody, n, at(2022), at(2024)]) {
    const line = personalLine(step, nums, lang);
    assert.ok(line && !/undefined|null|NaN|-0/.test(line), `${lang} ${step}: ${line}`);
  }
  for (const path of ["nebula", "milky", "local"]) assert.equal(new Set(testQuestions(path, you, "de", 0).map((q) => q.id)).size, 10, path);
});
