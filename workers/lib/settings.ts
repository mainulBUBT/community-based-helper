import { db, must } from "./db";

export interface LlmSettings {
  baseUrl: string;
  model: string;
  apiKey: string | null;
}

export interface PrivateSettings {
  llm: LlmSettings | null;
  telegramBotToken: string | null;
  alertChatId: string | null;
}

let cached: PrivateSettings | null = null;

export async function privateSettings(): Promise<PrivateSettings> {
  if (cached) return cached;
  const row = await must(db().from("private_settings").select("value").maybeSingle());
  const value = (row?.value ?? {}) as Partial<PrivateSettings>;
  cached = {
    llm: value.llm ?? null,
    telegramBotToken: value.telegramBotToken ?? null,
    alertChatId: value.alertChatId ?? null,
  };
  return cached;
}
