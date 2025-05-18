# ビルドステージ
FROM node:18-alpine AS builder

WORKDIR /app

# 依存関係のインストール（キャッシュを活用）
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# ソースコードのコピーとビルド
COPY tsconfig.json .
COPY src/ ./src/
RUN npm run build

# 実行ステージ
FROM node:18-alpine

WORKDIR /app

# 必要なファイルのみコピー
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# 本番環境用の依存関係のみインストール
RUN npm ci --only=production --prefer-offline --no-audit && \
    npm cache clean --force && \
    rm -rf /root/.npm

# ヘルスチェック用のエンドポイントを追加
RUN echo 'app.get("/", (req, res) => res.status(200).send("OK"));' >> dist/index.js

# 非rootユーザーで実行
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# アプリケーションの起動
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1
CMD ["node", "dist/index.js"] 