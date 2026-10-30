import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildStory, duration, planetType, PLANET_TYPES, slug, solarName, UI } from "./story.js";

const DEFAULT_RADIUS = 1; // solar radii, display only, used where st_rad is missing

const canvas = document.getElementById("map");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
// The near plane is small because the planet close-up puts the camera a few hundredths of a unit away.
const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 100000);
camera.position.set(0, 0, 60);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 0.02; // lets the close-up get near a planet that is only 0.015 units wide

// Distances run from 4 to 28000 ly. A square root squeezes the far field so the
// neighbourhood stays readable. The direction of every star is unchanged.
let compressed = true;
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
  vertexShader: `
    attribute float size;
    attribute float glow;
    attribute vec3 color;
    varying vec3 vColor;
    varying float vGlow;
    void main() {
      vColor = color;
      vGlow = glow;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      // A glowing star gets a larger sprite, because the halo needs room to fade out.
      // Every other star stays a small plain dot.
      gl_PointSize = glow > 0.5 ? max(8.0, size * 260.0 / -mv.z) : max(2.5, size * 100.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    varying vec3 vColor;
    varying float vGlow;
    void main() {
      float d = length(gl_PointCoord - 0.5) * 2.0; // 0 in the middle, 1 at the edge
      if (d > 1.0) discard;
      if (vGlow < 0.5) {
        // Plain star: a small dot with a soft edge and no halo, so it stays quiet in the background.
        gl_FragColor = vec4(vColor * smoothstep(1.0, 0.4, d), 1.0);
        return;
      }
      float halo = pow(1.0 - d, 1.8);              // soft glow in the star colour
      float core = smoothstep(0.3, 0.0, d);        // small white hot centre
      // Additive blending: the colour is added as it is, so the brightness is set here.
      gl_FragColor = vec4(vColor * halo * 1.3 + vec3(core * 0.8), 1.0);
    }`,
});

let stars = [];
let points;

function buildPoints() {
  const positions = new Float32Array(stars.length * 3);
  const colors = new Float32Array(stars.length * 3);
  const sizes = new Float32Array(stars.length);
  const glows = new Float32Array(stars.length);
  const tmp = new THREE.Vector3();
  const color = new THREE.Color();

  stars.forEach((s, i) => {
    toMapPosition(s, tmp).toArray(positions, i * 3);
    color.set(s.color).toArray(colors, i * 3);
    // Square root keeps giant stars from hiding their neighbours.
    sizes[i] = 0.5 + 0.5 * Math.sqrt(Math.min(s.st_rad ?? DEFAULT_RADIUS, 25));
    // Only the hosts of habitable candidates glow, so they stand out from thousands of other stars.
    glows[i] = s.planets.some((p) => p.habitable) ? 1 : 0;
  });

  points = new THREE.Points(new THREE.BufferGeometry(), material);
  points.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  points.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
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
}

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
scene.add(starGlow(SUN_COLOR, SUN_RADIUS * 7));

