/*
 * StockRadar ガイド用の小さな補助（実画面のスクショを3D空間のパネルとして置く）。
 * 画像は shots-data.js(window.SR_IMGS) のデータURLから作る。file:// でもテクスチャにできるようにするため。
 * スクショはどれも 1200x800 ピクセル(ブラウザの画面をそのまま撮ったもの)。
 */
(function () {
  var T = window.THREE;
  var PX_W = 1200, PX_H = 800;
  var S = 8 / PX_W;                        // 1ピクセル = 何ワールド単位か(パネルの幅を8にする)
  var L = {};                              // id -> { cx, by, w, h }

  window.SR = {
    W: PX_W * S,
    H: PX_H * S,
    L: L,

    // パネルの位置だけを先に登録する(ステップのカメラ位置は build より前に計算されるため)
    place: function (id, cx, by) {
      L[id] = { cx: cx, by: by, w: PX_W * S, h: PX_H * S };
    },

    // スクショを1枚のパネルとして置く。cx = パネル中心のx、by = パネル下端のy
    panel: function (g, id, key, cx, by) {
      SR.place(id, cx, by);
      var w = PX_W * S, h = PX_H * S;
      var img = new Image();
      var tex = new T.Texture(img);
      tex.anisotropy = 8;
      tex.minFilter = T.LinearFilter;
      img.onload = function () { tex.needsUpdate = true; };
      img.src = window.SR_IMGS[key];
      var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex }));
      m.position.set(cx, by + h / 2, 0);
      g.add(id, m);
      g.box({ id: id + '-frame', size: [w + 0.25, h + 0.25, 0.1], pos: [cx, by + h / 2, -0.08], color: '#2d2944', edges: false });
      return m;
    },

    // スクショ上のピクセル座標 → ワールド座標
    pt: function (id, x, y, z) {
      var p = L[id];
      return [p.cx - p.w / 2 + x * S, p.by + p.h - y * S, z == null ? 0.06 : z];
    },

    // スクショ上の長方形(ピクセル)を、パネルの手前に光る枠で示す
    hl: function (g, hid, id, x0, y0, x1, y1, color) {
      var a = SR.pt(id, x0, y0), b = SR.pt(id, x1, y1);
      return g.box({
        id: hid, size: [b[0] - a[0], a[1] - b[1], 0.05], pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.08],
        color: color || '#ffd166', emissive: color || '#ffd166', emissiveIntensity: 0.5, opacity: 0.13, edges: true, edgeColor: color || '#ffd166',
      });
    },

    // 注目点にカメラを寄せる設定。(x, y) はスクショ上のピクセル、dist はカメラの距離
    cam: function (id, x, y, dist) {
      var p = SR.pt(id, x, y, 0);
      return { pos: [p[0], p[1] + 0.05, dist], target: [p[0], p[1], 0] };
    },
  };
})();
