// Events in the sky: the next eclipses and meteor showers, with the date and time in the local time of the visitor, a countdown, a short text,
// the source, and a button that shows the Earth in 3D. The events are written by hand in data/events.json from the sources named there (NASA
// eclipse tables, the meteor shower calendars of the IMO); nothing is made up by the program. A calculated event (an eclipse) is told apart from an
// expected one (the maximum of a meteor shower, which can shift by hours). Past events are not shown. If the file cannot be read, the card says
// nothing and the panel is empty. Times are stored in UT (UTC) and shown in the time zone of the browser.

import { track } from "./stats.js";

const DAY = 86400000;
const ONGOING = 6 * 3600000; // an event with a time counts as running for six hours

// The moment an event starts: a time (utc), or the beginning of a day (date, for the events whose time is not given exactly).
export const startOf = (e) => (e.utc ? Date.parse(e.utc) : Date.parse(`${e.date}T00:00:00Z`));
export const endOf = (e) => (e.utc ? startOf(e) + ONGOING : startOf(e) + DAY);

// The events that are not over, the next one first.
export function upcomingEvents(events, now = Date.now()) {
  return events.filter((e) => endOf(e) > now).sort((a, b) => startOf(a) - startOf(b));
}
// Whole days from now to the start (0 when it is today or running now, never negative).
export function daysUntil(e, now = Date.now()) {
  return Math.max(0, Math.ceil((startOf(e) - now) / DAY));
}

export const EVENTS_TEXT = {
  en: {
    kicker: "Sky events",
    cardEmpty: "Eclipses and meteors",
    title: "Events in the sky",
    intro: "The next eclipses and meteor showers. Times are shown in your local time.",
    empty: "There is nothing to show at the moment.",
    calculated: "Calculated",
    calculatedHint: "Eclipses are calculated for the second.",
    expected: "Expected",
    expectedHint: "The maximum of a meteor shower is a calendar value and can shift by hours.",
    dayOnly: "Date only",
    source: "Source",
    show3d: "Show the Earth in 3D",
    enOnly: "This text is only available in English.",
    close: "Close",
    now: "now",
    today: "today",
  },
  de: {
    kicker: "Ereignisse",
    cardEmpty: "Finsternisse und Meteore",
    title: "Ereignisse am Himmel",
    intro: "Die nächsten Finsternisse und Meteorströme. Die Zeiten stehen in deiner Ortszeit.",
    empty: "Im Moment gibt es nichts anzuzeigen.",
    calculated: "Berechnet",
    calculatedHint: "Finsternisse werden auf die Sekunde berechnet.",
    expected: "Erwartet",
    expectedHint: "Das Maximum eines Meteorstroms ist ein Kalenderwert und kann um Stunden abweichen.",
    dayOnly: "Nur das Datum",
    source: "Quelle",
    show3d: "Die Erde in 3D zeigen",
    enOnly: "Dieser Text gibt es nur auf Englisch.",
    close: "Schließen",
    now: "jetzt",
    today: "heute",
  },
  ja: {
    kicker: "天文イベント",
    cardEmpty: "食と流星群",
    title: "空のできごと",
    intro: "次の食と流星群です。時刻はお使いの地域の時刻で表示されます。",
    empty: "いま表示できるものはありません。",
    calculated: "計算値",
    calculatedHint: "食は秒単位で計算されています。",
    expected: "予想",
    expectedHint: "流星群の極大はカレンダー上の値で、数時間ずれることがあります。",
    dayOnly: "日付のみ",
    source: "出典",
    show3d: "地球を3Dで見る",
    enOnly: "このテキストは英語のみです。",
    close: "閉じる",
    now: "いま",
    today: "今日",
  },
  bg: {
    kicker: "Събития",
    cardEmpty: "Затъмнения и метеори",
    title: "Събития в небето",
    intro: "Следващите затъмнения и метеорни потоци. Часовете са във вашето местно време.",
    empty: "В момента няма какво да се покаже.",
    calculated: "Изчислено",
    calculatedHint: "Затъмненията се изчисляват до секундата.",
    expected: "Очаква се",
    expectedHint: "Максимумът на метеорен поток е календарна стойност и може да се измести с часове.",
    dayOnly: "Само датата",
    source: "Източник",
    show3d: "Покажи Земята в 3D",
    enOnly: "Този текст е само на английски.",
    close: "Затвори",
    now: "сега",
    today: "днес",
  },
};

