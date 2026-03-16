import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponse } from './dto/profile.response';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string): Promise<ProfileResponse> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        education: {
          orderBy: { startDate: 'desc' },
        },
        experience: {
          orderBy: { startDate: 'desc' },
        },
        skills: {
          orderBy: { name: 'asc' },
        },
        languages: {
          orderBy: { name: 'asc' },
        },
        socialLinks: {
          orderBy: { platform: 'asc' },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile as any;
  }

  async createProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileResponse> {
    const profile = await this.prisma.profile.create({
      data: {
        userId,
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    });

    return profile as any;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileResponse> {
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      update: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
      create: {
        userId,
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    });

    return profile as any;
  }

  async deleteProfile(userId: string): Promise<void> {
    await this.prisma.profile.delete({
      where: { userId },
    });
  }

  async getProfileCompleteness(userId: string): Promise<{ percentage: number; missing: string[] }> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        education: true,
        experience: true,
        skills: true,
        languages: true,
      },
    });

    if (!profile) {
      return { percentage: 0, missing: ['All fields'] };
    }

    const fields = [
      'firstName',
      'lastName',
      'phone',
      'bio',
      'avatar',
      'city',
      'country',
      'title',
      'company',
    ];

    const missing: string[] = [];
    let completed = 0;

    fields.forEach((field) => {
      if (profile[field]) {
        completed++;
      } else {
        missing.push(field);
      }
    });

    if (profile.education.length === 0) missing.push('education');
    else completed++;

    if (profile.experience.length === 0) missing.push('experience');
    else completed++;

    if (profile.skills.length === 0) missing.push('skills');
    else completed++;

    if (profile.languages.length === 0) missing.push('languages');
    else completed++;

    const total = fields.length + 4;
    const percentage = Math.round((completed / total) * 100);

    return { percentage, missing };
  }
}
