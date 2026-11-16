// Tests of the learning paths (web/learn.js): the visitor's numbers, the questions (one right answer among different options, the personal
// ones with the visitor's own numbers), the final test and its pass mark, and the personal sentence of every step in four languages.
// Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { PATHS, TASKS, QUESTIONS, LEARN_TEXT, SOURCES, personalNumbers, distractors, seededOrder, buildQuestions, testQuestions, passed, personalLine } from "../web/learn.js";

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
      for (const step of PATHS.solar.steps) {
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

test("the final test: 10 questions from the steps, each once, another choice for another attempt, passed from 8 of 10", () => {
  const all = new Set(PATHS.solar.steps.flatMap((s) => buildQuestions(s, you, "en").map((q) => q.id)));
  const t1 = testQuestions("solar", you, "en", 0);
  const t2 = testQuestions("solar", you, "en", 1);
  assert.equal(t1.length, 10);
  assert.equal(new Set(t1.map((q) => q.id)).size, 10, "no question twice");
  assert.ok(t1.every((q) => all.has(q.id)));
  assert.deepEqual(testQuestions("solar", you, "en", 0), t1, "the same attempt keeps its questions");
  assert.notDeepEqual(t2.map((q) => q.id), t1.map((q) => q.id), "a new attempt draws again");
  assert.equal(passed(8, 10, "solar"), true);
  assert.equal(passed(7, 10, "solar"), false);
  assert.equal(passed(0, 0, "solar"), false);
});

test("every step has a task in the 3D view and a sentence for the visitor in every language", () => {
  for (const step of PATHS.solar.steps) {
    assert.ok(TASKS[step], `${step} has a task`);
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

test("every step has 3 to 5 facts to remember in every language, and its sources on NASA's pages", () => {
  for (const step of PATHS.solar.steps) {
    const count = LEARN_TEXT.en.steps[step].remember.length;
    assert.ok(count >= 3 && count <= 5, `${step}: ${count} facts`);
    for (const lang of LANGS) {
      const facts = LEARN_TEXT[lang].steps[step].remember;
      assert.equal(facts.length, count, `${step} ${lang}: as many facts as in English`);
      assert.ok(facts.every((f) => typeof f === "string" && f.trim().length > 10 && !f.includes("—")), `${step} ${lang}`);
    }
    assert.ok(SOURCES[step]?.length >= 1, `${step} has a source`);
    for (const src of SOURCES[step]) assert.match(src.url, /^https:\/\/(science\.nasa\.gov|nssdc\.gsfc\.nasa\.gov)\//, `${step}: ${src.url}`);
  }
});

test("the step on scale asks about asteroids and comets too", () => {
  const ids = buildQuestions("scale", nobody, "de").map((q) => q.id);
  assert.ok(ids.includes("asteroidBelt") && ids.includes("cometTail"));
  const belt = buildQuestions("scale", nobody, "de").find((q) => q.id === "asteroidBelt");
  assert.equal(belt.answer, "Zwischen Mars und Jupiter");
});
