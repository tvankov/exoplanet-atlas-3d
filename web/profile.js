// The explorer's profile, a few optional things that make the page personal: a name (any name, no real name needed), the interest, and how much
// the visitor knows. It lives in the explorer's log (web/explorer.js, localStorage "explorer"), so it is saved to the account and merged with it
// like the rest of the log (state-merge.js). Pure functions, tested without a browser (tests/profile.test.mjs).

export const INTERESTS = ["planets", "exoplanets", "stars", "events"];
export const LEVELS = ["beginner", "advanced", "expert"];

const SOLAR = new Set(["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"]);
const NAME_MAX = 24;

// A profile from anything that was stored or sent: only the known fields in their allowed values, else null.
export function cleanProfile(p) {
  if (!p || typeof p !== "object") return null;
  const out = {};
  if (typeof p.name === "string" && p.name.trim()) out.name = p.name.trim().slice(0, NAME_MAX);
  if (INTERESTS.includes(p.interest)) out.interest = p.interest;
  if (LEVELS.includes(p.level)) out.level = p.level;
  if (p.onboarded === true) out.onboarded = true;
  if (p.skipped === true) out.skipped = true;
  out.updated = Number.isFinite(p.updated) ? p.updated : 0;
  return out;
}

// Two profiles (this browser and the account): the one that was changed last wins as a whole, so that a field cannot be mixed up with an old one.
export function mergeProfile(a, b) {
  const x = cleanProfile(a);
  const y = cleanProfile(b);
  if (!x) return y;
  if (!y) return x;
  return y.updated > x.updated ? y : x;
}

// The last place that was explored ({ name, t }): the newer one.
export function mergeLast(a, b) {
  const ok = (l) => l && typeof l.name === "string" && l.name.length > 0 && l.name.length < 200 && Number.isFinite(l.t);
  if (!ok(a)) return ok(b) ? { name: b.name, t: b.t } : null;
  if (!ok(b)) return { name: a.name, t: a.t };
  return b.t > a.t ? { name: b.name, t: b.t } : { name: a.name, t: a.t };
}

// The entry of the day for a visitor with an interest: the planets of the Solar System, or the exoplanets, else all. The same day gives the same
// entry; with no entries of that kind all are used.
export function entryForInterest(entries, day, interest) {
  let list = entries;
  if (interest === "planets") list = entries.filter((e) => SOLAR.has(e.target));
  else if (interest === "exoplanets") list = entries.filter((e) => !SOLAR.has(e.target));
  if (!list.length) list = entries;
  return list[((day % list.length) + list.length) % list.length];
}

// The profile that is stored in this browser, read without the log module (the entry of the day is chosen before the log starts).
export function readStoredProfile() {
  try {
    return cleanProfile(JSON.parse(localStorage.getItem("explorer"))?.profile);
  } catch {
    return null;
  }
}
