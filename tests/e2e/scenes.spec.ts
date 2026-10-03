import { expect, test } from "@playwright/test";

test.describe("independent task and pick scenes", () => {
  test("keeps the original task wording and exposes an ambiguous fixture", async ({ page }) => {
    await page.goto("/sandbox/mission");

    await expect(page.getByRole("heading", { name: "What are you after?" })).toBeVisible();
    await expect(page.getByText(/I want a crisp snack for a walk between meetings\./)).toBeVisible();
    await page.getByRole("button", { name: /Something filling, not too sweet/ }).click();
    await expect(page.getByText(/I need something filling, but not too sweet\./)).toBeVisible();
    await expect(page.getByText("Filling and not too sweet are not converted into nutrition rules in this preview.", { exact: true })).toBeVisible();
    await expect(page.getByText("Needs clarification", { exact: true })).toBeVisible();
  });

  test("keeps product choice, details, none and reset actions separate", async ({ page }) => {
    await page.goto("/sandbox/pick");

    await expect(page.locator(".pick-product-card")).toHaveCount(6);
    await expect(page.getByText("Price not available", { exact: true })).toBeVisible();
    await expect(page.getByText("No", { exact: true })).toBeVisible();
    await expect(page.getByText("0 g", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("per pack", { exact: true })).toHaveCount(4);
    await expect(page.getByText("A Very Long Fictional Product Name for a Small Cracker Pack", { exact: true })).toBeVisible();

    const firstProduct = page.locator(".pick-product-card").first();
    const chooseButton = firstProduct.locator("button").first();
    const detailsButton = firstProduct.getByRole("button", { name: "View product details" });

    await detailsButton.click();
    await expect(page.getByRole("dialog").getByRole("button", { name: /Close details/ })).toBeVisible();
    await expect(chooseButton).toHaveAttribute("aria-pressed", "false");
    await page.keyboard.press("Escape");
    await expect(detailsButton).toBeFocused();

    await detailsButton.click();
    const closeButton = page.getByRole("button", { name: /Close details/ });
    await chooseButton.click();
    await expect(chooseButton).toBeFocused();
    await closeButton.click();
    await expect(detailsButton).toBeFocused();

    await chooseButton.click();
    await expect(chooseButton).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("Selection noted locally for this preview.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "None of these" })).toBeVisible();
    await page.getByRole("button", { name: "Change my pick" }).click();
    await expect(chooseButton).toHaveAttribute("aria-pressed", "false");
    await chooseButton.click();
    await page.getByRole("button", { name: "None of these" }).click();
    await expect(page.getByText("No pick this round. That's a valid choice.", { exact: true })).toBeVisible();
    await expect(page.locator('.pick-product-actions [aria-pressed="true"]')).toHaveCount(0);
    await page.getByRole("button", { name: "Reset this example" }).click();
    await expect(page.getByText("Nothing held yet.", { exact: true })).toBeVisible();
  });

  test("keeps the six-product grid inside a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto("/sandbox/pick");
    const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  });
});
