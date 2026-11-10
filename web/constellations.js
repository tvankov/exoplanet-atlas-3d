// The constellations as they look from the Sun: lines between stars and the names, drawn on a big sphere around the Sun (only the direction of
// a star is used, the stars of a figure are at very different distances, so the figure is only right when seen from here). The 12 of the
// zodiac and the ecliptic (the plane of the Solar System, along which the zodiac lies) are green. Data: d3-celestial (BSD-3, Olaf Frohn), see
// src/build_constellations.py and THIRD_PARTY_NOTICES.md. The names exist in English, German and Japanese; Bulgarian shows the Latin names.

import * as THREE from "three";

const RADIUS = 150; // map units, beyond the farthest star of the catalogue that is drawn (16,000 light years is 126 on the squeezed map)
const OBLIQUITY = (23.4393 * Math.PI) / 180;
const GREEN = 0xb8e6c1;
const BLUE = 0x8fa8d8;

// A direction (right ascension and declination in degrees) on the sphere, in the axes of the map (the data has z north, the map y up).
function onSphere(lonDeg, latDeg, radius = RADIUS, out = new THREE.Vector3()) {
  const ra = (lonDeg * Math.PI) / 180;
  const de = (latDeg * Math.PI) / 180;
  return out.set(Math.cos(de) * Math.cos(ra) * radius, Math.sin(de) * radius, -Math.cos(de) * Math.sin(ra) * radius);
}

// A line along the sphere: split into pieces of about two degrees so that it follows the sphere and does not cut across it.
function arc(a, b, push) {
  const va = onSphere(a[0], a[1]);
  const vb = onSphere(b[0], b[1]);
  const angle = va.angleTo(vb);
  const pieces = Math.max(1, Math.ceil(angle / 0.035));
  let last = va;
  for (let i = 1; i <= pieces; i++) {
    const next = va.clone().lerp(vb, i / pieces).setLength(RADIUS);
    push(last, next);
    last = next;
  }
}

export async function initConstellations({ scene, getLang }) {
  const data = await (await fetch("data/constellations.json")).json();
  const group = new THREE.Group();
  group.visible = false;
  group.renderOrder = 1;
  const segments = { zodiac: [], other: [] };
  for (const c of data) {
    const target = c.zodiac ? segments.zodiac : segments.other;
    for (const line of c.lines) {
      for (let i = 0; i + 1 < line.length; i++) {
        arc(line[i], line[i + 1], (p, q) => target.push(p.x, p.y, p.z, q.x, q.y, q.z));
      }
    }
  }
  const make = (positions, color, opacity) => {
    const mesh = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
    );
    mesh.frustumCulled = false;
    return mesh;
  };
  group.add(make(segments.other, BLUE, 0.35), make(segments.zodiac, GREEN, 0.75));

  // The ecliptic: a great circle tilted by 23.4 degrees against the equator of the sky.
  const ecliptic = [];
  for (let i = 0; i <= 360; i += 2) {
    const l = (i * Math.PI) / 180;
    const x = Math.cos(l);
    const y = Math.sin(l) * Math.cos(OBLIQUITY);
    const z = Math.sin(l) * Math.sin(OBLIQUITY);
    ecliptic.push(new THREE.Vector3(x * RADIUS, z * RADIUS, -y * RADIUS));
  }
  const eclipticLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ecliptic), new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: 0.35, depthWrite: false }));
  eclipticLine.frustumCulled = false;
  group.add(eclipticLine);

  // The names: the 12 of the zodiac and the more important constellations (rank 1 and 2), as flat labels that keep their size on the screen.
  const labels = [];
  for (const c of data) {
    if (!c.zodiac && c.rank > 2) continue;
    const canvas = document.createElement("canvas");
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), sizeAttenuation: false, depthTest: false, transparent: true, opacity: c.zodiac ? 1 : 0.65 }));
    sprite.position.copy(onSphere(c.label[0], c.label[1]));
    group.add(sprite);
    labels.push({ c, canvas, sprite });
  }
  function drawLabels() {
    const lang = getLang();
    for (const { c, canvas, sprite } of labels) {
      const text = lang === "bg" ? c.la : (c[lang] ?? c.en);
      const w = Math.ceil(text.length * 13 + 28);
      canvas.width = w;
      canvas.height = 36;
      const g = canvas.getContext("2d");
      g.font = `${c.zodiac ? 600 : 500} ${c.zodiac ? 20 : 18}px system-ui, 'Segoe UI', sans-serif`;
      g.textAlign = "center";
      g.fillStyle = c.zodiac ? "#b8e6c1" : "#c4d0ea";
      g.shadowColor = "rgba(0, 0, 0, 0.9)";
      g.shadowBlur = 5;
      g.fillText(text, w / 2, 25);
      sprite.material.map.dispose();
      sprite.material.map = new THREE.CanvasTexture(canvas);
      sprite.scale.set(0.034 * (w / 36), 0.034, 1);
    }
  }
  drawLabels();
  scene.add(group);
  return { group, refresh: drawLabels };
}
