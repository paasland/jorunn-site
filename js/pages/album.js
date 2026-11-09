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

  // Lysbildeshow i lightbox: nytt bilde hvert 5. sekund, piler (og piltaster) for å bla manuelt,
  // trykk på bildet for å avslutte.
  let timer, onKey;
  const box = document.getElementById("lightbox");
  const stop = () => {
    clearInterval(timer);
    if (onKey) document.removeEventListener("keydown", onKey);
    onKey = null;
    box.hidden = true; box.replaceChildren();
  };
  play.onclick = () => {
    let k = 0;
    const img = document.createElement("img");
    const cap = Object.assign(document.createElement("div"), { className: "cap" });
    const navBtn = (text, cls, label) => {
      const b = Object.assign(document.createElement("button"), { type: "button", textContent: text, className: `lb-nav ${cls}` });
      b.setAttribute("aria-label", label);
      return b;
    };
    const prevB = navBtn("‹", "prev", "Forrige bilde");
    const nextB = navBtn("›", "next", "Neste bilde");
    box.replaceChildren(img, cap, prevB, nextB);
    box.hidden = false;
    box.onclick = stop;
    const show = async () => {
      const im = imgs[k];
      cap.textContent = im.title || "";
      const url = (await fullUrl(im.id)) || (await thumbUrl(im.id));
      if (imgs[k] === im) img.src = url; // ignorer hvis brukeren har bladd videre
    };
    const auto = () => { k = (k + 1) % imgs.length; show(); };
    const go = (d) => {
      k = (k + d + imgs.length) % imgs.length;
      show();
      clearInterval(timer); timer = setInterval(auto, 5000); // start 5 sek-timeren på nytt
    };
    prevB.onclick = (e) => { e.stopPropagation(); go(-1); };
    nextB.onclick = (e) => { e.stopPropagation(); go(1); };
    onKey = (e) => {
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "Escape") stop();
    };
    document.addEventListener("keydown", onKey);
    show();
    timer = setInterval(auto, 5000);
  };
  return stop;
}
