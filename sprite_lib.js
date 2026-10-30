// Personagem em pixel art, desenhado como grade (24x32), virado para a direita.
// Camadas: capa (atrás) -> pernas -> corpo/cabeça. Quadros: parado + 4 de caminhada.
const PAL = {
  K: '#0b0b14', // preto (contorno, gola)
  D: '#1b1c38', // capa escura
  C: '#2c2f5c', // capa clara
  B: '#25396b', // túnica
  b: '#385694', // túnica clara
  G: '#bf9f5c', // dourado
  W: '#f4f4fb', // cabelo
  w: '#c3c3dc', // cabelo sombra
  S: '#f2d0b4', // pele
  s: '#d3a98c', // pele sombra
  E: '#2a1f33', // olho
  R: '#d8242e', // vermelho
  r: '#85101e', // vermelho escuro
  L: '#6c7d76', // perna
  l: '#a0aea6', // perna clara
  M: '#3d4543', // bota
  Y: '#191925', // luva
};
const SW = 24, SH = 32;
const newGrid = () => Array.from({ length: SH }, () => Array(SW).fill('.'));
const put = (g, x, y, s) => { if (y < 0 || y >= SH) return; for (let i = 0; i < s.length; i++) if (s[i] !== '.' && x + i >= 0 && x + i < SW) g[y][x + i] = s[i]; };

function bodyLayer(dy) {
  const g = newGrid(), p = (y, ...segs) => { for (let i = 0; i < segs.length; i += 2) put(g, segs[i], y + dy, segs[i + 1]); };
  // cabeça: franja e cabelo comprido caindo para trás
  p(0, 9, 'wWWWWw');
  p(1, 8, 'wWWWWWWw');
  p(2, 7, 'wWWWWWWWWw');
  p(3, 7, 'wWWWWWWWWWWw');
  p(4, 7, 'wWWWWWW', 14, 'WSSSw');
  p(5, 7, 'wWWWWw', 13, 'WSSSSSs');
  p(6, 7, 'wWWWWw', 13, 'SSESSSs');
  p(7, 7, 'wWWWw', 12, 'sSSSSSSs');
  p(8, 8, 'wWWw', 12, 'KKKKKKKs');
  p(9, 8, 'wWWw', 11, 'KKKKKKKK');
  // cabelo longo atrás dos ombros
  p(10, 8, 'wWWw'); p(11, 8, 'wWWw'); p(12, 8, 'wWWw'); p(13, 9, 'wWw'); p(14, 9, 'wWw'); p(15, 9, 'ww');
  // tronco estreito, gola alta
  p(10, 11, 'KBBBBBBK');
  p(11, 12, 'BBBbBBB');
  p(12, 12, 'BBBBBBB');
  p(13, 12, 'BBBBBBB');
  p(14, 12, 'KKGGGKK');
  // braço da frente dobrado, luva escura
  p(10, 18, 'bb'); p(11, 18, 'bbb'); p(12, 18, 'bbb'); p(13, 19, 'bYYY'); p(14, 20, 'YYYY'); p(15, 20, 'YYY');
  // saia da túnica com V dourado invertido
  p(15, 11, 'BBBGGBBB');
  p(16, 10, 'BBBBGGBBBB');
  p(17, 10, 'BBBGBBGBBB');
  p(18, 9, 'BBBBGBBGBBBB');
  p(19, 9, 'BBbGBBBBGbBB');
  p(20, 9, 'BBGBBBBBBGBB');
  p(21, 9, 'KKBBBBBBBBKK');
  // fecho vermelho da capa no ombro
  p(11, 10, 'R'); p(12, 10, 'RR'); p(13, 10, 'Rr'); p(14, 11, 'r');
  return g;
}

function capeLayer(sway, dy) {
  const g = newGrid();
  for (let y = 10; y <= 29; y++) {
    const t = y - 10, xl = 10 - Math.round(t * .42) - (t > 12 ? sway * (t - 12) / 7 : 0) | 0, xr = 12;
    for (let x = Math.round(xl); x <= xr; x++) {
      const d = x - Math.round(xl);
      g[y + dy < SH ? y + dy : SH - 1][x] = d < 1 ? 'K' : d < 3 ? 'D' : (d + y) % 5 === 0 ? 'K' : d > 4 ? 'C' : 'D';
    }
  }
  // barra irregular
  for (let x = 0; x < SW; x++) if (g[28 + dy] && g[28 + dy][x] !== '.' && (x + (sway > 0 ? 1 : 0)) % 2 === 0) g[29 + dy][x] = '.';
  return g;
}

function legsLayer(phase, dy) {
  const g = newGrid();
  const leg = (ph, front) => {
    const swing = Math.sin(ph), lift = Math.max(0, Math.cos(ph)) * 2.2, fx = 13 + swing * 3.6;
    const yEnd = 28 - Math.round(lift);
    for (let y = 20; y <= yEnd; y++) {
      const f = (y - 20) / Math.max(1, yEnd - 20), x0 = Math.round(12 + (fx - 13) * f * (front ? 1 : 1));
      put(g, x0, y + dy, front ? 'lLL' : 'LLL');
    }
    const bx = Math.round(12 + (fx - 13));
    put(g, bx, yEnd + 1 + dy, front ? 'MMM' : 'MMM'); put(g, bx, yEnd + 2 + dy, 'MMMM'); put(g, bx, yEnd + 3 + dy, 'KKKKK');
  };
  if (phase === null) { // parado
    put(g, 11, 22, 'LLL'); for (let y = 22; y <= 28; y++) { put(g, 11, y, 'LLL'); put(g, 14, y, 'lLL'); }
    put(g, 11, 29, 'MMM'); put(g, 11, 30, 'MMMM'); put(g, 11, 31, 'KKKKK'); put(g, 14, 29, 'MMM'); put(g, 14, 30, 'MMMM'); put(g, 14, 31, 'KKKKK');
  } else { leg(phase + Math.PI, false); leg(phase, true); }
  return g;
}

function compose(layers) {
  const g = newGrid();
  for (const l of layers) for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) if (l[y][x] !== '.') g[y][x] = l[y][x];
  return g;
}
function toCanvas(g) {
  const c = document.createElement('canvas'); c.width = SW; c.height = SH; const x = c.getContext('2d');
  for (let y = 0; y < SH; y++) for (let i = 0; i < SW; i++) { const k = g[y][i]; if (k !== '.') { x.fillStyle = PAL[k] || '#f0f'; x.fillRect(i, y, 1, 1); } }
  return c;
}
function makeFrames() {
  const idle = toCanvas(compose([capeLayer(0, 0), legsLayer(null, 0), bodyLayer(0)]));
  const walk = [0, 1, 2, 3].map(i => {
    const ph = i * Math.PI / 2, bob = (i % 2) ? -1 : 0, sway = (i % 2) ? 2 : -1;
    return toCanvas(compose([capeLayer(sway, 0), legsLayer(ph, 0), bodyLayer(bob)]));
  });
  return { idle, walk };
}
