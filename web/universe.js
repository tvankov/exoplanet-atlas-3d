// "My Universe": the personal layer over the map. A short, skippable welcome on the first visit (a name, an interest, how much the visitor knows,
// all optional), a greeting at the next visits, and a dashboard in the profile panel: where to continue, the discovery of the day, the missions, the
// favourites and the places seen lately, a few numbers, quick actions, and the profile itself. Everything is built from what the log already knows
// (explorer.js) and stays in this browser, and in the account if there is one. Nothing is asked that the page does not use; the map stays free.
// The text of the profile fields: profile.js.

import { track } from "./stats.js";
import { INTERESTS, LEVELS } from "./profile.js";
import { disclosure } from "./disclosure.js";
import { planetCanvas, starCanvas, medalCanvas, roundRect } from "./sharecard.js";
import { dockPicture } from "./dockart.js";
import { storeBirthDate, storedBirthDate } from "./birthsky.js";

export const UNIVERSE_TEXT = {
  en: {
    title: "My Universe",
    areas: { home: "Overview", explore: "Explore", learn: "Learn", self: "You in the cosmos", collection: "Collection", certs: "Certificates" },
    tileSub: { explore: "Flight of the day, discoveries and recommendations", learn: "Learning paths and quizzes", self: "Your star, your age on the planets, the sky at your birth", collection: "Progress, badges, favourites, journal and account", certs: "Your learning certificates" },
    yourStar: (name) => `Your star: ${name}`,
    paths: "Learning paths", learnSoon: "The first learning path, Our Solar System, is being built: short steps with a goal, a task in the 3D view and a test.",
    practice: "Quizzes and practice", qZone: "Habitable zone quiz", qZoneSub: "Which planet lies in the green zone of its star?", qDaily: "Question of the day", qDailySub: "One question every day, with the answer explained",
    selfIntro: "What the universe has to do with you, worked out from real data.",
    selfSoon: "Coming: topics about identity, perception, consciousness, emotions, connection and meaning, with science, open questions and your own thoughts clearly apart.",
    certIntro: "When you finish a learning path and pass its final test, you get a Space Explorer learning certificate here.",
    certRule: "The rule: every required step done and at least 80 % in the final test. A certificate is a private confirmation of what you learned, not an accredited qualification.",
    certNone: "No certificate yet.",
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
    birthLabel: "Your date of birth (optional)",
    birthWhy: "So the page can show what the universe has to do with you: your star, your age on Mars, how often the Earth has carried you round the Sun.",
    birthPrivacy: "It stays in this browser only and is never sent, not even with an account.",
    birthAskTitle: "Make it about you",
    onboardTitle: "Welcome, Explorer.",
    onboardText: "The universe is waiting for you. Tell us a little, or skip it: you can change everything later in My Universe.",
    start: "Start exploring", skip: "Skip",
  },
  de: {
    title: "Mein Universum",
    areas: { home: "Übersicht", explore: "Entdecken", learn: "Lernen", self: "Du im Kosmos", collection: "Sammlung", certs: "Zertifikate" },
    tileSub: { explore: "Flug des Tages, Entdeckungen und Empfehlungen", learn: "Lernpfade und Quiz", self: "Dein Stern, dein Alter auf den Planeten, dein Himmel bei der Geburt", collection: "Fortschritt, Abzeichen, Favoriten, Journal und Konto", certs: "Deine Lernzertifikate" },
    yourStar: (name) => `Dein Stern: ${name}`,
    paths: "Lernpfade", learnSoon: "Der erste Lernpfad, „Unser Sonnensystem“, ist in Arbeit: kurze Schritte mit einem Ziel, einer Aufgabe in der 3D-Ansicht und einem Test.",
    practice: "Quiz und Übungen", qZone: "Quiz zur bewohnbaren Zone", qZoneSub: "Welcher Planet liegt in der grünen Zone seines Sterns?", qDaily: "Frage des Tages", qDailySub: "Jeden Tag eine Frage, mit erklärter Antwort",
    selfIntro: "Was das Universum mit dir zu tun hat, aus echten Daten berechnet.",
    selfSoon: "Bald: Themen über Identität, Wahrnehmung, Bewusstsein, Gefühle, Verbindung und Sinn, mit Wissenschaft, offenen Fragen und deinen eigenen Gedanken klar getrennt.",
    certIntro: "Wenn du einen Lernpfad abschließt und seinen Abschlusstest bestehst, bekommst du hier ein Lernzertifikat von Space Explorer.",
    certRule: "Die Regel: alle Pflichtschritte erledigt und mindestens 80 % im Abschlusstest. Ein Zertifikat bestätigt privat, was du gelernt hast, es ist kein anerkannter Abschluss.",
    certNone: "Noch kein Zertifikat.",
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
    birthLabel: "Dein Geburtsdatum (freiwillig)",
    birthWhy: "Damit dir die Seite zeigt, was das Universum mit dir zu tun hat: dein Stern, dein Alter auf dem Mars, wie oft dich die Erde schon um die Sonne getragen hat.",
    birthPrivacy: "Es bleibt nur in diesem Browser und wird nie gesendet, auch nicht mit einem Konto.",
    birthAskTitle: "Mach es persönlich",
    onboardTitle: "Willkommen, Explorer.",
    onboardText: "Das Universum wartet auf dich. Erzähl uns ein wenig, oder überspringe es: Du kannst alles später in Mein Universum ändern.",
    start: "Los geht's", skip: "Überspringen",
  },
  ja: {
    title: "マイ・ユニバース",
    areas: { home: "概要", explore: "探検", learn: "学ぶ", self: "宇宙の中のあなた", collection: "コレクション", certs: "修了証" },
    tileSub: { explore: "今日のフライト、発見、おすすめ", learn: "学習コースとクイズ", self: "あなたの星、惑星での年齢、生まれた日の空", collection: "進み具合、バッジ、お気に入り、ジャーナル、アカウント", certs: "あなたの修了証" },
    yourStar: (name) => `あなたの星：${name}`,
    paths: "学習コース", learnSoon: "最初の学習コース「私たちの太陽系」を準備中です。目標のある短いステップ、3D表示での課題、テストで構成されます。",
    practice: "クイズと練習", qZone: "ハビタブルゾーン・クイズ", qZoneSub: "恒星のグリーンゾーンにある惑星はどれ？", qDaily: "今日の質問", qDailySub: "毎日ひとつの質問と、答えの解説",
    selfIntro: "宇宙とあなたとの関わりを、実際のデータから計算します。",
    selfSoon: "近日公開：アイデンティティ、知覚、意識、感情、つながり、意味についてのテーマ。科学、未解決の問い、あなた自身の考えをはっきり分けて扱います。",
    certIntro: "学習コースを修了し、最終テストに合格すると、ここにSpace Explorerの修了証が表示されます。",
    certRule: "条件：必須ステップをすべて終え、最終テストで80 %以上。修了証は学んだことを私的に証明するもので、公的に認められた資格ではありません。",
    certNone: "まだ修了証はありません。",
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
    birthLabel: "生年月日（任意）",
    birthWhy: "宇宙とあなたとの関わりを見せるためです。あなたの星、火星での年齢、地球があなたを太陽のまわりに何周運んだか。",
    birthPrivacy: "このブラウザ内だけに保存され、アカウントがあっても送信されません。",
    birthAskTitle: "あなたの数字にする",
    onboardTitle: "ようこそ、エクスプローラー。",
    onboardText: "宇宙があなたを待っています。少しだけ教えてください。スキップもでき、あとで「マイ・ユニバース」から変更できます。",
    start: "探検を始める", skip: "スキップ",
  },
  bg: {
    title: "Моята вселена",
    areas: { home: "Преглед", explore: "Откривай", learn: "Учи", self: "Ти в космоса", collection: "Колекция", certs: "Сертификати" },
    tileSub: { explore: "Полет на деня, открития и препоръки", learn: "Учебни пътеки и викторини", self: "Твоята звезда, възрастта ти на планетите, небето при раждането ти", collection: "Напредък, значки, любими, дневник и акаунт", certs: "Твоите учебни сертификати" },
    yourStar: (name) => `Твоята звезда: ${name}`,
    paths: "Учебни пътеки", learnSoon: "Първата учебна пътека, „Нашата Слънчева система“, се подготвя: кратки стъпки с цел, задача в 3D изгледа и тест.",
    practice: "Викторини и упражнения", qZone: "Викторина за обитаемата зона", qZoneSub: "Коя планета е в зелената зона на звездата си?", qDaily: "Въпрос на деня", qDailySub: "Всеки ден по един въпрос, с обяснен отговор",
    selfIntro: "Какво общо има Вселената с теб, изчислено от истински данни.",
    selfSoon: "Скоро: теми за идентичност, възприятие, съзнание, емоции, връзка и смисъл, като наука, открити въпроси и собствените ти мисли са ясно разделени.",
    certIntro: "Когато завършиш учебна пътека и издържиш финалния ѝ тест, тук получаваш учебен сертификат от Space Explorer.",
    certRule: "Правилото: всички задължителни стъпки са изпълнени и поне 80 % на финалния тест. Сертификатът е лично потвърждение на наученото, а не признат документ за образование.",
    certNone: "Все още няма сертификат.",
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
    birthLabel: "Дата на раждане (по желание)",
    birthWhy: "За да ти покаже страницата какво общо има Вселената с теб: твоята звезда, възрастта ти на Марс, колко пъти Земята те е пренесла около Слънцето.",
    birthPrivacy: "Остава само в този браузър и никога не се изпраща, дори с акаунт.",
    birthAskTitle: "Направи го лично",
    onboardTitle: "Добре дошъл, изследователю.",
    onboardText: "Вселената те чака. Кажи ни малко за себе си или пропусни: всичко може да се промени после в „Моята вселена“.",
    start: "Започни", skip: "Пропусни",
  },
};

