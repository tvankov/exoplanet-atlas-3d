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
