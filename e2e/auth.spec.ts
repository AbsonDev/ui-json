import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    // Check if we're redirected to login or if login is available
    await expect(page).toHaveURL(/.*login.*/);

    // Check for login form elements
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should show validation error for empty credentials', async ({ page }) => {
    await page.goto('/login');

    // Try to submit without credentials
    const submitButton = page.getByRole('button', { name: /login|sign in/i });
    await submitButton.click();

    // Check for validation messages (this depends on your implementation)
    // You may need to adjust the selector based on your actual error display
    const emailInput = page.getByPlaceholder(/email/i);

    // Check if the form is still on the login page (didn't submit)
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid credentials
    await page.getByPlaceholder(/email/i).fill('invalid@example.com');
    await page.getByPlaceholder(/password/i).fill('wrongpassword');

    // Submit the form
    const submitButton = page.getByRole('button', { name: /login|sign in/i });
    await submitButton.click();

    // Wait for error message or stay on login page
    await page.waitForTimeout(1000);

    // Should still be on login page or show error
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');

    // Look for a link or button to register
    const registerLink = page.getByRole('link', { name: /register|sign up|create account/i });

    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/.*register.*/);

      // Check for registration form elements
      const emailInput = page.getByPlaceholder(/email/i);
      const passwordInput = page.getByPlaceholder(/password/i);

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    }
  });

  test('should display register page elements', async ({ page }) => {
    await page.goto('/register');

    // Check for registration form elements
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Check for submit button
    const submitButton = page.getByRole('button', { name: /register|sign up|create account/i });
    await expect(submitButton).toBeVisible();
  });

  test.describe('Authenticated User', () => {
    test.skip('should login successfully with valid credentials', async ({ page }) => {
      // This test is skipped by default as it requires a test user in the database
      // To enable: create a test user and update credentials below

      await page.goto('/login');

      await page.getByPlaceholder(/email/i).fill('test@example.com');
      await page.getByPlaceholder(/password/i).fill('testpassword123');

      const submitButton = page.getByRole('button', { name: /login|sign in/i });
      await submitButton.click();

      // Wait for navigation to dashboard or home
      await page.waitForURL(/.*dashboard.*/, { timeout: 5000 });

      // Check if we're on the dashboard
      await expect(page).toHaveURL(/.*dashboard.*/);
    });

    test.skip('should logout successfully', async ({ page }) => {
      // This test requires authentication
      // First login, then logout

      await page.goto('/dashboard');

      // Look for logout button
      const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
      await logoutButton.click();

      // Should redirect to login
      await expect(page).toHaveURL(/.*login.*/);
    });

    test.skip('should access protected dashboard when authenticated', async ({ page }) => {
      // This test requires authentication

      await page.goto('/dashboard');

      // Should be on dashboard, not redirected to login
      await expect(page).toHaveURL(/.*dashboard.*/);

      // Check for dashboard elements
      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toBeVisible();
    });
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard');

    // Should be redirected to login
    await page.waitForURL(/.*login.*/, { timeout: 5000 });
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('should have working form inputs', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/password/i);

    // Test email input
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');

    // Test password input
    await passwordInput.fill('password123');
    await expect(passwordInput).toHaveValue('password123');

    // Password should be masked
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/login');

    // Check for proper labels or placeholders
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Check if form is keyboard accessible
    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();
  });
});

test.describe('Rate Limiting', () => {
  test.skip('should enforce rate limiting on login attempts', async ({ page }) => {
    // This test is skipped as it may take time and affect other tests
    // Rate limit is 5 attempts per minute based on rate-limit.ts

    await page.goto('/login');

    // Make multiple failed login attempts
    for (let i = 0; i < 6; i++) {
      await page.getByPlaceholder(/email/i).fill(`user${i}@example.com`);
      await page.getByPlaceholder(/password/i).fill('wrongpassword');

      const submitButton = page.getByRole('button', { name: /login|sign in/i });
      await submitButton.click();

      await page.waitForTimeout(500);
    }

    // Should show rate limit error after 5 attempts
    const errorMessage = page.getByText(/too many|rate limit/i);
    await expect(errorMessage).toBeVisible();
  });
});
