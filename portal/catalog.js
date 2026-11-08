/*
 * stable ポータルのカタログ（トップの魔法陣と、各説明ページの左メニューが読む共通データ）。
 *
 * ツールを足すとき:
 *   1. ITEMS に1件足す（href はリポジトリ直下からの相対パス。説明ページのフォルダ）
 *   2. そのフォルダに index.html（説明ページ）を作る。doc/Essentials/Cheetos/index.html が手本
 * 並び順は、グループごとに魔法陣のどの位置に出るかに効く（グループ内で左回り）。
 */
(function () {
  'use strict';

  var GROUPS = [
    { id: 'desk', name: 'Windows ツール', color: '#ff5fd2' },
    { id: 'side', name: '常駐・Web', color: '#5fffc4' },
    { id: 'line', name: 'LINE ボット', color: '#55dcff' },
    { id: 'fs', name: '試作ゲーム', color: '#ffc94d' },
  ];

  var ITEMS = [
    // ---- LINE ボット ----
    { id: 'line-bot-mirai', name: 'line-bot-mirai', emoji: '🤖', group: 'line', href: 'doc/line-bot-mirai/',
      tech: 'LINEボット / Node.js + Express / Vercel',
      summary: 'LINEボット「ミライ」。構成と、立ち上げるときに触るサイトを立体図で。' },
    { id: 'line-bot-s8-cub', name: 'line-bot-s8-cub', emoji: '🏕️', group: 'line', href: 'doc/line-bot-s8-cub/',
      tech: 'LINEボット / Node.js / Vercel',
      summary: 'カブ隊用LINEボット「カブナビ8ちゃん」。メニュー階層・アーキテクチャ・役割別の使い方。' },

    // ---- 試作ゲーム ----
    { id: 'FeasibilityStudy', name: 'FeasibilityStudy', emoji: '🔭', group: 'fs', href: 'doc/FeasibilityStudy/', big: true,
      tech: '試作ゲーム10本 / Three.js 図解・遊び方',
      summary: '試作ゲームの置き場。ゲームごとの仕組み図解と遊び方チュートリアル。' },

    // ---- 常駐・Web ----
    { id: 'SecretaryGadget', name: 'SecretaryGadget', emoji: '🗂️', group: 'side', href: 'doc/Essentials/SecretaryGadget/',
      tech: '秘書さんガジェット / WPF 常駐',
      summary: 'Outlook・Teams の新着やタイマーを、秘書さんが吹き出しで知らせる。' },
    { id: 'ClaudeOffice', name: 'ClaudeOffice', emoji: '🏰', group: 'side', href: 'doc/Essentials/ClaudeOffice/',
      tech: '箱庭ダッシュボード / Node + Three.js',
      summary: 'Claude Code の会話を、3Dの部屋の住人として見渡すダッシュボード。' },
    { id: 'StockRadar', name: 'StockRadar', emoji: '📡', group: 'side', href: 'doc/Essentials/StockRadar/',
      tech: '株レーダー / Node（ローカル専用）',
      summary: '日本株の買い候補と、利確・損切りの目安を決まったルールで一覧にする。' },
    { id: 'BlurPaint', name: 'BlurPaint', emoji: '🖍️', group: 'side', href: 'doc/Essentials/BlurPaint/',
      tech: '画像注釈エディタ / HTML Canvas',
      summary: '画像にぼかし・モザイク・矢印・文字を入れて書き出す。' },
    { id: 'VsCodePets', name: 'VsCodePets', emoji: '🐶', group: 'side', href: 'doc/Essentials/VsCodePets/',
      tech: 'VS Code 拡張 / TypeScript',
      summary: 'VS Code のパネルを歩き回り、空を飛ぶペット。' },
    { id: 'LoginHistory', name: 'LoginHistory', emoji: '📝', group: 'side', href: 'doc/Essentials/LoginHistory/',
      tech: '稼働ログ / C++ / MFC',
      summary: 'PC が動いていた時刻をログファイルに書き残す。' },

    // ---- Windows ツール ----
    { id: 'EventRecorder', name: 'EventRecorder', emoji: '🎬', group: 'desk', href: 'doc/Essentials/EventRecorder/',
      tech: 'マクロ記録・再生 / WPF',
      summary: 'キーボード・マウス操作を記録して、そのまま再生する。' },
    { id: 'DuplicateFinder', name: 'DuplicateFinder', emoji: '🗑️', group: 'desk', href: 'doc/Essentials/DuplicateFinder/',
      tech: '重複ファイル削除 / WPF',
      summary: 'サイズ → 先頭末尾 → 中身の順に絞り込んで、同じファイルを探して消す。' },
    { id: 'Launcher', name: 'Launcher', emoji: '🚀', group: 'desk', href: 'doc/Essentials/Launcher/',
      tech: 'ランチャー / WPF / .NET 10',
      summary: 'よく使うアプリやフォルダをボタン1つで開く。' },
    { id: 'FileArranger', name: 'FileArranger', emoji: '📂', group: 'desk', href: 'doc/Essentials/FileArranger/',
      tech: 'ファイル整理 / WPF',
      summary: 'フォルダ・ファイルの移動、リネーム、並べ替え、振り分け。' },
    { id: 'Cheetos', name: 'Cheetos', emoji: '📸', group: 'desk', href: 'doc/Essentials/Cheetos/',
      tech: '連続キャプチャ / WPF',
      summary: '画面を決めた間隔で連続キャプチャして、切り取り・回転・結合で仕上げる。' },
    { id: 'FFEdit', name: 'FFEdit', emoji: '✏️', group: 'desk', href: 'doc/Essentials/FFEdit/',
      tech: 'ファイル名の一括変換 / WPF',
      summary: '通し番号などでファイル名をまとめて変え、元にも戻せる。' },
    { id: 'Mailer', name: 'Mailer', emoji: '✉️', group: 'desk', href: 'doc/Essentials/Mailer/',
      tech: 'メール作成 / WPF',
      summary: '宛先・件名・本文を決めて、ブラウザのメール作成画面を開く。' },
    { id: 'DigitalClock', name: 'DigitalClock', emoji: '🕒', group: 'desk', href: 'doc/Essentials/DigitalClock/',
      tech: '時計 / WPF',
      summary: '時刻だけを出すシンプルな時計。半透明化と位置の記憶。' },
    { id: 'HeifToPng', name: 'HeifToPng', emoji: '🖼️', group: 'desk', href: 'doc/Essentials/HeifToPng/',
      tech: 'HEIF → PNG 一括変換 / WPF',
      summary: 'iPhone の HEIF 写真をフォルダごと PNG にする。GPS などは残さない。' },
    { id: 'Othello', name: 'Othello', emoji: '⚫', group: 'desk', href: 'doc/Essentials/Othello/',
      tech: 'オセロ / WPF',
      summary: 'オセロ（C# 版）。裏返す判定・COM の思考・一手戻す。' },
    { id: 'OthelloMfc', name: 'OthelloMfc', emoji: '⚪', group: 'desk', href: 'doc/Essentials/OthelloMfc/',
      tech: 'オセロ / C++ / MFC',
      summary: 'オセロ（C++/MFC 版）。MFC のクラス構成と対局の流れ。' },
  ];

  var byId = {};
  ITEMS.forEach(function (it) { byId[it.id] = it; });
  var groupById = {};
  GROUPS.forEach(function (g) { groupById[g.id] = g; });

  window.STABLE_CATALOG = {
    groups: GROUPS,
    items: ITEMS,
    item: function (id) { return byId[id]; },
    group: function (id) { return groupById[id]; },
  };
})();
