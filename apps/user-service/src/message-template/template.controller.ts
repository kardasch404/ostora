import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessageTemplateService } from './template.service';
import { CreateMessageTemplateDto } from './dto/create-template.dto';
import { UpdateMessageTemplateDto } from './dto/update-template.dto';
import { RenderTemplateDto } from './dto/render-template.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Message Templates')
@Controller('message-templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessageTemplateController {
  constructor(private templateService: MessageTemplateService) {}

  @Post()
  @ApiOperation({ summary: 'Create message template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Template limit reached' })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateMessageTemplateDto,
  ) {
    return this.templateService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all templates (user + defaults)' })
  @ApiQuery({ name: 'language', required: false })
  @ApiResponse({ status: 200, description: 'Templates retrieved' })
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query('language') language?: string,
  ) {
    return this.templateService.findAll(userId, language);
  }

  @Get('defaults')
  @ApiOperation({ summary: 'Get Ostora default templates' })
  @ApiResponse({ status: 200, description: 'Default templates retrieved' })
  async getDefaults() {
    return this.templateService.getDefaultTemplates();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({ status: 200, description: 'Template retrieved' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.templateService.findOne(userId, id);
  }

  @Post(':id/render')
  @ApiOperation({ summary: 'Render template with context' })
  @ApiResponse({ status: 200, description: 'Template rendered' })
  async render(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() context: RenderTemplateDto,
  ) {
    return this.templateService.render(userId, id, context);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update template' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  @ApiResponse({ status: 400, description: 'Cannot modify default templates' })
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMessageTemplateDto,
  ) {
    return this.templateService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete template' })
  @ApiResponse({ status: 204, description: 'Template deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete default templates' })
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.templateService.remove(userId, id);
  }
}
