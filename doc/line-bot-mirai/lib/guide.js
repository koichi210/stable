/*
 * GameGuide — Three.js でゲームの仕組みを「ステップ送り」で図解する共通フレームワーク。
 *
 * 読み込み順（各ページの <head>）:
 *   three.min.js (r128) → OrbitControls.js (r128) → lib/guide.js
 * ES Module にしていないのは、HTML をダブルクリック（file://）で開いても動かすため。
 *
 * 使い方:
 *   GameGuide.start({
 *     title: 'ゲーム名', subtitle: '一言説明',
 *     camera: { pos: [0, 8, 12], target: [0, 0, 0] },   // 最初のカメラ
 *     build(g) { ... g.box(...) / g.card(...) / g.arrow(...) で舞台を作る ... },
 *     steps: [
 *       {
 *         title: '見出し',
 *         html: '<p>説明（HTML可）</p>',
 *         camera: { pos: [...], target: [...] },   // 省略時はカメラを動かさない
 *         focus: ['id1', 'id2'],                      // 指定した id 以外を薄くする（省略時は全部表示）
 *         show:  ['id3'],                             // このステップでだけ見せる id（他のステップでは隠す）
 *         enter(g) {},                                // ステップに入った瞬間（位置のリセットなど）
 *         update(g, t, dt) {},                        // 毎フレーム。t はステップ開始からの秒数
 *       },
 *     ],
 *   });
 *
 * アニメーションは update(g, t) の中で t から位置を計算する書き方を推奨（途中でステップを
 * 変えても状態が壊れない）。g.phase(t, 開始秒, 長さ秒) が 0→1 のイージング値を返す。
 */
