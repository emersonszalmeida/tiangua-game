import { decodePNG } from './pngdec.mjs';
const im = decodePNG('draw12.png'), W = im.w; const g = (x, y) => im.data[(y * W + x) * 4];
let s = ''; for (let x = 90; x < 170; x++) s += g(x, 640) + ' '; console.log('row640:', s);
s = ''; for (let y = 600; y < 680; y++) s += g(130, y) + ' '; console.log('col130:', s);
