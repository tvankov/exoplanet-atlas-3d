// Builds the short factual story for a planet from the NASA data, in English or German.
// Every number comes from the table, the only hand-written facts are the textbook
// explanations of the discovery methods. Anything unknown is left out instead of guessed.

export const UI = {
  en: {
    speech: "en-US",
    hint: "Drag to rotate, scroll to zoom, right drag to pan",
    scaleCompressed: "Scale: compressed",
    scaleLinear: "Scale: linear",
    loading: "Loading stars...",
    count: (stars, planets) => `${stars} host stars, ${planets} planets`,
    candidates: (n) => `Habitable candidates (${n} + Earth)`,
    earth: "Earth (reference)",
    listen: "Listen",
    stop: "Stop",
    closeup: "Close-up",
    back: "System view",
    zone: (min, max) => `Candidate zone: equilibrium temperature ${min} to ${max} K (estimate)`,
    beltNote:
      "Asteroid belt: schematic. The points are placed at random. Real are its extent, the tilt of the orbits, the gaps Jupiter has cleared and the distances of five known asteroid families.",
    types: {
      rocky: "Rocky planet",
      miniNeptune: "Mini-Neptune",
      neptune: "Neptune-like planet",
      gasGiant: "Gas giant",
      unknown: "Type unknown",
    },
    typeLine: (name) => `Type: ${name}, derived from its radius.`,
    schematic:
      "Schematic picture: colour and surface follow radius and temperature. What the surface really looks like is unknown.",
    artistic:
      "Artistic picture: colours, patterns and clouds are invented, none of it is measured. Only the temperature decides which kind of world is drawn, molten, temperate or frozen.",
    look: { schematic: "Schematic", artistic: "Artistic" },
    lookLabel: "Exoplanet look",
  },
  de: {
    speech: "de-DE",
    hint: "Ziehen zum Drehen, Scrollen zum Zoomen, rechts ziehen zum Verschieben",
    scaleCompressed: "Skala: gestaucht",
    scaleLinear: "Skala: linear",
    loading: "Sterne werden geladen...",
    count: (stars, planets) => `${stars} Muttersterne, ${planets} Planeten`,
    candidates: (n) => `Bewohnbare Kandidaten (${n} + Erde)`,
    earth: "Erde (Referenz)",
    listen: "Vorlesen",
    stop: "Stopp",
    closeup: "Nahansicht",
    back: "Systemansicht",
    zone: (min, max) => `Kandidatenzone: Gleichgewichtstemperatur ${min} bis ${max} K (Schätzung)`,
    beltNote:
      "Asteroidengürtel: schematisch. Die Punkte liegen zufällig. Echt sind seine Ausdehnung, die Neigung der Bahnen, die Lücken, die Jupiter freigeräumt hat, und die Abstände von fünf bekannten Asteroidenfamilien.",
    types: {
      rocky: "Gesteinsplanet",
      miniNeptune: "Mini-Neptun",
      neptune: "Neptunartiger Planet",
      gasGiant: "Gasriese",
      unknown: "Typ unbekannt",
    },
    typeLine: (name) => `Typ: ${name}, abgeleitet aus dem Radius.`,
    schematic:
      "Schematische Darstellung: Farbe und Oberfläche folgen Radius und Temperatur. Wie die Oberfläche wirklich aussieht, ist unbekannt.",
    artistic:
      "Künstlerische Darstellung: Farben, Muster und Wolken sind erfunden, nichts davon ist gemessen. Nur die Temperatur bestimmt, welche Art von Welt gezeichnet wird, glühend, gemäßigt oder vereist.",
    look: { schematic: "Schematisch", artistic: "Künstlerisch" },
    lookLabel: "Aussehen der Exoplaneten",
  },
};

