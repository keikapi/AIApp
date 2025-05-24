#!/bin/bash
set -e

# ECRリポジトリのURIを取得
echo "ECRリポジトリURIを取得中..."
repositoryUri=$(aws ecr describe-repositories --repository-names ai-chatbot --query 'repositories[0].repositoryUri' --output text)

echo "ECRにログイン中..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin "$repositoryUri"

echo "Dockerイメージをビルド中..."
docker build -t ai-chatbot .

echo "イメージにタグ付け中..."
docker tag ai-chatbot:latest "$repositoryUri:latest"

echo "イメージをECRにプッシュ中..."
docker push "$repositoryUri:latest"

echo "完了" 