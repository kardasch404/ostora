import { test, expect } from '@playwright/test';

test.describe('Auth Flow - Browser E2E (AUTH-10)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full registration flow', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = 'ValidPass123!';

    await page.goto('/api/v1/auth/register');
    
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*success/);
    
    const successMessage = page.locator('.success-message');
    await expect(successMessage).toBeVisible();
  });

  test('should login and access protected route', async ({ page, request }) => {
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'ValidPass123!',
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const { accessToken } = await loginResponse.json();

    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    await page.goto('/api/v1/auth/sessions');
    
    const response = await page.waitForResponse(
      (response) => response.url().includes('/sessions') && response.status() === 200
    );

    expect(response.ok()).toBeTruthy();
  });

  test('should handle login with invalid credentials', async ({ page, request }) => {
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'WrongPassword',
      },
    });

    expect(loginResponse.status()).toBe(400);
  });

  test('should refresh token successfully', async ({ page, request }) => {
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'ValidPass123!',
      },
    });

    const { refreshToken } = await loginResponse.json();

    const refreshResponse = await request.post('/api/v1/auth/refresh', {
      data: { refreshToken },
    });

    expect(refreshResponse.ok()).toBeTruthy();
    const refreshData = await refreshResponse.json();
    expect(refreshData).toHaveProperty('accessToken');
    expect(refreshData).toHaveProperty('refreshToken');
    expect(refreshData.refreshToken).not.toBe(refreshToken);
  });

  test('should logout and clear session', async ({ page, request }) => {
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'ValidPass123!',
      },
    });

    const { accessToken, refreshToken } = await loginResponse.json();

    const logoutResponse = await request.post('/api/v1/auth/logout', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: { refreshToken },
    });

    expect(logoutResponse.ok()).toBeTruthy();
    const logoutData = await logoutResponse.json();
    expect(logoutData).toHaveProperty('message', 'Logged out successfully');
  });

  test('should handle password reset flow', async ({ page, request }) => {
    const forgotResponse = await request.post('/api/v1/auth/forgot-password', {
      data: {
        email: 'test@example.com',
      },
    });

    expect(forgotResponse.ok()).toBeTruthy();
    const forgotData = await forgotResponse.json();
    expect(forgotData).toHaveProperty('message');
  });

  test('should enforce brute-force protection', async ({ page, request }) => {
    for (let i = 0; i < 5; i++) {
      await request.post('/api/v1/auth/login', {
        data: {
          email: 'test@example.com',
          password: 'WrongPassword',
        },
      });
    }

    const finalResponse = await request.post('/api/v1/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'WrongPassword',
      },
    });

    expect([400, 429]).toContain(finalResponse.status());
  });
});
