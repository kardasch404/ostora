import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';

@Injectable()
export class EducationService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateEducationDto) {
    // Ensure profile exists
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found. Create profile first.');
    }

    return this.prisma.education.create({
      data: {
        profileId: profile.id,
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async findAll(userId: string) {
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

    return profile.education;
  }

  async findOne(userId: string, id: string) {
    const education = await this.prisma.education.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!education) {
      throw new NotFoundException('Education not found');
    }

    if (education.profile.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return education;
  }

  async update(userId: string, id: string, dto: UpdateEducationDto) {
    await this.findOne(userId, id);

    return this.prisma.education.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.education.delete({
      where: { id },
    });
  }
}
