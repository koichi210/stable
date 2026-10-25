/*
 * Othello 図解用の 3D 盤面部品(このツール専用)。
 *  - 本物と同じルール(GameMaster.CanPut / ApplyMove と同じ 8 方向の挟み判定)を JS で再現して、
 *    実際の棋譜(MOVES)から各手の盤面 states[] を作る
 *  - 石は「上が黒・下が白」の円盤。X 軸まわりに 180° 回すと裏返る(石が裏返るアニメ)
 *  - render(g, a, b, k) : 盤面 a → b を進行度 k(0〜1)で見せる(置く=落ちてくる / 挟まれた石=裏返る)
 * three r128 + lib/guide.js の後に読み込む。
 */
(function () {
  'use strict';
  var T = window.THREE, PI = Math.PI;
  var CS = 1.1; // 1マスの大きさ
  var DX = [-1, 1, 0, 0, -1, -1, 1, 1];   // GameMaster._dirX と同じ並び
  var DY = [0, 0, -1, 1, -1, 1, -1, 1];   // GameMaster._dirY と同じ並び
  var DNAME = ['左', '右', '上', '下', '左上', '左下', '右上', '右下'];

  function init() {
    var b = [];
    for (var y = 0; y < 8; y++) b.push([0, 0, 0, 0, 0, 0, 0, 0]);
    b[3][3] = 2; b[3][4] = 1; b[4][3] = 1; b[4][4] = 2; // 白・黒・黒・白(GameMaster.ResetBoardOnly と同じ)
    return b;
  }
  function copy(b) { return b.map(function (r) { return r.slice(); }); }
  // (x,y) に color を置いたとき、方向ごとに「ひっくり返る石の列」を返す(置けなければ空配列)
  function flips(b, x, y, c) {
    if (b[y][x]) return [];
    var e = 3 - c, res = [];
    for (var d = 0; d < 8; d++) {
      var cx = x + DX[d], cy = y + DY[d], cells = [];
      while (cx >= 0 && cx < 8 && cy >= 0 && cy < 8 && b[cy][cx] === e) { cells.push([cx, cy]); cx += DX[d]; cy += DY[d]; }
      if (cells.length && cx >= 0 && cx < 8 && cy >= 0 && cy < 8 && b[cy][cx] === c) res.push({ d: d, cells: cells, anchor: [cx, cy] });
    }
    return res;
  }
  function moves(b, c) {
    var m = [];
    for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) if (flips(b, x, y, c).length) m.push([x, y]);
    return m;
  }
  // 実際に打った手の例(欲張り法で作った12手。パス無しで黒白交互)。x,y は 0 始まり
  var MOVES = [[3, 2], [2, 2], [1, 2], [1, 1], [1, 0], [4, 2], [5, 2], [0, 0], [2, 3], [6, 2], [7, 2], [4, 1]];
  var states = [init()], plies = [];
  (function () {
    var b = init(), c = 1;
    MOVES.forEach(function (m) {
      var f = flips(b, m[0], m[1], c), nb = copy(b);
      f.forEach(function (q) { q.cells.forEach(function (p) { nb[p[1]][p[0]] = c; }); });
      nb[m[1]][m[0]] = c;
      plies.push({ x: m[0], y: m[1], c: c, flips: f });
      states.push(nb); b = nb; c = 3 - c;
    });
  })();

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(v) { v = clamp01(v); return v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2; }
  var ORIGIN = [0, 0, 0];

  var OB = window.OB = {
    CS: CS, DX: DX, DY: DY, DNAME: DNAME, MOVES: MOVES, states: states, plies: plies,
    init: init, copy: copy, flips: flips, moves: moves,
    // 盤座標(x,y)→ワールド座標。yy は盤からの高さ
    w: function (x, y, yy) { return [ORIGIN[0] + (x - 3.5) * CS, ORIGIN[1] + (yy || 0), ORIGIN[2] + (y - 3.5) * CS]; },
    lname: function (x, y) { return String.fromCharCode(65 + x) + '.' + (y + 1); }, // 棋譜表記(Kifu.cs と同じ「列.行」)
  };

  // 盤・罫線・64個の石(最初は全部隠す)を作る
  OB.build = function (g, o) {
    o = o || {};
    ORIGIN = o.origin || [0, 0, 0];
    var N = 8 * CS;
    g.group('ob', { pos: ORIGIN });
    g.box({ id: 'ob-plate', parent: 'ob', size: [N + 0.5, 0.25, N + 0.5], pos: [0, -0.125, 0], color: '#0a6a2e', edgeColor: '#5ee6a8', roughness: 0.8 });
    for (var i = 0; i <= 8; i++) {
      var p = (i - 4) * CS;
      g.line([[p, 0.012, -N / 2], [p, 0.012, N / 2]], { parent: 'ob', color: '#06280f', opacity: 0.9 });
      g.line([[-N / 2, 0.012, p], [N / 2, 0.012, p]], { parent: 'ob', color: '#06280f', opacity: 0.9 });
    }
    // 列 A〜H・行 1〜8 の目盛(棋譜の表記と対応)
    for (var k = 0; k < 8; k++) {
      var q = (k - 3.5) * CS;
      g.label(String.fromCharCode(65 + k), [q, 0.02, -N / 2 - 0.45], { parent: 'ob', size: 0.3, color: '#bfe9d0' });
      g.label(String(k + 1), [-N / 2 - 0.45, 0.02, q], { parent: 'ob', size: 0.3, color: '#bfe9d0' });
    }
    for (var y = 0; y < 8; y++) {
      for (var x = 0; x < 8; x++) {
        var id = 'st-' + x + '-' + y;
        g.group(id, { parent: 'ob', pos: [(x - 3.5) * CS, 0.16, (y - 3.5) * CS] });
        g.cylinder({ parent: id, radius: 0.43, height: 0.12, pos: [0, 0.06, 0], color: '#161616', roughness: 0.35, metalness: 0.1 });
        g.cylinder({ parent: id, radius: 0.43, height: 0.12, pos: [0, -0.06, 0], color: '#f2f2f2', roughness: 0.35, metalness: 0.05 });
        g.get(id).visible = false;
      }
    }
  };

  // 置ける場所のマーク(BoardRenderer.DrawNotice の灰色の小円)。prefix で名前を分けて作る
  OB.hints = function (g, board, color, prefix) {
    var ids = [];
    moves(board, color).forEach(function (m) {
      var id = prefix + m[0] + '-' + m[1];
      g.cylinder({ id: id, parent: 'ob', radius: 0.14, height: 0.03, pos: [(m[0] - 3.5) * CS, 0.03, (m[1] - 3.5) * CS], color: '#8a9a90', roughness: 0.6 });
      ids.push(id);
    });
    return ids;
  };

  // 盤面 a → b を進行度 k(0〜1)で描く。a,b は states の添字でも盤面配列でもよい。
  //   空→石 : 上から落ちてくる / 石→空(一手戻す) : 浮いて消える / 色が変わる : 弧を描いて裏返る
  //   opt.delay(x,y) : そのマスの動き出しを遅らせる(0〜 1-span)。opt.span : 1マスの動きの長さの割合
  OB.render = function (g, a, b, k, opt) {
    opt = opt || {};
    var A = typeof a === 'number' ? states[a] : a, B = typeof b === 'number' ? states[b] : b;
    var span = opt.span || 1;
    for (var y = 0; y < 8; y++) {
      for (var x = 0; x < 8; x++) {
        var st = g.get('st-' + x + '-' + y);
        var ca = A[y][x], cb = B[y][x];
        var d = opt.delay ? opt.delay(x, y) : 0;
        var kk = ease((k - d) / span);
        var rot = 0, yy = 0.16, sc = 1, vis = true;
        if (ca === cb) {
          vis = ca !== 0; rot = ca === 2 ? PI : 0;
        } else if (ca === 0) {                 // 置かれる
          vis = kk > 0; yy = 0.16 + (1 - kk) * 2.2; rot = cb === 2 ? PI : 0; sc = 0.4 + 0.6 * kk;
        } else if (cb === 0) {                 // 取り消されて消える
          vis = kk < 1; yy = 0.16 + kk * 2.2; rot = ca === 2 ? PI : 0; sc = 1 - 0.6 * kk;
        } else {                               // 裏返る
          var from = ca === 2 ? PI : 0, to = cb === 2 ? PI : 0;
          rot = from + (to - from) * kk; yy = 0.16 + Math.sin(PI * kk) * 1.1;
        }
        st.visible = vis;
        st.rotation.set(rot, 0, 0);
        st.position.y = yy;
        st.scale.set(sc, sc, sc);
      }
    }
  };

  // 盤の上に浮かぶ半透明の「これから置く石」
  OB.ghost = function (g, id, color) {
    g.group(id, { parent: 'ob' });
    g.cylinder({ parent: id, radius: 0.43, height: 0.2, pos: [0, 0, 0], color: color === 2 ? '#f2f2f2' : '#161616', opacity: 0.55, roughness: 0.4 });
    g.get(id).visible = false;
  };
})();
