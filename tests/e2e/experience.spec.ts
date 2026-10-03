import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

async function activate(control: Locator) {
  await control.focus();
  await expect(control).toBeFocused();
  await control.press("Enter");
}

async function capture(page: Page, info: TestInfo, name: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), name).toBe(false);
  await expect(page.getByText("UI preview · fictional data", { exact: true })).toBeVisible();
  const overflowingLabels = await page.locator(".preview-button").evaluateAll(buttons => buttons.flatMap(button => {
    const label = button.querySelector(".preview-button-label");
    if (!label || getComputedStyle(label).visibility === "hidden") return [];
    const outer = button.getBoundingClientRect();
    const inner = label.getBoundingClientRect();
    return inner.left < outer.left - 1 || inner.right > outer.right + 1 ? [label.textContent] : [];
  }));
  expect(overflowingLabels, `${name}: visible button labels must remain clickable`).toEqual([]);
  // Full-page captures otherwise render sticky/fixed elements at the old scroll offset.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true });
}

async function primaryInView(control: Locator) {
  // Measure before Playwright can auto-scroll an offscreen control into view.
  const box = await control.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(900);
  expect(box!.height).toBeGreaterThanOrEqual(44);
}

for (const width of [375, 390, 768, 1440]) {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test(`complete experience at ${width}px with ${reducedMotion} motion`, async ({ page, baseURL }, info) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion });
      const errors: string[] = [];
      const externalRequests: string[] = [];
      const writes: string[] = [];
      page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
      page.on("pageerror", error => errors.push(error.message));
      await page.route("**/*", async route => {
        const request = route.request();
        if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(baseURL!).origin) {
          externalRequests.push(request.url());
          await route.abort();
          return;
        }
        if (!["GET", "HEAD"].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
        await route.continue();
      });

      await page.goto("/sandbox/mission");
      await page.waitForLoadState("networkidle");
      const firstBrief = page.getByRole("button", { name: /A crisp afternoon snack/ });
      await primaryInView(firstBrief);
      // Traverse the real tab order rather than relying only on programmatic focus.
      for (let i = 0; i < 12 && !(await firstBrief.evaluate(el => el === document.activeElement)); i++) await page.keyboard.press("Tab");
      await expect(firstBrief).toBeFocused();
      expect(await firstBrief.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe("none");
      await capture(page, info, "mission-initial");
      await activate(page.getByRole("button", { name: /Something filling, not too sweet/ }));
      await expect(page.getByText("Needs clarification", { exact: true })).toBeVisible();
      await expect(page.locator(".mission-ticket-request")).toContainText("filling, but not too sweet");
      await capture(page, info, "mission-ambiguous");
      await activate(firstBrief);
      await expect(firstBrief).toHaveAttribute("aria-pressed", "true");

      await page.goto("/sandbox/pick");
      await page.waitForLoadState("networkidle");
      const cards = page.locator(".pick-product-card");
      const choose = cards.first().locator("button").first();
      await primaryInView(choose);
      await expect(page.locator(".pick-storyboard")).toHaveCount(0);
      const order = await cards.locator("h3").allTextContents();
      await expect(cards.nth(1)).toContainText("Price not available");
      await expect(cards.nth(1)).toContainText("Not available");
      await expect(cards.nth(1).getByText("No", { exact: true })).toBeVisible();
      await expect(cards.nth(1).getByText("0 g", { exact: true })).toBeVisible();
      await expect(cards.first()).toContainText("per 100 g");
      await expect(cards.nth(2)).toContainText("per pack");
      await capture(page, info, "pick-initial");
      const detailTrigger = cards.last().getByRole("button", { name: "View product details" });
      await activate(detailTrigger);
      await expect(page.getByRole("dialog")).toContainText("A Very Long Fictional Product Name for a Small Cracker Pack");
      await expect(page.getByRole("button", { name: /Close details/ })).toBeFocused();
      await capture(page, info, "pick-long-name-drawer");
      await page.keyboard.press("Escape");
      await expect(detailTrigger).toBeFocused();
      await activate(choose);
      // A repeated activation must not unset the local pick or add another confirmation.
      await choose.press("Enter");
      await expect(choose).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(".pick-selection")).toContainText("Selection noted locally");
      await expect(page.locator(".pick-selection .preview-button--primary")).toHaveCount(0);
      const replacement = cards.last().locator("button").first();
      await activate(replacement);
      await expect(choose).toHaveAttribute("aria-pressed", "false");
      await expect(cards.locator("h3")).toHaveText(order);
      await capture(page, info, "pick-replaced");
      await activate(page.getByRole("button", { name: "Change my pick", exact: true }));
      await expect(page.getByText("Nothing held yet.", { exact: true })).toBeVisible();
      await activate(page.getByRole("button", { name: "None of these", exact: true }));
      await expect(page.getByText("No pick this round. That's a valid choice.", { exact: true })).toBeVisible();
      await capture(page, info, "pick-none");
      await activate(page.getByRole("button", { name: "Reset this example", exact: true }));

      await page.goto("/sandbox/reveal");
      await page.waitForLoadState("networkidle");
      const reveal = page.getByRole("button", { name: "See the shortlist", exact: true });
      await primaryInView(reveal);
      const productTab = page.getByRole("tab", { name: "Product view", exact: true });
      const snapshotTab = page.getByRole("tab", { name: "Agent's catalogue snapshot", exact: true });
      const identity = await page.locator(".lens-identity").innerText();
      await productTab.focus();
      await page.keyboard.press("ArrowRight");
      await expect(snapshotTab).toBeFocused();
      await expect(snapshotTab).toHaveAttribute("aria-selected", "true");
      await page.keyboard.press("Home");
      await expect(productTab).toBeFocused();
      await expect(page.locator(".lens-identity")).toHaveText(identity, { useInnerText: true });
      await capture(page, info, "reveal-initial");
      for (const [id, title] of [
        ["outside-shortlist", "Not on this shortlist."],
        ["already-shortlisted", "Same pick. Let's see why."],
        ["cannot-verify", "Not enough information."],
        ["budget-mismatch", "Outside the budget."],
        ["run-error", "No shortlist available."],
      ]) {
        await page.locator("#reveal-fixture").selectOption(id);
        await activate(reveal);
        await reveal.evaluate((el: HTMLButtonElement) => { el.click(); el.click(); });
        await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
        await expect(page.locator(".reveal-result-copy > p").first()).not.toBeEmpty();
        await expect(page.locator(".reveal-result")).toContainText("UI fixture — not an AI result");
        if (id === "cannot-verify") await expect(page.getByText("Unconfirmed: Vegan", { exact: true })).toBeVisible();
        if (id === "run-error") await expect(page.locator(".reveal-shortlist")).toHaveCount(0);
        await capture(page, info, `reveal-${id}`);
        await activate(page.getByRole("button", { name: "Reset this example", exact: true }));
        await expect(page.locator("#reveal-fixture")).toHaveValue(id);
        await expect(page.locator(".reveal-result")).toHaveCount(0);
      }

      await page.goto("/sandbox/rescue");
      await page.waitForLoadState("networkidle");
      await primaryInView(page.locator(".fact-sticker-select"));
      await capture(page, info, "rescue-initial");
      for (const [id, title] of [
        ["rescue-shortlisted", "Made the shortlist."],
        ["rescue-no-change", "More information. Same shortlist."],
        ["rescue-more-unfavorable", "A clearer picture. A different result."],
        ["rescue-no-fact", "No checked fact to add yet."],
        ["rescue-unreviewed", "This fact is not checked yet."],
        ["rescue-error", "The preview could not finish."],
      ]) {
        await page.locator("#rescue-fixture").selectOption(id);
        const fields = page.locator(".lens-snapshot-fields");
        const baseline = await fields.innerText();
        const fact = page.locator(".fact-sticker-select");
        const add = page.getByRole("button", { name: "Add this fact", exact: true });
        if (id !== "rescue-no-fact") {
          const source = page.getByRole("button", { name: "Example source", exact: true });
          await activate(source);
          await expect(page.getByRole("button", { name: "Close evidence", exact: true })).toBeFocused();
          await expect(page.getByRole("dialog")).toContainText("Synthetic package text");
          await capture(page, info, `${id}-source`);
          await activate(productTab);
          await expect(productTab).toBeFocused();
          await page.keyboard.press("Escape");
          await expect(source).toBeFocused();
          await expect(fact).toHaveAttribute("aria-pressed", "false");
          await activate(fact);
          await activate(fact);
          await expect(add).toBeDisabled();
          await activate(fact);
        }
        if (!["rescue-no-fact", "rescue-unreviewed"].includes(id)) {
          await activate(productTab);
          const productFacts = await page.locator(".lens-product-view").innerText();
          await activate(add);
          await add.evaluate((el: HTMLButtonElement) => { el.click(); el.click(); });
          await expect(add).toBeDisabled();
          await expect(page.locator(".lens-field--added")).toHaveCount(1);
          await expect(snapshotTab).toHaveAttribute("aria-selected", "true");
          if (reducedMotion === "reduce") {
            expect(await page.locator(".lens-added-value").evaluate(el => el.getAnimations().length)).toBe(0);
          }
          await capture(page, info, `${id}-applied`);
          await activate(productTab);
          await expect(page.locator(".lens-product-view")).toHaveText(productFacts, { useInnerText: true });
          await activate(snapshotTab);
          await activate(page.getByRole("button", { name: "Compare the shortlist", exact: true }));
        } else {
          await expect(add).toBeDisabled();
        }
        await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
        await expect(page.locator(".rescue-outcome > p").first()).not.toBeEmpty();
        await expect(page.locator(".rescue-outcome")).toContainText("UI fixture — not an AI result");
        await activate(page.locator(".receipt-card summary"));
        await expect(page.locator(".receipt-card-body")).toContainText("UI fixture — not a shopping recommendation.");
        await expect(page.locator(".receipt-card-body").getByText("Position", { exact: true })).toHaveCount(0);
        await capture(page, info, `${id}-result`);
        if (id === "rescue-error") {
          await activate(page.getByRole("button", { name: "Retry this example", exact: true }));
          await expect(fact).toHaveAttribute("aria-pressed", "true");
          await activate(add);
          await activate(page.getByRole("button", { name: "Compare the shortlist", exact: true }));
          await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
        }
        await activate(page.getByRole("button", { name: "Reset this example", exact: true }));
        await activate(snapshotTab);
        await expect(fields).toHaveText(baseline, { useInnerText: true });
        await expect(page.locator(".lens-field--added")).toHaveCount(0);
        await expect(page.locator("#rescue-fixture")).toHaveValue(id);
      }

      if (reducedMotion === "reduce") {
        expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === "running").length)).toBe(0);
      }
      expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
      await page.reload();
      await expect(page.locator("#rescue-fixture")).toHaveValue("rescue-shortlisted");
      await expect(page.locator(".fact-sticker-select")).toHaveAttribute("aria-pressed", "false");
      expect(errors).toEqual([]);
      expect(externalRequests).toEqual([]);
      expect(writes).toEqual([]);
      await info.attach("browser-diagnostics", {
        body: JSON.stringify({ width, reducedMotion, errors, externalRequests, writes, physicalDevice: "SKIPPED_ENV", humanUsability: "SKIPPED_ENV" }, null, 2),
        contentType: "application/json",
      });
    });
  }
}
