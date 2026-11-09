import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const baseURL = (
  process.env.REVIEW_BASE_URL || "http://127.0.0.1:4173"
).replace(/\/+$/, "");
const directory = resolve(
  process.env.REVIEW_OUTPUT || "artifacts/ux-review/latest",
);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const cases = [],
  errors = [];
const groups = new Map();
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
async function capture(page, id, group, label) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const file = id + ".png";
  await page.screenshot({
    path: resolve(directory, file),
    animations: "disabled",
  });
  const metrics = await page.evaluate(() => ({
    viewport: { width: innerWidth, height: innerHeight },
    focus: document.querySelector("main")?.dataset.focus,
    phase: document.querySelector(".scene")?.dataset.step,
    overflow: document.documentElement.scrollWidth > innerWidth,
    stageHeight: document.querySelector(".atlas-stage")?.clientHeight,
    narrationFont: getComputedStyle(document.querySelector(".narration-copy p"))
      .fontSize,
    visibleLandmarks: [...document.querySelectorAll(".portal-label")].filter(
      (el) => getComputedStyle(el).visibility === "visible",
    ).length,
  }));
  const entry = { id, file, group, label, ...metrics };
  cases.push(entry);
  groups.set(group, [...(groups.get(group) || []), entry]);
  if (cases.length % 10 === 0)
    console.log("Captured " + cases.length + " browser states");
}
async function newPage(viewport) {
  const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (/Encountered two children|Each child in a list/.test(message.text()))
      errors.push(message.text());
  });
  await page.goto(baseURL);
  await page.locator("canvas,.spatial-fallback-objects").first().waitFor();
  return page;
}
async function open(page, route) {
  await page.goto(baseURL + "/#/" + route);
  if (!(await page.locator(".atlas-workbench").isVisible()))
    await page
      .getByRole("button", { name: "Open experiment controls", exact: true })
      .first()
      .click();
}
try {
  const page = await newPage({ width: 1440, height: 1000 });
  await page
    .getByText("Real local signature verified", { exact: true })
    .waitFor();
  for (const [index, button] of (
    await page.locator(".atlas-phase-points button").all()
  ).entries()) {
    await button.click();
    await capture(
      page,
      "transaction-" + index,
      "Transaction",
      await page.locator("h1").textContent(),
    );
  }
  await open(page, "networks");
  for (const topology of ["mesh", "ring", "hub"]) {
    await page.getByRole("button", { name: topology, exact: true }).click();
    await page
      .getByRole("complementary")
      .getByRole("button", { name: "Broadcast a message", exact: true })
      .click();
    await capture(
      page,
      "network-" + topology,
      "Peer network",
      topology + " broadcast",
    );
  }
  await page.getByRole("slider", { name: /^Offline nodes/ }).fill("20");
  await capture(page, "network-failure", "Peer network", "Hub failure");
  await open(page, "compare");
  const designs = await page
    .getByLabel("Design A", { exact: true })
    .locator("option")
    .evaluateAll((options) =>
      options.map((o) => ({ value: o.value, text: o.textContent })),
    );
  for (const design of designs) {
    await page
      .getByLabel("Design A", { exact: true })
      .selectOption(design.value);
    await capture(page, "design-" + design.value, "Designs", design.text);
  }
  for (const [route, label, group] of [
    ["applications", "Real-world application", "Application"],
    ["signals", "Open question", "Issue"],
  ]) {
    await open(page, route);
    const options = await page
      .getByLabel(label, { exact: true })
      .locator("option")
      .evaluateAll((items) =>
        items.map((o) => ({ value: o.value, text: o.textContent })),
      );
    for (const option of options) {
      await page.getByLabel(label, { exact: true }).selectOption(option.value);
      for (let step = 0; step < 4; step++) {
        await page
          .getByRole("button", {
            name: "Explore flow step " + (step + 1),
            exact: true,
          })
          .click();
        await capture(
          page,
          route + "-" + option.value + "-" + step,
          group + " — " + option.text,
          option.text + " · step " + (step + 1),
        );
      }
    }
  }
  for (const lens of ["Data", "Messages", "Trust"]) {
    await page.getByRole("button", { name: lens, exact: true }).click();
    await capture(
      page,
      "lens-" + lens.toLowerCase(),
      "Information lenses",
      lens,
    );
  }
  await page.close();
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 740 },
    { width: 768, height: 1024 },
    { width: 844, height: 390 },
  ]) {
    const mobile = await newPage(viewport),
      key = viewport.width + "x" + viewport.height;
    await mobile
      .getByRole("button", { name: "Explore the connected atlas", exact: true })
      .click();
    await capture(mobile, key + "-atlas", key, "Connected atlas");
    for (const route of [
      "journey",
      "networks",
      "compare",
      "applications",
      "signals",
    ]) {
      await open(mobile, route);
      await capture(
        mobile,
        key + "-" + route + "-controls",
        key,
        route + " · controls",
      );
      await mobile
        .getByRole("button", { name: "Close experiment panel", exact: true })
        .click();
      await capture(mobile, key + "-" + route, key, route + " · world");
    }
    await mobile.close();
  }
  const style =
    "body{background:#0b141d;color:#d9e9ed;font:16px system-ui;margin:24px}h1{font-size:28px}h2{margin:32px 0 16px}nav{display:flex;gap:12px;flex-wrap:wrap}a{color:#c4f568}section{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}figure{margin:0;border:1px solid #354953;border-radius:8px;overflow:hidden}img{display:block;width:100%}figcaption{padding:10px;font-size:13px}";
  await writeFile(
    resolve(directory, "index.html"),
    '<!doctype html><meta charset="utf-8"><title>Chain Atlas visual review</title><style>' +
      style +
      "</style><h1>Chain Atlas · browser review</h1><p>" +
      cases.length +
      " captured states · " +
      errors.length +
      " browser exceptions</p><nav>" +
      [...groups.keys()]
        .map((key, i) => '<a href="#g' + i + '">' + escape(key) + "</a>")
        .join("") +
      "</nav>" +
      [...groups]
        .map(
          ([key, entries], i) =>
            '<h2 id="g' +
            i +
            '">' +
            escape(key) +
            "</h2><section>" +
            entries
              .map(
                (entry) =>
                  '<figure><a href="' +
                  entry.file +
                  '"><img loading="lazy" src="' +
                  entry.file +
                  '"></a><figcaption>' +
                  escape(entry.label) +
                  "</figcaption></figure>",
              )
              .join("") +
            "</section>",
        )
        .join(""),
  );
  const sheet = await browser.newPage({
    viewport: { width: 1800, height: 1400 },
    deviceScaleFactor: 1,
  });
  for (const [key, entries] of groups) {
    const images = await Promise.all(
      entries.map(
        async (entry) =>
          '<figure><img src="data:image/png;base64,' +
          (await readFile(resolve(directory, entry.file))).toString("base64") +
          '"><figcaption>' +
          escape(entry.label) +
          "</figcaption></figure>",
      ),
    );
    await sheet.setContent(
      "<style>" +
        style +
        (/^\d+x\d+$/.test(key)
          ? "section{grid-template-columns:repeat(3,minmax(0,1fr))}section img{height:480px;object-fit:contain;background:#071019}"
          : "") +
        "</style><h1>" +
        escape(key) +
        "</h1><section>" +
        images.join("") +
        "</section>",
    );
    await sheet.screenshot({
      path: resolve(
        directory,
        "sheet-" + key.replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".png",
      ),
      fullPage: true,
    });
  }
  await writeFile(
    resolve(directory, "manifest.json"),
    JSON.stringify({ baseURL, errors, cases }, null, 2),
  );
  console.log(
    JSON.stringify({
      captures: cases.length,
      groups: groups.size,
      errors,
      directory,
    }),
  );
  if (errors.length) process.exitCode = 1;
} finally {
  await browser.close();
}
