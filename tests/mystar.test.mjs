// Tests of "Your star" (web/mystar.js): the age, the choice of the star, and the numbers that follow from the age. Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { ageFrom, validYear, pickHost, pickNamed, leftIn, ageOn, kmRoundSun } from "../web/mystar.js";

const now = new Date(Date.UTC(2026, 10, 16)); // 16 November 2026

test("the age is counted from the middle of the year of birth", () => {
  assert.ok(Math.abs(ageFrom(1992, now) - 34.38) < 0.02);
  assert.ok(Math.abs(ageFrom(2026, now) - 0.38) < 0.02);
});

test("a year of birth must be a whole year between 1900 and now", () => {
  assert.ok(validYear(1992, now));
  assert.ok(!validYear(1899, now));
  assert.ok(!validYear(2027, now));
  assert.ok(!validYear(1992.5, now));
  assert.ok(!validYear(NaN, now));
});

test("the host star closest to the age, more planets wins a tie, bad entries are skipped", () => {
  const hosts = [{ name: "A", dist: 30, planets: 1 }, { name: "B", dist: 34, planets: 1 }, { name: "C", dist: 35, planets: 3 }, { name: "D", dist: NaN }, { name: "E", dist: -2 }];
  assert.equal(pickHost(hosts, 34.4).name, "B");
  assert.equal(pickHost(hosts, 34.5).name, "C"); // as close as B, but with more planets
  assert.equal(pickHost([], 30), null);
});

test("a named star only when one is close enough, the brighter one wins a tie", () => {
  const named = [{ name: "Pollux", dist: 33.8, mag: 1.29 }, { name: "Faint", dist: 33.8, mag: 4 }, { name: "Vega", dist: 25, mag: 0.09 }];
  assert.equal(pickNamed(named, 34.4).name, "Pollux");
  assert.equal(pickNamed(named, 29.5), null);
  assert.equal(pickNamed(named, 27, 5).name, "Vega"); // a wider range
});

test("the year the light set off, the age on a planet and the way round the Sun", () => {
  assert.equal(leftIn(33.8, now), 1993);
  assert.ok(Math.abs(ageOn(34, 1.881) - 18.08) < 0.01);
  assert.ok(Math.abs(kmRoundSun(1) - 939.95e6) < 0.1e6); // one trip round the Sun is about 940 million km
});
