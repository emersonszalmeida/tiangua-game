// Extrai do osm.json só a área do centro (print do dono) em metros locais -> area.js
import fs from 'node:fs';
const osm = JSON.parse(fs.readFileSync('osm.json', 'utf8'));
const S = -3.7410, N = -3.7230, W = -41.0010, E = -40.9830;
const lat0 = (S + N) / 2, mLat = 111320, mLon = 111320 * Math.cos(lat0 * Math.PI / 180);
const T = 3, OX = 262 * T, OZ = 200 * T, SX = 154 * T, SZ = 152 * T;
const loc = p => [Math.round(((p.lon - W) * mLon - OX) * 10) / 10, Math.round(((N - p.lat) * mLat - OZ) * 10) / 10];
const M = 40;
const near = pts => pts.some(p => p[0] > -M && p[0] < SX + M && p[1] > -M && p[1] < SZ + M);
const roads = [], greens = [], churches = [];
const stats = {};
for (const w of osm.elements) {
  if (w.type !== 'way' || !w.geometry) continue;
  const t = w.tags || {}, pts = w.geometry.map(loc);
  if (!near(pts)) continue;
  if (t.highway && t.area !== 'yes') {
    roads.push({ k: t.highway, n: t.name || '', s: t.surface || '', l: +t.lanes || 0, o: t.oneway === 'yes' ? 1 : 0, p: pts });
    const key = t.highway + '/' + (t.surface || '?'); stats[key] = (stats[key] || 0) + 1;
  } else if (t.leisure === 'park' || t.leisure === 'garden' || t.landuse === 'grass' || t.landuse === 'recreation_ground' || t.amenity === 'marketplace' || t.place === 'square')
    greens.push({ k: t.leisure || t.landuse || t.amenity || t.place, n: t.name || '', p: pts });
  else if (t.building && /igreja|catedral|matriz/i.test(t.name || '')) churches.push({ n: t.name, p: pts });
}
console.log({ roads: roads.length, greens: greens.length, churches: churches.length, SX, SZ });
console.log(stats);
console.log(greens.map(g => g.k + ':' + g.n).join(' | '));
console.log([...new Set(roads.map(r => r.n).filter(Boolean))].join(' | '));
fs.writeFileSync('area.js', 'window.AREA=' + JSON.stringify({ sx: SX, sz: SZ, roads, greens, churches }) + ';');
console.log('area.js', (fs.statSync('area.js').size / 1024) | 0, 'KB');
