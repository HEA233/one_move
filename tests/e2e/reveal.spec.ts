import { expect, test } from "@playwright/test";

test.describe("independent reveal scene", () => {
  test("switches information views without changing the product and reveals a supplied shortlist", async ({ page }) => {
    await page.goto("/sandbox/reveal");

    const productName = page.getByRole("heading", { name: "Morrow Oat Square", level: 2 });
    await expect(productName).toBeVisible();
    await expect(page.getByRole("tab", { name: "Product view" })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("tab", { name: "Agent's catalogue snapshot" }).click();
    await expect(page.getByRole("tab", { name: "Agent's catalogue snapshot" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("Not recorded in this snapshot", { exact: true }).first()).toBeVisible();
    await page.getByText("View raw fields", { exact: true }).click();
    await expect(page.getByText("vegan", { exact: true })).toBeVisible();
    await expect(productName).toBeVisible();

    await page.getByRole("button", { name: "See the shortlist" }).click();
    await expect(page.getByRole("heading", { name: "Not on this shortlist." })).toBeVisible();
    await expect(page.getByText("Let's look at the information behind it.", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Supplied shortlist" })).toBeVisible();
    await expect(page.locator(".reveal-shortlist .product-card")).toHaveCount(3);
  });

  test("exposes included, unknown, mismatch and failed result fixtures without fallback success", async ({ page }) => {
    await page.goto("/sandbox/reveal");
    const fixture = page.locator("#reveal-fixture");

    await fixture.selectOption("already-shortlisted");
    await page.getByRole("button", { name: "See the shortlist" }).click();
    await expect(page.getByRole("heading", { name: "Same pick. Let's see why." })).toBeVisible();

    await fixture.selectOption("cannot-verify");
    await page.getByRole("button", { name: "See the shortlist" }).click();
    await expect(page.getByRole("heading", { name: "Not enough information." })).toBeVisible();
    await expect(page.getByText("Unconfirmed: Vegan", { exact: true })).toBeVisible();

    await fixture.selectOption("budget-mismatch");
    await page.getByRole("button", { name: "See the shortlist" }).click();
    await expect(page.getByRole("heading", { name: "Outside the budget." })).toBeVisible();
    await expect(page.getByText(/above the £3\.00 mission budget/)).toBeVisible();

    await fixture.selectOption("run-error");
    await page.getByRole("button", { name: "See the shortlist" }).click();
    await expect(page.getByRole("heading", { name: "No shortlist available." })).toBeVisible();
    await expect(page.getByText(/Nothing is being invented as a fallback\./)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Supplied shortlist" })).toHaveCount(0);
    await page.getByRole("button", { name: "Try this fixture again" }).click();
    await expect(page.getByRole("button", { name: "See the shortlist" })).toBeVisible();
  });

  test("fits at 375 pixels without hiding the result text", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto("/sandbox/reveal");
    const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
    await page.getByRole("button", { name: "See the shortlist" }).click();
    await expect(page.getByRole("heading", { name: "Not on this shortlist." })).toBeVisible();
  });
});
