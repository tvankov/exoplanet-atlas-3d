// "Your star": the visitor gives a birth year (optional, it stays in this browser only, also with an account) and gets the star whose light that
// arrives today set off about when they were born: a star as many light years away as they are old. Two kinds: a star with planets from the NASA
// list (the 3D map can fly there), and, if there is one at about that distance, a bright named star that can be seen without a telescope. Then a
// few numbers that follow from the age alone (the age on the other planets, the way the Earth has travelled round the Sun), and a picture to share
// without a name. Distances have a measuring uncertainty, so the year is "about". The choice rules are pure functions, tested in
// tests/mystar.test.mjs.

import { track } from "./stats.js";
import { disclosure } from "./disclosure.js";

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
    cardTitle: "My star", cardLight: (name, year) => `The light of ${name} that arrives today set off around ${year}, the year I was born.`,
    cardDist: (dist) => `${dist} light years away`,
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
    cardTitle: "Mein Stern", cardLight: (name, year) => `Das Licht von ${name}, das heute ankommt, brach um ${year} auf, in meinem Geburtsjahr.`,
    cardDist: (dist) => `${dist} Lichtjahre entfernt`,
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
    cardTitle: "Моята звезда", cardLight: (name, year) => `Светлината на ${name}, която пристига днес, е тръгнала около ${year} г., годината, в която съм роден.`,
    cardDist: (dist) => `на ${dist} светлинни години`,
  },
};

// getLang(); hosts(): [{ name, dist, planets }]; named(): [{ name, dist, mag, constellation }]; planets(): [{ name, years, color, rings }] of the Solar System
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

  // the picture to share: no name, only the star, the year and the distance
  async function shareCard(host) {
    const tx = t();
    const c = document.createElement("canvas");
    c.width = c.height = 1080;
    const g = c.getContext("2d");
    const sky = g.createRadialGradient(540, 420, 40, 540, 540, 760);
    sky.addColorStop(0, "#1b2340");
    sky.addColorStop(1, "#05060a");
    g.fillStyle = sky;
    g.fillRect(0, 0, 1080, 1080);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(255,255,255,${(Math.random() * 0.6 + 0.2).toFixed(2)})`;
      g.fillRect(Math.random() * 1080, Math.random() * 1080, Math.random() * 2 + 0.5, Math.random() * 2 + 0.5);
    }
    const glow = g.createRadialGradient(540, 380, 0, 540, 380, 120);
    glow.addColorStop(0, "rgba(255,240,210,1)");
    glow.addColorStop(0.25, "rgba(255,200,140,0.6)");
    glow.addColorStop(1, "rgba(255,200,140,0)");
    g.fillStyle = glow;
    g.fillRect(400, 240, 280, 280);
    g.textAlign = "center";
    g.fillStyle = "#b8e6c1";
    g.font = "600 34px system-ui, 'Segoe UI', sans-serif";
    g.fillText(tx.cardTitle.toUpperCase(), 540, 160);
    g.fillStyle = "#ffffff";
    g.font = "700 72px system-ui, 'Segoe UI', sans-serif";
    g.fillText(host.name, 540, 610);
    g.font = "400 34px system-ui, 'Segoe UI', sans-serif";
    g.fillStyle = "#c4d0ea";
    g.fillText(tx.cardDist(fmt(host.dist)), 540, 665);
    // the sentence, wrapped by width
    g.fillStyle = "#ffffff";
    g.font = "400 38px system-ui, 'Segoe UI', sans-serif";
    const words = tx.cardLight(host.name, leftIn(host.dist)).split(" ");
    const lines = [];
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (g.measureText(next).width > 860 && line) (lines.push(line), (line = w));
      else line = next;
    }
    if (line) lines.push(line);
    lines.forEach((l, i) => g.fillText(l, 540, 770 + i * 52));
    g.fillStyle = "#7cffb2";
    g.font = "500 28px system-ui, 'Segoe UI', sans-serif";
    g.fillText("space.todorvankov.com", 540, 1020);
    const blob = await new Promise((resolve) => c.toBlob(resolve, "image/png"));
    const file = new File([blob], "my-star.png", { type: "image/png" });
    track("star-share");
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: tx.cardTitle });
        return;
      } catch {
        // cancelled: nothing to do
        return;
      }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "my-star.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // Two parts for My Universe: the star (a highlight card) and the age on the planets (tiles). The year is asked first, and changed with two small
  // links at the bottom.
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
        button(tx.share, "uni-link", () => shareCard(host))
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
    for (const p of ordered) {
      const value = ageOn(age, p.years);
      const tile = el("div", `age-tile${p.years === 1 ? " earth" : ""}`);
      const dot = el("i", `age-dot${p.rings ? " ring" : ""}`);
      dot.style.setProperty("--c", p.color ?? "#9aa");
      dot.setAttribute("aria-hidden", "true");
      tile.append(dot, el("b", "", fmt(value, value < 10 ? 1 : 0)), el("span", "", p.name));
      list.append(tile);
    }
    // "32 Mrd.", "32B", "320億": the number short, in the language of the page
    const km = new Intl.NumberFormat(getLang(), { notation: "compact", maximumFractionDigits: 1 }).format(kmRoundSun(age));
    const travel = el("div", "age-tile age-km");
    travel.append(el("b", "", `${km} ${tx.kmUnit}`), el("span", "", tx.km));
    list.append(travel);
    a.append(list);
    const editRow = el("div", "uni-edit");
    editRow.append(
      el("span", "", tx.yearLine(year)),
      button(tx.edit, "uni-link", () => ((editing = true), onChange?.())),
      button(tx.remove, "uni-link", () => {
        year = null;
        write(null);
        onChange?.();
      })
    );
    a.append(editRow);
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
