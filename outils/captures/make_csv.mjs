// Génère un export CSV fictif d'une zone (mode Évolution) pour les captures du site.
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
const rand = makeRandom(4242);
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-9))) * Math.cos(2 * Math.PI * rand());

const DAY = 86400000;
const START = Date.UTC(2003, 5, 1);
const END = Date.UTC(2026, 8, 30);
const BOX = { latMin: 44.75, latMax: 46.45, lonMin: 2.1, lonMax: 4.4 };
const TOWNS = [
  [45.78, 3.08, 'Puy-de-Dôme', 9], [45.04, 3.88, 'Haute-Loire', 4], [44.93, 2.44, 'Cantal', 3],
  [46.12, 3.42, 'Allier', 4], [45.55, 3.25, 'Puy-de-Dôme', 3], [45.85, 3.55, 'Puy-de-Dôme', 3],
  [45.43, 4.39, 'Loire', 6], [46.34, 2.6, 'Allier', 3], [45.3, 2.7, 'Cantal', 2], [45.6, 2.75, 'Puy-de-Dôme', 2],
];
const TYPES = [['Traditionnelle', 70], ['Cache Mystère', 14], ['Multi-cache', 9], ['Earthcache', 3], ['Letterbox Hybride', 2], ['Virtuelle', 1], ['Wherigo', 1]];
const pickType = () => {
  let r = rand() * 100;
  for (const [name, w] of TYPES) if ((r -= w) <= 0) return name;
  return TYPES[0][0];
};
const half = () => 1 + Math.floor(Math.pow(rand(), 1.7) * 9) / 2;
// Zone aux contours irréguliers (pas un rectangle) : rayon polaire ondulé.
const inBox = (lat, lon) => {
  const dy = (lat - 45.6) / 0.85;
  const dx = (lon - 3.25) / 1.15;
  const theta = Math.atan2(dy, dx);
  const radius = 1 + 0.13 * Math.sin(3 * theta + 0.7) + 0.08 * Math.sin(5 * theta + 2.1) + 0.05 * Math.sin(9 * theta);
  return Math.hypot(dx, dy) < radius;
};
const dept = (lat, lon) => {
  let best = TOWNS[0];
  for (const town of TOWNS) {
    if (Math.hypot(town[0] - lat, (town[1] - lon) * 0.7) < Math.hypot(best[0] - lat, (best[1] - lon) * 0.7)) best = town;
  }
  return best[2];
};
// Les poses s'accélèrent jusqu'au milieu des années 2010, puis se tassent.
const placedDate = () => {
  for (;;) {
    const u = rand();
    const year = 2003.4 + u * 23.3;
    const density = year < 2016 ? Math.pow((year - 2003) / 13, 1.6) : 1 - (year - 2016) * 0.045;
    if (rand() < density) return START + u * (END - START);
  }
};

const caches = [];
const add = (lat, lon, t) => { if (inBox(lat, lon)) caches.push({ lat, lon, t }); };

const townWeight = TOWNS.reduce((sum, town) => sum + town[3], 0);
for (let i = 0; i < 3600; i++) {
  let r = rand() * townWeight;
  let town = TOWNS[0];
  for (const candidate of TOWNS) { if ((r -= candidate[3]) <= 0) { town = candidate; break; } }
  const spread = rand() < 0.6 ? 0.05 : 0.17;
  add(town[0] + gauss() * spread, town[1] + gauss() * spread * 1.4, placedDate());
}
for (let i = 0; i < 1500; i++) {
  add(BOX.latMin + rand() * (BOX.latMax - BOX.latMin), BOX.lonMin + rand() * (BOX.lonMax - BOX.lonMin), placedDate());
}
// Séries : des caches alignées le long d'un chemin, posées en quelques jours.
for (let s = 0; s < 70; s++) {
  let lat = BOX.latMin + 0.1 + rand() * (BOX.latMax - BOX.latMin - 0.2);
  let lon = BOX.lonMin + 0.1 + rand() * (BOX.lonMax - BOX.lonMin - 0.2);
  let heading = rand() * Math.PI * 2;
  const t0 = placedDate();
  const n = 12 + Math.floor(rand() * 45);
  for (let i = 0; i < n; i++) {
    heading += gauss() * 0.35;
    lat += Math.cos(heading) * 0.0035;
    lon += Math.sin(heading) * 0.005;
    add(lat, lon, t0 + rand() * 4 * DAY);
  }
}

caches.sort((a, b) => a.t - b.t);
const day = (ms) => new Date(ms).toISOString().slice(0, 10);
const header = ',"GC code","Nom de la géocache",Type,Taille,Difficulté,Terrain,Propriétaire,"Placée par",Pays,Région,Département,Coordonnées,"Coordonnées corrigées",Latitude,Longitude,"Elévation (m)","Date de placement","Date de dernière publication","Date de dernière trouvaille","Dernière date d\'archivage","Derniers logs",Trouvées,PF,PF%,"PF Wilson",Archivée,Verrouillée,Désactivée,Premium,Challenge,"Latitude corrigée","Longitude corrigée","Note de géocache","Ajouté par",Ajouté,Source,"Note 1","Note 2","Note 3","Note 4","Note 5"';
const rows = caches.map((c, i) => {
  const life = -Math.log(Math.max(rand(), 1e-9)) * 7.5 * 365 * DAY;
  const archivedAt = c.t + 60 * DAY + life;
  const archived = archivedAt < END;
  const code = 'GCD' + (i + 1).toString(36).toUpperCase().padStart(4, '0');
  const size = ['Micro', 'Petite', 'Normale', 'Autre'][Math.floor(rand() * 4)];
  return `,${code},Cache de démonstration ${i + 1},${pickType()},${size},${half()},${half()},Démo,Démo,France,Auvergne-Rhône-Alpes,${dept(c.lat, c.lon)},,,${c.lat.toFixed(5)},${c.lon.toFixed(5)},,${day(c.t)},${day(c.t)},,${archived ? day(archivedAt) : ''},,,,,,${archived},false,false,false,false,,,,Démo,2026-09-30 10:00:00,démo,,,,,`;
});
writeFileSync(process.argv[2], '﻿' + header + '\n' + rows.join('\n') + '\n');
console.log(caches.length, 'caches');
