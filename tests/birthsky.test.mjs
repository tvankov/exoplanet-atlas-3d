// Tests of "The sky at your birth" (web/birthsky.js): the Sun's longitude, the sign of astrology and the real constellation. Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { sunLongitude, tropicalSign, sunConstellation, parseDate } from "../web/birthsky.js";

const at = (iso) => new Date(iso);
const close = (a, b, tolerance) => Math.abs(((a - b + 540) % 360) - 180) < tolerance;

test("the Sun's longitude at the equinoxes and solstices of 2026", () => {
  assert.ok(close(sunLongitude(at("2026-03-20T14:46:00Z")), 0, 0.1)); // spring equinox
  assert.ok(close(sunLongitude(at("2026-06-21T08:24:00Z")), 90, 0.1)); // June solstice
  assert.ok(close(sunLongitude(at("2026-09-23T00:05:00Z")), 180, 0.1)); // autumn equinox
  assert.ok(close(sunLongitude(at("2026-12-21T20:50:00Z")), 270, 0.1)); // December solstice
});

test("the sign of astrology: 30 degrees each from Aries, and the border days", () => {
  assert.deepEqual(tropicalSign(10), { id: "Ari", near: false });
  assert.equal(tropicalSign(45).id, "Tau");
  assert.equal(tropicalSign(359.9).id, "Psc");
  assert.equal(tropicalSign(359.9).near, true);
  assert.equal(tropicalSign(30.2).near, true);
  assert.equal(tropicalSign(sunLongitude(at("1992-05-01T12:00:00Z"))).id, "Tau");
});

test("the real constellation of the Sun on the boundary days", () => {
  const cases = [[1, 18, "Sgr"], [1, 19, "Cap"], [2, 16, "Aqr"], [3, 11, "Aqr"], [3, 12, "Psc"], [4, 18, "Psc"], [4, 19, "Ari"], [5, 1, "Ari"],
    [5, 14, "Tau"], [6, 20, "Gem"], [7, 21, "Cnc"], [8, 10, "Leo"], [9, 16, "Vir"], [10, 31, "Lib"], [11, 23, "Sco"], [11, 29, "Sco"],
    [11, 30, "Oph"], [12, 17, "Oph"], [12, 18, "Sgr"], [12, 31, "Sgr"]];
  for (const [m, d, id] of cases) assert.equal(sunConstellation(m, d), id, `${m}-${d}`);
});

test("a date of birth must be a real date between 1900 and today", () => {
  assert.deepEqual(parseDate("1992-05-01").month, 5);
  assert.equal(parseDate("1992-02-30"), null);
  assert.equal(parseDate("1899-12-31"), null);
  assert.equal(parseDate("2999-01-01"), null);
  assert.equal(parseDate("1.5.1992"), null);
  assert.equal(parseDate(null), null);
});
