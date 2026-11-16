// Tests of the counting (web/stats.js): a visit through a shared picture is counted once, a few seconds later, and the parameter leaves the
// address bar; anything else in the address is kept, and nothing that is not one of the three pictures is counted. The browser (location,
// history, the GoatCounter script, the clock) is stood in for. Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";

let counted;
let replaced;
function browser(search, pathname = "/", hash = "") {
  counted = [];
  replaced = [];
  globalThis.window = { goatcounter: { count: (o) => counted.push(o.path) } };
  globalThis.location = { search, pathname, hash };
  globalThis.history = { state: { keep: 1 }, replaceState: (state, _title, url) => replaced.push({ state, url }) };
}
// a fresh copy of the module for each test, because it remembers what it has counted
let copy = 0;
const fresh = () => import(`../web/stats.js?copy=${copy++}`);

test("a visit through a shared picture: counted once after a few seconds, then the parameter leaves the address", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  browser("?ref=share-ages&lang=de", "/index.html", "#mars");
  const { trackShareArrival } = await fresh();
  trackShareArrival();
  t.mock.timers.tick(3999);
  assert.deepEqual(counted, [], "not before the counter script is there");
  t.mock.timers.tick(1);
  assert.deepEqual(counted, ["from-share-ages"]);
  assert.deepEqual(replaced, [{ state: { keep: 1 }, url: "/index.html?lang=de#mars" }], "the rest of the address and the state stay");
});

test("each of the pictures has its own count", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  for (const kind of ["star", "ages", "sky", "certificate"]) {
    browser(`?ref=share-${kind}`);
    const { trackShareArrival } = await fresh();
    trackShareArrival();
    t.mock.timers.tick(4000);
    assert.deepEqual(counted, [`from-share-${kind}`]);
    assert.deepEqual(replaced.map((r) => r.url), ["/"], "nothing left after the parameter");
  }
});

test("a reload of the same page in the same visit does not count it twice", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  browser("?ref=share-star");
  const { trackShareArrival } = await fresh();
  trackShareArrival();
  trackShareArrival();
  t.mock.timers.tick(4000);
  assert.deepEqual(counted, ["from-share-star"]);
});

test("anything else in ref, or no ref at all, is not counted and the address is not touched", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  for (const search of ["", "?lang=de", "?ref=share-", "?ref=share-evil", "?ref=SHARE-AGES", "?ref=share-ages-x", "?ref=newsletter", "?ref=share-ages%20x"]) {
    browser(search);
    const { trackShareArrival } = await fresh();
    trackShareArrival();
    t.mock.timers.tick(10000);
    assert.deepEqual(counted, [], `"${search}" is not counted`);
    assert.deepEqual(replaced, [], `"${search}" leaves the address alone`);
  }
});

test("counting never breaks the page: without the counter script, or when it throws", async () => {
  const { track } = await fresh();
  globalThis.window = {};
  assert.doesNotThrow(() => track("anything"));
  globalThis.window = { goatcounter: { count: () => { throw new Error("blocked"); } } };
  assert.doesNotThrow(() => track("anything"));
});
