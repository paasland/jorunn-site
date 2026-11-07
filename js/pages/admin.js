import { db } from "../firebase.js";
import { state } from "../auth.js";
import {
  collection, getDocs, query, where, doc, updateDoc,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export async function render(el) {
  el.innerHTML = "<h1>Admin</h1>";
  if (!state.admin) { el.append("Ingen tilgang."); return; }

  el.insertAdjacentHTML("beforeend", "<h2>Ventende forespørsler</h2>");
  const list = document.createElement("div");
  list.style.display = "grid";
  list.style.gap = "10px";
  el.append(list);

  async function load() {
    const snap = await getDocs(query(collection(db, "users"), where("approved", "==", false)));
    const pending = snap.docs.filter((d) => !d.data().rejected);
    list.replaceChildren();
    if (!pending.length) { list.append(Object.assign(document.createElement("p"), { className: "muted", textContent: "Ingen ventende." })); return; }
    for (const d of pending) {
      const card = Object.assign(document.createElement("div"), { className: "card" });
      const when = d.data().createdAt?.toDate?.().toLocaleString("nb-NO") ?? "";
      card.append(Object.assign(document.createElement("div"), { textContent: d.data().email }));
      card.append(Object.assign(document.createElement("div"), { className: "muted", textContent: when }));
      const row = Object.assign(document.createElement("div"), { className: "row" });
      const ok = Object.assign(document.createElement("button"), { textContent: "Godkjenn" });
      const no = Object.assign(document.createElement("button"), { textContent: "Avslå", className: "secondary" });
      ok.onclick = async () => { ok.disabled = no.disabled = true; await updateDoc(doc(db, "users", d.id), { approved: true }); load(); };
      no.onclick = async () => { ok.disabled = no.disabled = true; await updateDoc(doc(db, "users", d.id), { rejected: true }); load(); };
      row.append(ok, no);
      card.append(row);
      list.append(card);
    }
  }
  await load();
}
