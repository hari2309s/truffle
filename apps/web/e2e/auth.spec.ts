import { test, expect } from '@playwright/test'

/**
 * Auth page tests — all run unauthenticated.
 * Supabase password and OAuth endpoints are intercepted so no real auth happens.
 */
test.describe('Auth page', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept the Supabase password sign-in endpoint
    await page.route('**/auth/v1/token?grant_type=password**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    )
    // Intercept the Supabase sign-up endpoint
    await page.route('**/auth/v1/signup**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    )
  })

  test('shows Truffle branding, email form, and Google SSO button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Truffle' })).toBeVisible()
    await expect(page.getByText('Your finances, unearthed.', { exact: true })).toBeVisible()
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
  })

  test('sign-in button is enabled with a valid email and password', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('your@email.com').fill('test@example.com')
    await page.getByPlaceholder('Password').fill('password123')
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  })

  test('can toggle between sign-in and sign-up modes', async ({ page }) => {
    await page.goto('/')
    // Default is sign-in
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByText(/Don.t have an account\? Sign up/)).toBeVisible()

    // Switch to sign-up
    await page.getByText(/Don.t have an account\? Sign up/).click()
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible()
    await expect(page.getByText('Already have an account? Sign in')).toBeVisible()

    // Switch back
    await page.getByText('Already have an account? Sign in').click()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('shows error when ?error=auth_failed is in URL', async ({ page }) => {
    await page.goto('/?error=auth_failed')
    await expect(page.getByText('Sign-in failed. Please try again.')).toBeVisible()
  })

  test('shows footer text', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Your data stays yours')).toBeVisible()
  })

  test('sign-in button is enabled even when fields are empty', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  })
})
