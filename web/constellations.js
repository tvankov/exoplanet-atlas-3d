// The constellations between the real stars at their real distances (Hipparcos parallaxes), on the map. Seen from the Sun a figure looks as we know
// it, because the map keeps the direction of every star; seen from the side it shows itself as what it is, a chance picture of stars at very
// different distances. The 12 of the zodiac are green. Rings mark the stars of the figures that have known planets, with the name of the host and the
// number of planets. Data: d3-celestial (BSD-3, Olaf Frohn) for the figures and names, Hipparcos (new reduction, ESA) for the stars, the NASA
// Exoplanet Archive for the planets; see src/build_constellation_stars.py and THIRD_PARTY_NOTICES.md. The names exist in English, German and
// Japanese; Bulgarian shows the Latin names.
//
// The module also serves the atlas (atlas.js): focus(id) draws one figure bright with the distance of each star, and views(id) gives the two
// camera places, from the Earth (the figure as we know it) and from the side.

import * as THREE from "three";

const GREEN = 0xb8e6c1;
const BLUE = 0x8fa8d8;
const RAD = Math.PI / 180;
const SEGMENTS = 12;

// toMap(x, y, z, out): a position in light years (the axes of the data) to the map, which squeezes the distances.
export async function initConstellations({ scene, getLang, toMap }) {
  const { stars, constellations } = await (await fetch("data/constellations.json")).json();
  const byId = Object.fromEntries(constellations.map((c) => [c.id, c]));
  const nameOf = (c, lang) => (lang === "bg" ? c.la : (c[lang] ?? c.en));
  const lineMaterial = (color, opacity) => new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  const lineMesh = (positions, color, opacity) => {
    const mesh = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)), lineMaterial(color, opacity));
    mesh.frustumCulled = false;
    return mesh;
  };
  const labels = []; // { canvas, sprite, text(lang), style }
  function addLabel(group, position, text, style) {
    const canvas = document.createElement("canvas");
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), sizeAttenuation: false, depthTest: false, transparent: true, opacity: style === "plain" ? 0.65 : 1 }));
    sprite.position.copy(position);
    group.add(sprite);
    labels.push({ canvas, sprite, text, style });
    return sprite;
  }
  function disc(color, ring) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    g.strokeStyle = color;
    g.fillStyle = color;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(32, 32, ring ? 24 : 14, 0, Math.PI * 2);
    if (ring) g.stroke();
    else g.fill();
    return new THREE.CanvasTexture(c);
  }
  const ringTexture = disc("#7cffb2", true);
  const dotTexture = disc("#ffffff", false);
  function addMarker(group, position, texture, size) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, sizeAttenuation: false, depthTest: false, transparent: true }));
    sprite.scale.set(size, size, 1);
    sprite.position.copy(position);
    group.add(sprite);
    return sprite;
  }
  // a star in light years (the axes of the data), and on the map
  const space = (id) => {
    const [ra, dec, dist] = stars[id];
    if (dist == null) return null;
    const d = Math.cos(dec * RAD) * dist;
    return [d * Math.cos(ra * RAD), d * Math.sin(ra * RAD), Math.sin(dec * RAD) * dist];
  };
  const onMap = (id, out = new THREE.Vector3()) => {
    const p = space(id);
    return p ? toMap(p[0], p[1], p[2], out) : null;
  };
  // the line between two stars: straight in space, bent on the map
  function segments(a, b, push) {
    const p1 = space(a);
    const p2 = space(b);
    if (!p1 || !p2) return;
    const s = new THREE.Vector3();
    const e = new THREE.Vector3();
    for (let k = 0; k < SEGMENTS; k++) {
      const at = (u, out) => toMap(p1[0] + (p2[0] - p1[0]) * u, p1[1] + (p2[1] - p1[1]) * u, p1[2] + (p2[2] - p1[2]) * u, out);
      at(k / SEGMENTS, s);
      at((k + 1) / SEGMENTS, e);
      push(s, e);
    }
  }

  // ---------------------------------------------------------------- all the figures
  const group = new THREE.Group();
  group.visible = false;
  const lines = { zodiac: [], other: [] };
  for (const c of constellations) {
    const target = c.zodiac ? lines.zodiac : lines.other;
    for (const line of c.lines) for (let i = 0; i + 1 < line.length; i++) segments(line[i], line[i + 1], (s, e) => target.push(s.x, s.y, s.z, e.x, e.y, e.z));
  }
  const otherLines = lineMesh(lines.other, BLUE, 0.55);
  const zodiacLines = lineMesh(lines.zodiac, GREEN, 0.9);
  group.add(otherLines, zodiacLines);
  // the name of a figure at the middle of its real stars
  const mid = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  for (const c of constellations) {
    if (!c.zodiac && c.rank > 2) continue;
    mid.set(0, 0, 0);
    let n = 0;
    for (const id of new Set(c.lines.flat())) if (onMap(id, tmp)) (mid.add(tmp), n++);
    if (n) addLabel(group, mid.clone().divideScalar(n), (lang) => nameOf(c, lang), c.zodiac ? "zodiac" : "plain");
  }
  for (const [id, s] of Object.entries(stars)) {
    if (!s[4] || s[2] == null) continue;
    const position = onMap(id);
    addMarker(group, position, ringTexture, 0.02); // small: the stars of the map are small dots, a big ring would be bigger than the system it marks
    addLabel(group, position, () => `${s[4]} · ${s[5]}`, "host");
  }

  // ---------------------------------------------------------------- one figure in focus
  const focusGroup = new THREE.Group();
  focusGroup.visible = false;
  let focusLabels = [];
  let unit = "ly";
  const infoOf = (c) => {
    const ids = [...new Set(c.lines.flat())].filter((id) => stars[id][2] != null);
    const list = ids
      .map((id) => ({ id, dist: stars[id][2], mag: stars[id][3], host: stars[id][4], planets: stars[id][5], ra: stars[id][0], dec: stars[id][1] }))
      .sort((a, b) => a.mag - b.mag);
    return { id: c.id, zodiac: c.zodiac, stars: list, nearest: list.reduce((m, s) => (s.dist < m.dist ? s : m), list[0]), farthest: list.reduce((m, s) => (s.dist > m.dist ? s : m), list[0]) };
  };
  function drawLabels() {
    const lang = getLang();
    for (const { canvas, sprite, text, style } of [...labels, ...focusLabels]) {
      const t = text(lang);
      const w = Math.ceil(t.length * 13 + 28);
      canvas.width = w;
      canvas.height = 36;
      const g = canvas.getContext("2d");
      g.font = `${style === "plain" ? 500 : 600} ${style === "plain" ? 18 : 20}px system-ui, 'Segoe UI', sans-serif`;
      g.textAlign = "center";
      g.fillStyle = style === "zodiac" ? "#b8e6c1" : style === "host" ? "#7cffb2" : style === "dist" ? "#ffffff" : "#c4d0ea";
      g.shadowColor = "rgba(0, 0, 0, 0.9)";
      g.shadowBlur = 5;
      g.fillText(t, w / 2, 25);
      sprite.material.map.dispose();
      sprite.material.map = new THREE.CanvasTexture(canvas);
      const height = style === "host" ? 0.022 : style === "dist" ? 0.026 : 0.03;
      sprite.scale.set(height * (w / 36), height, 1);
      if (style === "host" || style === "dist") sprite.center.set(0.5, -0.45); // above the marker
    }
  }
  function clearFocus() {
    for (const child of [...focusGroup.children]) {
      focusGroup.remove(child);
      child.geometry?.dispose();
      child.material?.map?.dispose();
      child.material?.dispose();
    }
    focusLabels = [];
    focusGroup.visible = false;
    for (const m of [otherLines, zodiacLines]) m.material.opacity = m === zodiacLines ? 0.9 : 0.55;
  }
  // The figure bright, the others dim, and the distance of each star (in light years) next to it.
  function focus(id, distanceUnit = "ly") {
    clearFocus();
    unit = distanceUnit;
    const c = byId[id];
    if (!c) return null;
    const positions = [];
    for (const line of c.lines) for (let i = 0; i + 1 < line.length; i++) segments(line[i], line[i + 1], (s, e) => positions.push(s.x, s.y, s.z, e.x, e.y, e.z));
    focusGroup.add(lineMesh(positions, 0xffffff, 1));
    const info = infoOf(c);
    for (const s of info.stars) {
      const position = onMap(s.id);
      addMarker(focusGroup, position, dotTexture, 0.012);
      const canvas = document.createElement("canvas");
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), sizeAttenuation: false, depthTest: false, transparent: true }));
      sprite.position.copy(position);
      focusGroup.add(sprite);
      focusLabels.push({ canvas, sprite, text: () => `${Math.round(s.dist)} ${unit}`, style: "dist" });
    }
    otherLines.material.opacity = 0.15;
    zodiacLines.material.opacity = c.zodiac ? 0.35 : 0.2;
    focusGroup.visible = true;
    drawLabels();
    return info;
  }
  // The two camera places for a figure, on the map: from the Earth (a little off the Sun, looking at the figure: it looks as we know it)
  // and from the side (looking at the middle of the figure from the side, so that the distances show).
  function views(id) {
    const c = byId[id];
    if (!c) return null;
    const ids = [...new Set(c.lines.flat())].filter((x) => stars[x][2] != null);
    const centre = new THREE.Vector3();
    const points = ids.map((x) => onMap(x));
    for (const p of points) centre.add(p);
    centre.divideScalar(points.length);
    const extent = Math.max(...points.map((p) => p.distanceTo(centre)), 2);
    const away = centre.clone().normalize();
    const side = new THREE.Vector3().crossVectors(away, new THREE.Vector3(0, 1, 0));
    if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
    side.normalize();
    return {
      earth: { position: away.clone().multiplyScalar(-0.35), target: away.clone().multiplyScalar(Math.max(centre.length(), 5)) },
      side: { position: centre.clone().addScaledVector(side, extent * 2.4 + 4).add(new THREE.Vector3(0, extent * 0.5, 0)), target: centre },
    };
  }
  drawLabels();
  scene.add(group, focusGroup);
  return {
    show(visible) {
      group.visible = visible;
      if (focusGroup.children.length) focusGroup.visible = visible;
    },
    refresh: drawLabels,
    focus,
    clearFocus,
    views,
    // the data for the atlas and its quiz
    data: { stars, constellations, nameOf, info: (id) => infoOf(byId[id]) },
  };
}
