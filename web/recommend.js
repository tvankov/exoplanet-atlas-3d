// Recommendations with a reason ("Because you looked at TOI-700 d"). They come only from what the visitor chose (the interest of the profile)
// and what they did on this page (the planets looked at, the favourites), never hide anything, and say why they are there. They can be reset:
// then only the interest counts, until the visitor looks at new things. The choice is a pure function (recommend), tested in
// tests/recommend.test.mjs; the facts in the reasons (radius, temperature, host star) are those of the data of the map.

import { track } from "./stats.js";
import { disclosure } from "./disclosure.js";

const ZODIAC = ["Ari", "Tau", "Gem", "Cnc", "Leo", "Vir", "Lib", "Sco", "Sgr", "Cap", "Aqr", "Psc"];

// exo: [{ name, host, dist, radius, radiusCalc, temp, habitable }] (the exoplanets; radiusCalc: the radius is only worked out from the mass); solar: ["Mercury", ...] (without the Earth); history: [{ name, t }]
// newest first; favourites: [{ name, t }]; seen: names already looked at; seenFigures: constellations already seen in 3D; since: only history
// and favourites after this time count (the reset); hasEvent: there is a next event in the sky.
export function recommend({ interest, exo, solar, history = [], favourites = [], seen = [], seenFigures = [], since = 0, hasEvent = false, limit = 3 }) {
  const byName = new Map(exo.map((p) => [p.name, p]));
  const seenSet = new Set([...seen, ...history.map((h) => h.name)]);
  const out = [];
  const taken = new Set();
  const add = (item) => {
    if (!item || taken.has(item.name) || out.length >= limit) return;
    taken.add(item.name);
    out.push(item);
  };
  const fresh = (p) => p && !seenSet.has(p.name) && !taken.has(p.name);
  const candidates = exo.filter((p) => p.habitable).sort((a, b) => a.dist - b.dist);

  // 1. like the last exoplanet looked at: the closest in size and temperature (on a log scale for the radius)
  const last = history.find((h) => h.t > since && byName.get(h.name)?.radius && byName.get(h.name)?.temp);
  if (last) {
    const ref = byName.get(last.name);
    let best = null;
    let bestScore = Infinity;
    for (const p of exo) {
      if (!p.radius || !p.temp || p.name === ref.name || !fresh(p)) continue;
      const score = Math.abs(Math.log(p.radius / ref.radius)) + Math.abs(p.temp - ref.temp) / 300;
      if (score < bestScore) (bestScore = score), (best = p);
    }
    if (best) add({ kind: "planet", name: best.name, reason: { key: "similar", of: ref.name, radius: best.radius, calc: !!best.radiusCalc, temp: best.temp } });
  }
  // 2. a planet of the same system as the newest favourite
  const fav = favourites.find((f) => f.t > since && byName.has(f.name));
  if (fav) {
    const host = byName.get(fav.name).host;
    const sibling = exo.find((p) => p.host === host && p.name !== fav.name && fresh(p));
    if (sibling) add({ kind: "planet", name: sibling.name, reason: { key: "sibling", of: fav.name, host } });
  }
  // 3. the interest of the profile
  if (interest === "exoplanets") {
    const c = candidates.find(fresh);
    if (c) add({ kind: "planet", name: c.name, reason: { key: "interestExo" } });
  } else if (interest === "planets") {
    const p = solar.find((name) => !seenSet.has(name) && !taken.has(name));
    if (p) add({ kind: "planet", name: p, reason: { key: "interestSolar" } });
  } else if (interest === "stars") {
    const figure = ZODIAC.find((id) => !seenFigures.includes(id));
    if (figure) add({ kind: "constellation", name: figure, reason: { key: "interestStars" } });
  } else if (interest === "events" && hasEvent) {
    add({ kind: "event", name: "next-event", reason: { key: "interestEvents" } });
  }
  // 4. a good start: the nearest candidate not seen yet
  for (const c of candidates) {
    if (out.length >= Math.min(limit, 2)) break;
    if (fresh(c)) add({ kind: "planet", name: c.name, reason: { key: "start" } });
  }
  return out;
}

