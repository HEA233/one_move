import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("desktop keeps the scene left, the wider controls right and height content-driven", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 2400 });
  await page.goto("/play?rehearsal=local");
  await page.getByRole("button", { name: "Take a little wander" }).click();
  await expect(page.getByRole("heading", { name: "Where are you heading?" })).toBeVisible();
  const scene = await page.getByTestId("street-scene").boundingBox();
  const controls = await page.locator('section[aria-live="polite"]').boundingBox();
  expect(scene).not.toBeNull();
  expect(controls).not.toBeNull();
  expect(scene!.x + scene!.width).toBeLessThan(controls!.x);
  expect(controls!.width / scene!.width).toBeCloseTo(2, 1);
  expect(controls!.height).toBeLessThan(1000);
  for (const image of await page.locator("article img").all()) {
    expect(await image.evaluate((element) => element.clientHeight <= element.parentElement!.clientHeight)).toBe(true);
  }
  await expect(page.getByRole("button", { name: "That's my pick" })).toBeInViewport();
});

test("the shopper can inspect, receive a note, and save one final choice", async ({ page }) => {
  await page.goto("/play?rehearsal=local");
  await expect(page.getByRole("heading", { name: "Two drinks. One little detour." })).toBeVisible();

  await page.getByRole("button", { name: "Take a little wander" }).click();
  await expect(page.getByRole("heading", { name: "Where are you heading?" })).toBeVisible();
  await expect(page.locator('[data-product-id="charitea_mate_can"]')).toContainText("£1.95 per can");
  await expect(page.locator('[data-product-id="oom_balance"]')).toContainText("£3.00 per can");
  await expect(page.locator('[data-product-id="oom_balance"]')).toContainText("250 ml");

  const firstChoice = page.getByRole("button", { name: "Choose this drink" }).first();
  await firstChoice.click();
  await expect(page.getByRole("button", { name: "Picked" })).toHaveAttribute("aria-pressed", "true");

  const firstDetails = page.getByRole("button", { name: "What's in it?" }).first();
  await firstDetails.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await expect(page.getByRole("button", { name: "That's my pick" })).toBeInViewport();
  await page.getByRole("button", { name: "That's my pick" }).click();
  await expect(page.getByRole("heading", { name: "What caught your eye?" })).toBeVisible();
  await page.getByRole("button", { name: "Taste" }).click();
  await page.getByRole("button", { name: "Ingredients" }).click();
  await expect(page.getByRole("button", { name: "Sugar & calories" })).toBeDisabled();
  await page.getByRole("button", { name: "Off we go" }).click();

  await expect(page.getByRole("heading", { name: "A little note is on its way." })).toBeVisible();
  await expect(page.getByTestId("note-reveal")).toBeVisible({ timeout: 2_000 });
  await expect(page.getByTestId("note-reveal")).toContainText("We've added a detail to our product description:");
  await expect(page.getByTestId("note-reveal")).toContainText("Would you give us another look?");
  await page.getByRole("button", { name: "View source" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("button", { name: "Have another look" }).click();
  await expect(page.getByRole("heading", { name: "Same two drinks. One thing changed." })).toBeVisible();
  await expect(page.locator('[data-product-id="charitea_mate_can"]')).toContainText("£1.95 per can");
  await expect(page.locator('[data-product-id="oom_balance"]')).toContainText("£3.00 per can");
  await expect(page.getByRole("button", { name: /^(Still|Let's try)/ }).first()).toBeInViewport();
  await page.getByRole("button", { name: /^(Still|Let's try)/ }).first().click();
  await expect(page.getByText("Choice saved", { exact: true })).toBeVisible();
  await expect(page.getByText("One observed choice, not a sale.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "All done" }).click();
  await expect(page.getByRole("heading", { name: "Two drinks. One little detour." })).toBeVisible();
});

test("offline rehearsal can reconnect before sending the first choice", async ({ page }) => {
  await page.goto("/play?rehearsal=offline");
  const connectionAlert = page.getByRole("alert").filter({ hasText: "A wobbly connection" });
  await expect(connectionAlert).toBeVisible();
  await page.getByRole("button", { name: "Try reconnecting" }).click();
  await expect(connectionAlert).toHaveCount(0);
  await page.getByRole("button", { name: "Take a little wander" }).click();
  await page.getByRole("button", { name: "Choose this drink" }).first().click();
  await page.getByRole("button", { name: "That's my pick" }).click();
  await expect(page.getByRole("heading", { name: "What caught your eye?" })).toBeVisible();
});

test("a save error leaves one clear retry action", async ({ page }) => {
  await page.goto("/play?rehearsal=save-error");
  await page.getByRole("button", { name: "Take a little wander" }).click();
  await page.getByRole("button", { name: "Choose this drink" }).first().click();
  await page.getByRole("button", { name: "That's my pick" }).click();
  await page.getByRole("button", { name: "Keep it a mystery" }).click();
  await page.getByRole("button", { name: "Have another look" }).click();
  await page.getByRole("button", { name: /^(Still|Let's try)/ }).first().click();

  await expect(page.getByRole("alert").filter({ hasText: "couldn't save" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save this choice again" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^(Still|Let's try)/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Save this choice again" }).click();
  await expect(page.getByText("Choice saved", { exact: true })).toBeVisible();
});
