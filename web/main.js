import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import {
  C_AU_PER_DAY, C_KMS, FLY_STEPS, LY_PER_AU, SECONDS_PER_YEAR as YEAR_SECONDS, SPECTRAL, SPEEDS, TRAVEL_UI,
  boardSeconds, lorentz, solveIntercept, spectralClass,
} from "./travel.js";
import { buildStory, duration, planetType, PLANET_TYPES, slug, solarName, UI } from "./story.js";

const DEFAULT_RADIUS = 1; // solar radii, display only, used where st_rad is missing

const canvas = document.getElementById("map");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
// The near plane is small because the planet close-up puts the camera a few hundredths of a unit away.
const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 100000);
camera.position.set(0, 0, 60);

// The picture goes through a small chain: the scene is drawn into a float image (with 4x smoothing of the
// edges), a bloom pass adds a soft glow around the bright parts (Sun, bright stars, the sun glint on the
// sea), and the last pass applies a film like tone curve and turns the result into screen colours. The
// shaders that write screen colours themselves (the star dots) convert to linear light first, see there.
const composer = new EffectComposer(
  renderer,
  new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 })
);
composer.addPass(new RenderPass(scene, camera));
// Star streaks at high speed: every pixel is smeared outwards from the middle of the screen, keeping the
// brightest sample (max, not the average) so a faint dot becomes a sharp streak instead of fading away.
// The pass is switched off when the strength is zero, so normal flying costs nothing.
const warpPass = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uStrength: { value: 0 }, uCenter: { value: new THREE.Vector2(0.5, 0.5) } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uStrength;
    uniform vec2 uCenter; // where the direction of flight is on the screen, see stepWarp
    varying vec2 vUv;
    void main() {
      vec2 dir = vUv - uCenter;
      vec3 base = texture2D(tDiffuse, vUv).rgb;
      vec3 best = base;
      for (int i = 1; i < 18; i++) {
        float t = float(i) / 17.0;
        vec3 s = texture2D(tDiffuse, uCenter + dir * (1.0 - uStrength * 0.2 * t)).rgb;
        best = max(best, s * (1.0 - 0.8 * t));
      }
      gl_FragColor = vec4(mix(base, best, min(1.0, uStrength * 1.6)), 1.0);
    }`,
});
warpPass.enabled = false;
composer.addPass(warpPass);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.3, 0.5, 0.92); // strength, radius, threshold
composer.addPass(bloomPass);
composer.addPass(new OutputPass());
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 0.02; // lets the close-up get near a planet that is only 0.015 units wide

// Distances run from 4 to 28000 ly. A square root squeezes the far field so the
// neighbourhood stays readable. The direction of every star is unchanged.
let compressed = true;
let zoneOn = true; // the green candidate zone, a switch in the settings
function toMapPosition(star, out) {
  const r = Math.hypot(star.x, star.y, star.z);
  if (r === 0) return out.set(0, 0, 0);
  const k = compressed ? Math.sqrt(r) / r : 1 / 10;
  // The data uses z as "north"; three.js has y up, so the axes are swapped.
  return out.set(star.x * k, star.z * k, -star.y * k);
}

// One draw call for all points: size and colour live in per-vertex attributes.
// Additive blending adds the light of overlapping stars up, so crowded areas glow like a
// star field instead of hiding each other.
const material = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uCamera: { value: new THREE.Vector3() }, // the camera in real light years, updated every frame
    uMagRef: { value: 14 },
  },
  vertexShader: `
    uniform vec3 uCamera;
    attribute float size;
    attribute float glow;
    attribute vec3 color;
    attribute vec3 truePos; // the real position in light years
    attribute float match;  // 1 normally, below 1 for the stars that a filter leaves out
    attribute float absmag; // how bright the star really is (absolute magnitude), from its radius and temperature
    uniform float uMagRef;  // the apparent magnitude that shows at about 60 % brightness, see updateCameraReal
    varying vec3 vColor;
    varying float vGlow;
    varying float vSpike; // 0 for most stars, up to 1 for the brightest ones, which get a cross
    varying float vRatio; // the part of the sprite that the star body fills (the cross needs a larger sprite)
    varying vec3 vTint;
    void main() {
      // Real brightness, as for the Gaia stars: the apparent magnitude m = M + 5 log10(d / 10 pc) tells how bright
      // the star looks from the camera, so a bright giant stands out and a faint dwarf is a dim dot, and far
      // stars fade with the square of the distance. A far crowd like the Kepler field (more than 2,000 hosts in
      // one small patch of sky, with the gaps between the sensors of its camera) becomes a soft shimmer instead
      // of a crisp grid. The floor keeps every host of the map visible as a faint dot.
      float dpc = max(length(truePos - uCamera), 0.3) / 3.2616;
      float m = absmag + 5.0 * log(dpc) / log(10.0) - 5.0;
      float fade = max(1.0 - exp(-pow(10.0, -0.4 * (m - uMagRef))), 0.18);
      float shown = match < 0.0 ? 0.0 : mix(0.1, 1.0, match);   // a star that a filter leaves out is dimmed a lot (match 0) or hidden (match -1)
      vColor = (glow > 0.5 ? color : color * fade) * shown;
      vGlow = glow;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      // A glowing star gets a larger sprite, because the halo needs room to fade out.
      // Every other star stays a small plain dot.
      float body = glow > 0.5 ? max(8.0, size * 260.0 / -mv.z) : max(mix(1.6, 2.5, fade), size * 100.0 / -mv.z);
      // Diffraction spikes: a telescope shows a cross on bright stars (from the struts that hold its mirror). The
      // cross is an effect of the optics, not a part of the star. It starts on the stars that look about 5 magnitudes
      // brighter than the faintest ones shown and is full from 8.5 magnitudes brighter, so only the clear points get one.
      vSpike = smoothstep(uMagRef - 5.0, uMagRef - 8.5, m) * step(0.5, match);
      float sprite = mix(body, max(body, 46.0), vSpike);
      vRatio = body / sprite;
      vTint = mix(color, vec3(1.0), 0.45) * max(match, 0.0);
      gl_PointSize = sprite;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    varying vec3 vColor;
    varying float vGlow;
    varying float vSpike;
    varying float vRatio;
    varying vec3 vTint;
    void main() {
      vec2 p = (gl_PointCoord - 0.5) * 2.0;
      float d = length(p) / vRatio; // 0 in the middle, 1 at the edge of the star body
      float cross = vSpike * (exp(-abs(p.x) * 40.0) * pow(max(1.0 - abs(p.y), 0.0), 2.5)
                            + exp(-abs(p.y) * 40.0) * pow(max(1.0 - abs(p.x), 0.0), 2.5));
      vec3 spikes = vTint * cross * 0.9;
      if (d > 1.0) {
        if (cross < 0.004) discard;
        gl_FragColor = vec4(pow(spikes, vec3(2.2)), 1.0);
        return;
      }
      if (vGlow < 0.5) {
        // Plain star: a small dot with a soft edge and no halo, so it stays quiet in the background.
        gl_FragColor = vec4(pow(vColor * smoothstep(1.0, 0.4, d) + spikes, vec3(2.2)), 1.0);
        return;
      }
      float halo = pow(1.0 - d, 1.8);              // soft glow in the star colour
      float core = smoothstep(0.3, 0.0, d);        // small white hot centre
      // Additive blending: the colour is added as it is, so the brightness is set here. The colours are
      // written as screen colours, the pow turns them into linear light for the post-processing chain.
      gl_FragColor = vec4(pow(vColor * halo * 1.3 + vec3(core * 0.8) + spikes, vec3(2.2)), 1.0);
    }`,
});

const BACKGROUND_WHITENING = 0.65; // how far the quiet stars are pulled towards white, 0 keeps the colour, 1 is white

let stars = [];
let points;

function buildPoints() {
  const positions = new Float32Array(stars.length * 3);
  const colors = new Float32Array(stars.length * 3);
  const sizes = new Float32Array(stars.length);
  const glows = new Float32Array(stars.length);
  const truePositions = new Float32Array(stars.length * 3);
  const matches = new Float32Array(stars.length).fill(1);
  const absmags = new Float32Array(stars.length);
  const tmp = new THREE.Vector3();
  const color = new THREE.Color();

  stars.forEach((s, i) => {
    toMapPosition(s, tmp).toArray(positions, i * 3);
    truePositions.set([s.x, s.y, s.z], i * 3);
    // Luminosity in solar units L = R^2 (T / 5772 K)^4, then the absolute magnitude M = 4.74 - 2.5 log10 L. A star
    // without a radius or a temperature gets the values of the Sun, which is flagged in the data (rad_missing).
    const luminosity = (s.st_rad ?? 1) ** 2 * ((s.st_teff ?? 5772) / 5772) ** 4;
    absmags[i] = 4.74 - 2.5 * Math.log10(luminosity);
    color.set(s.color);
    // Only the hosts of habitable candidates glow, so they stand out from thousands of other stars.
    glows[i] = s.planets.some((p) => p.habitable) ? 1 : 0;
    if (!glows[i]) {
      // Most stars are red and orange dwarfs, which made the whole background orange. Real stars look
      // whitish to the eye, so the quiet ones keep only a third of their colour and are a bit dimmer.
      const m = Math.max(color.r, color.g, color.b);
      color.lerp(new THREE.Color(m, m, m), BACKGROUND_WHITENING);
    }
    color.toArray(colors, i * 3);
    // Square root keeps giant stars from hiding their neighbours.
    sizes[i] = 0.5 + 0.5 * Math.sqrt(Math.min(s.st_rad ?? DEFAULT_RADIUS, 25));
  });

  points = new THREE.Points(new THREE.BufferGeometry(), material);
  points.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  points.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  points.geometry.setAttribute("truePos", new THREE.BufferAttribute(truePositions, 3));
  points.geometry.setAttribute("match", new THREE.BufferAttribute(matches, 1));
  points.geometry.setAttribute("absmag", new THREE.BufferAttribute(absmags, 1));
  points.geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  points.geometry.setAttribute("glow", new THREE.BufferAttribute(glows, 1));
  scene.add(points);
}

function updatePositions() {
  const attr = points.geometry.getAttribute("position");
  const tmp = new THREE.Vector3();
  stars.forEach((s, i) => {
    toMapPosition(s, tmp);
    attr.setXYZ(i, tmp.x, tmp.y, tmp.z);
  });
  attr.needsUpdate = true;
  if (measureA) drawMeasure();
  if (trip) drawTrip();
  if (gaia) placeGaia();
  if (deep) placeDeep();
}

// Gaia layer: the stars closer than 326 light years from ESA Gaia DR3, made by src/build_gaia.py, without
// the hosts of the NASA planets (those are in the list above, with their glow). The file is only read when
// the user switches the layer on. Gaia data come under the ESA terms (CC BY-NC 3.0 IGO) and need the
// credit "ESA/Gaia/DPAC", which is shown with the switch and in the credits.
const gaiaMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uCamera: { value: new THREE.Vector3() }, // where the camera is, in real light years, updated every frame
    uMagRef: { value: 6 }, // the apparent magnitude that shows at about 60 % brightness, see updateGaiaCamera
    uGain: { value: 0.85 }, // how bright a fully lit star is drawn
  },
  vertexShader: `
    uniform vec3 uCamera;
    uniform float uMagRef;
    uniform float uGain;
    attribute vec3 truePos;   // the real position in light years
    attribute float absmag;   // absolute magnitude: how bright the star really is
    attribute vec3 color;
    varying vec3 vColor;
    varying float vSpike;
    varying float vRatio;
    void main() {
      // Real brightness: the apparent magnitude m = M + 5 log10(d / 10 pc) shows how bright the star looks
      // from the camera. The light drops with the square of the distance, so stars fade when we fly away
      // and the truly bright ones (Sirius, Alpha Centauri) stand out from the many faint red dwarfs.
      float dpc = max(length(truePos - uCamera), 0.3) / 3.2616;
      float m = absmag + 5.0 * log(dpc) / log(10.0) - 5.0;
      float flux = pow(10.0, -0.4 * (m - uMagRef));
      float b = 1.0 - exp(-flux);                // soft limit, so nothing burns out to a white blob
      vColor = color * b * uGain;
      // The size depends on the brightness only: a faint star is a fine dot, a bright one a few pixels.
      // (It grew with the distance first and was a big soft disc up close.)
      float body = 1.6 + 3.2 * b;
      // Diffraction spikes on the brightest stars, see the star layer above.
      vSpike = smoothstep(uMagRef - 1.5, uMagRef - 5.0, m);
      float sprite = mix(body, max(body, 40.0), vSpike);
      vRatio = body / sprite;
      gl_PointSize = sprite;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    varying vec3 vColor;
    varying float vSpike;
    varying float vRatio;
    void main() {
      vec2 p = (gl_PointCoord - 0.5) * 2.0;
      float d = length(p) / vRatio;
      float cross = vSpike * (exp(-abs(p.x) * 40.0) * pow(max(1.0 - abs(p.y), 0.0), 2.5)
                            + exp(-abs(p.y) * 40.0) * pow(max(1.0 - abs(p.x), 0.0), 2.5));
      if (d > 1.0 && cross < 0.004) discard;
      vec3 spikes = mix(vColor, vec3(1.0), 0.45) * cross * 0.9;
      gl_FragColor = vec4(pow(vColor * smoothstep(1.0, 0.3, min(d, 1.0)) * step(d, 1.0) + spikes, vec3(2.2)), 1.0); // screen colours to linear light
    }`,
});
// Faintest magnitude that shows up clearly when the camera sits at the Sun. 6 is the naked eye and was too
// sparse, 12 (a telescope) was a mass of dots, 8.5 is in between.
const GAIA_MAG_BASE = 8.5;
const GAIA_MAG_MIN = -2; // absolute magnitudes stored in one byte, same range as MAG_MIN and MAG_MAX in src/build_gaia.py
const GAIA_MAG_MAX = 18;
let gaia = null; // { points, xyz } once the file has been read

// The camera in real light years, so the shader can work out how far each star is. The map is squeezed
// (a distance r is drawn as the square root of r) or divided by ten, this undoes it.
const gaiaCameraTmp = new THREE.Vector3();
function updateCameraReal() {
  const m = camera.position;
  const s = compressed ? m.length() : 10; // compressed: the real distance is the drawn distance squared
  gaiaCameraTmp.set(m.x * s, -m.z * s, m.y * s); // back from the three.js axes to the data axes
  material.uniforms.uCamera.value.copy(gaiaCameraTmp); // the stars of the NASA list use it for their brightness too
  // The hosts reach out to 28,000 light years, so their exposure starts higher than the Gaia layer's and also
  // opens up with the distance from the Sun, otherwise the far ones would vanish on the overview.
  material.uniforms.uMagRef.value = Math.min(19, 13.5 + 2.2 * Math.log10(1 + gaiaCameraTmp.length() / 3));
  gaiaMaterial.uniforms.uCamera.value.copy(gaiaCameraTmp);
  if (deepMaterial) {
    deepMaterial.uniforms.uCamera.value.copy(gaiaCameraTmp);
    deepMaterial.uniforms.uMagRef.value = Math.min(10.5, 8 + 0.8 * Math.log10(1 + gaiaCameraTmp.length() / 3));
  }
  // The "exposure". Seen from the Sun the layer shows what the eye would see, stars to about magnitude 6,
  // which are some thousands. A telescope view (magnitude 12) would be a mass of dots. When we fly out the
  // sky is seen from far away, where almost nothing would be visible at all, so the limit moves up with the
  // distance from the Sun, otherwise the layer would simply vanish on the overview.
  gaiaMaterial.uniforms.uMagRef.value = Math.min(12, GAIA_MAG_BASE + 2.2 * Math.log10(1 + gaiaCameraTmp.length() / 3));
}

// The few stars of the Gaia layer that have a proper name, from src/build_gaia.py. They are read at the start,
// because the list of named stars in the panel needs them before the layer is switched on.
const GAIA_NAMES = await (await fetch("data/gaia_names.json")).json();

async function loadGaia() {
  const response = await fetch("data/gaia_stars.bin");
  if (!response.ok) throw new Error(`Gaia file: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const count = buffer.byteLength / 16; // 12 bytes of position, then 4 bytes of colour and brightness
  const xyz = new Float32Array(buffer, 0, count * 3);
  const attributes = new Uint8Array(buffer, count * 12, count * 4);
  const colors = new Float32Array(count * 3);
  const absmag = new Float32Array(count);
  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    color.setRGB(attributes[i * 4] / 255, attributes[i * 4 + 1] / 255, attributes[i * 4 + 2] / 255);
    // The same quiet, whitish colour as the other background stars.
    const m = Math.max(color.r, color.g, color.b);
    color.lerp(new THREE.Color(m, m, m), BACKGROUND_WHITENING).multiplyScalar(0.9);
    color.toArray(colors, i * 3);
    absmag[i] = GAIA_MAG_MIN + (attributes[i * 4 + 3] / 255) * (GAIA_MAG_MAX - GAIA_MAG_MIN); // the byte scale of build_gaia.py
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("truePos", new THREE.BufferAttribute(xyz, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("absmag", new THREE.BufferAttribute(absmag, 1));
  const layer = new THREE.Points(geometry, gaiaMaterial);
  layer.frustumCulled = false; // the bounding box is not computed, and the layer surrounds the Sun anyway
  scene.add(layer);
  // Labels of the few stars with a proper name (SIMBAD, see build_gaia.py), shown and hidden with the layer.
  const labels = GAIA_NAMES.map((s) => {
    const sprite = labelSprite(s.name, 192);
    sprite.userData.gaiaStar = s; // declutterLabels shows it only close to the star or on the overview
    scene.add(sprite);
    return { sprite, star: s };
  });
  gaia = { points: layer, xyz, count, labels };
  placeGaia();
}

function placeGaia() {
  const attr = gaia.points.geometry.getAttribute("position");
  const tmp = new THREE.Vector3();
  const star = { x: 0, y: 0, z: 0 };
  for (let i = 0; i < gaia.count; i++) {
    star.x = gaia.xyz[i * 3];
    star.y = gaia.xyz[i * 3 + 1];
    star.z = gaia.xyz[i * 3 + 2];
    toMapPosition(star, tmp);
    attr.setXYZ(i, tmp.x, tmp.y, tmp.z);
  }
  attr.needsUpdate = true;
  for (const { sprite, star: s } of gaia.labels) toMapPosition(s, sprite.position);
}

function setGaiaVisible(visible) {
  gaia.points.visible = visible;
  for (const { sprite } of gaia.labels) sprite.visible = visible;
}

let gaiaOn = false;
const gaiaButton = document.getElementById("gaia");
function showGaiaState(state = gaiaOn ? "on" : "off") {
  const t = UI[lang];
  gaiaButton.textContent = { on: t.gaiaOn, off: t.gaiaOff, loading: t.gaiaLoading, failed: t.gaiaFailed }[state];
  gaiaButton.setAttribute("aria-pressed", String(gaiaOn));
  const note = document.getElementById("gaia-note");
  note.hidden = !(gaiaOn && gaia);
  if (gaia) note.textContent = t.gaiaNote(gaia.count.toLocaleString(lang));
}
gaiaButton.addEventListener("click", async () => {
  if (gaiaOn) {
    gaiaOn = false;
    if (gaia) setGaiaVisible(false);
    return showGaiaState();
  }
  gaiaOn = true;
  try {
    if (!gaia) {
      showGaiaState("loading");
      await loadGaia();
    }
    setGaiaVisible(true);
    showGaiaState();
  } catch (error) {
    console.error(error);
    gaiaOn = false;
    showGaiaState("failed");
  }
});

// Star surface without any image file. The pattern is computed in the shader from 3D noise at
// the point on the sphere, so there is no seam and it stays sharp however close we get. It has
// no time input, so it never changes: a fixed look that is the same on every visit.
// Three layers: granules (a cell pattern with bright middles and dark lanes), large soft
// mottling, and a few dark spots. Edges are darker than the middle (limb darkening), which is
// what makes a flat disc look like a ball of gas.
const STAR_VERTEX = `
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;

// Noise helpers shared by the star surface and its corona.
const NOISE_GLSL = `
  // A hash must not treat x, y and z alike. The first version used a product and a sum of the three
  // components, which gives the same value when two axes are swapped: every pattern was then
  // mirrored across a diagonal plane, on every planet and star. This one (after Dave Hoskins)
  // mixes the axes in different ways, which removes the mirror.
  float hash(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }
  // A shift that differs in all three axes. A shift of (s, s, s) would keep any leftover symmetry.
  vec3 seedOffset(float s) {
    return vec3(s, s * 1.7 + 3.1, s * 0.6 + 7.9);
  }
  // A few fixed random numbers per planet, from its seed: 0 to 1, different for every k.
  float rnd(float s, float k) {
    return fract(sin((s + k) * 12.9898) * 43758.5453);
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }
  // Distance to the nearest of many random points: small near a cell middle, large on the borders.
  float cells(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    float d = 1.0;
    for (int x = -1; x <= 1; x++)
      for (int y = -1; y <= 1; y++)
        for (int z = -1; z <= 1; z++) {
          vec3 g = vec3(float(x), float(y), float(z));
          vec3 o = vec3(hash(i + g), hash(i + g + 7.1), hash(i + g + 13.3));
          vec3 r = g + o - f;
          d = min(d, dot(r, r));
        }
    return sqrt(d);
  }`;

// The surface is a "heat" value from 0 to 1 that is turned into colour with a ramp from the
// star colour: dark and deep, the star colour itself, then nearly white for the hottest parts.
// That is how false colour images of the Sun look. Heat comes from granules, soft mottling,
// bright active regions with thin streaks inside them, and a few cool dark spots. The noise is
// warped by itself first, which bends the patterns into filaments instead of round blobs.
// The Milky Way behind everything. It is the panorama by ESO/S. Brunier (CC BY 4.0), a photo of the whole
// sky in galactic coordinates (the Galactic centre in the middle, longitude growing to the left, latitude
// from -90 to +90 degrees from bottom to top), shrunk to 4096 x 2048. The shader turns the viewing
// direction into galactic longitude and latitude and reads the photo there. Until the photo is there, or
// if it cannot be loaded, the shader paints a Milky Way of its own instead, which is an illustration: only
// the position of its band and of its centre are real (the standard J2000 rotation), dust lanes, clouds,
// colours and specks are invented. The sphere follows the camera, so it never comes closer.
const MILKY_WAY_FRAGMENT = `
  uniform sampler2D uPhoto;
  uniform float uPhotoMix;   // 0 while there is no photo, 1 when it has loaded
  uniform float uNebula;     // strength of the painted colour clouds
  varying vec3 vDir;
  ${NOISE_GLSL}
  void main() {
    vec3 d = normalize(vDir);
    vec3 e = vec3(d.x, -d.z, d.y); // from the three.js axes back to the data axes (equatorial)
    // Equatorial to galactic (the standard J2000 rotation).
    vec3 g = vec3(
      -0.0548755604 * e.x - 0.8734370902 * e.y - 0.4838350155 * e.z,
       0.4941094279 * e.x - 0.4448296300 * e.y + 0.7469822445 * e.z,
      -0.8676661490 * e.x - 0.1980763734 * e.y + 0.4559837762 * e.z);
    float lon = atan(g.y, g.x);   // 0 towards the Galactic centre
    float lat = asin(clamp(g.z, -1.0, 1.0));
    float away = lon * lon;       // grows towards the direction away from the centre

    // The disc: a band that is brightest and thickest towards the centre, patchy.
    float cloudy = 0.7 + 0.6 * fbm(d * 4.0 + 3.0);
    float disc = exp(-pow(lat / 0.15, 2.0)) * (0.3 + 0.7 * exp(-away / 1.8)) * cloudy * 0.8;
    float core = exp(-pow(lat / 0.05, 2.0)) * 0.4 * exp(-away / 1.0);
    float bulge = 0.7 * exp(-away / 0.08 - (lat * lat) / 0.03);
    float light = disc + core + bulge;

    // Dark lanes of dust, close to the plane and mostly towards the centre.
    float lanes = smoothstep(0.5, 0.72, fbm(vec3(g.x * 5.0, g.y * 5.0, g.z * 15.0) + 11.0));
    float dust = lanes * exp(-pow((lat - 0.02) / 0.07, 2.0)) * (0.4 + 0.6 * exp(-away / 3.0));
    light *= 1.0 - 0.85 * dust;

    // Warm light near the centre, bluer further out, the dust makes it redder.
    vec3 warm = vec3(1.0, 0.78, 0.52);
    vec3 cool = vec3(0.62, 0.72, 1.0);
    vec3 col = mix(cool, warm, 0.1 + 0.8 * exp(-away / 0.9)) * light * 0.9;
    col *= mix(vec3(1.0), vec3(1.0, 0.82, 0.62), dust);

    // Fine specks of unresolved stars, more of them in the band.
    float density = 0.2 + 0.8 * clamp(light * 1.4, 0.0, 1.0);
    float specks = smoothstep(0.84, 0.97, noise(d * 300.0 + 5.0)) + smoothstep(0.86, 0.98, noise(d * 620.0 + 9.0)) * 0.7;
    col += vec3(0.9, 0.93, 1.0) * specks * density * 0.45;

    col += vec3(0.004, 0.005, 0.008); // the sky is not quite black
    vec3 painted = pow(max(col, vec3(0.0)), vec3(2.2)); // authored as screen colours, see PLANET_FRAGMENT

    // The photo. The texture is read as sRGB, so the value is already in linear light. It is brightened a
    // little (the factor is also named in the README).
    vec2 uv = vec2(0.5 - lon / 6.2831853, 0.5 + lat / 3.1415927);
    vec3 photo = texture2D(uPhoto, uv).rgb * 1.1;

    // Clouds of colour like in pictures of nebulae, painted, very faint, close to the plane of the Galaxy. They
    // are an illustration and not real objects, uNebula = 0 switches them off.
    float cloudA = fbm(d * 2.2 + 7.0);
    float cloudB = fbm(d * 4.0 + 19.0);
    vec3 cloudColour = mix(vec3(0.55, 0.2, 0.45), vec3(0.15, 0.25, 0.65), smoothstep(0.35, 0.65, cloudB));
    float cloudMask = smoothstep(0.5, 0.78, cloudA) * exp(-pow(lat / 0.55, 2.0));
    vec3 nebula = pow(cloudColour, vec3(2.2)) * cloudMask * uNebula;

    gl_FragColor = vec4(mix(painted, photo, uPhotoMix) + nebula, 1.0);
    #include <colorspace_fragment>
  }`;
const milkyWayPhoto = new THREE.TextureLoader().load("textures/milkyway.jpg", () => {
  milkyWay.material.uniforms.uPhotoMix.value = 1;
});
milkyWayPhoto.colorSpace = THREE.SRGBColorSpace;
// No mipmaps: the seam of the photo (longitude 180 degrees) would show as a line, and the photo is about
// as fine as the screen, so it needs none.
milkyWayPhoto.generateMipmaps = false;
milkyWayPhoto.minFilter = THREE.LinearFilter;
const milkyWay = new THREE.Mesh(
  new THREE.SphereGeometry(50000, 48, 32),
  new THREE.ShaderMaterial({
    uniforms: { uPhoto: { value: milkyWayPhoto }, uPhotoMix: { value: 0 }, uNebula: { value: 0.4 } },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: MILKY_WAY_FRAGMENT,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
  })
);
milkyWay.renderOrder = -100; // before everything else
milkyWay.frustumCulled = false;
scene.add(milkyWay);

const STAR_FRAGMENT = `
  uniform vec3 uColor;
  uniform float uSeed;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vView;
  ${NOISE_GLSL}

  void main() {
    vec3 p = normalize(vPos) + seedOffset(uSeed);
    vec3 warp =vec3(fbm(p * 2.0), fbm(p * 2.0 + 11.3), fbm(p * 2.0 + 23.7));
    vec3 q = p + 0.4 * (warp - 0.5);

    float granule = 1.0 - smoothstep(0.0, 0.85, cells(q * 13.0));
    float fine = fbm(q * 40.0);
    float mottle = fbm(q * 4.0);
    float region = smoothstep(0.5, 0.78, fbm(q * 2.6 + 3.0));          // large bright areas
    float ridge = pow(1.0 - abs(2.0 * fbm(q * 9.0 + 19.0) - 1.0), 6.0); // thin bright streaks
    float spots = smoothstep(0.6, 0.7, fbm(p * 2.0 + 5.0));

    float heat = 0.34 + 0.22 * granule + 0.2 * fine + 0.3 * (mottle - 0.5) + 0.6 * region * (0.55 + 0.9 * ridge);
    heat *= 1.0 - 0.55 * spots;

    float mu = clamp(dot(normalize(vNormal), normalize(vView)), 0.0, 1.0);
    heat *= 0.72 + 0.28 * pow(mu, 0.5); // a mild darkening towards the edge

    vec3 deep = uColor * 0.3;
    vec3 mid = uColor * 1.1;
    vec3 hot = mix(uColor, vec3(1.0), 0.8);
    vec3 color = heat < 0.5 ? mix(deep, mid, heat / 0.5) : mix(mid, hot, clamp((heat - 0.5) / 0.5, 0.0, 1.0));
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }`;

// The corona is a larger sphere drawn from the inside (back faces), so only the ring that
// sticks out around the star disc is visible. Its brightness falls off with the distance
// from the star and varies around it, which gives uneven streamers instead of a smooth halo.
const CORONA_RATIO = 2.2; // corona radius in star radii
const CORONA_FRAGMENT = `
  uniform vec3 uColor;
  uniform float uSeed;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vView;
  ${NOISE_GLSL}

  void main() {
    float mu = abs(dot(normalize(vNormal), normalize(vView)));
    float b = sqrt(max(0.0, 1.0 - mu * mu)) * ${CORONA_RATIO.toFixed(2)}; // distance from the middle, in star radii
    if (b < 1.0) discard;                                                // the star itself covers this part
    float falloff = exp(-(b - 1.0) * 4.5);
    vec3 dir = normalize(vPos) + seedOffset(uSeed);
    float streamers = 0.45 + 1.1 * fbm(dir * 3.5) + 0.5 * fbm(dir * 9.0);
    float edge = 1.0 - smoothstep(${(CORONA_RATIO * 0.7).toFixed(2)}, ${CORONA_RATIO.toFixed(2)}, b); // no hard cut at the sphere edge
    float a = falloff * streamers * edge;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), 0.1) * a * 0.5, 1.0);
    #include <colorspace_fragment>
  }`;

// Every star gets its own pattern, taken from its name, so two stars do not look like copies.
function seedFrom(text) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return h / 10;
}

let glowMap = null;
function glowTexture() {
  if (glowMap) return glowMap;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const gradient = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.2, "rgba(255,255,255,0.55)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.14)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gradient;
  g.fillRect(0, 0, 128, 128);
  glowMap = new THREE.CanvasTexture(c);
  return glowMap;
}

const starMaterial = (color, name) =>
  new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uSeed: { value: seedFrom(name) } },
    vertexShader: STAR_VERTEX,
    fragmentShader: STAR_FRAGMENT,
  });

// A star: the textured ball with its corona as a child, so both always move and scale together.
function starBody(color, name, radius) {
  const star = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 48), starMaterial(color, name));
  const corona = new THREE.Mesh(
    new THREE.SphereGeometry(radius * CORONA_RATIO, 48, 32),
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uSeed: { value: seedFrom(name) + 3 } },
      vertexShader: STAR_VERTEX,
      fragmentShader: CORONA_FRAGMENT,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  star.add(corona);
  star.userData.corona = corona;
  corona.userData.radius = radius * CORONA_RATIO;
  return star;
}

// The corona is a sphere seen from the inside, so it only makes sense from outside. A camera
// that sits within it (a close-up of Mercury is 0.16 units from the Sun, the corona reaches 0.18)
// would see its inner wall everywhere, a yellow veil with a hard edge. Inside it is switched off.
const coronaTmp = new THREE.Vector3();
function updateCorona(star) {
  const corona = star?.userData.corona;
  if (!corona) return;
  corona.visible = camera.position.distanceTo(star.getWorldPosition(coronaTmp)) > corona.userData.radius * 1.02;
}

// A glow around a star: a bright inner halo and a wide faint one. Both scale with the scene,
// so they grow when we fly closer.
// The glow is a flat square that always faces the camera. A plain sprite sits at the depth of its
// star, and a planet close to the star (Mercury) is cut by that square: the half behind it got
// covered by a hard edged yellow haze. These squares are pushed to the very back instead, so
// everything solid is drawn in front of them and the glow only shows against empty sky.
const GLOW_VERTEX = `
  uniform float uSize;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy * uSize;
    gl_Position = projectionMatrix * mv;
    gl_Position.z = gl_Position.w * 0.9999;
  }`;
const GLOW_FRAGMENT = `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    gl_FragColor = vec4(uColor, texture2D(uMap, vUv).a * uOpacity);
    #include <colorspace_fragment>
  }`;
function starGlow(color, size) {
  const layer = (scale, opacity) => {
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: glowTexture() },
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity },
          uSize: { value: size * scale },
        },
        vertexShader: GLOW_VERTEX,
        fragmentShader: GLOW_FRAGMENT,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      })
    );
    glow.frustumCulled = false; // the shader moves the square, the bounds of the plane would be wrong
    return glow;
  };
  const group = new THREE.Group();
  group.add(layer(1, 0.5), layer(2.4, 0.18));
  return group;
}

// The Sun is the origin of the map and gets its own marker.
const SUN_RADIUS = 0.08; // map units
const SUN_COLOR = 0xffd166;
const sun = starBody(SUN_COLOR, "Sun", SUN_RADIUS);
scene.add(sun);

// Streamers of the corona: soft rays that fan out from the Sun, drawn on a flat sheet that always faces the
// camera. They flicker slowly. The rays are an illustration of the look of the corona, not data. The sheet is
// hidden when the camera is inside the corona, where it would only be a veil.
function makeStarRays(color, size) {
const rays = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv - 0.5;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      varying vec2 vUv;
      ${NOISE_GLSL}
      void main() {
        float r = length(vUv) * 2.0;
        if (r > 1.0) discard;
        float a = atan(vUv.y, vUv.x);
        vec2 dir = vec2(cos(a), sin(a));
        // The noise is read on a circle, so the rays close up all the way round.
        float rays = noise(vec3(dir * 3.0, uTime * 0.04)) * 0.6 + noise(vec3(dir * 8.0 + 4.0, uTime * 0.07)) * 0.4;
        rays = pow(smoothstep(0.35, 0.85, rays), 1.6);
        float fall = pow(1.0 - r, 2.2) * smoothstep(0.05, 0.16, r);
        // The colour of the star, a little lighter near the star and warmer further out (uColor is already linear).
        vec3 col = mix(mix(uColor, vec3(1.0), 0.3), uColor * vec3(1.0, 0.8, 0.65), r);
        gl_FragColor = vec4(col, rays * fall * 0.55);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
);
rays.scale.setScalar(size);
return rays;
}
const sunRays = makeStarRays(SUN_COLOR, SUN_RADIUS * 16);
scene.add(sunRays);
scene.add(starGlow(SUN_COLOR, SUN_RADIUS * 7));

// Sizes inside a system view: the star has a fixed size, a planet has its real size
// relative to its star (the Sun is about 109 Earth radii wide). That would make most planets
// invisible, so no planet is drawn smaller than a few pixels at the default view distance.
const EARTH_RADII_PER_SUN = 109.1;
const MIN_PLANET_PER_VIEW_DISTANCE = 0.009; // a planet is drawn at least this big (relative to the view), 0.006 was too small to see

// Our own solar system. The map is in light years, where all of it (Neptune is 0.0005 ly out)
// would be a single point, so this is a separate display that is only drawn up close.
// Orbit radii use the same square root idea as the star map so Neptune stays inside the
// distance to the nearest star. Distances are not to scale, sizes are, up to the minimum above.
// Values: mean orbit radius (AU), orbital period (years), radius (Earth radii).
const PLANETS = [
  // Mercury: the MESSENGER colour mosaic (MD3, NASA/JHU APL/Carnegie Institution, USGS). Its colours are
  // enhanced: three filters at 1000, 750 and 430 nanometres put on red, green and blue. The panel says so.
  { name: "Mercury", au: 0.387, years: 0.241, radius: 0.383, color: 0xb5a8a0, texture: "textures/mercury.jpg", bump: 10, noteKey: "mercuryNote" },
  // Venus, Saturn, Uranus and Neptune have no usable map, they are painted by the program (see SOLAR_LOOK_FRAGMENT).
  { name: "Venus", au: 0.723, years: 0.615, radius: 0.949, color: 0xe8c98a, look: 0, noteKey: "paintedNote" },
  // Only Earth has a texture. For the other planets and for every exoplanet a picture would be invented.
  {
    name: "Earth",
    au: 1.0,
    years: 1.0,
    radius: 1.0,
    color: 0x4da3ff,
    earth: true, // drawn with the NASA maps, see earthMaterial
    // The Moon: 27.32 day orbit and 0.273 Earth radii are real. Its distance is not: in reality
    // it is about 60 Earth radii away, which would leave the picture, so it is drawn at 2.6.
    moon: { years: 27.32 / 365.25, size: 0.2727, orbit: 2.6, color: 0xb4b4b4, label: "Moon", texture: "textures/moon.jpg" },
  },
  // Mars: the Viking Orbiter global colour mosaic (NASA/JPL/USGS), shrunk to 4096 x 2048. Its green is
  // not a measurement, it was made up from the red and violet pictures, so the colour is close to
  // what the eye would see and not exact.
  { name: "Mars", au: 1.524, years: 1.881, radius: 0.532, color: 0xd1603d, texture: "textures/mars.jpg", bump: 8 },
  // Jupiter: Cassini's global map of December 2000 (NASA/JPL/Space Science Institute). The clouds
  // of a gas giant change, so it shows Jupiter as it looked then.
  { name: "Jupiter", au: 5.203, years: 11.86, radius: 10.97, color: 0xd9b38c, texture: "textures/jupiter.jpg", flatten: 0.935 },
  { name: "Saturn", au: 9.537, years: 29.46, radius: 9.14, color: 0xe6d3a3, rings: true, flatten: 0.902, look: 1, noteKey: "paintedNote" },
  { name: "Uranus", au: 19.19, years: 84.01, radius: 3.98, color: 0x9fe3e8, flatten: 0.977, rings: "uranus", look: 2, noteKey: "paintedNote" },
  { name: "Neptune", au: 30.07, years: 164.8, radius: 3.86, color: 0x4b70dd, flatten: 0.983, rings: "neptune", look: 3, noteKey: "paintedNote" },
];
// Sidereal rotation periods in hours, from the NASA Planetary Fact Sheet (nssdc.gsfc.nasa.gov, metric,
// rounded as printed there; Earth and Mars from their own sheets). A minus sign means the planet turns
// the other way, as Venus and Uranus do. The axis tilts are not applied yet, every planet spins about
// its own up axis (Saturn's and its rings' tilt aside).
const ROTATION_HOURS = {
  Mercury: 1407.6,
  Venus: -5832.5,
  Earth: 23.9345,
  Mars: 24.6229,
  Jupiter: 9.9,
  Saturn: 10.7,
  Uranus: -17.2,
  Neptune: 16.1,
};
// Real orbits, from JPL (NASA), made by src/fetch_jpl.py and src/build_orbits.py. The eight planets sit where
// their Keplerian elements put them on the day of the visit (JPL "Approximate Positions of the Major Planets",
// good to a few arc minutes to hours of arc over 1800 to 2050), the comets and interstellar objects are
// computed from the elements of the Small-Body Database, the spacecraft come from the flight paths of
// Horizons. The clock of the page starts on today's date and runs with the time slider. The map is still the
// squeezed one: a distance r in AU is drawn as 0.3 * sqrt(r) in the direction it really has.
// The ecliptic is the flat plane of the Solar System view, it is not tilted against the star coordinates.
const ORBITS = await (await fetch("data/orbits.json")).json();
const DEG = Math.PI / 180;
const JD_AT_LOAD = Date.now() / 86400000 + 2440587.5; // the Julian day of this moment
const GAUSS_K = 0.01720209895; // rad per day, for a body of one AU
const LIGHT_MINUTES_PER_AU = 8.31675;

function solveKepler(M, e) {
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 80; i++) {
    const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-12) break;
  }
  return E;
}
function solveHyperbolic(M, e) {
  let H = Math.asinh(M / e);
  for (let i = 0; i < 80; i++) {
    const d = (e * Math.sinh(H) - H - M) / (e * Math.cosh(H) - 1);
    H -= d;
    if (Math.abs(d) < 1e-12) break;
  }
  return H;
}
// A point in the plane of the orbit (xp towards the perihelion) turned into ecliptic coordinates in AU.
function orbitToEcliptic(xp, yp, incl, node, peri) {
  const cw = Math.cos(peri * DEG), sw = Math.sin(peri * DEG);
  const cO = Math.cos(node * DEG), sO = Math.sin(node * DEG);
  const ci = Math.cos(incl * DEG), si = Math.sin(incl * DEG);
  return {
    x: (cw * cO - sw * sO * ci) * xp + (-sw * cO - cw * sO * ci) * yp,
    y: (cw * sO + sw * cO * ci) * xp + (-sw * sO + cw * cO * ci) * yp,
    z: sw * si * xp + cw * si * yp,
  };
}
// The row of the table at a time: element = value + rate * centuries since J2000.
function planetElements(row, jd) {
  const T = (jd - 2451545) / 36525;
  const el = {};
  for (const k of Object.keys(row.value)) el[k] = row.value[k] + row.rate[k] * T;
  return el;
}
function planetPosition(row, jd) {
  const el = planetElements(row, jd);
  const peri = el.peri - el.node; // the argument of the perihelion
  let M = (el.L - el.peri) % 360;
  if (M > 180) M -= 360;
  if (M < -180) M += 360;
  const E = solveKepler(M * DEG, el.e);
  return orbitToEcliptic(el.a * (Math.cos(E) - el.e), el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E), el.I, el.node, peri);
}
// A small body from the elements of the Small-Body Database (a, e, i, om, w in degrees, tp the Julian day of the perihelion).
function bodyPosition(el, jd) {
  const n = el.n !== undefined ? el.n * DEG : GAUSS_K / Math.sqrt(Math.abs(el.a) ** 3); // rad per day
  const M = n * (jd - el.tp);
  if (el.e < 1) {
    const Mn = ((((M + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
    const E = solveKepler(Mn, el.e);
    return orbitToEcliptic(el.a * (Math.cos(E) - el.e), el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E), el.i, el.om, el.w);
  }
  const H = solveHyperbolic(M, el.e);
  return orbitToEcliptic(el.a * (Math.cosh(H) - el.e), -el.a * Math.sqrt(el.e * el.e - 1) * Math.sinh(H), el.i, el.om, el.w);
}
// Points of the whole orbit in ecliptic AU. An ellipse is one full turn, a hyperbola is cut at 60 AU from the Sun.
function orbitCurve(el, count = 160) {
  const out = [];
  if (el.e < 1) {
    for (let k = 0; k <= count; k++) {
      const E = (k / count) * 2 * Math.PI;
      out.push(orbitToEcliptic(el.a * (Math.cos(E) - el.e), el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E), el.i, el.om, el.w));
    }
  } else {
    const hMax = Math.acosh(Math.max(1, (60 / Math.abs(el.a) + 1) / el.e));
    for (let k = 0; k <= count; k++) {
      const H = (-1 + (2 * k) / count) * hMax;
      out.push(orbitToEcliptic(el.a * (Math.cosh(H) - el.e), -el.a * Math.sqrt(el.e * el.e - 1) * Math.sinh(H), el.i, el.om, el.w));
    }
  }
  return out;
}
// Ecliptic AU to the map of the Solar System view. The plane of the ecliptic is the flat plane, the north is up.
function mapEcliptic(p, out) {
  const r = Math.hypot(p.x, p.y, p.z);
  const k = r > 0 ? (0.3 * Math.sqrt(r)) / r : 0;
  return out.set(p.x * k, p.z * k, -p.y * k);
}
// The rows of the planet table for our names; Earth has the Earth-Moon barycentre.
const ELEMENT_ROW = { Mercury: "Mercury", Venus: "Venus", Earth: "EM Bary", Mars: "Mars", Jupiter: "Jupiter", Saturn: "Saturn", Uranus: "Uranus", Neptune: "Neptune" };
const jdToDate = (jd) => new Date((jd - 2440587.5) * 86400000);

// Every name above a body. declutterLabels fades out the ones that would lie on top of a nearer one.
const allLabels = new Set();
// While a trip of the planner is flying (turn to exit), the names above the bodies, the green habitable zone and the story panel are
// switched off, so the view of the flight is clean. See setQuiet. The names fade out through their normal fade.
let quiet = false;
const labelPoint = new THREE.Vector3();
// true when the label and everything above it is visible, false when something is hidden, null when it is no
// longer in the scene (its system was taken down)
function labelShown(sprite) {
  let shown = true;
  let o = sprite;
  for (; o.parent; o = o.parent) if (!o.visible) shown = false;
  if (o !== scene) return null;
  return shown;
}
// The name of a star of the Gaia layer is wanted when the camera is near that star (up to about 20 light years)
// or far out on the overview of the neighbourhood (more than about 150 light years from the Sun), and not
// in between, where it would hang in the middle of the Solar System. 1 shown, 0 hidden.
function nearOnly(sprite) {
  const star = sprite.userData.gaiaStar;
  if (!star) return 1;
  const cam = gaiaCameraTmp; // the camera in real light years, see updateCameraReal
  const toStar = Math.hypot(star.x - cam.x, star.y - cam.y, star.z - cam.z);
  const near = 1 - THREE.MathUtils.smoothstep(toStar, 8, 20);
  const far = THREE.MathUtils.smoothstep(cam.length(), 120, 250);
  return Math.max(near, far);
}

function declutterLabels() {
  if (quiet) {
    for (const s of allLabels) {
      s.userData.fade -= s.userData.fade * 0.2;
      s.material.opacity = s.userData.fade * nearOnly(s);
    }
    return;
  }
  const W = window.innerWidth;
  const H = window.innerHeight;
  const entries = [];
  for (const s of allLabels) {
    const shown = labelShown(s);
    if (shown === null) {
      allLabels.delete(s);
      continue;
    }
    if (!shown) continue;
    if (nearOnly(s) < 0.02) {
      s.material.opacity = 0; // out of range, and it must not keep other names away either
      continue;
    }
    s.getWorldPosition(labelPoint);
    const distance = camera.position.distanceTo(labelPoint);
    labelPoint.project(camera);
    if (labelPoint.z > 1 || Math.abs(labelPoint.x) > 1.2 || Math.abs(labelPoint.y) > 1.2) continue;
    entries.push({ s, x: (labelPoint.x * 0.5 + 0.5) * W, y: (0.5 - labelPoint.y * 0.5) * H, distance });
  }
  entries.sort((a, b) => a.distance - b.distance); // the nearer name wins
  const taken = [];
  for (const { s, x, y } of entries) {
    const w = s.scale.x * H;
    const h = s.scale.y * H;
    const box = { x0: x - w / 2, x1: x + w / 2, y0: y - 1.3 * h, y1: y - 0.3 * h }; // the text sits above its point
    const covered = taken.some((t) => box.x0 < t.x1 && box.x1 > t.x0 && box.y0 < t.y1 && box.y1 > t.y0);
    s.userData.fade += ((covered ? 0 : 1) - s.userData.fade) * 0.2;
    s.material.opacity = s.userData.fade * nearOnly(s);
    if (!covered) taken.push(box);
  }
}

function labelSprite(text, width = Math.max(128, Math.ceil((text.length * 11 + 20) / 32) * 32)) {
  // The canvas is as wide as the text needs, a long name (Teegarden's Star b) was cut at both ends in 128 pixels.
  const c = document.createElement("canvas");
  c.width = width;
  c.height = 32;
  const g = c.getContext("2d");
  g.fillStyle = "#dfe6f3";
  g.font = "500 19px system-ui, 'Segoe UI', sans-serif";
  g.textAlign = "center";
  g.shadowColor = "rgba(0, 0, 0, 0.85)"; // a soft dark edge keeps the letters readable on bright ground
  g.shadowBlur = 5;
  g.fillText(text, width / 2, 22);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), sizeAttenuation: false, depthTest: false, transparent: true })
  );
  sprite.scale.set(0.16 * (width / 128), 0.04, 1);
  sprite.center.set(0.5, -0.3); // the text sits above the planet
  sprite.userData.fade = 1; // 1 shown, 0 hidden because another label is in the way, see declutterLabels
  allLabels.add(sprite);
  // The text can be changed later, the labels of our own system follow the language of the page.
  sprite.userData.setText = (next) => {
    g.clearRect(0, 0, width, 32);
    g.fillText(next, width / 2, 22);
    sprite.material.map.needsUpdate = true;
  };
  return sprite;
}

// A textured planet is lit by the star, so it shows a day and a night side. Plain planets
// are just coloured and need no light.
const textureLoader = new THREE.TextureLoader();

// Look of an exoplanet. Nobody has seen the surface of one, so this is a schematic that only
// uses what is measured: the type comes from the radius, the tint from the temperature and the
// light from the direction of the star. What it does NOT show on purpose: continents, oceans,
// clouds, ice caps, rings, city lights. The patterns are calm and low contrast; only the gas
// giants have bands, because that is what gas giants are known to look like in our own system.
const PLANET_VERTEX = `
  varying vec3 vPos;
  varying vec3 vNormal;      // world directions, for the light of the star
  varying vec3 vNormalView;  // view directions, for the glow at the edge
  varying vec3 vView;
  void main() {
    vPos = position;
    // The groups are only moved, never rotated, so this is the normal in world directions.
    vNormal = normalize(mat3(modelMatrix) * normal);
    vNormalView = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;

const PLANET_FRAGMENT = `
  uniform int uType;        // 0 rocky, 1 mini-Neptune, 2 Neptune-like, 3 gas giant, 4 unknown
  uniform float uTemp;      // equilibrium temperature in K, 0 when unknown
  uniform float uSeed;
  uniform vec3 uLightDir;   // from the planet towards its star
  uniform float uAtmosphere; // 1 for planets with a thick gas envelope, 0 otherwise
  uniform float uArt;        // 1 in the artistic look: invented patterns on top of the colour
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vNormalView;
  varying vec3 vView;
  uniform int uForce;       // -1 for none, otherwise the number of the world kind to draw
  ${NOISE_GLSL}

  void main() {
    vec3 n = normalize(vPos);
    vec3 p = n * 3.0 + seedOffset(uSeed);
    vec3 base;
    if (uType == 0) {
      // Rocky: a calm grey brown with a faint mottling, nothing that looks like a landscape.
      base = mix(vec3(0.36, 0.33, 0.30), vec3(0.48, 0.44, 0.40), fbm(p * 2.0));
    } else if (uType == 1) {
      // Mini-Neptune: a hazy pale teal, nearly smooth.
      base = mix(vec3(0.44, 0.60, 0.64), vec3(0.60, 0.72, 0.75), fbm(vec3(p.x, p.y * 0.6, p.z) * 1.5));
    } else if (uType == 2) {
      // Neptune-like: blue with soft, broad bands.
      float bands = noise(vec3(0.0, n.y * 4.0 + fbm(p) * 0.8, 0.0) + seedOffset(uSeed));
      base = mix(vec3(0.14, 0.28, 0.60), vec3(0.28, 0.48, 0.78), bands);
    } else if (uType == 3) {
      // Gas giant: horizontal bands that are bent a little by noise.
      float w = n.y * 7.0 + 1.6 * fbm(vec3(p.x * 1.2, p.y * 0.4, p.z * 1.2));
      base = mix(vec3(0.68, 0.40, 0.20), vec3(0.94, 0.80, 0.56), 0.5 + 0.5 * sin(w * 3.0));
    } else {
      base = vec3(0.45);
    }

    // Very hot planets look darker and redder, cold ones slightly bluer.
    float hot = smoothstep(1000.0, 2200.0, uTemp);
    float cold = uTemp > 0.0 ? smoothstep(250.0, 120.0, uTemp) : 0.0;
    base = mix(base, base * vec3(1.25, 0.8, 0.65), hot * 0.6);
    base = mix(base, base * vec3(0.85, 0.95, 1.1), cold * 0.5);

    // Artistic look. Every planet is drawn as one kind of world. The temperature decides which kinds
    // are possible (molten, hot, temperate, frozen) and a number drawn from the planet's name picks
    // one of them, so neighbours do not look alike. The colours, patterns and clouds are invented.
    // They are switched on by the user and labelled as such in the panel.
    vec3 emit = vec3(0.0);     // light the planet gives off itself, like lava
    float reliefAmount = 0.3;  // how strongly the invented terrain bends the light
    float gloss = 0.0;         // 0 dull, 1 shiny: a soft highlight of the star on the surface
    if (uArt > 0.5) {
      float rA = rnd(uSeed, 11.0);
      float rFreq = rnd(uSeed, 5.0);
      float jitter = rnd(uSeed, 12.0) - 0.5;

      if (uType == 0) {
        // Kinds of rocky world: 0 lava, 1 rust desert, 2 slate, 3 ash, 4 sand desert, 5 dusty ice, 6 umber.
        // How often each kind comes up is a choice of looks. The dark ash world is the rarest one,
        // seven in a row of them made the whole set look dull.
        int arch;
        if (uTemp >= 900.0) arch = 0;                                                  // molten
        else if (uTemp > 0.0 && uTemp < 230.0) arch = rA < 0.35 ? 5 : (rA < 0.5 ? 3 : (rA < 0.75 ? 1 : 4));  // cold: ice, ash, rust, sand
        else if (uTemp >= 450.0) arch = rA < 0.45 ? 4 : (rA < 0.8 ? 1 : 3);            // hot: sand, rust, ash
        else arch = rA < 0.25 ? 1 : (rA < 0.5 ? 2 : (rA < 0.6 ? 3 : (rA < 0.8 ? 4 : 6)));  // temperate: rust, slate, ash, sand, umber
        if (uForce >= 0) arch = uForce;  // a few planets are set to a look by hand, see FORCED_LOOK

        // Shared building blocks: a bent coordinate, then large, medium and fine structure.
        vec3 warp = vec3(fbm(p * 1.2), fbm(p * 1.2 + 5.2), fbm(p * 1.2 + 9.7));
        vec3 q = p + 0.5 * (warp - 0.5);
        float large = fbm(q * 1.4 + 3.0);
        float mid = fbm(q * 3.5);
        float fine = fbm(q * 9.0);

        if (arch == 0) {
          // Lava: a dark crust with a glowing net of cracks, hotter spots where it is thin.
          vec3 crust = vec3(0.13, 0.045, 0.035) * (0.8 + 0.5 * mid);
          float vein = pow(1.0 - abs(2.0 * fbm(q * 5.0 + 17.0) - 1.0), 5.0);
          float vein2 = pow(1.0 - abs(2.0 * fbm(q * 11.0 + 31.0) - 1.0), 7.0);
          float lava = clamp(vein * 0.9 + vein2 * 0.6 + smoothstep(0.62, 0.8, large) * 0.6, 0.0, 1.0);
          base = crust;
          emit = mix(vec3(0.9, 0.2, 0.03), vec3(1.0, 0.75, 0.2), lava * lava) * lava * 1.3;
          reliefAmount = 0.25;
        } else if (arch == 1) {
          // Rust desert: salmon red dust, dark basins, soft light patches.
          base = mix(vec3(0.78, 0.38, 0.30), vec3(0.36, 0.16, 0.14), smoothstep(0.45, 0.65, large));
          base = mix(base, vec3(0.92, 0.58, 0.46), smoothstep(0.55, 0.8, mid) * 0.5);
          base *= 0.9 + 0.2 * fine;
        } else if (arch == 2) {
          // Slate world: grey blue plains and lighter grey brown highlands, no clouds. It was a blue ocean
          // world with clouds first (and teal and green before that), but nothing says a planet like this
          // has water, so a strong blue was claiming too much.
          vec3 sea = mix(vec3(0.34, 0.37, 0.43), vec3(0.48, 0.51, 0.57), mid);
          vec3 land = mix(vec3(0.50, 0.48, 0.45), vec3(0.68, 0.64, 0.58), fine);
          float isLand = smoothstep(0.52, 0.58, large);
          base = mix(sea, land, isLand);
          reliefAmount = 0.05 + 0.25 * isLand; // the sea stays smooth
        } else if (arch == 3) {
          // Ash world: dark charcoal with faint lighter wisps.
          base = mix(vec3(0.24, 0.26, 0.31), vec3(0.46, 0.49, 0.55), mid) * (0.85 + 0.3 * fine);
          float wisp = smoothstep(0.6, 0.85, noise(vec3(n.x * 2.5, n.y * 10.0, n.z * 2.5) + seedOffset(uSeed * 3.0)));
          base = mix(base, vec3(0.62, 0.66, 0.72), wisp * 0.35);
        } else if (arch == 4) {
          // Sand desert: tan with darker rock and soft mottling. It had regular dune stripes first (a sine),
          // they looked like a faint zebra, so the mottling is plain noise now.
          float mottle = fbm(q * 2.5 + 13.0);
          base = mix(vec3(0.76, 0.60, 0.36), vec3(0.45, 0.32, 0.22), smoothstep(0.5, 0.7, large));
          base *= (0.88 + 0.16 * mottle) * (0.9 + 0.2 * fine);
        } else if (arch == 5) {
          // Dusty ice world: dark teal slate ice with faint cracks and torn patches of ochre dust, thickest
          // around one region, the patches stretched diagonally. It was pale blue with cracks first.
          // The slate is a muted grey blue, a little glossy like wet ice; the ochre patches are small.
          base = mix(vec3(0.17, 0.22, 0.27), vec3(0.28, 0.34, 0.40), mid);
          float crack = pow(1.0 - abs(2.0 * fbm(q * 6.0 + 23.0) - 1.0), 8.0);
          base = mix(base, vec3(0.09, 0.12, 0.17), crack * 0.5);
          float region = smoothstep(0.2, 0.75, fbm(q * 1.1 + 31.0));
          vec3 along = vec3(n.x * 14.0 + n.y * 8.0, n.y * 34.0 - n.x * 10.0, n.z * 14.0);
          float streak = fbm(along + seedOffset(uSeed * 3.0));
          float grit = fbm(n * 60.0 + seedOffset(uSeed * 5.0));
          float dust = smoothstep(0.60, 0.70, streak + 0.22 * region) * smoothstep(0.42, 0.66, grit + 0.3 * region);
          dust *= 0.4 + 0.6 * region;
          base = mix(base, mix(vec3(0.92, 0.64, 0.30), vec3(1.0, 0.80, 0.44), grit), dust);
          gloss = 1.0 - dust; // only the slate shines, the dust is dull
          reliefAmount = 0.15;
        } else {
          // Umber world: cool grey brown ground with darker patches. It was olive green first, which
          // looked bad on the several planets that got it.
          base = mix(vec3(0.38, 0.30, 0.26), vec3(0.60, 0.50, 0.42), large) * (0.85 + 0.3 * mid);
          base = mix(base, vec3(0.22, 0.17, 0.15), smoothstep(0.58, 0.72, mid) * 0.5);
        }
        // A little hue shift per planet, so two planets of the same kind are still not the same.
        base *= vec3(1.0 + 0.16 * jitter, 1.0, 1.0 - 0.16 * jitter);
      } else if (uType == 1 || uType == 2) {
        // Mini-Neptune and Neptune-like: one of four colour families, soft bands, a few lighter swirls.
        float rP = rnd(uSeed, 14.0);
        vec3 low;
        vec3 high;
        if (rP < 0.3) { low = vec3(0.14, 0.30, 0.58); high = vec3(0.32, 0.52, 0.82); }
        else if (rP < 0.55) { low = vec3(0.20, 0.45, 0.28); high = vec3(0.45, 0.70, 0.40); }
        else if (rP < 0.8) { low = vec3(0.38, 0.30, 0.60); high = vec3(0.62, 0.55, 0.82); }
        else { low = vec3(0.30, 0.55, 0.62); high = vec3(0.60, 0.80, 0.82); }
        float bands = 0.5 + 0.5 * sin(n.y * mix(6.0, 12.0, rFreq) + 2.5 * fbm(p * 1.5));
        base = mix(low, high, 0.12 + 0.6 * bands + 0.2 * fbm(p * 2.0));
        base = mix(base, base * 1.3, smoothstep(0.66, 0.82, fbm(p * 2.5 + 4.0)) * 0.6);
        base = mix(base, base * vec3(1.25, 0.8, 0.65), hot * 0.6);
        base = mix(base, base * vec3(0.85, 0.95, 1.1), cold * 0.5);
      } else if (uType == 3) {
        // Gas giant: one of four colour families, strong bands and one oval storm.
        float rP = rnd(uSeed, 14.0);
        vec3 low;
        vec3 high;
        if (rP < 0.3) { low = vec3(0.68, 0.40, 0.20); high = vec3(0.94, 0.80, 0.56); }
        else if (rP < 0.55) { low = vec3(0.60, 0.22, 0.12); high = vec3(0.92, 0.55, 0.28); }
        else if (rP < 0.8) { low = vec3(0.25, 0.33, 0.50); high = vec3(0.60, 0.70, 0.82); }
        else { low = vec3(0.70, 0.62, 0.45); high = vec3(0.95, 0.90, 0.75); }
        float bands = 0.5 + 0.5 * sin(n.y * mix(14.0, 28.0, rFreq) + 2.5 * fbm(p * 1.5));
        base = mix(low, high, 0.1 + 0.8 * bands);
        float lon = atan(n.z, n.x);
        float dLon = mod(lon - fract(uSeed * 0.37) * 6.28 + 3.14159, 6.28318) - 3.14159;
        float storm = smoothstep(0.28, 0.0, length(vec2(dLon * 0.6, (n.y + 0.3) * 1.7)));
        base = mix(base, base * vec3(1.25, 0.78, 0.65) + 0.04, storm * 0.85);
        base = mix(base, base * vec3(1.25, 0.8, 0.65), hot * 0.6);
        base = mix(base, base * vec3(0.85, 0.95, 1.1), cold * 0.5);
      }
    }

    vec3 nrm = normalize(vNormal);
    if (uArt > 0.5 && uType == 0) {
      // Relief: the light is bent by the slope of a noise height field, so the ground shows
      // ridges and hollows in the light. Invented terrain, like the patterns above.
      vec3 rq = n * 7.0 + seedOffset(uSeed);
      vec3 e = vec3(0.03, 0.0, 0.0);
      float h = fbm(rq);
      vec3 grad = vec3(fbm(rq + e.xyy) - h, fbm(rq + e.yxy) - h, fbm(rq + e.yyx) - h) / 0.03;
      nrm = normalize(nrm - reliefAmount * (grad - dot(grad, nrm) * nrm));
    }

    // The side facing the star is lit, the other side is dark. A hot planet glows a little there.
    float facing = dot(nrm, normalize(uLightDir));
    float light = 0.3 + 0.7 * smoothstep(-0.05, 0.6, facing);
    vec3 nightGlow = hot * (1.0 - smoothstep(-0.1, 0.3, facing)) * vec3(0.9, 0.25, 0.08) * 0.5;

    // A soft glow at the edge. In the schematic look only for the gas planets: from their radius
    // and mass we know they are wrapped in a thick envelope. Rocky planets get none, nothing is
    // known about their air. The artistic look gives every planet a thin one, as an illustration.
    float rim = pow(1.0 - max(dot(normalize(vNormalView), normalize(vView)), 0.0), 3.0);
    vec3 haze = base * 1.5; // in the colour of the planet, an added grey would turn the rim white
    float atmosphereAmount = uAtmosphere + uArt * (1.0 - uAtmosphere) * 0.45;
    vec3 atmosphere = atmosphereAmount * rim * haze * (0.25 + 0.75 * light);

    // The colours in this shader are written as ordinary screen colours (sRGB). The renderer turns
    // the result into screen colours once more in the last line, so here it is first turned into
    // linear light. Without this step every colour came out too pale and washed towards white.
    vec3 colour = base * light + nightGlow + atmosphere + emit * (0.7 + 0.5 * light);
    // Soft highlight where the star is mirrored, only on the shiny surfaces.
    vec3 halfway = normalize(normalize(uLightDir) + normalize(vView));
    colour += vec3(0.7, 0.8, 0.95) * pow(max(dot(nrm, halfway), 0.0), 40.0) * gloss * 0.45 * smoothstep(0.0, 0.2, facing);
    gl_FragColor = vec4(pow(max(colour, vec3(0.0)), vec3(2.2)), 1.0);
    #include <colorspace_fragment>
  }`;

// Saturn's rings with the real proportions, measured in Saturn radii (equatorial radius
// 60,268 km): C ring from 1.24, B ring from 1.53, the Cassini Division from 1.95, A ring from
// 2.03 to 2.27, with the narrow Encke gap at 2.22. Brightness differences between the rings are
// drawn from their known look, the fine streaks are schematic noise, not the real ring structure.
const RING_INNER = 1.239;
const RING_OUTER = 2.269;
const SATURN_TILT = (26.73 * Math.PI) / 180; // axial tilt, the direction of the tilt is arbitrary here
const RING_VERTEX = `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const RING_FRAGMENT = `
  uniform float uPlanetRadius;
  uniform vec3 uLightDir;   // from the planet towards the Sun, updated every frame
  uniform float uTilt;      // the tilt of the ring plane, to get the Sun into the planet's own frame
  varying vec3 vPos;
  ${NOISE_GLSL}
  // The shadow of the planet: seen from a point of the rings the planet hides the Sun when the line to the Sun
  // passes within one planet radius of the centre and the planet lies on the Sun's side of the point.
  float planetShadow() {
    float c = cos(-uTilt);
    float s = sin(-uTilt);
    vec3 L = normalize(vec3(c * uLightDir.x - s * uLightDir.y, s * uLightDir.x + c * uLightDir.y, uLightDir.z));
    vec3 H = vec3(vPos.x, 0.0, -vPos.y); // the ring geometry lies in the xy plane before it is laid flat
    float along = dot(H, L);
    if (along >= 0.0) return 0.0; // the point is on the Sun's side of the planet
    float miss = sqrt(max(dot(H, H) - along * along, 0.0)) / uPlanetRadius;
    return 1.0 - smoothstep(0.96, 1.04, miss);
  }
  float band(float r, float a, float b) {
    return smoothstep(a - 0.006, a + 0.006, r) * (1.0 - smoothstep(b - 0.006, b + 0.006, r));
  }
  void main() {
    float r = length(vPos.xy) / uPlanetRadius; // distance from Saturn in Saturn radii
    float c = band(r, 1.239, 1.527);
    float b = band(r, 1.527, 1.951);
    float cassini = band(r, 1.951, 2.027);
    float a = band(r, 2.027, 2.269);
    float alpha = 0.2 * c + 0.92 * b + 0.04 * cassini + 0.62 * a;
    alpha *= 1.0 - 0.9 * (1.0 - smoothstep(0.0, 0.008, abs(r - 2.217))); // Encke gap
    float streaks = noise(vec3(r * 70.0, 3.0, 0.0));
    alpha *= 0.65 + 0.7 * streaks;
    vec3 colour = mix(vec3(0.50, 0.45, 0.40), vec3(0.88, 0.80, 0.66), clamp(0.3 * c + b + a * 0.8, 0.0, 1.0));
    colour *= 1.0 - 0.9 * planetShadow(); // the dark wedge that Saturn throws on its rings
    gl_FragColor = vec4(colour, clamp(alpha, 0.0, 1.0));
    #include <colorspace_fragment>
  }`;

function saturnRings(planetRadius) {
  const flat = new THREE.Mesh(
    new THREE.RingGeometry(RING_INNER * planetRadius, RING_OUTER * planetRadius, 128, 1),
    new THREE.ShaderMaterial({
      uniforms: {
        uPlanetRadius: { value: planetRadius },
        uLightDir: { value: new THREE.Vector3(0, 0, 1) }, // updated every frame from the orbit, see stepSystem
        uTilt: { value: SATURN_TILT },
      },
      vertexShader: RING_VERTEX,
      fragmentShader: RING_FRAGMENT,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  flat.rotation.x = -Math.PI / 2; // a ring is born standing up, lay it into the orbit plane
  const tilted = new THREE.Group();
  tilted.rotation.z = SATURN_TILT;
  tilted.add(flat);
  tilted.userData.material = flat.material; // stepSystem gives it the direction of the Sun
  return tilted;
}

// The rings of Uranus: ten narrow, dark rings. Radii are the mid radii from the NASA PDS Rings Node
// "Vital Statistics for Uranus's Rings" (Showalter & Lissauer 2006), ring 6 from arXiv 1307.3230
// (Dynamics of the dust rings and satellites of Uranus), divided by Uranus's equatorial radius of 25,559 km. The real rings
// are only a few kilometres wide, far too thin to see at this scale, so every line is drawn about 100
// times wider than it is. The tilt is the same display tilt as Saturn's, the real axis lies almost
// in the orbit plane (98 degrees), which would show the rings edge on from our camera.
// Each entry: radius in planet radii, half width as drawn, brightness.
const URANUS_RINGS = [
  [41837, 0.5], [42234, 0.5], [42571, 0.5], [44718, 0.6], [45661, 0.6],
  [47176, 0.4], [47627, 0.5], [48300, 0.5], [50024, 0.5], [51149, 1.0],
].map(([km, strength]) => [km / 25559, km === 51149 ? 0.012 : 0.005, strength]);

// The rings of Neptune, from the NASA NSSDC Neptunian Rings Fact Sheet and the PDS Rings Node
// "Vital Statistics for Neptune's Rings", divided by Neptune's equatorial radius of 24,764 km:
// Galle 41,900 km (a faint wide band, about 2,000 km), Le Verrier 53,200 km (narrow), Lassell as a
// faint band from 53,200 to 57,200 km (centre 55,200 km, width 4,000 km), Arago 57,200 km (narrow)
// and Adams 62,933 km (narrow). The narrow ones are drawn wider than they are, Galle and Lassell as
// they are. Neptune's rings are even fainter than Uranus's. Adams really has bright arcs, which are
// not drawn here, it is shown as an even ring.
const NEPTUNE_RINGS = [
  [41900, 1000 / 24764, 0.25], [53200, 0.006, 0.55], [55200, 2000 / 24764, 0.2], [57200, 0.006, 0.5], [62933, 0.007, 0.8],
].map(([km, halfWidth, strength]) => [km / 24764, Math.max(halfWidth, 0.006), strength]);

const THIN_RING_MAX = 10; // size of the shader array, the lists above are not longer
const THIN_RING_FRAGMENT = `
  uniform float uPlanetRadius;
  uniform vec3 uRings[${THIN_RING_MAX}]; // radius in planet radii, half width, brightness
  uniform int uCount;
  varying vec3 vPos;
  void main() {
    float r = length(vPos.xy) / uPlanetRadius;
    float alpha = 0.0;
    for (int i = 0; i < ${THIN_RING_MAX}; i++) {
      if (i >= uCount) break;
      alpha = max(alpha, uRings[i].z * (1.0 - smoothstep(0.0, uRings[i].y, abs(r - uRings[i].x))));
    }
    // dark grey as the real rings are, written in linear light because the line below encodes it
    gl_FragColor = vec4(vec3(0.12, 0.12, 0.13), alpha * 0.9);
    #include <colorspace_fragment>
  }`;

function thinRings(planetRadius, rings) {
  const outer = Math.max(...rings.map((r) => r[0] + r[1])) + 0.05;
  const inner = Math.min(...rings.map((r) => r[0] - r[1])) - 0.05;
  const flat = new THREE.Mesh(
    new THREE.RingGeometry(inner * planetRadius, outer * planetRadius, 128, 1),
    new THREE.ShaderMaterial({
      uniforms: {
        uPlanetRadius: { value: planetRadius },
        // padded to the length the shader declares
        uRings: { value: Array.from({ length: THIN_RING_MAX }, (_, i) => new THREE.Vector3(...(rings[i] ?? [0, 0, 0]))) },
        uCount: { value: rings.length },
      },
      vertexShader: RING_VERTEX,
      fragmentShader: THIN_RING_FRAGMENT,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  flat.rotation.x = -Math.PI / 2;
  const tilted = new THREE.Group();
  tilted.rotation.z = SATURN_TILT;
  tilted.add(flat);
  return tilted;
}

// A moon on a circular orbit around its planet. The planet mesh is the parent, so the moon
// travels with it. It is not part of the click targets, only planets are.
function addMoon(planetMesh, planetRadius, moon) {
  const map = moon.texture ? textureLoader.load(moon.texture) : null;
  if (map) map.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(planetRadius * moon.size, 32, 24),
    new THREE.MeshLambertMaterial(map ? { map } : { color: moon.color })
  );
  const moonLabel = labelSprite(moon.label);
  mesh.userData.label = moonLabel; // kept for the language switch, see updateSolarLabels
  mesh.add(moonLabel);
  planetMesh.add(mesh);
  return { mesh, years: moon.years, distance: planetRadius * moon.orbit };
}

const artUniform = { value: 0 }; // 0 schematic, 1 artistic

// Earth is the one planet we have real pictures of, so it gets its own shader that uses them:
//  - the day map (land, ocean colour, sea ice) as the colour, without any baked in shadows,
//  - NASA's shaded topography map for the relief. That map is the same land surface with the
//    mountains shaded by a light from the north west. Dividing it by the day map takes the colour
//    out and leaves only that shading, which tells how much a slope tilts towards the north west.
//    The shader tilts the surface normal that way, so mountains catch the light of the Sun from
//    any side. It is an approximation of the relief, not a height map: NASA's small maps do not
//    include one.
//  - a water mask found from the blue of the ocean in the day map, for the glint of the Sun,
//  - the night lights, which show on the side facing away from the Sun,
//  - a blue glow at the edge: Earth's air is real, no guess needed.
const EARTH_VERTEX = `
  varying vec2 vUv;
  varying vec3 vObj;
  varying vec3 vN;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vObj = normalize(position);
    vN = normalize(mat3(modelMatrix) * normal); // the groups are only moved, never rotated
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }`;
const EARTH_FRAGMENT = `
  uniform sampler2D uDay;
  uniform sampler2D uTopo;
  uniform sampler2D uLights;
  uniform sampler2D uClouds;
  uniform float uCloudRot;   // how far the clouds have drifted over the ground, in radians
  uniform float uSpin;       // how far the ground has turned, in radians
  uniform vec3 uLightDir;
  varying vec2 vUv;
  varying vec3 vObj;
  varying vec3 vN;
  varying vec3 vWorld;

  void main() {
    // The ground turns eastward, so the map is read a bit further west at the same spot of the sphere.
    vec2 uvg = vec2(vUv.x - uSpin / 6.2831853, vUv.y);
    vec3 day = texture2D(uDay, uvg).rgb;
    vec3 topo = texture2D(uTopo, uvg).rgb;
    vec3 lum = vec3(0.3, 0.59, 0.11);

    // Water: the ocean is bluer than the land and the ice.
    float water = smoothstep(0.004, 0.03, day.b - max(day.r, day.g));

    // Relief, only on land. Shade is 1 on flat ground, above 1 on slopes facing the north west.
    float shade = dot(topo, lum) / max(dot(day, lum), 0.02);
    float slope = clamp(shade - 1.0, -0.7, 0.7) * (1.0 - water);
    vec3 n = normalize(vObj);
    vec3 east = normalize(vec3(n.z, 0.0, -n.x) + vec3(1e-5));
    vec3 north = normalize(vec3(0.0, 1.0, 0.0) - n * n.y + vec3(1e-5));
    vec3 northWest = normalize(north - east);
    vec3 N = normalize(vN);
    vec3 relief = normalize(N + 1.1 * slope * northWest);

    vec3 L = normalize(uLightDir);
    vec3 V = normalize(cameraPosition - vWorld);
    float sunUp = dot(N, L); // 1 when the Sun is overhead, 0 on the terminator, negative at night

    float diffuse = clamp(dot(relief, L), 0.0, 1.0);

    // Cloud shadows. A cloud shades the ground a little way away from the Sun, so the clouds are
    // looked up a small step towards the Sun. The cloud sphere has turned by uCloudRot, the map
    // is read with the same turn, otherwise shadow and cloud would drift apart.
    vec2 towardsSun = vec2(dot(L, east), dot(L, north));
    vec2 shadowUv = vec2(uvg.x - uCloudRot / 6.2831853, uvg.y) + vec2(towardsSun.x * 0.004, towardsSun.y * 0.008);
    float shadow = texture2D(uClouds, shadowUv).g;

    vec3 colour = day * (0.03 + 1.15 * diffuse);
    colour *= 1.0 - 0.42 * shadow * smoothstep(0.0, 0.3, sunUp);

    // Glint of the Sun on the sea. The smooth sea uses the plain normal, not the relief.
    vec3 H = normalize(L + V);
    float facing = clamp(sunUp, 0.0, 1.0);
    float glint = pow(max(dot(N, H), 0.0), 160.0) * 0.9 + pow(max(dot(N, H), 0.0), 20.0) * 0.06;
    colour += vec3(1.0, 0.95, 0.85) * glint * water * step(0.0, sunUp) * (0.3 + 0.7 * facing);

    // Water turns into a mirror when seen at a flat angle (Fresnel). Near the edge of the globe the
    // sea therefore shows the pale blue sky instead of its own dark blue.
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);
    colour += vec3(0.40, 0.62, 0.95) * fresnel * water * (0.1 + 0.9 * clamp(sunUp + 0.3, 0.0, 1.0)) * 0.7;

    // Night lights on the dark side.
    float night = 1.0 - smoothstep(-0.12, 0.1, sunUp);
    colour += texture2D(uLights, uvg).rgb * night * 1.3;

    // Blue glow of the air at the edge, stronger on the lit side.
    float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    colour += vec3(0.25, 0.5, 1.0) * rim * (0.15 + 0.85 * clamp(sunUp + 0.25, 0.0, 1.0)) * 0.7;

    gl_FragColor = vec4(colour, 1.0);
    #include <colorspace_fragment>
  }`;

function earthMaterial() {
  const load = (file, srgb = true) => {
    const map = textureLoader.load(file);
    if (srgb) map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.RepeatWrapping; // the maps are read past their seam while the ground turns
    return map;
  };
  return new THREE.ShaderMaterial({
    uniforms: {
      uSpin: { value: 0 },
      uDay: { value: load("textures/earth_day.jpg") },
      uTopo: { value: load("textures/earth.jpg") },
      uLights: { value: load("textures/earth_lights.jpg") },
      uClouds: { value: load("textures/earth_clouds.jpg", false) }, // a mask, not a colour
      uCloudRot: { value: 0 },
      uLightDir: { value: new THREE.Vector3(0, 0, 1) }, // updated every frame from the orbit
    },
    vertexShader: EARTH_VERTEX,
    fragmentShader: EARTH_FRAGMENT,
  });
}

// Clouds on a sphere of their own, a little larger than Earth and see through. NASA's cloud map is
// white where there are clouds and black elsewhere, which is used as the opacity. As a separate
// sphere they can drift against the ground. They are lit by the same Sun direction as the ground,
// with a floor of light: with the plain Lambert material the clouds at the edge of the globe turned
// black on the dark side and drew a dark outline around the planet.
const CLOUD_HEIGHT = 1.012;
const CLOUD_FRAGMENT = `
  uniform sampler2D uClouds;
  uniform vec3 uLightDir;
  varying vec2 vUv;
  varying vec3 vN;
  void main() {
    float cloud = texture2D(uClouds, vUv).g;
    float sunUp = dot(normalize(vN), normalize(uLightDir));
    float light = 0.16 + 0.84 * smoothstep(-0.12, 0.45, sunUp);
    vec3 colour = vec3(0.96, 0.98, 1.0) * light;
    gl_FragColor = vec4(colour, clamp(cloud * 0.95, 0.0, 1.0));
    #include <colorspace_fragment>
  }`;
const CLOUD_VERTEX = `
  varying vec2 vUv;
  varying vec3 vN;
  void main() {
    vUv = uv;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
function addClouds(planetMesh, planetRadius) {
  const shared = planetMesh.material.uniforms; // same Sun direction and cloud map as the ground
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(planetRadius * CLOUD_HEIGHT, 64, 48),
    new THREE.ShaderMaterial({
      uniforms: { uClouds: shared.uClouds, uLightDir: shared.uLightDir },
      vertexShader: CLOUD_VERTEX,
      fragmentShader: CLOUD_FRAGMENT,
      transparent: true,
      depthWrite: false,
    })
  );
  planetMesh.add(clouds);
  return clouds;
}

