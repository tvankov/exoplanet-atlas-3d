// Tests of the merge of the explorer's log (web/state-merge.js). Run with: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { mergeState } from "../web/state-merge.js";

const empty = { favourites: [], history: [], progress: {}, done: {}, total: {}, xp: 0, badges: [] };

test("merging with nothing changes nothing", () => {
  const s = { favourites: [{ name: "Proxima Cen b", t: 5 }], history: [], progress: {}, done: { "d-answer": 100 }, total: { trip: 2 }, xp: 41, badges: [{ id: "first-look", t: 1 }] };
  assert.deepEqual(mergeState(s, empty), mergeState(s, s));
  assert.equal(mergeState(s, empty).xp, 41);
  assert.deepEqual(mergeState(empty, s).badges, s.badges);
});

test("favourites and history are joined, every name once, the newest first", () => {
  const a = { favourites: [{ name: "A", t: 1 }, { name: "B", t: 5 }], history: [{ name: "X", t: 10 }] };
  const b = { favourites: [{ name: "B", t: 9 }, { name: "C", t: 3 }], history: [{ name: "Y", t: 20 }, { name: "X", t: 2 }] };
  const m = mergeState(a, b);
  assert.deepEqual(m.favourites.map((f) => f.name), ["B", "C", "A"]);
  assert.equal(m.favourites[0].t, 9);
  assert.deepEqual(m.history.map((h) => h.name), ["Y", "X"]);
});

test("the history keeps at most 12 places", () => {
  const many = Array.from({ length: 30 }, (_, i) => ({ name: `P${i}`, t: i }));
  assert.equal(mergeState({ history: many }, {}).history.length, 12);
});

test("counters: the higher one wins; lists of ids are joined", () => {
  const m = mergeState({ total: { trip: 3, planets: ["a", "b"] }, xp: 10 }, { total: { trip: 1, planets: ["b", "c"], measure: 2 }, xp: 30 });
  assert.equal(m.total.trip, 3);
  assert.equal(m.total.measure, 2);
  assert.deepEqual(m.total.planets.sort(), ["a", "b", "c"]);
  assert.equal(m.xp, 30);
});

test("a mission finished on one side is finished; the newer period wins for the progress", () => {
  const a = { done: { m1: 100, m2: 5 }, progress: { m1: { period: 100, n: 1, ids: [] }, m3: { period: 7, n: 2, ids: [] } } };
  const b = { done: { m1: 90, m2: 8 }, progress: { m3: { period: 8, n: 1, ids: [] }, m4: { period: 8, n: 0, ids: ["x"] } } };
  const m = mergeState(a, b);
  assert.equal(m.done.m1, 100);
  assert.equal(m.done.m2, 8);
  assert.equal(m.progress.m3.period, 8); // the older period is over
  assert.deepEqual(m.progress.m4.ids, ["x"]);
});

test("the same period: the higher count and the joined ids", () => {
  const m = mergeState({ progress: { u: { period: 4, n: 2, ids: ["a"] } } }, { progress: { u: { period: 4, n: 3, ids: ["b"] } } });
  assert.equal(m.progress.u.n, 3);
  assert.deepEqual(m.progress.u.ids.sort(), ["a", "b"]);
});

test("badges are joined, the earlier time stays", () => {
  const m = mergeState({ badges: [{ id: "a", t: 9 }] }, { badges: [{ id: "a", t: 4 }, { id: "b", t: 5 }] });
  assert.equal(m.badges.length, 2);
  assert.equal(m.badges.find((b) => b.id === "a").t, 4);
});

test("damaged data does not break it", () => {
  const m = mergeState({ favourites: "x", xp: "many", total: null }, { favourites: [null, { name: 5 }, { name: "ok", t: "late" }], badges: [{}, null] });
  assert.deepEqual(m.favourites, [{ name: "ok", t: 0 }]);
  assert.equal(m.xp, 0);
  assert.deepEqual(m.badges, []);
});
