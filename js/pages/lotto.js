import { imagesByTag, gameImages, thumbUrl } from "../images.js";
import { confetti } from "../confetti.js";

const CHEERS = [
  "Fantastisk! Hukommelsen din er skarpere enn en nyslipt ostehøvel! 🧀",
  "Bingo! Du er offisielt for god for dette spillet. 🏆",
  "Imponerende! Selv elefanter kunne lært noe av deg. 🐘",
  "Se der ja! Her trengs det ingen lapper på kjøleskapet. 😄",
  "Perfekt! Du har et minne som en gullfisk, men en veldig smart gullfisk. 🐠",
  "Hurra! Premien er evig ære og en klem fra alle her. 🎉",
];

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export async function render(el) {
  el.innerHTML = "<h1>Billedlotto</h1>";
  let imgs = await imagesByTag("card");
  if (imgs.length < 2) imgs = await gameImages();
  if (imgs.length < 2) { el.append("Trenger minst to bilder."); return; }

  const status = Object.assign(document.createElement("div"), { className: "status" });
  const grid = Object.assign(document.createElement("div"), { className: "mem" });
  const controls = Object.assign(document.createElement("div"), { className: "row" });
  const size = document.createElement("select");
  size.innerHTML = `<option value="6">6 par</option><option value="8">8 par</option><option value="10">10 par</option>`;
  const again = Object.assign(document.createElement("button"), { textContent: "Nytt spill" });
  controls.append(size, again);
  el.append(status, grid, controls);

  let timer;
  async function start() {
    clearTimeout(timer);
    const n = Math.min(+size.value, imgs.length);
    const picks = shuffle(imgs.slice()).slice(0, n);
    const urls = await Promise.all(picks.map((p) => thumbUrl(p.id)));
    const cards = shuffle(urls.flatMap((u, k) => [{ k, u }, { k, u }]));
    let first = null, lock = false, moves = 0, found = 0;
    status.textContent = "Trekk: 0";
    grid.replaceChildren(...cards.map((c) => {
      const b = Object.assign(document.createElement("button"), { className: "mcard" });
      b.setAttribute("aria-label", "Kort");
      b.onclick = () => {
        if (lock || b.classList.contains("up")) return;
        b.classList.add("up");
        b.style.backgroundImage = `url("${c.u}")`;
        if (!first) { first = { b, c }; return; }
        moves++;
        status.textContent = `Trekk: ${moves}`;
        if (first.c.k === c.k) {
          first.b.classList.add("done"); b.classList.add("done");
          first = null;
          if (++found === n) {
            const cheer = CHEERS[Math.floor(Math.random() * CHEERS.length)];
            status.textContent = `Ferdig på ${moves} trekk! ${cheer}`;
            confetti();
          }
        } else {
          lock = true;
          const prev = first.b;
          first = null;
          timer = setTimeout(() => {
            for (const x of [prev, b]) { x.classList.remove("up"); x.style.backgroundImage = ""; }
            lock = false;
          }, 900);
        }
      };
      return b;
    }));
  }
  again.onclick = start;
  size.onchange = start;
  await start();
  return () => clearTimeout(timer);
}