// The haze of the air beyond the edge of the globe, a sphere drawn from the inside so that only the
// ring around the planet shows, like the corona of a star. Blue, brighter on the side of the Sun.
const ATMOSPHERE_RATIO = 1.09;
const ATMOSPHERE_FRAGMENT = `
  uniform vec3 uLightDir;
  varying vec3 vNormalView;
  varying vec3 vView;
  varying vec3 vNormalWorld;
  void main() {
    float mu = abs(dot(normalize(vNormalView), normalize(vView)));
    float b = sqrt(max(0.0, 1.0 - mu * mu)) * ${ATMOSPHERE_RATIO.toFixed(2)}; // distance from the middle, in planet radii
    if (b < 1.0) discard; // the planet covers this part
    float falloff = exp(-(b - 1.0) * 42.0);
    float sunSide = 0.2 + 0.8 * clamp(dot(normalize(vNormalWorld), normalize(uLightDir)) + 0.35, 0.0, 1.0);
    gl_FragColor = vec4(vec3(0.25, 0.5, 1.0) * falloff * sunSide * 1.1, 1.0);
    #include <colorspace_fragment>
  }`;
const ATMOSPHERE_VERTEX = `
  varying vec3 vNormalView;
  varying vec3 vView;
  varying vec3 vNormalWorld;
  void main() {
    vNormalView = normalize(normalMatrix * normal);
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;
function addAtmosphere(planetMesh, planetRadius) {
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(planetRadius * ATMOSPHERE_RATIO, 64, 48),
    new THREE.ShaderMaterial({
      uniforms: { uLightDir: planetMesh.material.uniforms.uLightDir },
      vertexShader: ATMOSPHERE_VERTEX,
      fragmentShader: ATMOSPHERE_FRAGMENT,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  planetMesh.add(shell);
  return shell;
}

// The planets of our own system that have no usable global map: Venus (a layer of cloud hides the
// ground and radar maps do not show what the eye would see), Saturn, Uranus and Neptune (nobody has
// a global picture of a gas giant that stays valid, their clouds change). They get a picture painted
// by the program, in the colours and bands that telescopes and probes show. The overall look is
// known, the fine pattern is invented, and the panel says so.
const SOLAR_LOOK_FRAGMENT = `
  uniform int uKind;        // 0 Venus, 1 Saturn, 2 Uranus, 3 Neptune
  uniform float uSeed;
  uniform vec3 uLightDir;   // from the planet towards the Sun
  uniform float uTilt;      // the tilt of the planet's axis, the same as in the vertex shader
  uniform float uRingShadow; // 1 where the planet has big rings that shade it (Saturn)
  varying vec3 vPos;
  varying vec3 vFrame;
  varying vec3 vNormal;
  varying vec3 vNormalView;
  varying vec3 vView;
  ${NOISE_GLSL}

  // How much of the Sun's light the rings of Saturn stop at a place of the planet: the ray towards the Sun
  // is followed to the plane of the rings (y = 0 in the planet's own frame), and the density of the ring
  // there is the shadow. Ring edges as in RING_FRAGMENT: C ring from 1.239, B from 1.527, the Cassini
  // Division from 1.951, A from 2.027 to 2.269, in planet radii.
  float ringShadow() {
    float c = cos(-uTilt);
    float s = sin(-uTilt);
    vec3 L = normalize(vec3(c * uLightDir.x - s * uLightDir.y, s * uLightDir.x + c * uLightDir.y, uLightDir.z));
    if (abs(L.y) < 0.002) return 0.0;
    float t = -vFrame.y / L.y;
    if (t <= 0.0) return 0.0; // the ray leaves the ring plane, nothing above or below is in the way
    vec3 H = vFrame + t * L;
    float r = length(H.xz) / length(vFrame);
    float ring = 0.2 * smoothstep(1.233, 1.245, r) * (1.0 - smoothstep(1.521, 1.533, r))
      + 0.92 * smoothstep(1.521, 1.533, r) * (1.0 - smoothstep(1.945, 1.957, r))
      + 0.04 * smoothstep(1.945, 1.957, r) * (1.0 - smoothstep(2.021, 2.033, r))
      + 0.62 * smoothstep(2.021, 2.033, r) * (1.0 - smoothstep(2.263, 2.275, r));
    return ring;
  }

  void main() {
    vec3 n = normalize(vPos);
    vec3 p = n * 3.0 + seedOffset(uSeed);
    float lat = n.y;
    vec3 base;
    if (uKind == 0) {
      // Venus as the ultraviolet pictures of probes show it: cream white cloud with streaks that the
      // wind stretches along the latitude, peach orange patches near the equator, and a swirl at the
      // poles. The overall look is known, the exact pattern is invented.
      vec3 q = n * 2.0 + seedOffset(uSeed);
      float warp = fbm(q * 1.5);
      vec3 pw = vec3(n.x * 2.2 + warp * 0.9, n.y * 7.0 + warp * 1.6, n.z * 2.2 - warp * 0.9) + seedOffset(uSeed * 1.7);
      float streaks = fbm(pw);
      float fine = fbm(pw * 3.0 + 7.0);
      float patches = fbm(n * 1.6 + warp * 0.8 + seedOffset(uSeed * 3.1));
      patches *= 1.0 - 0.5 * smoothstep(0.3, 0.9, abs(lat));
      vec3 cream = vec3(0.93, 0.89, 0.80);
      vec3 white = vec3(0.98, 0.97, 0.95);
      vec3 orange = vec3(0.93, 0.62, 0.40);
      float finer = fbm(pw * 7.0 + 3.0);
      base = mix(cream, white, smoothstep(0.38, 0.6, streaks));
      base = mix(base, orange, smoothstep(0.36, 0.6, patches) * (0.5 + 0.5 * smoothstep(0.3, 0.65, streaks)) * 0.95);
      // thin dark and bright filaments, stretched with the wind, give the cloud its fine structure
      base *= 0.8 + 0.4 * fine;
      base = mix(base, white, smoothstep(0.55, 0.75, finer) * 0.45);
      base = mix(base, orange * 0.9, smoothstep(0.6, 0.8, 1.0 - finer) * 0.18 * smoothstep(0.3, 0.6, patches));
      float r = 1.0 - abs(lat); // distance from the pole
      float spiral = sin(atan(n.z, n.x) * 2.0 + r * 16.0 + warp * 3.0);
      base = mix(base, mix(cream, white, 0.5 + 0.5 * spiral), smoothstep(0.35, 0.05, r) * 0.7);
    } else if (uKind == 1) {
      // Saturn as the Cassini pictures show it: cream and tan bands, orange brown belts with wavy edges,
      // and a bluish grey north. The band edges are pushed sideways by noise, which gives the wavy look.
      // No regular stripes: a few broad zones, soft at the edges, with cloud mottling inside them.
      float wob = fbm(vec3(p.x * 0.8, p.y * 0.3, p.z * 0.8));
      float latW = lat + 0.12 * (wob - 0.5);
      float soft = fbm(vec3(n.x * 1.4, n.y * 3.2 + wob * 0.8, n.z * 1.4) + seedOffset(uSeed));
      float mott = fbm(vec3(p.x * 1.6, p.y * 6.0, p.z * 1.6) + 5.0);
      vec3 cream = vec3(0.94, 0.87, 0.70);
      vec3 tan = vec3(0.76, 0.60, 0.42);
      vec3 brown = vec3(0.70, 0.40, 0.20);
      vec3 grey = vec3(0.55, 0.59, 0.64);
      base = mix(tan, cream, smoothstep(0.3, 0.7, soft));
      float brownZone = exp(-pow((latW - 0.05) / 0.34, 2.0));
      base = mix(base, brown, clamp(brownZone * (0.5 + 1.1 * mott), 0.0, 0.95));
      base = mix(base, grey, smoothstep(0.5, 0.85, latW) * 0.7 + smoothstep(0.8, 0.97, -latW) * 0.35);
      float grain = fbm(vec3(p.x * 3.0, p.y * 16.0, p.z * 3.0) + 9.0);
      base *= 0.92 + 0.16 * grain;
    } else if (uKind == 2) {
      // Uranus: turquoise with soft, darker teal bands. Real Uranus is much
      // plainer from space (the bands only show in processed pictures), so this is an artistic look.
      float wob = fbm(vec3(p.x * 0.8, p.y * 0.3, p.z * 0.8));
      float soft = fbm(vec3(n.x * 1.4, n.y * 4.0 + wob * 0.8, n.z * 1.4) + seedOffset(uSeed));
      // The sine gives the loose band order, the noise breaks it up so no even stripes appear.
      float v = 0.3 * (0.5 + 0.5 * sin((lat * 4.0 + 2.2 * wob) * 3.0)) + 0.7 * smoothstep(0.25, 0.75, soft);
      vec3 light = vec3(0.64, 0.90, 0.92);
      vec3 teal = vec3(0.30, 0.68, 0.74);
      vec3 deep = vec3(0.16, 0.46, 0.58);
      base = mix(teal, light, v);
      base = mix(base, deep, smoothstep(0.5, 0.95, 1.0 - v) * 0.45);
      base = mix(base, light, smoothstep(0.7, 0.95, lat) * 0.5);
      float grain = fbm(vec3(p.x * 3.0, p.y * 14.0, p.z * 3.0) + 9.0);
      base *= 0.93 + 0.14 * grain;
    } else {
      // Neptune as Voyager 2 saw it: saturated royal blue, very soft faint bands, a bright band in the
      // north, one big dark oval with bright streaks of high cloud beside it. The pattern is invented.
      float wob = fbm(vec3(p.x * 0.8, p.y * 0.3, p.z * 0.8));
      float soft = fbm(vec3(n.x * 1.4, n.y * 4.0 + wob * 0.8, n.z * 1.4) + seedOffset(uSeed));
      float v = 0.25 * (0.5 + 0.5 * sin((lat * 5.0 + 1.5 * wob) * 3.0)) + 0.75 * smoothstep(0.25, 0.75, soft);
      vec3 royal = vec3(0.20, 0.36, 0.88);
      vec3 pale = vec3(0.36, 0.55, 0.97);
      vec3 deep = vec3(0.11, 0.22, 0.68);
      base = mix(royal, pale, v * 0.7);
      base = mix(base, deep, smoothstep(0.55, 0.95, 1.0 - v) * 0.35);
      base = mix(base, pale, exp(-pow((lat - 0.62) / 0.1, 2.0)) * 0.35); // the bright band in the north
      float grain = fbm(vec3(p.x * 3.0, p.y * 14.0, p.z * 3.0) + 9.0);
      base *= 0.95 + 0.1 * grain;
      float lon = atan(n.z, n.x);
      // The oval is at one longitude of the planet and travels round with the spin (16.1 hours).
      float dLon = mod(lon - 2.1 + 3.14159, 6.28318) - 3.14159;
      float lat0 = 0.3; // the close-up camera looks from about 35 degrees above the equator, so this lands in the middle of the disc
      // the dark oval, wider than high
      float spot = smoothstep(1.0, 0.35, length(vec2(dLon / 0.42, (lat - lat0) / 0.15)));
      base = mix(base, vec3(0.06, 0.13, 0.45), spot * 0.85);
      // bright, stretched cloud streaks along the lower edge of the oval and a few thin ones around it
      float breakup = 0.55 + 0.9 * noise(vec3(n.x * 6.0, n.y * 30.0, n.z * 6.0) + seedOffset(uSeed * 2.0));
      float streak1 = smoothstep(1.0, 0.2, length(vec2((dLon - 0.1) / 0.14, (lat - lat0 + 0.12) / 0.012)));
      float streak2 = smoothstep(1.0, 0.2, length(vec2((dLon + 0.3) / 0.1, (lat - lat0 + 0.18) / 0.01)));
      base = mix(base, vec3(0.88, 0.94, 1.0), clamp((streak1 + 0.7 * streak2) * breakup, 0.0, 1.0) * 0.85);
      float thin = smoothstep(0.66, 0.85, noise(vec3(n.x * 3.0, n.y * 22.0, n.z * 3.0) + seedOffset(uSeed * 3.0)));
      base = mix(base, vec3(0.7, 0.82, 1.0), thin * 0.1 * (1.0 - smoothstep(0.1, 0.7, abs(lat + 0.2))));
    }

    float facing = dot(normalize(vNormal), normalize(uLightDir));
    float shade = uRingShadow > 0.5 ? ringShadow() : 0.0;
    float light = 0.22 + 0.78 * smoothstep(-0.05, 0.6, facing) * (1.0 - 0.85 * shade);
    // All four have a thick atmosphere, so a soft glow at the edge in their own colour is correct.
    float rim = pow(1.0 - max(dot(normalize(vNormalView), normalize(vView)), 0.0), 3.0);
    vec3 colour = base * light + base * 1.4 * rim * (0.25 + 0.75 * light) * 0.6;
    gl_FragColor = vec4(pow(max(colour, vec3(0.0)), vec3(2.2)), 1.0); // the colours above are screen colours, see PLANET_FRAGMENT
    #include <colorspace_fragment>
  }`;

function solarLookMaterial(p) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uKind: { value: p.look },
      uSeed: { value: seedFrom(p.name) },
      uFlatten: { value: p.flatten ?? 1 },
      uTilt: { value: p.rings ? SATURN_TILT : 0 },
      uRingShadow: { value: p.rings === true ? 1 : 0 }, // only Saturn has rings that are broad enough to shade it
      uSpin: { value: 0 }, // updated every frame from the clock of the system
      uLightDir: { value: new THREE.Vector3(0, 0, 1) }, // updated every frame from the orbit
    },
    vertexShader: GAS_VERTEX,
    fragmentShader: SOLAR_LOOK_FRAGMENT,
  });
}

// A gas giant with a real map (Jupiter). It differs from a rocky planet in two ways: it is
// flattened at the poles because it spins so fast (the real 6.5 %), and its edge fades and glows
// because we look through a thick atmosphere there. The map itself stands still, a drifting
// texture was tried and dropped.
const GAS_VERTEX = `
  uniform float uFlatten;   // polar radius divided by equatorial radius
  uniform float uTilt;      // tilt of the planet's axis about z, the same as the one of its rings
  uniform float uSpin;      // how far the planet has turned about its own axis, in radians
  varying vec3 vPos;        // the round position in the planet's own frame, painted planets read their pattern from it
  varying vec3 vFrame;      // the same without the spin, for the shadow of the rings
  varying vec3 vNormal;
  varying vec3 vNormalView;
  varying vec3 vView;
  varying vec2 vUv;
  vec3 turn(vec3 v, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(c * v.x - s * v.y, s * v.x + c * v.y, v.z);
  }
  void main() {
    vUv = vec2(uv.x - uSpin / 6.2831853, uv.y); // a map turns eastward with the planet, it is read further west
    // Everything is done in the planet's own frame (axis up), then turned into the tilted one. That way
    // the bands and the flattening stay parallel to the rings.
    vec3 q = turn(position, -uTilt);
    vFrame = q;
    // The planet spins about its axis (up in this frame). The pattern is what turns, the shape and the
    // light stay, so the pattern is read from a point turned back by the spin.
    float cs = cos(-uSpin);
    float sn = sin(-uSpin);
    vPos = vec3(cs * q.x + sn * q.z, q.y, -sn * q.x + cs * q.z);
    vec3 pos = turn(vec3(q.x, q.y * uFlatten, q.z), uTilt);
    // The normal of a squashed sphere leans away from the axis, so the light follows the new shape.
    vec3 qn = turn(normal, -uTilt);
    vec3 n = turn(normalize(vec3(qn.x, qn.y / uFlatten, qn.z)), uTilt);
    vNormal = normalize(mat3(modelMatrix) * n);
    vNormalView = normalize(normalMatrix * n);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;

const GAS_FRAGMENT = `
  uniform sampler2D uMap;
  uniform vec3 uLightDir;
  uniform vec3 uHaze;       // colour of the glow at the edge
  varying vec3 vNormal;
  varying vec3 vNormalView;
  varying vec3 vView;
  varying vec2 vUv;
  void main() {
    vec3 map = texture2D(uMap, vUv).rgb;

    vec3 n = normalize(vNormal);
    float facing = dot(n, normalize(uLightDir));
    float light = 0.2 + 0.8 * smoothstep(-0.05, 0.6, facing);
    float mu = max(dot(normalize(vNormalView), normalize(vView)), 0.0);
    float darkening = mix(0.55, 1.0, pow(mu, 0.5));   // the edge shows higher, thinner cloud
    float rim = pow(1.0 - mu, 3.0);
    vec3 colour = map * light * darkening + uHaze * rim * (0.25 + 0.75 * light) * 0.5;
    gl_FragColor = vec4(colour, 1.0);
    #include <colorspace_fragment>
  }`;

function gasMaterial(p) {
  const map = textureLoader.load(p.texture);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping; // the map is read past its seam while the planet turns
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: map },
      uFlatten: { value: p.flatten },
      uTilt: { value: 0 },
      uSpin: { value: 0 }, // updated every frame from the clock of the system
      uLightDir: { value: new THREE.Vector3(0, 0, 1) }, // updated every frame from the orbit
      uHaze: { value: new THREE.Color(0xd9b38c).convertSRGBToLinear() },
    },
    vertexShader: GAS_VERTEX,
    fragmentShader: GAS_FRAGMENT,
  });
}

