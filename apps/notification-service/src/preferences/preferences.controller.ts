import { Controller, Get, Put, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PreferencesService } from './preferences.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
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
}
