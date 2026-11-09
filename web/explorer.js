// The explorer's log: favourites, the planets looked at lately, and missions. Everything stays in this browser (localStorage "explorer");
// there is no account and nothing is sent anywhere. Missions are plain goals made of what the map already does (look at planets, answer
// the question of the day, fly a trip, measure a distance). A daily mission starts again each local day, a weekly one each week (Monday
// to Sunday), and counts only what happened in that period. The texts of the missions are here in English, German, Japanese and Bulgarian.

import { dayNumber } from "./daily.js";

const KEY = "explorer";
const HISTORY_MAX = 12;

// event: what counts. "planet" is a planet looked at (the story opened), "candidate" the same for a habitable candidate, "answer" the
// question of the day answered, "trip" a trip that arrived, "starTrip" such a trip to another star, "measure" a distance measured,
// "favourite" a planet saved. unique: the goal counts different planets (or places), not the same one again.
export const MISSIONS = [
  {
    id: "d-answer", period: "day", event: "answer", target: 1,
    en: "Answer the question of the day", de: "Beantworte die Frage des Tages", ja: "今日の問いに答える", bg: "Отговори на въпроса на деня",
  },
  {
    id: "d-planets", period: "day", event: "planet", target: 3, unique: true,
    en: "Look at 3 different planets", de: "Sieh dir 3 verschiedene Planeten an", ja: "3つの異なる惑星を見る", bg: "Разгледай 3 различни планети",
  },
  {
    id: "d-trip", period: "day", event: "trip", target: 1,
    en: "Fly a trip with the travel planner", de: "Fliege eine Reise mit dem Reiseplaner", ja: "旅行プランナーで旅をする", bg: "Направи пътуване с планировчика",
  },
  {
    id: "w-candidates", period: "week", event: "candidate", target: 5, unique: true,
    en: "Visit 5 habitable candidates", de: "Besuche 5 bewohnbare Kandidaten", ja: "居住可能な候補を5つ訪れる", bg: "Посети 5 кандидати за обитаеми светове",
  },
  {
    id: "w-measure", period: "week", event: "measure", target: 2,
    en: "Measure the distance between 2 pairs of stars", de: "Miss die Entfernung zwischen 2 Sternpaaren", ja: "2組の恒星の間の距離を測る", bg: "Измери разстоянието между 2 двойки звезди",
  },
  {
    id: "w-star-trip", period: "week", event: "starTrip", target: 1,
    en: "Fly to another star", de: "Fliege zu einem anderen Stern", ja: "別の恒星へ飛ぶ", bg: "Полети до друга звезда",
  },
  {
    id: "w-favourites", period: "week", event: "favourite", target: 3, unique: true,
    en: "Save 3 planets as favourites", de: "Speichere 3 Planeten als Favoriten", ja: "3つの惑星をお気に入りに保存する", bg: "Запази 3 планети като любими",
  },
];

// The number of the current week, Monday to Sunday (day 0 of the count was a Thursday).
const weekNumber = (day) => Math.floor((day + 3) / 7);
const periodKey = (period) => (period === "day" ? dayNumber() : weekNumber(dayNumber()));

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && typeof saved === "object") return { favourites: [], history: [], progress: {}, done: {}, ...saved };
  } catch {
    // storage blocked or damaged: start empty
  }
  return { favourites: [], history: [], progress: {}, done: {} };
}