// Planets whose invented look was chosen by hand instead of by temperature and name: the kind of
// world as numbered in PLANET_FRAGMENT (5 is the dusty ice world).
const FORCED_LOOK = { "Teegarden's Star b": 5, "Teegarden's Star c": 5 };

function planetMaterial(p) {
  if (p.earth) return earthMaterial();
  if (p.flatten && p.texture) return gasMaterial(p);
  if (p.look !== undefined) return solarLookMaterial(p);
  if (p.type) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uType: { value: p.type === "unknown" ? 4 : PLANET_TYPES.indexOf(p.type) },
        uTemp: { value: p.temp ?? 0 },
        uAtmosphere: { value: ["miniNeptune", "neptune", "gasGiant"].includes(p.type) ? 1 : 0 },
        uArt: artUniform, // one shared object, so the switch changes every planet at once
        uSeed: { value: seedFrom(p.name) },
        uForce: { value: FORCED_LOOK[p.name] ?? -1 },
        uLightDir: { value: new THREE.Vector3(0, 0, 1) }, // updated every frame from the orbit
      },
      vertexShader: PLANET_VERTEX,
      fragmentShader: PLANET_FRAGMENT,
    });
  }
  // The plain planets of our own system are lit by the Sun like the textured ones, so they show a
  // day and a night side instead of a flat disc.
  if (!p.texture) return new THREE.MeshLambertMaterial({ color: p.color });
  const map = textureLoader.load(p.texture);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping; // the spin moves the map sideways through texture.offset
  // Relief for Mercury: the brightness of the map is used as a height guess, so craters and ridges
  // catch the light. It is not a measured height map (the map has enhanced colours), see README.
  return new THREE.MeshLambertMaterial(p.bump ? { map, bumpMap: map, bumpScale: p.bump } : { map });
}
scene.add(new THREE.AmbientLight(0xffffff, 0.7)); // keeps the night side from turning fully black, and the small planets of the overview readable

