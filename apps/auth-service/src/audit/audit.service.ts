import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditEvent } from './audit-event.enum';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    event: AuditEvent,
    userId: string | null,
    resource: string,
    resourceId: string | null,
    metadata: any,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: event,
          resource,
          resourceId,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  async logLoginSuccess(userId: string, ip: string, userAgent: string, fingerprint: string): Promise<void> {
    await this.log(AuditEvent.LOGIN_SUCCESS, userId, 'auth', null, { fingerprint }, ip, userAgent);
  }

  async logLoginFailed(email: string, ip: string, userAgent: string, reason: string): Promise<void> {
    await this.log(AuditEvent.LOGIN_FAILED, null, 'auth', null, { email, reason }, ip, userAgent);
  }

  async logLogout(userId: string, ip: string, userAgent: string): Promise<void> {
    await this.log(AuditEvent.LOGOUT, userId, 'auth', null, {}, ip, userAgent);
  }

  async logLogoutAll(userId: string, ip: string, userAgent: string): Promise<void> {
    await this.log(AuditEvent.LOGOUT_ALL, userId, 'auth', null, {}, ip, userAgent);
  }

  async logSessionRevoke(userId: string, sessionId: string, ip: string, userAgent: string): Promise<void> {
    await this.log(AuditEvent.SESSION_REVOKE, userId, 'session', sessionId, {}, ip, userAgent);
  }

  async logNewDevice(userId: string, ip: string, userAgent: string, fingerprint: string): Promise<void> {
    await this.log(AuditEvent.NEW_DEVICE_DETECTED, userId, 'auth', null, { fingerprint }, ip, userAgent);
  }

  async logAccountLock(userId: string, ip: string, userAgent: string, reason: string): Promise<void> {
    await this.log(AuditEvent.ACCOUNT_LOCK, userId, 'auth', null, { reason }, ip, userAgent);
  }

  async logTokenRefresh(userId: string, ip: string, userAgent: string): Promise<void> {
    await this.log(AuditEvent.TOKEN_REFRESH, userId, 'auth', null, {}, ip, userAgent);
  }

  async logTokenBlacklist(userId: string, tokenHash: string, ip: string, userAgent: string): Promise<void> {
    await this.log(AuditEvent.TOKEN_BLACKLIST, userId, 'auth', null, { tokenHash }, ip, userAgent);
  }

  async logPasswordResetRequest(userId: string, email: string, ip: string, userAgent: string): Promise<void> {
    await this.log(AuditEvent.PASSWORD_RESET_REQUEST, userId, 'auth', null, { email }, ip, userAgent);
  }

  async logPasswordResetComplete(userId: string, ip: string, userAgent: string): Promise<void> {
    await this.log(AuditEvent.PASSWORD_RESET_COMPLETE, userId, 'auth', null, {}, ip, userAgent);
  }

  async logPasswordChange(userId: string, ip: string, userAgent: string): Promise<void> {
    await this.log(AuditEvent.PASSWORD_CHANGE, userId, 'auth', null, {}, ip, userAgent);
  }

  async logEmailChangeRequest(userId: string, oldEmail: string, newEmail: string, ip: string, userAgent: string): Promise<void> {
    await this.log(AuditEvent.EMAIL_CHANGE_REQUEST, userId, 'auth', null, { oldEmail, newEmail }, ip, userAgent);
  }

  async logEmailChange(userId: string, oldEmail: string, newEmail: string, ip: string, userAgent: string): Promise<void> {
    await this.log(AuditEvent.EMAIL_CHANGE, userId, 'auth', null, { oldEmail, newEmail }, ip, userAgent);
  }
}
