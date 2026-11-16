// "Your star": the visitor gives a birth year (optional, it stays in this browser only, also with an account) and gets the star whose light that
// arrives today set off about when they were born: a star as many light years away as they are old. Two kinds: a star with planets from the NASA
// list (the 3D map can fly there), and, if there is one at about that distance, a bright named star that can be seen without a telescope. Then a
// few numbers that follow from the age alone (the age on the other planets, the way the Earth has travelled round the Sun), and a picture to share
// without a name. Distances have a measuring uncertainty, so the year is "about". The choice rules are pure functions, tested in
// tests/mystar.test.mjs.

import { track } from "./stats.js";
import { disclosure } from "./disclosure.js";
import { sharePicture, preload, W, font, wrap, panel, drawPlanet, drawStar, starColor } from "./sharecard.js";

export const KEY = "birth-year"; // localStorage, never sent, never saved to the account
const EARTH_ORBIT_KM = 2 * Math.PI * 149597870.7; // the length of one trip round the Sun, about 940 million km

// The age in years from a birth year, for the middle of that year (the exact day is not asked).
export function ageFrom(birthYear, now = new Date()) {
  const start = Date.UTC(now.getUTCFullYear(), 0, 1);
  const yearPart = (now.getTime() - start) / (365.2425 * 86400000);
  return now.getUTCFullYear() + yearPart - (birthYear + 0.5);
}
export const validYear = (y, now = new Date()) => Number.isInteger(y) && y >= 1900 && y <= now.getUTCFullYear();

// hosts: [{ name, dist, planets }]: the one whose distance is closest to the age (more planets wins a tie).
export function pickHost(hosts, age) {
  let best = null;
  for (const h of hosts) {
    if (!Number.isFinite(h.dist) || h.dist <= 0) continue;
    const d = Math.abs(h.dist - age);
    const bd = best ? Math.abs(best.dist - age) : Infinity;
    if (d < bd || (d === bd && (h.planets ?? 0) > (best.planets ?? 0))) best = h;
  }
  return best;
}
// named: [{ name, dist, mag }]: the closest one within `range` light years (the brighter one wins a tie), else null.
export function pickNamed(named, age, range = 2) {
  let best = null;
  for (const s of named) {
    if (!Number.isFinite(s.dist)) continue;
    const d = Math.abs(s.dist - age);
    if (d > range) continue;
    const bd = best ? Math.abs(best.dist - age) : Infinity;
    if (d < bd || (d === bd && s.mag < best.mag)) best = s;
  }
  return best;
}
// The year in which the light that arrives now set off.
export const leftIn = (dist, now = new Date()) => Math.round(now.getUTCFullYear() + (now.getUTCMonth() + 0.5) / 12 - dist);
// The age on another planet (years: its year in Earth years) and the way travelled round the Sun.
export const ageOn = (age, years) => age / years;
export const kmRoundSun = (age) => age * EARTH_ORBIT_KM;

