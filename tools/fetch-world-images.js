// Bruk: node fetch-world-images.js
// Laster ned frie bilder fra Wikimedia Commons til ../content/ og kobler dem til
// riktig år på tidslinjen i ../content/manifest.json (worldImage/worldTitle/text).
// Kreditering (opphavsperson + lisens) legges i bildeteksten.
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const dir = new URL("../content/", import.meta.url);
const UA = { "User-Agent": "jorunn-site/1.0 (private family site)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const EVENTS = [
  { year: 1981, commons: "Wedding of Prince Charles and Lady Diana.jpg", slug: "kongebryllup", title: "Bryllupet til Charles og Diana", text: "Prins Charles og Lady Diana giftet seg i St Paul's Cathedral, og rundt 750 millioner så det på TV." },
  { year: 1983, commons: "Motorola DynaTAC and Samsung Galaxy Note Edge.jpg", slug: "dynatac", title: "Den første mobiltelefonen", text: "Motorola DynaTAC ble den første mobiltelefonen i salg til vanlige folk." },
  { year: 1989, commons: "Berlin-Mauerfall-3-10-November-1989.jpg", slug: "berlinmuren", title: "Berlinmuren faller", text: "Muren som delte Berlin ble åpnet 9. november, og folk strømmet over grensen." },
  { year: 1995, commons: "Windows 95 - installation disk 3 1⁄2-inch, floppy disk.jpg", slug: "windows95", title: "Windows 95", text: "Windows 95 kom med Start-knappen og gjorde PC-en til noe alle kunne bruke." },
  { year: 2004, commons: "Visit to Facebook headquarters.jpg", slug: "facebook", title: "Facebook starter", text: "Facebook ble startet av studenter ved Harvard." },
  { year: 2017, commons: "Nintendo-Switch-Console-Docked-wJoyConRB.jpg", slug: "switch", title: "Nintendo Switch", text: "Nintendo lanserte Switch, en konsoll du kan spille både på TV og på farten." },
  { year: 2018, commons: "Elon Musk's Tesla Roadster (40110297852).jpg", slug: "falcon-heavy", title: "Tesla i rommet", text: "SpaceX skjøt en Tesla Roadster ut i verdensrommet med Falcon Heavy-raketten." },
  { year: 2021, commons: "Ingenuity helicopter image just before landing after it's first flight.jpg", slug: "ingenuity", title: "Ingenuity flyr på Mars", text: "Det lille helikopteret Ingenuity gjorde det første motordrevne flyet på en annen planet." },
  { year: 2024, commons: "Olympic rings on the Eiffel Tower 2024 (5).jpg", slug: "ol-paris", title: "OL i Paris", text: "Sommer-OL i Paris, med de olympiske ringene på Eiffeltårnet." },
  { year: 1982, commons: "Philips CD 100.jpg", slug: "cd-spiller", title: "Den første CD-spilleren", text: "Den første CD-spilleren kom i salg, og musikk fikk en ny, digital form." },
  { year: 1984, commons: "Olympic torch Sarajevo 1984.jpg", slug: "ol-sarajevo", title: "OL i Sarajevo", text: "Vinter-OL ble arrangert i Sarajevo." },
  { year: 1985, commons: "Live Aid at JFK Stadium, Philadelphia, PA.jpg", slug: "live-aid", title: "Live Aid", text: "Verdens største veldedighetskonsert ble sendt fra London og Philadelphia til hele verden." },
  { year: 1992, commons: "Sms nokia.JPG", slug: "sms", title: "Den første SMS-en", text: "«Merry Christmas» ble sendt som verdens første tekstmelding." },
  { year: 1994, commons: "Lillehammer Olympic sign.jpg", slug: "ol-lillehammer", title: "OL på Lillehammer", text: "Vinter-OL på Lillehammer, med Norge som vertsnasjon." },
  { year: 2001, commons: "Wikipedia Puzzle Globe 03.jpg", slug: "wikipedia", title: "Wikipedia starter", text: "Nettleksikonet Wikipedia ble lansert." },
  { year: 2003, commons: "Human Genome Project Timeline (26964377742).jpg", slug: "genom", title: "Menneskets genom kartlagt", text: "Det menneskelige genomet ble ferdig kartlagt etter mer enn ti års arbeid." },
  { year: 2005, commons: "Pope Benedict XVI -Italy-19December2005.jpg", slug: "pave-benedikt", title: "Ny pave: Benedikt XVI", text: "Benedikt XVI ble valgt til pave etter Johannes Paul II." },
  { year: 2023, commons: "King Charles III coronation crowning.jpg", slug: "kroning", title: "Kong Charles III kronet", text: "Charles III ble kronet i Westminster Abbey." },
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
