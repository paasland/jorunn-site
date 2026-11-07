import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendEmailVerification, signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  doc, getDoc, setDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Brukernavn uten @ er forhåndsopprettede kontoer med syntetisk e-post.
const FAKE_DOMAIN = "jorunn.invalid";
const toEmail = (id) => (id.includes("@") ? id.trim() : `${id.trim().toLowerCase()}@${FAKE_DOMAIN}`);

export const state = { user: null, approved: false, admin: false };

export function login(id, password) {
  return signInWithEmailAndPassword(auth, toEmail(id), password);
}

export async function register(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await setDoc(doc(db, "users", cred.user.uid), {
    email: email.trim(), approved: false, createdAt: serverTimestamp(),
  });
  sendEmailVerification(cred.user).catch(() => {});
  // Ingen e-postvarsel (krever Blaze); admin ser ventende forespørsler som tall på Admin-lenken.
  return cred.user;
}

export const logout = () => signOut(auth);

async function loadStatus(user) {
  state.approved = false;
  state.admin = false;
  try {
    const u = await getDoc(doc(db, "users", user.uid));
    state.approved = u.exists() && u.data().approved === true;
    state.admin = (await getDoc(doc(db, "admins", user.uid))).exists();
  } catch (e) {
    console.warn("Kunne ikke lese brukerstatus", e);
  }
}

export function watchAuth(callback) {
  onAuthStateChanged(auth, async (user) => {
    state.user = user;
    if (user) await loadStatus(user);
    else { state.approved = false; state.admin = false; }
    callback(state);
  });
}
