// uso: PIXELLAB_SECRET=... node gen_pixellab.mjs <nome> "<descrição>" [largura=128] [altura=128] [estilo.png]
// gera um objeto (Pro Flash, vista low top-down, 1 direção, 16 cores) e salva em pl_<nome>.png
import fs from 'node:fs';
const [, , nome, desc, W = '128', H = '128', estilo = 'arvore_pl0.png'] = process.argv;
const KEY = process.env.PIXELLAB_SECRET, B = 'https://api.pixellab.ai/v2', hd = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const BASE = 'isometric pixel art, 2:1 dimetric view, single object, transparent background, dark 1px outline, limited palette with dithering, light from upper left, soft pixel shading, game asset, ';
const body = {
  description: BASE + desc + ', nothing else in the image', name: nome, view: 'low top-down', n_directions: 1,
  image_size: { width: +W, height: +H },
  style_image: { image: { type: 'base64', base64: fs.readFileSync(estilo).toString('base64'), format: 'png' }, size: { width: 128, height: 128 } },
  style_options: { color_palette: true, outline: true, detail: true, shading: true },
  target_palette: { max_colors: 16 },
};
const r = await fetch(`${B}/create-object-pro-flash`, { method: 'POST', headers: hd, body: JSON.stringify(body) });
const j = await r.json().catch(() => ({})); console.log('POST', r.status, JSON.stringify(j).slice(0, 600));
if (r.status !== 202 && r.status !== 200) process.exit(1);
const jobId = j.background_job_id || j.job_id || j.id, objId = j.object_id;
for (let i = 0; i < 90; i++) {
  await new Promise(s => setTimeout(s, 5000));
  const s = await (await fetch(`${B}/background-jobs/${jobId}`, { headers: hd })).json();
  console.log('job', s.status); if (s.status === 'completed' || s.status === 'failed') { console.log(JSON.stringify(s).slice(0, 500)); if (s.status === 'failed') process.exit(1); break; }
}
const dl = await fetch(`https://api.pixellab.ai/mcp/objects/${objId}/download`, { headers: hd });
console.log('download', dl.status, dl.headers.get('content-type'));
fs.writeFileSync(`pl_${nome}.png`, Buffer.from(await dl.arrayBuffer())); console.log('salvo pl_' + nome + '.png');
