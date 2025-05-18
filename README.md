# AI Chatbot

AWSの各種AIサービスを利用したRAG（Retrieval-Augmented Generation）機能を持つチャットボットアプリケーションです。

## 主な機能

- ユーザー認証（AWS Cognito）
- ドキュメント管理（Amazon S3）
- チャットボット（Amazon Bedrock）
- ドキュメント検索（Amazon OpenSearch Serverless）
- コンテナ化されたバックエンド（AWS ECS）
- CI/CDパイプライン（AWS CodePipeline）

## 技術スタック

- バックエンド: Node.js + TypeScript + Express.js
- インフラ: AWS CDK + AWS ECS + AWS Lambda
- AI: Amazon Bedrock (Claude 3 Sonnet)
- データベース: Amazon DynamoDB
- 検索: Amazon OpenSearch Serverless
- CI/CD: GitHub + AWS CodePipeline

## 開発環境のセットアップ

1. 前提条件
   - Node.js 18.x以上
   - AWS CLI 2.x以上
   - Docker Desktop
   - AWS CDK 2.x以上
   - PowerShell 7.x以上

2. 環境設定
   ```powershell
   # AWS認証情報の設定
   aws configure

   # 環境変数の設定
   $env:CDK_DEFAULT_ACCOUNT="your-aws-account-id"
   $env:CDK_DEFAULT_REGION="us-east-1"

   # GitHubトークンの設定
   aws secretsmanager create-secret \
       --name github-token \
       --description "GitHub Personal Access Token for CodePipeline" \
       --secret-string "{\"token\":\"your-github-token\"}"
   ```

3. 依存関係のインストール
   ```powershell
   npm install
   cd infrastructure
   npm install
   ```

4. インフラストラクチャのデプロイ
   ```powershell
   cdk bootstrap aws://$env:CDK_DEFAULT_ACCOUNT/$env:CDK_DEFAULT_REGION
   cdk deploy --all
   ```

詳細なデプロイメント手順は [デプロイメントガイド](docs/deployment/deployment-guide.md) を参照してください。

## プロジェクト構造

```
AIApp/
├── .github/                    # GitHub Actions設定
├── docs/                       # プロジェクトドキュメント
├── infrastructure/            # インフラストラクチャコード
├── src/                       # アプリケーションソースコード
├── scripts/                   # ビルド・デプロイスクリプト
├── Dockerfile                # コンテナイメージ定義
└── package.json             # プロジェクト依存関係
```

詳細なプロジェクト構造は [プロジェクト概要](docs/overview.md) を参照してください。

## ライセンス

MIT License

## システム構成

