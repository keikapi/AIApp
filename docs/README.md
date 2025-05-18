# AI Chatbot 設計書・環境定義書

## 目次

### 1. 概要
- [1.1 アプリケーション概要](./overview.md)
- [1.2 システム構成図](./system-architecture.md)
- [1.3 技術スタック](./tech-stack.md)

### 2. 機能設計
- [2.1 ユーザー認証・管理](./features/auth.md)
- [2.2 チャットボット機能](./features/chatbot.md)
- [2.3 ドキュメント管理](./features/document-management.md)

### 3. インフラ設計
- [3.1 AWSリソース構成](./infrastructure/aws-resources.md)
- [3.2 ECS設定](./infrastructure/ecs.md)
- [3.3 OpenSearch Serverless設定](./infrastructure/opensearch.md)
- [3.4 監視・アラート設定](./infrastructure/monitoring.md)

### 4. 開発・運用
- [4.1 開発環境構築手順](./development/setup.md)
- [4.2 CI/CDパイプライン](./development/cicd.md)
- [4.3 デプロイ手順](./development/deployment.md)
- [4.4 運用・監視手順](./development/operations.md)

### 5. 設定ファイル
- [5.1 環境変数](./config/env.md)
- [5.2 アラート閾値](./config/alerts.md)
- [5.3 アプリケーション設定](./config/app.md)

### 6. セキュリティ
- [6.1 認証・認可](./security/auth.md)
- [6.2 データアクセス制御](./security/access-control.md)
- [6.3 監査ログ](./security/audit-logs.md)

---

## 更新履歴

| 日付       | バージョン | 更新内容                     | 更新者 |
|------------|------------|------------------------------|--------|
| 2024-05-17 | 0.1.0      | 初版作成                     | AI     |

---

## 注意事項

- 本ドキュメントは随時更新されます。最新の情報はGitHubリポジトリを参照してください。
- 機密情報（APIキー、パスワード等）は含まれていません。実際の値は環境変数またはAWS Systems Manager Parameter Storeで管理します。 