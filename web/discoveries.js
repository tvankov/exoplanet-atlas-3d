// SPACE DISCOVERIES: a library of discoveries in My Universe (area Explore). A discovery is a flight with a story: "Fly there" starts the
// real trip of the planner from the Earth to it (hyperspace, the travel time at the speed of light) when the map has its star, otherwise a
// soft flight; after the arrival the story runs in stages, each with its own view of the camera (a soft flight again), two
// or three sentences and a number. The science stays, folded under "How sure is this?": the status (confirmed, candidate, open question),
// the facts with the kind of evidence of each (observed, measured, interpreted, unknown) and its source, the dates and the sources.
// Each discovery is one file in web/data/discoveries/entries/ (reviewed like code: a pull request is the review, git is the history);
// src/build_discoveries.py checks every file and writes index.json, the list that the library loads first. An entry opens from the list
// or by the address ?d=<id> (main.js). The texts are in English and German for now; Japanese and Bulgarian show the English text and say
// so. The links lead only to what the map really has (no coordinates are made up). The pure parts (validEntry, matches, fillNumbers) are
// tested in tests/discoveries.test.mjs.

import { track } from "./stats.js";
import { starCanvas, medalCanvas } from "./sharecard.js";

export const CATEGORIES = [
  { id: "interstellar", en: "Interstellar objects", de: "Interstellare Objekte", ja: "恒星間天体", bg: "Междузвездни обекти" },
  { id: "hidden-worlds", en: "Hidden worlds", de: "Verborgene Welten", ja: "隠れた世界", bg: "Скрити светове" },
  { id: "exoplanets", en: "Exoplanet worlds", de: "Exoplaneten", ja: "系外惑星の世界", bg: "Екзопланети" },
  { id: "mysteries", en: "Cosmic mysteries", de: "Kosmische Rätsel", ja: "宇宙の謎", bg: "Космически загадки" },
  { id: "stellar", en: "Stellar phenomena", de: "Sternphänomene", ja: "恒星の現象", bg: "Звездни явления" },
  { id: "deep-time", en: "Deep time and distant galaxies", de: "Tiefe Zeit und ferne Galaxien", ja: "遠い過去と遠い銀河", bg: "Дълбоко време и далечни галактики" },
  { id: "humanity", en: "Humanity in space", de: "Menschheit im All", ja: "宇宙の人類", bg: "Човечеството в космоса" },
  { id: "mapping", en: "Cosmic mapping", de: "Kartierung des Kosmos", ja: "宇宙の地図", bg: "Картографиране на космоса" },
];
export const TYPES = [
  { id: "object", en: "Celestial object", de: "Himmelskörper", ja: "天体", bg: "Небесно тяло" },
  { id: "event", en: "Cosmic event", de: "Kosmisches Ereignis", ja: "宇宙の出来事", bg: "Космическо събитие" },
  { id: "mission", en: "Space mission", de: "Raumfahrtmission", ja: "宇宙ミッション", bg: "Космическа мисия" },
  { id: "discovery", en: "Scientific discovery", de: "Wissenschaftliche Entdeckung", ja: "科学的発見", bg: "Научно откритие" },
  { id: "phenomenon", en: "Cosmic phenomenon", de: "Kosmisches Phänomen", ja: "宇宙の現象", bg: "Космическо явление" },
  { id: "structure", en: "Cosmic structure", de: "Kosmische Struktur", ja: "宇宙の構造", bg: "Космическа структура" },
  { id: "mystery", en: "Unsolved mystery", de: "Ungelöstes Rätsel", ja: "未解決の謎", bg: "Неразгадана загадка" },
];
// the scientific status of a whole entry, and the kind of evidence of a single fact
export const STATUS = [
  { id: "confirmed", en: "Confirmed", de: "Bestätigt", ja: "確認済み", bg: "Потвърдено" },
  { id: "candidate", en: "Candidate", de: "Kandidat", ja: "候補", bg: "Кандидат" },
  { id: "open", en: "Open question", de: "Offene Frage", ja: "未解決の問い", bg: "Открит въпрос" },
];
export const EVIDENCE = [
  { id: "observed", en: "Observed", de: "Beobachtet", ja: "観測", bg: "Наблюдавано" },
  { id: "measured", en: "Measured", de: "Gemessen", ja: "測定", bg: "Измерено" },
  { id: "interpreted", en: "Interpreted", de: "Gedeutet", ja: "解釈", bg: "Тълкувано" },
  { id: "unknown", en: "Unknown", de: "Unbekannt", ja: "不明", bg: "Неизвестно" },
];
// the kinds of link into the 3D explorer: a place resolvePlace knows (a planet, a star, an exoplanet), a moon of moons.js, a constellation
// (the view from the Earth into it)
export const EXPLORER_KINDS = ["place", "moon", "sky"];
// the languages a text of a discovery must have; the others show English
export const ENTRY_LANGS = ["en", "de"];

