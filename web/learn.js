// Learning paths (the area Learn of My Universe). A path has steps; each step has a goal, a short text, a sentence about what it means for the
// visitor (worked out from their year of birth and their star, or, without them, for a person of 30), a task in the 3D view and a few
// questions with the answer explained. When the task is done and every question is answered right, the step is done (XP); when all steps
// are done, the final test opens: 10 questions from all steps, some with the visitor's own numbers, passed from 80 % (XP and a badge). The
// progress lives in the explorer's log (explorer.js: total.learnTasks, learnSteps, learnPaths and "learnBest:<path>"), so it is merged with
// the account like the rest. The facts in the texts are the numbers of the map (main.js, moons.js) and the well known ones of NASA's fact
// sheets. The rules are pure functions, tested in tests/learn.test.mjs. The first path is Our Solar System; more will follow.

import { track } from "./stats.js";
import { MOONS } from "./moons.js";
import { XP_LEARN } from "./explorer.js";
import { planetCanvas, starCanvas } from "./sharecard.js";

export const PATHS = {
  solar: { steps: ["sun", "inner", "outer", "moons", "scale"], minutes: 30, testSize: 10, pass: 0.8 },
};
// where each task takes the visitor (main.js does it): a place of the map, or the real scale
export const TASKS = { sun: "Sun", inner: "Mars", outer: "Saturn", moons: "Jupiter", scale: "realScale" };
const REFERENCE_AGE = 30; // without a year of birth, the sentences speak of a person of 30
const MOON_DAYS = MOONS.Earth[0].days;

// The visitor's numbers. ctx: { age (years, or null), years: { Mercury, Mars, Jupiter } (their year in Earth years), star: { name, dist, year } or null }.
export function personalNumbers(ctx) {
  const age = ctx.age ?? REFERENCE_AGE;
  return {
    you: ctx.age != null,
    orbits: Math.floor(age), // full trips round the Sun
    mars: Math.round(age / ctx.years.Mars), // the age on Mars, rounded as on the tiles of "your age on the planets"
    mercury: Math.round(age / ctx.years.Mercury),
    jupiterLaps: Math.floor(age / ctx.years.Jupiter),
    moonLaps: Math.floor((age * 365.25) / MOON_DAYS),
    star: ctx.age != null ? ctx.star ?? null : null,
  };
}

// Two wrong answers near a right number: different from it and from each other, never below 0.
export function distractors(n) {
  const out = [];
  for (const d of [Math.round(n * 2), Math.round(n / 2), n + Math.max(2, Math.round(n * 0.3)), n - Math.max(2, Math.round(n * 0.3)), n + 7, n + 13])
    if (d >= 0 && d !== n && !out.includes(d)) out.push(d);
  return out.slice(0, 2);
}

