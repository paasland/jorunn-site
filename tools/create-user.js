// Bruk: node create-user.js <brukernavn> <passord> [--admin]
// Oppretter en forhåndsgodkjent konto uten ekte e-post (brukernavn@jorunn.invalid).
import { auth, db, FAKE_DOMAIN } from "./admin.js";

const [username, password, flag] = process.argv.slice(2);
if (!username || !password || password.length < 6) {
  console.error("Bruk: node create-user.js <brukernavn> <passord (min 6 tegn)> [--admin]");
  process.exit(1);
}

const email = `${username.toLowerCase()}@${FAKE_DOMAIN}`;
let user;
try {
  user = await auth.getUserByEmail(email);
  await auth.updateUser(user.uid, { password });
  console.log("Fant eksisterende bruker, passord oppdatert.");
} catch {
  user = await auth.createUser({ email, password, emailVerified: true });
  console.log("Opprettet bruker.");
}
await db.doc(`users/${user.uid}`).set({ email, approved: true, createdAt: new Date() }, { merge: true });
if (flag === "--admin") await db.doc(`admins/${user.uid}`).set({ createdAt: new Date() });
console.log(`Ferdig: ${username} (uid ${user.uid})${flag === "--admin" ? " [admin]" : ""}`);
