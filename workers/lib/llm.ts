import { privateSettings } from "./settings";

export async function llmReady(): Promise<boolean> {
  const { llm } = await privateSettings();
  return Boolean(llm?.apiKey && llm.baseUrl && llm.model);
}

export async function askJson<T>(system: string, user: string): Promise<T> {
  const { llm } = await privateSettings();
  if (!llm?.apiKey) throw new Error("LLM key is not set in private_settings");
  const request = { model: llm.model, messages: [{ role: "system", content: system }, { role: "user", content: user }] };
  const send = (body: object) =>
    fetch(new URL("chat/completions", llm.baseUrl.endsWith("/") ? llm.baseUrl : `${llm.baseUrl}/`), {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${llm.apiKey}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
  let res = await send({ ...request, temperature: 0, response_format: { type: "json_object" } });
  // কিছু সার্ভিস বা reasoning মডেল temperature/response_format নেয় না
  if (res.status === 400) res = await send(request);
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = body.choices?.[0]?.message?.content ?? "";
  return JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, "")) as T;
}
