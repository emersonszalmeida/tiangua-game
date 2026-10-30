// Recorte N (refeito pelo usuário): troca os códigos provisórios pelas cores da folha
import fs from 'node:fs';
const j = JSON.parse(fs.readFileSync('cutN2.json', 'utf8')), h = j.rows.length;
j.rows = j.rows.map((row, y) => [...row].map(c => {
  if (y >= h - 4) { if (c === '2') return 'I'; if (c === '5') return 'K'; }
  if (c === '5') return y <= 17 ? (y === 18 ? 'R' : 'F') : 'R';
  const m = { 1: 'G', 7: 'M', 9: 'M', 3: 'H', 8: 'S', 2: 'I' }; return m[c] || c; }).join(''));
fs.writeFileSync('cutN.json', JSON.stringify(j)); console.log(j.rows.slice(-6).join('\n'), '\n', j.rows[18], j.rows[0]);