// The orbit lines are thin and soft: they fade with the distance from the camera, so the ones far away do not
// weigh as much as the ones near, and they are drawn as light (additive), not as a solid line.
const orbitLineMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying float vDistance;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vDistance = length(mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    varying float vDistance;
    void main() {
      float a = 0.22 * clamp(2.0 / vDistance, 0.3, 1.0);
      gl_FragColor = vec4(vec3(0.8, 0.85, 1.0), a);
      #include <colorspace_fragment>
    }`,
  transparent: true,
  depthWrite: false,
});

// One builder for every system view: central star, orbit rings, planets with name labels.
// Orbit radii and sizes are already in map units, years are the real orbital periods.
// Start angles are spread out for looks, they are not the real positions of today.
function makeSystem({ starName, starColor, starRadius, planets, viewDistance }) {
  const group = new THREE.Group();
  scene.add(group);
  group.add(labelSprite(starName));
  let starMesh = null;
  let rays = null;
  if (starRadius) {
    starMesh = starBody(starColor, starName, starRadius);
    group.add(starMesh);
    group.add(starGlow(starColor, starRadius * 7));
    rays = makeStarRays(starColor, starRadius * 9); // smaller than the Sun's: the stars of the systems are drawn big
    group.add(rays);
  }

  const bodies = planets.map((p, i) => {
    // The Solar System has the real orbits (ellipses), exoplanet systems have circles.
    const points =
      p.orbitPoints ??
      Array.from({ length: 129 }, (_, k) => {
        const a = (k / 128) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * p.orbit, 0, Math.sin(a) * p.orbit);
      });
    if (!p.orbitUnknown) {
      group.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          orbitLineMaterial
        )
      );
    }
    const radius = Math.max(p.size, viewDistance * MIN_PLANET_PER_VIEW_DISTANCE);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 24), planetMaterial(p));
    const label = labelSprite(p.name);
    mesh.add(label);
    mesh.userData.label = label; // the close-up hides it, it would lie on top of the planet
    // An invisible, larger sphere around the planet is what a click hits. A planet can be only a few
    // pixels wide, so a click on the planet itself would be too hard to land.
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(radius, viewDistance * 0.012), 8, 6),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    mesh.add(hit);
    if (p.rings) {
      const thin = { uranus: URANUS_RINGS, neptune: NEPTUNE_RINGS }[p.rings];
      const ringObject = thin ? thinRings(radius, thin) : saturnRings(radius);
      mesh.add(ringObject);
      mesh.userData.ringMaterial = ringObject.userData.material; // only Saturn's rings have one that needs the light
      mesh.userData.closeupRadii = thin ? 5 : 7; // the rings reach 2.3 radii out, the default distance would cut them off
    }
    const moon = p.moon ? addMoon(mesh, radius, p.moon) : null;
    if (moon) mesh.userData.closeupRadii = 5; // far enough back that the Moon's orbit fits into the picture
    const clouds = p.earth ? addClouds(mesh, radius) : null;
    if (p.earth) addAtmosphere(mesh, radius);
    group.add(mesh);
    return { ...p, mesh, hit, moon, clouds, start: i * 1.7 };
  });
  return { group, bodies, viewDistance, time: 0, starMesh, rays };
}

// Time. The clock of every system counts real years of simulated time, and all periods are the
// real ones (a planet's period from the NASA table, Earth 365 days, the Moon 27.3 days). One real
// second is one simulated second, unless the user turns the speed up with the slider. At the start
// (1x) nothing visibly moves, which is what real time looks like.
const SECONDS_PER_YEAR = 365.25 * 86400;
const CLOUD_DRIFT_YEARS = 20 / 365.25; // the clouds go once round the ground in 20 days, a look and not a measured wind
let timeScale = 4 * 3600; // simulated seconds per real second, the start value is one second = four hours

// Planets only move along their orbit around the star. They do not spin on their own axis.
function stepSystem(system, dt) {
  system.time += (dt * timeScale) / SECONDS_PER_YEAR;
  if (system.belt) {
    // The belt moves on the shader, it only needs the clock of its system.
    system.belt.material.uniforms.uTime.value = system.time;
  }
  const jd = JD_AT_LOAD + system.time * 365.25; // the date in the system, only the Solar System uses it
  for (const b of system.bodies) {
    if (b.visitor) {
      mapEcliptic(b.visitor.at(jd), b.mesh.position); // a comet, an interstellar object or a spacecraft
      continue;
    }
    if (b.elements) {
      mapEcliptic(planetPosition(b.elements, jd), b.mesh.position); // a planet of ours, where it really is
    } else {
      const a = b.start + (system.time * Math.PI * 2) / b.years;
      b.mesh.position.set(Math.cos(a) * b.orbit, 0, Math.sin(a) * b.orbit);
    }
    // The star sits in the middle of the group, so the light comes from the opposite of the position.
    b.mesh.material.uniforms?.uLightDir.value.copy(b.mesh.position).negate().normalize();
    b.mesh.userData.ringMaterial?.uniforms.uLightDir.value.copy(b.mesh.position).negate().normalize();    if (b.rotHours) {
      // Turns so far, only the fraction matters. The clock counts years, a year has 8766 hours.
      const turns = (system.time * 8766) / b.rotHours;
      const spin = (turns - Math.floor(turns)) * Math.PI * 2;
      const uniforms = b.mesh.material.uniforms;
      if (uniforms?.uSpin) uniforms.uSpin.value = spin;
      else if (b.mesh.material.map) b.mesh.material.map.offset.x = -spin / (Math.PI * 2); // a plain textured ball
      b.spin = spin;
    }
    if (b.clouds) {
      const drift = (system.time * Math.PI * 2) / CLOUD_DRIFT_YEARS;
      b.clouds.rotation.y = drift + b.spin; // the clouds are carried along by the ground and drift on top of that
      b.mesh.material.uniforms.uCloudRot.value = drift; // the ground reads its cloud shadows with the drift alone
    }
    if (b.moon) {
      // Same clock as the planets, so the Moon's real 27 day period stays in proportion to the year.
      const m = (system.time * Math.PI * 2) / b.moon.years;
      b.moon.mesh.position.set(Math.cos(m) * b.moon.distance, 0, Math.sin(m) * b.moon.distance);
    }
  }
  // Up close it is useful, from far away it is clutter around the star. The limit is small on
  // purpose: a system is only a few map units wide, and from another star, say 143 light years
  // away, its belt and labels would hang in the sky like something that belongs there.
  // The Solar System is shown from further away: the comets and the far spacecraft reach out to 4 map units.
  system.group.visible = camera.position.distanceTo(system.group.position) < (system === solar ? 9 : 4);
}

function planetOrbitPoints(name) {
  const el = planetElements(ORBITS.planets[ELEMENT_ROW[name]], JD_AT_LOAD);
  const curve = orbitCurve({ a: el.a, e: el.e, i: el.I, om: el.node, w: el.peri - el.node }, 128);
  return curve.map((p) => mapEcliptic(p, new THREE.Vector3()));
}

const solar = makeSystem({
  starName: "Sun",
  starRadius: null, // the Sun already has its marker above, visible from far away too
  viewDistance: 1.5,
  planets: PLANETS.map((p) => ({
    name: p.name,
    years: p.years,
    orbit: 0.3 * Math.sqrt(p.au),
    size: (SUN_RADIUS * p.radius) / EARTH_RADII_PER_SUN,
    color: p.color,
    texture: p.texture,
    bump: p.bump,
    flatten: p.flatten,
    elements: ORBITS.planets[ELEMENT_ROW[p.name]],
    orbitPoints: planetOrbitPoints(p.name),
    rotHours: ROTATION_HOURS[p.name],
    noteKey: p.noteKey,
    look: p.look,
    earth: p.earth,
    rings: p.rings,
    moon: p.moon,
  })),
});
solar.group.add(new THREE.PointLight(0xffffff, 3, 0, 0)); // the Sun, no falloff so all textured planets are lit

// A faint disc of dust in the plane of the planets. The Solar System does hold such a flat cloud (the
// zodiacal dust, which makes the zodiacal light), but how thick it is and its swirls are not drawn from
// data: it is a schematic mood, kept very faint and swirled with noise. It gives the flat plane of the
// orbits some depth, and the credits and README say it is schematic.
const dustDisc = new THREE.Mesh(
  new THREE.RingGeometry(0.12, 2.4, 160, 1),
  new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 vPos;
      ${NOISE_GLSL}
      void main() {
        float r = length(vPos.xy);
        float angle = atan(vPos.y, vPos.x);
        // Swirled coordinates: the noise is read along spiral arms, so the dust flows around the Sun.
        vec2 swirl = vec2(cos(angle + r * 1.6), sin(angle + r * 1.6)) * r;
        float cloud = fbm(vec3(swirl * 2.2, 1.7));
        float density = smoothstep(0.12, 0.45, r) * (1.0 - smoothstep(0.5, 1.7, r));
        float alpha = density * (0.25 + 0.9 * cloud) * 0.07;
        vec3 colour = mix(vec3(1.0, 0.88, 0.7), vec3(0.8, 0.78, 0.76), smoothstep(0.2, 1.2, r));
        gl_FragColor = vec4(pow(colour, vec3(2.2)), alpha);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
);
dustDisc.rotation.x = -Math.PI / 2; // lay it into the orbit plane
solar.group.add(dustDisc);

// Visitors of the Solar System: comets, interstellar objects and spacecraft (JPL data, see ORBITS). Each one is
// a small marker with a name and its orbit or flight path, and an entry in solar.bodies so that it can be
// clicked and flown to like a planet; stepSystem sets its place from visitor.at(jd).
const VISITOR_NAMES = [
  { key: "halley", label: "Halley" },
  { key: "hale-bopp", label: "Hale-Bopp" },
  { key: "67p", label: "67P" },
  { key: "swift-tuttle", label: "Swift-Tuttle" },
  { key: "encke", label: "Encke" },
  { key: "neowise", label: "NEOWISE" },
  { key: "oumuamua", label: "ʻOumuamua" },
  { key: "borisov", label: "Borisov" },
  { key: "3i-atlas", label: "3I/ATLAS" },
];
const SPACECRAFT_NAMES = {
  "Voyager 1": { key: "voyager-1", label: "Voyager 1", motion: "escape" },
  "Voyager 2": { key: "voyager-2", label: "Voyager 2", motion: "escape" },
  "New Horizons": { key: "new-horizons", label: "New Horizons", motion: "escape" },
  Juno: { key: "juno", label: "Juno", motion: "jupiter" }, // circles Jupiter, so it travels with Jupiter
  "Parker Solar Probe": { key: "parker", label: "Parker Solar Probe", motion: "frozen" },
  "James Webb Space Telescope": { key: "jwst", label: "JWST", motion: "l2" },
};
const VISITOR_COLORS = { comet: 0x9fd8ff, interstellar: 0xff7ad9, spacecraft: 0xffd166 };

function spacecraftPosition(sc, motion, jd) {
  const path = sc.path;
  const last = path[path.length - 1];
  const here = { x: last[1], y: last[2], z: last[3] };
  if (motion === "frozen") return here; // an orbit of 88 days around the Sun, it stays where the data say
  if (motion === "l2") {
    const earth = planetPosition(ORBITS.planets["EM Bary"], jd);
    return { x: earth.x * 1.01, y: earth.y * 1.01, z: earth.z * 1.01 }; // the point L2, about 1.5 million km behind Earth
  }
  if (motion === "jupiter") {
    const jupiter = ORBITS.planets.Jupiter;
    const then = planetPosition(jupiter, last[0]);
    const now = planetPosition(jupiter, jd);
    return { x: now.x + here.x - then.x, y: now.y + here.y - then.y, z: now.z + here.z - then.z };
  }
  // escape: it flies on in a nearly straight line at the speed of its last two points
  const before = path[path.length - 2];
  const dt = last[0] - before[0];
  const t = jd - last[0];
  return {
    x: here.x + ((last[1] - before[1]) / dt) * t,
    y: here.y + ((last[2] - before[2]) / dt) * t,
    z: here.z + ((last[3] - before[3]) / dt) * t,
  };
}

// Off until the 3D models of the spacecraft are ready: nothing of the visitors is drawn or can be clicked.
// Set it to true together with removing "hidden" from the menu in index.html to show them again.
const SHOW_VISITORS = false;

function addVisitor({ key, label, kind, at, curve, color }) {
  if (!SHOW_VISITORS) return;
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.008, 12, 8), new THREE.MeshBasicMaterial({ color }));
  const sprite = labelSprite(label, label.length > 10 ? 192 : 128);
  mesh.add(sprite);
  mesh.userData.label = sprite;
  mesh.userData.closeupRadii = 60; // the marker is a dot, not a body: the close-up stays well back so that its surroundings show
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  mesh.add(hit);
  solar.group.add(mesh);
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.map((p) => mapEcliptic(p, new THREE.Vector3()))),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4 })
  );
  solar.group.add(line);
  solar.bodies.push({ name: label, mesh, hit, visitor: { key, label, kind, at } });
}

ORBITS.bodies.forEach((body, i) => {
  const info = VISITOR_NAMES[i];
  addVisitor({ ...info, kind: body.kind, color: VISITOR_COLORS[body.kind], at: (jd) => bodyPosition(body.el, jd), curve: orbitCurve(body.el) });
});
for (const sc of ORBITS.spacecraft) {
  const info = SPACECRAFT_NAMES[sc.name];
  const curve = info.motion === "l2" ? [] : sc.path.map((r) => ({ x: r[1], y: r[2], z: r[3] }));
  addVisitor({ ...info, kind: "spacecraft", color: VISITOR_COLORS.spacecraft, at: (jd) => spacecraftPosition(sc, info.motion, jd), curve });
}

// What the story panel gets for a visitor: its name and the facts of this moment.
function visitorPlanet(body) {
  return { pl_name: body.name, solarOther: true, solarObject: visitorFacts(body.visitor, JD_AT_LOAD + solar.time * 365.25) };
}

// The numbers for the text of a visitor, worked out from the JPL data for the day on the screen.
function visitorFacts(visitor, jd) {
  const earth = planetPosition(ORBITS.planets["EM Bary"], jd);
  const here = visitor.at(jd);
  const facts = {
    key: visitor.key,
    kind: visitor.kind,
    sunAU: Math.hypot(here.x, here.y, here.z),
    earthAU: Math.hypot(here.x - earth.x, here.y - earth.y, here.z - earth.z),
    retrieved: ORBITS.retrieved,
  };
  const body = ORBITS.bodies[VISITOR_NAMES.findIndex((n) => n.key === visitor.key)];
  if (body) {
    const el = body.el;
    facts.q = el.q;
    facts.e = el.e;
    facts.incl = el.i;
    facts.perihelion = jdToDate(el.tp);
    if (el.e < 1) {
      facts.Q = el.a * (1 + el.e);
      facts.periodYears = el.per / 365.25;
      facts.nextPerihelion = jdToDate(el.tp + (el.tp < jd ? el.per : 0));
    } else {
      // The speed far away from the Sun, from the size of the hyperbola: v = k / sqrt(|a|), 1 AU per day is 1731.46 km/s.
      facts.vInf = (GAUSS_K / Math.sqrt(Math.abs(el.a))) * 1731.46;
    }
  }
  return facts;
}
const earthMesh = solar.bodies.find((b) => b.name === "Earth").mesh;

// The main asteroid belt between Mars and Jupiter. It is schematic: the thousands of points
// sit at random places, they are NOT real asteroids. What is real: the belt spans roughly 2.1 to
// 3.3 AU with most rocks around 2.7 AU, the orbits are tilted a few degrees, a rock at distance
// a needs a^1.5 years for one orbit, and the belt has gaps where Jupiter's pull has emptied the
// orbits (the Kirkwood gaps at 2.50, 2.82, 2.95 and 3.27 AU).
function seededRandom(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BELT_VERTEX = `
  attribute float aAu;
  attribute float aAngle0;
  attribute float aNode;
  attribute float aInc;
  uniform float uTime;   // years on the system clock
  uniform float uSize;
  varying float vShade;
  void main() {
    float years = pow(aAu, 1.5);                                // Kepler's third law
    float angle = aAngle0 + uTime * 6.2831853 / years;
    float r = 0.3 * sqrt(aAu);                                  // same distance mapping as the planets
    vec3 p = vec3(cos(angle) * r, sin(aInc) * r * sin(angle - aNode), sin(angle) * r);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    // Capped at 4 pixels: close to the belt the points grew into big white discs like snow.
    gl_PointSize = clamp(uSize / -mv.z, 1.5, 4.0);
    gl_Position = projectionMatrix * mv;
    vShade = fract(aAngle0 * 7.3);
  }`;
const BELT_FRAGMENT = `
  varying float vShade;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    vec3 colour = mix(vec3(0.45, 0.40, 0.35), vec3(0.78, 0.70, 0.60), vShade);
    gl_FragColor = vec4(colour, 0.85 * smoothstep(1.0, 0.4, d));
    #include <colorspace_fragment>
  }`;

function asteroidBelt() {
  const random = seededRandom(42); // fixed seed: the same picture on every visit
  const KIRKWOOD_GAPS = [2.5, 2.82, 2.95, 3.27];
  // Five well known asteroid families, at roughly the distances of Flora, Vesta, Eunomia, Koronis
  // and Themis. Real families are a clump in distance, spread all around the orbit. Here they are
  // also clumped along the orbit, around a random angle, so the belt looks uneven. That part is
  // picture, not data.
  const FAMILIES = [2.2, 2.36, 2.64, 2.87, 3.13].map((a) => ({ a, angle: random() * Math.PI * 2 }));
  const gauss = () => (random() + random() + random() + random() - 2) * 1.73; // about mean 0, spread 1
  const count = 4500;
  const au = new Float32Array(count);
  const angle0 = new Float32Array(count);
  const node = new Float32Array(count);
  const inc = new Float32Array(count);
  for (let i = 0; i < count; ) {
    let a;
    let angle;
    if (random() < 0.4) {
      const family = FAMILIES[Math.floor(random() * FAMILIES.length)];
      a = family.a + gauss() * 0.05;
      angle = family.angle + gauss() * 0.55;
    } else {
      a = 2.1 + 1.2 * ((random() + random()) / 2); // triangular: most rocks near 2.7 AU
      angle = random() * Math.PI * 2;
      // Thin out some stretches of the belt so the background is uneven too.
      if (random() > 0.55 + 0.45 * Math.sin(2 * angle + 1.3) * Math.cos(angle * 3 + 0.4)) continue;
    }
    if (a < 2.05 || a > 3.35) continue;
    if (KIRKWOOD_GAPS.some((gap) => Math.abs(a - gap) < 0.025)) continue;
    au[i] = a;
    angle0[i] = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    node[i] = random() * Math.PI * 2;
    inc[i] = (Math.abs(random() + random() + random() - 1.5) / 1.5) * 0.24; // up to about 14 degrees
    i++;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3)); // unused, a draw call needs it
  geometry.setAttribute("aAu", new THREE.BufferAttribute(au, 1));
  geometry.setAttribute("aAngle0", new THREE.BufferAttribute(angle0, 1));
  geometry.setAttribute("aNode", new THREE.BufferAttribute(node, 1));
  geometry.setAttribute("aInc", new THREE.BufferAttribute(inc, 1));
  const belt = new THREE.Points(
    geometry,
    new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uSize: { value: 3.0 } },
      vertexShader: BELT_VERTEX,
      fragmentShader: BELT_FRAGMENT,
      transparent: true,
      depthWrite: false,
    })
  );
  belt.frustumCulled = false; // the real positions come from the shader, the bounds would be wrong
  return belt;
}

solar.belt = asteroidBelt();
solar.group.add(solar.belt);
const beltLabel = labelSprite("Asteroid belt", 288);
beltLabel.position.set(0.3 * Math.sqrt(2.7) * Math.cos(2.5), 0, 0.3 * Math.sqrt(2.7) * Math.sin(2.5));
solar.group.add(beltLabel);

// The NASA table has no orbit radius in our export, so it is derived from Kepler's third
// law: a^3 = M * P^2 (AU, solar masses, years). The innermost planet gets a fixed radius
// and the rest follow the same square root idea as above. Not to scale, for orientation.
const MAX_ORBIT = 1.6;
const EXO_STAR_RADIUS = 0.05; // every host star is drawn this size, planets are sized against it
const UNKNOWN_ORBIT = 0.6; // map units, where a planet of unknown orbit is drawn (a picture place, not a distance)
function exoSystem(star) {
  const mass = star.st_mass ?? 1; // sun-like fallback, only changes the drawn orbit radii
  const planets = star.planets
    .map((p) => {
      // A planet with neither a period nor an axis (7 of them) has no known orbit. It is drawn at a marked place next to the star, without
      // an orbit line and without moving, and the story says so.
      const known = !!(p.pl_orbper || p.pl_orbsmax);
      // A planet without a period (mostly directly imaged ones far from the star) has a measured semi-major axis instead; the period
      // then follows from Kepler's third law, P^2 = a^3 / M (years, AU, solar masses). The same law gives the axis from a period.
      const years = !known ? Infinity : p.pl_orbper ? p.pl_orbper / 365.25 : Math.sqrt(p.pl_orbsmax ** 3 / mass);
      return {
        name: p.pl_name,
        years,
        orbitUnknown: !known,
        au: !known ? null : p.pl_orbper ? Math.cbrt(mass * years * years) : p.pl_orbsmax,
        // Without a star radius there is no ratio to draw, the minimum size applies.
        size: star.st_rad && p.pl_rade ? (EXO_STAR_RADIUS * p.pl_rade) / (star.st_rad * EARTH_RADII_PER_SUN) : 0,
        type: planetType(p.pl_rade),
        temp: p.pl_eqt,
        color: p.habitable ? 0x6fd3a0 : 0xb0b8c8,
      };
    });
  const knownAu = planets.filter((p) => p.au).map((p) => p.au);
  const auMin = knownAu.length ? Math.min(...knownAu) : 1;
  for (const p of planets) p.orbit = p.orbitUnknown ? UNKNOWN_ORBIT : Math.min(MAX_ORBIT, 0.15 * Math.sqrt(p.au / auMin));
  const outer = Math.max(0.15, ...planets.map((p) => p.orbit));

  const system = makeSystem({
    starName: star.hostname,
    starColor: star.color,
    starRadius: EXO_STAR_RADIUS,
    planets,
    viewDistance: Math.max(0.4, 2 * outer),
  });

  // The zone is drawn with the same distance mapping as the orbits, so a planet that sits
  // in the zone in reality sits in the drawn band too.
  const zone = zoneAu(star);
  if (zone && knownAu.length) {
    const toMap = (au) => Math.min(MAX_ORBIT, 0.15 * Math.sqrt(au / auMin));
    addZone(system, toMap(zone.inner), toMap(zone.outer));
  }
  system.star = star; // a click on one of its planets needs the star data for the story
  return system;
}

// Candidate zone: the distances where a planet's equilibrium temperature would be inside the
// same range that makes it a candidate in the menu (the rule comes with the data). It uses
// T = T_star * sqrt(R_star / (2a)) * (1 - A)^(1/4) with an Earth like albedo A of 0.3.
// A guess, not a measurement: it says nothing about atmosphere or water.
const RSUN_AU = 0.00465047;
const ASSUMED_ALBEDO = 0.3;
let rule = null; // { temp_min, temp_max, radius_max }, set when the data is loaded

function zoneAu(star) {
  if (!rule || !star.st_rad || !star.st_teff) return null;
  const distanceAt = (kelvin) =>
    ((star.st_rad * RSUN_AU) / 2) * (star.st_teff / kelvin) ** 2 * Math.sqrt(1 - ASSUMED_ALBEDO);
  return { inner: distanceAt(rule.temp_max), outer: distanceAt(rule.temp_min) };
}

function addZone(system, inner, outer) {
  if (outer <= inner) return; // the whole band is beyond the drawn area
  // A soft band: it fades in and out at the edges, so it reads as a hint and not as a solid ring. The edges are
  // soft only in the drawing, the zone itself has sharp limits (the temperatures of the candidate rule).
  const band = new THREE.Mesh(
    new THREE.RingGeometry(inner, outer, 128),
    new THREE.ShaderMaterial({
      uniforms: { uInner: { value: inner }, uOuter: { value: outer } },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform float uInner;
        uniform float uOuter;
        varying vec3 vPos;
        void main() {
          float t = (length(vPos.xy) - uInner) / (uOuter - uInner);
          float a = 0.11 * smoothstep(0.0, 0.3, t) * (1.0 - smoothstep(0.7, 1.0, t));
          gl_FragColor = vec4(pow(vec3(0.3, 0.8, 0.55), vec3(2.2)), a);
          #include <colorspace_fragment>
        }`,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  band.rotation.x = -Math.PI / 2; // a ring is born standing up, the orbits lie flat
  system.group.add(band);
  system.zone = true;
  band.visible = zoneOn;
  system.zoneMesh = band; // the close-up hides it, see enterCloseup
}

