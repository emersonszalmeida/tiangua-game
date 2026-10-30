// Recorte SE (3/4 de frente olhando para a direita): troca códigos provisórios pelas cores da folha e grava como cutSW (espelhado depois)
import fs from 'node:fs';
const j = JSON.parse(fs.readFileSync('cutSE.json', 'utf8'));
j.rows = j.rows.map((row, y) => [...row].map((c, x) => { if (y === 34 && x === row.length - 1 && c === 'A') return 'G'; return { 1: 'K', 2: 'G', 3: 'G' }[c] || c; }).join(''));
fs.writeFileSync('cutSW.json', JSON.stringify(j)); console.log(j.w, j.h);