export const DISCOVERY_TEXT = {
  en: {
    title: "Discoveries", intro: "Fly to a discovery and see it for yourself. Each one tells its story on the way.",
    search: "Search discoveries", all: "All", none: "No discovery matches.", back: "All discoveries", loading: "Loading ...", failed: "The library could not be loaded.",
    fly: "Fly there", flyAgain: "Fly there again", stage: (n, all) => `Stage ${n} of ${all}`, next: "Next", prev: "Back",
    sure: "How sure is this?", takeaways: "In short", facts: "Facts", sources: "Sources", dates: "Dates", discovered: "Discovered",
    published: "In the library since", updated: "Last scientific update", unknownDate: "not given", learnStep: (title) => `Learning step: ${title}`,
    onlyEnglish: "This entry is in English only for now.", source: "Source", openQuestions: "Still open",
  },
  de: {
    title: "Entdeckungen", intro: "Flieg zu einer Entdeckung und sieh sie dir selbst an. Jede erzählt unterwegs ihre Geschichte.",
    search: "Entdeckungen suchen", all: "Alle", none: "Keine Entdeckung passt.", back: "Alle Entdeckungen", loading: "Wird geladen ...", failed: "Die Bibliothek konnte nicht geladen werden.",
    fly: "Hinfliegen", flyAgain: "Noch einmal hinfliegen", stage: (n, all) => `Etappe ${n} von ${all}`, next: "Weiter", prev: "Zurück",
    sure: "Wie sicher ist das?", takeaways: "Kurz gesagt", facts: "Fakten", sources: "Quellen", dates: "Daten", discovered: "Entdeckt",
    published: "In der Bibliothek seit", updated: "Letzte wissenschaftliche Änderung", unknownDate: "nicht angegeben", learnStep: (title) => `Lernschritt: ${title}`,
    onlyEnglish: "Diesen Eintrag gibt es vorerst nur auf Englisch.", source: "Quelle", openQuestions: "Noch offen",
  },
  ja: {
    title: "発見", intro: "発見の場所へ飛んで、自分の目で見てみましょう。どの発見も、旅のとちゅうで物語を語ります。",
    search: "発見をさがす", all: "すべて", none: "合う発見がありません。", back: "すべての発見", loading: "読みこみ中...", failed: "ライブラリーを読みこめませんでした。",
    fly: "飛んでいく", flyAgain: "もう一度飛んでいく", stage: (n, all) => `${all}つのうち${n}つめ`, next: "次へ", prev: "もどる",
    sure: "どれくらい確か？", takeaways: "まとめ", facts: "データ", sources: "出典", dates: "日付", discovered: "発見",
    published: "ライブラリーに追加", updated: "最新の科学的な更新", unknownDate: "記載なし", learnStep: (title) => `学習ステップ：${title}`,
    onlyEnglish: "この項目は、いまは英語だけです。", source: "出典", openQuestions: "まだわからないこと",
  },
  bg: {
    title: "Открития", intro: "Полети до откритие и го виж сам. Всяко разказва историята си по пътя.",
    search: "Търси открития", all: "Всички", none: "Няма подходящо откритие.", back: "Всички открития", loading: "Зарежда се ...", failed: "Библиотеката не можа да се зареди.",
    fly: "Полети натам", flyAgain: "Полети отново", stage: (n, all) => `Етап ${n} от ${all}`, next: "Напред", prev: "Назад",
    sure: "Колко сигурно е това?", takeaways: "Накратко", facts: "Факти", sources: "Източници", dates: "Дати", discovered: "Открито",
    published: "В библиотеката от", updated: "Последна научна промяна", unknownDate: "не е посочено", learnStep: (title) => `Учебна стъпка: ${title}`,
    onlyEnglish: "Засега този запис е само на английски.", source: "Източник", openQuestions: "Още открито",
  },
};

const labelOf = (list, id, lang) => list.find((x) => x.id === id)?.[lang] ?? list.find((x) => x.id === id)?.en ?? id;
const isDate = (d) => d === null || /^\d{4}(-\d{2}(-\d{2})?)?$/.test(d);