// getLang() is the language of the page, explore(name) flies to a place on the map.
export async function initEvents({ getLang, explore }) {
  let data = { events: [], sources: {} };
  try {
    data = await (await fetch("data/events.json")).json();
  } catch {
    // no events: the card and the panel say nothing
  }
  const panel = document.getElementById("sky-panel");
  const body = document.getElementById("sky-body");
  const card = document.getElementById("dock-sky");
  const t = () => EVENTS_TEXT[getLang()] ?? EVENTS_TEXT.en;
  const pick = (value) => value?.[getLang()] ?? value?.en ?? "";
  const lang = () => (getLang() === "bg" || getLang() === "ja" || getLang() === "de" ? getLang() : "en");

  const el = (tag, cls, content) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (content != null) e.textContent = content;
    return e;
  };
  // "in 29 days", "tomorrow", in the language of the page; "today" when it is today or running
  function countdown(e) {
    const days = daysUntil(e);
    if (startOf(e) <= Date.now() && endOf(e) > Date.now()) return t().now;
    if (days === 0) return t().today;
    return new Intl.RelativeTimeFormat(lang(), { numeric: "auto" }).format(days, "day");
  }
  function whenText(e) {
    if (e.utc) {
      return new Intl.DateTimeFormat(lang(), { weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(e.utc));
    }
    // a date without a time: the date as it is, not moved by the time zone
    return new Intl.DateTimeFormat(lang(), { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${e.date}T12:00:00Z`));
  }

  // ---------------------------------------------------------------- the card of the dock
  function renderCard() {
    const next = upcomingEvents(data.events)[0];
    document.getElementById("dock-sky-k").textContent = t().kicker;
    document.getElementById("dock-sky-t").textContent = next ? `${pick(next.title)} · ${countdown(next)}` : t().cardEmpty;
  }

  // ---------------------------------------------------------------- the panel
  function render() {
    renderCard();
    if (panel.hidden) return;
    const tx = t();
    document.getElementById("sky-title").textContent = tx.title;
    document.getElementById("sky-close").setAttribute("aria-label", tx.close);
    const parts = [el("p", "hint", tx.intro)];
    const list = upcomingEvents(data.events);
    if (!list.length) parts.push(el("p", "", tx.empty));
    for (const e of list) {
      const item = el("article", `sky-event ${e.kind}`);
      const head = el("div", "sky-head");
      head.append(el("strong", "", pick(e.title)), el("span", "sky-count", countdown(e)));
      const meta = el("div", "sky-meta");
      meta.append(el("span", "", whenText(e)));
      const badge = el("span", `sky-badge ${e.certainty}`, e.certainty === "calculated" ? tx.calculated : tx.expected);
      badge.title = e.certainty === "calculated" ? tx.calculatedHint : tx.expectedHint;
      meta.append(badge);
      if (!e.utc) meta.append(el("span", "sky-badge", tx.dayOnly));
      item.append(head, meta, el("p", "", pick(e.text)));
      if (!e.text?.[getLang()]) item.append(el("p", "hint", tx.enOnly));
      const foot = el("div", "sky-foot");
      const source = data.sources?.[e.source];
      if (source) {
        const link = el("a", "", `${tx.source}: ${source.name}`);
        link.href = source.url;
        link.target = "_blank";
        link.rel = "noopener";
        foot.append(link);
      }
      const show = el("button", "sky-show", tx.show3d);
      show.type = "button";
      show.addEventListener("click", () => {
        track("sky-show-3d");
        toggle(false);
        explore("Earth");
      });
      foot.append(show);
      item.append(foot);
      parts.push(item);
    }
    body.replaceChildren(...parts);
  }

  function toggle(open = panel.hidden) {
    panel.hidden = !open;
    card.setAttribute("aria-expanded", String(open));
    if (open) render();
  }
  card.addEventListener("click", () => toggle());
  document.getElementById("sky-close").addEventListener("click", () => toggle(false));
  window.addEventListener("keydown", (e) => e.key === "Escape" && !panel.hidden && toggle(false));
  render();
  return {
    render,
    open: () => toggle(true),
    // the next event, for the flight of the day: its title, when (local time), the countdown and its text, in the language of the page
    nextInfo: () => {
      const e = upcomingEvents(data.events)[0];
      return e ? { title: pick(e.title), when: whenText(e), countdown: countdown(e), text: pick(e.text) } : null;
    },
  };
}
