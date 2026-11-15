// Tests of the time rules of the events in the sky (web/events.js) and of the data (web/data/events.json). Run with: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { upcomingEvents, daysUntil, startOf, endOf } from "../web/events.js";

const data = JSON.parse(readFileSync(new URL("../web/data/events.json", import.meta.url), "utf-8"));
const at = (iso) => Date.parse(iso);

test("every event of the data has what the panel needs", () => {
  const ids = new Set();
  for (const e of data.events) {
    assert.ok(!ids.has(e.id), `id twice: ${e.id}`);
    ids.add(e.id);
    assert.ok(e.utc || e.date, `${e.id}: a time or a date`);
    assert.ok(!e.utc || /Z$/.test(e.utc), `${e.id}: the time is in UTC`);
    assert.ok(["eclipse", "meteor"].includes(e.kind), `${e.id}: kind`);
    assert.ok(["calculated", "expected"].includes(e.certainty), `${e.id}: certainty`);
    assert.ok(data.sources[e.source]?.url?.startsWith("https://"), `${e.id}: a source with a link`);
    assert.ok(e.title.en && e.title.de && e.text.en && e.text.de, `${e.id}: texts in en and de`);
    assert.ok(Number.isFinite(startOf(e)), `${e.id}: a real date`);
  }
});

test("the events are in the future of the day the list was written, and a year is covered", () => {
  const first = Math.min(...data.events.map(startOf));
  const last = Math.max(...data.events.map(startOf));
  assert.ok(first >= at("2026-11-15T00:00:00Z"));
  assert.ok(last - first > 300 * 86400000, "about a year");
});

test("past events are dropped, the next one comes first", () => {
  const list = upcomingEvents(data.events, at("2027-03-01T00:00:00Z"));
  assert.ok(list.length > 0);
  assert.ok(list.every((e) => endOf(e) > at("2027-03-01T00:00:00Z")));
  assert.deepEqual(list.map(startOf), [...list.map(startOf)].sort((a, b) => a - b));
  assert.equal(list[0].id, "lyrids-2027");
  assert.equal(upcomingEvents(data.events, at("2030-01-01T00:00:00Z")).length, 0);
});

test("an event with a time still counts for six hours, a day event for its whole day", () => {
  const geminids = data.events.find((e) => e.id === "geminids-2026");
  assert.equal(upcomingEvents([geminids], at("2026-12-14T19:59:00Z")).length, 1);
  assert.equal(upcomingEvents([geminids], at("2026-12-14T20:01:00Z")).length, 0);
  const leonids = data.events.find((e) => e.id === "leonids-2026");
  assert.equal(upcomingEvents([leonids], at("2026-11-17T23:59:00Z")).length, 1);
  assert.equal(upcomingEvents([leonids], at("2026-11-18T00:01:00Z")).length, 0);
});

test("days until: rounded up, zero when it is today or running, never negative", () => {
  const e = { utc: "2026-12-14T14:00:00Z" };
  assert.equal(daysUntil(e, at("2026-12-13T14:00:01Z")), 1);
  assert.equal(daysUntil(e, at("2026-12-12T13:00:00Z")), 3);
  assert.equal(daysUntil(e, at("2026-12-14T15:00:00Z")), 0);
  assert.equal(daysUntil(e, at("2027-01-01T00:00:00Z")), 0);
});
