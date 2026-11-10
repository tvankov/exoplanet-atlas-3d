// "Sternzeichen" (the zodiac signs and the other constellations): first flashcards to learn them, then quizzes to test what is known, and a view
// in 3D. Two decks: the 12 zodiac signs, and the other constellations. A flashcard shows the figure as we see it on the sky (the name is on the
// back, with the distances of its stars and the stars that have planets); a quiz asks the name of a figure, or which of three marked stars is the
// nearest to us. A figure can be seen on the map, from the Earth and from the side (where it falls apart, because its stars are at very different
// distances). Nothing is stored. Data and credits: see constellations.js.

import { track } from "./stats.js";

const ZODIAC_ORDER = ["Ari", "Tau", "Gem", "Cnc", "Leo", "Vir", "Lib", "Sco", "Sgr", "Cap", "Aqr", "Psc"];
const ROUNDS = 5;

export const ATLAS_TEXT = {
  en: {
    button: "Zodiac signs",
    title: "Zodiac signs",
    intro: "First learn the figures with flashcards, then test what you know.",
    deck: "Which cards?",
    deckZodiac: "The 12 zodiac signs",
    deckOthers: (n) => `Other constellations (${n})`,
    learn: "Learn with flashcards",
    testName: "Quiz: which one is it?",
    testStar: "Quiz: which star is the nearest?",
    view3d: "See the figures in 3D",
    frontZodiac: "Which zodiac sign is this?",
    frontOther: "Which constellation is this?",
    flip: "Turn the card",
    known: "I knew it",
    practise: "Practise again",
    progress: (k, n) => `${k} of ${n} learned`,
    deckDone: "All cards learned",
    deckDoneText: "Now test what you know.",
    again: "Start the cards again",
    facts: (n, near, far, unit) => `${n} stars with a known distance. The nearest is ${near} ${unit} away, the farthest ${far} ${unit}.`,
    hosts: "Stars with planets",
    earth: "From the Earth",
    side: "From the side",
    note: "A constellation is a chance picture: the stars only look close together from here.",
    brightest: "The brightest stars",
    star: "Star",
    planets: (n) => (n === 1 ? "1 known planet" : `${n} known planets`),
    others: "Other constellations",
    choose: "Choose ...",
    round: (n, total) => `Round ${n} of ${total}`,
    qName: (zodiac) => (zodiac ? "Which zodiac sign is this?" : "Which constellation is this?"),
    qStar: (name) => `In ${name}: which of the three marked stars is the nearest to us?`,
    right: "Correct.",
    wrong: "Not quite.",
    next: "Next round",
    finish: "Show the result",
    result: (score, total) => `${score} of ${total} right`,
    playAgain: "Play again",
    back: "Back",
    close: "Close",
  },
  de: {
    button: "Sternzeichen",
    title: "Sternzeichen",
    intro: "Lerne zuerst die Figuren mit Karteikarten, dann prüfe dein Wissen.",
    deck: "Welche Karten?",
    deckZodiac: "Die 12 Sternzeichen",
    deckOthers: (n) => `Andere Sternbilder (${n})`,
    learn: "Mit Karteikarten lernen",
    testName: "Quiz: Welches ist es?",
    testStar: "Quiz: Welcher Stern ist am nächsten?",
    view3d: "Die Figuren in 3D ansehen",
    frontZodiac: "Welches Sternzeichen ist das?",
    frontOther: "Welches Sternbild ist das?",
    flip: "Karte umdrehen",
    known: "Gewusst",
    practise: "Noch üben",
    progress: (k, n) => `${k} von ${n} gelernt`,
    deckDone: "Alle Karten gelernt",
    deckDoneText: "Jetzt prüfe dein Wissen.",
    again: "Karten noch einmal",
    facts: (n, near, far, unit) => `${n} Sterne mit bekannter Entfernung. Der nächste ist ${near} ${unit} entfernt, der fernste ${far} ${unit}.`,
    hosts: "Sterne mit Planeten",
    earth: "Von der Erde",
    side: "Von der Seite",
    note: "Ein Sternbild ist ein Zufallsbild: Die Sterne sehen nur von hier nah beieinander aus.",
    brightest: "Die hellsten Sterne",
    star: "Stern",
    planets: (n) => (n === 1 ? "1 bekannter Planet" : `${n} bekannte Planeten`),
    others: "Andere Sternbilder",
    choose: "Wählen ...",
    round: (n, total) => `Runde ${n} von ${total}`,
    qName: (zodiac) => (zodiac ? "Welches Sternzeichen ist das?" : "Welches Sternbild ist das?"),
    qStar: (name) => `In ${name}: Welcher der drei markierten Sterne ist uns am nächsten?`,
    right: "Richtig.",
    wrong: "Nicht ganz.",
    next: "Nächste Runde",
    finish: "Ergebnis zeigen",
    result: (score, total) => `${score} von ${total} richtig`,
    playAgain: "Noch einmal spielen",
    back: "Zurück",
    close: "Schließen",
  },
  ja: {
    button: "黄道十二星座",
    title: "黄道十二星座",
    intro: "まずカードで図形を覚え、そのあとで理解を確かめましょう。",
    deck: "どのカード？",
    deckZodiac: "黄道十二星座",
    deckOthers: (n) => `ほかの星座（${n}）`,
    learn: "カードで覚える",
    testName: "クイズ：どの星座？",
    testStar: "クイズ：いちばん近い星は？",
    view3d: "図形を3Dで見る",
    frontZodiac: "これはどの星座？",
    frontOther: "これはどの星座？",
    flip: "カードをめくる",
    known: "分かった",
    practise: "もう少し練習",
    progress: (k, n) => `${n}枚中${k}枚を習得`,
    deckDone: "すべてのカードを覚えました",
    deckDoneText: "では、理解を確かめましょう。",
    again: "もう一度カードから",
    facts: (n, near, far, unit) => `距離が分かっている星は${n}個。いちばん近い星は${near}${unit}、いちばん遠い星は${far}${unit}です。`,
    hosts: "惑星をもつ星",
    earth: "地球から",
    side: "横から",
    note: "星座は偶然の形です。星はここから見たときだけ近くに並んで見えます。",
    brightest: "いちばん明るい星",
    star: "星",
    planets: (n) => `既知の惑星${n}個`,
    others: "ほかの星座",
    choose: "選ぶ ...",
    round: (n, total) => `${total}問中${n}問目`,
    qName: () => "これはどの星座？",
    qStar: (name) => `${name}：印のついた3つの星のうち、いちばん近いのはどれ？`,
    right: "正解です。",
    wrong: "惜しい。",
    next: "次の問題",
    finish: "結果を見る",
    result: (score, total) => `${total}問中${score}問正解`,
    playAgain: "もう一度遊ぶ",
    back: "戻る",
    close: "閉じる",
  },
  bg: {
    button: "Зодиакални знаци",
    title: "Зодиакални знаци",
    intro: "Първо научете фигурите с карти, после проверете знанията си.",
    deck: "Кои карти?",
    deckZodiac: "12-те знака на зодиака",
    deckOthers: (n) => `Други съзвездия (${n})`,
    learn: "Учене с карти",
    testName: "Викторина: кое е?",
    testStar: "Викторина: коя звезда е най-близка?",
    view3d: "Виж фигурите в 3D",
    frontZodiac: "Кой зодиакален знак е това?",
    frontOther: "Кое съзвездие е това?",
    flip: "Обърни картата",
    known: "Знаех го",
    practise: "Още упражнение",
    progress: (k, n) => `${k} от ${n} научени`,
    deckDone: "Всички карти са научени",
    deckDoneText: "Сега проверете знанията си.",
    again: "Картите отначало",
    facts: (n, near, far, unit) => `${n} звезди с известно разстояние. Най-близката е на ${near} ${unit}, най-далечната на ${far} ${unit}.`,
    hosts: "Звезди с планети",
    earth: "От Земята",
    side: "Отстрани",
    note: "Съзвездието е случайна картина: звездите изглеждат близо една до друга само оттук.",
    brightest: "Най-ярките звезди",
    star: "Звезда",
    planets: (n) => (n === 1 ? "1 известна планета" : `${n} известни планети`),
    others: "Други съзвездия",
    choose: "Изберете ...",
    round: (n, total) => `Рунд ${n} от ${total}`,
    qName: (zodiac) => (zodiac ? "Кой зодиакален знак е това?" : "Кое съзвездие е това?"),
    qStar: (name) => `В ${name}: коя от трите отбелязани звезди е най-близка до нас?`,
    right: "Вярно.",
    wrong: "Не съвсем.",
    next: "Следващ рунд",
    finish: "Покажи резултата",
    result: (score, total) => `${score} от ${total} верни`,
    playAgain: "Играй отново",
    back: "Назад",
    close: "Затвори",
  },
};

