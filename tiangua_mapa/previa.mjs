// prévia das ruas de Tianguá (OpenStreetMap, só para estudo): node previa.mjs ruas_osm.json previa.png [largura]
import fs from 'node:fs'; import zlib from 'node:zlib';
const j = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), W = +(process.argv[4] || 1400), ways = j.elements.filter(e => e.type === 'way' && e.geometry);
const LAT0 = -3.7325, LON0 = -40.9930, kx = 111320 * Math.cos(LAT0 * Math.PI / 180), ky = 110574;
const P = p => [(p.lon - LON0) * kx, -(p.lat - LAT0) * ky];
const cls = { motorway: 3, trunk: 3, primary: 3, secondary: 2.5, tertiary: 2, unclassified: 1.5, residential: 1.5, living_street: 1, service: .8 };
let mx = 1e9, Mx = -1e9, my = 1e9, My = -1e9; const cont = {};
for (const w of ways) { cont[w.tags.highway] = (cont[w.tags.highway] || 0) + 1; for (const p of w.geometry) { const [x, y] = P(p); mx = Math.min(mx, x); Mx = Math.max(Mx, x); my = Math.min(my, y); My = Math.max(My, y); } }
console.log('vias:', ways.length, JSON.stringify(cont), 'extensão (m):', Math.round(Mx - mx), 'x', Math.round(My - my));
mx = -4200; Mx = 4200; my = -3100; My = 3100;
const esc = W / (Mx - mx), H = Math.ceil((My - my) * esc), img = Buffer.alloc(W * H * 4, 0); for (let i = 3; i < img.length; i += 4) img[i] = 255;
const ponto = (x, y, r, v) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (dx * dx + dy * dy > r * r + .5) continue; const X = Math.round(x) + dx, Y = Math.round(y) + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const i = (Y * W + X) * 4; img[i] = img[i + 1] = img[i + 2] = Math.max(img[i], v); } };
for (const w of ways) { const r = (cls[w.tags.highway] || 1) * .5 + .3; for (let k = 1; k < w.geometry.length; k++) { const [x0, y0] = P(w.geometry[k - 1]), [x1, y1] = P(w.geometry[k]), n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * esc)); for (let s = 0; s <= n; s++) ponto((x0 + (x1 - x0) * s / n - mx) * esc, (y0 + (y1 - y0) * s / n - my) * esc, Math.round(r), 255); } }
const raw = Buffer.alloc((W * 4 + 1) * H); for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; img.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4); }
const crc = b => { let c, t = crc.t || (crc.t = Array.from({ length: 256 }, (_, n) => { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; })); let r = 0xffffffff; for (const v of b) r = t[(r ^ v) & 255] ^ (r >>> 8); return (r ^ 0xffffffff) >>> 0; };
const ch = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 6;
fs.writeFileSync(process.argv[3], Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch('IHDR', ih), ch('IDAT', zlib.deflateSync(raw)), ch('IEND', Buffer.alloc(0))]));
