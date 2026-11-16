// Tests of the levels and the badges (web/explorer.js) and of their medals (web/sharecard.js). Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { BADGES, badgeProgress, levelOf, levelProgress, xpForLevel } from "../web/explorer.js";
import { MEDALS } from "../web/sharecard.js";

test("levels: level n starts at 25 n (n - 1) XP, and the start of each level is exactly that level", () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(xpForLevel), [0, 50, 150, 300, 500]);
  for (let n = 1; n <= 40; n++) {
    assert.equal(levelOf(xpForLevel(n)), n, `${xpForLevel(n)} XP is level ${n}`);
    if (n > 1) assert.equal(levelOf(xpForLevel(n) - 1), n - 1, `one XP less is level ${n - 1}`);
  }
  assert.equal(levelOf(0), 1);
});

test("the way to the next level: from 0 at the start of a level to just under 1 before the next one", () => {
  assert.deepEqual(levelProgress(0), { level: 1, low: 0, high: 50, share: 0 });
  assert.deepEqual(levelProgress(75), { level: 2, low: 50, high: 150, share: 0.25 });
  assert.equal(levelProgress(440).level, 4); // the level in the screenshot of the account: 440 XP, 60 to level 5
  assert.equal(levelProgress(440).high - 440, 60);
  for (let xp = 0; xp < 3000; xp += 7) {
    const { share, low, high, level } = levelProgress(xp);
    assert.ok(share >= 0 && share < 1, `${xp} XP: share ${share}`);
    assert.ok(low <= xp && xp < high, `${xp} XP lies in level ${level}`);
  }
});

test("badges: unique ids, four languages with a name and what it needs, and a medal picture for each", () => {
  const ids = BADGES.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length, "no id twice");
  for (const b of BADGES) {
    assert.ok(Number.isInteger(b.need) && b.need >= 1, `${b.id}: need is a whole number`);
    for (const lang of ["en", "de", "ja", "bg"]) {
      assert.equal(b[lang]?.length, 2, `${b.id}.${lang}: [name, what it needs]`);
      assert.ok(b[lang].every((s) => typeof s === "string" && s.trim()), `${b.id}.${lang}: no empty text`);
    }
  }
  assert.deepEqual([...MEDALS].sort(), [...ids].sort(), "every badge has its medal, and no medal is left over");
});

test("badges: nothing is earned at the start, and missing totals count as 0", () => {
  const start = badgeProgress({});
  assert.equal(start.length, BADGES.length);
  for (const b of start) {
    assert.equal(b.have, 0, `${b.id} starts at 0`);
    assert.equal(b.earned, false, `${b.id} is not earned at the start`);
  }
});

test("badges: earned exactly at the threshold, not one before, and the count shown never goes past what is needed", () => {
  const before = { planets: Array(24).fill("p"), candidates: Array(9).fill("c"), constellations: Array(11).fill("k"), favourite: 4, missions: 9 };
  const at = { planets: Array(25).fill("p"), candidates: Array(10).fill("c"), constellations: Array(12).fill("k"), favourite: 5, missions: 10 };
  const by = (list) => Object.fromEntries(list.map((b) => [b.id, b]));
  const b1 = by(badgeProgress(before));
  const b2 = by(badgeProgress(at));
  for (const id of ["planets-25", "candidates-10", "sky-reader", "collector", "regular"]) {
    assert.equal(b1[id].earned, false, `${id}: one before the threshold`);
    assert.equal(b2[id].earned, true, `${id}: at the threshold`);
  }
  assert.deepEqual(b1["planets-25"], { id: "planets-25", have: 24, need: 25, earned: false }); // "24 / 25"
  assert.equal(b1["first-look"].earned, true, "one planet is enough for the first look");
  const far = by(badgeProgress({ planets: Array(400).fill("p"), missions: 99 }));
  assert.equal(far["planets-25"].have, 25, "400 planets show as 25 / 25");
  assert.equal(far.regular.have, 10);
});

test("badges: one that was earned stays earned, also when a total is lower later (a reset, another device)", () => {
  const list = badgeProgress({}, ["first-trip", "collector"]);
  const by = Object.fromEntries(list.map((b) => [b.id, b]));
  assert.equal(by["first-trip"].earned, true);
  assert.equal(by.collector.earned, true);
  assert.equal(by["star-trip"].earned, false);
});

test("badges: the trips, the zone quiz, the stars", () => {
  const by = Object.fromEntries(badgeProgress({ trip: 1, starTrip: 1, zoneWin: 1 }).map((b) => [b.id, b]));
  assert.equal(by["first-trip"].earned, true);
  assert.equal(by["star-trip"].earned, true);
  assert.equal(by["zone-expert"].earned, true);
});
