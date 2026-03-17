module.exports = {
  projects: ['<rootDir>/apps/auth-service'],
  testMatch: ['**/__tests__/**/*.spec.ts', '**/*.spec.ts'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'apps/*/src/**/*.ts',
    '!apps/*/src/**/*.spec.ts',
    '!apps/*/src/**/*.interface.ts',
    '!apps/*/src/**/*.dto.ts',
    '!apps/*/src/**/*.enum.ts',
    '!apps/*/src/**/index.ts',
    '!apps/*/src/main.ts',
  ],
};
