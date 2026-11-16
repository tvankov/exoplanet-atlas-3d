// Tests of the dwarf planets Ceres and Pluto: their orbits in web/data/orbits.json (JPL Small-Body Database, src/build_orbits.py), their
// maps (src/build_dwarf_textures.py) and their names in the four languages. Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { SOLAR_TITLES } from "../web/i18n-extra.js";

const orbits = JSON.parse(readFileSync(new URL("../web/data/orbits.json", import.meta.url), "utf-8"));

test("the orbits of Ceres and Pluto are there, with the sizes and shapes NASA gives", () => {
  const { Ceres, Pluto } = orbits.dwarfs;
  assert.ok(Math.abs(Ceres.a - 2.77) < 0.02, `Ceres a ${Ceres.a}`); // 2.77 AU, in the asteroid belt
  assert.ok(Ceres.e < 0.1);
  assert.ok(Math.abs(Ceres.per / 365.25 - 4.6) < 0.05, `Ceres year ${Ceres.per / 365.25}`); // NASA: 4.6 Earth years
  assert.ok(Math.abs(Pluto.a - 39.5) < 0.3, `Pluto a ${Pluto.a}`); // NASA: about 39.5 AU on average
  assert.ok(Math.abs(Pluto.q - 30) < 0.5 && Math.abs(Pluto.a * (1 + Pluto.e) - 49.3) < 0.5, "NASA: as close as 30 AU, as far as 49.3 AU");
  assert.ok(Math.abs(Pluto.i - 17.1) < 0.2, `Pluto i ${Pluto.i}`); // tilted against the plane of the planets
});

test("the maps of the dwarf planets are in the folder of textures", () => {
  for (const name of ["ceres", "pluto"]) assert.ok(existsSync(new URL(`../web/textures/${name}.jpg`, import.meta.url)), name);
});

test("Ceres and Pluto have names in Japanese and Bulgarian", () => {
  for (const lang of ["ja", "bg"]) for (const name of ["Ceres", "Pluto"]) assert.ok(SOLAR_TITLES[lang][name], `${lang} ${name}`);
});
