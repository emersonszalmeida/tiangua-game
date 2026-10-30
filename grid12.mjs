import { decodePNG } from './pngdec.mjs';
const im = decodePNG('draw12.png'), W = im.w, H = im.h;
const px = (x, y) => { const i = (y * W + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2]]; };
console.log(W, H, 'bg', px(5, 40), px(300, 700), px(180, 400));
// linhas de grade: colunas/linhas cujo valor difere do vizinho de forma regular
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const row = 40, col = 5; let s = ''; for (let x = 0; x < 80; x++) s += dist(px(x, 300), px(x + 1, 300)) > 3 ? x + ' ' : ''; console.log('transições linha 300:', s);
