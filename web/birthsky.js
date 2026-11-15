// "The sky at your birth": astrology next to the real sky. From a date of birth (optional, it stays in this browser only, also with an account):
// the sign of astrology (the "tropical" zodiac: twelve equal parts of 30 degrees of the Sun's path, counted from the spring equinox) and the
// constellation in which the Sun really stood (the boundaries of the International Astronomical Union, 1930). The two differ for most people,
// because the direction of the Earth's axis has moved by about 24 degrees since the signs were fixed (precession), and the Sun also crosses
// Ophiuchus, which astrology does not have. Astrology says nothing about a person; the page says so, and it writes no horoscope. The rules are
// pure functions, tested in tests/birthsky.test.mjs.

import { track } from "./stats.js";

export const KEY = "birth-date"; // "YYYY-MM-DD" in localStorage, never sent, never saved to the account
export const SIGNS = ["Ari", "Tau", "Gem", "Cnc", "Leo", "Vir", "Lib", "Sco", "Sgr", "Cap", "Aqr", "Psc"];
const RAD = Math.PI / 180;

// The ecliptic longitude of the Sun in degrees (from the spring equinox), for a moment in UTC. The short formula of the Astronomical Almanac,
// good to about 0.01 degrees for dates between 1950 and 2050.
export function sunLongitude(date) {
  const n = date.getTime() / 86400000 + 2440587.5 - 2451545.0; // days from J2000.0
  const L = 280.46 + 0.9856474 * n;
  const g = (357.528 + 0.9856003 * n) * RAD;
  const lambda = L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g);
  return ((lambda % 360) + 360) % 360;
}
// The sign of astrology for a longitude: every 30 degrees one, Aries from 0. near: within half a degree of a boundary, where the hour decides.
export function tropicalSign(lambda) {
  const index = Math.floor(lambda / 30) % 12;
  const into = lambda - index * 30;
  return { id: SIGNS[index], near: into < 0.5 || into > 29.5 };
}

// The constellation of the Sun by the day of the year: the days on which it enters each of them, by the IAU boundaries (they move by about a day
// in 70 years, so they are approximate). Month and day of the first day.
const SUN_IN = [
  [1, 19, "Cap"], [2, 16, "Aqr"], [3, 12, "Psc"], [4, 19, "Ari"], [5, 14, "Tau"], [6, 20, "Gem"], [7, 21, "Cnc"],
  [8, 10, "Leo"], [9, 16, "Vir"], [10, 31, "Lib"], [11, 23, "Sco"], [11, 30, "Oph"], [12, 18, "Sgr"],
];
export function sunConstellation(month, day) {
  let current = "Sgr"; // from 18 December to 18 January
  for (const [m, d, id] of SUN_IN) if (month > m || (month === m && day >= d)) current = id;
  return current;
}
export function parseDate(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text ?? "");
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d, 12));
  if (date.getUTCMonth() !== mo - 1 || y < 1900 || date > new Date()) return null;
  return { year: y, month: mo, day: d, noon: date };
}

