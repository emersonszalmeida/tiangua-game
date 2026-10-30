import fs from 'node:fs'; import { createRequire } from 'node:module'; import { encodePNG } from './pngenc.mjs';
const require = createRequire(import.meta.url); const { GifReader } = require('omggif');
const r = new GifReader(fs.readFileSync('sheet7.gif')), W = r.width, H = r.height;
const boxes = [[18,74,65,183],[96,74,131,181],[168,74,199,181],[270,74,309,189],[356,76,405,189],[436,80,477,185],[514,80,559,179],[58,198,99,305],[126,200,173,305],[358,210,413,309],[260,212,307,327],[520,212,573,309],[442,214,493,309]];
const frames = []; for (let i = 0; i < 8; i++) { const b = new Uint8Array(W * H * 4); r.decodeAndBlitFrameRGBA(i, b); frames.push(b); }
const [a, b2, out] = [+process.argv[2], +process.argv[3], process.argv[4]];
const CW = 70, CH = 130, rows = b2 - a + 1, OW = CW * 8, OH = CH * rows, o = new Uint8Array(OW * OH * 4).fill(60); for (let i = 3; i < o.length; i += 4) o[i] = 255;
for (let k = a; k <= b2; k++) for (let f = 0; f < 8; f++) { const [x0, y0, x1, y1] = boxes[k]; for (let y = y0 - 6; y <= y1 + 6; y++) for (let x = x0 - 6; x <= x1 + 6; x++) { const ox = f * CW + 4 + (x - x0 + 6), oy = (k - a) * CH + 4 + (y - y0 + 6); if (ox >= OW || oy >= OH || x < 0 || y < 0) continue; const s = (y * W + x) * 4, d = (oy * OW + ox) * 4; o[d] = frames[f][s]; o[d + 1] = frames[f][s + 1]; o[d + 2] = frames[f][s + 2]; } }
fs.writeFileSync(out, encodePNG(OW, OH, o));
