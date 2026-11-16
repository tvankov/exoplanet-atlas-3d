// The explorer's log: favourites, the planets looked at lately, and missions. Everything stays in this browser (localStorage "explorer");
// there is no account and nothing is sent anywhere. Missions are plain goals made of what the map already does (look at planets, answer
// the question of the day, fly a trip, measure a distance). A daily mission starts again each local day, a weekly one each week (Monday
// to Sunday), and counts only what happened in that period. The texts of the missions are here in English, German, Japanese and Bulgarian.

import { dayNumber } from "./daily.js";
import { mergeState } from "./state-merge.js";
import { cleanProfile } from "./profile.js";
import { track } from "./stats.js";
import { medalCanvas } from "./sharecard.js";

const KEY = "explorer";
const HISTORY_MAX = 12;

// event: what counts. "planet" is a planet looked at (the story opened), "candidate" the same for a habitable candidate, "answer" the
// question of the day answered, "trip" a trip that arrived, "starTrip" such a trip to another star, "measure" a distance measured,
// "favourite" a planet saved. unique: the goal counts different planets (or places), not the same one again. live: the goal shows how many
// there are now (the favourites saved), so it goes down when one is removed; a mission that was finished stays finished.
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
    id: "d-zone", period: "day", event: "zoneGame", target: 1,
    en: "Play the zone quiz", de: "Spiele das Zonen-Quiz", ja: "ゾーンクイズを遊ぶ", bg: "Изиграй викторината за зоната",
  },
  {
    id: "w-zone-win", period: "week", event: "zoneWin", target: 1,
    en: "Get 4 of 5 right in the zone quiz", de: "Löse 4 von 5 im Zonen-Quiz richtig", ja: "ゾーンクイズで5問中4問正解する", bg: "Отговори вярно на 4 от 5 във викторината за зоната",
  },
  {
    id: "d-flight", period: "day", event: "dailyFlight", target: 1,
    en: "Fly the flight of the day", de: "Fliege den Flug des Tages", ja: "今日のフライトを飛ぶ", bg: "Направи полета на деня",
  },
  {
    id: "d-atlas-quiz", period: "day", event: "atlasQuiz", target: 1,
    en: "Play a quiz about the zodiac signs", de: "Spiele ein Quiz zu den Sternzeichen", ja: "黄道十二星座のクイズを遊ぶ", bg: "Изиграй викторина за зодиакалните знаци",
  },
  {
    id: "w-atlas", period: "week", event: "constellation", target: 6, unique: true,
    en: "Look at 6 constellations in 3D", de: "Sieh dir 6 Sternbilder in 3D an", ja: "6つの星座を3Dで見る", bg: "Разгледай 6 съзвездия в 3D",
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
    id: "w-favourites", period: "week", event: "favourite", target: 3, live: true,
    en: "Save 3 planets as favourites", de: "Speichere 3 Planeten als Favoriten", ja: "3つの惑星をお気に入りに保存する", bg: "Запази 3 планети като любими",
  },
];


// ---------------------------------------------------------------- experience points, levels and badges
// The rules are the same for everybody and are shown in the panel. Experience (XP) comes from three things only: a finished mission (20 for a
// daily one, 50 for a weekly one, once per period), the first look at a planet (2), at a habitable candidate (5 more) and at a constellation (2).
// A level needs more than the one before (level n starts at 25 n (n - 1) XP: 50, 150, 300, 500 ...). A badge is a milestone, earned once, and
// stays; the ones that are not earned yet are shown with what they need, so it is clear how they are earned. Nothing is lost when a day is
// skipped, there are no streaks. All of it stays in this browser like the rest of the log.
const XP_MISSION = { day: 20, week: 50 };
const XP_PLANET = 2;
const XP_CANDIDATE = 5;
const XP_CONSTELLATION = 2;
const xpForLevel = (level) => 25 * level * (level - 1);
function levelOf(xp) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

