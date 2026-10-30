import fs from 'node:fs';
const osm = JSON.parse(fs.readFileSync('osm.json', 'utf8'));
const S = -3.7410, N = -3.7230, W = -41.0010, E = -40.9830;
const T = 3; // metros por tile
const lat0 = (S + N) / 2;
const mLat = 111320, mLon = 111320 * Math.cos(lat0 * Math.PI / 180);
const wM = (E - W) * mLon, hM = (N - S) * mLat;
const GW = Math.ceil(wM / T), GH = Math.ceil(hM / T);
const g = new Uint8Array(GW * GH); // bits 0-2 tipo, 3-7 altura
const GROUND = 0, ROAD = 1, BUILD = 3, GRASS = 4, PLAZA = 5;
const toG = p => [(p.lon - W) * mLon / T, (N - p.lat) * mLat / T];
const hash = id => { let h = id * 2654435761 % 4294967296; return (h >>> 8) & 255; };

function fillPoly(pts, fn) {
  let minY = Infinity, maxY = -Infinity;
  for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
  for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(GH - 1, Math.ceil(maxY)); y++) {
    const cy = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= cy && b[1] > cy) || (b[1] <= cy && a[1] > cy))
        xs.push(a[0] + (cy - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
    }
    xs.sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i += 2)
      for (let x = Math.max(0, Math.round(xs[i])); x < Math.min(GW, Math.round(xs[i + 1])); x++) fn(x, y);
  }
}
function stamp(cx, cy, r, v) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
      if (x >= 0 && y >= 0 && x < GW && y < GH && (x + .5 - cx) ** 2 + (y + .5 - cy) ** 2 <= r * r) {
        const t = g[y * GW + x] & 7;
        if (t !== BUILD) g[y * GW + x] = v;
      }
}
const widths = { motorway: 10, trunk: 10, primary: 9, secondary: 8, tertiary: 7, residential: 6, unclassified: 6, living_street: 5, service: 3.5, pedestrian: 5, footway: 2, path: 2, steps: 2, track: 3, cycleway: 2 };
const ways = osm.elements.filter(e => e.type === 'way' && e.geometry);
// 1) áreas verdes / praças
for (const w of ways) {
  const t = w.tags || {};
  const pts = w.geometry.map(toG);
  if (t.leisure === 'park' || t.leisure === 'garden' || t.landuse === 'grass' || t.landuse === 'recreation_ground' || t.leisure === 'pitch')
    fillPoly(pts, (x, y) => { g[y * GW + x] = GRASS; });
  if (t.amenity === 'marketplace' || t.place === 'square' || t.highway === 'pedestrian' && t.area === 'yes')
    fillPoly(pts, (x, y) => { g[y * GW + x] = PLAZA; });
}
// 2) ruas
for (const w of ways) {
  const t = w.tags || {};
  if (!t.highway || t.area === 'yes') continue;
  const r = (widths[t.highway] ?? 5) / T / 2;
  const pts = w.geometry.map(toG);
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 0.4));
    for (let k = 0; k <= n; k++) stamp(x1 + (x2 - x1) * k / n, y1 + (y2 - y1) * k / n, Math.max(r, 0.7), ROAD);
  }
}
// 3) prédios (por cima)
let nb = 0;
for (const w of ways) {
  const t = w.tags || {};
  if (!t.building) continue;
  nb++;
  const lv = parseInt(t['building:levels']);
  let h = lv > 0 ? Math.min(lv, 6) : 1 + (hash(w.id) % 100 < 20 ? 1 : 0);
  const pts = w.geometry.map(toG);
  fillPoly(pts, (x, y) => { g[y * GW + x] = BUILD | (h << 3); });
}
const roads = g.reduce((a, v) => a + ((v & 7) === ROAD), 0);
console.log({ GW, GH, nb, roads });
// nomes de ruas (pontos amostrados) e de lugares
const streets = [], places = [];
for (const w of ways) {
  const t = w.tags || {};
  if (!t.name) continue;
  const pts = w.geometry.map(toG);
  if (t.highway) {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 8));
      for (let k = 0; k < n; k++) streets.push([Math.round(x1 + (x2 - x1) * k / n), Math.round(y1 + (y2 - y1) * k / n), t.name]);
    }
  } else {
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    places.push([Math.round(cx), Math.round(cy), t.name]);
  }
}
console.log({ streets: streets.length, places: places.length, ruasComNome: new Set(streets.map(s => s[2])).size });
console.log(places.map(p => p[2]).join(' | '));
fs.writeFileSync('map.js', `window.MAP={w:${GW},h:${GH},t:${T},streets:${JSON.stringify(streets)},places:${JSON.stringify(places)},b64:"${Buffer.from(g).toString('base64')}"};`);
console.log('map.js', (fs.statSync('map.js').size / 1024) | 0, 'KB');
