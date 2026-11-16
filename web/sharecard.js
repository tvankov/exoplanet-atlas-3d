// Pictures to share ("Your star", "Your age on the planets", "The sky at your birth"): drawn in the browser on a canvas of 1080 x 1350 pixels
// (the size that phones and most apps show whole), with the name and the address of the site at the bottom, so that a shared picture leads back
// here. The page sends nothing: the picture goes only where the visitor shares it (the share sheet of the phone or of the system), or is saved
// as a file. The link in the message carries ?ref=share-<kind>, so that the visits it brings can be counted (stats.js, trackShareArrival).

import { track } from "./stats.js";

export const SITE = "space.todorvankov.com";
export const W = 1080;
export const H = 1350;
const FAMILY = "system-ui, 'Segoe UI', sans-serif";
export const font = (weight, size, family = FAMILY) => `${weight} ${size}px ${family}`;

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
// A small planet: a lit sphere in its colour, with a ring for Saturn.
export function planetDot(g, x, y, r, color, ring = false) {
  const ball = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.2);
  ball.addColorStop(0, "rgba(255,255,255,0.85)");
  ball.addColorStop(0.45, color);
  ball.addColorStop(1, "#05070c");
  g.fillStyle = ball;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  if (ring) {
    g.strokeStyle = color;
    g.lineWidth = r * 0.14;
    g.beginPath();
    g.ellipse(x, y, r * 1.8, r * 0.5, -0.3, 0, Math.PI * 2);
    g.stroke();
  }
}

// kind: a short name for the counting ("star", "ages", "sky"); title: the line at the top; text: the message that goes with the picture;
// draw(g): draws the middle (between about y 220 and y 1180).
export async function sharePicture({ kind, title, text, draw }) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  const sky = g.createRadialGradient(W / 2, H * 0.35, 40, W / 2, H / 2, H * 0.8);
  sky.addColorStop(0, "#1b2340");
  sky.addColorStop(1, "#05060a");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 320; i++) {
    g.fillStyle = `rgba(255,255,255,${(Math.random() * 0.6 + 0.2).toFixed(2)})`;
    const s = Math.random() * 2 + 0.5;
    g.fillRect(Math.random() * W, Math.random() * H, s, s);
  }
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  g.fillStyle = "#b8e6c1";
  fitText(g, title.toLocaleUpperCase(), W / 2, 150, W - 160, 600, 36);
  g.save();
  draw(g);
  g.restore();
  g.textAlign = "center";
  g.fillStyle = "rgba(255,255,255,0.55)";
  g.font = font(600, 26);
  g.fillText("SPACE EXPLORER", W / 2, H - 112);
  g.fillStyle = "#7cffb2";
  g.font = font(600, 36);
  g.fillText(SITE, W / 2, H - 64);

  const blob = await new Promise((resolve) => c.toBlob(resolve, "image/png"));
  const file = new File([blob], `space-explorer-${kind}.png`, { type: "image/png" });
  track(`share-${kind}`);
  const link = `https://${SITE}/?ref=share-${kind}`;
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text: `${text} ${link}` });
    } catch {
      // cancelled: nothing to do
    }
    return;
  }
  // no share sheet (most desktop browsers): the picture is saved as a file
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