export const STAR_TEXT = {
  en: {
    title: "Your star",
    intro: "Light needs time. Give your year of birth and see which star's light, arriving today, set off when you were born.",
    year: "Year of birth", find: "Find my star",
    privacy: "Your year of birth stays in this browser only. It is not sent, not even with an account.",
    hostLine: (name, dist) => `${name}, ${dist} light years away`,
    hostText: (year, n) => `The light of this star that reaches us today set off around ${year}. ${n === 1 ? "It has 1 known planet." : `It has ${n} known planets.`}`,
    namedLine: (name, dist, constellation) => `${name}${constellation ? ` in ${constellation}` : ""}, ${dist} light years`,
    namedText: "You can see this one without a telescope: its light set off at about the same time.",
    young: "The light of even the nearest star, Proxima Centauri, needs 4.2 years to reach us. Your star is still on its way.",
    uncertain: "Distances are measured with some uncertainty, so the year is approximate.",
    show: "View in the 3D model", share: "Share as a picture", more: "Learn more", edit: "change", cancel: "Cancel", remove: "remove",
    yearLine: (y) => `Year of birth ${y}`, ly: "light years", planets: (n) => (n === 1 ? "known planet" : "known planets"),
    key: (year) => `Its light arriving today set off around ${year}: about when you were born.`,
    ages: "Your age on the planets", km: "travelled round the Sun with the Earth", kmUnit: "km",
    years: (n) => `${n} years`,
    cardTitle: "My star", cardLight: (name, year) => `The light of ${name} that arrives today set off around ${year}, about the year I was born.`,
    cardDist: (dist) => `${dist} light years away`,
    starMessage: "The light of my star set off when I was born. Find yours:",
    cardAges: "My age on the planets", agesQuestion: "How old are you on Mars?",
    agesMessage: "My age on the planets of the Solar System. How old are you on Mars?",
  },
  de: {
    title: "Dein Stern",
    intro: "Licht braucht Zeit. Gib dein Geburtsjahr ein und sieh, welcher Stern sein heute ankommendes Licht losschickte, als du geboren wurdest.",
    year: "Geburtsjahr", find: "Meinen Stern finden",
    privacy: "Dein Geburtsjahr bleibt nur in diesem Browser. Es wird nicht gesendet, auch nicht mit einem Konto.",
    hostLine: (name, dist) => `${name}, ${dist} Lichtjahre entfernt`,
    hostText: (year, n) => `Das Licht dieses Sterns, das heute bei uns ankommt, brach um ${year} auf. ${n === 1 ? "Er hat 1 bekannten Planeten." : `Er hat ${n} bekannte Planeten.`}`,
    namedLine: (name, dist, constellation) => `${name}${constellation ? ` im Sternbild ${constellation}` : ""}, ${dist} Lichtjahre`,
    namedText: "Diesen siehst du ohne Teleskop: Sein Licht brach etwa zur selben Zeit auf.",
    young: "Selbst das Licht des nächsten Sterns, Proxima Centauri, braucht 4,2 Jahre bis zu uns. Dein Stern ist noch unterwegs.",
    uncertain: "Entfernungen sind mit einer Messunsicherheit bekannt, das Jahr ist deshalb ungefähr.",
    show: "Im 3D-Modell ansehen", share: "Als Bild teilen", more: "Mehr erfahren", edit: "ändern", cancel: "Abbrechen", remove: "entfernen",
    yearLine: (y) => `Geburtsjahr ${y}`, ly: "Lichtjahre", planets: (n) => (n === 1 ? "bekannter Planet" : "bekannte Planeten"),
    key: (year) => `Sein Licht, das heute ankommt, brach um ${year} auf: etwa als du geboren wurdest.`,
    ages: "Dein Alter auf den Planeten", km: "mit der Erde um die Sonne gereist", kmUnit: "km",
    years: (n) => `${n} Jahre`,
    cardTitle: "Mein Stern", cardLight: (name, year) => `Das Licht von ${name}, das heute ankommt, brach um ${year} auf, etwa in meinem Geburtsjahr.`,
    cardDist: (dist) => `${dist} Lichtjahre entfernt`,
    starMessage: "Das Licht meines Sterns brach auf, als ich geboren wurde. Finde deinen:",
    cardAges: "Mein Alter auf den Planeten", agesQuestion: "Wie alt bist du auf dem Mars?",
    agesMessage: "Mein Alter auf den Planeten des Sonnensystems. Wie alt bist du auf dem Mars?",
  },
  ja: {
    title: "あなたの星",
    intro: "光が届くには時間がかかります。生まれた年を入れると、今日届く光をあなたが生まれた頃に放った星がわかります。",
    year: "生まれた年", find: "私の星を探す",
    privacy: "生まれた年はこのブラウザ内だけに残り、送信されません。アカウントがあっても送られません。",
    hostLine: (name, dist) => `${name}（${dist}光年）`,
    hostText: (year, n) => `今日届くこの星の光は、${year}年ごろに出発しました。既知の惑星は${n}個です。`,
    namedLine: (name, dist, constellation) => `${name}${constellation ? `（${constellation}）` : ""}、${dist}光年`,
    namedText: "この星は望遠鏡なしで見えます。その光もほぼ同じ頃に出発しました。",
    young: "いちばん近いプロキシマ・ケンタウリの光でさえ、届くまでに4.2年かかります。あなたの星の光はまだ旅の途中です。",
    uncertain: "距離には測定の不確かさがあるため、年はおおよそです。",
    show: "3Dモデルで見る", share: "画像で共有", more: "くわしく", edit: "変更", cancel: "キャンセル", remove: "削除",
    yearLine: (y) => `生まれた年：${y}`, ly: "光年", planets: () => "個の既知の惑星",
    key: (year) => `今日届く光は${year}年ごろ、あなたが生まれた頃に出発しました。`,
    ages: "惑星でのあなたの年齢", km: "地球とともに太陽のまわりを旅した距離", kmUnit: "km",
    years: (n) => `${n}歳`,
    cardTitle: "私の星", cardLight: (name, year) => `今日届く${name}の光は、私が生まれた${year}年ごろに出発しました。`,
    cardDist: (dist) => `${dist}光年`,
    starMessage: "私の星の光は、私が生まれた頃に旅立ちました。あなたの星も探してみて：",
    cardAges: "惑星での私の年齢", agesQuestion: "あなたは火星で何歳？",
    agesMessage: "太陽系の惑星での私の年齢。あなたは火星で何歳？",
  },
  bg: {
    title: "Твоята звезда",
    intro: "Светлината има нужда от време. Въведи годината си на раждане и виж коя звезда е изпратила днешната си светлина, когато си се родил.",
    year: "Година на раждане", find: "Намери моята звезда",
    privacy: "Годината ти на раждане остава само в този браузър. Не се изпраща, дори с профил.",
    hostLine: (name, dist) => `${name}, на ${dist} светлинни години`,
    hostText: (year, n) => `Светлината на тази звезда, която достига до нас днес, е тръгнала около ${year} г. ${n === 1 ? "Има 1 известна планета." : `Има ${n} известни планети.`}`,
    namedLine: (name, dist, constellation) => `${name}${constellation ? ` в ${constellation}` : ""}, ${dist} светлинни години`,
    namedText: "Тази се вижда без телескоп: светлината ѝ е тръгнала приблизително по същото време.",
    young: "Дори светлината на най-близката звезда, Проксима Кентавър, пътува 4,2 години до нас. Твоята звезда все още е на път.",
    uncertain: "Разстоянията са измерени с известна неточност, затова годината е приблизителна.",
    show: "Виж в 3D модела", share: "Сподели като картинка", more: "Научи повече", edit: "промени", cancel: "Отказ", remove: "премахни",
    yearLine: (y) => `Година на раждане: ${y}`, ly: "светлинни години", planets: (n) => (n === 1 ? "известна планета" : "известни планети"),
    key: (year) => `Светлината ѝ, която пристига днес, е тръгнала около ${year} г., приблизително когато си се родил.`,
    ages: "Твоята възраст на планетите", km: "пропътувани със Земята около Слънцето", kmUnit: "км",
    years: (n) => `${n} години`,
    cardTitle: "Моята звезда", cardLight: (name, year) => `Светлината на ${name}, която пристига днес, е тръгнала около ${year} г., приблизително в годината на раждането ми.`,
    cardDist: (dist) => `на ${dist} светлинни години`,
    starMessage: "Светлината на моята звезда е тръгнала в годината на раждането ми. Намери своята:",
    cardAges: "Моята възраст на планетите", agesQuestion: "На колко години си на Марс?",
    agesMessage: "Моята възраст на планетите от Слънчевата система. На колко години си на Марс?",
  },
};

