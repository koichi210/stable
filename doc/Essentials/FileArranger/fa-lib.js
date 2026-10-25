/*
 * FileArranger 図解ページ共通の部品(guide.js の上に載せる小物)。
 * 読み込み順: three.min.js → OrbitControls.js → ../lib/guide.js → fa-img.js → fa-lib.js
 */
(function () {
  'use strict';
  var T = window.THREE;
  var FA = (window.FA = {});

  // 色の意味をページ間でそろえる
  FA.col = {
    folder: '#ffb454',   // フォルダ
    file: '#5cc8ff',     // ファイル
    fresh: '#5ee6a8',    // 新規・成功
    tmp: '#9a96b4',      // 一時名・保存前
    ui: '#7b5cff',       // 画面(MainWindow)
    logic: '#c77dff',    // ルール(Logic/Utils)
    io: '#ff9f43',       // ファイル操作(実行)
    store: '#4fa3ff',    // 設定・履歴の保存
    warn: '#ff5f6d',     // 注意
    gold: '#ffd166',
    cyan: '#7ef0ff',
  };

  var ASPECT = 669 / 665; // スクリーンショットの縦横比

  // スクリーンショットを3D空間のパネルにする。pos はパネル下端の中央。
  // 戻り値は group(id)。group.userData.frame が枠(強調に使う)、userData.h が高さ。
  FA.shot = function (g, o) {
    var w = o.width || 6.4, h = w / ASPECT;
    var grp = g.group(o.id, { pos: o.pos, rot: [0, o.rotY || 0, 0] });
    var tex = new T.TextureLoader().load(window.FA_IMGS[o.key]);
    tex.anisotropy = 4;
    var frame = new T.Mesh(new T.PlaneGeometry(w + 0.22, h + 0.22), new T.MeshBasicMaterial({ color: '#7b5cff' }));
    frame.position.set(0, h / 2, 0);
    var plane = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex }));
    plane.position.set(0, h / 2, 0.02);
    grp.add(frame);
    grp.add(plane);
    grp.userData.frame = frame;
    grp.userData.h = h;
    if (o.caption) {
      g.label(o.caption, [0, h + 0.65, 0], { parent: o.id, size: 0.5, color: '#ffffff', bg: '#000000a0' });
    }
    return grp;
  };

  // 枠を強調(金)/通常(紫)にする。step.update の中で毎フレーム呼ぶ
  FA.hl = function (g, id, on) {
    g.get(id).userData.frame.material.color.set(on ? '#ffd166' : '#7b5cff');
  };

  // ファイル/フォルダの札(低い箱+上に名前)。pos は箱の中心
  FA.chip = function (g, o) {
    return g.box({
      id: o.id, parent: o.parent, size: [o.w || 2.1, o.h || 0.3, o.d || 0.8], pos: o.pos || [0, 0.2, 0],
      color: o.color || FA.col.file, radius: 0.1, edgeColor: '#ffffff',
      label: o.text, labelOffset: [0, o.lift || 0.55, 0], labelSize: o.size || 0.34, labelBg: '#000000b4',
    });
  };

  // 床の板(置き場所)。pos は板の中心(y はほぼ0)
  FA.plate = function (g, o) {
    return g.plate({
      id: o.id, parent: o.parent, size: o.size || [3.4, 5], pos: o.pos, color: o.color || '#2d2944',
      label: o.text, labelSize: o.size2 || 0.34, labelBg: '#00000090',
      labelOffset: o.labelOffset || [0, 0.45, (o.size ? o.size[1] : 5) / 2 + 0.3],
    });
  };

  // 「a が from→to へ弧を描いて動き、b(省略可)に姿を変える」を繰り返し再生する。
  // items: [{a, b, from:[x,z], to:[x,z], s:開始秒, d:移動秒, y, h, hideBefore}]
  // 位置は t(ループ内の秒)から毎回計算するので、ステップを途中で変えても壊れない
  FA.run = function (g, items, t, period) {
    var tt = t % period;
    items.forEach(function (it) {
      var A = g.get(it.a), y = it.y == null ? 0.2 : it.y;
      var from = [it.from[0], y, it.from[1]], to = [it.to[0], it.y2 == null ? y : it.y2, it.to[1]];
      var k = g.phase(tt, it.s, it.d), done = tt >= it.s + it.d;
      g.arcPos(A, from, to, k, it.h == null ? 1.0 : it.h);
      if (it.b) {
        var B = g.get(it.b);
        B.position.set(to[0], to[1], to[2]);
        B.visible = done;
        A.visible = (it.hideBefore ? tt >= it.s - (it.hold || 0) : true) && !done;
      } else {
        A.visible = (it.hideBefore ? tt >= it.s - (it.hold || 0) : true) && !(it.vanish && done);
      }
    });
  };

  // 駅(station)を一列に並べ、チップが順に変身しながら進む items を作る。
  // ids: 各駅にいるチップの id、xs: 各駅の x、z: 並べる奥行き、t0: 開始秒、step: 駅間の周期、d: 移動秒
  FA.chain = function (ids, xs, z, t0, step, d) {
    var items = [];
    for (var k = 0; k < ids.length - 1; k++) {
      items.push({ a: ids[k], b: ids[k + 1], from: [xs[k], z], to: [xs[k + 1], z], s: t0 + k * step, d: d, hideBefore: k > 0, hold: step - d });
    }
    return items;
  };

  // 文字だけの見出し(床に立てる説明)
  FA.note = function (g, text, pos, o) {
    o = o || {};
    return g.label(text, pos, { id: o.id, size: o.size || 0.4, color: o.color || '#ffffff', bg: o.bg || '#000000a0', border: o.border });
  };
})();
