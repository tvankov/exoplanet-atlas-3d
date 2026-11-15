// "My Universe": the personal layer over the map. A short, skippable welcome on the first visit (a name, an interest, how much the visitor knows,
// all optional), a greeting at the next visits, and a dashboard in the profile panel: where to continue, the discovery of the day, the missions, the
// favourites and the places seen lately, a few numbers, quick actions, and the profile itself. Everything is built from what the log already knows
// (explorer.js) and stays in this browser, and in the account if there is one. Nothing is asked that the page does not use; the map stays free.
// The text of the profile fields: profile.js.

import { track } from "./stats.js";
import { INTERESTS, LEVELS } from "./profile.js";

export const UNIVERSE_TEXT = {
  en: {
    title: "My Universe",
    hello: (name) => (name ? `Welcome, ${name}` : "Welcome, Explorer"),
    back: (name) => (name ? `Welcome back, ${name}.` : "Welcome back."),
    levelLine: (level, xp) => `Level ${level} · ${xp} XP`,
    continue: "Continue exploring",
    continueEmpty: "The last place you look at will be here.",
    today: "today", daysAgo: (n) => `${n} days ago`, yesterday: "yesterday",
    daily: "Discovery of the day", open: "Open",
    missions: "Missions", missionsLine: (done, total) => `${done} of ${total} done`, nextMission: (label) => `Next: ${label}`, allDone: "All missions done.",
    discoveries: "Your discoveries", favourites: "Favourites", recent: "Seen lately", emptyDiscoveries: "Planets that you save or look at appear here.",
    stats: "Your numbers", statPlanets: "Planets seen", statFavourites: "Favourites", statMissions: "Missions finished", statBadges: "Badges",
    quick: "Quick actions", qMissions: "Missions and badges", qSky: "Sky events", qZodiac: "Zodiac signs",
    profile: "Your profile", name: "Explorer name", nameHint: "Optional. Any name, no real name needed.",
    interest: "What would you like to discover?", level: "How much do you know?",
    interests: { planets: "Planets of the Solar System", exoplanets: "Exoplanets", stars: "Stars and constellations", events: "Events in the sky" },
    levels: { beginner: "Beginner", advanced: "Advanced", expert: "Expert" },
    interestNote: "Your interest chooses the discovery of the day from the next visit on.",
    save: "Save", saved: "Saved.", reset: "Reset the profile", resetDone: "The profile is reset.",
    privacy: "All of this stays in this browser. With an account it is also saved there, so that it is the same on every device.",
    privacyLink: "Privacy notice",
    onboardTitle: "Welcome, Explorer.",
    onboardText: "The universe is waiting for you. Tell us a little, or skip it: you can change everything later in My Universe.",
    start: "Start exploring", skip: "Skip",
  },
  de: {
    title: "Mein Universum",
    hello: (name) => (name ? `Willkommen, ${name}` : "Willkommen, Explorer"),
    back: (name) => (name ? `Willkommen zurück, ${name}.` : "Willkommen zurück."),
    levelLine: (level, xp) => `Stufe ${level} · ${xp} XP`,
    continue: "Weiter erkunden",
    continueEmpty: "Der Ort, den du dir zuletzt ansiehst, steht hier.",
    today: "heute", daysAgo: (n) => `vor ${n} Tagen`, yesterday: "gestern",
    daily: "Entdeckung des Tages", open: "Öffnen",
    missions: "Missionen", missionsLine: (done, total) => `${done} von ${total} erledigt`, nextMission: (label) => `Als Nächstes: ${label}`, allDone: "Alle Missionen erledigt.",
    discoveries: "Deine Entdeckungen", favourites: "Favoriten", recent: "Zuletzt angesehen", emptyDiscoveries: "Planeten, die du speicherst oder ansiehst, erscheinen hier.",
    stats: "Deine Zahlen", statPlanets: "Planeten gesehen", statFavourites: "Favoriten", statMissions: "Missionen erledigt", statBadges: "Abzeichen",
    quick: "Schnellzugriff", qMissions: "Missionen und Abzeichen", qSky: "Himmelsereignisse", qZodiac: "Sternzeichen",
    profile: "Dein Profil", name: "Explorer-Name", nameHint: "Freiwillig. Irgendein Name, ein echter Name ist nicht nötig.",
    interest: "Was möchtest du entdecken?", level: "Wie viel weißt du schon?",
    interests: { planets: "Planeten des Sonnensystems", exoplanets: "Exoplaneten", stars: "Sterne und Sternbilder", events: "Ereignisse am Himmel" },
    levels: { beginner: "Einsteiger", advanced: "Fortgeschritten", expert: "Experte" },
    interestNote: "Dein Interesse wählt ab dem nächsten Besuch die Entdeckung des Tages.",
    save: "Speichern", saved: "Gespeichert.", reset: "Profil zurücksetzen", resetDone: "Das Profil ist zurückgesetzt.",
    privacy: "Das alles bleibt in diesem Browser. Mit einem Konto wird es zusätzlich dort gespeichert, damit es auf jedem Gerät gleich ist.",
    privacyLink: "Datenschutzerklärung",
    onboardTitle: "Willkommen, Explorer.",
    onboardText: "Das Universum wartet auf dich. Erzähl uns ein wenig, oder überspringe es: Du kannst alles später in Mein Universum ändern.",
    start: "Los geht's", skip: "Überspringen",
  },
  ja: {
    title: "マイ・ユニバース",
    hello: (name) => (name ? `ようこそ、${name}さん` : "ようこそ、エクスプローラー"),
    back: (name) => (name ? `おかえりなさい、${name}さん。` : "おかえりなさい。"),
    levelLine: (level, xp) => `レベル${level} · ${xp} XP`,
    continue: "探検をつづける",
    continueEmpty: "最後に見た場所がここに表示されます。",
    today: "今日", daysAgo: (n) => `${n}日前`, yesterday: "昨日",
    daily: "今日の発見", open: "開く",
    missions: "ミッション", missionsLine: (done, total) => `${total}件中${done}件完了`, nextMission: (label) => `次は：${label}`, allDone: "すべてのミッションを完了しました。",
    discoveries: "あなたの発見", favourites: "お気に入り", recent: "最近見たもの", emptyDiscoveries: "保存した惑星や見た惑星がここに表示されます。",
    stats: "あなたの数字", statPlanets: "見た惑星", statFavourites: "お気に入り", statMissions: "完了したミッション", statBadges: "バッジ",
    quick: "ショートカット", qMissions: "ミッションとバッジ", qSky: "天文イベント", qZodiac: "黄道十二星座",
    profile: "プロフィール", name: "エクスプローラー名", nameHint: "任意です。好きな名前で、本名は不要です。",
    interest: "何を発見したいですか？", level: "どのくらい知っていますか？",
    interests: { planets: "太陽系の惑星", exoplanets: "系外惑星", stars: "恒星と星座", events: "空のできごと" },
    levels: { beginner: "初心者", advanced: "中級者", expert: "上級者" },
    interestNote: "次回の訪問から、興味に合わせて今日の発見が選ばれます。",
    save: "保存", saved: "保存しました。", reset: "プロフィールをリセット", resetDone: "プロフィールをリセットしました。",
    privacy: "これらはすべてこのブラウザ内に残ります。アカウントがあれば、そこにも保存され、どの端末でも同じになります。",
    privacyLink: "プライバシーに関する説明",
    onboardTitle: "ようこそ、エクスプローラー。",
    onboardText: "宇宙があなたを待っています。少しだけ教えてください。スキップもでき、あとで「マイ・ユニバース」から変更できます。",
    start: "探検を始める", skip: "スキップ",
  },
  bg: {
    title: "Моята вселена",
    hello: (name) => (name ? `Добре дошъл, ${name}` : "Добре дошъл, изследователю"),
    back: (name) => (name ? `Добре дошъл отново, ${name}.` : "Добре дошъл отново."),
    levelLine: (level, xp) => `Ниво ${level} · ${xp} XP`,
    continue: "Продължи изследването",
    continueEmpty: "Мястото, което разгледаш последно, ще е тук.",
    today: "днес", daysAgo: (n) => `преди ${n} дни`, yesterday: "вчера",
    daily: "Откритие на деня", open: "Отвори",
    missions: "Мисии", missionsLine: (done, total) => `${done} от ${total} изпълнени`, nextMission: (label) => `Следва: ${label}`, allDone: "Всички мисии са изпълнени.",
    discoveries: "Твоите открития", favourites: "Любими", recent: "Разгледани наскоро", emptyDiscoveries: "Планетите, които запазиш или разгледаш, се появяват тук.",
    stats: "Твоите числа", statPlanets: "Разгледани планети", statFavourites: "Любими", statMissions: "Изпълнени мисии", statBadges: "Значки",
    quick: "Бързи връзки", qMissions: "Мисии и значки", qSky: "Събития в небето", qZodiac: "Зодиакални знаци",
    profile: "Твоят профил", name: "Име на изследовател", nameHint: "По желание. Което и да е име, истинско не е нужно.",
    interest: "Какво искаш да откриеш?", level: "Колко знаеш?",
    interests: { planets: "Планетите на Слънчевата система", exoplanets: "Екзопланети", stars: "Звезди и съзвездия", events: "Събития в небето" },
    levels: { beginner: "Начинаещ", advanced: "Напреднал", expert: "Експерт" },
    interestNote: "Интересът ти избира откритието на деня от следващото посещение.",
    save: "Запази", saved: "Запазено.", reset: "Нулирай профила", resetDone: "Профилът е нулиран.",
    privacy: "Всичко това остава в този браузър. С профил се запазва и там, за да е еднакво на всяко устройство.",
    privacyLink: "Бележка за поверителност",
    onboardTitle: "Добре дошъл, изследователю.",
    onboardText: "Вселената те чака. Кажи ни малко за себе си или пропусни: всичко може да се промени после в „Моята вселена“.",
    start: "Започни", skip: "Пропусни",
  },
};

