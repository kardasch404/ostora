import { Controller, Get, Put, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PreferencesService } from './preferences.service';

@ApiTags('preferences')
@Controller('preferences')
@ApiBearerAuth()
export class PreferencesController {
  constructor(private preferencesService: PreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notification preferences' })
  async getPreferences(@Req() req: any) {
    return this.preferencesService.getUserPreferences(req.user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreferences(@Req() req: any, @Body() preferences: any) {
    return this.preferencesService.updatePreferences(req.user.id, preferences);
  }
}
