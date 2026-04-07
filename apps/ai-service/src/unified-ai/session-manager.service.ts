import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode?: string;
}

interface SessionData {
  history: Message[];
  userId?: string;
  cvCached?: boolean;
  lastActivity: number;
}

@Injectable()
export class SessionManagerService {
  private readonly redis: Redis;
  private readonly sessionTTL = 3600; // 1 hour

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
    });
  }

  async createSession(userId?: string): Promise<string> {
    const sessionId = uuidv4();
    const key = `ai:session:${sessionId}`;
    const session: SessionData = {
      history: [],
      userId,
      lastActivity: Date.now(),
    };
    await this.redis.setex(key, this.sessionTTL, JSON.stringify(session));
    return sessionId;
  }

  async addMessage(sessionId: string, role: 'user' | 'assistant', content: string, mode?: string): Promise<void> {
    const key = `ai:session:${sessionId}`;
    const session = await this.getSession(sessionId);
    
    session.history.push({
      role,
      content,
      timestamp: Date.now(),
      mode,
    });

    session.lastActivity = Date.now();
    await this.redis.setex(key, this.sessionTTL, JSON.stringify(session));
  }

  async getSession(sessionId: string): Promise<SessionData> {
    const key = `ai:session:${sessionId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : { history: [], lastActivity: Date.now() };
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    const session = await this.getSession(sessionId);
    return session.history;
  }

  async getContext(sessionId: string, maxMessages: number = 10): Promise<string> {
    const session = await this.getSession(sessionId);
    const recent = session.history.slice(-maxMessages);
    
    return recent
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
  }

  async clearSession(sessionId: string): Promise<void> {
    const key = `ai:session:${sessionId}`;
    await this.redis.del(key);
  }

  async cacheUserCV(sessionId: string, cvData: any): Promise<void> {
    const key = `ai:session:${sessionId}:cv`;
    await this.redis.setex(key, 3600, JSON.stringify(cvData)); // 1 hour cache
  }

  async getCachedCV(sessionId: string): Promise<any> {
    const key = `ai:session:${sessionId}:cv`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
}
