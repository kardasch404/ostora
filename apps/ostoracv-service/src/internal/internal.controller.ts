import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CoverLetterService } from '../cover-letter/cover-letter.service';
import { GenerateCoverLetterDto } from '../cover-letter/dto/generate-cover-letter.dto';
import { CvGenerationResponse } from '../cv/dto/cv-generation.response';
import { InternalAuthGuard } from './internal-auth.guard';

class InternalRenderCoverLetterDto extends GenerateCoverLetterDto {
  generatedText!: string;
}

@ApiTags('Internal')
@Controller('internal')
@UseGuards(InternalAuthGuard)
export class InternalController {
  constructor(private readonly coverLetterService: CoverLetterService) {}

  @Post('render-cover-letter')
  @ApiOperation({ summary: 'Internal endpoint for ai-service to render already generated text into PDF' })
  async renderCoverLetter(
    @Body() dto: InternalRenderCoverLetterDto,
    @Headers('authorization') authorization?: string,
  ): Promise<CvGenerationResponse> {
    return this.coverLetterService.renderFromInternalPayload(dto, dto.generatedText, authorization);
  }
}
