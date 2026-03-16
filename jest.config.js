module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps', '<rootDir>/libs'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.spec.ts',
    '!**/*.test.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: './coverage',
  moduleNameMapper: {
    '^@ostora/shared-dto$': '<rootDir>/libs/shared-dto/src',
    '^@ostora/shared-interfaces$': '<rootDir>/libs/shared-interfaces/src',
    '^@ostora/shared-guards$': '<rootDir>/libs/shared-guards/src',
    '^@ostora/shared-decorators$': '<rootDir>/libs/shared-decorators/src',
    '^@ostora/shared-filters$': '<rootDir>/libs/shared-filters/src',
    '^@ostora/shared-interceptors$': '<rootDir>/libs/shared-interceptors/src',
    '^@ostora/shared-utils$': '<rootDir>/libs/shared-utils/src',
  },
};
