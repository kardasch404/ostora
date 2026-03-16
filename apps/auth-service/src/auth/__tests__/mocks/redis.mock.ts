export const mockRedisService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  scan: jest.fn(),
  ttl: jest.fn(),
};

export const createMockRedisService = () => ({
  ...mockRedisService,
});
