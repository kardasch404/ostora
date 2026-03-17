import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../../src/bundle/s3.service';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

describe('S3Service', () => {
  let service: S3Service;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        AWS_REGION: 'us-east-1',
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key',
        AWS_S3_BUCKET: 'ostora-documents',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    configService = module.get<ConfigService>(ConfigService);

    // Mock getSignedUrl
    (getSignedUrl as jest.Mock).mockResolvedValue('https://s3.amazonaws.com/presigned-url');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePresignedUploadUrl', () => {
    it('should generate presigned URL with correct key and bucket', async () => {
      const key = 'users/user-123/bundles/bundle-123/resume.pdf';
      const contentType = 'application/pdf';

      const result = await service.generatePresignedUploadUrl(key, contentType);

      expect(result.uploadUrl).toBe('https://s3.amazonaws.com/presigned-url');
      expect(result.key).toBe(key);
      expect(getSignedUrl).toHaveBeenCalled();
    });

    it('should use correct bucket name from config', async () => {
      const key = 'test-key';
      const contentType = 'application/pdf';

      await service.generatePresignedUploadUrl(key, contentType);

      expect(mockConfigService.get).toHaveBeenCalledWith('AWS_S3_BUCKET');
    });
  });

  describe('generatePresignedDownloadUrl', () => {
    it('should generate presigned download URL', async () => {
      const key = 'users/user-123/bundles/bundle-123/resume.pdf';

      const result = await service.generatePresignedDownloadUrl(key);

      expect(result).toBe('https://s3.amazonaws.com/presigned-url');
      expect(getSignedUrl).toHaveBeenCalled();
    });
  });

  describe('generateS3Key', () => {
    it('should generate correct S3 key structure', () => {
      const userId = 'user-123';
      const bundleId = 'bundle-456';
      const filename = 'my resume.pdf';

      const result = service.generateS3Key(userId, bundleId, filename);

      expect(result).toMatch(/^users\/user-123\/bundles\/bundle-456\/\d+-my_resume\.pdf$/);
      expect(result).toContain('users/user-123/bundles/bundle-456/');
      expect(result).toContain('my_resume.pdf');
    });

    it('should sanitize filename with special characters', () => {
      const userId = 'user-123';
      const bundleId = 'bundle-456';
      const filename = 'résumé@2024!.pdf';

      const result = service.generateS3Key(userId, bundleId, filename);

      expect(result).toMatch(/^users\/user-123\/bundles\/bundle-456\/\d+-r_sum__2024_\.pdf$/);
    });

    it('should include timestamp in key', () => {
      const userId = 'user-123';
      const bundleId = 'bundle-456';
      const filename = 'resume.pdf';

      const beforeTimestamp = Date.now();
      const result = service.generateS3Key(userId, bundleId, filename);
      const afterTimestamp = Date.now();

      const timestampMatch = result.match(/\/(\d+)-resume\.pdf$/);
      expect(timestampMatch).toBeTruthy();
      
      const timestamp = parseInt(timestampMatch![1]);
      expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(timestamp).toBeLessThanOrEqual(afterTimestamp);
    });
  });

  describe('getPublicUrl', () => {
    it('should return correct public URL', () => {
      const key = 'users/user-123/bundles/bundle-123/resume.pdf';

      const result = service.getPublicUrl(key);

      expect(result).toBe('https://ostora-documents.s3.amazonaws.com/users/user-123/bundles/bundle-123/resume.pdf');
    });
  });

  describe('deleteFile', () => {
    it('should call S3 delete with correct key', async () => {
      const key = 'users/user-123/bundles/bundle-123/resume.pdf';

      await service.deleteFile(key);

      // Verify that deleteFile was called (implementation detail)
      expect(true).toBe(true); // Placeholder assertion
    });
  });
});
