import { expect, test } from "@playwright/test";

test.describe("independent rescue scene", () => {
  test("keeps external focus while the non-modal evidence drawer is open", async ({ page }) => {
    await page.goto("/sandbox/rescue");
    await page.getByRole("button", { name: "Example source", exact: true }).click();
    const productTab = page.getByRole("tab", { name: "Product view", exact: true });
    await productTab.click();
    await expect(productTab).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Example source", exact: true })).toBeFocused();
  });

  test("applies supplied snapshot fields and restores the baseline in every checked fixture", async ({ page }) => {
    await page.goto("/sandbox/rescue");
    for (const [id, key, value] of [
      ["rescue-shortlisted", "protein", "18 g per pack"],
      ["rescue-no-change", "fibre", "4 g per 100 g"],
      ["rescue-more-unfavorable", "price", "£4.80 per pack"],
      ["rescue-error", "protein", "18 g per pack"],
    ]) {
      await page.locator("#rescue-fixture").selectOption(id);
      const fields = page.locator(".lens-snapshot-fields");
      const baseline = await fields.innerText();
      await page.getByText("View raw fields", { exact: true }).click();
      const raw = page.locator(".lens-raw-details li").filter({ has: page.locator("code", { hasText: new RegExp(`^${key}$`) }) });
      await expect(raw.locator("span")).toHaveText("missing");
      await page.locator(".fact-sticker-select").click();
      await page.getByRole("button", { name: "Add this fact", exact: true }).click();
      await expect(fields.locator("dd").filter({ hasText: value })).toHaveText(value);
      await expect(raw.locator("span")).toHaveText(value);
      await page.getByRole("button", { name: "Compare the shortlist", exact: true }).click();
      await expect(raw.locator("span")).toHaveText(value);
      await page.getByRole("button", { name: "Reset this example", exact: true }).click();
      await expect(fields).toHaveText(baseline, { useInnerText: true });
      await expect(raw.locator("span")).toHaveText("missing");
      await page.getByText("View raw fields", { exact: true }).click();
    }
  });

  test("keeps fact selection, source viewing and application separate", async ({ page }) => {
    await page.goto("/sandbox/rescue");

    const fact = page.locator(".fact-sticker-select").first();
    await expect(fact).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("button", { name: "Example source" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Synthetic package text", { exact: true })).toBeVisible();
    await expect(page.getByText("Checked example", { exact: true }).last()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Example source" })).toBeFocused();
    await expect(fact).toHaveAttribute("aria-pressed", "false");

    await fact.click();
    await expect(fact).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Add this fact" }).click();
    await expect(page.getByRole("heading", { name: "Only one field changed" })).toBeVisible();
    await expect(page.getByText("18 g per pack", { exact: true }).last()).toBeVisible();
    await page.getByRole("button", { name: "Compare the shortlist" }).click();
    await expect(page.getByRole("heading", { name: "Made the shortlist." })).toBeVisible();
    await expect(page.getByText("UI fixture — not an AI result", { exact: true }).last()).toBeVisible();
    await page.getByText("See what changed", { exact: true }).click();
    await expect(page.getByText("One fact later.", { exact: true })).toBeVisible();
    await expect(page.getByText("UI fixture — not a shopping recommendation.", { exact: true })).toBeVisible();
    await expect(page.getByText("Position", { exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: "Reset this example" }).click();
    await expect(page.getByRole("heading", { name: "Only one field changed" })).toHaveCount(0);
    await expect(fact).toHaveAttribute("aria-pressed", "false");
  });

  test("shows unchanged, more unfavorable, no fact, unreviewed and error fixtures", async ({ page }) => {
    await page.goto("/sandbox/rescue");
    const fixture = page.locator("#rescue-fixture");
    const fact = page.locator(".fact-sticker-select").first();
    const add = page.getByRole("button", { name: "Add this fact" });

    await fixture.selectOption("rescue-no-change");
    await fact.click();
    await add.click();
    await page.getByRole("button", { name: "Compare the shortlist" }).click();
    await expect(page.getByRole("heading", { name: "More information. Same shortlist." })).toBeVisible();
    await page.getByText("See what changed", { exact: true }).click();
    await expect(page.getByText("outside the shortlist", { exact: true }).last()).toBeVisible();

    await fixture.selectOption("rescue-more-unfavorable");
    await page.locator(".fact-sticker-select").first().click();
    await add.click();
    await page.getByRole("button", { name: "Compare the shortlist" }).click();
    await expect(page.getByRole("heading", { name: "A clearer picture. A different result." })).toBeVisible();
    await expect(page.getByText(/above the £3\.00 budget/)).toBeVisible();

    await fixture.selectOption("rescue-no-fact");
    await expect(page.getByRole("heading", { name: "No checked fact to add yet." })).toBeVisible();
    await expect(add).toBeDisabled();
    await expect(page.getByText("The preview will not generate a fact to fill the gap.", { exact: true })).toBeVisible();

    await fixture.selectOption("rescue-unreviewed");
    const unreviewedFact = page.locator(".fact-sticker-select").first();
    await unreviewedFact.click();
    await expect(add).toBeDisabled();
    await expect(page.getByRole("heading", { name: "This fact is not checked yet." })).toBeVisible();

    await fixture.selectOption("rescue-error");
    await page.locator(".fact-sticker-select").first().click();
    await add.click();
    await page.getByRole("button", { name: "Compare the shortlist" }).click();
    await expect(page.getByRole("heading", { name: "The preview could not finish." })).toBeVisible();
    await page.getByRole("button", { name: "Retry this example" }).click();
    await expect(page.getByRole("button", { name: "Add this fact" })).toBeVisible();
    await expect(page.locator(".fact-sticker-select").first()).toHaveAttribute("aria-pressed", "true");
  });

  test("fits the rescue evidence flow at 375 and 390 pixels", async ({ page }) => {
    for (const width of [375, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/sandbox/rescue");
      const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
      expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
    }
  });
});

test("adding a fact highlights one field and never claims a contradictory budget match", async ({ page }) => {
  await page.goto("/sandbox/rescue");
  await page.locator("#rescue-fixture").selectOption("rescue-more-unfavorable");
  await page.locator(".fact-sticker-select").click();
  await page.getByRole("button", { name: "Add this fact", exact: true }).click();
  const fields = page.locator(".lens-snapshot-fields");
  await expect(fields.getByText("Budget", { exact: true })).toHaveCount(0);
  await expect(fields.getByText("Added fact", { exact: true })).toHaveCount(1);
  await expect(fields.getByText("Above the £3.00 budget.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset this example", exact: true }).click();
  await expect(fields.getByText("Added fact", { exact: true })).toHaveCount(0);
  await expect(fields.getByText("Not recorded in this snapshot", { exact: true })).toHaveCount(1);
});

test("repeated clicks add a single fact and reduced motion keeps the result complete", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/sandbox/rescue");
  await page.locator(".fact-sticker-select").click();
  await page.getByRole("button", { name: "Add this fact", exact: true }).evaluate((element: HTMLButtonElement) => { element.click(); element.click(); });
  await expect(page.getByRole("button", { name: "Add this fact", exact: true })).toBeDisabled();
  await expect(page.getByText("Added fact", { exact: true })).toHaveCount(1);
  expect(await page.locator(".lens-added-value").evaluate((element) => element.getAnimations().length)).toBe(0);
  await page.getByRole("button", { name: "Compare the shortlist", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Made the shortlist." })).toBeVisible();
  await page.getByRole("button", { name: "Reset this example", exact: true }).click();
  await expect(page.getByText("Added fact", { exact: true })).toHaveCount(0);
});
