import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get('AWS_REGION') || 'us-east-1';
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    const hasStaticCredentials = Boolean(accessKeyId && secretAccessKey);

    if (!hasStaticCredentials) {
      this.logger.warn(
        'AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY are not set; using default AWS credential provider chain for S3 operations.',
      );
    }

    this.s3Client = new S3Client({
      region,
      // Browser presigned uploads should not force optional SDK checksum params.
      // Keep checksum calculation to required-only operations.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      ...(hasStaticCredentials
        ? {
            credentials: {
              accessKeyId: accessKeyId as string,
              secretAccessKey: secretAccessKey as string,
            },
          }
        : {}),
    });
    this.bucketName = this.configService.get('AWS_S3_BUCKET') || 'ostora-documents';
  }

  async generatePresignedUploadUrl(key: string, contentType: string): Promise<{ uploadUrl: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour

    return { uploadUrl, key };
  }

  async generatePresignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }

  generateS3Key(userId: string, bundleId: string, filename: string): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `users/${userId}/bundles/${bundleId}/${timestamp}-${sanitizedFilename}`;
  }
}
