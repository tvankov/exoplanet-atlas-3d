// Tests of the whole page as files: every script parses (also the ones no other test loads, such as main.js), every import between the
// scripts points to a file that is there, the pages link only to files that are there, the import map of three.js points to the copy in
// web/vendor, and no debugging is left in. Run with: node --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const WEB = new URL("../web/", import.meta.url);
const scripts = readdirSync(WEB).filter((f) => f.endsWith(".js"));
const read = (f) => readFileSync(new URL(f, WEB), "utf8");

test("every script of the page parses", () => {
  assert.ok(scripts.length >= 20);
  for (const f of scripts) {
    const run = spawnSync(process.execPath, ["--check", fileURLToPath(new URL(f, WEB))], { encoding: "utf8" });
    assert.equal(run.status, 0, `${f}: ${run.stderr}`);
  }
});

test("every import between the scripts points to a file that is there", () => {
  for (const f of scripts) {
    for (const [, path] of read(f).matchAll(/\bfrom\s+"(\.\/[^"?]+)"/g)) assert.ok(existsSync(new URL(path, WEB)), `${f} imports ${path}`);
    for (const [, path] of read(f).matchAll(/\bimport\(\s*"(\.\/[^"?]+)"\s*\)/g)) assert.ok(existsSync(new URL(path, WEB)), `${f} loads ${path}`);
  }
});

test("the pages link only to files that are there, and three.js comes from web/vendor (no CDN)", () => {
  for (const page of ["index.html", "legal.html"]) {
    const html = read(page);
    for (const [, path] of html.matchAll(/(?:src|href)="([^"#?]+)[^"]*"/g)) {
      if (/^(https?:|mailto:|data:)/.test(path) || path === "") continue;
      assert.ok(existsSync(new URL(path, WEB)), `${page} links to ${path}`);
    }
  }
  const map = JSON.parse(read("index.html").match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]);
  for (const [name, path] of Object.entries(map.imports)) {
    assert.ok(!/^https?:/.test(path), `${name} is not loaded from another server`);
    assert.ok(existsSync(new URL(path.replace(/^\.\//, ""), WEB)), `${name}: ${path} is there`);
  }
});

test("the textures and data files that the scripts name are there", () => {
  for (const f of scripts)
    for (const [, path] of read(f).matchAll(/["`]((?:textures|data|vendor)\/[\w./-]+\.(?:jpg|png|json|bin|js))["`]/g))
      assert.ok(existsSync(new URL(path, WEB)), `${f} needs ${path}`);
});

test("no debugging left in the scripts", () => {
  for (const f of scripts) {
    const code = read(f);
    assert.ok(!/\bconsole\.log\(/.test(code), `${f} has console.log`);
    assert.ok(!/^\s*debugger\b/m.test(code), `${f} has debugger`);
  }
});
