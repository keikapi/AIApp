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
   # ルートディレクトリ
   npm install

   # Lambda関数（OpenSearch Serverlessを使う場合）
   cd infrastructure/lambda/document-processor
   npm install
   cd ../../../
   ```

   - **重要**: `@aws-sdk/client-opensearchserverless`のスペルミスに注意してください。
   - 公式ドキュメント: [OpenSearchServerlessClient (AWS SDK v3)](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/opensearchserverless/)

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

## 重要なお知らせ

### リポジトリの再クローンについて（2024年3月）

セキュリティ上の理由により、リポジトリのコミット履歴を更新しました。以下の手順で最新のコードを取得してください：

1. 既存のローカルリポジトリを削除
```bash
rm -rf AIApp
```

2. リポジトリを新規にクローン
```bash
git clone https://github.com/keikapi/AIApp.git
cd AIApp
```

3. 依存関係のインストール
```bash
npm install
```

### セキュリティに関する注意事項

- 機密情報（APIキー、トークンなど）は`.env`ファイルに保存し、Gitにコミットしないでください
- `node_modules`ディレクトリは自動的に無視されます
- コミット前に`git status`で変更内容を確認してください

## 重要な依存パッケージ

- `@aws-sdk/client-opensearchserverless` (OpenSearch Serverless用SDK)
- `aws-cdk-lib/aws-opensearchserverless` (CDKでOpenSearch Serverlessリソース管理)

## よくあるエラーと対策

- **npm install時に @aws-sdk/client-opensearchserverless が見つからない**
  - パッケージ名が正しいか確認してください（`@aws-sdk/client-opensearchserverless`）。
  - ルートとLambdaディレクトリ両方で`npm install`を実行してください。
- **CDKデプロイ時にOpenSearch Serverless関連でエラー**
  - `aws-cdk-lib`や`@aws-cdk/aws-opensearchserverless`のバージョンが古い場合、最新にアップデートしてください。
  - 例: `npm install aws-cdk-lib@latest @aws-cdk/aws-opensearchserverless@latest`

## 参考リンク
- [AWS CDK公式ドキュメント（aws-cdk-lib）](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib-readme.html)
- [OpenSearchServerlessClient (AWS SDK v3)](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/opensearchserverless/)

