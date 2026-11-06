// Partes do personagem, separadas pela paleta: cada letra de cor dos sprites (sprites7.js / idles.js) pertence a uma parte.
// As partes não se sobrepõem (cada pixel é de uma só parte), então somadas dão o desenho original.
const CAMADAS = {
  cabelo: { nome: 'Cabelo e barba', letras: 'BTY', ref: 'B' },
  pele: { nome: 'Pele', letras: 'CMUjcQVaGJRS', ref: 'C' },
  camiseta: { nome: 'Camiseta', letras: 'ALH', ref: 'A' },
  calca: { nome: 'Calça', letras: 'DEPdibfeO', ref: 'D' },
  sapato: { nome: 'Sapato', letras: 'KNIXZghk', ref: 'I' },
  contorno: { nome: 'Contorno', letras: 'FWl', ref: 'F' },
};
const camadaDe = ch => Object.keys(CAMADAS).find(k => CAMADAS[k].letras.includes(ch));
// troca a cor de cada parte mantendo as luzes e sombras: cada tom da parte é o tom original vezes (cor nova / cor de referência)
// pal: { letra: '#rrggbb' }, cores: { camiseta: '#rrggbb', ... } -> nova paleta
function recolorPal(pal, cores) {
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), hex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const lum = c => c[0] * .3 + c[1] * .59 + c[2] * .11, out = { ...pal };
  for (const [k, def] of Object.entries(CAMADAS)) {
    if (!cores[k]) continue; const alvo = rgb(cores[k]), lr = lum(rgb(pal[def.ref]));
    for (const l of def.letras) { if (!pal[l]) continue; const r = lum(rgb(pal[l])) / lr; out[l] = hex(alvo.map(v => v * r)); }
  }
  return out;
}
