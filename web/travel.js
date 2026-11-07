// Travel planner (stage 1: planet to planet in the Solar System), flight speeds in multiples of c, spectral
// classes and the texts for them. The maths here is plain and has no three.js in it, so it can be read and
// checked on its own. main.js draws the result.
import { TRAVEL_EXTRA } from "./i18n-extra.js";

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
    go: "Fly",
    route: "Show the route",
    routeHide: "Hide the route",
    routeNote:
      "The course is on the map, nothing flies. Fly it yourself: W and S forward and back, A and D sideways, "
      + "Q and E down and up, the arrow keys turn. The speed follows the distance, Shift is faster.",
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
    noteTitle: "How the trip is worked out",
    // Four short lines instead of one block: the box is folded away and is read when somebody wants to know,
    // not before every flight.
    note: [
      "Course: a straight line, aimed at the place where the target will be on arrival. The ring marks it. Gravity is left out, the planets stand where they really stand today.",
      "The line looks bent because the map squeezes distances. Between stars the ship flies straight through real space; the stars count as standing still and a planet counts as its star, because planets are tiny against light years.",
      "The trip runs as a short film: the start is in view, the ship turns, jumps into hyperspace and comes out at the target, which is in sight long before and grows during the approach.",
      "Invented: the turn and the hyperspace. Real: the distance, and the travel time for the speed chosen.",
    ],
    view: "View",
    viewThird: "Third person (ship seen from outside)",
    viewEgo: "First person (from the ship)",
    phase: {
      intro: "Departure: the start is in view.",
      depart: "The ship leaves the start system.",
      turn: "The ship turns towards the target.",
      jump: "Jump into hyperspace (FICTIONAL).",
      exit: "Out of hyperspace at the edge of the target system.",
    },
    infoEmpty: "Choose a planet (click it in the picture or use the lists on the left) and its story appears here.",
    realOff: "Trips to stars use the explanation mode: the scale was switched back.",
    tools: "Tools",
    swap: "Swap start and target",
    pick: "Pick",
    pickTitle: "Choose on the map",
    pickHint: "Click a star or a planet on the map.",
    cancel: "Cancel",
    orbitUnknown: "The orbit of this planet is not known. Its place next to the star is only for the picture, it has no orbit line and does not move.",
    settings: "Settings",
    zoneOn: "Candidate zone: on",
    zoneOff: "Candidate zone: off",
    close: "Close",
    captionsOn: "Flight captions: on",
    captionsOff: "Flight captions: off",
    unknown: "Unknown place. Type a planet, the Sun or a star name from the list.",
    useMeasure: "Plan a trip between them",
    sun: "Sun",
    between: (a, b) => `${a} to ${b}`,
    distance: "Distance",
    travelTime: "Travel time",
    boardLabel: "On board",
    lightYears: (n) => `${n} light years`,
    parsec: (n) => `${n} parsecs`,
    au: (n) => `${n} AU`,
    lightTravel: (d) => `${d} of light travel`,
    gamma: (g) => `(time dilation, factor ${g})`,
    live: (d) => `${d.percent} % of the way. Time passed: ${d.time}. On board: ${d.board}`,
    arrived: "Arrived.",
    same: "Choose two different planets.",
    none: "No course found.",
    fictionTag: "(FICTIONAL)",
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
    go: "Fliegen",
    route: "Route zeigen",
    routeHide: "Route ausblenden",
    routeNote:
      "Die Route liegt auf der Karte, es fliegt nichts. Flieg sie selbst: W und S vor und zurück, A und D zur "
      + "Seite, Q und E runter und hoch, die Pfeiltasten drehen. Das Tempo richtet sich nach dem Abstand, Shift ist schneller.",
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
    noteTitle: "Wie die Reise gerechnet wird",
    note: [
      "Kurs: eine gerade Linie, gezielt auf die Stelle, wo das Ziel bei der Ankunft steht. Der Ring markiert sie. Schwerkraft bleibt außen vor, die Planeten stehen dort, wo sie heute wirklich stehen.",
      "Die Linie wirkt gebogen, weil die Karte Entfernungen staucht. Zwischen Sternen fliegt das Schiff gerade durch den echten Raum, die Sterne gelten als ruhend und ein Planet zählt als sein Stern, weil Planeten gegen Lichtjahre winzig sind.",
      "Die Reise läuft als kurzer Film: Start im Blick, Drehung, Sprung in den Hyperraum, Ankunft am Ziel, das lange vorher zu sehen ist und beim Anflug wächst.",
      "Erfunden: die Drehung und der Hyperraum. Echt: die Entfernung und die Reisezeit für das gewählte Tempo.",
    ],
    view: "Ansicht",
    viewThird: "Dritte Person (Schiff von außen)",
    viewEgo: "Ego (aus dem Schiff)",
    phase: {
      intro: "Abflug: der Start ist im Blick.",
      depart: "Das Schiff verlässt das Startsystem.",
      turn: "Das Schiff dreht sich zum Ziel.",
      jump: "Sprung in den Hyperraum (FIKTIV).",
      exit: "Aus dem Hyperraum am Rand des Zielsystems.",
    },
    infoEmpty: "Wähle einen Planeten (im Bild anklicken oder in den Listen links), dann erscheint hier seine Geschichte.",
    realOff: "Reisen zu Sternen nutzen den Erklärmodus: die Skala wurde zurückgeschaltet.",
    tools: "Werkzeuge",
    swap: "Start und Ziel tauschen",
    pick: "Wählen",
    pickTitle: "Auf der Karte wählen",
    pickHint: "Klicke einen Stern oder Planeten auf der Karte an.",
    cancel: "Abbrechen",
    orbitUnknown: "Die Bahn dieses Planeten ist nicht bekannt. Sein Platz neben dem Stern ist nur zur Darstellung, er hat keine Bahnlinie und bewegt sich nicht.",
    settings: "Einstellungen",
    zoneOn: "Kandidatenzone: an",
    zoneOff: "Kandidatenzone: aus",
    close: "Schließen",
    captionsOn: "Flugtexte: an",
    captionsOff: "Flugtexte: aus",
    unknown: "Unbekannter Ort. Tippe einen Planeten, die Sonne oder einen Sternnamen aus der Liste.",
    useMeasure: "Reise zwischen ihnen planen",
    sun: "Sonne",
    between: (a, b) => `${a} nach ${b}`,
    distance: "Entfernung",
    travelTime: "Reisezeit",
    boardLabel: "An Bord",
    lightYears: (n) => `${n} Lichtjahre`,
    parsec: (n) => `${n} Parsec`,
    au: (n) => `${n} AE`,
    lightTravel: (d) => `${d} Lichtlaufzeit`,
    gamma: (g) => `(Zeitdehnung, Faktor ${g})`,
    live: (d) => `${d.percent} % des Weges. Vergangene Zeit: ${d.time}. An Bord: ${d.board}`,
    arrived: "Angekommen.",
    same: "Wähle zwei verschiedene Planeten.",
    none: "Keine Bahn gefunden.",
    fictionTag: "(FIKTIV)",
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
// Japanese and Bulgarian: what is not translated shows in English (see i18n-extra.js).
for (const l of Object.keys(TRAVEL_EXTRA)) TRAVEL_UI[l] = { ...TRAVEL_UI.en, ...TRAVEL_EXTRA[l] };
