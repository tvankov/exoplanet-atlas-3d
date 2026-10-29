import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const DEFAULT_RADIUS = 1; // solar radii, display only, used where st_rad is missing

const canvas = document.getElementById("map");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100000);
camera.position.set(0, 0, 60);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 0.5; // close stars are only a few units apart, the default would stop us too early

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
const material = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  vertexShader: `
    attribute float size;
    attribute vec3 color;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = max(2.0, size * 120.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    varying vec3 vColor;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      gl_FragColor = vec4(vColor, smoothstep(0.5, 0.1, d));
    }`,
});

let stars = [];
let points;

function buildPoints() {
  const positions = new Float32Array(stars.length * 3);
  const colors = new Float32Array(stars.length * 3);
  const sizes = new Float32Array(stars.length);
  const tmp = new THREE.Vector3();
  const color = new THREE.Color();

  stars.forEach((s, i) => {
    toMapPosition(s, tmp).toArray(positions, i * 3);
    color.set(s.color).toArray(colors, i * 3);
    // Square root keeps giant stars from hiding their neighbours.
    sizes[i] = 0.5 + 0.5 * Math.sqrt(Math.min(s.st_rad ?? DEFAULT_RADIUS, 25));
  });

  points = new THREE.Points(new THREE.BufferGeometry(), material);
  points.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  points.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  points.geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
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

// The Sun is the origin of the map and gets its own marker.
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(0.08, 24, 24),
  new THREE.MeshBasicMaterial({ color: 0xffd166 })
);
scene.add(sun);

// Our own solar system. The map is in light years, where all of it (Neptune is 0.0005 ly out)
// would be a single point, so this is a separate display that is only drawn up close.
// Orbit radii use the same square root idea as the star map so Neptune stays inside the
// distance to the nearest star. Sizes are exaggerated too. Both are for orientation, not to scale.
// Values: mean orbit radius (AU), orbital period (years), radius (Earth radii).
const PLANETS = [
  { name: "Mercury", au: 0.387, years: 0.241, radius: 0.383, color: 0xb5a8a0 },
  { name: "Venus", au: 0.723, years: 0.615, radius: 0.949, color: 0xe8c98a },
  { name: "Earth", au: 1.0, years: 1.0, radius: 1.0, color: 0x4da3ff },
  { name: "Mars", au: 1.524, years: 1.881, radius: 0.532, color: 0xd1603d },
  { name: "Jupiter", au: 5.203, years: 11.86, radius: 10.97, color: 0xd9b38c },
  { name: "Saturn", au: 9.537, years: 29.46, radius: 9.14, color: 0xe6d3a3 },
  { name: "Uranus", au: 19.19, years: 84.01, radius: 3.98, color: 0x9fe3e8 },
  { name: "Neptune", au: 30.07, years: 164.8, radius: 3.86, color: 0x4b70dd },
];
function labelSprite(text) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 32;
  const g = c.getContext("2d");
  g.fillStyle = "#dfe6f3";
  g.font = "20px system-ui, sans-serif";
  g.textAlign = "center";
  g.fillText(text, 64, 22);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), sizeAttenuation: false, depthTest: false, transparent: true })
  );
  sprite.scale.set(0.16, 0.04, 1);
  sprite.center.set(0.5, -0.3); // the text sits above the planet
  return sprite;
}

// One builder for every system view: central star, orbit rings, planets with name labels.
// Orbit radii and sizes are already in map units, years are the real orbital periods.
// Start angles are spread out for looks, they are not the real positions of today.
function makeSystem({ starName, starColor, starRadius, planets, viewDistance, yearsPerSecond }) {
  const group = new THREE.Group();
  scene.add(group);
  group.add(labelSprite(starName));
  if (starRadius) {
    group.add(new THREE.Mesh(new THREE.SphereGeometry(starRadius, 24, 24), new THREE.MeshBasicMaterial({ color: starColor })));
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
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.size, 16, 16), new THREE.MeshBasicMaterial({ color: p.color }));
    mesh.add(labelSprite(p.name));
    group.add(mesh);
    return { ...p, mesh, start: i * 1.7 };
  });
  return { group, bodies, viewDistance, yearsPerSecond };
}

function stepSystem(system, seconds) {
  for (const b of system.bodies) {
    const a = b.start + (seconds * system.yearsPerSecond * Math.PI * 2) / b.years;
    b.mesh.position.set(Math.cos(a) * b.orbit, 0, Math.sin(a) * b.orbit);
  }
  // Up close it is useful, from far away it is clutter around the star.
  system.group.visible = camera.position.distanceTo(system.group.position) < 15;
}

const solar = makeSystem({
  starName: "Sun",
  starRadius: null, // the Sun already has its marker above, visible from far away too
  viewDistance: 2.5,
  yearsPerSecond: 0.1, // Earth needs 10 seconds for one orbit
  planets: PLANETS.map((p) => ({
    name: p.name,
    years: p.years,
    orbit: 0.3 * Math.sqrt(p.au),
    size: 0.02 * Math.sqrt(p.radius),
    color: p.color,
  })),
});
const earthMesh = solar.bodies.find((b) => b.name === "Earth").mesh;