function disposeSystem(system) {
  scene.remove(system.group);
  system.group.traverse((o) => {
    o.geometry?.dispose();
    o.material?.map?.dispose();
    o.material?.dispose();
  });
}

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

// Ring around the selected star. sizeAttenuation is off so it keeps the same size
// on screen, otherwise it would vanish when the camera is far away.
function ringTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  g.strokeStyle = "#7cffb2";
  g.lineWidth = 4;
  g.beginPath();
  g.arc(32, 32, 26, 0, Math.PI * 2);
  g.stroke();
  return new THREE.CanvasTexture(c);
}
const ring = new THREE.Sprite(
  new THREE.SpriteMaterial({ map: ringTexture(), sizeAttenuation: false, depthTest: false, transparent: true })
);
ring.scale.set(0.07, 0.07, 1);
ring.visible = false;
scene.add(ring);

const FLIGHT_MS = 1400;
let flight = null;
let current = null; // { star, system, follow } of the menu entry that is shown
let activeExo = null; // the one exoplanet system that exists at a time

// The camera looks from above, the orbits lie flat and a side view would stack all
// planets on one line. The ring follows the chosen planet while it moves.
const VIEW_DIRECTION = new THREE.Vector3(0, 0.8, 0.6);

function flyTo({ star, system }) {
  const target = toMapPosition(star, new THREE.Vector3());
  system.group.position.copy(target);
  startFlight(() => target, system.viewDistance);
  ring.visible = true;
}

// The target is a function because a planet keeps moving while the camera flies to it.
function startFlight(getTarget, distance, direction = VIEW_DIRECTION) {
  flight = {
    start: performance.now(),
    fromPos: camera.position.clone(),
    fromTarget: controls.target.clone(),
    getTarget,
    distance,
    direction,
  };
}

// Close-up of the chosen planet. The camera stays with it while it travels around the star.
let closeup = false;

function leaveCloseup() {
  closeup = false;
  // The green zone is a flat disc through the orbit plane. Close to a planet it would cut through
  // the planet and tint half of it, so it is only shown in the system view.
  if (current?.system.zoneMesh) current.system.zoneMesh.visible = zoneOn && !quiet;
  if (current?.follow?.userData.label) current.follow.userData.label.visible = true;
}

function showSystem(star, planet) {
  leaveCloseup();
  let system;
  let follow;
  if (star.solarSystem) {
    system = solar;
    follow = solar.bodies.find((b) => b.name === planet.pl_name)?.mesh ?? earthMesh;
  } else {
    if (activeExo) disposeSystem(activeExo);
    activeExo = system = exoSystem(star);
    // Put the planets on their orbits right away. Before the first frame they all sit in the middle, and a
    // close-up started now would look from the wrong side (the night side) of the planet.
    stepSystem(system, 0);
    follow = system.bodies.find((b) => b.name === planet.pl_name)?.mesh;
  }
  current = { star, system, follow, planet };
  // The first view is always the whole system, the close-up is one button away.
  flyTo(current);
  showStory(star, planet);
}

