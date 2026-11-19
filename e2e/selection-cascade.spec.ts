import { test, expect } from '@playwright/test';

test.describe('Selection Cascade Regression', () => {
  test('changing state never shows a ward from previous state', async ({ page }) => {
    // 1. Load /app with default state (Maharashtra / Mumbai)
    await page.goto('/app');

    // Allow initial load
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    const initialText = await heading.textContent();
    expect(initialText).toContain('Mumbai');
    expect(initialText).not.toContain('Hyderabad');

    // 2. Change state to Telangana
    const stateSelect = page.locator('select[aria-label="Select State"]');
    await stateSelect.selectOption('Telangana');

    // 3. Assert header's city equals newly selected city and contains no previous state ward
    await expect(heading).toBeVisible();
    const telanganaText = await heading.textContent();
    expect(telanganaText).toContain('Hyderabad');
    expect(telanganaText).not.toContain('Mumbai');
    expect(telanganaText).not.toContain('Ward M/East');
    expect(telanganaText).not.toContain('Ward M-East');
    expect(telanganaText).not.toContain('Ward A');

    // Check that either a valid Telangana district or explicit district-level message is shown
    const pageText = await page.textContent('body');
    const hasDistrictLabel =
      pageText?.includes('District-level data only') ||
      pageText?.includes('Hyderabad District') ||
      pageText?.includes('Select a ward');
    expect(hasDistrictLabel).toBe(true);

    // 4. Change back to original state (Maharashtra)
    await stateSelect.selectOption('Maharashtra');
    await expect(heading).toBeVisible();
    const restoredText = await heading.textContent();
    expect(restoredText).toContain('Mumbai');
    expect(restoredText).not.toContain('Hyderabad');
  });
});
