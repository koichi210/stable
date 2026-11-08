/*
 * トップページの魔法陣（index.html から読む）。
 * 中心の結晶 → グループの分岐点 → ツールの魔法陣 を回路っぽい折れ線でつなぎ、光の粒を流す。
 * 円をクリックするとそのツールの説明ページへ移る。データは portal/catalog.js。
 */
(function () {
  'use strict';
  var T = window.THREE, M = window.Magic, CAT = window.STABLE_CATALOG;

  var HUB_R = 2.3;          // 中心の魔法陣の半径
  var JUNC_R = 5.2;         // 分岐点までの距離
  var NODE_R = [7.7, 10.6]; // ツールの円までの距離（隣どうしで交互にずらす）
  var FRAME_R = 13.4;       // 外枠の円
  var FIT_R = 12.6;         // 画面に収める半径

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
  controls.enablePan = false;
  controls.minAzimuthAngle = -0.6; controls.maxAzimuthAngle = 0.6;
  controls.minPolarAngle = Math.PI / 2 - 0.6; controls.maxPolarAngle = Math.PI / 2 + 0.45;
  controls.rotateSpeed = 0.5;

  // ---------------------------------------------------------------- 背景
  var smoke = M.smoke(70, 70, '#2c0f40'); smoke.position.z = -6; smoke.renderOrder = -2; scene.add(smoke);
  var smoke2 = M.smoke(60, 60, '#0c1a3a'); smoke2.position.set(6, -4, -7); smoke2.renderOrder = -3; smoke2.rotation.z = 1.3; scene.add(smoke2);
  var starField = M.stars(1400, 90, 'stable-top'); starField.position.z = -20; scene.add(starField);

  var board = new T.Group(); scene.add(board);

  // 外枠：記号の輪＋二重円＋目盛り
  var frame = new T.Group(); board.add(frame);
  var frameGlyph = new T.Mesh(new T.PlaneGeometry(FRAME_R * 2, FRAME_R * 2), new T.MeshBasicMaterial({
    map: M.glyphRingTexture('stable-frame', { count: 72, inner: 0.455 }), color: '#a35bd6', transparent: true, opacity: 0.32,
    depthWrite: false, blending: T.AdditiveBlending,
  }));
  frame.add(frameGlyph);
  var frameRing = M.ring(FRAME_R + 0.45, 0.05, '#a35bd6', 0.45); frame.add(frameRing);
  var frameRing2 = M.ring(FRAME_R * 0.9, 0.03, '#a35bd6', 0.22); frame.add(frameRing2);
  frame.position.z = -0.4;

  // 中心の魔法陣＋結晶＋記号の輪
  var hub = M.sigil('stable-hub', { radius: HUB_R, color: '#d08bff', detail: true });
  board.add(hub);
  var hubOcc = occluder(HUB_R * 1.02); board.add(hubOcc);
  var hubGlyph = new T.Mesh(new T.PlaneGeometry(HUB_R * 3.1, HUB_R * 3.1), new T.MeshBasicMaterial({
    map: M.glyphRingTexture('stable-hub-glyph', { count: 30, inner: 0.4 }), color: '#e2b6ff', transparent: true, opacity: 0.55,
    depthWrite: false, blending: T.AdditiveBlending,
  }));
  hubGlyph.position.z = 0.01; board.add(hubGlyph);
  var core = M.crystal('#7ff3ff', HUB_R * 0.32); core.position.z = 0.6; board.add(core);
  hub.position.z = 0.02; order(hub, 3);

  // ---------------------------------------------------------------- 配置
  var groups = CAT.groups.filter(function (g) { return CAT.items.some(function (it) { return it.group === g.id; }); });
  var GAP = 1.1, total = 0;
  groups.forEach(function (g) { g.items = CAT.items.filter(function (it) { return it.group === g.id; }); total += g.items.length + GAP; });
  var unit = (Math.PI * 2) / total;
  var used = 0, n0 = groups[0].items.length;

  var nodes = [], hitList = [], traces = [];
  var flow = new M.Flow(board);
  var labels = new M.Labels(root);
  var idx = 0;

  groups.forEach(function (g) {
    // 最初のグループの真ん中を真上に置き、そこから時計回りにグループを並べる
    var mid = Math.PI / 2 - (used + g.items.length / 2 - n0 / 2) * unit;
    used += g.items.length + GAP;
    var start = mid + (g.items.length / 2) * unit; // グループ内は時計回り
    var col = new T.Color(g.color);
    var J = [Math.cos(mid) * JUNC_R, Math.sin(mid) * JUNC_R];
    var hubEdge = [Math.cos(mid) * HUB_R, Math.sin(mid) * HUB_R];
    var useJunction = g.items.length > 1;
    var junction = null, trunkPts = null;
    if (useJunction) {
      trunkPts = [v(hubEdge), v(J)];
      addTrace(trunkPts, col, 0.55, 0.075, g.id, null);
      junction = new T.Group();
      junction.add(M.ring(0.36, 0.06, col, 0.95), M.ring(0.2, 0.04, col, 0.7), M.disc(0.09, '#ffffff', 0.9));
      junction.position.set(J[0], J[1], 0.02); order(junction, 3);
      board.add(junction);
      var jOcc = occluder(0.4); jOcc.position.set(J[0], J[1], 0.01); board.add(jOcc);
    }

    g.items.forEach(function (it, i) {
      var a = start - (i + 0.5) * unit;
      var big = !!it.big;
      var dist = big ? (NODE_R[0] + NODE_R[1]) / 2 : NODE_R[(idx++) % 2];
      if (!useJunction && !big) dist = NODE_R[0];
      var R = big ? 1.75 : 0.88 + M.rng(it.id + '-size')() * 0.34; // 大小を少しばらつかせる
      var P = [Math.cos(a) * dist, Math.sin(a) * dist];

      var s = M.sigil(it.id, { radius: R, color: col, detail: big });
      s.position.set(P[0], P[1], 0.02); order(s, 3);
      var occ = occluder(R * 1.02); occ.position.set(P[0], P[1], 0.01);
      board.add(occ, s);
      var halo = M.glow(col, R * 4.2, 0.0); halo.position.set(P[0], P[1], -0.05); board.add(halo);

      // 分岐点 → 円（斜め → まっすぐ の回路線）
      var from = useJunction ? J : [Math.cos(a) * HUB_R, Math.sin(a) * HUB_R];
      var route = M.octi(from, P, i % 2 === 1).map(v);
      var branch = addTrace(route, col, 0.5, 0.06, g.id, it.id);
      var full = (trunkPts ? trunkPts.slice(0, 1) : []).concat(route);
      var path = new M.Path(full);
      var stream = flow.add(path, col, { count: 2, speed: 2.4 + Math.random(), size: 0.42 });
      var hot = flow.add(path, '#ffffff', { count: 4, speed: 5.5, size: 0.5, on: false });

      // 当たり判定（見えない円）
      var hit = new T.Mesh(new T.CircleGeometry(R * 1.15, 24), new T.MeshBasicMaterial({ visible: false }));
      hit.position.set(P[0], P[1], 0.05); board.add(hit);

      var el = document.createElement('a');
      el.className = 'mg-node-label' + (big ? ' big' : '');
      el.href = it.href;
      el.style.setProperty('--c', g.color);
      el.innerHTML = '<span class="e">' + it.emoji + '</span><span class="n">' + M.esc(it.name) + '</span>';
      var lab = labels.add(el, new T.Vector3(P[0], P[1] - R - 0.55, 0.1));

      var node = { it: it, g: g, sigil: s, halo: halo, hit: hit, pos: P, R: R, branch: branch, stream: stream, hot: hot,
        label: el, labItem: lab, hover: 0, appear: 0, delay: 0.35 + dist * 0.06 + i * 0.04 };
      hit.userData.node = node;
      el.addEventListener('mouseenter', function () { setHover(node); });
      el.addEventListener('mouseleave', function () { setHover(null); });
      el.addEventListener('focus', function () { setHover(node); });
      el.addEventListener('click', function (e) { e.preventDefault(); open(node); });
      nodes.push(node); hitList.push(hit);
    });
  });

  var hubLabel = document.createElement('div');
  hubLabel.className = 'mg-hub-label';
  hubLabel.innerHTML = '<b>stable</b><span>よく使うツールの置き場</span>';
  labels.add(hubLabel, new T.Vector3(0, -HUB_R - 0.75, 0.1));

  function v(p) { return new T.Vector3(p[0], p[1], 0); }
  function order(obj, n) { obj.traverse(function (o) { o.renderOrder = n; }); }
  function occluder(r) {
    var m = new T.Mesh(new T.CircleGeometry(r, 48), new T.MeshBasicMaterial({ color: '#07040f', transparent: true, opacity: 1, depthWrite: false }));
    m.renderOrder = 2;
    return m;
  }
  function addTrace(pts, col, op, w, gid, iid) {
    var m = M.ribbon(pts, w, col, op);
    m.renderOrder = 1; m.position.z = -0.01;
    board.add(m);
    var tr = { mesh: m, group: gid, item: iid };
    traces.push(tr);
    return tr;
  }

  // ---------------------------------------------------------------- 凡例・情報
  var legend = document.getElementById('mg-legend');
  var groupFilter = null;
  groups.forEach(function (g) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'mg-chip'; b.style.setProperty('--c', g.color);
    b.innerHTML = '<i></i>' + M.esc(g.name) + ' <small>' + g.items.length + '</small>';
    b.addEventListener('mouseenter', function () { if (!isTouch) groupFilter = g.id; });
    b.addEventListener('mouseleave', function () { if (!isTouch) groupFilter = null; });
    b.addEventListener('click', function () { groupFilter = groupFilter === g.id ? null : g.id; });
    legend.appendChild(b);
  });

  var hover = null;
  function setHover(n) {
    if (hover === n) return;
    hover = n;
    nodes.forEach(function (x) { x.label.classList.toggle('on', x === n); });
    root.style.cursor = n ? 'pointer' : '';
    if (!n) { info.classList.remove('show'); return; }
    info.style.setProperty('--c', n.g.color);
    info.innerHTML =
      '<div class="k">' + M.esc(n.g.name) + '</div>' +
      '<div class="t">' + n.it.emoji + ' ' + M.esc(n.it.name) + '</div>' +
      '<div class="tech">' + M.esc(n.it.tech) + '</div>' +
      '<p>' + M.esc(n.it.summary) + '</p>' +
      '<a class="go" href="' + n.it.href + '">説明ページを開く →</a>';
    info.querySelector('.go').addEventListener('click', function (e) { e.preventDefault(); open(n); });
    info.classList.add('show');
  }

  // ---------------------------------------------------------------- カメラ
  var fly = null; // { from, to, t } クリック時に円へ寄る
  function fitDistance() {
    var t = Math.tan((camera.fov * Math.PI / 180) / 2);
    var aspect = st.w / st.h;
    return (aspect < 0.8 ? FIT_R * 0.93 : FIT_R) / (t * Math.min(1, aspect)) * (st.w < 700 ? 1.0 : 1.08);
  }
  function home(instant) {
    var d = fitDistance();
    if (instant) { camera.position.set(0, -d * 0.05, d); controls.target.set(0, 0, 0); controls.update(); return; }
    fly = { from: camera.position.clone(), fromT: controls.target.clone(), to: new T.Vector3(0, -d * 0.05, d), toT: new T.Vector3(), t: 0, dur: 0.9 };
  }
  controls.minDistance = 6; controls.maxDistance = 80;
  home(true);
  document.getElementById('mg-home').addEventListener('click', function () { home(false); });

  function open(n) {
    if (fly && fly.leaving) return;
    var target = new T.Vector3(n.pos[0], n.pos[1], 0);
    board.localToWorld(target);
    fly = { from: camera.position.clone(), fromT: controls.target.clone(), to: target.clone().add(new T.Vector3(0, 0, 4.5)), toT: target, t: 0, dur: 0.65, leaving: true };
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
    if (st.size()) { if (!fly) home(true); }

    smoke.userData.uniforms.uTime.value = time; smoke2.userData.uniforms.uTime.value = time * 0.8;
    starField.rotation.z += dt * 0.004;
    frameGlyph.rotation.z -= dt * 0.012; frameRing2.rotation.z += dt * 0.02;
    hubGlyph.rotation.z += dt * 0.05;
    M.tickSpin(hub, dt); M.tickSpin(core, dt);
    board.rotation.x = Math.sin(time * 0.17) * 0.035; board.rotation.y = Math.sin(time * 0.11) * 0.045;

    var appearHub = M.ease((time - 0.05) / 0.8);
    hub.scale.setScalar(0.4 + 0.6 * appearHub); M.setOpacity(hub, appearHub); hubGlyph.material.opacity = 0.55 * appearHub;
    var traceIn = M.ease((time - 0.25) / 0.9);

    nodes.forEach(function (n) {
      n.appear = M.ease((time - n.delay) / 0.7);
      var on = hover === n, inGroup = !groupFilter || groupFilter === n.g.id;
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
      var hot = hover && (tr.item === hover.it.id || (!tr.item && tr.group === hover.g.id));
      var inGroup = !groupFilter || groupFilter === tr.group;
      var target = (hot ? 1 : (hover ? 0.3 : 0.5)) * (inGroup ? 1 : 0.25);
      tr.k = M.damp(tr.k == null ? 0 : tr.k, target, 8, dt);
      tr.mesh.material.opacity = tr.k * traceIn;
    });
    flow.update(dt);

    if (fly) {
      fly.t += Math.min(raw, 0.3) / fly.dur;
      var e = M.ease(fly.t);
      camera.position.lerpVectors(fly.from, fly.to, e);
      controls.target.lerpVectors(fly.fromT, fly.toT, e);
      if (fly.t >= 1 && !fly.leaving) fly = null;
    }
    controls.update();
    labels.update(camera, st.w, st.h);
    st.render();
    requestAnimationFrame(frameLoop);
  }
  requestAnimationFrame(frameLoop);

  // ---------------------------------------------------------------- 一覧（WebGL が無いとき・☰ ボタン）
  function buildList() {
    var html = '<div class="mg-list-head"><b>一覧</b><button type="button" class="mg-x" aria-label="閉じる">×</button></div>';
    CAT.groups.forEach(function (g) {
      var items = CAT.items.filter(function (it) { return it.group === g.id; });
      if (!items.length) return;
      html += '<h3 style="--c:' + g.color + '">' + M.esc(g.name) + '</h3><ul>';
      items.forEach(function (it) {
        html += '<li><a href="' + it.href + '"><span class="e">' + it.emoji + '</span><span><b>' + M.esc(it.name) + '</b><small>' + M.esc(it.summary) + '</small></span></a></li>';
      });
      html += '</ul>';
    });
    listPanel.innerHTML = html;
    listPanel.querySelector('.mg-x').addEventListener('click', function () { listPanel.classList.remove('open'); });
  }
})();
