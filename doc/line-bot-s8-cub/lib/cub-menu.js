/*
 * s8-cub チュートリアル用の部品。GameGuide(guide.js)の上に乗せて使う。
 *   - メニューの3D: menus-data.js(window.CUB_MENUS。rich-menu-config.js から自動生成)の定義どおりに、
 *     リッチメニューを立体の板として組み立てる。メニューを変えたら menus-data.js を作り直すだけで追従する
 *   - 右パネルに出す「トーク画面」「LIFF画面」のモックのHTML
 * 読み込み順: three.min.js → OrbitControls.js → lib/guide.js → menus-data.js → lib/cub-menu.js
 */
(function () {
  'use strict';
  var W = 10;                 // メニューの幅(ワールド単位)。高さは行数×行の高さ(LINEの2500x843の比率)
  var UNIT = 250;             // LINEの画像のpx → ワールド単位

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function br(s) { return esc(s).replace(/\n/g, '<br>'); }

  function tileId(menuId, label) { return 'tile:' + menuId + ':' + label; }
  function rowH(menu) { return (menu.rowHeight || 843) / UNIT; }
  function heightOf(menu) { return rowH(menu) * menu.layout.length; }

  // ラベルの大きさ。タイル幅に収まる範囲で、なるべく大きく
  function labelSize(label, tileWidth, rh) {
    var len = Array.from(label).reduce(function (n, ch) { return n + (ch.charCodeAt(0) > 0x2000 && ch.codePointAt(0) > 0xffff ? 1.5 : 1); }, 0);
    return Math.min(0.75, rh * 0.28, (tileWidth * 0.8) / (len * 0.8));
  }

  // 使うメニューだけを立体の板として並べる(同じ位置に重ねて、ステップごとに show で出し分ける)
  function build(g, menuIds) {
    menuIds.forEach(function (mid) {
      var menu = window.CUB_MENUS[mid];
      var rh = rowH(menu), H = heightOf(menu);
      g.group('menu:' + mid, { pos: [0, H / 2, 0] });
      g.box({ id: 'base:' + mid, parent: 'menu:' + mid, size: [W + 0.3, H + 0.3, 0.2], pos: [0, 0, -0.2], color: '#06C755', edges: false });
      menu.layout.forEach(function (row, ri) {
        var tw = W / row.length;
        row.forEach(function (tile, ci) {
          g.box({
            id: tileId(mid, tile.label), parent: 'menu:' + mid,
            size: [tw - 0.12, rh - 0.12, 0.3],
            pos: [-W / 2 + tw * (ci + 0.5), H / 2 - rh * (ri + 0.5), 0],
            color: tile.color, roughness: 0.7, edges: false,
            label: tile.label, labelColor: '#222222', labelSize: labelSize(tile.label, tw, rh), labelOffset: [0, 0, 0.22],
          });
        });
      });
    });
  }

  // ステップ1つ分の舞台設定。menu=見せるメニュー、hl=押すボタンのラベル(配列。省略するとメニュー全体を見せる)
  function step(o) {
    var menu = window.CUB_MENUS[o.menu];
    var H = heightOf(menu);
    var hl = o.hl ? [].concat(o.hl) : null;
    var s = {
      title: o.title,
      html: o.html,
      show: ['menu:' + o.menu],
      camera: { pos: [hl ? 2.2 : 0, H / 2 + (H > 4 ? 2.2 : 1.6), H > 4 ? 15 : 11.5], target: [0, H / 2, 0] },
      update: function (g, t) {
        var grp = g.get('menu:' + o.menu);
        if (!hl) { grp.rotation.y = Math.sin(t * 0.7) * 0.14; return; }
        hl.forEach(function (label) {
          var mesh = g.get(tileId(o.menu, label));
          mesh.position.z = 0.6 * g.phase(t, 0.15, 0.6);   // 押すボタンが手前に飛び出す
          g.pulse(mesh, t, 0.025);
        });
      },
    };
    if (hl) s.focus = hl.map(function (l) { return tileId(o.menu, l); }).concat(['base:' + o.menu]);
    return s;
  }

  // ---- 右パネルのモック ----

  // トーク画面。msgs: { who: 'me' | 'bot' | 'file' | 'sys', text }
  function chat(msgs, title) {
    return '<div class="tu-chat">' +
      (title ? '<div class="tu-chat-title">' + esc(title) + '</div>' : '') +
      msgs.map(function (m) {
        if (m.who === 'sys') return '<div class="tu-sys">' + br(m.text) + '</div>';
        if (m.who === 'file') return '<div class="tu-b me"><div class="tu-file">📎 ' + esc(m.text) + '</div></div>';
        return '<div class="tu-b ' + m.who + '">' + (m.who === 'bot' ? '<span class="tu-n">カブナビ8ちゃん</span>' : '') + '<div>' + br(m.text) + '</div></div>';
      }).join('') + '</div>';
  }

  // LIFF画面(スマホで開く入力画面)。parts は下のfield/ta/radios/checks/btn で作ったHTML
  function liff(title, parts) {
    return '<div class="tu-liff"><div class="tu-bar">' + esc(title) + '</div><div class="tu-in">' + parts.join('') + '</div></div>';
  }
  function field(label, value, kind) {
    return '<div class="tu-lb">' + esc(label) + '</div><div class="tu-field' + (kind === 'select' ? ' sel' : '') + '">' + esc(value) + '</div>';
  }
  function ta(label, value) {
    return '<div class="tu-lb">' + esc(label) + '</div><div class="tu-field ta">' + br(value) + '</div>';
  }
  function radios(items, selected) {
    return items.map(function (t, i) { return '<div class="tu-opt"><span class="tu-r' + (i === selected ? ' on' : '') + '"></span><span>' + br(t) + '</span></div>'; }).join('');
  }
  function checks(items, checked) {
    return items.map(function (t, i) { return '<div class="tu-opt"><span class="tu-c' + ((checked || []).indexOf(i) >= 0 ? ' on' : '') + '"></span><span>' + br(t) + '</span></div>'; }).join('');
  }
  function btn(text, danger) { return '<div class="tu-btn' + (danger ? ' danger' : '') + '">' + esc(text) + '</div>'; }

  window.CubMenu = {
    build: build, step: step, tileId: tileId,
    ui: { chat: chat, liff: liff, field: field, ta: ta, radios: radios, checks: checks, btn: btn },
  };
})();
