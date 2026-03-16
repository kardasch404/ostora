import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UpdateProfileSettingsDto } from './dto/update-profile-settings.dto';
import { ProfileSettingsResponse, ProfileCompletenessResponse } from './dto/profile-settings.response';

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
    // This would integrate with scraping-service
    // For now, return a placeholder
    throw new Error('LinkedIn import not yet implemented - requires scraping-service integration');
  }
}
