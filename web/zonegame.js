// The zone quiz: five rounds, each a planetary system from the catalogue with two or three planets whose orbits are known, and the question
// which of them orbits inside the candidate zone (the distances where a planet with an Earth like albedo would have an equilibrium
// temperature of 180 to 310 K, the rule of this map). The star and the distances are shown, the zone is not, until the answer is given.
// Only systems where exactly one of the shown planets lies in the zone are used, so there is one right answer. The zone only says that
// the temperature could fit, not that a planet is habitable, and the panel says so. Nothing is stored.

import { track } from "./stats.js";

const ROUNDS = 5;

export const ZONE_TEXT = {
  en: {
    button: "Zone quiz",
    title: "In the zone?",
    round: (n, total) => `Round ${n} of ${total}`,
    question: (star) => `Which planet of ${star} orbits inside the candidate zone?`,
    star: (teff, rad) => `The star: ${teff} K, ${rad} times the radius of the Sun.`,
    au: (a) => `${a} AU`,
    hot: "too hot",
    cold: "too cold",
    inside: "inside the zone",
    right: "Correct.",
    wrong: "Not quite.",
    explain: (star, inner, outer) =>
      `The candidate zone of ${star} reaches from ${inner} to ${outer} AU: there a planet with an Earth like albedo would have an equilibrium temperature of 180 to 310 K.`,
    caveat: "The zone only says that the temperature could fit. It does not say that a planet is habitable.",
    next: "Next round",
    finish: "Show the result",
    look: "See this system in 3D",
    result: (score, total) => `${score} of ${total} right`,
    again: "Play again",
    close: "Close",
    empty: "No round could be made from the data.",
  },
  de: {
    button: "Zonen-Quiz",
    title: "In der Zone?",
    round: (n, total) => `Runde ${n} von ${total}`,
    question: (star) => `Welcher Planet von ${star} läuft innerhalb der Kandidatenzone?`,
    star: (teff, rad) => `Der Stern: ${teff} K, ${rad}-facher Radius der Sonne.`,
    au: (a) => `${a} AE`,
    hot: "zu heiß",
    cold: "zu kalt",
    inside: "in der Zone",
    right: "Richtig.",
    wrong: "Nicht ganz.",
    explain: (star, inner, outer) =>
      `Die Kandidatenzone von ${star} reicht von ${inner} bis ${outer} AE: Dort hätte ein Planet mit erdähnlicher Albedo eine Gleichgewichtstemperatur von 180 bis 310 K.`,
    caveat: "Die Zone sagt nur, dass die Temperatur passen könnte. Sie sagt nicht, dass ein Planet bewohnbar ist.",
    next: "Nächste Runde",
    finish: "Ergebnis zeigen",
    look: "System in 3D ansehen",
    result: (score, total) => `${score} von ${total} richtig`,
    again: "Noch einmal spielen",
    close: "Schließen",
    empty: "Aus den Daten ließ sich keine Runde bilden.",
  },
  ja: {
    button: "ゾーンクイズ",
    title: "ゾーンの中？",
    round: (n, total) => `${total}問中${n}問目`,
    question: (star) => `${star}のどの惑星が候補ゾーンの内側を回っていますか？`,
    star: (teff, rad) => `恒星：${teff} K、半径は太陽の${rad}倍。`,
    au: (a) => `${a} AU`,
    hot: "熱すぎる",
    cold: "冷たすぎる",
    inside: "ゾーンの内側",
    right: "正解です。",
    wrong: "惜しい。",
    explain: (star, inner, outer) =>
      `${star}の候補ゾーンは${inner}〜${outer} AUです。そこでは、地球と同じ程度の反射率の惑星の平衡温度が180〜310 Kになります。`,
    caveat: "ゾーンは温度が合う可能性を示すだけで、惑星が居住可能だとは言っていません。",
    next: "次の問題",
    finish: "結果を見る",
    look: "この惑星系を3Dで見る",
    result: (score, total) => `${total}問中${score}問正解`,
    again: "もう一度遊ぶ",
    close: "閉じる",
    empty: "データから問題を作れませんでした。",
  },
  bg: {
    button: "Викторина за зоната",
    title: "В зоната ли е?",
    round: (n, total) => `Рунд ${n} от ${total}`,
    question: (star) => `Коя планета на ${star} обикаля в зоната на кандидатите?`,
    star: (teff, rad) => `Звездата: ${teff} K, радиус ${rad} пъти този на Слънцето.`,
    au: (a) => `${a} AU`,
    hot: "твърде гореща",
    cold: "твърде студена",
    inside: "в зоната",
    right: "Вярно.",
    wrong: "Не съвсем.",
    explain: (star, inner, outer) =>
      `Зоната на кандидатите на ${star} е от ${inner} до ${outer} AU: там планета с албедо като на Земята би имала равновесна температура от 180 до 310 K.`,
    caveat: "Зоната казва само, че температурата може да е подходяща. Тя не казва, че планетата е обитаема.",
    next: "Следващ рунд",
    finish: "Покажи резултата",
    look: "Виж тази система в 3D",
    result: (score, total) => `${score} от ${total} верни`,
    again: "Играй отново",
    close: "Затвори",
    empty: "От данните не можа да се направи рунд.",
  },
};

