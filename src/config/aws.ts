import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { OpenSearchClient } from '@aws-sdk/client-opensearch';
import { S3Client } from '@aws-sdk/client-s3';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { TextractClient } from '@aws-sdk/client-textract';

// AWS設定
export const awsConfig = {
  region: process.env.AWS_REGION || 'ap-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};

// AWSクライアントの初期化
export const bedrockClient = new BedrockRuntimeClient(awsConfig);
export const opensearchClient = new OpenSearchClient(awsConfig);
export const s3Client = new S3Client(awsConfig);
export const lambdaClient = new LambdaClient(awsConfig);
export const textractClient = new TextractClient(awsConfig);

// S3バケット設定
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'ai-chatbot-documents';

// OpenSearch設定
export const OPENSEARCH_DOMAIN = process.env.OPENSEARCH_DOMAIN || 'ai-chatbot-search';
export const OPENSEARCH_INDEX = 'documents';

// Lambda設定
export const DOCUMENT_PROCESSOR_LAMBDA = process.env.DOCUMENT_PROCESSOR_LAMBDA || 'document-processor';

// Bedrock設定
export const BEDROCK_MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';
export const BEDROCK_MAX_TOKENS = 4096;
export const BEDROCK_TEMPERATURE = 0.7; 