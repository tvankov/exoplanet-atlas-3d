// Tests of "The sky at your birth" (web/birthsky.js): the Sun's longitude, the sign of astrology and the real constellation. Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { sunLongitude, tropicalSign, sunConstellation, parseDate, projectFigure } from "../web/birthsky.js";

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

// ---------------------------------------------------------------- the ascendant
import { zonedToUtc, siderealDeg, obliquityDeg, ascendant, constellationAtLongitude, searchPlaces } from "../web/birthsky.js";

test("a local hour of birth becomes world time with the time zone of the place, summer time included", () => {
  assert.equal(zonedToUtc(1992, 5, 1, 10, 0, "Europe/Berlin").toISOString(), "1992-05-01T08:00:00.000Z"); // summer time
  assert.equal(zonedToUtc(1992, 1, 15, 10, 0, "Europe/Berlin").toISOString(), "1992-01-15T09:00:00.000Z");
  assert.equal(zonedToUtc(1990, 12, 5, 12, 0, "Europe/Sofia").toISOString(), "1990-12-05T10:00:00.000Z");
  assert.equal(zonedToUtc(2000, 7, 1, 9, 30, "Asia/Tokyo").toISOString(), "2000-07-01T00:30:00.000Z");
  assert.equal(zonedToUtc(1985, 3, 3, 23, 15, "America/New_York").toISOString(), "1985-03-04T04:15:00.000Z");
});

test("the sidereal time at Greenwich on 1 January 2000, 12:00 UT is 280.46 degrees", () => {
  assert.ok(Math.abs(siderealDeg(new Date("2000-01-01T12:00:00Z"), 0) - 280.46062) < 0.001);
});

test("the ascendant lies on the eastern horizon", () => {
  const RAD = Math.PI / 180;
  const cases = [
    ["1992-05-01T08:00:00Z", 51.22, 6.78], ["1990-12-05T10:00:00Z", 42.7, 23.32], ["2000-07-01T00:30:00Z", 35.69, 139.69],
    ["1985-03-04T04:15:00Z", 40.71, -74.01], ["2010-10-10T18:45:00Z", -33.87, 151.21], ["1975-06-21T03:00:00Z", 59.33, 18.07],
  ];
  for (const [iso, lat, lon] of cases) {
    const date = new Date(iso);
    const lambda = ascendant(date, lat, lon) * RAD;
    const eps = obliquityDeg(date) * RAD;
    const ra = Math.atan2(Math.sin(lambda) * Math.cos(eps), Math.cos(lambda));
    const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
    const hourAngle = siderealDeg(date, lon) * RAD - ra;
    const altitude = Math.asin(Math.sin(lat * RAD) * Math.sin(dec) + Math.cos(lat * RAD) * Math.cos(dec) * Math.cos(hourAngle)) / RAD;
    assert.ok(Math.abs(altitude) < 1e-6, `${iso}: on the horizon (${altitude})`);
    assert.ok(Math.sin(hourAngle) < 0, `${iso}: in the east`);
  }
});

test("the constellation at a point of the ecliptic follows the table of the Sun", () => {
  assert.equal(constellationAtLongitude(0), "Psc"); // the spring equinox lies in Pisces today
  assert.ok(["Tau", "Gem"].includes(constellationAtLongitude(90))); // the June solstice point is at the border, the table is one day exact
  assert.equal(constellationAtLongitude(60), "Tau");
  assert.equal(constellationAtLongitude(120), "Cnc");
  assert.equal(constellationAtLongitude(250), "Oph");
});

test("the search for a place: the beginning of the name, accents do not matter, bigger places first", () => {
  const places = [["Düsseldorf", "Duesseldorf", "DE", 51.2, 6.8, "Europe/Berlin"], ["Dubai", "", "AE", 25.1, 55.2, "Asia/Dubai"], ["Dusseldorf Mini", "", "XX", 0, 0, "UTC"]];
  assert.deepEqual(searchPlaces(places, "dus").map((p) => p[0]), ["Düsseldorf", "Dusseldorf Mini"]);
  assert.deepEqual(searchPlaces(places, "Duesseld").map((p) => p[0]), ["Düsseldorf"]);
  assert.deepEqual(searchPlaces(places, "d"), []);
});

test("the drawing of a constellation fits its box, east to the left and north up as in the sky", () => {
  // three stars: one in the middle, one a little east (larger right ascension), one a little north
  const lines = [[[60, 20, 1], [62, 20, 3]], [[60, 20, 1], [60, 22, 2]]];
  const { segments, stars } = projectFigure(lines, 120, 80, 8);
  assert.equal(stars.length, 3); // the middle star once, although it is in two lines
  assert.equal(segments.length, 2);
  for (const [x, y] of stars) assert.ok(x >= 7.99 && x <= 112.01 && y >= 7.99 && y <= 72.01);
  const [middle, east, north] = stars;
  assert.ok(east[0] < middle[0], "east is drawn to the left");
  assert.ok(north[1] < middle[1], "north is drawn up");
  assert.equal(projectFigure([]), null);
});
