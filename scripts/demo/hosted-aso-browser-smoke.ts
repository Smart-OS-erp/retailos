import type { Page } from "playwright";

const { existsSync, mkdirSync, readFileSync } = require("node:fs");
const { join } = require("node:path");
const { chromium } = require("playwright");

const ROOT = process.cwd();
const CREDENTIALS_PATH = join(ROOT, ".tmp", "hosted-aso-credentials.json");
const BASE_URL = process.env.ASO_DEMO_URL || "https://retailos-ten.vercel.app";

function credentials() {
  if (!existsSync(CREDENTIALS_PATH)) {
    throw new Error("Run npm run demo:hosted:provision before browser smoke.");
  }
  return JSON.parse(readFileSync(CREDENTIALS_PATH, "utf8"));
}

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.getByLabel(/work email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in securely/i }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForURL((url: URL) => !url.pathname.startsWith("/login"), { timeout: 30_000 });
}

async function assertPageContains(page: Page, path: string, expected: RegExp[]) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
  const text = await page.locator("body").innerText({ timeout: 20_000 });
  if (/setup-error|sign in to retailos/i.test(text)) {
    throw new Error(`${path} did not remain authenticated`);
  }
  for (const pattern of expected) {
    if (!pattern.test(text)) throw new Error(`${path} missing expected text ${pattern}`);
  }
}

async function runViewport(name: string, viewport: { height: number; width: number }) {
  const creds = credentials();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport });
  const evidenceDir = join(ROOT, ".tmp", "hosted-aso-browser");
  mkdirSync(evidenceDir, { recursive: true });
  try {
    await login(page, creds.email, creds.password);
    await assertPageContains(page, "/workspace", [/Aṣọ Collective|Owner workspace|Executive workspace|RetailOS/i]);
    await assertPageContains(page, "/inventory", [/Inventory|ASO-|Aso|Lagos|Lekki|Abuja|Ibadan/i]);
    await assertPageContains(page, "/inventory-recovery", [/Recovery|opportunit|risk|Aso|Synthetic/i]);
    await assertPageContains(page, "/merchandising", [/Merchandising|recommendation|productivity|markdown|plan/i]);
    await assertPageContains(page, "/merchandising/recommendations", [/Transfer-first review|Gold Aso-Oke|recommendation/i]);
    await assertPageContains(page, "/merchandising/markdowns", [/Campaign\/markdown review|markdown|missing cost/i]);
    await page.screenshot({ fullPage: true, path: join(evidenceDir, `${name}-merchandising-markdowns.png`) });
  } finally {
    await browser.close();
  }
}

async function main() {
  await runViewport("desktop", { width: 1440, height: 1000 });
  await runViewport("mobile", { width: 390, height: 844 });
  console.log(JSON.stringify({ authenticated_browser: true, base_url: BASE_URL, viewports: ["desktop", "mobile"] }, null, 2));
}

main().catch((error: Error) => {
  console.error(`Hosted Aso browser smoke failed: ${error.message}`);
  process.exit(1);
});
