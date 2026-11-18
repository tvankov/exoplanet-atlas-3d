// Tests of SPACE DISCOVERIES (web/discoveries.js and the entries in web/data/discoveries/): every entry is complete and honest about its
// sources, its links lead to things the map and the learning paths really have, the list of src/build_discoveries.py is up to date, and the
// search and the filters find what they should.
// Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { CATEGORIES, TYPES, STATUS, EVIDENCE, DISCOVERY_TEXT, validEntry, matches } from "../web/discoveries.js";
import { PATHS } from "../web/learn.js";
import { MOONS } from "../web/moons.js";

const web = (path) => new URL(`../web/${path}`, import.meta.url);
const read = (path) => JSON.parse(readFileSync(web(path), "utf8"));
const files = readdirSync(web("data/discoveries/entries")).filter((f) => f.endsWith(".json"));
const entries = files.map((f) => read(`data/discoveries/entries/${f}`));
const index = read("data/discoveries/index.json");

// what the map has: the planets and stars of the NASA table, the bodies of the Solar System, the moons, the 88 constellations
const stars = read("data/stars.json");
const starList = stars.stars ?? stars;
const places = new Set(starList.flatMap((s) => [s.hostname, ...s.planets.map((p) => p.pl_name)]));
for (const name of ["Sun", "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Ceres", "Pluto"]) places.add(name);
const moons = new Set(Object.values(MOONS).flat().map((m) => m.id));
const constellations = read("data/constellations.json");
const figures = new Set((constellations.constellations ?? constellations).map((c) => c.id));
const knownPlace = (kind, id) => (kind === "place" ? places.has(id) : kind === "moon" ? moons.has(id) : figures.has(id));
const knownSteps = new Set(Object.values(PATHS).flatMap((p) => p.steps));

test("the eight categories, seven kinds, three states and four kinds of evidence, each in the four languages", () => {
  assert.equal(CATEGORIES.length, 8);
  assert.equal(TYPES.length, 7);
  assert.deepEqual(STATUS.map((s) => s.id), ["confirmed", "candidate", "open"]);
  assert.deepEqual(EVIDENCE.map((s) => s.id), ["observed", "measured", "interpreted", "unknown"]);
  for (const list of [CATEGORIES, TYPES, STATUS, EVIDENCE]) for (const item of list) for (const lang of ["en", "de", "ja", "bg"]) assert.ok(item[lang], `${item.id} ${lang}`);
  const keys = Object.keys(DISCOVERY_TEXT.en).sort();
  for (const lang of ["de", "ja", "bg"]) assert.deepEqual(Object.keys(DISCOVERY_TEXT[lang]).sort(), keys, lang);
});

test("every entry is complete: sources for every fact, the kind of evidence, both texts, and links only to what the map and the paths have", () => {
  assert.ok(entries.length >= 2);
  const ids = new Set(entries.map((e) => e.id));
  assert.equal(ids.size, entries.length, "no id twice");
  for (const [i, e] of entries.entries()) {
    assert.equal(`${e.id}.json`, files[i], "the file is named by the id");
    assert.deepEqual(validEntry(e, { knownSteps, knownPlace, ids }), [], e.id);
  }
});

test("validEntry finds what is missing or wrong", () => {
  const good = entries[0];
  const copy = () => JSON.parse(JSON.stringify(good));
  const bad1 = copy();
  bad1.facts[0].source = "nowhere";
  assert.ok(validEntry(bad1).some((x) => x.includes("source")));
  const bad2 = copy();
  bad2.status = "proven";
  assert.ok(validEntry(bad2).includes("status"));
  const bad3 = copy();
  bad3.explorer = [{ kind: "place", id: "Planet Nine" }];
  assert.ok(validEntry(bad3, { knownPlace }).some((x) => x.includes("Planet Nine")));
  const bad4 = copy();
  bad4.text.de.takeaways = ["one"];
  assert.ok(validEntry(bad4).includes("text de takeaways"));
  const bad5 = copy();
  bad5.learn = ["noSuchStep"];
  assert.ok(validEntry(bad5, { knownSteps }).includes("learn noSuchStep"));
});

test("the list (index.json) is up to date with the entries: run src/build_discoveries.py after a change", () => {
  assert.deepEqual(index.entries.map((i) => i.id).sort(), entries.map((e) => e.id).sort());
  for (const item of index.entries) {
    const e = entries.find((x) => x.id === item.id);
    for (const field of ["categories", "type", "status", "dates", "aliases", "explorer"]) assert.deepEqual(item[field], e[field], `${item.id} ${field}`);
    for (const lang of Object.keys(e.text)) {
      assert.equal(item.title[lang], e.text[lang].title, `${item.id} title ${lang}`);
      assert.equal(item.summary[lang], e.text[lang].summary, `${item.id} summary ${lang}`);
    }
  }
});

test("search and filters: words in the title, the summary or the aliases; category, kind and status", () => {
  const sgr = index.entries.find((i) => i.id === "sagittarius-a-star");
  const pds = index.entries.find((i) => i.id === "pds-70-b");
  assert.ok(matches(sgr, { query: "sgr a*" }));
  assert.ok(matches(sgr, { query: "schwarzes loch" }, "de"));
  assert.ok(!matches(pds, { query: "black hole" }));
  assert.ok(matches(pds, { category: "exoplanets" }));
  assert.ok(!matches(pds, { category: "mysteries" }));
  assert.ok(matches(pds, { status: "confirmed", type: "object" }));
  assert.ok(!matches(pds, { status: "candidate" }));
  assert.ok(matches(pds, {}));
});
