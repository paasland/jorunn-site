import { confetti } from "../confetti.js";
import { gameImages, thumbUrl, fullUrl } from "../images.js";

// Skyv-puslespill: trykk en brikke ved siden av det tomme feltet.
export async function render(el) {
  el.innerHTML = "<h1>Puslespill</h1>";
  const imgs = await gameImages();
  if (!imgs.length) { el.append("Ingen bilder ennå."); return; }

  const status = Object.assign(document.createElement("div"), { className: "status" });
  const board = Object.assign(document.createElement("div"), { className: "puz" });
  const controls = Object.assign(document.createElement("div"), { className: "row" });
  const dim = document.createElement("select");
  dim.innerHTML = `<option value="3">3 × 3</option><option value="4">4 × 4</option>`;
  const again = Object.assign(document.createElement("button"), { textContent: "Nytt puslespill" });
  const peek = Object.assign(document.createElement("button"), { textContent: "Vis miniatyr", className: "secondary" });
  const prev = Object.assign(document.createElement("div"), { className: "puz-prev", hidden: true });
  const wrap = Object.assign(document.createElement("div"), { className: "puz-wrap" });
  wrap.append(board, prev);
  peek.onclick = () => {
    prev.hidden = !prev.hidden;
    peek.textContent = prev.hidden ? "Vis miniatyr" : "Skjul miniatyr";
  };
  controls.append(dim, peek, again);
  el.append(status, wrap, controls);

  async function start() {
    const n = +dim.value;
    const pick = imgs[Math.floor(Math.random() * imgs.length)];
    const url = (await fullUrl(pick.id)) || (await thumbUrl(pick.id));
    // Bland ved å gjøre tilfeldige lovlige trekk, så oppgaven alltid er løsbar.
    let tiles = [...Array(n * n).keys()]; // verdi 0..n*n-2 = brikke, n*n-1 = tomt
    let empty = n * n - 1;
    const nb = (e) => [e - n, e + n, e % n ? e - 1 : -1, (e + 1) % n ? e + 1 : -1].filter((x) => x >= 0 && x < n * n);
    let last = -1;
    for (let i = 0; i < 200 * n; i++) {
      const opts = nb(empty).filter((x) => x !== last);
      const t = opts[Math.floor(Math.random() * opts.length)];
      [tiles[empty], tiles[t]] = [tiles[t], tiles[empty]];
      last = empty; empty = t;
    }
    let moves = 0, done = false;
    board.style.setProperty("--n", n);
    prev.style.backgroundImage = `url("${url}")`;
    status.textContent = "Trekk: 0";

    function draw() {
      board.replaceChildren(...tiles.map((v, pos) => {
        const b = Object.assign(document.createElement("button"), { className: "ptile" });
        if (v === n * n - 1 && !done) { b.classList.add("blank"); return b; }
        b.style.backgroundImage = `url("${url}")`;
        b.style.backgroundSize = `${n * 100}% ${n * 100}%`;
        b.style.backgroundPosition = `${((v % n) / (n - 1)) * 100}% ${((Math.floor(v / n)) / (n - 1)) * 100}%`;
        b.onclick = () => {
          if (done || !nb(empty).includes(pos)) return;
          [tiles[empty], tiles[pos]] = [tiles[pos], tiles[empty]];
          empty = pos; moves++;
          if (tiles.every((x, i) => x === i)) { done = true; status.textContent = `Ferdig på ${moves} trekk! 🎉`; confetti(); }
          else status.textContent = `Trekk: ${moves}`;
          draw();
        };
        return b;
      }));
    }
    draw();
  }
  again.onclick = start;
  dim.onchange = start;
  await start();
}
