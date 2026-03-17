export const mockKafkaClient = {
  emit: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
  send: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
  connect: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
};

export const createMockKafkaClient = () => ({
  ...mockKafkaClient,
});