const orbitAu = (star, planet) => (planet.pl_orbper ? Math.cbrt((star.st_mass ?? 1) * (planet.pl_orbper / 365.25) ** 2) : planet.pl_orbsmax);
const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const fmt = (a) => (a >= 10 ? a.toFixed(1) : a >= 1 ? a.toFixed(2) : a >= 0.1 ? a.toFixed(3) : a.toFixed(4)).replace(/\.?0+$/, "");

// One round from a system: the planet in the zone and up to two of the others, but only if exactly one planet of those shown is inside.
function makeRound(star, zone) {
  const known = star.planets.map((p) => ({ planet: p, au: orbitAu(star, p) })).filter((x) => x.au);
  const inside = known.filter((x) => x.au >= zone.inner && x.au <= zone.outer);
  if (known.length < 2 || inside.length !== 1) return null;
  const others = shuffle(known.filter((x) => x !== inside[0])).slice(0, 2);
  return { star, zone, options: shuffle([inside[0], ...others]), answer: inside[0] };
}

// getStars() gives the catalogue, zoneAu(star) the zone, explore(name) flies to the system, onEnd(score, total) is told when a game is over.
export function initZoneGame({ getStars, zoneAu, getLang, explore, onEnd }) {
  const panel = document.getElementById("zone-panel");
  const body = document.getElementById("zone-body");
  const t = () => ZONE_TEXT[getLang()] ?? ZONE_TEXT.en;
  let pool = null;
  let game = null;

  function buildPool() {
    pool = [];
    for (const star of getStars()) {
      const zone = zoneAu(star);
      if (!zone) continue;
      const round = makeRound(star, zone);
      if (round) pool.push(star);
    }
  }

  function el(tag, cls, content) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (content != null) e.textContent = content;
    return e;
  }
  const NS = "http://www.w3.org/2000/svg";
  function svg(tag, attrs, content) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (content != null) e.textContent = content;
    return e;
  }

  // The axis: the distance on a log scale, the star on the left, the planets as letters, and after the answer the zone as a green band.
  function diagram(round, revealed, picked) {
    const w = 400;
    const h = 96;
    const aus = round.options.map((o) => o.au);
    const lo = Math.min(...aus) / 1.6;
    const hi = Math.max(...aus) * 1.6;
    const x = (a) => 52 + (338 * Math.log(Math.min(Math.max(a, lo), hi) / lo)) / Math.log(hi / lo);
    const d = svg("svg", { viewBox: `0 0 ${w} ${h}`, class: "zone-diagram", role: "img", "aria-hidden": "true" });
    if (revealed) {
      const x1 = x(round.zone.inner);
      const x2 = x(round.zone.outer);
      d.append(svg("rect", { x: x1, y: 22, width: Math.max(x2 - x1, 2), height: 44, rx: 6, fill: "#7cffb2", "fill-opacity": ".22", stroke: "#7cffb2", "stroke-opacity": ".6" }));
    }
    d.append(svg("line", { x1: 40, y1: 44, x2: w - 8, y2: 44, stroke: "#fff", "stroke-opacity": ".25" }));
    d.append(svg("circle", { cx: 20, cy: 44, r: 11, fill: round.star.color || "#ffd27a" }));
    round.options.forEach((o, i) => {
      const letter = "ABC"[i];
      const good = revealed && o === round.answer;
      const bad = revealed && o === picked && o !== round.answer;
      d.append(svg("circle", { cx: x(o.au), cy: 44, r: 9, fill: good ? "#7cffb2" : bad ? "#ff7864" : "#9fd0ff" }));
      d.append(svg("text", { x: x(o.au), y: 48, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#05060a" }, letter));
      d.append(svg("text", { x: x(o.au), y: 84, "text-anchor": "middle", "font-size": 10, fill: "#fff", "fill-opacity": ".7" }, fmt(o.au)));
    });
    return d;
  }

  function render() {
    const tx = t();
    document.getElementById("zone-title").textContent = tx.title;
    document.getElementById("zone-close").setAttribute("aria-label", tx.close);
    if (!game) return body.replaceChildren(el("p", "", tx.empty));
    if (game.done) {
      const end = el("div", "zone-end");
      end.append(el("p", "zone-score", tx.result(game.score, ROUNDS)));
      const again = el("button", "zone-main", tx.again);
      again.type = "button";
      again.addEventListener("click", start);
      end.append(again, el("p", "hint", tx.caveat));
      return body.replaceChildren(end);
    }
    const round = game.rounds[game.index];
    const picked = game.picked;
    const revealed = picked != null;
    const parts = [
      el("p", "zone-round", `${tx.round(game.index + 1, ROUNDS)}  ·  ${game.score} ✓`),
      el("p", "zone-q", tx.question(round.star.hostname)),
      el("p", "hint", tx.star(Math.round(round.star.st_teff), +round.star.st_rad.toFixed(2))),
      diagram(round, revealed, picked),
    ];
    const list = el("div", "zone-options");
    round.options.forEach((o, i) => {
      const b = el("button", "", `${"ABC"[i]}   ${o.planet.pl_name}   ·   ${tx.au(fmt(o.au))}`);
      b.type = "button";
      if (revealed) {
        b.disabled = true;
        const inside = o === round.answer;
        const note = inside ? tx.inside : o.au < round.zone.inner ? tx.hot : tx.cold;
        b.append(el("span", "zone-note", note));
        if (inside) b.classList.add("right");
        else if (o === picked) b.classList.add("wrong");
      } else {
        b.addEventListener("click", () => {
          game.picked = o;
          if (o === round.answer) game.score += 1;
          render();
        });
      }
      list.append(b);
    });
    parts.push(list);
    if (revealed) {
      const ok = picked === round.answer;
      parts.push(el("p", "zone-answer", `${ok ? tx.right : tx.wrong} ${tx.explain(round.star.hostname, fmt(round.zone.inner), fmt(round.zone.outer))}`));
      const look = el("button", "zone-look", tx.look);
      look.type = "button";
      look.addEventListener("click", () => {
        toggle(false);
        explore(round.answer.planet.pl_name);
      });
      const last = game.index === ROUNDS - 1;
      const next = el("button", "zone-main", last ? tx.finish : tx.next);
      next.type = "button";
      next.addEventListener("click", () => {
        if (last) {
          game.done = true;
          track(`zone-quiz-end-${game.score}`);
          onEnd?.(game.score, ROUNDS);
        } else {
          game.index += 1;
          game.picked = null;
        }
        render();
      });
      parts.push(next, look, el("p", "hint", tx.caveat));
    }
    body.replaceChildren(...parts);
  }

  function start() {
    if (!pool) buildPool();
    const rounds = shuffle(pool)
      .map((star) => makeRound(star, zoneAu(star)))
      .filter(Boolean)
      .slice(0, ROUNDS);
    game = rounds.length === ROUNDS ? { rounds, index: 0, score: 0, picked: null, done: false } : null;
    track("zone-quiz-start");
    render();
  }
  function toggle(open = panel.hidden) {
    panel.hidden = !open;
    if (open) start();
  }
  document.getElementById("zone-close").addEventListener("click", () => toggle(false));
  window.addEventListener("keydown", (e) => e.key === "Escape" && !panel.hidden && toggle(false));
  return { open: () => toggle(true), render };
}
