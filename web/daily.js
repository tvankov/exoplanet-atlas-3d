// The daily discovery: one hand-written entry per day (web/data/daily.json) with a short text, a question with three answers, the source
// and a link into the 3D map. The entry of the day follows the local date of the visitor, so it changes at midnight where they are. If
// the file cannot be loaded, a built-in entry (Mars) is shown instead. Nothing leaves the browser: what was answered is kept in
// localStorage ("daily"), and the dot on the button says that today's entry has not been opened yet ("daily-seen").

const FALLBACK = {
  id: "mars-fallback",
  target: "Mars",
  credit: "NASA Planetary Fact Sheet",
  en: {
    title: "Mars: a volcano as tall as three Everests",
    text: "Olympus Mons on Mars is the tallest known volcano in the Solar System, about 22 kilometres high. That is roughly two and a half times the height of Mount Everest above sea level.",
    q: "About how much taller than Mount Everest is Olympus Mons?",
    options: ["Roughly 2.5 times", "Roughly the same", "Roughly 10 times"],
    answer: 0,
    explain: "Olympus Mons is about 22 km high, Everest about 8.8 km above sea level, so about 2.5 times.",
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
export async function initDaily({ getLang, text, explore }) {
  let entries = [FALLBACK];
  try {
    const res = await fetch("data/daily.json");
    const data = await res.json();
    if (Array.isArray(data.entries) && data.entries.length) entries = data.entries;
  } catch {
    // the built-in entry stays
  }
  const day = dayNumber();
  const entry = entryOfDay(entries, day);
  const button = document.getElementById("daily-open");
  const panel = document.getElementById("daily-panel");
  const body = document.getElementById("daily-body");
  const answeredToday = () => {
    const saved = read("daily");
    return saved?.day === day && saved.id === entry.id ? saved.choice : null;
  };

  function render() {
    const lang = getLang();
    const content = entry[lang] ?? entry.en;
    const t = text;
    button.textContent = t("dailyButton");
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
      explore(entry.target);
    });
    parts.push(explore3d);
    parts.push(p("hint daily-credit", `${t("dailySource")}: ${entry.credit}`));
    body.replaceChildren(...parts);
  }

  function togglePanel(open = panel.hidden) {
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
  return { render, entry, day };
}
