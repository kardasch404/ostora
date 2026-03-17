import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from './s3.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import { ApplicationDocumentType } from './dto/upload-document.dto';
import { BundleResponse, DocumentResponse } from './dto/bundle.response';

@Injectable()
export class BundleService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async createBundle(userId: string, dto: CreateBundleDto): Promise<BundleResponse> {
    const slug = this.generateSlug(dto.name);

    // Check if slug already exists for this user
    const existing = await this.prisma.applicationBundle.findUnique({
      where: {
        userId_slug: {
          userId,
          slug,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Bundle with this name already exists');
    }

    const bundle = await this.prisma.applicationBundle.create({
      data: {
        userId,
        name: dto.name,
        slug,
        description: dto.description,
      },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    return {
      ...bundle,
      documentCount: bundle._count.documents,
    };
  }

  async findAll(userId: string): Promise<BundleResponse[]> {
    const bundles = await this.prisma.applicationBundle.findMany({
      where: { userId },
      include: {
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bundles.map(bundle => ({
      ...bundle,
      documentCount: bundle._count.documents,
    }));
  }

  async findOne(userId: string, id: string): Promise<BundleResponse> {
    const bundle = await this.prisma.applicationBundle.findUnique({
      where: { id },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    if (bundle.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return {
      ...bundle,
      documentCount: bundle._count.documents,
    };
  }

  async update(userId: string, id: string, dto: UpdateBundleDto): Promise<BundleResponse> {
    await this.findOne(userId, id);

    const updateData: any = { ...dto };

    if (dto.name) {
      updateData.slug = this.generateSlug(dto.name);
    }

    const bundle = await this.prisma.applicationBundle.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    return {
      ...bundle,
      documentCount: bundle._count.documents,
    };
  }

  async remove(userId: string, id: string): Promise<void> {
    const bundle = await this.findOne(userId, id);

    // Get all documents to delete from S3
    const documents = await this.prisma.applicationDocument.findMany({
      where: { bundleId: id },
    });

    // Delete all files from S3
    await Promise.all(
      documents.map(doc => this.s3Service.deleteFile(doc.s3Key)),
    );

    // Delete bundle (cascade will delete documents from DB)
    await this.prisma.applicationBundle.delete({
      where: { id },
    });
  }

  async generateUploadUrl(
    userId: string,
    bundleId: string,
    filename: string,
    type: ApplicationDocumentType,
    mimeType: string,
    fileSize: number,
  ) {
    // Verify bundle ownership
    await this.findOne(userId, bundleId);

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Validate mime type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(mimeType)) {
      throw new BadRequestException('Only PDF, DOC, and DOCX files are allowed');
    }

    // Generate S3 key
    const s3Key = this.s3Service.generateS3Key(userId, bundleId, filename);

    // Generate presigned URL
    const { uploadUrl } = await this.s3Service.generatePresignedUploadUrl(s3Key, mimeType);

    // Create document record
    const document = await this.prisma.applicationDocument.create({
      data: {
        bundleId,
        type,
        filename,
        s3Key,
        s3Url: this.s3Service.getPublicUrl(s3Key),
        fileSize,
        mimeType,
      },
    });

    return {
      uploadUrl,
      key: s3Key,
      expiresIn: 3600,
      document,
    };
  }

  async getDocuments(userId: string, bundleId: string): Promise<DocumentResponse[]> {
    await this.findOne(userId, bundleId);

    return await this.prisma.applicationDocument.findMany({
      where: { bundleId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDocument(userId: string, bundleId: string, documentId: string): Promise<DocumentResponse> {
    await this.findOne(userId, bundleId);

    const document = await this.prisma.applicationDocument.findUnique({
      where: { id: documentId },
    });

    if (!document || document.bundleId !== bundleId) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async generateDownloadUrl(userId: string, bundleId: string, documentId: string) {
    const document = await this.getDocument(userId, bundleId, documentId);

    const downloadUrl = await this.s3Service.generatePresignedDownloadUrl(document.s3Key);

    return {
      downloadUrl,
      expiresIn: 3600,
    };
  }

  async deleteDocument(userId: string, bundleId: string, documentId: string): Promise<void> {
    const document = await this.getDocument(userId, bundleId, documentId);

    // Delete from S3
    await this.s3Service.deleteFile(document.s3Key);

    // Delete from database
    await this.prisma.applicationDocument.delete({
      where: { id: documentId },
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