// The NASA table has no orbit radius in our export, so it is derived from Kepler's third
// law: a^3 = M * P^2 (AU, solar masses, years). The innermost planet gets a fixed radius
// and the rest follow the same square root idea as above. Not to scale, for orientation.
const MAX_ORBIT = 1.6;
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
        size: 0.02 * Math.sqrt(p.pl_rade ?? 1),
        color: p.habitable ? 0x6fd3a0 : 0xb0b8c8,
      };
    });
  const auMin = Math.min(...planets.map((p) => p.au));
  for (const p of planets) p.orbit = Math.min(MAX_ORBIT, 0.15 * Math.sqrt(p.au / auMin));
  const outer = Math.max(0.15, ...planets.map((p) => p.orbit));

  return makeSystem({
    starName: star.hostname,
    starColor: star.color,
    starRadius: 0.05,
    planets,
    viewDistance: Math.max(0.6, 3 * outer),
    // The fastest planet takes 4 seconds per orbit, the others keep their real ratios.
    yearsPerSecond: planets.length ? Math.min(...planets.map((p) => p.years)) / 4 : 1,
  });
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
  flight = {
    start: performance.now(),
    fromPos: camera.position.clone(),
    toPos: target.clone().addScaledVector(VIEW_DIRECTION, system.viewDistance),
    fromTarget: controls.target.clone(),
    toTarget: target,
  };
  ring.visible = true;
}

function showSystem(star, planet) {
  let system;
  let follow;
  if (star.solarSystem) {
    system = solar;
    follow = earthMesh;
  } else {
    if (activeExo) disposeSystem(activeExo);
    activeExo = system = exoSystem(star);
    follow = system.bodies.find((b) => b.name === planet.pl_name)?.mesh;
  }
  current = { star, system, follow };
  flyTo(current);
}

// A manual drag takes over from a running flight.
controls.addEventListener("start", () => (flight = null));

function stepFlight() {
  if (!flight) return;
  const u = Math.min(1, (performance.now() - flight.start) / FLIGHT_MS);
  const e = u * u * (3 - 2 * u); // smoothstep, soft start and stop
  camera.position.lerpVectors(flight.fromPos, flight.toPos, e);
  controls.target.lerpVectors(flight.fromTarget, flight.toTarget, e);
  if (u === 1) flight = null;
}

function buildHabitableMenu() {
  const items = [];
  for (const star of stars) {
    for (const p of star.planets) if (p.habitable) items.push({ star, planet: p });
  }
  items.sort((a, b) => a.star.dist_ly - b.star.dist_ly);

  // Earth is not in the NASA exoplanet table, so it is added here as the reference point.
  // It sits at the origin, which is where the Sun is on the map.
  items.unshift({
    star: { x: 0, y: 0, z: 0, dist_ly: 0, solarSystem: true },
    planet: { pl_name: "Earth (reference)", pl_rade: 1, pl_eqt: 255 },
  });

  document.getElementById("habitable-title").textContent = `Habitable candidates (${items.length - 1} + Earth)`;
  const list = document.getElementById("habitable");
  for (const { star, planet } of items) {
    const button = document.createElement("button");
    button.type = "button";
    const name = document.createElement("span");
    name.textContent = planet.pl_name;
    const info = document.createElement("small");
    info.textContent = `${star.dist_ly.toFixed(1)} ly · ${planet.pl_rade} R⊕ · ${Math.round(planet.pl_eqt)} K`;
    button.append(name, info);
    button.addEventListener("click", () => {
      list.querySelector(".active")?.classList.remove("active");
      button.classList.add("active");
      showSystem(star, planet);
    });
    const li = document.createElement("li");
    li.append(button);
    list.append(li);
  }
}

document.getElementById("scale").addEventListener("click", (e) => {
  compressed = !compressed;
  e.target.textContent = `Scale: ${compressed ? "compressed" : "linear"}`;
  updatePositions();
  // Positions changed, so the selected star has to be found again.
  if (current) flyTo(current);
});

function animate() {
  requestAnimationFrame(animate);
  const seconds = performance.now() / 1000;
  stepSystem(solar, seconds);
  if (activeExo) stepSystem(activeExo, seconds);
  // Planets live inside a group that sits at the star, so the world position is needed.
  // A system without any usable planet falls back to the star itself.
  if (current) (current.follow ?? current.system.group).getWorldPosition(ring.position);
  stepFlight();
  controls.update();
  renderer.render(scene, camera);
}

const res = await fetch("data/stars.json");
const data = await res.json();
stars = data.stars;
document.getElementById("count").textContent =
  `${stars.length} host stars, ${stars.reduce((n, s) => n + s.planets.length, 0)} planets`;
buildPoints();
buildHabitableMenu();
animate();
