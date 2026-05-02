import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { RedeemPromoCodeDto } from './dto/redeem-promo-code.dto';
import { PromoCodeStatus, PromoCodeType } from './promo-code.enum';
import { Plan } from '../../subscription/plan.enum';
import { SubscriptionStatus } from '../../subscription/subscription-status.enum';

interface PromoCodeResponse {
  id: string;
  code: string;
  plan: Plan;
  durationDays: number;
  type: PromoCodeType;
  status: PromoCodeStatus;
  maxUses: number;
  usedCount: number;
  expiresAt: Date | null;
  createdAt: Date;
}

interface RedemptionResponse {
  success: boolean;
  subscription: {
    id: string;
    plan: Plan;
    status: SubscriptionStatus;
    expiresAt: Date;
  };
  promoCode: {
    code: string;
    type: PromoCodeType;
  };
}

@Injectable()
export class PromoCodeService {
  private prisma = new PrismaClient() as any;

  private get promoCodeStore() {
    const store = this.prisma?.promoCode;
    return store && typeof store.findUnique === 'function' ? store : null;
  }

  private get promoCodeUsageStore() {
    const store = this.prisma?.promoCodeUsage;
    return store && typeof store.findFirst === 'function' ? store : null;
  }

  private assertPromoStorageConfigured(): void {
    if (!this.promoCodeStore || !this.promoCodeUsageStore) {
      throw new BadRequestException('Promo code storage is not configured');
    }
  }

