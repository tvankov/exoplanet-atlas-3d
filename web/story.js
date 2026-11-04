// Builds the short factual story for a planet from the NASA data, in English or German.
// Every number comes from the table, the only hand-written facts are the textbook
// explanations of the discovery methods. Anything unknown is left out instead of guessed.

export const UI = {
  en: {
    speech: "en-US",
    hint: "Drag to rotate, scroll to zoom, right drag to pan. Keyboard: W A S D fly, Q and E down and up, arrow keys look around, Shift is faster",
    scaleCompressed: "Real scale: off",
    scaleLinear: "Real scale: on",
    loading: "Loading stars...",
    // Everything the atlas holds in one number: the host stars, the Gaia stars and the planets. It says what is
    // counted and claims nothing else, so there is nothing in the line to argue with.
    count: (objects) => `${objects} stars and planets`,
    candidates: (n) => `Habitable candidates (${n} + Earth)`,
    earth: "Earth (reference)",
    solarTitle: "Solar System",
    starsTitle: "Named stars",
    facilityAll: "Discovered by: anyone",
    facilityNote: (planets, hosts) => `${planets} planets around ${hosts} stars. The other stars are dimmed.`,
    legalLink: "Imprint, privacy, licences",
    searchPlaceholder: "Search a star or planet",
    noResults: "Nothing found",
    flyTo: "Fly to",
    lightYears: "ly",
    visitorsTitle: "Spacecraft, comets, visitors",
    visitorKinds: { spacecraft: "Spacecraft", comet: "Comet", interstellar: "Interstellar object" },
    creditsTitle: "Credits",
    backgroundOn: "Background: on",
    backgroundOff: "Background: off",
    deepOff: "Deep stars: off",
    deepOn: "Deep stars: on",
    deepLoading: "Deep stars: loading ...",
    deepFailed: "Deep stars: could not be loaded",
    deepNote: (n) => `${n} bright stars from ESA Gaia, up to 16,000 light years away, at their real positions. Credit: ESA/Gaia/DPAC.`,
    gaiaOff: "Gaia stars: off",
    gaiaOn: "Gaia stars: on",
    gaiaLoading: "Gaia stars: loading...",
    gaiaFailed: "Gaia stars: could not be loaded",
    gaiaNote: (n) =>
      `${n} nearby stars (closer than 326 light years) from ESA Gaia, at their real positions, without the hosts of the planets already on the map. Colours are estimated. Credit: ESA/Gaia/DPAC.`,
    hintsTitle: "Hints",
    earthShort: "Earth",
    viewPlanet: "Planet",
    viewSun: "Sun",
    viewStar: "Star",
    viewSystem: "System",
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
    typeLineCalc: (name) => `Type: ${name}, derived from a radius that is only worked out from its mass.`,
    schematic:
      "Schematic picture: colour and surface follow radius and temperature. What the surface really looks like is unknown.",
    artistic:
      "Artistic picture: colours, patterns and clouds are invented, none of it is measured. Only the temperature decides which kind of world is drawn, molten, temperate or frozen.",
    look: { schematic: "Schematic", artistic: "Artistic" },
    lookLabel: "Exoplanet look",
    mercuryNote:
      "Enhanced colours: the map puts the 1000, 750 and 430 nanometre filters of MESSENGER on red, green and blue. The colours show differences in the rock, not what the eye would see.",
    paintedNote:
      "Painted by the program, not a map. The colours and the bands follow what telescopes and probes show, the fine pattern is invented. The clouds of a planet like this keep changing.",
    speedTitle: "Time speed",
    realTime: "Real time",
    rate: (duration) => `1 second = ${duration}`,
    elapsed: (duration) => `Time passed: ${duration}`,
  },
  de: {
    speech: "de-DE",
    hint: "Ziehen zum Drehen, Scrollen zum Zoomen, rechts ziehen zum Verschieben. Tastatur: W A S D fliegen, Q und E runter und hoch, Pfeiltasten umschauen, Shift ist schneller",
    scaleCompressed: "Echter Maßstab: aus",
    scaleLinear: "Echter Maßstab: an",
    loading: "Sterne werden geladen...",
    count: (objects) => `${objects} Sterne und Planeten`,
    candidates: (n) => `Bewohnbare Kandidaten (${n} + Erde)`,
    earth: "Erde (Referenz)",
    solarTitle: "Sonnensystem",
    starsTitle: "Benannte Sterne",
    facilityAll: "Entdeckt von: allen",
    facilityNote: (planets, hosts) => `${planets} Planeten bei ${hosts} Sternen. Die übrigen Sterne sind abgedunkelt.`,
    legalLink: "Impressum, Datenschutz, Lizenzen",
    searchPlaceholder: "Stern oder Planet suchen",
    noResults: "Nichts gefunden",
    flyTo: "Hinfliegen",
    lightYears: "Lj",
    visitorsTitle: "Raumsonden, Kometen, Besucher",
    visitorKinds: { spacecraft: "Raumsonde", comet: "Komet", interstellar: "Interstellares Objekt" },
    creditsTitle: "Quellen und Lizenzen",
    backgroundOn: "Hintergrund: an",
    backgroundOff: "Hintergrund: aus",
    deepOff: "Tiefe Sterne: aus",
    deepOn: "Tiefe Sterne: an",
    deepLoading: "Tiefe Sterne: lädt ...",
    deepFailed: "Tiefe Sterne: konnten nicht geladen werden",
    deepNote: (n) => `${n} helle Sterne von ESA Gaia, bis zu 16.000 Lichtjahre entfernt, an ihren echten Positionen. Quelle: ESA/Gaia/DPAC.`,
    gaiaOff: "Gaia-Sterne: aus",
    gaiaOn: "Gaia-Sterne: an",
    gaiaLoading: "Gaia-Sterne: lädt ...",
    gaiaFailed: "Gaia-Sterne: konnten nicht geladen werden",
    gaiaNote: (n) =>
      `${n} nahe Sterne (näher als 326 Lichtjahre) von ESA Gaia an ihren echten Positionen, ohne die Wirtssterne der Planeten, die schon auf der Karte sind. Die Farben sind geschätzt. Quelle: ESA/Gaia/DPAC.`,
    hintsTitle: "Hinweise",
    earthShort: "Erde",
    viewPlanet: "Planet",
    viewSun: "Sonne",
    viewStar: "Stern",
    viewSystem: "System",
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
    typeLineCalc: (name) => `Typ: ${name}, abgeleitet aus einem Radius, der nur aus der Masse berechnet ist.`,
    schematic:
      "Schematische Darstellung: Farbe und Oberfläche folgen Radius und Temperatur. Wie die Oberfläche wirklich aussieht, ist unbekannt.",
    artistic:
      "Künstlerische Darstellung: Farben, Muster und Wolken sind erfunden, nichts davon ist gemessen. Nur die Temperatur bestimmt, welche Art von Welt gezeichnet wird, glühend, gemäßigt oder vereist.",
    look: { schematic: "Schematisch", artistic: "Künstlerisch" },
    lookLabel: "Aussehen der Exoplaneten",
    mercuryNote:
      "Verstärkte Farben: Die Karte legt die Filter von MESSENGER bei 1000, 750 und 430 Nanometern auf Rot, Grün und Blau. Die Farben zeigen Unterschiede im Gestein, nicht was das Auge sähe.",
    paintedNote:
      "Vom Programm gemalt, keine Karte. Die Farben und die Bänder folgen dem, was Teleskope und Sonden zeigen, das feine Muster ist erfunden. Die Wolken eines solchen Planeten ändern sich ständig.",
    speedTitle: "Zeitgeschwindigkeit",
    realTime: "Echtzeit",
    rate: (duration) => `1 Sekunde = ${duration}`,
    elapsed: (duration) => `Vergangene Zeit: ${duration}`,
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

// A length of time in words, for the speed display: "5 minutes", "3.2 days", "2 years".
const DURATION_UNITS = {
  en: [["second", "seconds"], ["minute", "minutes"], ["hour", "hours"], ["day", "days"], ["year", "years"]],
  de: [["Sekunde", "Sekunden"], ["Minute", "Minuten"], ["Stunde", "Stunden"], ["Tag", "Tage"], ["Jahr", "Jahre"]],
};
export function duration(seconds, lang) {
  const sizes = [1, 60, 3600, 86400, 365.25 * 86400];
  let i = sizes.length - 1;
  while (i > 0 && seconds < sizes[i]) i--;
  const value = seconds / sizes[i];
  const shown = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  const [one, many] = DURATION_UNITS[lang][i];
  return `${num(lang, shown, shown % 1 ? 1 : 0)} ${shown === 1 ? one : many}`;
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
    radiusCalc: (r) => `a radius of about ${r} times that of Earth, but nobody has measured it, it is worked out from the mass`,
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
    radiusCalc: (r) => `einen Radius vom etwa ${r}-Fachen des Erdradius, der aber nicht gemessen, sondern aus der Masse berechnet ist`,
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

// Stories for the other seven planets of our own system. The numbers (width, distance, orbit, day,
// temperature) are from the NASA Planetary Fact Sheet, the light travel times are worked out from the
// distances. The rest is well established history and science. Anything that can change (the number of
// moons, which spacecraft is working today) is left out or put in the past tense.
const SOURCE_EN = "The figures come from the NASA Planetary Fact Sheet.";
const SOURCE_DE = "Die Zahlen stammen aus dem Planetary Fact Sheet der NASA.";
const SOLAR_STORIES = {
  Mercury: {
    title: { en: "Mercury", de: "Merkur" },
    en: [
      "Mercury is the smallest planet in our Solar System and the closest to the Sun. It is only about 4,880 kilometres wide, a little more than a third of the width of Earth. Light from the Sun needs about three minutes to reach it.",
      "A year on Mercury lasts just 88 Earth days, but the planet turns slowly: one turn takes about 59 Earth days, and from one sunrise to the next 176 Earth days pass. A day on Mercury therefore lasts two Mercury years.",
      "Mercury has almost no atmosphere, so heat escapes quickly after sunset. The temperature climbs to about 430 degrees Celsius by day and drops to about minus 180 at night. Even so, ice has been found in craters at the poles that never see sunlight.",
      "It is very dense, second only to Earth, with a large core of iron. Long cliffs on its surface are a sign that it has shrunk as its inside cooled.",
      "Two spacecraft have studied it up close: Mariner 10 flew past three times in 1974 and 1975, and MESSENGER orbited the planet from 2011 to 2015 and mapped its whole surface.",
      SOURCE_EN,
    ],
    de: [
      "Merkur ist der kleinste Planet unseres Sonnensystems und der Sonne am nächsten. Er ist nur etwa 4.880 Kilometer breit, etwas mehr als ein Drittel so breit wie die Erde. Das Licht der Sonne braucht rund drei Minuten bis zu ihm.",
      "Ein Jahr auf Merkur dauert nur 88 Erdtage, aber der Planet dreht sich langsam: Eine Drehung dauert etwa 59 Erdtage, und von einem Sonnenaufgang bis zum nächsten vergehen 176 Erdtage. Ein Tag auf Merkur dauert also zwei Merkurjahre.",
      "Merkur hat fast keine Atmosphäre, die Wärme verschwindet deshalb nach Sonnenuntergang schnell. Am Tag steigt die Temperatur auf etwa 430 Grad Celsius, in der Nacht fällt sie auf etwa minus 180 Grad. Trotzdem hat man Eis in Kratern an den Polen gefunden, in die nie Sonnenlicht fällt.",
      "Er ist sehr dicht, nach der Erde der dichteste Planet, mit einem großen Kern aus Eisen. Lange Steilstufen auf seiner Oberfläche sind ein Zeichen dafür, dass er geschrumpft ist, als sein Inneres abkühlte.",
      "Zwei Raumsonden haben ihn aus der Nähe untersucht: Mariner 10 flog 1974 und 1975 dreimal vorbei, und MESSENGER umkreiste den Planeten von 2011 bis 2015 und kartierte seine gesamte Oberfläche.",
      SOURCE_DE,
    ],
  },
  Venus: {
    title: { en: "Venus", de: "Venus" },
    en: [
      "Venus is almost as big as Earth, 12,100 kilometres wide, and the second planet from the Sun. Sunlight needs about six minutes to get there.",
      "It is the hottest planet. The average temperature at the surface is about 464 degrees Celsius, hot enough to melt lead, because a thick atmosphere of carbon dioxide traps the heat. The air pressure on the ground is about 92 times that on Earth.",
      "Clouds of sulfuric acid cover the whole planet, so the ground cannot be seen from space in ordinary light. From above, Venus looks like a pale yellow ball.",
      "Compared with most planets, Venus turns backwards, and very slowly: one turn takes 243 Earth days, longer than its year of 225 days. The Sun rises in the west there.",
      "Probes have looked at the ground anyway: the Soviet Venera landers sent data from the surface in the 1970s and 1980s and lasted at most a little over two hours, and the spacecraft Magellan mapped almost the whole surface with radar between 1990 and 1994.",
      SOURCE_EN,
    ],
    de: [
      "Venus ist fast so groß wie die Erde, 12.100 Kilometer breit, und der zweite Planet von der Sonne. Das Sonnenlicht braucht etwa sechs Minuten bis dorthin.",
      "Sie ist der heißeste Planet. Die mittlere Temperatur an der Oberfläche beträgt etwa 464 Grad Celsius, heiß genug, um Blei zu schmelzen, weil eine dichte Atmosphäre aus Kohlendioxid die Wärme festhält. Der Luftdruck am Boden ist etwa 92 Mal so hoch wie auf der Erde.",
      "Wolken aus Schwefelsäure bedecken den ganzen Planeten, deshalb sieht man den Boden aus dem All im normalen Licht nicht. Von oben wirkt Venus wie eine blassgelbe Kugel.",
      "Im Vergleich zu den meisten Planeten dreht sich Venus rückwärts, und sehr langsam: Eine Drehung dauert 243 Erdtage, länger als ihr Jahr mit 225 Tagen. Die Sonne geht dort im Westen auf.",
      "Sonden haben den Boden trotzdem gesehen: Die sowjetischen Venera-Lander funkten in den 1970er und 1980er Jahren von der Oberfläche und hielten höchstens gut zwei Stunden durch, und die Sonde Magellan kartierte zwischen 1990 und 1994 fast die gesamte Oberfläche mit Radar.",
      SOURCE_DE,
    ],
  },
  Mars: {
    title: { en: "Mars", de: "Mars" },
    en: [
      "Mars is about half as wide as Earth, 6,800 kilometres, and the fourth planet from the Sun. Sunlight needs about 13 minutes to reach it.",
      "A day on Mars lasts about 24 hours and 37 minutes, almost like on Earth, and a year lasts 687 Earth days. Its axis is tilted by about 25 degrees, so it has seasons.",
      "The thin air is mostly carbon dioxide, and the pressure is about one hundredth of that on Earth. The average temperature is about minus 65 degrees Celsius. The red colour comes from iron oxide, which is rust, in the dust.",
      "Mars has the tallest known volcano in the Solar System, Olympus Mons, about 22 kilometres high, and a canyon system, Valles Marineris, about 4,000 kilometres long. Dry river valleys show that liquid water once flowed there.",
      "Two small moons, Phobos and Deimos, orbit Mars. Many spacecraft have studied the planet. Viking 1 and 2 landed in 1976, and since 1997 rovers have driven across the surface: Sojourner, Spirit, Opportunity, Curiosity and Perseverance. In 2021 the helicopter Ingenuity made the first powered flight on another planet.",
      SOURCE_EN,
    ],
    de: [
      "Mars ist etwa halb so breit wie die Erde, 6.800 Kilometer, und der vierte Planet von der Sonne. Das Sonnenlicht braucht etwa 13 Minuten bis dorthin.",
      "Ein Tag auf dem Mars dauert etwa 24 Stunden und 37 Minuten, fast wie auf der Erde, und ein Jahr dauert 687 Erdtage. Seine Achse ist um etwa 25 Grad geneigt, deshalb gibt es dort Jahreszeiten.",
      "Die dünne Luft besteht hauptsächlich aus Kohlendioxid, und der Druck ist etwa ein Hundertstel so hoch wie auf der Erde. Die mittlere Temperatur liegt bei etwa minus 65 Grad Celsius. Die rote Farbe kommt von Eisenoxid, also Rost, im Staub.",
      "Auf dem Mars steht der höchste bekannte Vulkan des Sonnensystems, der Olympus Mons mit etwa 22 Kilometern Höhe, und ein Canyonsystem, die Valles Marineris, etwa 4.000 Kilometer lang. Trockene Flusstäler zeigen, dass dort früher flüssiges Wasser floss.",
      "Zwei kleine Monde, Phobos und Deimos, umkreisen den Mars. Viele Raumsonden haben den Planeten untersucht. Viking 1 und 2 landeten 1976, und seit 1997 sind Rover über die Oberfläche gefahren: Sojourner, Spirit, Opportunity, Curiosity und Perseverance. 2021 gelang dem Hubschrauber Ingenuity der erste Motorflug auf einem anderen Planeten.",
      SOURCE_DE,
    ],
  },
  Jupiter: {
    title: { en: "Jupiter", de: "Jupiter" },
    en: [
      "Jupiter is the biggest planet in the Solar System: about 143,000 kilometres wide, more than eleven times the width of Earth. It has more than 300 times the mass of Earth and about two and a half times the mass of all the other planets together.",
      "It is a gas giant without a solid surface, made mostly of hydrogen and helium. It orbits 5.2 times farther from the Sun than Earth does, sunlight needs about 43 minutes to get there, and one year lasts almost 12 Earth years.",
      "Despite its size, Jupiter turns faster than any other planet: a day lasts only about 10 hours. Fast winds pull its clouds apart into bright and dark bands.",
      "The Great Red Spot is a storm that has been watched for at least 150 years. It is about as wide as Earth, or a little wider, and it has been shrinking.",
      "Galileo Galilei discovered its four large moons in 1610: Io, Europa, Ganymede and Callisto. Ganymede is the largest moon in the Solar System, larger than the planet Mercury. The spacecraft Galileo studied Jupiter from orbit between 1995 and 2003, and the probe Juno began to orbit it in 2016.",
      SOURCE_EN,
    ],
    de: [
      "Jupiter ist der größte Planet des Sonnensystems: etwa 143.000 Kilometer breit, mehr als elfmal so breit wie die Erde. Er hat mehr als 300 Mal die Masse der Erde und etwa zweieinhalb Mal so viel Masse wie alle anderen Planeten zusammen.",
      "Er ist ein Gasriese ohne feste Oberfläche und besteht hauptsächlich aus Wasserstoff und Helium. Er umkreist die Sonne in 5,2 Mal so großem Abstand wie die Erde, das Sonnenlicht braucht etwa 43 Minuten bis dorthin, und ein Jahr dauert fast 12 Erdjahre.",
      "Trotz seiner Größe dreht sich Jupiter schneller als jeder andere Planet: Ein Tag dauert nur etwa 10 Stunden. Schnelle Winde ziehen seine Wolken zu hellen und dunklen Bändern auseinander.",
      "Der Große Rote Fleck ist ein Sturm, der seit mindestens 150 Jahren beobachtet wird. Er ist etwa so breit wie die Erde oder etwas breiter und wird kleiner.",
      "Galileo Galilei entdeckte 1610 die vier großen Monde: Io, Europa, Ganymed und Kallisto. Ganymed ist der größte Mond des Sonnensystems, größer als der Planet Merkur. Die Raumsonde Galileo erforschte Jupiter zwischen 1995 und 2003 aus der Umlaufbahn, und die Sonde Juno begann 2016, ihn zu umkreisen.",
      SOURCE_DE,
    ],
  },
  Saturn: {
    title: { en: "Saturn", de: "Saturn" },
    en: [
      "Saturn is the second largest planet, about 120,500 kilometres wide, nine times the width of Earth, and the sixth from the Sun, about 9.6 times as far away as Earth. Sunlight needs about an hour and twenty minutes to get there.",
      "It is the planet with the lowest density, lower than that of water. It is made mostly of hydrogen and helium.",
      "Its rings are the best known feature. They are mostly water ice, from tiny grains to pieces as big as houses. The main rings reach about 140,000 kilometres from the planet, yet in many places they are only about ten metres thick.",
      "A day on Saturn lasts about ten and a half hours. Its axis is tilted by 27 degrees, so it has seasons, and at its north pole a six sided stream of wind circles the pole.",
      "The spacecraft Cassini orbited Saturn from 2004 to 2017 and ended its mission on purpose by diving into the planet's atmosphere. The probe Huygens landed on the moon Titan in 2005. Cassini also found jets of water ice shooting out of the small moon Enceladus.",
      SOURCE_EN,
    ],
    de: [
      "Saturn ist der zweitgrößte Planet, etwa 120.500 Kilometer breit, neunmal so breit wie die Erde, und der sechste von der Sonne, etwa 9,6 Mal so weit entfernt wie die Erde. Das Sonnenlicht braucht rund eine Stunde und zwanzig Minuten bis dorthin.",
      "Er ist der Planet mit der geringsten Dichte, sie liegt unter der von Wasser. Er besteht hauptsächlich aus Wasserstoff und Helium.",
      "Am bekanntesten sind seine Ringe. Sie bestehen hauptsächlich aus Wassereis, von winzigen Körnern bis zu hausgroßen Brocken. Die Hauptringe reichen etwa 140.000 Kilometer weit vom Planeten weg, sind aber an vielen Stellen nur etwa zehn Meter dick.",
      "Ein Tag auf Saturn dauert etwa zehneinhalb Stunden. Seine Achse ist um 27 Grad geneigt, deshalb gibt es Jahreszeiten, und am Nordpol kreist ein sechseckiger Windstrom um den Pol.",
      "Die Raumsonde Cassini umkreiste Saturn von 2004 bis 2017 und beendete ihre Mission absichtlich mit einem Sturz in die Atmosphäre des Planeten. Die Sonde Huygens landete 2005 auf dem Mond Titan. Cassini fand außerdem Fontänen aus Wassereis am kleinen Mond Enceladus.",
      SOURCE_DE,
    ],
  },
  Uranus: {
    title: { en: "Uranus", de: "Uranus" },
    en: [
      "Uranus is the seventh planet, about 51,100 kilometres wide, four times the width of Earth. It is about 19 times as far from the Sun as Earth, sunlight needs about two hours and forty minutes to get there, and one year lasts 84 Earth years.",
      "It was the first planet found with a telescope: William Herschel discovered it in 1781.",
      "Uranus turns on its side. Its axis is tilted by 98 degrees, so during its long seasons one pole points almost straight at the Sun for decades.",
      "Its blue green colour comes from methane in the atmosphere, which swallows red light. It has the coldest atmosphere measured in the Solar System, down to about minus 224 degrees Celsius, and 13 known rings.",
      "The spacecraft Voyager 2 flew past in January 1986 and is so far the only one that has been there.",
      SOURCE_EN,
    ],
    de: [
      "Uranus ist der siebte Planet, etwa 51.100 Kilometer breit, viermal so breit wie die Erde. Er ist etwa 19 Mal so weit von der Sonne entfernt wie die Erde, das Sonnenlicht braucht etwa zwei Stunden und vierzig Minuten bis dorthin, und ein Jahr dauert 84 Erdjahre.",
      "Er war der erste Planet, der mit einem Teleskop entdeckt wurde: William Herschel fand ihn 1781.",
      "Uranus dreht sich auf der Seite. Seine Achse ist um 98 Grad geneigt, deshalb zeigt in seinen langen Jahreszeiten ein Pol jahrzehntelang fast direkt zur Sonne.",
      "Seine blaugrüne Farbe kommt vom Methan in der Atmosphäre, das rotes Licht verschluckt. Er hat die kälteste Atmosphäre, die im Sonnensystem gemessen wurde, bis zu etwa minus 224 Grad Celsius, und 13 bekannte Ringe.",
      "Die Raumsonde Voyager 2 flog im Januar 1986 vorbei und ist bisher die einzige Sonde, die dort war.",
      SOURCE_DE,
    ],
  },
  Neptune: {
    title: { en: "Neptune", de: "Neptun" },
    en: [
      "Neptune is the planet farthest from the Sun, about 49,500 kilometres wide and about 30 times as far from the Sun as Earth. Sunlight needs more than four hours to get there, and one year lasts almost 165 Earth years. In 2011 it finished its first full orbit since its discovery.",
      "Neptune was found by calculation before anyone saw it. Irregularities in the orbit of Uranus made astronomers predict where an unknown planet should be, and Johann Galle found it there in 1846.",
      "It is a deep blue ice giant, and methane gives it its colour. The winds are the fastest in the Solar System, up to about 2,000 kilometres per hour, and the mean temperature is about minus 200 degrees Celsius.",
      "Its largest moon Triton orbits the planet backwards, which points to it having been captured from the outer Solar System.",
      "Voyager 2 is the only spacecraft that has visited. It flew past in August 1989 and saw a huge dark storm, the Great Dark Spot. It had gone when the Hubble Space Telescope looked again in 1994.",
      SOURCE_EN,
    ],
    de: [
      "Neptun ist der von der Sonne am weitesten entfernte Planet, etwa 49.500 Kilometer breit und rund 30 Mal so weit von der Sonne entfernt wie die Erde. Das Sonnenlicht braucht mehr als vier Stunden bis dorthin, und ein Jahr dauert fast 165 Erdjahre. 2011 beendete er seinen ersten vollen Umlauf seit seiner Entdeckung.",
      "Neptun wurde durch Rechnung gefunden, bevor ihn jemand sah. Unregelmäßigkeiten in der Bahn von Uranus ließen Astronomen vorhersagen, wo ein unbekannter Planet stehen müsste, und Johann Galle fand ihn dort 1846.",
      "Er ist ein tiefblauer Eisriese, Methan gibt ihm die Farbe. Die Winde sind die schnellsten im Sonnensystem, bis zu etwa 2.000 Kilometer pro Stunde, und die mittlere Temperatur liegt bei etwa minus 200 Grad Celsius.",
      "Sein größter Mond Triton umkreist den Planeten rückwärts, das spricht dafür, dass er aus dem äußeren Sonnensystem eingefangen wurde.",
      "Voyager 2 ist die einzige Sonde, die ihn besucht hat. Sie flog im August 1989 vorbei und sah einen riesigen dunklen Sturm, den Großen Dunklen Fleck. Er war verschwunden, als das Weltraumteleskop Hubble 1994 wieder hinschaute.",
      SOURCE_DE,
    ],
  },
};
export const SOLAR_PLANET_NAMES = Object.keys(SOLAR_STORIES);

// Stories of the visitors of the Solar System: comets, interstellar objects and spacecraft. The numbers come from
// the JPL data (see visitorFacts in main.js), the sentence about each object is a plain fact that is well known.
const VISITOR_BLURB = {
  halley: {
    en: "Halley is the best known comet. It comes back about every 76 years and has been recorded since antiquity.",
    de: "Halley ist der bekannteste Komet. Er kommt etwa alle 76 Jahre wieder und ist seit der Antike überliefert.",
  },
  "hale-bopp": {
    en: "Hale-Bopp was one of the brightest comets of recent decades and could be seen with the naked eye for months in 1997.",
    de: "Hale-Bopp war einer der hellsten Kometen der letzten Jahrzehnte und war 1997 monatelang mit bloßem Auge zu sehen.",
  },
  "67p": {
    en: "67P was visited by the ESA spacecraft Rosetta, which orbited it from 2014 to 2016 and set the lander Philae down on it.",
    de: "Zu 67P flog die ESA-Raumsonde Rosetta, die ihn von 2014 bis 2016 umkreiste und den Lander Philae auf ihm absetzte.",
  },
  "swift-tuttle": {
    en: "Swift-Tuttle is the parent comet of the Perseid meteor shower, the dust it leaves behind burns up in our air every August.",
    de: "Swift-Tuttle ist der Mutterkomet des Perseiden-Meteorstroms, der Staub, den er hinterlässt, verglüht jeden August in unserer Luft.",
  },
  encke: {
    en: "Encke has one of the shortest periods of the known comets, it comes round again in only a few years.",
    de: "Encke hat eine der kürzesten Umlaufzeiten der bekannten Kometen, er kommt schon nach wenigen Jahren wieder.",
  },
  neowise: {
    en: "NEOWISE was found in March 2020 and could be seen with the naked eye in July 2020.",
    de: "NEOWISE wurde im März 2020 entdeckt und war im Juli 2020 mit bloßem Auge zu sehen.",
  },
  oumuamua: {
    en: "ʻOumuamua was found in October 2017. It was the first known object from another star system that passed through ours.",
    de: "ʻOumuamua wurde im Oktober 2017 entdeckt. Es war das erste bekannte Objekt aus einem anderen Sternsystem, das durch unseres zog.",
  },
  borisov: {
    en: "Borisov was found by the amateur astronomer Gennady Borisov in August 2019. It is the first interstellar comet.",
    de: "Borisov wurde im August 2019 vom Amateurastronomen Gennadi Borisow entdeckt. Er ist der erste interstellare Komet.",
  },
  "3i-atlas": {
    en: "3I/ATLAS was found on 1 July 2025 by the ATLAS survey. It is the third known object from another star system.",
    de: "3I/ATLAS wurde am 1. Juli 2025 vom ATLAS-Suchprogramm entdeckt. Es ist das dritte bekannte Objekt aus einem anderen Sternsystem.",
  },
  "voyager-1": {
    launched: "1977-09-05",
    en: "Voyager 1 flew past Jupiter and Saturn. It is the most distant human-made object and has been in interstellar space since 2012. It carries a golden record with sounds and pictures of Earth.",
    de: "Voyager 1 flog an Jupiter und Saturn vorbei. Sie ist das am weitesten entfernte Objekt von Menschenhand und seit 2012 im interstellaren Raum. Sie trägt eine goldene Schallplatte mit Klängen und Bildern der Erde.",
  },
  "voyager-2": {
    launched: "1977-08-20",
    en: "Voyager 2 is the only spacecraft that has visited Uranus (1986) and Neptune (1989). It has been in interstellar space since 2018.",
    de: "Voyager 2 ist die einzige Raumsonde, die Uranus (1986) und Neptun (1989) besucht hat. Sie ist seit 2018 im interstellaren Raum.",
  },
  "new-horizons": {
    launched: "2006-01-19",
    en: "New Horizons flew past Pluto on 14 July 2015 and past the small object Arrokoth on 1 January 2019, and has gone on into the outer Solar System.",
    de: "New Horizons flog am 14. Juli 2015 an Pluto und am 1. Januar 2019 am kleinen Objekt Arrokoth vorbei und fliegt weiter durch das äußere Sonnensystem.",
  },
  juno: {
    launched: "2011-08-05",
    en: "Juno has orbited Jupiter since 4 July 2016 and studies its atmosphere, its magnetic field and its inside.",
    de: "Juno umkreist Jupiter seit dem 4. Juli 2016 und erforscht seine Atmosphäre, sein Magnetfeld und sein Inneres.",
  },
  parker: {
    launched: "2018-08-12",
    en: "Parker Solar Probe flies closer to the Sun than any other spacecraft and dives through the Sun's outer atmosphere, the corona.",
    de: "Parker Solar Probe fliegt näher an die Sonne als jede andere Raumsonde und taucht durch ihre äußere Atmosphäre, die Korona.",
  },
  jwst: {
    launched: "2021-12-25",
    en: "The James Webb Space Telescope looks at the sky in infrared light. It sits at the Lagrange point L2, about 1.5 million kilometres from Earth on the side away from the Sun.",
    de: "Das James-Webb-Weltraumteleskop betrachtet den Himmel im Infrarotlicht. Es steht im Lagrange-Punkt L2, etwa 1,5 Millionen Kilometer von der Erde entfernt auf der sonnenabgewandten Seite.",
  },
};

const fmtDate = (d, lang) => d.toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", { year: "numeric", month: "long", day: "numeric" });
const fmtNum = (x, lang, digits = 1) => x.toLocaleString(lang === "de" ? "de-DE" : "en-GB", { maximumFractionDigits: digits });
const fmtLight = (au, lang) => {
  const minutes = au * 8.31675;
  return minutes < 90
    ? `${fmtNum(minutes, lang, 1)} ${lang === "de" ? "Minuten" : "minutes"}`
    : `${fmtNum(minutes / 60, lang, 1)} ${lang === "de" ? "Stunden" : "hours"}`;
};

export function objectStory(o, lang) {
  const de = lang === "de";
  const blurb = VISITOR_BLURB[o.key]?.[lang];
  const source = de
    ? `Quelle: NASA/JPL (Small-Body-Datenbank und Horizons). Die Lage ist aus den Bahndaten berechnet, Stand ${o.retrieved}, und ungefähr.`
    : `Source: NASA/JPL (Small-Body Database and Horizons). The position is worked out from the orbit data, retrieved ${o.retrieved}, and is approximate.`;
  const now = de
    ? `Die Entfernung von der Sonne beträgt jetzt ${fmtNum(o.sunAU, lang)} Astronomische${fmtNum(o.sunAU, lang) === "1" ? " Einheit" : " Einheiten"} (eine Einheit sind 150 Millionen Kilometer). Das Licht braucht ${fmtLight(o.sunAU, lang)} bis dorthin.`
    : `Its distance from the Sun is now ${fmtNum(o.sunAU, lang)} astronomical unit${fmtNum(o.sunAU, lang) === "1" ? "" : "s"} (one unit is 150 million kilometres). Light needs ${fmtLight(o.sunAU, lang)} to get there.`;

  if (o.kind === "spacecraft") {
    const launched = VISITOR_BLURB[o.key]?.launched;
    const startLine = launched ? (de ? `Gestartet: ${fmtDate(new Date(launched), lang)}.` : `Launched: ${fmtDate(new Date(launched), lang)}.`) : "";
    const fromEarth = de
      ? `Die Entfernung von der Erde beträgt jetzt ${fmtNum(o.earthAU, lang, 2)} Astronomische Einheiten.`
      : `Its distance from Earth is now ${fmtNum(o.earthAU, lang, 2)} astronomical units.`;
    const motionNote = ["voyager-1", "voyager-2", "new-horizons"].includes(o.key)
      ? de
        ? "Die Lage geht von der letzten Messung aus und läuft in gerader Linie weiter."
        : "The position goes on from the last measurement in a straight line."
      : o.key === "jwst"
        ? de
          ? "Die Karte setzt es an den Punkt L2 hinter der Erde und lässt es mit ihr um die Sonne laufen."
          : "The map puts it at the point L2 behind Earth and lets it go round the Sun with her."
        : de
          ? "Diese Sonde kreist, die Karte zeigt sie nur grob an ihrer Stelle."
          : "This spacecraft goes round in an orbit, the map shows it only roughly at its place.";
    return [blurb, startLine, now, fromEarth, motionNote, source].filter(Boolean);
  }
  if (o.kind === "interstellar") {
    return [
      blurb,
      de
        ? `Seine Bahn ist keine Ellipse, sondern eine Hyperbel (Exzentrizität ${fmtNum(o.e, lang, 2)}). Es kommt von außen, schwingt um die Sonne und verlässt unser System für immer. Fern von der Sonne ist es etwa ${fmtNum(o.vInf, lang, 0)} Kilometer pro Sekunde schnell.`
        : `Its orbit is not an ellipse but a hyperbola (eccentricity ${fmtNum(o.e, lang, 2)}). It came from outside, swung round the Sun and leaves our system for good. Far from the Sun it moves at about ${fmtNum(o.vInf, lang, 0)} kilometres per second.`,
      de
        ? `Der nächste Punkt zur Sonne lag bei ${fmtNum(o.q, lang, 2)} Astronomischen Einheiten, am ${fmtDate(o.perihelion, lang)}.`
        : `Its closest point to the Sun was ${fmtNum(o.q, lang, 2)} astronomical units, on ${fmtDate(o.perihelion, lang)}.`,
      now,
      source,
    ];
  }
  const retro = o.incl > 90;
  return [
    blurb,
    de
      ? `Er umkreist die Sonne in etwa ${fmtNum(o.periodYears, lang, o.periodYears < 100 ? 1 : 0)} Jahren auf einer lang gestreckten Bahn, von ${fmtNum(o.q, lang, 2)} Astronomischen Einheiten im Sonnennächsten bis ${fmtNum(o.Q, lang, 0)} im Sonnenfernsten.`
      : `It goes round the Sun in about ${fmtNum(o.periodYears, lang, o.periodYears < 100 ? 1 : 0)} years on a long stretched orbit, from ${fmtNum(o.q, lang, 2)} astronomical units at its closest to ${fmtNum(o.Q, lang, 0)} at its farthest.`,
    de
      ? `Der letzte sonnennächste Punkt war am ${fmtDate(o.perihelion, lang)}. Der nächste kommt etwa am ${fmtDate(o.nextPerihelion, lang)} (aus den Bahnelementen gerechnet, die Planeten verschieben ihn um einige Monate).`
      : `The last closest approach to the Sun was on ${fmtDate(o.perihelion, lang)}. The next one comes at about ${fmtDate(o.nextPerihelion, lang)} (worked out from the orbital elements, the planets shift it by some months).`,
    de
      ? `Die Bahn ist um ${fmtNum(o.incl, lang, 0)} Grad gegen die der Planeten geneigt${retro ? ", er läuft also gegen deren Richtung" : ""}.`
      : `The orbit is tilted by ${fmtNum(o.incl, lang, 0)} degrees against that of the planets${retro ? ", so it runs against their direction" : ""}.`,
    now,
    source,
  ].filter(Boolean);
}

// Name of a Solar System planet in the menu. Earth has its own text in UI, the others reuse the story titles.
export const solarName = (name, lang) => SOLAR_STORIES[name]?.title[lang] ?? name;

export function buildStory(star, planet, lang) {
  const t = TEXT[lang];
  // The other planets of our own system. One that has no text of its own shows only its name.
  if (planet.solarObject) return { title: planet.pl_name, paragraphs: objectStory(planet.solarObject, lang) };
  if (planet.solarOther) {
    const story = SOLAR_STORIES[planet.pl_name];
    return story ? { title: story.title[lang], paragraphs: story[lang] } : { title: planet.pl_name, paragraphs: [] };
  }
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
  if (planet.pl_rade != null) facts.push((planet.radius_calculated ? t.radiusCalc : t.radius)(n(planet.pl_rade)));
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
