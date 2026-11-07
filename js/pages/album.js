import { albumImages, photoEl, fullUrl, thumbUrl } from "../images.js";

export async function render(el) {
  el.innerHTML = "<h1>Album</h1>";
  const imgs = await albumImages();
  if (!imgs.length) { el.append("Ingen bilder ennå."); return; }
  imgs.sort((a, b) => (a.title || "").localeCompare(b.title || "", "nb"));

  const play = Object.assign(document.createElement("button"), { textContent: "▶ Lysbildeshow" });
  const row = Object.assign(document.createElement("div"), { className: "row" });
  row.append(play);
  const grid = Object.assign(document.createElement("div"), { className: "grid" });
  for (const im of imgs) {
    const f = document.createElement("figure");
    f.style.margin = "0";
    f.append(photoEl(im.id, { alt: im.title || "" }));
    if (im.title) f.append(Object.assign(document.createElement("figcaption"), { className: "muted", textContent: im.title }));
    grid.append(f);
  }
  el.append(row, grid);

  // Lysbildeshow i lightbox: nytt bilde hvert 5. sekund, trykk for å avslutte.
  let timer;
  const box = document.getElementById("lightbox");
  const stop = () => { clearInterval(timer); box.hidden = true; box.replaceChildren(); };
  play.onclick = () => {
    let k = 0;
    const img = document.createElement("img");
    const cap = Object.assign(document.createElement("div"), { className: "cap" });
    box.replaceChildren(img, cap);
    box.hidden = false;
    box.onclick = stop;
    const show = async () => {
      const im = imgs[k % imgs.length];
      k++;
      cap.textContent = im.title || "";
      img.src = (await fullUrl(im.id)) || (await thumbUrl(im.id));
    };
    show();
    timer = setInterval(show, 5000);
  };
  return stop;
}