  private isPromoStorageError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const message = error.message.toLowerCase();
    return (
      message.includes('promocode') ||
      message.includes('promo_code') ||
      message.includes('table') ||
      message.includes('does not exist')
    );
  }

  async generatePromoCode(dto: CreatePromoCodeDto, adminId: string): Promise<PromoCodeResponse> {
    this.assertPromoStorageConfigured();

    const code = dto.customCode || this.generateCode(dto.type);

    if (dto.customCode) {
      const existing = await this.promoCodeStore.findUnique({
        where: { code: dto.customCode },
      });
      if (existing) {
        throw new BadRequestException('Promo code already exists');
      }
    }

    const expiresAt = dto.expiresAt 
      ? new Date(dto.expiresAt)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const promoCode = await this.promoCodeStore.create({
      data: {
        code,
        plan: dto.plan,
        durationDays: dto.durationDays,
        type: dto.type,
        status: PromoCodeStatus.ACTIVE,
        maxUses: dto.maxUses || 1,
        usedCount: 0,
        expiresAt,
        description: dto.description,
        createdBy: adminId,
      },
    });

    return this.mapToResponse(promoCode);
  }

  async redeemPromoCode(userId: string, dto: RedeemPromoCodeDto): Promise<RedemptionResponse> {
    this.assertPromoStorageConfigured();

    const code = dto.code.toUpperCase();

    const promoCode = await this.promoCodeStore.findUnique({
      where: { code },
    });

    if (!promoCode) {
      throw new NotFoundException('Promo code not found');
    }

    this.assertPromoCodeValid(promoCode);

    const existingUsage = await this.promoCodeUsageStore.findFirst({
      where: {
        userId,
        promoCodeId: promoCode.id,
      },
    });

    if (existingUsage) {
      throw new BadRequestException('You have already used this promo code');
    }

    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      },
    });

    if (activeSubscription && activeSubscription.plan !== Plan.FREE) {
      throw new BadRequestException('You already have an active subscription');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + promoCode.durationDays * 24 * 60 * 60 * 1000);

    const subscription = await this.prisma.subscription.upsert({
      where: { id: `${userId}:${promoCode.plan}` },
      create: {
        userId,
        plan: promoCode.plan,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: expiresAt,
        cancelAtPeriodEnd: false,
        promoCodeId: promoCode.id,
      },
      update: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: expiresAt,
        cancelAtPeriodEnd: false,
        promoCodeId: promoCode.id,
      },
    });

    await this.promoCodeUsageStore.create({
      data: {
        userId,
        promoCodeId: promoCode.id,
        redeemedAt: now,
      },
    });

    await this.promoCodeStore.update({
      where: { id: promoCode.id },
      data: {
        usedCount: { increment: 1 },
        status: promoCode.usedCount + 1 >= promoCode.maxUses 
          ? PromoCodeStatus.DEPLETED 
          : promoCode.status,
      },
    });

    return {
      success: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan as Plan,
        status: subscription.status as SubscriptionStatus,
        expiresAt: subscription.currentPeriodEnd,
      },
      promoCode: {
        code: promoCode.code,
        type: promoCode.type,
      },
    };
  }

  async validatePromoCode(code: string): Promise<boolean> {
    if (!this.promoCodeStore) {
      return false;
    }

    let promoCode: any;
    try {
      promoCode = await this.promoCodeStore.findUnique({
        where: { code: code.toUpperCase() },
      });
    } catch (error) {
      if (this.isPromoStorageError(error)) {
        return false;
      }
      throw error;
    }

    if (!promoCode) {
      return false;
    }

    try {
      this.assertPromoCodeValid(promoCode);
      return true;
    } catch {
      return false;
    }
  }

  async getPromoCode(code: string): Promise<PromoCodeResponse> {
    this.assertPromoStorageConfigured();

    const promoCode = await this.promoCodeStore.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      throw new NotFoundException('Promo code not found');
    }

    return this.mapToResponse(promoCode);
  }

  async listPromoCodes(adminId: string, filters?: {
    type?: PromoCodeType;
    status?: PromoCodeStatus;
    plan?: Plan;
  }): Promise<PromoCodeResponse[]> {
    this.assertPromoStorageConfigured();

    const promoCodes = await this.promoCodeStore.findMany({
      where: {
        createdBy: adminId,
        ...(filters?.type && { type: filters.type }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.plan && { plan: filters.plan }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return promoCodes.map(this.mapToResponse);
  }

  async deactivatePromoCode(code: string, adminId: string): Promise<PromoCodeResponse> {
    this.assertPromoStorageConfigured();

    const promoCode = await this.promoCodeStore.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      throw new NotFoundException('Promo code not found');
    }

    if (promoCode.createdBy !== adminId) {
      throw new BadRequestException('Unauthorized to deactivate this promo code');
    }

    const updated = await this.promoCodeStore.update({
      where: { id: promoCode.id },
      data: { status: PromoCodeStatus.DISABLED },
    });

    return this.mapToResponse(updated);
  }

  async getUsageStats(code: string): Promise<any> {
    this.assertPromoStorageConfigured();

    const promoCode = await this.promoCodeStore.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        usages: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!promoCode) {
      throw new NotFoundException('Promo code not found');
    }

    return {
      code: promoCode.code,
      plan: promoCode.plan,
      type: promoCode.type,
      status: promoCode.status,
      maxUses: promoCode.maxUses,
      usedCount: promoCode.usedCount,
      remainingUses: promoCode.maxUses - promoCode.usedCount,
      expiresAt: promoCode.expiresAt,
      usages: promoCode.usages.map((usage: any) => ({
        userId: usage.userId,
        userEmail: usage.user.email,
        userName: `${usage.user.firstName} ${usage.user.lastName}`,
        redeemedAt: usage.redeemedAt,
      })),
    };
  }

  private assertPromoCodeValid(promoCode: any): void {
    if (promoCode.status === PromoCodeStatus.DISABLED) {
      throw new BadRequestException('This promo code has been disabled');
    }

    if (promoCode.expiresAt && new Date() > new Date(promoCode.expiresAt)) {
      throw new BadRequestException('This promo code has expired');
    }

    if (promoCode.usedCount >= promoCode.maxUses) {
      throw new BadRequestException('This promo code has reached its usage limit');
    }
  }

  private generateCode(type: PromoCodeType): string {
    const prefix = {
      [PromoCodeType.GIFT]: 'GIFT',
      [PromoCodeType.REFERRAL]: 'REF',
      [PromoCodeType.MARKETING]: 'PROMO',
      [PromoCodeType.PARTNER]: 'PARTNER',
    }[type];

    const uuid = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
    return `${prefix}-${uuid}`;
  }

  private mapToResponse(promoCode: any): PromoCodeResponse {
    return {
      id: promoCode.id,
      code: promoCode.code,
      plan: promoCode.plan,
      durationDays: promoCode.durationDays,
      type: promoCode.type,
      status: promoCode.status,
      maxUses: promoCode.maxUses,
      usedCount: promoCode.usedCount,
      expiresAt: promoCode.expiresAt,
      createdAt: promoCode.createdAt,
    };
  }
}
