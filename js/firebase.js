// Firebase web-config er ikke hemmelig; tilgangen styres av firestore.rules.
// Lim inn verdiene fra Firebase-konsollen: Prosjektinnstillinger > Dine apper > Web-app.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBxFH1yq2zQIoFlZDK1igXziBgh8Jm9jRY",
  authDomain: "jorunnside.firebaseapp.com",
  projectId: "jorunnside",
  storageBucket: "jorunnside.firebasestorage.app",
  messagingSenderId: "10925537342",
  appId: "1:10925537342:web:0416674ddc3dcd5b1a796f"};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Lokal cache (IndexedDB) sparer lesinger mot gratiskvoten.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
