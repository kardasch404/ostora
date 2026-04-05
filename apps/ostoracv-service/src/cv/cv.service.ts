import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import axios from 'axios';
import { randomUUID } from 'node:crypto';
import { GenerateCvDto } from './dto/generate-cv.dto';
import { CvGenerationResponse } from './dto/cv-generation.response';
import { I18N_LABELS, RenderLang } from '../renderer/i18n-labels.config';
import { TemplateRegistryService } from '../renderer/template-registry.service';
import { PuppeteerService } from '../renderer/puppeteer.service';
import { S3Service } from '../storage/s3.service';

interface ProfilePayload {
  firstName?: string;
  lastName?: string;
  title?: string;
  bio?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  websiteUrl?: string;
  education?: Array<Record<string, any>>;
  experience?: Array<Record<string, any>>;
  skills?: Array<Record<string, any>>;
  languages?: Array<Record<string, any>>;
  socialLinks?: Array<Record<string, any>>;
  jobPreferences?: Record<string, any>;
}

@Injectable()
export class CvService {
  private readonly logger = new Logger(CvService.name);

  constructor(
    private readonly templateRegistry: TemplateRegistryService,
    private readonly puppeteerService: PuppeteerService,
    private readonly s3Service: S3Service,
  ) {}

  async generateCv(dto: GenerateCvDto, authorization?: string): Promise<CvGenerationResponse> {
    const lang = this.resolveLang(dto.lang);
    const templateName = this.resolveCvTemplate(dto.templateId);

    const profile = await this.loadUserProfile(dto.userId, authorization);

    const html = this.templateRegistry.render(templateName, {
      profile: this.normalizeProfile(profile),
      labels: I18N_LABELS[lang],
      generatedAt: new Date().toISOString(),
    });

    const pdf = await this.puppeteerService.renderPdf(html);
    const s3Key = this.s3Service.buildCvKey(dto.userId, lang);
    await this.s3Service.uploadPdf(s3Key, pdf);

    if (dto.bundleId) {
      await this.tryAttachToBundle(dto.bundleId, dto.userId, s3Key, authorization);
    }

    const downloadUrl = await this.s3Service.getSignedDownloadUrl(s3Key);

    return {
      downloadUrl,
      s3Key,
      generatedAt: new Date().toISOString(),
      templateId: dto.templateId,
      lang,
    };
  }

  private resolveLang(lang: string): RenderLang {
    if (lang === 'fr' || lang === 'de' || lang === 'en') {
      return lang;
    }
    throw new BadRequestException('lang must be one of fr, de, en');
  }

  private resolveCvTemplate(templateId: string): string {
    const normalized = templateId.toLowerCase().trim();
    if (normalized.startsWith('modern')) return 'modern-cv';
    if (normalized.startsWith('classic')) return 'classic-cv';
    if (normalized.startsWith('minimal')) return 'minimal-cv';

    throw new BadRequestException('templateId must start with modern, classic, or minimal');
  }

  private normalizeProfile(profile: ProfilePayload) {
    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Candidate';
    const experience = Array.isArray(profile.experience) && profile.experience.length > 0
      ? profile.experience
      : (Array.isArray(profile.jobPreferences?.workEntries) ? profile.jobPreferences?.workEntries : []);

    return {
      ...profile,
      fullName,
      experience,
      education: Array.isArray(profile.education) ? profile.education : [],
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      languages: Array.isArray(profile.languages) ? profile.languages : [],
      socialLinks: Array.isArray(profile.socialLinks) ? profile.socialLinks : [],
      id: randomUUID(),
    };
  }

  private async loadUserProfile(userId: string, authorization?: string): Promise<ProfilePayload> {
    const baseUrl = process.env.USER_SERVICE_URL || 'http://user-service:4719';
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;

    const candidates = [
      {
        url: `${baseUrl}/api/v1/internal/users/${userId}/full-profile`,
        headers: {
          ...(internalSecret ? { 'x-internal-secret': internalSecret } : {}),
          ...(authorization ? { authorization } : {}),
        },
      },
      {
        url: `${baseUrl}/api/v1/profile`,
        headers: {
          ...(authorization ? { authorization } : {}),
        },
      },
      {
        url: `${baseUrl}/api/v1/profile/${userId}`,
        headers: {
          ...(authorization ? { authorization } : {}),
        },
      },
    ];

    for (const endpoint of candidates) {
      try {
        const response = await axios.get(endpoint.url, { headers: endpoint.headers, timeout: 10000 });
        return response.data as ProfilePayload;
      } catch {
        // Continue until one endpoint works.
      }
    }

    throw new InternalServerErrorException('Failed to load user profile from user-service.');
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
        {
          userId,
          type: 'CV',
          key: s3Key,
        },
        {
          headers: {
            ...(authorization ? { authorization } : {}),
          },
          timeout: 10000,
        },
      );
    } catch (error) {
      this.logger.warn(`Bundle link skipped for bundleId=${bundleId}: ${String(error)}`);
    }
  }
}
