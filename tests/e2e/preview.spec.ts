import { expect, test } from "@playwright/test";

test("the preview home and empty sandbox shell load without external requests", async ({ page }) => {
  const externalOrigins: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
      externalOrigins.push(url.origin);
    }
  });

  await page.goto("/");
  await expect(page.getByText("UI PREVIEW · FICTIONAL DATA")).toBeVisible();
  await expect(page.getByRole("heading", { name: "A keyless start for what comes next." })).toBeVisible();
  await page.getByRole("link", { name: "Open the Stage 2 shell" }).click();
  await expect(page.getByText("UI PREVIEW · FICTIONAL DATA")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Preview space reserved." })).toBeVisible();
  expect(externalOrigins).toEqual([]);
});

test("the health route returns the exact preview payload", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok", mode: "preview" });
});
