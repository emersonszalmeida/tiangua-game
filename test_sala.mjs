import { spawnSync } from 'node:child_process';
const S = process.argv[2] || 'C:/Users/EMERSO~1.DIA/AppData/Local/Temp/claude/beee3ef7ee05daa6/dc1e5392-d1dd-4955-a9e4-0bfb436e16d2/scratchpad';
// cenas: [pisos x0..x1, y0..y1, paredes] ; x-wall {a:'x',c:linha y,n:célula x}; y-wall {a:'y',c:linha x,n:célula y}
const cenas = {
  sala: { x: [4, 6], y: [4, 6], div: [] },
  T:    { x: [4, 9], y: [4, 6], div: [['y', 7, 4, 6]] },
  menor: { x: [1, 0], y: [1, 0], div: [['y', 5, 5, 5], ['x', 6, 5, 5]], h: [5, 6] },   // canto < (RU)
  maior: { x: [1, 0], y: [1, 0], div: [['x', 6, 4, 4], ['y', 5, 6, 6]], h: [5, 6] },   // canto > (LD)
  menorP: { x: [1, 0], y: [1, 0], div: [['y', 5, 5, 5, 'door'], ['x', 6, 5, 5]], h: [5, 6] },   // < com porta atrás
  maiorP: { x: [1, 0], y: [1, 0], div: [['x', 6, 4, 4, 'door'], ['y', 5, 6, 6]], h: [5, 6] },   // > com porta atrás
  // jogador DENTRO da sala: as paredes da frente ficam médias; a da frente com porta vira batentes
  portaM: { x: [4, 6], y: [4, 6], div: [], k: [['x', 7, 5, 'door']], dentro: 1 },
  cantoPM: { x: [4, 6], y: [4, 6], div: [], k: [['x', 7, 6, 'door']], dentro: 1 },
  salaDentro: { x: [4, 6], y: [4, 6], div: [], dentro: 1 },   // sala fechada com o personagem dentro: frente média + peças de encontro
  // print do dono: salão 6x6 com um quartinho no canto de cima (porta), jogador no salão
  quartinho: { x: [2, 7], y: [2, 7], div: [['x', 5, 2, 4], ['y', 5, 2, 4]], k: [['y', 5, 4, 'door']], dentro: 1, h: [6.5, 3.5] },
  portaFundo: { x: [4, 6], y: [4, 6], div: [], k: [['x', 4, 6, 'door'], ['y', 4, 6, 'door']], dentro: 1 },   // portas no fundo, coladas nos cantos < e >
  portaT: { x: [4, 7], y: [4, 6], div: [['y', 6, 4, 6]], k: [['y', 6, 4, 'door']], dentro: 1, h: [5.2, 5.5] },   // porta média da sala colada no fundo alto (T), como no print 81
  portaFrente: { x: [4, 6], y: [4, 6], div: [], k: [['x', 7, 4, 'door'], ['y', 7, 4, 'door']], dentro: 1 },   // portas médias coladas nos cantos < e > (peças do print 80)
  vUmaPonta: { x: [4, 6], y: [4, 6], div: [], k: [['y', 4, 6, 'mid']], dentro: 1 },   // V da frente: só o braço ↙ começa encostado em parede alta (como a peça da direita do print 82)
  // duas salas lado a lado, jogador na da esquerda: o canto Λ da sala da direita junta a parede alta do fundo com a parede média (ou porta média) que separa as salas
  lamAM: { x: [2, 6], y: [4, 6], div: [['y', 4, 4, 6]], dentro: 1, h: [3, 5.5] },
  lamADM: { x: [2, 6], y: [4, 6], div: [['y', 4, 4, 6]], k: [['y', 4, 4, 'door']], dentro: 1, h: [3, 5.5] },
  lamMA: { x: [4, 6], y: [2, 6], div: [['x', 4, 4, 6]], dentro: 1, h: [5, 3.2] },
  lamDMA: { x: [4, 6], y: [2, 6], div: [['x', 4, 4, 6]], k: [['x', 4, 4, 'door']], dentro: 1, h: [5, 3.2] },
  // T com a parede ↙ alta atravessando e um ramo ↘ médio (RD_MA) ou porta média (RD_DMA), jogador na sala de cima à direita
  tbMA: { x: [3, 6], y: [4, 6], div: [['y', 4, 4, 6], ['x', 5, 4, 6]], dentro: 1, h: [5.5, 4.5] },
  tbDMA: { x: [3, 6], y: [4, 6], div: [['y', 4, 4, 6], ['x', 5, 4, 6]], k: [['x', 5, 4, 'door']], dentro: 1, h: [5.5, 4.5] },
  // ^ alto num T (ramo ↙ alto saindo da parede ↘ alta) e numa cruz
  tAA: { x: [3, 6], y: [4, 6], div: [['y', 4, 4, 6], ['x', 5, 4, 6]], dentro: 0, h: [5.5, 4.5] },
  cruz: { x: [4, 7], y: [4, 7], div: [['y', 6, 4, 7], ['x', 6, 4, 7]] },
};
const pre = (c) => `(() => { const C = ${JSON.stringify(c)}; pisos = new Set(); paredes = [];
  for (let x = C.x[0]; x <= C.x[1]; x++) for (let y = C.y[0]; y <= C.y[1]; y++) pisos.add(x + ',' + y);
  const add = (a, c, n) => { paredes.push({ a, c, n, k: 'high' }); };
  for (let x = C.x[0]; x <= C.x[1]; x++) { add('x', C.y[0], x); add('x', C.y[1] + 1, x); }
  for (let y = C.y[0]; y <= C.y[1]; y++) { add('y', C.x[0], y); add('y', C.x[1] + 1, y); }
  for (const [a, c, n0, n1, k] of C.div) for (let n = n0; n <= n1; n++) { add(a, c, n); if (k) paredes[paredes.length - 1].k = k; }
  for (const [a, c, n, k] of (C.k || [])) { const w = paredes.find(p => p.a === a && p.c === c && p.n === n); if (w) w.k = k; }
  recalcParedes(); editar = false; if (!C.dentro) salaDoPersonagem = () => null; PERS.draw = () => {}; ui.style.display = 'none';
  hx = C.h ? C.h[0] : (C.x[0] + C.x[1] + 1) / 2; hy = C.h ? C.h[1] : (C.y[0] + C.y[1] + 1) / 2; return 'ok'; })()`;
const url = (k) => 'file:///C:/Users/emerson.souza.DIAMANTES/tiangua-game/chao.html?novo&z=1' + (k ? '#' + k : '');
for (const [nome, c] of Object.entries(cenas)) for (const k of [0]) {
  const r = spawnSync('node', ['cdpshot.mjs', url(k), `${S}/${nome}_k${k}.png`, '4', '1000', '700', pre(c)], { encoding: 'utf8' });
  console.log(nome, k, (r.stdout || '').trim().split('\n').slice(-2).join(' | '));
}
