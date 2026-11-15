// Counting what is used, without knowing who uses it. Each call sends only the name of an event ("trip-start-solar", "mission-done-d-answer")
// to GoatCounter, which counts it like a page view: no name, no identifier, no cookie (see the privacy notice in legal.html). If the counter
// script is blocked or not loaded yet (it loads async), nothing happens. On localhost GoatCounter ignores the calls.

export function track(name) {
  try {
    window.goatcounter?.count?.({ path: name, title: name, event: true });
  } catch {
    // counting must never break the page
  }
}

// How long a visit lasts, and whether the browser has been here before, as events without a person: "stay-1min", "stay-5min" and "stay-15min"
// are sent once per visit when the page has been open and visible for that long (a page in the background does not count), and "returning" when
// the last visit of this browser was more than 30 minutes ago (a reload does not count). The time of the last visit stays in this browser
// (localStorage "last-visit") and is not sent. GoatCounter counts them like page views, so the dashboard shows how many visits reached each step.
const STAY = [[60, "stay-1min"], [300, "stay-5min"], [900, "stay-15min"]];
const TICK = 5; // seconds

export function startSessionStats() {
  try {
    const last = Number(localStorage.getItem("last-visit"));
    // a few seconds later: the counter script loads asynchronously and would not be there yet
    if (last && Date.now() - last > 30 * 60 * 1000) setTimeout(() => track("returning"), 4000);
    localStorage.setItem("last-visit", String(Date.now()));
  } catch {
    // storage blocked: no returning visits are counted
  }
  let seconds = 0;
  let step = 0;
  setInterval(() => {
    if (document.visibilityState !== "visible") return;
    seconds += TICK;
    try {
      localStorage.setItem("last-visit", String(Date.now())); // a long visit is not a "return" when the page is reloaded
    } catch {
      // not remembered
    }
    while (step < STAY.length && seconds >= STAY[step][0]) track(STAY[step++][1]);
  }, TICK * 1000);
}

// Technical measurements, again as events without a person. They tell how the page runs on the computers of the visitors, in a few steps
// (never an exact value, never the graphics card): "load-under-2s" ... "load-over-10s" (the time from the start of the page until the map is
// shown), "fps-under-20", "fps-20-40", "fps-over-40" (the average frame rate over 15 seconds, measured 10 seconds after the start, and only if
// the page stayed visible), "webgl-context-lost" (sent from main.js) and "js-error" (a script error of this site, once per visit, without the
// text of the error). A visit sends each of them at most once.
const sent = new Set();
export function trackOnce(name) {
  if (sent.has(name)) return;
  sent.add(name);
  track(name);
}

// ms: the time since the start of the page, when the map is shown. A few seconds later: the counter script loads asynchronously.
export function trackLoadTime(ms) {
  const step = ms < 2000 ? "under-2s" : ms < 5000 ? "2-5s" : ms < 10000 ? "5-10s" : "over-10s";
  setTimeout(() => trackOnce(`load-${step}`), 4000);
}

export function startTechStats() {
  window.addEventListener("error", (e) => {
    if (e.filename && !e.filename.startsWith(location.origin)) return; // a script of somebody else
    trackOnce("js-error");
  });
  window.addEventListener("unhandledrejection", () => trackOnce("js-error"));
  setTimeout(() => {
    let frames = 0;
    let spoiled = document.visibilityState !== "visible";
    const from = performance.now();
    const count = () => {
      if (document.visibilityState !== "visible") spoiled = true; // a page in the background is slowed down by the browser
      frames++;
      if (performance.now() - from < 15000) return requestAnimationFrame(count);
      if (spoiled) return;
      const fps = (frames * 1000) / (performance.now() - from);
      trackOnce(fps < 20 ? "fps-under-20" : fps < 40 ? "fps-20-40" : "fps-over-40");
    };
    requestAnimationFrame(count);
  }, 10000);
}
