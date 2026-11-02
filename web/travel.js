// Travel planner (stage 1: planet to planet in the Solar System), flight speeds in multiples of c, spectral
// classes and the texts for them. The maths here is plain and has no three.js in it, so it can be read and
// checked on its own. main.js draws the result.

export const C_KMS = 299792.458; // speed of light in km/s (exact by definition of the metre)
export const AU_KM = 149597870.7; // astronomical unit in km (exact since 2012)
export const C_AU_PER_DAY = (C_KMS * 86400) / AU_KM;
export const LY_PER_AU = 1 / 63241.077;
export const SECONDS_PER_YEAR = 365.25 * 86400;

// The speed steps of the planner. "kind" decides the label: probes are real, "fast" is far beyond every real
// spacecraft but not forbidden by physics, "limit" is the speed of light itself, "fiction" is faster than
// light, which nothing can do according to what we know today.
export const SPEEDS = [
  { id: "voyager", kms: 17, kind: "probe" }, // Voyager 1 relative to the Sun, about 17 km/s
  { id: "parker", kms: 190, kind: "probe" }, // Parker Solar Probe near the Sun, about 190 km/s at its fastest
  { id: "c01", kms: 0.1 * C_KMS, kind: "fast" },
  { id: "c09", kms: 0.9 * C_KMS, kind: "fast" },
  { id: "c1", kms: C_KMS, kind: "limit" },
  { id: "c10", kms: 10 * C_KMS, kind: "fiction" },
  { id: "c100", kms: 100 * C_KMS, kind: "fiction" },
  { id: "c1000", kms: 1000 * C_KMS, kind: "fiction" }, // between stars: 10 c would still take years
  { id: "c100000", kms: 100000 * C_KMS, kind: "fiction" },
];

// Free flight with the keys. Every step is a multiple of c, where 1 c is one light second per second. "auto"
// keeps the old behaviour (slow when close to something, fast on the overview).
export const FLY_STEPS = [
  { id: "auto", c: null },
  { id: "f1", c: 1 },
  { id: "f3", c: 1e3 },
  { id: "f5", c: 1e5 },
  { id: "f7", c: 1e7 },
  { id: "f9", c: 1e9 },
  { id: "f11", c: 1e11 },
];

// Lorentz factor for a speed given as a fraction of c, below c only.
export const lorentz = (beta) => 1 / Math.sqrt(1 - beta * beta);

// The ship leaves the point "from" at day jd0 and flies in a straight line at constant speed. The target keeps
// moving, so the ship aims at the place where the target will be on arrival (an intercept course): we look
// for the time T where the distance from "from" to the target at jd0 + T equals what the ship covers in T.
// toPos(jd) gives the target position, all in AU and days. The first such time is found by stepping and
// then bisecting. Returns null if there is none within maxDays.
export function solveIntercept(from, toPos, jd0, vAuPerDay, maxDays = 365.25 * 300) {
  const gap = (T) => {
    const p = toPos(jd0 + T);
    return Math.hypot(p.x - from.x, p.y - from.y, p.z - from.z) - vAuPerDay * T;
  };
  const d0 = gap(0);
  const step = Math.max(d0 / vAuPerDay / 40, 1e-9);
  let lo = 0;
  let hi = step;
  while (gap(hi) > 0) {
    lo = hi;
    hi += step;
    if (hi > maxDays) return null;
  }
  for (let i = 0; i < 70; i++) {
    const mid = (lo + hi) / 2;
    if (gap(mid) > 0) lo = mid;
    else hi = mid;
  }
  const days = (lo + hi) / 2;
  return { days, arrive: toPos(jd0 + days) };
}

// Time on board in seconds for a trip of "seconds" in the frame of the Sun. Only defined below c.
export function boardSeconds(seconds, beta) {
  return beta < 1 ? seconds / lorentz(beta) : null;
}