// count: how far the visitor is, from the totals that are counted from the first visit on (state.total); need: where the badge is earned.
const BADGES = [
  {
    id: "first-look", count: (t) => (t.planets?.length ?? 0), need: 1,
    en: ["First look", "Looked at your first planet"], de: ["Erster Blick", "Den ersten Planeten angesehen"],
    ja: ["最初の観察", "最初の惑星を見た"], bg: ["Първи поглед", "Разгледа първата си планета"],
  },
  {
    id: "planets-25", count: (t) => (t.planets?.length ?? 0), need: 25,
    en: ["Planet watcher", "Looked at 25 different planets"], de: ["Planetenbeobachter", "25 verschiedene Planeten angesehen"],
    ja: ["惑星ウォッチャー", "25個の異なる惑星を見た"], bg: ["Наблюдател на планети", "Разгледа 25 различни планети"],
  },
  {
    id: "candidates-10", count: (t) => (t.candidates?.length ?? 0), need: 10,
    en: ["Habitable hunter", "Visited 10 habitable candidates"], de: ["Jäger bewohnbarer Welten", "10 bewohnbare Kandidaten besucht"],
    ja: ["居住可能ハンター", "居住可能な候補を10個訪れた"], bg: ["Ловец на обитаеми светове", "Посети 10 кандидати за обитаеми светове"],
  },
  {
    id: "first-trip", count: (t) => (t.trip ?? 0), need: 1,
    en: ["First trip", "Flew a trip with the travel planner"], de: ["Erste Reise", "Eine Reise mit dem Reiseplaner geflogen"],
    ja: ["初めての旅", "旅行プランナーで旅をした"], bg: ["Първо пътуване", "Направи пътуване с планировчика"],
  },
  {
    id: "star-trip", count: (t) => (t.starTrip ?? 0), need: 1,
    en: ["Interstellar", "Flew to another star"], de: ["Interstellar", "Zu einem anderen Stern geflogen"],
    ja: ["恒星間飛行", "別の恒星へ飛んだ"], bg: ["Междузвезден", "Полетя до друга звезда"],
  },
  {
    id: "zone-expert", count: (t) => (t.zoneWin ?? 0), need: 1,
    en: ["Zone expert", "Got 4 of 5 right in the zone quiz"], de: ["Zonen-Experte", "4 von 5 im Zonen-Quiz richtig gelöst"],
    ja: ["ゾーンの達人", "ゾーンクイズで5問中4問正解した"], bg: ["Експерт по зоната", "Отговори вярно на 4 от 5 във викторината за зоната"],
  },
  {
    id: "sky-reader", count: (t) => (t.constellations?.length ?? 0), need: 12,
    en: ["Sky reader", "Looked at 12 constellations in 3D"], de: ["Himmelsleser", "12 Sternbilder in 3D angesehen"],
    ja: ["星空の読み手", "12の星座を3Dで見た"], bg: ["Четец на небето", "Разгледа 12 съзвездия в 3D"],
  },
  {
    id: "collector", count: (t) => (t.favourite ?? 0), need: 5,
    en: ["Collector", "Saved 5 planets as favourites"], de: ["Sammler", "5 Planeten als Favoriten gespeichert"],
    ja: ["コレクター", "5つの惑星をお気に入りに保存した"], bg: ["Колекционер", "Запази 5 планети като любими"],
  },
  {
    id: "regular", count: (t) => (t.missions ?? 0), need: 10,
    en: ["Regular", "Finished 10 missions"], de: ["Stammgast", "10 Missionen abgeschlossen"],
    ja: ["常連", "10個のミッションを完了した"], bg: ["Редовен", "Завърши 10 мисии"],
  },
];

