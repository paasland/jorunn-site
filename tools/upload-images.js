// Bruk: node upload-images.js [--force]
// Leser ../content/manifest.json og bildene i ../content/, komprimerer og skriver til Firestore.
//
// manifest.json:
// {
//   "images": [ { "file": "jorunn-1975.jpg", "title": "Jorunn 1975", "tags": ["face-self"] },
//               { "file": "onkel.jpg", "title": "Onkel", "tags": ["face-opp"] } ],
//   "timeline": [ { "year": 1975, "title": "...", "text": "...",
//                   "jorunnImage": "jorunn-1975.jpg", "worldImage": "apollo.jpg", "worldTitle": "..." } ]
// }
// Tags med spesiell betydning: face-self, face-opp (3 på rad), card (kabal/billedlotto/puslespill), world (verdenshendelse, ikke i album).
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { db } from "./admin.js";

const force = process.argv.includes("--force");
const dir = new URL("../content/", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("manifest.json", dir), "utf8"));
const MAX_BYTES = 950_000; // base64-tekst; Firestore-dokumentgrensen er ~1 MiB
const idOf = (file) => file.replace(/[^a-zA-Z0-9_-]/g, "_");

async function encode(buf, size, startQuality) {
  for (let q = startQuality; q >= 50; q -= 5) {
    const out = await sharp(buf).rotate().resize(size, size, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: q, mozjpeg: true }).toBuffer();
    const url = `data:image/jpeg;base64,${out.toString("base64")}`;
    if (url.length <= MAX_BYTES) return url;
  }
  throw new Error("Bildet ble ikke lite nok");
}

for (const img of manifest.images ?? []) {
  const id = idOf(img.file);
  // Allerede opplastet: oppdater bare tittel og tagger (rask). --force komprimerer og laster opp på nytt.
  if (!force && (await db.doc(`images/${id}`).get()).exists) {
    await db.doc(`images/${id}`).update({ title: img.title ?? "", tags: img.tags ?? [] });
    console.log(`Bilde ${id}: oppdatert (tittel/tagger)`);
    continue;
  }
  const src = readFileSync(new URL(img.file, dir));
  const [thumb, full] = await Promise.all([encode(src, 720, 85), encode(src, 2400, 90)]);
  await db.doc(`images/${id}`).set({ title: img.title ?? "", tags: img.tags ?? [], thumb });
  await db.doc(`imagesFull/${id}`).set({ full });
  console.log(`Bilde ${id}: thumb ${(thumb.length / 1024) | 0} KB, full ${(full.length / 1024) | 0} KB`);
}

// Tidslinjen erstattes helt, så endrede titler ikke etterlater duplikater.
for (const old of (await db.collection("timeline").get()).docs) await old.ref.delete();
for (const t of manifest.timeline ?? []) {
  const data = {
    year: t.year, title: t.title ?? "", text: t.text ?? "", worldTitle: t.worldTitle ?? "",
    jorunnImage: t.jorunnImage ? idOf(t.jorunnImage) : "",
    worldImage: t.worldImage ? idOf(t.worldImage) : "",
  };
  await db.doc(`timeline/${t.year}-${idOf(t.title ?? "x")}`).set(data);
  console.log(`Tidslinje ${t.year}`);
}
console.log("Ferdig.");
