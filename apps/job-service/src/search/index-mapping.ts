export const JOB_INDEX_NAME = 'ostora-jobs';

export const JOB_INDEX_MAPPING = {
  settings: {
    number_of_shards: 3,
    number_of_replicas: 1,
    analysis: {
      analyzer: {
        job_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'stop', 'snowball'],
        },
      },
    },
  },
  mappings: {
    properties: {
      id: {
        type: 'keyword',
      },
      title: {
        type: 'text',
        analyzer: 'job_analyzer',
        fields: {
          keyword: { type: 'keyword' },
          raw: { type: 'text', analyzer: 'standard' },
        },
      },
      company: {
        type: 'text',
        analyzer: 'job_analyzer',
        fields: {
          keyword: { type: 'keyword' },
        },
      },
      companyId: {
        type: 'keyword',
      },
      city: {
        type: 'keyword',
      },
      country: {
        type: 'keyword',
      },
      location: {
        type: 'text',
      },
      salary: {
        type: 'text',
      },
      salaryMin: {
        type: 'integer',
      },
      salaryMax: {
        type: 'integer',
      },
      contractType: {
        type: 'keyword',
      },
      remote: {
        type: 'boolean',
      },
      description: {
        type: 'text',
        analyzer: 'job_analyzer',
      },
      requirements: {
        type: 'text',
        analyzer: 'job_analyzer',
      },
      tags: {
        type: 'keyword',
      },
      source: {
        type: 'keyword',
      },
      externalId: {
        type: 'keyword',
      },
      url: {
        type: 'keyword',
        index: false,
      },
      postedAt: {
        type: 'date',
      },
      scrapedAt: {
        type: 'date',
      },
      isActive: {
        type: 'boolean',
      },
      createdAt: {
        type: 'date',
      },
      updatedAt: {
        type: 'date',
      },
    },
  },
};
