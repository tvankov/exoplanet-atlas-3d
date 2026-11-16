// The moons of the 3D view: the Earth's Moon and the four large moons of Jupiter, which Galileo Galilei found in January 1610.
// The numbers of Jupiter's moons are those of the NASA Jovian Satellite Fact Sheet (D. R. Williams, NSSDCA, last updated 6 December 2023):
// the distance from Jupiter (the semi-major axis of the orbit), the time of one orbit and the radius. The Moon's numbers are those of JPL
// (Solar System Dynamics: the mean elements of the planetary satellites, and the mean radius from their physical parameters). Every one of these
// moons turns once per orbit and so shows its planet always the same side (the fact sheet: "synchronous rotation"), and the 3D view turns
// it that way. The surface maps: the Moon NASA SVS (CGI Moon Kit, Lunar Reconnaissance Orbiter), Jupiter's moons global mosaics of the USGS
// (src/build_moon_textures.py). tests/moons.test.mjs checks the numbers against each other with Kepler's third law.

export const MOONS = {
  Earth: [{ id: "Moon", km: 384400, days: 27.322, radiusKm: 1737.4, texture: "textures/moon.jpg", map: "moon", orbit: 2.6 }],
  Jupiter: [
    { id: "Io", km: 421800, days: 1.769138, radiusKm: 1821.5, texture: "textures/io.jpg", map: "colour" },
    { id: "Europa", km: 671100, days: 3.551181, radiusKm: 1560.8, texture: "textures/europa.jpg", map: "grey" },
    { id: "Ganymede", km: 1070400, days: 7.154553, radiusKm: 2631.2, texture: "textures/ganymede.jpg", map: "grey" },
    { id: "Callisto", km: 1882700, days: 16.689017, radiusKm: 2410.3, texture: "textures/callisto.jpg", map: "grey" },
  ],
};

export const EARTH_RADIUS_KM = 6371; // the mean radius; a planet's radius in the map is in these units

// How a moon is drawn round a planet of `planetRadius` Earth radii, in radii of the planet: its size (real), its distance in the real scale
// (real) and in the explanation mode (squeezed like the distances of the planets: 1 + 0.45 times the root of the real one, or the distance
// the Moon had before, 2.6), and its orbit in years.
export function moonScale(moon, planetRadius) {
  const unit = planetRadius * EARTH_RADIUS_KM;
  const real = moon.km / unit;
  return { size: moon.radiusKm / unit, real, orbit: moon.orbit ?? 1 + 0.45 * Math.sqrt(real), years: moon.days / 365.25 };
}

