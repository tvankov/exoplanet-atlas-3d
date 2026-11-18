// "Your flight of the day": a guided flight through the 3D map with three stops that change every day: the discovery of the day, the next
// event in the sky, and a place for the visitor (their star if they gave a year of birth, a planet of the Solar System or a habitable candidate
// depending on their interest). It starts on the Earth and flies from stop to stop with the travel planner at the speed of light (Earth to A,
// A to B, B to C, and back to the Earth), through hyperspace when the way leads to another star; where there is no trip (the same place
// again) the camera flies there. At every stop a card shows a short text built from the data of the map; a voice of the device reads it (on unless the visitor switched it
// off; only a voice that runs on the device, an online voice would send the text, with the year of birth in it, to a server), the sound of the page can
// play under it. The stops go on by themselves after a while, or with "Next". At the end a card says what was seen. Flying it counts for a
// daily mission (explorer.js). Nothing is stored about the flight itself.

import { track } from "./stats.js";

export const FLIGHT_TEXT = {
  en: {
    title: "Your flight of the day", start: "Start the flight of the day", kicker: (i, n) => `Flight of the day · ${i} of ${n}`,
    next: "Next", end: "End", voice: "Read aloud", done: "Flight done",
    seen: (list) => `Today you saw: ${list}.`, home: "Back on the Earth.",
    stopDaily: "Discovery of the day", stopEvent: "Next in the sky", stopYours: "For you",
    event: (title, when) => `${title}, ${when}.`,
    star: (name, year) => `Your star: ${name}. The light of it that arrives today set off around ${year}, about when you were born.`,
    candidate: (name, dist, total) => `${name}, ${dist} light years away: one of the ${total} candidates in the habitable zone of their star.`,
    solar: (name, au) => `${name}, ${au} times as far from the Sun as the Earth.`,
    hint: "From the Earth to three places and back at the speed of light, about three minutes, different every day.",
  },
  de: {
    title: "Dein Flug des Tages", start: "Flug des Tages starten", kicker: (i, n) => `Flug des Tages · ${i} von ${n}`,
    next: "Weiter", end: "Beenden", voice: "Vorlesen", done: "Flug beendet",
    seen: (list) => `Heute gesehen: ${list}.`, home: "Zurück auf der Erde.",
    stopDaily: "Entdeckung des Tages", stopEvent: "Als Nächstes am Himmel", stopYours: "Für dich",
    event: (title, when) => `${title}, ${when}.`,
    star: (name, year) => `Dein Stern: ${name}. Sein Licht, das heute ankommt, brach um ${year} auf, etwa zu deiner Geburt.`,
    candidate: (name, dist, total) => `${name}, ${dist} Lichtjahre entfernt: einer der ${total} Kandidaten in der bewohnbaren Zone ihres Sterns.`,
    solar: (name, au) => `${name}, ${au}-mal so weit von der Sonne entfernt wie die Erde.`,
    hint: "Von der Erde zu drei Orten und zurück mit Lichtgeschwindigkeit, etwa drei Minuten, jeden Tag anders.",
  },
  ja: {
    title: "今日のフライト", start: "今日のフライトを始める", kicker: (i, n) => `今日のフライト · ${n}中${i}`,
    next: "次へ", end: "終了", voice: "読み上げる", done: "フライト完了",
    seen: (list) => `今日見たもの：${list}。`, home: "地球に戻りました。",
    stopDaily: "今日の発見", stopEvent: "次の天文イベント", stopYours: "あなたへ",
    event: (title, when) => `${title}、${when}。`,
    star: (name, year) => `あなたの星：${name}。今日届くその光は、あなたが生まれた頃の${year}年ごろに出発しました。`,
    candidate: (name, dist, total) => `${name}、${dist}光年先。恒星のハビタブルゾーンにある${total}個の候補の1つです。`,
    solar: (name, au) => `${name}。太陽からの距離は地球の${au}倍です。`,
    hint: "地球から3か所を巡って光の速さで戻る、約3分。毎日変わります。",
  },
  bg: {
    title: "Твоят полет на деня", start: "Започни полета на деня", kicker: (i, n) => `Полет на деня · ${i} от ${n}`,
    next: "Напред", end: "Край", voice: "Прочети на глас", done: "Полетът приключи",
    seen: (list) => `Днес видя: ${list}.`, home: "Обратно на Земята.",
    stopDaily: "Откритие на деня", stopEvent: "Следва в небето", stopYours: "За теб",
    event: (title, when) => `${title}, ${when}.`,
    star: (name, year) => `Твоята звезда: ${name}. Светлината ѝ, която пристига днес, е тръгнала около ${year} г., приблизително когато си роден.`,
    candidate: (name, dist, total) => `${name}, на ${dist} светлинни години: един от ${total} кандидата в обитаемата зона на звездата си.`,
    solar: (name, au) => `${name}, ${au} пъти по-далеч от Слънцето от Земята.`,
    hint: "От Земята до три места и обратно със скоростта на светлината, около три минути, различни всеки ден.",
  },
};

const STOP_SECONDS = 14; // a stop goes on by itself after this (or after the voice, with a short pause)

