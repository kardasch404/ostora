import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly bucket = process.env.AWS_S3_BUCKET || 'ostora-documents-prod';
  private readonly signedUrlTtl = Number(process.env.S3_SIGNED_URL_TTL_SECONDS || 3600);

  private readonly client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
  });

  buildCvKey(userId: string, lang: string): string {
    return `users/${userId}/cv/${randomUUID()}-cv-${lang}.pdf`;
  }

  buildCoverLetterKey(userId: string, lang: string): string {
    return `users/${userId}/cover-letter/${randomUUID()}-cover-letter-${lang}.pdf`;
  }

  async uploadPdf(s3Key: string, pdfBuffer: Buffer): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
      }),
    );
  }

  async getSignedDownloadUrl(s3Key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: s3Key });
    return getSignedUrl(this.client, command, { expiresIn: this.signedUrlTtl });
  }
}
