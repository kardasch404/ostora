import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import { dirname, resolve } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UpdateProfileSettingsDto } from './dto/update-profile-settings.dto';
import { ProfileSettingsResponse, ProfileCompletenessResponse } from './dto/profile-settings.response';

const execFileAsync = promisify(execFile);

interface LinkedInImportPayload {
  linkedInUrl?: string;
  scrapedData?: ScrapedResult;
}

interface ScrapedProfile {
  name?: string;
  title?: string;
  location?: string;
}

interface ScrapedExperience {
  position?: string;
  company?: string;
}

interface ScrapedEducation {
  school?: string;
  degree?: string;
}

interface ScrapedResult {
  url?: string;
  profile?: ScrapedProfile;
  experience?: ScrapedExperience[];
  education?: ScrapedEducation[];
  error?: string;
}

interface ScraperRunOptions {
  fastMode?: boolean;
}

function parseNameFromLinkedInUrl(linkedInUrl: string): { firstName: string; lastName: string } {
  try {
    const { pathname } = new URL(linkedInUrl);
    const slug = pathname
      .split('/')
      .filter(Boolean)
      .pop()
      ?.replace(/[-_]+/g, ' ')
      .replace(/\d+/g, '')
      .trim() || '';

    const parts = slug
      .split(/\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());

    if (parts.length === 0) {
      return { firstName: '', lastName: '' };
    }

    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ').trim(),
    };
  } catch {
    return { firstName: '', lastName: '' };
  }
}

