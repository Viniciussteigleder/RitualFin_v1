import { test, expect } from '@playwright/test';

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

const shouldRun = Boolean(email && password);

const describeIf = shouldRun ? test.describe : test.describe.skip;

describeIf('RitualFin smoke', () => {
  test('login -> painel', async ({ page }) => {
    await page.goto('/(auth)/login');
    await page.getByLabel('Email').fill(email ?? '');
    await page.getByLabel('Senha').fill(password ?? '');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL('**/painel');
    await expect(page.getByRole('heading', { name: 'Painel mensal' })).toBeVisible();
  });
});
