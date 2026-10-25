import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { db } from "../lib/db";
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

export async function rebuild(): Promise<string> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL বা PUBLISHABLE_KEY নেই, নমুনা ডেটার সাইট deploy হবে না");
  }
  const { count: products, error } = await db().from("products").select("id", { count: "exact", head: true });
  if (error) throw error;
  await sh("npm", ["run", "build"], buildEnv);
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