// Story panel. The text always stays visible, the audio is an extra.
const storyPanel = document.getElementById("story");
// The story panel (the "info" of a planet) is closed until the Info button at the top right is pressed. The button
// shows up as soon as there is a story. While a trip flies (quiet) both are hidden.
const infoButton = document.getElementById("info-button");
let storyOpen = false;
let hasStory = false;
function applyStoryVisibility() {
  storyPanel.hidden = quiet || !storyOpen;
  infoButton.hidden = quiet;
  if (!hasStory) {
    // No planet chosen yet: the window says so instead of staying empty.
    document.getElementById("story-title").textContent = "Info";
    document.getElementById("story-type").hidden = true;
    const p = document.createElement("p");
    p.textContent = TRAVEL_UI[lang].infoEmpty;
    document.getElementById("story-text").replaceChildren(p);
    listenButton.hidden = true;
    closeupButton.hidden = true;
  } else {
    listenButton.hidden = false;
  }
  infoButton.setAttribute("aria-expanded", String(storyOpen));
  layoutView();
}
infoButton.addEventListener("click", () => {
  storyOpen = !storyOpen;
  applyStoryVisibility();
});
const listenButton = document.getElementById("story-listen");
const closeupButton = document.getElementById("story-closeup");
let storyParagraphs = [];

function updateCloseupButton() {
  closeupButton.hidden = !current?.follow; // a system without a placed planet has nothing to zoom to
  closeupButton.textContent = closeup ? UI[lang].back : UI[lang].closeup;
  updateInfoTexts();
  layoutView();
}

// The zone and belt notes always stay in the info window (burger button), so they can be read
// before the zone or the belt is on screen.
function updateInfoTexts() {
  document.getElementById("legal-link").textContent = UI[lang].legalLink;
  if (rule) document.getElementById("zone-text").textContent = UI[lang].zone(rule.temp_min, rule.temp_max);
  document.getElementById("belt-note").textContent = UI[lang].beltNote;
}

// The panels lie on top of the canvas. The camera looks at the middle of the free space between
// them, so the planet is not hidden behind the text. When that space is too narrow (small
// window), the story shrinks to title and buttons while we are in a close-up.
const MIN_FREE_PX = 240;
function layoutView() {
  storyPanel.classList.remove("compact");
  const w = window.innerWidth;
  const left = document.getElementById("hud").getBoundingClientRect().right;
  const right = storyPanel.hidden ? w : storyPanel.getBoundingClientRect().left;
  const roomy = right - left >= MIN_FREE_PX;
  storyPanel.classList.toggle("compact", closeup && !roomy);
  if (roomy) camera.setViewOffset(w, window.innerHeight, w / 2 - (left + right) / 2, 0, w, window.innerHeight);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", layoutView);

const CLOSEUP_RADII = 3; // camera distance in planet radii

function enterCloseup() {
  closeup = true;
  if (current.system.zoneMesh) current.system.zoneMesh.visible = false;
  if (current.follow.userData.label) current.follow.userData.label.visible = false;
  const radius = current.follow.geometry.parameters.radius;
  const follow = current.follow;
  // The camera comes in from the side of the star, a little from above. Seen from there the planet
  // shows its lit half. From a fixed direction it was often the night side, and a dark planet
  // looked like a black ball. The planet keeps moving, so the view slowly turns towards the night.
  const planetPos = follow.getWorldPosition(new THREE.Vector3());
  const toStar = current.system.group.getWorldPosition(new THREE.Vector3()).sub(planetPos).normalize();
  if (toStar.lengthSq() === 0) toStar.set(0, 0, 1); // the star itself is the target, there is no star direction
  const direction = toStar.multiplyScalar(0.75).add(new THREE.Vector3(0, 0.55, 0)).normalize();
  startFlight(() => follow.getWorldPosition(new THREE.Vector3()), radius * (follow.userData.closeupRadii ?? CLOSEUP_RADII), direction);
  ring.visible = false; // the ring would sit on top of the planet we are looking at
}

closeupButton.addEventListener("click", () => {
  if (closeup) {
    leaveCloseup();
    flyTo(current);
  } else {
    enterCloseup();
  }
  updateCloseupButton();
});

// The browser language decides the first time, afterwards the choice is remembered.
const savedLang = (() => {
  try {
    return localStorage.getItem("lang");
  } catch {
    return null; // storage can be blocked, the app works without it
  }
})();
let lang = savedLang in UI ? savedLang : navigator.language?.startsWith("de") ? "de" : "en";

// Reading aloud: a recorded clip is played when there is one (the same voice on every device),
// otherwise the browser's own voice reads the text. Clips come from src/make_audio.py.
let narration = null;
let playing = false;
let storyId = "";

// The look of the exoplanets. "Artistic" is the default because it is the one that looks good,
// it adds invented patterns and says so in the panel. "Schematic" shows only what is measured and
// stays one click away. A visitor who picked one keeps it.
const savedLook = (() => {
  try {
    return localStorage.getItem("look");
  } catch {
    return null;
  }
})();
let look = savedLook === "schematic" ? "schematic" : "artistic";
artUniform.value = look === "artistic" ? 1 : 0;

function stopSpeaking() {
  if (narration) {
    narration.onended = narration.onerror = null; // a manual stop must not trigger the fallback
    narration.pause();
    narration = null;
  }
  window.speechSynthesis?.cancel();
  playing = false;
  listenButton.textContent = UI[lang].listen;
}

function speakWithBrowser() {
  if (!("speechSynthesis" in window)) return stopSpeaking();
  // One utterance per paragraph, long texts get cut off by some browsers.
  storyParagraphs.forEach((text, i) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = UI[lang].speech;
    if (i === storyParagraphs.length - 1) utterance.onend = stopSpeaking;
    speechSynthesis.speak(utterance);
  });
}

let hasClip = false; // only the candidates and Earth have a recording, the rest uses the browser voice

function showStory(star, planet) {
  stopSpeaking();
  storyId = slug(planet.pl_name);
  hasClip = !!(planet.habitable || star.solarSystem) && !planet.solarObject; // the visitors have no recording
  const story = buildStory(star, planet, lang);
  storyParagraphs = story.paragraphs;
  if (star.planets?.includes(planet) && !planet.pl_orbper && !planet.pl_orbsmax) {
    storyParagraphs = [...storyParagraphs, TRAVEL_UI[lang].orbitUnknown]; // see exoSystem
  }
  listenButton.hidden = storyParagraphs.length === 0;
  document.getElementById("story-title").textContent = story.title;
  // The type line is shown, not read aloud, so the recorded clips stay valid. Earth is a real
  // photograph, so it needs no "schematic" warning.
  const typeLine = document.getElementById("story-type");
  const noType = !!star.solarSystem || !!planet.solarOther;
  const note = planet.noteKey ? UI[lang][planet.noteKey] : null; // a planet of ours whose map needs a word of explanation
  typeLine.hidden = noType && !note;
  if (note) {
    typeLine.textContent = note;
  } else if (!noType) {
    const t = UI[lang];
    typeLine.textContent = `${(planet.radius_calculated ? t.typeLineCalc : t.typeLine)(t.types[planetType(planet.pl_rade)])} ${look === "artistic" ? t.artistic : t.schematic}`;
  }
  document.getElementById("story-text").replaceChildren(
    ...storyParagraphs.map((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      return p;
    })
  );
  hasStory = true;
  applyStoryVisibility();
  updateCloseupButton();
}

listenButton.addEventListener("click", () => {
  if (playing) return stopSpeaking();
  playing = true;
  listenButton.textContent = UI[lang].stop;
  if (!hasClip) return speakWithBrowser(); // no recording exists, do not ask the server for one

  const clip = new Audio(`audio/${lang}/${storyId}.mp3`);
  narration = clip;
  clip.onended = stopSpeaking;
  // A missing file or a blocked play() both end up here.
  const fallback = () => {
    if (narration !== clip) return; // already stopped or replaced
    narration = null;
    speakWithBrowser();
  };
  clip.onerror = fallback;
  clip.play().catch(fallback);
});

// Clicking a planet in the scene opens its close-up. A click is a press and release that hardly
// moved, anything longer is a drag that turns the view.
const raycaster = new THREE.Raycaster();
let pressAt = null;
canvas.addEventListener("pointerdown", (e) => (pressAt = { x: e.clientX, y: e.clientY }));
canvas.addEventListener("pointerup", (e) => {
  if (!pressAt) return;
  const moved = Math.hypot(e.clientX - pressAt.x, e.clientY - pressAt.y);
  pressAt = null;
  if (moved < 5) (picking ? pickForPlanner : measuring ? pickMeasure : pickPlanet)(e.clientX, e.clientY);
});

function pickPlanet(x, y) {
  const systems = [solar, activeExo].filter((s) => s?.group.visible);
  const targets = systems.flatMap((s) => s.bodies.map((b) => b.hit));
  raycaster.setFromCamera(new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1), camera);
  const hit = raycaster.intersectObjects(targets, false)[0]?.object;
  for (const system of systems) {
    const body = system.bodies.find((b) => b.hit === hit);
    if (body) return selectBody(system, body);
  }
}

function selectBody(system, body) {
  let star;
  let planet;
  if (system === solar) {
    if (body.name === "Earth") ({ star, planet } = EARTH);
    else {
      star = EARTH.star; // the Sun, at the origin
      planet = body.visitor ? visitorPlanet(body) : { pl_name: body.name, solarOther: true, noteKey: body.noteKey };
    }
  } else {
    star = system.star;
    planet = star.planets.find((p) => p.pl_name === body.name);
  }
  leaveCloseup();
  current = { star, system, follow: body.mesh, planet };
  enterCloseup(); // the camera goes straight to the planet that was clicked
  showStory(star, planet);
  buildHabitableMenu(); // moves the highlight, or clears it when the planet is not a candidate
  buildSolarMenu();
}

// The burger button at the top right opens the hints and the credits.
const burger = document.getElementById("burger");
const infoPanel = document.getElementById("info");
function toggleInfo(open = infoPanel.hidden) {
  infoPanel.hidden = !open;
  burger.setAttribute("aria-expanded", String(open));
}
burger.addEventListener("click", () => toggleInfo());
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !infoPanel.hidden) toggleInfo(false);
});

const langSelect = document.getElementById("lang");
langSelect.value = lang;
langSelect.addEventListener("change", () => {
  lang = langSelect.value;
  try {
    localStorage.setItem("lang", lang);
  } catch {
    // not remembered, still switches for this visit
  }
  applyLanguage();
});

const lookSelect = document.getElementById("look");
lookSelect.value = look;
lookSelect.addEventListener("change", () => {
  look = lookSelect.value;
  artUniform.value = look === "artistic" ? 1 : 0;
  try {
    localStorage.setItem("look", look);
  } catch {
    // not remembered, still switches for this visit
  }
  applyLanguage(); // rewrites the note under the story title
});

// Redraws everything that has words in it. The story is rebuilt from the same planet,
// so switching the language while reading keeps the selection.
function applyLanguage() {
  const t = UI[lang];
  document.documentElement.lang = lang;
  document.getElementById("hint").textContent = t.hint;
  document.getElementById("speed-title").textContent = t.speedTitle;
  updateSpeedText();
  lookSelect.title = t.lookLabel;
  lookSelect.setAttribute("aria-label", t.lookLabel);
  lookSelect.options[0].textContent = t.look.schematic;
  lookSelect.options[1].textContent = t.look.artistic;
  document.getElementById("scale").textContent = compressed ? t.scaleCompressed : t.scaleLinear;
  document.getElementById("count").textContent = stars.length
    ? t.count(stars.length, stars.reduce((n, s) => n + s.planets.length, 0))
    : t.loading;
  buildHabitableMenu();
  buildSolarMenu();
  updateSolarLabels();
  showGaiaState();
  showDeepState();
  showBackgroundState();
  buildPlanner();
  stopSpeaking();
  if (current) showStory(current.star, current.planet);
}

// A manual drag takes over from a running flight.
controls.addEventListener("start", () => (flight = null));

function stepFlight() {
  if (!flight) return;
  const u = Math.min(1, (performance.now() - flight.start) / FLIGHT_MS);
  const e = u * u * (3 - 2 * u); // smoothstep, soft start and stop
  const target = flight.getTarget();
  const toPos = target.clone().addScaledVector(flight.direction, flight.distance);
  camera.position.lerpVectors(flight.fromPos, toPos, e);
  controls.target.lerpVectors(flight.fromTarget, target, e);
  if (u === 1) flight = null;
}

// Earth is not in the NASA exoplanet table, so it is added here as the reference point.
// It sits at the origin, which is where the Sun is on the map. One shared object, so the
// menu can tell after a rebuild which entry is selected.
const EARTH = {
  star: { x: 0, y: 0, z: 0, dist_ly: 0, solarSystem: true },
  planet: { pl_name: "Earth", pl_rade: 1, pl_eqt: 255 },
};

function buildHabitableMenu() {
  const items = [];
  for (const star of stars) {
    for (const p of star.planets) if (p.habitable) items.push({ star, planet: p });
  }
  items.sort((a, b) => a.star.dist_ly - b.star.dist_ly);
  items.unshift(EARTH);

  document.getElementById("habitable-title").textContent = UI[lang].candidates(items.length - 1);
  const list = document.getElementById("habitable");
  list.replaceChildren();
  for (const { star, planet } of items) {
    const name = document.createElement("span");
    name.textContent = star.solarSystem ? UI[lang].earth : planet.pl_name;
    // No planet type here: every candidate comes out as "rocky" by the radius rule, so the label would
    // say the same thing 37 times. The type is shown in the panel under the title instead.
    const info = document.createElement("small");
    info.textContent = `${star.dist_ly.toFixed(1)} ly · ${planet.radius_calculated ? "≈" : ""}${planet.pl_rade} R⊕ · ${Math.round(planet.pl_eqt)} K`;
    const label = document.createElement("div");
    label.append(name, info);
    const row = document.createElement("div");
    row.className = "row";
    if (current?.planet === planet) row.classList.add("active");
    row.append(label, viewButtons(star, planet));
    const li = document.createElement("li");
    li.append(row);
    list.append(li);
  }
}

// The three views of a body: the planet itself, its star, the whole system. A plain click on the
// name used to jump to the system view, which looked like nothing had happened to the planet.
function viewButtons(star, planet) {
  const views = document.createElement("div");
  views.className = "views";
  const actions = [
    ["viewPlanet", () => current.follow && enterCloseup()],
    [star.solarSystem ? "viewSun" : "viewStar", () => focusStar()],
    ["viewSystem", () => {}],
  ];
  for (const [key, run] of actions) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = UI[lang][key];
    b.addEventListener("click", () => {
      showSystem(star, planet);
      run();
      updateCloseupButton();
      buildSolarMenu(); // Earth is in both lists, so each one has to follow the other
      buildHabitableMenu();
    });
    views.append(b);
  }
  return views;
}

// Close-up of the star of the system on screen. Its story stays the one of the chosen planet, a star has no text.
function focusStar() {
  current.follow = current.system === solar ? sun : current.system.starMesh;
  if (current.follow) enterCloseup();
}

// The names above the bodies of our own system are written in the language of the page: Merkur and
// Mond in German, Mercury and Moon in English. Exoplanets keep their catalogue names.
function updateSolarLabels() {
  for (const b of solar.bodies) {
    b.mesh.userData.label?.userData.setText(b.name === "Earth" ? UI[lang].earthShort : solarName(b.name, lang));
    b.moon?.mesh.userData.label.userData.setText(lang === "de" ? "Mond" : "Moon");
  }
  beltLabel.userData.setText(lang === "de" ? "Asteroidengürtel" : "Asteroid belt");
}

// The eight planets of the Solar System, in order from the Sun. Every click shows the Solar System
// and flies to that planet, the same way the candidate list does for an exoplanet system.
function buildSolarMenu() {
  document.getElementById("solar-title").textContent = UI[lang].solarTitle;
  document.getElementById("credits-title").textContent = UI[lang].creditsTitle;
  document.getElementById("hints-title").textContent = UI[lang].hintsTitle;
  updateInfoTexts();
  const list = document.getElementById("solar-list");
  list.replaceChildren();
  for (const body of solar.bodies) {
    if (!PLANETS.some((p) => p.name === body.name)) continue; // the Moon is a body too
    const isEarth = body.name === "Earth";
    const planet = isEarth ? EARTH.planet : { pl_name: body.name, solarOther: true, noteKey: body.noteKey };
    const name = document.createElement("span");
    name.textContent = isEarth ? UI[lang].earthShort : solarName(body.name, lang);
    const au = PLANETS.find((p) => p.name === body.name).au;
    const info = document.createElement("small");
    info.textContent = `${au} AU`;
    const label = document.createElement("div");
    label.append(name, info);
    const row = document.createElement("div");
    row.className = "row";
    if (current?.system === solar && current.planet.pl_name === body.name) row.classList.add("active");
    row.append(label, viewButtons(EARTH.star, planet));
    const li = document.createElement("li");
    li.append(row);
    list.append(li);
  }
  buildVisitorMenu();
  buildStarMenu();
}

// The deep Gaia layer: about a million bright stars (G < 11, up to 16,000 light years away) from src/fetch_gaia_bright.py and
// src/build_gaia_bright.py, without the stars of the near layer and the planet hosts. It gives the depth: stars at all distances
// around the camera, so near ones sweep past while far ones stay put when we fly. It uses the same material as the near layer (real
// brightness from the camera distance). A separate switch and file: it is only read when switched on, and it is not offered on
// touch devices and narrow screens, where a million points would be too heavy.
const DEEP_MAG_MIN = -8; // absolute magnitude range of the byte, same as MAG_MIN and MAG_MAX in build_gaia_bright.py
const DEEP_MAG_MAX = 12;
const IS_MOBILE = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 700;
let deep = null;
let deepOn = false;
// Its own copy of the material: a million stars need a lower gain and an exposure that does not open up on the overview, or they
// add up to a white wall (see updateCameraReal).
const deepMaterial = gaiaMaterial.clone();
deepMaterial.uniforms.uGain.value = 0.4;
const deepButton = document.getElementById("gaia-deep");
const deepNote = document.getElementById("gaia-deep-note");
if (IS_MOBILE) deepButton.hidden = true;

