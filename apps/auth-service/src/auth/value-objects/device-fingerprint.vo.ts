import { createHash } from 'crypto';
import { Request } from 'express';

export class DeviceFingerprint {
  private readonly _hash: string;

  constructor(req: Request) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = this.extractIp(req);
    const subnet = this.getSubnet(ip);

    const fingerprint = `${userAgent}|${subnet}`;
    this._hash = createHash('sha256').update(fingerprint).digest('hex');
  }

  private extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = (forwarded as string).split(',');
      return ips[0].trim();
    }
    return req.ip || req.socket.remoteAddress || '0.0.0.0';
  }

  private getSubnet(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }
    return ip;
  }

  get hash(): string {
    return this._hash;
  }

  matches(stored: string): boolean {
    return this._hash === stored;
  }
}
