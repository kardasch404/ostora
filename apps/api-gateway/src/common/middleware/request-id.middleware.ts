import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Generate or extract Request ID
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    
    // Inject Request ID into request headers
    req.headers['x-request-id'] = requestId;
    
    // Expose Request ID in response headers
    res.setHeader('X-Request-ID', requestId);
    
    // Also set as X-Correlation-ID for backward compatibility
    res.setHeader('X-Correlation-ID', requestId);
    
    next();
  }
}
