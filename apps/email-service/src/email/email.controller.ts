import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { SendApplicationDto } from './dto/send-application.dto';

@ApiTags('email')
@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send email (internal use)' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  async sendEmail(@Body() dto: SendEmailDto, @Req() req: any) {
    const userId = req.user?.id || 'system';
    await this.emailService.sendEmail(dto, userId);
    return { success: true, message: 'Email sent' };
  }

  @Post('send-application')
  @ApiOperation({ summary: 'Send job application email' })
  @ApiResponse({ status: 200, description: 'Application email sent' })
  async sendApplication(@Body() dto: SendApplicationDto, @Req() req: any) {
    const userId = req.user?.id;
    await this.emailService.sendApplication(dto, userId);
    return { success: true, message: 'Application email sent' };
  }
}
