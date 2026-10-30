import { decodeJPG } from './jpgdec.mjs';
const im = decodeJPG(process.argv[2]), W = im.w, H = im.h;
const px = (x, y) => { const i = (y * W + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2]]; };
console.log('bg samples', px(20, 300), px(1000, 300), px(500, 450), px(20, 900), px(1000, 900));
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const bg = px(500, 450);
// regiões
const regs = { frente: [150, 60, 520, 520], perfil: [640, 60, 880, 520], costas: [360, 560, 740, 1024] };
for (const [n, [x0, y0, x1, y1]] of Object.entries(regs)) {
  let a = W, b = 0, c = H, d = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (dist(px(x, y), bg) > 60) { a = Math.min(a, x); b = Math.max(b, x); c = Math.min(c, y); d = Math.max(d, y); }
  console.log(n, 'bbox', a, c, b, d, 'tam', b - a + 1, 'x', d - c + 1);
}
