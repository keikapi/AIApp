# ECRリポジトリのURIを取得
$repositoryUri = aws ecr describe-repositories --repository-names ai-chatbot --query 'repositories[0].repositoryUri' --output text

# ECRにログイン
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $repositoryUri

# イメージのビルド
docker build -t ai-chatbot .

# イメージにタグを付ける
docker tag ai-chatbot:latest $repositoryUri:latest

# イメージをプッシュ
docker push $repositoryUri:latest 