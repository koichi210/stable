# 構成図(アーキテクチャ)

line-bot-miraiの全体構成と、主要な処理フローをmermaidで図示したもの。
コード変更で構成が変わったら、このファイルも合わせて更新する。

## 全体構成図

```mermaid
flowchart TB
    User[👤 ユーザー] <-->|メッセージ送信 / 通知表示| LINE[LINE Platform]
    LINE <-->|Webhook POST /webhook / reply,push| Vercel[Vercel<br/>api/index.js]

    Vercel <-->|ユーザー設定/リマインド/メモ/<br/>アナウンス等の保存| Redis[(Upstash Redis)]
    Vercel -->|住所→緯度経度| Nominatim[OpenStreetMap<br/>Nominatim]
    Vercel -->|天気予報取得| OpenMeteo[Open-Meteo API]
    Vercel -->|予定取得| GCal[Google Calendar API]

    CronJob[cron-job.org<br/>1分おき] -->|GET /cron/reminder?secret=...| Vercel

    Admin[🔧 管理者] -->|git push| GitHub[GitHub<br/>line-bot-mirai]
    GitHub -->|連携: 自動ビルド&デプロイ| Vercel
```

## ①ユーザーが天気を確認するとき

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant L as LINE Platform
    participant V as Vercel(api/index.js)
    participant N as Nominatim(ジオコーディング)
    participant O as Open-Meteo(天気予報)

    U->>L: 「天気 〇〇市」
    L->>V: Webhook POST /webhook
    V->>N: 住所→緯度経度
    N-->>V: lat/lon
    V->>O: 緯度経度→天気予報
    O-->>V: 天気データ
    V->>L: replyMessage
    L-->>U: 天気を表示
```

## ②ユーザーが地域設定するとき

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant L as LINE Platform
    participant V as Vercel(api/index.js)
    participant R as Upstash Redis

    U->>L: 「地域登録 〇〇県△△市」
    L->>V: Webhook POST /webhook
    V->>R: hset weather:address[userId]=住所
    R-->>V: OK
    V->>L: replyMessage(登録したよ)
    L-->>U: 完了通知
    Note over U,R: 以後「天気」だけ送ると<br/>ここで登録した住所が自動で使われる
```

## ③ユーザーがリマインダ設定するとき

登録と、実際に時間になって届くところは別フロー。

### 登録

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant L as LINE Platform
    participant V as Vercel(api/index.js)
    participant R as Upstash Redis

    U->>L: 「リマインド登録 薬 13:00」<br/>(またはLIFFフォームから)
    L->>V: Webhook POST /webhook<br/>(LIFFの場合はPOST /liff/reminder)
    V->>V: isReminderAllowedで許可チェック
    V->>R: 時刻・文言を保存
    R-->>V: OK
    V->>L: replyMessage(登録したよ)
    L-->>U: 完了通知
```

### 送信(cronが駆動)

```mermaid
sequenceDiagram
    participant C as cron-job.org
    participant V as Vercel(api/index.js)
    participant R as Upstash Redis
    participant L as LINE Platform
    participant U as ユーザー

    loop 1分おき
        C->>V: GET /cron/reminder?secret=...
        V->>R: 今の時刻と一致する<br/>リマインドを検索
        R-->>V: 該当リマインド一覧
        alt 該当あり
            V->>L: pushMessage
            L-->>U: ⏰通知
            V->>R: (1回のみ指定なら)削除
        end
    end
```

## ④管理者がツールを更新するとき

```mermaid
sequenceDiagram
    participant A as 管理者
    participant G as GitHub
    participant V as Vercel
    participant L as LINE Platform
    participant U as ユーザー

    A->>G: git push (コード修正)
    G->>V: Webhook通知(GitHub連携)
    V->>V: ビルド&デプロイ
    Note over V: 新しいapi/index.jsが本番に反映
    U->>L: 通常通りメッセージ送信
    L->>V: Webhook
    Note over V: 更新済みのロジックで応答
    V->>L: replyMessage
    L-->>U: 更新後の挙動
```

## 補足

- 天気/地域設定/リマインダー登録は、基本的に**「LINE→Vercel→Redis(必要なら外部API)→LINE」**という同じ形の処理。
- リマインダー・アナウンスの**送信タイミングだけ**、外部のcron-job.orgが`/cron/reminder`を1分おきに叩くことで駆動している(Vercel Hobbyプラン自前のCronは1日1回までのため代替手段として採用)。
- デプロイはGitHub連携なので、`git push`した瞬間にVercelが自動でビルド・反映する。
