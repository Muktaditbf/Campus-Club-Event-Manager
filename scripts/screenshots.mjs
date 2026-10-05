// Opens every page in a real browser, fails on crashes, and saves screenshots
// to screenshots-out/. Used by CI; run with the app already started.
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const out = "screenshots-out";
await mkdir(out, { recursive: true });

const pages = [
  ["dashboard", "/"],
  ["events", "/events"],
  ["event-detail", "/events/2"],
  ["students", "/students"],
  ["student-detail", "/students/1"],
  ["clubs", "/clubs"],
  ["club-detail", "/clubs/1"],
  ["venues", "/venues"],
  ["sponsors", "/sponsors"],
  ["query-lab", "/queries"],
  ["schema", "/schema"],
];
const darkToo = new Set(["dashboard", "event-detail", "query-lab", "schema"]);

const problems = [];
const browser = await chromium.launch();

async function open(page, path) {
  const res = await page.goto(base + path, { waitUntil: "networkidle" });
  if (!res || res.status() >= 400) problems.push(`${path} -> HTTP ${res?.status()}`);
  if (await page.getByText("Couldn't load data from MySQL").count()) problems.push(`${path} shows the database error page`);
  await page.waitForTimeout(700); // let charts animate in
}

for (const scheme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: scheme });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => problems.push(`[${scheme}] ${page.url()}: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && console.log(`console error [${scheme}] ${page.url()}: ${m.text()}`));
  for (const [name, path] of pages) {
    if (scheme === "dark" && !darkToo.has(name)) continue;
    await open(page, path);
    await page.screenshot({ path: `${out}/${name}-${scheme}.png`, fullPage: true });
    console.log(`📸 ${name}-${scheme}`);
  }
  await ctx.close();
}

// Interactions: procedure, trigger, query runner.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => problems.push(`[interaction] ${page.url()}: ${e.message}`));

  await open(page, "/queries");
  await page.getByText("Success").first().waitFor({ timeout: 10000 }).catch(() => problems.push("Query Lab did not show a result for Q1"));
  await page.getByRole("button", { name: /Trigger: feedback only after attending/ }).click();
  await page.getByRole("button", { name: /^Run/ }).click();
  await page.getByText("Feedback allowed only after attending").first().waitFor({ timeout: 10000 })
    .catch(() => problems.push("Query Lab did not show the trigger error"));
  await page.screenshot({ path: `${out}/query-lab-trigger-error.png`, fullPage: true });

  await open(page, "/events/14");
  await page.getByRole("button", { name: "Register", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('select[name="student_id"]').selectOption("5");
  await page.screenshot({ path: `${out}/register-dialog.png` });
  await dialog.getByRole("button", { name: "Register", exact: true }).click();
  await page.getByText(/sp_register_student: Registration successful/).first().waitFor({ timeout: 10000 })
    .catch(() => problems.push("Registering through sp_register_student did not succeed"));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/register-done.png`, fullPage: true });

  await open(page, "/events/1");
  await page.getByRole("button", { name: /Add feedback/ }).click();
  await page.getByRole("dialog").locator('select[name="student_id"]').selectOption("3");
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
  await page.getByText("Feedback allowed only after attending the event").first().waitFor({ timeout: 10000 })
    .catch(() => problems.push("Feedback trigger message did not appear as a toast"));
  await page.screenshot({ path: `${out}/feedback-trigger-toast.png` });
  await ctx.close();
}

// Phone layout
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await open(page, "/");
  await page.screenshot({ path: `${out}/mobile-dashboard.png`, fullPage: true });
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/mobile-menu.png` });
  await open(page, "/events");
  await page.screenshot({ path: `${out}/mobile-events.png`, fullPage: true });
  await ctx.close();
}

await browser.close();
if (problems.length) {
  console.error("\nProblems:\n" + problems.map((p) => ` - ${p}`).join("\n"));
  process.exit(1);
}
console.log("\nAll pages rendered without errors");
