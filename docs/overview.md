# 1.1 アプリケーション概要

## 概要

本アプリケーションは、AWSの各種AIサービスを利用したRAG（Retrieval-Augmented Generation）機能を持つチャットボットです。ユーザーがアップロードしたドキュメントを基に、AIが文脈を理解し、適切な回答を生成します。

## 主な機能

### 1. ユーザー管理
- AWS Cognitoによる認証（メール/パスワード）
- ユーザーごとの応答スタイル設定（フォーマル/カジュアル）
- 会話履歴の1年間保持

### 2. ドキュメント管理
- 対応形式：PDF、テキスト、Word、Excel
- 個別アップロード方式
- アップロードユーザーのみが閲覧可能
- S3署名付きURLによる15分間の一時アクセス

### 3. チャットボット機能
- Amazon Bedrock（Claude 3 Sonnet）による自然な会話
- OpenSearch Serverlessによる関連ドキュメントの検索
- ユーザーごとの応答スタイルカスタマイズ
- 複数ユーザーの同時利用対応

## 利用規模

- 同時利用ユーザー：3-4人
- 1日あたりのチャット数：約15件/ユーザー
- ドキュメント数：ユーザーごとに管理

## 技術スタック

### バックエンド
- Node.js + TypeScript
- Express.js
- AWS SDK v3

### インフラストラクチャ
- AWS ECS（コンテナ化）
- Amazon Cognito（認証）
- Amazon S3（ドキュメント保存）
- Amazon OpenSearch Serverless（検索）
- Amazon Bedrock（AI）
- AWS Lambda（ドキュメント処理）

### 開発・運用
- AWS CodePipeline（CI/CD）
  - GitHub（ソースコード管理）
  - AWS CodeBuild（ビルド・デプロイ）
  - AWS ECR（コンテナイメージ管理）
- Amazon CloudWatch（監視）
- AWS Systems Manager Parameter Store（設定管理）

## セキュリティ

- AWS Cognitoによる認証
- S3署名付きURLによる一時的なドキュメントアクセス
- ユーザーごとのドキュメントアクセス制御
- CloudWatchによる監査ログ

## 監視・アラート

- CPU使用率（閾値：80%）
- メモリ使用率（閾値：80%）
- エラーレート
- レスポンスタイム
- 通知先：keigo.0390@gmail.com

## 今後の拡張性

1. ドキュメントの自動分類
2. 会話履歴の分析機能
3. カスタムAIモデルの導入
4. 多言語対応
5. モバイルアプリ対応

# AI Chatbot プロジェクト概要

## プロジェクト構造

```
AIApp/
├── .github/                    # GitHub Actions設定
│   └── workflows/             # CI/CDパイプライン定義
├── docs/                       # プロジェクトドキュメント
│   ├── architecture/          # アーキテクチャ図
│   │   ├── system-overview.png    # システム全体図
│   │   └── deployment-flow.png    # デプロイメントフロー図
│   ├── api/                   # API仕様書
│   │   └── api-spec.md           # API仕様詳細
│   └── deployment/           # デプロイメント手順
│       └── deployment-guide.md   # デプロイメントガイド
├── infrastructure/            # インフラストラクチャコード
│   ├── bin/                  # CDKアプリケーションエントリーポイント
│   │   └── infrastructure.ts    # CDKアプリケーション定義
│   ├── lib/                  # CDKスタック定義
│   │   ├── stacks/              # 各スタックの実装
│   │   │   ├── base-stack.ts       # 基本インフラ（VPC等）
│   │   │   ├── storage-stack.ts    # ストレージ（S3, DynamoDB）
│   │   │   ├── auth-stack.ts       # 認証（Cognito）
│   │   │   ├── ai-search-stack.ts  # AI検索（OpenSearch）
│   │   │   └── app-stack.ts        # アプリケーション（ECS, ALB）
│   │   └── constructs/           # 再利用可能なCDKコンストラクト
│   └── lambda/              # Lambda関数コード
│       └── document-processor/   # ドキュメント処理Lambda
├── src/                      # アプリケーションソースコード
│   ├── config/              # 設定ファイル
│   │   └── environment.ts      # 環境変数設定
│   ├── services/           # ビジネスロジック
│   │   ├── auth/              # 認証関連サービス
│   │   ├── chat/              # チャット関連サービス
│   │   └── document/          # ドキュメント処理サービス
│   └── types/              # 型定義
│       └── index.ts           # 共通型定義
├── scripts/                 # ビルド・デプロイスクリプト
│   ├── build.ps1              # ビルドスクリプト
│   └── push-image.ps1         # ECRイメージプッシュスクリプト
├── .gitignore               # Git除外設定
├── Dockerfile               # コンテナイメージ定義
├── package.json            # プロジェクト依存関係
├── README.md              # プロジェクト概要
└── tsconfig.json          # TypeScript設定
```

## コンポーネント説明

### インフラストラクチャ（infrastructure/）

AWS CDKを使用してインフラストラクチャをコードとして管理します。

- **BaseStack**: VPC、サブネット、セキュリティグループ等の基本インフラ
- **StorageStack**: S3バケット（ドキュメント保存）とDynamoDBテーブル（ユーザー設定、チャット履歴）
- **AuthStack**: Cognitoユーザープールとクライアント
- **AiSearchStack**: OpenSearch Serverlessコレクションとセキュリティポリシー
- **AppStack**: ECSクラスター、Fargateサービス、Application Load Balancer

### アプリケーション（src/）

TypeScriptで実装されたバックエンドアプリケーション。

- **config/**: 環境変数や設定値の管理
- **services/**: ビジネスロジックの実装
  - auth: 認証・認可処理
  - chat: チャット機能
  - document: ドキュメント処理
- **types/**: 共通の型定義

### Lambda関数（infrastructure/lambda/）

サーバーレス関数によるドキュメント処理。

- **document-processor**: ドキュメントのアップロード、処理、インデックス作成

### デプロイメント（scripts/）

ビルドとデプロイを自動化するスクリプト。

- **build.ps1**: アプリケーションのビルド
- **push-image.ps1**: ECRへのイメージプッシュ

## デプロイメントフロー

1. インフラストラクチャのデプロイ（初回のみ）
   ```bash
   cd infrastructure
   cdk deploy --all
   ```

2. 以降のデプロイメントは自動化
   - メインブランチへのプッシュで自動的にデプロイメントが開始
   - CodePipelineが以下のステップを実行：
     1. ソースコードの取得（GitHub）
     2. アプリケーションのビルド（CodeBuild）
     3. CDKスタックのデプロイ（CodeBuild）
     4. Dockerイメージのビルドとプッシュ（CodeBuild）

詳細なデプロイメント手順は `docs/deployment/deployment-guide.md` を参照してください。 