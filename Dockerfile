# ビルドステージ
FROM node:18-alpine AS builder

WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm ci

# ソースコードのコピーとビルド
COPY . .
RUN npm run build

# 実行ステージ
FROM node:18-alpine

WORKDIR /app

# 必要なファイルのみコピー
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# ヘルスチェック用のエンドポイントを追加
RUN echo 'app.get("/", (req, res) => res.status(200).send("OK"));' >> dist/index.js

# アプリケーションの起動
EXPOSE 3000
CMD ["node", "dist/index.js"] 