/*
 * MagicLauncher ガイド用の小さな補助（画面写真を3D空間のパネルとして置く）。
 * 画像は shots-data.js(window.ML_IMGS) のデータURLから作る。file:// でもテクスチャにできるようにするため。
 * 座標はすべて、撮影したときの画面(1200×720 ピクセル)の上の位置で指定する。
 */
(function () {
  var T = window.THREE;
  var PX = [1200, 720];          // 撮影したときの画面の大きさ(ピクセル)
  var W = 8, H = W * PX[1] / PX[0];
  var COLS = [-18, -9, 0, 9, 18], ROWS = [12.6, 6.2, -0.2];
  // パネルの並び(左上から): 写真の名前 → [列, 行, 見出し]
  var LAYOUT = {
    main:      [0, 0, '① 起動したところ(全体表示)'],
    open:      [1, 0, '② クリックで開く'],
    edit:      [2, 0, '③ 右クリックで編集'],
    add:       [3, 0, '④ 新しく登録'],
    drag:      [4, 0, '⑤ ドラッグで入れ替え'],
    tag:       [0, 1, '⑥ タグで絞り込み'],
    search:    [1, 1, '⑦ キーを打って検索'],
    settings:  [2, 1, '⑧ ⚙ 設定'],
    rename:    [3, 1, '⑨ タグの名前の変更'],
    settings2: [4, 1, '⑩ 設定(タグを置く魔法陣)'],
    idle:      [0, 2, '⑪ 待機中の動き'],
    list:      [1, 2, '⑫ ☰ 一覧'],
    lite:      [2, 2, '⑬ 🍃 Light 版'],
    broken:    [3, 2, '⑭ 設定ファイルが壊れたとき'],
  };

  function center(key) { var l = LAYOUT[key]; return [COLS[l[0]], ROWS[l[1]]]; }

  window.ML = {
    W: W, H: H, LAYOUT: LAYOUT,
    keys: function () { return Object.keys(LAYOUT); },

    // 写真を1枚のパネルとして置く(入れ物の id は 'p-' + 名前)
    panel: function (g, key) {
      var c = center(key);
      g.group('p-' + key, { pos: [c[0], c[1], 0] });
      g.box({ id: 'f-' + key, parent: 'p-' + key, size: [W + 0.3, H + 0.3, 0.1], pos: [0, 0, -0.08], color: '#2d2944', edgeColor: '#9b84ff' });
      var img = new Image();
      var tex = new T.Texture(img);
      tex.anisotropy = 8;
      tex.minFilter = T.LinearFilter;
      img.onload = function () { tex.needsUpdate = true; };
      img.src = window.ML_IMGS[key];
      g.add('s-' + key, new T.Mesh(new T.PlaneGeometry(W, H), new T.MeshBasicMaterial({ map: tex })), 'p-' + key);
      g.label(LAYOUT[key][2], [0, H / 2 + 0.55, 0], { id: 't-' + key, parent: 'p-' + key, size: 0.38, bg: '#000000aa' });
    },

    // 写真の上のピクセル座標 → ワールド座標
    pt: function (key, x, y, z) {
      var c = center(key), l = ML.lpt(x, y, z);
      return [c[0] + l[0], c[1] + l[1], l[2]];
    },
    // 写真の上のピクセル座標 → パネルの中の座標(注目枠などはパネルの子にして、パネルと一緒に明るく・薄くする)
    lpt: function (x, y, z) {
      return [-W / 2 + x / PX[0] * W, H / 2 - y / PX[1] * H, z == null ? 0.06 : z];
    },

    // 写真の上の長方形(ピクセル)を、パネルの手前に光る枠で示す
    hl: function (g, id, key, x0, y0, x1, y1, color) {
      var a = ML.lpt(x0, y0), b = ML.lpt(x1, y1);
      return g.box({
        id: id, parent: 'p-' + key, size: [b[0] - a[0], a[1] - b[1], 0.05], pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.08],
        color: color || '#ffd166', emissive: color || '#ffd166', emissiveIntensity: 0.5, opacity: 0.13, edges: true, edgeColor: color || '#ffd166',
      });
    },

    // 写真の上の丸いもの(魔法陣の円・分岐点)を囲む光る輪。r はピクセル
    ring: function (g, id, key, x, y, r, color) {
      var k = r / PX[0] * W;
      var m = new T.Mesh(new T.RingGeometry(k, k * 1.18 + 0.02, 40), new T.MeshBasicMaterial({ color: color || '#ffd166', transparent: true, opacity: 0.95, depthTest: false }));
      var p = ML.lpt(x, y, 0.1);
      m.position.set(p[0], p[1], p[2]);
      m.renderOrder = 10;
      return g.add(id, m, 'p-' + key);
    },

    // 写真の上に重ねる吹き出し
    note: function (g, id, key, text, x, y, color) {
      return g.label(text, ML.lpt(x, y, 0.3), { id: id, parent: 'p-' + key, size: 0.17, bg: '#000000cc', color: color || '#ffd166', border: color || '#ffd166' });
    },

    // 注目点にカメラを寄せる設定。(x, y) は写真の上のピクセル、dist はカメラの距離
    cam: function (key, x, y, dist) {
      var p = ML.pt(key, x == null ? PX[0] / 2 : x, y == null ? PX[1] / 2 : y, 0);
      return { pos: [p[0], p[1] + 0.05, dist || 9.4], target: [p[0], p[1], 0] };
    },

    // 2枚のパネルの間を見るカメラ
    cam2: function (k1, k2, dist) {
      var a = center(k1), b = center(k2);
      var x = (a[0] + b[0]) / 2, y = (a[1] + b[1]) / 2;
      return { pos: [x, y + 0.05, dist || 15], target: [x, y, 0] };
    },

    // 輪を脈打たせる(update から呼ぶ)
    beat: function (g, ids, t) {
      var s = 1 + 0.18 * Math.sin(t * 3.4);
      ids.forEach(function (id) { g.get(id).scale.set(s, s, 1); });
    },
  };
})();
