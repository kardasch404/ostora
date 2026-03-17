import { Test, TestingModule } from '@nestjs/testing';
import { BundleService } from '../../src/bundle/bundle.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { S3Service } from '../../src/bundle/s3.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BundleService', () => {
  let service: BundleService;
  let prisma: PrismaService;
  let s3Service: S3Service;

  const mockPrismaService = {
    applicationBundle: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    applicationDocument: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockS3Service = {
    generatePresignedUploadUrl: jest.fn(),
    generatePresignedDownloadUrl: jest.fn(),
    deleteFile: jest.fn(),
    getPublicUrl: jest.fn(),
    generateS3Key: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BundleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    service = module.get<BundleService>(BundleService);
    prisma = module.get<PrismaService>(PrismaService);
    s3Service = module.get<S3Service>(S3Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBundle', () => {
    it('should create a new bundle', async () => {
      const userId = 'user-123';
      const createDto = {
        name: 'MERN Stack JS',
        description: 'Bundle for MERN stack positions',
      };

      const expectedBundle = {
        id: 'bundle-123',
        userId,
        name: createDto.name,
        slug: 'mern-stack-js',
        description: createDto.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { documents: 0 },
      };

      mockPrismaService.applicationBundle.findUnique.mockResolvedValue(null);
      mockPrismaService.applicationBundle.create.mockResolvedValue(expectedBundle);

      const result = await service.createBundle(userId, createDto);

      expect(result.name).toEqual(createDto.name);
      expect(result.slug).toEqual('mern-stack-js');
      expect(mockPrismaService.applicationBundle.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if bundle with same name exists', async () => {
      const userId = 'user-123';
      const createDto = {
        name: 'MERN Stack JS',
        description: 'Bundle for MERN stack positions',
      };

      const existingBundle = {
        id: 'bundle-123',
        userId,
        name: createDto.name,
        slug: 'mern-stack-js',
      };

      mockPrismaService.applicationBundle.findUnique.mockResolvedValue(existingBundle);

      await expect(service.createBundle(userId, createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadDocument', () => {
    it('should generate presigned URL for document upload', async () => {
      const userId = 'user-123';
      const bundleId = 'bundle-123';
      const filename = 'resume.pdf';
      const type = 'CV';
      const mimeType = 'application/pdf';
      const fileSize = 1024000;

      const bundle = {
        id: bundleId,
        userId,
        name: 'MERN Stack JS',
        slug: 'mern-stack-js',
        _count: { documents: 0 },
      };

      const s3Key = `users/${userId}/bundles/${bundleId}/1234567890-resume.pdf`;
      const uploadUrl = 'https://s3.amazonaws.com/presigned-url';
      const publicUrl = `https://ostora-documents.s3.amazonaws.com/${s3Key}`;

      const document = {
        id: 'doc-123',
        bundleId,
        type,
        filename,
        s3Key,
        s3Url: publicUrl,
        fileSize,
        mimeType,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.applicationBundle.findUnique.mockResolvedValue(bundle);
      mockS3Service.generateS3Key.mockReturnValue(s3Key);
      mockS3Service.generatePresignedUploadUrl.mockResolvedValue({ uploadUrl, key: s3Key });
      mockS3Service.getPublicUrl.mockReturnValue(publicUrl);
      mockPrismaService.applicationDocument.create.mockResolvedValue(document);

      const result = await service.generateUploadUrl(userId, bundleId, filename, type as any, mimeType, fileSize);

      expect(result.uploadUrl).toEqual(uploadUrl);
      expect(result.key).toEqual(s3Key);
      expect(result.document).toEqual(document);
      expect(mockS3Service.generatePresignedUploadUrl).toHaveBeenCalledWith(s3Key, mimeType);
    });

    it('should throw BadRequestException if file size exceeds limit', async () => {
      const userId = 'user-123';
      const bundleId = 'bundle-123';
      const filename = 'resume.pdf';
      const type = 'CV';
      const mimeType = 'application/pdf';
      const fileSize = 11 * 1024 * 1024; // 11MB

      const bundle = {
        id: bundleId,
        userId,
        name: 'MERN Stack JS',
        slug: 'mern-stack-js',
        _count: { documents: 0 },
      };

      mockPrismaService.applicationBundle.findUnique.mockResolvedValue(bundle);

      await expect(
        service.generateUploadUrl(userId, bundleId, filename, type as any, mimeType, fileSize)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if file type is not allowed', async () => {
      const userId = 'user-123';
      const bundleId = 'bundle-123';
      const filename = 'image.jpg';
      const type = 'CV';
      const mimeType = 'image/jpeg';
      const fileSize = 1024000;

      const bundle = {
        id: bundleId,
        userId,
        name: 'MERN Stack JS',
        slug: 'mern-stack-js',
        _count: { documents: 0 },
      };

      mockPrismaService.applicationBundle.findUnique.mockResolvedValue(bundle);

      await expect(
        service.generateUploadUrl(userId, bundleId, filename, type as any, mimeType, fileSize)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete bundle and all documents from S3', async () => {
      const userId = 'user-123';
      const bundleId = 'bundle-123';

      const bundle = {
        id: bundleId,
        userId,
        name: 'MERN Stack JS',
        slug: 'mern-stack-js',
        _count: { documents: 2 },
      };

      const documents = [
        { id: 'doc-1', s3Key: 'key-1' },
        { id: 'doc-2', s3Key: 'key-2' },
      ];

      mockPrismaService.applicationBundle.findUnique.mockResolvedValue(bundle);
      mockPrismaService.applicationDocument.findMany.mockResolvedValue(documents);
      mockS3Service.deleteFile.mockResolvedValue(undefined);
      mockPrismaService.applicationBundle.delete.mockResolvedValue(bundle);

      await service.remove(userId, bundleId);

      expect(mockS3Service.deleteFile).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.applicationBundle.delete).toHaveBeenCalledWith({
        where: { id: bundleId },
      });
    });
  });
});
