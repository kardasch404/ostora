import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponse } from './dto/profile.response';
import { S3Service } from '../bundle/s3.service';

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async generateProfileMediaUploadUrl(
    userId: string,
    filename: string,
    mimeType: string,
    kind: 'avatar' | 'cover',
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.includes(mimeType)) {
      throw new BadRequestException('Unsupported image type. Use jpg, png, webp, or gif.');
    }

    const timestamp = Date.now();
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `users/${userId}/profile/${kind}/${timestamp}-${sanitized}`;
    const { uploadUrl } = await this.s3Service.generatePresignedUploadUrl(key, mimeType);

    return {
      uploadUrl,
      key,
      publicUrl: this.s3Service.getPublicUrl(key),
    };
  }

  async getProfile(userId: string): Promise<ProfileResponse> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        education: {
          orderBy: { startDate: 'desc' },
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

    const total = fields.length + 1;
    const percentage = Math.round((completed / total) * 100);

    return { percentage, missing };
  }
}
