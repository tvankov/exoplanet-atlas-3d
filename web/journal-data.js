// The data of the journal: notes on places (one per planet or star, by its name in the NASA list) and collections of places with a title. Pure
// functions for cleaning and merging, tested without a browser (tests/journal.test.mjs). A deleted note or collection is kept as an empty or
// deleted entry with its time, so that the merge with the account (state-merge.js) does not bring it back from the other side: the newer entry
// wins, whatever it is.

export const NOTE_MAX = 500;
export const TITLE_MAX = 40;
const NAME_MAX = 200;
const time = (x) => (Number.isFinite(x) ? x : 0);
const name = (x) => typeof x === "string" && x.length > 0 && x.length <= NAME_MAX;

export function cleanNotes(notes) {
  const out = {};
  if (!notes || typeof notes !== "object" || Array.isArray(notes)) return out;
  for (const [key, note] of Object.entries(notes)) {
    if (!name(key) || !note || typeof note !== "object") continue;
    out[key] = { text: typeof note.text === "string" ? note.text.slice(0, NOTE_MAX) : "", t: time(note.t) };
  }
  return out;
}
export function mergeNotes(a, b) {
  const x = cleanNotes(a);
  const y = cleanNotes(b);
  const out = { ...x };
  for (const [key, note] of Object.entries(y)) if (!out[key] || note.t > out[key].t) out[key] = note;
  return out;
}
// the notes that have a text, the newest first
export const liveNotes = (notes) =>
  Object.entries(cleanNotes(notes))
    .filter(([, n]) => n.text.trim())
    .map(([place, n]) => ({ place, ...n }))
    .sort((p, q) => q.t - p.t);

export function cleanCollections(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const c of list) {
    if (!c || typeof c.id !== "string" || !c.id || c.id.length > 40) continue;
    const items = Array.isArray(c.items) ? [...new Set(c.items.filter(name))].slice(0, 500) : [];
    const title = typeof c.title === "string" ? c.title.trim().slice(0, TITLE_MAX) : "";
    out.push({ id: c.id, title, items, t: time(c.t), ...(c.deleted === true ? { deleted: true } : {}) });
  }
  return out;
}
export function mergeCollections(a, b) {
  const byId = new Map();
  for (const c of [...cleanCollections(a), ...cleanCollections(b)]) {
    const old = byId.get(c.id);
    if (!old || c.t > old.t) byId.set(c.id, c);
  }
  return [...byId.values()];
}
// the collections that are not deleted, the oldest first (the order in which they were made)
export const liveCollections = (list) =>
  cleanCollections(list)
    .filter((c) => !c.deleted && c.title)
    .sort((p, q) => p.id.localeCompare(q.id));

// everything that is stored for the visitor, as one document to keep (the export of the journal)
export function exportBundle(state, extra = {}) {
  return { app: "Space Explorer", url: "https://space.todorvankov.com", version: 1, exported: new Date().toISOString(), explorer: state, ...extra };
}
