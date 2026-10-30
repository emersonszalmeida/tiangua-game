// Recorte W (perfil, olhando para a esquerda): troca códigos provisórios pelas cores da folha
import fs from 'node:fs';
const j = JSON.parse(fs.readFileSync('cutW.json', 'utf8')), h = j.rows.length;
j.rows = j.rows.map((row, y) => [...row].map((c, x) => {
  if (y >= 47) { if (c === '4') return 'K'; if (c === '3') return 'I'; }
  switch (c) {
    case '1': return 'F';
    case '2': return 'L';
    case '4': return y < 20 ? (x >= 14 ? 'G' : 'R') : 'G';
    case '3': return 'F';
    case '5': return 'S';
    case '6': return 'M';
    default: return c;
  } }).join(''));
fs.writeFileSync('cutW.json', JSON.stringify(j)); console.log(j.rows.length, j.rows[0].length);