const XP_TEXT = {
  en: {
    level: (n) => `Level ${n}`,
    toNext: (x, n) => `${x} XP to level ${n}`,
    howTitle: "How XP works",
    how: `A finished mission gives ${XP_MISSION.day} XP (daily) or ${XP_MISSION.week} XP (weekly). The first look at a planet gives ${XP_PLANET} XP, at a habitable candidate ${XP_CANDIDATE} more, and at a constellation ${XP_CONSTELLATION}. Nothing is lost when you skip a day. It is all stored in this browser.`,
    badgesTitle: "Badges",
    badge: "Badge", earnedOn: (d) => `Earned ${d}`, badgesLine: (n, all) => `${n} of ${all}`,
    levelUp: (n) => `Level ${n} reached`,
  },
  de: {
    level: (n) => `Stufe ${n}`,
    toNext: (x, n) => `${x} XP bis Stufe ${n}`,
    howTitle: "So funktionieren XP",
    how: `Eine abgeschlossene Mission gibt ${XP_MISSION.day} XP (täglich) oder ${XP_MISSION.week} XP (wöchentlich). Der erste Blick auf einen Planeten gibt ${XP_PLANET} XP, auf einen bewohnbaren Kandidaten ${XP_CANDIDATE} mehr, auf ein Sternbild ${XP_CONSTELLATION}. Wer einen Tag auslässt, verliert nichts. Alles bleibt in diesem Browser gespeichert.`,
    badgesTitle: "Abzeichen",
    badge: "Abzeichen", earnedOn: (d) => `Erhalten am ${d}`, badgesLine: (n, all) => `${n} von ${all}`,
    levelUp: (n) => `Stufe ${n} erreicht`,
  },
  ja: {
    level: (n) => `レベル${n}`,
    toNext: (x, n) => `レベル${n}まであと${x} XP`,
    howTitle: "XPのしくみ",
    how: `ミッションを完了すると、毎日のものは${XP_MISSION.day} XP、毎週のものは${XP_MISSION.week} XPがもらえます。惑星を初めて見ると${XP_PLANET} XP、居住可能な候補ならさらに${XP_CANDIDATE} XP、星座を初めて見ると${XP_CONSTELLATION} XPです。1日休んでも何も失いません。すべてこのブラウザに保存されます。`,
    badgesTitle: "バッジ",
    badge: "バッジ", earnedOn: (d) => `${d}に獲得`, badgesLine: (n, all) => `${all}個中${n}個`,
    levelUp: (n) => `レベル${n}に到達`,
  },
  bg: {
    level: (n) => `Ниво ${n}`,
    toNext: (x, n) => `${x} XP до ниво ${n}`,
    howTitle: "Как работят XP",
    how: `Завършена мисия дава ${XP_MISSION.day} XP (дневна) или ${XP_MISSION.week} XP (седмична). Първият поглед към планета дава ${XP_PLANET} XP, към кандидат за обитаем свят още ${XP_CANDIDATE}, към съзвездие ${XP_CONSTELLATION}. Нищо не се губи, ако пропуснеш ден. Всичко се пази в този браузър.`,
    badgesTitle: "Значки",
    badge: "Значка", earnedOn: (d) => `Получена на ${d}`, badgesLine: (n, all) => `${n} от ${all}`,
    levelUp: (n) => `Достигнато ниво ${n}`,
  },
};

// The number of the current week, Monday to Sunday (day 0 of the count was a Thursday).
const weekNumber = (day) => Math.floor((day + 3) / 7);
const periodKey = (period) => (period === "day" ? dayNumber() : weekNumber(dayNumber()));

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && typeof saved === "object") return { favourites: [], history: [], progress: {}, done: {}, total: {}, xp: 0, badges: [], ...saved };
  } catch {
    // storage blocked or damaged: start empty
  }
  return { favourites: [], history: [], progress: {}, done: {}, total: {}, xp: 0, badges: [] };
}

