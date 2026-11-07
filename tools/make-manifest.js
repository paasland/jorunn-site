// Bruk: node make-manifest.js [--force]
// Lager et utkast til ../content/manifest.json ut fra metadata i filnavnene
// (navn, årstall). Skriver ikke over eksisterende manifest uten --force.
import { readdirSync, writeFileSync, existsSync } from "node:fs";

const dir = new URL("../content/", import.meta.url);
const out = new URL("manifest.json", dir);
if (existsSync(out) && !process.argv.includes("--force")) {
  console.error("content/manifest.json finnes allerede. Bruk --force for å overskrive.");
  process.exit(1);
}

const files = readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort((a, b) => a.localeCompare(b, "nb"));

const isName = (t) => /^\p{Lu}\p{L}+( \p{Lu}\p{L}+)+$/u.test(t) || /\baasland$/i.test(t);
const first = (n) => n.split(" ")[0].replace(/^./, (c) => c.toUpperCase());

const images = [];
const skipped = [];
const byYear = new Map();

for (const file of files) {
  if (/duplicate/i.test(file)) { skipped.push(file); continue; }
  const base = file.replace(/\.[^.]+$/, "");
  const year = base.match(/,\s*((?:19|20)\d\d)(?:\s*\(\d+\))?$/)?.[1];
  const names = [...new Set(base.split(/[,\-]/).map((t) => t.trim()).filter((t) => isName(t) && !/rating|duplicate/i.test(t)))];
  const hasJ = names.some((n) => /^jorunn aasland$/i.test(n));
  const solo = names.length === 1;

  const tags = ["card"];
  if (hasJ && solo) tags.push("face-self");
  if (!hasJ && solo) tags.push("face-opp");

  const who = names.length === 0 ? "" : names.length <= 3 ? names.map(first).join(", ") : `${names.slice(0, 2).map(first).join(", ")} m.fl.`;
  const title = [who, year].filter(Boolean).join(" ");
  images.push({ file, title, tags });

  if (hasJ && year) {
    const cur = byYear.get(year);
    if (!cur || (solo && !cur.solo)) byYear.set(year, { file, solo });
  }
}

const timeline = [...byYear.entries()].sort(([a], [b]) => a - b).map(([year, v]) => ({
  year: +year, title: "", text: "", jorunnImage: v.file,
}));

writeFileSync(out, JSON.stringify({ images, timeline }, null, 2), "utf8");

const count = (t) => images.filter((i) => i.tags.includes(t)).length;
console.log(`${images.length} bilder (hoppet over ${skipped.length} «Duplicate»)`);
console.log(`face-self: ${count("face-self")}, face-opp: ${count("face-opp")}`);
console.log(`Tidslinje: ${timeline.length} år (${timeline.map((t) => t.year).join(", ")})`);
console.log(`Uten tittel: ${images.filter((i) => !i.title).length}`);
