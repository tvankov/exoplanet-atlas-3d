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
