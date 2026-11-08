# stable

よく使うメジャーなツールを置いておく場所。
既存のリポジトリ（CS_Form / Python など）や、育ってきたプロジェクトを、
サブモジュールのようにここへぶら下げていく予定。

公開ページ: <https://koichi210.github.io/stable/>

## ページの構成

- **トップ（[index.html](index.html)）** — Three.js の魔法陣。中心から伸びた線の先の円が、それぞれのツール・ドキュメント。円を選ぶと説明ページへ移る。
- **説明ページ（`doc/.../<名前>/index.html`）** — しくみの3Dマップと、手順の再生バー・概要・詳しいページへのリンク。左のメニューから他の説明ページへも移れる。
- 共通部品は [portal/](portal/)
  - `catalog.js` … トップと左メニューに出す一覧（名前・絵文字・色・説明・リンク先）
  - `magic.js` … 魔法陣・結晶・回路の線・光の粒などの 3D 部品
  - `top.js` … トップの魔法陣
  - `toolpage.js` … 説明ページのフレームワーク（使い方はファイル冒頭のコメント）
  - `portal.css` … 共通スタイル

### ツールを足すとき

1. `portal/catalog.js` の `ITEMS` に1件足す（トップの円と左メニューに出る）
2. `doc/.../<名前>/index.html` に説明ページを作る（[doc/Essentials/Cheetos/index.html](doc/Essentials/Cheetos/index.html) が手本）

## 現在の中身

| フォルダ | 内容 |
|---|---|
| [doc/line-bot-mirai/](doc/line-bot-mirai/) | LINEボット「ミライ」の構成と、立ち上げ手順の3D図解ドキュメント（掲載しているURL・ID・キーはすべてダミー） |
| [doc/line-bot-s8-cub/](doc/line-bot-s8-cub/) | カブ隊用LINEボット「カブナビ8ちゃん」のドキュメント（メニュー階層・アーキテクチャ・ユースケース）。人名・IDはすべてダミー |
| [doc/FeasibilityStudy/](doc/FeasibilityStudy/) | 試作ゲームの仕組みと遊び方を Three.js の立体図で解説するページ集 |
| [doc/Essentials/](doc/Essentials/) | よく使うツール（[Essentials](Essentials/) サブモジュール）それぞれの説明ページと、使い方・データの流れ・内部設計の3D図解 |

魔法陣の図柄は、同心円・弧・目盛り・幾何学の記号を組み合わせたオリジナルです（既存作品の図案・文字は使っていません）。