export const MOON_TEXT = {
  en: {
    names: { Moon: "Moon", Io: "Io", Europa: "Europa", Ganymede: "Ganymede", Callisto: "Callisto" },
    planet: { Earth: { name: "the Earth", radius: "the Earth's radius" }, Jupiter: { name: "Jupiter", radius: "Jupiter's radius" } },
    blurb: {
      Moon: "The Moon is the only world besides the Earth that people have walked on: twelve astronauts between 1969 and 1972.",
      Io: "Io is the most volcanic place in the Solar System: hundreds of volcanoes, some throwing sulphur hundreds of kilometres high. The heat comes from the tides that Jupiter and the neighbouring moons raise inside it.",
      Europa: "Europa is covered by a crust of ice. Measurements of the Galileo spacecraft point to an ocean of salt water underneath, which makes it one of the most promising places to look for life beyond the Earth.",
      Ganymede: "Ganymede is the largest moon of the Solar System, larger than the planet Mercury, and the only moon known to have a magnetic field of its own.",
      Callisto: "Callisto is covered with craters like hardly any other body: its surface has barely changed for about four billion years.",
    },
    facts: (r, d, x, days, p) => `Radius ${r} km. ${d} km from ${p.name} (${x} times ${p.radius}), one orbit takes ${days} days. It turns once per orbit and so always shows ${p.name} the same side.`,
    galileo: "Galileo Galilei discovered it in January 1610 with one of the first telescopes, together with Jupiter's three other large moons.",
    shown: "In the 3D view its size is real; its distance is squeezed (in the real scale it is real), and its place on the orbit is not today's.",
    map: {
      moon: "The map: NASA Scientific Visualization Studio, from the Lunar Reconnaissance Orbiter.",
      colour: "The map (USGS, from pictures of Voyager and Galileo) is in colour.",
      grey: "The map (USGS, from pictures of Voyager and Galileo) is grey. Where it is plain grey near the poles there are no pictures: that part is not measured but filled with the average grey.",
    },
    source: { Earth: "Numbers: NASA/JPL.", Jupiter: "Numbers: NASA, Jovian Satellite Fact Sheet (2023)." },
  },
  de: {
    names: { Moon: "Mond", Io: "Io", Europa: "Europa", Ganymede: "Ganymed", Callisto: "Kallisto" },
    planet: { Earth: { name: "der Erde", radius: "Erdradius" }, Jupiter: { name: "Jupiter", radius: "Jupiterradius" } },
    blurb: {
      Moon: "Der Mond ist neben der Erde die einzige Welt, die Menschen betreten haben: zwölf Astronauten zwischen 1969 und 1972.",
      Io: "Io ist der vulkanreichste Ort im Sonnensystem: Hunderte Vulkane, manche schleudern Schwefel Hunderte Kilometer hoch. Die Hitze kommt von den Gezeiten, die Jupiter und die Nachbarmonde in seinem Inneren erzeugen.",
      Europa: "Europa ist von einer Eiskruste bedeckt. Messungen der Raumsonde Galileo deuten auf einen Ozean aus Salzwasser darunter hin. Damit ist Europa einer der aussichtsreichsten Orte für die Suche nach Leben jenseits der Erde.",
      Ganymede: "Ganymed ist der größte Mond des Sonnensystems, größer als der Planet Merkur, und der einzige bekannte Mond mit einem eigenen Magnetfeld.",
      Callisto: "Kallisto ist so dicht mit Kratern bedeckt wie kaum ein anderer Körper: Seine Oberfläche hat sich seit etwa vier Milliarden Jahren kaum verändert.",
    },
    facts: (r, d, x, days, p) => `Radius ${r} km. ${d} km von ${p.name} entfernt (das ${x}-Fache des ${p.radius}), ein Umlauf dauert ${days} Tage. Bei jedem Umlauf dreht sich dieser Mond einmal um sich selbst und zeigt ${p.name} deshalb immer dieselbe Seite.`,
    galileo: "Galileo Galilei entdeckte diesen Mond im Januar 1610 mit einem der ersten Fernrohre, zusammen mit den drei anderen großen Monden des Jupiter.",
    shown: "In der 3D-Ansicht ist die Größe echt, der Abstand ist gestaucht (im echten Maßstab stimmt er), und die Stelle auf der Bahn ist nicht die heutige.",
    map: {
      moon: "Die Karte: NASA Scientific Visualization Studio, aus Daten des Lunar Reconnaissance Orbiter.",
      colour: "Die Karte (USGS, aus Bildern von Voyager und Galileo) ist in Farbe.",
      grey: "Die Karte (USGS, aus Bildern von Voyager und Galileo) ist grau. Wo sie nahe den Polen einfarbig grau ist, gibt es keine Aufnahmen: Diese Fläche ist nicht gemessen, sondern mit dem mittleren Grau gefüllt.",
    },
    source: { Earth: "Zahlen: NASA/JPL.", Jupiter: "Zahlen: NASA, Jovian Satellite Fact Sheet (2023)." },
  },
  ja: {
    names: { Moon: "月", Io: "イオ", Europa: "エウロパ", Ganymede: "ガニメデ", Callisto: "カリスト" },
    planet: { Earth: { name: "地球", radius: "地球の半径" }, Jupiter: { name: "木星", radius: "木星の半径" } },
    blurb: {
      Moon: "月は、地球のほかに人類が歩いたことのある唯一の天体です。1969年から1972年までに12人の宇宙飛行士が降り立ちました。",
      Io: "イオは太陽系でもっとも火山活動が活発な天体です。数百の火山があり、硫黄を数百キロメートルの高さまで噴き上げるものもあります。その熱は、木星と隣の衛星が内部に起こす潮汐から生まれます。",
      Europa: "エウロパは氷の地殻におおわれています。探査機ガリレオの観測から、その下に塩水の海があると考えられており、地球の外で生命を探すうえでもっとも有望な場所のひとつです。",
      Ganymede: "ガニメデは太陽系最大の衛星で、惑星の水星より大きく、自身の磁場をもつことが知られている唯一の衛星です。",
      Callisto: "カリストは、ほかに例がないほどクレーターにおおわれています。その表面は約40億年のあいだほとんど変わっていません。",
    },
    facts: (r, d, x, days, p) => `半径${r} km。${p.name}から${d} km（${p.radius}の${x}倍）の距離にあり、${days}日で1周します。1周するあいだに1回自転するため、いつも${p.name}に同じ面を向けています。`,
    galileo: "1610年1月、ガリレオ・ガリレイが初期の望遠鏡で、木星のほかの3つの大きな衛星とともに発見しました。",
    shown: "3D表示では大きさは実際どおりですが、距離は縮めてあり（実寸表示では実際どおり）、軌道上の位置は今日の実際の位置ではありません。",
    map: {
      moon: "地図：NASAサイエンティフィック・ビジュアライゼーション・スタジオ、ルナー・リコネサンス・オービターのデータから。",
      colour: "地図（USGS、ボイジャーとガリレオの画像から作成）はカラーです。",
      grey: "地図（USGS、ボイジャーとガリレオの画像から作成）は白黒です。極の近くで一様な灰色になっている部分は撮影されておらず、測定値ではなく平均の灰色で埋めています。",
    },
    source: { Earth: "数値：NASA/JPL。", Jupiter: "数値：NASA、Jovian Satellite Fact Sheet（2023年）。" },
  },
  bg: {
    names: { Moon: "Луната", Io: "Йо", Europa: "Европа", Ganymede: "Ганимед", Callisto: "Калисто" },
    planet: { Earth: { name: "Земята", radius: "на Земята" }, Jupiter: { name: "Юпитер", radius: "на Юпитер" } },
    blurb: {
      Moon: "Луната е единственият свят освен Земята, по който са ходили хора: дванадесет астронавти между 1969 и 1972 г.",
      Io: "Йо е мястото с най-много вулкани в Слънчевата система: стотици вулкани, някои изхвърлят сяра на стотици километри височина. Топлината идва от приливите, които Юпитер и съседните луни предизвикват във вътрешността ѝ.",
      Europa: "Европа е покрита с ледена кора. Измерванията на сондата „Галилео“ сочат, че под нея има океан от солена вода, затова тя е едно от най-обещаващите места за търсене на живот извън Земята.",
      Ganymede: "Ганимед е най-голямата луна в Слънчевата система, по-голяма от планетата Меркурий, и единствената известна луна със собствено магнитно поле.",
      Callisto: "Калисто е покрита с кратери като почти никое друго тяло: повърхността ѝ почти не се е променила от около четири милиарда години.",
    },
    facts: (r, d, x, days, p) => `Радиус ${r} км. На ${d} км от ${p.name} (${x} пъти радиуса ${p.radius}), една обиколка трае ${days} дни. При всяка обиколка тази луна се завърта веднъж около себе си и затова винаги е обърната към ${p.name} с една и съща страна.`,
    galileo: "Галилео Галилей откри тази луна през януари 1610 г. с един от първите телескопи, заедно с другите три големи луни на Юпитер.",
    shown: "В 3D изгледа размерът е истински, разстоянието е съкратено (в истинския мащаб е вярно), а мястото по орбитата не е днешното.",
    map: {
      moon: "Картата: NASA Scientific Visualization Studio, от данни на Lunar Reconnaissance Orbiter.",
      colour: "Картата (USGS, от снимки на „Вояджър“ и „Галилео“) е цветна.",
      grey: "Картата (USGS, от снимки на „Вояджър“ и „Галилео“) е черно-бяла. Където близо до полюсите е равномерно сива, няма снимки: тази част не е измерена, а е запълнена със средното сиво.",
    },
    source: { Earth: "Данни: NASA/JPL.", Jupiter: "Данни: NASA, Jovian Satellite Fact Sheet (2023)." },
  },
};

