// "The sky at your birth": astrology next to the real sky. From a date of birth (optional, it stays in this browser only, also with an account):
// the sign of astrology (the "tropical" zodiac: twelve equal parts of 30 degrees of the Sun's path, counted from the spring equinox) and the
// constellation in which the Sun really stood (the boundaries of the International Astronomical Union, 1930). The two differ for most people,
// because the direction of the Earth's axis has moved by about 24 degrees since the signs were fixed (precession), and the Sun also crosses
// Ophiuchus, which astrology does not have. Astrology says nothing about a person; the page says so, and it writes no horoscope. The rules are
// pure functions, tested in tests/birthsky.test.mjs.

import { track } from "./stats.js";
import { disclosure } from "./disclosure.js";
import { sharePicture, preload, font, wrap, fitText, roundRect, panel, drawStar } from "./sharecard.js";

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


// ---------------------------------------------------------------- the ascendant: the point of the Sun's path that rose in the east at the birth
// It needs the hour and the place. The hour is local time at the place of birth; the browser turns it into world time with the time zone of the
// place (with its summer time and its history), see zonedToUtc. Then the sidereal time, and the point of the ecliptic on the eastern horizon.
export const PLACE_KEY = "birth-place"; // { name, country, lat, lon, tz } in localStorage, never sent
export const TIME_KEY = "birth-time"; // "HH:MM" in localStorage, never sent
const mod360 = (x) => ((x % 360) + 360) % 360;
const julianDay = (date) => date.getTime() / 86400000 + 2440587.5;

