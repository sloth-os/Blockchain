import { expect, test, type Page } from "@playwright/test";
import { applications, topics } from "../src/content";

type Area = "transaction" | "network" | "scale" | "applications" | "topics";
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const messages: string[] = [];
  errors.set(page, messages);
  page.on("pageerror", (error) => messages.push(error.message));
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page), "No uncaught browser exceptions").toEqual([]);
});
async function focus(page: Page, area: Area) {
  await page
    .getByRole("button", { name: "Explore the connected atlas", exact: true })
    .click();
  await expect(page.locator("main")).toHaveAttribute("data-focus", "atlas");
  await page.locator('[data-object-id="portal:' + area + '"]').click();
  await expect(page.locator("main")).toHaveAttribute("data-focus", area);
}
async function tools(page: Page) {
  if (
    !(await page
      .getByRole("complementary", { name: "Experiment in place", exact: true })
      .isVisible())
  )
    await page
      .getByRole("button", { name: "Open experiment controls", exact: true })
      .first()
      .click();
  return page.getByRole("complementary", {
    name: "Experiment in place",
    exact: true,
  });
}
async function fits(page: Page) {
  expect(
    await page.evaluate(() => ({
      horizontal: document.documentElement.scrollWidth > innerWidth,
      vertical: document.body.scrollHeight > innerHeight,
      height: document.querySelector("main")!.clientHeight === innerHeight,
    })),
  ).toEqual({ horizontal: false, vertical: false, height: true });
}

test("only one immersive world exists and every landmark keeps the same WebGL context", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(
    page.getByText("Real local signature verified", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(0);
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Go immersive|Exit immersive/ }),
  ).toHaveCount(0);
  const canvas = await page.locator("canvas").elementHandle();
  const originalURL = page.url();
  for (const area of [
    "network",
    "scale",
    "applications",
    "topics",
    "transaction",
  ] as Area[]) {
    await focus(page, area);
    await expect(page.locator("canvas")).toHaveCount(1);
    expect(
      await canvas!.evaluate(
        (el) =>
          el.isConnected &&
          el === document.querySelector("canvas") &&
          !(el as HTMLCanvasElement).getContext("webgl2")!.isContextLost(),
      ),
    ).toBe(true);
    expect(page.url()).toBe(originalURL);
  }
  await page
    .getByRole("button", { name: "Explore the connected atlas", exact: true })
    .click();
  await expect(page.locator(".portal-label:visible")).toHaveCount(5);
  await fits(page);
});

