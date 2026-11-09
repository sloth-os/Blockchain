import { chromium, expect } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const directory = resolve(
  process.env.GAME_REVIEW_OUTPUT || "artifacts/game-review/latest",
);
const baseURL = process.env.REVIEW_BASE_URL || "http://127.0.0.1:4173";
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const page = await browser.newPage({ reducedMotion: "reduce" });
const errors = [],
  cases = [];
page.on("pageerror", (error) => errors.push(error.message));
const sizes = [
  ["desktop", 1440, 1000],
  ["phone", 390, 844],
  ["landscape", 844, 390],
];
async function capture(id, selected = sizes) {
  for (const [size, width, height] of selected) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(
      () =>
        new Promise((done) =>
          requestAnimationFrame(() => requestAnimationFrame(done)),
        ),
    );
    const file = `${id}-${size}.png`;
    await page.screenshot({
      path: resolve(directory, file),
      animations: "disabled",
    });
    const metrics = await page.evaluate(() => ({
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      verticalOverflow: document.body.scrollHeight > innerHeight,
      canvasCount: document.querySelectorAll("canvas").length,
      game: document.querySelector("main")?.dataset.gameState,
      mission: document.querySelector("main")?.dataset.gameMission,
      dialog: document
        .querySelector("dialog[open]")
        ?.getAttribute("aria-label"),
      shield: document.querySelector('[data-testid="game-energy"]')
        ?.textContent,
    }));
    if (
      metrics.horizontalOverflow ||
      metrics.verticalOverflow ||
      metrics.canvasCount !== 1
    )
      throw new Error(`Layout failure at ${file}: ${JSON.stringify(metrics)}`);
    cases.push({ id, size, width, height, file, ...metrics });
    console.log(`Captured ${file}`);
  }
}
async function fly(name) {
  await page
    .getByRole("button", { name: "Open mission targets", exact: true })
    .click();
  await page
    .getByTestId("game-targets")
    .getByRole("button", { name: `Fly to ${name}`, exact: true })
    .click();
}
async function notice(title) {
  await expect(page.locator(".game-feedback strong")).toHaveText(title);
}
async function next(title) {
  await page
    .getByRole("dialog", { name: "Mission complete", exact: true })
    .getByRole("button", { name: `Next: ${title}`, exact: true })
    .click();
  await expect(page.locator(".game-mission-card h1")).toHaveText(title);
}

