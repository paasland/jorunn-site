import { db } from "./firebase.js";
import {
  doc, getDoc, getDocs, collection, query, where, orderBy,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Bilder ligger som base64-data-URL i Firestore: images/{id}.thumb og imagesFull/{id}.full.
const thumbs = new Map();
const fulls = new Map();

export async function thumbUrl(id) {
  if (!id) return "";
  if (!thumbs.has(id)) {
    thumbs.set(id, getDoc(doc(db, "images", id)).then((s) => (s.exists() ? s.data().thumb : "")));
  }
  return thumbs.get(id);
}

export async function fullUrl(id) {
  if (!id) return "";
  if (!fulls.has(id)) {
    fulls.set(id, getDoc(doc(db, "imagesFull", id)).then((s) => (s.exists() ? s.data().full : "")));
  }
  return fulls.get(id);
}

// Alle bildemetadata (uten pikseldata er ikke mulig i Firestore, så thumbs hentes med).
export async function imagesByTag(tag) {
  const snap = await getDocs(query(collection(db, "images"), where("tags", "array-contains", tag)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function allImages() {
  const snap = await getDocs(collection(db, "images"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Bilder til album/forside: alt unntatt motstanderansikter og verdenshendelser.
export async function albumImages() {
  return (await allImages()).filter((i) => !(i.tags || []).some((t) => t === "face-opp" || t === "world"));
}

// Bilder til spill uten egne tagger: alt unntatt ansikter og verdenshendelser.
export async function gameImages() {
  return (await allImages()).filter((i) => !(i.tags || []).some((t) => t.startsWith("face-") || t === "world"));
}

export async function timeline() {
  const snap = await getDocs(query(collection(db, "timeline"), orderBy("year")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// <img> som laster thumb lazy; klikk åpner fullbilde i lightbox.
export function photoEl(id, { zoom = true, alt = "" } = {}) {
  const img = document.createElement("img");
  img.className = "photo";
  img.alt = alt;
  img.loading = "lazy";
  thumbUrl(id).then((u) => { if (u) img.src = u; });
  if (zoom) img.addEventListener("click", () => openLightbox(id));
  return img;
}

export async function openLightbox(id) {
  const box = document.getElementById("lightbox");
  const img = document.createElement("img");
  img.src = await thumbUrl(id); // vis thumb mens fullbildet laster
  box.replaceChildren(img);
  box.hidden = false;
  box.onclick = () => { box.hidden = true; box.replaceChildren(); };
  const full = await fullUrl(id);
  if (full && !box.hidden) img.src = full;
}
