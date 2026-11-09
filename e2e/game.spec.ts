import { expect, test, type Page } from "@playwright/test";

const exceptions = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const list: string[] = [];
  exceptions.set(page, list);
  page.on("pageerror", (error) => list.push(error.message));
});
test.afterEach(async ({ page }) => expect(exceptions.get(page)).toEqual([]));

async function fly(page: Page, name: string) {
  await page
    .getByRole("button", { name: "Open mission targets", exact: true })
    .click();
  await page
    .getByTestId("game-targets")
    .getByRole("button", { name: `Fly to ${name}`, exact: true })
    .click();
}
async function notice(page: Page, title: string) {
  await expect(page.locator(".game-feedback strong")).toHaveText(title);
}
async function next(page: Page, title: string) {
  const dialog = page.getByRole("dialog", {
    name: "Mission complete",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: `Next: ${title}`, exact: true })
    .click();
  await expect(page.locator(".game-mission-card h1")).toHaveText(title);
}

test("the full campaign enforces protocol rules, awards records and resumes saved checkpoints", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/?play=1");
  await page.getByRole("button", { name: "Mission map", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Play mission 2: Rebuild the relay",
      exact: true,
    }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Start expedition", exact: true })
    .click();
  const canvas = await page.locator("canvas").elementHandle();

  await test.step("exact-byte authorization", async () => {
    await page
      .getByRole("button", { name: "Choose target", exact: true })
      .click();
    await page
      .getByTestId("game-targets")
      .getByRole("button", { name: "Fly to Signing terminal", exact: true })
      .click();
    await notice(page, "Recover the payload first");
    await fly(page, "Payload cache");
    await notice(page, "Payload recovered");
    await fly(page, "Signing terminal");
    await page.getByRole("button", { name: /Verify altered amount/ }).click();
    await notice(page, "Authorization rejected");
    await expect(page.getByTestId("game-energy")).toHaveText("88%");
    await page.getByRole("button", { name: "Interact E", exact: true }).click();
    await page.getByRole("button", { name: /Verify original message/ }).click();
    await next(page, "Rebuild the relay");
  });
  await test.step("network failure, topology and real links", async () => {
    await fly(page, "Relay workshop");
    await page.getByRole("button", { name: /Install hub topology/ }).click();
    await notice(page, "This design misses a requirement");
    await page.getByRole("button", { name: "Interact E", exact: true }).click();
    await page.getByRole("button", { name: /Install mesh topology/ }).click();
    await notice(page, "Redundant relays online");
    await fly(page, "Peer N01");
    await notice(page, "Packet collected");
    await fly(page, "Peer N05");
    await notice(page, "No direct peer link");
    await fly(page, "Peer N04");
    await notice(page, "Relayed to N04");
    await fly(page, "Peer N05");
    await expect(
      page.getByRole("dialog", { name: "Mission complete", exact: true }),
    ).toContainText("192 model ms");
    await next(page, "Forge a commitment");
  });
  await test.step("actual Merkle root", async () => {
    await fly(page, "Merkle forge");
    await notice(page, "The batch is incomplete");
    for (const n of ["01", "02", "03", "04"]) {
      await fly(page, `Transaction shard ${n}`);
      await expect(
        page.locator(`[data-object-id="game:merkle:leaf${Number(n) - 1}"]`),
      ).toHaveCount(0);
    }
    await fly(page, "Merkle forge");
    await next(page, "Earn the quorum");
  });
  await test.step("weighted signatures and dissent", async () => {
    await fly(page, "Validator Alpha");
    await notice(page, "Vote verified");
    await fly(page, "Validator Beta");
    await expect(page.locator(".game-mission-card")).toContainText("(60%)");
    await fly(page, "Checkpoint gate");
    await notice(page, "Not enough valid stake");
    await fly(page, "Validator Delta");
    await notice(page, "Different block · vote rejected");
    await expect(page.locator(".game-mission-card")).toContainText("(60%)");
    await fly(page, "Validator Gamma");
    await expect(page.locator(".game-mission-card")).toContainText("(82%)");
    await fly(page, "Checkpoint gate");
    await next(page, "Find the scaling route");
  });
  await test.step("requirements beyond throughput", async () => {
    await fly(page, "Solana L1");
    await notice(page, "Capacity is only one requirement");
    await expect(page.locator(".game-feedback")).toContainText(
      "own base layer",
    );
    await fly(page, "ZK rollup");
    await next(page, "Cross into the real world");
  });
  await test.step("off-chain issuer and bank obligations", async () => {
    await fly(page, "Customer destination");
    await notice(page, "The customer is still waiting");
    await fly(page, "Token burn receipt");
    await notice(page, "Burn receipt secured");
    await fly(page, "Issuer desk");
    await page
      .getByRole("button", { name: /The issuer and banking rails/ })
      .click();
    await notice(page, "Redemption authorized");
    await fly(page, "Bank handoff");
    await notice(page, "Bank acknowledgment received");
    await fly(page, "Customer destination");
    await next(page, "Guard the final crossing");
  });
  await test.step("bridge proof and finality boundaries", async () => {
    await fly(page, "Untrusted shortcut");
    await notice(page, "Unverified shortcut rejected");
    for (const [name, title] of [
      ["Source event", "Source event secured"],
      ["Checkpoint cache", "Checkpoint recovered"],
      ["Proof cache", "Inclusion path recovered"],
    ]) {
      await fly(page, name);
      await notice(page, title);
    }
    await fly(page, "Message verifier");
    await page
      .getByRole("button", { name: /Verify altered source event/ })
      .click();
    await notice(page, "Proof rejected");
    await page.getByRole("button", { name: "Interact E", exact: true }).click();
    await page
      .getByRole("button", { name: /Verify authentic inclusion proof/ })
      .click();
    await notice(page, "Inclusion verified");
    await fly(page, "Destination gate");
    await expect(
      page.getByRole("dialog", { name: "Expedition complete", exact: true }),
    ).toContainText("Trust, delivered.");
  });
  expect(
    await canvas!.evaluate(
      (el) =>
        el === document.querySelector("canvas") &&
        !(el as HTMLCanvasElement).getContext("webgl2")!.isContextLost(),
    ),
  ).toBe(true);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Object.keys(
            JSON.parse(localStorage.getItem("chain-atlas:runner:v1")!).best,
          ).length,
      ),
    )
    .toBe(7);
  await page
    .getByRole("button", { name: "Explore your mission record", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Play mission 7: Guard the final crossing",
      exact: true,
    }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Continue mission 01", exact: true }),
  ).toBeVisible();
});

