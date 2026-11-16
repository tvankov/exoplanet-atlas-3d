// "My Universe": the personal layer over the map. A short, skippable welcome on the first visit (a name, an interest, how much the visitor knows,
// all optional), a greeting at the next visits, and a dashboard in the profile panel: where to continue, the discovery of the day, the missions, the
// favourites and the places seen lately, a few numbers, quick actions, and the profile itself. Everything is built from what the log already knows
// (explorer.js) and stays in this browser, and in the account if there is one. Nothing is asked that the page does not use; the map stays free.
// The text of the profile fields: profile.js.

import { track } from "./stats.js";
import { INTERESTS, LEVELS } from "./profile.js";
import { disclosure } from "./disclosure.js";
import { planetCanvas, starCanvas } from "./sharecard.js";
import { dockPicture } from "./dockart.js";

export const UNIVERSE_TEXT = {
  en: {
    title: "My Universe",
    heroBack: (name) => (name ? `Welcome back, ${name}` : "Welcome back"),
    next: "What next", continueGo: "Continue exploring", discover: "Discover", lastSeen: (when) => `Seen last · ${when}`, forYou: "For you",
    kindSolar: (au) => `Planet of the Solar System · ${au} AU from the Sun`,
    kindExo: (dist, temp) => `Exoplanet · ${dist} light years${temp ? ` · ${temp} K` : ""}`,
    kindStar: (dist, n) => `Star · ${dist} light years · ${n} ${n === 1 ? "planet" : "planets"}`, kindSun: "Our star, the Sun",
    progress: "Your progress",
    hello: (name) => (name ? `Welcome, ${name}` : "Welcome, Explorer"),
    back: (name) => (name ? `Welcome back, ${name}.` : "Welcome back."),
    levelLine: (level, xp) => `Level ${level} · ${xp} XP`,
    continueEmpty: "The last place you look at will be here.",
    today: "today", daysAgo: (n) => `${n} days ago`, yesterday: "yesterday",
    daily: "Discovery of the day", open: "Open",
    missions: "Missions", missionsLine: (done, total) => `${done} of ${total} done`, nextMission: (label) => `Next: ${label}`, allDone: "All missions done.",
    discoveries: "Your discoveries", favourites: "Favourites", recent: "Seen lately", emptyDiscoveries: "Planets that you save or look at appear here.",
    statPlanets: "Planets seen", statFavourites: "Favourites", statMissions: "Missions finished", statBadges: "Badges",
    quick: "Quick actions", qMissions: "Missions and badges", qSky: "Sky events", qZodiac: "Zodiac signs",
    qSkySub: "Eclipses, meteor showers and more, with a countdown", qZodiacSub: "The twelve constellations in 3D, with a quiz",
    journalSub: (n, c) => `${n} ${n === 1 ? "note" : "notes"} · ${c} ${c === 1 ? "collection" : "collections"}`,
    profileSub: "Name, interest and how much you know",
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
    heroBack: (name) => (name ? `Willkommen zurück, ${name}` : "Willkommen zurück"),
    next: "Als Nächstes", continueGo: "Weiter erkunden", discover: "Entdecken", lastSeen: (when) => `Zuletzt angesehen · ${when}`, forYou: "Für dich",
    kindSolar: (au) => `Planet des Sonnensystems · ${au} AE von der Sonne`,
    kindExo: (dist, temp) => `Exoplanet · ${dist} Lichtjahre${temp ? ` · ${temp} K` : ""}`,
    kindStar: (dist, n) => `Stern · ${dist} Lichtjahre · ${n} ${n === 1 ? "Planet" : "Planeten"}`, kindSun: "Unser Stern, die Sonne",
    progress: "Dein Fortschritt",
    hello: (name) => (name ? `Willkommen, ${name}` : "Willkommen, Explorer"),
    back: (name) => (name ? `Willkommen zurück, ${name}.` : "Willkommen zurück."),
    levelLine: (level, xp) => `Stufe ${level} · ${xp} XP`,
    continueEmpty: "Der Ort, den du dir zuletzt ansiehst, steht hier.",
    today: "heute", daysAgo: (n) => `vor ${n} Tagen`, yesterday: "gestern",
    daily: "Entdeckung des Tages", open: "Öffnen",
    missions: "Missionen", missionsLine: (done, total) => `${done} von ${total} erledigt`, nextMission: (label) => `Als Nächstes: ${label}`, allDone: "Alle Missionen erledigt.",
    discoveries: "Deine Entdeckungen", favourites: "Favoriten", recent: "Zuletzt angesehen", emptyDiscoveries: "Planeten, die du speicherst oder ansiehst, erscheinen hier.",
    statPlanets: "Planeten gesehen", statFavourites: "Favoriten", statMissions: "Missionen erledigt", statBadges: "Abzeichen",
    quick: "Schnellzugriff", qMissions: "Missionen und Abzeichen", qSky: "Himmelsereignisse", qZodiac: "Sternzeichen",
    qSkySub: "Finsternisse, Sternschnuppen und mehr, mit Countdown", qZodiacSub: "Die zwölf Sternbilder in 3D, mit Quiz",
    journalSub: (n, c) => `${n} ${n === 1 ? "Notiz" : "Notizen"} · ${c} ${c === 1 ? "Sammlung" : "Sammlungen"}`,
    profileSub: "Name, Interesse und Wissensstand",
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
    heroBack: (name) => (name ? `おかえりなさい、${name}さん` : "おかえりなさい"),
    next: "次はこちら", continueGo: "探検をつづける", discover: "発見する", lastSeen: (when) => `最後に見たもの · ${when}`, forYou: "あなたへ",
    kindSolar: (au) => `太陽系の惑星 · 太陽から${au} au`,
    kindExo: (dist, temp) => `系外惑星 · ${dist}光年${temp ? ` · ${temp} K` : ""}`,
    kindStar: (dist, n) => `恒星 · ${dist}光年 · 惑星${n}個`, kindSun: "わたしたちの恒星、太陽",
    progress: "あなたの進み具合",
    hello: (name) => (name ? `ようこそ、${name}さん` : "ようこそ、エクスプローラー"),
    back: (name) => (name ? `おかえりなさい、${name}さん。` : "おかえりなさい。"),
    levelLine: (level, xp) => `レベル${level} · ${xp} XP`,
    continueEmpty: "最後に見た場所がここに表示されます。",
    today: "今日", daysAgo: (n) => `${n}日前`, yesterday: "昨日",
    daily: "今日の発見", open: "開く",
    missions: "ミッション", missionsLine: (done, total) => `${total}件中${done}件完了`, nextMission: (label) => `次は：${label}`, allDone: "すべてのミッションを完了しました。",
    discoveries: "あなたの発見", favourites: "お気に入り", recent: "最近見たもの", emptyDiscoveries: "保存した惑星や見た惑星がここに表示されます。",
    statPlanets: "見た惑星", statFavourites: "お気に入り", statMissions: "完了したミッション", statBadges: "バッジ",
    quick: "ショートカット", qMissions: "ミッションとバッジ", qSky: "天文イベント", qZodiac: "黄道十二星座",
    qSkySub: "日食・月食や流星群など、カウントダウン付き", qZodiacSub: "12星座を3Dで、クイズ付き",
    journalSub: (n, c) => `メモ${n}件 · コレクション${c}件`,
    profileSub: "名前、興味、知識レベル",
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
    heroBack: (name) => (name ? `Добре дошъл отново, ${name}` : "Добре дошъл отново"),
    next: "Следва", continueGo: "Продължи изследването", discover: "Открий", lastSeen: (when) => `Разгледано последно · ${when}`, forYou: "За теб",
    kindSolar: (au) => `Планета от Слънчевата система · ${au} а.е. от Слънцето`,
    kindExo: (dist, temp) => `Екзопланета · ${dist} светлинни години${temp ? ` · ${temp} K` : ""}`,
    kindStar: (dist, n) => `Звезда · ${dist} светлинни години · ${n} ${n === 1 ? "планета" : "планети"}`, kindSun: "Нашата звезда, Слънцето",
    progress: "Твоят напредък",
    hello: (name) => (name ? `Добре дошъл, ${name}` : "Добре дошъл, изследователю"),
    back: (name) => (name ? `Добре дошъл отново, ${name}.` : "Добре дошъл отново."),
    levelLine: (level, xp) => `Ниво ${level} · ${xp} XP`,
    continueEmpty: "Мястото, което разгледаш последно, ще е тук.",
    today: "днес", daysAgo: (n) => `преди ${n} дни`, yesterday: "вчера",
    daily: "Откритие на деня", open: "Отвори",
    missions: "Мисии", missionsLine: (done, total) => `${done} от ${total} изпълнени`, nextMission: (label) => `Следва: ${label}`, allDone: "Всички мисии са изпълнени.",
    discoveries: "Твоите открития", favourites: "Любими", recent: "Разгледани наскоро", emptyDiscoveries: "Планетите, които запазиш или разгледаш, се появяват тук.",
    statPlanets: "Разгледани планети", statFavourites: "Любими", statMissions: "Изпълнени мисии", statBadges: "Значки",
    quick: "Бързи връзки", qMissions: "Мисии и значки", qSky: "Събития в небето", qZodiac: "Зодиакални знаци",
    qSkySub: "Затъмнения, метеорни потоци и още, с обратно броене", qZodiacSub: "Дванадесетте съзвездия в 3D, с викторина",
    journalSub: (n, c) => `${n} ${n === 1 ? "бележка" : "бележки"} · ${c} ${c === 1 ? "колекция" : "колекции"}`,
    profileSub: "Име, интерес и ниво на знания",
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

// explorer: the log module (explorer.js). daily: the discovery of the day (daily.js). explore(name): fly to a place. describe(name): what the map
// knows of a place ({ kind: "solar" | "exo" | "star" | "sun", id, name, color, au, dist, temp, teff, planets }) or null. openSky(), openAtlas(),
// closePanel(): open the events, the zodiac, close the profile panel.
export function initUniverse({ getLang, explorer, daily, journal, myStar, birthSky, flight, reco, explore, describe, openSky, openAtlas, closePanel }) {
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
  // First what matters to the visitor (who, which level, what next), then their star, their age on the planets and the sky at their birth, then
  // the progress, the discoveries and the journal. One main action per part; explanations and changes sit in small folds (disclosure.js).
  function section(title, ...children) {
    const s = el("section", "uni-section");
    s.append(el("h3", "", title), ...children);
    return s;
  }
  function placeButtons(items) {
    const row = el("div", "uni-places");
    for (const { name } of items) {
      const b = button("", "uni-place uni-chip", () => goTo(name));
      const info = describe?.(name);
      if (info) b.append(info.kind === "star" || info.kind === "sun" ? starCanvas(info.teff, "uni-chip-pic", 20) : planetCanvas(info.kind === "solar" ? { name: info.id } : { temp: info.temp }, "uni-chip-pic", 20));
      b.append(info?.name ?? name);
      row.append(b);
    }
    return row;
  }
  // the head of a fold that is a part of its own (journal, profile, badges): a picture, a title and one line, like a row of the lists
  function foldHead(picture, title, sub, ...more) {
    const head = el("span", "uni-fold-head");
    const text = el("span", "uni-item-text");
    text.append(el("strong", "", title));
    if (sub) text.append(el("small", "", sub));
    head.append(picture, text, ...more);
    return head;
  }
  const fmt = (x, d = 1) => x.toLocaleString(getLang(), { maximumFractionDigits: d, minimumFractionDigits: d });
  // A round picture for a place (sharecard.js draws it): a planet of the Solar System from its NASA map, an exoplanet in a colour by its
  // temperature (cold blue to hot red, a schematic, the number is written next to it), a star as a glow in the colour of its temperature. The
  // plain colour stands in until the picture is drawn.
  const tempColor = (k) => (k == null ? "#8fa8d8" : k < 200 ? "#cfe3ff" : k < 330 ? "#4d8fe0" : k < 600 ? "#d9a066" : k < 1200 ? "#c8643a" : "#ff7a3d");
  function orb(info, size = "") {
    const cls = `uni-orb ${size}`.trim();
    const px = size === "small" ? 28 : 72;
    if (!info) {
      const o = el("i", cls);
      o.setAttribute("aria-hidden", "true");
      return o;
    }
    if (info.kind === "star" || info.kind === "sun") return starCanvas(info.teff, `${cls} star`, px);
    const o = planetCanvas(info.kind === "solar" ? { name: info.id } : { temp: info.temp }, cls, px);
    o.style.setProperty("--orb", info.kind === "solar" ? info.color : tempColor(info.temp));
    return o;
  }
  function icon(glyph) {
    const i = el("i", "uni-orb small icon", glyph);
    i.setAttribute("aria-hidden", "true");
    return i;
  }
  function contextOf(info) {
    const tx = t();
    if (!info) return "";
    if (info.kind === "solar") return tx.kindSolar(fmt(info.au, info.au < 10 ? 2 : 1));
    if (info.kind === "exo") return tx.kindExo(fmt(info.dist), info.temp ? fmt(Math.round(info.temp), 0) : null);
    if (info.kind === "star") return tx.kindStar(fmt(info.dist), info.planets);
    return tx.kindSun;
  }
  // the big card: a picture, a label, the name, one line of context and the main action
  function discoverCard({ picture, label, title, context, action, go }) {
    const c = el("div", "uni-discover");
    const text = el("div", "uni-discover-text");
    text.append(el("small", "", label), el("strong", "", title));
    if (context) text.append(el("span", "hint", context));
    text.append(button(action, "uni-primary", go));
    c.append(picture, text);
    return c;
  }
  // one row of the list "What next": the whole row is the button
  function item(picture, title, sub, go) {
    const b = el("button", "uni-item");
    b.type = "button";
    const text = el("span", "uni-item-text");
    text.append(el("strong", "", title));
    if (sub) text.append(el("small", "", sub));
    const arrow = el("span", "uni-arrow", "›");
    arrow.setAttribute("aria-hidden", "true");
    b.append(picture, text, arrow);
    b.addEventListener("click", go);
    return b;
  }

  function renderDashboard(container) {
    const tx = t();
    const p = explorer.getProfile();
    const state = explorer.getState();
    const last = explorer.getLast();
    const parts = [];

    // 1. who and which level, with the way to the next one
    const pr = explorer.progress();
    const hero = el("div", "uni-hero");
    const level = el("div", "uni-level");
    level.append(el("span", "uni-badge", tx.levelLine(pr.level, pr.xp)));
    const bar = el("div", "uni-bar");
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", "100");
    bar.setAttribute("aria-valuenow", String(Math.round(pr.share * 100)));
    bar.setAttribute("aria-label", pr.toNext);
    const fill = el("i", "");
    fill.style.width = `${Math.max(2, Math.min(100, pr.share * 100))}%`;
    bar.append(fill);
    hero.append(el("strong", "uni-hello", last ? tx.heroBack(p.name) : tx.hello(p.name)), level, bar, el("small", "hint", pr.toNext));
    parts.push(hero);

    // 2. what next: the last place (or the first recommendation) as a card, then the flight of the day, the discovery of the day and the
    // recommendations as a short list
    const next = el("section", "uni-section uni-next");
    next.append(el("h3", "", tx.next));
    const recos = reco ? reco.items() : [];
    let rest = recos;
    if (last) {
      const info = describe?.(last.name);
      next.append(
        discoverCard({
          picture: orb(info),
          label: tx.lastSeen(ago(last.t)),
          title: info?.name ?? last.name,
          context: contextOf(info),
          action: tx.continueGo,
          go: () => {
            track("continue-click");
            goTo(last.name);
          },
        })
      );
    } else if (recos.length) {
      const first = recos[0];
      rest = recos.slice(1);
      const info = first.kind === "planet" ? describe?.(first.name) : null;
      next.append(
        discoverCard({
          picture: info ? orb(info) : icon(first.kind === "event" ? "☄︎" : "✦"),
          label: tx.forYou,
          title: first.label,
          context: first.reason,
          action: tx.discover,
          go: () => (closePanel?.(), first.go()),
        })
      );
    } else next.append(el("p", "hint", tx.continueEmpty));
    const list = el("div", "uni-list");
    if (flight)
      list.append(
        item(icon("✈︎"), flight.label(), flight.hint(), () => {
          closePanel?.();
          flight.start();
        })
      );
    if (daily?.entry) {
      const info = describe?.(daily.entry.target);
      list.append(item(info ? orb(info, "small") : icon("✦"), tx.daily, (daily.entry[getLang()] ?? daily.entry.en).title, () => (closePanel?.(), daily.open())));
    }
    for (const r of rest) {
      const info = r.kind === "planet" ? describe?.(r.name) : null;
      list.append(item(info ? orb(info, "small") : icon(r.kind === "event" ? "☄︎" : "✦"), r.label, r.reason, () => (closePanel?.(), r.go())));
    }
    next.append(list);
    if (reco) next.append(reco.about(() => renderAll()));
    parts.push(next);

    // 3. and 4. your star and your age on the planets (mystar.js); 5. and 6. the sky at your birth and the ascendant (birthsky.js)
    if (myStar) parts.push(...myStar.sections(closePanel));
    if (birthSky) parts.push(...birthSky.sections(closePanel));

    // the progress: a few numbers and the missions
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
    const { done, total } = explorer.counts();
    const nextMission = explorer.nextMission();
    const missions = el("div", "uni-list");
    missions.append(
      item(icon("◎"), tx.qMissions, `${tx.missionsLine(done, total)} · ${nextMission ? tx.nextMission(nextMission) : tx.allDone}`, () => (closePanel?.(), explorer.open()))
    );
    // the badges as medals (explorer.js draws them), folded under a row of small medals
    const badges = explorer.badges();
    const badgeFold = disclosure("badges", foldHead(icon("\u2605"), badges.title, badges.line, explorer.medalStrip()), [badges.el], "uni-fold rich");
    parts.push(section(tx.progress, grid, missions, badgeFold));

    // favourites and places seen lately
    const seen = state.history.slice(0, 4);
    const faves = state.favourites.slice(0, 4);
    const disc = [];
    if (faves.length) disc.push(el("small", "", tx.favourites), placeButtons(faves));
    if (seen.length) disc.push(el("small", "", tx.recent), placeButtons(seen));
    if (!disc.length) disc.push(el("p", "hint", tx.emptyDiscoveries));
    parts.push(section(tx.discoveries, ...disc));

    // the journal: notes, collections, export and delete (journal.js), folded
    if (journal) {
      const { notes, collections } = journal.counts();
      parts.push(disclosure("journal", foldHead(icon("\u270E"), journal.title(), tx.journalSub(notes, collections)), [journal.section(closePanel, { heading: false })], "uni-fold rich"));
    }

    // quick actions
    const quick = el("div", "uni-list");
    const wide = (b) => (b.classList.add("wide"), b);
    quick.append(
      wide(item(dockPicture("dock-sky") ?? icon("\u2604\uFE0E"), tx.qSky, tx.qSkySub, () => (closePanel?.(), openSky?.()))),
      wide(item(dockPicture("dock-games") ?? icon("\u2726"), tx.qZodiac, tx.qZodiacSub, () => (closePanel?.(), openAtlas?.())))
    );
    parts.push(section(tx.quick, quick));

    // the profile
    const name = el("input");
    name.type = "text";
    name.maxLength = 24;
    name.value = p.name ?? "";
    name.autocomplete = "off";
    const nameField = el("label", "account-field");
    nameField.append(el("span", "", tx.name), name, el("small", "", tx.nameHint));
    let interest = p.interest;
    let knows = p.level;
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
    const message = el("p", "account-ok", savedMessage);
    savedMessage = "";
    const actions = el("div", "uni-actions");
    actions.append(
      button(tx.save, "uni-primary", () => {
        explorer.setProfile({ name: name.value, interest, level: knows, onboarded: true });
        savedMessage = tx.saved;
        renderAll();
      }),
      button(tx.reset, "uni-link", () => {
        explorer.resetProfile();
        renderAll();
      })
    );
    const avatar = el("span", "uni-orb small icon uni-avatar", (p.name ?? "").slice(0, 1).toUpperCase() || "\u2726");
    avatar.setAttribute("aria-hidden", "true");
    const profileSub = p.name ? [p.name, tx.interests[p.interest]].filter(Boolean).join(" · ") : tx.profileSub;
    parts.push(
      disclosure(
        "profile",
        foldHead(avatar, tx.profile, profileSub),
        [nameField, el("small", "", tx.interest), chip(INTERESTS, tx.interests, () => interest, (v) => (interest = v)), el("p", "hint", tx.interestNote), el("small", "", tx.level), chip(LEVELS, tx.levels, () => knows, (v) => (knows = v)), actions, message],
        "uni-fold rich uni-profile"
      )
    );

    // what is stored
    const privacy = el("p", "hint uni-privacy", `${tx.privacy} `);
    const link = el("a", "", tx.privacyLink);
    link.href = "legal.html#datenschutz";
    link.target = "_blank";
    link.rel = "noopener";
    privacy.append(link);
    parts.push(privacy);

    container.replaceChildren(...parts);
  }
  let savedMessage = "";

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
