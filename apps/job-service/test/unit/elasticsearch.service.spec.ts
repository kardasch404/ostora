import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '../../src/search/elasticsearch.service';

describe('ElasticsearchService', () => {
  let service: ElasticsearchService;

  const mockClient = {
    indices: {
      exists: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    search: jest.fn(),
    index: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    bulk: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'ELASTICSEARCH_URL') return 'http://localhost:9245';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElasticsearchService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ElasticsearchService>(ElasticsearchService);
    (service as any).client = mockClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureIndex', () => {
    it('should create index if not exists', async () => {
      mockClient.indices.exists.mockResolvedValue(false);
      mockClient.indices.create.mockResolvedValue({ acknowledged: true });

      await service.ensureIndex();

      expect(mockClient.indices.exists).toHaveBeenCalledWith({
        index: 'ostora-jobs',
      });

      expect(mockClient.indices.create).toHaveBeenCalled();
    });

    it('should not create index if already exists', async () => {
      mockClient.indices.exists.mockResolvedValue(true);

      await service.ensureIndex();

      expect(mockClient.indices.create).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should execute search query', async () => {
      const query = {
        query: { match_all: {} },
        from: 0,
        size: 20,
      };

      const mockResponse = {
        hits: {
          total: { value: 100 },
          hits: [
            { _id: 'job-1', _source: { title: 'Developer' } },
            { _id: 'job-2', _source: { title: 'Designer' } },
          ],
        },
      };

      mockClient.search.mockResolvedValue(mockResponse);

      const result = await service.search(query);

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'ostora-jobs',
        body: query,
      });

      expect(result.hits.hits).toHaveLength(2);
    });

    it('should handle search errors', async () => {
      mockClient.search.mockRejectedValue(new Error('ES connection failed'));

      await expect(service.search({ query: { match_all: {} } })).rejects.toThrow(
        'ES connection failed'
      );
    });
  });

  describe('indexJob', () => {
    it('should index a job document', async () => {
      const jobData = {
        title: 'Senior Developer',
        company: 'Tech Corp',
        city: 'Berlin',
        remote: true,
      };

      mockClient.index.mockResolvedValue({ _id: 'job-123', result: 'created' });

      await service.indexJob('job-123', jobData);

      expect(mockClient.index).toHaveBeenCalledWith({
        index: 'ostora-jobs',
        id: 'job-123',
        body: jobData,
        refresh: 'wait_for',
      });
    });
  });

  describe('bulkIndex', () => {
    it('should bulk index multiple jobs', async () => {
      const jobs = [
        { id: 'job-1', data: { title: 'Developer' } },
        { id: 'job-2', data: { title: 'Designer' } },
      ];

      mockClient.bulk.mockResolvedValue({ errors: false, items: [] });

      await service.bulkIndex(jobs);

      expect(mockClient.bulk).toHaveBeenCalled();
      const callArgs = mockClient.bulk.mock.calls[0][0];
      expect(callArgs.body).toHaveLength(4); // 2 jobs * 2 lines each
    });

    it('should handle empty job array', async () => {
      await service.bulkIndex([]);

      expect(mockClient.bulk).not.toHaveBeenCalled();
    });

    it('should log errors on bulk index failure', async () => {
      const jobs = [{ id: 'job-1', data: { title: 'Developer' } }];

      mockClient.bulk.mockResolvedValue({
        errors: true,
        items: [{ index: { error: 'Index error' } }],
      });

      await service.bulkIndex(jobs);

      expect(mockClient.bulk).toHaveBeenCalled();
    });
  });

  describe('updateJob', () => {
    it('should update job document', async () => {
      const updates = { title: 'Updated Title' };

      mockClient.update.mockResolvedValue({ _id: 'job-123', result: 'updated' });

      await service.updateJob('job-123', updates);

      expect(mockClient.update).toHaveBeenCalledWith({
        index: 'ostora-jobs',
        id: 'job-123',
        body: { doc: updates },
        refresh: 'wait_for',
      });
    });
  });

  describe('deleteJob', () => {
    it('should delete job document', async () => {
      mockClient.delete.mockResolvedValue({ _id: 'job-123', result: 'deleted' });

      await service.deleteJob('job-123');

      expect(mockClient.delete).toHaveBeenCalledWith({
        index: 'ostora-jobs',
        id: 'job-123',
        refresh: 'wait_for',
      });
    });

    it('should handle 404 errors gracefully', async () => {
      mockClient.delete.mockRejectedValue({
        meta: { statusCode: 404 },
      });

      await expect(service.deleteJob('non-existent')).resolves.not.toThrow();
    });
  });
});
