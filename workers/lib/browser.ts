import { chromium, type Browser } from "playwright";
import { USER_AGENT } from "./agent";
import { NotFound } from "./errors";
import { assertAllowed, checkStatus } from "./http";
import { limited } from "./limiter";

let browser: Promise<Browser> | null = null;

export async function render(target: string, waitFor?: string): Promise<string> {
  const url = await assertAllowed(target);
  browser ??= chromium.launch().catch((error) => {
    browser = null;
    throw error;
  });
  const context = await (await browser).newContext({ userAgent: USER_AGENT });
  try {
    return await limited(url.host, async () => {
      const page = await context.newPage();
      await page.route("**/*", (route) =>
        ["image", "media", "font"].includes(route.request().resourceType()) ? route.abort() : route.continue(),
      );
      const res = await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 45_000 });
      const status = res?.status() ?? 0;
      if (waitFor) await page.waitForSelector(waitFor, { timeout: 15_000 }).catch(() => undefined);
      else await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
      const html = await page.content();
      checkStatus(url.host, status, html);
      if (status === 404 || status === 410) throw new NotFound(`${url.href} ${status}`);
      if (status >= 400) throw new Error(`${url.href} HTTP ${status}`);
      return html;
    });
  } finally {
    await context.close();
  }
}

export async function closeBrowser() {
  const current = browser;
  browser = null;
  if (!current) return;
  try {
    await (await current).close();
  } catch {
    // বন্ধ করতে ব্যর্থ হলেও রান থামানোর দরকার নেই
  }
}
