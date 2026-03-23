import { Controller, Get, Post, Patch, Delete, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponse } from './dto/profile.response';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: ProfileResponse })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getProfile(@CurrentUser('userId') userId: string): Promise<ProfileResponse> {
    return this.profileService.getProfile(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create user profile' })
  @ApiResponse({ status: 201, description: 'Profile created successfully', type: ProfileResponse })
  async createProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    return this.profileService.createProfile(userId, dto);
  }

  @Patch()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: ProfileResponse })
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    return this.profileService.updateProfile(userId, dto);
  }

  @Post('upload-url')
  @ApiOperation({ summary: 'Generate presigned S3 upload URL for avatar/cover image' })
  @ApiResponse({ status: 201, description: 'Upload URL generated successfully' })
  async generateUploadUrl(
    @CurrentUser('userId') userId: string,
    @Body() body: { filename: string; mimeType: string; kind: 'avatar' | 'cover' },
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    return this.profileService.generateProfileMediaUploadUrl(userId, body.filename, body.mimeType, body.kind);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user profile' })
  @ApiResponse({ status: 204, description: 'Profile deleted successfully' })
  async deleteProfile(@CurrentUser('userId') userId: string): Promise<void> {
    return this.profileService.deleteProfile(userId);
  }

  @Get('completeness')
  @ApiOperation({ summary: 'Get profile completeness percentage' })
  @ApiResponse({ status: 200, description: 'Profile completeness retrieved' })
  async getCompleteness(@CurrentUser('userId') userId: string) {
    return this.profileService.getProfileCompleteness(userId);
  }
}