// getLang() is the language of the page, text(key) the interface text, explore(name) flies to the planet on the map.
export function initExplorer({ getLang, text, explore }) {
  let state = load();
  let current = null; // the planet whose story is shown
  let changeListener = null; // the account (auth.js) saves the log when it changes
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // not remembered
    }
    changeListener?.();
  };
  // The profile (name, interest, level, see profile.js) and the last place that was looked at, for "My Universe" (universe.js).
  const getProfile = () => cleanProfile(state.profile) ?? {};
  function setProfile(patch) {
    state.profile = cleanProfile({ ...getProfile(), ...patch, updated: Date.now() });
    save();
  }
  function resetProfile() {
    state.profile = { updated: Date.now(), skipped: true }; // not asked again, but it can be filled in
    save();
  }
  const getLast = () => (state.last && typeof state.last.name === "string" ? state.last : null);
  // The planet whose story is shown, without counting a visit (the Earth of the start): the star for the favourites and the journal follow it.
  function showing(name) {
    current = name;
    render();
  }
  // A change made by another module (the journal): the change, then saving and drawing again.
  function update(mutate) {
    mutate(state);
    save();
    render();
  }
  // Everything back to an empty log (the journal's "delete everything"); with an account, the empty log is saved to it.
  function resetAll() {
    state = { favourites: [], history: [], progress: {}, done: {}, total: {}, xp: 0, badges: [] };
    save();
    render();
  }
  const renderListeners = []; // other modules that draw from the log (the journal in the info panel)
  // the label of the first mission that is not done, or null
  function nextMission() {
    const m = MISSIONS.find((x) => !isDone(x));
    return m ? label(m) : null;
  }
  // The log of the account comes in at the sign-in: both are merged, see state-merge.js.
  function merge(remote) {
    state = { ...state, ...mergeState(state, remote) };
    save();
    render();
  }

  const valueOf = (m) => {
    if (m.live) return state.favourites.length;
    const p = state.progress[m.id];
    if (!p || p.period !== periodKey(m.period)) return 0;
    return m.unique ? p.ids.length : p.n;
  };
  const isDone = (m) => state.done[m.id] === periodKey(m.period);
  const counts = () => ({ done: MISSIONS.filter(isDone).length, total: MISSIONS.length });
  const label = (m) => m[getLang()] ?? m.en;
  const xpText = () => XP_TEXT[getLang()] ?? XP_TEXT.en;

  // XP are only given at the moment a thing happens for the first time (a mission is finished, a planet is seen for the first time), so a
  // reward cannot be given twice.
  function award(points) {
    const before = levelOf(state.xp);
    state.xp += points;
    const after = levelOf(state.xp);
    if (after > before) toast(xpText().levelUp(after));
  }
  function finish(m, key) {
    state.done[m.id] = key;
    state.total.missions = (state.total.missions ?? 0) + 1;
    award(XP_MISSION[m.period]);
    track(`mission-done-${m.id}`);
    toast(`${text("missionDone")}: ${label(m)} (+${XP_MISSION[m.period]} XP)`);
  }
  // the first time something happens: true once per id (the total keeps the ids)
  function first(kind, id) {
    const list = (state.total[kind] ??= []);
    if (id == null || list.includes(id)) return false;
    list.push(id);
    return true;
  }
  function countTotals(event, id) {
    if (event === "planet") first("planets", id) && award(XP_PLANET);
    else if (event === "candidate") first("candidates", id) && award(XP_CANDIDATE);
    else if (event === "constellation") first("constellations", id) && award(XP_CONSTELLATION);
    else state.total[event] = (state.total[event] ?? 0) + 1;
  }
  function checkBadges() {
    for (const b of BADGES) {
      if (state.badges.some((x) => x.id === b.id) || b.count(state.total) < b.need) continue;
      state.badges.push({ id: b.id, t: Date.now() });
      track(`badge-${b.id}`);
      toast(`${xpText().badge}: ${(b[getLang()] ?? b.en)[0]}`);
    }
  }

  // A thing happened on the map. id tells which planet or place (for the goals that count different ones).
  function emit(event, id = null) {
    let changed = true; // the totals of the badges change with every event
    countTotals(event, id);
    for (const m of MISSIONS) {
      if (m.event !== event || isDone(m)) continue; // a finished mission does not count on
      const key = periodKey(m.period);
      if (m.live) {
        changed = true;
        if (valueOf(m) >= m.target) finish(m, key);
        continue;
      }
      let p = state.progress[m.id];
      if (!p || p.period !== key) p = state.progress[m.id] = { period: key, n: 0, ids: [] };
      if (m.unique) {
        if (id == null || p.ids.includes(id)) continue;
        p.ids.push(id);
      } else p.n += 1;
      changed = true;
      if (!isDone(m) && valueOf(m) >= m.target) finish(m, key);
    }
    checkBadges();
    if (changed) {
      save();
      render();
    }
  }

  // The planet whose story opened: it goes into the history, and counts for the missions.
  function viewed(name, habitable) {
    current = name;
    state.history = [{ name, t: Date.now() }, ...state.history.filter((h) => h.name !== name)].slice(0, HISTORY_MAX);
    state.last = { name, t: Date.now() }; // "continue exploring" starts here
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
      track("favourite-add");
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
    const v = isDone(m) ? m.target : Math.min(valueOf(m), m.target);
    const row = el("div", `mission${isDone(m) ? " done" : ""}`);
    row.append(el("span", "mission-mark", isDone(m) ? "✓" : ""), el("span", "mission-text", label(m)));
    row.append(el("span", "mission-count", `${v} / ${m.target} · +${XP_MISSION[m.period]} XP`));
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

  // the level, the XP towards the next one, and how it works
  function buildXpCard() {
    const level = levelOf(state.xp);
    const low = xpForLevel(level);
    const high = xpForLevel(level + 1);
    const xpCard = el("div", "xp-card");
    const head = el("div", "xp-head");
    head.append(el("strong", "xp-level", xpText().level(level)), el("span", "xp-total", `${state.xp} XP`));
    const xpBar = el("div", "mission-bar");
    const xpFill = el("div", "mission-fill");
    xpFill.style.width = `${((state.xp - low) / (high - low)) * 100}%`;
    xpBar.append(xpFill);
    xpCard.append(head, xpBar, el("p", "hint", xpText().toNext(high - state.xp, level + 1)));
    const how = el("details", "xp-how");
    how.append(el("summary", "", xpText().howTitle), el("p", "hint", xpText().how));
    xpCard.append(how);
    return xpCard;
  }
  // the badges as medals (sharecard.js draws them): an earned one golden with its date, the others grey with how far the visitor is
  function buildBadges() {
    const grid = el("div", "badges");
    for (const b of BADGES) {
      const got = state.badges.find((x) => x.id === b.id);
      const [name, need] = b[getLang()] ?? b.en;
      const cell = el("div", `badge${got ? " earned" : ""}`);
      const text = el("div", "badge-text");
      text.append(el("strong", "", name), el("span", "", need));
      if (got?.t) text.append(el("small", "badge-date", xpText().earnedOn(new Date(got.t).toLocaleDateString(getLang()))));
      else if (!got) {
        const have = Math.min(b.count(state.total), b.need);
        const bar = el("div", "badge-bar");
        const fill = el("i", "");
        fill.style.width = `${(have / b.need) * 100}%`;
        bar.append(fill);
        text.append(bar, el("small", "badge-date", `${have} / ${b.need}`));
      }
      cell.append(medalCanvas(b.id, `badge-medal${got ? "" : " locked"}`, 46), text);
      grid.append(cell);
    }
    return grid;
  }
  // for My Universe: the medals, and how many are earned
  const badges = () => ({ el: buildBadges(), earned: state.badges.length, all: BADGES.length, line: xpText().badgesLine(state.badges.length, BADGES.length), title: xpText().badgesTitle });
  // a row of small medals for the fold of the badges in My Universe
  const medalStrip = () => {
    const strip = el("span", "medal-strip");
    for (const b of BADGES) strip.append(medalCanvas(b.id, `badge-medal small${state.badges.some((x) => x.id === b.id) ? "" : " locked"}`, 22));
    return strip;
  };

  function render() {
    const { done, total } = counts();
    const level = levelOf(state.xp);
    document.getElementById("dock-log-k").textContent = `${text("explorerKicker")} · ${xpText().level(level)}`;
    document.getElementById("dock-log-t").textContent = text("explorerProgress")(done, total);
    document.getElementById("log-title").textContent = text("explorerTitle");
    favButton.textContent = isFavourite(current) ? "★" : "☆";
    favButton.setAttribute("aria-pressed", String(isFavourite(current)));
    favButton.setAttribute("aria-label", isFavourite(current) ? text("favRemove") : text("favAdd"));
    favButton.title = favButton.getAttribute("aria-label");
    favButton.hidden = !current;
    for (const fn of renderListeners) fn();
    const section = (title, ...children) => {
      const s = el("section", "log-section");
      s.append(el("h3", "", title), ...children);
      return s;
    };
    const xpCard = buildXpCard();
    const grid = buildBadges();
    body.replaceChildren(
      xpCard,
      section(text("missionsDaily"), ...MISSIONS.filter((m) => m.period === "day").map(missionRow)),
      section(text("missionsWeekly"), ...MISSIONS.filter((m) => m.period === "week").map(missionRow)),
      section(xpText().badgesTitle, grid),
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
  return { emit, viewed, render, open: () => toggle(true), counts, badges, medalStrip, getState: () => state, merge, onChange: (fn) => (changeListener = fn), getProfile, setProfile, resetProfile, getLast, nextMission, levelOf,
    // the level and the way to the next one, for My Universe: { level, xp, share (0 to 1), toNext (the text) }
    progress: () => {
      const level = levelOf(state.xp);
      const low = xpForLevel(level);
      const high = xpForLevel(level + 1);
      return { level, xp: state.xp, share: (state.xp - low) / (high - low), toNext: xpText().toNext(high - state.xp, level + 1) };
    },
    update, resetAll, showing, getCurrent: () => current, onRender: (fn) => renderListeners.push(fn) };
}
