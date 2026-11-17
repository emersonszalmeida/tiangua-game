// Skin do personagem pela API do PixelLab, em cima dos quadros que já existem em personagem/ (as poses e a animação são as nossas).
// Chave: variável PIXELLAB_SECRET ou arquivo .pixellab_secret nesta pasta (está no .gitignore).
//
// 1) conceito: edita as 5 poses paradas com um prompt (edit-images-v2)
//    node pl_skin.mjs conceito <nome> ["prompt"] [seed]
//    -> skins/<nome>/conceito/{S,SW,W,NW,N}.png + _conceito.png (ampliado, para conferir)
// 2) animar: veste a roupa do conceito nos quadros de andar e correr de cada vista (transfer-outfit-v2)
//    node pl_skin.mjs animar <nome> [andar|correr|tudo] [vista]
//    -> skins/<nome>/{andar,correr}/<vista>/<quadro>.png
// Quadros vão para a API em 64×64 (os 48×64 de personagem/ com 8 px de margem de cada lado) e voltam em 64×64.
import fs from 'node:fs';
import path from 'node:path';
import { decodePNG } from './pngdec.mjs';
import { encodePNG } from './pngenc.mjs';

const KEY = process.env.PIXELLAB_SECRET || (fs.existsSync('.pixellab_secret') ? fs.readFileSync('.pixellab_secret', 'utf8').trim() : '');
if (!KEY) { console.error('Falta a chave: crie o arquivo .pixellab_secret com o token da API do PixelLab.'); process.exit(1); }
const API = 'https://api.pixellab.ai/v2', HD = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const VIEWS = ['S', 'SW', 'W', 'NW', 'N'], N = 64;
const VISTA_TXT = { S: 'facing the viewer (front view)', SW: 'three-quarter front view, facing down-left', W: 'side view facing left', NW: 'three-quarter back view, facing up-left', N: 'seen from behind (back view)' };
const PROMPT = 'cyberpunk street mercenary outfit: black techwear jacket with high collar and glowing neon cyan trim lines, ' +
  'small glowing cyan visor over the eyes, cybernetic metal left arm with cyan light seams, dark grey cargo pants with straps and knee pads, ' +
  'chunky black sneakers with glowing magenta soles. Keep the same man: same short brown hair, same beard, same body proportions, same pose. ' +
  'Clean pixel art, dark 1px outline, limited palette, no background';

// ---- imagens ----
const pad64 = file => { const im = decodePNG(file), o = new Uint8Array(N * N * 4), ox = (N - im.w) >> 1, oy = N - im.h;
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) for (let k = 0; k < 4; k++) o[((y + oy) * N + x + ox) * 4 + k] = im.data[(y * im.w + x) * 4 + k];
  return o; };
const b64 = rgba => Buffer.from(encodePNG(N, N, rgba)).toString('base64');
const img = rgba => ({ image: { type: 'base64', base64: b64(rgba), format: 'png' }, width: N, height: N });
// a resposta pode trazer PNG em base64 ou bytes RGBA crus; devolve sempre RGBA 64×64
function rgbaDe(o) {
  const raw = Buffer.from(String(o.base64).replace(/^data:[^,]+,/, ''), 'base64');
  if (o.type === 'rgba_bytes' || raw[0] !== 0x89) return new Uint8Array(raw);
  const f = path.join(process.env.TEMP || '.', 'pl_tmp_' + process.pid + '.png'); fs.writeFileSync(f, raw); const im = decodePNG(f); fs.unlinkSync(f); return im.data;
}
const achaImagens = r => { const out = []; (function walk(v) { if (!v || typeof v !== 'object') return; if (typeof v.base64 === 'string') { out.push(v); return; } for (const x of Array.isArray(v) ? v : Object.values(v)) walk(x); })(r); return out; };

