// Tests of what the pictures are drawn from (web/sharecard.js, web/dockart.js, web/birthsky.js): the colours of the stars, the wrapping of the
// text, the looks of the planets and the files they need, and that every constellation of the data can be drawn, also the one the dock shows on
// any day of the year. Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { starColor, wrap, exoLook, PLANET_LOOK } from "../web/sharecard.js";
import { projectFigure, sunConstellation } from "../web/birthsky.js";

const web = (path) => new URL(`../web/${path}`, import.meta.url);
const rgb = (kelvin) => starColor(kelvin).split(",").map(Number);

test("the colour of a star: a cool star is red, the Sun near white, a hot star blue", () => {
  for (const k of [1000, 2500, 3000, 4000, 5772, 7000, 10000, 20000, 40000, 100000, -5, undefined]) {
    const c = rgb(k);
    assert.equal(c.length, 3, `${k} K gives r,g,b`);
    assert.ok(c.every((x) => Number.isInteger(x) && x >= 0 && x <= 255), `${k} K: whole numbers from 0 to 255 (${c})`);
  }
  const [r3, , b3] = rgb(3000);
  assert.ok(r3 > b3 + 80, "3000 K (a red dwarf like Proxima Centauri) is clearly red");
  const sun = rgb(5772);
  assert.ok(Math.min(...sun) > 200, `the Sun is near white (${sun})`);
  const [r20, , b20] = rgb(20000);
  assert.ok(b20 > r20, "20000 K is blue");
  // hotter is never redder: the blue part grows and the red part falls with the temperature
  let last = rgb(1000);
  for (let k = 1500; k <= 40000; k += 500) {
    const c = rgb(k);
    assert.ok(c[2] >= last[2], `blue does not fall from ${k - 500} to ${k} K`);
    assert.ok(c[0] <= last[0], `red does not rise from ${k - 500} to ${k} K`);
    last = c;
  }
  assert.equal(starColor(), starColor(5772), "no temperature: the colour of the Sun");
});

// a canvas stand-in: every character is 10 pixels wide
const fake = { measureText: (s) => ({ width: [...s].length * 10 }) };

test("wrapping: every line fits, no word is lost, and the order stays", () => {
  const text = "The light of HD 3651 that arrives today set off around 1991, about the year I was born.";
  for (const width of [80, 150, 300, 880]) {
    const lines = wrap(fake, text, width);
    for (const line of lines) assert.ok(line.length * 10 <= width || !line.includes(" "), `"${line}" fits into ${width}`);
    assert.equal(lines.join(" "), text, `nothing lost at ${width}`);
  }
  assert.deepEqual(wrap(fake, "Supercalifragilistic short", 50), ["Supercalifragilistic", "short"], "a word longer than the line stays whole on its own line");
  assert.deepEqual(wrap(fake, "", 100), []);
});

test("wrapping Japanese: a line can break between any two characters, and nothing is lost", () => {
  const text = "今日届くHD 3651の光は、私が生まれた1991年ごろに出発しました。";
  const ja = "今日届く光は私が生まれた頃に出発しました。"; // no spaces at all
  const lines = wrap(fake, ja, 60);
  assert.ok(lines.length > 1);
  assert.ok(lines.every((l) => [...l].length <= 6));
  assert.equal(lines.join(""), ja);
  assert.equal(wrap(fake, text, 2000).length, 1, "with room, one line");
});

test("an exoplanet: a colour by its temperature, cold blue to hot red, and always a valid colour", () => {
  const colour = (k) => exoLook(k).paint(0, 0);
  for (const k of [null, undefined, 40, 199, 200, 329, 330, 599, 600, 1199, 1200, 3000]) {
    const c = colour(k);
    assert.equal(c.length, 3);
    assert.ok(c.every((x) => x >= 0 && x <= 255), `${k} K: ${c}`);
  }
  const [r, , b] = colour(250);
  assert.ok(b > r, "a temperate world (250 K) is blue");
  const [r2, , b2] = colour(1500);
  assert.ok(r2 > b2, "a hot world (1500 K) is red");
  for (let lat = -1.5; lat <= 1.5; lat += 0.1) assert.ok(exoLook(300).paint(lat, 0).every((x) => x >= 0 && x <= 255), "bands stay in range");
});

