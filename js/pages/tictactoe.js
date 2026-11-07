import { confetti } from "../confetti.js";
import { imagesByTag, thumbUrl } from "../images.js";

// Variant: hver spiller har tre brikker. Når alle tre er lagt ut, flytter man en av sine
// egne brikker til et ledig felt (ingen nye brikker). Første med tre på rad vinner.
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const PIECES = 3;

const count = (b, p) => b.reduce((n, v) => n + (v === p), 0);
const other = (p) => (p === "X" ? "O" : "X");

function winnerOf(b) {
  for (const l of LINES) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return { who: b[l[0]], line: l };
  return null;
}

function movesFor(b, p) {
  const empty = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  if (count(b, p) < PIECES) return empty.map((to) => ({ from: null, to }));
  const own = b.map((v, i) => (v === p ? i : -1)).filter((i) => i >= 0);
  return own.flatMap((from) => empty.map((to) => ({ from, to })));
}

function apply(b, m, p) {
  const n = b.slice();
  if (m.from !== null) n[m.from] = null;
  n[m.to] = p;
  return n;
}

// Negamax med alfa-beta. Verdi sett fra spilleren `p` som skal trekke.
function negamax(b, p, depth, alpha, beta) {
  const w = winnerOf(b);
  if (w) return (w.who === p ? 1 : -1) * (100 + depth);
  if (depth === 0) return 0;
  let best = -Infinity;
  for (const m of movesFor(b, p)) {
    const v = -negamax(apply(b, m, p), other(p), depth - 1, -beta, -alpha);
    if (v > best) best = v;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

function computerMove(b, easy) {
  const all = movesFor(b, "O");
  if (easy && Math.random() < 0.4) return all[Math.floor(Math.random() * all.length)];
  let best = -Infinity, bestMoves = [];
  for (const m of all) {
    const v = -negamax(apply(b, m, "O"), "X", 5, -Infinity, Infinity);
    if (v > best) { best = v; bestMoves = [m]; }
    else if (v === best) bestMoves.push(m);
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

export async function render(el) {
  el.innerHTML = "<h1>3 på rad</h1>";
  const [selfs, opps] = await Promise.all([imagesByTag("face-self"), imagesByTag("face-opp")]);
  if (!selfs.length || !opps.length) {
    el.append("Mangler bilder: tag minst ett bilde med «face-self» og ett med «face-opp».");
    return;
  }
  const status = Object.assign(document.createElement("div"), { className: "status" });
  const boardEl = Object.assign(document.createElement("div"), { className: "board" });
  const controls = Object.assign(document.createElement("div"), { className: "row" });
  const again = Object.assign(document.createElement("button"), { textContent: "Nytt spill" });
  const level = document.createElement("select");
  level.innerHTML = `<option value="easy">Lett</option><option value="hard">Vanskelig</option>`;
  const help = Object.assign(document.createElement("p"), {
    className: "muted", style: "text-align:center",
    textContent: "Legg ut tre brikker. Deretter flytter du en av dine egne brikker til et ledig felt.",
  });
  controls.append(level, again);
  el.append(status, boardEl, controls, help);

  let board, over, busy, selected, faces, timer;

  const start = async () => {
    clearTimeout(timer);
    board = Array(9).fill(null);
    over = false; busy = false; selected = null;
    const me = selfs[Math.floor(Math.random() * selfs.length)];
    const opp = opps[Math.floor(Math.random() * opps.length)];
    faces = { X: await thumbUrl(me.id), O: await thumbUrl(opp.id) };
    prompt();
    draw();
  };

  function prompt() {
    status.textContent = count(board, "X") < PIECES ? "Din tur: legg ut en brikke"
      : selected === null ? "Din tur: velg en av dine brikker" : "Velg hvor brikken skal flyttes";
  }

  function draw(win) {
    boardEl.replaceChildren(...board.map((v, i) => {
      const c = Object.assign(document.createElement("button"), { className: "cell" });
      c.setAttribute("aria-label", `Rute ${i + 1}`);
      if (win?.line.includes(i)) c.classList.add("win");
      if (i === selected) c.classList.add("sel");
      if (v) c.append(Object.assign(document.createElement("img"), { src: faces[v], alt: v }));
      c.onclick = () => tap(i);
      return c;
    }));
  }

  function finish() {
    const w = winnerOf(board);
    if (!w) return false;
    over = true;
    status.textContent = w.who === "X" ? "Du vant! 🎉" : "Datamaskinen vant";
    draw(w);
    if (w.who === "X") { confetti({ count: 260 }); setTimeout(() => confetti({ count: 160 }), 700); }
    return true;
  }

  function tap(i) {
    if (over || busy) return;
    let move = null;
    if (count(board, "X") < PIECES) {
      if (!board[i]) move = { from: null, to: i };
    } else if (board[i] === "X") {
      selected = selected === i ? null : i;
      prompt(); draw();
      return;
    } else if (!board[i] && selected !== null) {
      move = { from: selected, to: i };
    }
    if (!move) return;
    board = apply(board, move, "X");
    selected = null;
    draw();
    if (finish()) return;
    busy = true;
    status.textContent = "Datamaskinen tenker…";
    timer = setTimeout(() => {
      board = apply(board, computerMove(board, level.value === "easy"), "O");
      busy = false;
      draw();
      if (!finish()) { prompt(); }
    }, 600);
  }

  again.onclick = start;
  await start();
  return () => clearTimeout(timer);
}