// Sizes inside a system view: the star has a fixed size, a planet has its real size
// relative to its star (the Sun is about 109 Earth radii wide). That would make most planets
// invisible, so no planet is drawn smaller than a few pixels at the default view distance.
const EARTH_RADII_PER_SUN = 109.1;
const MIN_PLANET_PER_VIEW_DISTANCE = 0.006;

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
    moon: { years: 27.32 / 365.25, size: 0.2727, orbit: 2.6, color: 0xb4b4b4, label: "Mond · Moon", texture: "textures/moon.jpg" },
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
function labelSprite(text, width = 128) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = 32;
  const g = c.getContext("2d");
  g.fillStyle = "#dfe6f3";
  g.font = "20px system-ui, sans-serif";
  g.textAlign = "center";
  g.fillText(text, width / 2, 22);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), sizeAttenuation: false, depthTest: false, transparent: true })
  );
  sprite.scale.set(0.16 * (width / 128), 0.04, 1);
  sprite.center.set(0.5, -0.3); // the text sits above the planet
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
    if (uArt > 0.5) {
      float rA = rnd(uSeed, 11.0);
      float rFreq = rnd(uSeed, 5.0);
      float jitter = rnd(uSeed, 12.0) - 0.5;

      if (uType == 0) {
        // Kinds of rocky world: 0 lava, 1 rust desert, 2 ocean, 3 ash, 4 sand desert, 5 ice, 6 olive.
        // How often each kind comes up is a choice of looks. The dark ash world is the rarest one,
        // seven in a row of them made the whole set look dull.
        int arch;
        if (uTemp >= 900.0) arch = 0;                                                  // molten
        else if (uTemp > 0.0 && uTemp < 230.0) arch = rA < 0.35 ? 5 : (rA < 0.5 ? 3 : (rA < 0.75 ? 1 : 4));  // cold: ice, ash, rust, sand
        else if (uTemp >= 450.0) arch = rA < 0.45 ? 4 : (rA < 0.8 ? 1 : 3);            // hot: sand, rust, ash
        else arch = rA < 0.25 ? 1 : (rA < 0.5 ? 2 : (rA < 0.6 ? 3 : (rA < 0.8 ? 4 : 6)));  // temperate: rust, ocean, ash, sand, olive

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
          // Ocean world: teal sea, a few muted land masses, thin pale clouds.
          vec3 sea = mix(vec3(0.12, 0.5, 0.5), vec3(0.22, 0.68, 0.58), mid);
          vec3 land = mix(vec3(0.45, 0.55, 0.38), vec3(0.72, 0.70, 0.58), fine);
          float isLand = smoothstep(0.52, 0.58, large);
          base = mix(sea, land, isLand);
          float cloud = smoothstep(0.64, 0.84, noise(vec3(n.x * 3.0, n.y * mix(8.0, 14.0, rFreq), n.z * 3.0) + seedOffset(uSeed * 2.0)));
          base = mix(base, vec3(0.78, 0.88, 0.88), cloud * 0.45);
          reliefAmount = 0.05 + 0.25 * isLand; // the sea stays smooth
        } else if (arch == 3) {
          // Ash world: dark charcoal with faint lighter wisps.
          base = mix(vec3(0.24, 0.26, 0.31), vec3(0.46, 0.49, 0.55), mid) * (0.85 + 0.3 * fine);
          float wisp = smoothstep(0.6, 0.85, noise(vec3(n.x * 2.5, n.y * 10.0, n.z * 2.5) + seedOffset(uSeed * 3.0)));
          base = mix(base, vec3(0.62, 0.66, 0.72), wisp * 0.35);
        } else if (arch == 4) {
          // Sand desert: tan with dune streaks and darker rock.
          float dunes = 0.5 + 0.5 * sin(n.y * 30.0 + 6.0 * fbm(q * 2.0) + n.x * 4.0);
          base = mix(vec3(0.76, 0.60, 0.36), vec3(0.45, 0.32, 0.22), smoothstep(0.5, 0.7, large));
          base *= (0.85 + 0.2 * dunes) * (0.9 + 0.2 * fine);
        } else if (arch == 5) {
          // Ice world: pale blue with dark blue cracks. Not white, a light blue.
          base = mix(vec3(0.50, 0.64, 0.80), vec3(0.74, 0.84, 0.93), mid);
          float crack = pow(1.0 - abs(2.0 * fbm(q * 6.0 + 23.0) - 1.0), 8.0);
          base = mix(base, vec3(0.22, 0.38, 0.60), crack * 0.7);
          reliefAmount = 0.15;
        } else {
          // Olive world: green brown ground with darker patches.
          base = mix(vec3(0.38, 0.48, 0.22), vec3(0.62, 0.56, 0.30), large) * (0.85 + 0.3 * mid);
          base = mix(base, vec3(0.22, 0.30, 0.16), smoothstep(0.58, 0.72, mid) * 0.5);
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
    float light = 0.18 + 0.82 * smoothstep(-0.05, 0.6, facing);
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
  varying vec3 vPos;
  ${NOISE_GLSL}
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
    gl_FragColor = vec4(colour, clamp(alpha, 0.0, 1.0));
    #include <colorspace_fragment>
  }`;

function saturnRings(planetRadius) {
  const flat = new THREE.Mesh(
    new THREE.RingGeometry(RING_INNER * planetRadius, RING_OUTER * planetRadius, 128, 1),
    new THREE.ShaderMaterial({
      uniforms: { uPlanetRadius: { value: planetRadius } },
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
  mesh.add(labelSprite(moon.label));
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
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vNormalView;
  varying vec3 vView;
  ${NOISE_GLSL}

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
    float light = 0.12 + 0.88 * smoothstep(-0.05, 0.6, facing);
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
    float light = 0.1 + 0.9 * smoothstep(-0.05, 0.6, facing);
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
scene.add(new THREE.AmbientLight(0xffffff, 0.35)); // keeps the night side from turning fully black

// One builder for every system view: central star, orbit rings, planets with name labels.
// Orbit radii and sizes are already in map units, years are the real orbital periods.
// Start angles are spread out for looks, they are not the real positions of today.
function makeSystem({ starName, starColor, starRadius, planets, viewDistance }) {
  const group = new THREE.Group();
  scene.add(group);
  group.add(labelSprite(starName));
  let starMesh = null;
  if (starRadius) {
    starMesh = starBody(starColor, starName, starRadius);
    group.add(starMesh);
    group.add(starGlow(starColor, starRadius * 7));
  }

  const bodies = planets.map((p, i) => {
    const points = Array.from({ length: 129 }, (_, k) => {
      const a = (k / 128) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * p.orbit, 0, Math.sin(a) * p.orbit);
    });
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 })
      )
    );
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
      mesh.add(thin ? thinRings(radius, thin) : saturnRings(radius));
      mesh.userData.closeupRadii = thin ? 5 : 7; // the rings reach 2.3 radii out, the default distance would cut them off
    }
    const moon = p.moon ? addMoon(mesh, radius, p.moon) : null;
    if (moon) mesh.userData.closeupRadii = 5; // far enough back that the Moon's orbit fits into the picture
    const clouds = p.earth ? addClouds(mesh, radius) : null;
    if (p.earth) addAtmosphere(mesh, radius);
    group.add(mesh);
    return { ...p, mesh, hit, moon, clouds, start: i * 1.7 };
  });
  return { group, bodies, viewDistance, time: 0, starMesh };
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
  for (const b of system.bodies) {
    const a = b.start + (system.time * Math.PI * 2) / b.years;
    b.mesh.position.set(Math.cos(a) * b.orbit, 0, Math.sin(a) * b.orbit);
    // The star sits in the middle of the group, so the light comes from the opposite of the position.
    b.mesh.material.uniforms?.uLightDir.value.copy(b.mesh.position).negate().normalize();    if (b.rotHours) {
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
  system.group.visible = camera.position.distanceTo(system.group.position) < 4;
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
    rotHours: ROTATION_HOURS[p.name],
    noteKey: p.noteKey,
    look: p.look,
    earth: p.earth,
    rings: p.rings,
    moon: p.moon,
  })),
});
solar.group.add(new THREE.PointLight(0xffffff, 3, 0, 0)); // the Sun, no falloff so all textured planets are lit
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
const beltLabel = labelSprite("Asteroidengürtel · Asteroid belt", 288);
beltLabel.position.set(0.3 * Math.sqrt(2.7) * Math.cos(2.5), 0, 0.3 * Math.sqrt(2.7) * Math.sin(2.5));
solar.group.add(beltLabel);

// The NASA table has no orbit radius in our export, so it is derived from Kepler's third
// law: a^3 = M * P^2 (AU, solar masses, years). The innermost planet gets a fixed radius
// and the rest follow the same square root idea as above. Not to scale, for orientation.
const MAX_ORBIT = 1.6;
const EXO_STAR_RADIUS = 0.05; // every host star is drawn this size, planets are sized against it
function exoSystem(star) {
  const mass = star.st_mass ?? 1; // sun-like fallback, only changes the drawn orbit radii
  const planets = star.planets
    .filter((p) => p.pl_orbper) // without a period the planet cannot be placed on an orbit
    .map((p) => {
      const years = p.pl_orbper / 365.25;
      return {
        name: p.pl_name,
        years,
        au: Math.cbrt(mass * years * years),
        // Without a star radius there is no ratio to draw, the minimum size applies.
        size: star.st_rad && p.pl_rade ? (EXO_STAR_RADIUS * p.pl_rade) / (star.st_rad * EARTH_RADII_PER_SUN) : 0,
        type: planetType(p.pl_rade),
        temp: p.pl_eqt,
        color: p.habitable ? 0x6fd3a0 : 0xb0b8c8,
      };
    });
  const auMin = Math.min(...planets.map((p) => p.au));
  for (const p of planets) p.orbit = Math.min(MAX_ORBIT, 0.15 * Math.sqrt(p.au / auMin));
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
  if (zone && planets.length) {
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
  const band = new THREE.Mesh(
    new THREE.RingGeometry(inner, outer, 128),
    new THREE.MeshBasicMaterial({ color: 0x4caf7a, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
  );
  band.rotation.x = -Math.PI / 2; // a ring is born standing up, the orbits lie flat
  system.group.add(band);
  system.zone = true;
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
  if (current?.system.zoneMesh) current.system.zoneMesh.visible = true;
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
    follow = system.bodies.find((b) => b.name === planet.pl_name)?.mesh;
  }
  current = { star, system, follow, planet };
  // The first view is always the whole system, the close-up is one button away.
  flyTo(current);
  showStory(star, planet);
}

// Story panel. The text always stays visible, the audio is an extra.
const storyPanel = document.getElementById("story");
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
  hasClip = !!(planet.habitable || star.solarSystem);
  const story = buildStory(star, planet, lang);
  storyParagraphs = story.paragraphs;
  listenButton.hidden = storyParagraphs.length === 0; // the other Solar System planets have no text yet
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
    typeLine.textContent = `${t.typeLine(t.types[planetType(planet.pl_rade)])} ${look === "artistic" ? t.artistic : t.schematic}`;
  }
  document.getElementById("story-text").replaceChildren(
    ...storyParagraphs.map((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      return p;
    })
  );
  storyPanel.hidden = false;
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
  if (moved < 5) pickPlanet(e.clientX, e.clientY);
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
      planet = { pl_name: body.name, solarOther: true, noteKey: body.noteKey };
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
    info.textContent = `${star.dist_ly.toFixed(1)} ly · ${planet.pl_rade} R⊕ · ${Math.round(planet.pl_eqt)} K`;
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
  controls.update();
  renderer.render(scene, camera);
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
