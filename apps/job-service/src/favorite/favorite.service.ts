import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoriteService {
  constructor(private prisma: PrismaService) {}

  async toggle(userId: string, jobPostId: string) {
    const existing = await this.prisma.jobFavorite.findUnique({
      where: { userId_jobPostId: { userId, jobPostId } },
    });

    if (existing) {
      await this.prisma.jobFavorite.delete({
        where: { id: existing.id },
      });
      return { favorited: false };
    }

    await this.prisma.jobFavorite.create({
      data: { userId, jobPostId },
    });
    return { favorited: true };
  }

  async list(userId: string) {
    return this.prisma.jobFavorite.findMany({
      where: { userId },
      include: {
        jobPost: {
          include: { company: true },
        },
      },
      orderBy: { savedAt: 'desc' },
    });
  }
}