// ---- API ----
async function job(endpoint, body) {
  const r = await fetch(`${API}/${endpoint}`, { method: 'POST', headers: HD, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (r.status !== 200 && r.status !== 202) throw new Error(`${endpoint}: HTTP ${r.status} ${JSON.stringify(j).slice(0, 400)}`);
  const id = j.background_job_id || j.job_id || j.id; if (!id) return j;
  process.stdout.write(`  ${endpoint} job ${id} `);
  for (let i = 0; i < 120; i++) {
    await new Promise(s => setTimeout(s, 5000));
    const s = await (await fetch(`${API}/background-jobs/${id}`, { headers: HD })).json();
    if (s.status === 'completed') { console.log('ok'); return s.last_response || s; }
    if (s.status === 'failed') throw new Error('falhou: ' + JSON.stringify(s).slice(0, 400));
    process.stdout.write('.');
  }
  throw new Error('demorou demais');
}
const saldo = async () => { try { const r = await (await fetch(`${API}/balance`, { headers: HD })).json(); return JSON.stringify(r); } catch { return '?'; } };

// folha ampliada para conferir (fundo xadrez), linhas de imagens RGBA 64×64
function folha(file, linhas, Z = 4) {
  const C = Math.max(...linhas.map(l => l.length)), W = C * N * Z, H = linhas.length * N * Z, o = new Uint8Array(W * H * 4);
  linhas.forEach((l, r) => { for (let c = 0; c < C; c++) for (let y = 0; y < N * Z; y++) for (let x = 0; x < N * Z; x++) {
    const p = ((r * N * Z + y) * W + c * N * Z + x) * 4, sx = (x / Z) | 0, sy = (y / Z) | 0, b = l[c], q = (sy * N + sx) * 4, bg = ((sx >> 2) + (sy >> 2)) % 2 ? 200 : 222;
    const a = b ? b[q + 3] / 255 : 0; for (let k = 0; k < 3; k++) o[p + k] = Math.round((b ? b[q + k] : 0) * a + bg * (1 - a)); o[p + 3] = 255; } });
  fs.writeFileSync(file, encodePNG(W, H, o));
}
const salva = (file, rgba) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, encodePNG(N, N, rgba)); };

// ---- comandos ----
const [, , cmd, nome = 'cyberpunk', a3, a4] = process.argv, DIR = path.join('skins', nome);
if (cmd === 'conceito') {
  const prompt = a3 || PROMPT, seed = a4 ? +a4 : undefined;
  console.log('saldo antes:', await saldo());
  const orig = VIEWS.map(v => pad64(`personagem/parado/${v}.png`));
  const res = await job('edit-images-v2', { method: 'edit_with_text', edit_images: orig.map(img), image_size: { width: N, height: N }, description: prompt, no_background: true, ...(seed !== undefined && { seed }) });
  const ims = achaImagens(res).map(rgbaDe); if (ims.length < VIEWS.length) throw new Error('vieram ' + ims.length + ' imagens: ' + JSON.stringify(res).slice(0, 300));
  VIEWS.forEach((v, i) => salva(path.join(DIR, 'conceito', v + '.png'), ims[i]));
  fs.writeFileSync(path.join(DIR, 'conceito', 'prompt.txt'), prompt + (seed !== undefined ? `\nseed ${seed}` : '') + '\n');
  folha(path.join(DIR, '_conceito.png'), [orig, ims.slice(0, 5)]);
  console.log('conceito em', DIR, '| saldo depois:', await saldo());
} else if (cmd === 'animar') {
  const quais = !a3 || a3 === 'tudo' ? ['andar', 'correr'] : [a3], vistas = a4 ? [a4] : VIEWS;
  console.log('saldo antes:', await saldo());
  for (const v of vistas) {
    const ref = decodePNG(path.join(DIR, 'conceito', v + '.png')).data, linhas = [];
    for (const m of quais) {
      const orig = [...Array(8).keys()].map(i => pad64(`personagem/${m}/${v}/${i}.png`));
      const res = await job('transfer-outfit-v2', { reference_image: { image: { type: 'base64', base64: b64(ref), format: 'png' }, size: { width: N, height: N } },
        frames: orig.map(o => ({ image: { type: 'base64', base64: b64(o), format: 'png' }, size: { width: N, height: N } })),
        image_size: { width: N, height: N }, no_background: true,
        additional_instructions: `the character is ${VISTA_TXT[v]}, ${m === 'andar' ? 'walking' : 'running'} cycle; keep every pose exactly, only change the clothes and colors to match the reference` });
      const ims = achaImagens(res).map(rgbaDe); if (ims.length < 8) throw new Error(`${m} ${v}: vieram ${ims.length} imagens`);
      ims.slice(0, 8).forEach((b, i) => salva(path.join(DIR, m, v, i + '.png'), b));
      linhas.push(orig, ims.slice(0, 8));
    }
    folha(path.join(DIR, `_anim_${v}.png`), linhas, 3);
  }
  console.log('saldo depois:', await saldo());
} else console.log('uso: node pl_skin.mjs conceito|animar <nome> ...');
