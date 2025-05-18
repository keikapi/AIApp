# デプロイメントガイド

## 前提条件

- Node.js 18.x以上
- AWS CLI 2.x以上
- Docker Desktop
- AWS CDK 2.x以上
- PowerShell 7.x以上
- GitHubリポジトリ（AIApp）
- GitHub Personal Access Token（repo, admin:repo_hook権限）

## 環境設定

1. AWS認証情報の設定
```powershell
aws configure
```

2. 環境変数の設定
```powershell
$env:CDK_DEFAULT_ACCOUNT="your-aws-account-id"
$env:CDK_DEFAULT_REGION="us-east-1"
```

3. GitHubトークンの設定
```powershell
# AWS Secrets ManagerにGitHubトークンを保存
aws secretsmanager create-secret \
    --name github-token \
    --description "GitHub Personal Access Token for CodePipeline" \
    --secret-string "{\"token\":\"your-github-token\"}"
```

## デプロイメント手順

### 1. 初回デプロイメント

1. 依存関係のインストール
```powershell
cd infrastructure
npm install
```

2. CDKブートストラップ
```powershell
cdk bootstrap aws://$env:CDK_DEFAULT_ACCOUNT/$env:CDK_DEFAULT_REGION
```

3. 全スタックのデプロイ
```powershell
cdk deploy --all
```

これにより、以下のリソースが作成されます：
- 基本インフラ（VPC、サブネット等）
- ストレージ（S3、DynamoDB）
- 認証（Cognito）
- AI検索（OpenSearch）
- アプリケーション（ECS、ALB）
- CI/CDパイプライン（CodePipeline、CodeBuild）

### 2. 継続的デプロイメント

初回デプロイメント後は、以下の手順で自動デプロイメントが行われます：

1. コードの変更をGitHubリポジトリのメインブランチにプッシュ
2. CodePipelineが自動的にデプロイメントを開始
   - ソースコードの取得（GitHub）
   - アプリケーションのビルド（CodeBuild）
   - CDKスタックのデプロイ（CodeBuild）
   - Dockerイメージのビルドとプッシュ（CodeBuild）

## デプロイメントの確認

1. CodePipelineの状態確認
```powershell
aws codepipeline get-pipeline-state --name AIChatbotPipeline
```

2. ECSサービスの状態確認
```powershell
aws ecs describe-services --cluster AIChatbotCluster --services AIChatbotService
```

3. ロードバランサーのDNS名の取得
```powershell
aws cloudformation describe-stacks --stack-name AIChatbotAppStack --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' --output text
```

## トラブルシューティング

### CodePipelineのデプロイが失敗する場合

1. パイプラインの実行履歴を確認
```powershell
aws codepipeline list-pipeline-executions --pipeline-name AIChatbotPipeline
```

2. CodeBuildのログを確認
```powershell
aws logs get-log-events --log-group-name /aws/codebuild/AIChatbotBuildProject --log-stream-name <build-id>
```

3. GitHub接続の確認
```powershell
# GitHubトークンの有効性を確認
aws secretsmanager get-secret-value --secret-id github-token
```

### ECSサービスのデプロイが失敗する場合

1. タスク定義の確認
```powershell
aws ecs describe-task-definition --task-definition AIChatbotTaskDef
```

2. コンテナログの確認
```powershell
aws logs get-log-events --log-group-name /ecs/AIChatbotService --log-stream-name <task-id>
```

3. セキュリティグループの確認
```powershell
aws ec2 describe-security-groups --group-ids <security-group-id>
```

### イメージのプッシュが失敗する場合

1. ECRリポジトリの確認
```powershell
aws ecr describe-repositories --repository-names ai-chatbot
```

2. ECRログインの確認
```powershell
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $repositoryUri
```

## クリーンアップ

1. パイプラインスタックの削除
```powershell
cd infrastructure
cdk destroy AIChatbotPipelineStack
```

2. アプリケーションスタックの削除
```powershell
cdk destroy AIChatbotAppStack
```

3. その他のスタックの削除
```powershell
cdk destroy --all
```

4. ECRリポジトリの削除
```powershell
aws ecr delete-repository --repository-name ai-chatbot --force
``` 