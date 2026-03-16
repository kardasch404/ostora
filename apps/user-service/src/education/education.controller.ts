import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EducationService } from './education.service';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Education')
@Controller('education')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EducationController {
  constructor(private educationService: EducationService) {}

  @Post()
  @ApiOperation({ summary: 'Add education entry' })
  @ApiResponse({ status: 201, description: 'Education created successfully' })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateEducationDto,
  ) {
    return this.educationService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all education entries' })
  @ApiResponse({ status: 200, description: 'Education list retrieved' })
  async findAll(@CurrentUser('userId') userId: string) {
    return this.educationService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get education entry by ID' })
  @ApiResponse({ status: 200, description: 'Education retrieved' })
  @ApiResponse({ status: 404, description: 'Education not found' })
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.educationService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update education entry' })
  @ApiResponse({ status: 200, description: 'Education updated successfully' })
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEducationDto,
  ) {
    return this.educationService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete education entry' })
  @ApiResponse({ status: 204, description: 'Education deleted successfully' })
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.educationService.remove(userId, id);
  }
}
