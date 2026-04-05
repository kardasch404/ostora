import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import axios from 'axios';
import { CvGenerationResponse } from '../cv/dto/cv-generation.response';
import { GenerateCoverLetterDto, CoverLetterMode } from './dto/generate-cover-letter.dto';
import { I18N_LABELS, RenderLang } from '../renderer/i18n-labels.config';
import { TemplateRegistryService } from '../renderer/template-registry.service';
import { PuppeteerService } from '../renderer/puppeteer.service';
import { S3Service } from '../storage/s3.service';

@Injectable()
export class CoverLetterService {
  private readonly logger = new Logger(CoverLetterService.name);

  constructor(
    private readonly templateRegistry: TemplateRegistryService,
    private readonly puppeteerService: PuppeteerService,
    private readonly s3Service: S3Service,
  ) {}

  async generate(dto: GenerateCoverLetterDto, authorization?: string): Promise<CvGenerationResponse> {
    const lang = dto.lang as RenderLang;
    const templateId = `cover-letter-${lang}`;

    const profile = await this.loadProfile(dto.userId, authorization);
    const bodyText = dto.mode === CoverLetterMode.AI_ASSISTED
      ? await this.resolveAiBody(dto, profile, authorization)
      : this.resolveTemplateOnlyBody(dto, profile);

    const html = this.templateRegistry.render(templateId, {
      profile,
      labels: I18N_LABELS[lang],
      payload: dto,
      bodyParagraphs: bodyText.split(/\n\s*\n/g).map((line) => line.trim()).filter(Boolean),
      generatedAt: new Date().toISOString(),
    });

    const pdf = await this.puppeteerService.renderPdf(html);
    const s3Key = this.s3Service.buildCoverLetterKey(dto.userId, lang);
    await this.s3Service.uploadPdf(s3Key, pdf);

    if (dto.bundleId) {
      await this.tryAttachToBundle(dto.bundleId, dto.userId, s3Key, authorization);
    }

    return {
      downloadUrl: await this.s3Service.getSignedDownloadUrl(s3Key),
      s3Key,
      generatedAt: new Date().toISOString(),
      templateId,
      lang,
    };
  }

  async renderFromInternalPayload(
    dto: GenerateCoverLetterDto,
    aiText: string,
    authorization?: string,
  ): Promise<CvGenerationResponse> {
    const profile = await this.loadProfile(dto.userId, authorization);
    const lang = dto.lang as RenderLang;
    const templateId = `cover-letter-${lang}`;

    const html = this.templateRegistry.render(templateId, {
      profile,
      labels: I18N_LABELS[lang],
      payload: dto,
      bodyParagraphs: aiText.split(/\n\s*\n/g).map((line) => line.trim()).filter(Boolean),
      generatedAt: new Date().toISOString(),
    });

    const pdf = await this.puppeteerService.renderPdf(html);
    const s3Key = this.s3Service.buildCoverLetterKey(dto.userId, lang);
    await this.s3Service.uploadPdf(s3Key, pdf);

    return {
      downloadUrl: await this.s3Service.getSignedDownloadUrl(s3Key),
      s3Key,
      generatedAt: new Date().toISOString(),
      templateId,
      lang,
    };
  }

  private resolveTemplateOnlyBody(dto: GenerateCoverLetterDto, profile: any): string {
    if (dto.customText && dto.customText.trim().length > 0) {
      return dto.customText.trim();
    }

    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Candidate';
    const title = dto.jobTitle || profile.title || 'the role';
    const company = dto.companyName || 'your company';

    return [
      `Dear Hiring Team at ${company},`,
      `I am ${fullName}, and I am excited to apply for ${title}.`,
      `My background in backend and full-stack development allows me to contribute quickly and deliver reliable results.`,
      'Thank you for your time and consideration.',
      'Kind regards,',
      fullName,
    ].join('\n\n');
  }

  private async resolveAiBody(dto: GenerateCoverLetterDto, profile: any, authorization?: string): Promise<string> {
    if (dto.customText && dto.customText.trim().length > 0) {
      return dto.customText.trim();
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://ai-service:4723';
    const aiEndpoint = process.env.AI_SERVICE_COVER_LETTER_ENDPOINT || '/api/v1/ai/cover-letter';

    try {
      const response = await axios.post(
        `${aiServiceUrl}${aiEndpoint}`,
        {
          userId: dto.userId,
          lang: dto.lang,
          jobTitle: dto.jobTitle,
          companyName: dto.companyName,
          tone: dto.tone,
          profile,
        },
        {
          headers: {
            ...(authorization ? { authorization } : {}),
            ...(process.env.INTERNAL_SERVICE_SECRET
              ? { 'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET }
              : {}),
          },
          timeout: 20000,
        },
      );

      const generatedText = String(response?.data?.text || '').trim();
      if (generatedText.length > 0) {
        return generatedText;
      }

      throw new Error('AI service returned an empty cover letter text.');
    } catch (error) {
      this.logger.warn(`AI-assisted mode fallback to template-only text: ${String(error)}`);
      return this.resolveTemplateOnlyBody(dto, profile);
    }
  }

  private async loadProfile(userId: string, authorization?: string): Promise<any> {
    const baseUrl = process.env.USER_SERVICE_URL || 'http://user-service:4719';

    const candidates = [
      `${baseUrl}/api/v1/profile`,
      `${baseUrl}/api/v1/profile/${userId}`,
    ];

    for (const url of candidates) {
      try {
        const response = await axios.get(url, {
          headers: {
            ...(authorization ? { authorization } : {}),
          },
          timeout: 10000,
        });
        return response.data;
      } catch {
        // Continue trying other endpoint forms.
      }
    }

    throw new InternalServerErrorException('Could not load user profile for cover letter generation.');
  }

  private async tryAttachToBundle(
    bundleId: string,
    userId: string,
    s3Key: string,
    authorization?: string,
  ): Promise<void> {
    const baseUrl = process.env.USER_SERVICE_URL || 'http://user-service:4719';

    try {
      await axios.post(
        `${baseUrl}/api/v1/bundles/${bundleId}/documents`,
        { userId, type: 'COVER_LETTER', key: s3Key },
        {
          headers: {
            ...(authorization ? { authorization } : {}),
          },
          timeout: 10000,
        },
      );
    } catch (error) {
      this.logger.warn(`Cover letter bundle link skipped for bundleId=${bundleId}: ${String(error)}`);
    }
  }
}
