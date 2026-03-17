import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('User Profile Creation Flow (E2E)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let bundleId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Profile Flow', () => {
    it('Step 1: Register user (simulated - get auth token)', async () => {
      // In real scenario, this would call auth-service
      // For this test, we'll simulate having a token
      authToken = 'mock-jwt-token';
      userId = 'test-user-123';
      
      expect(authToken).toBeDefined();
      expect(userId).toBeDefined();
    });

    it('Step 2: Create profile with basic info', async () => {
      const profileData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        bio: 'Experienced software engineer with 5+ years in full-stack development',
        city: 'Berlin',
        country: 'Germany',
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        industry: 'Technology',
        experienceYears: 5,
      };

      const response = await request(app.getHttpServer())
        .post('/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.firstName).toBe('John');
      expect(response.body.lastName).toBe('Doe');
      expect(response.body.city).toBe('Berlin');
    });

    it('Step 3: Add education', async () => {
      const educationData = {
        institution: 'Technical University',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2015-09-01',
        endDate: '2019-06-30',
        current: false,
      };

      const response = await request(app.getHttpServer())
        .post('/education')
        .set('Authorization', `Bearer ${authToken}`)
        .send(educationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.institution).toBe('Technical University');
      expect(response.body.degree).toBe('Bachelor of Science');
    });

    it('Step 4: Add social links', async () => {
      const socialLinks = [
        {
          platform: 'LINKEDIN',
          username: 'johndoe',
          url: 'https://linkedin.com/in/johndoe',
        },
        {
          platform: 'GITHUB',
          username: 'johndoe',
          url: 'https://github.com/johndoe',
        },
      ];

      for (const link of socialLinks) {
        const response = await request(app.getHttpServer())
          .post('/socials')
          .set('Authorization', `Bearer ${authToken}`)
          .send(link)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.platform).toBe(link.platform);
        expect(response.body.url).toBe(link.url);
      }
    });

    it('Step 5: Update profile settings', async () => {
      const settingsData = {
        jobSearchStatus: 'ACTIVE',
        desiredSalary: 80000,
        desiredSalaryCurrency: 'EUR',
        desiredContractType: 'FULL_TIME',
        desiredLocations: ['Berlin', 'Munich', 'Hamburg'],
        remotePreference: 'HYBRID',
        visibility: 'PUBLIC',
      };

      const response = await request(app.getHttpServer())
        .patch('/profile/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(settingsData)
        .expect(200);

      expect(response.body.jobSearchStatus).toBe('ACTIVE');
      expect(response.body.desiredSalary).toBe(80000);
      expect(response.body.desiredLocations).toEqual(['Berlin', 'Munich', 'Hamburg']);
    });

    it('Step 6: Create application bundle', async () => {
      const bundleData = {
        name: 'MERN Stack JS',
        description: 'Documents for MERN stack developer positions',
      };

      const response = await request(app.getHttpServer())
        .post('/bundles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bundleData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('MERN Stack JS');
      expect(response.body.slug).toBe('mern-stack-js');
      expect(response.body.documentCount).toBe(0);

      bundleId = response.body.id;
    });

    it('Step 7: Upload CV to bundle (get presigned URL)', async () => {
      const uploadRequest = {
        type: 'CV',
        filename: 'john-doe-resume.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024000,
      };

      const response = await request(app.getHttpServer())
        .post(`/bundles/${bundleId}/documents`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(uploadRequest)
        .expect(201);

      expect(response.body).toHaveProperty('uploadUrl');
      expect(response.body).toHaveProperty('key');
      expect(response.body).toHaveProperty('document');
      expect(response.body.document.type).toBe('CV');
      expect(response.body.document.filename).toBe('john-doe-resume.pdf');
      expect(response.body.expiresIn).toBe(3600);
    });

    it('Step 8: List all bundles', async () => {
      const response = await request(app.getHttpServer())
        .get('/bundles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('documentCount');
    });

    it('Step 9: Get documents in bundle', async () => {
      const response = await request(app.getHttpServer())
        .get(`/bundles/${bundleId}/documents`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].type).toBe('CV');
      expect(response.body[0].filename).toBe('john-doe-resume.pdf');
    });

    it('Step 10: Check profile completeness', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile/completeness')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('percentage');
      expect(response.body).toHaveProperty('completedFields');
      expect(response.body).toHaveProperty('missingFields');
      expect(Array.isArray(response.body.completedFields)).toBe(true);
      expect(Array.isArray(response.body.missingFields)).toBe(true);
    });

    it('Step 11: Get complete profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.firstName).toBe('John');
      expect(response.body.lastName).toBe('Doe');
      expect(response.body).toHaveProperty('education');
      expect(response.body).toHaveProperty('socialLinks');
    });
  });

  describe('Validation Tests', () => {
    it('should reject invalid email in social link', async () => {
      const invalidLink = {
        platform: 'LINKEDIN',
        url: 'not-a-valid-url',
      };

      await request(app.getHttpServer())
        .post('/socials')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidLink)
        .expect(400);
    });

    it('should reject file size exceeding 10MB', async () => {
      const largeFileRequest = {
        type: 'CV',
        filename: 'large-resume.pdf',
        mimeType: 'application/pdf',
        fileSize: 11 * 1024 * 1024, // 11MB
      };

      await request(app.getHttpServer())
        .post(`/bundles/${bundleId}/documents`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeFileRequest)
        .expect(400);
    });

    it('should reject invalid file type', async () => {
      const invalidFileRequest = {
        type: 'CV',
        filename: 'image.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024000,
      };

      await request(app.getHttpServer())
        .post(`/bundles/${bundleId}/documents`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidFileRequest)
        .expect(400);
    });
  });
});
