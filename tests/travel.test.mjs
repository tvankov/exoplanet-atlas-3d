// Tests of the length of the film of a trip (filmSeconds in web/travel.js): a longer real trip runs longer on the screen, within its limits.
// Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { filmSeconds, FILM_MIN, FILM_MAX, AU_KM, C_KMS, SECONDS_PER_YEAR } from "../web/travel.js";

const lightSeconds = (au) => (au * AU_KM) / C_KMS;
const near = (value, target, what) => assert.ok(Math.abs(value - target) < 1, `${what}: ${value.toFixed(1)} s, wanted about ${target}`);

test("at the speed of light a farther target takes longer on the screen: Mars 6 s, Kepler-452 40 s", () => {
  const mars = filmSeconds(lightSeconds(1.28));
  const neptune = filmSeconds(lightSeconds(29));
  const proxima = filmSeconds(4.24 * SECONDS_PER_YEAR);
  const pds70 = filmSeconds(369 * SECONDS_PER_YEAR);
  const kepler452 = filmSeconds(1800 * SECONDS_PER_YEAR);
  assert.ok(mars < neptune && neptune < proxima && proxima < pds70 && pds70 < kepler452);
  near(mars, 6, "Mars");
  near(kepler452, 40, "Kepler-452");
});

test("the film stays between its limits, also for nothing or for a trip of a billion years", () => {
  assert.equal(filmSeconds(0), FILM_MIN);
  assert.equal(filmSeconds(NaN), FILM_MIN);
  assert.equal(filmSeconds(1), FILM_MIN);
  assert.equal(filmSeconds(1e9 * SECONDS_PER_YEAR), FILM_MAX);
});