// The numbers in a stage that are worked out when it is shown: {since:369} is the year the light set off that arrives now from 369 light
// years away (this year minus 369), {years:27000} the number of years, formatted for the language.
export function fillNumbers(text, lang, thisYear = new Date().getFullYear()) {
  return text
    .replace(/\{since:(\d+)\}/g, (_, ly) => String(thisYear - Number(ly)))
    .replace(/\{years:(\d+)\}/g, (_, ly) => Number(ly).toLocaleString(lang));
}

// What is wrong with an entry (an empty list: nothing). knownSteps: the ids of the learning steps; knownPlace(kind, id): whether the map has it.
export function validEntry(e, { knownSteps = null, knownPlace = null, ids = null } = {}) {
  const errors = [];
  const link = (where, l) => {
    if (!EXPLORER_KINDS.includes(l?.kind)) errors.push(`${where} kind ${l?.kind}`);
    else if (knownPlace && !knownPlace(l.kind, l.id)) errors.push(`${where} ${l.kind} ${l.id}`);
  };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id ?? "")) errors.push("id");
  if (!e.categories?.length || e.categories.some((c) => !CATEGORIES.some((x) => x.id === c))) errors.push("categories");
  if (!TYPES.some((x) => x.id === e.type)) errors.push("type");
  if (!STATUS.some((x) => x.id === e.status)) errors.push("status");
  for (const k of ["discovered", "published", "updated"]) if (!isDate(e.dates?.[k])) errors.push(`dates.${k}`); // the discovery date may be null (not known)
  if (!e.dates?.published || !e.dates?.updated) errors.push("dates");
  if (!(e.picture?.medal || Number.isFinite(e.picture?.star))) errors.push("picture");
  link("fly", e.fly);
  const sources = e.sources ?? [];
  if (!sources.length) errors.push("sources");
  for (const s of sources) if (!s.id || !/^https:\/\//.test(s.url ?? "") || !s.title || !s.publisher) errors.push(`source ${s.id}`);
  const sourceIds = new Set(sources.map((s) => s.id));
  for (const f of e.facts ?? []) {
    if (!EVIDENCE.some((x) => x.id === f.evidence)) errors.push(`fact ${f.key} evidence`);
    if (!sourceIds.has(f.source)) errors.push(`fact ${f.key} source`);
    for (const lang of ENTRY_LANGS) if (!f.label?.[lang] || !f.value?.[lang]) errors.push(`fact ${f.key} ${lang}`);
  }
  if (!(e.stages?.length >= 3 && e.stages.length <= 5)) errors.push("stages");
  for (const [i, st] of (e.stages ?? []).entries()) {
    link(`stage ${i + 1}`, st.view);
    for (const lang of ENTRY_LANGS) if (!st[lang]?.title || !st[lang]?.text) errors.push(`stage ${i + 1} ${lang}`);
    if (!st.sources?.length) errors.push(`stage ${i + 1} sources`);
    for (const id of st.sources ?? []) if (!sourceIds.has(id)) errors.push(`stage ${i + 1} source ${id}`);
  }
  for (const lang of ENTRY_LANGS) {
    const tx = e.text?.[lang];
    if (!tx?.title || !tx.hook || !tx.summary) errors.push(`text ${lang}`);
    if (!(tx?.takeaways?.length >= 3 && tx.takeaways.length <= 7)) errors.push(`text ${lang} takeaways`);
    if (!Array.isArray(tx?.openQuestions)) errors.push(`text ${lang} openQuestions`);
  }
  if (JSON.stringify(e).includes("—")) errors.push("dash");
  if (knownSteps) for (const step of e.learn ?? []) if (!knownSteps.has(step)) errors.push(`learn ${step}`);
  if (ids) for (const r of e.related ?? []) if (!ids.has(r) || r === e.id) errors.push(`related ${r}`);
  return errors;
}

