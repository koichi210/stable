/*
 * デスクトップ/Webツールの「機能デモ」プレイヤー(Essentials用の共通部品)。
 *
 * 実際のアプリの画面を撮ったスクショ(PNG/JPEG)を並べ、マウスカーソル・クリック・キー操作・
 * ズーム・目印・字幕を時間軸で重ねて、画面録画のように見せる。
 * ・時刻 t を渡せば、その時点の絵を毎回ゼロから組み立てる(状態を持たない)ので、
 *   10秒すすむ/もどる・シークバー・チャプター移動が正確に効く。
 * ・座標はすべて「スクショの画素」(frame.w × frame.h 基準)。ズームしてもカーソルの大きさは変わらない。
 * ・URL: demo.html (機能一覧) / demo.html?f=<id> (その機能を再生) / demo.html?f=<id>#t=12000 (12秒で一時停止)
 *
 * 使い方(各ツールの demo.html から):
 *   DesktopDemo.start({
 *     title: 'BlurPaint 機能デモ', icon: '🖍️', back: 'index.html', backLabel: '← BlurPaint の図解にもどる',
 *     lead: '…', frame: { w: 1280, h: 720, title: 'BlurPaint' }, imgBase: 'demo-img/',
 *     features: [{ id: 'arrow', icon: '➡️', title: '矢印を引く', desc: '…', sec: '基本の操作', top: false,
 *                  script: function (d) { d.chapter('…'); d.scene('a.png'); d.cursor(100, 100); d.click(); d.cap('…'); d.wait(2000); } }]
 *   });
 *
 * 台本 d の命令(どれも「いまの台本時刻」に積む。時間が進むのは wait・cursor・drag・press のとき):
 *   chapter(title)               章の切り替え(チップ・字幕の見出し)
 *   scene(file, {fade})          表示するスクショを切り替える(既定 220ms のクロスフェード)
 *   cam({x,y,w,h}|null, {dur})   ズーム(スクショ上の見たい範囲)。null で全体に戻す。台本時刻は進まない
 *   cursor(x, y, {dur})          カーソルを動かす(既定 700ms)。台本時刻が dur 進む
 *   click({dur})                 クリックの波紋。台本時刻が少し(260ms)進む
 *   drag(x1,y1,x2,y2,{dur})      x1,y1 へ動く→押す→x2,y2 まで動かす→離す
 *   key('Ctrl+V', {dur})         押したキーのバッジを出す。台本時刻が少し(500ms)進む
 *   mark({x,y,w,h}, {dur,label}) 注目させる枠(脈打つ)。台本時刻は進まない
 *   cap(text)                    字幕。null/'' で消す
 *   wait(ms)                     台本時刻を進める
 */
