/*
 * Cheetos ガイド用の小さな補助（実画面のスクショを3D空間のパネルとして置く）。
 * 画像は shots-data.js(window.CH_IMGS) のデータURLから作る。file:// でもテクスチャにできるようにするため。
 *
 * 画像のピクセル数は画像ごとに違う(アプリ画面は2倍解像度で撮ってある)ので、
 * 画像ごとの 幅・高さ・「1ピクセルが何ワールド単位か」を IM に持つ。
 */
(function () {
  var T = window.THREE;
  var MAIN_S = 6.4 / 934;                 // アプリ本体の画面(934px幅)を、ワールド幅6.4に置く
  var IM = {
    cap:        { w: 934,  h: 862, s: MAIN_S },
    run:        { w: 934,  h: 862, s: MAIN_S },
    trim:       { w: 934,  h: 862, s: MAIN_S },
    trimdone:   { w: 934,  h: 862, s: MAIN_S },
    rot:        { w: 934,  h: 862, s: MAIN_S },
    rotprev:    { w: 1200, h: 700, s: MAIN_S * 1268 / 1200 },   // RotationPreview は元が1268px幅 → 1200pxに縮めてある
    dist:       { w: 934,  h: 862, s: MAIN_S },
    distsample: { w: 268,  h: 334, s: MAIN_S * 1.6 },           // MessageBox は元が小さいので、見やすいよう1.6倍に置く
    merge:      { w: 934,  h: 862, s: MAIN_S },
    collect:    { w: 934,  h: 862, s: MAIN_S },
  };
  var L = {};                              // id -> { cx, by, w, h, im }

  window.CH = {
    IM: IM,
    L: L,

    // パネルの位置だけを先に登録する(ステップのカメラ位置は build より前に計算されるため)
    place: function (id, key, cx, by) {
      var im = IM[key];
      L[id] = { cx: cx, by: by, w: im.w * im.s, h: im.h * im.s, im: im };
    },

    // スクショを1枚のパネルとして置く。cx = パネル中心のx、by = パネル下端のy
    panel: function (g, id, key, cx, by) {
      CH.place(id, key, cx, by);
      var im = IM[key];
      var w = im.w * im.s, h = im.h * im.s;
      var img = new Image();
      var tex = new T.Texture(img);
      tex.anisotropy = 8;
      tex.minFilter = T.LinearFilter;
      img.onload = function () { tex.needsUpdate = true; };
      img.src = window.CH_IMGS[key];
      var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex }));
      m.position.set(cx, by + h / 2, 0);
      g.add(id, m);
      g.box({ id: id + '-frame', size: [w + 0.25, h + 0.25, 0.1], pos: [cx, by + h / 2, -0.08], color: '#2d2944', edges: false });
      return m;
    },

    // スクショ上のピクセル座標 → ワールド座標
    pt: function (id, x, y, z) {
      var p = L[id];
      return [p.cx - p.w / 2 + x * p.im.s, p.by + p.h - y * p.im.s, z == null ? 0.06 : z];
    },

    // スクショ上の長方形(ピクセル)を、パネルの手前に光る枠で示す
    hl: function (g, hid, id, x0, y0, x1, y1, color) {
      var a = CH.pt(id, x0, y0), b = CH.pt(id, x1, y1);
      return g.box({
        id: hid, size: [b[0] - a[0], a[1] - b[1], 0.05], pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.08],
        color: color || '#ffd166', emissive: color || '#ffd166', emissiveIntensity: 0.5, opacity: 0.13, edges: true, edgeColor: color || '#ffd166',
      });
    },

    // 注目点にカメラを寄せる設定。(x, y) はスクショ上のピクセル、dist はカメラの距離
    cam: function (id, x, y, dist) {
      var p = CH.pt(id, x, y, 0);
      return { pos: [p[0], p[1] + 0.05, dist], target: [p[0], p[1], 0] };
    },
  };
})();
