// ruas_jogo_br_editado.js (o que sai do editor) -> ruas_mapa.js (o que o jogo carrega): aumenta a escala das ruas (só os comprimentos; a largura das ruas não muda) e ajusta o limite do mapa ao que sobrou.
// uso: node ajusta_mapa.mjs [fator=1.5] [margem=60]   (fator 1 = escala 1/3 de antes; 1.5 = escala 1/2; 3 = tamanho real)
import fs from 'node:fs';
const F = +(process.argv[2] || 1.5), MARGEM = +(process.argv[3] || 60);
const { RUAS } = eval('(()=>{' + fs.readFileSync('ruas_jogo_br_editado.js', 'utf8') + ';return {RUAS}})()');
let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
const out = RUAS.map(r => { const p = r.p.map(v => +(v * F).toFixed(2)); for (let k = 0; k < p.length; k += 2) { x0 = Math.min(x0, p[k]); x1 = Math.max(x1, p[k]); z0 = Math.min(z0, p[k + 1]); z1 = Math.max(z1, p[k + 1]); } return { ...r, p }; });
const lim = { x0: Math.round(x0 - MARGEM), x1: Math.round(x1 + MARGEM), z0: Math.round(z0 - MARGEM), z1: Math.round(z1 + MARGEM) };
let fora = 0; for (const r of out) for (let k = 2; k < r.p.length; k += 2) { const dx = r.p[k] - r.p[k - 2], dz = r.p[k + 1] - r.p[k - 1]; if (Math.hypot(dx, dz) < .05) continue; const a = Math.atan2(dx, dz); if (Math.abs(a - Math.round(a / (Math.PI / 4)) * Math.PI / 4) > .02) fora++; }
fs.writeFileSync('ruas_mapa.js', '// GERADO por ajusta_mapa.mjs (fator ' + F + ') a partir de ruas_jogo_br_editado.js. Largura das ruas em metros do jogo; comprimentos multiplicados pelo fator.\nconst RUAS = ' + JSON.stringify(out) + ';\nconst RUAS_LIM = ' + JSON.stringify(lim) + ';\nconst RUAS_FATOR = ' + F + ';\n');
const br = out.find(r => r.br); let L = 0; for (let k = 2; k < br.p.length; k += 2) L += Math.hypot(br.p[k] - br.p[k - 2], br.p[k + 1] - br.p[k - 1]);
console.log('fator', F, '| área das ruas', Math.round(x1 - x0), 'x', Math.round(z1 - z0), 'm | limite', lim.x1 - lim.x0, 'x', lim.z1 - lim.z0, 'm | BR', Math.round(L), 'm (≈', Math.round(L / 12), 's na velocidade máxima de 12 m/s) | trechos fora das 8 direções:', fora);
