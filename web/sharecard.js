// Pictures to share ("Your star", "Your age on the planets", "The sky at your birth"): drawn in the browser on a canvas of 1080 x 1350 pixels
// (the size that phones and most apps show whole), with the name and the address of the site at the bottom, so that a shared picture leads back
// here. The background is a part of the real Milky Way (ESO/S. Brunier, CC BY 4.0, credited on the picture), the planets are lit spheres made
// from the NASA maps of the page (Venus, Saturn, Uranus and Neptune have no usable map and are painted in their colours, as in the 3D view).
// The page sends nothing: the picture goes only where the visitor shares it (the share sheet of the phone or of the system), or is saved as a
// file. The link in the message carries ?ref=share-<kind>, so that the visits it brings can be counted (stats.js, trackShareArrival).

import { track } from "./stats.js";

export const SITE = "space.todorvankov.com";
export const W = 1080;
export const H = 1350;
const FAMILY = "system-ui, 'Segoe UI', sans-serif";
export const font = (weight, size, family = FAMILY) => `${weight} ${size}px ${family}`;
// the credit of the Milky Way, as its licence asks (with what was changed); each picture adds its own sources
const CREDIT = "Milky Way: ESO/S. Brunier, CC BY 4.0, cropped and darkened";

// ---------------------------------------------------------------- pictures of the page, loaded once
const images = new Map();
export function loadImage(src) {
  if (!images.has(src))
    images.set(
      src,
      new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = src;
      })
    );
  return images.get(src);
}
// the pixels of a map, made smaller (1024 x 512 is enough for a sphere on the picture)
const maps = new Map();
function mapPixels(src) {
  if (!maps.has(src))
    maps.set(
      src,
      loadImage(src).then((img) => {
        const c = document.createElement("canvas");
        c.width = 1024;
        c.height = 512;
        const g = c.getContext("2d");
        g.drawImage(img, 0, 0, c.width, c.height);
        return g.getImageData(0, 0, c.width, c.height);
      })
    );
  return maps.get(src);
}
const BACKDROP = "textures/milkyway.jpg";
// The maps of the planets (the textures of the 3D view) and what is painted: [r, g, b] by latitude and longitude (radians).
export const PLANET_LOOK = {
  Mercury: { map: "textures/mercury.jpg", lon: 0.6 },
  Venus: { paint: (lat, lon) => shadeOf([236, 206, 146], 0.93 + 0.07 * Math.sin(lat * 7 + Math.sin(lon * 2) * 0.8)) },
  Earth: { map: "textures/earth_day.jpg", clouds: "textures/earth_clouds.jpg", lon: 0.35, glow: "120,170,255" },
  Mars: { map: "textures/mars.jpg", lon: -1.2 },
  Jupiter: { map: "textures/jupiter.jpg", lon: 0.4 },
  Saturn: { paint: (lat) => mix([232, 214, 168], [198, 168, 112], 0.5 + 0.5 * Math.sin(lat * 16)), ring: "222,204,160" },
  Uranus: { paint: (lat) => shadeOf([164, 228, 234], 0.95 + 0.08 * Math.abs(Math.sin(lat))) },
  Neptune: { paint: (lat) => shadeOf([78, 116, 222], 0.9 + 0.1 * Math.cos(lat * 9)) },
  Moon: { map: "textures/moon.jpg", lon: 0 },
};
// An exoplanet has no picture: a smooth sphere in a colour by its temperature (cold blue to hot red, the same scale as in My Universe), with
// soft bands, as a sign and not as a surface.
export function exoLook(kelvin) {
  const k = kelvin ?? 300;
  const c = k < 200 ? [207, 227, 255] : k < 330 ? [77, 143, 224] : k < 600 ? [217, 160, 102] : k < 1200 ? [200, 100, 58] : [255, 122, 61];
  return { paint: (lat) => shadeOf(c, 0.9 + 0.1 * Math.sin(lat * 5)) };
}
const shadeOf = (c, k) => c.map((x) => x * k);
const mix = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
// Load the backdrop and the maps before the visitor clicks "Share", so that the share sheet opens at once (some browsers allow it only right
// after the click).
export function preload(planets = []) {
  const list = [loadImage(BACKDROP)];
  for (const name of planets) {
    const look = PLANET_LOOK[name];
    if (look?.map) list.push(mapPixels(look.map));
    if (look?.clouds) list.push(mapPixels(look.clouds));
  }
  return Promise.all(list).catch(() => null);
}

