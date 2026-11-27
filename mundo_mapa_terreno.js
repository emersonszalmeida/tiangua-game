// Terreno do jogo a pé sobre o mapa grande: grama por todo lado, terra no quintal da oficina e na beira das ruas, árvores e enfeites espalhados.
// Tudo é calculado por célula (determinístico, sem guardar o mundo inteiro): só as células que aparecem na tela são desenhadas.
// Precisa de MAPACHAO (tiangua_mapa/mapa_chao.js) e, na hora de usar, de M, OBJS (chao.html) e TERR (terreno_motor_mapa.js).
const MT = { X0: -391.8, Z0: 196.8, TM: 64 / (65 / 1.76) };   // tile (10.5, 13) do jogo = ponto (X0, Z0) do mapa; 1 tile = TM metros em x e em z (= 2,45 m na diagonal)
MT.plano = (tx, ty) => [MT.X0 + ((tx - 10.5) - (ty - 13)) * MT.TM, MT.Z0 + ((tx - 10.5) + (ty - 13)) * MT.TM];
const mtHash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const mtQuintal = (cx, cy) => cx >= 3 && cx <= 18 && cy >= 8 && cy <= 17;   // terra batida em volta da oficina
const mtKinds = new Map();
// o que é o chão da célula: 1 = terra (quintal e beira das ruas), 0 = grama (usado pelo terreno_motor_mapa.js)
window.KIND_FN = (cx, cy) => { const k = cx + ',' + cy; let v = mtKinds.get(k); if (v !== undefined) return v; const [x, z] = MT.plano(cx + .5, cy + .5); v = mtQuintal(cx, cy) || MAPACHAO.distBorda(x, z) < 2.2 ? 1 : 0; if (mtKinds.size > 80000) mtKinds.clear(); mtKinds.set(k, v); return v; };
// células visíveis (com folga: copas de árvore aparecem mesmo com a base fora da tela)
MT.visiveis = (hsx, hsy, W, H, K) => { const w = W / 2 / K + 140, h1 = H / 2 / K + 40, h2 = H / 2 / K + 300;
  const cs = [[hsx - w, hsy - h1], [hsx + w, hsy - h1], [hsx - w, hsy + h2], [hsx + w, hsy + h2]].map(([sx, sy]) => { const a = (sx - M * 64) / 64, b = sy / 32; return [(a + b) / 2, (b - a) / 2]; });
  return { tela: { x0: hsx - W / 2 / K - 8, x1: hsx + W / 2 / K + 8, y0: hsy - H / 2 / K - 8, y1: hsy + H / 2 / K + 8 }, cx0: Math.floor(Math.min(...cs.map(c => c[0]))) - 1, cx1: Math.ceil(Math.max(...cs.map(c => c[0]))) + 1, cy0: Math.floor(Math.min(...cs.map(c => c[1]))) - 1, cy1: Math.ceil(Math.max(...cs.map(c => c[1]))) + 1 }; };
let mtArv = null, mtEnf = null; const mtObjs = new Map();
function mtDaCelula(cx, cy) {
  if (!mtArv) { mtArv = []; const pesos = []; for (const k of Object.keys(OBJS)) { if (OBJS[k].deco) continue; if (/^(arvore\d|n_arvore_)/.test(k)) { mtArv.push(k, k, k); } else if (/^n_(arbusto|samambaia|toco)/.test(k)) mtArv.push(k); }
    mtEnf = ['d_grama_alta_1', 'd_grama_alta_2', 'd_grama_media_1', 'd_grama_media_2', 'd_pedra_pequena', 'd_folha_1', 'd_folhas_monte', 'd_galho', 'd_flor_margarida', 'd_flor_amarela', 'd_flor_lavanda', 'd_flor_papoula'].filter(k => OBJS[k]); }
  const out = []; if (mtQuintal(cx, cy) || KIND_FN(cx, cy)) return out;
  const [x, z] = MT.plano(cx + .5, cy + .5), db = MAPACHAO.distBorda(x, z), r = mtHash(cx, cy, 1);
  if (r < .05 && db > 4.5 && mtArv.length) out.push({ x: cx, y: cy, id: mtArv[Math.floor(mtHash(cx, cy, 2) * mtArv.length)] });
  else if (mtHash(cx, cy, 3) < .2 && mtEnf.length) out.push({ x: Math.round((cx + .15 + mtHash(cx, cy, 4) * .7) * 100) / 100, y: Math.round((cy + .15 + mtHash(cx, cy, 5) * .7) * 100) / 100, id: mtEnf[Math.floor(mtHash(cx, cy, 6) * mtEnf.length)] });
  return out;
}
MT.objetos = R => { const out = []; if (mtObjs.size > 60000) mtObjs.clear(); for (let cy = R.cy0; cy <= R.cy1; cy++) for (let cx = R.cx0; cx <= R.cx1; cx++) { const k = cx + ',' + cy; let l = mtObjs.get(k); if (!l) { l = mtDaCelula(cx, cy); mtObjs.set(k, l); } for (const o of l) out.push(o); } return out; };
