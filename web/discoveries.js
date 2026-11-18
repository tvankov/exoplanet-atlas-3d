// SPACE DISCOVERIES: a library of discoveries in My Universe (area Explore). Each discovery is one file in web/data/discoveries/entries/
// (reviewed like code: a pull request is the review, the history of git is the revision history); src/build_discoveries.py checks every
// file and writes web/data/discoveries/index.json, the list that the library loads first. A discovery is opened from the list or by the
// address ?d=<id> (main.js). Its parts: the status (confirmed, candidate, open question), the facts with the kind of evidence of each
// (observed, measured, interpreted, unknown) and its source, the text in sections, the links to the 3D explorer (only to objects the map
// really has: no coordinates are made up) and to the learning steps. The texts of a discovery are in English and German for now; in
// Japanese and Bulgarian the English text is shown and the page says so. The pure parts (validEntry, matches) are tested in
// tests/discoveries.test.mjs.

import { track } from "./stats.js";

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
const SECTIONS = ["overview", "history", "explanation", "howWeKnow", "special"];

export const DISCOVERY_TEXT = {
  en: {
    title: "Discoveries", intro: "A library of discoveries in space, each with its status, its evidence and its sources.",
    search: "Search discoveries", all: "All", categories: "Categories", types: "Kinds", statusLabel: "Status", none: "No discovery matches.",
    count: (n) => `${n} ${n === 1 ? "discovery" : "discoveries"}`, back: "All discoveries", loading: "Loading ...", failed: "The library could not be loaded.",
    overview: "Overview", takeaways: "Key takeaways", history: "Discovery history", explanation: "Scientific explanation", facts: "Physical characteristics",
    howWeKnow: "How do we know?", special: "What makes it special?", openQuestions: "Open questions", explore: "Explore in SPACE", related: "Related",
    sources: "Sources and references", dates: "Dates", discovered: "Discovered", published: "In the library since", updated: "Last scientific update",
    unknownDate: "not given", show3d: (name) => `Show ${name} in 3D`, learnStep: (title) => `Learning step: ${title}`, onlyEnglish: "This entry is in English only for now.",
    source: "Source", noLink: "The map has no object of its own for this discovery.",
  },
  de: {
    title: "Entdeckungen", intro: "Eine Bibliothek der Entdeckungen im All, jede mit ihrem Status, ihren Belegen und ihren Quellen.",
    search: "Entdeckungen suchen", all: "Alle", categories: "Kategorien", types: "Arten", statusLabel: "Status", none: "Keine Entdeckung passt.",
    count: (n) => `${n} ${n === 1 ? "Entdeckung" : "Entdeckungen"}`, back: "Alle Entdeckungen", loading: "Wird geladen ...", failed: "Die Bibliothek konnte nicht geladen werden.",
    overview: "Überblick", takeaways: "Das Wichtigste", history: "Geschichte der Entdeckung", explanation: "Wissenschaftliche Erklärung", facts: "Eigenschaften",
    howWeKnow: "Woher wissen wir das?", special: "Was macht es besonders?", openQuestions: "Offene Fragen", explore: "In SPACE erkunden", related: "Dazu passend",
    sources: "Quellen und Belege", dates: "Daten", discovered: "Entdeckt", published: "In der Bibliothek seit", updated: "Letzte wissenschaftliche Änderung",
    unknownDate: "nicht angegeben", show3d: (name) => `${name} in 3D zeigen`, learnStep: (title) => `Lernschritt: ${title}`, onlyEnglish: "Diesen Eintrag gibt es vorerst nur auf Englisch.",
    source: "Quelle", noLink: "Für diese Entdeckung hat die Karte kein eigenes Objekt.",
  },
  ja: {
    title: "発見", intro: "宇宙の発見のライブラリーです。どれにも、その状態、証拠、出典があります。",
    search: "発見をさがす", all: "すべて", categories: "カテゴリー", types: "種類", statusLabel: "状態", none: "合う発見がありません。",
    count: (n) => `${n}件の発見`, back: "すべての発見", loading: "読みこみ中...", failed: "ライブラリーを読みこめませんでした。",
    overview: "概要", takeaways: "大事なポイント", history: "発見の歴史", explanation: "科学的な説明", facts: "性質",
    howWeKnow: "なぜわかるのか？", special: "何が特別なのか？", openQuestions: "未解決の問い", explore: "SPACEで探検", related: "関連",
    sources: "出典と参考資料", dates: "日付", discovered: "発見", published: "ライブラリーに追加", updated: "最新の科学的な更新",
    unknownDate: "記載なし", show3d: (name) => `${name}を3Dで見る`, learnStep: (title) => `学習ステップ：${title}`, onlyEnglish: "この項目は、いまは英語だけです。",
    source: "出典", noLink: "この発見には、地図に専用の天体がありません。",
  },
  bg: {
    title: "Открития", intro: "Библиотека на откритията в космоса, всяко със статуса си, доказателствата си и източниците си.",
    search: "Търси открития", all: "Всички", categories: "Категории", types: "Видове", statusLabel: "Статус", none: "Няма подходящо откритие.",
    count: (n) => `${n} ${n === 1 ? "откритие" : "открития"}`, back: "Всички открития", loading: "Зарежда се ...", failed: "Библиотеката не можа да се зареди.",
    overview: "Преглед", takeaways: "Най-важното", history: "История на откритието", explanation: "Научно обяснение", facts: "Свойства",
    howWeKnow: "Откъде знаем това?", special: "Какво го прави специално?", openQuestions: "Открити въпроси", explore: "Разгледай в SPACE", related: "Свързано",
    sources: "Източници и препратки", dates: "Дати", discovered: "Открито", published: "В библиотеката от", updated: "Последна научна промяна",
    unknownDate: "не е посочено", show3d: (name) => `${name} в 3D`, learnStep: (title) => `Учебна стъпка: ${title}`, onlyEnglish: "Засега този запис е само на английски.",
    source: "Източник", noLink: "За това откритие картата няма собствен обект.",
  },
};

