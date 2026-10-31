// private_settings এর AI সেটআপ পড়া; worker আর ম্যানেজার (agent/) দুজনেই ব্যবহার করে, তাই এখানে Node বা DB কিছু নেই

export interface LlmSettings {
  baseUrl: string;
  model: string;
  apiKey: string | null;
}

interface StoredModel {
  baseUrl: string;
  model: string;
}

export interface StoredSettings {
  llm?: LlmSettings | null;
  llmModels?: StoredModel[];
  llmKeys?: Record<string, string>;
  telegramBotToken?: string | null;
  alertChatId?: string | null;
}

export const providerKey = (baseUrl: string) => baseUrl.trim().replace(/\/+$/, "");
export const modelTarget = (model: Pick<LlmSettings, "baseUrl" | "model">) => `${providerKey(model.baseUrl)}|${model.model}`;

// এক প্রোভাইডারের কয়েকটা key (কমা, ফাঁকা জায়গা বা নতুন লাইনে আলাদা)
export const splitKeys = (apiKey: string | null | undefined) => (apiKey ?? "").split(/[\s,]+/).filter(Boolean);

// তালিকা না থাকলে (পুরনো সেটিং) আগের একটা মডেলই তালিকা
export function storedModels(value: StoredSettings): LlmSettings[] {
  const keyOf = (baseUrl: string) => value.llmKeys?.[providerKey(baseUrl)] ?? (value.llm && providerKey(value.llm.baseUrl) === providerKey(baseUrl) ? value.llm.apiKey : null);
  const list: StoredModel[] = value.llmModels?.length ? value.llmModels : value.llm?.baseUrl && value.llm.model ? [value.llm] : [];
  return list.map((m) => ({ baseUrl: m.baseUrl, model: m.model, apiKey: keyOf(m.baseUrl) }));
}