// Spectral classes from the effective temperature of the star. The limits are the usual rounded ones of the
// Harvard classes (O, B, A, F, G, K, M). They are applied to st_teff, not to the spectral type of the
// catalogue, which many stars do not have.
export const SPECTRAL = [
  { cls: "O", min: 30000, max: Infinity },
  { cls: "B", min: 10000, max: 30000 },
  { cls: "A", min: 7500, max: 10000 },
  { cls: "F", min: 6000, max: 7500 },
  { cls: "G", min: 5200, max: 6000 },
  { cls: "K", min: 3700, max: 5200 },
  { cls: "M", min: 0, max: 3700 },
];
export function spectralClass(teff) {
  if (!Number.isFinite(teff)) return null;
  return SPECTRAL.find((s) => teff >= s.min && teff < s.max)?.cls ?? null;
}

export const TRAVEL_UI = {
  en: {
    title: "Travel planner",
    from: "From",
    to: "To",
    speed: "Speed",
    go: "Plan and fly",
    stop: "Stop",
    speedLabel: {
      voyager: "Voyager 1 (17 km/s)",
      parker: "Parker Solar Probe (about 190 km/s)",
      c01: "0.1 c",
      c09: "0.9 c",
      c1: "1 c (light speed)",
      c10: "10 c (FICTIONAL)",
      c100: "100 c (FICTIONAL)",
      c1000: "1,000 c (FICTIONAL)",
      c100000: "100,000 c (FICTIONAL)",
    },
    kind: {
      probe: "A speed that real spacecraft have reached.",
      fast: "Far faster than any real spacecraft. Physics does not forbid it, but nobody can build it today.",
      limit: "1 c is the speed of light. Only light itself travels at it; a ship with mass cannot reach it. Treated as fictional.",
      fiction: "FICTIONAL: nothing can go faster than light, as far as we know today. Shown only to feel the distances.",
    },
    note: "The ship flies a straight line and aims at where the target will be on arrival (intercept course, marked by the ring). Gravity is ignored. The planets are on their real positions of today. The line is curved on the map because the map is compressed. The trip is shown like a film: the start is in view, the ship turns towards the target, jumps into hyperspace and comes out of it at the target. The turn and the hyperspace are fiction (there is no hyperspace as far as we know), the times shown are for the speed chosen. Start and target can also be the Sun or any star of the list. Between stars the ship flies a straight line in real space, the stars are treated as standing still (they move slowly) and a planet counts as the Sun, because planets are tiny against light years.",
    view: "View",
    viewThird: "Third person (ship seen from outside)",
    viewEgo: "First person (from the ship)",
    phase: {
      intro: "Departure: the start is in view.",
      turn: "The ship turns towards the target.",
      jump: "Jump into hyperspace (FICTIONAL).",
      exit: "Out of hyperspace at the target.",
    },
    infoEmpty: "Choose a planet (click it in the picture or use the lists on the left) and its story appears here.",
    settings: "Settings",
    zoneOn: "Candidate zone: on",
    zoneOff: "Candidate zone: off",
    close: "Close",
    unknown: "Unknown place. Type a planet, the Sun or a star name from the list.",
    useMeasure: "Plan a trip between them",
    resultStars: (d) =>
      `${d.from} to ${d.to}\nDistance: ${d.ly} light years (${d.pc} parsecs)\nTravel time: ${d.time}\nOn board: ${d.board}`,
    sun: "Sun",
    result: (d) =>
      `${d.from} to ${d.to}\nDistance: ${d.au} AU (${d.light} of light travel)\nTravel time: ${d.time}\nOn board: ${d.board}`,
    boardLight: "none, light does not age (and a ship with mass cannot go this fast)",
    boardFiction: "not defined, this speed is fictional",
    gamma: (g) => `(time dilation, factor ${g})`,
    live: (d) => `${d.percent} % of the way. Time passed: ${d.time}. On board: ${d.board}`,
    arrived: "Arrived.",
    same: "Choose two different planets.",
    none: "No course found.",
    setSpeed: "Time speed was set so that the trip takes about 20 seconds. Change it with the time slider; at the end it returns to your setting. The ship speeds up and slows down softly (the first and last tenth of the time), and at the end the target is shown.",
    fictionTag: "(FICTIONAL)",
    flyTitle: "Flight speed (keys)",
    flyAuto: "Auto (follows the distance)",
    flyStep: (c) => `${c} c`,
    flyFiction: "FICTIONAL: faster than light is impossible as far as we know today.",
    flyNote: "The speed is true to the real distance near the camera. The map is compressed, so on the screen the same speed looks different in different places.",
    spectralMode: { off: "Spectral class: off", highlight: "Spectral class: highlight", isolate: "Spectral class: isolate" },
    spectralNote: (cls, lo, hi, hosts, planets, unknown) =>
      `Class ${cls} (${lo}). ${hosts} host stars with ${planets} planets. Class from the star temperature; ${unknown} stars have none and count as no class.`,
    spectralRange: (min, max) => (max === Infinity ? `above ${min} K` : min === 0 ? `below ${max} K` : `${min} to ${max} K`),
    measure: "Measure distance",
    measureStop: "Stop measuring",
    measureHint: "Click a first star.",
    measureSecond: (a) => `${a}: click a second star.`,
    measureResult: (d) =>
      `${d.a} to ${d.b}: ${d.ly} light years (${d.pc} parsecs). Light needs ${d.ly} years. Straight line in real space, drawn curved because the map is compressed. The catalogue distances have measurement errors.`,
  },
  de: {
    title: "Reiseplaner",
    from: "Von",
    to: "Nach",
    speed: "Tempo",
    go: "Planen und fliegen",
    stop: "Stopp",
    speedLabel: {
      voyager: "Voyager 1 (17 km/s)",
      parker: "Parker Solar Probe (etwa 190 km/s)",
      c01: "0,1 c",
      c09: "0,9 c",
      c1: "1 c (Lichtgeschwindigkeit)",
      c10: "10 c (FIKTIV)",
      c100: "100 c (FIKTIV)",
      c1000: "1.000 c (FIKTIV)",
      c100000: "100.000 c (FIKTIV)",
    },
    kind: {
      probe: "Ein Tempo, das echte Raumsonden erreicht haben.",
      fast: "Viel schneller als jede echte Raumsonde. Die Physik verbietet es nicht, aber heute kann es niemand bauen.",
      limit: "1 c ist die Lichtgeschwindigkeit. Nur Licht selbst fliegt so schnell, ein Schiff mit Masse kann sie nicht erreichen. Gilt hier als fiktiv.",
      fiction: "FIKTIV: Nach heutigem Wissen kann nichts schneller als das Licht sein. Nur gezeigt, um die Entfernungen zu spüren.",
    },
    note: "Das Schiff fliegt eine gerade Linie und zielt dorthin, wo das Ziel bei der Ankunft stehen wird (Abfangbahn, vom Ring markiert). Schwerkraft wird nicht gerechnet. Die Planeten stehen auf ihren echten Positionen von heute. Die Linie ist auf der Karte gebogen, weil die Karte gestaucht ist. Die Reise wird wie ein Film gezeigt: der Start ist im Blick, das Schiff dreht sich zum Ziel, springt in den Hyperraum und kommt am Ziel wieder heraus. Die Drehung und der Hyperraum sind erfunden (einen Hyperraum gibt es nach heutigem Wissen nicht), die Zeiten gelten für das gewählte Tempo. Start und Ziel können auch die Sonne oder ein Stern der Liste sein. Zwischen Sternen fliegt das Schiff eine gerade Linie im echten Raum, die Sterne gelten als ruhend (sie bewegen sich langsam) und ein Planet zählt als die Sonne, weil Planeten gegen Lichtjahre winzig sind.",
    view: "Ansicht",
    viewThird: "Dritte Person (Schiff von außen)",
    viewEgo: "Ego (aus dem Schiff)",
    phase: {
      intro: "Abflug: der Start ist im Blick.",
      turn: "Das Schiff dreht sich zum Ziel.",
      jump: "Sprung in den Hyperraum (FIKTIV).",
      exit: "Aus dem Hyperraum am Ziel.",
    },
    infoEmpty: "Wähle einen Planeten (im Bild anklicken oder in den Listen links), dann erscheint hier seine Geschichte.",
    settings: "Einstellungen",
    zoneOn: "Kandidatenzone: an",
    zoneOff: "Kandidatenzone: aus",
    close: "Schließen",
    unknown: "Unbekannter Ort. Tippe einen Planeten, die Sonne oder einen Sternnamen aus der Liste.",
    useMeasure: "Reise zwischen ihnen planen",
    resultStars: (d) =>
      `${d.from} nach ${d.to}\nEntfernung: ${d.ly} Lichtjahre (${d.pc} Parsec)\nReisezeit: ${d.time}\nAn Bord: ${d.board}`,
    sun: "Sonne",
    result: (d) =>
      `${d.from} nach ${d.to}\nEntfernung: ${d.au} AE (${d.light} Lichtlaufzeit)\nReisezeit: ${d.time}\nAn Bord: ${d.board}`,
    boardLight: "keine, Licht altert nicht (und ein Schiff mit Masse kann nicht so schnell sein)",
    boardFiction: "nicht definiert, dieses Tempo ist fiktiv",
    gamma: (g) => `(Zeitdehnung, Faktor ${g})`,
    live: (d) => `${d.percent} % des Weges. Vergangene Zeit: ${d.time}. An Bord: ${d.board}`,
    arrived: "Angekommen.",
    same: "Wähle zwei verschiedene Planeten.",
    none: "Keine Bahn gefunden.",
    setSpeed: "Die Zeitgeschwindigkeit wurde so gesetzt, dass die Reise etwa 20 Sekunden dauert. Mit dem Zeitregler änderst du sie, am Ende kehrt sie zu deiner Einstellung zurück. Das Schiff beschleunigt und bremst sanft (im ersten und letzten Zehntel der Zeit), am Ende siehst du das Ziel.",
    fictionTag: "(FIKTIV)",
    flyTitle: "Flugtempo (Tasten)",
    flyAuto: "Auto (folgt dem Abstand)",
    flyStep: (c) => `${c} c`,
    flyFiction: "FIKTIV: Schneller als das Licht ist nach heutigem Wissen unmöglich.",
    flyNote: "Das Tempo stimmt mit der echten Entfernung nahe der Kamera. Die Karte ist gestaucht, deshalb sieht dasselbe Tempo auf dem Bildschirm an verschiedenen Orten anders aus.",
    spectralMode: { off: "Spektralklasse: aus", highlight: "Spektralklasse: hervorheben", isolate: "Spektralklasse: isolieren" },
    spectralNote: (cls, lo, hi, hosts, planets, unknown) =>
      `Klasse ${cls} (${lo}). ${hosts} Wirtssterne mit ${planets} Planeten. Die Klasse kommt aus der Sterntemperatur; ${unknown} Sterne haben keine und zählen als ohne Klasse.`,
    spectralRange: (min, max) => (max === Infinity ? `über ${min} K` : min === 0 ? `unter ${max} K` : `${min} bis ${max} K`),
    measure: "Entfernung messen",
    measureStop: "Messen beenden",
    measureHint: "Klicke einen ersten Stern an.",
    measureSecond: (a) => `${a}: klicke einen zweiten Stern an.`,
    measureResult: (d) =>
      `${d.a} nach ${d.b}: ${d.ly} Lichtjahre (${d.pc} Parsec). Das Licht braucht ${d.ly} Jahre. Gerade Linie im echten Raum, auf der Karte gebogen, weil sie gestaucht ist. Die Katalogabstände haben Messfehler.`,
  },
};