const labelOf = (list, id, lang) => list.find((x) => x.id === id)?.[lang] ?? list.find((x) => x.id === id)?.en ?? id;
const isDate = (d) => d === null || /^\d{4}(-\d{2}(-\d{2})?)?$/.test(d);

// What is wrong with an entry (an empty list: nothing). knownSteps: the ids of the learning steps; knownPlace(kind, id): whether the map has it.
export function validEntry(e, { knownSteps = null, knownPlace = null, ids = null } = {}) {
  const errors = [];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id ?? "")) errors.push("id");
  if (!e.categories?.length || e.categories.some((c) => !CATEGORIES.some((x) => x.id === c))) errors.push("categories");
  if (!TYPES.some((x) => x.id === e.type)) errors.push("type");
  if (!STATUS.some((x) => x.id === e.status)) errors.push("status");
  for (const k of ["discovered", "published", "updated"]) if (!isDate(e.dates?.[k])) errors.push(`dates.${k}`); // the discovery date may be null (not known)
  if (!e.dates?.published || !e.dates?.updated) errors.push("dates");
  const sources = e.sources ?? [];
  if (!sources.length) errors.push("sources");
  for (const s of sources) if (!s.id || !/^https:\/\//.test(s.url ?? "") || !s.title || !s.publisher) errors.push(`source ${s.id}`);
  const sourceIds = new Set(sources.map((s) => s.id));
  for (const f of e.facts ?? []) {
    if (!EVIDENCE.some((x) => x.id === f.evidence)) errors.push(`fact ${f.key} evidence`);
    if (!sourceIds.has(f.source)) errors.push(`fact ${f.key} source`);
    for (const lang of ENTRY_LANGS) if (!f.label?.[lang] || !f.value?.[lang]) errors.push(`fact ${f.key} ${lang}`);
  }
  for (const lang of ENTRY_LANGS) {
    const tx = e.text?.[lang];
    if (!tx?.title || !tx.summary) errors.push(`text ${lang}`);
    for (const k of SECTIONS) if (!tx?.[k]) errors.push(`text ${lang} ${k}`);
    if (!(tx?.takeaways?.length >= 5 && tx.takeaways.length <= 7)) errors.push(`text ${lang} takeaways`);
    if (!Array.isArray(tx?.openQuestions)) errors.push(`text ${lang} openQuestions`);
    if (JSON.stringify(tx ?? "").includes("—")) errors.push(`text ${lang} dash`);
  }
  for (const link of e.explorer ?? []) {
    if (!EXPLORER_KINDS.includes(link.kind)) errors.push(`explorer kind ${link.kind}`);
    else if (knownPlace && !knownPlace(link.kind, link.id)) errors.push(`explorer ${link.kind} ${link.id}`);
  }
  if (knownSteps) for (const step of e.learn ?? []) if (!knownSteps.has(step)) errors.push(`learn ${step}`);
  if (ids) for (const r of e.related ?? []) if (!ids.has(r) || r === e.id) errors.push(`related ${r}`);
  return errors;
}

