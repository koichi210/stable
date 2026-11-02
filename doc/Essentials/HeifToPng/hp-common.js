/*
 * HeifToPng ガイド用の小さな補助（スクショを3D空間のパネルとして置く）。
 * 画像は shots-data.js(window.HP_IMGS) のデータURLから作る。file:// でもテクスチャにできるようにするため。
 */
(function () {
  var T = window.THREE;
  var SIZE = { start: [820, 560], done: [820, 560], dialog: [411, 165] };   // スクショの元のピクセル数

  window.HP = {
    W: 9.6,                          // メイン画面パネルの幅(ワールド単位)
    BOTTOM: 0.5,                     // パネル下端の高さ
    H: 9.6 * 560 / 820,              // メイン画面パネルの高さ

    // スクショを1枚のパネルとして置く。cx = パネル中心のx、w = 幅(省略時はメイン画面の幅)、y0 = 下端の高さ
    panel: function (g, id, key, cx, w, y0, z) {
      var px = SIZE[key];
      w = w || HP.W;
      var h = w * px[1] / px[0];
      y0 = y0 == null ? HP.BOTTOM : y0;
      z = z || 0;
      var img = new Image();
      var tex = new T.Texture(img);
      tex.anisotropy = 8;
      tex.minFilter = T.LinearFilter;
      img.onload = function () { tex.needsUpdate = true; };
      img.src = window.HP_IMGS[key];
      var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex }));
      m.position.set(cx, y0 + h / 2, z);
      g.add(id, m);
      g.box({ id: id + '-frame', size: [w + 0.3, h + 0.3, 0.1], pos: [cx, y0 + h / 2, z - 0.08], color: '#2d2944', edges: false });
      return m;
    },

    // メイン画面のスクショ上のピクセル座標 → ワールド座標
    pt: function (cx, x, y, z) {
      return [cx - HP.W / 2 + x / 820 * HP.W, HP.BOTTOM + HP.H - y / 560 * HP.H, z == null ? 0.06 : z];
    },

    // スクショ上の長方形(ピクセル)を、パネルの手前に光る枠で示す
    hl: function (g, id, cx, x0, y0, x1, y1, color) {
      var a = HP.pt(cx, x0, y0), b = HP.pt(cx, x1, y1);
      return g.box({
        id: id, size: [b[0] - a[0], a[1] - b[1], 0.05], pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.08],
        color: color || '#ffd166', emissive: color || '#ffd166', emissiveIntensity: 0.5, opacity: 0.13, edges: true, edgeColor: color || '#ffd166',
      });
    },

    // 注目点にカメラを寄せる設定。(x, y) はスクショ上のピクセル、dist はカメラの距離
    cam: function (cx, x, y, dist) {
      var p = HP.pt(cx, x, y, 0);
      return { pos: [p[0], p[1] + 0.05, dist], target: [p[0], p[1], 0] };
    },
  };
})();
