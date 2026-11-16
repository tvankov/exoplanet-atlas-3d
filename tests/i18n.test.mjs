// Tests of the texts of the page in its four languages (en, de, ja, bg): every language has every text, a text that is a function returns a
// real sentence for sample values (no "undefined", "NaN" or "null" in it), and no text has a long dash (the project writes without them).
// Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { UNIVERSE_TEXT } from "../web/universe.js";
import { STAR_TEXT } from "../web/mystar.js";
import { BIRTHSKY_TEXT } from "../web/birthsky.js";
import { RECO_TEXT } from "../web/recommend.js";
import { FLIGHT_TEXT } from "../web/dailyflight.js";
import { XP_TEXT } from "../web/explorer.js";
import { JOURNAL_TEXT } from "../web/journal.js";
import { EVENTS_TEXT } from "../web/events.js";

const TEXTS = { UNIVERSE_TEXT, STAR_TEXT, BIRTHSKY_TEXT, RECO_TEXT, FLIGHT_TEXT, XP_TEXT, JOURNAL_TEXT, EVENTS_TEXT };
const LANGS = ["en", "de", "ja", "bg"];
// sample values for the functions: numbers where they count, names where they name
const SAMPLES = [3, 12, "Proxima Cen b", "1990", true];
const bad = /\bundefined\b|\bNaN\b|\bnull\b|\[object Object\]/;

// all texts of one language, flat: [["path.to.key", value], ...] (nested objects such as the interests are walked into)
function flat(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? flat(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]));
}

for (const [name, table] of Object.entries(TEXTS)) {
  test(`${name}: every language has the same texts, of the same kind`, () => {
    assert.deepEqual(Object.keys(table).sort(), [...LANGS].sort(), `${name} has the four languages`);
    const keys = flat(table.en).map(([k]) => k).sort();
    for (const lang of LANGS) {
      const entries = flat(table[lang]);
      assert.deepEqual(entries.map(([k]) => k).sort(), keys, `${name}.${lang} has the same keys as en`);
      const en = Object.fromEntries(flat(table.en));
      for (const [k, v] of entries) assert.equal(typeof v, typeof en[k], `${name}.${lang}.${k} is a ${typeof en[k]} as in en`);
    }
  });

  test(`${name}: no text is empty, every function gives a sentence, and no text has a long dash`, () => {
    for (const lang of LANGS) {
      for (const [k, v] of flat(table[lang])) {
        const where = `${name}.${lang}.${k}`;
        const out = typeof v === "function" ? v(...SAMPLES.slice(0, Math.max(v.length, 1))) : v;
        if (Array.isArray(out)) continue;
        assert.equal(typeof out, "string", `${where} gives a string`);
        assert.ok(out.trim().length > 0, `${where} is not empty`);
        assert.ok(!bad.test(out), `${where} has no undefined, NaN or null: "${out}"`);
        assert.ok(!out.includes("—"), `${where} has no long dash: "${out}"`);
      }
    }
  });
}

test("the German, Japanese and Bulgarian texts are not English left over", () => {
  // a long English sentence in another language is a missed translation; short words (K, XP, names) may be the same
  for (const [name, table] of Object.entries(TEXTS))
    for (const lang of ["de", "ja", "bg"]) {
      const en = Object.fromEntries(flat(table.en));
      for (const [k, v] of flat(table[lang])) {
        if (typeof v !== "string" || v.length < 25) continue;
        assert.notEqual(v, en[k], `${name}.${lang}.${k} is still the English text`);
      }
    }
});