// minutes that the time zone is ahead of world time at that moment
export function tzOffsetMinutes(utcMs, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return (Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - utcMs) / 60000;
}
// a local time at a place (its time zone) as a moment in world time
export function zonedToUtc(year, month, day, hour, minute, timeZone) {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const first = tzOffsetMinutes(guess, timeZone);
  let utc = guess - first * 60000;
  const second = tzOffsetMinutes(utc, timeZone);
  if (second !== first) utc = guess - second * 60000; // a change of the clock (summer time) between the guess and the answer
  return new Date(utc);
}
// the local sidereal time in degrees (Greenwich mean sidereal time, IAU 1982, plus the east longitude)
export function siderealDeg(date, lonEast) {
  const d = julianDay(date) - 2451545.0;
  const T = d / 36525;
  return mod360(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - (T * T * T) / 38710000 + lonEast);
}
export const obliquityDeg = (date) => 23.4392911 - 0.0130042 * ((julianDay(date) - 2451545.0) / 36525);
// the ecliptic longitude of the ascendant in degrees
export function ascendant(date, lat, lonEast) {
  const theta = siderealDeg(date, lonEast) * RAD;
  const eps = obliquityDeg(date) * RAD;
  const phi = lat * RAD;
  return mod360(Math.atan2(Math.cos(theta), -(Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) / RAD);
}
// the constellation at a point of the ecliptic: the one the Sun is in on the day it stands at that longitude (the same table as above)
const DAY_LONGITUDES = Array.from({ length: 366 }, (_, i) => {
  const date = new Date(Date.UTC(2000, 0, 1 + i, 12));
  return { lambda: sunLongitude(date), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
});
export function constellationAtLongitude(lambda) {
  let best = DAY_LONGITUDES[0];
  let bestDiff = Infinity;
  for (const d of DAY_LONGITUDES) {
    const diff = Math.abs(((d.lambda - lambda + 540) % 360) - 180);
    if (diff < bestDiff) (bestDiff = diff), (best = d);
  }
  return sunConstellation(best.month, best.day);
}
// places: [[name, asciiName, country, lat, lon, tz], ...] sorted by population; the first ones whose name starts with the query
const plain = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function searchPlaces(places, query, limit = 8) {
  const q = plain(query.trim());
  if (q.length < 2) return [];
  const out = [];
  for (const p of places) {
    if (plain(p[0]).startsWith(q) || (p[1] && plain(p[1]).startsWith(q))) out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

// A constellation as a small drawing: lines of stars ([[ra, dec, mag], ...] in degrees) projected onto the plane that touches the sky at the
// middle of the figure (gnomonic, as a camera sees it), east to the left and north up as in the sky, fitted into width x height. Returns
// { segments: [[x1, y1, x2, y2]], stars: [[x, y, mag]] } (each star once), or null without stars.
export function projectFigure(lines, width = 120, height = 80, pad = 8) {
  const points = lines.flat();
  if (!points.length) return null;
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (const [ra, dec] of points) {
    cx += Math.cos(dec * RAD) * Math.cos(ra * RAD);
    cy += Math.cos(dec * RAD) * Math.sin(ra * RAD);
    cz += Math.sin(dec * RAD);
  }
  const ra0 = Math.atan2(cy, cx);
  const dec0 = Math.atan2(cz, Math.hypot(cx, cy));
  const project = ([ra, dec]) => {
    const a = ra * RAD - ra0;
    const d = dec * RAD;
    const cosc = Math.sin(dec0) * Math.sin(d) + Math.cos(dec0) * Math.cos(d) * Math.cos(a);
    const x = (Math.cos(d) * Math.sin(a)) / cosc;
    const y = (Math.cos(dec0) * Math.sin(d) - Math.sin(dec0) * Math.cos(d) * Math.cos(a)) / cosc;
    return [-x, -y];
  };
  const projected = lines.map((line) => line.map((p) => [...project(p), p[2]]));
  const all = projected.flat();
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  // a figure in one line (all stars at the same height, or one above the other) is fitted by its length alone; a single star sits in the middle
  const sx = maxX - minX > 1e-9 ? (width - 2 * pad) / (maxX - minX) : Infinity;
  const sy = maxY - minY > 1e-9 ? (height - 2 * pad) / (maxY - minY) : Infinity;
  const scale = Number.isFinite(Math.min(sx, sy)) ? Math.min(sx, sy) : 1;
  const ox = (width - (maxX - minX) * scale) / 2;
  const oy = (height - (maxY - minY) * scale) / 2;
  const place = ([x, y, mag]) => [ox + (x - minX) * scale, oy + (y - minY) * scale, mag];
  const segments = [];
  for (const line of projected) for (let i = 0; i + 1 < line.length; i++) segments.push([...place(line[i]).slice(0, 2), ...place(line[i + 1]).slice(0, 2)]);
  const seen = new Set();
  const stars = [];
  lines.forEach((line, li) =>
    line.forEach((p, pi) => {
      const key = `${p[0]},${p[1]}`;
      if (seen.has(key)) return;
      seen.add(key);
      stars.push(place(projected[li][pi]));
    })
  );
  return { segments, stars };
}
// The signs of astrology as their old symbols, drawn as text (not as coloured emoji).
const GLYPH = { Ari: "\u2648", Tau: "\u2649", Gem: "\u264A", Cnc: "\u264B", Leo: "\u264C", Vir: "\u264D", Lib: "\u264E", Sco: "\u264F", Sgr: "\u2650", Cap: "\u2651", Aqr: "\u2652", Psc: "\u2653" };

export const BIRTHSKY_TEXT = {
  en: {
    title: "The sky at your birth",
    lead: "Your sign in astrology, and where the Sun really stood.",
    science: "Astrology is not a science: the signs say nothing about a person. Here you see what was really in the sky.",
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
    ascTitle: "Ascendant", ascIntro: "The ascendant is the point of the Sun's path that rose in the east at the moment of your birth. It needs the hour and the place of birth.",
    time: "Hour of birth (local time)", place: "Place of birth", placeSearch: "Type a city …", calc: "Show the ascendant", loading: "Loading the places …", noPlace: "No place found. Try the nearest larger town.",
    smallPlace: "The list has every place with more than 15,000 inhabitants. Born in a smaller place? Take the nearest larger town: 50 km move the ascendant only by about a degree.",
    ascAstrology: "Ascendant in astrology", ascSky: "Rising in the east", ascSkyLine: (name) => `the constellation ${name}`,
    ascNote: "Four minutes earlier or later move the ascendant by about one degree: without an exact hour of birth it is uncertain.",
    placeLine: (name, country, tz) => `${name}, ${country} (time zone ${tz})`, changeAsc: "Change hour or place", removeAsc: "Remove hour and place",
    ascPrivacy: "Hour and place of birth stay in this browser only, like the date.", credit: "Places: GeoNames (CC BY 4.0)",
    astroCard: "Astrology", skyCard: "In the real sky", figureLine: (n) => `${n}`, differShort: "The Sun stood in front of other stars than astrology says.",
    why: "Why?", ascSection: "Ascendant and birth data", hour: "Hour", ascMissing: "The ascendant needs the hour and the place of birth.",
    ascAdd: "Add hour and place", edit: "Edit", cancel: "Cancel", placeHelp: "Place not in the list?", more: "Learn more",
    share: "Share as a picture", cardSky: "The sky at my birth",
    skyMessage: "Astrology says one thing, the real sky another. See the sky at your birth:",
  },
  de: {
    title: "Dein Himmel bei der Geburt",
    lead: "Dein Sternzeichen in der Astrologie, und wo die Sonne wirklich stand.",
    science: "Astrologie ist keine Wissenschaft: Sternzeichen sagen nichts über einen Menschen. Hier siehst du, was wirklich am Himmel war.",
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
    ascTitle: "Aszendent", ascIntro: "Der Aszendent ist der Punkt der Sonnenbahn, der im Moment deiner Geburt im Osten aufging. Dafür braucht es Uhrzeit und Ort der Geburt.",
    time: "Uhrzeit der Geburt (Ortszeit)", place: "Geburtsort", placeSearch: "Stadt eingeben …", calc: "Aszendent zeigen", loading: "Orte werden geladen …", noPlace: "Kein Ort gefunden. Versuch den nächsten größeren Ort.",
    smallPlace: "Die Liste enthält jeden Ort mit mehr als 15.000 Einwohnern. In einem kleineren Ort geboren? Nimm den nächsten größeren: 50 km verschieben den Aszendenten nur um etwa ein Grad.",
    ascAstrology: "Aszendent in der Astrologie", ascSky: "Im Osten ging auf", ascSkyLine: (name) => `das Sternbild ${name}`,
    ascNote: "Vier Minuten früher oder später verschieben den Aszendenten um etwa ein Grad: Ohne genaue Geburtszeit ist er unsicher.",
    placeLine: (name, country, tz) => `${name}, ${country} (Zeitzone ${tz})`, changeAsc: "Uhrzeit oder Ort ändern", removeAsc: "Uhrzeit und Ort entfernen",
    ascPrivacy: "Uhrzeit und Ort der Geburt bleiben wie das Datum nur in diesem Browser.", credit: "Orte: GeoNames (CC BY 4.0)",
    astroCard: "Astrologie", skyCard: "Am echten Himmel", figureLine: (n) => `Sternbild ${n}`, differShort: "Die Sonne stand vor anderen Sternen, als die Astrologie sagt.",
    why: "Warum?", ascSection: "Aszendent und Geburtsdaten", hour: "Uhrzeit", ascMissing: "Für den Aszendenten braucht es Uhrzeit und Ort der Geburt.",
    ascAdd: "Uhrzeit und Ort eingeben", edit: "Bearbeiten", cancel: "Abbrechen", placeHelp: "Ort nicht in der Liste?", more: "Mehr erfahren",
    share: "Als Bild teilen", cardSky: "Mein Himmel bei der Geburt",
    skyMessage: "Die Astrologie sagt das eine, der echte Himmel etwas anderes. Sieh deinen Himmel bei der Geburt:",
  },
  ja: {
    title: "生まれた日の空",
    lead: "占星術での星座と、太陽が実際にいた場所です。",
    science: "占星術は科学ではなく、星座は人について何も語りません。ここでは実際の空をお見せします。",
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
    ascTitle: "アセンダント", ascIntro: "アセンダントとは、あなたが生まれた瞬間に東の地平線から昇っていた黄道上の点です。生まれた時刻と場所が必要です。",
    time: "生まれた時刻（現地時間）", place: "出生地", placeSearch: "都市名を入力 …", calc: "アセンダントを見る", loading: "場所を読み込み中 …", noPlace: "場所が見つかりません。近くの大きな町を試してください。",
    smallPlace: "一覧には人口1万5000人を超えるすべての場所が入っています。小さな町で生まれた場合は、近くの大きな町を選んでください。50 km の違いでアセンダントが動くのは約1度だけです。",
    ascAstrology: "占星術のアセンダント", ascSky: "東から昇っていたのは", ascSkyLine: (name) => `${name}`,
    ascNote: "時刻が4分ずれるとアセンダントは約1度動きます。正確な出生時刻がなければ不確かです。",
    placeLine: (name, country, tz) => `${name}、${country}（タイムゾーン ${tz}）`, changeAsc: "時刻や場所を変更", removeAsc: "時刻と場所を削除",
    ascPrivacy: "生まれた時刻と場所も、日付と同じくこのブラウザ内だけに残ります。", credit: "場所：GeoNames（CC BY 4.0）",
    astroCard: "占星術", skyCard: "実際の空", figureLine: (n) => `${n}`, differShort: "太陽は、占星術が言うのとは別の星々の前にありました。",
    why: "なぜ？", ascSection: "アセンダントと出生データ", hour: "時刻", ascMissing: "アセンダントには、生まれた時刻と場所が必要です。",
    ascAdd: "時刻と場所を入力", edit: "編集", cancel: "キャンセル", placeHelp: "場所が一覧にない場合", more: "くわしく",
    share: "画像で共有", cardSky: "私が生まれた日の空",
    skyMessage: "占星術と実際の空は違います。あなたが生まれた日の空を見てみよう：",
  },
  bg: {
    title: "Небето при раждането ти",
    lead: "Зодиакалният ти знак в астрологията и къде всъщност е било Слънцето.",
    science: "Астрологията не е наука: знаците не казват нищо за човека. Тук виждаш какво наистина е имало на небето.",
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
    ascTitle: "Асцендент", ascIntro: "Асцендентът е точката от пътя на Слънцето, която е изгряла на изток в момента на раждането ти. За него са нужни часът и мястото на раждане.",
    time: "Час на раждане (местно време)", place: "Място на раждане", placeSearch: "Въведи град …", calc: "Покажи асцендента", loading: "Местата се зареждат …", noPlace: "Няма намерено място. Опитай най-близкия по-голям град.",
    smallPlace: "Списъкът съдържа всяко място с над 15 000 жители. Роден си в по-малко място? Избери най-близкия по-голям град: 50 км местят асцендента само с около градус.",
    ascAstrology: "Асцендент в астрологията", ascSky: "На изток изгрява", ascSkyLine: (name) => `съзвездието ${name}`,
    ascNote: "Четири минути по-рано или по-късно преместват асцендента с около един градус: без точен час на раждане той е несигурен.",
    placeLine: (name, country, tz) => `${name}, ${country} (часова зона ${tz})`, changeAsc: "Промени часа или мястото", removeAsc: "Премахни часа и мястото",
    ascPrivacy: "Часът и мястото на раждане остават само в този браузър, както датата.", credit: "Места: GeoNames (CC BY 4.0)",
    astroCard: "Астрология", skyCard: "На истинското небе", figureLine: (n) => `Съзвездие ${n}`, differShort: "Слънцето е стояло пред други звезди, а не там, където казва астрологията.",
    why: "Защо?", ascSection: "Асцендент и данни за раждането", hour: "Час", ascMissing: "За асцендента са нужни часът и мястото на раждане.",
    ascAdd: "Въведи час и място", edit: "Редактирай", cancel: "Отказ", placeHelp: "Мястото липсва в списъка?", more: "Научи повече",
    share: "Сподели като картинка", cardSky: "Небето при раждането ми",
    skyMessage: "Астрологията казва едно, истинското небе друго. Виж небето при раждането си:",
  },
};

// getLang(); nameOf(id): the name of a constellation in the language of the page; figure(id): its lines of stars ([[ra, dec, mag], ...]) or
// null while the sky is not loaded; showFigure(id): the constellation in the learning panel and on the map; onChange(): draw the panel again.
export function initBirthSky({ getLang, nameOf, figure, showFigure, onChange }) {
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
  const readJson = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  };
  const store = (key, value) => {
    try {
      if (value == null) localStorage.removeItem(key);
      else localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    } catch {
      // storage blocked: shown, but not remembered
    }
  };
  let place = readJson(PLACE_KEY);
  let time = (() => {
    try {
      const v = localStorage.getItem(TIME_KEY);
      return /^\d{2}:\d{2}$/.test(v ?? "") ? v : null;
    } catch {
      return null;
    }
  })();
  let ascEditing = false;
  let places = null; // loaded the first time the ascendant is asked for (data/places.json, about 350 KB)
  let placesLoading = null;
  const loadPlaces = () =>
    (placesLoading ??= fetch("data/places.json")
      .then((r) => r.json())
      .then((d) => (places = d.places))
      .catch(() => (placesLoading = null)));
  const countryName = (code) => {
    try {
      return new Intl.DisplayNames([getLang()], { type: "region" }).of(code) ?? code;
    } catch {
      return code;
    }
  };

  // the real figure of a constellation, small, from the stars of the map (Hipparcos)
  const SVG = "http://www.w3.org/2000/svg";
  function figureSvg(id) {
    const lines = figure?.(id);
    const drawn = lines && projectFigure(lines);
    if (!drawn) return null;
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", "0 0 120 80");
    svg.setAttribute("class", "birthsky-figure");
    svg.setAttribute("aria-hidden", "true");
    for (const [x1, y1, x2, y2] of drawn.segments) {
      const l = document.createElementNS(SVG, "line");
      for (const [k, v] of Object.entries({ x1, y1, x2, y2 })) l.setAttribute(k, v.toFixed(1));
      svg.append(l);
    }
    for (const [x, y, mag] of drawn.stars) {
      const c = document.createElementNS(SVG, "circle");
      c.setAttribute("cx", x.toFixed(1));
      c.setAttribute("cy", y.toFixed(1));
      c.setAttribute("r", Math.min(2.6, Math.max(0.9, 2.6 - 0.35 * (mag ?? 4))).toFixed(1));
      svg.append(c);
    }
    return svg;
  }
  // The picture to share (sharecard.js draws the frame): the sign and the real constellation, no date.
  function shareSky(signId, realId) {
    const tx = t();
    sharePicture({
      kind: "sky",
      title: tx.cardSky,
      text: tx.skyMessage,
      backdrop: 0.6,
      sources: "Stars: Hipparcos (ESA)",
      draw: (g) => {
        // two glass cards: astrology (dashed, it is not the real sky) and the real sky (green)
        panel(g, 80, 210, 440, 600, 36, "rgba(255,255,255,0.35)");
        g.setLineDash([14, 10]);
        roundRect(g, 80, 210, 440, 600, 36);
        g.strokeStyle = "rgba(255,255,255,0.45)";
        g.lineWidth = 3;
        g.stroke();
        g.setLineDash([]);
        panel(g, 560, 210, 440, 600, 36, "rgba(124,255,178,0.7)", "rgba(10,30,24,0.5)");
        g.fillStyle = "rgba(230,236,255,0.8)";
        fitText(g, tx.astroCard.toLocaleUpperCase(), 300, 280, 380, 600, 28);
        fitText(g, tx.skyCard.toLocaleUpperCase(), 780, 280, 380, 600, 28);
        // the sign as its old symbol, golden
        const gold = g.createLinearGradient(0, 380, 0, 600);
        gold.addColorStop(0, "#fff1cf");
        gold.addColorStop(1, "#e2b36a");
        g.save();
        g.shadowColor = "rgba(255,200,120,0.75)";
        g.shadowBlur = 40;
        g.fillStyle = gold;
        g.font = font(400, 220, "'Segoe UI Symbol', 'Noto Sans Symbols', 'Apple Symbols', sans-serif");
        g.textBaseline = "middle";
        g.fillText(`${GLYPH[signId]}︎`, 300, 500);
        g.restore();
        // the real figure from the stars of the map: glowing lines, and each star a glow by its brightness
        const drawn = figure?.(realId) && projectFigure(figure(realId), 380, 320, 30);
        if (drawn) {
          const ox = 590;
          const oy = 330;
          g.save();
          g.shadowColor = "rgba(124,255,178,0.8)";
          g.shadowBlur = 14;
          g.strokeStyle = "rgba(184,230,193,0.85)";
          g.lineWidth = 3;
          g.lineCap = "round";
          for (const [x1, y1, x2, y2] of drawn.segments) {
            g.beginPath();
            g.moveTo(ox + x1, oy + y1);
            g.lineTo(ox + x2, oy + y2);
            g.stroke();
          }
          g.restore();
          for (const [x, y, mag] of drawn.stars) {
            const r = Math.min(34, Math.max(10, 34 - 5 * (mag ?? 4)));
            drawStar(g, ox + x, oy + y, r * 1.6, "200,225,255");
          }
        }
        g.fillStyle = "#ffffff";
        fitText(g, tx.signLine(nameOf(signId)), 300, 760, 380, 700, 52);
        fitText(g, tx.figureLine(nameOf(realId)), 780, 760, 380, 700, 52);
        g.font = font(600, 42);
        wrap(g, signId === realId ? tx.same : tx.differShort, 900).forEach((line, i) => g.fillText(line, 540, 920 + i * 56));
        g.fillStyle = "rgba(230,236,255,0.75)";
        g.font = font(400, 30);
        wrap(g, tx.science, 880).forEach((line, i) => g.fillText(line, 540, 1080 + i * 42));
      },
    });
  }
  const card = (cls, label, picture, name) => {
    const c = el("div", `birthsky-card ${cls}`);
    c.append(el("small", "", label));
    if (picture) c.append(picture);
    c.append(el("strong", "", name));
    return c;
  };
  const fact = (label, value, cls = "") => {
    const d = el("div", cls);
    d.append(el("dt", "", label), el("dd", "", value));
    return d;
  };

  // the hour and the place of birth: asked only after "Add hour and place" or a change
  function ascendantForm(a) {
    const tx = t();
    a.append(el("p", "hint", tx.ascIntro));
    const timeInput = el("input");
    timeInput.type = "time";
    timeInput.className = "star-year";
    timeInput.setAttribute("aria-label", tx.time);
    if (time) timeInput.value = time;
    let chosen = place;
    const search = el("input");
    search.type = "text";
    search.placeholder = tx.placeSearch;
    search.setAttribute("aria-label", tx.place);
    search.className = "birthsky-search";
    search.autocomplete = "off";
    if (chosen) search.value = `${chosen.name}, ${countryName(chosen.country)}`;
    const results = el("div", "uni-places");
    const showResults = () => {
      if (!places) {
        results.replaceChildren(el("span", "hint", tx.loading));
        loadPlaces().then(() => places && showResults());
        return;
      }
      const found = searchPlaces(places, search.value);
      results.replaceChildren(
        ...(found.length || search.value.trim().length < 2
          ? found.map((p) =>
              button(`${p[0]}, ${countryName(p[2])}`, "uni-place", () => {
                chosen = { name: p[0], country: p[2], lat: p[3], lon: p[4], tz: p[5] };
                search.value = `${p[0]}, ${countryName(p[2])}`;
                results.replaceChildren();
              })
            )
          : [el("span", "hint", tx.noPlace)])
      );
    };
    search.addEventListener("input", () => ((chosen = null), showResults()));
    const timeLabel = el("label", "account-field");
    timeLabel.append(el("span", "", tx.time), timeInput);
    const placeLabel = el("label", "account-field");
    placeLabel.append(el("span", "", tx.place), search);
    a.append(timeLabel, placeLabel, results, disclosure("place-help", tx.placeHelp, [el("p", "", tx.smallPlace)]));
    const row = el("div", "uni-actions");
    row.append(
      button(tx.calc, "uni-primary", () => {
        if (!/^\d{2}:\d{2}$/.test(timeInput.value)) return timeInput.focus();
        if (!chosen) return search.focus();
        time = timeInput.value;
        place = chosen;
        ascEditing = false;
        store(TIME_KEY, time);
        store(PLACE_KEY, place);
        track("birthsky-ascendant");
        onChange?.();
      }),
      button(tx.cancel, "uni-link", () => ((ascEditing = false), onChange?.()))
    );
    a.append(row, el("p", "hint", `${tx.ascPrivacy} ${tx.credit}`));
    loadPlaces(); // ready by the time a name is typed
  }

  // the date, hour and place as a few facts, the ascendant with them, and the changes in a small fold
  function ascendantSection() {
    const tx = t();
    const a = el("section", "uni-section birthsky-asc");
    a.append(el("h3", "", tx.ascSection));
    if (ascEditing) {
      ascendantForm(a);
      return a;
    }
    const facts = el("dl", "uni-facts");
    const dateText = new Intl.DateTimeFormat(getLang(), { dateStyle: "long", timeZone: "UTC" }).format(new Date(Date.UTC(birth.year, birth.month - 1, birth.day)));
    facts.append(fact(tx.date, dateText));
    const known = place && time;
    if (known) {
      const [hour, minute] = time.split(":").map(Number);
      const moment = zonedToUtc(birth.year, birth.month, birth.day, hour, minute, place.tz);
      const lambda = ascendant(moment, place.lat, place.lon);
      const sign = tropicalSign(lambda);
      const real = constellationAtLongitude(lambda);
      facts.append(
        fact(tx.hour, time),
        fact(tx.place, `${place.name}, ${countryName(place.country)}`, "wide"),
        fact(tx.ascAstrology, nameOf(sign.id), "big"),
        fact(tx.ascSky, tx.figureLine(nameOf(real)), "big sky")
      );
      a.append(facts);
      a.append(
        disclosure("asc-more", tx.more, [
          el("p", "", tx.ascIntro),
          el("p", "", tx.ascNote),
          el("p", "hint", tx.placeLine(place.name, countryName(place.country), place.tz)),
          el("p", "hint", tx.credit),
        ])
      );
    } else {
      a.append(facts, el("p", "hint", tx.ascMissing));
      const row = el("div", "uni-actions");
      row.append(button(tx.ascAdd, "uni-primary", () => ((ascEditing = true), onChange?.())));
      a.append(row);
    }
    const edits = el("div", "uni-edit");
    edits.append(button(tx.change, "uni-link", () => ((editing = true), onChange?.())));
    if (known) edits.append(button(tx.changeAsc, "uni-link", () => ((ascEditing = true), onChange?.())));
    edits.append(
      button(tx.remove, "uni-link", () => {
        birth = null;
        write(null);
        onChange?.();
      })
    );
    if (known)
      edits.append(
        button(tx.removeAsc, "uni-link", () => {
          place = null;
          time = null;
          store(PLACE_KEY, null);
          store(TIME_KEY, null);
          onChange?.();
        })
      );
    a.append(disclosure("birth-edit", tx.edit, [edits]));
    return a;
  }

  // Two parts for My Universe: the sky at the birth (two cards and one sentence, the explanation under "Why?") and the ascendant with the data
  // of the birth. Before a date is given, only the question.
  function sections(closePanel) {
    const tx = t();
    const s = el("section", "uni-section birthsky");
    s.append(el("h3", "", tx.title));
    if (!birth || editing) {
      s.append(el("p", "", tx.lead));
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
        button(tx.show, "uni-primary", () => {
          const parsed = parseDate(input.value);
          if (!parsed) return input.focus();
          birth = parsed;
          editing = false;
          write(input.value);
          track("birthsky-shown");
          onChange?.();
        })
      );
      if (editing) row.append(button(tx.cancel, "uni-link", () => ((editing = false), onChange?.())));
      s.append(row, el("p", "hint", tx.privacy));
      return [s];
    }
    const sign = tropicalSign(sunLongitude(birth.noon));
    const real = sunConstellation(birth.month, birth.day);
    preload(); // the Milky Way behind the picture to share
    const glyph = el("span", "birthsky-glyph", `${GLYPH[sign.id]}\uFE0E`);
    glyph.setAttribute("aria-hidden", "true");
    const pair = el("div", "birthsky-pair");
    pair.append(card("astrology", tx.astroCard, glyph, tx.signLine(nameOf(sign.id))), card("sky", tx.skyCard, figureSvg(real), tx.figureLine(nameOf(real))));
    s.append(pair, el("p", "birthsky-key", sign.id === real ? tx.same : tx.differShort));
    const row = el("div", "uni-actions");
    row.append(
      button(tx.fly, "uni-primary", () => {
        track("birthsky-fly");
        closePanel?.();
        showFigure(real);
      }),
      button(tx.share, "uni-link", () => shareSky(sign.id, real))
    );
    s.append(row);
    const why = [el("p", "", tx.science)];
    if (sign.id !== real) why.push(el("p", "", tx.differ));
    if (sign.near) why.push(el("p", "", tx.near));
    if (real === "Oph") why.push(el("p", "", tx.oph));
    why.push(el("p", "hint", tx.approx));
    s.append(disclosure("birth-why", tx.why, why));
    return [s, ascendantSection()];
  }
  return {
    sections,
    forget: () => {
      birth = place = time = null;
      write(null);
      store(PLACE_KEY, null);
      store(TIME_KEY, null);
    },
  };
}
