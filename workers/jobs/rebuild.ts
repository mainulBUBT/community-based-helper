import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { db } from "../lib/db";
import { count } from "./summary";

const exec = promisify(execFile);

const { SUPABASE_SERVICE_KEY: _service, LLM_API_KEY: _llm, ...buildEnv } = process.env;

async function sh(command: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  await exec(command, args, { env, maxBuffer: 64 * 1024 * 1024 }).catch((error: { stderr?: string; message: string }) => {
    throw new Error(`${command} ${args.join(" ")}: ${(error.stderr || error.message).trim().split("\n").slice(-5).join(" ")}`);
  });
}

export async function rebuild(): Promise<string> {
  const { count: products, error } = await db().from("products").select("id", { count: "exact", head: true });
  if (error) throw error;
  await sh("npm", ["run", "build"], buildEnv);
  if (!process.env.CLOUDFLARE_API_TOKEN) return `${count(products ?? 0, "পণ্যের পেজ")} বানানো হয়েছে, deploy করা হয়নি (Cloudflare token নেই)`;
  await sh("npx", ["wrangler", "pages", "deploy", "out", `--project-name=${process.env.CLOUDFLARE_PAGES_PROJECT || "dordam"}`, "--branch=main"]);
  return `${count(products ?? 0, "পণ্যের পেজ")} বানিয়ে deploy হয়েছে`;
}