// Planet type from the radius alone, the usual rough classes in astronomy. The 1.6 limit is
// the same one the candidate rule uses, so every candidate comes out as rocky.
export const PLANET_TYPES = ["rocky", "miniNeptune", "neptune", "gasGiant"];
export function planetType(radiusEarth) {
  if (radiusEarth == null) return "unknown";
  if (radiusEarth <= 1.6) return "rocky";
  if (radiusEarth <= 4) return "miniNeptune";
  if (radiusEarth <= 10) return "neptune";
  return "gasGiant";
}

// The audio clip of a planet is named after it. The web app and the audio script share this rule.
export const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Numbers follow the language, so German gets a decimal comma. Grouping is off because
// "2900" reads better than "2.900" next to a Kelvin value.
function num(lang, value, digits) {
  const options =
    digits == null
      ? { maximumFractionDigits: 3, useGrouping: false }
      : { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false };
  return value.toLocaleString(lang === "de" ? "de-DE" : "en-US", options);
}

const TEXT = {
  en: {
    earth: [
      "Earth is our reference point on this map. It is the only planet where we know that life exists.",
      "It orbits the Sun at an average distance of one astronomical unit, about 150 million kilometres. Light from the Sun needs a little over eight minutes to reach it.",
      "One year on Earth lasts about 365 days. Without any atmosphere, sunlight alone would warm Earth to an equilibrium temperature of about 255 Kelvin, which is minus 18 degrees Celsius. Thanks to its atmosphere, the real average surface temperature is around 15 degrees Celsius.",
      "That difference is the reason the habitable candidates in this list should be read with care: their temperatures are calculated the same way, from starlight alone.",
    ],
    methods: {
      Transit:
        "with the transit method: a telescope watches a star and sees its light dip slightly and regularly when the planet passes in front of it.",
      "Radial Velocity":
        "with the radial velocity method: the pull of a planet makes its star wobble a little, which shows up as a tiny shift in the star's light.",
      Imaging: "by direct imaging: a telescope took a picture of the planet itself.",
      Microlensing: "by microlensing: the gravity of the planet briefly magnified the light of a more distant star.",
      "Transit Timing Variations":
        "from small changes in the timing of transits, caused by the pull of other planets in the system.",
    },
    otherMethod: (m) => `with the ${m} method.`,
    // A rough label from the surface temperature. Large stars are left out because
    // temperature alone does not describe a giant.
    starClass: ["a star", "a red dwarf", "an orange dwarf", "a yellow star similar to the Sun", "a hot, bright star"],
    year: (n, days) =>
      days > 730 ? `${n(days / 365.25, 1)} Earth years` : `${n(days, days < 100 ? 1 : 0)} Earth days`,
    intro: (name, host, dist) =>
      `${name} is a candidate for a habitable world, ${dist} light years from the Sun. The light that reaches us from ${host} today left the star about ${dist} years ago.`,
    // Planets that are not on the candidate list get a plain introduction and their own closing line.
    introPlain: (name, host, dist) =>
      `${name} is a planet ${dist} light years from the Sun. The light that reaches us from ${host} today left the star about ${dist} years ago.`,
    caveatPlain:
      "It is not on the candidate list: its size and temperature do not fit the simple rule for worlds that could hold liquid water, or one of the two values is unknown.",
    discovered: (year, how) => `It was discovered in ${year}, ${how}`,
    star: (host, cls, teff, rad) =>
      `Its star, ${host}, is ${cls}${teff ? ` with a surface temperature of about ${teff} Kelvin` : ""}${rad ? ` and ${rad} times the radius of the Sun` : ""}.`,
    radius: (r) => `a radius of ${r} times that of Earth`,
    // Radial velocity only gives a lower limit for the mass, because the tilt of the orbit is unknown.
    mass: (m, atLeast) => `a mass of ${atLeast ? "at least" : "about"} ${m} Earth masses`,
    yearFact: (y) => `a year that lasts ${y}`,
    has: (list) => `The planet has ${list}.`,
    and: " and ",
    temp: (k, c) =>
      `Its equilibrium temperature is ${k} Kelvin, or ${c} degrees Celsius. That value is calculated from starlight alone and ignores any atmosphere, so the real surface could be warmer or colder.`,
    others: (n, list) =>
      `There ${n === 1 ? "is" : "are"} ${n} other known planet${n === 1 ? "" : "s"} in this system: ${list}.`,
    alone: "It is the only planet known in this system so far.",
    caveat:
      "It is on this list because its size and temperature fit a simple rule for worlds that could hold liquid water. Whether it has water, an atmosphere or life is unknown.",
  },
  de: {
    earth: [
      "Die Erde ist der Bezugspunkt dieser Karte. Sie ist der einzige Planet, von dem wir wissen, dass es dort Leben gibt.",
      "Sie umkreist die Sonne im Mittel in einer astronomischen Einheit Abstand, das sind rund 150 Millionen Kilometer. Das Licht der Sonne braucht gut acht Minuten bis zur Erde.",
      "Ein Jahr auf der Erde dauert etwa 365 Tage. Ohne Atmosphäre würde allein das Sonnenlicht die Erde auf eine Gleichgewichtstemperatur von etwa 255 Kelvin erwärmen, das sind minus 18 Grad Celsius. Dank der Atmosphäre liegt die echte mittlere Oberflächentemperatur bei etwa 15 Grad Celsius.",
      "Dieser Unterschied ist der Grund, warum man die Kandidaten in dieser Liste mit Vorsicht lesen sollte: Ihre Temperaturen sind auf dieselbe Weise nur aus dem Sternlicht berechnet.",
    ],
    methods: {
      Transit:
        "mit der Transitmethode: Ein Teleskop beobachtet einen Stern und sieht, wie sein Licht regelmäßig leicht abnimmt, wenn der Planet vor ihm vorbeizieht.",
      "Radial Velocity":
        "mit der Radialgeschwindigkeitsmethode: Die Anziehung eines Planeten bringt seinen Stern leicht zum Wackeln, was sich als winzige Verschiebung im Licht des Sterns zeigt.",
      Imaging: "durch direkte Aufnahme: Ein Teleskop hat den Planeten selbst fotografiert.",
      Microlensing:
        "durch den Mikrolinseneffekt: Die Schwerkraft des Planeten hat das Licht eines weiter entfernten Sterns kurz verstärkt.",
      "Transit Timing Variations":
        "aus kleinen Abweichungen im Zeitpunkt der Transits, verursacht durch die Anziehung anderer Planeten im System.",
    },
    otherMethod: (m) => `mit der Methode ${m}.`,
    starClass: ["ein Stern", "ein roter Zwerg", "ein oranger Zwerg", "ein gelber Stern ähnlich der Sonne", "ein heißer, heller Stern"],
    year: (n, days) =>
      days > 730 ? `${n(days / 365.25, 1)} Erdjahre` : `${n(days, days < 100 ? 1 : 0)} Erdtage`,
    intro: (name, host, dist) =>
      `${name} ist ein Kandidat für eine bewohnbare Welt, ${dist} Lichtjahre von der Sonne entfernt. Das Licht, das heute von ${host} bei uns ankommt, hat den Stern vor etwa ${dist} Jahren verlassen.`,
    introPlain: (name, host, dist) =>
      `${name} ist ein Planet, ${dist} Lichtjahre von der Sonne entfernt. Das Licht, das heute von ${host} bei uns ankommt, hat den Stern vor etwa ${dist} Jahren verlassen.`,
    caveatPlain:
      "Er steht nicht auf der Kandidatenliste: Größe und Temperatur passen nicht zu der einfachen Regel für Welten, die flüssiges Wasser halten könnten, oder einer der beiden Werte ist unbekannt.",
    discovered: (year, how) => `Der Planet wurde ${year} entdeckt, ${how}`,
    star: (host, cls, teff, rad) =>
      `Sein Stern ${host} ist ${cls}${teff ? ` mit einer Oberflächentemperatur von etwa ${teff} Kelvin` : ""}${rad ? ` und dem ${rad}-fachen Radius der Sonne` : ""}.`,
    radius: (r) => `einen Radius vom ${r}-Fachen des Erdradius`,
    mass: (m, atLeast) => `eine Masse von ${atLeast ? "mindestens" : "etwa"} ${m} Erdmassen`,
    yearFact: (y) => `ein Jahr, das ${y} dauert`,
    has: (list) => `Der Planet hat ${list}.`,
    and: " und ",
    temp: (k, c) =>
      `Seine Gleichgewichtstemperatur beträgt ${k} Kelvin, das sind ${c} Grad Celsius. Dieser Wert ist nur aus dem Sternlicht berechnet und ignoriert jede Atmosphäre, die echte Oberfläche kann also wärmer oder kälter sein.`,
    others: (n, list) =>
      n === 1
        ? `Es gibt einen weiteren bekannten Planeten in diesem System: ${list}.`
        : `Es gibt ${n} weitere bekannte Planeten in diesem System: ${list}.`,
    alone: "Es ist bisher der einzige bekannte Planet in diesem System.",
    caveat:
      "Er steht auf dieser Liste, weil Größe und Temperatur zu einer einfachen Regel für Welten passen, die flüssiges Wasser halten könnten. Ob es dort Wasser, eine Atmosphäre oder Leben gibt, ist unbekannt.",
  },
};

