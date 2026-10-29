// scripts/build-tutorial-data.js が rich-menu-config.js から自動生成したファイル。直接は編集しない。
window.CUB_MENUS = {
 "main": {
  "name": "s8-cub メインメニュー",
  "rowHeight": null,
  "layout": [
   [
    {
     "label": "その他",
     "color": "#EDE7F6",
     "kind": "switch",
     "target": "other-main"
    }
   ]
  ]
 },
 "other-main": {
  "name": "s8-cub その他サブメニュー(一般用)",
  "rowHeight": null,
  "layout": [
   [
    {
     "label": "🆔 マイID",
     "color": "#EDE7F6",
     "kind": "message",
     "text": "マイID"
    },
    {
     "label": "ヘルプ",
     "color": "#D1C4E9",
     "kind": "message",
     "text": "ヘルプ"
    },
    {
     "label": "◀ 戻る",
     "color": "#CFD8DC",
     "kind": "switch",
     "target": "main"
    }
   ]
  ]
 },
 "main-admin": {
  "name": "s8-cub メインメニュー(管理者用)",
  "rowHeight": null,
  "layout": [
   [
    {
     "label": "🔧 管理者用",
     "color": "#B0BEC5",
     "kind": "switch",
     "target": "admin"
    },
    {
     "label": "その他",
     "color": "#EDE7F6",
     "kind": "switch",
     "target": "other"
    }
   ]
  ]
 },
 "parents": {
  "name": "s8-cub 保護者連絡サブメニュー",
  "rowHeight": null,
  "layout": [
   [
    {
     "label": "アナウンス追加",
     "color": "#F48FB1",
     "kind": "liff",
     "view": ""
    },
    {
     "label": "アナウンス削除",
     "color": "#F06292",
     "kind": "liff",
     "view": "delete"
    },
    {
     "label": "アナウンス一覧",
     "color": "#FCE4EC",
     "kind": "message",
     "text": "アナウンス一覧"
    }
   ],
   [
    {
     "label": "案内文プレビュー",
     "color": "#DCEDC8",
     "kind": "liff",
     "view": "preview"
    },
    {
     "label": "案内文設定",
     "color": "#FFF9C4",
     "kind": "switch",
     "target": "notice"
    },
    {
     "label": "◀ 戻る",
     "color": "#CFD8DC",
     "kind": "switch",
     "target": "admin"
    }
   ]
  ]
 },
 "other": {
  "name": "s8-cub その他サブメニュー",
  "rowHeight": null,
  "layout": [
   [
    {
     "label": "🆔 マイID",
     "color": "#EDE7F6",
     "kind": "message",
     "text": "マイID"
    },
    {
     "label": "ヘルプ",
     "color": "#D1C4E9",
     "kind": "message",
     "text": "ヘルプ"
    },
    {
     "label": "◀ 戻る",
     "color": "#CFD8DC",
     "kind": "switch",
     "target": "main-admin"
    }
   ]
  ]
 },
 "admin": {
  "name": "s8-cub 管理者サブメニュー",
  "rowHeight": null,
  "layout": [
   [
    {
     "label": "📣 保護者連絡",
     "color": "#F8BBD0",
     "kind": "switch",
     "target": "parents"
    },
    {
     "label": "👑 管理者編集",
     "color": "#FFE0B2",
     "kind": "switch",
     "target": "admins"
    },
    {
     "label": "👥 グループ編集",
     "color": "#B3E5FC",
     "kind": "switch",
     "target": "groups"
    }
   ],
   [
    {
     "label": "📄 活動予定",
     "color": "#DCEDC8",
     "kind": "switch",
     "target": "events"
    },
    {
     "label": "◀ 戻る",
     "color": "#CFD8DC",
     "kind": "switch",
     "target": "main-admin"
    }
   ]
  ]
 },
 "events": {
  "name": "s8-cub 活動予定サブメニュー",
  "rowHeight": null,
  "layout": [
   [
    {
     "label": "カブ8取り込み",
     "color": "#DCEDC8",
     "kind": "message",
     "text": "カブ8取り込み"
    },
    {
     "label": "予定削除",
     "color": "#AED581",
     "kind": "liff",
     "view": "events-delete"
    }
   ],
   [
    {
     "label": "予定一覧",
     "color": "#C8E6C9",
     "kind": "message",
     "text": "予定一覧"
    },
    {
     "label": "予定表",
     "color": "#A5D6A7",
     "kind": "liff",
     "view": "events-table"
    },
    {
     "label": "◀ 戻る",
     "color": "#CFD8DC",
     "kind": "switch",
     "target": "admin"
    }
   ]
  ]
 },
 "notice": {
  "name": "s8-cub 案内文設定サブメニュー",
  "rowHeight": null,
  "layout": [
   [
    {
     "label": "ヘッダ設定",
     "color": "#FFF9C4",
     "kind": "liff",
     "view": "header"
    },
    {
     "label": "フッタ設定",
     "color": "#FFF59D",
     "kind": "liff",
     "view": "footer"
    }
   ],
   [
    {
     "label": "テンプレ設定",
     "color": "#FFE082",
     "kind": "liff",
     "view": "template"
    },
    {
     "label": "◀ 戻る",
     "color": "#CFD8DC",
     "kind": "switch",
     "target": "parents"
    }
   ]
  ]
 },
 "admins": {
  "name": "s8-cub 管理者管理サブメニュー",
  "rowHeight": null,
  "layout": [
   [
    {
     "label": "管理者追加",
     "color": "#FFCC80",
     "kind": "liff",
     "view": "admin-add"
    },
    {
     "label": "管理者削除",
     "color": "#FFB74D",
     "kind": "liff",
     "view": "admin-delete"
    }
   ],
   [
    {
     "label": "管理者一覧",
     "color": "#FFE0B2",
     "kind": "message",
     "text": "管理者一覧"
    },
    {
     "label": "◀ 戻る",
     "color": "#CFD8DC",
     "kind": "switch",
     "target": "admin"
    }
   ]
  ]
 },
 "groups": {
  "name": "s8-cub グループ編集サブメニュー",
  "rowHeight": null,
  "layout": [
   [
    {
     "label": "グループ追加",
     "color": "#81D4FA",
     "kind": "message",
     "text": "グループ追加"
    },
    {
     "label": "グループ削除",
     "color": "#4FC3F7",
     "kind": "liff",
     "view": "group-delete"
    }
   ],
   [
    {
     "label": "グループ一覧",
     "color": "#B3E5FC",
     "kind": "message",
     "text": "グループ一覧"
    },
    {
     "label": "◀ 戻る",
     "color": "#CFD8DC",
     "kind": "switch",
     "target": "admin"
    }
   ]
  ]
 }
};
