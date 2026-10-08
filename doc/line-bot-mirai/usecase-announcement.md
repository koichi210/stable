# ユースケース: グループチャットへアナウンスを送るとき

「管理者が事前にアナウンスを予約 → 指定した日時になったらcronが検知 →
宛先グループに自動で告知が届く」という一連の流れを1本の図にまとめたもの。

登場人物・仕組みの詳細は [ARCHITECTURE.md](./ARCHITECTURE.md) を参照。

```mermaid
sequenceDiagram
    participant Admin as 管理者
    participant L as LINE Platform
    participant V as Vercel(api/index.js)
    participant R as Upstash Redis
    participant C as cron-job.org
    participant G as 宛先グループ(みんなが見る画面)

    Note over Admin,G: 事前準備(グループごとに最初の1回だけ)
    Admin->>L: (グループ内で)「このグループに登録」
    L->>V: Webhook POST /webhook
    V->>L: getGroupSummaryでグループ名を取得
    V->>R: 送信先グループとして保存(groupId→グループ名)
    V->>L: replyMessage(登録したよ)
    L-->>Admin: 完了通知

    Note over Admin,G: ①アナウンスを予約登録する
    Admin->>L: 「アナウンス登録 サークルA 2026/10/05 19:00 次回の開催案内です!」
    L->>V: Webhook POST /webhook
    V->>V: 管理者チェック + 日時チェック(2分以上先か)
    V->>R: 宛先グループ・日時・文言を保存
    V->>L: replyMessage(登録したよ)
    L-->>Admin: 完了通知

    Note over C,V: ②指定した日時になるまで待つ
    loop 1分おき
        C->>V: GET /cron/reminder?secret=...
        V->>R: 今の日時と一致するアナウンスを検索
        R-->>V: (まだ該当なし)
    end

    Note over C,G: ③予約した日時になった瞬間
    C->>V: GET /cron/reminder?secret=...
    V->>R: 今の日時と一致するアナウンスを検索
    R-->>V: 該当1件ヒット!
    V->>L: pushMessage(宛先グループへ)
    L-->>G: 「次回の開催案内です!」が届く
    V->>R: 送信できた分を削除(二度と送らないように)
```

## ポイント

- 「このグループに登録」は**管理者だけ**が実行できる(グループの他メンバーが誤って/勝手に登録できないよう制限)。
- アナウンス登録時、**今から2分未満の日時は登録できない**([ARCHITECTURE.md](./ARCHITECTURE.md)の補足参照)。cronのチェックタイミングを逃して永久に送信されないまま残ってしまうのを防ぐため。
- 実際に「時間になったかどうか」を判断してるのはcron-job.orgではなく**Vercel側**。cron-job.orgは1分おきに叩くだけの目覚まし役。
- 送信に成功した分だけ自動で削除される。失敗した場合は次の1分おきのチェックでまた狙われる(=取りこぼしに強い)。
