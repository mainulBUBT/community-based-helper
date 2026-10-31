import type { ManagerEnv } from "./env";

async function sha256(text: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Telegram প্রতিটা webhook ডাকে এটা header এ ফেরত পাঠায়; আলাদা secret না রেখে service key থেকে বানানো
export const webhookSecret = async (env: ManagerEnv) => (await sha256(`telegram|${env.SUPABASE_SERVICE_KEY}`)).slice(0, 48);

export const tokenMark = async (token: string, url: string) => `${url}|${(await sha256(token)).slice(0, 16)}`;

async function call(token: string, method: string, body: object): Promise<boolean> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) console.error(`telegram ${method} failed: HTTP ${res.status}`);
  return res.ok;
}

export const sendMessage = (token: string, chatId: string, text: string) =>
  call(token, "sendMessage", { chat_id: chatId, text: text.slice(0, 4000), disable_web_page_preview: true });

export const setWebhook = (token: string, url: string, secret: string) =>
  call(token, "setWebhook", { url, secret_token: secret, allowed_updates: ["message"], drop_pending_updates: true });
