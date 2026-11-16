// Tests of the moons (web/moons.js): the numbers copied from the NASA fact sheet against each other (Kepler's third law), the way they are
// drawn, the side that faces the planet, the maps, and the texts in four languages. Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MOONS, MOON_TEXT, moonScale, moonName, moonStory, facingRotation } from "../web/moons.js";

const web = (path) => new URL(`../web/${path}`, import.meta.url);
const all = Object.entries(MOONS).flatMap(([planet, list]) => list.map((moon) => ({ planet, moon })));
const RADII = { Earth: 1.0, Jupiter: 10.97 }; // the radii of the planets in main.js, in Earth radii

test("Kepler's third law: a^3 / T^2 is the same for the four moons of Jupiter, so no number was copied wrong", () => {
  const k = MOONS.Jupiter.map((m) => m.km ** 3 / m.days ** 2);
  const mean = k.reduce((a, b) => a + b) / k.length;
  for (const [i, m] of MOONS.Jupiter.entries()) assert.ok(Math.abs(k[i] / mean - 1) < 0.003, `${m.id}: ${(k[i] / mean - 1) * 100} % off`);
  // and from it the mass of Jupiter (G M = 4 pi^2 a^3 / T^2), against the NASA Jupiter Fact Sheet: GM 126.687 x 10^6 km^3/s^2, within a percent
  const gm = (4 * Math.PI ** 2 * (mean * 1e9)) / 86400 ** 2;
  assert.ok(Math.abs(gm / 1.26687e17 - 1) < 0.01, `G M of Jupiter ${gm.toExponential(4)}`);
});

test("the moons in order: the further out, the longer the orbit; all outside their planet and smaller than it", () => {
  for (const [planet, list] of Object.entries(MOONS)) {
    for (let i = 1; i < list.length; i++) {
      assert.ok(list[i].km > list[i - 1].km, `${planet}: ${list[i].id} is further out than ${list[i - 1].id}`);
      assert.ok(list[i].days > list[i - 1].days, `${planet}: ${list[i].id} takes longer`);
    }
    for (const m of list) {
      const s = moonScale(m, RADII[planet]);
      assert.ok(s.size > 0 && s.size < 0.5, `${m.id}: smaller than its planet (${s.size})`);
      assert.ok(s.real > 2, `${m.id}: far outside its planet in the real scale (${s.real} radii)`);
      assert.ok(s.orbit > 1 + s.size, `${m.id}: outside its planet in the explanation mode too (${s.orbit})`);
      assert.ok(s.orbit < s.real, `${m.id}: the explanation mode squeezes, it does not stretch`);
      assert.ok(Math.abs(s.years * 365.25 - m.days) < 1e-9);
    }
  }
});

test("the explanation mode keeps the order of the moons of Jupiter, and the Moon where it was (2.6 Earth radii)", () => {
  const orbits = MOONS.Jupiter.map((m) => moonScale(m, RADII.Jupiter).orbit);
  for (let i = 1; i < orbits.length; i++) assert.ok(orbits[i] > orbits[i - 1] + 0.1, "apart from each other");
  assert.ok(orbits.at(-1) < 5, "Callisto stays inside the picture of the close-up of Jupiter (5 radii)");
  assert.equal(moonScale(MOONS.Earth[0], RADII.Earth).orbit, 2.6);
  assert.ok(Math.abs(moonScale(MOONS.Earth[0], RADII.Earth).real - 60.3) < 0.1, "the Moon at 60.3 Earth radii in the real scale");
  assert.ok(Math.abs(moonScale(MOONS.Earth[0], RADII.Earth).size - 0.2727) < 0.001, "and 0.273 Earth radii big, as before");
});

test("a moon always shows its planet the middle of its map (longitude 0), wherever it is on its orbit", () => {
  for (let m = -7; m <= 7; m += 0.37) {
    const psi = facingRotation(m);
    // the middle of the map (u = 0.5) on a sphere of three.js: direction (-cos pi, sin pi) = (1, 0); turned about y by psi
    const [x, z] = [1, 0];
    const xw = x * Math.cos(psi) + z * Math.sin(psi);
    const zw = -x * Math.sin(psi) + z * Math.cos(psi);
    // towards the planet: from the moon at (cos m, sin m) back to the middle
    assert.ok(Math.abs(xw + Math.cos(m)) < 1e-9 && Math.abs(zw + Math.sin(m)) < 1e-9, `at ${m.toFixed(2)} it faces the planet`);
  }
});

// the size of a JPEG from its start-of-frame marker
function jpegSize(path) {
  const b = readFileSync(path);
  for (let i = 2; i < b.length; ) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    const length = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    i += 2 + length;
  }
  return null;
}

test("every moon has its map in the project, a whole globe of 2 : 1", () => {
  for (const { moon } of all) {
    const size = jpegSize(web(moon.texture));
    assert.ok(size, `${moon.id}: ${moon.texture} is a JPEG`);
    assert.equal(size.width, 2 * size.height, `${moon.id}: ${size.width} x ${size.height}`);
    assert.ok(["moon", "colour", "grey"].includes(moon.map), `${moon.id}: the map is described`);
  }
});

test("the story of every moon in every language: what it is, its numbers, the map and the source", () => {
  for (const lang of ["en", "de", "ja", "bg"]) {
    for (const { planet, moon } of all) {
      const story = moonStory(moon, planet, lang);
      assert.ok(story.length >= 5, `${moon.id} ${lang}: ${story.length} paragraphs`);
      for (const p of story) {
        assert.ok(typeof p === "string" && p.trim().length > 10, `${moon.id} ${lang}: a real paragraph`);
        assert.ok(!/undefined|NaN|null/.test(p), `${moon.id} ${lang}: "${p}"`);
        assert.ok(!p.includes("—"), `${moon.id} ${lang}: no long dash`);
      }
      assert.equal(story.some((p) => /Galile/.test(p) || /ガリレオ・ガリレイ/.test(p) || /Галилео Галилей/.test(p)), planet === "Jupiter", `${moon.id} ${lang}: Galileo only for Jupiter's moons`);
      assert.ok(moonName(moon.id, lang).length > 0);
    }
  }
  assert.equal(moonName("Ganymede", "de"), "Ganymed");
  assert.equal(moonName("Callisto", "bg"), "Калисто");
  assert.ok(moonStory(MOONS.Jupiter[2], "Jupiter", "en")[1].includes("15.0 times Jupiter's radius"), "the fact sheet's equatorial radius");
});

test("the texts of the moons have the same keys in all four languages", () => {
  const keys = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`])).sort();
  for (const lang of ["de", "ja", "bg"]) assert.deepEqual(keys(MOON_TEXT[lang]), keys(MOON_TEXT.en), lang);
});