test("the planets: all eight and the Moon have a look, and every map they need is in the project", () => {
  for (const name of ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Moon"]) {
    const look = PLANET_LOOK[name];
    assert.ok(look, `${name} has a look`);
    assert.ok(look.map || look.paint, `${name}: a map or painted`);
    for (const file of [look.map, look.clouds].filter(Boolean)) assert.ok(existsSync(web(file)), `${name}: ${file} exists`);
    if (look.paint)
      for (let lat = -1.5; lat <= 1.5; lat += 0.25) {
        const c = look.paint(lat, 0.7);
        assert.ok(c.length === 3 && c.every((x) => x >= 0 && x <= 255), `${name} painted at ${lat}: ${c}`);
      }
  }
  assert.ok(existsSync(web("textures/milkyway.jpg")), "the Milky Way behind the share pictures");
  assert.ok(PLANET_LOOK.Saturn.ring && PLANET_LOOK.Earth.clouds, "Saturn has rings, the Earth clouds");
});

const { stars, constellations } = JSON.parse(readFileSync(web("data/constellations.json"), "utf8"));
// as main.js builds them for the pictures (figureLines)
const linesOf = (c) => c.lines.map((line) => line.map((h) => stars[h]).filter(Boolean).map((s) => [s[0], s[1], s[3]]));

test("every constellation of the data can be drawn: inside its box, with real numbers", () => {
  assert.ok(constellations.length >= 80, "the 88 constellations (or nearly)");
  for (const c of constellations) {
    const drawn = projectFigure(linesOf(c), 120, 80, 8);
    if (!drawn) continue; // a figure without a single star with a position
    for (const [x, y] of drawn.stars) assert.ok(Number.isFinite(x) && Number.isFinite(y) && x >= 7.9 && x <= 112.1 && y >= 7.9 && y <= 72.1, `${c.id}: ${x}, ${y}`);
    for (const s of drawn.segments) assert.ok(s.every(Number.isFinite), `${c.id}: a line with real numbers`);
  }
});

test("a figure across 0 hours of right ascension (Pisces, Pegasus) is drawn whole, not torn across the box", () => {
  // two stars at 359 and 1 degrees: next to each other in the sky
  const drawn = projectFigure([[[359, 10, 2], [1, 10, 2]]], 120, 80, 8);
  const [[x1], [x2]] = drawn.stars;
  assert.ok(x2 < x1, "the star at 1 degree (further east) is to the left");
  assert.ok(Math.abs(x1 - x2) > 50, "and the two fill the box, as two close stars should");
  for (const id of ["Psc", "Peg", "And", "Cet"]) {
    const c = constellations.find((x) => x.id === id);
    const d = projectFigure(linesOf(c), 120, 80, 8);
    const xs = d.stars.map(([x]) => x);
    assert.ok(Math.max(...xs) - Math.min(...xs) <= 104.1, `${id} stays in its box`);
  }
});

test("the dock's constellation of the day: on every day of the year a zodiac figure (or Ophiuchus) that can be drawn", () => {
  const ids = new Set(constellations.map((c) => c.id));
  for (let day = 0; day < 366; day++) {
    const d = new Date(Date.UTC(2024, 0, 1 + day)); // 2024 has a 29 February
    const id = sunConstellation(d.getUTCMonth() + 1, d.getUTCDate());
    assert.ok(ids.has(id), `${d.toISOString().slice(0, 10)}: ${id} is in the data`);
    const drawn = projectFigure(linesOf(constellations.find((c) => c.id === id)), 200, 120, 14);
    assert.ok(drawn && drawn.stars.length >= 3, `${id} has a figure to draw`);
  }
});

test("a figure of stars in one line, and a single star, are drawn in the middle and not squeezed to a point", () => {
  const flatLine = projectFigure([[[100, 20, 2], [104, 20, 2], [108, 20, 2]]], 120, 80, 8);
  const xs = flatLine.stars.map(([x]) => x);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 100, "a line of stars across the box");
  assert.ok(flatLine.stars.every(([, y]) => Math.abs(y - 40) < 3), "at the middle height");
  const upright = projectFigure([[[100, 10, 2], [100, 20, 2]]], 120, 80, 8);
  const ys = upright.stars.map(([, y]) => y);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 60, "one above the other fills the height");
  const one = projectFigure([[[100, 10, 2]]], 120, 80, 8);
  assert.deepEqual(one.stars.map(([x, y]) => [Math.round(x), Math.round(y)]), [[60, 40]], "a single star in the middle");
});
