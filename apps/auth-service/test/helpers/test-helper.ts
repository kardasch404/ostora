import { PrismaClient } from '@prisma/client';
import { RedisService } from '../src/redis/redis.service';

export class TestHelper {
  static async cleanDatabase(prisma: PrismaClient) {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  }

  static async createTestUser(prisma: PrismaClient, overrides = {}) {
    return prisma.user.create({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        passwordHash: '$2b$10$' + 'a'.repeat(53),
        role: 'USER',
        isEmailVerified: true,
        ...overrides,
      },
    });
  }

  static async cleanRedis(redis: RedisService) {
    await redis.flushall();
  }

  static generateTestEmail() {
    return `test${Date.now()}@example.com`;
  }

  static async waitForCondition(
    condition: () => Promise<boolean>,
    timeout = 5000,
    interval = 100
  ): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    return false;
  }
}
