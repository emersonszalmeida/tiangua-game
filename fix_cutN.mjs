// Troca os códigos provisórios do recorte N pelas cores da folha, tratando sapatos pelas linhas de baixo
import fs from 'node:fs';
const j = JSON.parse(fs.readFileSync('cutN.json', 'utf8')), h = j.rows.length;
const gen = { 4: 'F', 1: 'G', 2: 'F', 3: 'H', 5: 'R', 7: 'M', 8: 'S', 9: 'M', 6: 'E' };
const boot = { 2: 'I', 6: 'I', 8: 'I', E: 'I', 4: 'K', D: 'K', 5: 'K', 7: 'K' };
j.rows = j.rows.map((row, y) => [...row].map(c => { if (y >= h - 4 && boot[c]) return boot[c]; if (y >= 18 && c === 'B') return 'G'; if (y < 12 && c === '3') return 'F'; return gen[c] || c; }).join(''));
fs.writeFileSync('cutN.json', JSON.stringify(j)); console.log(j.rows.slice(-8).join('\n'));
// limpeza fina pedida pelo usuário: pontinhos na calça e sapatos mais limpos
{ const j2 = JSON.parse(fs.readFileSync('cutN.json', 'utf8')), g = j2.rows.map(r => [...r]); const n = g.length;
  const put = (y, x0, s) => [...s].forEach((c, i) => { g[y][x0 + i] = c; }), clr = y => g[y].fill('.');
  put(50, 3, 'EDDDDE'); put(51, 3, 'EDDDDE'); put(51, 11, 'EDDDDE');
  const base = n - 4; for (let y = base; y < n; y++) clr(y);
  put(base, 2, 'IKKKKKI'); put(base + 1, 2, 'IKKKKI'); put(base + 2, 2, 'IIIIII');
  put(base, 11, 'IKKKKKI'); put(base + 1, 12, 'IKKKKI'); put(base + 2, 12, 'IIIIII');
  j2.rows = g.map(r => r.join('')).slice(0, base + 3); fs.writeFileSync('cutN.json', JSON.stringify(j2)); console.log(j2.rows.slice(-8).join('\n')); }
