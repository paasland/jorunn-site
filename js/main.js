import { watchAuth, login, register, logout, state } from "./auth.js";

const app = document.getElementById("app");
const topbar = document.getElementById("topbar");

// Rute -> sidemodul. Hver modul eksporterer render(container) og kan returnere en cleanup-funksjon.
const routes = {
  "": () => import("./pages/home.js"),
  "tidslinje": () => import("./pages/timeline.js"),
  "tictactoe": () => import("./pages/tictactoe.js"),
  "kabal": () => import("./pages/solitaire.js"),
  "billedlotto": () => import("./pages/lotto.js"),
  "puslespill": () => import("./pages/puzzle.js"),
  "quiz": () => import("./pages/quiz.js"),
  "album": () => import("./pages/album.js"),
  "admin": () => import("./pages/admin.js"),
};

// Admin ser antall ventende forespørsler som et tall på "Admin"-lenken.
async function updateAdminBadge() {
  const link = document.getElementById("adminLink");
  link.hidden = !state.admin;
  if (!state.admin) return;
  try {
    const { db } = await import("./firebase.js");
    const { collection, getDocs, query, where } =
      await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js");
    const snap = await getDocs(query(collection(db, "users"), where("approved", "==", false)));
    const n = snap.docs.filter((d) => !d.data().rejected).length;
    link.textContent = n ? `Admin (${n})` : "Admin";
    link.style.fontWeight = n ? "bold" : "";
  } catch (e) { console.warn(e); }
}

let cleanup = null;

function msg(text) {
  return Object.assign(document.createElement("p"), { textContent: text, className: "muted" });
}

function loginView() {
  topbar.hidden = true;
  app.innerHTML = `
    <div class="card center">
      <h1>Hei Jorunn 👋</h1>
      <form id="loginForm">
        <input id="id" placeholder="Brukernavn eller e-post" autocomplete="username" autocapitalize="none" required>
        <input id="pw" type="password" placeholder="Passord" autocomplete="current-password" required>
        <button type="submit">Logg inn</button>
        <div class="error" id="err"></div>
      </form>
      <hr>
      <p class="muted">Ny her?</p>
      <button class="secondary" id="toReg" type="button">Be om tilgang</button>
    </div>`;
  app.querySelector("#loginForm").onsubmit = async (e) => {
    e.preventDefault();
    try { await login(app.querySelector("#id").value, app.querySelector("#pw").value); }
    catch { app.querySelector("#err").textContent = "Feil brukernavn eller passord."; }
  };
  app.querySelector("#toReg").onclick = registerView;
}

function registerView() {
  app.innerHTML = `
    <div class="card center">
      <h1>Be om tilgang</h1>
      <form id="regForm">
        <input id="email" type="email" placeholder="E-post" autocomplete="email" required>
        <input id="pw" type="password" placeholder="Passord (minst 8 tegn)" minlength="8" autocomplete="new-password" required>
        <button type="submit">Send forespørsel</button>
        <div class="error" id="err"></div>
      </form>
      <p class="muted">Du får tilgang når forespørselen er godkjent.</p>
      <button class="secondary" id="back" type="button">Tilbake</button>
    </div>`;
  app.querySelector("#back").onclick = loginView;
  app.querySelector("#regForm").onsubmit = async (e) => {
    e.preventDefault();
    try { await register(app.querySelector("#email").value, app.querySelector("#pw").value); }
    catch (err) { app.querySelector("#err").textContent = "Kunne ikke opprette: " + (err.code || err.message); }
  };
}

function pendingView() {
  topbar.hidden = true;
  app.innerHTML = `
    <div class="card center">
      <h1>Venter på godkjenning</h1>
      <p>Forespørselen din er sendt. Du får tilgang så snart den er godkjent.</p>
      <button id="out" type="button">Logg ut</button>
    </div>`;
  app.querySelector("#out").onclick = logout;
}

async function route() {
  if (!state.user) return loginView();
  if (!state.approved) return pendingView();
  topbar.hidden = false;
  updateAdminBadge();
  const name = location.hash.replace(/^#\/?/, "");
  document.querySelectorAll("#nav a").forEach((a) => a.classList.toggle("active", a.hash === `#/${name}`));
  if (cleanup) { cleanup(); cleanup = null; }
  const load = routes[name];
  app.replaceChildren(msg(load ? "Laster…" : "Siden kommer snart."));
  if (!load) return;
  const mod = await load();
  app.replaceChildren();
  cleanup = (await mod.render(app)) || null;
}

document.getElementById("logout").onclick = logout;
window.addEventListener("hashchange", route);
watchAuth(route);
