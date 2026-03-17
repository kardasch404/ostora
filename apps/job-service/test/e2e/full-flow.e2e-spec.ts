import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('E2E: Register → Profile → Upload CV → Search Job → Apply', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let bundleId: string;
  let emailConfigId: string;
  let templateId: string;
  let jobId: string;

  beforeAll(async () => {
    // This would be set up with actual test modules
    // For now, this is a template showing the flow
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Step 1: User Registration', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      
      authToken = response.body.accessToken;
      userId = response.body.user.id;
    });

    it('should verify email', async () => {
      // Simulate email verification
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({
          token: 'verification-token',
        })
        .expect(200);

      expect(response.body.verified).toBe(true);
    });
  });

  describe('Step 2: Complete Profile', () => {
    it('should update user profile', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: 'Experienced software developer',
          phone: '+49123456789',
          city: 'Berlin',
          country: 'Germany',
        })
        .expect(200);

      expect(response.body.bio).toBe('Experienced software developer');
    });

    it('should add work experience', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users/experience')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company: 'Tech Corp',
          position: 'Senior Developer',
          startDate: '2020-01-01',
          endDate: null,
          current: true,
          description: 'Full-stack development',
        })
        .expect(201);

      expect(response.body.company).toBe('Tech Corp');
    });

    it('should add education', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users/education')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          institution: 'Technical University',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2015-09-01',
          endDate: '2019-06-30',
        })
        .expect(201);

      expect(response.body.degree).toBe('Bachelor of Science');
    });

    it('should add skills', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users/skills')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          skills: ['JavaScript', 'TypeScript', 'Node.js', 'React', 'PostgreSQL'],
        })
        .expect(201);

      expect(response.body.skills).toHaveLength(5);
    });
  });

  describe('Step 3: Upload CV and Create Bundle', () => {
    it('should upload CV document', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('CV content'), 'cv.pdf')
        .field('type', 'CV')
        .expect(201);

      expect(response.body.s3Key).toBeDefined();
      expect(response.body.type).toBe('CV');
    });

    it('should create application bundle', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users/bundles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Software Developer Bundle',
          documentIds: ['doc-id-1', 'doc-id-2'],
        })
        .expect(201);

      bundleId = response.body.id;
      expect(response.body.name).toBe('Software Developer Bundle');
    });

    it('should create email config', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users/email-configs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpSecure: false,
          smtpUser: 'testuser@gmail.com',
          smtpPassword: 'app-password',
        })
        .expect(201);

      emailConfigId = response.body.id;
    });

    it('should create message template', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Job Application Template',
          subject: 'Application for {{jobTitle}}',
          body: 'Dear Hiring Manager, I am applying for {{jobTitle}} at {{companyName}}...',
        })
        .expect(201);

      templateId = response.body.id;
    });
  });

  describe('Step 4: Search for Jobs', () => {
    it('should search jobs by keyword', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/jobs/search')
        .query({
          q: 'javascript developer',
          city: 'Berlin',
          remote: true,
          page: 1,
          limit: 20,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThan(0);
      
      if (response.body.data.length > 0) {
        jobId = response.body.data[0].id;
      }
    });

    it('should get job details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(jobId);
      expect(response.body.title).toBeDefined();
      expect(response.body.company).toBeDefined();
    });

    it('should add job to favorites', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/jobs/${jobId}/favorite`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.isFavorited).toBe(true);
    });
  });

  describe('Step 5: Apply to Job', () => {
    it('should apply to a single job', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/jobs/${jobId}/apply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bundleId,
          emailConfigId,
          templateId,
          recipientEmail: 'hr@company.com',
          placeholders: {
            customMessage: 'I am very interested in this position',
          },
        })
        .expect(201);

      expect(response.body.status).toBe('SENT');
      expect(response.body.jobPostId).toBe(jobId);
    });

    it('should not allow duplicate application', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/jobs/${jobId}/apply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bundleId,
          emailConfigId,
          templateId,
          recipientEmail: 'hr@company.com',
        })
        .expect(400);
    });

    it('should get user applications', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/jobs/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].jobPostId).toBe(jobId);
    });
  });

  describe('Step 6: Bulk Apply to Multiple Jobs', () => {
    it('should apply to multiple jobs via queue', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/jobs/apply-bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bundleId,
          emailConfigId,
          templateId,
          jobs: [
            {
              jobPostId: 'job-id-1',
              recipientEmail: 'hr1@company.com',
            },
            {
              jobPostId: 'job-id-2',
              recipientEmail: 'hr2@company.com',
            },
            {
              jobPostId: 'job-id-3',
              recipientEmail: 'hr3@company.com',
            },
          ],
        })
        .expect(201);

      expect(response.body.totalJobs).toBe(3);
      expect(response.body.queued).toBeGreaterThan(0);
      expect(response.body.jobIds).toBeInstanceOf(Array);
    });
  });

  describe('Step 7: Check Email Logs', () => {
    it('should retrieve email logs', async () => {
      // Wait for emails to be processed
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await request(app.getHttpServer())
        .get('/api/v1/email/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      
      const applicationEmail = response.body.find(
        (log: any) => log.to === 'hr@company.com'
      );
      
      expect(applicationEmail).toBeDefined();
      expect(applicationEmail.status).toBe('SENT');
    });

    it('should get email statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/email/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.sent).toBeGreaterThan(0);
      expect(response.body.total).toBeGreaterThan(0);
    });
  });
});
