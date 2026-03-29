import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

@Injectable()
export class SessionManagerService {
  private readonly logger = new Logger(SessionManagerService.name);
  private readonly redis: Redis;
  private readonly sessionTTL = 3600; // 1 hour

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
    });
  }

  async createSession(): Promise<string> {
    const sessionId = uuidv4();
    const key = `session:${sessionId}`;
    await this.redis.setex(key, this.sessionTTL, JSON.stringify([]));
    return sessionId;
  }

  async addMessage(sessionId: string, role: 'user' | 'assistant', content: string): Promise<void> {
    const key = `session:${sessionId}`;
    const messages = await this.getMessages(sessionId);
    
    messages.push({
      role,
      content,
      timestamp: Date.now(),
    });

    await this.redis.setex(key, this.sessionTTL, JSON.stringify(messages));
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    const key = `session:${sessionId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : [];
  }

  async getContext(sessionId: string, maxMessages: number = 10): Promise<string> {
    const messages = await this.getMessages(sessionId);
    const recent = messages.slice(-maxMessages);
    
    return recent
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
  }

  async clearSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.redis.del(key);
  }
}