// getLang(); hosts(): [{ name, dist, planets, teff }]; named(): [{ name, dist, mag, constellation }]; planets(): [{ id, name, years, color, rings }] of the
// Solar System
// (the names in the language of the page); explore(name) flies to a host star.
export function initMyStar({ getLang, hosts, named, planets, explore, onChange }) {
  const t = () => STAR_TEXT[getLang()] ?? STAR_TEXT.en;
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
      const y = Number(localStorage.getItem(KEY));
      return validYear(y) ? y : null;
    } catch {
      return null;
    }
  };
  const write = (y) => {
    try {
      if (y == null) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, String(y));
    } catch {
      // storage blocked: the star is shown, but not remembered
    }
  };
  let year = read();
  let editing = false;
  const fmt = (x, digits = 1) => x.toLocaleString(getLang(), { maximumFractionDigits: digits, minimumFractionDigits: digits });

  // The pictures to share (sharecard.js draws the frame and the planets): no name and no year of birth. The star: its light on the way to the
  // Earth, from the year it set off to today. The ages: the eight planets as lit spheres with the age under each.
  function shareStar(host) {
    const tx = t();
    sharePicture({
      kind: "star",
      title: tx.cardTitle,
      text: tx.starMessage,
      backdrop: 0.42,
      sources: "Earth: NASA",
      draw: async (g) => {
        const star = [300, 420];
        const earth = [800, 760];
        // the way of the light: a dotted line from the star to the Earth, from the colour of the star to blue
        const rgb = starColor(host.teff);
        const beam = g.createLinearGradient(...star, ...earth);
        beam.addColorStop(0, `rgba(${rgb},0.9)`);
        beam.addColorStop(1, "rgba(140,190,255,0.9)");
        g.strokeStyle = beam;
        g.lineWidth = 5;
        g.lineCap = "round";
        g.setLineDash([2, 16]);
        g.beginPath();
        g.moveTo(star[0] + 60, star[1] + 47);
        g.lineTo(earth[0] - 95, earth[1] - 74);
        g.stroke();
        g.setLineDash([]);
        drawStar(g, ...star, 230, rgb);
        await drawPlanet(g, "Earth", ...earth, 90);
        // the distance along the way, and the two years at its ends
        g.save();
        g.translate((star[0] + earth[0]) / 2 + 26, (star[1] + earth[1]) / 2 - 26);
        g.rotate(Math.atan2(earth[1] - star[1], earth[0] - star[0]));
        g.fillStyle = "#ffffff";
        g.font = font(600, 34);
        g.fillText(tx.cardDist(fmt(host.dist)), 0, 0);
        g.restore();
        g.fillStyle = "#ffe0b5";
        g.font = font(700, 46);
        g.fillText(String(leftIn(host.dist)), star[0], star[1] + 150);
        g.fillStyle = "#cfe0ff";
        g.fillText(String(new Date().getUTCFullYear()), earth[0], earth[1] + 160);
        g.fillStyle = "#ffffff";
        g.font = font(700, 78);
        g.fillText(host.name, 540, 1010);
        g.font = font(400, 36);
        g.fillStyle = "rgba(255,255,255,0.92)";
        wrap(g, tx.cardLight(host.name, leftIn(host.dist)), 880).forEach((line, i) => g.fillText(line, 540, 1076 + i * 48));
      },
    });
  }
  // values: [{ id, name, value (the text), earth }]; km: the way round the Sun, as text
  function shareAges(values, km) {
    const tx = t();
    sharePicture({
      kind: "ages",
      title: tx.cardAges,
      text: tx.agesMessage,
      backdrop: 0.5,
      sources: "Planet maps: NASA",
      draw: async (g) => {
        const gap = 22;
        const w = (W - 160 - 3 * gap) / 4;
        const h = 280;
        for (const [i, v] of values.entries()) {
          const x = 80 + (i % 4) * (w + gap);
          const y = 210 + Math.floor(i / 4) * (h + gap);
          panel(g, x, y, w, h, 28, v.earth ? "rgba(120,170,255,0.7)" : "rgba(255,255,255,0.14)", v.earth ? "rgba(30,60,120,0.5)" : "rgba(8,11,20,0.55)");
          await drawPlanet(g, v.id, x + w / 2, y + 82, v.id === "Saturn" ? 34 : 46);
          g.fillStyle = "#ffffff";
          g.font = font(700, 64);
          g.fillText(v.value, x + w / 2, y + 200);
          g.fillStyle = "#c4d0ea";
          g.font = font(400, 30);
          g.fillText(v.name, x + w / 2, y + 250);
        }
        panel(g, 80, 834, W - 160, 180, 28);
        g.fillStyle = "#ffffff";
        g.font = font(700, 62);
        g.fillText(km, 540, 918);
        g.fillStyle = "#c4d0ea";
        g.font = font(400, 32);
        g.fillText(tx.km, 540, 976);
        g.fillStyle = "#ffffff";
        g.font = font(600, 48);
        g.fillText(tx.agesQuestion, 540, 1120);
      },
    });
  }

  function sections(closePanel) {
    const tx = t();
    const s = el("section", "uni-section star-section");
    s.append(el("h3", "", tx.title));
    if (year == null || editing) {
      s.append(el("p", "", tx.intro));
      const row = el("div", "uni-places");
      const input = el("input");
      input.type = "number";
      input.min = "1900";
      input.max = String(new Date().getUTCFullYear());
      input.placeholder = tx.year;
      input.setAttribute("aria-label", tx.year);
      input.className = "star-year";
      if (year != null) input.value = String(year);
      row.append(
        input,
        button(tx.find, "uni-primary", () => {
          const y = Number(input.value);
          if (!validYear(y)) return input.focus();
          year = y;
          editing = false;
          write(y);
          track("star-found");
          onChange?.();
        })
      );
      if (editing) row.append(button(tx.cancel, "uni-link", () => ((editing = false), onChange?.())));
      s.append(row, el("p", "hint", tx.privacy));
      return [s];
    }
    const age = ageFrom(year);
    const host = pickHost(hosts(), age);
    preload(planets().map((p) => p.id)); // the Milky Way and the maps of the planets, ready before a click on "Share"
    if (!host || age < 4) {
      s.append(el("p", "", tx.young));
    } else {
      const card = el("div", "star-hero");
      const glow = el("div", "star-glow");
      glow.setAttribute("aria-hidden", "true");
      const body = el("div", "star-body");
      const facts = el("div", "star-facts");
      const fact = (value, label) => {
        const f = el("span", "");
        f.append(el("b", "", value), ` ${label}`);
        return f;
      };
      facts.append(fact(fmt(host.dist), tx.ly), fact(String(host.planets), tx.planets(host.planets)));
      const actions = el("div", "star-actions");
      actions.append(
        button(tx.show, "uni-primary", () => {
          track("star-show");
          closePanel?.();
          explore(host.name);
        }),
        button(tx.share, "uni-link", () => shareStar(host))
      );
      body.append(el("strong", "star-name", host.name), facts, el("p", "star-key", tx.key(leftIn(host.dist))), actions);
      card.append(glow, body);
      s.append(card);
      // the explanation, the star to see without a telescope, the uncertainty: one click away
      const more = [el("p", "", tx.intro)];
      const star = pickNamed(named(), age);
      if (star) more.push(el("p", "", `${tx.namedLine(star.name, fmt(star.dist), star.constellation)}. ${tx.namedText}`));
      more.push(el("p", "hint", tx.uncertain));
      s.append(disclosure("star-more", tx.more, more));
    }
    // the age on the planets: the Earth first (its year is the age itself), then the others from the Sun outwards, and the way round the Sun
    const a = el("section", "uni-section ages-section");
    a.append(el("h3", "", tx.ages));
    const list = el("div", "star-ages");
    const ordered = [...planets()].sort((p, q) => (q.years === 1) - (p.years === 1));
    const values = [];
    for (const p of ordered) {
      const value = ageOn(age, p.years);
      const text = fmt(value, value < 10 ? 1 : 0);
      values.push({ id: p.id, name: p.name, value: text, earth: p.years === 1 });
      const tile = el("div", `age-tile${p.years === 1 ? " earth" : ""}`);
      const dot = el("i", `age-dot${p.rings ? " ring" : ""}`);
      dot.style.setProperty("--c", p.color ?? "#9aa");
      dot.setAttribute("aria-hidden", "true");
      tile.append(dot, el("b", "", text), el("span", "", p.name));
      list.append(tile);
    }
    // "32 Mrd.", "32B", "320億": the number short, in the language of the page
    const km = new Intl.NumberFormat(getLang(), { notation: "compact", maximumFractionDigits: 1 }).format(kmRoundSun(age));
    const travel = el("div", "age-tile age-km");
    travel.append(el("b", "", `${km} ${tx.kmUnit}`), el("span", "", tx.km));
    list.append(travel);
    a.append(list);
    // one line under the tiles: share on the left, the year and its changes on the right
    const foot = el("div", "uni-edit ages-foot");
    const edits = el("span", "ages-year");
    edits.append(
      el("span", "", tx.yearLine(year)),
      button(tx.edit, "uni-link", () => ((editing = true), onChange?.())),
      button(tx.remove, "uni-link", () => {
        year = null;
        write(null);
        onChange?.();
      })
    );
    foot.append(button(tx.share, "uni-link", () => shareAges(values, `${km} ${tx.kmUnit}`)), edits);
    a.append(foot);
    return [s, a];
  }
  return {
    sections,
    forget: () => ((year = null), write(null)),
    // the visitor's star, for the flight of the day: { name, year } or null (no year given, or too young for a star)
    current: () => {
      if (year == null) return null;
      const age = ageFrom(year);
      const host = age >= 4 ? pickHost(hosts(), age) : null;
      return host ? { name: host.name, year: leftIn(host.dist) } : null;
    },
  };
}
