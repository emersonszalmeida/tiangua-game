import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export function decodeGIF(file) { const { GifReader } = require('omggif'); const r = new GifReader(fs.readFileSync(file)); const w = r.width, h = r.height, data = new Uint8Array(w * h * 4); r.decodeAndBlitFrameRGBA(0, data); return { w, h, data, frames: r.numFrames() }; }
