import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { BundleService } from './bundle.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { BundleResponse, DocumentResponse, PresignedUrlResponse, DownloadUrlResponse } from './dto/bundle.response';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Application Bundles')
@Controller('bundles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BundleController {
  constructor(private bundleService: BundleService) {}

  @Post()
  @ApiOperation({ summary: 'Create application bundle' })
  @ApiResponse({ status: 201, description: 'Bundle created', type: BundleResponse })
  @ApiResponse({ status: 400, description: 'Bundle already exists' })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateBundleDto,
  ): Promise<BundleResponse> {
    return this.bundleService.createBundle(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bundles with document count' })
  @ApiResponse({ status: 200, description: 'Bundles retrieved', type: [BundleResponse] })
  async findAll(@CurrentUser('userId') userId: string): Promise<BundleResponse[]> {
    return this.bundleService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bundle by ID' })
  @ApiResponse({ status: 200, description: 'Bundle retrieved', type: BundleResponse })
  @ApiResponse({ status: 404, description: 'Bundle not found' })
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<BundleResponse> {
    return this.bundleService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update bundle' })
  @ApiResponse({ status: 200, description: 'Bundle updated', type: BundleResponse })
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBundleDto,
  ): Promise<BundleResponse> {
    return this.bundleService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete bundle and all documents (S3 cleanup)' })
  @ApiResponse({ status: 204, description: 'Bundle deleted' })
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.bundleService.remove(userId, id);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload document to bundle (presigned URL flow)' })
  @ApiResponse({ status: 201, description: 'Presigned URL generated' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['CV', 'COVER_LETTER', 'PORTFOLIO', 'OTHER'] },
        filename: { type: 'string', example: 'resume.pdf' },
        mimeType: { type: 'string', example: 'application/pdf' },
        fileSize: { type: 'number', example: 1024000 },
      },
    },
  })
  async uploadDocument(
    @CurrentUser('userId') userId: string,
    @Param('id') bundleId: string,
    @Body() body: { type: string; filename: string; mimeType: string; fileSize: number },
  ) {
    return this.bundleService.generateUploadUrl(
      userId,
      bundleId,
      body.filename,
      body.type as any,
      body.mimeType,
      body.fileSize,
    );
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'List documents in bundle' })
  @ApiResponse({ status: 200, description: 'Documents retrieved', type: [DocumentResponse] })
  async getDocuments(
    @CurrentUser('userId') userId: string,
    @Param('id') bundleId: string,
  ): Promise<DocumentResponse[]> {
    return this.bundleService.getDocuments(userId, bundleId);
  }

  @Get(':id/documents/:documentId')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({ status: 200, description: 'Document retrieved', type: DocumentResponse })
  async getDocument(
    @CurrentUser('userId') userId: string,
    @Param('id') bundleId: string,
    @Param('documentId') documentId: string,
  ): Promise<DocumentResponse> {
    return this.bundleService.getDocument(userId, bundleId, documentId);
  }

  @Get(':id/documents/:documentId/download')
  @ApiOperation({ summary: 'Generate presigned download URL (1h expiry)' })
  @ApiResponse({ status: 200, description: 'Download URL generated', type: DownloadUrlResponse })
  async downloadDocument(
    @CurrentUser('userId') userId: string,
    @Param('id') bundleId: string,
    @Param('documentId') documentId: string,
  ): Promise<DownloadUrlResponse> {
    return this.bundleService.generateDownloadUrl(userId, bundleId, documentId);
  }

  @Patch(':id/documents/:documentId')
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiResponse({ status: 200, description: 'Document updated', type: DocumentResponse })
  async updateDocument(
    @CurrentUser('userId') userId: string,
    @Param('id') bundleId: string,
    @Param('documentId') documentId: string,
    @Body() dto: UpdateDocumentDto,
  ): Promise<DocumentResponse> {
    return this.bundleService.updateDocument(userId, bundleId, documentId, dto);
  }

  @Delete(':id/documents/:documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete document from bundle and S3' })
  @ApiResponse({ status: 204, description: 'Document deleted' })
  async deleteDocument(
    @CurrentUser('userId') userId: string,
    @Param('id') bundleId: string,
    @Param('documentId') documentId: string,
  ): Promise<void> {
    return this.bundleService.deleteDocument(userId, bundleId, documentId);
  }
}