export const RECO_TEXT = {
  en: {
    title: "Recommended for you",
    similar: (of, r, temp, calc) => `Like ${of}, which you looked at: about ${r} Earth radii${calc ? " (worked out from the mass, not measured)" : ""} and ${temp} K.`,
    sibling: (of, host) => `Because you saved ${of}: this planet orbits the same star, ${host}.`,
    interestExo: "Because exoplanets interest you: the nearest candidate you have not seen yet.",
    interestSolar: "Because the planets of the Solar System interest you.",
    interestStars: "Because stars and constellations interest you: a zodiac sign you have not seen in 3D yet.",
    interestEvents: "Because events in the sky interest you.",
    start: "A good start: the nearest candidate in a habitable zone that you have not seen yet.",
    eventLabel: (title, when) => `${title} · ${when}`,
    reset: "Reset the recommendations", resetDone: "Reset: from now on only your interest and what you look at next count.",
    note: "Recommendations follow your interest and what you looked at here. Nothing is hidden: the whole map stays open.",
    about: "How recommendations are made",
  },
  de: {
    title: "Für dich empfohlen",
    similar: (of, r, temp, calc) => `Ähnlich wie ${of}, das du angesehen hast: etwa ${r} Erdradien${calc ? " (aus der Masse berechnet, nicht gemessen)" : ""} und ${temp} K.`,
    sibling: (of, host) => `Weil du ${of} gespeichert hast: Dieser Planet kreist um denselben Stern, ${host}.`,
    interestExo: "Weil dich Exoplaneten interessieren: der nächste Kandidat, den du noch nicht gesehen hast.",
    interestSolar: "Weil dich die Planeten des Sonnensystems interessieren.",
    interestStars: "Weil dich Sterne und Sternbilder interessieren: ein Sternzeichen, das du noch nicht in 3D gesehen hast.",
    interestEvents: "Weil dich Himmelsereignisse interessieren.",
    start: "Ein guter Anfang: der nächste Kandidat in einer bewohnbaren Zone, den du noch nicht gesehen hast.",
    eventLabel: (title, when) => `${title} · ${when}`,
    reset: "Empfehlungen zurücksetzen", resetDone: "Zurückgesetzt: Ab jetzt zählen nur dein Interesse und was du als Nächstes ansiehst.",
    note: "Empfehlungen folgen deinem Interesse und dem, was du hier angesehen hast. Nichts wird versteckt: Die ganze Karte bleibt offen.",
    about: "Wie Empfehlungen entstehen",
  },
  ja: {
    title: "あなたへのおすすめ",
    similar: (of, r, temp, calc) => `あなたが見た${of}に似ています：半径は地球の約${r}倍${calc ? "（測定ではなく質量から計算した値）" : ""}、温度は${temp} K。`,
    sibling: (of, host) => `${of}を保存したので：この惑星も同じ恒星${host}を回っています。`,
    interestExo: "系外惑星に興味があるので：まだ見ていない、いちばん近い候補です。",
    interestSolar: "太陽系の惑星に興味があるので。",
    interestStars: "恒星と星座に興味があるので：まだ3Dで見ていない黄道十二星座です。",
    interestEvents: "天文イベントに興味があるので。",
    start: "はじめの一歩に：まだ見ていない、ハビタブルゾーンでいちばん近い候補です。",
    eventLabel: (title, when) => `${title} · ${when}`,
    reset: "おすすめをリセット", resetDone: "リセットしました。これからは興味とこれから見るものだけが使われます。",
    note: "おすすめは、あなたの興味とここで見たものに基づきます。何も隠されず、地図全体はいつでも開いています。",
    about: "おすすめの選び方",
  },
  bg: {
    title: "Препоръчано за теб",
    similar: (of, r, temp, calc) => `Подобна на ${of}, която разгледа: около ${r} земни радиуса${calc ? " (изчислени от масата, не измерени)" : ""} и ${temp} K.`,
    sibling: (of, host) => `Защото запази ${of}: тази планета обикаля същата звезда, ${host}.`,
    interestExo: "Защото те интересуват екзопланетите: най-близкият кандидат, който още не си видял.",
    interestSolar: "Защото те интересуват планетите на Слънчевата система.",
    interestStars: "Защото те интересуват звездите и съзвездията: зодиакален знак, който още не си видял в 3D.",
    interestEvents: "Защото те интересуват събитията в небето.",
    start: "Добро начало: най-близкият кандидат в обитаема зона, който още не си видял.",
    eventLabel: (title, when) => `${title} · ${when}`,
    reset: "Нулирай препоръките", resetDone: "Нулирано: отсега броят само интересът ти и това, което разглеждаш нататък.",
    note: "Препоръките следват интереса ти и това, което си разгледал тук. Нищо не се скрива: цялата карта остава отворена.",
    about: "Как се избират препоръките",
  },
};

// For My Universe (universe.js draws them). data() gives { exo, solar }, nameOf(item) the name to show, act(item) opens it, nextEvent() the next
// event ({ title, countdown }) or null. items(): [{ name (the item, for describe), label, reason, go() }]; about(onChange): the fold with the note
// and the reset.
export function initRecommendations({ getLang, explorer, data, nameOf, act, nextEvent }) {
  const t = () => RECO_TEXT[getLang()] ?? RECO_TEXT.en;
  const el = (tag, cls, content) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (content != null) e.textContent = content;
    return e;
  };
  let message = "";
  const fmt = (x, d) => x.toLocaleString(getLang(), { maximumFractionDigits: d, minimumFractionDigits: d });

  function reasonText(r) {
    const tx = t();
    if (r.key === "similar") return tx.similar(r.of, fmt(r.radius, 1), fmt(Math.round(r.temp), 0), r.calc);
    if (r.key === "sibling") return tx.sibling(r.of, r.host);
    return tx[r.key];
  }
  function items() {
    const tx = t();
    const state = explorer.getState();
    const { exo, solar } = data();
    const next = nextEvent();
    return recommend({
      interest: explorer.getProfile().interest,
      exo,
      solar,
      history: state.history,
      favourites: state.favourites,
      seen: state.total.planets ?? [],
      seenFigures: state.total.constellations ?? [],
      since: state.recoReset ?? 0,
      hasEvent: !!next,
    }).map((item) => ({
      kind: item.kind,
      name: item.name,
      label: item.kind === "event" && next ? tx.eventLabel(next.title, next.countdown) : nameOf(item),
      reason: reasonText(item.reason),
      go: () => {
        track(`reco-${item.reason.key}`);
        act(item);
      },
    }));
  }
  function about(onChange) {
    const tx = t();
    const reset = el("button", "uni-link", tx.reset);
    reset.type = "button";
    reset.addEventListener("click", () => {
      explorer.update((st) => {
        st.recoReset = Date.now();
      });
      message = tx.resetDone;
      track("reco-reset");
      onChange?.();
    });
    const children = [el("p", "hint", tx.note), reset];
    if (message) children.push(el("p", "account-ok", message));
    return disclosure("reco-about", tx.about, children);
  }
  return { items, about, title: () => t().title };
}
