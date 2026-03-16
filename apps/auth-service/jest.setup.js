// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: class PrismaClient {
    $connect = jest.fn();
    $disconnect = jest.fn();
  },
}));

// Mock bcrypt to avoid native module issues in tests
jest.mock('bcrypt', () => ({
  hash: jest.fn((password) => {
    // Return exactly 60 characters: $2b$12$ (7) + 53 chars
    const salt = 'a'.repeat(53);
    return Promise.resolve(`$2b$12$${salt}`);
  }),
  compare: jest.fn((password, hash) => {
    if (!password) return Promise.resolve(false);
    return Promise.resolve(hash.startsWith('$2b$12$'));
  }),
  genSalt: jest.fn(() => Promise.resolve('$2b$12$salt')),
}));