export const BIRTHSKY_TEXT = {
  en: {
    title: "The sky at your birth",
    intro: "Your sign in astrology, and where the Sun really stood. Astrology is not a science: the signs say nothing about a person. Here you see what was really in the sky.",
    date: "Date of birth", show: "Show my sky",
    privacy: "Your date of birth stays in this browser only. It is not sent, not even with an account.",
    astrology: "Astrology says", sky: "The sky says",
    signLine: (name) => `${name}`, skyLine: (name) => `The Sun stood in the constellation ${name}`,
    near: "Your birthday is at the border of two signs: the hour of birth decides.",
    same: "This time astrology and the sky agree.",
    differ: "They differ because the Earth's axis has turned by about 24 degrees since the signs were fixed some 2,000 years ago: the Sun stands in front of other stars on the same date.",
    oph: "Ophiuchus, the Serpent Bearer, is a constellation that the Sun crosses every year, but astrology left it out.",
    approx: "The constellation follows the boundaries of the International Astronomical Union, the dates are about (± 1 day).",
    fly: "See the constellation in 3D", change: "Change the date", remove: "Remove the date",
  },
  de: {
    title: "Dein Himmel bei der Geburt",
    intro: "Dein Sternzeichen in der Astrologie, und wo die Sonne wirklich stand. Astrologie ist keine Wissenschaft: Sternzeichen sagen nichts über einen Menschen. Hier siehst du, was wirklich am Himmel war.",
    date: "Geburtsdatum", show: "Meinen Himmel zeigen",
    privacy: "Dein Geburtsdatum bleibt nur in diesem Browser. Es wird nicht gesendet, auch nicht mit einem Konto.",
    astrology: "Die Astrologie sagt", sky: "Der Himmel sagt",
    signLine: (name) => `${name}`, skyLine: (name) => `Die Sonne stand im Sternbild ${name}`,
    near: "Dein Geburtstag liegt an der Grenze zweier Zeichen: Hier entscheidet die Uhrzeit.",
    same: "Diesmal stimmen Astrologie und Himmel überein.",
    differ: "Sie unterscheiden sich, weil sich die Erdachse seit der Festlegung der Zeichen vor rund 2000 Jahren um etwa 24 Grad gedreht hat: Am selben Datum steht die Sonne vor anderen Sternen.",
    oph: "Der Schlangenträger ist ein Sternbild, durch das die Sonne jedes Jahr zieht, das die Astrologie aber weglässt.",
    approx: "Das Sternbild folgt den Grenzen der Internationalen Astronomischen Union, die Tage sind ungefähr (± 1 Tag).",
    fly: "Das Sternbild in 3D ansehen", change: "Datum ändern", remove: "Datum entfernen",
  },
  ja: {
    title: "生まれた日の空",
    intro: "占星術での星座と、太陽が実際にいた場所です。占星術は科学ではなく、星座は人について何も語りません。ここでは実際の空をお見せします。",
    date: "生年月日", show: "私の空を見る",
    privacy: "生年月日はこのブラウザ内だけに残り、送信されません。アカウントがあっても送られません。",
    astrology: "占星術では", sky: "実際の空では",
    signLine: (name) => `${name}`, skyLine: (name) => `太陽は${name}にいました`,
    near: "誕生日が2つの星座の境目にあたります。生まれた時刻で決まります。",
    same: "今回は占星術と実際の空が一致しています。",
    differ: "星座が決められた約2000年前から、地軸の向きが約24度ずれたため、同じ日付でも太陽は別の星々の前にあります。",
    oph: "へびつかい座は、太陽が毎年通る星座ですが、占星術では使われていません。",
    approx: "星座は国際天文学連合の境界に従います。日付はおおよそです（±1日）。",
    fly: "星座を3Dで見る", change: "日付を変更", remove: "日付を削除",
  },
  bg: {
    title: "Небето при раждането ти",
    intro: "Зодиакалният ти знак в астрологията и къде всъщност е било Слънцето. Астрологията не е наука: знаците не казват нищо за човека. Тук виждаш какво наистина е имало на небето.",
    date: "Дата на раждане", show: "Покажи моето небе",
    privacy: "Датата ти на раждане остава само в този браузър. Не се изпраща, дори с профил.",
    astrology: "Астрологията казва", sky: "Небето казва",
    signLine: (name) => `${name}`, skyLine: (name) => `Слънцето е било в ${name}`,
    near: "Рожденият ти ден е на границата между два знака: решава часът на раждане.",
    same: "Този път астрологията и небето съвпадат.",
    differ: "Различават се, защото оста на Земята се е завъртяла с около 24 градуса, откакто знаците са определени преди около 2000 години: на същата дата Слънцето е пред други звезди.",
    oph: "Змиеносец е съзвездие, през което Слънцето минава всяка година, но астрологията го пропуска.",
    approx: "Съзвездието следва границите на Международния астрономически съюз, датите са приблизителни (± 1 ден).",
    fly: "Виж съзвездието в 3D", change: "Промени датата", remove: "Премахни датата",
  },
};

// getLang(); nameOf(id): the name of a constellation in the language of the page; showFigure(id): the constellation in the learning panel and
// on the map; onChange(): draw the panel again.
export function initBirthSky({ getLang, nameOf, showFigure, onChange }) {
  const t = () => BIRTHSKY_TEXT[getLang()] ?? BIRTHSKY_TEXT.en;
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
  const read = () => {
    try {
      return parseDate(localStorage.getItem(KEY));
    } catch {
      return null;
    }
  };
  const write = (text) => {
    try {
      if (text == null) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, text);
    } catch {
      // storage blocked: shown, but not remembered
    }
  };
  let birth = read();
  let editing = false;

  function section(closePanel) {
    const tx = t();
    const s = el("section", "uni-section birthsky");
    s.append(el("h3", "", tx.title));
    if (!birth || editing) {
      s.append(el("p", "", tx.intro));
      const row = el("div", "uni-places");
      const input = el("input");
      input.type = "date";
      input.min = "1900-01-01";
      input.max = new Date().toISOString().slice(0, 10);
      input.className = "star-year";
      input.setAttribute("aria-label", tx.date);
      if (birth) input.value = `${birth.year}-${String(birth.month).padStart(2, "0")}-${String(birth.day).padStart(2, "0")}`;
      row.append(
        input,
        button(tx.show, "account-main", () => {
          const parsed = parseDate(input.value);
          if (!parsed) return input.focus();
          birth = parsed;
          editing = false;
          write(input.value);
          track("birthsky-shown");
          onChange?.();
        })
      );
      s.append(row, el("p", "hint", tx.privacy));
      return s;
    }
    const sign = tropicalSign(sunLongitude(birth.noon));
    const real = sunConstellation(birth.month, birth.day);
    const pair = el("div", "birthsky-pair");
    const astro = el("div", "birthsky-card astrology");
    astro.append(el("small", "", tx.astrology), el("strong", "", tx.signLine(nameOf(sign.id))));
    const sky = el("div", "birthsky-card sky");
    sky.append(el("small", "", tx.sky), el("strong", "", tx.skyLine(nameOf(real))));
    pair.append(astro, sky);
    s.append(pair);
    if (sign.near) s.append(el("p", "hint", tx.near));
    s.append(el("p", "", sign.id === real ? tx.same : tx.differ));
    if (real === "Oph") s.append(el("p", "", tx.oph));
    s.append(el("p", "hint", tx.approx));
    const row = el("div", "uni-places");
    row.append(
      button(tx.fly, "account-main", () => {
        track("birthsky-fly");
        closePanel?.();
        showFigure(real);
      }),
      button(tx.change, "account-link", () => ((editing = true), onChange?.())),
      button(tx.remove, "account-link", () => {
        birth = null;
        write(null);
        onChange?.();
      })
    );
    s.append(row);
    return s;
  }
  return { section, forget: () => ((birth = null), write(null)) };
}
