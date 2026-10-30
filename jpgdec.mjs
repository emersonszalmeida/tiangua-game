import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export function decodeJPG(file) { const j = require('jpeg-js'); const d = j.decode(fs.readFileSync(file), { useTArray: true }); return { w: d.width, h: d.height, data: d.data }; }
