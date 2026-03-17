import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        jobPosts: {
          where: { isActive: true },
          take: 10,
          orderBy: { postedAt: 'desc' },
        },
      },
    });
  }

  async findByName(name: string) {
    return this.prisma.company.findUnique({
      where: { name },
    });
  }
}
