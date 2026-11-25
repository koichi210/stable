/*
 * FiddleAroundString ガイド用の小さな補助（実画面のスクショを3D空間のパネルとして置く）。
 * 画像は shots-data.js(window.FAS_IMGS) のデータURLから作る。file:// でもテクスチャにできるようにするため。
 *
 * スクショはどれも同じウィンドウ(816×533ピクセル)なので、1ピクセルが何ワールド単位かは共通(S)。
 */
(function () {
  var T = window.THREE;
  var PX_W = 816, PX_H = 533;
  var S = 9.6 / PX_W;                      // 画面1枚をワールド幅9.6に置く
  var L = {};                              // パネルid -> { cx, by, w, h }

  window.FAS = {
    W: PX_W * S,
    H: PX_H * S,
    L: L,

    // パネルの位置だけを先に登録する(ステップのカメラ位置は build より前に計算されるため)
    place: function (id, cx, by) {
      L[id] = { cx: cx, by: by, w: PX_W * S, h: PX_H * S };
    },

    // スクショを1枚のパネルとして置く。key = FAS_IMGS のキー、cx = パネル中心のx、by = パネル下端のy
    panel: function (g, id, key, cx, by) {
      FAS.place(id, cx, by);
      var p = L[id];
      var img = new Image();
      var tex = new T.Texture(img);
      tex.anisotropy = 8;
      tex.minFilter = T.LinearFilter;
      img.onload = function () { tex.needsUpdate = true; };
      img.src = window.FAS_IMGS[key];
      var m = new T.Mesh(new T.PlaneGeometry(p.w, p.h), new T.MeshBasicMaterial({ map: tex }));
      m.position.set(cx, by + p.h / 2, 0);
      g.add(id, m);
      g.box({ id: id + '-frame', size: [p.w + 0.25, p.h + 0.25, 0.1], pos: [cx, by + p.h / 2, -0.08], color: '#2d2944', edges: false });
      return m;
    },

    // スクショ上のピクセル座標 → ワールド座標
    pt: function (id, x, y, z) {
      var p = L[id];
      return [p.cx - p.w / 2 + x * S, p.by + p.h - y * S, z == null ? 0.06 : z];
    },

    // スクショ上の長方形(ピクセル)を、パネルの手前に光る枠で示す
    hl: function (g, hid, id, x0, y0, x1, y1, color) {
      var a = FAS.pt(id, x0, y0), b = FAS.pt(id, x1, y1);
      return g.box({
        id: hid, size: [b[0] - a[0], a[1] - b[1], 0.05], pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.08],
        color: color || '#ffd166', emissive: color || '#ffd166', emissiveIntensity: 0.5, opacity: 0.13, edges: true, edgeColor: color || '#ffd166',
      });
    },

    // 注目点にカメラを寄せる設定。(x, y) はスクショ上のピクセル、dist はカメラの距離
    cam: function (id, x, y, dist) {
      var p = FAS.pt(id, x, y, 0);
      return { pos: [p[0], p[1] + 0.05, dist], target: [p[0], p[1], 0] };
    },
  };
})();
