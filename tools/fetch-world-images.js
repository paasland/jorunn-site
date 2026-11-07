// Bruk: node fetch-world-images.js
// Laster ned frie bilder fra Wikimedia Commons til ../content/ og kobler dem til
// riktig år på tidslinjen i ../content/manifest.json (worldImage/worldTitle/text).
// Kreditering (opphavsperson + lisens) legges i bildeteksten.
import { writeFileSync, readFileSync } from "node:fs";

const dir = new URL("../content/", import.meta.url);
const UA = { "User-Agent": "jorunn-site/1.0 (private family site)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const EVENTS = [
  { year: 1981, commons: "Columbia.sts-1.01.jpg", slug: "columbia", title: "Romfergen Columbia", text: "Romfergen Columbia gjorde den første romferden med en gjenbrukbar romferge." },
  { year: 1983, commons: "Dr. Sally Ride in Space Shuttle cockpit on mission STS-7 (1983) with three levitating calculators HP-41C.jpg", slug: "sally-ride", title: "Sally Ride i rommet", text: "Sally Ride ble den første amerikanske kvinnen i rommet." },
  { year: 1989, commons: "Berlin-Mauerfall-3-10-November-1989.jpg", slug: "berlinmuren", title: "Berlinmuren faller", text: "Muren som delte Berlin ble åpnet 9. november, og folk strømmet over grensen." },
  { year: 1995, commons: "Eagle nebula pillars.jpg", slug: "soyler", title: "Skapelsens søyler", text: "Romteleskopet Hubble tok det berømte bildet av gass- og støvsøyler i Ørnetåken." },
  { year: 2004, commons: "PIA15038 Spirit Lander and Bonneville Crater in Color.jpg", slug: "spirit", title: "Her landet Spirit på Mars", text: "Marsroveren Spirit landet på Mars og begynte å utforske den røde planeten." },
  { year: 2017, commons: "2017 Total Solar Eclipse (NHQ201708210306).jpg", slug: "solformorkelse", title: "Total solformørkelse", text: "En total solformørkelse krysset USA fra kyst til kyst." },
  { year: 2018, commons: "2018 PyeongChang Biathlon Mass Start medalists.jpg", slug: "ol-2018", title: "Vinter-OL i Pyeongchang", text: "Vinter-OL i Sør-Korea. Norge tok flest medaljer." },
  { year: 2021, commons: "Ingenuity helicopter image just before landing after it's first flight.jpg", slug: "ingenuity", title: "Ingenuity flyr på Mars", text: "Det lille helikopteret Ingenuity gjorde det første motordrevne flyet på en annen planet." },
  { year: 2024, commons: "Olympic rings on the Eiffel Tower 2024 (5).jpg", slug: "ol-paris", title: "OL i Paris", text: "Sommer-OL i Paris, med de olympiske ringene på Eiffeltårnet." },
];

const strip = (html = "") => html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

const manifestUrl = new URL("manifest.json", dir);
const manifest = JSON.parse(readFileSync(manifestUrl, "utf8"));

for (const ev of EVENTS) {
  await sleep(4000);
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent("File:" + ev.commons)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1400&format=json`;
  const page = Object.values((await (await fetch(api, { headers: UA })).json()).query.pages)[0];
  const info = page.imageinfo?.[0];
  if (!info) { console.error(`Fant ikke ${ev.commons}`); continue; }

  const license = strip(info.extmetadata.LicenseShortName?.value);
  const artist = strip(info.extmetadata.Artist?.value);
  const free = /public domain|cc0|^cc by/i.test(license);
  if (!free) { console.error(`Hopper over ${ev.commons}: lisens «${license}»`); continue; }

  await sleep(3000);
  const res = await fetch(info.thumburl || info.url, { headers: UA });
  if (!res.ok) { console.error(`Nedlasting feilet for ${ev.commons}: ${res.status}`); continue; }
  const file = `world-${ev.year}-${ev.slug}.jpg`;
  writeFileSync(new URL(file, dir), Buffer.from(await res.arrayBuffer()));

  const credit = /public domain|cc0/i.test(license)
    ? `${artist && artist.length < 50 ? artist + ", " : ""}offentlig eie`
    : `${artist.slice(0, 50)}, ${license}`;
  const caption = `${ev.title} (${credit})`;

  if (!manifest.images.some((i) => i.file === file)) manifest.images.push({ file, title: ev.title, tags: ["world"] });
  const row = manifest.timeline.find((t) => t.year === ev.year);
  if (row) Object.assign(row, { worldImage: file, worldTitle: caption, title: row.title || ev.title, text: row.text || ev.text });
  console.log(`${ev.year}: ${file} [${license}]`);
}

writeFileSync(manifestUrl, JSON.stringify(manifest, null, 2), "utf8");
console.log("Manifest oppdatert.");
