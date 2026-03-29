import { Controller, Get, Put, Patch, Body, Req, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PreferencesService } from './preferences.service';
import { UpdatePreferencesDto, QuietHoursDto, DigestFrequency } from './dto/update-preferences.dto';
import { PreferencesResponseDto } from './dto/preferences-response.dto';

@ApiTags('preferences')
@Controller('preferences')
@ApiBearerAuth()
export class PreferencesController {
  constructor(private preferencesService: PreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notification preferences' })
  async getPreferences(@Req() req: any): Promise<PreferencesResponseDto> {
    return this.preferencesService.getUserPreferences(req.user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreferences(
    @Req() req: any,
    @Body() preferences: UpdatePreferencesDto,
  ): Promise<PreferencesResponseDto> {
    return this.preferencesService.updatePreferences(req.user.id, preferences);
  }

  @Patch('channels/:channel')
  @ApiOperation({ summary: 'Toggle specific channel (email/push/inApp)' })
  async toggleChannel(
    @Req() req: any,
    @Param('channel') channel: string,
    @Body() body: { enabled: boolean },
  ) {
    const update: any = {};
    
    if (channel === 'email') update.emailEnabled = body.enabled;
    else if (channel === 'push') update.pushEnabled = body.enabled;
    else if (channel === 'inApp') update.inAppEnabled = body.enabled;
    
    return this.preferencesService.updatePreferences(req.user.id, update);
  }

  @Patch('quiet-hours')
  @ApiOperation({ summary: 'Update quiet hours for push notifications' })
  async updateQuietHours(
    @Req() req: any,
    @Body() quietHours: QuietHoursDto,
  ) {
    return this.preferencesService.updatePreferences(req.user.id, { quietHours });
  }

  @Patch('digest-frequency')
  @ApiOperation({ summary: 'Update digest frequency' })
  async updateDigestFrequency(
    @Req() req: any,
    @Body() body: { frequency: DigestFrequency },
  ) {
    return this.preferencesService.updatePreferences(req.user.id, {
      digestFrequency: body.frequency,
    });
  }

  @Patch('types/:type')
  @ApiOperation({ summary: 'Toggle specific notification type' })
  async toggleNotificationType(
    @Req() req: any,
    @Param('type') type: string,
    @Body() body: { enabled: boolean },
  ) {
    const preferences = await this.preferencesService.getUserPreferences(req.user.id);
    const types = { ...preferences.types, [type]: body.enabled };
    
    return this.preferencesService.updatePreferences(req.user.id, { types });
  }
}