(function () {
  'use strict';

  var CSS = [
    ':root { --bg: #17142a; --ink: #f4f1ff; --acc: #7c5cff; --gold: #f59e0b; }',
    '* { box-sizing: border-box; }',
    'html, body { margin: 0; height: 100%; background: var(--bg); color: var(--ink); font-family: "Yu Gothic", "Meiryo", system-ui, sans-serif; }',
    'body.player { overflow: hidden; }',
    'a { color: inherit; }',
    '#hub { display: none; max-width: 980px; margin: 0 auto; padding: 24px 16px 60px; }',
    'body.hub #hub { display: block; }',
    '#hub h1 { font-size: 24px; margin: 8px 0 6px; }',
    '#hub p.lead { color: #cfc8ff; line-height: 1.8; margin: 0 0 20px; }',
    '#hub .back { color: #cfc8ff; font-size: 14px; text-decoration: none; }',
    '.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }',
    '.card { display: block; text-decoration: none; background: #ffffff10; border: 1px solid #ffffff2a; border-radius: 14px; padding: 16px 18px; transition: .15s; }',
    '.card:hover { background: #ffffff1c; border-color: var(--acc); transform: translateY(-2px); }',
    '.card .ic { font-size: 30px; }',
    '.card h2 { font-size: 17px; margin: 6px 0 4px; }',
    '.card p { font-size: 13.5px; line-height: 1.65; color: #d8d2ff; margin: 0; }',
    '.card .len { font-size: 12px; color: #a99fff; margin-top: 8px; }',
    'h3.sec { margin: 26px 0 10px; font-size: 15px; color: #ffd98a; }',
    '#player { display: none; }',
    'body.player #player { display: block; }',
    '#stage { position: fixed; left: 0; top: 56px; bottom: 56px; right: 440px; display: flex; align-items: center; justify-content: center; padding: 10px 6px 10px 14px; }',
    '.win { position: relative; background: #0d0b18; border: 1px solid #ffffff33; border-radius: 10px; box-shadow: 0 18px 50px #000a; overflow: hidden; }',
    '.win .tb { height: 28px; background: #2a2640; display: flex; align-items: center; gap: 6px; padding: 0 10px; font-size: 12px; color: #d8d2ff; }',
    '.win .tb i { width: 10px; height: 10px; border-radius: 50%; background: #ff5f57; display: inline-block; }',
    '.win .tb i:nth-child(2) { background: #febc2e; } .win .tb i:nth-child(3) { background: #28c840; }',
    '.win .tb b { margin-left: 8px; font-weight: normal; }',
    '.view { position: relative; overflow: hidden; background: #fff; }',
    '.world { position: absolute; left: 0; top: 0; transform-origin: 0 0; will-change: transform; }',
    '.world img { position: absolute; left: 0; top: 0; display: block; user-select: none; -webkit-user-drag: none; }',
    '#marks { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 5; }',
    '.mk { position: absolute; border: 3px solid #ffd166; border-radius: 8px; box-shadow: 0 0 0 2px #0008, 0 0 18px #ffd166aa; pointer-events: none; }',
    '.mk span { position: absolute; left: -3px; top: 100%; margin-top: 6px; background: #ffd166; color: #2b1a00; font-size: 14px; font-weight: bold; padding: 2px 10px; border-radius: 6px; white-space: nowrap; }',
    '.cur { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 7; pointer-events: none; transform-origin: 0 0; }',
    '.cur svg { position: absolute; left: -2px; top: -2px; width: 26px; height: 26px; filter: drop-shadow(0 2px 3px #0009); transition: transform .08s; transform-origin: 3px 3px; }',
    '.cur.dn svg { transform: scale(.82); }',
    '.rip { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 6; pointer-events: none; transform-origin: 0 0; }',
    '.rip i { position: absolute; left: -22px; top: -22px; width: 44px; height: 44px; border-radius: 50%; border: 4px solid #ff4d6d; background: #ff4d6d33; }',
    '.keyb { position: absolute; left: 50%; bottom: 7%; transform: translateX(-50%); background: #111d; color: #fff; border: 2px solid #ffffff88; border-radius: 12px; padding: 8px 20px; font-size: 22px; font-weight: bold; letter-spacing: .04em; pointer-events: none; opacity: 0; transition: opacity .12s; }',
    '.top { position: fixed; left: 0; right: 0; top: 0; height: 56px; display: flex; gap: 8px; align-items: center; padding: 0 14px; z-index: 2; }',
    '#chips { display: flex; gap: 8px; overflow-x: auto; padding: 4px 0; white-space: nowrap; scrollbar-width: none; flex: 1; }',
    '.top a.back { color: #cfc8ff; text-decoration: none; font-size: 14px; margin-right: 4px; white-space: nowrap; }',
    '.top h1 { font-size: 16px; margin: 0 8px 0 0; white-space: nowrap; }',
    '.top select { background: #ffffff18; color: var(--ink); border: 1px solid #ffffff44; border-radius: 8px; padding: 4px 6px; font: inherit; font-size: 13px; max-width: 150px; }',
    '.top select option { color: #111; }',
    '.chip { border: 1px solid #ffffff44; background: #ffffff14; color: var(--ink); border-radius: 999px; padding: 5px 12px; font: inherit; font-size: 13px; cursor: pointer; }',
    '.chip.on { background: var(--acc); border-color: var(--acc); color: #fff; font-weight: bold; }',
    '.cap-wrap { position: fixed; right: 20px; top: 56px; bottom: 56px; width: 400px; display: flex; align-items: center; pointer-events: none; z-index: 2; }',
    '.cap { width: 100%; background: #ffffff10; border: 1px solid #ffffff2a; color: #fff; padding: 18px 22px; border-radius: 14px; font-size: 19px; line-height: 1.75; text-align: left; white-space: pre-line; }',
    '.cap:empty { display: none; }',
    '.cap small { display: block; font-size: 14px; color: #ffd98a; margin-bottom: 6px; font-weight: bold; }',
    '.bar { position: fixed; left: 0; right: 0; bottom: 0; display: flex; gap: 10px; align-items: center; padding: 10px 14px; background: #000000b0; z-index: 3; }',
    '.bar select { border: 1px solid #ffffff55; background: #2a2640; color: #fff; border-radius: 8px; padding: 6px 6px; font: inherit; font-size: 14px; cursor: pointer; }',
    '.bar button { border: 1px solid #ffffff55; background: #ffffff1c; color: #fff; border-radius: 8px; padding: 6px 14px; font: inherit; font-size: 14px; cursor: pointer; }',
    '.prog { flex: 1; height: 10px; background: #ffffff30; border-radius: 5px; overflow: hidden; cursor: pointer; }',
    '.prog i { display: block; height: 100%; width: 0; background: var(--acc); }',
    '.time { font-size: 12px; color: #cfc8ff; min-width: 78px; text-align: right; }',
    '@media (max-width: 900px) {',
    '  .bar { gap: 8px 6px; padding: 8px 8px 10px; flex-wrap: wrap; }',
    '  .prog { order: -1; flex: 1 1 100%; }',
    '  .time { margin-left: auto; min-width: 0; }',
    '  .bar button, .bar select { padding: 6px 8px; font-size: 13px; }',
    '  .bar .wide { display: none; }',
    '  #stage { right: 0; bottom: 232px; padding: 6px; }',
    '  .cap-wrap { left: 12px; right: 12px; width: auto; top: auto; bottom: 80px; height: 146px; }',
    '  .cap { font-size: 14.5px; padding: 10px 14px; line-height: 1.6; max-height: 146px; overflow-y: auto; }',
    '  .top h1 { display: none; }',
    '}'
  ].join('\n');

  var BODY = [
    '<div id="hub"><a class="back" id="hubBack"></a><h1 id="hubTitle"></h1><p class="lead" id="hubLead"></p><div id="hubSecs"></div></div>',
    '<div id="player">',
    '  <div id="stage"><div class="win" id="win"><div class="tb"><i></i><i></i><i></i><b id="wtitle"></b></div>',
    '    <div class="view" id="view"><div class="world" id="world"><img id="imgA" alt=""><img id="imgB" alt="">',
    '      <div id="marks"></div><div class="rip" id="rip"><i></i></div>',
    '      <div class="cur" id="cur"><svg viewBox="0 0 26 26"><path d="M3 2 L3 20 L8 15.5 L11.5 23 L15 21.5 L11.6 14.2 L18 14 Z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg></div>',
    '    </div><div class="keyb" id="keyb"></div></div></div></div>',
    '  <div class="top"><a class="back" id="backList"></a><h1 id="ttl"></h1><span id="chips"></span><select id="jump" title="ほかの機能へ"></select></div>',
    '  <div class="cap-wrap"><div class="cap" id="cap"></div></div>',
    '  <div class="bar">',
    '    <button id="play">⏸ 一時停止</button><button id="back10" title="10秒もどる(←キー)">⏪ 10秒</button><button id="fwd10" title="10秒すすむ(→キー)">10秒 ⏩</button>',
    '    <select id="speed" title="再生速度"><option value="0.8">0.8倍</option><option value="1" selected>1.0倍</option><option value="1.2">1.2倍</option><option value="1.5">1.5倍</option><option value="2">2.0倍</option></select>',
    '    <button id="restart" class="wide">⟲ 最初から</button>',
    '    <div class="prog" id="prog"><i id="progi"></i></div><span class="time" id="time">0:00</span>',
    '  </div>',
    '</div>'
  ].join('\n');

  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(p) { p = clamp(p, 0, 1); return p * p * (3 - 2 * p); }
  function fmt(ms) { var s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  // ---------------- 台本の組み立て ----------------
  function makeScript(frame) {
    var EV = [], CH = [], T = 0;
    var full = { x: 0, y: 0, w: frame.w, h: frame.h };
    var d = {
      chapter: function (title) { CH.push({ title: title, at: T }); EV.push({ k: 'chapter', at: T, title: title }); },
      scene: function (file, o) { EV.push({ k: 'scene', at: T, file: file, fade: (o && o.fade != null) ? o.fade : 220 }); },
      cam: function (rect, o) { EV.push({ k: 'cam', at: T, rect: rect || full, dur: (o && o.dur != null) ? o.dur : 800 }); },
      cursor: function (x, y, o) { var dur = (o && o.dur != null) ? o.dur : 700; EV.push({ k: 'cursor', at: T, x: x, y: y, dur: dur }); T += dur; },
      click: function (o) { EV.push({ k: 'click', at: T }); EV.push({ k: 'press', at: T, down: true }); EV.push({ k: 'press', at: T + 140, down: false }); T += (o && o.dur != null) ? o.dur : 260; },
      drag: function (x1, y1, x2, y2, o) {
        var dur = (o && o.dur != null) ? o.dur : 900;
        d.cursor(x1, y1, { dur: (o && o.approach != null) ? o.approach : 600 });
        EV.push({ k: 'press', at: T, down: true }); T += 120;
        EV.push({ k: 'cursor', at: T, x: x2, y: y2, dur: dur }); T += dur;
        EV.push({ k: 'press', at: T, down: false }); T += 120;
      },
      key: function (text, o) { var dur = (o && o.dur != null) ? o.dur : 500; EV.push({ k: 'key', at: T, text: text, dur: 1300 }); T += dur; },
      mark: function (rect, o) { EV.push({ k: 'mark', at: T, rect: rect, dur: (o && o.dur != null) ? o.dur : 2500, label: (o && o.label) || '' }); },
      cap: function (text) { EV.push({ k: 'cap', at: T, text: text || '' }); },
      wait: function (ms) { T += ms; }
    };
    return { d: d, build: function (fn) { fn(d); return { EV: EV, CH: CH, TOTAL: T + 400 }; } };
  }

  // ---------------- 本体 ----------------
  function start(cfg) {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    document.title = cfg.title;
    var wrap = document.createElement('div'); wrap.innerHTML = BODY;
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

    var frame = cfg.frame, imgBase = cfg.imgBase || '';
    var feats = cfg.features, byId = {};
    feats.forEach(function (f) { byId[f.id] = f; });
    var fid = (location.search.match(/[?&]f=([\w-]+)/) || [])[1];

    // 機能の長さを出すため、台本は一度組み立てておく(一覧のカードに「約◯秒」を出す)
    feats.forEach(function (f) { f._built = makeScript(frame).build(f.script); });

    // ---- 一覧 ----
    if (!fid || !byId[fid]) {
      document.body.className = 'hub';
      $('hubBack').href = cfg.back; $('hubBack').textContent = cfg.backLabel;
      $('hubTitle').textContent = cfg.icon + ' ' + cfg.title;
      $('hubLead').innerHTML = cfg.lead;
      var secs = [], secMap = {};
      feats.forEach(function (f) {
        var name = f.sec || '機能ごとのデモ';
        if (!secMap[name]) { secMap[name] = []; secs.push(name); }
        secMap[name].push(f);
      });
      secs.forEach(function (name) {
        var h = document.createElement('h3'); h.className = 'sec'; h.textContent = name; $('hubSecs').appendChild(h);
        var g = document.createElement('div'); g.className = 'grid'; $('hubSecs').appendChild(g);
        secMap[name].forEach(function (f) {
          var a = document.createElement('a'); a.className = 'card'; a.href = '?f=' + f.id;
          a.innerHTML = '<div class="ic">' + f.icon + '</div><h2>' + f.title + '</h2><p>' + f.desc + '</p><div class="len">約' + fmt(f._built.TOTAL) + '</div>';
          g.appendChild(a);
        });
      });
      return;
    }

    // ---- プレイヤー ----
    document.body.className = 'player';
    var F = byId[fid], EV = F._built.EV, CH = F._built.CH, TOTAL = F._built.TOTAL;
    $('backList').href = 'demo.html'; $('backList').textContent = '← 機能一覧';
    $('ttl').textContent = F.icon + ' ' + F.title;
    $('wtitle').textContent = frame.title || cfg.title;
    var jump = $('jump');
    feats.forEach(function (f) { var o = document.createElement('option'); o.value = f.id; o.textContent = f.icon + ' ' + f.title; if (f.id === fid) o.selected = true; jump.appendChild(o); });
    jump.onchange = function () { location.search = '?f=' + jump.value; };

    // 使うスクショを先に読んでおく
    var seen = {};
    EV.forEach(function (e) { if (e.k === 'scene' && !seen[e.file]) { seen[e.file] = 1; var im = new Image(); im.src = imgBase + e.file; } });

    var view = $('view'), world = $('world'), win = $('win'), imgA = $('imgA'), imgB = $('imgB');
    var cur = $('cur'), rip = $('rip'), marksEl = $('marks'), keyb = $('keyb'), capEl = $('cap');
    world.style.width = frame.w + 'px'; world.style.height = frame.h + 'px';
    var scale = 1;
    function layout() {
      var st = $('stage'), cs = getComputedStyle(st);
      var aw = st.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var ah = st.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 28;
      scale = Math.min(aw / frame.w, ah / frame.h);
      view.style.width = Math.floor(frame.w * scale) + 'px'; view.style.height = Math.floor(frame.h * scale) + 'px';
      win.style.width = Math.floor(frame.w * scale) + 'px';
    }
    window.addEventListener('resize', function () { layout(); render(vt); });
    layout();

    var full = { x: 0, y: 0, w: frame.w, h: frame.h };
    // t 時点の値を求めるための時刻別リスト
    function lastBy(k, t) { var r = null; for (var i = 0; i < EV.length; i++) { var e = EV[i]; if (e.at > t) break; if (e.k === k) r = e; } return r; }
    function lastTwoBy(k, t) { var a = null, b = null; for (var i = 0; i < EV.length; i++) { var e = EV[i]; if (e.at > t) break; if (e.k === k) { b = a; a = e; } } return [a, b]; }

    function camAt(t) {
      var rect = full;
      for (var i = 0; i < EV.length; i++) {
        var e = EV[i]; if (e.at > t) break; if (e.k !== 'cam') continue;
        var p = ease((t - e.at) / Math.max(1, e.dur));
        rect = { x: rect.x + (e.rect.x - rect.x) * p, y: rect.y + (e.rect.y - rect.y) * p, w: rect.w + (e.rect.w - rect.w) * p, h: rect.h + (e.rect.h - rect.h) * p };
        if (p < 1) return rect;
        rect = e.rect;
      }
      return rect;
    }
    function curAt(t) {
      var pos = null;
      for (var i = 0; i < EV.length; i++) {
        var e = EV[i]; if (e.at > t) break; if (e.k !== 'cursor') continue;
        if (!pos) pos = { x: e.x, y: e.y };
        var p = ease((t - e.at) / Math.max(1, e.dur));
        var np = { x: pos.x + (e.x - pos.x) * p, y: pos.y + (e.y - pos.y) * p };
        if (p < 1) return np;
        pos = { x: e.x, y: e.y };
      }
      return pos;
    }

    var shownA = '', shownB = '';
    function setSrc(el, file, which) {
      var cache = which === 'A' ? shownA : shownB;
      if (cache !== file) { el.src = file ? imgBase + file : ''; el.style.visibility = file ? 'visible' : 'hidden'; if (which === 'A') shownA = file; else shownB = file; }
    }
    var lastCap = '\u0000';
    function render(t) {
      // スクショ(クロスフェード)
      var two = lastTwoBy('scene', t), sc = two[0], pv = two[1];
      if (sc) {
        var p = clamp((t - sc.at) / Math.max(1, sc.fade), 0, 1);
        setSrc(imgA, sc.file, 'A'); imgA.style.opacity = p < 1 && pv ? String(p) : '1';
        if (p < 1 && pv) { setSrc(imgB, pv.file, 'B'); } else { setSrc(imgB, '', 'B'); }
        // 下の層(B)は前の絵、上の層(A)が今の絵。DOM順で A が先なので z-index で上下を決める
        imgA.style.zIndex = 2; imgB.style.zIndex = 1;
      }
      // カメラ
      var c = camAt(t), z = frame.w * scale / c.w;
      world.style.transform = 'translate(' + (-c.x * z) + 'px,' + (-c.y * z) + 'px) scale(' + z + ')';
      // カーソル(画面上の大きさは一定に)
      var cp = curAt(t);
      if (cp) {
        cur.style.display = 'block'; cur.style.transform = 'translate(' + cp.x + 'px,' + cp.y + 'px) scale(' + (1 / z) * 1.15 + ')';
        var pr = lastBy('press', t); cur.className = 'cur' + (pr && pr.down ? ' dn' : '');
      } else cur.style.display = 'none';
      // クリックの波紋
      var ck = lastBy('click', t);
      if (ck && cp && t - ck.at < 520) {
        var q = (t - ck.at) / 520, ce = curAt(ck.at);
        rip.style.display = 'block'; rip.style.opacity = String(1 - q);
        rip.style.transform = 'translate(' + ce.x + 'px,' + ce.y + 'px) scale(' + (1 / z) * (0.5 + q) + ')';
      } else rip.style.display = 'none';
      // 目印の枠
      var html = '';
      for (var i = 0; i < EV.length; i++) {
        var e = EV[i]; if (e.at > t) break;
        if (e.k === 'mark' && t < e.at + e.dur) {
          var a = clamp((t - e.at) / 200, 0, 1) * clamp((e.at + e.dur - t) / 250, 0, 1);
          var pulse = 1 + 0.015 * Math.sin((t - e.at) / 160);
          html += '<div class="mk" style="left:' + e.rect.x + 'px;top:' + e.rect.y + 'px;width:' + e.rect.w + 'px;height:' + e.rect.h + 'px;opacity:' + a + ';transform:scale(' + pulse + ')">' +
            (e.label ? '<span style="font-size:' + (14 / z) + 'px;padding:' + (2 / z) + 'px ' + (10 / z) + 'px;margin-top:' + (6 / z) + 'px;border-radius:' + (6 / z) + 'px">' + e.label + '</span>' : '') + '</div>';
        }
      }
      marksEl.innerHTML = html;
      // 押したキー
      var ky = lastBy('key', t);
      if (ky && t - ky.at < ky.dur) { keyb.textContent = ky.text; keyb.style.opacity = '1'; } else keyb.style.opacity = '0';
      // 字幕
      var cp2 = lastBy('cap', t), ch = lastBy('chapter', t);
      var txt = (cp2 ? cp2.text : ''), tag = ch ? ch.title : '';
      var key = tag + '|' + txt;
      if (key !== lastCap) {
        lastCap = key;
        capEl.innerHTML = txt ? (tag ? '<small></small>' : '') + '<span></span>' : '';
        if (txt) { if (tag) capEl.firstChild.textContent = tag; capEl.lastChild.textContent = txt; }
      }
      // 進行
      $('progi').style.width = (t / TOTAL * 100) + '%'; $('time').textContent = fmt(t) + ' / ' + fmt(TOTAL);
      var on = -1; for (var j = 0; j < CH.length; j++) if (CH[j].at <= t) on = j;
      chipBtns.forEach(function (b, i2) { b.classList.toggle('on', i2 === on); });
    }

    // チャプターのチップ
    var chipBtns = [], chipsEl = $('chips');
    CH.forEach(function (c) {
      var b = document.createElement('button'); b.className = 'chip'; b.textContent = c.title;
      b.onclick = function () { vt = c.at + 50; playing = true; $('play').textContent = '⏸ 一時停止'; render(vt); };
      chipsEl.appendChild(b); chipBtns.push(b);
    });

    // ---- 再生制御 ----
    var vt = 0, playing = true, speed = 1, speedEl = $('speed');
    try { var saved = Number(localStorage.getItem('demoSpeed')); if ([0.8, 1, 1.2, 1.5, 2].indexOf(saved) >= 0) speed = saved; } catch (e) {}
    speedEl.value = String(speed);
    speedEl.onchange = function () { speed = Number(speedEl.value) || 1; try { localStorage.setItem('demoSpeed', String(speed)); } catch (e) {} };
    function seek(t) { vt = clamp(t, 0, TOTAL); render(vt); }
    function skip(ms) { seek(vt + ms); if (vt >= TOTAL) { playing = false; $('play').textContent = '▶ 再生'; } }
    $('play').onclick = function () {
      if (vt >= TOTAL) { seek(0); playing = true; } else playing = !playing;
      this.textContent = playing ? '⏸ 一時停止' : '▶ 再生';
    };
    $('restart').onclick = function () { seek(0); playing = true; $('play').textContent = '⏸ 一時停止'; };
    $('back10').onclick = function () { skip(-10000); };
    $('fwd10').onclick = function () { skip(10000); };
    $('prog').onclick = function (ev) { var r = this.getBoundingClientRect(); seek((ev.clientX - r.left) / r.width * TOTAL); };
    document.addEventListener('keydown', function (ev) {
      var tg = ev.target && ev.target.tagName;
      if (tg === 'SELECT' || tg === 'INPUT' || tg === 'TEXTAREA') return;
      if (ev.key === 'ArrowLeft') { skip(-10000); ev.preventDefault(); }
      else if (ev.key === 'ArrowRight') { skip(10000); ev.preventDefault(); }
      else if (ev.key === ' ' && tg !== 'BUTTON') { $('play').click(); ev.preventDefault(); }
    });
    var prev = performance.now();
    function loop(now) {
      var dt = Math.min(100, now - prev); prev = now;
      if (playing) {
        vt += dt * speed;
        if (vt >= TOTAL) { vt = TOTAL; playing = false; $('play').textContent = '▶ 再生'; }
        render(vt);
      }
      requestAnimationFrame(loop);
    }
    var m = location.hash.match(/t=(\d+)/);
    if (m) { vt = Number(m[1]); playing = false; $('play').textContent = '▶ 再生'; }
    render(vt);
    requestAnimationFrame(function (n) { prev = n; loop(n); });
    document.documentElement.dataset.ready = '1';
    document.documentElement.dataset.total = String(TOTAL);
  }

  window.DesktopDemo = { start: start };
})();
