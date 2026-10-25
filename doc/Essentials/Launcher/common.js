/*
 * Launcher 図解ページ共通の小道具（3ページで共有）。
 * 読み込み順: three.min.js → OrbitControls.js → ../lib/guide.js → img/shots-data.js → common.js
 * 画面はすべてダミー設定（メモ帳・電卓・サンプルサイト等）で撮影したもの。
 */
(function () {
  'use strict';
  var T = window.THREE;

  window.LC = {
    // 色の意味をページ間でそろえる
    col: {
      view: '#4fa3ff',     // 画面(XAML / Window)
      model: '#5ee6a8',    // モデル
      service: '#ff9f43',  // サービス
      common: '#c77dff',   // _Common(共有部品)
      file: '#ffd166',     // ファイル・外部
      os: '#ff5f6d',       // OS・外部アプリ
      data: '#7ef0ff',     // データの粒
    },

    // スクリーンショットを「3D空間に立てたパネル」として置く。
    // key は img/shots-data.js のキー、pw/ph は元画像のピクセル、scale は 1px あたりのワールド長
    panel: function (g, id, key, pw, ph, pos, scale, caption) {
      var w = pw * scale, h = ph * scale;
      var grp = g.group(id, { pos: pos });
      // 窓の影（少し大きい暗い板）
      var back = new T.Mesh(new T.PlaneGeometry(w + 0.22, h + 0.22), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 }));
      back.position.z = -0.03;
      g.add(null, back, id);
      var tex = new T.Texture();
      tex.minFilter = T.LinearFilter;
      tex.generateMipmaps = false;
      var mat = new T.MeshBasicMaterial({ color: 0xdddddd, map: tex, side: T.DoubleSide });
      var mesh = new T.Mesh(new T.PlaneGeometry(w, h), mat);
      g.add(null, mesh, id);
      var img = new Image();
      img.onload = function () { tex.image = img; tex.needsUpdate = true; mat.color.set(0xffffff); };
      img.src = (window.LAUNCHER_IMGS || {})[key] || '';
      if (caption) g.label(caption, [0, h / 2 + 0.45, 0.05], { parent: id, size: 0.34, bg: '#00000099' });
      grp.userData.size = [w, h];
      return grp;
    },

    // 画像ピクセル座標 → ワールド座標（パネル中心 c、画像サイズ pw×ph）
    px: function (c, pw, ph, s, x, y, z) {
      return [c[0] + (x - pw / 2) * s, c[1] - (y - ph / 2) * s, c[2] + (z || 0)];
    },

    // 画像の矩形 (x0,y0)-(x1,y1) に重ねる半透明の強調枠
    frame: function (g, id, c, pw, ph, s, r, color, label) {
      var w = (r[2] - r[0]) * s, h = (r[3] - r[1]) * s;
      var p = LC.px(c, pw, ph, s, (r[0] + r[2]) / 2, (r[1] + r[3]) / 2, 0.08);
      return g.box({
        id: id, size: [w, h, 0.05], pos: p, color: color || '#ffb020', emissive: color || '#ffb020', emissiveIntensity: 0.6,
        opacity: 0.38, edgeColor: color || '#ffb020', label: label, labelOffset: [0, h / 2 + 0.38, 0.1], labelSize: 0.3, labelBg: '#000000aa',
      });
    },

    // 矢印 arrowId の上を、start秒から dur秒かけて粒 name が流れる(外は画面外へ)
    fly: function (g, name, arrowId, t, start, dur, loop) {
      var o = g.get(name);
      var tt = loop ? ((t - start) % loop) + start : t;
      var k = g.linear(tt, start, dur);
      if (t < start || k >= 1) { o.position.y = -50; return; }
      o.position.copy(g.get('a-' + arrowId).userData.curve.getPoint(k));
    },


    // 粒 name が、矢印 arrows を順に旅する(1区間 seg 秒、全体 loop 秒でくり返し。loop 省略時は1回きり)
    chain: function (g, name, arrows, t, seg, loop) {
      var o = g.get(name);
      var tt = loop ? t % loop : t;
      var i = Math.floor(tt / seg);
      if (i >= arrows.length) { o.position.y = -50; return; }
      o.position.copy(g.get('a-' + arrows[i]).userData.curve.getPoint(g.linear(tt, i * seg, seg)));
    },

    // 一つの箱(名前 + 小さな説明)
    node: function (g, id, pos, size, color, label, o) {
      o = o || {};
      return g.box({ id: id, size: size, pos: [pos[0], size[1] / 2, pos[2]], color: color, radius: 0.18, label: label, labelSize: o.labelSize || 0.3, labelBg: '#00000088', labelOffset: o.labelOffset });
    },
  };
})();
