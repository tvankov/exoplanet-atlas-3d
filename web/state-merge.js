// Merging the explorer's log of this browser with the one of the account (see auth.js). A pure function, so that it can be tested without a
// browser (tests/state-merge.test.mjs). The rule is "keep everything that either side has": lists are joined, the higher of two counters wins,
// a mission that is finished on one side is finished. XP are the higher of the two: they cannot be added up, because the server cannot tell
// which part of them both sides already hold. Whoever uses two devices at the same time can therefore lose the XP of one of them; the badges,
// the favourites and the ones counted by the missions are not lost.

const HISTORY_MAX = 12;
const text = (x) => typeof x === "string" && x.length > 0 && x.length < 200;
const number = (x) => (typeof x === "number" && Number.isFinite(x) ? x : 0);
const list = (x) => (Array.isArray(x) ? x : []);

// two lists of { name, t }: every name once, the newest entry of it, the newest first
function joinByName(a, b) {
  const byName = new Map();
  for (const item of [...list(a), ...list(b)]) {
    if (!item || !text(item.name)) continue;
    const old = byName.get(item.name);
    if (!old || number(item.t) > number(old.t)) byName.set(item.name, { name: item.name, t: number(item.t) });
  }
  return [...byName.values()].sort((x, y) => y.t - x.t);
}

function mergeProgress(a = {}, b = {}) {
  const out = {};
  for (const id of new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])) {
    const x = a?.[id];
    const y = b?.[id];
    if (!x || !y) {
      out[id] = x ?? y;
    } else if (number(x.period) !== number(y.period)) {
      out[id] = number(x.period) > number(y.period) ? x : y; // the newer period counts, the older one is over
    } else {
      out[id] = { period: x.period, n: Math.max(number(x.n), number(y.n)), ids: [...new Set([...list(x.ids), ...list(y.ids)])] };
    }
  }
  return out;
}

function mergeTotals(a = {}, b = {}) {
  const out = {};
  for (const key of new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])) {
    const x = a?.[key];
    const y = b?.[key];
    if (Array.isArray(x) || Array.isArray(y)) out[key] = [...new Set([...list(x), ...list(y)])];
    else out[key] = Math.max(number(x), number(y));
  }
  return out;
}

export function mergeState(local = {}, remote = {}) {
  const done = {};
  for (const id of new Set([...Object.keys(local.done ?? {}), ...Object.keys(remote.done ?? {})])) {
    done[id] = Math.max(number(local.done?.[id]), number(remote.done?.[id]));
  }
  const badges = new Map();
  for (const b of [...list(local.badges), ...list(remote.badges)]) {
    if (!b || !text(b.id)) continue;
    const old = badges.get(b.id);
    if (!old || number(b.t) < number(old.t)) badges.set(b.id, { id: b.id, t: number(b.t) });
  }
  return {
    favourites: joinByName(local.favourites, remote.favourites),
    history: joinByName(local.history, remote.history).slice(0, HISTORY_MAX),
    progress: mergeProgress(local.progress, remote.progress),
    done,
    total: mergeTotals(local.total, remote.total),
    xp: Math.max(number(local.xp), number(remote.xp)),
    badges: [...badges.values()],
  };
}