// Whether an entry of the index fits the search text and the filters (category, type, status; null: any)
export function matches(item, { query = "", category = null, type = null, status = null } = {}, lang = "en") {
  if (category && !item.categories.includes(category)) return false;
  if (type && item.type !== type) return false;
  if (status && item.status !== status) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const words = [item.title?.[lang], item.title?.en, item.summary?.[lang], item.summary?.en, ...(item.aliases ?? [])].filter(Boolean).join(" ").toLowerCase();
  return q.split(/\s+/).every((w) => words.includes(w));
}

// getLang(); show(link): fly to a link of the explorer ({ kind, id }); openStep(step): open a learning step; stepTitle(step): its title
export function initDiscoveries({ getLang, show, openStep, stepTitle }) {
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
  const filter = { query: "", category: null, type: null, status: null };
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
    if (entries[id]) return;
    try {
      entries[id] = await (await fetch(`data/discoveries/entries/${id}.json`)).json();
    } catch {
      entries[id] = "failed";
    }
    redraw?.();
  }
  const textOf = (e) => e.text[getLang()] ?? e.text.en;
  const chip = (label, on, fn) => button(label, `disc-chip${on ? " on" : ""}`, fn);
  const statusBadge = (status) => el("span", `disc-status disc-status-${status}`, labelOf(STATUS, status, getLang()));

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
      results.replaceChildren(el("p", "hint", tx.count(found.length)));
      if (!found.length) results.append(el("p", "hint", tx.none));
      for (const item of found) {
        const card = el("button", "disc-card");
        card.type = "button";
        const head = el("span", "disc-card-head");
        head.append(statusBadge(item.status), el("small", "", item.categories.map((c) => labelOf(CATEGORIES, c, lang)).join(" · ")));
        card.append(head, el("strong", "", item.title[lang] ?? item.title.en), el("span", "", item.summary[lang] ?? item.summary.en));
        card.addEventListener("click", () => open(item.id));
        results.append(card);
      }
    };
    search.addEventListener("input", () => ((filter.query = search.value), drawResults()));
    const cats = el("div", "disc-chips");
    cats.append(chip(tx.all, !filter.category, () => ((filter.category = null), redraw?.())));
    for (const c of CATEGORIES) cats.append(chip(c[lang] ?? c.en, filter.category === c.id, () => ((filter.category = filter.category === c.id ? null : c.id), redraw?.())));
    const kinds = el("div", "disc-chips");
    kinds.append(chip(tx.all, !filter.type && !filter.status, () => ((filter.type = null), (filter.status = null), redraw?.())));
    for (const s of STATUS) kinds.append(chip(s[lang] ?? s.en, filter.status === s.id, () => ((filter.status = filter.status === s.id ? null : s.id), redraw?.())));
    for (const ty of TYPES.filter((x) => index.entries.some((i) => i.type === x.id)))
      kinds.append(chip(ty[lang] ?? ty.en, filter.type === ty.id, () => ((filter.type = filter.type === ty.id ? null : ty.id), redraw?.())));
    drawResults();
    return [...parts, search, el("h4", "learn-part", tx.categories), cats, el("h4", "learn-part", `${tx.statusLabel} · ${tx.types}`), kinds, results];
  }

  function section(title, ...children) {
    const s = el("section", "disc-section");
    s.append(el("h4", "learn-part", title), ...children);
    return s;
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
    const text = textOf(e);
    const parts = [back];
    const head = el("div", "disc-head");
    const tags = el("div", "disc-card-head");
    tags.append(statusBadge(e.status), el("small", "", [labelOf(TYPES, e.type, lang), ...e.categories.map((c) => labelOf(CATEGORIES, c, lang))].join(" · ")));
    head.append(tags, el("h3", "learn-title", text.title), el("p", "learn-goal", text.summary));
    parts.push(head);
    if (!e.text[lang]) parts.push(el("p", "hint", tx.onlyEnglish));
    const para = (s) => el("p", "learn-text", s);
    parts.push(section(tx.overview, para(text.overview)));
    const take = el("ul", "learn-remember-list");
    for (const k of text.takeaways) take.append(el("li", "", k));
    parts.push(section(tx.takeaways, take));
    parts.push(section(tx.history, para(text.history)), section(tx.explanation, para(text.explanation)));
    if (e.facts?.length) {
      const table = el("div", "disc-facts");
      for (const f of e.facts) {
        const row = el("div", "disc-fact");
        const src = e.sources.find((s) => s.id === f.source);
        row.append(el("span", "disc-fact-label", f.label[lang] ?? f.label.en), el("strong", "", f.value[lang] ?? f.value.en));
        const meta = el("small", "", `${labelOf(EVIDENCE, f.evidence, lang)} · ${tx.source}: ${src?.publisher ?? f.source}`);
        row.append(meta);
        table.append(row);
      }
      parts.push(section(tx.facts, table));
    }
    parts.push(section(tx.howWeKnow, para(text.howWeKnow)), section(tx.special, para(text.special)));
    if (text.openQuestions.length) {
      const list = el("ul", "learn-remember-list");
      for (const q of text.openQuestions) list.append(el("li", "", q));
      parts.push(section(tx.openQuestions, list));
    }
    // into the 3D explorer, only to what the map really has
    const go = el("div", "disc-links");
    for (const link of e.explorer ?? []) go.append(button(tx.show3d(link.label?.[lang] ?? link.label?.en ?? link.id), "uni-primary", () => (track(`discovery-3d-${e.id}`), show?.(link))));
    if (!e.explorer?.length) go.append(el("p", "hint", tx.noLink));
    parts.push(section(tx.explore, go));
    const rel = el("div", "disc-links");
    for (const step of e.learn ?? []) rel.append(button(tx.learnStep(stepTitle?.(step) ?? step), "uni-link", () => openStep?.(step)));
    for (const r of e.related ?? []) {
      const item = index !== "failed" ? index?.entries.find((x) => x.id === r) : null;
      rel.append(button(item?.title[lang] ?? item?.title.en ?? r, "uni-link", () => open(r)));
    }
    if (rel.children.length) parts.push(section(tx.related, rel));
    const dates = el("p", "hint", [
      `${tx.discovered}: ${e.dates.discovered ?? tx.unknownDate}`,
      `${tx.published}: ${e.dates.published}`,
      `${tx.updated}: ${e.dates.updated}`,
    ].join(" · "));
    parts.push(section(tx.dates, dates));
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
    parts.push(section(tx.sources, list));
    return parts;
  }

  // open an entry (from the list, a related link or the address ?d=<id>): false if the id is not a valid one
  function open(id) {
    if (!/^[a-z0-9-]+$/.test(id ?? "")) return false;
    view = id;
    track(`discovery-open-${id}`);
    loadIndex();
    redraw?.();
    return true;
  }
  return {
    // the nodes for the area Explore; overview: the list is shown (the area adds its own parts), otherwise only the entry
    area(onChange) {
      redraw = onChange;
      return view === "list" ? { overview: true, nodes: listView() } : { overview: false, nodes: entryView(view) };
    },
    open,
    title: () => t().title,
  };
}
