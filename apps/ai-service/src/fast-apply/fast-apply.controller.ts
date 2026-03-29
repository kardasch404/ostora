import { Controller, Post, Get, Body, Param, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { FastApplyService } from './fast-apply.service';
import { FastApplyRequestDto } from '../dto/fast-apply.dto';
import { UserPlan } from '../interfaces/fast-apply.interface';
import { PrismaService } from '../prisma.service';

@Controller('ai/fast-apply')
export class FastApplyController {
  constructor(
    private fastApplyService: FastApplyService,
    private prisma: PrismaService,
  ) {}

  @Post()
  async startFastApply(@Body() dto: FastApplyRequestDto, @Request() req: any) {
    // Get user from request (set by auth middleware/guard)
    const userId = req.user?.id || dto.userId;

    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    // Get user subscription plan
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscriptions: { where: { status: 'ACTIVE' }, take: 1 } },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Map subscription plan to UserPlan enum
    let userPlan = UserPlan.FREE;
    if (user.subscriptions.length > 0) {
      const plan = user.subscriptions[0].plan;
      if (plan.includes('B2B')) {
        userPlan = UserPlan.B2B;
      } else if (plan.includes('ANNUAL')) {
        userPlan = UserPlan.ANNUAL;
      } else if (plan.includes('PREMIUM')) {
        userPlan = UserPlan.PREMIUM;
      }
    }

    const result = await this.fastApplyService.processBatch(dto, userPlan, userId);

    return {
      ...result,
      jobCount: dto.jobIds.length,
      status: 'processing',
    };
  }

  @Get(':batchId/progress')
  async getBatchProgress(@Param('batchId') batchId: string) {
    const progress = await this.fastApplyService.getBatchStatus(batchId);
    
    if (!progress) {
      return { error: 'Batch not found' };
    }

    return progress;
  }
}
