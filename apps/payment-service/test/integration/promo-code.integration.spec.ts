import { Test, TestingModule } from '@nestjs/testing';
import { PromoCodeService } from '../../src/promo-code/promo-code.service';
import { Plan } from '../../src/subscription/plan.enum';
import { PromoCodeType } from '../../src/promo-code/promo-code.enum';
import { PrismaClient } from '@prisma/client';

describe('PromoCode Integration Tests', () => {
  let service: PromoCodeService;
  let prisma: PrismaClient;
  let testAdminId: string;
  let testUserId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromoCodeService],
    }).compile();

    service = module.get<PromoCodeService>(PromoCodeService);
    prisma = new PrismaClient();

    // Create test admin
    const admin = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@ostora.com`,
        firstName: 'Admin',
        lastName: 'Test',
        password: 'hashed',
        role: 'ADMIN',
      },
    });
    testAdminId = admin.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `user-${Date.now()}@ostora.com`,
        firstName: 'User',
        lastName: 'Test',
        password: 'hashed',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.promoCodeUsage.deleteMany({ where: { userId: testUserId } });
    await prisma.promoCode.deleteMany({ where: { createdBy: testAdminId } });
    await prisma.subscription.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.user.delete({ where: { id: testAdminId } });
    await prisma.$disconnect();
  });

  describe('Generate Promo Code', () => {
    it('should generate gift code', async () => {
      const promoCode = await service.generatePromoCode(
        {
          plan: Plan.PREMIUM_MONTHLY,
          durationDays: 30,
          type: PromoCodeType.GIFT,
          maxUses: 1,
        },
        testAdminId,
      );

      expect(promoCode).toBeDefined();
      expect(promoCode.code).toMatch(/^GIFT-/);
      expect(promoCode.plan).toBe(Plan.PREMIUM_MONTHLY);
      expect(promoCode.durationDays).toBe(30);
      expect(promoCode.maxUses).toBe(1);
    });

    it('should generate custom code', async () => {
      const customCode = `TEST-${Date.now()}`;
      const promoCode = await service.generatePromoCode(
        {
          plan: Plan.PREMIUM_MONTHLY,
          durationDays: 30,
          type: PromoCodeType.MARKETING,
          customCode,
        },
        testAdminId,
      );

      expect(promoCode.code).toBe(customCode);
    });
  });

  describe('Redeem Promo Code', () => {
    it('should redeem valid code', async () => {
      const promoCode = await service.generatePromoCode(
        {
          plan: Plan.PREMIUM_MONTHLY,
          durationDays: 30,
          type: PromoCodeType.GIFT,
          maxUses: 1,
        },
        testAdminId,
      );

      const redemption = await service.redeemPromoCode(testUserId, {
        code: promoCode.code,
      });

      expect(redemption.success).toBe(true);
      expect(redemption.subscription.plan).toBe(Plan.PREMIUM_MONTHLY);
    });
  });

  describe('Validate Promo Code', () => {
    it('should validate existing code', async () => {
      const promoCode = await service.generatePromoCode(
        {
          plan: Plan.PREMIUM_MONTHLY,
          durationDays: 30,
          type: PromoCodeType.GIFT,
          maxUses: 1,
        },
        testAdminId,
      );

      const isValid = await service.validatePromoCode(promoCode.code);
      expect(isValid).toBe(true);
    });

    it('should return false for non-existent code', async () => {
      const isValid = await service.validatePromoCode('INVALID-CODE');
      expect(isValid).toBe(false);
    });
  });
});
