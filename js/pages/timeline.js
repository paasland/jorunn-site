import { timeline, photoEl } from "../images.js";

function figure(imageId, caption) {
  const f = document.createElement("figure");
  f.append(photoEl(imageId, { alt: caption }));
  if (caption) f.append(Object.assign(document.createElement("figcaption"), { textContent: caption }));
  return f;
}

export async function render(el) {
  el.innerHTML = "<h1>Tidslinje</h1>";
  const items = await timeline();
  if (!items.length) { el.append("Ingen oppføringer ennå."); return; }
  const list = Object.assign(document.createElement("div"), { className: "timeline" });
  for (const it of items) {
    const row = Object.assign(document.createElement("section"), { className: "tl-item" });
    row.append(Object.assign(document.createElement("div"), { className: "tl-year", textContent: it.year }));
    if (it.title) row.append(Object.assign(document.createElement("h2"), { textContent: it.title }));
    const photos = Object.assign(document.createElement("div"), { className: "tl-photos" });
    if (it.jorunnImage) photos.append(figure(it.jorunnImage, "Jorunn"));
    if (it.worldImage) photos.append(figure(it.worldImage, it.worldTitle || "I verden"));
    if (photos.children.length) row.append(photos);
    if (it.text) row.append(Object.assign(document.createElement("p"), { textContent: it.text }));
    list.append(row);
  }
  el.append(list);
}
