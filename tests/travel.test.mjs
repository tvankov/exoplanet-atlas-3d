// Tests of the length of the film of a trip (filmSeconds in web/travel.js): a longer real trip runs longer on the screen, within its limits.
// Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { filmSeconds, FILM_MIN, FILM_MAX, AU_KM, C_KMS, SECONDS_PER_YEAR } from "../web/travel.js";

const lightSeconds = (au) => (au * AU_KM) / C_KMS;

test("at the speed of light a farther target takes longer on the screen: Mars, Neptune, Proxima Centauri, PDS 70", () => {
  const mars = filmSeconds(lightSeconds(1.5));
  const neptune = filmSeconds(lightSeconds(29));
  const proxima = filmSeconds(4.24 * SECONDS_PER_YEAR);
  const pds70 = filmSeconds(369 * SECONDS_PER_YEAR);
  assert.ok(mars < neptune && neptune < proxima && proxima < pds70);
  assert.ok(mars > 7 && mars < 9, `Mars ${mars}`);
  assert.ok(proxima > 22 && proxima < 25, `Proxima ${proxima}`);
});

test("the film stays between its limits, also for nothing or for a trip of a billion years", () => {
  assert.equal(filmSeconds(0), FILM_MIN);
  assert.equal(filmSeconds(NaN), FILM_MIN);
  assert.equal(filmSeconds(1), FILM_MIN);
  assert.equal(filmSeconds(1e9 * SECONDS_PER_YEAR), FILM_MAX);
});
