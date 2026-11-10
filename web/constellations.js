// The constellations in two forms. "sphere": as they look from the Sun, lines on a big sphere around it (only the direction of a star is used).
// "real": the same figures drawn between the real stars at their real distances (Hipparcos parallaxes), on the map, where a figure shows
// itself as what it is, a chance picture of stars at very different distances. The 12 of the zodiac, and in the sphere the ecliptic (the
// plane of the Solar System, along which the zodiac lies), are green. Rings mark the stars of the figures that have known planets, with the
// name of the host star and the number of planets. Data: d3-celestial (BSD-3, Olaf Frohn) for the figures and names, Hipparcos (new reduction,
// ESA) for the stars, the NASA Exoplanet Archive for the planets; see src/build_constellation_stars.py and THIRD_PARTY_NOTICES.md. The names
// exist in English, German and Japanese; Bulgarian shows the Latin names.

import * as THREE from "three";

const RADIUS = 150; // map units, beyond the farthest star of the catalogue that is drawn (16,000 light years is 126 on the squeezed map)
const OBLIQUITY = (23.4393 * Math.PI) / 180;
const GREEN = 0xb8e6c1;
const BLUE = 0x8fa8d8;
const RAD = Math.PI / 180;

// A direction (right ascension and declination in degrees) on the sphere, in the axes of the map (the data has z north, the map y up).
function onSphere(lonDeg, latDeg, radius = RADIUS, out = new THREE.Vector3()) {
  const ra = lonDeg * RAD;
  const de = latDeg * RAD;
  return out.set(Math.cos(de) * Math.cos(ra) * radius, Math.sin(de) * radius, -Math.cos(de) * Math.sin(ra) * radius);
}

// A line along the sphere: split into pieces of about two degrees so that it follows the sphere and does not cut across it.
function arc(va, vb, push) {
  const pieces = Math.max(1, Math.ceil(va.angleTo(vb) / 0.035));
  let last = va;
  for (let i = 1; i <= pieces; i++) {
    const next = va.clone().lerp(vb, i / pieces).setLength(RADIUS);
    push(last, next);
    last = next;
  }
}

