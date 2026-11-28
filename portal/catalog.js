/*
 * stable ポータルのカタログ（トップの魔法陣と、各説明ページの左メニューが読む共通データ）。
 *
 * ツールを足すとき:
 *   1. ITEMS に1件足す（href はリポジトリ直下からの相対パス。説明ページのフォルダ）
 *   2. そのフォルダに index.html（説明ページ）を作る。doc/Essentials/Cheetos/index.html が手本
 * 並び順は、グループごとに魔法陣のどの位置に出るかに効く（グループ内で左回り）。
 *
 * トップは魔法陣が3つ。上の真ん中＝Windows ツール（group: desk）、左下＝常駐・Web と LINE ボット（side / line）、
 * 右下＝中心に FeasibilityStudy（center: true）を置き、周りに GAMES（試作ゲーム）をジャンル（GENRES）ごとに並べる。
 * ゲームを足すときは GAMES に1件（href は説明ページ doc/FeasibilityStudy/<フォルダ>/ = index.html）。
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
    { id: 'FeasibilityStudy', name: 'FeasibilityStudy', emoji: '🔭', group: 'fs', href: 'doc/FeasibilityStudy/', center: true,
      tech: '試作ゲーム10本 / Three.js 図解・遊び方',
      summary: '試作ゲームの置き場。ゲームごとの仕組み図解と遊び方チュートリアル。' },

    // ---- 常駐・Web ----
    { id: 'SecretaryGadget', name: 'SecretaryGadget', emoji: '🗂️', group: 'side', href: 'doc/Essentials/SecretaryGadget/',
      tech: '秘書さんガジェット / WPF 常駐',
      summary: 'Outlook・Teams の新着やタイマーを、秘書さんが吹き出しで知らせる。' },
    { id: 'ClaudeOffice', name: 'ClaudeOffice', emoji: '🏰', group: 'side', href: 'doc/Essentials/ClaudeOffice/',
      tech: '箱庭ダッシュボード / Node + Three.js',
      summary: 'Claude Code の会話を、3Dの部屋の住人として見渡すダッシュボード。' },
    { id: 'MagicLauncher', name: 'MagicLauncher', emoji: '🔮', group: 'side', href: 'doc/Essentials/MagicLauncher/',
      tech: '魔法陣ランチャー / Node + Three.js',
      summary: 'よく開くフォルダ・URL を魔法陣の上に並べて、クリックで開く。' },
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
    { id: 'FiddleAroundString', name: 'FiddleAroundString', emoji: '🧰', group: 'desk', href: 'doc/Essentials/FiddleAroundString/',
      tech: '文字の加工・抜き出し / WPF',
      summary: '文字の削除・全角→半角・重複行の削除と、ファイルや Web ページからの行の抜き出しを4つのタブで。' },
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

  // 右下の魔法陣（FeasibilityStudy）の周りに並べる試作ゲーム。ジャンルは doc/FeasibilityStudy/index.html の手順と同じ分け方
  var GENRES = [
    { id: 'card', name: 'カードで戦う' },
    { id: 'board', name: '盤の上で戦う' },
    { id: 'hex', name: '六角形の地図' },
    { id: 'action', name: '動かして撃ち合う' },
    { id: 'travel', name: '旅する・育てる' },
  ];
  var FS = 'doc/FeasibilityStudy/';
  var GAMES = [
    { id: 'ArcanaExplosion', name: 'ArcanaExplosion', emoji: '🃏', genre: 'card', href: FS + 'ArcanaExplosion/',
      tech: 'カードバトル / Python + Flask + HTML/JS',
      summary: 'トランプ52枚がキャラクターとアイテムに化けるカードバトル。仕組み図解・設計図・遊び方がある。' },
    { id: 'TrumpTriBattle', name: 'トランプ三戦場バトル', emoji: '♠️', genre: 'card', href: FS + 'TrumpTriBattle/',
      tech: 'トランプ対戦 / HTML/JS（1台版）+ Python・Flask（CPU/LAN版）',
      summary: '3つの戦場に同時に1枚ずつ出して、取った枚数で競うトランプ対戦。' },
    { id: 'haken', name: '覇権戦国', emoji: '⚔️', genre: 'board', href: FS + '覇権戦国/',
      tech: '駒の戦国バトル / TypeScript + Vite + Node(Express/ws)',
      summary: '兵数を持った駒で戦う「将棋版」の戦国バトル（開発初期）。' },
    { id: 'shubi', name: '戦国守備戦', emoji: '🗾', genre: 'board', href: FS + '戦国守備戦/',
      tech: '戦略ゲーム / TypeScript + Phaser 3 + Vite',
      summary: '県ごとの軍で日本を取り合い、出撃するとじゃんけん合戦で決着する戦略ゲーム。' },
    { id: 'kingdom-game', name: '陣形と城壁（仮）', emoji: '🏯', genre: 'board', href: FS + 'kingdom-game/',
      tech: '陣形バトル / 素の HTML/CSS/JavaScript',
      summary: '兵種の三すくみ×地形で戦う陣形バトルに、攻城戦と国盗りが付く。' },
    { id: 'slime-nation', name: 'スライム建国記', emoji: '🟢', genre: 'hex', href: FS + 'slime-nation/',
      tech: '国造りシミュレーション / HTML + CSS + JavaScript（サーバー不要）',
      summary: '六角形の地図を、交渉と制圧で塗り替える国造りシミュレーション。' },
    { id: 'pacific', name: '太平洋海戦', emoji: '⚓', genre: 'hex', href: FS + '太平洋海戦/',
      tech: 'ターン制ストラテジー / TypeScript + Phaser + Vite',
      summary: '六角形のマスで海軍・空軍・陸軍を動かし、相手の王都を落とすターン制ストラテジー。' },
    { id: 'BrawlArena', name: 'BrawlArena', emoji: '💥', genre: 'action', href: FS + 'BrawlArena/',
      tech: 'アリーナバトル / TypeScript + Phaser 3 + Vite',
      summary: '見下ろし視点で撃ち合う1対1のアリーナバトル。' },
    { id: 'meisan', name: '名産鉄道', emoji: '🚃', genre: 'travel', href: FS + '名産鉄道/',
      tech: 'すごろく / TypeScript + Phaser 3 + Vite（LAN は Node + ws）',
      summary: '47都道府県をサイコロで旅して名産品を集めるすごろくに、兵隊バトルが付く。' },
    { id: 'sodatemon', name: 'そだてもん', emoji: '🌱', genre: 'travel', href: FS + 'sodatemon/',
      tech: '学習ゲーム / HTML 1ファイル + JavaScript',
      summary: '勉強クイズに答えてキャラを育て、日本統一を目指す学習ゲーム。' },
  ];

  // 試作ゲームも説明ページ(ToolPage)の id で引けるように、グループは「試作ゲーム」にする
  GAMES.forEach(function (g) { g.group = 'fs'; });

  var byId = {};
  ITEMS.concat(GAMES).forEach(function (it) { byId[it.id] = it; });
  var groupById = {};
  GROUPS.forEach(function (g) { groupById[g.id] = g; });

  window.STABLE_CATALOG = {
    groups: GROUPS,
    items: ITEMS,
    genres: GENRES,
    games: GAMES,
    item: function (id) { return byId[id]; },
    group: function (id) { return groupById[id]; },
  };
})();
