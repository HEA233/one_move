import { expect, test, type Page } from "@playwright/test";

function trackExternalHttpRequests(page: Page): string[] {
  const externalOrigins: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname !== "127.0.0.1" &&
      url.hostname !== "localhost" &&
      url.hostname !== "[::1]"
    ) {
      externalOrigins.push(url.origin);
    }
  });
  return externalOrigins;
}

test("the root opens ONE MOVE and the sandbox keeps the component preview", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/play$/);
  await expect(page.getByRole("heading", { name: "Two drinks. One little detour." })).toBeVisible();
});

test("the preview exposes each independent component with the exact disclosures", async ({ page }) => {
  const externalOrigins = trackExternalHttpRequests(page);
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto("/sandbox");
  await expect(page.getByRole("heading", { name: "A place on the shelf. Or a ghost." })).toBeVisible();
  await expect(page.getByText("UI preview · fictional data", { exact: true })).toHaveCount(1);
  await expect(page.getByText("UI fixture — not an AI result", { exact: true })).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "One place on the shelf" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Missions and products" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Add one sourced fact" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "A supplied order" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Loading, error and empty" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Image and share link" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Buttons and status" })).toBeVisible();
  await expect(page.getByText("Independent previews. No participant data is saved.")).toBeVisible();
  expect(externalOrigins).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("the reveal renders each supplied state and remounts the animation layer on replay", async ({ page }) => {
  await page.goto("/sandbox");
  const selector = page.getByLabel("Reveal fixture state");
  const artwork = page.locator(".ghost-stage-art");

  await selector.selectOption("shortlisted");
  await expect(page.getByRole("heading", { name: "Still on the shelf" })).toBeVisible();
  await expect(artwork).toBeVisible();

  await selector.selectOption("cannot_verify");
  await expect(page.getByRole("heading", { name: "Cannot verify" })).toBeVisible();
  await expect(page.locator("#reveal").getByText("Unverified", { exact: true })).toBeVisible();
  await expect(artwork).toBeVisible();

  await selector.selectOption("outside_shortlist");
  await expect(page.getByRole("heading", { name: "Ghosted", exact: true })).toBeVisible();
  const previousArtwork = await artwork.elementHandle();
  await page.getByRole("button", { name: "Replay animation" }).click();
  await expect.poll(async () => previousArtwork?.evaluate((element) => element.isConnected)).toBe(false);
  await expect(artwork).toHaveCSS("opacity", "0");
});

test("selection, source and async examples keep their states independent", async ({ page }) => {
  const externalOrigins = trackExternalHttpRequests(page);
  await page.goto("/sandbox");

  const mission = page.getByRole("button", { name: /A crisp afternoon snack/ });
  await mission.focus();
  await mission.press("Space");
  await expect(mission).toHaveAttribute("aria-pressed", "true");
  await mission.press("Enter");
  await expect(mission).toHaveAttribute("aria-pressed", "false");
  await page.getByLabel("Disable mission selection").check();
  await expect(mission).toBeDisabled();

  const firstProduct = page.locator(".product-card").first();
  await firstProduct.focus();
  await firstProduct.press("Enter");
  await expect(firstProduct).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Disable product selection").check();
  await expect(firstProduct).toBeDisabled();

  const factButton = page.getByRole("button", { name: "Select fact" });
  await factButton.click();
  await expect(factButton).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "View source" }).click();
  await expect(page.getByText("Protein 3.2 g per 100 g", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "View source" })).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "View source" }).click();
  await expect(page.getByRole("button", { name: "View source" })).toHaveAttribute("aria-expanded", "false");
  await page.getByLabel("Fact outcome fixture").selectOption("no_change");
  await expect(page.getByRole("article").getByText("No change", { exact: true })).toBeVisible();
  await expect(factButton).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Fact outcome fixture").selectOption("no_eligible_fact");
  await expect(factButton).toBeDisabled();
  await expect(page.getByRole("button", { name: "View source" })).toBeEnabled();

  await page.getByLabel("Panel state").selectOption("error");
  await expect(page.getByRole("heading", { name: "Example failed" })).toBeVisible();
  await page.getByRole("button", { name: "Reset example" }).click();
  await expect(page.getByRole("heading", { name: "Ready to preview" })).toBeVisible();
  await expect(firstProduct).toHaveAttribute("aria-pressed", "true");

  await firstProduct.locator("img").evaluate((image) => {
    (image as HTMLImageElement).src = "data:image/png;base64,bm90LWEtcG5n";
  });
  await expect(firstProduct.getByRole("img", { name: "Image not available" })).toBeVisible();
  expect(externalOrigins).toEqual([]);
});

