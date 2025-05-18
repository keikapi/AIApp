# API仕様書

## 認証

### ユーザー登録
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

### ログイン
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

## ドキュメント管理

### ドキュメントアップロード
```http
POST /documents/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <file>
```

### ドキュメント一覧取得
```http
GET /documents
Authorization: Bearer <token>
```

### ドキュメント削除
```http
DELETE /documents/{documentId}
Authorization: Bearer <token>
```

## チャット

### チャットセッション開始
```http
POST /chat/sessions
Content-Type: application/json
Authorization: Bearer <token>

{
  "documentId": "doc123",
  "context": "質問の文脈"
}
```

### メッセージ送信
```http
POST /chat/sessions/{sessionId}/messages
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "質問内容",
  "type": "user"
}
```

### チャット履歴取得
```http
GET /chat/sessions/{sessionId}/messages
Authorization: Bearer <token>
```

## エラーレスポンス

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {
      "field": "エラーが発生したフィールド",
      "reason": "エラーの詳細な理由"
    }
  }
}
```

## ステータスコード

- 200: 成功
- 201: 作成成功
- 400: リクエストエラー
- 401: 認証エラー
- 403: 権限エラー
- 404: リソース未検出
- 500: サーバーエラー 