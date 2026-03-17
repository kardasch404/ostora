import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSocialLinkDto } from './dto/create-social-link.dto';
import { UpdateSocialLinkDto } from './dto/update-social-link.dto';
import { SocialLinkResponse } from './dto/social-link.response';

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateSocialLinkDto): Promise<SocialLinkResponse> {
    // Check if platform already exists for this user
    const existing = await this.prisma.userSocialLink.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: dto.platform,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Social link for ${dto.platform} already exists`);
    }

    return await this.prisma.userSocialLink.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async findAll(userId: string): Promise<SocialLinkResponse[]> {
    return await this.prisma.userSocialLink.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string): Promise<SocialLinkResponse> {
    const socialLink = await this.prisma.userSocialLink.findUnique({
      where: { id },
    });

    if (!socialLink) {
      throw new NotFoundException('Social link not found');
    }

    if (socialLink.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return socialLink;
  }

  async update(userId: string, id: string, dto: UpdateSocialLinkDto): Promise<SocialLinkResponse> {
    await this.findOne(userId, id);

    return await this.prisma.userSocialLink.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);

    await this.prisma.userSocialLink.delete({
      where: { id },
    });
  }
}
