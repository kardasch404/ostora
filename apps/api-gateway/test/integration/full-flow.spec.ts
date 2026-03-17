import { GatewayController } from '../../src/gateway/gateway.controller';
import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';

describe('Final Integration Flow (register -> profile -> upload CV -> search -> apply -> email log)', () => {
  const createClient = () => ({
    send: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
  });

  const authClient = createClient();
  const userClient = createClient();
  const jobClient = createClient();
  const emailClient = createClient();
  const paymentClient = createClient();
  const aiClient = createClient();
  const notificationClient = createClient();
  const analyticsClient = createClient();

  const controller = new GatewayController(
    authClient as any,
    userClient as any,
    jobClient as any,
    emailClient as any,
    paymentClient as any,
    aiClient as any,
    notificationClient as any,
    analyticsClient as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should execute full user to application flow through gateway routes', async () => {
    authClient.send.mockImplementation((topic: string) => {
      if (topic === 'auth.register') {
        return of({ userId: 'user-1', email: 'candidate@example.com' });
      }
      return of({});
    });

    userClient.send.mockImplementation((topic: string) => {
      if (topic === 'user.updateProfile') {
        return of({ ok: true, profileCompleted: true });
      }
      if (topic === 'user.uploadDocument') {
        return of({ ok: true, documentId: 'cv-1' });
      }
      if (topic === 'user.getDocuments') {
        return of([{ id: 'cv-1', type: 'CV' }]);
      }
      return of({});
    });

    jobClient.send.mockImplementation((topic: string) => {
      if (topic === 'job.search') {
        return of({
          data: [{ id: 'job-1', title: 'Backend Engineer' }],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        });
      }
      if (topic === 'job.apply') {
        return of({ applicationId: 'app-1', status: 'SENT' });
      }
      return of({});
    });

    emailClient.send.mockImplementation((topic: string) => {
      if (topic === 'email.getLogs') {
        return of([
          {
            to: 'hr@company.com',
            subject: 'Job Application',
            status: 'SENT',
          },
        ]);
      }
      return of({});
    });

    const register = await controller.register({
      email: 'candidate@example.com',
      password: 'StrongPass123!',
    });

    const profile = await controller.updateUserProfile({
      userId: register.userId,
      firstName: 'John',
      lastName: 'Doe',
      title: 'Backend Engineer',
    });

    const upload = await controller.uploadDocument({
      userId: register.userId,
      fileName: 'cv.pdf',
      contentType: 'application/pdf',
    });

    const jobs = await controller.searchJobs({ q: 'backend', city: 'Berlin' });

    const apply = await controller.applyToJob('job-1', {
      userId: register.userId,
      bundleId: upload.documentId,
      emailConfigId: 'email-config-1',
      templateId: 'template-1',
    });

    const emailLogs = (await firstValueFrom(
      (emailClient.send as jest.Mock)('email.getLogs', {
        userId: register.userId,
        jobId: 'job-1',
      }),
    )) as Array<{ status: string }>;

    expect(profile.profileCompleted).toBe(true);
    expect(upload.documentId).toBe('cv-1');
    expect(jobs.data).toHaveLength(1);
    expect(apply.status).toBe('SENT');
    expect(emailLogs[0].status).toBe('SENT');

    expect(authClient.send).toHaveBeenCalledWith('auth.register', expect.any(Object));
    expect(userClient.send).toHaveBeenCalledWith('user.updateProfile', expect.any(Object));
    expect(userClient.send).toHaveBeenCalledWith('user.uploadDocument', expect.any(Object));
    expect(jobClient.send).toHaveBeenCalledWith('job.search', expect.any(Object));
    expect(jobClient.send).toHaveBeenCalledWith('job.apply', expect.any(Object));
  });
});
