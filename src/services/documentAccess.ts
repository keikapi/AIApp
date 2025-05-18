import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET_NAME } from '../config/aws';
import { PresignedUrlResponse } from '../types';

export class DocumentAccessService {
  private s3Client: S3Client;
  private readonly URL_EXPIRATION = 15 * 60; // 15分

  constructor() {
    this.s3Client = s3Client;
  }

  async generatePresignedUrl(documentId: string): Promise<PresignedUrlResponse> {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: documentId,
    });

    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: this.URL_EXPIRATION,
    });

    return {
      url,
      expiresIn: this.URL_EXPIRATION,
    };
  }

  async validateDocumentAccess(documentId: string, userId: string): Promise<boolean> {
    // TODO: DynamoDBでドキュメントのアクセス権を確認
    // 現時点では、ドキュメントIDにユーザーIDが含まれているかで簡易的に判定
    return documentId.includes(userId);
  }
} 