// getLang() is the language of the page, text(key) the interface text, explore(name) flies to the planet on the map.
export function initExplorer({ getLang, text, explore }) {
  let state = load();
  let current = null; // the planet whose story is shown
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // not remembered
    }
  };

  const valueOf = (m) => {
    const p = state.progress[m.id];
    if (!p || p.period !== periodKey(m.period)) return 0;
    return m.unique ? p.ids.length : p.n;
  };
  const isDone = (m) => state.done[m.id] === periodKey(m.period);
  const counts = () => ({ done: MISSIONS.filter(isDone).length, total: MISSIONS.length });
  const label = (m) => m[getLang()] ?? m.en;

  // A thing happened on the map. id tells which planet or place (for the goals that count different ones).
  function emit(event, id = null) {
    let changed = false;
    for (const m of MISSIONS) {
      if (m.event !== event) continue;
      const key = periodKey(m.period);
      let p = state.progress[m.id];
      if (!p || p.period !== key) p = state.progress[m.id] = { period: key, n: 0, ids: [] };
      if (m.unique) {
        if (id == null || p.ids.includes(id)) continue;
        p.ids.push(id);
      } else p.n += 1;
      changed = true;
      if (!isDone(m) && valueOf(m) >= m.target) {
        state.done[m.id] = key;
        toast(`${text("missionDone")}: ${label(m)}`);
      }
    }
    if (changed) {
      save();
      render();
    }
  }

  // The planet whose story opened: it goes into the history, and counts for the missions.
  function viewed(name, habitable) {
    current = name;
    state.history = [{ name, t: Date.now() }, ...state.history.filter((h) => h.name !== name)].slice(0, HISTORY_MAX);
    save();
    emit("planet", name);
    if (habitable) emit("candidate", name);
    render();
  }

  const isFavourite = (name) => state.favourites.some((f) => f.name === name);
  function toggleFavourite(name = current) {
    if (!name) return;
    if (isFavourite(name)) state.favourites = state.favourites.filter((f) => f.name !== name);
    else {
      state.favourites = [{ name, t: Date.now() }, ...state.favourites];
      emit("favourite", name);
    }
    save();
    render();
  }

  // ---------------------------------------------------------------- the toast
  const toastEl = document.getElementById("toast");
  let toastTimer = 0;
  function toast(message) {
    clearTimeout(toastTimer);
    toastEl.textContent = `✓ ${message}`;
    toastEl.hidden = false;
    toastEl.classList.remove("away");
    toastTimer = setTimeout(() => {
      toastEl.classList.add("away");
      toastTimer = setTimeout(() => (toastEl.hidden = true), 900);
    }, 4500);
  }

  // ---------------------------------------------------------------- the panel and the card of the dock
  const panel = document.getElementById("log-panel");
  const body = document.getElementById("log-body");
  const card = document.getElementById("dock-log");
  const favButton = document.getElementById("story-fav");

  function el(tag, cls, content) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (content != null) e.textContent = content;
    return e;
  }
  function missionRow(m) {
    const v = Math.min(valueOf(m), m.target);
    const row = el("div", `mission${isDone(m) ? " done" : ""}`);
    row.append(el("span", "mission-mark", isDone(m) ? "✓" : ""), el("span", "mission-text", label(m)));
    row.append(el("span", "mission-count", `${v} / ${m.target}`));
    const bar = el("div", "mission-bar");
    const fill = el("div", "mission-fill");
    fill.style.width = `${(v / m.target) * 100}%`;
    bar.append(fill);
    row.append(bar);
    return row;
  }
  function placeList(items, empty, removable) {
    if (!items.length) return [el("p", "hint", empty)];
    return items.map(({ name }) => {
      const row = el("div", "log-place");
      const go = el("button", "log-go", name);
      go.type = "button";
      go.addEventListener("click", () => {
        toggle(false);
        explore(name);
      });
      row.append(go);
      if (removable) {
        const rm = el("button", "log-remove", "×");
        rm.type = "button";
        rm.setAttribute("aria-label", text("favRemove"));
        rm.addEventListener("click", () => toggleFavourite(name));
        row.append(rm);
      }
      return row;
    });
  }

  function render() {
    const { done, total } = counts();
    document.getElementById("dock-log-k").textContent = text("explorerKicker");
    document.getElementById("dock-log-t").textContent = text("explorerProgress")(done, total);
    document.getElementById("log-title").textContent = text("explorerTitle");
    favButton.textContent = isFavourite(current) ? "★" : "☆";
    favButton.setAttribute("aria-pressed", String(isFavourite(current)));
    favButton.setAttribute("aria-label", isFavourite(current) ? text("favRemove") : text("favAdd"));
    favButton.title = favButton.getAttribute("aria-label");
    favButton.hidden = !current;
    const section = (title, ...children) => {
      const s = el("section", "log-section");
      s.append(el("h3", "", title), ...children);
      return s;
    };
    body.replaceChildren(
      section(text("missionsDaily"), ...MISSIONS.filter((m) => m.period === "day").map(missionRow)),
      section(text("missionsWeekly"), ...MISSIONS.filter((m) => m.period === "week").map(missionRow)),
      section(text("favouritesTitle"), ...placeList(state.favourites, text("favouritesEmpty"), true)),
      section(text("recentTitle"), ...placeList(state.history.slice(0, 8), text("recentEmpty"), false))
    );
  }

  function toggle(open = panel.hidden) {
    panel.hidden = !open;
    card.setAttribute("aria-expanded", String(open));
    if (open) render();
  }
  card.addEventListener("click", () => toggle());
  document.getElementById("log-close").addEventListener("click", () => toggle(false));
  window.addEventListener("keydown", (e) => e.key === "Escape" && !panel.hidden && toggle(false));
  favButton.addEventListener("click", () => toggleFavourite());
  render();
  return { emit, viewed, render, open: () => toggle(true), counts };
}
