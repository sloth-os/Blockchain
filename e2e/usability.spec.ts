import { expect, test, type Page } from "@playwright/test";

const failures = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  failures.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (/Encountered two children|Each child in a list/.test(message.text()))
      errors.push(message.text());
  });
});
test.afterEach(async ({ page }) => {
  expect(failures.get(page)).toEqual([]);
});
async function controls(page: Page) {
  if (
    !(await page
      .getByRole("complementary", { name: "Experiment in place", exact: true })
      .isVisible())
  )
    await page
      .getByRole("button", { name: "Open experiment controls", exact: true })
      .first()
      .click();
}

test("invalid drafts cannot play or advance to a settled transaction", async ({
  page,
}) => {
  await page.goto("/");
  await controls(page);
  const amount = page.getByLabel("Transaction amount", { exact: true });
  for (const invalid of ["0", "-1", "0.001", "1001", ""]) {
    await amount.fill(invalid);
    await expect(amount).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("alert")).toContainText("Later phases wait");
    await expect(
      page.getByRole("button", { name: "Explore Settle phase", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Enable motion and play", exact: true }),
    ).toBeDisabled();
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "0");
  }
  await amount.fill("12.25");
  await expect(
    page.getByText("Real local signature verified", { exact: true }),
  ).toBeVisible();
  await expect(amount).toHaveAttribute("aria-invalid", "false");
  await page
    .getByRole("button", { name: "Explore Settle phase", exact: true })
    .click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "6");
});

test("paused delivery stays paused, resumes, and reports disconnection separately", async ({
  page,
}) => {
  await page.goto("/#/networks");
  await page.getByRole("slider", { name: /^Link latency/ }).fill("500");
  await page
    .getByRole("button", { name: "Enable motion", exact: true })
    .click();
  await page
    .getByRole("complementary")
    .getByRole("button", { name: "Broadcast a message", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Pause current process", exact: true })
    .click();
  await expect(page.locator(".atlas-narration h2")).toHaveText(
    "Broadcast paused",
  );
  const progress = await page
    .locator(".network-progress-inline p")
    .textContent();
  await page.waitForTimeout(200);
  await expect(page.locator(".network-progress-inline p")).toHaveText(
    progress!,
  );
  await page.getByLabel("Playback speed", { exact: true }).selectOption("2");
  await expect(page.locator(".network-progress-inline p")).toContainText(
    "Animation slowed 2×",
  );
  await page
    .getByRole("button", { name: "Play current process", exact: true })
    .click();
  await expect(page.locator(".atlas-narration h2")).toHaveText(
    "Broadcast complete",
    { timeout: 15_000 },
  );
  await page
    .getByRole("button", { name: "Pause all motion", exact: true })
    .click();
  await page.getByRole("button", { name: "hub", exact: true }).click();
  await page.getByRole("slider", { name: /^Offline nodes/ }).fill("20");
  await page
    .getByRole("complementary")
    .getByRole("button", { name: "Broadcast a message", exact: true })
    .click();
  await expect(page.locator(".atlas-narration h2")).toHaveText(
    "Broadcast finished · peers isolated",
  );
  await expect(page.locator(".atlas-live-readouts")).toContainText(
    "UNREACHABLE",
  );
});

test("larger signed drafts automatically raise the shared minimum message budget", async ({
  page,
}) => {
  await page.goto("/#/networks");
  const wire = page.getByRole("slider", { name: /^Wire message size/ });
  const originalMinimum = Number(await wire.getAttribute("min"));
  await wire.fill(String(originalMinimum));
  await page.goto("/#/journey");
  await controls(page);
  await page.getByLabel("Transaction amount", { exact: true }).fill("999.99");
  await expect(
    page.getByText("Real local signature verified", { exact: true }),
  ).toBeVisible();
  await page.goto("/#/networks");
  await controls(page);
  const newMinimum = Number(await wire.getAttribute("min"));
  expect(newMinimum).toBeGreaterThan(originalMinimum);
  await expect(wire).toHaveValue(String(newMinimum));
  await page.goto("/#/compare");
  await controls(page);
  await expect(page.getByRole("slider", { name: /^Payload size/ })).toHaveValue(
    String(newMinimum),
  );
});

test("equal comparison designs leave exactly the current three readouts in later stories", async ({
  page,
}) => {
  await page.goto("/#/compare");
  await page.getByLabel("Design A", { exact: true }).selectOption("optimistic");
  await expect(page.locator(".atlas-live-readouts > div")).toHaveCount(3);
  await page.getByLabel("Design A", { exact: true }).selectOption("zk");
  await page.getByLabel("Design B", { exact: true }).selectOption("zk");
  await page.goto("/#/applications/chainlink");
  await expect(page.locator(".atlas-live-readouts > div")).toHaveCount(3);
  await expect(page.locator(".atlas-live-readouts")).not.toContainText(
    "COMPLETED",
  );
  await expect(page.locator(".atlas-live-readouts")).toContainText(
    "PRICE OBSERVATIONS",
  );
});

test("small phones, tablets and landscape keep all landmarks reachable with comfortable controls", async ({
  page,
}) => {
  test.setTimeout(60_000);
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page
      .getByRole("button", { name: "Explore the connected atlas", exact: true })
      .click();
    await expect(page.locator(".portal-label:visible")).toHaveCount(5);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    for (const name of [
      "Search the atlas",
      "Research and sources",
      "How to explore this world",
      "Choose camera view",
    ]) {
      const button = page.getByRole("button", { name, exact: true });
      const box = await button.boundingBox();
      expect(box!.width, name + " target width").toBeGreaterThanOrEqual(44);
      expect(box!.height, name + " target height").toBeGreaterThanOrEqual(44);
    }
    await page.locator('[data-object-id="portal:transaction"]').click();
    await expect(
      page.getByLabel("Process phase", { exact: true }),
    ).toBeVisible();
    await page.getByLabel("Process phase", { exact: true }).selectOption("3");
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "3");
    await page
      .getByRole("button", { name: "Next process step", exact: true })
      .click();
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "4");
    await controls(page);
    await expect(
      page.getByLabel("Transaction amount", { exact: true }),
    ).toBeAttached();
    expect(
      await page
        .getByRole("complementary")
        .evaluate((el) => el.getBoundingClientRect().right <= innerWidth),
    ).toBe(true);
  }
});

