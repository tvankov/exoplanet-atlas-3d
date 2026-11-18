// The daily discovery: one hand-written entry per day (web/data/daily.json) with a short text, a question with three answers, the source
// and a link into the 3D map. The entry of the day follows the local date of the visitor, so it changes at midnight where they are. If
// the file cannot be loaded, a built-in entry (Mars) is shown instead. Nothing leaves the browser: what was answered is kept in
// localStorage ("daily"), and the dot on the button says that today's entry has not been opened yet ("daily-seen").

import { track } from "./stats.js";
import { speakButton, stopReading } from "./speak.js";
import { entryForInterest, readStoredProfile } from "./profile.js";

const FALLBACK = {
  id: "mars-fallback",
  target: "Mars",
  credit: "NASA Science: Mars, Facts",
  en: {
    title: "Mars: the largest volcano in the Solar System",
    text: "Olympus Mons on Mars is the largest volcano in the Solar System, several times as tall as Mount Everest. Its height is given differently from source to source, depending on whether it is measured from the plains around it or from the mean level of Mars.",
    q: "On which planet is the largest volcano of the Solar System?",
    options: ["Mars", "Venus", "Earth"],
    answer: 0,
    explain: "On Mars: Olympus Mons, several times as tall as Mount Everest (NASA, Mars facts).",
  },
};

// The number of the local day: the same for every moment of that date, whatever the time zone.
export const dayNumber = (date = new Date()) => Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
export const entryOfDay = (entries, day) => entries[((day % entries.length) + entries.length) % entries.length];

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null; // storage can be blocked, the page works without it
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // not remembered
  }
};

// getLang() gives the language of the page, text(key) the interface texts, explore(name) flies to the object in the 3D map.
export async function initDaily({ getLang, text, explore, onAnswer, flightLabel, startFlight }) {
  let entries = [FALLBACK];
  try {
    const res = await fetch("data/daily.json");
    const data = await res.json();
    if (Array.isArray(data.entries) && data.entries.length) entries = data.entries;
  } catch {
    // the built-in entry stays
  }
  const day = dayNumber();
  // the interest of the profile chooses among the entries of the kind (the planets of the Solar System, or the exoplanets), see profile.js
  const entry = entryForInterest(entries, day, readStoredProfile()?.interest);
  const button = document.getElementById("dock-daily"); // the card of the dock
  const panel = document.getElementById("daily-panel");
  const body = document.getElementById("daily-body");
  const answeredToday = () => {
    const saved = read("daily");
    return saved?.day === day && saved.id === entry.id ? saved.choice : null;
  };

  // The colour of the planet on the card: one hue per entry, so the picture changes with the day.
  let hash = 0;
  for (const ch of entry.id) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  document.getElementById("dock-daily").style.setProperty("--hue", String(hash));

  function render() {
    const lang = getLang();
    const content = entry[lang] ?? entry.en;
    const t = text;
    button.classList.toggle("fresh", read("daily-seen") !== day);
    document.getElementById("daily-label").textContent = t("dailyLabel");
    document.getElementById("daily-close").setAttribute("aria-label", t("dailyClose"));
    document.getElementById("daily-title").textContent = content.title;
    const parts = [];
    const p = (cls, value) => {
      const el = document.createElement("p");
      if (cls) el.className = cls;
      el.textContent = value;
      return el;
    };
    parts.push(p("", content.text));
    parts.push(speakButton(entry[lang] ? lang : "en", [content.title, content.text, content.q], "daily"));
    // Japanese and Bulgarian readers get the English text for now (the interface around it is translated).
    if (!entry[lang] && lang !== "en") parts.push(p("hint", t("dailyEnglishOnly")));
    parts.push(p("daily-q", content.q));
    const choice = answeredToday();
    const list = document.createElement("div");
    list.className = "daily-options";
    content.options.forEach((option, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = option;
      if (choice != null) {
        b.disabled = true;
        if (i === content.answer) b.classList.add("right");
        else if (i === choice) b.classList.add("wrong");
      }
      b.addEventListener("click", () => {
        write("daily", { day, id: entry.id, choice: i });
        track(`daily-answer-${i === content.answer ? "right" : "wrong"}`);
        onAnswer?.();
        render();
      });
      list.append(b);
    });
    parts.push(list);
    if (choice != null) parts.push(p("daily-answer", `${choice === content.answer ? t("dailyRight") : t("dailyWrong")} ${content.explain}`));
    const explore3d = document.createElement("button");
    explore3d.type = "button";
    explore3d.className = "daily-explore";
    explore3d.textContent = t("dailyExplore");
    explore3d.addEventListener("click", () => {
      togglePanel(false);
      track("daily-explore");
      explore(entry.target);
    });
    parts.push(explore3d);
    // the flight of the day starts with this discovery (dailyflight.js)
    if (startFlight) {
      const flight = document.createElement("button");
      flight.type = "button";
      flight.className = "daily-explore daily-flight";
      flight.textContent = `✈ ${flightLabel()}`;
      flight.addEventListener("click", () => {
        togglePanel(false);
        startFlight();
      });
      parts.push(flight);
    }
    parts.push(p("hint daily-credit", `${t("dailySource")}: ${entry.credit}`));
    body.replaceChildren(...parts);
  }

  function togglePanel(open = panel.hidden) {
    if (!open) stopReading();
    panel.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    if (open) {
      write("daily-seen", day);
      button.classList.remove("fresh");
    }
  }
  button.addEventListener("click", () => togglePanel());
  document.getElementById("daily-close").addEventListener("click", () => togglePanel(false));
  window.addEventListener("keydown", (e) => e.key === "Escape" && !panel.hidden && togglePanel(false));
  render();
  return { render, entry, day, open: () => togglePanel(true), answered: () => answeredToday() != null };
}
