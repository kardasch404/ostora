import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/playwright',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4719',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start:dev',
    url: 'http://localhost:4719',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
