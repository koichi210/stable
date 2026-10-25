/*
 * LoginHistory ガイド用の小さな補助（スクショを3D空間のパネルとして置く）。
 * 画像は lh-img.js(window.LH_IMGS) のデータURLから作る。file:// でもテクスチャにできるようにするため。
 */
(function () {
  var T = window.THREE;
  var PW = 864, PH = 488;            // スクショの元のピクセル数

  window.LH = {
    W: 9.6,                          // パネルの幅(ワールド単位)
    H: 9.6 * PH / PW,                // パネルの高さ
    BOTTOM: 0.5,                     // パネル下端の高さ

    // スクショを1枚のパネルとして置く。cx = パネル中心のx
    panel: function (g, id, key, cx) {
      var w = LH.W, h = LH.H;
      var img = new Image();
      var tex = new T.Texture(img);
      tex.anisotropy = 8;
      tex.minFilter = T.LinearFilter;
      img.onload = function () { tex.needsUpdate = true; };
      img.src = window.LH_IMGS[key];
      var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex }));
      m.position.set(cx, h / 2 + LH.BOTTOM, 0);
      g.add(id, m);
      g.box({ id: id + '-frame', size: [w + 0.3, h + 0.3, 0.1], pos: [cx, h / 2 + LH.BOTTOM, -0.08], color: '#2d2944', edges: false });
      return m;
    },

    // スクショ上のピクセル座標 → ワールド座標
    pt: function (cx, x, y, z) {
      return [cx - LH.W / 2 + x / PW * LH.W, LH.BOTTOM + LH.H - y / PH * LH.H, z == null ? 0.06 : z];
    },

    // スクショ上の長方形(ピクセル)を、パネルの手前に光る枠で示す
    hl: function (g, id, cx, x0, y0, x1, y1, color) {
      var a = LH.pt(cx, x0, y0), b = LH.pt(cx, x1, y1);
      return g.box({
        id: id, size: [b[0] - a[0], a[1] - b[1], 0.05], pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.08],
        color: color || '#ffd166', emissive: color || '#ffd166', emissiveIntensity: 0.5, opacity: 0.13, edges: true, edgeColor: color || '#ffd166',
      });
    },

    // 注目点にカメラを寄せる設定。(x, y) はスクショ上のピクセル、dist はカメラの距離
    cam: function (cx, x, y, dist) {
      var p = LH.pt(cx, x, y, 0);
      return { pos: [p[0], p[1] + 0.05, dist], target: [p[0], p[1], 0] };
    },
  };
})();
