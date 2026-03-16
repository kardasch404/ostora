import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn((password: string) => {
    if (!password) return Promise.resolve('');
    return Promise.resolve('$2b$10$' + 'a'.repeat(53));
  }),
  compare: jest.fn((password: string, hash: string) => {
    if (!password || !hash) return Promise.resolve(false);
    return Promise.resolve(password === 'ValidPass123!' || password === 'NewPass123!');
  }),
  genSalt: jest.fn(() => Promise.resolve('$2b$10$aaaaaaaaaaaaaaaaaaaaaa')),
}));
