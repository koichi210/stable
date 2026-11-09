/*
 * ToolPage — 各ツールの説明ページ（doc/.../<ツール>/index.html）の共通フレームワーク。
 *
 * 画面: 左＝全ツールのメニュー / 中央＝しくみの3Dマップ / 下＝手順の再生バー / 右＝概要・登場するもの・手順・詳しいページ
 *
 * 使い方（各ページの <body> の中）:
 *   ToolPage.start({
 *     root: '../../../',            // リポジトリ直下への相対パス（左メニューとトップへのリンクに使う）
 *     id: 'Cheetos',                // portal/catalog.js の id（名前・絵文字・色・技術を引く）
 *     caption: '一言でいうと何をするか',   // 3Dの上に出る見出し
 *     lead: '概要（HTML可）',
 *     say: ['こんなときに使う', ...],  // 右パネル「使いはじめ」のチップ（sayTitle で見出しを変えられる）
 *     shot: { src: 'img/x.png', title: '画面名', cap: '説明' },   // 左上の画面イメージ（任意）
 *     nodes: [ { id, type, label, sub, at: [x, z], desc, href, img } ... ],
 *        type: main(このツール) / person(人) / screen(画面) / code(プログラム・処理) / file(ファイル・成果物) /
 *              store(保存先・記録) / service(外のサービス) / os(Windows・OS) / data(データの集まり) / sigil(中身・ページ)
 *        at:   床の上の位置。x が右、z が手前（だいたい -8〜8 に収める）
 *        href: クリックで開くページ（任意）。img: screen の中に貼る画像（任意）
 *     links: [ ['user', 'app'], ... ],          // 床に引く線
 *     steps: [ { by: 'nodeId', title, text, note, focus: [ids], flow: [['a', 'b'], ...], shot: 'img/y.png' } ... ],
 *        by:    この手順で動く主役（再生バーに色付きで出る）
 *        focus: 明るく見せるノード（省略時は by と flow に出てくるノード）
 *        flow:  光の粒を a → b に流す
 *        note:  オレンジ字の注意書き（止まる条件など）
 *     pages: [ { href, icon, title, desc } ... ],  // 「詳しく見る」
 *     note: '一番下の注記（ダミーなど）',
 *   });
 */
