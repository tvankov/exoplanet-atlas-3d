// Tests of the profile rules (web/profile.js) and of its merge into the log (web/state-merge.js). Run with: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { cleanProfile, mergeProfile, mergeLast, entryForInterest } from "../web/profile.js";
import { mergeState } from "../web/state-merge.js";

test("a profile keeps only known fields with allowed values", () => {
  const p = cleanProfile({ name: "  Anna  ", interest: "exoplanets", level: "expert", onboarded: true, extra: "x", skipped: "yes", updated: 5 });
  assert.deepEqual(p, { name: "Anna", interest: "exoplanets", level: "expert", onboarded: true, updated: 5 });
  assert.deepEqual(cleanProfile({ interest: "politics", level: "god", name: "   " }), { updated: 0 });
  assert.equal(cleanProfile(null), null);
  assert.equal(cleanProfile("text"), null);
});

test("a name is cut to 24 characters", () => {
  assert.equal(cleanProfile({ name: "x".repeat(60) }).name.length, 24);
});

test("the profile that was changed last wins as a whole", () => {
  const a = { name: "Old", interest: "planets", updated: 1 };
  const b = { name: "New", level: "advanced", updated: 9 };
  assert.deepEqual(mergeProfile(a, b), { name: "New", level: "advanced", updated: 9 });
  assert.deepEqual(mergeProfile(b, a), { name: "New", level: "advanced", updated: 9 });
  assert.deepEqual(mergeProfile(null, a), { name: "Old", interest: "planets", updated: 1 });
  assert.equal(mergeProfile(null, null), null);
});

test("the last place: the newer one, damaged ones are dropped", () => {
  assert.deepEqual(mergeLast({ name: "Mars", t: 5 }, { name: "Proxima Cen b", t: 9 }), { name: "Proxima Cen b", t: 9 });
  assert.deepEqual(mergeLast({ name: "Mars", t: 5 }, null), { name: "Mars", t: 5 });
  assert.equal(mergeLast({ name: "", t: 5 }, { t: "x" }), null);
});

test("the entry of the day follows the interest and stays the same for a day", () => {
  const entries = [{ target: "Mars" }, { target: "Venus" }, { target: "TOI-700 d" }, { target: "Proxima Cen b" }, { target: "Earth" }];
  for (let day = 0; day < 12; day++) {
    assert.ok(["Mars", "Venus", "Earth"].includes(entryForInterest(entries, day, "planets").target));
    assert.ok(["TOI-700 d", "Proxima Cen b"].includes(entryForInterest(entries, day, "exoplanets").target));
  }
  assert.equal(entryForInterest(entries, 7, "stars"), entries[7 % 5]); // no entries of that kind: all of them
  assert.equal(entryForInterest(entries, 7, undefined), entries[2]);
  assert.equal(entryForInterest(entries, 3, "exoplanets"), entryForInterest(entries, 3, "exoplanets"));
  assert.equal(entryForInterest([{ target: "Mars" }], 4, "exoplanets").target, "Mars"); // none of the kind: all
  assert.equal(entryForInterest(entries, -1, "planets").target, "Earth"); // a negative day does not break it
});

test("the profile and the last place go through the merge of the whole log", () => {
  const local = { profile: { name: "Anna", updated: 3 }, last: { name: "Mars", t: 10 }, xp: 5 };
  const remote = { profile: { name: "Anna K", interest: "planets", updated: 8 }, last: { name: "Venus", t: 4 }, xp: 9 };
  const m = mergeState(local, remote);
  assert.equal(m.profile.name, "Anna K");
  assert.equal(m.profile.interest, "planets");
  assert.deepEqual(m.last, { name: "Mars", t: 10 });
  assert.equal(m.xp, 9);
  assert.equal(mergeState({}, {}).profile ?? null, null);
});
