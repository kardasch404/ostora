import { Test, TestingModule } from '@nestjs/testing';
import { PromoCodeService } from '../../src/promo-code/promo-code.service';
import { Plan } from '../../src/subscription/plan.enum';
import { PromoCodeType, PromoCodeStatus } from '../../src/promo-code/promo-code.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PromoCodeService Unit Tests', () => {
  let service: PromoCodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromoCodeService],
    }).compile();

    service = module.get<PromoCodeService>(PromoCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCode', () => {
    it('should generate GIFT code with correct prefix', () => {
      const code = service['generateCode'](PromoCodeType.GIFT);
      expect(code).toMatch(/^GIFT-[A-Z0-9]{8}$/);
    });

    it('should generate REF code with correct prefix', () => {
      const code = service['generateCode'](PromoCodeType.REFERRAL);
      expect(code).toMatch(/^REF-[A-Z0-9]{8}$/);
    });

    it('should generate PROMO code with correct prefix', () => {
      const code = service['generateCode'](PromoCodeType.MARKETING);
      expect(code).toMatch(/^PROMO-[A-Z0-9]{8}$/);
    });

    it('should generate PARTNER code with correct prefix', () => {
      const code = service['generateCode'](PromoCodeType.PARTNER);
      expect(code).toMatch(/^PARTNER-[A-Z0-9]{8}$/);
    });
  });

  describe('validatePromoCode', () => {
    it('should throw error for disabled code', () => {
      const promoCode = {
        status: PromoCodeStatus.DISABLED,
        expiresAt: null,
        usedCount: 0,
        maxUses: 1,
      };

      expect(() => service['validatePromoCode'](promoCode)).toThrow(
        BadRequestException,
      );
    });

    it('should throw error for expired code', () => {
      const promoCode = {
        status: PromoCodeStatus.ACTIVE,
        expiresAt: new Date('2020-01-01'),
        usedCount: 0,
        maxUses: 1,
      };

      expect(() => service['validatePromoCode'](promoCode)).toThrow(
        BadRequestException,
      );
    });

    it('should throw error for depleted code', () => {
      const promoCode = {
        status: PromoCodeStatus.ACTIVE,
        expiresAt: null,
        usedCount: 5,
        maxUses: 5,
      };

      expect(() => service['validatePromoCode'](promoCode)).toThrow(
        BadRequestException,
      );
    });

    it('should pass validation for valid code', () => {
      const promoCode = {
        status: PromoCodeStatus.ACTIVE,
        expiresAt: new Date('2099-12-31'),
        usedCount: 0,
        maxUses: 1,
      };

      expect(() => service['validatePromoCode'](promoCode)).not.toThrow();
    });
  });
});
