import { albumImages, photoEl } from "../images.js";

const MENU = [
  ["#/tidslinje", "📜 Tidslinje"],
  ["#/album", "🖼️ Album"],
  ["#/tictactoe", "❌⭕ 3 på rad"],
  ["#/kabal", "🃏 Kabal"],
  ["#/billedlotto", "🎟️ Billedlotto"],
  ["#/puslespill", "🧩 Puslespill"],
  ["#/quiz", "❓ Quiz"],
];

export async function render(el) {
  el.innerHTML = `<h1>Velkommen, Jorunn</h1><div id="daily"></div><div class="grid menu" id="menu"></div>`;
  el.querySelector("#menu").append(...MENU.map(([href, label]) => {
    const a = Object.assign(document.createElement("a"), { href, textContent: label, className: "card" });
    return a;
  }));

  // Dagens bilde: deterministisk valg per dato, så det er likt hele dagen.
  const imgs = await albumImages();
  if (!imgs.length) return;
  const day = Math.floor(Date.now() / 86400000);
  const pick = imgs[day % imgs.length];
  const box = el.querySelector("#daily");
  box.className = "card";
  box.style.marginBottom = "16px";
  box.innerHTML = "<h2>Dagens bilde</h2>";
  const img = photoEl(pick.id, { alt: pick.title || "" });
  img.classList.add("free");
  box.append(img);
  if (pick.title) box.append(Object.assign(document.createElement("p"), { textContent: pick.title }));
}