test("local signing, tampering and commitments remain interactive inside the shared world", async ({
  page,
}) => {
  await page.goto("/");
  const panel = await tools(page);
  await expect(page.getByTestId("transaction-hash")).toHaveText(
    /^[a-f0-9]{64}$/,
  );
  const hash = await page.getByTestId("transaction-hash").textContent();
  const root = await page.getByTestId("merkle-root").textContent();
  await page.getByLabel("Transaction amount", { exact: true }).fill("2.6");
  await expect(page.getByTestId("transaction-hash")).not.toHaveText(hash!);
  await expect(page.getByTestId("merkle-root")).not.toHaveText(root!);
  await expect(
    page.getByText("Real local signature verified", { exact: true }),
  ).toBeVisible();
  await panel
    .getByRole("button", { name: "Alter the signed amount", exact: true })
    .click();
  await expect(
    page.getByText("Received bytes fail authorization", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("transaction-data")).toContainText("999999");
  await expect(
    page.getByRole("button", { name: "Explore Settle phase" }),
  ).toBeDisabled();
  await panel
    .getByRole("button", { name: "Restore signed bytes", exact: true })
    .click();
  await expect(
    page.getByText("Real local signature verified", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Explore Settle phase" }).click();
  await expect(page.locator(".atlas-narration h2")).toHaveText("Settle");
  await panel.getByRole("button", { name: "Wire bytes", exact: true }).click();
  await expect(page.getByTestId("transaction-data")).toContainText(
    "7b2266726f6d",
  );
  await focus(page, "applications");
  await focus(page, "transaction");
  await tools(page);
  await expect(
    page.getByLabel("Transaction amount", { exact: true }),
  ).toHaveValue("2.6");
  await expect(page.getByTestId("transaction-data")).toContainText(
    "7b2266726f6d",
  );
});

test("the transaction trace and propagation experiment use the same reshaped peer graph", async ({
  page,
}) => {
  await page.goto("/");
  await focus(page, "network");
  await tools(page);
  const canvas = await page.locator("canvas").elementHandle();
  await page.getByRole("slider", { name: /^Nodes/ }).fill("24");
  await page.getByRole("button", { name: "ring", exact: true }).click();
  await page.getByRole("slider", { name: /^Wire message size/ }).fill("4096");
  expect(
    await canvas!.evaluate((el) => el === document.querySelector("canvas")),
  ).toBe(true);
  await focus(page, "transaction");
  await page.getByRole("button", { name: "Explore Broadcast phase" }).click();
  await expect(page.locator('[data-object-id^="net:n"]')).toHaveCount(24);
  await expect(page.locator('[data-object-id^="tx:peer"]')).toHaveCount(0);
  await expect(page.locator(".atlas-live-readouts")).toContainText(
    "4096 bytes",
  );
  await page
    .getByRole("slider", { name: "Transaction timeline", exact: true })
    .fill("400");
  await expect(
    page.locator('[data-object-id^="net:n"][aria-label*="RECEIVED"]').first(),
  ).toBeAttached();
  await page
    .getByRole("button", {
      name: "Experiment with the peer network",
      exact: true,
    })
    .click();
  await expect(page.getByRole("slider", { name: /^Nodes/ })).toHaveValue("24");
  await expect(
    page.getByRole("button", { name: "ring", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".atlas-narration h2")).toHaveText(
    "Broadcast paused",
  );
  await focus(page, "scale");
  await tools(page);
  await expect(page.getByRole("slider", { name: /^Payload size/ })).toHaveValue(
    "4096",
  );
});

test("topology failures expose disconnected healthy peers and can recover", async ({
  page,
}) => {
  await page.goto("/#/networks");
  await page.getByRole("button", { name: "hub", exact: true }).click();
  await page.getByRole("slider", { name: /^Offline nodes/ }).fill("10");
  await expect(page.getByTestId("network-p95")).toHaveText("UNREACHABLE");
  await expect(page.getByTestId("network-reachability")).toHaveText("1/17");
  await page
    .getByRole("complementary")
    .getByRole("button", { name: "Broadcast a message", exact: true })
    .click();
  await expect(page.locator(".atlas-narration h2")).toHaveText(
    "Broadcast finished · peers isolated",
  );
  await page
    .getByRole("button", { name: "Reset the network", exact: true })
    .click();
  await expect(page.getByTestId("network-reachability")).toHaveText("18/18");
  await expect(page.getByTestId("network-p95")).toHaveText(/ms$/);
  await page
    .getByRole("button", { name: "Continue to validation", exact: true })
    .click();
  await expect(page.locator("main")).toHaveAttribute(
    "data-focus",
    "transaction",
  );
  await expect(page.locator(".atlas-narration h2")).toHaveText("Validate");
});

test("comparison lanes share the workload with propagation and preserve design context", async ({
  page,
}) => {
  await page.goto("/#/compare");
  await page.getByLabel("Design A", { exact: true }).selectOption("bitcoin");
  const throughput = await page.getByTestId("throughput-0").textContent();
  await page.getByRole("slider", { name: /^Payload size/ }).fill("4096");
  await expect(page.getByTestId("throughput-0")).not.toHaveText(throughput!);
  await expect(page.locator('[data-object-id^="scaleA:"]')).toHaveCount(3);
  await expect(page.locator('[data-object-id^="scaleB:"]')).toHaveCount(3);
  await page
    .getByRole("button", { name: "Explain this connection", exact: true })
    .click();
  await page
    .getByLabel("System design layer", { exact: true })
    .selectOption("2");
  await expect(page.locator(".layer-explanation")).toContainText(
    "More peers reduce some propagation paths",
  );
  await focus(page, "network");
  await tools(page);
  await expect(
    page.getByRole("slider", { name: /^Wire message size/ }),
  ).toHaveValue("4096");
  await focus(page, "scale");
  await tools(page);
  await expect(page.getByLabel("Design A", { exact: true })).toHaveValue(
    "bitcoin",
  );
});

test("all ten real applications and ten sourced issues inhabit this same world", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/#/applications");
  const canvas = await page.locator("canvas").elementHandle();
  await expect(
    page
      .getByLabel("Real-world application", { exact: true })
      .locator("option"),
  ).toHaveCount(10);
  for (const app of applications) {
    await page
      .getByLabel("Real-world application", { exact: true })
      .selectOption(app.id);
    await expect(page.locator("h1")).toHaveText(app.name);
    await expect(page.locator(".workbench-steps > li")).toHaveCount(4);
    await expect(
      page.getByRole("complementary").locator("a.source-link").first(),
    ).toHaveAttribute("href", new RegExp("^https://"));
    expect(
      await canvas!.evaluate(
        (el) => el === document.querySelector("canvas") && el.isConnected,
      ),
    ).toBe(true);
  }
  await page
    .getByLabel("Real-world application", { exact: true })
    .selectOption("usdc");
  await page
    .getByRole("button", { name: "Question the assumptions", exact: true })
    .click();
  await expect(page.getByLabel("Open question", { exact: true })).toHaveValue(
    "stablecoins",
  );
  await expect(
    page.getByLabel("Open question", { exact: true }).locator("option"),
  ).toHaveCount(10);
  for (const topic of topics) {
    await page
      .getByLabel("Open question", { exact: true })
      .selectOption(topic.id);
    await expect(page.locator("h1")).toHaveText(topic.title);
    await expect(page.locator(".workbench-steps > li")).toHaveCount(4);
    await expect(
      page.getByRole("complementary").locator("a.source-link").first(),
    ).toHaveAttribute("href", new RegExp("^https://"));
    await page
      .getByRole("button", { name: "Explore flow step 4", exact: true })
      .click();
    await expect(page.locator(".scene")).toHaveAttribute("data-step", "3");
    expect(
      await canvas!.evaluate(
        (el) =>
          el === document.querySelector("canvas") &&
          el.isConnected &&
          !(el as HTMLCanvasElement).getContext("webgl2")!.isContextLost(),
      ),
    ).toBe(true);
  }
});

test("search, object inspection and citations change focus without leaving immersion", async ({
  page,
}) => {
  await page.goto("/");
  const url = page.url();
  await page.keyboard.press("Control+k");
  await page
    .getByRole("textbox", { name: "Search concepts and connections" })
    .fill("oracle");
  await page.getByRole("button", { name: /Concept Oracle/ }).click();
  await expect(page.locator("main")).toHaveAttribute(
    "data-focus",
    "applications",
  );
  await expect(page.locator("h1")).toHaveText("Chainlink");
  expect(page.url()).toBe(url);
  await page
    .getByRole("button", { name: "Close experiment panel", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Browse scene objects", exact: true })
    .click();
  await page.locator(".world-object-list > button").first().click();
  await expect(
    page.getByRole("complementary", { name: "Object inspector", exact: true }),
  ).toContainText("TRUST BOUNDARY");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("complementary")).toHaveCount(0);
  await expect(page.locator("main")).toHaveAttribute(
    "data-focus",
    "applications",
  );
  await page
    .getByRole("button", { name: "Research and sources", exact: true })
    .click();
  await expect(page.locator(".atlas-source-list > a")).toHaveCount(23);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "How to explore this world", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("mobile landmarks, tools and every learning focus fit one full-screen workspace", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Enable motion", exact: true }),
  ).toBeVisible();
  for (const area of [
    "transaction",
    "network",
    "scale",
    "applications",
    "topics",
  ] as Area[]) {
    await focus(page, area);
    const panel = await tools(page);
    await expect(panel).toBeVisible();
    const bounds = await panel.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    await fits(page);
    await page
      .getByRole("button", { name: "Close experiment panel", exact: true })
      .click();
  }
  await page
    .getByRole("button", { name: "Explore the connected atlas", exact: true })
    .click();
  await expect(page.locator(".portal-label:visible")).toHaveCount(5);
  const intro = await page.locator(".atlas-focus-intro").boundingBox();
  for (const label of await page.locator(".portal-label:visible").all()) {
    const bounds = await label.boundingBox();
    expect(
      bounds!.y >= intro!.y + intro!.height ||
        bounds!.x >= intro!.x + intro!.width,
    ).toBe(true);
  }
  await page
    .getByRole("button", { name: "Research and sources", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await fits(page);
});

test("reduced motion freezes rendering while manual exploration remains available", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByText("Real local signature verified", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  let before = await page.locator("canvas").screenshot();
  // Wait for startup font/layout changes and the initial GPU frame to settle.
  // Continuous movement still fails this check rather than being retried away.
  await expect
    .poll(
      async () => {
        const next = await page.locator("canvas").screenshot();
        const stable = next.equals(before);
        before = next;
        return stable;
      },
      { timeout: 10_000, intervals: [100, 250] },
    )
    .toBe(true);
  await page.waitForTimeout(250);
  expect((await page.locator("canvas").screenshot()).equals(before)).toBe(true);
  await page
    .getByRole("button", { name: "Explore Build a block phase", exact: true })
    .click();
  await expect(page.locator(".scene")).toHaveAttribute("data-step", "4");
  expect((await page.locator("canvas").screenshot()).equals(before)).toBe(
    false,
  );
  await page
    .getByRole("button", { name: "Enable motion", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Play current process", exact: true })
    .click();
  const start = await page
    .getByRole("slider", { name: "Transaction timeline", exact: true })
    .inputValue();
  await expect
    .poll(() =>
      page
        .getByRole("slider", { name: "Transaction timeline", exact: true })
        .inputValue(),
    )
    .not.toBe(start);
  await page
    .getByRole("button", { name: "Pause all motion", exact: true })
    .click();
  const paused = await page
    .getByRole("slider", { name: "Transaction timeline", exact: true })
    .inputValue();
  await page.waitForTimeout(250);
  await expect(
    page.getByRole("slider", { name: "Transaction timeline", exact: true }),
  ).toHaveValue(paused);
});

test("legacy deep links open a focus inside the same immersive workspace", async ({
  page,
}) => {
  for (const [route, area, title] of [
    ["journey", "transaction", "Compose"],
    ["networks", "network", "A message finds its way"],
    ["compare", "scale", "The same demand. Different limits."],
    ["applications/chainlink", "applications", "Chainlink"],
    ["signals/privacy", "topics", "Prove more. Reveal less."],
  ]) {
    await page.goto("/#/" + route);
    await expect(page.locator("main")).toHaveAttribute("data-focus", area);
    await expect(page.locator("h1")).toHaveText(title);
    await expect(page.locator("canvas")).toHaveCount(1);
  }
});

test("without WebGL the same controls, explanations and connected landmarks remain usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes("webgl")) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/");
  await expect(
    page.getByText("2D compatibility view · WebGL unavailable", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Real local signature verified", { exact: true }),
  ).toBeVisible();
  await page
    .locator(".spatial-fallback-objects")
    .getByRole("button", { name: /PEER NETWORK/ })
    .click();
  await expect(page.locator("main")).toHaveAttribute("data-focus", "network");
  await tools(page);
  await page.getByRole("button", { name: "hub", exact: true }).click();
  await page.getByRole("slider", { name: /^Offline nodes/ }).fill("10");
  await expect(page.getByTestId("network-p95")).toHaveText("UNREACHABLE");
});
