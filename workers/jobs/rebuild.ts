import { execFile } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { db, must } from "../lib/db";
import { message } from "../lib/errors";
import { sendPriceAlerts } from "../services/price-alerts";
import { count } from "./summary";

const exec = promisify(execFile);

const buildEnv = { ...process.env };
for (const secret of ["SUPABASE_SERVICE_KEY", "LLM_API_KEY", "CLOUDFLARE_API_TOKEN", "VAPID_PRIVATE_KEY"]) delete buildEnv[secret];

async function sh(command: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  await exec(command, args, { env, maxBuffer: 64 * 1024 * 1024 }).catch((error: { stderr?: string; message: string }) => {
    throw new Error(`${command} ${args.join(" ")}: ${(error.stderr || error.message).trim().split("\n").slice(-5).join(" ")}`);
  });
}

// অ্যাডমিনের "ফ্রি সীমা" পাতার জন্য: Cloudflare এক deploy-এ ২০,০০০ ফাইল আর প্রতি ফাইলে ২৫ MiB নেয়;
// GitHub ৬০ দিন commit না হলে cron থামায়
async function recordUsage() {
  const files = (await readdir("out", { recursive: true, withFileTypes: true })).filter((f) => f.isFile());
  const sizes = await Promise.all(files.map((f) => stat(path.join(f.parentPath, f.name)).then((s) => s.size)));
  const lastCommit = (await exec("git", ["log", "-1", "--format=%cI"]).catch(() => ({ stdout: "" }))).stdout.trim() || null;
  const usage = { files: files.length, bytes: sizes.reduce((a, b) => a + b, 0), largest: Math.max(0, ...sizes), lastCommit, at: new Date().toISOString() };
  await must(db().from("private_settings").update({ usage }).eq("id", true));
}

export async function rebuild(): Promise<string> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL বা PUBLISHABLE_KEY নেই, নমুনা ডেটার সাইট deploy হবে না");
  }
  const { count: products, error } = await db().from("products").select("id", { count: "exact", head: true });
  if (error) throw error;
  await sh("npm", ["run", "build"], buildEnv);
  await recordUsage().catch((error) => console.error(`usage: ${message(error)}`));
  if (!process.env.CLOUDFLARE_API_TOKEN) return `${count(products ?? 0, "পণ্যের পেজ")} বানানো হয়েছে, deploy করা হয়নি (Cloudflare token নেই)`;
  const { PATH, HOME, CI, NODE_ENV, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } = process.env;
  await sh("npx", ["wrangler", "pages", "deploy", "out", `--project-name=${process.env.CLOUDFLARE_PAGES_PROJECT || "dordam"}`, "--branch=main"], {
    PATH,
    HOME,
    CI,
    NODE_ENV,
    CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID,
  });
  const alerts = await sendPriceAlerts();
  return `${count(products ?? 0, "পণ্যের পেজ")} বানিয়ে deploy হয়েছে${alerts ? `, ${alerts}` : ""}`;
}
