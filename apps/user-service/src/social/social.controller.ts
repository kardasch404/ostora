import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SocialService } from './social.service';
import { CreateSocialLinkDto } from './dto/create-social-link.dto';
import { UpdateSocialLinkDto } from './dto/update-social-link.dto';
import { SocialLinkResponse } from './dto/social-link.response';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Social Links')
@Controller('socials')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialController {
  constructor(private socialService: SocialService) {}

  @Post()
  @ApiOperation({ summary: 'Create social link' })
  @ApiResponse({ status: 201, description: 'Social link created', type: SocialLinkResponse })
  @ApiResponse({ status: 400, description: 'Platform already exists' })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateSocialLinkDto,
  ): Promise<SocialLinkResponse> {
    return this.socialService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all social links' })
  @ApiResponse({ status: 200, description: 'Social links retrieved', type: [SocialLinkResponse] })
  async findAll(@CurrentUser('userId') userId: string): Promise<SocialLinkResponse[]> {
    return this.socialService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get social link by ID' })
  @ApiResponse({ status: 200, description: 'Social link retrieved', type: SocialLinkResponse })
  @ApiResponse({ status: 404, description: 'Social link not found' })
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<SocialLinkResponse> {
    return this.socialService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update social link' })
  @ApiResponse({ status: 200, description: 'Social link updated', type: SocialLinkResponse })
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSocialLinkDto,
  ): Promise<SocialLinkResponse> {
    return this.socialService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete social link' })
  @ApiResponse({ status: 204, description: 'Social link deleted' })
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.socialService.remove(userId, id);
  }
}