// explorer: the log module (explorer.js). daily: the discovery of the day (daily.js). explore(name): fly to a place. describe(name): what the map
// knows of a place ({ kind: "solar" | "exo" | "star" | "sun", id, name, color, au, dist, temp, teff, planets }) or null. openSky(), openAtlas(),
// openZoneQuiz(), closePanel(): open the events, the zodiac, the zone quiz, close the profile panel.
export function initUniverse({ getLang, explorer, daily, journal, myStar, birthSky, flight, reco, learn, explore, describe, openSky, openAtlas, openZoneQuiz, closePanel }) {
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
    // the date of birth: optional, it makes every number of the page the visitor's own
    const birth = dateInput(tx.birthLabel);
    const finish = (skipped) => {
      if (!skipped && storeBirthDate(birth.value)) birthChanged();
      explorer.setProfile(skipped ? { skipped: true } : { ...draft, onboarded: true });
      track(skipped ? "onboarding-skip" : "onboarding-done");
      card.hidden = true;
      renderAll();
    };
    card.replaceChildren(
      el("strong", "", tx.onboardTitle),
      el("p", "", tx.onboardText),
      name,
      el("small", "", tx.birthLabel),
      birth,
      el("p", "onboard-why", `${tx.birthWhy} ${tx.birthPrivacy}`),
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
  function dateInput(label) {
    const input = el("input", "uni-date");
    input.type = "date";
    input.min = "1900-01-01";
    input.max = new Date().toISOString().slice(0, 10);
    input.setAttribute("aria-label", label);
    return input;
  }
  // the date was given: the star and the sky read it again
  function birthChanged() {
    myStar?.reload();
    birthSky?.reload();
    track("birth-date-given");
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

  // ---------------------------------------------------------------- the six areas
  // My Universe has six areas: an overview (the greeting, the next step and a tile for each of the others), Explore (what to look at next),
  // Learn (the learning paths and the quizzes), You in the cosmos (your star, your age on the planets, the sky at your birth; later the
  // topics about identity, perception and meaning), the Collection (progress, badges, favourites, journal, profile and account) and the
  // Certificates. A row of tabs on top switches between them; the chosen area stays for the rest of the visit.
  const AREAS = ["home", "explore", "learn", "self", "collection", "certs"];
  let area = "home";
  function show(next) {
    area = next;
    track(`area-${next}`);
    renderAll();
    document.getElementById("profile-panel")?.scrollTo?.({ top: 0 });
  }
  function tabs() {
    const tx = t();
    const row = el("div", "uni-tabs");
    row.setAttribute("role", "tablist");
    row.setAttribute("aria-label", tx.title);
    for (const a of AREAS) {
      const b = button(tx.areas[a], "uni-tab", () => show(a));
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(a === area));
      row.append(b);
    }
    return row;
  }
  // a small certificate (paper and seal) for the tile and the area of the certificates
  function certificatePicture() {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 80;
    c.className = "uni-thumb";
    c.setAttribute("aria-hidden", "true");
    const g = c.getContext("2d");
    roundRect(g, 18, 8, 92, 62, 6);
    g.fillStyle = "#e9edf7";
    g.fill();
    g.strokeStyle = "rgba(110,128,170,0.65)";
    g.lineWidth = 3;
    for (const [y, end] of [[24, 96], [36, 96], [48, 70]]) {
      g.beginPath();
      g.moveTo(32, y);
      g.lineTo(end, y);
      g.stroke();
    }
    const seal = g.createRadialGradient(92, 58, 2, 94, 60, 15);
    seal.addColorStop(0, "#fff0c2");
    seal.addColorStop(1, "#c8902e");
    g.fillStyle = seal;
    g.beginPath();
    g.arc(94, 60, 14, 0, Math.PI * 2);
    g.fill();
    return c;
  }

  // the greeting, the level and the way to the next one
  function heroPart(tx, p, last) {
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
    return hero;
  }

  // what next: the last place (or the first recommendation) as a card; with `full` also the flight of the day, the discovery of the day and
  // the recommendations as a short list
  function nextPart(tx, last, full) {
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
    if (!full) return next;
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
    return next;
  }

  // what is stored, with the link to the privacy notice
  function privacyPart(tx) {
    const privacy = el("p", "hint uni-privacy", `${tx.privacy} `);
    const link = el("a", "", tx.privacyLink);
    link.href = "legal.html#datenschutz";
    link.target = "_blank";
    link.rel = "noopener";
    privacy.append(link);
    return privacy;
  }

  function homeArea(tx, p, last) {
    const tiles = el("div", "uni-tiles");
    const tile = (key, picture, sub) => {
      const b = el("button", `uni-tile tile-${key}`);
      b.type = "button";
      const text = el("span", "uni-tile-text");
      text.append(el("strong", "", tx.areas[key]), el("small", "", sub));
      b.append(picture, text);
      b.addEventListener("click", () => show(key));
      return b;
    };
    const mine = myStar?.current();
    tiles.append(
      tile("explore", dockPicture("dock-daily") ?? icon("✦"), tx.tileSub.explore),
      tile("learn", dockPicture("dock-games") ?? icon("✦"), tx.tileSub.learn),
      tile("self", starCanvas(null, "uni-tile-star", 56), mine ? tx.yourStar(mine.name) : tx.tileSub.self),
      tile("collection", medalCanvas("collector", "uni-tile-medal", 48), tx.tileSub.collection),
      tile("certs", certificatePicture(), tx.tileSub.certs)
    );
    const parts = [heroPart(tx, p, last)];
    // no date of birth yet: a small card to give it, so that the numbers of the page become the visitor's own
    if (!storedBirthDate()) {
      const ask = el("div", "uni-birth-ask");
      const input = dateInput(tx.birthLabel);
      const row = el("div", "uni-actions");
      row.append(
        input,
        button(tx.save, "uni-primary", () => {
          if (!storeBirthDate(input.value)) return input.focus();
          birthChanged();
          renderAll();
        })
      );
      ask.append(el("strong", "", tx.birthAskTitle), el("p", "", tx.birthWhy), row, el("p", "hint", tx.birthPrivacy));
      parts.push(ask);
    }
    parts.push(nextPart(tx, last, false), tiles, privacyPart(tx));
    return parts;
  }

  function exploreArea(tx, last) {
    const quick = el("div", "uni-list");
    quick.append(wide(item(dockPicture("dock-sky") ?? icon("☄︎"), tx.qSky, tx.qSkySub, () => (closePanel?.(), openSky?.()))));
    return [nextPart(tx, last, true), section(tx.quick, quick)];
  }

  function learnArea(tx) {
    // the learning paths (learn.js): the path with its steps, or one step, or the final test
    const own = learn?.area(() => renderAll());
    if (own && !own.overview) return own.nodes;
    const paths = own ? section(tx.paths, ...own.nodes) : section(tx.paths, el("p", "hint", tx.learnSoon));
    const practice = el("div", "uni-list");
    practice.append(wide(item(dockPicture("dock-games") ?? icon("✦"), tx.qZodiac, tx.qZodiacSub, () => (closePanel?.(), openAtlas?.()))));
    if (openZoneQuiz) practice.append(wide(item(dockPicture("dock-near") ?? icon("◎"), tx.qZone, tx.qZoneSub, () => (closePanel?.(), openZoneQuiz()))));
    if (daily) practice.append(wide(item(dockPicture("dock-daily") ?? icon("?"), tx.qDaily, tx.qDailySub, () => (closePanel?.(), daily.open()))));
    return [paths, section(tx.practice, practice)];
  }

  function selfArea(tx) {
    const parts = [el("p", "uni-area-intro", tx.selfIntro)];
    // your star and your age on the planets (mystar.js); the sky at your birth and the ascendant (birthsky.js)
    if (myStar) parts.push(...myStar.sections(closePanel));
    if (birthSky) parts.push(...birthSky.sections(closePanel));
    parts.push(el("p", "hint uni-soon", tx.selfSoon));
    return parts;
  }

  function collectionArea(tx, p, state) {
    const parts = [];
    // the progress: a few numbers, the missions and the badges
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
    const badgeFold = disclosure("badges", foldHead(icon("★"), badges.title, badges.line, explorer.medalStrip()), [badges.el], "uni-fold rich");
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
      parts.push(disclosure("journal", foldHead(icon("✎"), journal.title(), tx.journalSub(notes, collections)), [journal.section(closePanel, { heading: false })], "uni-fold rich"));
    }

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
    const avatar = el("span", "uni-orb small icon uni-avatar", (p.name ?? "").slice(0, 1).toUpperCase() || "✦");
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
    parts.push(privacyPart(tx)); // the account (auth.js) follows below
    return parts;
  }

  function certsArea(tx) {
    const card = el("div", "uni-cert-empty");
    const text = el("div", "");
    text.append(el("strong", "", tx.certNone), el("p", "", tx.certIntro), el("p", "hint", tx.certRule));
    card.append(certificatePicture(), text);
    return [section(tx.areas.certs, card)];
  }

  function renderDashboard(container) {
    const tx = t();
    const p = explorer.getProfile();
    const state = explorer.getState();
    const last = explorer.getLast();
    const content =
      area === "explore" ? exploreArea(tx, last)
      : area === "learn" ? learnArea(tx)
      : area === "self" ? selfArea(tx)
      : area === "collection" ? collectionArea(tx, p, state)
      : area === "certs" ? certsArea(tx)
      : homeArea(tx, p, last);
    const panel = el("div", "uni-area");
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-label", tx.areas[area]);
    panel.append(...content);
    container.replaceChildren(tabs(), panel);
    // the account (auth.js) belongs to the collection; the stylesheet shows it there, or while it is in the middle of a sign-in
    document.getElementById("profile-panel")?.setAttribute("data-area", area);
  }
  const wide = (b) => (b.classList.add("wide"), b);
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
