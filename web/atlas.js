// The constellation atlas: the 12 signs of the zodiac (and the other constellations in a list) with the stars of each figure at their real
// distances. A choice draws the figure bright on the map, with the distance of every star, and flies the camera to the Earth (the figure as we
// know it); a button turns the view to the side, where the figure falls apart because its stars are at very different distances. A quiz asks
// which of three marked stars of a figure is the nearest to us. Nothing is stored. Data and credits: see constellations.js.

import { track } from "./stats.js";

const ZODIAC_ORDER = ["Ari", "Tau", "Gem", "Cnc", "Leo", "Vir", "Lib", "Sco", "Sgr", "Cap", "Aqr", "Psc"];
const ROUNDS = 5;

export const ATLAS_TEXT = {
  en: {
    button: "Constellation atlas",
    title: "Constellation atlas",
    intro: "Pick a constellation. From the Earth it looks as we know it, from the side its stars are at very different distances.",
    zodiac: "The 12 of the zodiac",
    others: "Other constellations",
    choose: "Choose ...",
    earth: "From the Earth",
    side: "From the side",
    facts: (n, near, far, unit) => `${n} stars with a known distance. The nearest is ${near} ${unit} away, the farthest ${far} ${unit}.`,
    brightest: "The brightest stars",
    planets: (n) => (n === 1 ? "1 known planet" : `${n} known planets`),
    star: "Star",
    note: "A constellation is a chance picture: the stars only look close together from here.",
    quiz: "Quiz: which star is the nearest?",
    round: (n, total) => `Round ${n} of ${total}`,
    question: (name) => `In ${name}: which of the three marked stars is the nearest to us?`,
    right: "Correct.",
    wrong: "Not quite.",
    next: "Next round",
    finish: "Show the result",
    result: (score, total) => `${score} of ${total} right`,
    again: "Play again",
    back: "Back to the atlas",
    close: "Close",
    lookSide: "See the figure from the side",
  },
  de: {
    button: "Sternbild-Atlas",
    title: "Sternbild-Atlas",
    intro: "Wähle ein Sternbild. Von der Erde sieht es aus, wie wir es kennen, von der Seite sind seine Sterne sehr verschieden weit entfernt.",
    zodiac: "Die 12 des Tierkreises",
    others: "Weitere Sternbilder",
    choose: "Wählen ...",
    earth: "Von der Erde",
    side: "Von der Seite",
    facts: (n, near, far, unit) => `${n} Sterne mit bekannter Entfernung. Der nächste ist ${near} ${unit} entfernt, der fernste ${far} ${unit}.`,
    brightest: "Die hellsten Sterne",
    planets: (n) => (n === 1 ? "1 bekannter Planet" : `${n} bekannte Planeten`),
    star: "Stern",
    note: "Ein Sternbild ist ein Zufallsbild: Die Sterne sehen nur von hier nah beieinander aus.",
    quiz: "Quiz: Welcher Stern ist am nächsten?",
    round: (n, total) => `Runde ${n} von ${total}`,
    question: (name) => `In ${name}: Welcher der drei markierten Sterne ist uns am nächsten?`,
    right: "Richtig.",
    wrong: "Nicht ganz.",
    next: "Nächste Runde",
    finish: "Ergebnis zeigen",
    result: (score, total) => `${score} von ${total} richtig`,
    again: "Noch einmal spielen",
    back: "Zurück zum Atlas",
    close: "Schließen",
    lookSide: "Die Figur von der Seite ansehen",
  },
  ja: {
    button: "星座アトラス",
    title: "星座アトラス",
    intro: "星座を選んでください。地球から見ると見慣れた形ですが、横から見ると星はそれぞれ距離が大きく違います。",
    zodiac: "黄道十二星座",
    others: "ほかの星座",
    choose: "選ぶ ...",
    earth: "地球から",
    side: "横から",
    facts: (n, near, far, unit) => `距離が分かっている星は${n}個。いちばん近い星は${near}${unit}、いちばん遠い星は${far}${unit}です。`,
    brightest: "いちばん明るい星",
    planets: (n) => `既知の惑星${n}個`,
    star: "星",
    note: "星座は偶然の形です。星はここから見たときだけ近くに並んで見えます。",
    quiz: "クイズ：いちばん近い星は？",
    round: (n, total) => `${total}問中${n}問目`,
    question: (name) => `${name}：印のついた3つの星のうち、いちばん近いのはどれ？`,
    right: "正解です。",
    wrong: "惜しい。",
    next: "次の問題",
    finish: "結果を見る",
    result: (score, total) => `${total}問中${score}問正解`,
    again: "もう一度遊ぶ",
    back: "アトラスに戻る",
    close: "閉じる",
    lookSide: "図形を横から見る",
  },
  bg: {
    button: "Атлас на съзвездията",
    title: "Атлас на съзвездията",
    intro: "Изберете съзвездие. От Земята изглежда както го знаем, отстрани звездите му са на много различни разстояния.",
    zodiac: "12-те на зодиака",
    others: "Други съзвездия",
    choose: "Изберете ...",
    earth: "От Земята",
    side: "Отстрани",
    facts: (n, near, far, unit) => `${n} звезди с известно разстояние. Най-близката е на ${near} ${unit}, най-далечната на ${far} ${unit}.`,
    brightest: "Най-ярките звезди",
    planets: (n) => (n === 1 ? "1 известна планета" : `${n} известни планети`),
    star: "Звезда",
    note: "Съзвездието е случайна картина: звездите изглеждат близо една до друга само оттук.",
    quiz: "Викторина: коя звезда е най-близка?",
    round: (n, total) => `Рунд ${n} от ${total}`,
    question: (name) => `В ${name}: коя от трите отбелязани звезди е най-близка до нас?`,
    right: "Вярно.",
    wrong: "Не съвсем.",
    next: "Следващ рунд",
    finish: "Покажи резултата",
    result: (score, total) => `${score} от ${total} верни`,
    again: "Играй отново",
    back: "Обратно към атласа",
    close: "Затвори",
    lookSide: "Виж фигурата отстрани",
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
// ensureOn() switches the constellations on, onVisit(id) and onQuizEnd(score, total) tell the missions.
export function initAtlas({ getSky, getLang, unit, flyTo, ensureOn, onVisit, onQuizEnd }) {
  const panel = document.getElementById("atlas-panel");
  const body = document.getElementById("atlas-body");
  const t = () => ATLAS_TEXT[getLang()] ?? ATLAS_TEXT.en;
  let selected = null;
  let quiz = null;

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

  // ---------------------------------------------------------------- the list and one figure
  function select(id) {
    const sky = getSky();
    if (!sky) return;
    ensureOn();
    selected = id;
    quiz = null;
    sky.focus(id, unit());
    flyTo(sky.views(id).earth);
    track("atlas-select");
    onVisit?.(id);
    render();
  }

  function renderList() {
    const tx = t();
    const sky = getSky();
    const { constellations, nameOf } = sky.data;
    const lang = getLang();
    const parts = [el("p", "hint", tx.intro), el("h3", "", tx.zodiac)];
    const grid = el("div", "atlas-grid");
    for (const id of ZODIAC_ORDER) {
      const c = constellations.find((x) => x.id === id);
      grid.append(button(nameOf(c, lang), "", () => select(id)));
    }
    parts.push(grid, el("h3", "", tx.others));
    const choose = el("select", "atlas-select");
    choose.setAttribute("aria-label", tx.others);
    choose.append(new Option(tx.choose, ""));
    for (const c of [...constellations].filter((x) => !x.zodiac).sort((a, b) => nameOf(a, lang).localeCompare(nameOf(b, lang), lang))) choose.append(new Option(nameOf(c, lang), c.id));
    choose.addEventListener("change", () => choose.value && select(choose.value));
    parts.push(choose, button(tx.quiz, "atlas-main", startQuiz));
    body.replaceChildren(...parts);
  }

  function renderFigure() {
    const tx = t();
    const sky = getSky();
    const c = sky.data.constellations.find((x) => x.id === selected);
    const info = sky.data.info(selected);
    const views = sky.views(selected);
    const parts = [el("h3", "atlas-name", sky.data.nameOf(c, getLang()))];
    parts.push(el("p", "", tx.facts(info.stars.length, Math.round(info.nearest.dist).toLocaleString(getLang()), Math.round(info.farthest.dist).toLocaleString(getLang()), unit())));
    const row = el("div", "atlas-views");
    row.append(button(tx.earth, "", () => flyTo(views.earth)), button(tx.side, "", () => flyTo(views.side)));
    parts.push(row, el("h3", "", tx.brightest));
    const table = el("div", "atlas-stars");
    for (const s of info.stars.slice(0, 8)) {
      const line = el("div", "atlas-star");
      line.append(el("span", "", s.host ? s.host : `${tx.star} ${s.id}`), el("span", "atlas-dist", `${Math.round(s.dist).toLocaleString(getLang())} ${unit()}`));
      if (s.planets) line.append(el("span", "atlas-planets", tx.planets(s.planets)));
      table.append(line);
    }
    parts.push(table, el("p", "hint", tx.note), button(tx.back, "", () => ((selected = null), getSky()?.clearFocus(), render())));
    body.replaceChildren(...parts);
  }

  // ---------------------------------------------------------------- the quiz
  function makeRound(used) {
    const sky = getSky();
    const { constellations } = sky.data;
    for (let tries = 0; tries < 80; tries++) {
      const c = constellations[Math.floor(Math.random() * constellations.length)];
      if (used.has(c.id)) continue;
      const info = sky.data.info(c.id);
      if (info.stars.length < 3) continue;
      const three = shuffle(info.stars).slice(0, 3).sort((a, b) => a.dist - b.dist);
      if (three[1].dist < three[0].dist * 1.25) continue; // the nearest must be clearly nearer than the next
      return { c, info, options: shuffle(three), answer: three[0] };
    }
    return null;
  }
  function startQuiz() {
    const used = new Set();
    const rounds = [];
    for (let i = 0; i < ROUNDS; i++) {
      const r = makeRound(used);
      if (!r) break;
      used.add(r.c.id);
      rounds.push(r);
    }
    quiz = { rounds, index: 0, score: 0, picked: null, done: false };
    selected = null;
    getSky()?.clearFocus();
    track("atlas-quiz-start");
    render();
  }

  // The figure on the sky as we see it (a gnomonic projection around its middle, east to the left), the three stars marked A, B and C.
  function diagram(round, revealed, picked) {
    const sky = getSky();
    const { stars } = sky.data;
    const RAD = Math.PI / 180;
    const ids = [...new Set(round.c.lines.flat())];
    const ra0 = ids.reduce((s, id) => s + stars[id][0], 0) / ids.length;
    const dec0 = ids.reduce((s, id) => s + stars[id][1], 0) / ids.length;
    const project = (id) => {
      const ra = (stars[id][0] - ra0) * RAD;
      const dec = stars[id][1] * RAD;
      const d0 = dec0 * RAD;
      const k = Math.sin(d0) * Math.sin(dec) + Math.cos(d0) * Math.cos(dec) * Math.cos(ra);
      return [-(Math.cos(dec) * Math.sin(ra)) / k, (Math.cos(d0) * Math.sin(dec) - Math.sin(d0) * Math.cos(dec) * Math.cos(ra)) / k];
    };
    const pts = Object.fromEntries(ids.map((id) => [id, project(id)]));
    const xs = Object.values(pts).map((p) => p[0]);
    const ys = Object.values(pts).map((p) => p[1]);
    const w = 400;
    const h = 220;
    const pad = 28;
    const scale = Math.min((w - 2 * pad) / (Math.max(...xs) - Math.min(...xs) || 1), (h - 2 * pad) / (Math.max(...ys) - Math.min(...ys) || 1));
    const px = (id) => pad + (pts[id][0] - Math.min(...xs)) * scale + (w - 2 * pad - (Math.max(...xs) - Math.min(...xs)) * scale) / 2;
    const py = (id) => h - pad - (pts[id][1] - Math.min(...ys)) * scale - (h - 2 * pad - (Math.max(...ys) - Math.min(...ys)) * scale) / 2;
    const d = svg("svg", { viewBox: `0 0 ${w} ${h}`, class: "atlas-diagram", role: "img", "aria-hidden": "true" });
    for (const line of round.c.lines) {
      for (let i = 0; i + 1 < line.length; i++) d.append(svg("line", { x1: px(line[i]), y1: py(line[i]), x2: px(line[i + 1]), y2: py(line[i + 1]), stroke: "#8fa8d8", "stroke-opacity": ".6" }));
    }
    for (const id of ids) d.append(svg("circle", { cx: px(id), cy: py(id), r: 2.5, fill: "#fff", "fill-opacity": ".8" }));
    round.options.forEach((o, i) => {
      const good = revealed && o === round.answer;
      const bad = revealed && o === picked && o !== round.answer;
      d.append(svg("circle", { cx: px(o.id), cy: py(o.id), r: 11, fill: good ? "#7cffb2" : bad ? "#ff7864" : "#9fd0ff" }));
      d.append(svg("text", { x: px(o.id), y: py(o.id) + 4, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#05060a" }, "ABC"[i]));
      if (revealed) d.append(svg("text", { x: px(o.id), y: py(o.id) + 26, "text-anchor": "middle", "font-size": 11, fill: "#fff" }, `${Math.round(o.dist)} ${unit()}`));
    });
    return d;
  }

  function renderQuiz() {
    const tx = t();
    const sky = getSky();
    if (quiz.done) {
      const end = el("div", "atlas-end");
      end.append(el("p", "atlas-score", tx.result(quiz.score, quiz.rounds.length)), button(tx.again, "atlas-main", startQuiz), button(tx.back, "", () => ((quiz = null), render())));
      return body.replaceChildren(end);
    }
    const round = quiz.rounds[quiz.index];
    const revealed = quiz.picked != null;
    const name = sky.data.nameOf(round.c, getLang());
    const parts = [el("p", "atlas-round", `${tx.round(quiz.index + 1, quiz.rounds.length)}  ·  ${quiz.score} ✓`), el("p", "atlas-q", tx.question(name)), diagram(round, revealed, quiz.picked)];
    const list = el("div", "atlas-options");
    round.options.forEach((o, i) => {
      const b = button(`${"ABC"[i]}${revealed ? `   ·   ${Math.round(o.dist).toLocaleString(getLang())} ${unit()}` : ""}`, "", () => {
        quiz.picked = o;
        if (o === round.answer) quiz.score += 1;
        render();
      });
      if (revealed) {
        b.disabled = true;
        if (o === round.answer) b.classList.add("right");
        else if (o === quiz.picked) b.classList.add("wrong");
      }
      list.append(b);
    });
    parts.push(list);
    if (revealed) {
      parts.push(el("p", "atlas-answer", `${quiz.picked === round.answer ? tx.right : tx.wrong} ${tx.note}`));
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
        button(tx.lookSide, "", () => {
          sky.focus(round.c.id, unit());
          ensureOn();
          flyTo(sky.views(round.c.id).side);
        })
      );
    }
    body.replaceChildren(...parts);
  }

  function render() {
    if (panel.hidden) return;
    const tx = t();
    document.getElementById("atlas-title").textContent = tx.title;
    document.getElementById("atlas-close").setAttribute("aria-label", tx.close);
    if (!getSky()) return;
    if (quiz) renderQuiz();
    else if (selected) renderFigure();
    else renderList();
  }
  function toggle(open = panel.hidden) {
    panel.hidden = !open;
    if (open) {
      selected = null;
      quiz = null;
      track("atlas-open");
      render();
    } else getSky()?.clearFocus();
    window.dispatchEvent(new Event("resize")); // the picture is centred in the free space beside the panel (layoutView)
  }
  document.getElementById("atlas-close").addEventListener("click", () => toggle(false));
  window.addEventListener("keydown", (e) => e.key === "Escape" && !panel.hidden && toggle(false));
  return { open: () => toggle(true), render, label: () => t().button };
}
