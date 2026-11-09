import { expect, test, type Page } from "@playwright/test";

const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page), "No uncaught browser exceptions").toEqual([]);
});

test("overview opens a real 3D scene and searches across the atlas", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Trust is built/ }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Search the atlas", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Search concepts, applications and topics" })
    .fill("oracle");
  await page.getByRole("button", { name: /Concept Oracle/ }).click();
  await expect(page).toHaveURL(/applications\/chainlink/);
  await expect(
    page.getByRole("heading", { name: "Chainlink", exact: true }).first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("a signed transaction settles, rejects tampering, and recovers", async ({
  page,
}) => {
  await page.goto("/#/journey");
  await expect(
    page.getByText("Signed in your browser", { exact: true }),
  ).toBeVisible();
  for (let i = 0; i < 6; i++)
    await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.getByText("SETTLED", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Tamper with the amount" }).click();
  await expect(
    page.getByText("Signature rejected", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Next step", exact: true }),
  ).toBeDisabled();
  await expect(page.getByTestId("payload")).toContainText("999999");
  await page.getByRole("button", { name: "Restore signed amount" }).click();
  await expect(
    page.getByText("Signature verified", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await page.getByRole("button", { name: "Wire bytes", exact: true }).click();
  await expect(page.getByTestId("payload")).toContainText("7b2266726f6d");
  const before = await page.getByTestId("transaction-hash").textContent();
  const blockBefore = await page.getByTestId("block-hash").textContent();
  const nextBefore = await page.getByTestId("next-block-hash").textContent();
  await page.getByRole("button", { name: "Change 2.5 to 2.6" }).click();
  await expect(page.getByTestId("transaction-hash")).not.toHaveText(before!);
  await expect(page.getByTestId("block-hash")).not.toHaveText(blockBefore!);
  await expect(page.getByTestId("next-block-hash")).not.toHaveText(nextBefore!);
});

test("network topology and failures change reachability", async ({ page }) => {
  await page.goto("/#/networks");
  await page.getByRole("button", { name: "Hub", exact: true }).click();
  const offline = page.getByRole("slider", { name: /Offline nodes/ });
  await offline.fill("10");
  await expect(page.getByText("UNREACHABLE", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Inspect node 3" }).click();
  await expect(page.getByText("Isolated", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Broadcast a transaction", exact: true })
    .click();
  await expect(
    page.getByText("BROADCAST COMPLETE", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reset network settings", exact: true })
    .click();
  await expect(page.getByText("18/18", { exact: true })).toBeVisible();
});

test("comparison sliders and design layers expose real trade-offs", async ({
  page,
}) => {
  await page.goto("/#/compare");
  await page.getByLabel("SOLUTION A", { exact: true }).selectOption("bitcoin");
  const throughput = await page.getByTestId("throughput-0").textContent();
  await page.getByRole("slider", { name: /Payload size/ }).fill("4096");
  await expect(page.getByTestId("throughput-0")).not.toHaveText(throughput!);
  await page.getByRole("tab", { name: /03 Network/ }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "More peers reduce some propagation paths",
  );
});

test("all ten applications and all ten issues are available with citations", async ({
  page,
}) => {
  await page.goto("/#/applications");
  await expect(page.locator(".application-card")).toHaveCount(10);
  await page.getByRole("button", { name: "Public good", exact: true }).click();
  await expect(page.locator(".application-card")).toHaveCount(1);
  await page.locator(".application-card").click();
  await expect(
    page.getByRole("heading", {
      name: "WFP Building Blocks",
      exact: true,
      level: 2,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next stage", exact: true }).click();
  await expect(page.locator(".interactive-flow li.active")).toContainText(
    "permissioned network",
  );
  await page.goto("/#/signals");
  await expect(page.locator(".topic-list>button")).toHaveCount(10);
  for (let i = 0; i < 10; i++) {
    await page.locator(".topic-list>button").nth(i).click();
    await expect(page.locator(".topic-sources a").first()).toHaveAttribute(
      "href",
      /^https:\/\//,
    );
    await expect(page.locator(".mechanism-steps>button")).toHaveCount(4);
  }
});

test("mobile chapters fit the viewport, navigation works, and reduced motion is honored", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Enable animations", exact: true }),
  ).toBeVisible();
  for (const route of [
    "explore",
    "journey",
    "networks",
    "compare",
    "applications",
    "signals",
  ]) {
    await page.goto(`/#/${route}`);
    await expect(page.locator("h1")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow, `${route} should not overflow horizontally`).toBe(false);
  }
  await page
    .getByRole("button", { name: "Toggle navigation", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Transaction lab", exact: true })
    .click();
  await expect(page).toHaveURL(/journey/);
  await page.getByRole("button", { name: /Research & sources/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("a WebGL-free browser retains a readable compatibility view and working content", async ({
  browser,
}) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith("webgl")) return null;
      return original.call(this, type, ...(args as [any]));
    } as typeof original;
  });
  const page = await context.newPage();
  await page.goto("/#/networks");
  await expect(
    page.getByText("2D compatibility view · WebGL unavailable"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Broadcast a transaction", exact: true })
    .click();
  await expect(
    page.getByText("BROADCAST COMPLETE", { exact: true }),
  ).toBeVisible();
  await context.close();
});
