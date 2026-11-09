// Bruk: node fetch-world-images.js
// Laster ned frie bilder fra Wikimedia Commons til ../content/ og kobler dem til
// riktig år på tidslinjen i ../content/manifest.json (worldImage/worldTitle/text).
// Kreditering (opphavsperson + lisens) legges i bildeteksten.
import { writeFileSync, readFileSync, existsSync } from "node:fs";

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
  { year: 1982, commons: "Philips CD 100.jpg", slug: "cd-spiller", title: "Den første CD-spilleren", text: "Den første CD-spilleren kom i salg, og musikk fikk en ny, digital form." },
  { year: 1984, commons: "Bruce McCandless II during EVA in 1984.jpg", slug: "mccandless", title: "Svevende fritt i rommet", text: "Astronaut Bruce McCandless svevde fritt i rommet uten line til romfergen." },
  { year: 1985, commons: "Titanic wreck bow.jpg", slug: "titanic", title: "Titanic-vraket funnet", text: "Vraket av Titanic ble funnet på 3800 meters dyp, 73 år etter forliset." },
  { year: 1992, commons: "Barcelona - Montjuïc - Anella Olímpica - 1992 Summer Olympics site - View West on Torre de comunicacions de Montjuïc 1992 by Santiago Calatrava.jpg", slug: "ol-barcelona", title: "OL i Barcelona", text: "Sommer-OL ble arrangert i Barcelona." },
  { year: 1994, commons: "Lillehammer Olympic sign.jpg", slug: "ol-lillehammer", title: "OL på Lillehammer", text: "Vinter-OL på Lillehammer, med Norge som vertsnasjon." },
  { year: 2001, commons: "International Space Station (ISS) (March 18 2001).jpeg", slug: "iss", title: "Romstasjonen ISS vokser", text: "Den internasjonale romstasjonen ble bygget ut med nye moduler." },
  { year: 2003, commons: "Concorde 216 (G-BOAF) last flight.jpg", slug: "concorde", title: "Concorde flyr for siste gang", text: "Overlydsflyet Concorde ble tatt ut av drift etter nesten 30 år." },
  { year: 2005, commons: "Cassini Huygens Titan.jpg", slug: "huygens", title: "Huygens lander på Titan", text: "Romsonden Huygens landet på Saturns måne Titan." },
  { year: 2023, commons: "Webb Space Telescope Studies the Pillars of Creation (SVS31286 - 52920269941 1ba1867758 o-hwres).jpg", slug: "webb-soyler", title: "Webb ser Skapelsens søyler", text: "Romteleskopet James Webb tok nye bilder av Skapelsens søyler, 28 år etter Hubble." },
  { year: 2025, commons: "Pope Leo XIV on the loggia.jpg", slug: "pave-leo", title: "Ny pave", text: "Pave Leo XIV ble valgt som ny pave." },
];

const strip = (html = "") => html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

const manifestUrl = new URL("manifest.json", dir);
const manifest = JSON.parse(readFileSync(manifestUrl, "utf8"));

for (const ev of EVENTS) {
  if (existsSync(new URL(`world-${ev.year}-${ev.slug}.jpg`, dir))) continue; // allerede hentet
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
