import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProfileSettingsService } from './profile-settings.service';
import { UpdateProfileSettingsDto } from './dto/update-profile-settings.dto';
import { ProfileSettingsResponse, ProfileCompletenessResponse } from './dto/profile-settings.response';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Profile Settings')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileSettingsController {
  constructor(private profileSettingsService: ProfileSettingsService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get profile settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved', type: ProfileSettingsResponse })
  async getSettings(@CurrentUser('userId') userId: string): Promise<ProfileSettingsResponse> {
    return this.profileSettingsService.getOrCreateSettings(userId);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update profile settings' })
  @ApiResponse({ status: 200, description: 'Settings updated', type: ProfileSettingsResponse })
  async updateSettings(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProfileSettingsDto,
  ): Promise<ProfileSettingsResponse> {
    return this.profileSettingsService.updateSettings(userId, dto);
  }

  @Get('completeness')
  @ApiOperation({ summary: 'Calculate profile completeness score (cached in Redis)' })
  @ApiResponse({ status: 200, description: 'Completeness calculated', type: ProfileCompletenessResponse })
  async getCompleteness(@CurrentUser('userId') userId: string): Promise<ProfileCompletenessResponse> {
    return this.profileSettingsService.calculateCompleteness(userId);
  }

  @Post('import/linkedin')
  @ApiOperation({ summary: 'Import profile from LinkedIn (via scraping-service)' })
  @ApiResponse({ status: 200, description: 'LinkedIn data imported' })
  @ApiResponse({ status: 501, description: 'Not yet implemented' })
  async importFromLinkedIn(
    @CurrentUser('userId') userId: string,
    @Body() linkedInData: any,
  ): Promise<any> {
    return this.profileSettingsService.importFromLinkedIn(userId, linkedInData);
  }

  @Post('import/linkedin/payload')
  @ApiOperation({ summary: 'Import profile from a pre-scraped LinkedIn payload' })
  @ApiResponse({ status: 200, description: 'LinkedIn payload imported' })
  async importFromLinkedInPayload(
    @CurrentUser('userId') userId: string,
    @Body() payload: any,
  ): Promise<any> {
    return this.profileSettingsService.importFromLinkedIn(userId, payload);
  }
}
