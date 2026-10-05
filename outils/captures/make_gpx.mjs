// Génère un « My Finds » entièrement fictif pour les captures du site.
import { writeFileSync } from 'node:fs';

function makeRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = makeRandom(20261005);
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-9))) * Math.cos(2 * Math.PI * rand());

const TYPES = [
  ['Traditional Cache', 62], ['Unknown Cache', 17], ['Multi-cache', 9], ['Earthcache', 4],
  ['Letterbox Hybrid', 3], ['Virtual Cache', 2], ['Wherigo Cache', 2], ['Event Cache', 1],
];
const pickType = () => {
  let r = rand() * 100;
  for (const [name, w] of TYPES) if ((r -= w) <= 0) return name;
  return TYPES[0][0];
};
const half = () => (1 + Math.floor(Math.pow(rand(), 1.7) * 9) / 2).toFixed(1);

const DAY = 86400000;
const START = Date.UTC(2016, 3, 9);
const END = Date.UTC(2026, 7, 30);
const finds = [];
const add = (lat, lon, t, country, state) => finds.push({ lat, lon, t, country, state });

// Autour de chez soi (Touraine, fictif) : sorties d'une journée, 1 à 9 caches.
const HOME = [47.36, 0.72];
let t = START;
while (t < END) {
  const progress = (t - START) / (END - START);
  t += (2 + rand() * (26 - 14 * progress)) * DAY;
  const far = rand() < 0.3;
  const cLat = HOME[0] + gauss() * (far ? 0.75 : 0.16);
  const cLon = HOME[1] + gauss() * (far ? 1.1 : 0.24);
  const n = 1 + Math.floor(Math.pow(rand(), 2) * 9);
  for (let i = 0; i < n; i++) {
    add(cLat + gauss() * 0.02, cLon + gauss() * 0.03, t + i * 1200000, 'France', 'Centre-Val de Loire');
  }
}

// Séjours : grappes serrées dans le temps et l'espace.
const TRIPS = [
  [48.05, -2.85, 'France', 'Bretagne', 2016.6], [45.9, 6.35, 'France', 'Auvergne-Rhône-Alpes', 2017.1],
  [50.6, 4.6, 'Belgium', 'Brabant wallon', 2017.4], [42.95, 0.15, 'France', 'Occitanie', 2017.6],
  [48.3, 7.4, 'France', 'Grand Est', 2018.3], [49.15, -0.45, 'France', 'Normandie', 2018.8],
  [41.75, 2.1, 'Spain', 'Cataluña', 2019.3], [45.5, 3.0, 'France', 'Auvergne-Rhône-Alpes', 2019.6],
  [48.15, 11.45, 'Germany', 'Bayern', 2021.6], [43.85, 5.2, 'France', "Provence-Alpes-Côte d'Azur", 2022.3],
  [43.6, 11.1, 'Italy', 'Toscana', 2022.7], [46.8, 7.6, 'Switzerland', 'Bern', 2023.6],
  [51.45, -0.35, 'United Kingdom', 'London', 2024.3], [46.1, 14.6, 'Slovenia', 'Osrednjeslovenska', 2024.7],
  [44.85, -0.6, 'France', 'Nouvelle-Aquitaine', 2025.4], [52.35, 4.9, 'Netherlands', 'Noord-Holland', 2025.8],
  [47.25, -1.6, 'France', 'Pays de la Loire', 2026.3],
];
for (const [lat, lon, country, state, year] of TRIPS) {
  const t0 = Date.UTC(Math.floor(year), Math.round((year % 1) * 12), 3 + Math.floor(rand() * 20));
  const days = 3 + Math.floor(rand() * 6);
  for (let d = 0; d < days; d++) {
    const cLat = lat + gauss() * 0.13;
    const cLon = lon + gauss() * 0.19;
    const n = 3 + Math.floor(rand() * 8);
    for (let i = 0; i < n; i++) {
      add(cLat + gauss() * 0.018, cLon + gauss() * 0.026, t0 + d * DAY + i * 1500000, country, state);
    }
  }
}

finds.sort((a, b) => a.t - b.t);
const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, 'Z');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/'/g, '&apos;');
const wpts = finds.map((f, i) => {
  const type = pickType();
  const code = 'GCDEMO' + (i + 1).toString(36).toUpperCase().padStart(3, '0');
  const found = iso(f.t + 10 * 3600000);
  const placed = iso(f.t - (200 + Math.floor(rand() * 2000)) * DAY);
  const logType = type === 'Event Cache' ? 'Attended' : 'Found it';
  const name = `Cache de démonstration ${i + 1}`;
  return `  <wpt lat="${f.lat.toFixed(5)}" lon="${f.lon.toFixed(5)}"><time>${placed}</time><name>${code}</name><urlname>${name}</urlname>`
    + `<groundspeak:cache><groundspeak:name>${name}</groundspeak:name><groundspeak:type>${type}</groundspeak:type>`
    + `<groundspeak:container>${['Micro', 'Small', 'Regular', 'Other'][Math.floor(rand() * 4)]}</groundspeak:container>`
    + `<groundspeak:difficulty>${half()}</groundspeak:difficulty><groundspeak:terrain>${half()}</groundspeak:terrain>`
    + `<groundspeak:country>${f.country}</groundspeak:country><groundspeak:state>${esc(f.state)}</groundspeak:state>`
    + `<groundspeak:logs><groundspeak:log><groundspeak:date>${found}</groundspeak:date><groundspeak:type>${logType}</groundspeak:type></groundspeak:log></groundspeak:logs>`
    + `</groundspeak:cache></wpt>`;
});

const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.0" creator="Groundspeak Pocket Query"
     xmlns="http://www.topografix.com/GPX/1/0"
     xmlns:groundspeak="http://www.groundspeak.com/cache/1/0/1">
  <name>My Finds Pocket Query - démonstration MyGCFlow</name>
  <desc>Données fictives pour les captures du site</desc>
  <author>Groundspeak</author>
${wpts.join('\n')}
</gpx>
`;
writeFileSync(process.argv[2], gpx);
console.log(finds.length, 'caches');