// explorer: the log module (explorer.js). daily: the discovery of the day (daily.js). explore(name): fly to a place. openSky(), openAtlas(),
// closePanel(): open the events, the zodiac, close the profile panel.
export function initUniverse({ getLang, explorer, daily, journal, myStar, birthSky, explore, openSky, openAtlas, closePanel }) {
  const t = () => UNIVERSE_TEXT[getLang()] ?? UNIVERSE_TEXT.en;
  const el = (tag, cls, content) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (content != null) e.textContent = content;
    return e;
  };
  const button = (label, cls, onClick) => {
    const b = el("button", cls, label);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  };
  const MS_DAY = 86400000;
  const ago = (time) => {
    const days = Math.floor((Date.now() - time) / MS_DAY);
    return days <= 0 ? t().today : days === 1 ? t().yesterday : t().daysAgo(days);
  };
  const goTo = (name) => {
    closePanel?.();
    explore(name);
  };

  // ---------------------------------------------------------------- the greeting of the start, over the map
  function greetingText() {
    const p = explorer.getProfile();
    const last = explorer.getLast();
    if (!p.name && !last && !p.onboarded) return "";
    return t().back(p.name);
  }
  function renderGreeting() {
    const target = document.getElementById("welcome-greeting");
    if (target) target.textContent = greetingText();
  }

  // ---------------------------------------------------------------- the first visit: a small card at the bottom, not in the way of the map
  const card = document.getElementById("onboarding");
  let draft = {};
  function showCard() {
    const tx = t();
    draft = {};
    const name = el("input");
    name.type = "text";
    name.maxLength = 24;
    name.placeholder = tx.name;
    name.setAttribute("aria-label", tx.name);
    name.autocomplete = "off";
    name.addEventListener("input", () => (draft.name = name.value));
    const chips = (items, labels, key) => {
      const row = el("div", "onboard-chips");
      for (const value of items) {
        const b = button(labels[value], "", () => {
          draft[key] = draft[key] === value ? undefined : value;
          for (const c of row.children) c.classList.toggle("on", c.dataset.value === draft[key]);
        });
        b.dataset.value = value;
        row.append(b);
      }
      return row;
    };
    const finish = (skipped) => {
      explorer.setProfile(skipped ? { skipped: true } : { ...draft, onboarded: true });
      track(skipped ? "onboarding-skip" : "onboarding-done");
      card.hidden = true;
      renderAll();
    };
    card.replaceChildren(
      el("strong", "", tx.onboardTitle),
      el("p", "", tx.onboardText),
      name,
      el("small", "", tx.interest),
      chips(INTERESTS, tx.interests, "interest"),
      el("small", "", tx.level),
      chips(LEVELS, tx.levels, "level"),
      (() => {
        const row = el("div", "onboard-actions");
        row.append(button(tx.start, "account-main", () => finish(false)), button(tx.skip, "account-link", () => finish(true)));
        return row;
      })()
    );
    card.hidden = false;
  }
  // after the slogan: only for a visitor who has neither been through it nor skipped it
  function maybeOnboard() {
    const p = explorer.getProfile();
    if (!p.onboarded && !p.skipped && card.hidden) showCard();
  }

  // ---------------------------------------------------------------- the dashboard in the profile panel
  function section(title, ...children) {
    const s = el("section", "uni-section");
    s.append(el("h3", "", title), ...children);
    return s;
  }
  function placeButtons(items) {
    const row = el("div", "uni-places");
    for (const { name } of items) row.append(button(name, "uni-place", () => goTo(name)));
    return row;
  }
  function renderDashboard(container) {
    const tx = t();
    const p = explorer.getProfile();
    const state = explorer.getState();
    const last = explorer.getLast();
    const parts = [];

    const head = el("div", "uni-head");
    head.append(el("strong", "", tx.hello(p.name)), el("span", "", tx.levelLine(explorer.levelOf(state.xp), state.xp)));
    parts.push(head);

    // continue exploring
    const cont = el("div", "uni-continue");
    if (last) {
      const go = button(`${last.name}`, "account-main uni-go", () => {
        track("continue-click");
        goTo(last.name);
      });
      cont.append(el("small", "", tx.continue), go, el("span", "hint", ago(last.t)));
    } else cont.append(el("small", "", tx.continue), el("span", "hint", tx.continueEmpty));
    parts.push(cont);

    // your star (mystar.js)
    if (myStar) parts.push(myStar.section(closePanel));
    // the sky at your birth: astrology next to the real sky (birthsky.js)
    if (birthSky) parts.push(birthSky.section(closePanel));

    // the discovery of the day
    if (daily?.entry) {
      const row = el("div", "uni-row");
      row.append(el("span", "", (daily.entry[getLang()] ?? daily.entry.en).title), button(tx.open, "", () => (closePanel?.(), daily.open())));
      parts.push(section(tx.daily, row));
    }

    // missions
    const { done, total } = explorer.counts();
    const next = explorer.nextMission();
    parts.push(
      section(
        tx.missions,
        el("p", "", tx.missionsLine(done, total)),
        el("p", "hint", next ? tx.nextMission(next) : tx.allDone),
        button(tx.qMissions, "", () => (closePanel?.(), explorer.open()))
      )
    );

    // favourites and places seen lately
    const seen = state.history.slice(0, 4);
    const faves = state.favourites.slice(0, 4);
    const disc = [];
    if (faves.length) disc.push(el("small", "", tx.favourites), placeButtons(faves));
    if (seen.length) disc.push(el("small", "", tx.recent), placeButtons(seen));
    if (!disc.length) disc.push(el("p", "hint", tx.emptyDiscoveries));
    parts.push(section(tx.discoveries, ...disc));

    // numbers
    const grid = el("div", "uni-stats");
    for (const [value, label] of [
      [state.total.planets?.length ?? 0, tx.statPlanets],
      [state.favourites.length, tx.statFavourites],
      [state.total.missions ?? 0, tx.statMissions],
      [state.badges.length, tx.statBadges],
    ]) {
      const cell = el("div", "uni-stat");
      cell.append(el("b", "", String(value)), el("span", "", label));
      grid.append(cell);
    }
    parts.push(section(tx.stats, grid));

    // the journal: notes, collections, export and delete (journal.js)
    if (journal) parts.push(journal.section(closePanel));

    // quick actions
    const quick = el("div", "uni-places");
    quick.append(
      button(tx.qSky, "uni-place", () => (closePanel?.(), openSky?.())),
      button(tx.qZodiac, "uni-place", () => (closePanel?.(), openAtlas?.()))
    );
    parts.push(section(tx.quick, quick));

    // the profile
    const details = el("details", "uni-profile");
    details.append(el("summary", "", tx.profile));
    const name = el("input");
    name.type = "text";
    name.maxLength = 24;
    name.value = p.name ?? "";
    name.autocomplete = "off";
    const nameField = el("label", "account-field");
    nameField.append(el("span", "", tx.name), name, el("small", "", tx.nameHint));
    let interest = p.interest;
    let level = p.level;
    const chip = (items, labels, current, set) => {
      const row = el("div", "onboard-chips");
      for (const value of items) {
        const b = button(labels[value], current() === value ? "on" : "", () => {
          set(current() === value ? undefined : value);
          for (const c of row.children) c.classList.toggle("on", c.dataset.value === current());
        });
        b.dataset.value = value;
        row.append(b);
      }
      return row;
    };
    const message = el("p", "account-ok");
    const actions = el("div", "account-row");
    actions.append(
      button(tx.save, "account-main", () => {
        explorer.setProfile({ name: name.value, interest, level, onboarded: true });
        message.textContent = tx.saved;
        renderAll();
      }),
      button(tx.reset, "account-link", () => {
        explorer.resetProfile();
        renderAll();
      })
    );
    details.append(nameField, el("small", "", tx.interest), chip(INTERESTS, tx.interests, () => interest, (v) => (interest = v)), el("p", "hint", tx.interestNote), el("small", "", tx.level), chip(LEVELS, tx.levels, () => level, (v) => (level = v)), actions, message);
    parts.push(details);

    // what is stored
    const privacy = el("p", "hint", `${tx.privacy} `);
    const link = el("a", "", tx.privacyLink);
    link.href = "legal.html#datenschutz";
    link.target = "_blank";
    link.rel = "noopener";
    privacy.append(link);
    parts.push(privacy);

    container.replaceChildren(...parts);
  }

  // what the button at the top says: the name, or "My Universe"
  const buttonLabel = () => explorer.getProfile().name ?? t().title;
  let container = null;
  function render(target = container) {
    container = target;
    renderGreeting();
    if (container) renderDashboard(container);
  }
  // after a change of the profile: the panel, the greeting and the button at the top are drawn again (auth.js does it when it is connected)
  function renderAll() {
    if (onChange) onChange();
    else render();
  }
  let onChange = null;
  return { render, buttonLabel, maybeOnboard, title: () => t().title, setOnChange: (fn) => (onChange = fn) };
}
