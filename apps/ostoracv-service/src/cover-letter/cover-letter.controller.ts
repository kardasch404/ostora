import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CoverLetterService } from './cover-letter.service';
import { GenerateCoverLetterDto } from './dto/generate-cover-letter.dto';
import { CvGenerationResponse } from '../cv/dto/cv-generation.response';

@ApiTags('OstorCV')
@Controller('ostoracv')
export class CoverLetterController {
  constructor(private readonly coverLetterService: CoverLetterService) {}

  @Post('generate-cover-letter')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate cover letter PDF (template-only or AI-assisted)' })
  async generateCoverLetter(
    @Body() dto: GenerateCoverLetterDto,
    @Headers('authorization') authorization?: string,
  ): Promise<CvGenerationResponse> {
    return this.coverLetterService.generate(dto, authorization);
  }
}
