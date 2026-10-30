// Writes every story in both languages to data/processed/stories.json.
// It runs the same story.js the web app uses, so the audio always matches the text on screen.
//
// Run from the project root:  node src/export_stories.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { buildStory, slug, SOLAR_PLANET_NAMES } from "../web/story.js";

const { stars } = JSON.parse(readFileSync(new URL("../web/data/stars.json", import.meta.url), "utf-8"));

const entries = [];
const add = (id, star, planet) => {
  for (const lang of ["en", "de"]) {
    const { title, paragraphs } = buildStory(star, planet, lang);
    entries.push({ id, lang, title, paragraphs });
  }
};

add("earth", { solarSystem: true }, { pl_name: "Earth" });
// The other seven planets of the Solar System have a story of their own as well.
for (const name of SOLAR_PLANET_NAMES) add(slug(name), { solarSystem: true }, { pl_name: name, solarOther: true });
for (const star of stars) {
  for (const planet of star.planets) if (planet.habitable) add(slug(planet.pl_name), star, planet);
}

writeFileSync(new URL("../data/processed/stories.json", import.meta.url), JSON.stringify(entries, null, 1));
console.log(`${entries.length} stories written`);