function classIndex(star) {
  if (star.st_teff == null || (star.st_rad != null && star.st_rad > 3)) return 0;
  if (star.st_teff < 3900) return 1;
  if (star.st_teff < 5300) return 2;
  if (star.st_teff < 6000) return 3;
  return 4;
}

export function buildStory(star, planet, lang) {
  const t = TEXT[lang];
  // The other planets of our own system have no story yet, only their name is shown.
  if (planet.solarOther) return { title: planet.pl_name, paragraphs: [] };
  if (star.solarSystem) return { title: UI[lang].earth.replace(/ \(.*\)/, ""), paragraphs: t.earth };

  const n = (value, digits) => num(lang, value, digits);
  const paragraphs = [];

  // The candidate texts are the ones that were recorded as audio, they must stay as they are.
  const intro = planet.habitable ? t.intro : t.introPlain;
  paragraphs.push(intro(planet.pl_name, star.hostname, n(star.dist_ly, 1)));

  const how = t.methods[planet.discoverymethod] ?? t.otherMethod(planet.discoverymethod);
  paragraphs.push(t.discovered(planet.disc_year, how));

  paragraphs.push(
    t.star(
      star.hostname,
      t.starClass[classIndex(star)],
      star.st_teff != null ? n(Math.round(star.st_teff)) : null,
      star.st_rad != null ? n(star.st_rad, 2) : null
    )
  );

  const facts = [];
  if (planet.pl_rade != null) facts.push(t.radius(n(planet.pl_rade)));
  if (planet.pl_bmasse != null) facts.push(t.mass(n(planet.pl_bmasse, 2), planet.discoverymethod === "Radial Velocity"));
  if (planet.pl_orbper != null) facts.push(t.yearFact(t.year(n, planet.pl_orbper)));
  if (facts.length) {
    const list = facts.length > 1 ? `${facts.slice(0, -1).join(", ")}${t.and}${facts.at(-1)}` : facts[0];
    paragraphs.push(t.has(list));
  }

  if (planet.pl_eqt != null) {
    paragraphs.push(t.temp(n(Math.round(planet.pl_eqt)), n(Math.round(planet.pl_eqt - 273.15))));
  }

  const others = star.planets.filter((p) => p.pl_name !== planet.pl_name).map((p) => p.pl_name);
  paragraphs.push(others.length ? t.others(others.length, others.join(", ")) : t.alone);

  paragraphs.push(planet.habitable ? t.caveat : t.caveatPlain);

  return { title: planet.pl_name, paragraphs };
}