test("workbench focus returns to its trigger and the mobile camera menu is keyboard usable", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", {
    name: "Open experiment controls",
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("complementary", {
      name: "Experiment in place",
      exact: true,
    }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  const camera = page.getByRole("button", {
    name: "Choose camera view",
    exact: true,
  });
  await camera.focus();
  await page.keyboard.press("Enter");
  await expect(camera).toHaveAttribute("aria-expanded", "true");
  await page
    .getByRole("button", { name: "View from above", exact: true })
    .click();
  await expect(camera).toHaveAttribute("aria-expanded", "false");
  await expect(camera).toBeFocused();
  await camera.click();
  await page.keyboard.press("Escape");
  await expect(camera).toHaveAttribute("aria-expanded", "false");
  await page
    .getByRole("button", { name: "How to explore this world", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("the fourth mechanism phase animates and pausing it preserves that phase", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/#/applications");
  await page
    .getByRole("button", { name: "Enable motion", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Play current process", exact: true })
    .click();
  for (let i = 1; i <= 3; i++) {
    await page.clock.fastForward(4000);
    await expect(page.locator(".scene")).toHaveAttribute(
      "data-step",
      String(i),
    );
  }
  await expect(
    page.getByRole("button", { name: "Pause current process", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Pause current process", exact: true })
    .click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "3");
  await page.clock.fastForward(6000);
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "3");
});

test("real canvas keyboard and two-finger gestures move the same world", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByText("Real local signature verified", { exact: true }),
  ).toBeVisible();
  const canvas = page.locator("canvas"),
    handle = await canvas.elementHandle();
  await page.evaluate(() => document.fonts.ready);
  const initial = await canvas.screenshot();
  await canvas.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("+");
  expect((await canvas.screenshot()).equals(initial)).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 });
  const before = await canvas.screenshot();
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, x: 140, y: 295 },
      { id: 2, x: 245, y: 295 },
    ],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { id: 1, x: 95, y: 295 },
      { id: 2, x: 295, y: 295 },
    ],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect((await canvas.screenshot()).equals(before)).toBe(false);
  expect(
    await handle!.evaluate(
      (el) => el === document.querySelector("canvas") && el.isConnected,
    ),
  ).toBe(true);
});