// ---------------------------------------------------------------- drawing helpers
// The lines of a text that fit into maxWidth with the current font.
export function wrap(g, text, maxWidth) {
  const lines = [];
  let line = "";
  // words, or single characters for languages without spaces (Japanese)
  const parts = text.includes(" ") ? text.split(" ") : [...text];
  const joiner = text.includes(" ") ? " " : "";
  for (const w of parts) {
    const next = line ? `${line}${joiner}${w}` : w;
    if (g.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
// One line, made smaller until it fits into maxWidth.
export function fitText(g, text, x, y, maxWidth, weight, size) {
  let s = size;
  do g.font = font(weight, s);
  while (g.measureText(text).width > maxWidth && (s -= 2) > 16);
  g.fillText(text, x, y);
}
export function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
// A dark glass panel over the backdrop.
export function panel(g, x, y, w, h, r = 32, stroke = "rgba(255,255,255,0.14)", fill = "rgba(8,11,20,0.55)") {
  roundRect(g, x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
  g.strokeStyle = stroke;
  g.lineWidth = 2;
  g.stroke();
}
// The colour of a star from its temperature (a fit to the colour of a black body, Tanner Helland), as "r,g,b".
export function starColor(kelvin = 5772) {
  const k = Math.min(40000, Math.max(1000, kelvin)) / 100;
  const r = k <= 66 ? 255 : 329.7 * Math.pow(k - 60, -0.1332);
  const gr = k <= 66 ? 99.47 * Math.log(k) - 161.12 : 288.12 * Math.pow(k - 60, -0.0755);
  const b = k >= 66 ? 255 : k <= 19 ? 0 : 138.52 * Math.log(k - 10) - 305.04;
  return [r, gr, b].map((x) => Math.round(Math.min(255, Math.max(0, x)))).join(",");
}
// A star: a white core, a halo in its colour and four thin rays.
export function drawStar(g, x, y, radius, rgb = "255,236,210") {
  const halo = g.createRadialGradient(x, y, 0, x, y, radius);
  halo.addColorStop(0, "rgba(255,255,255,1)");
  halo.addColorStop(0.06, "rgba(255,255,255,0.95)");
  halo.addColorStop(0.18, `rgba(${rgb},0.6)`);
  halo.addColorStop(0.45, `rgba(${rgb},0.16)`);
  halo.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = halo;
  g.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  g.save();
  g.translate(x, y);
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 4; i++) {
    g.rotate(Math.PI / 2);
    const ray = g.createLinearGradient(0, 0, radius * 1.15, 0);
    ray.addColorStop(0, `rgba(${rgb},0.75)`);
    ray.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = ray;
    g.beginPath();
    g.moveTo(0, -radius * 0.012);
    g.lineTo(radius * 1.15, 0);
    g.lineTo(0, radius * 0.012);
    g.fill();
  }
  g.restore();
}
// The part of the real Milky Way behind a picture: at (0 to 1) chooses the part of the panorama, darkened so that the text can be read.
function drawBackdrop(g, img, at) {
  if (img) {
    const sh = img.height * 0.5;
    const sw = (sh * W) / H;
    const sx = Math.min(img.width - sw, Math.max(0, img.width * at - sw / 2));
    g.drawImage(img, sx, (img.height - sh) / 2, sw, sh, 0, 0, W, H);
  } else {
    g.fillStyle = "#05060a";
    g.fillRect(0, 0, W, H);
  }
  const dark = g.createLinearGradient(0, 0, 0, H);
  dark.addColorStop(0, "rgba(4,6,12,0.8)");
  dark.addColorStop(0.3, "rgba(4,6,12,0.32)");
  dark.addColorStop(0.7, "rgba(4,6,12,0.42)");
  dark.addColorStop(1, "rgba(4,6,12,0.9)");
  g.fillStyle = dark;
  g.fillRect(0, 0, W, H);
}

// A planet as a lit sphere, from its map or painted; the light comes from the upper left. Saturn gets its rings, the Earth its clouds and a
// thin blue air. name: a planet of the Solar System (or "Moon"), or a look of its own ({ map } or { paint }, see exoLook).
export async function drawPlanet(g, name, cx, cy, r) {
  const look = typeof name === "string" ? PLANET_LOOK[name] : name;
  if (!look) return;
  const map = look.map ? await mapPixels(look.map) : null;
  const clouds = look.clouds ? await mapPixels(look.clouds) : null;
  const ringBack = () => ring(g, cx, cy, r, look.ring, Math.PI, Math.PI * 2);
  if (look.ring) ringBack();
  const size = Math.ceil(r * 2);
  const off = document.createElement("canvas");
  off.width = off.height = size;
  const og = off.getContext("2d");
  const out = og.createImageData(size, size);
  const L = [-0.55, -0.45, 0.7];
  const len = Math.hypot(...L);
  const sample = (data, lon, lat) => {
    const u = (((lon / (Math.PI * 2) + 0.5) % 1) + 1) % 1;
    const v = Math.min(0.9999, Math.max(0, 0.5 - lat / Math.PI));
    const i = (Math.floor(v * data.height) * data.width + Math.floor(u * data.width)) * 4;
    return [data.data[i], data.data[i + 1], data.data[i + 2]];
  };
  for (let py = 0; py < size; py++)
    for (let px = 0; px < size; px++) {
      const x = (px + 0.5 - r) / r;
      const y = (py + 0.5 - r) / r;
      const d2 = x * x + y * y;
      if (d2 > 1) continue;
      const z = Math.sqrt(1 - d2);
      const lat = Math.asin(-y);
      const lon = (look.lon ?? 0) + Math.atan2(x, z);
      let c = map ? sample(map, lon, lat) : look.paint(lat, lon);
      if (clouds) {
        const k = sample(clouds, lon, lat)[0] / 255;
        c = mix(c, [255, 255, 255], k * 0.85);
      }
      const light = Math.max(0, (x * L[0] + y * L[1] + z * L[2]) / len);
      const k = (0.06 + 0.94 * light) * (0.8 + 0.2 * z);
      const edge = Math.min(1, (1 - Math.sqrt(d2)) * r);
      const i = (py * size + px) * 4;
      out.data[i] = Math.min(255, c[0] * k);
      out.data[i + 1] = Math.min(255, c[1] * k);
      out.data[i + 2] = Math.min(255, c[2] * k);
      out.data[i + 3] = 255 * edge;
    }
  og.putImageData(out, 0, 0);
  g.drawImage(off, cx - r, cy - r);
  if (look.glow) {
    const air = g.createRadialGradient(cx, cy, r * 0.92, cx, cy, r * 1.12);
    air.addColorStop(0, `rgba(${look.glow},0)`);
    air.addColorStop(0.45, `rgba(${look.glow},0.45)`);
    air.addColorStop(1, `rgba(${look.glow},0)`);
    g.fillStyle = air;
    g.beginPath();
    g.arc(cx, cy, r * 1.12, 0, Math.PI * 2);
    g.fill();
  }
  if (look.ring) ring(g, cx, cy, r, look.ring, 0, Math.PI);
}
// Saturn's rings as a few bands, the half behind the planet first and the front half after it.
function ring(g, cx, cy, r, rgb, from, to) {
  g.save();
  g.translate(cx, cy);
  g.rotate(-0.38);
  for (const [k, a, w] of [[1.35, 0.35, 0.1], [1.55, 0.7, 0.16], [1.78, 0.55, 0.14], [2.0, 0.3, 0.08]]) {
    g.strokeStyle = `rgba(${rgb},${a})`;
    g.lineWidth = r * w;
    g.beginPath();
    g.ellipse(0, 0, r * k, r * k * 0.3, 0, from, to);
    g.stroke();
  }
  g.restore();
}

// ---------------------------------------------------------------- small pictures for the page (My Universe)
// A planet or a star as a canvas of the size the stylesheet gives it, drawn at up to twice the pixels, so that it is sharp on a phone. Each one
// is drawn once per look and size and then copied, because the panel is drawn again after every change. Until it is drawn, the canvas shows
// the plain colour of its class (uni-orb, star-glow, age-dot); then it gets the class "drawn".
const drawnSpheres = new Map();
function sphereCanvas(key, cls, size, draw) {
  const px = Math.round(size * Math.min(2, window.devicePixelRatio || 1));
  const c = document.createElement("canvas");
  c.width = c.height = px;
  c.className = cls;
  c.setAttribute("aria-hidden", "true");
  const id = `${key}:${px}`;
  if (!drawnSpheres.has(id))
    drawnSpheres.set(
      id,
      (async () => {
        const off = document.createElement("canvas");
        off.width = off.height = px;
        await draw(off.getContext("2d"), px);
        return off;
      })().catch(() => (drawnSpheres.delete(id), null))
    );
  drawnSpheres.get(id).then((off) => {
    if (!off) return;
    c.getContext("2d").drawImage(off, 0, 0);
    c.classList.add("drawn");
  });
  return c;
}
// name: a planet of the Solar System, or null with temp for an exoplanet; size: the size on the screen in CSS pixels.
export function planetCanvas({ name, temp }, cls, size) {
  const look = name ? name : exoLook(temp);
  const key = name ?? `exo-${Math.round((temp ?? 300) / 50)}`;
  const share = name === "Saturn" ? 0.45 : name === "Earth" ? 0.86 : 0.94; // room for the rings and the air
  return sphereCanvas(key, cls, size, (g, px) => drawPlanet(g, look, px / 2, px / 2, (px / 2) * share));
}
export function starCanvas(kelvin, cls, size) {
  const rgb = starColor(kelvin ?? 5772);
  return sphereCanvas(`star-${rgb}`, cls, size, (g, px) => {
    // a fuller light than on the big pictures, so that the star reads at this small size
    const r = px / 2;
    const light = g.createRadialGradient(r, r, 0, r, r, r);
    light.addColorStop(0, `rgba(${rgb},0.9)`);
    light.addColorStop(0.3, `rgba(${rgb},0.45)`);
    light.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = light;
    g.fillRect(0, 0, px, px);
    drawStar(g, r, r, r, rgb);
  });
}

// A badge as a medal: a golden rim, a night-blue face and a picture of what it is for, with the planets and stars of the pictures above. A badge
// not earned yet uses the same medal, made grey by the stylesheet (badge-medal.locked).
const TAU = Math.PI * 2;
const EMBLEM = {
  "first-look": (g, r) => drawPlanet(g, "Mars", r, r, r * 0.42),
  "planets-25": async (g, r) => {
    await drawPlanet(g, "Earth", r * 0.62, r * 0.66, r * 0.17);
    await drawPlanet(g, "Mars", r * 1.38, r * 0.72, r * 0.19);
    await drawPlanet(g, "Jupiter", r * 0.98, r * 1.18, r * 0.36);
  },
  "candidates-10": async (g, r) => {
    g.strokeStyle = "rgba(124,255,178,0.75)";
    g.lineWidth = r * 0.08;
    g.beginPath();
    g.ellipse(r, r, r * 0.62, r * 0.24, -0.35, 0, TAU);
    g.stroke();
    await drawPlanet(g, exoLook(280), r, r, r * 0.32);
  },
  "first-trip": async (g, r) => {
    g.strokeStyle = "rgba(127,227,255,0.85)";
    g.lineWidth = r * 0.06;
    g.setLineDash([r * 0.06, r * 0.12]);
    g.beginPath();
    g.moveTo(r * 0.62, r * 1.36);
    g.quadraticCurveTo(r * 0.9, r * 0.45, r * 1.4, r * 0.7);
    g.stroke();
    g.setLineDash([]);
    await drawPlanet(g, "Earth", r * 0.6, r * 1.34, r * 0.2);
    await drawPlanet(g, "Mars", r * 1.42, r * 0.68, r * 0.13);
  },
  "star-trip": (g, r) => drawStar(g, r, r, r * 0.78, starColor(4800)),
  "zone-expert": (g, r) => {
    g.save();
    g.shadowColor = "rgba(124,255,178,0.9)";
    g.shadowBlur = r * 0.2;
    g.strokeStyle = "#7cffb2";
    g.lineWidth = r * 0.11;
    g.beginPath();
    g.arc(r, r, r * 0.46, 0, TAU);
    g.stroke();
    g.restore();
    g.strokeStyle = "#ffffff";
    g.lineWidth = r * 0.11;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.beginPath();
    g.moveTo(r * 0.8, r * 1.02);
    g.lineTo(r * 0.95, r * 1.17);
    g.lineTo(r * 1.24, r * 0.84);
    g.stroke();
  },
  // the Big Dipper, the seven bright stars of the Great Bear, as most people know them
  "sky-reader": (g, r) => {
    const dipper = [[-0.6, -0.2], [-0.32, -0.26], [-0.08, -0.14], [0.14, 0.02], [0.2, 0.34], [0.56, 0.4], [0.6, 0.06], [0.14, 0.02]];
    const at = ([x, y]) => [r + x * r * 0.95, r + y * r * 0.95];
    g.save();
    g.shadowColor = "rgba(124,255,178,0.8)";
    g.shadowBlur = r * 0.12;
    g.strokeStyle = "rgba(184,230,193,0.85)";
    g.lineWidth = r * 0.05;
    g.beginPath();
    dipper.forEach((p, i) => (i ? g.lineTo(...at(p)) : g.moveTo(...at(p))));
    g.stroke();
    g.restore();
    for (const p of dipper.slice(0, 7)) drawStar(g, ...at(p), r * 0.22, "210,230,255");
  },
  collector: (g, r) => {
    const gold = g.createLinearGradient(r, r * 0.45, r, r * 1.5);
    gold.addColorStop(0, "#fff3c8");
    gold.addColorStop(1, "#e0a83c");
    g.save();
    g.shadowColor = "rgba(255,200,110,0.8)";
    g.shadowBlur = r * 0.25;
    g.fillStyle = gold;
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const k = i % 2 ? r * 0.22 : r * 0.52;
      g.lineTo(r + Math.cos(a) * k, r * 1.04 + Math.sin(a) * k);
    }
    g.closePath();
    g.fill();
    g.restore();
  },
  // ten missions: ten lights round the number
  regular: (g, r) => {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * TAU) / 10;
      g.fillStyle = "#7cffb2";
      g.beginPath();
      g.arc(r + Math.cos(a) * r * 0.56, r + Math.sin(a) * r * 0.56, r * 0.06, 0, TAU);
      g.fill();
    }
    g.fillStyle = "#ffe7b0";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `700 ${Math.round(r * 0.62)}px system-ui, 'Segoe UI', sans-serif`;
    g.fillText("10", r, r * 1.04);
  },
};
export function medalCanvas(id, cls, size) {
  return sphereCanvas(`medal-${id}`, cls, size, async (g, px) => {
    const r = px / 2;
    const rim = g.createLinearGradient(0, 0, px, px);
    rim.addColorStop(0, "#fff0c2");
    rim.addColorStop(0.45, "#d9a441");
    rim.addColorStop(1, "#7a4e16");
    g.fillStyle = rim;
    g.beginPath();
    g.arc(r, r, r * 0.98, 0, TAU);
    g.fill();
    const face = g.createRadialGradient(r * 0.8, r * 0.7, r * 0.1, r, r, r * 0.86);
    face.addColorStop(0, "#26355f");
    face.addColorStop(1, "#060912");
    g.fillStyle = face;
    g.beginPath();
    g.arc(r, r, r * 0.86, 0, TAU);
    g.fill();
    g.save();
    g.beginPath();
    g.arc(r, r, r * 0.86, 0, TAU);
    g.clip();
    await EMBLEM[id]?.(g, r);
    g.restore();
    // a soft shine on the upper left of the rim
    const shine = g.createLinearGradient(0, 0, r, r);
    shine.addColorStop(0, "rgba(255,255,255,0.35)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    g.strokeStyle = shine;
    g.lineWidth = r * 0.06;
    g.beginPath();
    g.arc(r, r, r * 0.92, Math.PI * 0.95, Math.PI * 1.55);
    g.stroke();
  });
}

// ---------------------------------------------------------------- the picture and the share
// kind: a short name for the counting ("star", "ages", "sky"); title: the line at the top; text: the message that goes with the picture;
// backdrop: where in the Milky Way (0 to 1); sources: the credit of what the picture shows besides the Milky Way; draw(g): draws the middle
// (between about y 210 and y 1190), may be async (the planets).
export async function sharePicture({ kind, title, text, backdrop = 0.5, sources = "", draw }) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  drawBackdrop(g, await loadImage(BACKDROP).catch(() => null), backdrop);
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  g.fillStyle = "#b8e6c1";
  fitText(g, title.toLocaleUpperCase(), W / 2, 140, W - 160, 600, 36);
  g.save();
  await draw(g);
  g.restore();
  g.textAlign = "center";
  g.fillStyle = "rgba(255,255,255,0.6)";
  g.font = font(600, 26);
  g.fillText("SPACE EXPLORER", W / 2, H - 118);
  g.fillStyle = "#7cffb2";
  g.font = font(600, 38);
  g.fillText(SITE, W / 2, H - 72);
  g.fillStyle = "rgba(255,255,255,0.4)";
  g.font = font(400, 17);
  g.fillText(sources ? `${CREDIT} · ${sources}` : CREDIT, W / 2, H - 26);

  const blob = await new Promise((resolve) => c.toBlob(resolve, "image/jpeg", 0.92));
  const file = new File([blob], `space-explorer-${kind}.jpg`, { type: "image/jpeg" });
  track(`share-${kind}`);
  const link = `https://${SITE}/?ref=share-${kind}`;
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text: `${text} ${link}` });
      return;
    } catch (e) {
      if (e?.name === "AbortError") return; // the visitor closed the share sheet
      // not allowed (too long after the click, in some browsers): saved as a file below
    }
  }
  // no share sheet (most desktop browsers): the picture is saved as a file
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
