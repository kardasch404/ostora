import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CvService } from './cv.service';
import { GenerateCvDto } from './dto/generate-cv.dto';
import { CvGenerationResponse } from './dto/cv-generation.response';

@ApiTags('OstorCV')
@Controller('ostoracv')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post('generate-cv')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate CV PDF from HTML template' })
  async generateCv(
    @Body() dto: GenerateCvDto,
    @Headers('authorization') authorization?: string,
  ): Promise<CvGenerationResponse> {
    return this.cvService.generateCv(dto, authorization);
  }
}
