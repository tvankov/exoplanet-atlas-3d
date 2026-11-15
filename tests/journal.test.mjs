// Tests of the journal data (web/journal-data.js) and of its merge into the log (web/state-merge.js). Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { cleanNotes, mergeNotes, liveNotes, cleanCollections, mergeCollections, liveCollections, exportBundle, NOTE_MAX } from "../web/journal-data.js";
import { mergeState } from "../web/state-merge.js";

test("notes: damaged entries are dropped, a long text is cut", () => {
  const n = cleanNotes({ Mars: { text: "red", t: 2 }, "": { text: "x" }, Venus: "text", Earth: { text: "y".repeat(900), t: "late" } });
  assert.deepEqual(Object.keys(n).sort(), ["Earth", "Mars"]);
  assert.equal(n.Earth.text.length, NOTE_MAX);
  assert.equal(n.Earth.t, 0);
  assert.deepEqual(cleanNotes(["a"]), {});
});

test("notes: the newer one wins, also a deletion (an empty text)", () => {
  const a = { Mars: { text: "first", t: 1 }, Venus: { text: "keep", t: 5 } };
  const b = { Mars: { text: "", t: 3 }, Earth: { text: "home", t: 2 } };
  const m = mergeNotes(a, b);
  assert.equal(m.Mars.text, "");
  assert.equal(m.Venus.text, "keep");
  assert.deepEqual(liveNotes(m).map((n) => n.place), ["Venus", "Earth"]);
});

test("collections: by id, the newer one wins, a deleted one stays deleted", () => {
  const a = [{ id: "c1", title: "Red worlds", items: ["Mars"], t: 1 }, { id: "c2", title: "Gone", items: [], t: 1 }];
  const b = [{ id: "c1", title: "Red worlds", items: ["Mars", "Kepler-10 b"], t: 4 }, { id: "c2", title: "Gone", items: [], t: 6, deleted: true }];
  const m = mergeCollections(a, b);
  assert.deepEqual(m.find((c) => c.id === "c1").items, ["Mars", "Kepler-10 b"]);
  assert.deepEqual(liveCollections(m).map((c) => c.id), ["c1"]);
  assert.deepEqual(mergeCollections(b, a).find((c) => c.id === "c1").items, ["Mars", "Kepler-10 b"]); // the order of the two sides does not matter
  assert.equal(mergeCollections(b, a).find((c) => c.id === "c2").deleted, true);
});

test("collections: damaged ones are dropped, items once each", () => {
  const c = cleanCollections([{ id: "c1", title: "  A  ", items: ["Mars", "Mars", 5, ""], t: 1 }, { title: "no id" }, null, { id: "x".repeat(80) }]);
  assert.equal(c.length, 1);
  assert.equal(c[0].title, "A");
  assert.deepEqual(c[0].items, ["Mars"]);
  assert.deepEqual(cleanCollections("x"), []);
});

test("notes and collections go through the merge of the whole log", () => {
  const m = mergeState({ notes: { Mars: { text: "a", t: 1 } } }, { notes: { Mars: { text: "b", t: 2 } }, collections: [{ id: "c1", title: "T", items: [], t: 1 }] });
  assert.equal(m.notes.Mars.text, "b");
  assert.equal(m.collections.length, 1);
  assert.equal("notes" in mergeState({}, {}), false);
});

test("the export holds the whole log and says what it is", () => {
  const b = exportBundle({ xp: 3 }, { daily: { day: 1 } });
  assert.equal(b.app, "Space Explorer");
  assert.equal(b.explorer.xp, 3);
  assert.deepEqual(b.daily, { day: 1 });
  assert.ok(!Number.isNaN(Date.parse(b.exported)));
});