export const moonName = (id, lang) => (MOON_TEXT[lang] ?? MOON_TEXT.en).names[id] ?? id;

// The turn of a moon about its axis for an angle m on its orbit (its place: cos m, 0, sin m times its distance), such that the middle of
// its map (longitude 0) faces the planet. On a sphere of three.js the column u of a map lies in the direction (-cos 2 pi u, sin 2 pi u),
// the middle (u = 0.5) along +x; turned by -m - pi about the axis it points to (-cos m, -sin m), at the planet.
export const facingRotation = (m) => -m - Math.PI;

// The text of the info panel of a moon: what it is, its numbers, who found it, how the 3D view shows it, the map and the source.
export function moonStory(moon, planetName, lang) {
  const t = MOON_TEXT[lang] ?? MOON_TEXT.en;
  const num = (x, d = 0) => x.toLocaleString(lang, { maximumFractionDigits: d, minimumFractionDigits: d });
  return [
    t.blurb[moon.id],
    t.facts(num(moon.radiusKm), num(moon.km), num(moon.km / TEXT_RADIUS_KM[planetName], 1), num(moon.days, 2), t.planet[planetName]),
    planetName === "Jupiter" ? t.galileo : null,
    t.shown,
    t.map[moon.map],
    t.source[planetName],
  ].filter(Boolean);
}
// "x times its radius" in the text: for Jupiter the equatorial radius that the fact sheet uses (71,492 km), for the Earth the mean radius
// (the Moon at 60.3 Earth radii, as before)
const TEXT_RADIUS_KM = { Earth: EARTH_RADIUS_KM, Jupiter: 71492 };
