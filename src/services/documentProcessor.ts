import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { TextractClient, StartDocumentAnalysisCommand } from '@aws-sdk/client-textract';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { Document, DocumentType } from '../types';
import { s3Client, textractClient, lambdaClient, S3_BUCKET_NAME, DOCUMENT_PROCESSOR_LAMBDA } from '../config/aws';

export class DocumentProcessor {
  private s3Client: S3Client;
  private textractClient: TextractClient;
  private lambdaClient: LambdaClient;

  constructor() {
    this.s3Client = s3Client;
    this.textractClient = textractClient;
    this.lambdaClient = lambdaClient;
  }

  async uploadDocument(file: Buffer, filename: string, contentType: string): Promise<Document> {
    const documentId = `${Date.now()}-${filename}`;
    
    // S3にアップロード
    await this.s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: documentId,
      Body: file,
      ContentType: contentType,
    }));

    // ドキュメント処理を開始
    const document: Document = {
      id: documentId,
      filename,
      contentType,
      size: file.length,
      uploadDate: new Date(),
      metadata: {},
    };

    // Lambda関数を呼び出してドキュメント処理を開始
    await this.lambdaClient.send(new InvokeCommand({
      FunctionName: DOCUMENT_PROCESSOR_LAMBDA,
      Payload: JSON.stringify({
        documentId,
        contentType,
        action: 'process',
      }),
    }));

    return document;
  }

  async getDocument(documentId: string): Promise<Buffer> {
    const response = await this.s3Client.send(new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: documentId,
    }));

    if (!response.Body) {
      throw new Error('Document not found');
    }

    return Buffer.from(await response.Body.transformToByteArray());
  }

  async extractText(documentId: string, contentType: string): Promise<string> {
    if (contentType === 'application/pdf') {
      const response = await this.textractClient.send(new StartDocumentAnalysisCommand({
        DocumentLocation: {
          S3Object: {
            Bucket: S3_BUCKET_NAME,
            Name: documentId,
          },
        },
        FeatureTypes: ['FORMS', 'TABLES'],
      }));

      // Textractの処理結果を待機して取得する処理を実装
      // 実際の実装では、非同期処理の結果をポーリングする必要があります
      return 'Extracted text from PDF';
    }

    // その他のファイル形式の処理
    const file = await this.getDocument(documentId);
    return file.toString('utf-8');
  }
} 