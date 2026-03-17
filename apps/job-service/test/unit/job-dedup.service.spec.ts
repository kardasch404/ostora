import { Test, TestingModule } from '@nestjs/testing';
import { JobDedupService } from '../../src/job/job-dedup.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JobIndexingService } from '../../src/search/job-indexing.service';

describe('JobDedupService', () => {
  let service: JobDedupService;
  let prisma: any;
  let jobIndexing: any;

  const mockPrismaService = {
    jobPost: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockJobIndexingService = {
    indexJob: jest.fn(),
    updateJobIndex: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobDedupService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JobIndexingService,
          useValue: mockJobIndexingService,
        },
      ],
    }).compile();

    service = module.get<JobDedupService>(JobDedupService);
    prisma = module.get(PrismaService);
    jobIndexing = module.get(JobIndexingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertJob', () => {
    const jobData = {
      externalId: 'ext-123',
      source: 'LINKEDIN',
      title: 'Senior Developer',
      companyId: 'company-uuid',
      location: 'Berlin, Germany',
      city: 'Berlin',
      country: 'Germany',
      salary: '60000-80000 EUR',
      contractType: 'FULL_TIME',
      remote: true,
      description: 'Great opportunity',
      url: 'https://example.com/job',
      scrapedAt: new Date(),
      isActive: true,
    };

    it('should upsert job by externalId + source and index it', async () => {
      mockPrismaService.jobPost.upsert.mockResolvedValue({
        id: 'job-uuid',
        ...jobData,
      });

      const result = await service.upsertJob(jobData);

      expect(prisma.jobPost.upsert).toHaveBeenCalledWith({
        where: {
          externalId_source: {
            externalId: 'ext-123',
            source: 'LINKEDIN',
          },
        },
        create: {
          externalId: 'ext-123',
          source: 'LINKEDIN',
          title: 'Senior Developer',
          companyId: 'company-uuid',
          location: 'Berlin, Germany',
          city: 'Berlin',
          country: 'Germany',
          salary: '60000-80000 EUR',
          contractType: 'FULL_TIME',
          remote: true,
          description: 'Great opportunity',
          url: 'https://example.com/job',
          scrapedAt: jobData.scrapedAt,
          isActive: true,
        },
        update: {
          title: 'Senior Developer',
          companyId: 'company-uuid',
          location: 'Berlin, Germany',
          city: 'Berlin',
          country: 'Germany',
          salary: '60000-80000 EUR',
          contractType: 'FULL_TIME',
          remote: true,
          description: 'Great opportunity',
          url: 'https://example.com/job',
          scrapedAt: jobData.scrapedAt,
          isActive: true,
        },
      });

      expect(jobIndexing.indexJob).toHaveBeenCalledWith('job-uuid');
      expect(result.id).toBe('job-uuid');
    });
  });

  describe('findDuplicate', () => {
    it('should return duplicate job when found', async () => {
      mockPrismaService.jobPost.findUnique.mockResolvedValue({ id: 'dup-1' });

      const result = await service.findDuplicate('ext-123', 'LINKEDIN');

      expect(prisma.jobPost.findUnique).toHaveBeenCalledWith({
        where: { externalId_source: { externalId: 'ext-123', source: 'LINKEDIN' } },
      });
      expect(result).toEqual({ id: 'dup-1' });
    });
  });

  describe('markDuplicatesInactive', () => {
    it('should mark duplicates inactive and update index', async () => {
      mockPrismaService.jobPost.updateMany.mockResolvedValue({ count: 2 });
      mockPrismaService.jobPost.findMany.mockResolvedValue([{ id: 'dup-1' }, { id: 'dup-2' }]);

      await service.markDuplicatesInactive('ext-123', 'LINKEDIN', 'keep-1');

      expect(prisma.jobPost.updateMany).toHaveBeenCalledWith({
        where: {
          externalId: 'ext-123',
          source: 'LINKEDIN',
          id: { not: 'keep-1' },
        },
        data: { isActive: false },
      });

      expect(jobIndexing.updateJobIndex).toHaveBeenNthCalledWith(1, 'dup-1', { isActive: false });
      expect(jobIndexing.updateJobIndex).toHaveBeenNthCalledWith(2, 'dup-2', { isActive: false });
    });

    it('should skip index updates when no duplicates were marked', async () => {
      mockPrismaService.jobPost.updateMany.mockResolvedValue({ count: 0 });

      await service.markDuplicatesInactive('ext-123', 'LINKEDIN', 'keep-1');

      expect(prisma.jobPost.findMany).not.toHaveBeenCalled();
      expect(jobIndexing.updateJobIndex).not.toHaveBeenCalled();
    });
  });
});
