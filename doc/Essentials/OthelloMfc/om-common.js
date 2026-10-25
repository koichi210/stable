/*
 * OthelloMfc ガイド用の小さな補助（スクショを3D空間のパネルとして置く）。
 * 画像は img-data.js(window.OM_IMGS) のデータURLから作る。file:// でもテクスチャにできるようにするため。
 */
(function () {
  var T = window.THREE;
  var SIZE = { start: [606, 573], playing: [606, 573], ended: [606, 573], kifu: [175, 367], enddlg: [173, 152] };

  window.OM = {
    P: {},            // key -> { cx, bottom, w, h, pw, ph }

    // 配置だけ先に登録する(カメラ位置の計算を、パネルを作る前にしたいとき用)
    reg: function (key, cx, bottom, w) {
      var pw = SIZE[key][0], ph = SIZE[key][1];
      OM.P[key] = { cx: cx, bottom: bottom, w: w, h: w * ph / pw, pw: pw, ph: ph };
    },

    // スクショを1枚のパネルとして置く。cx = 中心x、bottom = 下端の高さ、w = 幅(ワールド単位)
    panel: function (g, id, key, cx, bottom, w) {
      OM.reg(key, cx, bottom, w);
      var h = OM.P[key].h;
      var img = new Image();
      var tex = new T.Texture(img);
      tex.anisotropy = 8;
      tex.minFilter = T.LinearFilter;
      img.onload = function () { tex.needsUpdate = true; };
      img.src = window.OM_IMGS[key];
      var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex }));
      m.position.set(cx, h / 2 + bottom, 0);
      g.add(id, m);
      g.box({ id: id + '-frame', size: [w + 0.3, h + 0.3, 0.1], pos: [cx, h / 2 + bottom, -0.08], color: '#2d2944', edges: false });
      return m;
    },

    // スクショ上のピクセル座標 → ワールド座標
    pt: function (key, x, y, z) {
      var p = OM.P[key];
      return [p.cx - p.w / 2 + x / p.pw * p.w, p.bottom + p.h - y / p.ph * p.h, z == null ? 0.06 : z];
    },

    // スクショ上の長方形(ピクセル)を、パネルの手前に光る枠で示す
    hl: function (g, id, key, x0, y0, x1, y1, color) {
      var a = OM.pt(key, x0, y0), b = OM.pt(key, x1, y1);
      return g.box({
        id: id, size: [b[0] - a[0], a[1] - b[1], 0.05], pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.08],
        color: color || '#ffd166', emissive: color || '#ffd166', emissiveIntensity: 0.5, opacity: 0.13, edges: true, edgeColor: color || '#ffd166',
      });
    },

    // 注目点にカメラを寄せる設定。(x, y) はスクショ上のピクセル、dist はカメラの距離
    cam: function (key, x, y, dist) {
      var p = OM.pt(key, x, y, 0);
      return { pos: [p[0], p[1] + 0.05, dist], target: [p[0], p[1], 0] };
    },
  };
})();