// getLang(): the language of the page. stops(): the three stops of today, each { kind, place, label, text } with
// the place to fly to (a name for explore). explore(name) flies there. travel(from, to, arrived, aborted) starts a trip of the planner and
// gives true, or false when there is none (then explore is used); arrived() comes after the arrival, aborted() when the trip was stopped on
// the way. cancelTravel() stops a trip that is under way. onDone(): the flight was flown to the end.
export function initDailyFlight({ getLang, stops, explore, travel, cancelTravel, onDone }) {
  const t = () => FLIGHT_TEXT[getLang()] ?? FLIGHT_TEXT.en;
  const card = document.getElementById("day-flight");
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
  let list = [];
  let index = -1;
  let here = "Earth"; // where the flight is now: it starts on the Earth
  let travelling = false; // on the way to the stop of index (the box of the trip is shown, not this card)
  let timer = 0;
  let voice = true; // read aloud, unless the visitor switched it off
  try {
    voice = localStorage.getItem("flight-voice") !== "off";
  } catch {
    // storage blocked: the voice stays on
  }
  const localVoice = () => window.speechSynthesis?.getVoices().find((v) => v.localService && v.lang.toLowerCase().startsWith(getLang())) ?? null;

  function clear() {
    clearTimeout(timer);
    window.speechSynthesis?.cancel();
  }
  function schedule(ms) {
    clearTimeout(timer);
    timer = setTimeout(() => go(index + 1), ms);
  }
  function speak(text) {
    const device = voice ? localVoice() : null;
    if (!device) return false;
    speechSynthesis.cancel();
    const sentences = text.match(/[^.!?。]+[.!?。]?/g) ?? [text];
    sentences.forEach((sentence, i) => {
      const u = new SpeechSynthesisUtterance(sentence.trim());
      u.voice = device;
      u.lang = device.lang;
      if (i === sentences.length - 1) u.onend = () => index >= 0 && index < list.length && schedule(2000);
      speechSynthesis.speak(u);
    });
    return true;
  }

  function render() {
    if (index < 0) return;
    card.hidden = travelling;
    if (travelling) return;
    const tx = t();
    if (index >= list.length) {
      const names = list.map((s) => s.short ?? s.label).join(", "); // the names only, not the countdown
      card.replaceChildren(
        el("small", "", tx.title),
        el("strong", "", tx.done),
        el("p", "", `${tx.home} ${tx.seen(names)}`),
        (() => {
          const row = el("div", "day-flight-actions");
          row.append(button(tx.end, "account-main", stop));
          return row;
        })()
      );
      return;
    }
    const stop_ = list[index];
    const progress = el("div", "day-flight-progress");
    const bar = el("div", "");
    progress.append(bar);
    const voiceBox = el("label", "day-flight-voice");
    const check = el("input");
    check.type = "checkbox";
    check.checked = voice;
    check.addEventListener("change", () => {
      voice = check.checked;
      try {
        localStorage.setItem("flight-voice", voice ? "on" : "off");
      } catch {
        // not remembered
      }
      if (voice) {
        clearTimeout(timer);
        speak(`${stop_.heading}. ${stop_.text}`);
      } else {
        window.speechSynthesis?.cancel();
        schedule(STOP_SECONDS * 1000);
      }
    });
    voiceBox.append(check, el("span", "", tx.voice));
    voiceBox.hidden = !localVoice(); // no voice on the device: nothing to switch
    const row = el("div", "day-flight-actions");
    row.append(voiceBox, button(`${tx.next} ›`, "account-main", () => go(index + 1)), button(tx.end, "account-link", stop));
    card.replaceChildren(el("small", "", `${tx.kicker(index + 1, list.length)} · ${stop_.heading}`), el("strong", "", stop_.label), el("p", "", stop_.text), progress, row);
    // the bar runs out in the time of the stop (when the voice reads, it waits for the voice instead)
    if (!voice) requestAnimationFrame(() => ((bar.style.transitionDuration = `${STOP_SECONDS}s`), bar.classList.add("run")));
  }

  function go(i) {
    clear();
    index = i;
    if (index >= list.length) {
      // the last leg: back to the Earth, then the card of the end
      const finish = () => {
        if (index !== i) return;
        travelling = false;
        here = "Earth";
        track("daily-flight-done");
        onDone?.();
        render();
        const tx = t();
        speak(`${tx.done}. ${tx.home} ${tx.seen(list.map((s) => s.short ?? s.label).join(", "))}`);
      };
      travelling = here !== "Earth" && !!travel?.(here, "Earth", finish, () => index === i && stop());
      if (travelling) return render();
      if (here !== "Earth") explore("Earth");
      finish();
      return;
    }
    const s = list[index];
    const arrive = () => {
      if (index !== i) return; // the flight was ended or went on meanwhile
      travelling = false;
      here = s.place;
      render();
      if (!speak(`${s.heading}. ${s.text}`)) schedule(STOP_SECONDS * 1000);
    };
    travelling = !!travel?.(here, s.place, arrive, () => index === i && stop());
    if (travelling) return render();
    explore(s.place);
    arrive();
  }
  function start() {
    list = stops().filter(Boolean);
    if (!list.length) return;
    track("daily-flight-start");
    here = "Earth";
    go(0);
  }
  function stop() {
    clear();
    if (travelling) cancelTravel?.();
    travelling = false;
    index = -1;
    card.hidden = true;
  }
  window.addEventListener("keydown", (e) => e.key === "Escape" && index >= 0 && !travelling && stop());
  return { start, stop, render, label: () => t().start, hint: () => t().hint, title: () => t().title };
}
