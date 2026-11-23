/*
 * トップページの魔法陣（index.html から読む）。
 * 魔法陣は2つ。左＝stable（ツール）、右＝FeasibilityStudy（試作ゲーム）。
 * それぞれ 中心の結晶 → グループの分岐点 → 円 を回路っぽい折れ線でつなぎ、光の粒を流す。
 * 横長の画面では左右に、縦長の画面（スマホ縦）では上下に並べる。
 * 円をクリックするとその説明ページへ移る。右の中心（FeasibilityStudy）もクリックで一覧ページへ。データは portal/catalog.js。
 */
(function () {
  'use strict';
  var T = window.THREE, M = window.Magic, CAT = window.STABLE_CATALOG;

  var root = document.getElementById('mg-stage');
  var info = document.getElementById('mg-info');
  var listPanel = document.getElementById('mg-list');
  buildList();

  var st = window.THREE && M.stage(root, { fov: 38, bloomStrength: 1.05, bloomRadius: 0.6, bloomThreshold: 0.1 });
  if (!st) { document.body.classList.add('no-webgl'); listPanel.classList.add('open'); return; }
  var scene = st.scene, camera = st.camera;
  var isTouch = matchMedia('(hover: none)').matches;

  var controls = new T.OrbitControls(camera, st.renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.screenSpacePanning = true; // 右ドラッグ・2本指で移動（説明ページと同じ操作）
  controls.minAzimuthAngle = -0.6; controls.maxAzimuthAngle = 0.6;
  controls.minPolarAngle = Math.PI / 2 - 0.6; controls.maxPolarAngle = Math.PI / 2 + 0.45;
  controls.rotateSpeed = 0.5;

  // ---------------------------------------------------------------- 背景
  var smoke = M.smoke(90, 90, '#2c0f40'); smoke.position.z = -6; smoke.renderOrder = -2; scene.add(smoke);
  var smoke2 = M.smoke(70, 70, '#0c1a3a'); smoke2.position.set(8, -4, -7); smoke2.renderOrder = -3; smoke2.rotation.z = 1.3; scene.add(smoke2);
  var smoke3 = M.smoke(60, 60, '#3a2408'); smoke3.position.set(15, 2, -7.5); smoke3.renderOrder = -4; smoke3.rotation.z = -0.7; scene.add(smoke3);
  var starField = M.stars(1600, 110, 'stable-top'); starField.position.z = -20; scene.add(starField);

  var board = new T.Group(); scene.add(board);

  // ---------------------------------------------------------------- 2つの魔法陣の中身
  var fsGroup = CAT.group('fs');
  var CIRCLES = [
    { seed: 'stable', title: 'stable', sub: 'よく使うツールの置き場',
      hubR: 2.3, juncR: 5.2, nodeR: [7.7, 10.6], frameR: 13.4, delay: 0,
      hubColor: '#d08bff', glyphColor: '#e2b6ff', frameColor: '#a35bd6', coreColor: '#7ff3ff',
      groups: CAT.groups.map(function (g) {
        return { id: g.id, filter: g.id, name: g.name, color: g.color,
          items: CAT.items.filter(function (it) { return it.group === g.id && !it.center; }) };
      }) },
    { seed: 'fs', title: 'FeasibilityStudy', sub: '試作ゲーム ' + CAT.games.length + '本', center: CAT.item('FeasibilityStudy'),
      hubR: 2.2, juncR: 4.7, nodeR: [6.8, 9.2], frameR: 11.6, delay: 0.3,
      hubColor: '#ffc94d', glyphColor: '#ffe3a0', frameColor: '#c98a2e', coreColor: '#fff1c2',
      groups: CAT.genres.map(function (gen) {
        return { id: 'fs-' + gen.id, filter: 'fs', name: fsGroup.name + '・' + gen.name, color: fsGroup.color,
          items: CAT.games.filter(function (x) { return x.genre === gen.id; }) };
      }) },
  ];
  CIRCLES.forEach(function (c) { c.groups = c.groups.filter(function (g) { return g.items.length; }); });

  var nodes = [], hubs = [], hitList = [], traces = [];
  var labels = new M.Labels(root);
  CIRCLES.forEach(buildCircle);

  function buildCircle(c) {
    var cg = new T.Group(); board.add(cg); c.obj = cg;
    var flow = c.flow = new M.Flow(cg);

    // 外枠：記号の輪＋二重円＋目盛り
    var frame = new T.Group(); cg.add(frame);
    c.frameGlyph = new T.Mesh(new T.PlaneGeometry(c.frameR * 2, c.frameR * 2), new T.MeshBasicMaterial({
      map: M.glyphRingTexture(c.seed + '-frame', { count: c.frameR > 12 ? 72 : 60, inner: 0.455 }), color: c.frameColor, transparent: true, opacity: 0.32,
      depthWrite: false, blending: T.AdditiveBlending,
    }));
    frame.add(c.frameGlyph);
    frame.add(M.ring(c.frameR + 0.45, 0.05, c.frameColor, 0.45));
    c.frameRing2 = M.ring(c.frameR * 0.9, 0.03, c.frameColor, 0.22); frame.add(c.frameRing2);
    frame.position.z = -0.4;

    // 中心の魔法陣＋結晶＋記号の輪
    var hub = c.hub = M.sigil(c.seed + '-hub', { radius: c.hubR, color: c.hubColor, detail: true });
    cg.add(hub);
    var hubOcc = occluder(c.hubR * 1.02); cg.add(hubOcc);
    c.hubGlyph = new T.Mesh(new T.PlaneGeometry(c.hubR * 3.1, c.hubR * 3.1), new T.MeshBasicMaterial({
      map: M.glyphRingTexture(c.seed + '-hub-glyph', { count: 30, inner: 0.4 }), color: c.glyphColor, transparent: true, opacity: 0.55,
      depthWrite: false, blending: T.AdditiveBlending,
    }));
    c.hubGlyph.position.z = 0.01; cg.add(c.hubGlyph);
    c.core = M.crystal(c.coreColor, c.hubR * 0.32); c.core.position.z = 0.6; cg.add(c.core);
    hub.position.z = 0.02; order(hub, 3);

    var hubLabel = document.createElement(c.center ? 'a' : 'div');
    hubLabel.className = 'mg-hub-label' + (c.center ? ' link' : '');
    hubLabel.style.setProperty('--c', c.hubColor);
    hubLabel.innerHTML = '<b>' + M.esc(c.title) + '</b><span>' + M.esc(c.sub) + '</span>';
    labels.add(hubLabel, anchor(cg, [0, -c.hubR - 0.75]));

    // 中心に説明ページがある魔法陣（FeasibilityStudy）は、中心もクリックで開ける
    if (c.center) {
      hubLabel.href = c.center.href;
      var hubHalo = M.glow(c.hubColor, c.hubR * 4.2, 0.0); hubHalo.position.z = -0.05; cg.add(hubHalo);
      var hubHit = new T.Mesh(new T.CircleGeometry(c.hubR * 1.15, 32), new T.MeshBasicMaterial({ visible: false }));
      hubHit.position.z = 0.05; cg.add(hubHit);
      var hn = { it: c.center, g: { name: fsGroup.name, color: c.hubColor, filter: fsGroup.id }, circle: c, pos: [0, 0],
        label: hubLabel, halo: hubHalo, hover: 0, isHub: true };
      hubHit.userData.node = hn;
      bindLabel(hubLabel, hn);
      c.hubNode = hn; hubs.push(hn); hitList.push(hubHit);
    }

    // ---- 配置
    var GAP = 1.1, total = 0;
    c.groups.forEach(function (g) { total += g.items.length + GAP; });
    var unit = (Math.PI * 2) / total;
    var used = 0, n0 = c.groups[0].items.length, idx = 0;

    c.groups.forEach(function (g) {
      // 最初のグループの真ん中を真上に置き、そこから時計回りにグループを並べる
      var mid = Math.PI / 2 - (used + g.items.length / 2 - n0 / 2) * unit;
      used += g.items.length + GAP;
      var start = mid + (g.items.length / 2) * unit; // グループ内は時計回り
      var col = new T.Color(g.color);
      var J = [Math.cos(mid) * c.juncR, Math.sin(mid) * c.juncR];
      var hubEdge = [Math.cos(mid) * c.hubR, Math.sin(mid) * c.hubR];
      var useJunction = g.items.length > 1;
      var trunkPts = null;
      if (useJunction) {
        trunkPts = [v(hubEdge), v(J)];
        addTrace(cg, trunkPts, col, 0.55, 0.075, g, null);
        var junction = new T.Group();
        junction.add(M.ring(0.36, 0.06, col, 0.95), M.ring(0.2, 0.04, col, 0.7), M.disc(0.09, '#ffffff', 0.9));
        junction.position.set(J[0], J[1], 0.02); order(junction, 3);
        cg.add(junction);
        var jOcc = occluder(0.4); jOcc.position.set(J[0], J[1], 0.01); cg.add(jOcc);
      }

      g.items.forEach(function (it, i) {
        var a = start - (i + 0.5) * unit;
        var dist = useJunction ? c.nodeR[(idx++) % 2] : c.nodeR[0];
        var R = 0.88 + M.rng(it.id + '-size')() * 0.34; // 大小を少しばらつかせる
        var P = [Math.cos(a) * dist, Math.sin(a) * dist];

        var s = M.sigil(it.id, { radius: R, color: col, detail: false });
        s.position.set(P[0], P[1], 0.02); order(s, 3);
        var occ = occluder(R * 1.02); occ.position.set(P[0], P[1], 0.01);
        cg.add(occ, s);
        var halo = M.glow(col, R * 4.2, 0.0); halo.position.set(P[0], P[1], -0.05); cg.add(halo);

        // 分岐点 → 円（斜め → まっすぐ の回路線）
        var from = useJunction ? J : [Math.cos(a) * c.hubR, Math.sin(a) * c.hubR];
        var route = M.octi(from, P, i % 2 === 1).map(v);
        var branch = addTrace(cg, route, col, 0.5, 0.06, g, it.id);
        var full = (trunkPts ? trunkPts.slice(0, 1) : []).concat(route);
        var path = new M.Path(full);
        var stream = flow.add(path, col, { count: 2, speed: 2.4 + Math.random(), size: 0.42 });
        var hot = flow.add(path, '#ffffff', { count: 4, speed: 5.5, size: 0.5, on: false });

        // 当たり判定（見えない円）
        var hit = new T.Mesh(new T.CircleGeometry(R * 1.15, 24), new T.MeshBasicMaterial({ visible: false }));
        hit.position.set(P[0], P[1], 0.05); cg.add(hit);

        var el = document.createElement('a');
        el.className = 'mg-node-label';
        el.href = it.href;
        el.style.setProperty('--c', g.color);
        el.innerHTML = '<span class="e">' + it.emoji + '</span><span class="n">' + M.esc(it.name) + '</span>';
        labels.add(el, anchor(cg, [P[0], P[1] - R - 0.55]));

        var node = { it: it, g: g, circle: c, sigil: s, halo: halo, pos: P, R: R, branch: branch, stream: stream, hot: hot,
          label: el, hover: 0, appear: 0, delay: c.delay + 0.35 + dist * 0.06 + i * 0.04 };
        hit.userData.node = node;
        bindLabel(el, node);
        nodes.push(node); hitList.push(hit);
      });
    });
  }

  function v(p) { return new T.Vector3(p[0], p[1], 0); }
  function anchor(parent, p) { var o = new T.Object3D(); o.position.set(p[0], p[1], 0.1); parent.add(o); return o; }
  function order(obj, n) { obj.traverse(function (o) { o.renderOrder = n; }); }
  function occluder(r) {
    var m = new T.Mesh(new T.CircleGeometry(r, 48), new T.MeshBasicMaterial({ color: '#07040f', transparent: true, opacity: 1, depthWrite: false }));
    m.renderOrder = 2;
    return m;
  }
  function addTrace(parent, pts, col, op, w, g, iid) {
    var m = M.ribbon(pts, w, col, op);
    m.renderOrder = 1; m.position.z = -0.01;
    parent.add(m);
    var tr = { mesh: m, group: g.id, filter: g.filter, item: iid };
    traces.push(tr);
    return tr;
  }
  function bindLabel(el, node) {
    el.addEventListener('mouseenter', function () { setHover(node); });
    el.addEventListener('mouseleave', function () { setHover(null); });
    el.addEventListener('focus', function () { setHover(node); });
    el.addEventListener('click', function (e) { e.preventDefault(); open(node); });
  }

  // ---------------------------------------------------------------- 凡例・情報
  var legend = document.getElementById('mg-legend');
  var groupFilter = null;
  var chips = CIRCLES[0].groups.map(function (g) { return { id: g.filter, name: g.name, color: g.color, count: g.items.length }; });
  chips.push({ id: fsGroup.id, name: fsGroup.name, color: fsGroup.color, count: CAT.games.length });
  chips.forEach(function (g) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'mg-chip'; b.style.setProperty('--c', g.color);
    b.innerHTML = '<i></i>' + M.esc(g.name) + ' <small>' + g.count + '</small>';
    b.addEventListener('mouseenter', function () { if (!isTouch) groupFilter = g.id; });
    b.addEventListener('mouseleave', function () { if (!isTouch) groupFilter = null; });
    b.addEventListener('click', function () { groupFilter = groupFilter === g.id ? null : g.id; });
    legend.appendChild(b);
  });

  var hover = null;
  function setHover(n) {
    if (hover === n) return;
    hover = n;
    nodes.concat(hubs).forEach(function (x) { x.label.classList.toggle('on', x === n); });
    root.style.cursor = n ? 'pointer' : '';
    if (!n) { info.classList.remove('show'); return; }
    info.style.setProperty('--c', n.g.color);
    info.innerHTML =
      '<div class="k">' + M.esc(n.g.name) + '</div>' +
      '<div class="t">' + n.it.emoji + ' ' + M.esc(n.it.name) + '</div>' +
      '<div class="tech">' + M.esc(n.it.tech) + '</div>' +
      '<p>' + M.esc(n.it.summary) + '</p>' +
      '<a class="go" href="' + n.it.href + '">' + M.esc(n.it.go || '説明ページを開く →') + '</a>';
    info.querySelector('.go').addEventListener('click', function (e) { e.preventDefault(); open(n); });
    info.classList.add('show');
  }

  // ---------------------------------------------------------------- 並べ方とカメラ
  // 2つの外枠がちょうど収まる箱（中心は原点）。横並び(row)・縦並び(col)のうち、画面に大きく映る方を選ぶ
  var GAP_BETWEEN = 1.6, FIT = 0.95; // FIT: 外枠の記号の輪が少し欠けるくらいまで寄る
  var box = { w: 1, h: 1 }, layout = null;
  function arrangement(mode) {
    var a = CIRCLES[0].frameR + 0.45, b = CIRCLES[1].frameR + 0.45;
    var D = a + b + GAP_BETWEEN;
    var s0 = (D + b - a) / 2, s1 = (D - b + a) / 2; // 箱の真ん中が原点に来るように
    var along = s0 + a, across = Math.max(a, b);
    return mode === 'row'
      ? { p: [[-s0, 0], [s1, 0]], w: along, h: across }
      : { p: [[0, s0], [0, -s1]], w: across, h: along };
  }
  function distanceFor(ar) {
    var t = Math.tan((camera.fov * Math.PI / 180) / 2), aspect = st.w / st.h;
    return Math.max(ar.h * FIT / t, ar.w * FIT / (t * aspect)) * (st.w < 700 ? 1.0 : 1.05);
  }
  function applyLayout() {
    var row = arrangement('row'), col = arrangement('col');
    var mode = distanceFor(row) <= distanceFor(col) ? 'row' : 'col';
    var ar = mode === 'row' ? row : col;
    CIRCLES.forEach(function (c, i) { c.obj.position.set(ar.p[i][0], ar.p[i][1], 0); });
    box.w = ar.w; box.h = ar.h; layout = mode;
    document.body.dataset.layout = mode;
    return distanceFor(ar);
  }

  var fly = null; // { from, to, t } クリック時に円へ寄る
  function home(instant) {
    var d = applyLayout();
    // 横並びの広い画面では、左上の見出し・凡例に左の魔法陣が隠れないよう、少し引いて右へずらす
    var ox = 0;
    if (layout === 'row' && st.w >= 900) { d *= 1.08; ox = -box.w * 0.06; }
    if (instant) { camera.position.set(ox, -d * 0.05, d); controls.target.set(ox, 0, 0); controls.update(); return; }
    fly = { from: camera.position.clone(), fromT: controls.target.clone(), to: new T.Vector3(ox, -d * 0.05, d), toT: new T.Vector3(ox, 0, 0), t: 0, dur: 0.9 };
  }
  controls.minDistance = 6; controls.maxDistance = 160;
  // 移動しすぎて魔法陣を見失わないよう、注視点を2つの外枠の箱の内側に留める（カメラも同じだけ戻す）
  var panOver = new T.Vector3();
  function clampPan() {
    var t = controls.target;
    var x = Math.max(-box.w, Math.min(box.w, t.x)), y = Math.max(-box.h, Math.min(box.h, t.y));
    if (x === t.x && y === t.y && Math.abs(t.z) < 1e-6) return;
    panOver.set(t.x - x, t.y - y, t.z);
    t.sub(panOver); camera.position.sub(panOver);
  }
  home(true);
  document.getElementById('mg-home').addEventListener('click', function () { home(false); });

  function open(n) {
    if (fly && fly.leaving) return;
    var target = new T.Vector3(n.pos[0], n.pos[1], 0);
    n.circle.obj.localToWorld(target);
    fly = { from: camera.position.clone(), fromT: controls.target.clone(), to: target.clone().add(new T.Vector3(0, 0, n.isHub ? 7 : 4.5)), toT: target, t: 0, dur: 0.65, leaving: true };
    setTimeout(function () { M.leaveTo(n.it.href); }, 260);
  }

  // ---------------------------------------------------------------- 入力
  var ray = new T.Raycaster(), mouse = new T.Vector2(), down = null;
  function pick(e) {
    var r = st.renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    var hit = ray.intersectObjects(hitList)[0];
    return hit ? hit.object.userData.node : null;
  }
  st.renderer.domElement.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'mouse' && !e.buttons) setHover(pick(e));
  });
  st.renderer.domElement.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; });
  st.renderer.domElement.addEventListener('pointerup', function (e) {
    if (!down || Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 6) { down = null; return; }
    down = null;
    if (e.pointerType === 'mouse' && e.button !== 0) return; // 右ボタンは移動用
    var n = pick(e);
    if (!n) { if (e.pointerType !== 'mouse') setHover(null); return; }
    // タッチは1回目で情報を出し、同じ円をもう一度タップで開く
    if (e.pointerType !== 'mouse' && hover !== n) { setHover(n); return; }
    open(n);
  });
  st.renderer.domElement.addEventListener('pointerleave', function () { if (!isTouch) setHover(null); });

  document.getElementById('mg-list-toggle').addEventListener('click', function () {
    listPanel.classList.toggle('open');
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') listPanel.classList.remove('open'); });

  // ---------------------------------------------------------------- ループ
  var clock = new T.Clock(), time = 0;
  function frameLoop() {
    var raw = clock.getDelta(), dt = Math.min(raw, 0.05); time = clock.elapsedTime; // 登場アニメは実時間（遅い端末でも長引かない）
    if (st.size()) { if (!fly) home(true); else applyLayout(); }

    smoke.userData.uniforms.uTime.value = time; smoke2.userData.uniforms.uTime.value = time * 0.8;
    smoke3.userData.uniforms.uTime.value = time * 0.7;
    starField.rotation.z += dt * 0.004;
    board.rotation.x = Math.sin(time * 0.17) * 0.035; board.rotation.y = Math.sin(time * 0.11) * 0.045;
    var traceIn = M.ease((time - 0.25) / 0.9);

    CIRCLES.forEach(function (c, i) {
      var dir = i % 2 ? -1 : 1; // 隣どうしで回る向きを逆にする
      c.frameGlyph.rotation.z -= dt * 0.012 * dir; c.frameRing2.rotation.z += dt * 0.02 * dir;
      c.hubGlyph.rotation.z += dt * 0.05 * dir;
      M.tickSpin(c.hub, dt); M.tickSpin(c.core, dt);
      var appearHub = M.ease((time - 0.05 - c.delay) / 0.8);
      var fsDim = !groupFilter || !c.center || groupFilter === fsGroup.id ? 1 : 0.35;
      c.hub.scale.setScalar((0.4 + 0.6 * appearHub) * (1 + 0.06 * (c.hubNode ? c.hubNode.hover : 0)));
      M.setOpacity(c.hub, appearHub * fsDim); c.hubGlyph.material.opacity = 0.55 * appearHub * fsDim;
    });
    hubs.forEach(function (h) {
      h.hover = M.damp(h.hover, hover === h ? 1 : 0, 10, dt);
      h.halo.material.opacity = 0.32 * h.hover;
      M.tickSpin(h.circle.hub, dt * h.hover * 2);
    });

    nodes.forEach(function (n) {
      n.appear = M.ease((time - n.delay) / 0.7);
      var on = hover === n, inGroup = !groupFilter || groupFilter === n.g.filter;
      n.hover = M.damp(n.hover, on ? 1 : 0, 10, dt);
      var dim = inGroup ? 1 : 0.22;
      n.dim = M.damp(n.dim == null ? 1 : n.dim, dim, 8, dt);
      n.sigil.scale.setScalar((0.3 + 0.7 * n.appear) * (1 + 0.14 * n.hover));
      M.tickSpin(n.sigil, dt * (1 + n.hover * 2.5));
      M.setOpacity(n.sigil, n.appear * n.dim * (0.85 + 0.15 * n.hover + 0.08 * Math.sin(time * 1.4 + n.delay * 9)));
      n.halo.material.opacity = (0.08 + 0.4 * n.hover) * n.appear * n.dim;
      n.stream.on = n.appear > 0.5 && inGroup; n.hot.on = on;
      n.label.style.opacity = String(Math.min(1, n.appear * 1.2) * (0.35 + 0.65 * n.dim));
    });
    traces.forEach(function (tr) {
      // 中心（FeasibilityStudy）に乗ったときは、その魔法陣の線を全部光らせる
      var hot = hover && (hover.isHub ? tr.filter === hover.g.filter
        : (tr.item === hover.it.id || (!tr.item && tr.group === hover.g.id)));
      var inGroup = !groupFilter || groupFilter === tr.filter;
      var target = (hot ? 1 : (hover ? 0.3 : 0.5)) * (inGroup ? 1 : 0.25);
      tr.k = M.damp(tr.k == null ? 0 : tr.k, target, 8, dt);
      tr.mesh.material.opacity = tr.k * traceIn;
    });
    CIRCLES.forEach(function (c) { c.flow.update(dt); });

    if (fly) {
      fly.t += Math.min(raw, 0.3) / fly.dur;
      var e = M.ease(fly.t);
      camera.position.lerpVectors(fly.from, fly.to, e);
      controls.target.lerpVectors(fly.fromT, fly.toT, e);
      if (fly.t >= 1 && !fly.leaving) fly = null;
    }
    controls.update();
    clampPan();
    labels.update(camera, st.w, st.h);
    st.render();
    requestAnimationFrame(frameLoop);
  }
  requestAnimationFrame(frameLoop);

  // ---------------------------------------------------------------- 一覧（WebGL が無いとき・☰ ボタン）
  function buildList() {
    var html = '<div class="mg-list-head"><b>一覧</b><button type="button" class="mg-x" aria-label="閉じる">×</button></div>';
    function li(it, sub) {
      return '<li' + (sub ? ' class="sub"' : '') + '><a href="' + it.href + '"><span class="e">' + it.emoji + '</span><span><b>' + M.esc(it.name) + '</b><small>' + M.esc(it.summary) + '</small></span></a></li>';
    }
    CAT.groups.forEach(function (g) {
      var items = CAT.items.filter(function (it) { return it.group === g.id; });
      if (!items.length) return;
      html += '<h3 style="--c:' + g.color + '">' + M.esc(g.name) + '</h3><ul style="--c:' + g.color + '">';
      items.forEach(function (it) {
        html += li(it, false);
        if (it.center) CAT.games.forEach(function (x) { html += li(x, true); }); // FeasibilityStudy の下に各ゲーム
      });
      html += '</ul>';
    });
    listPanel.innerHTML = html;
    listPanel.querySelector('.mg-x').addEventListener('click', function () { listPanel.classList.remove('open'); });
  }
})();