try {
  await page.goto(`${baseURL.replace(/\/+$/, "")}/?play=1`);
  await page
    .getByRole("button", { name: "Start expedition", exact: true })
    .waitFor();
  await capture("00-introduction");
  await page
    .getByRole("button", { name: "Start expedition", exact: true })
    .click();
  await capture("01-flight");
  await capture("01-compact-flight", [["small", 320, 568]]);
  await page
    .getByRole("button", {
      name: "Open mission brief and game help",
      exact: true,
    })
    .click();
  await capture("01-field-manual");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await fly("Payload cache");
  await notice("Payload recovered");
  await fly("Signing terminal");
  await expect(
    page.getByRole("dialog", {
      name: "Verify the signed payload",
      exact: true,
    }),
  ).toBeVisible();
  await capture("01-signature-choice");
  await page.getByRole("button", { name: /Verify original message/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Mission complete", exact: true }),
  ).toBeVisible();
  await capture("01-mission-reward");
  await next("Rebuild the relay");
  await fly("Relay workshop");
  await expect(
    page.getByRole("dialog", { name: "Rebuild for delivery", exact: true }),
  ).toBeVisible();
  await capture("02-topology-choice");
  await page.getByRole("button", { name: /Install mesh topology/ }).click();
  await notice("Redundant relays online");
  await fly("Peer N01");
  await notice("Packet collected");
  await fly("Peer N04");
  await notice("Relayed to N04");
  await capture("02-network-relay");
  await fly("Peer N05");
  await next("Forge a commitment");
  for (const n of ["01", "02", "03", "04"]) {
    await fly(`Transaction shard ${n}`);
    await expect(
      page.locator(`[data-object-id="game:merkle:leaf${Number(n) - 1}"]`),
    ).toHaveCount(0);
  }
  await capture("03-merkle-ready");
  await fly("Merkle forge");
  await next("Earn the quorum");
  await fly("Validator Alpha");
  await notice("Vote verified");
  await fly("Validator Beta");
  await expect(page.locator(".game-mission-card")).toContainText("(60%)");
  await fly("Validator Delta");
  await notice("Different block · vote rejected");
  await capture("04-weighted-quorum");
  await fly("Validator Gamma");
  await expect(page.locator(".game-mission-card")).toContainText("(82%)");
  await fly("Checkpoint gate");
  await next("Find the scaling route");
  await page
    .getByRole("button", { name: "Show tactical camera", exact: true })
    .click();
  await capture("05-scaling-gateways");
  await fly("ZK rollup");
  await next("Cross into the real world");
  await fly("Token burn receipt");
  await notice("Burn receipt secured");
  await fly("Issuer desk");
  await expect(
    page.getByRole("dialog", {
      name: "Who delivers the dollars?",
      exact: true,
    }),
  ).toBeVisible();
  await capture("06-redemption-choice");
  await page
    .getByRole("button", { name: /The issuer and banking rails/ })
    .click();
  await notice("Redemption authorized");
  await fly("Bank handoff");
  await notice("Bank acknowledgment received");
  await capture("06-real-world-handoff");
  await fly("Customer destination");
  await next("Guard the final crossing");
  for (const [name, title] of [
    ["Source event", "Source event secured"],
    ["Checkpoint cache", "Checkpoint recovered"],
    ["Proof cache", "Inclusion path recovered"],
  ]) {
    await fly(name);
    await notice(title);
  }
  await fly("Message verifier");
  await expect(
    page.getByRole("dialog", {
      name: "Check the inclusion proof",
      exact: true,
    }),
  ).toBeVisible();
  await capture("07-bridge-proof-choice");
  await page
    .getByRole("button", { name: /Verify authentic inclusion proof/ })
    .click();
  await notice("Inclusion verified");
  await capture("07-crossing-ready");
  await fly("Destination gate");
  await expect(
    page.getByRole("dialog", { name: "Expedition complete", exact: true }),
  ).toBeVisible();
  await capture("08-expedition-complete");
  await page
    .getByRole("button", { name: "Explore your mission record", exact: true })
    .click();
  await capture("09-mission-records");
  if (errors.length) throw new Error(errors.join("\n"));
  await writeFile(
    resolve(directory, "manifest.json"),
    JSON.stringify({ cases, errors }, null, 2),
  );
  await writeFile(
    resolve(directory, "index.html"),
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Chain Runner · browser review</title><style>body{margin:30px;background:#09151f;color:#dcebe8;font:14px system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}figure{margin:0;border:1px solid #284755;padding:12px;border-radius:12px}img{width:100%;max-height:600px;object-fit:contain}a{color:#bdeb8c}figcaption{margin-top:10px}</style><h1>Chain Runner · ${cases.length} Chromium captures</h1><p>Complete seven-mission campaign at desktop, phone, landscape and compact sizes. See manifest.json for layout metrics.</p><main>${cases.map((item) => `<figure><a href="${item.file}"><img loading="lazy" src="${item.file}" alt="${item.id} at ${item.size}"></a><figcaption>${item.id} · ${item.width} × ${item.height}</figcaption></figure>`).join("")}</main></html>`,
  );
  await page.close();
  const sheet = await browser.newPage({
    viewport: { width: 1680, height: 1000 },
  });
  let contactCount = 0;
  for (const size of ["desktop", "phone", "landscape", "small"]) {
    const group = cases.filter((item) => item.size === size);
    for (let start = 0; start < group.length; start += 4) {
      const batch = group.slice(start, start + 4),
        phone = ["phone", "small"].includes(size);
      const pictures = await Promise.all(
        batch.map(async (item) => ({
          ...item,
          src: `data:image/png;base64,${(await readFile(resolve(directory, item.file))).toString("base64")}`,
        })),
      );
      await sheet.setContent(
        `<!doctype html><html lang="en"><meta charset="utf-8"><title>Game review sheet</title><style>body{margin:20px;background:#07131d;color:#c8e8b0;font:14px system-ui}h1{font-size:22px}main{display:grid;grid-template-columns:repeat(${phone ? 4 : 2},minmax(0,1fr));gap:16px}figure{margin:0}img{width:100%;height:${phone ? 850 : 420}px;object-fit:contain;object-position:top}figcaption{margin-top:8px}</style><h1>Chain Runner · ${size} · ${start + 1}–${start + batch.length}</h1><main>${pictures.map((item) => `<figure><img src="${item.src}" alt="${item.id}"><figcaption>${item.id}</figcaption></figure>`).join("")}</main></html>`,
      );
      await sheet.evaluate(() =>
        Promise.all([...document.images].map((image) => image.decode())),
      );
      await sheet.screenshot({
        path: resolve(
          directory,
          `contact-${size}-${String(start / 4 + 1).padStart(2, "0")}.png`,
        ),
      });
      contactCount++;
    }
  }
  console.log(
    `Reviewed ${cases.length} states, ${contactCount} contact sheets, no overflow or uncaught browser exceptions. Gallery: ${directory}/index.html`,
  );
} finally {
  await browser.close();
}