const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// getSky() is the constellations module, getLang() the language, unit() the unit of a distance (ly), flyTo(view) moves the camera,
// onVisit(id) and onQuizEnd(score, total) tell the missions.
export function initAtlas({ getSky, getLang, unit, flyTo, onVisit, onQuizEnd }) {
  const panel = document.getElementById("atlas-panel");
  const body = document.getElementById("atlas-body");
  const t = () => ATLAS_TEXT[getLang()] ?? ATLAS_TEXT.en;
  let screen = "home"; // home, cards, name, star, list, figure
  let deck = "zodiac";
  let cards = null; // { queue, known, total, flipped, index }
  let quiz = null;
  let selected = null;

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
  const NS = "http://www.w3.org/2000/svg";
  const svg = (tag, attrs, content) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (content != null) e.textContent = content;
    return e;
  };

  // ---------------------------------------------------------------- the decks and the figures
  function deckIds(which = deck) {
    const { constellations } = getSky().data;
    if (which === "zodiac") return ZODIAC_ORDER;
    return constellations.filter((c) => !c.zodiac).sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id)).map((c) => c.id);
  }
  const constellationOf = (id) => getSky().data.constellations.find((c) => c.id === id);
  const nameOf = (id) => getSky().data.nameOf(constellationOf(id), getLang());
  const number = (x) => Math.round(x).toLocaleString(getLang());

  // The figure on the sky as we see it (a gnomonic projection around its middle, east to the left); marked: stars to mark with a letter.
  function figure(id, marked = [], revealed = false, picked = null, answer = null) {
    const { stars } = getSky().data;
    const c = constellationOf(id);
    const RAD = Math.PI / 180;
    const ids = [...new Set(c.lines.flat())];
    const ra0 = ids.reduce((s, x) => s + stars[x][0], 0) / ids.length;
    const dec0 = ids.reduce((s, x) => s + stars[x][1], 0) / ids.length;
    const project = (x) => {
      const ra = (stars[x][0] - ra0) * RAD;
      const dec = stars[x][1] * RAD;
      const d0 = dec0 * RAD;
      const k = Math.sin(d0) * Math.sin(dec) + Math.cos(d0) * Math.cos(dec) * Math.cos(ra);
      return [-(Math.cos(dec) * Math.sin(ra)) / k, (Math.cos(d0) * Math.sin(dec) - Math.sin(d0) * Math.cos(dec) * Math.cos(ra)) / k];
    };
    const pts = Object.fromEntries(ids.map((x) => [x, project(x)]));
    const xs = Object.values(pts).map((p) => p[0]);
    const ys = Object.values(pts).map((p) => p[1]);
    const w = 400;
    const h = 220;
    const pad = 28;
    const spanX = Math.max(...xs) - Math.min(...xs) || 1;
    const spanY = Math.max(...ys) - Math.min(...ys) || 1;
    const scale = Math.min((w - 2 * pad) / spanX, (h - 2 * pad) / spanY);
    const px = (x) => pad + (pts[x][0] - Math.min(...xs)) * scale + (w - 2 * pad - spanX * scale) / 2;
    const py = (x) => h - pad - (pts[x][1] - Math.min(...ys)) * scale - (h - 2 * pad - spanY * scale) / 2;
    const d = svg("svg", { viewBox: `0 0 ${w} ${h}`, class: "atlas-diagram", role: "img", "aria-hidden": "true" });
    for (const line of c.lines) {
      for (let i = 0; i + 1 < line.length; i++) d.append(svg("line", { x1: px(line[i]), y1: py(line[i]), x2: px(line[i + 1]), y2: py(line[i + 1]), stroke: c.zodiac ? "#b8e6c1" : "#8fa8d8", "stroke-opacity": ".7" }));
    }
    for (const x of ids) d.append(svg("circle", { cx: px(x), cy: py(x), r: 2.6, fill: "#fff", "fill-opacity": ".85" }));
    marked.forEach((o, i) => {
      const good = revealed && o === answer;
      const bad = revealed && o === picked && o !== answer;
      d.append(svg("circle", { cx: px(o.id), cy: py(o.id), r: 11, fill: good ? "#7cffb2" : bad ? "#ff7864" : "#9fd0ff" }));
      d.append(svg("text", { x: px(o.id), y: py(o.id) + 4, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#05060a" }, "ABC"[i]));
      if (revealed) d.append(svg("text", { x: px(o.id), y: py(o.id) + 26, "text-anchor": "middle", "font-size": 11, fill: "#fff" }, `${number(o.dist)} ${unit()}`));
    });
    return d;
  }

  // a figure on the map: bright, with the distances, and the camera to the Earth or to the side
  function look(id, where = "earth") {
    const sky = getSky();
    sky.focus(id, unit());
    flyTo(sky.views(id)[where]);
    track("atlas-select");
    onVisit?.(id);
  }

  // ---------------------------------------------------------------- the screens
  function home() {
    const tx = t();
    const sky = getSky();
    const others = deckIds("others").length;
    const parts = [el("p", "hint", tx.intro), el("h3", "", tx.deck)];
    const row = el("div", "atlas-decks");
    for (const [key, label] of [["zodiac", tx.deckZodiac], ["others", tx.deckOthers(others)]]) {
      const b = button(label, deck === key ? "on" : "", () => ((deck = key), render()));
      b.setAttribute("aria-pressed", String(deck === key));
      row.append(b);
    }
    parts.push(row, button(tx.learn, "atlas-main", startCards), button(tx.testName, "atlas-wide", startName), button(tx.testStar, "atlas-wide", startStar), button(tx.view3d, "atlas-wide", () => ((screen = "list"), render())));
    body.replaceChildren(...parts);
    return sky;
  }

  // ---- the flashcards
  function startCards() {
    const ids = deckIds();
    cards = { queue: [...ids], total: ids.length, known: 0, flipped: false };
    screen = "cards";
    track("atlas-cards-start");
    render();
  }
  function renderCards() {
    const tx = t();
    if (!cards.queue.length) {
      const end = el("div", "atlas-end");
      end.append(el("p", "atlas-score", tx.deckDone), el("p", "", tx.deckDoneText), button(tx.testName, "atlas-main", startName), button(tx.again, "atlas-wide", startCards), button(tx.back, "atlas-wide", () => ((screen = "home"), render())));
      return body.replaceChildren(end);
    }
    const id = cards.queue[0];
    const c = constellationOf(id);
    const parts = [el("p", "atlas-round", `${tx.progress(cards.known, cards.total)}`)];
    parts.push(el("p", "atlas-q", c.zodiac ? tx.frontZodiac : tx.frontOther), figure(id));
    if (!cards.flipped) parts.push(button(tx.flip, "atlas-main", () => ((cards.flipped = true), render())));
    else {
      const info = getSky().data.info(id);
      parts.push(el("h3", "atlas-name", nameOf(id)));
      parts.push(el("p", "", tx.facts(info.stars.length, number(info.nearest.dist), number(info.farthest.dist), unit())));
      const hosts = info.stars.filter((s) => s.planets);
      if (hosts.length) parts.push(el("p", "atlas-hosts", `${tx.hosts}: ${hosts.map((s) => `${s.host} (${s.planets})`).join(", ")}`));
      const views = el("div", "atlas-views");
      views.append(button(tx.earth, "", () => look(id, "earth")), button(tx.side, "", () => look(id, "side")));
      parts.push(views);
      const answer = el("div", "atlas-views");
      answer.append(
        button(tx.practise, "", () => {
          cards.queue.push(cards.queue.shift());
          cards.flipped = false;
          render();
        }),
        button(tx.known, "right-btn", () => {
          cards.queue.shift();
          cards.known += 1;
          cards.flipped = false;
          getSky().clearFocus();
          render();
        })
      );
      parts.push(answer);
    }
    body.replaceChildren(...parts, button(tx.back, "atlas-wide", () => ((screen = "home"), getSky().clearFocus(), render())));
  }

  // ---- the quiz: which one is it
  function startName() {
    const ids = shuffle(deckIds());
    const rounds = ids.slice(0, ROUNDS).map((id) => {
      const wrong = shuffle(ids.filter((x) => x !== id)).slice(0, 3);
      return { id, options: shuffle([id, ...wrong]) };
    });
    quiz = { kind: "name", rounds, index: 0, score: 0, picked: null, done: false };
    screen = "name";
    track("atlas-quiz-start");
    render();
  }
  // ---- the quiz: which star is the nearest
  function makeStarRound(used, ids) {
    const sky = getSky();
    for (let tries = 0; tries < 80; tries++) {
      const id = ids[Math.floor(Math.random() * ids.length)];
      if (used.has(id)) continue;
      const info = sky.data.info(id);
      if (info.stars.length < 3) continue;
      const three = shuffle(info.stars).slice(0, 3).sort((a, b) => a.dist - b.dist);
      if (three[1].dist < three[0].dist * 1.25) continue; // the nearest must be clearly nearer than the next
      return { id, options: shuffle(three), answer: three[0] };
    }
    return null;
  }
  function startStar() {
    const used = new Set();
    const rounds = [];
    const ids = deckIds();
    for (let i = 0; i < ROUNDS; i++) {
      const r = makeStarRound(used, ids);
      if (!r) break;
      used.add(r.id);
      rounds.push(r);
    }
    quiz = { kind: "star", rounds, index: 0, score: 0, picked: null, done: false };
    screen = "star";
    track("atlas-quiz-start");
    render();
  }
  function renderQuiz() {
    const tx = t();
    if (quiz.done) {
      const end = el("div", "atlas-end");
      end.append(el("p", "atlas-score", tx.result(quiz.score, quiz.rounds.length)), button(tx.playAgain, "atlas-main", quiz.kind === "name" ? startName : startStar), button(tx.back, "atlas-wide", () => ((screen = "home"), render())));
      return body.replaceChildren(end);
    }
    const round = quiz.rounds[quiz.index];
    const revealed = quiz.picked != null;
    const isName = quiz.kind === "name";
    const parts = [el("p", "atlas-round", `${tx.round(quiz.index + 1, quiz.rounds.length)}  ·  ${quiz.score} ✓`)];
    parts.push(el("p", "atlas-q", isName ? tx.qName(constellationOf(round.id).zodiac) : tx.qStar(nameOf(round.id))));
    parts.push(isName ? figure(round.id) : figure(round.id, round.options, revealed, quiz.picked, round.answer));
    const list = el("div", isName ? "atlas-names" : "atlas-options");
    round.options.forEach((o, i) => {
      const value = isName ? o : o;
      const label = isName ? nameOf(o) : `${"ABC"[i]}${revealed ? `   ·   ${number(o.dist)} ${unit()}` : ""}`;
      const b = button(label, "", () => {
        quiz.picked = value;
        if (isName ? value === round.id : value === round.answer) quiz.score += 1;
        render();
      });
      if (revealed) {
        b.disabled = true;
        const good = isName ? value === round.id : value === round.answer;
        if (good) b.classList.add("right");
        else if (value === quiz.picked) b.classList.add("wrong");
      }
      list.append(b);
    });
    parts.push(list);
    if (revealed) {
      const ok = isName ? quiz.picked === round.id : quiz.picked === round.answer;
      parts.push(el("p", "atlas-answer", `${ok ? tx.right : tx.wrong} ${isName ? nameOf(round.id) : tx.note}`));
      const last = quiz.index === quiz.rounds.length - 1;
      parts.push(
        button(last ? tx.finish : tx.next, "atlas-main", () => {
          if (last) {
            quiz.done = true;
            track(`atlas-quiz-end-${quiz.score}`);
            onQuizEnd?.(quiz.score, quiz.rounds.length);
          } else {
            quiz.index += 1;
            quiz.picked = null;
          }
          render();
        }),
        button(tx.side, "atlas-wide", () => look(round.id, "side"))
      );
    }
    body.replaceChildren(...parts, button(tx.back, "atlas-wide", () => ((screen = "home"), render())));
  }

  // ---- the figures in 3D: a list, and one figure with its stars
  function renderList() {
    const tx = t();
    const lang = getLang();
    const { constellations, nameOf: name } = getSky().data;
    const parts = [el("h3", "", tx.deckZodiac)];
    const grid = el("div", "atlas-grid");
    for (const id of ZODIAC_ORDER) grid.append(button(nameOf(id), "", () => ((selected = id), (screen = "figure"), look(id, "earth"), render())));
    parts.push(grid, el("h3", "", tx.others));
    const choose = el("select", "atlas-select");
    choose.setAttribute("aria-label", tx.others);
    choose.append(new Option(tx.choose, ""));
    for (const c of [...constellations].filter((x) => !x.zodiac).sort((a, b) => name(a, lang).localeCompare(name(b, lang), lang))) choose.append(new Option(name(c, lang), c.id));
    choose.addEventListener("change", () => choose.value && ((selected = choose.value), (screen = "figure"), look(selected, "earth"), render()));
    parts.push(choose, button(tx.back, "atlas-wide", () => ((screen = "home"), getSky().clearFocus(), render())));
    body.replaceChildren(...parts);
  }
  function renderFigure() {
    const tx = t();
    const info = getSky().data.info(selected);
    const parts = [el("h3", "atlas-name", nameOf(selected))];
    parts.push(el("p", "", tx.facts(info.stars.length, number(info.nearest.dist), number(info.farthest.dist), unit())));
    const row = el("div", "atlas-views");
    row.append(button(tx.earth, "", () => look(selected, "earth")), button(tx.side, "", () => look(selected, "side")));
    parts.push(row, el("h3", "", tx.brightest));
    const table = el("div", "atlas-stars");
    for (const s of info.stars.slice(0, 8)) {
      const line = el("div", "atlas-star");
      line.append(el("span", "", s.host ? s.host : `${tx.star} ${s.id}`), el("span", "atlas-dist", `${number(s.dist)} ${unit()}`));
      if (s.planets) line.append(el("span", "atlas-planets", tx.planets(s.planets)));
      table.append(line);
    }
    parts.push(table, el("p", "hint", tx.note), button(tx.back, "atlas-wide", () => ((screen = "list"), getSky().clearFocus(), render())));
    body.replaceChildren(...parts);
  }

  function render() {
    if (panel.hidden) return;
    const tx = t();
    document.getElementById("atlas-title").textContent = tx.title;
    document.getElementById("atlas-close").setAttribute("aria-label", tx.close);
    if (!getSky()) return;
    if (screen === "cards") renderCards();
    else if (screen === "name" || screen === "star") renderQuiz();
    else if (screen === "list") renderList();
    else if (screen === "figure") renderFigure();
    else home();
  }
  function toggle(open = panel.hidden) {
    panel.hidden = !open;
    if (open) {
      screen = "home";
      quiz = null;
      cards = null;
      track("atlas-open");
      render();
    } else getSky()?.clearFocus();
    window.dispatchEvent(new Event("resize")); // the picture is centred in the free space beside the panel (layoutView)
  }
  document.getElementById("atlas-close").addEventListener("click", () => toggle(false));
  window.addEventListener("keydown", (e) => e.key === "Escape" && !panel.hidden && toggle(false));
  return { open: () => toggle(true), render, label: () => t().button };
}
