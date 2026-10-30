import { decodePNG } from './pngdec.mjs';
const im = decodePNG('idle11.png'), W = im.w;
const px = (x, y) => { const i = (y * W + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2]]; };
const [x0, y0, x1, y1] = [22, 10, 88, 183];
// custo: soma das diferenças entre pixels vizinhos que ficam DENTRO do mesmo bloco (deve ser baixo) menos as que cruzam a borda
function cost(axis, s, ph) { let inside = 0, edge = 0, ni = 0, ne = 0; const lo = axis ? y0 : x0, hi = axis ? y1 : x1;
  for (let t = lo; t < hi; t++) { const k = (((t + 1 - ph) % s) + s) % s; const cross = k < 1; // t+1 começa novo bloco
    let sum = 0, n = 0; if (axis) for (let x = x0; x <= x1; x += 2) { const a = px(x, t), b = px(x, t + 1); sum += Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]); n++; } else for (let y = y0; y <= y1; y += 2) { const a = px(t, y), b = px(t + 1, y); sum += Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]); n++; }
    if (cross) { edge += sum / n; ne++; } else { inside += sum / n; ni++; } }
  return (edge / ne) / (inside / ni + 1); }
for (const axis of [0, 1]) { const r = []; for (let s = 2.4; s <= 4.2; s += 0.02) for (let ph = 0; ph < s; ph += 0.25) r.push({ s: +s.toFixed(2), ph, v: +cost(axis, s, ph).toFixed(2) }); r.sort((a, b) => b.v - a.v); console.log(axis ? 'y' : 'x', JSON.stringify(r.slice(0, 5))); }
