// The pictures of the cards in the dock, drawn in the page from the same sources as the 3D view and the pictures to share (sharecard.js): the
// planet of the discovery of the day, the nearest candidate in front of its star with the green habitable zone, the constellation in which
// the Sun stands today (the stars of the map), an eclipse with the real Moon, a trip from the Earth to Mars, and the level as a ring. The
// drawings in index.html stand in until these are ready (they come after the first flight, when the maps of the planets are loaded anyway).

import { drawPlanet, drawStar, exoLook, starColor } from "./sharecard.js";
import { projectFigure } from "./birthsky.js";

const W = 224; // canvas pixels: twice the size on the screen (112 x 70), so that it is sharp on a phone
const H = 140;

function canvasFor(id) {
  const card = document.getElementById(id);
  if (!card) return null;
  let c = card.querySelector("canvas.dock-art");
  if (!c) {
    c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    c.className = `dock-art ${card.querySelector(".dock-art")?.classList[1] ?? ""}`.trim();
    c.setAttribute("aria-hidden", "true");
    card.querySelector("svg.dock-art")?.replaceWith(c);
  }
  return c;
}
// Each picture is drawn on a canvas of its own and only then put in place, so that a picture never shows half drawn.
async function paint(id, draw) {
  const target = canvasFor(id);
  if (!target) return;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const art = c.getContext("2d");
  try {
    await draw(art);
  } catch {
    return; // a map that did not load: the old picture stays
  }
  // soft edges: the glows fade out before the border of the picture instead of being cut
  art.globalCompositeOperation = "destination-in";
  for (const [x0, y0, x1, y1] of [[0, 0, W, 0], [0, 0, 0, H]]) {
    const fade = art.createLinearGradient(x0, y0, x1, y1);
    const edge = 16 / (x1 || y1);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(edge, "rgba(0,0,0,1)");
    fade.addColorStop(1 - edge, "rgba(0,0,0,1)");
    fade.addColorStop(1, "rgba(0,0,0,0)");
    art.fillStyle = fade;
    art.fillRect(0, 0, W, H);
  }
  const g = target.getContext("2d");
  g.clearRect(0, 0, W, H);
  g.drawImage(c, 0, 0);
}
const glow = (g, x, y, r, rgb, a = 0.35) => {
  const halo = g.createRadialGradient(x, y, r * 0.6, x, y, r * 1.45);
  halo.addColorStop(0, `rgba(${rgb},${a})`);
  halo.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = halo;
  g.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
};

// A copy of the picture of a dock card (for the quick actions of My Universe), or of its stand-in drawing while the picture is not drawn yet.
export function dockPicture(id) {
  const src = document.querySelector(`#${id} .dock-art`);
  if (!src) return null;
  if (src.tagName.toLowerCase() === "svg") {
    const copy = src.cloneNode(true);
    copy.setAttribute("class", "uni-thumb");
    return copy;
  }
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  c.className = "uni-thumb";
  c.setAttribute("aria-hidden", "true");
  c.getContext("2d").drawImage(src, 0, 0);
  return c;
}

// daily: { solar (a planet of the Solar System) or temp (an exoplanet) }; near: { temp, teff }; figure: the lines of today's constellation
// ([[ra, dec, mag], ...]) or null; level: { level, share } (explorer.progress()).
export function drawDock({ daily, near, figure, level }) {
  if (daily)
    paint("dock-daily", async (g) => {
      glow(g, 150, 70, 44, "150,190,255", 0.25);
      await drawPlanet(g, daily.solar ?? exoLook(daily.temp), 150, 70, daily.solar === "Saturn" ? 34 : 46);
    });
  if (near)
    paint("dock-near", async (g) => {
      const rgb = starColor(near.teff ?? 3000);
      drawStar(g, 70, 64, 64, rgb);
      // the habitable zone: a green band round the star, the planet on it
      g.strokeStyle = "rgba(124,255,178,0.28)";
      g.lineWidth = 14;
      g.beginPath();
      g.ellipse(70, 64, 104, 34, -0.25, 0, Math.PI * 2);
      g.stroke();
      g.strokeStyle = "rgba(124,255,178,0.6)";
      g.lineWidth = 1.5;
      g.stroke();
      await drawPlanet(g, exoLook(near.temp), 166, 38, 20);
    });
  if (figure)
    paint("dock-games", (g) => {
      const drawn = projectFigure(figure, 200, 120, 14);
      if (!drawn) throw new Error("no figure");
      g.save();
      g.shadowColor = "rgba(124,255,178,0.9)";
      g.shadowBlur = 8;
      g.strokeStyle = "rgba(184,230,193,0.85)";
      g.lineWidth = 2;
      g.lineCap = "round";
      for (const [x1, y1, x2, y2] of drawn.segments) {
        g.beginPath();
        g.moveTo(12 + x1, 10 + y1);
        g.lineTo(12 + x2, 10 + y2);
        g.stroke();
      }
      g.restore();
      for (const [x, y, mag] of drawn.stars) drawStar(g, 12 + x, 10 + y, Math.min(22, Math.max(7, 22 - 3.5 * (mag ?? 4))), "200,225,255");
    });
  paint("dock-sky", async (g) => {
    // a partial eclipse: the corona and a thin crescent of the Sun behind the real Moon, dark on the side we see
    const corona = g.createRadialGradient(118, 70, 30, 118, 70, 70);
    corona.addColorStop(0, "rgba(255,236,190,0.95)");
    corona.addColorStop(0.35, "rgba(255,200,120,0.35)");
    corona.addColorStop(1, "rgba(255,190,110,0)");
    g.fillStyle = corona;
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#fff6dc";
    g.beginPath();
    g.arc(118, 70, 38, 0, Math.PI * 2);
    g.fill();
    await drawPlanet(g, "Moon", 128, 70, 38);
    g.fillStyle = "rgba(4,6,12,0.82)";
    g.beginPath();
    g.arc(128, 70, 38.5, 0, Math.PI * 2);
    g.fill();
  });
  paint("dock-plan", async (g) => {
    // from the Earth to Mars: the way as a dotted arc, the ship a small light on it
    g.strokeStyle = "rgba(127,227,255,0.75)";
    g.lineWidth = 2.5;
    g.setLineDash([4, 7]);
    g.beginPath();
    g.moveTo(52, 98);
    g.quadraticCurveTo(110, 4, 186, 40);
    g.stroke();
    g.setLineDash([]);
    drawStar(g, 116, 40, 20, "200,240,255");
    await drawPlanet(g, "Earth", 40, 102, 30);
    await drawPlanet(g, "Mars", 192, 42, 18);
  });
  if (level) drawLevel(level);
}
// The level as a ring that fills up to the next one, drawn again when the XP change.
export function drawLevel(level) {
  paint("dock-log", (g) => {
    const [x, y, r] = [150, 70, 48];
    g.lineCap = "round";
    g.lineWidth = 10;
    g.strokeStyle = "rgba(255,255,255,0.12)";
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.stroke();
    g.save();
    g.shadowColor = "rgba(124,255,178,0.8)";
    g.shadowBlur = 10;
    g.strokeStyle = "#7cffb2";
    g.beginPath();
    g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.max(0.04, level.share) * Math.PI * 2);
    g.stroke();
    g.restore();
    g.fillStyle = "#ffffff";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = "700 40px system-ui, 'Segoe UI', sans-serif";
    g.fillText(String(level.level), x, y + 2);
  });
}
