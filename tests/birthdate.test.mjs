// Tests of the one date of birth for the whole page (storeBirthDate, storedBirthDate in web/birthsky.js): given once, in the welcome card, the
// overview or the sky, it stores the date for the sky and the year for "your star", and nothing is stored for a date that is not a real one.
// Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { storeBirthDate, storedBirthDate, KEY } from "../web/birthsky.js";

// a localStorage of the browser, in memory
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

test("a real date stores the date and its year, and is read back", () => {
  store.clear();
  assert.equal(storedBirthDate(), null);
  assert.equal(storeBirthDate("1995-06-14"), true);
  assert.equal(store.get(KEY), "1995-06-14");
  assert.equal(store.get("birth-year"), "1995");
  const d = storedBirthDate();
  assert.deepEqual([d.year, d.month, d.day], [1995, 6, 14]);
});

test("an empty, broken, impossible, too early or future date stores nothing", () => {
  store.clear();
  const next = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  for (const text of ["", null, undefined, "14.06.1995", "1995-02-30", "1899-12-31", next]) {
    assert.equal(storeBirthDate(text), false, `${text}`);
    assert.equal(store.size, 0, `${text}`);
  }
});

test("a blocked storage does not break the page", () => {
  const saved = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
  try {
    assert.equal(storeBirthDate("1995-06-14"), true);
    assert.equal(storedBirthDate(), null);
  } finally {
    globalThis.localStorage = saved;
  }
});
