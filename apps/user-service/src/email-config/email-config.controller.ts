import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmailConfigService } from './email-config.service';
import { CreateEmailConfigDto } from './dto/create-email-config.dto';
import { EmailConfigResponse } from './dto/email-config.response';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Email Configuration')
@Controller('email-configs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmailConfigController {
  constructor(private emailConfigService: EmailConfigService) {}

  @Post()
  @ApiOperation({ summary: 'Create email configuration' })
  @ApiResponse({ status: 201, description: 'Email config created', type: EmailConfigResponse })
  @ApiResponse({ status: 400, description: 'Email config already exists' })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateEmailConfigDto,
  ): Promise<EmailConfigResponse> {
    return this.emailConfigService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all email configurations' })
  @ApiResponse({ status: 200, description: 'Email configs retrieved', type: [EmailConfigResponse] })
  async findAll(@CurrentUser('userId') userId: string): Promise<EmailConfigResponse[]> {
    return this.emailConfigService.findAll(userId);
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get supported email providers' })
  @ApiResponse({ status: 200, description: 'Providers list retrieved' })
  async getProviders() {
    return this.emailConfigService.getProviders();
  }

  @Get('providers/:provider')
  @ApiOperation({ summary: 'Get provider SMTP configuration' })
  @ApiResponse({ status: 200, description: 'Provider config retrieved' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async getProviderConfig(@Param('provider') provider: string) {
    return this.emailConfigService.getProviderConfig(provider);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get email configuration by ID' })
  @ApiResponse({ status: 200, description: 'Email config retrieved', type: EmailConfigResponse })
  @ApiResponse({ status: 404, description: 'Email config not found' })
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<EmailConfigResponse> {
    return this.emailConfigService.findOne(userId, id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test email configuration connection' })
  @ApiResponse({ status: 200, description: 'Connection test completed' })
  @ApiResponse({ status: 404, description: 'Email config not found' })
  async testConnection(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.emailConfigService.testConnection(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update email configuration' })
  @ApiResponse({ status: 200, description: 'Email config updated', type: EmailConfigResponse })
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateEmailConfigDto>,
  ): Promise<EmailConfigResponse> {
    return this.emailConfigService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete email configuration' })
  @ApiResponse({ status: 204, description: 'Email config deleted' })
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.emailConfigService.remove(userId, id);
  }
}
