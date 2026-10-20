import { privateSettings } from "./settings";

export async function alert(text: string) {
  const { telegramBotToken, alertChatId } = await privateSettings();
  if (!telegramBotToken || !alertChatId) return;
  const res = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: alertChatId, text: text.slice(0, 4000), disable_web_page_preview: true }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) console.error(`telegram alert failed: HTTP ${res.status}`);
}