test("image input validates files, preserves the previous image and revokes local URLs", async ({ page }) => {
  await page.addInitScript(() => {
    const stats = { created: [] as string[], revoked: [] as string[] };
    const create = URL.createObjectURL.bind(URL);
    const revoke = URL.revokeObjectURL.bind(URL);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: (file: Blob) => {
        const url = create(file);
        stats.created.push(url);
        return url;
      },
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: (url: string) => {
        stats.revoked.push(url);
        revoke(url);
      },
    });
    Object.defineProperty(window, "previewObjectUrlStats", { configurable: true, value: stats });
  });

  await page.goto("/sandbox");
  const input = page.locator("#preview-image");
  await expect(input).toHaveCount(1);
  const validPng = {
    name: "oat.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASsJTYQAAAAASUVORK5CYII=", "base64"),
  };

  await input.setInputFiles(validPng);
  await expect(page.getByText("oat.png", { exact: true })).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(page.getByRole("img", { name: "Selected local image preview" })).toBeVisible();

  await input.setInputFiles(validPng);
  await expect(page.getByText("oat.png", { exact: true })).toBeVisible();
  let urlStats = await page.evaluate(() => (window as unknown as { previewObjectUrlStats: { created: string[]; revoked: string[] } }).previewObjectUrlStats);
  expect(urlStats.created).toHaveLength(2);
  expect(urlStats.revoked).toContain(urlStats.created[0]);

  await input.setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("no image") });
  await expect(page.locator(".image-input-error")).toHaveText("Choose a JPEG, PNG or WebP image.");
  await expect(page.getByText("oat.png", { exact: true })).toBeVisible();

  await input.setInputFiles({
    name: "too-large.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await expect(page.locator(".image-input-error")).toHaveText("Choose an image smaller than 5 MiB.");
  await expect(page.getByText("oat.png", { exact: true })).toBeVisible();

  await input.setInputFiles({ name: "broken.png", mimeType: "image/png", buffer: Buffer.from("not an image") });
  await expect(page.locator(".image-input-error")).toHaveText("This image could not be opened. Choose another image.");
  await expect(page.getByText("broken.png", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remove image" }).click();
  await expect(page.getByText("broken.png", { exact: true })).toHaveCount(0);
  await expect(input).toBeFocused();

  urlStats = await page.evaluate(() => (window as unknown as { previewObjectUrlStats: { created: string[]; revoked: string[] } }).previewObjectUrlStats);
  expect(urlStats.created).toHaveLength(3);
  expect(urlStats.revoked).toEqual(expect.arrayContaining(urlStats.created));
});

test("share link generates a local QR and reports clipboard success", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (value: string) => { Object.defineProperty(window, "copiedPreviewLink", { configurable: true, value }); } },
    });
  });
  const externalOrigins = trackExternalHttpRequests(page);
  await page.goto("/sandbox");

  const linkField = page.getByLabel("Preview link");
  await expect(linkField).toHaveValue(new RegExp("/sandbox$"));
  await expect(page.getByText("Local preview. This address will not open on another device.")).toBeVisible();
  await expect(page.locator(".share-link-qr svg")).toHaveAttribute("width", "160");
  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.getByText("Link copied", { exact: true })).toBeVisible();
  const copiedUrl = await page.evaluate(() => (window as unknown as { copiedPreviewLink: string }).copiedPreviewLink);
  expect(copiedUrl).toBe(await linkField.inputValue());
  expect(externalOrigins).toEqual([]);
});

test("share link reports clipboard failure while keeping the address selectable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => { throw new Error("clipboard unavailable"); } },
    });
  });
  await page.goto("/sandbox");
  const linkField = page.getByLabel("Preview link");
  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.getByText("Copy failed. Select and copy the link above.", { exact: true })).toBeVisible();
  await expect(linkField).toHaveAttribute("readonly", "");
});

test("all target widths fit and reduced motion keeps the final fixture states readable", async ({ page }) => {
  await page.goto("/sandbox");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "One place on the shelf" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Four small scenes" })).toBeVisible();

  for (const width of [375, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByLabel("Reveal fixture state").selectOption("outside_shortlist");
  await expect(page.getByRole("heading", { name: "Ghosted", exact: true })).toBeVisible();
  const ghostStyle = await page.locator(".ghost-stage-art").evaluate((element) => ({
    animation: getComputedStyle(element).animationName,
    opacity: getComputedStyle(element).opacity,
  }));
  expect(ghostStyle.animation).toBe("none");
  expect(ghostStyle.opacity).toBe("0");
  expect(await page.locator(".ghost-stage").evaluate((element) => getComputedStyle(element).borderTopStyle)).toBe("dashed");

  await expect(page.locator(".ranking-row")).toHaveCount(0);
});

test("the preview strip stays separate and loading labels remain inside the button", async ({ page }) => {
  await page.goto("/sandbox");

  await expect(page.locator(".preview-header")).toHaveCSS("position", "static");
  await expect(page.locator(".preview-sticky-strip")).toHaveCSS("position", "sticky");
  await expect(page.getByText("UI preview · fictional data", { exact: true })).toHaveCount(1);

  const loadingButton = page.getByRole("button", { name: "Loading example" });
  const buttonBox = await loadingButton.boundingBox();
  const labelBox = await loadingButton.locator(".preview-button-loading").boundingBox();
  expect(buttonBox).not.toBeNull();
  expect(labelBox).not.toBeNull();
  expect(labelBox!.x).toBeGreaterThanOrEqual(buttonBox!.x);
  expect(labelBox!.x + labelBox!.width).toBeLessThanOrEqual(buttonBox!.x + buttonBox!.width);
});

test("the health route returns the exact preview payload", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok", mode: "preview" });
});

test("all preparation pages remain local and accessible at the four target widths", async ({ page }) => {
  const externalOrigins = trackExternalHttpRequests(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  for (const width of [375, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/sandbox", "/sandbox/mission", "/sandbox/pick", "/sandbox/reveal", "/sandbox/rescue", "/sandbox/assets", "/mission", "/pick", "/reveal", "/rescue", "/live"]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByText("UI preview · fictional data", { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      if (!path.startsWith("/sandbox")) await expect(page.getByText("Core workflow will be implemented during EAT_HACK", { exact: true })).toBeVisible();
    }
  }
  expect(externalOrigins).toEqual([]);
  expect(errors).toEqual([]);
});
