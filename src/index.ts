import express from 'express';
import cors from 'cors';
import { AuthService } from './services/auth';
import { Chatbot } from './services/chatbot';
import { DocumentProcessor } from './services/documentProcessor';
import { DocumentAccessService } from './services/documentAccess';

const app = express();
const port = process.env.PORT || 3000;

// ミドルウェアの設定
app.use(cors());
app.use(express.json());

// サービスの初期化
const authService = new AuthService();
const chatbot = new Chatbot();
const documentProcessor = new DocumentProcessor();
const documentAccess = new DocumentAccessService();

// ヘルスチェックエンドポイント
app.get('/', (req, res) => {
  res.status(200).send('OK');
});

// エラーハンドリングミドルウェア
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
  });
});

// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Health check endpoint is available at /');
});

// 未処理の例外をキャッチ
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
}); 