(function () {
  'use strict';
  var T = window.THREE, M = window.Magic, CAT = window.STABLE_CATALOG;

  var TYPES = {
    main: { name: 'このツール', color: null },
    person: { name: '人', color: '#eef0ff' },
    screen: { name: '画面', color: '#55dcff' },
    code: { name: 'プログラム・処理', color: '#ffc94d' },
    file: { name: 'ファイル・成果物', color: '#5fffc4' },
    store: { name: '保存先・記録', color: '#ff6fb0' },
    service: { name: '外のサービス', color: '#b58cff' },
    os: { name: 'Windows・OS', color: '#8fb0ff' },
    data: { name: 'データ', color: '#7fd0ff' },
    sigil: { name: '中身・ページ', color: '#ffc94d' },
  };
  var esc = M.esc;

  function start(cfg) {
    var item = CAT.item(cfg.id) || { id: cfg.id, name: cfg.id, emoji: '✨', group: 'desk', tech: '', summary: '' };
    var grp = CAT.group(item.group) || CAT.groups[0];
    var root = cfg.root || '';
    var nodesCfg = cfg.nodes || [];
    var steps = cfg.steps || [];
    var nodeById = {};
    nodesCfg.forEach(function (n) {
      n.type = TYPES[n.type] ? n.type : 'code';
      n.color = n.color || (n.type === 'main' ? grp.color : TYPES[n.type].color);
      nodeById[n.id] = n;
    });
    var mainNode = nodesCfg.filter(function (n) { return n.type === 'main'; })[0];

    document.title = item.name + ' — stable';
    document.body.classList.add('tp');
    document.body.style.setProperty('--c', grp.color);

    // ------------------------------------------------------------ DOM
    var app = el('div', 'tp-app');
    app.innerHTML =
      '<nav class="tp-side" aria-label="ツール一覧"></nav>' +
      '<header class="tp-head">' +
      '  <button type="button" class="mg-btn burger" aria-label="メニュー">☰</button>' +
      '  <div class="tp-title"><h1>' + item.emoji + ' ' + esc(item.name) + '</h1><span class="tech">' + esc(item.tech) + '</span></div>' +
      '  <div class="tp-legend"></div><div class="sp"></div>' +
      '  <div class="tp-help">ドラッグ：回転 ／ 右ドラッグ：移動 ／ ホイール：ズーム ／ クリック：詳細</div>' +
      '</header>' +
      '<main class="tp-stage"><button type="button" class="mg-btn tp-fit">⟲ 全体表示</button><div class="tp-pop"></div></main>' +
      '<section class="tp-player" aria-live="polite">' +
      '  <div class="tp-ctrl"><button type="button" class="prev" title="前へ (←)">⏮</button><button type="button" class="play" title="通しで再生 (Space)">▶</button><button type="button" class="next" title="次へ (→)">⏭</button></div>' +
      '  <div class="tp-now"></div><div class="tp-bar"></div>' +
      '</section>' +
      '<aside class="tp-panel"></aside>';
    document.body.appendChild(app);
    var $ = function (s) { return app.querySelector(s); };
    var stageEl = $('.tp-stage'), pop = $('.tp-pop'), nowEl = $('.tp-now'), barEl = $('.tp-bar'), panel = $('.tp-panel');

    // 左メニュー
    var side = $('.tp-side');
    var sh = '<a class="home" href="' + root + 'index.html">🔮 トップ</a>';
    CAT.groups.forEach(function (g) {
      var its = CAT.items.filter(function (it) { return it.group === g.id; });
      if (!its.length) return;
      sh += '<h4 style="--c:' + g.color + '">' + esc(g.name) + '</h4><ul style="--c:' + g.color + '">';
      its.forEach(function (it) {
        sh += '<li><a href="' + root + it.href + '"' + (it.id === item.id ? ' class="cur" aria-current="page"' : '') + '>' +
          '<span>' + it.emoji + '</span><span>' + esc(it.name) + '</span></a></li>';
      });
      sh += '</ul>';
    });
    side.innerHTML = sh;
    $('.burger').addEventListener('click', function () { document.body.classList.toggle('side-open'); });
    app.addEventListener('click', function (e) {
      if (document.body.classList.contains('side-open') && !side.contains(e.target) && !e.target.closest('.burger')) document.body.classList.remove('side-open');
    });

    // 凡例（使っている種類だけ）
    var used = {};
    nodesCfg.forEach(function (n) { used[n.type] = n.color; });
    $('.tp-legend').innerHTML = Object.keys(TYPES).filter(function (k) { return used[k]; }).map(function (k) {
      return '<span class="mg-chip" style="--c:' + used[k] + '"><i></i>' + esc(k === 'main' ? item.name : TYPES[k].name) + '</span>';
    }).join('');

    // 右パネル
    var ph = '';
    // 「詳しく見る」はサブメニューのつもりで、パネルの一番上に置く
    if (cfg.pages && cfg.pages.length) {
      ph += '<h3 class="first">📚 詳しく見る</h3><div class="tp-pages">' + cfg.pages.map(function (p) {
        return '<a href="' + esc(p.href) + '"><span class="i">' + (p.icon || '📄') + '</span><span><b>' + esc(p.title) + '</b>' +
          (p.desc ? '<small>' + p.desc + '</small>' : '') + '</span></a>';
      }).join('') + '</div>';
    }
    ph += '<span class="kind">' + esc(grp.name) + '</span>' +
      '<h2>' + item.emoji + ' ' + esc(item.name) + '</h2>' +
      '<div class="tech" style="color:var(--muted);font-size:12.5px">' + esc(item.tech) + '</div>' +
      '<div class="lead">' + (cfg.lead || esc(item.summary)) + '</div>';
    if (cfg.say && cfg.say.length) {
      ph += '<h3>🗣️ ' + esc(cfg.sayTitle || '使いはじめ') + '</h3><div class="tp-say">' +
        cfg.say.map(function (s) { return '<span>' + s + '</span>'; }).join('') + '</div>';
    }
    if (nodesCfg.length) {
      ph += '<h3>🧩 登場するもの <small>（クリックで場所へ）</small></h3><div class="tp-cast">' +
        nodesCfg.map(function (n) { return '<button type="button" data-id="' + esc(n.id) + '" style="--c:' + n.color + '"><i></i>' + esc(n.label) + '</button>'; }).join('') + '</div>';
    }
    if (steps.length) {
      ph += '<h3>▶ 手順 <small>（クリックで再生位置が移る）</small></h3><ol class="tp-steps">' +
        steps.map(function (s, i) {
          return '<li data-i="' + i + '"><span class="n">' + (i + 1) + '</span><div><b>' + esc(s.title) + '</b>' +
            (s.text ? '<p>' + s.text + '</p>' : '') + (s.note ? '<p class="note">⚠ ' + s.note + '</p>' : '') + '</div></li>';
        }).join('') + '</ol>';
    }
    if (cfg.note) ph += '<p class="tp-note">' + cfg.note + '</p>';
    panel.innerHTML = ph;

    // 画面イメージ（左上）
    var shotImg = null, shotBox = null;
    if (cfg.shot && cfg.shot.src) {
      var shot = el('div', 'tp-shot');
      shot.innerHTML = '<div class="bar"><i></i><i></i><i></i>' + esc(cfg.shot.title || item.name) + '</div>' +
        '<img alt="" src="' + esc(cfg.shot.src) + '">' + (cfg.shot.cap ? '<div class="cap">' + esc(cfg.shot.cap) + '</div>' : '');
      stageEl.appendChild(shot);
      shotImg = shot.querySelector('img'); shotBox = shot;
      // スマホでは見出しだけにしておき、タップで開く
      if (window.innerWidth > 820) shot.classList.add('open');
      shot.querySelector('.bar').addEventListener('click', function () { shot.classList.toggle('open'); });
    }

    // 再生バー
    barEl.innerHTML = steps.map(function (s, i) { return '<span data-i="' + i + '" title="' + esc(s.title) + '"></span>'; }).join('');

    // ------------------------------------------------------------ 3D
    var st = M.stage(stageEl, { fov: 40, bloomStrength: 0.8, bloomRadius: 0.45, bloomThreshold: 0.42 });
    if (!st) {
      stageEl.insertAdjacentHTML('beforeend', '<div class="tp-nogl">この端末では 3D を表示できませんでした。右（下）の説明と手順をご覧ください。</div>');
      wireDom(null);
      render2d();
      return;
    }
    var scene = st.scene, camera = st.camera;
    scene.fog = new T.FogExp2('#07040f', 0.022);
    scene.add(new T.HemisphereLight('#c9b8ff', '#120a24', 0.95));
    var sun = new T.DirectionalLight('#ffffff', 0.55); sun.position.set(4, 10, 6); scene.add(sun);
    var starField = M.stars(900, 120, 'tp-' + item.id); scene.add(starField);

    var controls = new T.OrbitControls(camera, st.renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.47; controls.minDistance = 3; controls.maxDistance = 60;
    controls.screenSpacePanning = true;

    // 床：薄いグリッド＋主役の下の大きな魔法陣
    var grid = new T.GridHelper(80, 80, '#3a2a66', '#21173d');
    grid.material.transparent = true; grid.material.opacity = 0.35; grid.material.depthWrite = false;
    scene.add(grid);
    var mainPos = mainNode ? mainNode.at : [0, 0];
    var floorGlyph = new T.Mesh(new T.PlaneGeometry(9, 9), new T.MeshBasicMaterial({
      map: M.glyphRingTexture('tp-floor-' + item.id, { count: 36, inner: 0.43 }), color: grp.color, transparent: true, opacity: 0.22,
      depthWrite: false, blending: T.AdditiveBlending,
    }));
    floorGlyph.rotation.x = -Math.PI / 2; floorGlyph.position.set(mainPos[0], 0.01, mainPos[1]);
    scene.add(floorGlyph);

    var labels = new M.Labels(stageEl);
    var nodes = [];
    nodesCfg.forEach(function (n) {
      var built = build(n);
      built.group.position.set(n.at[0], 0, n.at[1]);
      scene.add(built.group);
      // 足元の選択リング（主役の手順で光る）
      var sel = M.ring(built.foot, 0.05, n.color, 0); sel.rotation.x = -Math.PI / 2; sel.position.set(n.at[0], 0.04, n.at[1]);
      var sel2 = M.ring(built.foot * 0.8, 0.03, n.color, 0); sel2.rotation.x = -Math.PI / 2; sel2.position.copy(sel.position);
      scene.add(sel, sel2);
      var lab = el('div', 'tp-label' + (n.type === 'main' ? ' main' : ''));
      lab.style.setProperty('--c', n.color);
      lab.innerHTML = '<i></i>' + esc(n.label) + (n.sub ? ' <small>' + esc(n.sub) + '</small>' : '');
      var li = labels.add(lab, new T.Vector3(n.at[0], built.height + 0.38, n.at[1]));
      var obj = { cfg: n, group: built.group, mats: built.mats, anim: built.anim, sel: sel, sel2: sel2, label: lab, labItem: li, height: built.height, k: 1, hot: 0 };
      built.group.traverse(function (o) { o.userData.node = obj; });
      lab.addEventListener('click', function (e) { e.stopPropagation(); select(obj, true); });
      nodes.push(obj); nodeById[n.id].obj = obj;
    });

    // 線
    var routes = {};
    (cfg.links || []).forEach(function (l) {
      var a = nodeById[l[0]], b = nodeById[l[1]];
      if (!a || !b) { console.warn('links: 未登録のノード', l); return; }
      var pts = M.octi(a.at, b.at, !!l[2]).map(function (p) { return new T.Vector3(p[0], 0.03, p[1]); });
      var col = new T.Color(a.type === 'main' ? b.color : a.color).lerp(new T.Color('#d7c6ff'), 0.45);
      var rib = M.ribbon(pts, 0.07, col, 0.55, new T.Vector3(0, 1, 0));
      rib.renderOrder = 1;
      scene.add(rib);
      routes[l[0] + '>' + l[1]] = { pts: pts, rib: rib, a: l[0], b: l[1] };
    });
    var flow = new M.Flow(scene);
    function streamFor(a, b, col, o) {
      var r = routes[a + '>' + b], pts;
      if (r) pts = r.pts;
      else if ((r = routes[b + '>' + a])) pts = r.pts.slice().reverse();
      else {
        var A = nodeById[a], B = nodeById[b];
        if (!A || !B) { console.warn('flow: 未登録のノード', a, b); return; }
        pts = [new T.Vector3(A.at[0], 0.03, A.at[1]), new T.Vector3(B.at[0], 0.03, B.at[1])];
      }
      var lifted = pts.map(function (p) { return p.clone().setY(0.2); });
      flow.add(new M.Path(lifted), col, o);
    }

    // ------------------------------------------------------------ 状態
    var viewOff = 0; // 左上の画面イメージのぶん 3D を右へずらす量(px)。go(-1) より前に決めておく
    var cur = -1, playing = false, playT = 0, focusSet = null, actor = null, selected = null;
    var fly = null;

    function go(i) {
      cur = Math.max(-1, Math.min(steps.length - 1, i));
      var s = cur >= 0 ? steps[cur] : null;
      playT = 0;
      actor = s ? s.by : null;
      focusSet = null;
      if (s) {
        var f = s.focus ? s.focus.slice() : [];
        if (!s.focus) {
          if (s.by) f.push(s.by);
          (s.flow || []).forEach(function (p) { f.push(p[0], p[1]); });
        }
        focusSet = f.length ? f : null;
      }
      flow.clear();
      if (s) {
        (s.flow || []).forEach(function (p) {
          var A = nodeById[p[0]];
          streamFor(p[0], p[1], A ? A.color : '#ffffff', { count: 4, speed: 2.6, size: 0.42 });
          streamFor(p[0], p[1], '#ffffff', { count: 2, speed: 3.4, size: 0.26 });
        });
      } else {
        Object.keys(routes).forEach(function (k) {
          var r = routes[k]; streamFor(r.a, r.b, nodeById[r.a].color, { count: 1, speed: 1.6, size: 0.32 });
        });
      }
      frame(focusSet);
      if (s && s.shot && shotImg) shotImg.src = s.shot;
      else if (!s && shotImg && cfg.shot) shotImg.src = cfg.shot.src;
      hidePop();
      render2d();
    }

    function frame(ids) {
      var list = (ids || nodesCfg.map(function (n) { return n.id; })).map(function (id) { return nodeById[id]; }).filter(Boolean);
      if (!list.length) list = nodesCfg;
      var minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
      list.forEach(function (n) { minX = Math.min(minX, n.at[0]); maxX = Math.max(maxX, n.at[0]); minZ = Math.min(minZ, n.at[1]); maxZ = Math.max(maxZ, n.at[1]); });
      var cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
      var sx = (maxX - minX) / 2 + 2.6, sz = (maxZ - minZ) / 2 + 2.4;
      var tan = Math.tan((camera.fov * Math.PI / 180) / 2), aspect = (st.w - 2 * viewOff) / st.h;
      // 縦長の画面（スマホ）では横から見下ろして、左→右の流れを上→下に見せる
      var portrait = aspect < 0.85;
      var dir = portrait ? new T.Vector3(1, 1.25, 0.12).normalize() : new T.Vector3(0.18, 0.78, 1).normalize();
      var hx = portrait ? sz + 1.4 : sx, hv = portrait ? sx : sz; // 縦長はラベルが横にはみ出しやすいので余白を足す
      var d = Math.max(hx / (tan * aspect), hv / tan * (portrait ? 0.85 : 0.95), list.length > 1 ? 9 : 8) * 1.05;
      var target = new T.Vector3(cx, 0.6, cz);
      fly = { from: camera.position.clone(), fromT: controls.target.clone(), to: target.clone().addScaledVector(dir, d), toT: target, t: 0 };
    }

    function select(obj, flyTo) {
      selected = obj;
      var n = obj.cfg;
      pop.style.setProperty('--c', n.color);
      pop.innerHTML = '<b>' + esc(n.label) + (n.sub ? ' <small style="color:var(--muted);font-weight:400">' + esc(n.sub) + '</small>' : '') + '</b>' +
        '<div style="color:var(--muted);font-size:11.5px">' + esc(n.type === 'main' ? item.name : TYPES[n.type].name) + '</div>' +
        (n.desc ? '<div style="margin-top:4px">' + n.desc + '</div>' : '') +
        (n.href ? '<div style="margin-top:6px"><a href="' + esc(n.href) + '">開く →</a></div>' : '');
      pop.classList.add('show');
      if (flyTo) frame([n.id]);
    }
    function hidePop() { selected = null; pop.classList.remove('show'); }

    // ------------------------------------------------------------ 入力
    var ray = new T.Raycaster(), mouse = new T.Vector2(), down = null;
    var pickables = nodes.map(function (o) { return o.group; });
    function pick(e) {
      var r = st.renderer.domElement.getBoundingClientRect();
      mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(mouse, camera);
      var hits = ray.intersectObjects(pickables, true).filter(function (h) { return h.object.visible && h.object.type !== 'Sprite'; });
      return hits.length ? hits[0].object.userData.node : null;
    }
    var hoverObj = null;
    st.renderer.domElement.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || e.buttons) return;
      hoverObj = pick(e);
      stageEl.style.cursor = hoverObj ? 'pointer' : '';
    });
    st.renderer.domElement.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; stopPlay(); });
    st.renderer.domElement.addEventListener('pointerup', function (e) {
      if (!down || Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 6) { down = null; return; }
      down = null;
      var o = pick(e);
      if (o) select(o, false); else hidePop();
    });

    wireDom(go);
    $('.tp-fit').addEventListener('click', function () { hidePop(); frame(focusSet); });

    // ------------------------------------------------------------ ループ
    var clock = new T.Clock(), time = 0;
    go(-1);
    camera.position.copy(fly.to).multiplyScalar(1.35); controls.target.copy(fly.toT);

    function loop() {
      var raw = clock.getDelta(), dt = Math.min(raw, 0.05); time += dt;
      var resized = st.size();
      if (updateViewOffset(resized) || resized) frame(focusSet);

      if (playing) {
        playT += dt;
        var s = steps[cur];
        var dur = s ? Math.max(4.5, ((s.text || '').replace(/<[^>]+>/g, '').length + (s.title || '').length) * 0.085) : 2.5;
        if (playT > dur) {
          if (cur < steps.length - 1) go(cur + 1); else stopPlay();
        }
        barEl.style.setProperty('--p', String(Math.min(1, playT / dur)));
      }

      floorGlyph.rotation.z += dt * 0.03;
      starField.rotation.y += dt * 0.005;
      nodes.forEach(function (o) {
        var id = o.cfg.id;
        var inFocus = !focusSet || focusSet.indexOf(id) >= 0;
        o.k = M.damp(o.k, inFocus ? 1 : 0.18, 7, dt);
        var isActor = actor === id || selected === o || hoverObj === o;
        o.hot = M.damp(o.hot, isActor ? 1 : 0, 8, dt);
        o.mats.forEach(function (m) { m.opacity = (m.userData.base == null ? 1 : m.userData.base) * o.k; });
        var pulse = 0.5 + 0.5 * Math.sin(time * 4);
        o.sel.material.opacity = o.hot * (0.55 + 0.4 * pulse);
        o.sel2.material.opacity = o.hot * 0.5;
        o.sel.scale.setScalar(1 + 0.08 * pulse * o.hot);
        o.sel2.rotation.z += dt;
        if (o.anim) o.anim(dt, time, o);
        o.label.classList.toggle('dim', o.k < 0.5);
        o.label.classList.toggle('hot', o.hot > 0.5);
      });
      flow.update(dt);

      if (fly) {
        fly.t += Math.min(raw, 0.3) / 0.9; // カメラ移動は実時間（遅い端末でも長引かない）
        var e = M.ease(fly.t);
        camera.position.lerpVectors(fly.from, fly.to, e);
        controls.target.lerpVectors(fly.fromT, fly.toT, e);
        if (fly.t >= 1) fly = null;
      }
      controls.update();
      labels.update(camera, st.w, st.h);
      if (selected) placePop();
      st.render();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    // 左上の画面イメージを開いている間は、3D の中心を右へずらしてラベルが隠れないようにする
    function updateViewOffset(force) {
      var o = shotBox && shotBox.classList.contains('open') && st.w > 820 ? Math.round(Math.min(shotBox.offsetWidth, 260) / 2 + 8) : 0;
      if (o === viewOff && !force) return false;
      var changed = o !== viewOff;
      viewOff = o;
      if (o) camera.setViewOffset(st.w, st.h, -o, 0, st.w, st.h); else camera.clearViewOffset();
      return changed;
    }

    var _p = new T.Vector3();
    function placePop() {
      _p.set(selected.cfg.at[0], selected.height + 0.4, selected.cfg.at[1]).project(camera);
      var x = (_p.x * 0.5 + 0.5) * st.w, y = (-_p.y * 0.5 + 0.5) * st.h;
      var pw = pop.offsetWidth, phh = pop.offsetHeight;
      x = Math.max(8, Math.min(st.w - pw - 8, x + 16));
      y = Math.max(8, Math.min(st.h - phh - 8, y - phh - 18));
      pop.style.left = x + 'px'; pop.style.top = y + 'px';
    }

    // ------------------------------------------------------------ DOM の配線（3D が無くても動く部分）
    function wireDom(goFn) {
      goFn = goFn || function (i) { cur = Math.max(-1, Math.min(steps.length - 1, i)); render2d(); };
      if (!st) go = goFn;
      $('.prev').addEventListener('click', function () { stopPlay(); goFn(cur - 1); });
      $('.next').addEventListener('click', function () { stopPlay(); goFn(cur + 1); });
      $('.play').addEventListener('click', function () {
        if (playing) { stopPlay(); return; }
        playing = true; $('.play').textContent = '❚❚';
        if (cur >= steps.length - 1 || cur < 0) goFn(0); else playT = 0;
      });
      barEl.addEventListener('click', function (e) { var i = e.target.getAttribute('data-i'); if (i != null) { stopPlay(); goFn(+i); } });
      panel.addEventListener('click', function (e) {
        var li = e.target.closest('.tp-steps li');
        if (li) { stopPlay(); goFn(+li.getAttribute('data-i')); if (window.innerWidth <= 820) stageEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
        var b = e.target.closest('.tp-cast button');
        if (b && st) {
          var n = nodeById[b.getAttribute('data-id')];
          if (n && n.obj) { stopPlay(); select(n.obj, true); if (window.innerWidth <= 820) stageEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        }
      });
      document.addEventListener('keydown', function (e) {
        if (e.target.closest && e.target.closest('input,textarea')) return;
        if (e.key === 'ArrowRight') { stopPlay(); goFn(cur + 1); }
        else if (e.key === 'ArrowLeft') { stopPlay(); goFn(cur - 1); }
        else if (e.key === ' ') { e.preventDefault(); $('.play').click(); }
        else if (e.key === 'Escape') { hidePop(); document.body.classList.remove('side-open'); }
      });
    }
    function stopPlay() { playing = false; var b = $('.play'); if (b) b.textContent = '▶'; }

    function render2d() {
      var s = cur >= 0 ? steps[cur] : null;
      if (!s) {
        nowEl.innerHTML = '<div class="top"><span class="no">ざっくり全体像</span><span class="ttl">' + esc(cfg.caption || item.summary) + '</span></div>' +
          '<div class="txt">' + (steps.length ? '▶ を押すと、手順を順番に再生します（全' + steps.length + '手順）。円や箱をクリックすると説明が出ます。' : '円や箱をクリックすると説明が出ます。') + '</div>';
      } else {
        var by = s.by && nodeById[s.by];
        nowEl.innerHTML = '<div class="top"><span class="no">' + (cur + 1) + ' / ' + steps.length + '</span>' +
          (by ? '<span class="tp-who" style="--c:' + by.color + '">' + esc(by.label) + '</span>' : '') +
          '<span class="ttl">' + esc(s.title) + '</span></div>' +
          (s.text ? '<div class="txt">' + s.text + '</div>' : '') + (s.note ? '<div class="note">⚠ ' + s.note + '</div>' : '');
      }
      Array.prototype.forEach.call(barEl.children, function (sp, i) { sp.className = i < cur ? 'done' : i === cur ? 'cur' : ''; });
      Array.prototype.forEach.call(panel.querySelectorAll('.tp-steps li'), function (li, i) { li.classList.toggle('cur', i === cur); });
    }
    if (!st) render2d();
  }

  // ------------------------------------------------------------ ノードの形
  function build(n) {
    var g = new T.Group(), mats = [], col = new T.Color(n.color);
    function reg(m) { m.transparent = true; m.userData.base = m.opacity; mats.push(m); return m; }
    function basic(c, op, add) {
      return reg(new T.MeshBasicMaterial({ color: c, opacity: op == null ? 1 : op, depthWrite: !add, side: T.DoubleSide, blending: add ? T.AdditiveBlending : T.NormalBlending }));
    }
    function std(c, emi) { return reg(new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: emi == null ? 0.3 : emi, roughness: 0.45, metalness: 0.15 })); }
    // 明るい絵は光りすぎる（ブルームで白飛びする）ので少し暗くして貼る
    function texMat(canvas, tint) { var t = new T.CanvasTexture(canvas); t.anisotropy = 4; return reg(new T.MeshBasicMaterial({ map: t, color: tint || '#ffffff', side: T.DoubleSide })); }
    function glowS(size, op) { var s = M.glow(col, size, op); reg(s.material); g.add(s); return s; }
    var height = 1.2, foot = 0.9, anim = null;

    if (n.type === 'main') {
      var sig = M.sigil('tp-main-' + n.id, { radius: 1.7, color: col, detail: true });
      sig.rotation.x = -Math.PI / 2; sig.position.y = 0.05; g.add(sig);
      sig.userData.mats.forEach(function (m) { mats.push(m); });
      var cr = M.crystal(col, 0.62); cr.position.y = 1.55; g.add(cr);
      cr.userData.mats.forEach(function (m) { mats.push(m); });
      cr.children.forEach(function (c) { if (c.material && c.material.map) { reg(c.material); } });
      height = 2.35; foot = 2.0;
      anim = function (dt, t) { M.tickSpin(sig, dt); M.tickSpin(cr, dt); cr.position.y = 1.55 + Math.sin(t * 1.3) * 0.08; };
    } else if (n.type === 'person') {
      var body = new T.Mesh(new T.CylinderGeometry(0.26, 0.4, 0.75, 24), std('#d9d6f0', 0.15)); body.position.y = 0.42;
      var sh2 = new T.Mesh(new T.SphereGeometry(0.26, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), body.material); sh2.position.y = 0.79;
      var head = new T.Mesh(new T.SphereGeometry(0.24, 24, 16), std('#f2f0ff', 0.2)); head.position.y = 1.22;
      g.add(body, sh2, head); height = 1.5; foot = 0.7;
    } else if (n.type === 'screen') {
      var frameM = new T.Mesh(new T.BoxGeometry(2.1, 1.4, 0.08), std('#1a1430', 0.05)); frameM.position.y = 1.0;
      var face = new T.Mesh(new T.PlaneGeometry(2.0, 1.3), texMat(screenCanvas(n.label, n.color), '#a4a2b8')); face.position.set(0, 1.0, 0.045);
      var stand = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.3, 8), std('#3a2f5c', 0.1)); stand.position.y = 0.15;
      g.add(frameM, face, stand); height = 1.75; foot = 1.2;
      if (n.img) {
        new T.TextureLoader().load(n.img, function (tx) {
          var c2 = face.material.map.image, ctx = c2.getContext('2d');
          var im = tx.image, top = 34, W = c2.width, H = c2.height - top;
          var s = Math.max(W / im.width, H / im.height);
          ctx.drawImage(im, 0, 0, W / s, H / s, 0, top, W, H);
          face.material.map.needsUpdate = true;
        });
      }
      g.rotation.y = n.rot || 0;
    } else if (n.type === 'code') {
      var card = new T.Mesh(new T.PlaneGeometry(1.0, 0.75), texMat(codeCanvas(n.color, n.id))); card.position.y = 0.75; card.rotation.x = -0.15;
      var back = new T.Mesh(new T.BoxGeometry(1.06, 0.81, 0.04), std('#2a2140', 0.05)); back.position.set(0, 0.75, -0.03); back.rotation.x = -0.15;
      g.add(back, card); glowS(1.6, 0.25).position.y = 0.75; height = 1.2; foot = 0.75;
    } else if (n.type === 'file') {
      for (var k = 0; k < 2; k++) {
        var sheet = new T.Mesh(new T.PlaneGeometry(0.78, 0.98), texMat(fileCanvas(n.color), '#9fbdb2'));
        sheet.position.set(k * 0.14 - 0.07, 0.62 + k * 0.05, -k * 0.12); sheet.rotation.x = -0.12;
        g.add(sheet);
      }
      height = 1.2; foot = 0.7;
    } else if (n.type === 'store') {
      for (var j = 0; j < 3; j++) {
        var cyl = new T.Mesh(new T.CylinderGeometry(0.46, 0.46, 0.2, 32), std(new T.Color(col).multiplyScalar(0.8), 0.3)); cyl.position.y = 0.14 + j * 0.27; g.add(cyl);
      }
      glowS(2.0, 0.3).position.y = 0.45; height = 0.95; foot = 0.75;
    } else if (n.type === 'service') {
      var hex = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 0.55, 6), std(col, 0.6)); hex.position.y = 0.7;
      var edge = new T.LineSegments(new T.EdgesGeometry(hex.geometry), reg(new T.LineBasicMaterial({ color: '#ffffff', opacity: 0.6 }))); edge.position.y = 0.7;
      g.add(hex, edge); glowS(2.2, 0.35).position.y = 0.7; height = 1.15; foot = 0.8;
      anim = function (dt) { hex.rotation.y += dt * 0.4; edge.rotation.y = hex.rotation.y; };
    } else if (n.type === 'os') {
      var box = new T.Mesh(new T.BoxGeometry(1.2, 0.8, 0.9), std(new T.Color(col).multiplyScalar(0.55), 0.18)); box.position.y = 0.42;
      var bedge = new T.LineSegments(new T.EdgesGeometry(box.geometry), reg(new T.LineBasicMaterial({ color: '#ffffff', opacity: 0.5 }))); bedge.position.y = 0.42;
      g.add(box, bedge); height = 0.95; foot = 0.85;
    } else if (n.type === 'data') {
      for (var r = 0; r < 3; r++) for (var c = 0; c < 4; c++) {
        var tile = new T.Mesh(new T.BoxGeometry(0.26, 0.26, 0.06), std(new T.Color(n.color).offsetHSL((r * 4 + c) * 0.012, 0, 0), 0.5));
        tile.position.set((c - 1.5) * 0.32, 0.3 + r * 0.32, 0); g.add(tile);
      }
      height = 1.35; foot = 0.85;
    } else if (n.type === 'sigil') {
      var ss = M.sigil('tp-sub-' + n.id, { radius: 0.85, color: col }); ss.rotation.x = -Math.PI / 2; ss.position.y = 0.05; g.add(ss);
      ss.userData.mats.forEach(function (m) { mats.push(m); });
      var orb = new T.Mesh(new T.IcosahedronGeometry(0.22, 1), std(col, 0.9)); orb.position.y = 0.85; g.add(orb);
      glowS(1.6, 0.45).position.y = 0.85;
      height = 1.15; foot = 1.0;
      anim = function (dt, t) { M.tickSpin(ss, dt); orb.rotation.y += dt; orb.position.y = 0.85 + Math.sin(t * 2 + n.at[0]) * 0.07; };
    }
    return { group: g, mats: mats, height: height, foot: foot, anim: anim };
  }

  // ------------------------------------------------------------ キャンバスの絵
  function cnv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function screenCanvas(title, color) {
    var c = cnv(512, 334), x = c.getContext('2d');
    x.fillStyle = '#0f0b1e'; x.fillRect(0, 0, 512, 334);
    x.fillStyle = '#2a1f4a'; x.fillRect(0, 0, 512, 34);
    ['#ff6b8b', '#ffc94d', '#5fffc4'].forEach(function (cc, i) { x.fillStyle = cc; x.beginPath(); x.arc(18 + i * 18, 17, 5.5, 0, 7); x.fill(); });
    x.fillStyle = '#e8e0ff'; x.font = 'bold 17px "Yu Gothic UI","Meiryo",sans-serif'; x.fillText(String(title).slice(0, 26), 76, 23);
    for (var i = 0; i < 7; i++) {
      x.fillStyle = i % 3 === 0 ? color : '#3b3266';
      x.globalAlpha = i % 3 === 0 ? 0.85 : 1;
      rr(x, 22, 52 + i * 38, 140 + ((i * 53) % 160), 22, 5); x.fill();
      x.fillStyle = '#2a2350'; x.globalAlpha = 1;
      rr(x, 330, 52 + i * 38, 160, 22, 5); x.fill();
    }
    return c;
  }
  function codeCanvas(color, seed) {
    var R = M.rng('code-' + seed), c = cnv(256, 192), x = c.getContext('2d');
    x.fillStyle = '#17122a'; rr(x, 0, 0, 256, 192, 14); x.fill();
    x.fillStyle = color; x.fillRect(0, 0, 256, 18);
    var cols = [color, '#ff8fd8', '#7fe0ff', '#c9bfff'];
    for (var i = 0; i < 7; i++) {
      var ind = R() < 0.4 ? 22 : 0, wv = 50 + R() * 140;
      x.fillStyle = cols[Math.floor(R() * cols.length)];
      rr(x, 18 + ind, 32 + i * 21, wv, 10, 4); x.fill();
    }
    return c;
  }
  function fileCanvas(color) {
    var c = cnv(200, 250), x = c.getContext('2d');
    x.fillStyle = '#eafff6'; rr(x, 0, 0, 200, 250, 12); x.fill();
    x.fillStyle = color; x.fillRect(0, 0, 200, 26);
    x.fillStyle = '#9ad8c0';
    for (var i = 0; i < 8; i++) { rr(x, 18, 44 + i * 24, 120 + ((i * 37) % 50), 9, 4); x.fill(); }
    return c;
  }

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  window.ToolPage = { start: start, TYPES: TYPES };
})();