@Injectable()
export class ProfileSettingsService {
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'profile:completeness:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getOrCreateSettings(userId: string): Promise<ProfileSettingsResponse> {
    let settings = await this.prisma.profileSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.profileSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  async updateSettings(userId: string, dto: UpdateProfileSettingsDto): Promise<ProfileSettingsResponse> {
    // Invalidate cache when settings are updated
    await this.invalidateCompletenessCache(userId);

    const settings = await this.prisma.profileSettings.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        ...dto,
      },
    });

    return settings;
  }

  async calculateCompleteness(userId: string): Promise<ProfileCompletenessResponse> {
    // Check cache first
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch all profile data
    const [profile, settings, education, experience, skills, languages, socialLinks] = await Promise.all([
      this.prisma.profile.findUnique({ where: { userId } }),
      this.prisma.profileSettings.findUnique({ where: { userId } }),
      this.prisma.education.findMany({ where: { profile: { userId } } }),
      this.prisma.experience.findMany({ where: { profile: { userId } } }),
      this.prisma.skill.findMany({ where: { profile: { userId } } }),
      this.prisma.language.findMany({ where: { profile: { userId } } }),
      this.prisma.userSocialLink.findMany({ where: { userId } }),
    ]);

    const fields = {
      // Profile basic info (20 points)
      firstName: profile?.firstName ? 2 : 0,
      lastName: profile?.lastName ? 2 : 0,
      phone: profile?.phone ? 2 : 0,
      bio: profile?.bio ? 3 : 0,
      avatar: profile?.avatar ? 2 : 0,
      birthDate: profile?.birthDate ? 2 : 0,
      
      // Address (10 points)
      city: profile?.city ? 2 : 0,
      country: profile?.country ? 3 : 0,
      address: profile?.address ? 2 : 0,
      postalCode: profile?.postalCode ? 2 : 0,
      location: profile?.location ? 1 : 0,
      
      // Professional info (20 points)
      title: profile?.title ? 3 : 0,
      company: profile?.company ? 2 : 0,
      industry: profile?.industry ? 3 : 0,
      experienceYears: profile?.experienceYears ? 2 : 0,
      salary: profile?.salary ? 2 : 0,
      
      // URLs (10 points)
      linkedinUrl: profile?.linkedinUrl ? 3 : 0,
      githubUrl: profile?.githubUrl ? 2 : 0,
      portfolioUrl: profile?.portfolioUrl ? 3 : 0,
      websiteUrl: profile?.websiteUrl ? 2 : 0,
      
      // Profile settings (15 points)
      jobSearchStatus: settings?.jobSearchStatus ? 3 : 0,
      desiredSalary: settings?.desiredSalary ? 2 : 0,
      desiredContractType: settings?.desiredContractType ? 2 : 0,
      desiredLocations: settings?.desiredLocations?.length ? 3 : 0,
      remotePreference: settings?.remotePreference ? 2 : 0,
      visibility: settings?.visibility ? 3 : 0,
      
      // Education (10 points)
      education: education.length > 0 ? 10 : 0,
      
      // Experience (10 points)
      experience: experience.length > 0 ? 10 : 0,
      
      // Skills (5 points)
      skills: skills.length >= 3 ? 5 : skills.length > 0 ? 3 : 0,
      
      // Languages (5 points)
      languages: languages.length >= 2 ? 5 : languages.length > 0 ? 3 : 0,
      
      // Social links (5 points)
      socialLinks: socialLinks.length >= 2 ? 5 : socialLinks.length > 0 ? 3 : 0,
    };

    const totalScore = Object.values(fields).reduce((sum, val) => sum + val, 0);
    const maxScore = 110; // Total possible points
    const percentage = Math.round((totalScore / maxScore) * 100);

    const completedFields = Object.keys(fields).filter(key => fields[key] > 0);
    const missingFields = Object.keys(fields).filter(key => fields[key] === 0);

    const result: ProfileCompletenessResponse = {
      score: totalScore,
      percentage: `${percentage}%`,
      completedFields,
      missingFields,
    };

    // Cache the result
    await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);

    return result;
  }

  async invalidateCompletenessCache(userId: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    await this.redis.del(cacheKey);
  }

  async importFromLinkedIn(userId: string, linkedInData: any): Promise<any> {
    const payload = linkedInData as LinkedInImportPayload;
    const linkedInUrl = String(payload?.linkedInUrl || payload?.scrapedData?.url || '').trim();

    if (!linkedInUrl) {
      throw new BadRequestException('linkedInUrl is required.');
    }

    if (!linkedInUrl.includes('linkedin.com')) {
      throw new BadRequestException('Please provide a valid LinkedIn URL.');
    }

    let scraped: ScrapedResult | null = null;
    let fallbackMode = false;
    let fallbackReason = '';

    if (payload.scrapedData && typeof payload.scrapedData === 'object') {
      scraped = payload.scrapedData;
      if (this.isLikelyLinkedInChallenge(scraped)) {
        fallbackMode = true;
        fallbackReason = 'Provided scraped payload appears to be a LinkedIn security verification page.';
      }
    }

    if (!scraped || fallbackMode) {
      try {
        if (!scraped) {
          let lastAttemptError = 'Unable to extract profile data from LinkedIn.';

          const attempts: Array<{ fastMode: boolean; label: string }> = [
            { fastMode: true, label: 'fast attempt' },
            { fastMode: false, label: 'deep attempt' },
          ];

          for (const attempt of attempts) {
            const candidate = await this.runLinkedInScraper(linkedInUrl, { fastMode: attempt.fastMode });

            if (candidate.error) {
              lastAttemptError = `${attempt.label} failed: ${candidate.error}`;
              continue;
            }

            if (this.isLikelyLinkedInChallenge(candidate)) {
              lastAttemptError = `${attempt.label} blocked by LinkedIn security verification.`;
              continue;
            }

            const hasNoSectionData = (candidate.experience || []).length === 0 && (candidate.education || []).length === 0;
            if (attempt.fastMode && hasNoSectionData) {
              lastAttemptError = `${attempt.label} returned no work/education data.`;
              continue;
            }

            scraped = candidate;
            break;
          }

          if (!scraped) {
            throw new Error(lastAttemptError);
          }
        }
      } catch (error) {
        fallbackMode = true;
        fallbackReason = error instanceof Error ? error.message : 'Unknown scraper error';
        const parsedName = parseNameFromLinkedInUrl(linkedInUrl);
        scraped = {
          url: linkedInUrl,
          profile: {
            name: [parsedName.firstName, parsedName.lastName].filter(Boolean).join(' ').trim(),
            title: '',
            location: '',
          },
          experience: [],
          education: [],
        };
      }
    }

    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { jobPreferences: true },
    });

    const fullName = String(scraped?.profile?.name || '').trim();
    const [firstName = '', ...rest] = fullName.split(/\s+/);
    const lastName = rest.join(' ').trim();

    const location = String(scraped?.profile?.location || '').trim();
    const [city = '', country = ''] = location.split(',').map((part) => part.trim());

    const profile = await this.prisma.profile.upsert({
      where: { userId },
      update: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        title: String(scraped?.profile?.title || '').trim() || undefined,
        location: location || undefined,
        city: city || undefined,
        country: country || undefined,
        linkedinUrl: linkedInUrl,
      },
      create: {
        userId,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        title: String(scraped?.profile?.title || '').trim() || undefined,
        location: location || undefined,
        city: city || undefined,
        country: country || undefined,
        linkedinUrl: linkedInUrl,
      },
    });

    const educationItems = (scraped?.education || [])
      .map((entry) => ({
        institution: String(entry.school || '').trim(),
        degree: String(entry.degree || '').trim() || 'Degree',
      }))
      .filter((entry) => entry.institution.length > 0);

    const experienceItems = (scraped?.experience || [])
      .map((entry) => ({
        title: String(entry.position || '').trim(),
        company: String(entry.company || '').trim() || 'Unknown company',
      }))
      .filter((entry) => entry.title.length > 0);
    const importWarnings: string[] = [];

    const previousPrefs =
      existingProfile?.jobPreferences && typeof existingProfile.jobPreferences === 'object'
        ? (existingProfile.jobPreferences as Record<string, unknown>)
        : {};

    const frontEndWorkEntries = experienceItems.map((entry, index) => ({
      id: `linkedin-${index + 1}`,
      role: entry.title,
      company: entry.company,
      startDate: '2000-01-01',
      endDate: '',
      current: false,
      summary: '',
    }));

    const jobPreferencesPayload: Record<string, unknown> = {
      ...previousPrefs,
      ...(frontEndWorkEntries.length > 0 ? { workEntries: frontEndWorkEntries } : {}),
    };

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: {
        title: String(scraped?.profile?.title || '').trim() || experienceItems[0]?.title || undefined,
        company: experienceItems[0]?.company || undefined,
        jobPreferences: Object.keys(jobPreferencesPayload).length > 0 ? jobPreferencesPayload : undefined,
      },
    });

    if (educationItems.length > 0) {
      await this.prisma.education.deleteMany({ where: { profileId: profile.id } });
      await this.prisma.education.createMany({
        data: educationItems.map((entry) => ({
          profileId: profile.id,
          institution: entry.institution,
          degree: entry.degree,
          startDate: new Date('2000-01-01'),
          current: false,
        })),
      });
    }

    if (experienceItems.length > 0) {
      try {
        await this.prisma.experience.deleteMany({ where: { profileId: profile.id } });
        await this.prisma.experience.createMany({
          data: experienceItems.map((entry) => ({
            profileId: profile.id,
            title: entry.title,
            company: entry.company,
            startDate: new Date('2000-01-01'),
            current: false,
          })),
        });
      } catch (expErr: any) {
        // Some environments don't have the legacy experience table yet.
        if (this.isMissingPrismaTableError(expErr, 'experience')) {
          importWarnings.push('Experience table is missing in DB; work entries were saved in jobPreferences only.');
        } else {
          throw expErr;
        }
      }
    }

    await this.invalidateCompletenessCache(userId);

    return {
      success: true,
      mode: fallbackMode ? 'fallback' : 'scraped',
      ...(fallbackMode ? { modeReason: fallbackReason } : {}),
      ...(importWarnings.length > 0 ? { warnings: importWarnings } : {}),
      linkedInUrl,
      sections: {
        personal: {
          firstName,
          lastName,
          title: String(scraped?.profile?.title || '').trim(),
          location,
          linkedinUrl: linkedInUrl,
        },
        education: educationItems.map((entry) => ({
          institution: entry.institution,
          degree: entry.degree,
        })),
        work: experienceItems.map((entry) => ({
          role: entry.title,
          company: entry.company,
        })),
        demographic: {
          city,
          country,
        },
      },
    };
  }

  private getScraperScriptPath(): string {
    const configuredPath = process.env['LINKEDIN_SCRAPER_SCRIPT_PATH'];
    const candidates = [
      configuredPath,
      resolve(process.cwd(), 'apps/scraping-service/src/scrape_profil.py'),
      resolve(process.cwd(), '../scraping-service/src/scrape_profil.py'),
    ].filter((item): item is string => Boolean(item));

    const found = candidates.find((filePath) => existsSync(filePath));
    if (!found) {
      throw new InternalServerErrorException('Could not locate scrape_profil.py script. Set LINKEDIN_SCRAPER_SCRIPT_PATH.');
    }

    return found;
  }

  private async runLinkedInScraper(linkedInUrl: string, options: ScraperRunOptions = {}): Promise<ScrapedResult> {
    const scriptPath = this.getScraperScriptPath();
    const scriptDir = dirname(scriptPath);
    const pythonCommand = process.env['LINKEDIN_SCRAPER_PYTHON_CMD'] || 'python';
    const parsedTimeout = Number(process.env['LINKEDIN_SCRAPER_TIMEOUT_MS'] || '90000');
    const scraperTimeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 90000;
    const args = [scriptPath, linkedInUrl, '--json-only', '--auto-session', '--non-interactive', '--headless'];

    if (options.fastMode !== false) {
      args.push('--fast');
    }

    try {
      const { stdout, stderr } = await execFileAsync(
        pythonCommand,
        args,
        {
          cwd: scriptDir,
          timeout: scraperTimeoutMs,
          maxBuffer: 1024 * 1024 * 8,
        },
      );

      const parsed = this.extractJsonFromOutput(stdout || stderr || '');
      if (parsed.error) {
        return parsed;
      }

      return parsed;
    } catch (error: any) {
      const rawOutput = `${error?.stdout || ''}\n${error?.stderr || ''}`.trim();
      const parsed = this.extractJsonFromOutput(rawOutput);
      if (!parsed.error) {
        return parsed;
      }

      throw new InternalServerErrorException(
        `Failed to execute LinkedIn scraper: ${rawOutput || error?.message || 'Unknown error'}`,
      );
    }
  }

  private extractJsonFromOutput(rawOutput: string): ScrapedResult {
    const lines = rawOutput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const candidate = lines[i];
      if (!candidate.startsWith('{') || !candidate.endsWith('}')) {
        continue;
      }

      try {
        return JSON.parse(candidate) as ScrapedResult;
      } catch {
        // Continue scanning previous lines.
      }
    }

    return {
      error: rawOutput || 'Scraper did not return valid JSON.',
    };
  }

  private isLikelyLinkedInChallenge(scraped: ScrapedResult): boolean {
    const name = String(scraped.profile?.name || '').toLowerCase();
    const title = String(scraped.profile?.title || '').toLowerCase();
    const location = String(scraped.profile?.location || '').toLowerCase();

    const challengeHints = ['security verification', 'sign in', 'user agreement', 'privacy policy'];
    const text = `${name} ${title} ${location}`;

    const hasChallengeText = challengeHints.some((hint) => text.includes(hint));
    const hasNoSectionData = (scraped.experience || []).length === 0 && (scraped.education || []).length === 0;

    return hasChallengeText && hasNoSectionData;
  }

  private isMissingPrismaTableError(error: any, tableName: string): boolean {
    const message = String(error?.message || '').toLowerCase();
    return message.includes('does not exist') && message.includes(tableName.toLowerCase());
  }
}