test("normal-motion flight, dash, pause and atlas transitions retain the same 3D context", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const canvas = await page.locator("canvas").elementHandle();
  await page
    .getByRole("button", { name: "Play Chain Runner", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start expedition", exact: true })
    .click();
  const player = page.locator(".game-minimap > svg > circle").last();
  const before = await player.getAttribute("cy");
  await page
    .getByRole("button", { name: "Show tactical camera", exact: true })
    .click();
  await page.keyboard.down("w");
  await expect.poll(() => player.getAttribute("cy")).not.toBe(before);
  await page.keyboard.up("w");
  await page.getByRole("button", { name: "Dash courier", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Dash courier", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Expedition paused", exact: true }),
  ).toBeVisible();
  const paused = await player.getAttribute("cy");
  await page.keyboard.press("w");
  expect(await player.getAttribute("cy")).toBe(paused);
  await page
    .getByRole("button", { name: "Resume mission", exact: true })
    .click();
  await fly(page, "Payload cache");
  await notice(page, "Payload recovered");
  await fly(page, "Signing terminal");
  await expect(
    page.getByRole("dialog", {
      name: "Verify the signed payload",
      exact: true,
    }),
  ).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press("Escape");
  await page.keyboard.press("e");
  await expect(
    page.getByRole("dialog", {
      name: "Verify the signed payload",
      exact: true,
    }),
  ).toBeVisible();
  const originalPayload = await page
    .getByRole("dialog", { name: "Verify the signed payload", exact: true })
    .locator("pre")
    .textContent();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Explore the connected atlas", exact: true })
    .click();
  await expect(page.locator("main")).toHaveAttribute("data-focus", "atlas");
  await page.locator('[data-object-id="portal:transaction"]').click();
  await page
    .getByRole("button", { name: "Open experiment controls", exact: true })
    .first()
    .click();
  const hash = await page.getByTestId("transaction-hash").textContent();
  await page.getByLabel("Transaction amount", { exact: true }).fill("3.7");
  await expect(page.getByTestId("transaction-hash")).not.toHaveText(hash!);
  await page
    .getByRole("button", { name: "Play Chain Runner", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Expedition paused", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".game-mission-card li").first()).toHaveClass(
    "complete",
  );
  await page
    .getByRole("button", { name: "Resume mission", exact: true })
    .click();
  await page.keyboard.press("e");
  await expect(
    page
      .getByRole("dialog", { name: "Verify the signed payload", exact: true })
      .locator("pre"),
  ).toHaveText(originalPayload!);
  await page.getByRole("button", { name: /Verify original message/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Mission complete", exact: true }),
  ).toBeVisible();
  expect(
    await canvas!.evaluate((el) => el === document.querySelector("canvas")),
  ).toBe(true);
});

test("phone controls and mission dialogs fit portrait and landscape", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?play=1");
  await page
    .getByRole("button", { name: "Start expedition", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Fly forward", exact: true }),
  ).toBeVisible();
  const player = page.locator(".game-minimap > svg > circle").last();
  const before = await player.getAttribute("cy");
  const forward = await page
    .getByRole("button", { name: "Fly forward", exact: true })
    .boundingBox();
  await page.mouse.move(
    forward!.x + forward!.width / 2,
    forward!.y + forward!.height / 2,
  );
  await page.mouse.down();
  await expect.poll(() => player.getAttribute("cy")).not.toBe(before);
  await page.mouse.up();
  await fly(page, "Payload cache");
  await notice(page, "Payload recovered");
  await fly(page, "Signing terminal");
  await expect(
    page.getByRole("dialog", {
      name: "Verify the signed payload",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Verify original message/ }).click();
  await next(page, "Rebuild the relay");
  await page.setViewportSize({ width: 844, height: 390 });
  await fly(page, "Relay workshop");
  await expect(
    page.getByRole("button", { name: /Install mesh topology/ }),
  ).toBeVisible();
  for (const viewport of [
    { width: 844, height: 390 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(viewport);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.body.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
    const dialog = await page.getByRole("dialog").boundingBox();
    expect(dialog!.x).toBeGreaterThanOrEqual(0);
    expect(dialog!.x + dialog!.width).toBeLessThanOrEqual(viewport.width);
  }
});

test("exhausted shield offers a clean checkpoint retry with keyboard-safe dialogs", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/?play=1");
  await page
    .getByRole("button", { name: "Start expedition", exact: true })
    .click();
  await fly(page, "Payload cache");
  await notice(page, "Payload recovered");
  await fly(page, "Signing terminal");
  for (let i = 0; i < 9; i++) {
    await page.getByRole("button", { name: /Verify altered amount/ }).click();
    await notice(page, "Authorization rejected");
    if (i < 8)
      await page
        .getByRole("button", { name: "Interact E", exact: true })
        .click();
  }
  await expect(
    page.getByRole("dialog", { name: "Courier checkpoint", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("game-energy")).toHaveText("0%");
  await page
    .getByRole("button", { name: "Retry checkpoint", exact: true })
    .click();
  await expect(page.getByTestId("game-energy")).toHaveText("100%");
  await expect(page.locator(".game-mission-card li").first()).not.toHaveClass(
    "complete",
  );
  await expect(page.locator("main")).toHaveAttribute(
    "data-game-mission",
    "seal",
  );
  await page
    .getByRole("button", { name: "Enable game sound", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Mute game sound", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Expedition paused", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("the route list remains playable when WebGL is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      kind: string,
      ...args: unknown[]
    ) {
      return kind.includes("webgl")
        ? null
        : original.call(this, kind as "2d", ...args);
    } as typeof original;
  });
  await page.goto("/?play=1");
  await page
    .getByRole("button", { name: "Start expedition", exact: true })
    .click();
  await expect(
    page.getByText("2D compatibility view · WebGL unavailable", {
      exact: true,
    }),
  ).toBeVisible();
  await fly(page, "Payload cache");
  await notice(page, "Payload recovered");
  await fly(page, "Signing terminal");
  await page.getByRole("button", { name: /Verify original message/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Mission complete", exact: true }),
  ).toBeVisible();
});

test("unsupported cryptography is disclosed as an illustrated check", async ({
  page,
}) => {
  await page.addInitScript(() => {
    crypto.subtle.generateKey = async () => {
      throw new Error("Crypto unavailable for this compatibility test");
    };
  });
  await page.goto("/?play=1");
  await expect(
    page.getByText("Illustrated crypto checks", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Start expedition", exact: true })
    .click();
  await fly(page, "Payload cache");
  await notice(page, "Payload recovered");
  await fly(page, "Signing terminal");
  await expect(
    page.getByRole("dialog", {
      name: "Verify the signed payload",
      exact: true,
    }),
  ).toContainText("TEACHING CHECKS");
  await page.getByRole("button", { name: /Verify original message/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Mission complete", exact: true }),
  ).toContainText("No cryptographic verification was performed");
});
