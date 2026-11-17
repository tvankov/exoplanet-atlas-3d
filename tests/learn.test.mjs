// Tests of the learning paths (web/learn.js): the visitor's numbers, the questions (one right answer among different options, the personal
// ones with the visitor's own numbers), the final test and its pass mark, and the personal sentence of every step in four languages.
// Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { PATHS, TASKS, VIEWS, PATH_VIEWS, QUESTIONS, LEARN_TEXT, SOURCES, TRAVEL_YEARS, personalNumbers, distractors, seededOrder, buildQuestions, testQuestions, passed, personalLine, stepsForPlace } from "../web/learn.js";

const YEARS = { Mercury: 0.241, Venus: 0.615, Earth: 1, Mars: 1.881, Jupiter: 11.86 }; // as in main.js
const STAR = { name: "HD 3651", dist: 36.3, year: 1991 };
const you = personalNumbers({ age: 36.4, years: YEARS, star: STAR });
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
    for (const src of SOURCES[step]) assert.match(src.url, /^https:\/\/(science\.nasa\.gov|nssdc\.gsfc\.nasa\.gov|www\.eso\.org|www\.usgs\.gov)\//, `${step}: ${src.url}`);
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

test("Alpha Centauri: a final test of 10 different questions, and a step that needs no task", () => {
  const t1 = testQuestions("alpha", you, "de", 0);
  assert.equal(t1.length, 10);
  assert.equal(new Set(t1.map((q) => q.id)).size, 10);
  assert.equal(TASKS.pair, null);
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
  assert.deepEqual(solar("Mars"), ["inner"]);
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
