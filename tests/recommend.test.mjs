// Tests of the recommendations (web/recommend.js). Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { recommend } from "../web/recommend.js";

const exo = [
  { name: "Proxima Cen b", host: "Proxima Cen", dist: 4.2, radius: 1.07, temp: 234, habitable: true },
  { name: "Proxima Cen d", host: "Proxima Cen", dist: 4.2, radius: 0.81, temp: 360, habitable: false },
  { name: "Ross 128 b", host: "Ross 128", dist: 11, radius: 1.1, temp: 301, habitable: true },
  { name: "TOI-700 d", host: "TOI-700", dist: 101.5, radius: 1.14, temp: 269, habitable: true },
  { name: "TOI-700 e", host: "TOI-700", dist: 101.5, radius: 0.92, temp: 273, habitable: true },
  { name: "Hot Jupiter", host: "Far", dist: 300, radius: 13, temp: 1500, habitable: false },
];
const solar = ["Mercury", "Venus", "Mars"];

test("a new visitor without an interest gets a good start: the nearest candidates", () => {
  const r = recommend({ exo, solar });
  assert.deepEqual(r.map((x) => x.name), ["Proxima Cen b", "Ross 128 b"]);
  assert.ok(r.every((x) => x.reason.key === "start"));
});

test("like the last planet looked at: the closest in size and temperature, not one already seen", () => {
  const r = recommend({ exo, solar, history: [{ name: "TOI-700 d", t: 5 }] });
  // Ross 128 b: 1.1 against 1.14 Earth radii and 301 against 269 K is closer (on these scales) than TOI-700 e with 0.92 and 273 K
  assert.equal(r[0].name, "Ross 128 b");
  assert.deepEqual(r[0].reason, { key: "similar", of: "TOI-700 d", radius: 1.1, temp: 301 });
  assert.ok(!r.some((x) => x.name === "TOI-700 d"));
});

test("a planet of the same system as the newest favourite", () => {
  const r = recommend({ exo, solar, favourites: [{ name: "Proxima Cen b", t: 3 }], seen: ["Proxima Cen b"] });
  assert.equal(r[0].name, "Proxima Cen d");
  assert.deepEqual(r[0].reason, { key: "sibling", of: "Proxima Cen b", host: "Proxima Cen" });
});

test("the interest of the profile", () => {
  assert.equal(recommend({ exo, solar, interest: "planets", seen: ["Mercury"] })[0].name, "Venus");
  assert.deepEqual(recommend({ exo, solar, interest: "stars", seenFigures: ["Ari"] })[0], { kind: "constellation", name: "Tau", reason: { key: "interestStars" } });
  assert.equal(recommend({ exo, solar, interest: "events", hasEvent: true })[0].kind, "event");
  assert.equal(recommend({ exo, solar, interest: "events", hasEvent: false })[0].reason.key, "start");
  assert.equal(recommend({ exo, solar, interest: "exoplanets", seen: ["Proxima Cen b"] })[0].name, "Ross 128 b");
});

test("after a reset the old history and favourites do not count, and nothing is given twice", () => {
  const r = recommend({ exo, solar, history: [{ name: "TOI-700 d", t: 5 }], favourites: [{ name: "Proxima Cen b", t: 5 }], since: 10 });
  assert.ok(r.every((x) => x.reason.key === "start"));
  const all = recommend({ exo, solar, interest: "exoplanets", history: [{ name: "Ross 128 b", t: 5 }], favourites: [{ name: "TOI-700 d", t: 5 }], limit: 5 });
  assert.equal(new Set(all.map((x) => x.name)).size, all.length);
  assert.ok(all.length <= 5);
});
