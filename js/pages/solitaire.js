import { imagesByTag, gameImages, thumbUrl } from "../images.js";

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const isRed = (s) => s === 1 || s === 2;
const GAP = 6;

export async function render(el) {
  el.innerHTML = "<h1>Kabal</h1>";
  let imgs = await imagesByTag("card");
  if (!imgs.length) imgs = await gameImages();
  if (!imgs.length) { el.append("Ingen bilder ennå. Tag bilder med «card»."); return; }

  const boardEl = Object.assign(document.createElement("div"), { className: "sol" });
  const status = Object.assign(document.createElement("div"), { className: "status" });
  const controls = Object.assign(document.createElement("div"), { className: "row" });
  const undoBtn = Object.assign(document.createElement("button"), { textContent: "Angre", className: "secondary" });
  const newBtn = Object.assign(document.createElement("button"), { textContent: "Nytt spill" });
  controls.append(undoBtn, newBtn);
  el.append(status, boardEl, controls);

  // Kortbilder som CSS-variabler, så samme data-URL ikke gjentas i hvert kort.
  const urls = await Promise.all(imgs.map((i) => thumbUrl(i.id)));
  urls.forEach((u, k) => boardEl.style.setProperty(`--img${k}`, `url("${u}")`));

  let stock, waste, found, tab, sel, undo;

  const snapshot = () => undo.push(JSON.stringify({ stock, waste, found, tab }));

  function deal() {
    const deck = [];
    for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ id: s * 13 + r - 1, suit: s, rank: r, up: false });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    tab = Array.from({ length: 7 }, (_, c) => {
      const pile = deck.splice(0, c + 1);
      pile[pile.length - 1].up = true;
      return pile;
    });
    stock = deck; waste = []; found = [[], [], [], []]; sel = null; undo = [];
    draw();
  }

  const canFound = (c, f) => c.suit === f && c.rank === found[f].length + 1;
  const canTab = (c, pile) => {
    if (!pile.length) return c.rank === 13;
    const top = pile[pile.length - 1];
    return top.up && isRed(top.suit) !== isRed(c.suit) && top.rank === c.rank + 1;
  };

  const cardsOf = (s) => s.type === "waste" ? [waste[waste.length - 1]]
    : s.type === "found" ? [found[s.f][found[s.f].length - 1]]
    : tab[s.col].slice(s.idx);

  function tryMove(target) {
    const cards = cardsOf(sel);
    if (!cards[0]) return false;
    if (target.type === "found") { if (cards.length !== 1 || !canFound(cards[0], target.f)) return false; }
    else if ((sel.type === "tab" && sel.col === target.col) || !canTab(cards[0], tab[target.col])) return false;
    snapshot();
    if (sel.type === "waste") waste.pop();
    else if (sel.type === "found") found[sel.f].pop();
    else {
      tab[sel.col].splice(sel.idx);
      const src = tab[sel.col];
      if (src.length) src[src.length - 1].up = true;
    }
    (target.type === "found" ? found[target.f] : tab[target.col]).push(...cards);
    sel = null;
    return true;
  }

  function tap(target, card, idx) {
    if (target.type === "stock") {
      snapshot(); sel = null;
      if (stock.length) { const c = stock.pop(); c.up = true; waste.push(c); }
      else { stock = waste.reverse().map((c) => ({ ...c, up: false })); waste = []; }
      return draw();
    }
    if (target.type === "tab" && card && !card.up) {
      if (idx === tab[target.col].length - 1) { snapshot(); card.up = true; sel = null; }
      return draw();
    }
    if (sel) {
      const same = sel.type === target.type && (sel.col ?? sel.f) === (target.col ?? target.f)
        && (sel.type !== "tab" || sel.idx === idx);
      if (same) { // trykk igjen på valgt kort: send til grunnbunke hvis mulig
        const cards = cardsOf(sel);
        if (cards.length !== 1 || !tryMove({ type: "found", f: cards[0].suit })) sel = null;
        return draw();
      }
      if ((target.type === "tab" || target.type === "found") && tryMove(target)) return draw();
    }
    sel = null;
    if (card && target.type !== "stock") {
      if (target.type === "tab") sel = { type: "tab", col: target.col, idx };
      else if (target.type === "waste") sel = { type: "waste" };
      else if (target.type === "found") sel = { type: "found", f: target.f };
    }
    draw();
  }

  function slot(parent, onTap, label) {
    const s = Object.assign(document.createElement("div"), { className: "slot" });
    if (label) s.textContent = label;
    s.onclick = onTap;
    parent.append(s);
    return s;
  }

  function cardEl(c, top, selected, onTap) {
    const d = Object.assign(document.createElement("div"), { className: "scard" + (c.up ? "" : " down") + (selected ? " sel" : "") });
    d.style.top = top + "px";
    if (c.up) {
      d.style.backgroundImage = `var(--img${c.id % urls.length})`;
      d.classList.toggle("red", isRed(c.suit));
      d.append(Object.assign(document.createElement("span"), { textContent: RANKS[c.rank] + SUITS[c.suit] }));
    }
    d.onclick = (e) => { e.stopPropagation(); onTap(); };
    return d;
  }

  function draw() {
    const colW = (boardEl.clientWidth - GAP * 6) / 7 || 48;
    const h = colW * 1.4;
    boardEl.style.setProperty("--ch", h + "px");
    boardEl.replaceChildren();
    const top = Object.assign(document.createElement("div"), { className: "sol-row" });
    const bottom = Object.assign(document.createElement("div"), { className: "sol-row" });
    boardEl.append(top, bottom);

    const st = slot(top, () => tap({ type: "stock" }), stock.length ? "" : "↻");
    if (stock.length) st.append(cardEl({ up: false }, 0, false, () => tap({ type: "stock" })));
    const w = slot(top, () => {});
    if (waste.length) w.append(cardEl(waste[waste.length - 1], 0, sel?.type === "waste", () => tap({ type: "waste" }, waste[waste.length - 1])));
    slot(top, () => {}).style.visibility = "hidden";
    for (let f = 0; f < 4; f++) {
      const s = slot(top, () => tap({ type: "found", f }), SUITS[f]);
      const pile = found[f];
      if (pile.length) {
        s.textContent = "";
        s.append(cardEl(pile[pile.length - 1], 0, sel?.type === "found" && sel.f === f, () => tap({ type: "found", f }, pile[pile.length - 1])));
      }
    }

    let maxH = h;
    tab.forEach((pile, col) => {
      const s = slot(bottom, () => tap({ type: "tab", col }));
      let y = 0;
      pile.forEach((c, idx) => {
        const selected = sel?.type === "tab" && sel.col === col && idx >= sel.idx;
        s.append(cardEl(c, y, selected, () => tap({ type: "tab", col }, c, idx)));
        y += h * (c.up ? 0.3 : 0.12);
      });
      maxH = Math.max(maxH, y - h * (pile.length && pile[pile.length - 1].up ? 0.3 : 0.12) + h);
      s.style.height = Math.max(h, maxH) + "px";
    });
    bottom.querySelectorAll(".slot").forEach((s) => (s.style.height = maxH + "px"));

    const won = found.every((p) => p.length === 13);
    status.textContent = won ? "Gratulerer, du klarte det! 🎉" : "";
  }

  undoBtn.onclick = () => {
    const prev = undo.pop();
    if (!prev) return;
    ({ stock, waste, found, tab } = JSON.parse(prev));
    sel = null;
    draw();
  };
  newBtn.onclick = deal;
  const onResize = () => draw();
  window.addEventListener("resize", onResize);
  deal();
  return () => window.removeEventListener("resize", onResize);
}
