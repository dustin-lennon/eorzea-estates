import { test, expect } from "@playwright/test"

test.describe("Homepage", () => {
  test("renders the site title and navigation", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/Eorzea Estates/)
    await expect(page.getByRole("link", { name: /Eorzea Estates/i }).first()).toBeVisible()
    await expect(page.getByRole("link", { name: "Browse", exact: true })).toBeVisible()
  })

  test("has a Browse Estates CTA button", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("link", { name: /Browse Estates/i })).toBeVisible()
  })

  test("has a Submit Your Estate CTA button", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("link", { name: /Submit Your Estate/i })).toBeVisible()
  })

  test("Browse Estates navigates to /directory", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: /Browse Estates/i }).click()
    await expect(page).toHaveURL(/\/directory/)
  })
})

test.describe("Directory page", () => {
  test("renders the Browse Estates heading", async ({ page }) => {
    await page.goto("/directory")
    await expect(page.getByRole("heading", { name: /Browse Estates/i })).toBeVisible()
  })

  test("shows the estate count", async ({ page }) => {
    await page.goto("/directory")
    await expect(page.getByText(/estates? in the directory/i)).toBeVisible()
  })
})

test.describe("Login page", () => {
  test("renders the Discord sign-in button", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByRole("button", { name: /Continue with Discord/i })).toBeVisible()
  })
})

test.describe("Submit page (unauthenticated)", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/submit")
    await expect(page).toHaveURL(/\/login/)
  })
})