// Whether an entry of the index fits the search text and the category (null: any)
export function matches(item, { query = "", category = null } = {}, lang = "en") {
  if (category && !item.categories.includes(category)) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const words = [item.title?.[lang], item.title?.en, item.hook?.[lang], item.hook?.en, item.summary?.[lang], item.summary?.en, ...(item.aliases ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((w) => words.includes(w));
}

// getLang(); fly(link, done): the trip of the planner to the place (or a soft flight where there is no trip), done() after the arrival;
// show(link): the soft flight of a stage; openStep(step), stepTitle(step): the learning steps; closePanel(), openEntry(id): My Universe.
export function initDiscoveries({ getLang, fly, show, openStep, stepTitle, closePanel, openEntry }) {
  const t = () => DISCOVERY_TEXT[getLang()] ?? DISCOVERY_TEXT.en;
  const el = (tag, cls, content) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (content != null) e.textContent = content;
    return e;
  };
  const button = (label, cls, fn) => {
    const b = el("button", cls, label);
    b.type = "button";
    b.addEventListener("click", fn);
    return b;
  };
  let index = null; // the list, once loaded; "failed" if it could not be
  const entries = {}; // the opened entries, by id
  let view = "list"; // "list" or the id of an entry
  const stageOf = {}; // the stage shown, by entry
  const flown = new Set(); // the entries flown to: their big "Fly there" goes
  const filter = { query: "", category: null };
  let redraw = null;

  async function loadIndex() {
    if (index) return;
    try {
      index = await (await fetch("data/discoveries/index.json")).json();
    } catch {
      index = "failed";
    }
    redraw?.();
  }
  async function loadEntry(id) {
    if (entries[id]) return entries[id];
    try {
      entries[id] = await (await fetch(`data/discoveries/entries/${id}.json`)).json();
    } catch {
      entries[id] = "failed";
    }
    redraw?.();
    return entries[id];
  }
  const local = (obj) => obj?.[getLang()] ?? obj?.en;
  const picture = (p, cls, size) => (p?.medal ? medalCanvas(p.medal, cls, size) : starCanvas(p?.star ?? 5772, cls, size));

  // "Fly there": My Universe goes out of the way, the flight runs, and after the arrival the story starts at its first stage
  async function flyTo(id) {
    const e = await loadEntry(id);
    if (!e || e === "failed") return;
    track(`discovery-fly-${id}`);
    view = id;
    stageOf[id] = 0;
    flown.add(id);
    closePanel?.();
    fly?.(e.fly, () => {
      openEntry?.(id);
      show?.(e.stages[0].view);
    });
  }
  function goStage(e, i) {
    stageOf[e.id] = i;
    show?.(e.stages[i].view);
    redraw?.();
  }

  function listView() {
    const tx = t();
    const lang = getLang();
    const parts = [el("p", "uni-area-intro", tx.intro)];
    if (!index) {
      loadIndex();
      return [...parts, el("p", "hint", tx.loading)];
    }
    if (index === "failed") return [...parts, el("p", "hint", tx.failed)];
    const search = el("input", "disc-search");
    search.type = "search";
    search.placeholder = tx.search;
    search.value = filter.query;
    search.setAttribute("aria-label", tx.search);
    const results = el("div", "disc-results");
    const drawResults = () => {
      const found = index.entries.filter((item) => matches(item, filter, lang));
      results.replaceChildren(...(found.length ? [] : [el("p", "hint", tx.none)]));
      for (const item of found) {
        const card = el("div", "disc-card");
        const text = el("div", "disc-card-text");
        text.append(
          el("small", "", item.categories.map((c) => labelOf(CATEGORIES, c, lang)).join(" · ")),
          el("strong", "", local(item.hook)),
          el("span", "", local(item.title))
        );
        const go = button(`${tx.fly} ›`, "uni-primary disc-fly", (ev) => (ev.stopPropagation(), flyTo(item.id)));
        card.append(picture(item.picture, "disc-pic", 64), text, go);
        card.addEventListener("click", () => open(item.id));
        results.append(card);
      }
    };
    search.addEventListener("input", () => ((filter.query = search.value), drawResults()));
    const cats = el("div", "disc-chips");
    const chip = (label, on, fn) => button(label, `disc-chip${on ? " on" : ""}`, fn);
    cats.append(chip(tx.all, !filter.category, () => ((filter.category = null), redraw?.())));
    for (const c of CATEGORIES.filter((x) => index.entries.some((i) => i.categories.includes(x.id))))
      cats.append(chip(c[lang] ?? c.en, filter.category === c.id, () => ((filter.category = filter.category === c.id ? null : c.id), redraw?.())));
    drawResults();
    return [...parts, search, cats, results];
  }

  function entryView(id) {
    const tx = t();
    const lang = getLang();
    const back = button(`‹ ${tx.back}`, "uni-link learn-back", () => ((view = "list"), redraw?.()));
    const e = entries[id];
    if (!e) {
      loadEntry(id);
      return [back, el("p", "hint", tx.loading)];
    }
    if (e === "failed") return [back, el("p", "hint", tx.failed)];
    const text = local(e.text);
    const parts = [back];
    const head = el("div", "disc-hero");
    const ht = el("div", "");
    ht.append(el("small", "", e.categories.map((c) => labelOf(CATEGORIES, c, lang)).join(" · ")), el("h3", "learn-title", text.hook), el("p", "disc-title", text.title));
    head.append(picture(e.picture, "disc-pic", 72), ht);
    parts.push(head);
    if (!e.text[lang]) parts.push(el("p", "hint", tx.onlyEnglish));
    // the story: one stage at a time, its view flown to softly
    const i = stageOf[id] ?? 0;
    const stage = e.stages[i];
    const card = el("div", "disc-stage");
    card.append(el("small", "", tx.stage(i + 1, e.stages.length)), el("h4", "", local(stage).title), el("p", "learn-text", fillNumbers(local(stage).text, lang)));
    const steps = el("div", "disc-steps");
    for (let k = 0; k < e.stages.length; k++) {
      const dot = button(String(k + 1), `disc-dot${k === i ? " on" : ""}`, () => goStage(e, k));
      dot.setAttribute("aria-label", tx.stage(k + 1, e.stages.length));
      steps.append(dot);
    }
    const nav = el("div", "disc-nav");
    nav.append(
      button(`‹ ${tx.prev}`, "uni-link", () => i > 0 && goStage(e, i - 1)),
      steps,
      i < e.stages.length - 1 ? button(`${tx.next} ›`, "uni-primary", () => goStage(e, i + 1)) : button(`${tx.flyAgain} ›`, "uni-link", () => flyTo(id))
    );
    card.append(nav);
    parts.push(card);
    if (i === 0 && !flown.has(id)) parts.push(button(`${tx.fly} ›`, "uni-primary disc-fly-big", () => flyTo(id)));
    const short = el("ul", "learn-remember-list");
    for (const k of text.takeaways) short.append(el("li", "", k));
    parts.push(el("h4", "learn-part", tx.takeaways), short);
    const learnLinks = el("div", "disc-links");
    for (const step of e.learn ?? []) learnLinks.append(button(tx.learnStep(stepTitle?.(step) ?? step), "uni-link", () => openStep?.(step)));
    if (learnLinks.children.length) parts.push(learnLinks);
    // the science, folded: status, facts with their evidence and source, what is still open, the dates and the sources
    const sure = el("details", "disc-sure");
    sure.append(el("summary", "", tx.sure));
    const status = el("p", "");
    status.append(el("span", `disc-status disc-status-${e.status}`, labelOf(STATUS, e.status, lang)), ` ${labelOf(TYPES, e.type, lang)}`);
    sure.append(status, el("p", "hint", text.summary));
    const facts = el("div", "disc-facts");
    for (const f of e.facts ?? []) {
      const row = el("div", "disc-fact");
      const src = e.sources.find((s) => s.id === f.source);
      row.append(el("span", "disc-fact-label", local(f.label)), el("strong", "", local(f.value)), el("small", "", `${labelOf(EVIDENCE, f.evidence, lang)} · ${tx.source}: ${src?.publisher ?? f.source}`));
      facts.append(row);
    }
    if (facts.children.length) sure.append(el("h4", "learn-part", tx.facts), facts);
    if (text.openQuestions.length) {
      const still = el("ul", "learn-remember-list");
      for (const q of text.openQuestions) still.append(el("li", "", q));
      sure.append(el("h4", "learn-part", tx.openQuestions), still);
    }
    sure.append(el("h4", "learn-part", tx.dates), el("p", "hint", [`${tx.discovered}: ${e.dates.discovered ?? tx.unknownDate}`, `${tx.published}: ${e.dates.published}`, `${tx.updated}: ${e.dates.updated}`].join(" · ")));
    const list = el("ol", "disc-sources");
    for (const s of e.sources) {
      const li = el("li", "");
      const a = el("a", "", `${s.publisher}: ${s.title}`);
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener";
      li.append(a, el("small", "", [s.published, s.accessed && `(${s.accessed})`].filter(Boolean).join(" ")));
      list.append(li);
    }
    sure.append(el("h4", "learn-part", tx.sources), list);
    parts.push(sure);
    return parts;
  }

  // open an entry without flying (a card of the list, the address ?d=<id>): its first stage is flown to; false if the id is not a valid one
  function open(id) {
    if (!/^[a-z0-9-]+$/.test(id ?? "")) return false;
    view = id;
    track(`discovery-open-${id}`);
    loadIndex();
    loadEntry(id).then((e) => e && e !== "failed" && show?.(e.stages[stageOf[id] ?? 0].view));
    redraw?.();
    return true;
  }
  return {
    // the nodes for the area Explore; overview: the list is shown (the area adds its own parts), otherwise only the entry
    area(onChange) {
      redraw = onChange;
      return view === "list" ? { overview: true, nodes: listView() } : { overview: false, nodes: entryView(view) };
    },
    // the entry on (after a flight it is already chosen and keeps its stage; from the address it is opened)
    open: (id) => (view === id ? (redraw?.(), true) : open(id)),
    title: () => t().title,
  };
}
