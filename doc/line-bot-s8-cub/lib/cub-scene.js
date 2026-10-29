/*
 * s8-cub アーキテクチャ図の舞台(overview.html と usecase.html で共有)。
 * 「カブナビ8ちゃんの中(保存しているもの)」と「外(人・LINEグループ・cron)」の箱と矢印を並べる。
 * 読み込み順: three.min.js → OrbitControls.js → lib/guide.js → lib/cub-scene.js
 */
(function () {
  'use strict';
  // ステップで明るく見せる id(箱と矢印)
  function ids(nodes, links) {
    var r = ['plate'];
    nodes.forEach(function (n) { r.push(n); });
    links.forEach(function (l) { r.push('a-' + l, 'f-' + l); });
    return r;
  }

  // 舞台を作る。g は GameGuide。戻り値の node / link で、ページ独自の箱や矢印を足せる
  function create(g) {
    var C = GameGuide.colors;
    // 画面は「カブナビ8ちゃんの中(保存しているもの)」と「外(人・LINEグループ・cron)」に分けて並べる。
    // 座標は [x, y, z]。奥が -z、手前が +z。箱の高さは 0.8 で、中心 y = 0.4。
    var N = {};   // id -> { x, z, w, d }

    function node(id, x, z, label, color, w, d) {
      w = w || 4.4; d = d || 2;
      N[id] = { x: x, z: z, w: w, d: d };
      g.box({ id: id, size: [w, 0.8, d], pos: [x, 0.4, z], color: color, radius: 0.2, edges: false, label: label, labelSize: 0.5, labelOffset: [0, 1.5, 0], labelBg: '#1b1830ee', labelBorder: color });
    }

    // 箱の縁から縁へ矢印を引く(箱の中に潜り込まないように、向きに応じて縁の位置を求める)
    function edge(n, tx, tz) {
      var dx = tx - n.x, dz = tz - n.z;
      var tX = dx ? (n.w / 2) / Math.abs(dx) : 1e9, tZ = dz ? (n.d / 2) / Math.abs(dz) : 1e9;
      var t = Math.min(tX, tZ) + 0.03;
      return [n.x + dx * t, 0.4, n.z + dz * t];
    }
    function link(id, from, to, label, color, lift) {
      var a = N[from], b = N[to];
      var A = g.arrow(edge(a, b.x, b.z), edge(b, a.x, a.z), { id: 'a-' + id, color: color, label: label, labelSize: 0.34, labelBg: '#1b1830dd', lift: lift == null ? 1.0 : lift });
      g.flow(A.userData.curve, { id: 'f-' + id, color: color, count: 4 });
    }


    function buildBase() {
      // カブナビ8ちゃんの中(Redisに保存しているもの)を囲む床
      g.plate({ id: 'plate', size: [25, 19], pos: [0, 0.03, -3.5], color: '#241f38', opacity: 0.95, radius: 0.5, label: '🤖 カブナビ8ちゃんの中(保存しているもの)', labelSize: 0.55, labelOffset: [0, 0.5, 10.2] });

      // 中(縦に3段: 予定の列 / 案内の列 / 送信先の列)
      node('pdf', -9, 3, '📄 カブ8通信PDF\n(読み取るだけ)', C.neutral);
      node('events', -9, -4, '🗓 活動予定\n(取り込み済み)', C.good);
      node('preview', 0, -4, '👀 開催案内\n(プレビュー)', C.data);
      node('notice', 0, -11, '✏️ 案内文設定\nヘッダ・フッタ・テンプレ', C.gold);
      node('resv', 9, 3, '📢 アナウンス予約\n(日時・宛先・本文)', '#ff8fb1');
      node('groups', 9, -11, '👥 登録グループ\n(保護者・指導者・オーナー)', C.third);
      node('admins', -9, -11, '👑 管理者リスト\n(オーナー＋追加分)', C.server);
      // 外
      node('admin', -17, -4, '🧑‍💼 管理者\n(LINEの1:1トーク)', C.me, 4.4, 2.4);
      node('line', 17, 3, '💬 保護者のLINEグループ\n(送信先)', '#06c755', 4.6, 2.4);
      node('cron', 9, 10.5, '⏰ cron-job.org\n(毎分)', C.enemy, 4.4, 1.8);

      // 矢印(id, from, to, ラベル, 色, 弧の高さ)
      link('pdf', 'admin', 'pdf', 'PDFを送る\n(カブ8取り込み)', C.me, 1.6);
      link('read', 'pdf', 'events', '読み取って保存', C.good, 0.8);
      link('ev-pv', 'events', 'preview', '予定', C.good, 0.8);
      link('nt-pv', 'notice', 'preview', 'ヘッダ・フッタ\n・テンプレ', C.gold, 0.8);
      link('pv-ad', 'preview', 'admin', '案内文プレビューで確認', C.data, 5.2);
      link('send', 'preview', 'line', '「次回を送信」(今すぐ)', C.data, 3.2);
      link('gr-pv', 'groups', 'preview', '送信先', C.third, 0.8);
      link('reg', 'line', 'groups', 'グループ追加\n(グループ内で@メンション)', '#06c755', 1.6);
      link('add-rs', 'admin', 'resv', 'アナウンス追加(日時・宛先・本文)', C.me, 7);
      link('pv-rs', 'preview', 'resv', '本文をコピペ', C.data, 0.8);
      link('gr-rs', 'groups', 'resv', '宛先を選ぶ', C.third, 1.2);
      link('cr-rs', 'cron', 'resv', '毎分確認', C.enemy, 0.8);
      link('rs-ln', 'resv', 'line', '時刻になったら\n自動で送信', '#ff8fb1', 1.6);
      link('ad-ls', 'admin', 'admins', '管理者の追加・削除\n(オーナーは外せない)', C.me, 1.2);

    }
    return { N: N, node: node, link: link, buildBase: buildBase };
  }

  window.CubScene = { create: create, ids: ids };
})();