// A fixed order for a seed: the options of a question keep their places when the panel is drawn again.
function hash(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.codePointAt(0), 16777619);
  return h >>> 0;
}
export function seededOrder(items, seed) {
  return items
    .map((item, i) => ({ item, key: hash(`${seed}:${i}`) }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.item);
}

// The questions of each step: a fact (texts in LEARN_TEXT.q: the first option is the right one) or a personal number.
export const QUESTIONS = {
  sun: [{ id: "sunLight" }, { id: "sunEnergy" }, { id: "sunOrbits", number: "orbits" }],
  inner: [{ id: "venusDay" }, { id: "marsAge", number: "mars" }, { id: "closest" }],
  outer: [{ id: "largest" }, { id: "saturnDensity" }, { id: "jupiterLaps", number: "jupiterLaps" }],
  moons: [{ id: "largestMoon" }, { id: "galileo" }, { id: "sameSide" }, { id: "moonLaps", number: "moonLaps" }],
  scale: [{ id: "neptune" }, { id: "starLight", number: "starLight" }, { id: "sunSize" }],
};

// The questions of a step, ready to show: [{ id, text, options (labels), answer (the right label), explain }].
export function buildQuestions(step, nums, lang) {
  const tx = LEARN_TEXT[lang] ?? LEARN_TEXT.en;
  const fmt = (x) => x.toLocaleString(lang);
  return QUESTIONS[step].map((spec) => {
    // the light of your star; without a star the one of Proxima Centauri
    if (spec.number === "starLight" && !nums.star) spec = { id: "proximaLight" };
    if (spec.number === "starLight") {
      const n = Math.round(nums.star.dist);
      const q = tx.q.starLight;
      return { id: spec.id, text: q.you(nums.star.name), options: seededOrder([n, ...distractors(n)].map(fmt), spec.id), answer: fmt(n), explain: q.e(fmt(n), nums.star.name) };
    }
    if (spec.number) {
      const n = nums[spec.number];
      const q = tx.q[spec.id];
      return { id: spec.id, text: nums.you ? q.you : q.ref, options: seededOrder([n, ...distractors(n)].map(fmt), spec.id), answer: fmt(n), explain: q.e(fmt(n)) };
    }
    const q = tx.q[spec.id];
    return { id: spec.id, text: q.q, options: seededOrder(q.o, spec.id), answer: q.o[0], explain: q.e };
  });
}

// The final test: `size` questions from all steps, a different choice and order for every attempt.
export function testQuestions(path, nums, lang, attempt) {
  const all = PATHS[path].steps.flatMap((step) => buildQuestions(step, nums, lang));
  return seededOrder(all, `test-${attempt}`).slice(0, PATHS[path].testSize);
}
export const passed = (right, total, path) => total > 0 && right / total >= PATHS[path].pass;

export const LEARN_TEXT = {
  en: {
    path: {
      title: "Our Solar System",
      goal: "You can explain how our Solar System is built and tell its main bodies apart.",
      meta: (m) => `about ${m} minutes · for beginners`,
      rule: "5 steps, then a final test with 10 questions; passed from 80 %.",
    },
    status: { done: "Done", next: "Next", open: "To do", locked: "All steps first" },
    back: "All steps", stepOf: (n, all) => `Step ${n} of ${all}`, goalLabel: "Learning goal", forYou: "For you", example: "An example",
    taskLabel: "In the 3D view", taskGo: "Show in 3D", taskDone: "Done", check: "Check your understanding", right: "Right.", wrong: "Not quite.",
    stepDone: (xp) => `Step done · +${xp} XP`, nextStep: "Next step", toTest: "To the final test",
    needTask: "Do the task in the 3D view too, then the step is done.", progress: (d, all) => `${d} of ${all} steps`,
    test: {
      title: "Final test", intro: (n, p) => `${n} questions from all steps, some with your own numbers. Passed from ${p} %.`,
      locked: "Finish all five steps first.", evaluate: "Check the answers", score: (r, n, p) => `${r} of ${n} right (${p} %)`,
      passed: (xp) => `Passed · +${xp} XP and a new badge`, failed: "Not passed yet. Read the explanations and try again.",
      retry: "Try again", best: (p) => `Best result: ${p} %`, answerAll: "Answer every question first.",
    },
    steps: {
      sun: {
        title: "The Sun", goal: "You can say what the Sun is and where its energy comes from.",
        text: [
          "The Sun is a star: a ball of hot gas, so big that about 109 Earths would fit side by side across it. It holds more than 99 % of all the mass of the Solar System.",
          "In its core hydrogen fuses into helium. That frees the energy that reaches us as light and warmth, from about 150 million kilometres away.",
        ],
        task: "Fly to the Sun and look at it from close by.",
        you: (n) => `The light falling on you right now left the Sun about 8 minutes and 20 seconds ago. Since you were born, the Earth has carried you round it ${n} times.`,
        ref: (n) => `The light falling on you right now left the Sun about 8 minutes and 20 seconds ago. A person of 30 has been carried round it by the Earth ${n} times.`,
      },
      inner: {
        title: "The inner planets", goal: "You can name the four rocky planets and tell them apart.",
        text: [
          "Mercury, Venus, Earth and Mars are the rocky planets: small, with solid ground. Mercury is the closest to the Sun, Venus the hottest, because its thick air of carbon dioxide holds the heat.",
          "Mars has the highest volcano we know, Olympus Mons, about two and a half times as tall as Mount Everest. A day on Venus lasts longer than its year.",
        ],
        task: "Fly to Mars and compare it with the Earth.",
        you: (mars, mercury) => `On Mars you would be ${mars}, on Mercury ${mercury}: a year there is longer or shorter than ours.`,
        ref: (mars, mercury) => `A person of 30 would be ${mars} on Mars and ${mercury} on Mercury: a year there is longer or shorter than ours.`,
      },
      outer: {
        title: "The outer planets", goal: "You can tell the gas giants from the ice giants.",
        text: [
          "Jupiter and Saturn are gas giants, made mostly of hydrogen and helium; Uranus and Neptune are ice giants. None of them has solid ground like the Earth.",
          "Jupiter has more than twice the mass of all the other planets together. Saturn is so light for its size that it is less dense than water.",
        ],
        task: "Fly to Saturn and look at its rings.",
        you: (n) => `Since you were born, Jupiter has gone round the Sun only ${n} times: one of its years lasts almost 12 of ours.`,
        ref: (n) => `In 30 years Jupiter goes round the Sun only ${n} times: one of its years lasts almost 12 of ours.`,
      },
      moons: {
        title: "Moons", goal: "You know what a moon is and why our Moon always shows us the same side.",
        text: [
          "A moon goes round a planet. The Earth has one, Jupiter dozens, and Galileo Galilei found the four largest of them in 1610 with one of the first telescopes.",
          "Most large moons turn exactly once per orbit, so they always show their planet the same side. That is why we never see the far side of our Moon from the Earth.",
        ],
        task: "Fly to Jupiter and click one of its four large moons.",
        you: (n) => `Since you were born, the Moon has gone round the Earth about ${n} times.`,
        ref: (n) => `In 30 years the Moon goes round the Earth about ${n} times.`,
      },
      scale: {
        title: "Scale and distance", goal: "You can describe how big and how empty the Solar System is.",
        text: [
          "The Solar System is mostly empty space. The distance from the Earth to the Sun, 150 million kilometres, is called one astronomical unit (AU). Neptune, the outermost planet, is about 30 AU from the Sun.",
          "Light from the Sun needs a little over 8 minutes to the Earth and about 4 hours to Neptune. In the real scale of the 3D view the planets become tiny dots in a huge space.",
        ],
        task: "Switch on the real scale and see how far apart the planets are.",
        you: (name, dist, year) => `The light of your star, ${name}, that reaches you today set off around ${year}, about the year you were born. It has travelled ${dist} light years.`,
        ref: "The light of the nearest star, Proxima Centauri, needs 4.2 years to reach us. Give your year of birth in \"You in the cosmos\" and find the star whose light set off when you were born.",
      },
    },
    q: {
      sunLight: { q: "How long does sunlight need to reach the Earth?", o: ["About 8 minutes", "About 8 seconds", "About 8 hours"], e: "About 8 minutes and 20 seconds: the Sun is 150 million kilometres away, and light travels about 300,000 kilometres per second." },
      sunEnergy: { q: "Where does the Sun's energy come from?", o: ["Hydrogen fusing into helium in its core", "Burning coal and gas", "The light of other stars"], e: "In the core of the Sun hydrogen nuclei fuse into helium. That is nuclear fusion; it frees the energy that shines." },
      sunOrbits: { you: "How many times has the Earth carried you round the Sun since you were born?", ref: "How many times has a person of 30 been carried round the Sun?", e: (n) => `${n} times: the Earth goes round the Sun once a year, and you travel with it.` },
      venusDay: { q: "On which planet is a day longer than a year?", o: ["Venus", "Mercury", "Mars"], e: "Venus turns very slowly: one turn takes longer than one trip round the Sun." },
      marsAge: { you: "How old would you be on Mars?", ref: "How old would a person of 30 be on Mars?", e: (n) => `${n}: a year on Mars lasts 1.88 Earth years, so there are fewer birthdays there.` },
      closest: { q: "Which planet is closest to the Sun?", o: ["Mercury", "Venus", "Earth"], e: "Mercury, at 0.39 AU. It goes round the Sun in 88 days." },
      largest: { q: "Which is the largest planet?", o: ["Jupiter", "Saturn", "Neptune"], e: "Jupiter: about 11 Earths would fit side by side across it." },
      saturnDensity: { q: "Which planet is less dense than water?", o: ["Saturn", "Jupiter", "Uranus"], e: "Saturn: its mean density is lower than that of water." },
      jupiterLaps: { you: "How many times has Jupiter gone round the Sun since you were born?", ref: "How many times does Jupiter go round the Sun in 30 years?", e: (n) => `${n} times: one year of Jupiter lasts almost 12 Earth years.` },
      largestMoon: { q: "Which is the largest moon of the Solar System?", o: ["Ganymede", "Our Moon", "Europa"], e: "Ganymede, a moon of Jupiter: it is even larger than the planet Mercury." },
      galileo: { q: "Who found the four large moons of Jupiter in 1610?", o: ["Galileo Galilei", "Isaac Newton", "Johannes Kepler"], e: "Galileo Galilei, with one of the first telescopes. They are called the Galilean moons." },
      sameSide: { q: "Why do we always see the same side of the Moon?", o: ["It turns exactly once per orbit", "It does not turn at all", "The other side is always dark"], e: "The Moon turns once each time it goes round the Earth, so the same side always faces us. The far side gets sunlight too." },
      moonLaps: { you: "About how many times has the Moon gone round the Earth since you were born?", ref: "About how many times does the Moon go round the Earth in 30 years?", e: (n) => `About ${n} times: one orbit takes 27.3 days.` },
      neptune: { q: "About how far is Neptune from the Sun?", o: ["30 AU", "3 AU", "300 AU"], e: "About 30 AU, 30 times as far as the Earth. The light of the Sun needs about 4 hours to get there." },
      starLight: { you: (name) => `For how many years did the light of your star, ${name}, travel to reach you?`, e: (n, name) => `About ${n} years: ${name} is about ${n} light years away, and a light year is the distance light travels in a year.` },
      proximaLight: { q: "How long does the light of Proxima Centauri, the nearest star after the Sun, travel to us?", o: ["About 4.2 years", "About 4.2 days", "About 42 years"], e: "About 4.2 years: Proxima Centauri is 4.24 light years away." },
      sunSize: { q: "About how many Earths would fit side by side across the Sun?", o: ["About 109", "About 11", "About 1,000"], e: "About 109: the radius of the Sun is about 109 times that of the Earth." },
    },
  },
  de: {
    path: {
      title: "Unser Sonnensystem",
      goal: "Du kannst erklären, wie unser Sonnensystem aufgebaut ist, und seine wichtigsten Himmelskörper unterscheiden.",
      meta: (m) => `etwa ${m} Minuten · für Einsteiger`,
      rule: "5 Schritte, dann ein Abschlusstest mit 10 Fragen; bestanden ab 80 %.",
    },
    status: { done: "Erledigt", next: "Als Nächstes", open: "Offen", locked: "Erst alle Schritte" },
    back: "Alle Schritte", stepOf: (n, all) => `Schritt ${n} von ${all}`, goalLabel: "Lernziel", forYou: "Für dich", example: "Ein Beispiel",
    taskLabel: "In der 3D-Ansicht", taskGo: "In 3D zeigen", taskDone: "Erledigt", check: "Hast du es verstanden?", right: "Richtig.", wrong: "Nicht ganz.",
    stepDone: (xp) => `Schritt geschafft · +${xp} XP`, nextStep: "Nächster Schritt", toTest: "Zum Abschlusstest",
    needTask: "Mach noch die Aufgabe in der 3D-Ansicht, dann ist der Schritt geschafft.", progress: (d, all) => `${d} von ${all} Schritten`,
    test: {
      title: "Abschlusstest", intro: (n, p) => `${n} Fragen aus allen Schritten, einige mit deinen eigenen Zahlen. Bestanden ab ${p} %.`,
      locked: "Schließe zuerst alle fünf Schritte ab.", evaluate: "Auswerten", score: (r, n, p) => `${r} von ${n} richtig (${p} %)`,
      passed: (xp) => `Bestanden · +${xp} XP und ein neues Abzeichen`, failed: "Noch nicht bestanden. Lies die Erklärungen und versuch es noch einmal.",
      retry: "Noch einmal", best: (p) => `Bestes Ergebnis: ${p} %`, answerAll: "Beantworte zuerst alle Fragen.",
    },
    steps: {
      sun: {
        title: "Die Sonne", goal: "Du kannst sagen, was die Sonne ist und woher ihre Energie kommt.",
        text: [
          "Die Sonne ist ein Stern: eine Kugel aus heißem Gas, so groß, dass etwa 109 Erden nebeneinander quer hineinpassen. Sie enthält mehr als 99 % der gesamten Masse des Sonnensystems.",
          "In ihrem Kern verschmilzt Wasserstoff zu Helium. Dabei wird die Energie frei, die uns als Licht und Wärme erreicht, aus etwa 150 Millionen Kilometern Entfernung.",
        ],
        task: "Flieg zur Sonne und sieh sie dir aus der Nähe an.",
        you: (n) => `Das Licht, das gerade auf dich fällt, hat die Sonne vor etwa 8 Minuten und 20 Sekunden verlassen. Seit deiner Geburt hat dich die Erde ${n}-mal um sie getragen.`,
        ref: (n) => `Das Licht, das gerade auf dich fällt, hat die Sonne vor etwa 8 Minuten und 20 Sekunden verlassen. Einen 30-jährigen Menschen hat die Erde schon ${n}-mal um sie getragen.`,
      },
      inner: {
        title: "Die inneren Planeten", goal: "Du kannst die vier Gesteinsplaneten nennen und unterscheiden.",
        text: [
          "Merkur, Venus, Erde und Mars sind die Gesteinsplaneten: klein und mit festem Boden. Merkur ist der Sonne am nächsten, Venus der heißeste, weil ihre dichte Luft aus Kohlendioxid die Wärme festhält.",
          "Auf dem Mars steht der höchste bekannte Vulkan, Olympus Mons, etwa zweieinhalbmal so hoch wie der Mount Everest. Ein Tag auf der Venus dauert länger als ihr Jahr.",
        ],
        task: "Flieg zum Mars und vergleiche ihn mit der Erde.",
        you: (mars, mercury) => `Auf dem Mars wärst du ${mars}, auf dem Merkur ${mercury}: Ein Jahr dauert dort länger oder kürzer als bei uns.`,
        ref: (mars, mercury) => `Ein 30-jähriger Mensch wäre auf dem Mars ${mars} und auf dem Merkur ${mercury}: Ein Jahr dauert dort länger oder kürzer als bei uns.`,
      },
      outer: {
        title: "Die äußeren Planeten", goal: "Du kannst Gasriesen und Eisriesen unterscheiden.",
        text: [
          "Jupiter und Saturn sind Gasriesen, vor allem aus Wasserstoff und Helium, Uranus und Neptun sind Eisriesen. Keiner von ihnen hat festen Boden wie die Erde.",
          "Jupiter hat mehr als doppelt so viel Masse wie alle anderen Planeten zusammen. Saturn ist für seine Größe so leicht, dass seine Dichte geringer ist als die von Wasser.",
        ],
        task: "Flieg zum Saturn und sieh dir seine Ringe an.",
        you: (n) => `Seit deiner Geburt ist Jupiter erst ${n}-mal um die Sonne gelaufen: Eines seiner Jahre dauert fast 12 von unseren.`,
        ref: (n) => `In 30 Jahren läuft Jupiter nur ${n}-mal um die Sonne: Eines seiner Jahre dauert fast 12 von unseren.`,
      },
      moons: {
        title: "Monde", goal: "Du weißt, was ein Mond ist und warum unser Mond uns immer dieselbe Seite zeigt.",
        text: [
          "Ein Mond kreist um einen Planeten. Die Erde hat einen, Jupiter Dutzende, und die vier größten davon entdeckte Galileo Galilei 1610 mit einem der ersten Fernrohre.",
          "Die meisten großen Monde drehen sich bei jedem Umlauf genau einmal um sich selbst und zeigen ihrem Planeten deshalb immer dieselbe Seite. Darum sehen wir von der Erde nie die Rückseite unseres Mondes.",
        ],
        task: "Flieg zum Jupiter und klicke auf einen seiner vier großen Monde.",
        you: (n) => `Seit deiner Geburt hat der Mond die Erde etwa ${n}-mal umrundet.`,
        ref: (n) => `In 30 Jahren umrundet der Mond die Erde etwa ${n}-mal.`,
      },
      scale: {
        title: "Maßstab und Entfernungen", goal: "Du kannst beschreiben, wie groß und wie leer das Sonnensystem ist.",
        text: [
          "Das Sonnensystem ist vor allem leerer Raum. Der Abstand von der Erde zur Sonne, 150 Millionen Kilometer, heißt eine Astronomische Einheit (AE). Neptun, der äußerste Planet, ist etwa 30 AE von der Sonne entfernt.",
          "Das Licht der Sonne braucht gut 8 Minuten bis zur Erde und etwa 4 Stunden bis zum Neptun. Im echten Maßstab der 3D-Ansicht werden die Planeten zu winzigen Punkten in einem riesigen Raum.",
        ],
        task: "Schalte den echten Maßstab ein und sieh, wie weit die Planeten auseinanderliegen.",
        you: (name, dist, year) => `Das Licht deines Sterns, ${name}, das heute bei dir ankommt, brach um ${year} auf, etwa in deinem Geburtsjahr. Es ist ${dist} Lichtjahre gereist.`,
        ref: "Das Licht des nächsten Sterns, Proxima Centauri, braucht 4,2 Jahre bis zu uns. Gib unter „Du im Kosmos“ dein Geburtsjahr ein und finde den Stern, dessen Licht bei deiner Geburt losflog.",
      },
    },
    q: {
      sunLight: { q: "Wie lange braucht Sonnenlicht bis zur Erde?", o: ["Etwa 8 Minuten", "Etwa 8 Sekunden", "Etwa 8 Stunden"], e: "Etwa 8 Minuten und 20 Sekunden: Die Sonne ist 150 Millionen Kilometer entfernt, und Licht legt etwa 300.000 Kilometer pro Sekunde zurück." },
      sunEnergy: { q: "Woher kommt die Energie der Sonne?", o: ["Wasserstoff verschmilzt in ihrem Kern zu Helium", "Sie verbrennt Kohle und Gas", "Vom Licht anderer Sterne"], e: "Im Kern der Sonne verschmelzen Wasserstoffkerne zu Helium. Das ist Kernfusion; dabei wird die Energie frei, die leuchtet." },
      sunOrbits: { you: "Wie oft hat dich die Erde seit deiner Geburt um die Sonne getragen?", ref: "Wie oft hat die Erde einen 30-jährigen Menschen um die Sonne getragen?", e: (n) => `${n}-mal: Die Erde läuft einmal im Jahr um die Sonne, und du reist mit.` },
      venusDay: { q: "Auf welchem Planeten dauert ein Tag länger als ein Jahr?", o: ["Venus", "Merkur", "Mars"], e: "Venus dreht sich sehr langsam: Eine Drehung dauert länger als ein Umlauf um die Sonne." },
      marsAge: { you: "Wie alt wärst du auf dem Mars?", ref: "Wie alt wäre ein 30-jähriger Mensch auf dem Mars?", e: (n) => `${n}: Ein Jahr auf dem Mars dauert 1,88 Erdjahre, dort gibt es also seltener Geburtstage.` },
      closest: { q: "Welcher Planet ist der Sonne am nächsten?", o: ["Merkur", "Venus", "Erde"], e: "Merkur, in 0,39 AE Abstand. Er läuft in 88 Tagen um die Sonne." },
      largest: { q: "Welcher ist der größte Planet?", o: ["Jupiter", "Saturn", "Neptun"], e: "Jupiter: Etwa 11 Erden passen quer nebeneinander hinein." },
      saturnDensity: { q: "Welcher Planet hat eine geringere Dichte als Wasser?", o: ["Saturn", "Jupiter", "Uranus"], e: "Saturn: Seine mittlere Dichte ist geringer als die von Wasser." },
      jupiterLaps: { you: "Wie oft ist Jupiter seit deiner Geburt um die Sonne gelaufen?", ref: "Wie oft läuft Jupiter in 30 Jahren um die Sonne?", e: (n) => `${n}-mal: Ein Jupiterjahr dauert fast 12 Erdjahre.` },
      largestMoon: { q: "Welcher ist der größte Mond des Sonnensystems?", o: ["Ganymed", "Unser Mond", "Europa"], e: "Ganymed, ein Mond des Jupiter: Er ist sogar größer als der Planet Merkur." },
      galileo: { q: "Wer entdeckte 1610 die vier großen Jupitermonde?", o: ["Galileo Galilei", "Isaac Newton", "Johannes Kepler"], e: "Galileo Galilei, mit einem der ersten Fernrohre. Man nennt sie die Galileischen Monde." },
      sameSide: { q: "Warum sehen wir vom Mond immer dieselbe Seite?", o: ["Er dreht sich bei jedem Umlauf genau einmal", "Er dreht sich gar nicht", "Die andere Seite ist immer dunkel"], e: "Der Mond dreht sich bei jedem Umlauf um die Erde einmal um sich selbst, darum ist uns immer dieselbe Seite zugewandt. Auch die Rückseite bekommt Sonnenlicht." },
      moonLaps: { you: "Wie oft hat der Mond die Erde seit deiner Geburt etwa umrundet?", ref: "Wie oft umrundet der Mond die Erde in 30 Jahren etwa?", e: (n) => `Etwa ${n}-mal: Ein Umlauf dauert 27,3 Tage.` },
      neptune: { q: "Wie weit ist Neptun etwa von der Sonne entfernt?", o: ["30 AE", "3 AE", "300 AE"], e: "Etwa 30 AE, 30-mal so weit wie die Erde. Das Licht der Sonne braucht etwa 4 Stunden bis dorthin." },
      starLight: { you: (name) => `Wie viele Jahre war das Licht deines Sterns, ${name}, bis zu dir unterwegs?`, e: (n, name) => `Etwa ${n} Jahre: ${name} ist etwa ${n} Lichtjahre entfernt, und ein Lichtjahr ist die Strecke, die das Licht in einem Jahr zurücklegt.` },
      proximaLight: { q: "Wie lange braucht das Licht von Proxima Centauri, dem nächsten Stern nach der Sonne, bis zu uns?", o: ["Etwa 4,2 Jahre", "Etwa 4,2 Tage", "Etwa 42 Jahre"], e: "Etwa 4,2 Jahre: Proxima Centauri ist 4,24 Lichtjahre entfernt." },
      sunSize: { q: "Wie viele Erden passen etwa quer nebeneinander in die Sonne?", o: ["Etwa 109", "Etwa 11", "Etwa 1.000"], e: "Etwa 109: Der Radius der Sonne ist etwa 109-mal so groß wie der der Erde." },
    },
  },
  ja: {
    path: {
      title: "私たちの太陽系",
      goal: "太陽系のしくみを説明し、おもな天体を見分けられるようになります。",
      meta: (m) => `約${m}分 · 初心者向け`,
      rule: "5つのステップのあと、10問の最終テスト。80 %以上で合格です。",
    },
    status: { done: "完了", next: "次はこれ", open: "未完了", locked: "先に全ステップを" },
    back: "すべてのステップ", stepOf: (n, all) => `ステップ ${n} / ${all}`, goalLabel: "学習目標", forYou: "あなたへ", example: "例",
    taskLabel: "3D表示で", taskGo: "3Dで見る", taskDone: "完了", check: "理解できたか確かめよう", right: "正解です。", wrong: "ちょっと違います。",
    stepDone: (xp) => `ステップ完了 · +${xp} XP`, nextStep: "次のステップ", toTest: "最終テストへ",
    needTask: "3D表示での課題もやってみましょう。それでステップ完了です。", progress: (d, all) => `${all}ステップ中${d}完了`,
    test: {
      title: "最終テスト", intro: (n, p) => `すべてのステップから${n}問。あなた自身の数字を使った問題もあります。${p} %以上で合格です。`,
      locked: "先に5つのステップをすべて終えてください。", evaluate: "採点する", score: (r, n, p) => `${n}問中${r}問正解（${p} %）`,
      passed: (xp) => `合格 · +${xp} XPと新しいバッジ`, failed: "まだ合格ではありません。解説を読んで、もう一度挑戦しましょう。",
      retry: "もう一度", best: (p) => `最高成績：${p} %`, answerAll: "先にすべての問題に答えてください。",
    },
    steps: {
      sun: {
        title: "太陽", goal: "太陽が何であり、そのエネルギーがどこから来るのかを説明できます。",
        text: [
          "太陽は恒星です。熱いガスの球で、直径には地球が約109個並ぶほどの大きさがあります。太陽系の質量の99 %以上が太陽に集まっています。",
          "中心部では水素が融合してヘリウムになります。そのとき生まれるエネルギーが、約1億5000万キロメートル離れた私たちに光と熱として届きます。",
        ],
        task: "太陽まで飛んで、近くから見てみましょう。",
        you: (n) => `いまあなたに当たっている光は、約8分20秒前に太陽を出発しました。生まれてから、あなたは地球とともに太陽のまわりを${n}周しています。`,
        ref: (n) => `いまあなたに当たっている光は、約8分20秒前に太陽を出発しました。30歳の人は、地球とともに太陽のまわりをすでに${n}周しています。`,
      },
      inner: {
        title: "内側の惑星", goal: "4つの岩石惑星の名前を挙げ、見分けられます。",
        text: [
          "水星、金星、地球、火星は岩石惑星です。小さく、かたい地面があります。太陽にいちばん近いのは水星、いちばん熱いのは金星です。厚い二酸化炭素の大気が熱を閉じこめるからです。",
          "火星には知られている中でもっとも高い火山、オリンポス山があり、高さはエベレストの約2.5倍です。金星の1日は、金星の1年より長いのです。",
        ],
        task: "火星まで飛んで、地球とくらべてみましょう。",
        you: (mars, mercury) => `火星ではあなたは${mars}歳、水星では${mercury}歳です。1年の長さが私たちとはちがうからです。`,
        ref: (mars, mercury) => `30歳の人は、火星では${mars}歳、水星では${mercury}歳です。1年の長さが私たちとはちがうからです。`,
      },
      outer: {
        title: "外側の惑星", goal: "巨大ガス惑星と巨大氷惑星を見分けられます。",
        text: [
          "木星と土星はおもに水素とヘリウムからなる巨大ガス惑星、天王星と海王星は巨大氷惑星です。どれも地球のようなかたい地面をもちません。",
          "木星の質量は、ほかのすべての惑星を合わせた質量の2倍以上です。土星は大きさのわりにとても軽く、密度は水より小さいのです。",
        ],
        task: "土星まで飛んで、環を見てみましょう。",
        you: (n) => `あなたが生まれてから、木星は太陽のまわりをまだ${n}周しかしていません。木星の1年は地球の約12年だからです。`,
        ref: (n) => `30年のあいだに、木星は太陽のまわりを${n}周しかしません。木星の1年は地球の約12年だからです。`,
      },
      moons: {
        title: "衛星", goal: "衛星とは何か、そして月がいつも同じ面を向けている理由がわかります。",
        text: [
          "衛星は惑星のまわりを回る天体です。地球には1つ、木星には数十の衛星があり、そのうち大きな4つは1610年にガリレオ・ガリレイが初期の望遠鏡で発見しました。",
          "大きな衛星の多くは、1周するあいだにちょうど1回自転するため、いつも惑星に同じ面を向けています。だから地球から月の裏側は見えません。",
        ],
        task: "木星まで飛んで、4つの大きな衛星のどれかをクリックしてみましょう。",
        you: (n) => `あなたが生まれてから、月は地球のまわりを約${n}周しました。`,
        ref: (n) => `30年のあいだに、月は地球のまわりを約${n}周します。`,
      },
      scale: {
        title: "大きさと距離", goal: "太陽系がどれほど大きく、がらんとしているかを説明できます。",
        text: [
          "太陽系のほとんどは何もない空間です。地球から太陽までの距離、約1億5000万キロメートルを1天文単位（au）と呼びます。いちばん外側の惑星である海王星は、太陽から約30 auの距離にあります。",
          "太陽の光は地球まで8分あまり、海王星まで約4時間かかります。3D表示の実寸モードでは、惑星は広大な空間の中の小さな点になります。",
        ],
        task: "実寸表示をオンにして、惑星どうしがどれほど離れているか見てみましょう。",
        you: (name, dist, year) => `あなたの星${name}から今日届く光は、${year}年ごろ、あなたが生まれた頃に出発しました。${dist}光年を旅してきたのです。`,
        ref: "太陽の次に近い恒星プロキシマ・ケンタウリの光は、私たちに届くまで4.2年かかります。「宇宙の中のあなた」で生まれた年を入れると、あなたが生まれた頃に光が出発した星が見つかります。",
      },
    },
    q: {
      sunLight: { q: "太陽の光が地球に届くまでどれくらいかかりますか？", o: ["約8分", "約8秒", "約8時間"], e: "約8分20秒です。太陽は1億5000万キロメートル離れていて、光は1秒に約30万キロメートル進みます。" },
      sunEnergy: { q: "太陽のエネルギーはどこから来ますか？", o: ["中心部で水素がヘリウムに融合すること", "石炭やガスが燃えること", "ほかの星の光"], e: "太陽の中心部では水素の原子核が融合してヘリウムになります。これが核融合で、そのとき輝くエネルギーが生まれます。" },
      sunOrbits: { you: "生まれてから、あなたは地球とともに太陽のまわりを何周しましたか？", ref: "30歳の人は、太陽のまわりを何周していますか？", e: (n) => `${n}周です。地球は1年に1回太陽のまわりを回り、あなたもいっしょに旅しています。` },
      venusDay: { q: "1日が1年より長いのはどの惑星ですか？", o: ["金星", "水星", "火星"], e: "金星はとてもゆっくり自転していて、1回の自転に太陽を1周するより長い時間がかかります。" },
      marsAge: { you: "火星では、あなたは何歳ですか？", ref: "30歳の人は、火星では何歳ですか？", e: (n) => `${n}歳です。火星の1年は地球の1.88年なので、誕生日が少なくなります。` },
      closest: { q: "太陽にいちばん近い惑星はどれですか？", o: ["水星", "金星", "地球"], e: "水星で、距離は0.39 auです。88日で太陽を1周します。" },
      largest: { q: "いちばん大きな惑星はどれですか？", o: ["木星", "土星", "海王星"], e: "木星です。直径に地球が約11個並びます。" },
      saturnDensity: { q: "水より密度が小さい惑星はどれですか？", o: ["土星", "木星", "天王星"], e: "土星です。平均密度が水より小さいのです。" },
      jupiterLaps: { you: "あなたが生まれてから、木星は太陽のまわりを何周しましたか？", ref: "30年のあいだに、木星は太陽のまわりを何周しますか？", e: (n) => `${n}周です。木星の1年は地球の約12年です。` },
      largestMoon: { q: "太陽系でいちばん大きな衛星はどれですか？", o: ["ガニメデ", "月", "エウロパ"], e: "木星の衛星ガニメデです。惑星の水星より大きいのです。" },
      galileo: { q: "1610年に木星の4つの大きな衛星を発見したのはだれですか？", o: ["ガリレオ・ガリレイ", "アイザック・ニュートン", "ヨハネス・ケプラー"], e: "初期の望遠鏡を使ったガリレオ・ガリレイです。これらはガリレオ衛星と呼ばれます。" },
      sameSide: { q: "なぜ月はいつも同じ面を地球に向けているのですか？", o: ["1周するあいだにちょうど1回自転するから", "まったく自転していないから", "裏側はいつも暗いから"], e: "月は地球を1周するあいだに1回自転するので、いつも同じ面がこちらを向いています。裏側にも太陽の光は当たります。" },
      moonLaps: { you: "あなたが生まれてから、月は地球のまわりを約何周しましたか？", ref: "30年のあいだに、月は地球のまわりを約何周しますか？", e: (n) => `約${n}周です。1周は27.3日です。` },
      neptune: { q: "海王星は太陽からおよそどれくらい離れていますか？", o: ["30 au", "3 au", "300 au"], e: "約30 auで、地球の30倍の距離です。太陽の光が届くまで約4時間かかります。" },
      starLight: { you: (name) => `あなたの星${name}の光は、あなたに届くまで何年旅しましたか？`, e: (n, name) => `約${n}年です。${name}までは約${n}光年で、1光年は光が1年に進む距離です。` },
      proximaLight: { q: "太陽の次に近い恒星プロキシマ・ケンタウリの光は、私たちに届くまでどれくらいかかりますか？", o: ["約4.2年", "約4.2日", "約42年"], e: "約4.2年です。プロキシマ・ケンタウリまでは4.24光年です。" },
      sunSize: { q: "太陽の直径には、地球がおよそいくつ並びますか？", o: ["約109個", "約11個", "約1000個"], e: "約109個です。太陽の半径は地球の約109倍です。" },
    },
  },
  bg: {
    path: {
      title: "Нашата Слънчева система",
      goal: "Можеш да обясниш как е устроена Слънчевата система и да различаваш основните ѝ тела.",
      meta: (m) => `около ${m} минути · за начинаещи`,
      rule: "5 стъпки, после финален тест с 10 въпроса; издържан от 80 %.",
    },
    status: { done: "Готово", next: "Следва", open: "Предстои", locked: "Първо всички стъпки" },
    back: "Всички стъпки", stepOf: (n, all) => `Стъпка ${n} от ${all}`, goalLabel: "Цел", forYou: "За теб", example: "Пример",
    taskLabel: "В 3D изгледа", taskGo: "Покажи в 3D", taskDone: "Готово", check: "Провери какво разбра", right: "Вярно.", wrong: "Не съвсем.",
    stepDone: (xp) => `Стъпката е готова · +${xp} XP`, nextStep: "Следваща стъпка", toTest: "Към финалния тест",
    needTask: "Направи и задачата в 3D изгледа и стъпката е готова.", progress: (d, all) => `${d} от ${all} стъпки`,
    test: {
      title: "Финален тест", intro: (n, p) => `${n} въпроса от всички стъпки, някои с твоите собствени числа. Издържан от ${p} %.`,
      locked: "Първо завърши всичките пет стъпки.", evaluate: "Провери отговорите", score: (r, n, p) => `${r} от ${n} верни (${p} %)`,
      passed: (xp) => `Издържан · +${xp} XP и нова значка`, failed: "Още не е издържан. Прочети обясненията и опитай отново.",
      retry: "Опитай отново", best: (p) => `Най-добър резултат: ${p} %`, answerAll: "Първо отговори на всички въпроси.",
    },
    steps: {
      sun: {
        title: "Слънцето", goal: "Можеш да кажеш какво е Слънцето и откъде идва енергията му.",
        text: [
          "Слънцето е звезда: кълбо от горещ газ, толкова голямо, че в диаметъра му се нареждат около 109 Земи. В него е събрана над 99 % от цялата маса на Слънчевата система.",
          "В ядрото му водородът се слива в хелий. Така се освобождава енергията, която достига до нас като светлина и топлина, от около 150 милиона километра.",
        ],
        task: "Полети до Слънцето и го разгледай отблизо.",
        you: (n) => `Светлината, която пада върху теб сега, е напуснала Слънцето преди около 8 минути и 20 секунди. От раждането ти Земята те е пренесла около него ${n} пъти.`,
        ref: (n) => `Светлината, която пада върху теб сега, е напуснала Слънцето преди около 8 минути и 20 секунди. Човек на 30 години вече е пренесен от Земята около него ${n} пъти.`,
      },
      inner: {
        title: "Вътрешните планети", goal: "Можеш да назовеш и различиш четирите скалисти планети.",
        text: [
          "Меркурий, Венера, Земята и Марс са скалистите планети: малки, с твърда повърхност. Меркурий е най-близо до Слънцето, Венера е най-горещата, защото плътната ѝ атмосфера от въглероден диоксид задържа топлината.",
          "На Марс е най-високият известен вулкан, Олимп, около два пъти и половина по-висок от Еверест. Денят на Венера е по-дълъг от нейната година.",
        ],
        task: "Полети до Марс и го сравни със Земята.",
        you: (mars, mercury) => `На Марс щеше да си на ${mars}, на Меркурий на ${mercury}: годината там е по-дълга или по-къса от нашата.`,
        ref: (mars, mercury) => `Човек на 30 години щеше да е на ${mars} на Марс и на ${mercury} на Меркурий: годината там е по-дълга или по-къса от нашата.`,
      },
      outer: {
        title: "Външните планети", goal: "Можеш да различаваш газовите гиганти от ледените гиганти.",
        text: [
          "Юпитер и Сатурн са газови гиганти, главно от водород и хелий, а Уран и Нептун са ледени гиганти. Никой от тях няма твърда повърхност като Земята.",
          "Юпитер има повече от два пъти масата на всички други планети взети заедно. Сатурн е толкова лек за размера си, че плътността му е по-малка от тази на водата.",
        ],
        task: "Полети до Сатурн и разгледай пръстените му.",
        you: (n) => `От раждането ти Юпитер е обиколил Слънцето само ${n} пъти: една негова година трае почти 12 наши.`,
        ref: (n) => `За 30 години Юпитер обикаля Слънцето само ${n} пъти: една негова година трае почти 12 наши.`,
      },
      moons: {
        title: "Луни", goal: "Знаеш какво е луна и защо Луната винаги ни показва една и съща страна.",
        text: [
          "Една луна обикаля около планета. Земята има една, Юпитер десетки, а четирите най-големи от тях открива Галилео Галилей през 1610 г. с един от първите телескопи.",
          "Повечето големи луни се завъртат точно веднъж около себе си при всяка обиколка и затова винаги са обърнати към планетата си с една и съща страна. Затова от Земята никога не виждаме обратната страна на Луната.",
        ],
        task: "Полети до Юпитер и щракни върху една от четирите му големи луни.",
        you: (n) => `От раждането ти Луната е обиколила Земята около ${n} пъти.`,
        ref: (n) => `За 30 години Луната обикаля Земята около ${n} пъти.`,
      },
      scale: {
        title: "Мащаб и разстояния", goal: "Можеш да опишеш колко голяма и колко празна е Слънчевата система.",
        text: [
          "Слънчевата система е предимно празно пространство. Разстоянието от Земята до Слънцето, 150 милиона километра, се нарича астрономическа единица (а.е.). Нептун, най-външната планета, е на около 30 а.е. от Слънцето.",
          "Светлината на Слънцето пътува малко над 8 минути до Земята и около 4 часа до Нептун. В истинския мащаб на 3D изгледа планетите стават мънички точки в огромно пространство.",
        ],
        task: "Включи истинския мащаб и виж колко далеч една от друга са планетите.",
        you: (name, dist, year) => `Светлината на твоята звезда, ${name}, която пристига днес, е тръгнала около ${year} г., приблизително в годината на раждането ти. Пътувала е ${dist} светлинни години.`,
        ref: "Светлината на най-близката звезда, Проксима Кентавър, пътува 4,2 години до нас. Въведи годината си на раждане в „Ти в космоса“ и намери звездата, чиято светлина е тръгнала при раждането ти.",
      },
    },
    q: {
      sunLight: { q: "Колко време пътува слънчевата светлина до Земята?", o: ["Около 8 минути", "Около 8 секунди", "Около 8 часа"], e: "Около 8 минути и 20 секунди: Слънцето е на 150 милиона километра, а светлината изминава около 300 000 километра в секунда." },
      sunEnergy: { q: "Откъде идва енергията на Слънцето?", o: ["Водородът в ядрото му се слива в хелий", "Изгаря въглища и газ", "От светлината на други звезди"], e: "В ядрото на Слънцето водородните ядра се сливат в хелий. Това е ядрен синтез; при него се освобождава енергията, която свети." },
      sunOrbits: { you: "Колко пъти Земята те е пренесла около Слънцето от раждането ти?", ref: "Колко пъти Земята е пренесла около Слънцето човек на 30 години?", e: (n) => `${n} пъти: Земята обикаля Слънцето веднъж годишно, а ти пътуваш с нея.` },
      venusDay: { q: "На коя планета денят е по-дълъг от годината?", o: ["Венера", "Меркурий", "Марс"], e: "Венера се върти много бавно: едно завъртане трае по-дълго от една обиколка около Слънцето." },
      marsAge: { you: "На колко години щеше да си на Марс?", ref: "На колко години щеше да е на Марс човек на 30?", e: (n) => `${n}: годината на Марс трае 1,88 земни години, така че там рождените дни са по-редки.` },
      closest: { q: "Коя планета е най-близо до Слънцето?", o: ["Меркурий", "Венера", "Земята"], e: "Меркурий, на 0,39 а.е. Обикаля Слънцето за 88 дни." },
      largest: { q: "Коя е най-голямата планета?", o: ["Юпитер", "Сатурн", "Нептун"], e: "Юпитер: в диаметъра му се нареждат около 11 Земи." },
      saturnDensity: { q: "Коя планета е с по-малка плътност от водата?", o: ["Сатурн", "Юпитер", "Уран"], e: "Сатурн: средната му плътност е по-малка от тази на водата." },
      jupiterLaps: { you: "Колко пъти Юпитер е обиколил Слънцето от раждането ти?", ref: "Колко пъти Юпитер обикаля Слънцето за 30 години?", e: (n) => `${n} пъти: една година на Юпитер трае почти 12 земни години.` },
      largestMoon: { q: "Коя е най-голямата луна в Слънчевата система?", o: ["Ганимед", "Нашата Луна", "Европа"], e: "Ганимед, луна на Юпитер: тя е дори по-голяма от планетата Меркурий." },
      galileo: { q: "Кой откри четирите големи луни на Юпитер през 1610 г.?", o: ["Галилео Галилей", "Исак Нютон", "Йоханес Кеплер"], e: "Галилео Галилей, с един от първите телескопи. Наричат ги Галилееви луни." },
      sameSide: { q: "Защо винаги виждаме една и съща страна на Луната?", o: ["Завърта се точно веднъж при всяка обиколка", "Изобщо не се върти", "Другата страна е винаги тъмна"], e: "Луната се завърта веднъж около себе си при всяка обиколка около Земята, затова към нас винаги е обърната една и съща страна. Обратната страна също получава слънчева светлина." },
      moonLaps: { you: "Около колко пъти Луната е обиколила Земята от раждането ти?", ref: "Около колко пъти Луната обикаля Земята за 30 години?", e: (n) => `Около ${n} пъти: една обиколка трае 27,3 дни.` },
      neptune: { q: "Приблизително колко далеч е Нептун от Слънцето?", o: ["30 а.е.", "3 а.е.", "300 а.е."], e: "Около 30 а.е., 30 пъти по-далеч от Земята. Слънчевата светлина пътува около 4 часа дотам." },
      starLight: { you: (name) => `Колко години е пътувала светлината на твоята звезда, ${name}, до теб?`, e: (n, name) => `Около ${n} години: ${name} е на около ${n} светлинни години, а светлинна година е разстоянието, което светлината изминава за една година.` },
      proximaLight: { q: "Колко време пътува до нас светлината на Проксима Кентавър, най-близката звезда след Слънцето?", o: ["Около 4,2 години", "Около 4,2 дни", "Около 42 години"], e: "Около 4,2 години: Проксима Кентавър е на 4,24 светлинни години." },
      sunSize: { q: "Около колко Земи се нареждат в диаметъра на Слънцето?", o: ["Около 109", "Около 11", "Около 1000"], e: "Около 109: радиусът на Слънцето е около 109 пъти по-голям от този на Земята." },
    },
  },
};

// The personal sentence of a step, in the language of the page.
export function personalLine(step, nums, lang) {
  const s = (LEARN_TEXT[lang] ?? LEARN_TEXT.en).steps[step];
  const fmt = (x, d = 0) => x.toLocaleString(lang, { maximumFractionDigits: d, minimumFractionDigits: d });
  if (step === "sun") return (nums.you ? s.you : s.ref)(fmt(nums.orbits));
  if (step === "inner") return (nums.you ? s.you : s.ref)(fmt(nums.mars), fmt(nums.mercury));
  if (step === "outer") return (nums.you ? s.you : s.ref)(fmt(nums.jupiterLaps));
  if (step === "moons") return (nums.you ? s.you : s.ref)(fmt(nums.moonLaps));
  return nums.star ? s.you(nums.star.name, fmt(nums.star.dist, 1), nums.star.year) : s.ref;
}

// The area Learn: the path with its steps, a step, or the final test. personal(): the context of personalNumbers; act(task): do a task
// (TASKS) in the 3D view; closePanel(): close My Universe.
export function initLearn({ getLang, explorer, personal, act, closePanel }) {
  const t = () => LEARN_TEXT[getLang()] ?? LEARN_TEXT.en;
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
  const PATH = "solar";
  let view = "path"; // "path", a step, or "test"
  const answers = {}; // step -> question -> the label chosen last (for this visit)
  let attempt = 0;
  let testChosen = {};
  let testChecked = false;

  const total = () => explorer.getState().total ?? {};
  const has = (list, id) => (total()[list] ?? []).includes(id);
  const stepDone = (step) => has("learnSteps", `${PATH}/${step}`);
  const taskDone = (step) => has("learnTasks", `${PATH}/${step}`);
  const steps = PATHS[PATH].steps;
  const doneCount = () => steps.filter(stepDone).length;
  const best = () => total()[`learnBest:${PATH}`] ?? 0;
  const pathPassed = () => has("learnPaths", PATH);
  const nums = () => personalNumbers(personal());

  // a small picture for each step, from the same drawings as the rest of My Universe
  const pictureOf = (step) =>
    step === "sun" ? starCanvas(5772, "uni-orb small star", 28)
    : planetCanvas({ name: { inner: "Mars", outer: "Saturn", moons: "Moon", scale: "Neptune" }[step] }, "uni-orb small", 28);
  const statusIcon = (glyph) => {
    const i = el("i", "uni-orb small icon learn-status", glyph);
    i.setAttribute("aria-hidden", "true");
    return i;
  };

  // a step counts as done once: its task done and every question answered right
  function maybeFinish(step, questions) {
    if (stepDone(step) || !taskDone(step)) return;
    if (!questions.every((q) => answers[step]?.[q.id] === q.answer)) return;
    explorer.emit("learnStep", `${PATH}/${step}`);
    track(`learn-step-${step}`);
  }

  function pathView(onChange) {
    const tx = t();
    const card = el("div", "learn-path");
    const head = el("div", "learn-path-head");
    const text = el("div", "");
    text.append(el("strong", "", tx.path.title), el("p", "", tx.path.goal), el("small", "", `${tx.path.meta(PATHS[PATH].minutes)} · ${tx.progress(doneCount(), steps.length)}`));
    head.append(planetCanvas({ name: "Saturn" }, "learn-path-pic", 64), text);
    const bar = el("div", "uni-bar");
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", String(steps.length));
    bar.setAttribute("aria-valuenow", String(doneCount()));
    bar.setAttribute("aria-label", tx.progress(doneCount(), steps.length));
    const fill = el("i", "");
    fill.style.width = `${Math.max(2, (doneCount() / steps.length) * 100)}%`;
    bar.append(fill);
    card.append(head, bar, el("p", "hint", tx.path.rule));
    const list = el("div", "uni-list");
    const firstOpen = steps.find((s) => !stepDone(s));
    steps.forEach((step, i) => {
      const s = tx.steps[step];
      const state = stepDone(step) ? tx.status.done : step === firstOpen ? tx.status.next : tx.status.open;
      const row = el("button", `uni-item learn-step${stepDone(step) ? " done" : ""}${step === firstOpen ? " next" : ""}`);
      row.type = "button";
      const t2 = el("span", "uni-item-text");
      t2.append(el("strong", "", `${i + 1}. ${s.title}`), el("small", "", `${state} · ${s.goal}`));
      const arrow = el("span", "uni-arrow", stepDone(step) ? "✓" : "›");
      arrow.setAttribute("aria-hidden", "true");
      row.append(pictureOf(step), t2, arrow);
      row.addEventListener("click", () => ((view = step), track(`learn-open-${step}`), onChange?.()));
      list.append(row);
    });
    // the final test, open when all steps are done
    const open = doneCount() === steps.length;
    const testRow = el("button", `uni-item learn-step${pathPassed() ? " done" : ""}`);
    testRow.type = "button";
    testRow.disabled = !open;
    const tt = el("span", "uni-item-text");
    tt.append(el("strong", "", `${steps.length + 1}. ${tx.test.title}`), el("small", "", !open ? tx.status.locked : best() ? tx.test.best(best()) : tx.test.intro(PATHS[PATH].testSize, PATHS[PATH].pass * 100)));
    testRow.append(statusIcon(pathPassed() ? "★" : "?"), tt, el("span", "uni-arrow", open ? "›" : ""));
    if (open) testRow.addEventListener("click", () => ((view = "test"), onChange?.()));
    list.append(testRow);
    return [card, list];
  }

  function questionBlock(q, chosen, onPick, reveal) {
    const box = el("div", "learn-q");
    box.append(el("p", "learn-q-text", q.text));
    const options = el("div", "learn-options");
    for (const label of q.options) {
      const b = button(label, "learn-option", () => onPick(label));
      if (chosen === label) b.classList.add(reveal ? (label === q.answer ? "right" : "wrong") : "chosen");
      if (reveal && chosen && chosen !== q.answer && label === q.answer) b.classList.add("answer");
      b.setAttribute("aria-pressed", String(chosen === label));
      options.append(b);
    }
    box.append(options);
    if (reveal && chosen) {
      const ok = chosen === q.answer;
      const f = el("p", `learn-feedback ${ok ? "right" : "wrong"}`);
      f.append(el("strong", "", ok ? t().right : t().wrong), ` ${q.explain}`);
      f.setAttribute("role", "status");
      box.append(f);
    }
    return box;
  }

  function stepView(step, onChange) {
    const tx = t();
    const s = tx.steps[step];
    const n = nums();
    const questions = buildQuestions(step, n, getLang());
    const parts = [];
    parts.push(button(`‹ ${tx.back}`, "uni-link learn-back", () => ((view = "path"), onChange?.())));
    const head = el("div", "learn-step-head");
    const ht = el("div", "");
    ht.append(el("small", "", tx.stepOf(steps.indexOf(step) + 1, steps.length)), el("h3", "learn-title", s.title));
    head.append(pictureOf(step), ht);
    parts.push(head);
    const goal = el("p", "learn-goal");
    goal.append(el("strong", "", `${tx.goalLabel}: `), s.goal);
    parts.push(goal);
    // what it means for the visitor: their own numbers, or an example
    const you = el("div", "learn-you");
    you.append(el("small", "", n.you || (step === "scale" && n.star) ? tx.forYou : tx.example), el("p", "", personalLine(step, n, getLang())));
    parts.push(you);
    for (const p of s.text) parts.push(el("p", "learn-text", p));
    // the task in the 3D view
    const task = el("div", `learn-task${taskDone(step) ? " done" : ""}`);
    const tt = el("div", "");
    tt.append(el("small", "", tx.taskLabel), el("p", "", s.task));
    task.append(
      tt,
      button(taskDone(step) ? `✓ ${tx.taskDone}` : tx.taskGo, taskDone(step) ? "uni-link" : "uni-primary", () => {
        explorer.emit("learnTask", `${PATH}/${step}`);
        maybeFinish(step, questions);
        track(`learn-task-${step}`);
        closePanel?.();
        act(TASKS[step]);
      })
    );
    parts.push(task);
    // the questions: an answer can be changed until it is right; the explanation comes with every answer
    parts.push(el("h3", "learn-check", tx.check));
    for (const q of questions)
      parts.push(
        questionBlock(q, answers[step]?.[q.id], (label) => {
          if (answers[step]?.[q.id] === q.answer) return; // a right answer stays
          (answers[step] ??= {})[q.id] = label;
          maybeFinish(step, questions);
          onChange?.();
        }, true)
      );
    // done, or what is still missing
    const allRight = questions.every((q) => answers[step]?.[q.id] === q.answer);
    if (stepDone(step)) {
      const done = el("div", "learn-done");
      const next = steps[steps.indexOf(step) + 1];
      done.append(el("strong", "", tx.stepDone(XP_LEARN.step)));
      done.append(
        next
          ? button(tx.nextStep, "uni-primary", () => ((view = next), onChange?.()))
          : button(tx.toTest, "uni-primary", () => ((view = doneCount() === steps.length ? "test" : "path"), onChange?.()))
      );
      parts.push(done);
    } else if (allRight && !taskDone(step)) parts.push(el("p", "hint learn-missing", tx.needTask));
    return parts;
  }

  function testView(onChange) {
    const tx = t();
    const n = nums();
    const questions = testQuestions(PATH, n, getLang(), attempt);
    const parts = [button(`‹ ${tx.back}`, "uni-link learn-back", () => ((view = "path"), onChange?.()))];
    parts.push(el("h3", "learn-title", tx.test.title), el("p", "learn-text", tx.test.intro(questions.length, PATHS[PATH].pass * 100)));
    for (const q of questions)
      parts.push(
        questionBlock(q, testChosen[q.id], (label) => {
          if (testChecked) return;
          testChosen[q.id] = label;
          onChange?.();
        }, testChecked)
      );
    if (!testChecked) {
      const all = questions.every((q) => testChosen[q.id]);
      const go = button(tx.test.evaluate, "uni-primary", () => {
        if (!all) return;
        testChecked = true;
        const right = questions.filter((q) => testChosen[q.id] === q.answer).length;
        const pct = Math.round((right / questions.length) * 100);
        explorer.update((st) => {
          st.total[`learnBest:${PATH}`] = Math.max(st.total[`learnBest:${PATH}`] ?? 0, pct);
        });
        track(`learn-test-${pct >= PATHS[PATH].pass * 100 ? "passed" : "failed"}`);
        if (passed(right, questions.length, PATH)) explorer.emit("learnPath", PATH);
        onChange?.();
      });
      go.disabled = !all;
      const row = el("div", "uni-actions");
      row.append(go);
      if (!all) row.append(el("span", "hint", tx.test.answerAll));
      parts.push(row);
      return parts;
    }
    const right = questions.filter((q) => testChosen[q.id] === q.answer).length;
    const pct = Math.round((right / questions.length) * 100);
    const result = el("div", `learn-done${passed(right, questions.length, PATH) ? "" : " failed"}`);
    result.append(el("strong", "", tx.test.score(right, questions.length, pct)), el("p", "", passed(right, questions.length, PATH) ? tx.test.passed(XP_LEARN.path) : tx.test.failed));
    result.append(
      button(tx.test.retry, passed(right, questions.length, PATH) ? "uni-link" : "uni-primary", () => {
        attempt += 1;
        testChosen = {};
        testChecked = false;
        onChange?.();
      })
    );
    parts.push(result);
    return parts;
  }

  // the nodes of the area: the path (with `overview` true, so that the rest of Learn shows below it), a step, or the test
  function area(onChange) {
    if (view === "test") return { nodes: testView(onChange), overview: false };
    if (steps.includes(view)) return { nodes: stepView(view, onChange), overview: false };
    return { nodes: pathView(onChange), overview: true };
  }
  return { area, progress: () => ({ done: doneCount(), all: steps.length, passed: pathPassed() }) };
}
