import { decodeGIF } from './gifdec.mjs';
const im = decodeGIF('sheet7.gif'), W = im.w, H = im.h; console.log(W, H, 'frames', im.frames);
const px = (x, y) => { const i = (y * W + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2], im.data[i + 3]]; };
console.log('bg', px(2, 2), px(300, 390));
const bg = px(2, 2), dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const fg = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) fg[y * W + x] = dist(px(x, y), bg) > 24 ? 1 : 0;
// componentes com dilatação (junta partes soltas)
const lab = new Int32Array(W * H), boxes = []; let n = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (fg[y * W + x] && !lab[y * W + x]) {
  n++; const st = [[x, y]]; lab[y * W + x] = n; let a = x, b = x, c = y, d = y, cnt = 0;
  while (st.length) { const [cx, cy] = st.pop(); cnt++; a = Math.min(a, cx); b = Math.max(b, cx); c = Math.min(c, cy); d = Math.max(d, cy);
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const X = cx + dx, Y = cy + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const k = Y * W + X; if (fg[k] && !lab[k]) { lab[k] = n; st.push([X, Y]); } } }
  if (cnt > 40) boxes.push([a, c, b, d, cnt]);
}
boxes.sort((p, q) => p[1] - q[1] || p[0] - q[0]);
boxes.forEach((b, i) => console.log(i, b.join(','), 'tam', b[2] - b[0] + 1, 'x', b[3] - b[1] + 1));
