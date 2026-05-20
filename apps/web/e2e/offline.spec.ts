import { test, expect } from '@playwright/test'

test.describe('Offline page', () => {
  test('renders offline message and try again button', async ({ page }) => {
    await page.goto('/offline')
    await expect(page.getByRole('heading', { name: "You're offline" })).toBeVisible()
    await expect(
      page.getByText('No internet connection detected. Check your connection and try again.')
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  })

  test('try again button triggers a page reload', async ({ page }) => {
    await page.goto('/offline')
    // window.location.reload() fires a load event — wait for it
    await Promise.all([
      page.waitForEvent('load'),
      page.getByRole('button', { name: 'Try again' }).click(),
    ])
    expect(page.url()).toContain('/offline')
  })
})
