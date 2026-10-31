import type { ManagerEnv } from "./env";
import { isAdmin } from "./supabase";
import { webhookSecret } from "./telegram";

export { Manager } from "./manager";

// অ্যাডমিন পাতা অন্য ঠিকানা (dordam.app) থেকে ডাকে; লোকালে পরীক্ষার জন্য localhost
function cors(request: Request, env: ManagerEnv): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  if (origin !== env.SITE_ORIGIN && !/^http:\/\/localhost:\d+$/.test(origin)) return {};
  return { "access-control-allow-origin": origin, "access-control-allow-headers": "authorization, content-type", "access-control-allow-methods": "GET, POST", vary: "origin" };
}

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);
    const headers = cors(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    const manager = env.MANAGER.getByName("owner");

    if (pathname === "/telegram" && request.method === "POST") {
      if (request.headers.get("x-telegram-bot-api-secret-token") !== (await webhookSecret(env))) return new Response(null, { status: 403 });
      return manager.fetch(request);
    }

    if ((pathname === "/status" && request.method === "GET") || (pathname === "/chat" && request.method === "POST")) {
      const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
      if (!token || !(await isAdmin(env, token))) return new Response(null, { status: 401, headers });
      const res = await manager.fetch(request);
      return new Response(res.body, { status: res.status, headers: { "content-type": "application/json", ...headers } });
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<ManagerEnv>;
