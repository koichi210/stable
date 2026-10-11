/*
 * s8-cub チュートリアル用の部品。右パネルに出す「トーク画面」「LIFF画面」のモックのHTMLを作る。
 * 読み込み順: lib/guide.js の後(usecase.html が使う)。スタイルは lib/cub-tutorial.css
 */
(function () {
  'use strict';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function br(s) { return esc(s).replace(/\n/g, '<br>'); }

  // ---- 右パネルのモック ----

  // at(ms, html): デモ再生用。ステップに入ってから ms ミリ秒後にふわっと現れる(data-at を持つ要素は、ページ側で時間差表示する)
  function at(ms, html) { return '<div data-at="' + ms + '">' + html + '</div>'; }

  // トーク画面。msgs: { who: 'me' | 'bot' | 'file' | 'sys', text, at(任意: 現れる時刻ms) }
  function chat(msgs, title) {
    return '<div class="tu-chat">' +
      (title ? '<div class="tu-chat-title">' + esc(title) + '</div>' : '') +
      msgs.map(function (m) {
        var h = bubble(m);
        return m.at == null ? h : at(m.at, h);
      }).join('') + '</div>';
  }
  function bubble(m) {
    {
        if (m.who === 'sys') return '<div class="tu-sys">' + br(m.text) + '</div>';
        if (m.who === 'file') return '<div class="tu-b me"><div class="tu-file">📎 ' + esc(m.text) + '</div></div>';
        return '<div class="tu-b ' + m.who + '">' + (m.who === 'bot' ? '<span class="tu-n">カブナビ8ちゃん</span>' : '') + '<div>' + br(m.text) + '</div></div>';
    }
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
    ui: { at: at, chat: chat, liff: liff, field: field, ta: ta, radios: radios, checks: checks, btn: btn },
  };
})();
