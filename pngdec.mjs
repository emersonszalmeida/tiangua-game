// Decodificador mínimo de PNG (8 bits, sem entrelaçamento) -> {w,h,data RGBA}
import fs from 'node:fs';
import zlib from 'node:zlib';
export function decodePNG(file) {
  const b = fs.readFileSync(file); let p = 8, w, h, ct, bd; const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), type = b.toString('ascii', p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bd = d[8]; ct = d[9]; if (d[12]) throw new Error('entrelaçado'); }
    else if (type === 'IDAT') idat.push(d); else if (type === 'IEND') break;
    p += 12 + len;
  }
  if (bd !== 8) throw new Error('só 8 bits');
  const bpp = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ct], raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[y * stride + x - bpp] : 0, up = y ? out[(y - 1) * stride + x] : 0, c = x >= bpp && y ? out[(y - 1) * stride + x - bpp] : 0;
      let v = src[x];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const pp = a + up - c, pa = Math.abs(pp - a), pb = Math.abs(pp - up), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? up : c); }
      out[y * stride + x] = v & 255;
    }
  }
  const data = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    if (ct === 6) { data[i * 4] = out[i * 4]; data[i * 4 + 1] = out[i * 4 + 1]; data[i * 4 + 2] = out[i * 4 + 2]; data[i * 4 + 3] = out[i * 4 + 3]; }
    else if (ct === 2) { data[i * 4] = out[i * 3]; data[i * 4 + 1] = out[i * 3 + 1]; data[i * 4 + 2] = out[i * 3 + 2]; data[i * 4 + 3] = 255; }
    else throw new Error('tipo de cor ' + ct + ' não suportado');
  }
  return { w, h, data };
}
if (process.argv[1].endsWith('pngdec.mjs') && process.argv[2]) {
  const im = decodePNG(process.argv[2]);
  console.log(im.w + 'x' + im.h);
  const px = (x, y) => [...im.data.subarray((y * im.w + x) * 4, (y * im.w + x) * 4 + 3)];
  console.log('fundo', px(20, 20), px(1200, 100), 'linha ciano', px(600, 689));
}
