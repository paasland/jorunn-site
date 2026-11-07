// Felles Admin SDK-init. Krever serviceAccount.json (gitignored) i repo-roten,
// eller GOOGLE_APPLICATION_CREDENTIALS satt.
import { readFileSync, existsSync } from "node:fs";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const keyPath = new URL("../serviceAccount.json", import.meta.url);
initializeApp({
  credential: existsSync(keyPath) ? cert(JSON.parse(readFileSync(keyPath, "utf8"))) : applicationDefault(),
});

export const auth = getAuth();
export const db = getFirestore();
export const FAKE_DOMAIN = "jorunn.invalid";
