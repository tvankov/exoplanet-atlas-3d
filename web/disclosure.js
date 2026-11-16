// A small fold for My Universe ("More", "Why?"): the longer explanations, notes and sources stay one click away instead of filling the panel.
// The panel is built again after every change, so each fold remembers by its key whether it was open, for the rest of the visit.

const open = new Set();

export function disclosure(key, summary, children, cls = "") {
  const d = document.createElement("details");
  d.className = `uni-more ${cls}`.trim();
  d.open = open.has(key);
  const s = document.createElement("summary");
  s.textContent = summary;
  d.append(s, ...children);
  d.addEventListener("toggle", () => (d.open ? open.add(key) : open.delete(key)));
  return d;
}
