import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';

@Controller()
export class MetricsController {
  private requestCount = 0;
  private errorCount = 0;
  private requestDurations: number[] = [];

  @Public()
  @Get('metrics')
  async metrics(@Res() res: Response) {
    const avgDuration = this.requestDurations.length > 0
      ? this.requestDurations.reduce((a, b) => a + b, 0) / this.requestDurations.length
      : 0;

    const metrics = `
# HELP auth_service_requests_total Total number of requests
# TYPE auth_service_requests_total counter
auth_service_requests_total ${this.requestCount}

# HELP auth_service_errors_total Total number of errors
# TYPE auth_service_errors_total counter
auth_service_errors_total ${this.errorCount}

# HELP auth_service_request_duration_seconds Request duration in seconds
# TYPE auth_service_request_duration_seconds histogram
auth_service_request_duration_seconds_sum ${this.requestDurations.reduce((a, b) => a + b, 0)}
auth_service_request_duration_seconds_count ${this.requestDurations.length}
auth_service_request_duration_seconds_bucket{le="0.1"} ${this.requestDurations.filter(d => d <= 0.1).length}
auth_service_request_duration_seconds_bucket{le="0.5"} ${this.requestDurations.filter(d => d <= 0.5).length}
auth_service_request_duration_seconds_bucket{le="1"} ${this.requestDurations.filter(d => d <= 1).length}
auth_service_request_duration_seconds_bucket{le="5"} ${this.requestDurations.filter(d => d <= 5).length}
auth_service_request_duration_seconds_bucket{le="+Inf"} ${this.requestDurations.length}

# HELP auth_service_up Service uptime
# TYPE auth_service_up gauge
auth_service_up 1

# HELP nodejs_memory_usage_bytes Node.js memory usage
# TYPE nodejs_memory_usage_bytes gauge
nodejs_memory_usage_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed}
nodejs_memory_usage_bytes{type="heapTotal"} ${process.memoryUsage().heapTotal}
nodejs_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}
`;

    res.set('Content-Type', 'text/plain');
    res.send(metrics.trim());
  }

  incrementRequestCount() {
    this.requestCount++;
  }

  incrementErrorCount() {
    this.errorCount++;
  }

  recordRequestDuration(duration: number) {
    this.requestDurations.push(duration);
    if (this.requestDurations.length > 1000) {
      this.requestDurations.shift();
    }
  }
}
