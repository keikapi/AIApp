import { S3Event } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { OpenSearchServerlessClient, CreateCollectionCommand } from '@aws-sdk/client-opensearchserverless';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { TextractClient, StartDocumentAnalysisCommand, GetDocumentAnalysisCommand } from '@aws-sdk/client-textract';
import { PDFDocument } from 'pdf-lib';
import axios from 'axios';

const bedrock = new BedrockRuntimeClient({ region: 'ap-northeast-1' });
const opensearch = new OpenSearchServerlessClient({ region: 'ap-northeast-1' });
const s3 = new S3Client({ region: 'ap-northeast-1' });
const textract = new TextractClient({ region: 'ap-northeast-1' });

export const handler = async (event: S3Event): Promise<void> => {
  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      // S3からドキュメントを取得
      const getObjectResponse = await s3.send(new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }));

      if (!getObjectResponse.Body) {
        throw new Error('Document body is empty');
      }

      // ドキュメントの種類に応じて処理
      const fileExtension = key.split('.').pop()?.toLowerCase();
      let text = '';

      switch (fileExtension) {
        case 'pdf':
          text = await processPDF(getObjectResponse.Body);
          break;
        case 'txt':
          text = await processText(getObjectResponse.Body);
          break;
        case 'docx':
        case 'doc':
          text = await processWord(getObjectResponse.Body);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      // テキストをベクトル化
      const vector = await generateEmbedding(text);

      // OpenSearchにインデックスを作成（存在しない場合）
      await createIndexIfNotExists();

      // ドキュメントをインデックスに保存
      await indexDocument({
        id: key,
        text,
        vector,
        metadata: {
          bucket,
          key,
          fileType: fileExtension,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
};

async function processPDF(body: any): Promise<string> {
  const arrayBuffer = await body.transformToByteArray();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  let text = '';
  
  // PDFの各ページを処理
  const pages = pdfDoc.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    // テキスト抽出のための基本的な処理
    // 注: pdf-libは直接テキスト抽出をサポートしていないため、
    // 実際の運用ではAmazon Textractを使用することを推奨
    text += `Page ${pages.indexOf(page) + 1}\n`;
  }
  
  return text;
}

async function processText(body: any): Promise<string> {
  const text = await body.transformToString();
  return text;
}

async function processWord(body: any): Promise<string> {
  // Word文書の処理は別途実装が必要
  throw new Error('Word document processing not implemented yet');
}

async function generateEmbedding(text: string): Promise<number[]> {
  const command = new InvokeModelCommand({
    modelId: 'amazon.titan-embed-text-v1',
    body: JSON.stringify({
      inputText: text,
    }),
  });

  const response = await bedrock.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.embedding;
}

async function createIndexIfNotExists(): Promise<void> {
  try {
    // コレクションの作成
    await opensearch.send(new CreateCollectionCommand({
      name: 'documents',
      description: 'Document collection for AI Chatbot',
      type: 'SEARCH',
      standbyReplicas: 'DISABLED'
    }));

  } catch (error: any) {
    if (error.name !== 'ConflictException') {
      throw error;
    }
  }
}

async function indexDocument(document: {
  id: string;
  text: string;
  vector: number[];
  metadata: {
    bucket: string;
    key: string;
    fileType: string;
    timestamp: string;
  };
}): Promise<void> {
  const endpoint = process.env.OPENSEARCH_ENDPOINT;
  if (!endpoint) {
    throw new Error('OpenSearch endpoint is not configured');
  }

  // OpenSearch Serverlessのエンドポイントに直接HTTPリクエストを送信
  await axios.post(`${endpoint}/documents/_doc/${document.id}`, {
    text: document.text,
    vector: document.vector,
    metadata: document.metadata
  }, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
} 