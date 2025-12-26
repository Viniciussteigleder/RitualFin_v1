import { test, expect } from '@playwright/test';

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const devAutoLogin = process.env.ENABLE_DEV_AUTOLOGIN === 'true' || process.env.E2E_MODE === 'true';
const manualLoginAvailable = Boolean(email && password);
const shouldRun = devAutoLogin || manualLoginAvailable;

const describeIf = shouldRun ? test.describe : test.describe.skip;

describeIf('RitualFin smoke', () => {
  test('login -> painel -> refresh', async ({ page }) => {
    if (devAutoLogin) {
      await page.goto('/dev/autologin');
    } else {
      await page.goto('/(auth)/login');
      await page.getByLabel('Email').fill(email ?? '');
      await page.getByLabel('Senha').fill(password ?? '');
      await page.getByRole('button', { name: 'Entrar' }).click();
    }
    await page.waitForURL('**/painel');
    await expect(page.getByRole('heading', { name: 'Painel mensal' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Painel mensal' })).toBeVisible();
  });

  test('logout', async ({ page }) => {
    if (devAutoLogin) {
      await page.goto('/dev/autologin');
    } else {
      await page.goto('/(auth)/login');
      await page.getByLabel('Email').fill(email ?? '');
      await page.getByLabel('Senha').fill(password ?? '');
      await page.getByRole('button', { name: 'Entrar' }).click();
    }
    await page.waitForURL('**/painel');
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.waitForURL('**/login');
  });
});

const invalidDescribe =
  process.env.E2E_RUN_INVALID === 'true' && manualLoginAvailable ? test.describe : test.describe.skip;

invalidDescribe('Invalid login', () => {
  test('shows error', async ({ page }) => {
    await page.goto('/(auth)/login');
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Senha').fill('wrong-password');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText(/invalid login credentials/i)).toBeVisible();
  });
});