// toMap(x, y, z, out): a position in light years (the axes of the data) to the map, which squeezes the distances.
export async function initConstellations({ scene, getLang, toMap }) {
  const { stars, constellations } = await (await fetch("data/constellations.json")).json();
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
  }
  const ringTexture = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    g.strokeStyle = "#7cffb2";
    g.lineWidth = 4;
    g.beginPath();
    g.arc(32, 32, 24, 0, Math.PI * 2);
    g.stroke();
    return new THREE.CanvasTexture(c);
  })();
  function addRing(group, position) {
    const ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTexture, sizeAttenuation: false, depthTest: false, transparent: true }));
    ring.scale.set(0.034, 0.034, 1);
    ring.position.copy(position);
    group.add(ring);
  }
  const real = (id, out = new THREE.Vector3()) => {
    const [ra, dec, dist] = stars[id];
    if (dist == null) return null;
    const d = Math.cos(dec * RAD) * dist;
    return toMap(d * Math.cos(ra * RAD), d * Math.sin(ra * RAD), Math.sin(dec * RAD) * dist, out);
  };
  const dir = (id) => onSphere(stars[id][0], stars[id][1]);
  const nameOf = (c, lang) => (lang === "bg" ? c.la : (c[lang] ?? c.en));

  // ---------------------------------------------------------------- the sphere
  const sphere = new THREE.Group();
  sphere.visible = false;
  const sphereLines = { zodiac: [], other: [] };
  for (const c of constellations) {
    const target = c.zodiac ? sphereLines.zodiac : sphereLines.other;
    for (const line of c.lines) {
      for (let i = 0; i + 1 < line.length; i++) arc(dir(line[i]), dir(line[i + 1]), (p, q) => target.push(p.x, p.y, p.z, q.x, q.y, q.z));
    }
  }
  sphere.add(lineMesh(sphereLines.other, BLUE, 0.35), lineMesh(sphereLines.zodiac, GREEN, 0.75));
  const ecliptic = [];
  for (let i = 0; i <= 360; i += 2) {
    const l = i * RAD;
    ecliptic.push(new THREE.Vector3(Math.cos(l) * RADIUS, Math.sin(l) * Math.sin(OBLIQUITY) * RADIUS, -Math.sin(l) * Math.cos(OBLIQUITY) * RADIUS));
  }
  const eclipticLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ecliptic), lineMaterial(GREEN, 0.35));
  eclipticLine.frustumCulled = false;
  sphere.add(eclipticLine);
  for (const c of constellations) {
    if (!c.zodiac && c.rank > 2) continue;
    addLabel(sphere, onSphere(c.label[0], c.label[1]), (lang) => nameOf(c, lang), c.zodiac ? "zodiac" : "plain");
  }
  for (const [id, s] of Object.entries(stars)) {
    if (!s[4]) continue;
    addRing(sphere, dir(id));
    addLabel(sphere, dir(id), () => `${s[4]} · ${s[5]}`, "host");
  }

  // ---------------------------------------------------------------- the real stars
  const realGroup = new THREE.Group();
  realGroup.visible = false;
  const realLines = { zodiac: [], other: [] };
  const SEGMENTS = 12;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  for (const c of constellations) {
    const target = c.zodiac ? realLines.zodiac : realLines.other;
    for (const line of c.lines) {
      for (let i = 0; i + 1 < line.length; i++) {
        const [ra1, de1, d1] = stars[line[i]];
        const [ra2, de2, d2] = stars[line[i + 1]];
        if (d1 == null || d2 == null) continue;
        // the line is straight in space (in light years) and bent on the map, which squeezes the distances
        const p1 = [Math.cos(de1 * RAD) * Math.cos(ra1 * RAD) * d1, Math.cos(de1 * RAD) * Math.sin(ra1 * RAD) * d1, Math.sin(de1 * RAD) * d1];
        const p2 = [Math.cos(de2 * RAD) * Math.cos(ra2 * RAD) * d2, Math.cos(de2 * RAD) * Math.sin(ra2 * RAD) * d2, Math.sin(de2 * RAD) * d2];
        for (let k = 0; k < SEGMENTS; k++) {
          for (const [u, out] of [[k / SEGMENTS, a], [(k + 1) / SEGMENTS, b]]) {
            toMap(p1[0] + (p2[0] - p1[0]) * u, p1[1] + (p2[1] - p1[1]) * u, p1[2] + (p2[2] - p1[2]) * u, out);
          }
          target.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
      }
    }
  }
  realGroup.add(lineMesh(realLines.other, BLUE, 0.55), lineMesh(realLines.zodiac, GREEN, 0.9));
  // the name of a figure at the middle of its real stars
  const mid = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  for (const c of constellations) {
    if (!c.zodiac && c.rank > 2) continue;
    mid.set(0, 0, 0);
    let n = 0;
    for (const id of new Set(c.lines.flat())) {
      if (real(id, tmp)) {
        mid.add(tmp);
        n++;
      }
    }
    if (n) addLabel(realGroup, mid.clone().divideScalar(n), (lang) => nameOf(c, lang), c.zodiac ? "zodiac" : "plain");
  }
  for (const [id, s] of Object.entries(stars)) {
    if (!s[4] || s[2] == null) continue;
    const position = real(id);
    addRing(realGroup, position);
    addLabel(realGroup, position, () => `${s[4]} · ${s[5]}`, "host");
  }

  function drawLabels() {
    const lang = getLang();
    for (const { canvas, sprite, text, style } of labels) {
      const t = text(lang);
      const w = Math.ceil(t.length * 13 + 28);
      canvas.width = w;
      canvas.height = 36;
      const g = canvas.getContext("2d");
      g.font = `${style === "plain" ? 500 : 600} ${style === "plain" ? 18 : 20}px system-ui, 'Segoe UI', sans-serif`;
      g.textAlign = "center";
      g.fillStyle = style === "zodiac" ? "#b8e6c1" : style === "host" ? "#7cffb2" : "#c4d0ea";
      g.shadowColor = "rgba(0, 0, 0, 0.9)";
      g.shadowBlur = 5;
      g.fillText(t, w / 2, 25);
      sprite.material.map.dispose();
      sprite.material.map = new THREE.CanvasTexture(canvas);
      sprite.scale.set(0.034 * (w / 36), 0.034, 1);
      if (style === "host") sprite.center.set(0.5, -0.5); // above the ring
    }
  }
  drawLabels();
  scene.add(sphere, realGroup);
  return {
    // mode: "off", "sphere" or "real"; visible = false hides both whatever the mode is (the real scale, a flying ship)
    show(mode, visible = true) {
      sphere.visible = visible && mode === "sphere";
      realGroup.visible = visible && mode === "real";
    },
    refresh: drawLabels,
  };
}
