import { Controller, Get } from '@nestjs/common';

@Controller('ostoracv')
export class HealthController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'ostoracv-service',
      timestamp: new Date().toISOString(),
    };
  }
}