async function loadDeep() {
  const response = await fetch("data/gaia_deep.bin");
  if (!response.ok) throw new Error(`Deep Gaia file: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const count = buffer.byteLength / 16;
  const xyz = new Float32Array(buffer, 0, count * 3);
  const attributes = new Uint8Array(buffer, count * 12, count * 4);
  const colors = new Float32Array(count * 3);
  const absmag = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = attributes[i * 4] / 255;
    const g = attributes[i * 4 + 1] / 255;
    const b = attributes[i * 4 + 2] / 255;
    const peak = Math.max(r, g, b);
    // The same quiet colour as the other background stars: pulled towards white.
    colors[i * 3] = r + (peak - r) * BACKGROUND_WHITENING;
    colors[i * 3 + 1] = g + (peak - g) * BACKGROUND_WHITENING;
    colors[i * 3 + 2] = b + (peak - b) * BACKGROUND_WHITENING;
    absmag[i] = DEEP_MAG_MIN + (attributes[i * 4 + 3] / 255) * (DEEP_MAG_MAX - DEEP_MAG_MIN);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("truePos", new THREE.BufferAttribute(xyz, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("absmag", new THREE.BufferAttribute(absmag, 1));
  const layer = new THREE.Points(geometry, deepMaterial);
  layer.frustumCulled = false;
  scene.add(layer);
  deep = { points: layer, xyz, count, drawn: count, slow: 0, frames: 0, timeSum: 0 };
  placeDeep();
}

// Quality that follows the speed of the computer. The file is sorted brightest first, so drawing fewer stars drops the faintest.
// Every 8 frames the average frame time is looked at: slower than 33 ms (under 30 frames per second) takes away half of the
// stars, down to 100,000, so a slow computer is back to a smooth picture within a few seconds. It does not come back up by itself, a new switch-on starts again with all of them.
function adaptDeepQuality(dt) {
  if (!deep || !deep.points.visible) return;
  deep.timeSum += dt;
  if (++deep.frames < 8) return;
  const average = deep.timeSum / deep.frames;
  deep.frames = 0;
  deep.timeSum = 0;
  if (average > 0.033 && deep.drawn > 100000) {
    deep.drawn = Math.max(100000, Math.floor(deep.drawn * 0.5));
    deep.points.geometry.setDrawRange(0, deep.drawn);
  }
}

function placeDeep() {
  const attr = deep.points.geometry.getAttribute("position");
  const tmp = new THREE.Vector3();
  const star = { x: 0, y: 0, z: 0 };
  for (let i = 0; i < deep.count; i++) {
    star.x = deep.xyz[i * 3];
    star.y = deep.xyz[i * 3 + 1];
    star.z = deep.xyz[i * 3 + 2];
    toMapPosition(star, tmp);
    attr.setXYZ(i, tmp.x, tmp.y, tmp.z);
  }
  attr.needsUpdate = true;
}

// The picture of the Milky Way behind everything can be switched off, the sky is then black with the stars only.
const backgroundButton = document.getElementById("bg-toggle");
function showBackgroundState() {
  const on = milkyWay.visible;
  backgroundButton.textContent = on ? UI[lang].backgroundOn : UI[lang].backgroundOff;
  backgroundButton.setAttribute("aria-pressed", String(on));
}
backgroundButton.addEventListener("click", () => {
  milkyWay.visible = !milkyWay.visible;
  showBackgroundState();
});

function showDeepState(state = deepOn ? "on" : "off") {
  const t = UI[lang];
  deepButton.textContent = { on: t.deepOn, off: t.deepOff, loading: t.deepLoading, failed: t.deepFailed }[state];
  deepButton.setAttribute("aria-pressed", String(deepOn));
  deepNote.hidden = !(deepOn && deep);
  if (deep) deepNote.textContent = t.deepNote(deep.count.toLocaleString(lang));
}
deepButton.addEventListener("click", async () => {
  if (deepOn) {
    deepOn = false;
    if (deep) deep.points.visible = false;
    return showDeepState();
  }
  deepOn = true;
  try {
    if (!deep) {
      showDeepState("loading");
      await loadDeep();
    }
    deep.points.visible = true;
    deep.drawn = deep.count; // start with all of them again
    deep.points.geometry.setDrawRange(0, deep.count);
    showDeepState();
  } catch (error) {
    console.error(error);
    deepOn = false;
    showDeepState("failed");
  }
});

// Filter by discoverer: the stars of the planets that one telescope or observatory found stay bright, all
// others are dimmed. The list holds the places that found at least 30 planets, the most successful first.
const facilitySelect = document.getElementById("facility");
const facilityNote = document.getElementById("facility-note");
function buildFacilityMenu() {
  const counts = new Map();
  for (const star of stars) for (const p of star.planets) if (p.disc_facility) counts.set(p.disc_facility, (counts.get(p.disc_facility) ?? 0) + 1);
  const options = [...counts].filter(([, n]) => n >= 30).sort((a, b) => b[1] - a[1]);
  facilitySelect.replaceChildren(new Option(UI[lang].facilityAll, ""));
  for (const [name, n] of options) facilitySelect.append(new Option(`${name} (${n})`, name));
}
// One function for both filters (discoverer and spectral class), because they share the "match" attribute of the
// star shader: 1 is shown, 0 is dimmed, -1 is hidden (only the spectral filter in "isolate" mode hides).
const spectralModeSelect = document.getElementById("spectral-mode");
const spectralClassSelect = document.getElementById("spectral-class");
const spectralNote = document.getElementById("spectral-note");
function applyFilters() {
  const facility = facilitySelect.value;
  const spectralMode = spectralModeSelect.value;
  const cls = spectralClassSelect.value;
  const match = points.geometry.getAttribute("match");
  let hosts = 0;
  let planets = 0;
  let classHosts = 0;
  let classPlanets = 0;
  let unknown = 0;
  stars.forEach((s, i) => {
    const hits = facility ? s.planets.filter((p) => p.disc_facility === facility).length : 0;
    const facilityOk = !facility || hits > 0;
    if (hits > 0) {
      hosts++;
      planets += hits;
    }
    // A star whose temperature was only assumed (teff_missing) has no class.
    const own = s.teff_missing ? null : spectralClass(s.st_teff);
    if (!own) unknown++;
    const classOk = spectralMode === "off" || own === cls;
    if (spectralMode !== "off" && own === cls) {
      classHosts++;
      classPlanets += s.planets.length;
    }
    match.setX(i, !classOk && spectralMode === "isolate" ? -1 : facilityOk && classOk ? 1 : 0);
  });
  match.needsUpdate = true;
  facilityNote.hidden = !facility;
  facilityNote.textContent = facility ? UI[lang].facilityNote(planets, hosts) : "";
  spectralClassSelect.hidden = spectralMode === "off";
  spectralNote.hidden = spectralMode === "off";
  if (spectralMode !== "off") {
    const range = SPECTRAL.find((c) => c.cls === cls);
    spectralNote.textContent = TRAVEL_UI[lang].spectralNote(
      cls, TRAVEL_UI[lang].spectralRange(range.min, range.max), "", classHosts, classPlanets, unknown
    );
  }
}
facilitySelect.addEventListener("change", applyFilters);
spectralModeSelect.addEventListener("change", applyFilters);
spectralClassSelect.addEventListener("change", applyFilters);

// Search over all stars and planets of the NASA list: type a name, get up to ten hits, nearest star first, with the
// same three buttons as the lists (planet, star, system). The index is made on the first key press.
let searchIndex = null;
const searchInput = document.getElementById("search");
const searchResults = document.getElementById("search-results");
function runSearch() {
  const query = searchInput.value.trim().toLowerCase();
  searchResults.replaceChildren();
  searchResults.hidden = query.length < 2;
  if (query.length < 2) return;
  searchIndex ??= stars.flatMap((star) =>
    star.planets.map((planet) => ({ key: `${planet.pl_name} ${star.hostname}`.toLowerCase(), star, planet }))
  );
  const hits = searchIndex
    .filter((e) => e.key.includes(query))
    .sort((a, b) => {
      const starts = Number(b.key.startsWith(query)) - Number(a.key.startsWith(query));
      return starts || a.star.dist_ly - b.star.dist_ly;
    })
    .slice(0, 10);
  if (hits.length === 0) {
    const none = document.createElement("li");
    none.className = "none";
    none.textContent = UI[lang].noResults;
    searchResults.append(none);
    return;
  }
  for (const { star, planet } of hits) {
    const name = document.createElement("span");
    name.textContent = planet.pl_name;
    const info = document.createElement("small");
    info.textContent = `${star.hostname} · ${star.dist_ly.toFixed(1)} ${UI[lang].lightYears}`;
    const label = document.createElement("div");
    label.append(name, info);
    const row = document.createElement("div");
    row.className = "row";
    row.append(label, viewButtons(star, planet));
    const li = document.createElement("li");
    li.append(row);
    searchResults.append(li);
  }
}
searchInput.addEventListener("input", runSearch);
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    searchInput.value = "";
    runSearch();
  }
});

// The named stars of the Gaia layer as a list: a click switches the layer on (so the star and its name are
// there) and flies to the star, nearest first.
function buildStarMenu() {
  document.getElementById("stars-title").textContent = UI[lang].starsTitle;
  searchInput.placeholder = UI[lang].searchPlaceholder;
  const keep = facilitySelect.value;
  buildFacilityMenu();
  facilitySelect.value = keep;
  if (keep) facilitySelect.dispatchEvent(new Event("change"));
  if (searchInput.value.trim().length >= 2) runSearch(); // the language changed, the hits get their words again
  const list = document.getElementById("star-list");
  list.replaceChildren();
  const byDistance = [...GAIA_NAMES].sort((a, b) => Math.hypot(a.x, a.y, a.z) - Math.hypot(b.x, b.y, b.z));
  for (const s of byDistance) {
    const name = document.createElement("span");
    name.textContent = s.name;
    const info = document.createElement("small");
    info.textContent = `${Math.hypot(s.x, s.y, s.z).toFixed(0)} ${UI[lang].lightYears}`;
    const label = document.createElement("div");
    label.append(name, info);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = UI[lang].flyTo;
    button.addEventListener("click", () => {
      if (!gaiaOn) gaiaButton.click();
      leaveCloseup(); // a close-up that follows a planet would pull the camera back
      updateCloseupButton();
      const target = toMapPosition(s, new THREE.Vector3());
      startFlight(() => target, 0.4);
    });
    const views = document.createElement("div");
    views.className = "views";
    views.append(button);
    const row = document.createElement("div");
    row.className = "row";
    row.append(label, views);
    const li = document.createElement("li");
    li.append(row);
    list.append(li);
  }
}

// The spacecraft, comets and interstellar objects, with the same three buttons as the planets.
function buildVisitorMenu() {
  document.getElementById("visitors-title").textContent = UI[lang].visitorsTitle;
  const list = document.getElementById("visitors");
  list.replaceChildren();
  for (const kind of ["spacecraft", "comet", "interstellar"]) {
    for (const body of solar.bodies.filter((b) => b.visitor?.kind === kind)) {
      const name = document.createElement("span");
      name.textContent = body.name;
      const info = document.createElement("small");
      info.textContent = UI[lang].visitorKinds[kind];
      const label = document.createElement("div");
      label.append(name, info);
      const row = document.createElement("div");
      row.className = "row";
      if (current?.system === solar && current.planet.pl_name === body.name) row.classList.add("active");
      row.append(label, viewButtons(EARTH.star, visitorPlanet(body)));
      const li = document.createElement("li");
      li.append(row);
      list.append(li);
    }
  }
}

// The speed slider. The left end is real time. Each step to the right is a little faster, over
// eight powers of ten, up to a hundred million times (one second is about three years).
const speedSlider = document.getElementById("speed");
const speedText = document.getElementById("speed-text");
const speedElapsed = document.getElementById("speed-elapsed");

function updateSpeedText() {
  const t = UI[lang];
  speedText.textContent = timeScale < 1.5 ? t.realTime : t.rate(duration(timeScale, lang));
}
speedSlider.addEventListener("input", () => {
  timeScale = 10 ** ((speedSlider.value / 100) * 8);
  updateSpeedText();
});

// How much time has passed in the system on screen, written out a few times per second.
let elapsedShownAt = 0;
function updateElapsed(now) {
  if (now - elapsedShownAt < 0.4) return;
  elapsedShownAt = now;
  const system = current?.system ?? solar;
  speedElapsed.textContent = UI[lang].elapsed(duration(system.time * SECONDS_PER_YEAR, lang));
}

document.getElementById("scale").addEventListener("click", (e) => {
  compressed = !compressed;
  e.target.textContent = compressed ? UI[lang].scaleCompressed : UI[lang].scaleLinear;
  updatePositions();
  // Positions changed, so the selected star has to be found again.
  if (current) {
    leaveCloseup();
    flyTo(current);
    updateCloseupButton();
  }
});

const trackTmp = new THREE.Vector3();
let lastFrame = performance.now() / 1000;
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now() / 1000;
  const dt = Math.min(0.1, now - lastFrame); // capped so a background tab does not make a big jump
  lastFrame = now;
  stepSystem(solar, dt);
  if (activeExo) stepSystem(activeExo, dt);
  stepTrip(now);
  stepWarp(dt);
  milkyWay.position.copy(camera.position);
  sunRays.quaternion.copy(camera.quaternion); // the sheet faces the camera
  sunRays.material.uniforms.uTime.value = now;
  sunRays.visible = camera.position.length() > SUN_RADIUS * 2.5;
  if (activeExo?.rays) {
    // The streamers of the star of the system that is open, the same sheet as the Sun's
    activeExo.rays.quaternion.copy(camera.quaternion);
    activeExo.rays.material.uniforms.uTime.value = now;
    activeExo.rays.visible = camera.position.distanceTo(activeExo.group.position) > activeExo.starMesh.geometry.parameters.radius * 2.5;
  }
  updateCameraReal();
  updateCorona(sun);
  updateCorona(activeExo?.starMesh);
  updateElapsed(now);
  // Planets live inside a group that sits at the star, so the world position is needed.
  // A system without any usable planet falls back to the star itself.
  if (current) (current.follow ?? current.system.group).getWorldPosition(ring.position);
  stepFlight();
  if (closeup && !flight) {
    // After the flight the camera and its target move with the planet, so the view stays on it
    // while the user can still turn around it with the mouse.
    const delta = current.follow.getWorldPosition(trackTmp).sub(controls.target);
    camera.position.add(delta);
    controls.target.add(delta);
  }
  stepView(now);
  stepKeys(dt);
  controls.update();
  declutterLabels();
  adaptDeepQuality(dt);
  composer.render();
}

// Keyboard: W and S fly forward and back, A and D sideways, Q and E down and up, the arrow keys turn the
// view on the spot, Shift is four times faster. The speed follows the distance between camera and target,
// so it is slow close to a planet and fast on the overview. It moves camera and target together, the
// orbit controls of the mouse keep working. A flight or a close-up that is following a planet is ended by it.
const keys = new Set();
const KEY_TURN_SPEED = 1.2; // radians per second
const MOVE_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE"]);
const TURN_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]);
const keyForward = new THREE.Vector3();
const keyRight = new THREE.Vector3();
const keyMove = new THREE.Vector3();

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  // Not while the user types or chooses in a form control, the arrow keys belong to it then.
  if (e.target instanceof HTMLElement && e.target.matches("input, select, textarea, [contenteditable]")) return;
  if (!MOVE_KEYS.has(e.code) && !TURN_KEYS.has(e.code)) return;
  keys.add(e.code);
  e.preventDefault(); // otherwise the arrow keys also scroll the panel
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => keys.clear());

function stepKeys(dt) {
  flyWarpTarget = 0;
  if (keys.size === 0) return;
  if (flight) flight = null;
  if (trip) trip.follow = false; // the keys take over from the ship
  if (closeup) {
    leaveCloseup(); // the close-up follows the planet and would pull the camera back
    updateCloseupButton();
  }
  const offset = controls.target.clone().sub(camera.position);
  const distance = Math.max(offset.length(), 1e-4);
  keyForward.copy(offset).divideScalar(distance);

  // Turning: the camera stays where it is and the target swings around it.
  const yaw = ((keys.has("ArrowLeft") ? 1 : 0) - (keys.has("ArrowRight") ? 1 : 0)) * KEY_TURN_SPEED * dt;
  const pitch = ((keys.has("ArrowUp") ? 1 : 0) - (keys.has("ArrowDown") ? 1 : 0)) * KEY_TURN_SPEED * dt;
  if (yaw !== 0 || pitch !== 0) {
    keyRight.crossVectors(keyForward, camera.up).normalize();
    const dir = keyForward.clone();
    dir.applyAxisAngle(camera.up, yaw);
    // Stop short of looking straight up or down, where the view would flip over.
    const turned = dir.clone().applyAxisAngle(keyRight, pitch);
    if (Math.abs(turned.y) < 0.995) dir.copy(turned);
    controls.target.copy(camera.position).addScaledVector(dir, distance);
    keyForward.copy(dir);
  }

  // Moving: camera and target together.
  keyMove.set(0, 0, 0);
  keyRight.crossVectors(keyForward, camera.up).normalize();
  if (keys.has("KeyW")) keyMove.add(keyForward);
  if (keys.has("KeyS")) keyMove.sub(keyForward);
  if (keys.has("KeyD")) keyMove.add(keyRight);
  if (keys.has("KeyA")) keyMove.sub(keyRight);
  if (keys.has("KeyE")) keyMove.add(camera.up);
  if (keys.has("KeyQ")) keyMove.sub(camera.up);
  if (keyMove.lengthSq() > 0) {
    // "Auto" follows the distance to the target. A step in c is a real speed (1 c = one light second per second),
    // turned into map units where the camera is, see mapPerLightYear.
    const flyC = currentFlyC();
    const base = flyC === null ? Math.max(distance * 0.4, 0.02) : (flyC / YEAR_SECONDS) * mapPerLightYear();
    const speed = base * (shiftHeld ? 4 : 1);
    flyWarpTarget = flyC === null ? 0 : Math.min(1, Math.max(0, (Math.log10(flyC) - 2) / 8));
    keyMove.normalize().multiplyScalar(speed * dt);
    camera.position.add(keyMove);
    controls.target.add(keyMove);
  }
}
let shiftHeld = false;
window.addEventListener("keydown", (e) => (shiftHeld = e.shiftKey));
window.addEventListener("keyup", (e) => (shiftHeld = e.shiftKey));

// ---------------------------------------------------------------------------------------------------------
// Travel planner, stage 1: planet to planet in the Solar System. The ship leaves the start planet where it is
// now and flies a straight line at constant speed to the place where the target will be on arrival (intercept
// course, solveIntercept in travel.js). Gravity is ignored, and the ship does not start with the speed of the
// start planet. The positions are the real ones from planetPosition. The path is worked out in AU and then drawn
// through mapEcliptic, so on the squeezed map the straight line is curved (a note says so).
let trip = null; // { jd0, days, o, d, beta, kind, ... } while a trip is set up
const planFrom = document.getElementById("plan-from");
const planTo = document.getElementById("plan-to");
const planSpeed = document.getElementById("plan-speed");
const planKind = document.getElementById("plan-kind");
const planGo = document.getElementById("plan-go");
const planStop = document.getElementById("plan-stop");
const plannerPanel = document.getElementById("planner-panel");
const plannerOpen = document.getElementById("planner-open");
const tripHud = document.getElementById("trip-hud");
function togglePlanner(open = plannerPanel.hidden) {
  plannerPanel.hidden = !open;
  plannerOpen.setAttribute("aria-expanded", String(open));
}
plannerOpen.addEventListener("click", () => togglePlanner());
document.getElementById("planner-close").addEventListener("click", () => togglePlanner(false));
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !plannerPanel.hidden) togglePlanner(false);
});
const stopLabel = () => (trip?.phase === "done" ? TRAVEL_UI[lang].close : TRAVEL_UI[lang].stop);

// Candidate zone switch (settings).
const zoneButton = document.getElementById("zone-toggle");
function showZoneState() {
  zoneButton.textContent = zoneOn ? TRAVEL_UI[lang].zoneOn : TRAVEL_UI[lang].zoneOff;
  zoneButton.setAttribute("aria-pressed", String(zoneOn));
}
zoneButton.addEventListener("click", () => {
  zoneOn = !zoneOn;
  showZoneState();
  for (const s of [solar, activeExo]) if (s?.zoneMesh) s.zoneMesh.visible = zoneOn && !quiet && !(closeup && current?.system === s);
});
const planResult = document.getElementById("plan-result");
const planView = document.getElementById("plan-view");
planView.value = "ego"; // first person is the default
const flySpeedSelect = document.getElementById("fly-speed");
const flyNote = document.getElementById("fly-note");
const LIGHT_SECONDS_PER_AU = LIGHT_MINUTES_PER_AU * 60;
const PLAN_COLOR = 0x7fe3ff;

const ship = new THREE.Group();
const shipGlow = starGlow(PLAN_COLOR, 1);
ship.add(shipGlow);
const shipLine = new THREE.Line(
  new THREE.BufferGeometry(),
  new THREE.LineBasicMaterial({ color: PLAN_COLOR, transparent: true, opacity: 0.85 })
);
const shipTarget = new THREE.Sprite(
  new THREE.SpriteMaterial({ map: ringTexture(), sizeAttenuation: false, depthTest: false, transparent: true, color: PLAN_COLOR })
);
shipTarget.scale.set(0.05, 0.05, 1);
for (const o of [ship, shipLine, shipTarget]) {
  o.visible = false;
  o.frustumCulled = false;
  scene.add(o); // not in the Solar System group: that one is hidden from far away, and a trip may go to a star
}

// Keeps the selection of a menu over a rebuild of its entries (a language change writes the labels again).
function fillSelect(select, entries, fallback) {
  const keep = select.value || fallback;
  select.replaceChildren(...entries.map(([value, text]) => new Option(text, value)));
  if (entries.some(([value]) => value === keep)) select.value = keep;
}

function currentFlyC() {
  return FLY_STEPS.find((f) => f.id === flySpeedSelect.value)?.c ?? null;
}

function buildPlanner() {
  const t = TRAVEL_UI[lang];
  document.getElementById("planner-title").textContent = t.title;
  document.getElementById("plan-from-label").textContent = t.from;
  document.getElementById("plan-to-label").textContent = t.to;
  document.getElementById("plan-speed-label").textContent = t.speed;
  document.getElementById("fly-label").textContent = t.flyTitle;
  document.getElementById("plan-view-label").textContent = t.view;
  planView.options[0].textContent = t.viewThird;
  planView.options[1].textContent = t.viewEgo;
  document.getElementById("plan-note").textContent = t.note;
  planGo.textContent = t.go;
  planStop.textContent = stopLabel();
  plannerOpen.textContent = t.title;
  for (const id of ["plan-from-pick", "plan-to-pick"]) {
    document.getElementById(id).textContent = t.pick;
    document.getElementById(id).title = t.pickTitle;
  }
  document.getElementById("plan-swap").title = t.swap;
  document.getElementById("plan-swap").setAttribute("aria-label", t.swap);
  document.getElementById("pick-hint-text").textContent = t.pickHint;
  document.getElementById("pick-cancel").textContent = t.cancel;
  document.getElementById("settings-title").textContent = t.settings;
  showZoneState();
  applyStoryVisibility();
  fillPlaces();
  fillSelect(planSpeed, SPEEDS.map((v) => [v.id, t.speedLabel[v.id]]), "parker");
  fillSelect(
    flySpeedSelect,
    FLY_STEPS.map((f) => [f.id, f.c === null ? t.flyAuto : t.flyStep(f.c.toLocaleString(lang)) + (f.c > 1 ? ` ${t.fictionTag}` : "")]),
    "auto"
  );
  showPlanKind();
  spectralModeSelect.options[0].textContent = t.spectralMode.off;
  spectralModeSelect.options[1].textContent = t.spectralMode.highlight;
  spectralModeSelect.options[2].textContent = t.spectralMode.isolate;
  document.getElementById("measure").textContent = measuring ? t.measureStop : t.measure;
  measurePlanButton.textContent = t.useMeasure;
  if (points) applyFilters();
  showMeasure();
  if (trip) showTripResult();
}

function showPlanKind() {
  const speed = SPEEDS.find((v) => v.id === planSpeed.value);
  planKind.textContent = TRAVEL_UI[lang].kind[speed.kind];
  planKind.classList.toggle("plan-fiction", speed.kind === "fiction" || speed.kind === "limit");
  const flyC = currentFlyC();
  flyNote.textContent = flyC === null ? "" : (flyC > 1 ? TRAVEL_UI[lang].flyFiction + " " : "") + TRAVEL_UI[lang].flyNote;
  flyNote.classList.toggle("plan-fiction", flyC > 1);
}
planSpeed.addEventListener("change", showPlanKind);
flySpeedSelect.addEventListener("change", showPlanKind);

const fmt = (value, digits = 2) => value.toLocaleString(lang, { maximumFractionDigits: digits });

function showTripResult() {
  const t = TRAVEL_UI[lang];
  const seconds = trip.days * 86400;
  let board;
  if (trip.beta < 1) {
    board = `${duration(boardSeconds(seconds, trip.beta), lang)} ${t.gamma(fmt(lorentz(trip.beta), 3))}`;
  } else {
    board = trip.beta === 1 ? t.boardLight : t.boardFiction;
  }
  const names = { from: placeLabel(trip.from), to: placeLabel(trip.to), time: duration(seconds, lang), board };
  if (trip.mode === "star") {
    const ly = trip.distanceAu * LY_PER_AU;
    planResult.textContent = t.resultStars({ ...names, ly: fmt(ly, 2), pc: fmt(ly / 3.2616, 2) });
  } else {
    planResult.textContent = t.result({
      ...names,
      au: fmt(trip.distanceAu),
      light: duration(trip.distanceAu * LIGHT_SECONDS_PER_AU, lang),
    });
  }
}
const planetLabel = (name) => (name === "Earth" ? UI[lang].earthShort : solarName(name, lang));

// Where a trip can start or end: a planet, the Sun or any host star of the list. The two boxes are text fields
// with a list of suggestions, because a menu of 4,800 stars would be too long to use.
const planPlaces = document.getElementById("plan-places");
const measurePlanButton = document.getElementById("measure-plan");
let starByName = null;
let planetByName = null;
const sunLabel = () => TRAVEL_UI[lang].sun;
function resolvePlace(text) {
  const q = text.trim().toLowerCase();
  if (!q) return null;
  const planet = PLANETS.find((p) =>
    [p.name, solarName(p.name, "en"), solarName(p.name, "de"), ...(p.name === "Earth" ? [UI.en.earthShort, UI.de.earthShort] : [])].some(
      (n) => n.toLowerCase() === q
    )
  );
  if (planet) return { kind: "planet", name: planet.name };
  if (q === "sun" || q === "sonne") return { kind: "star", star: SUN_POINT };
  starByName ??= new Map(stars.map((s) => [s.hostname.toLowerCase(), s]));
  const star = starByName.get(q);
  if (star) return { kind: "star", star };
  // An exoplanet: the trip goes to its star, and the planet gets its close-up on arrival.
  planetByName ??= new Map(stars.flatMap((s) => s.planets.map((p) => [p.pl_name.toLowerCase(), { kind: "exo", star: s, planet: p }])));
  return planetByName.get(q) ?? null;
}
function placeLabel(place) {
  if (place.kind === "planet") return planetLabel(place.name);
  if (place.kind === "exo") return place.planet.pl_name;
  return place.star === SUN_POINT ? sunLabel() : place.star.hostname;
}
// Fills the suggestions, writes the defaults (Earth to Mars) and, after a change of language, writes a planet or
// the Sun again in the new language.
function fillPlaces() {
  const names = [
    ...PLANETS.map((p) => planetLabel(p.name)),
    sunLabel(),
    ...stars.map((s) => s.hostname),
    ...stars.flatMap((s) => s.planets.map((p) => p.pl_name)),
  ];
  planPlaces.replaceChildren(...names.map((n) => new Option("", n)));
  for (const [input, fallback] of [[planFrom, "Earth"], [planTo, "Mars"]]) {
    const place = resolvePlace(input.value) ?? { kind: "planet", name: fallback };
    input.value = placeLabel(place);
  }
}
planFrom.addEventListener("focus", () => planFrom.select());
planTo.addEventListener("focus", () => planTo.select());
measurePlanButton.addEventListener("click", () => {
  planFrom.value = measureA.hostname;
  planTo.value = measureB.hostname;
  plannerPanel.hidden = false;
});

// Texts and the habitable zone off while the ship flies, on again afterwards (the story panel comes back as it was, or
// with the story of the target when the trip ends there).
function setQuiet(on) {
  if (on === quiet) return;
  quiet = on;
  applyStoryVisibility();
  for (const s of [solar, activeExo]) if (s?.zoneMesh) s.zoneMesh.visible = zoneOn && !on && !(closeup && current?.system === s);
}

// The trip sets the time speed so that it can be watched; at the end (or on Stop) the speed of the user is back.
function restoreTimeSpeed() {
  timeScale = trip.saved.timeScale;
  speedSlider.value = String((Math.log10(timeScale) / 8) * 100);
  updateSpeedText();
}

function clearTrip() {
  if (trip && !trip.arrived) restoreTimeSpeed();
  setQuiet(false);
  setNear(0.01);
  leaveEgo();
  trip = null;
  for (const o of [ship, shipLine, shipTarget]) o.visible = false;
  tripHud.hidden = true;
  planResult.textContent = "";
  warp = 0;
}
planStop.addEventListener("click", clearTrip);

planGo.addEventListener("click", () => {
  const t = TRAVEL_UI[lang];
  const from = resolvePlace(planFrom.value);
  const to = resolvePlace(planTo.value);
  if (!from || !to) {
    planResult.textContent = t.unknown;
    return;
  }
  if (placeLabel(from) === placeLabel(to)) {
    planResult.textContent = t.same;
    return;
  }
  const speed = SPEEDS.find((v) => v.id === planSpeed.value);
  const jd0 = JD_AT_LOAD + solar.time * 365.25;
  // The time speed of the user, put back when the trip ends. A second trip started during a first one keeps the first value.
  const saved = trip && !trip.arrived ? trip.saved : { timeScale };
  const beta = speed.kms / C_KMS;
  let o;
  let d;
  let days;
  let mode;
  if (from.kind === "planet" && to.kind === "planet") {
    // Planet to planet: both move, so the ship aims at the place where the target will be (AU, ecliptic).
    mode = "solar";
    const rowOf = (name) => ORBITS.planets[ELEMENT_ROW[name]];
    o = planetPosition(rowOf(from.name), jd0);
    const hit = solveIntercept(o, (jd) => planetPosition(rowOf(to.name), jd), jd0, beta * C_AU_PER_DAY);
    if (!hit) {
      planResult.textContent = t.none;
      return;
    }
    d = hit.arrive;
    days = hit.days;
  } else {
    // Stars are treated as standing still and a planet counts as the Sun (light years, the axes of the data), so
    // the time is just distance over speed: 1 c is one light year per year.
    mode = "star";
    const at = (place) => (place.kind === "planet" ? SUN_POINT : place.star);
    const a = at(from);
    const b = at(to);
    if (a === b) {
      planResult.textContent = t.same; // two planets of one star, or a planet of ours and the Sun: no trip between them
      return;
    }
    o = { x: a.x, y: a.y, z: a.z };
    d = { x: b.x, y: b.y, z: b.z };
    days = (Math.hypot(d.x - o.x, d.y - o.y, d.z - o.z) * 365.25) / beta;
  }
  const unit = mode === "solar" ? 1 : 1 / LY_PER_AU; // positions in AU for the trip data, light years become AU here
  trip = {
    jd0, days, o, d, beta, kind: speed.kind, follow: true, arrived: false, mode, from, to, saved,
    distanceAu: Math.hypot(d.x - o.x, d.y - o.y, d.z - o.z) * unit,
  };
  // Between planets of one system the ship stops in front of the target planet. Otherwise the hyperspace runs from the edge of the
  // start system to the edge of the target system (the points 2 and 3 of the film), see edgePoints.
  trip.uStart = 0;
  trip.uEnd = mode === "solar" ? stopFraction() : 1;
  if (mode === "star") edgePoints();
  trip.p2 = tripMap(lerp3(trip.o, trip.d, trip.uStart), new THREE.Vector3());
  setNear(0.002);
  const points3 = drawTrip();
  for (const obj of [ship, shipLine, shipTarget]) obj.visible = true;
  tripHud.hidden = false; // the planner closes while the ship flies, a small box at the bottom shows the trip
  togglePlanner(false);
  planStop.textContent = stopLabel();
  // The trip is a short film: the start is in view (intro), the ship turns towards the target (turn), jumps into
  // hyperspace (jump), flies (cruise) and comes out at the target (exit), where the target gets its view (done).
  // The cruise is made watchable: its time speed is set so that it takes about 20 seconds on the screen (never
  // slower than real time). Before it the clock runs in real time, so the planets stay where the course was worked out.
  trip.watchScale = Math.min(1e8, Math.max(1, (days * 86400) / 20));
  timeScale = 1;
  speedSlider.value = "0";
  updateSpeedText();
  showTripResult();
  planResult.textContent += `\n${t.setSpeed}`;
  trip.phase = "intro";
  trip.phaseStart = performance.now() / 1000;
  trip.warpTarget = 0;
  leaveCloseup();
  updateCloseupButton();
  showPlace(from);
  ring.visible = false; // the ring would mark the start planet
});

// The edge of a system on the map: the Solar System (Neptune is at 1.64) and the exoplanet systems (up to 1.6) are
// drawn about this big. On a short route the edges are at most a third of it, so they do not run into each other.
const SYSTEM_EDGE = 1.8;
// The outer orbit as drawn for an exoplanet system, worked out like in exoSystem (without building it). Proxima Cen is tiny (0.2),
// a system with a long period planet is up to 1.6.
function exoOuter(star) {
  const mass = star.st_mass ?? 1;
  const au = star.planets.filter((p) => p.pl_orbper || p.pl_orbsmax).map((p) => (p.pl_orbper ? Math.cbrt(mass * (p.pl_orbper / 365.25) ** 2) : p.pl_orbsmax));
  if (!au.length) return UNKNOWN_ORBIT;
  const auMin = Math.min(...au);
  return Math.max(0.15, ...au.map((a) => Math.min(MAX_ORBIT, 0.15 * Math.sqrt(a / auMin))));
}
// How far out the edge of a system is: a bit beyond its outer orbit, so the ship comes out of hyperspace just outside of the system.
function edgeOf(place) {
  if (place.kind === "planet" || place.star === SUN_POINT) return SYSTEM_EDGE; // the Solar System, Neptune is at 1.64
  return Math.min(SYSTEM_EDGE, Math.max(0.3, 1.5 * exoOuter(place.star)));
}
function edgePoints() {
  const a = tripMap(trip.o, new THREE.Vector3());
  const b = tripMap(trip.d, new THREE.Vector3());
  const room = 0.35 * a.distanceTo(b); // on a short route the two edges must not run into each other
  const edgeA = Math.min(edgeOf(trip.from), room);
  const edgeB = Math.min(edgeOf(trip.to), room);
  const p = new THREE.Vector3();
  trip.uStart = 0;
  trip.uEnd = 1;
  for (let k = 0; k <= 2000; k++) {
    if (tripMap(lerp3(trip.o, trip.d, k / 2000), p).distanceTo(a) >= edgeA) {
      trip.uStart = k / 2000;
      break;
    }
  }
  for (let k = 2000; k >= 0; k--) {
    if (tripMap(lerp3(trip.o, trip.d, k / 2000), p).distanceTo(b) >= edgeB) {
      trip.uEnd = k / 2000;
      break;
    }
  }
}

// Where the ship is before it flies out of the start system: a planet leaves from its own place, a star or the Sun from its centre.
const homeTmp = new THREE.Vector3();
function homePosition(out) {
  if (trip.mode === "star" && trip.from.kind !== "star" && current?.follow) return current.follow.getWorldPosition(out);
  return tripMap(trip.o, out);
}

// The ship stops three quarters of a diameter (1.5 radii from the centre) in front of the target and does not fly through it. The diameter is the one drawn
// on the map (a planet of the Solar System, the Sun, or a host star, which is drawn with the same size for all stars).
// The result is the share of the way where the ship stops. The times and distances shown are to the target itself.
// The drawn radius of a place of the trip: the planet as drawn, the Sun, or a host star.
function placeRadius(place) {
  if (place.kind === "exo") {
    const body = activeExo?.bodies.find((b) => b.name === place.planet.pl_name);
    if (body) return body.mesh.geometry.parameters.radius;
  }
  if (place.kind === "planet") return solar.bodies.find((b) => b.name === place.name).mesh.geometry.parameters.radius;
  return place.star === SUN_POINT ? SUN_RADIUS : EXO_STAR_RADIUS;
}
function stopFraction() {
  const radius = placeRadius(trip.to);
  const target = tripMap(trip.d, new THREE.Vector3());
  const p = new THREE.Vector3();
  for (let k = 2000; k >= 1; k--) {
    if (tripMap(lerp3(trip.o, trip.d, k / 2000), p).distanceTo(target) >= radius * 1.5) return k / 2000;
  }
  return 0.5;
}

// Positions of the trip are AU (ecliptic) for a trip between planets and light years (data axes) for the rest.
const tripMap = (p, out) => (trip.mode === "solar" ? mapEcliptic(p, out) : toMapPosition(p, out));
const lerp3 = (o, d, u) => ({ x: o.x + (d.x - o.x) * u, y: o.y + (d.y - o.y) * u, z: o.z + (d.z - o.z) * u });
// The straight line of the trip through the squeezed map (so it is curved) all the way to the ring at the target. The ship
// stops a little before it (see stopFraction), the line shows the whole route.
function drawTrip() {
  const line = Array.from({ length: 161 }, (_, k) => tripMap(lerp3(trip.o, trip.d, k / 160), new THREE.Vector3()));
  shipLine.geometry.dispose();
  shipLine.geometry = new THREE.BufferGeometry().setFromPoints(line);
  tripMap(trip.d, shipTarget.position);
  return line;
}

// First person: the camera sits at the ship and looks along the flight direction (the direction of the curved
// line on the map). The mouse looks around from there (the orbit target is a little ahead of the camera, so the
// camera turns almost in place), zoom is off. Third person is the camera that follows the ship from outside.
let egoOn = false;
const egoLast = new THREE.Vector3();
const egoAhead = new THREE.Vector3();
const egoOffset = new THREE.Vector3(); // the offset of the camera from the ship at the start, see startOffset
const egoOffsetNow = new THREE.Vector3(); // the part of it that is still in effect
function enterEgo(u) {
  egoOn = true;
  flight = null;
  tripMap(trip.d, egoAhead).sub(ship.position); // looks at the blue ring of the target
  egoAhead.normalize();
  const offset = u < 0.02 ? startOffset(egoAhead, offsetTmp) : offsetTmp.set(0, 0, 0); // only a start in first person gets the offset
  egoOffset.copy(offset);
  egoOffsetNow.copy(offset);
  egoAhead.multiplyScalar(controls.minDistance * 1.5);
  egoLast.copy(ship.position);
  camera.position.copy(ship.position).add(offset);
  controls.target.copy(camera.position).add(egoAhead);
  controls.enableZoom = false;
  ship.visible = false; // the camera sits inside its glow
}
function leaveEgo() {
  if (!egoOn) return;
  egoOn = false;
  controls.enableZoom = true;
  if (trip) ship.visible = true;
}
// Where the camera goes while the ship turns: in the ship (first person) or behind it (third person), looking along the route.
const turnFrom = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
const poseTmp = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
const aheadTmp = new THREE.Vector3();
const offsetTmp = new THREE.Vector3();
const rightTmp = new THREE.Vector3();
const upTmp = new THREE.Vector3();
// First person starts with the start object at the lower right of the picture: the camera sits 1.3 radii of
// the object away, a bit to the left, above and behind it, and looks along the route. When the ship speeds up
// the object falls behind. "forward" is the unit vector along the route.
function startOffset(forward, out) {
  // Never closer than 0.03 map units to the surface: the camera has a near plane at 0.01, and a planet closer than that is
  // cut away (the camera seemed to sit inside the Earth). 1.106 is the length of the offset vector in units of A.
  const R = placeRadius(trip.from);
  const A = Math.max(1.3 * R, (R + 0.03) / 1.106);
  rightTmp.crossVectors(forward, camera.up);
  if (rightTmp.lengthSq() < 1e-6) rightTmp.set(1, 0, 0);
  rightTmp.normalize();
  upTmp.crossVectors(rightTmp, forward);
  return out.copy(forward).multiplyScalar(-A).addScaledVector(rightTmp, -0.4 * A).addScaledVector(upTmp, 0.25 * A);
}
function tripPose(pose) {
  tripMap(trip.d, aheadTmp).sub(ship.position).normalize(); // first person looks at the blue ring of the target
  if (planView.value === "ego") {
    pose.pos.copy(ship.position).add(startOffset(aheadTmp, offsetTmp));
    pose.target.copy(pose.pos).addScaledVector(aheadTmp, controls.minDistance * 1.5);
  } else {
    pose.pos.copy(ship.position).addScaledVector(aheadTmp, -0.35);
    pose.target.copy(ship.position);
  }
}

function stepView(now) {
  if (!trip || trip.phase === "intro" || trip.phase === "done") return;
  if (trip.phase === "turn") {
    tripPose(poseTmp);
    const u = Math.min(1, (now - trip.phaseStart) / TRIP_TURN);
    const e = u * u * (3 - 2 * u);
    camera.position.lerpVectors(turnFrom.pos, poseTmp.pos, e);
    controls.target.lerpVectors(turnFrom.target, poseTmp.target, e);
    return;
  }
  if (planView.value === "ego") {
    if (!egoOn) enterEgo(trip.phase === "cruise" ? Math.min(1, Math.max(0, (JD_AT_LOAD + solar.time * 365.25 - trip.jd0) / trip.days)) : 0);
    // Camera and target move with the ship, so the mouse look stays as the user left it.
    const delta = shipTmp.copy(ship.position).sub(egoLast);
    // The offset of the start melts away during the first tenth of the route: the camera slides into the path of the ship
    // (the normal first person view) and stays there.
    const melt = Math.min(1, (trip.share ?? 0) / 0.1);
    const keep = 1 - melt * melt * (3 - 2 * melt);
    offsetTmp.copy(egoOffset).multiplyScalar(keep);
    delta.add(offsetTmp).sub(egoOffsetNow);
    egoOffsetNow.copy(offsetTmp);
    camera.position.add(delta);
    // First person always looks at the blue ring of the target. The route is curved on the squeezed map, so the direction along the
    // route is not the direction of the target; the streaks of the hyperspace run out of the ring then (see stepWarp).
    tripMap(trip.d, aheadTmp).sub(camera.position).normalize();
    controls.target.copy(camera.position).addScaledVector(aheadTmp, controls.minDistance * 1.5);
    egoLast.copy(ship.position);
    return;
  }
  if (egoOn) {
    leaveEgo();
    startFlight(() => ship.position.clone(), 0.4); // back out to the view from outside
  }
  if (trip.follow && !flight) {
    // The camera stays with the ship, the same way the close-up stays with a planet.
    const delta = shipTmp.copy(ship.position).sub(controls.target);
    camera.position.add(delta);
    controls.target.add(delta);
  }
}

// Soft start and stop ("fade in and out" of the speed): the first and last tenth of the time the ship speeds up and
// slows down evenly, in between it flies at a constant speed. The area under the speed curve stays 1, so the
// total travel time is the one shown; the constant speed is 1 / 0.9 = 1.11 times the chosen one.
const RAMP = 0.1;
const RAMP_TOP = 1 / (1 - RAMP);
function rampDistance(t) {
  if (t < RAMP) return (RAMP_TOP * t * t) / (2 * RAMP);
  if (t > 1 - RAMP) return 1 - (RAMP_TOP * (1 - t) ** 2) / (2 * RAMP);
  return RAMP_TOP * (RAMP / 2 + (t - RAMP));
}
const rampSpeed = (t) => Math.min(1, t / RAMP, (1 - t) / RAMP); // 0 to 1, the share of the top speed

// A place in view: a planet gets its close-up (as if clicked), a star or the Sun is shown as its system. Used for
// the start and for the arrival of the trip.
function showArrival() {
  trip.follow = false;
  showPlace(trip.to);
}
function showPlace(to) {
  if (to.kind === "planet") {
    const body = solar.bodies.find((b) => b.name === to.name);
    if (body) selectBody(solar, body);
  } else if (to.kind === "exo") {
    showSystem(to.star, to.planet);
    enterCloseup(); // on to the planet itself
  } else if (to.star === SUN_POINT) {
    showSystem(EARTH.star, EARTH.planet);
  } else if (to.star.planets.length) {
    showSystem(to.star, to.star.planets[0]);
  }
}

// The camera cuts away everything closer than its near plane (0.01). A trip ends 1.5 radii from a planet that is 0.0135 wide
// on the map, so the planet would be cut and the ship seemed to be inside it. During a trip the near plane is smaller.
function setNear(value) {
  camera.near = value;
  camera.updateProjectionMatrix();
}

const TRIP_INTRO = 2.5; // seconds of the film, real time
const TRIP_TURN = 2.5;
const TRIP_JUMP = 1.2;
const TRIP_EXIT = 1.8;
const TRIP_DEPART = 3; // the ship flies out of the start system (only trips to and between stars)
function setPhase(name, now) {
  trip.phase = name;
  trip.phaseStart = now;
  trip.warpTarget = name === "jump" || name === "cruise" ? 1 : 0; // hyperspace: the stars are streaks all the time
  if (name === "turn") {
    leaveCloseup(); // the close-up would pull the camera back to the start planet
    updateCloseupButton();
    setQuiet(true);
    flight = null;
    turnFrom.pos.copy(camera.position);
    turnFrom.target.copy(controls.target);
  }
  if (name === "cruise") {
    trip.jd0 = JD_AT_LOAD + solar.time * 365.25;
    timeScale = trip.watchScale;
    speedSlider.value = String((Math.log10(timeScale) / 8) * 100);
    updateSpeedText();
  }
}

let tripShownAt = 0;
const shipTmp = new THREE.Vector3();
function stepTrip(now) {
  if (!trip) return;
  const elapsed = now - trip.phaseStart;
  if (trip.phase === "intro" && elapsed >= TRIP_INTRO) setPhase("turn", now);
  else if (trip.phase === "turn" && elapsed >= TRIP_TURN) setPhase(trip.mode === "star" ? "depart" : "jump", now);
  else if (trip.phase === "depart" && elapsed >= TRIP_DEPART) setPhase("jump", now);
  else if (trip.phase === "jump" && elapsed >= TRIP_JUMP) setPhase("cruise", now);
  else if (trip.phase === "exit" && elapsed >= TRIP_EXIT) {
    setPhase("done", now);
    setNear(0.01);
    planStop.textContent = stopLabel(); // "Stop" becomes "Close"
    leaveEgo();
    setQuiet(false);
    showTripResult();
    planResult.textContent += `\n${TRAVEL_UI[lang].arrived}`;
    showArrival(); // out of hyperspace at the target system: now on to the planet if one was chosen
  }
  const jd = JD_AT_LOAD + solar.time * 365.25;
  const t = trip.phase === "cruise" ? Math.min(1, Math.max(0, (jd - trip.jd0) / trip.days)) : trip.phase === "exit" || trip.phase === "done" ? 1 : 0; // the share of the time that has passed
  trip.speedFactor = rampSpeed(t);
  trip.share = rampDistance(t); // the share of the hyperspace part, the ship starts and stops softly
  const u = trip.uStart + (trip.uEnd - trip.uStart) * trip.share; // the share of the whole line
  if (trip.phase === "intro" || trip.phase === "turn") homePosition(ship.position);
  else if (trip.phase === "depart") {
    // out of the start system, to its edge (point 2)
    const e = Math.min(1, (now - trip.phaseStart) / TRIP_DEPART);
    ship.position.lerpVectors(homePosition(homeTmp), trip.p2, e * e * (3 - 2 * e));
  } else if (trip.phase === "jump") ship.position.copy(trip.p2);
  else tripMap(lerp3(trip.o, trip.d, u), ship.position);
  // The glow keeps a fixed size on the screen, whatever the zoom: the ship is tiny against the map.
  const size = camera.position.distanceTo(ship.position) * 0.02;
  shipGlow.children.forEach((layer, i) => (layer.material.uniforms.uSize.value = size * (i === 0 ? 1 : 2.4)));
  ship.visible = trip.phase !== "intro" && !egoOn;
  if (t >= 1 && trip.phase === "cruise") {
    trip.arrived = true; // the flight itself is over, the film goes on with the exit
    restoreTimeSpeed();
    setPhase("exit", now);
  }
  if (trip.phase === "done" || now - tripShownAt < 0.3) return;
  tripShownAt = now;
  const seconds = t * trip.days * 86400;
  const board = trip.beta < 1 ? duration(boardSeconds(seconds, trip.beta), lang) : "-";
  showTripResult();
  planResult.textContent +=
    trip.phase === "cruise"
      ? `\n${TRAVEL_UI[lang].live({ percent: fmt(trip.share * 100, 0), time: duration(seconds, lang), board })}`
      : `\n${TRAVEL_UI[lang].phase[trip.phase]}`;
}

// The streaks of the stars grow with the speed: the ship of the planner, or the free flight with a step in c.
let warp = 0;
let flyWarpTarget = 0;
function stepWarp(dt) {
  let target = flyWarpTarget;
  // The hyperspace streaks are only seen from inside the ship (first person); from outside there is no motion blur.
  if (trip && planView.value === "ego") target = Math.max(target, trip.warpTarget ?? 0);
  warp += (target - warp) * Math.min(1, dt * 3);
  warpPass.enabled = warp > 0.01;
  warpPass.uniforms.uStrength.value = warp;
  if (warpPass.enabled) {
    // The streaks run out of the point we fly towards. The panels shift the picture (layoutView), so that point is not the middle of
    // the screen: it is where a point far ahead along the view direction lands on the screen.
    camera.updateMatrixWorld();
    camera.getWorldDirection(warpAhead).multiplyScalar(1000).add(camera.position).project(camera);
    warpPass.uniforms.uCenter.value.set(warpAhead.x * 0.5 + 0.5, warpAhead.y * 0.5 + 0.5);
  }
}
const warpAhead = new THREE.Vector3();

// How many map units a light year is at the camera. The map is squeezed, so this changes with the place: in
// the Solar System part (closer than 9 units to the Sun) it is derived from the AU squeeze (r drawn as
// 0.3 * sqrt(r)), further out from the star squeeze (a distance drawn as its square root, or divided by 10).
function mapPerLightYear() {
  const r = camera.position.length();
  if (r < 9) {
    const au = Math.max((r / 0.3) ** 2, 0.05);
    return 0.15 / Math.sqrt(au) / LY_PER_AU;
  }
  return compressed ? 1 / (2 * r) : 0.1;
}

// ---------------------------------------------------------------------------------------------------------
// Pick the start or the target of a trip on the map: the button next to a field closes the planner and waits for one click, on a
// planet of a system that is shown or on the nearest star (the Sun counts). The name goes into the field and the planner opens again.
let picking = null; // "from", "to" or null
const pickHint = document.getElementById("pick-hint");
function startPicking(which) {
  picking = which;
  measuring = false;
  measureButton.setAttribute("aria-pressed", "false");
  togglePlanner(false);
  pickHint.hidden = false;
}
function stopPicking() {
  picking = null;
  pickHint.hidden = true;
  togglePlanner(true);
}
document.getElementById("plan-swap").addEventListener("click", () => {
  [planFrom.value, planTo.value] = [planTo.value, planFrom.value];
});
document.getElementById("plan-from-pick").addEventListener("click", () => startPicking("from"));
document.getElementById("plan-to-pick").addEventListener("click", () => startPicking("to"));
document.getElementById("pick-cancel").addEventListener("click", stopPicking);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && picking) stopPicking();
});
function pickForPlanner(x, y) {
  let name = null;
  // A planet first (the invisible spheres around them are easy to hit)...
  const systems = [solar, activeExo].filter((s) => s?.group.visible);
  raycaster.setFromCamera(new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1), camera);
  const hit = raycaster.intersectObjects(systems.flatMap((s) => s.bodies.map((b) => b.hit)), false)[0]?.object;
  for (const system of systems) {
    const body = system.bodies.find((b) => b.hit === hit);
    if (body && !body.visitor) name = system === solar ? planetLabel(body.name) : body.name;
  }
  // ...then the nearest star within 16 pixels.
  if (!name) {
    const position = points.geometry.getAttribute("position");
    let bestDistance = 16;
    const test = (label, p) => {
      pickTmp.copy(p).project(camera);
      if (pickTmp.z < -1 || pickTmp.z > 1) return;
      const d = Math.hypot(((pickTmp.x + 1) / 2) * innerWidth - x, ((1 - pickTmp.y) / 2) * innerHeight - y);
      if (d < bestDistance) {
        bestDistance = d;
        name = label;
      }
    };
    test(sunLabel(), new THREE.Vector3());
    stars.forEach((star, i) => test(star.hostname, new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i))));
  }
  if (!name) return; // nothing there, the hint stays and the next click counts
  (picking === "from" ? planFrom : planTo).value = name;
  stopPicking();
}

// Measuring the distance between two stars: click "Measure distance", then two stars (or the Sun). The
// distance is the straight line in real space from the table positions. On the squeezed map that line is
// curved, so it is drawn through toMapPosition. This is the base for stage 2 of the planner (star to star).
let measuring = false;
let measureA = null;
let measureB = null;
const measureButton = document.getElementById("measure");
const measureNote = document.getElementById("measure-note");
const SUN_POINT = { hostname: "Sun", x: 0, y: 0, z: 0 };
const MEASURE_COLOR = 0xffd166;
const measureLine = new THREE.Line(
  new THREE.BufferGeometry(),
  new THREE.LineBasicMaterial({ color: MEASURE_COLOR, transparent: true, opacity: 0.9, depthTest: false })
);
const measureMarks = [0, 1].map(() => {
  const m = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: ringTexture(), sizeAttenuation: false, depthTest: false, transparent: true, color: MEASURE_COLOR })
  );
  m.scale.set(0.04, 0.04, 1);
  return m;
});
for (const o of [measureLine, ...measureMarks]) {
  o.visible = false;
  o.frustumCulled = false;
  o.renderOrder = 10;
  scene.add(o);
}

measureButton.addEventListener("click", () => {
  measuring = !measuring;
  measureButton.setAttribute("aria-pressed", String(measuring));
  if (!measuring) {
    measureA = measureB = null;
    for (const o of [measureLine, ...measureMarks]) o.visible = false;
  }
  buildPlanner();
});

function showMeasure() {
  const t = TRAVEL_UI[lang];
  measureNote.hidden = !measuring;
  measurePlanButton.hidden = !(measuring && measureB);
  if (!measuring) return;
  if (!measureA) measureNote.textContent = t.measureHint;
  else if (!measureB) measureNote.textContent = t.measureSecond(measureA.hostname);
  else {
    const ly = Math.hypot(measureB.x - measureA.x, measureB.y - measureA.y, measureB.z - measureA.z);
    measureNote.textContent = t.measureResult({ a: measureA.hostname, b: measureB.hostname, ly: fmt(ly, 1), pc: fmt(ly / 3.2616, 1) });
  }
}

function drawMeasure() {
  const marks = [measureA, measureB];
  marks.forEach((star, i) => {
    measureMarks[i].visible = !!star;
    if (star) toMapPosition(star, measureMarks[i].position);
  });
  measureLine.visible = !!(measureA && measureB);
  if (!measureLine.visible) return;
  const line = Array.from({ length: 97 }, (_, k) => {
    const u = k / 96;
    return toMapPosition(
      { x: measureA.x + (measureB.x - measureA.x) * u, y: measureA.y + (measureB.y - measureA.y) * u, z: measureA.z + (measureB.z - measureA.z) * u },
      new THREE.Vector3()
    );
  });
  measureLine.geometry.dispose();
  measureLine.geometry = new THREE.BufferGeometry().setFromPoints(line);
}

// The star nearest to the click on the screen, within 16 pixels. The Sun is part of the choice.
const pickTmp = new THREE.Vector3();
function pickMeasure(x, y) {
  const position = points.geometry.getAttribute("position");
  let best = null;
  let bestDistance = 16;
  const test = (star, p) => {
    pickTmp.copy(p).project(camera);
    if (pickTmp.z < -1 || pickTmp.z > 1) return; // behind the camera
    const d = Math.hypot(((pickTmp.x + 1) / 2) * innerWidth - x, ((1 - pickTmp.y) / 2) * innerHeight - y);
    if (d < bestDistance) {
      bestDistance = d;
      best = star;
    }
  };
  test(SUN_POINT, new THREE.Vector3());
  stars.forEach((star, i) => test(star, new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i))));
  if (!best) return;
  if (measureB || !measureA) {
    measureA = best;
    measureB = null;
  } else if (best !== measureA) {
    measureB = best;
  }
  drawMeasure();
  showMeasure();
}

const res = await fetch("data/stars.json");
const data = await res.json();
stars = data.stars;
rule = data.rule;
// The Sun is not in the NASA table, its radius and temperature are the textbook values.
const sunZone = zoneAu({ st_rad: 1, st_teff: 5772 });
addZone(solar, 0.3 * Math.sqrt(sunZone.inner), 0.3 * Math.sqrt(sunZone.outer));
buildPoints();
applyLanguage();
animate();
// The start screen goes away once the first frame is on its way.
requestAnimationFrame(() => document.getElementById("loading")?.classList.add("done"));
// The two star layers are on by default (they load in the background); the deep layer is not offered on touch devices.
gaiaButton.click();
if (!IS_MOBILE) deepButton.click();
