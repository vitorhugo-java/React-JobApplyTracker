import { test as base, expect, type Page } from '@playwright/test'
import { installMockApi, seedAuth } from './mockApi'

export { expect }
export const test = base

/** Mock the API and seed an authenticated session, then return the page. */
export async function setupAuthed(page: Page, options?: { empty?: boolean }) {
  await installMockApi(page, options)
  await seedAuth(page)
}

/** Mock the API only (no session) — for auth flow tests. */
export async function setupGuest(page: Page) {
  await installMockApi(page)
}
