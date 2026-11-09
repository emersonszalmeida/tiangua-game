// Peças de parede e piso da casa (vindas do casa.html, sem mudar o visual) para o editor da cabana (chao.html).
// 1 tile = 3 m = 64 px de comprimento na tela; parede alta 92 px (~2,9 m); espessura 4 px (~19 cm).
// Expõe window.PAREDES = { PIECE, floorTile, TP, T, HIGH, LOW, prev(nome) }.
(function () {
  const FACE_Y = { b: '#cdbda4', b2: '#c7b79e', l: '#d5c6ae', d: '#bcac93', top: '#a99a82', base: '#8f7d66', baseL: '#a08e76', line: '#6e5e4c' }; // face voltada para ↙
  const FACE_X = { b: '#b5a58c', b2: '#afa086', l: '#bdae95', d: '#a5957d', top: '#94856e', base: '#7c6b56', baseL: '#8c7b65', line: '#5e4f3f' }; // face voltada para ↘
  const CAP = '#2f2622', CAP_L = '#4a3d35', JAMB = '#8a7a64', FLOOR = ['#d6ccb6', '#d1c7b1', '#dad0bb'];
  const HIGH = 92, LOW = 12, HALF = 46, DOOR_H = 72, DOOR_A = 16, DOOR_B = 48;   // porta: de i=16 a i=48 (1,5 m de vão), 2,25 m de altura
  const TP = 4, T = TP / 64, TW = 128, TH = 64;
  const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function put(x, i, j, col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); }
  // cor da face: i ao longo da parede (repete a cada 64, então as peças emendam), d a partir do topo
  function faceColor(F, i, d, h) {
    const fromFloor = h - 1 - d;
    if (h > 20) {
      if (fromFloor < 7) return fromFloor === 0 ? F.line : hash(i % 64, fromFloor, 2) > .9 ? F.base : F.baseL;
      if (fromFloor === 7) return F.line;
      if (d < 3) return F.top;
    } else if (d < 2) return F.top;
    const r = hash(i % 64, d, 5);
    if (r > .975) return F.d; if (r < .03) return F.l;
    return hash(Math.floor((i % 64) / 7), Math.floor(d / 6), 7) > .65 ? F.b2 : F.b;
  }
  // trecho de 1 tile correndo para ↘; a parede virada para ↙ é este mesmo desenho espelhado
  function wallPiece(F, h, door) {
    const oy = h + TP / 2, c = mk(64 + TP, oy + 33), x = c.getContext('2d');
    for (let i = 0; i < 64; i++) for (let d = 0; d < h; d++) {
      if (door && i >= DOOR_A && i < DOOR_B && d >= h - DOOR_H) continue;
      put(x, i, oy + Math.floor(i / 2) - h + d, faceColor(F, i, d, h));
    }
    for (let i = 0; i < 64; i++) if (!(door && i >= DOOR_A && i < DOOR_B)) put(x, i, oy + Math.floor(i / 2), F.line);   // linha extra embaixo: cobre a emenda com o piso
    if (door) for (let k = 0; k < TP; k++) for (let d = 0; d < DOOR_H; d++)   // lateral do vão (a espessura da parede)
      put(x, DOOR_A + k, oy + Math.floor((DOOR_A + k) / 2) - k - d - 1, JAMB);
    for (let i = 0; i < 64 + TP; i++) {   // topo escuro
      const up = i < TP ? -Math.floor(i / 2) : -TP / 2 + Math.floor((i - TP) / 2), lo = i < 64 ? Math.floor(i / 2) : 32 - Math.ceil((i - 64) / 2);
      for (let j = up; j <= lo; j++) put(x, i, oy - h + j, j === lo && i < 64 ? CAP_L : CAP);
    }
    return { c, oy };
  }
  // pilar: fecha cantos e pontas de parede (mesmas cores, mesmo rodapé)
  function postPiece(h) {
    const oy = h + TP, c = mk(TP * 2, oy + 1), x = c.getContext('2d');
    for (let k = 0; k < TP; k++) for (let d = 0; d < h; d++) {   // k = 0 junto à quina da frente
      put(x, TP - 1 - k, oy - 1 - Math.floor(k / 2) - h + d, faceColor(FACE_Y, 63 - k, d, h));
      put(x, TP + k, oy - 1 - Math.floor(k / 2) - h + d, faceColor(FACE_X, k, d, h));
    }
    for (let i = 0; i < TP * 2; i++) { const a = Math.floor((Math.min(i, TP * 2 - 1 - i) + 2) / 2); for (let j = -a; j <= a; j++) put(x, i, oy - TP / 2 - h + j - 1, CAP); }
    return { c, oy };
  }
  const PIECE = {
    xHigh: wallPiece(FACE_Y, HIGH), xDoor: wallPiece(FACE_Y, HIGH, true), xLow: wallPiece(FACE_Y, LOW),
    yHigh: wallPiece(FACE_X, HIGH), yDoor: wallPiece(FACE_X, HIGH, true), yLow: wallPiece(FACE_X, LOW),
    postHigh: postPiece(HIGH), postLow: postPiece(LOW),
    // meia altura: as paredes da frente, quando o personagem está dentro da casa (corte para ver o interior)
    xMid: wallPiece(FACE_Y, HALF), xDoorMid: wallPiece(FACE_Y, HALF, true), yMid: wallPiece(FACE_X, HALF), yDoorMid: wallPiece(FACE_X, HALF, true), postMid: postPiece(HALF),
  };
  const floorTile = (function () {
    const c = mk(TW, TH), x = c.getContext('2d');
    for (let j = 0; j < TH; j++) for (let i = 0; i < TW; i++) if (Math.abs(i - 63.5) / 64 + Math.abs(j - 31.5) / 32 <= 1) { const r = hash(i, j, 21); put(x, i, j, r > .96 ? FLOOR[1] : r < .04 ? FLOOR[2] : FLOOR[0]); }
    return c;
  })();
  // miniatura (data URL) para os botões do painel
  const prev = nome => { const c = nome === 'piso' ? floorTile : nome === 'high' ? PIECE.xHigh.c : nome === 'door' ? PIECE.xDoor.c : PIECE.xLow.c; return c.toDataURL(); };
  window.PAREDES = { PIECE, floorTile, TP, T, HIGH, LOW, prev };
})();