(function () {
  'use strict';
  var T = window.THREE;
  var FONT = '"Yu Gothic UI","Hiragino Sans","Meiryo",system-ui,sans-serif';

  function v3(a) {
    if (a instanceof T.Vector3) return a.clone();
    return new T.Vector3(a[0] || 0, a[1] || 0, a[2] || 0);
  }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { x = clamp01(x); return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // 複数行テキストをキャンバスに描く（ラベル用）
  function textCanvas(text, o) {
    var lines = String(text).split('\n');
    var px = 56, lh = px * 1.28, pad = px * 0.5;
    var c = document.createElement('canvas');
    var ctx = c.getContext('2d');
    var font = (o.bold === false ? '' : 'bold ') + px + 'px ' + FONT;
    ctx.font = font;
    var w = 0;
    lines.forEach(function (l) { w = Math.max(w, ctx.measureText(l).width); });
    c.width = Math.ceil(w + pad * 2);
    c.height = Math.ceil(lh * lines.length + pad * 0.9);
    ctx.font = font;
    if (o.bg) {
      ctx.fillStyle = o.bg;
      roundRect(ctx, 3, 3, c.width - 6, c.height - 6, px * 0.35);
      ctx.fill();
      if (o.border) { ctx.lineWidth = 5; ctx.strokeStyle = o.border; ctx.stroke(); }
    }
    ctx.fillStyle = o.color || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach(function (l, i) { ctx.fillText(l, c.width / 2, pad * 0.45 + lh * (i + 0.5)); });
    return { canvas: c, lines: lines.length, px: px, lh: lh };
  }

  // カードの表面
  function cardCanvas(o) {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 360;
    var ctx = c.getContext('2d');
    ctx.fillStyle = o.face || '#fbfaff';
    roundRect(ctx, 0, 0, 256, 360, 22); ctx.fill();
    ctx.lineWidth = 10; ctx.strokeStyle = o.color || '#7b5cff';
    roundRect(ctx, 8, 8, 240, 344, 18); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = o.ink || o.color || '#7b5cff';
    var big = String(o.text || '');
    var size = big.length <= 2 ? 120 : big.length <= 4 ? 72 : 48;
    ctx.font = 'bold ' + size + 'px ' + FONT;
    ctx.fillText(big, 128, o.sub ? 150 : 180);
    if (o.sub) {
      ctx.fillStyle = '#3a3650';
      var subs = String(o.sub).split('\n');
      ctx.font = 'bold 34px ' + FONT;
      subs.forEach(function (s, i) { ctx.fillText(s, 128, 260 + i * 42); });
    }
    return c;
  }

  function backCanvas(color) {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 360;
    var ctx = c.getContext('2d');
    ctx.fillStyle = color || '#3b2f7a';
    roundRect(ctx, 0, 0, 256, 360, 22); ctx.fill();
    ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 6;
    for (var i = -360; i < 360; i += 36) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 360, 360); ctx.stroke(); }
    ctx.fillStyle = '#ffffffcc'; ctx.font = 'bold 90px ' + FONT;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', 128, 180);
    return c;
  }

  function texture(canvas) {
    var tx = new T.CanvasTexture(canvas);
    tx.anisotropy = 4;
    tx.minFilter = T.LinearFilter;
    return tx;
  }

  // ------------------------------------------------------------------ Guide
  function Guide(cfg) {
    this.cfg = cfg;
    this.THREE = T;
    this.objects = {};       // id -> Object3D
    this.dim = {};           // id -> { cur, target }
    this.frameFns = [];      // 常時動くアニメーション
    this.stepIndex = -1;
    this.stepTime = 0;
    this.camAnim = null;
    this._setupDom();
    this._setupThree();
    var self = this;
    cfg.build && cfg.build(this);
    Object.keys(this.objects).forEach(function (id) { self.dim[id] = { cur: 1, target: 1 }; });
    this._snapshot();
    // URL の #3 のような指定でそのステップから開く（共有リンク・動作確認用）
    var m = /^#(\d+)$/.exec(location.hash);
    var first = m ? Math.min(Math.max(parseInt(m[1], 10) - 1, 0), cfg.steps.length - 1) : 0;
    if (first > 0 && cfg.steps[first].camera) {
      this.camera.position.copy(v3(cfg.steps[first].camera.pos));
      this.controls.target.copy(v3(cfg.steps[first].camera.target || [0, 0, 0]));
    }
    this.go(first);
    this.camAnim = first > 0 ? null : this.camAnim;
    this._loop();
  }

  Guide.prototype._setupDom = function () {
    var cfg = this.cfg;
    document.title = cfg.title + ' | 仕組み図解';
    var root = document.createElement('div');
    root.className = 'gg-root';
    root.innerHTML =
      '<header class="gg-header">' +
      '<a class="gg-back" href="' + (cfg.back || 'index.html') + '">← 一覧</a>' +
      '<div><h1>' + esc(cfg.title) + '</h1>' +
      (cfg.subtitle ? '<div class="gg-sub">' + esc(cfg.subtitle) + '</div>' : '') + '</div>' +
      '</header>' +
      '<main class="gg-main">' +
      '<div class="gg-stage"><div class="gg-hint">ドラッグで回転・ホイールで拡大縮小</div></div>' +
      '<aside class="gg-panel">' +
      '<nav class="gg-steps"></nav>' +
      '<section class="gg-body"></section>' +
      '<div class="gg-nav"><button data-k="prev">← 前へ</button><button data-k="next" class="primary">次へ →</button></div>' +
      '</aside></main>';
    document.body.appendChild(root);
    this.stage = root.querySelector('.gg-stage');
    this.stepsEl = root.querySelector('.gg-steps');
    this.bodyEl = root.querySelector('.gg-body');
    this.prevBtn = root.querySelector('[data-k=prev]');
    this.nextBtn = root.querySelector('[data-k=next]');
    var self = this;
    cfg.steps.forEach(function (s, i) {
      var b = document.createElement('button');
      b.textContent = String(i + 1);
      b.title = s.title;
      b.onclick = function () { self.go(i); };
      self.stepsEl.appendChild(b);
    });
    this.prevBtn.onclick = function () { self.go(self.stepIndex - 1); };
    this.nextBtn.onclick = function () { self.go(self.stepIndex + 1); };
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') self.go(self.stepIndex + 1);
      if (e.key === 'ArrowLeft') self.go(self.stepIndex - 1);
    });
  };

  Guide.prototype._setupThree = function () {
    var bg = getComputedStyle(document.documentElement).getPropertyValue('--scene-bg').trim() || '#14121c';
    var renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(new T.Color(bg));
    this.stage.insertBefore(renderer.domElement, this.stage.firstChild);
    var scene = new T.Scene();
    scene.fog = new T.Fog(new T.Color(bg), 40, 90);
    var cam = new T.PerspectiveCamera(45, 1, 0.1, 200);
    var c0 = this.cfg.camera || { pos: [0, 8, 14], target: [0, 0, 0] };
    cam.position.copy(v3(c0.pos));
    var controls = new T.OrbitControls(cam, renderer.domElement);
    controls.target.copy(v3(c0.target));
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 60;
    controls.addEventListener('start', function () { self.camAnim = null; });

    scene.add(new T.HemisphereLight(0xffffff, 0x302850, 0.75));
    var sun = new T.DirectionalLight(0xffffff, 0.75);
    sun.position.set(6, 14, 8);
    scene.add(sun);

    if (this.cfg.floor !== false) {
      var grid = new T.GridHelper(40, 40, 0x4a4466, 0x2a2638);
      grid.position.y = -0.01;
      grid.material.transparent = true;
      grid.material.opacity = 0.55;
      scene.add(grid);
    }

    this.renderer = renderer; this.scene = scene; this.camera = cam; this.controls = controls;
    this.clock = new T.Clock();
    var self = this;
    function resize() {
      var w = self.stage.clientWidth, h = self.stage.clientHeight;
      renderer.setSize(w, h, false);
      cam.aspect = w / Math.max(h, 1);
      cam.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();
  };

  // ------------------------------------------------------------- 登録・取得
  Guide.prototype.add = function (id, obj, parent) {
    (parent ? this.get(parent) : this.scene).add(obj);
    if (id) {
      this.objects[id] = obj;
      obj.name = id;
      if (this.dim && !this.dim[id]) this.dim[id] = { cur: 1, target: 1 };
    }
    return obj;
  };
  Guide.prototype.get = function (id) {
    var o = this.objects[id];
    if (!o) console.warn('[GameGuide] 未登録の id:', id);
    return o;
  };

  // 子要素を持つ入れ物（まとめて動かしたい・まとめて focus したいとき）
  Guide.prototype.group = function (id, o) {
    o = o || {};
    var g = new T.Group();
    if (o.pos) g.position.copy(v3(o.pos));
    if (o.rot) g.rotation.set(o.rot[0] || 0, o.rot[1] || 0, o.rot[2] || 0);
    return this.add(id, g, o.parent);
  };

  // 文字ラベル（常にカメラを向く）。size は1行あたりの高さ（ワールド単位）
  Guide.prototype.label = function (text, pos, o) {
    o = o || {};
    var tc = textCanvas(text, o);
    var mat = new T.SpriteMaterial({ map: texture(tc.canvas), transparent: true, depthTest: o.depthTest === true, depthWrite: false });
    var sp = new T.Sprite(mat);
    var hgt = (o.size || 0.42) * (tc.canvas.height / tc.lh);
    sp.scale.set(hgt * tc.canvas.width / tc.canvas.height, hgt, 1);
    sp.position.copy(v3(pos || [0, 0, 0]));
    sp.renderOrder = 10;
    return this.add(o.id, sp, o.parent);
  };

  // ラベルの文字を後から差し替える
  Guide.prototype.setLabel = function (sprite, text, o) {
    if (typeof sprite === 'string') sprite = this.get(sprite);
    o = o || {};
    var tc = textCanvas(text, o);
    // build 時のテクスチャはステップ切り替えで戻すので捨てない
    if (sprite.material.map !== sprite.userData.origMap) sprite.material.map.dispose();
    sprite.material.map = texture(tc.canvas);
    var hgt = (o.size || 0.42) * (tc.canvas.height / tc.lh);
    sprite.scale.set(hgt * tc.canvas.width / tc.canvas.height, hgt, 1);
  };

  function stdMat(o) {
    return new T.MeshStandardMaterial({
      color: new T.Color(o.color || '#7b5cff'),
      roughness: o.roughness == null ? 0.55 : o.roughness,
      metalness: o.metalness == null ? 0.05 : o.metalness,
      emissive: new T.Color(o.emissive || '#000000'),
      emissiveIntensity: o.emissiveIntensity == null ? 1 : o.emissiveIntensity,
      transparent: o.opacity != null && o.opacity < 1,
      opacity: o.opacity == null ? 1 : o.opacity,
      wireframe: !!o.wireframe,
    });
  }

  function attachLabel(self, mesh, o, defaultY) {
    if (!o.label) return;
    var sp = self.label(o.label, o.labelOffset || [0, defaultY, 0], { size: o.labelSize, color: o.labelColor, bg: o.labelBg, border: o.labelBorder });
    if (sp.parent) sp.parent.remove(sp);
    mesh.add(sp);
    mesh.userData.label = sp;
  }

  // 箱。size=[幅,高さ,奥行]、pos は箱の中心
  Guide.prototype.box = function (o) {
    o = o || {};
    var s = o.size || [1, 1, 1];
    var geo = o.radius ? roundedBoxGeo(s, o.radius) : new T.BoxGeometry(s[0], s[1], s[2]);
    var m = new T.Mesh(geo, stdMat(o));
    if (o.pos) m.position.copy(v3(o.pos));
    if (o.rot) m.rotation.set(o.rot[0] || 0, o.rot[1] || 0, o.rot[2] || 0);
    if (o.edges !== false) {
      var e = new T.LineSegments(new T.EdgesGeometry(geo), new T.LineBasicMaterial({ color: o.edgeColor || '#ffffff', transparent: true, opacity: 0.35 }));
      m.add(e);
    }
    attachLabel(this, m, o, s[1] / 2 + 0.6);
    return this.add(o.id, m, o.parent);
  };

  function roundedBoxGeo(s, r) {
    // 角を丸めた板（Shape を押し出す）。高さ方向(y)に厚み s[1]
    var w = s[0], d = s[2];
    r = Math.min(r, w / 2, d / 2);
    var sh = new T.Shape();
    sh.moveTo(-w / 2 + r, -d / 2);
    sh.lineTo(w / 2 - r, -d / 2); sh.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
    sh.lineTo(w / 2, d / 2 - r); sh.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
    sh.lineTo(-w / 2 + r, d / 2); sh.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
    sh.lineTo(-w / 2, -d / 2 + r); sh.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
    var geo = new T.ExtrudeGeometry(sh, { depth: s[1], bevelEnabled: false });
    geo.rotateX(Math.PI / 2);
    geo.translate(0, s[1] / 2, 0);
    return geo;
  }

  // 円柱（コイン・駒・塔など）
  Guide.prototype.cylinder = function (o) {
    o = o || {};
    var geo = new T.CylinderGeometry(o.radiusTop == null ? (o.radius || 0.5) : o.radiusTop, o.radius || 0.5, o.height || 1, o.segments || 32);
    var m = new T.Mesh(geo, stdMat(o));
    if (o.pos) m.position.copy(v3(o.pos));
    if (o.rot) m.rotation.set(o.rot[0] || 0, o.rot[1] || 0, o.rot[2] || 0);
    attachLabel(this, m, o, (o.height || 1) / 2 + 0.45);
    return this.add(o.id, m, o.parent);
  };

  // 球
  Guide.prototype.sphere = function (o) {
    o = o || {};
    var m = new T.Mesh(new T.SphereGeometry(o.radius || 0.5, 32, 20), stdMat(o));
    if (o.pos) m.position.copy(v3(o.pos));
    attachLabel(this, m, o, (o.radius || 0.5) + 0.45);
    return this.add(o.id, m, o.parent);
  };

  // 平らな板（マス目・エリア・ゾーン表示）。y はほぼ0に置く想定
  Guide.prototype.plate = function (o) {
    o = o || {};
    var s = o.size || [2, 2];
    return this.box({
      id: o.id, parent: o.parent, size: [s[0], o.thickness || 0.06, s[1]], pos: o.pos || [0, 0.03, 0],
      color: o.color || '#2d2944', opacity: o.opacity == null ? 0.9 : o.opacity, radius: o.radius == null ? 0.12 : o.radius,
      edges: false, label: o.label, labelOffset: o.labelOffset || [0, 0.4, -s[1] / 2 - 0.1], labelSize: o.labelSize || 0.32,
      labelColor: o.labelColor, labelBg: o.labelBg, emissive: o.emissive, emissiveIntensity: o.emissiveIntensity,
    });
  };

  // カード。text=大きい文字（♠A など）、sub=下段の小さい文字（改行可）
  // faceDown:true で裏向き。lying:true で寝かせる（既定は寝かせる）
  Guide.prototype.card = function (o) {
    o = o || {};
    var w = o.w || 0.9, h = w * 1.4;
    var geo = new T.BoxGeometry(w, h, 0.03);
    var side = new T.MeshStandardMaterial({ color: '#d8d4e8' });
    var front = new T.MeshStandardMaterial({ map: texture(cardCanvas(o)), roughness: 0.6 });
    var back = new T.MeshStandardMaterial({ map: texture(backCanvas(o.backColor)), roughness: 0.6 });
    var m = new T.Mesh(geo, [side, side, side, side, front, back]);
    var holder = new T.Group();
    holder.add(m);
    holder.userData.card = m;
    if (o.lying !== false) m.rotation.x = -Math.PI / 2;
    if (o.faceDown) m.rotation.y = Math.PI;
    if (o.pos) holder.position.copy(v3(o.pos));
    if (o.rot) holder.rotation.set(o.rot[0] || 0, o.rot[1] || 0, o.rot[2] || 0);
    if (o.label) {
      var sp = this.label(o.label, [0, 0, 0], { size: o.labelSize || 0.3, color: o.labelColor, bg: o.labelBg });
      if (sp.parent) sp.parent.remove(sp);
      sp.position.set(0, o.lying !== false ? 0.35 : h / 2 + 0.3, o.lying !== false ? -h / 2 - 0.25 : 0);
      holder.add(sp);
    }
    return this.add(o.id, holder, o.parent);
  };

  // カードの表裏を切り替える（k=0 表、k=1 裏。途中の値でめくれる途中）
  Guide.prototype.flip = function (cardHolder, k) {
    if (typeof cardHolder === 'string') cardHolder = this.get(cardHolder);
    cardHolder.userData.card.rotation.y = Math.PI * clamp01(k);
  };

  // 矢印。from→to を弧（lift の高さ）で結ぶ。dashed風にしたいときは flow を併用
  Guide.prototype.arrow = function (from, to, o) {
    o = o || {};
    var a = v3(from), b = v3(to);
    var lift = o.lift == null ? 0.8 : o.lift;
    var mid = a.clone().add(b).multiplyScalar(0.5);
    mid.y += lift;
    var curve = new T.QuadraticBezierCurve3(a, mid, b);
    var r = o.radius || 0.045;
    var grp = new T.Group();
    var head = o.head == null ? 0.28 : o.head;
    // 矢じりのぶん、線を手前で止める
    var tEnd = 1 - Math.min(0.3, head / Math.max(curve.getLength(), 0.01));
    var pts = [];
    for (var i = 0; i <= 40; i++) pts.push(curve.getPoint(tEnd * i / 40));
    var path = new T.CatmullRomCurve3(pts);
    var mat = new T.MeshStandardMaterial({ color: new T.Color(o.color || '#ffd166'), emissive: new T.Color(o.color || '#ffd166'), emissiveIntensity: 0.35, transparent: true, opacity: o.opacity == null ? 1 : o.opacity });
    grp.add(new T.Mesh(new T.TubeGeometry(path, 48, r, 8, false), mat));
    if (head > 0) {
      var cone = new T.Mesh(new T.ConeGeometry(r * 3.2, head, 16), mat);
      var tip = curve.getPoint(1), base = curve.getPoint(tEnd);
      cone.position.copy(base.clone().add(tip).multiplyScalar(0.5));
      cone.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), tip.clone().sub(base).normalize());
      grp.add(cone);
    }
    grp.userData.curve = curve;
    if (o.label) {
      var sp = this.label(o.label, [0, 0, 0], { size: o.labelSize || 0.3, color: o.labelColor || o.color || '#ffd166', bg: o.labelBg });
      if (sp.parent) sp.parent.remove(sp);
      sp.position.copy(curve.getPoint(0.5)).add(new T.Vector3(0, 0.3, 0));
      grp.add(sp);
    }
    return this.add(o.id, grp, o.parent);
  };

  // from→to（または curve）の上を光の粒が流れ続ける。データや命令の流れの表現に使う
  Guide.prototype.flow = function (from, to, o) {
    o = o || {};
    var curve;
    if (from && from.getPoint) { curve = from; o = to || {}; }
    else {
      var a = v3(from), b = v3(to);
      var mid = a.clone().add(b).multiplyScalar(0.5);
      mid.y += o.lift == null ? 0.8 : o.lift;
      curve = new T.QuadraticBezierCurve3(a, mid, b);
    }
    var grp = new T.Group();
    var n = o.count || 6;
    var mat = new T.MeshBasicMaterial({ color: new T.Color(o.color || '#7ef0ff'), transparent: true, opacity: 1 });
    var geo = new T.SphereGeometry(o.size || 0.09, 12, 8);
    var dots = [];
    for (var i = 0; i < n; i++) { var d = new T.Mesh(geo, mat); grp.add(d); dots.push(d); }
    var speed = o.speed || 0.35;
    this.onFrame(function (t) {
      if (!grp.visible) return;
      for (var i = 0; i < n; i++) {
        var u = ((t * speed) + i / n) % 1;
        dots[i].position.copy(curve.getPoint(u));
      }
    });
    grp.userData.curve = curve;
    return this.add(o.id, grp, o.parent);
  };

  // 線（折れ線）。points=[[x,y,z],...]
  Guide.prototype.line = function (points, o) {
    o = o || {};
    var geo = new T.BufferGeometry().setFromPoints(points.map(v3));
    var mat = o.dashed
      ? new T.LineDashedMaterial({ color: o.color || '#ffffff', dashSize: 0.2, gapSize: 0.12, transparent: true, opacity: o.opacity == null ? 0.8 : o.opacity })
      : new T.LineBasicMaterial({ color: o.color || '#ffffff', transparent: true, opacity: o.opacity == null ? 0.8 : o.opacity });
    var l = new T.Line(geo, mat);
    if (o.dashed) l.computeLineDistances();
    return this.add(o.id, l, o.parent);
  };

  // 毎フレーム呼ばれる関数を登録（ステップに関係なく動き続けるもの）
  Guide.prototype.onFrame = function (fn) { this.frameFns.push(fn); };

  // ------------------------------------------------------------ アニメ補助
  Guide.prototype.phase = function (t, start, dur) { return ease((t - start) / (dur || 1)); };
  Guide.prototype.linear = function (t, start, dur) { return clamp01((t - start) / (dur || 1)); };
  Guide.prototype.lerp = function (a, b, k) { return a + (b - a) * k; };
  Guide.prototype.lerpPos = function (obj, a, b, k) {
    if (typeof obj === 'string') obj = this.get(obj);
    var A = v3(a), B = v3(b);
    obj.position.copy(A.lerp(B, k));
  };
  // a→b を弧を描いて移動（カードを投げる・駒が跳ぶ）
  Guide.prototype.arcPos = function (obj, a, b, k, h) {
    if (typeof obj === 'string') obj = this.get(obj);
    var A = v3(a), B = v3(b);
    var p = A.clone().lerp(B, k);
    p.y += Math.sin(Math.PI * k) * (h == null ? 1 : h);
    obj.position.copy(p);
  };
  Guide.prototype.setPos = function (obj, p) {
    if (typeof obj === 'string') obj = this.get(obj);
    obj.position.copy(v3(p));
  };
  // 0..1 で拡大縮小のパルス（注目させたいとき）
  Guide.prototype.pulse = function (obj, t, amp) {
    if (typeof obj === 'string') obj = this.get(obj);
    // 元の拡大率を基準に掛ける（ラベルの縦横比を壊さないため）
    if (!obj.userData.pulseBase) obj.userData.pulseBase = obj.scale.clone();
    var s = 1 + (amp == null ? 0.08 : amp) * (0.5 + 0.5 * Math.sin(t * 5));
    obj.scale.copy(obj.userData.pulseBase).multiplyScalar(s);
  };
  Guide.prototype.setVisible = function (id, v) { this.get(id).visible = v; };
  Guide.prototype.setColor = function (id, color) {
    var o = typeof id === 'string' ? this.get(id) : id;
    o.traverse(function (c) {
      if (!c.material || c instanceof T.Sprite || c instanceof T.LineSegments) return;
      (Array.isArray(c.material) ? c.material : [c.material]).forEach(function (m) { if (m.color) m.color.set(color); });
    });
  };

  // build 直後の状態（位置・回転・拡大・表示・色）を覚えておき、ステップに入るたびに戻す。
  // これで前のステップのアニメーションが次のステップに持ち越されない。
  Guide.prototype._snapshot = function () {
    var snap = [];
    this.scene.traverse(function (o) {
      var mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      snap.push({
        o: o, p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone(), v: o.visible,
        map: o instanceof T.Sprite ? (o.userData.origMap = o.material.map) : null,
        c: mats.map(function (m) { return m.color ? m.color.clone() : null; }),
      });
    });
    this._snap = snap;
  };
  Guide.prototype._restore = function () {
    (this._snap || []).forEach(function (e) {
      e.o.position.copy(e.p); e.o.quaternion.copy(e.q); e.o.scale.copy(e.s); e.o.visible = e.v;
      if (e.map && e.o.material.map !== e.map) { e.o.material.map.dispose(); e.o.material.map = e.map; }
      var mats = e.o.material ? (Array.isArray(e.o.material) ? e.o.material : [e.o.material]) : [];
      mats.forEach(function (m, k) { if (e.c[k] && m.color) m.color.copy(e.c[k]); });
    });
  };

  // ------------------------------------------------------------- ステップ
  Guide.prototype.go = function (i) {
    var steps = this.cfg.steps;
    if (i < 0 || i >= steps.length || i === this.stepIndex) return;
    this.stepIndex = i;
    this.stepTime = 0;
    var s = steps[i];
    var self = this;
    this._restore();

    // 表示/非表示：どこかのステップの show に入っている id は、そのステップでだけ見せる
    var onlyIn = {};
    steps.forEach(function (st, k) { (st.show || []).forEach(function (id) { (onlyIn[id] = onlyIn[id] || {})[k] = true; }); });
    Object.keys(onlyIn).forEach(function (id) { if (self.objects[id]) self.objects[id].visible = !!onlyIn[id][i]; });

    // 注目：focus 以外を薄くする
    var f = s.focus ? {} : null;
    if (f) s.focus.forEach(function (id) { f[id] = true; });
    Object.keys(this.dim).forEach(function (id) {
      var keep = !f || f[id] || self._isAncestorFocused(id, f);
      self.dim[id].target = keep ? 1 : 0.14;
    });

    // カメラ
    if (s.camera) {
      this.camAnim = {
        p0: this.camera.position.clone(), t0: this.controls.target.clone(),
        p1: v3(s.camera.pos), t1: v3(s.camera.target || [0, 0, 0]), k: 0,
      };
    }

    // パネル
    Array.prototype.forEach.call(this.stepsEl.children, function (b, k) { b.classList.toggle('active', k === i); });
    this.bodyEl.innerHTML = '<div class="gg-count">STEP ' + (i + 1) + ' / ' + steps.length + '</div><h2>' + esc(s.title) + '</h2>' + (s.html || '');
    this.bodyEl.scrollTop = 0;
    this.prevBtn.disabled = i === 0;
    this.nextBtn.disabled = i === steps.length - 1;
    this.nextBtn.textContent = i === steps.length - 1 ? 'おわり' : '次へ →';
    try { history.replaceState(null, '', i === 0 ? location.pathname + location.search : '#' + (i + 1)); } catch (e) { /* file:// で失敗しても困らない */ }

    if (s.enter) s.enter(this);
  };

  // 親グループが focus 指定されていれば子も明るいまま
  Guide.prototype._isAncestorFocused = function (id, f) {
    var o = this.objects[id];
    var p = o && o.parent;
    while (p) {
      if (p.name && f[p.name]) return true;
      p = p.parent;
    }
    return false;
  };

  Guide.prototype._applyDim = function (obj, k) {
    obj.traverse(function (c) {
      var mats = c.material ? (Array.isArray(c.material) ? c.material : [c.material]) : [];
      mats.forEach(function (m) {
        if (m.userData.base == null) m.userData.base = { op: m.opacity, tr: m.transparent };
        m.opacity = m.userData.base.op * k;
        m.transparent = m.userData.base.tr || k < 0.999;
        m.depthWrite = k > 0.5 && !(c instanceof T.Sprite);
      });
    });
  };

  Guide.prototype._loop = function () {
    var self = this;
    var total = 0;
    function frame() {
      requestAnimationFrame(frame);
      var dt = Math.min(self.clock.getDelta(), 0.05);
      total += dt;
      self.stepTime += dt;

      if (self.camAnim) {
        var a = self.camAnim;
        a.k = Math.min(1, a.k + dt / 1.1);
        var e = ease(a.k);
        self.camera.position.copy(a.p0.clone().lerp(a.p1, e));
        self.controls.target.copy(a.t0.clone().lerp(a.t1, e));
        if (a.k >= 1) self.camAnim = null;
      }
      self.controls.update();

      // 薄くする/戻すをなめらかに。子が別 id で登録されている場合も同じ値になるよう、
      // 親から順に適用する（後から子の id が上書きする）
      var ids = Object.keys(self.dim);
      ids.forEach(function (id) {
        var d = self.dim[id];
        if (Math.abs(d.cur - d.target) > 0.002 || d.applied !== d.cur) {
          d.cur += (d.target - d.cur) * Math.min(1, dt * 8);
          d.dirty = true;
        }
      });
      ids.forEach(function (id) {
        var d = self.dim[id];
        if (d.dirty) { self._applyDim(self.objects[id], d.cur); d.applied = d.cur; d.dirty = false; self._reapplyChildren(id); }
      });

      self.frameFns.forEach(function (fn) { fn(total, dt); });
      var s = self.cfg.steps[self.stepIndex];
      if (s && s.update) s.update(self, self.stepTime, dt);
      self.renderer.render(self.scene, self.camera);
    }
    frame();
  };

  // 親の dim を適用すると子の個別 dim が上書きされるので、子 id 側を再適用する
  Guide.prototype._reapplyChildren = function (id) {
    var self = this;
    var root = this.objects[id];
    Object.keys(this.dim).forEach(function (cid) {
      if (cid === id) return;
      var o = self.objects[cid];
      var p = o && o.parent;
      while (p) {
        if (p === root) { self._applyDim(o, self.dim[cid].cur); return; }
        p = p.parent;
      }
    });
  };

  window.GameGuide = {
    start: function (cfg) {
      function run() { return new Guide(cfg); }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
      else run();
    },
    // 色見本（ページ間で色の意味をそろえる）
    colors: {
      me: '#4fa3ff',       // 自分・プレイヤー1
      enemy: '#ff5f6d',    // 相手・プレイヤー2・敵
      neutral: '#b8b2d6',  // 中立
      third: '#c77dff',    // 第三勢力
      gold: '#ffd166',     // 強調・矢印
      good: '#5ee6a8',     // 回復・成功
      data: '#7ef0ff',     // データの流れ
      server: '#ff9f43',   // サーバー
      board: '#2d2944',    // 盤・エリアの床
    },
  };
})();
