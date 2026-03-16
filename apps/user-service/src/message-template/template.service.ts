import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageTemplateDto } from './dto/create-template.dto';
import { UpdateMessageTemplateDto } from './dto/update-template.dto';
import { RenderTemplateDto } from './dto/render-template.dto';
import { TemplateRendererService } from './template-renderer.service';

@Injectable()
export class MessageTemplateService {
  constructor(
    private prisma: PrismaService,
    private renderer: TemplateRendererService,
  ) {}

  async create(userId: string, dto: CreateMessageTemplateDto) {
    // Check template limit for free users
    const userTemplates = await this.prisma.messageTemplate.count({
      where: { userId },
    });

    // TODO: Check user subscription plan
    const maxTemplates = 10; // Free plan limit

    if (userTemplates >= maxTemplates) {
      throw new BadRequestException(`Maximum ${maxTemplates} templates allowed on free plan`);
    }

    return this.prisma.messageTemplate.create({
      data: {
        userId,
        ...dto,
        isDefault: false,
      },
    });
  }

  async findAll(userId: string, language?: string) {
    const where: any = {
      OR: [
        { userId },
        { isDefault: true },
      ],
    };

    if (language) {
      where.language = language;
    }

    return this.prisma.messageTemplate.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(userId: string, id: string) {
    const template = await this.prisma.messageTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Allow access to default templates or own templates
    if (!template.isDefault && template.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return template;
  }

  async update(userId: string, id: string, dto: UpdateMessageTemplateDto) {
    const template = await this.findOne(userId, id);

    if (template.isDefault) {
      throw new BadRequestException('Cannot modify default templates');
    }

    if (template.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.messageTemplate.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    const template = await this.findOne(userId, id);

    if (template.isDefault) {
      throw new BadRequestException('Cannot delete default templates');
    }

    if (template.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.messageTemplate.delete({
      where: { id },
    });
  }

  async render(userId: string, id: string, context: RenderTemplateDto) {
    const template = await this.findOne(userId, id);

    const renderedSubject = this.renderer.render(template.subject, context);
    const renderedBody = this.renderer.render(template.body, context);

    return {
      subject: renderedSubject,
      body: renderedBody,
      placeholders: this.renderer.extractPlaceholders(template.body),
    };
  }

  async getDefaultTemplates() {
    return this.prisma.messageTemplate.findMany({
      where: { isDefault: true },
      orderBy: { language: 'asc' },
    });
  }
}
