import { visibleText } from "./html";
import { askJson, llmReady } from "./llm";
import { structuredQuote, toTaka, type Quote } from "./price";

const SYSTEM =
  "You read Bangladeshi shop product pages. Reply with JSON {\"price\": number|null, \"oldPrice\": number|null, \"inStock\": boolean|null, \"title\": string|null}. price is the current selling price in BDT for the main product on the page, not EMI, not accessories, not related products. Use null when unsure.";

async function fromLlm(html: string): Promise<Quote | null> {
  if (!(await llmReady())) return null;
  const text = visibleText(html).slice(0, 6000);
  const answer = await askJson<{ price: unknown; oldPrice: unknown; inStock: unknown; title: unknown }>(SYSTEM, text);
  const price = toTaka(answer.price);
  if (!price) return null;
  const oldPrice = toTaka(answer.oldPrice);
  return {
    price,
    oldPrice: oldPrice && oldPrice > price ? oldPrice : null,
    inStock: typeof answer.inStock === "boolean" ? answer.inStock : null,
    title: typeof answer.title === "string" ? answer.title : null,
    via: "llm",
  };
}

export async function quoteFrom(html: string, own?: (html: string) => Quote | null, useLlm = true): Promise<Quote | null> {
  return own?.(html) ?? structuredQuote(html) ?? (useLlm ? await fromLlm(html) : null);
}
