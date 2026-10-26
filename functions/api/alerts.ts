import { proxy, readJson, str, type Context } from "./_proxy";

// body: { action: "watch" | "unwatch", endpoint, p256dh?, auth?, slugs?, lang? } → DB এর watch_prices / unwatch_prices
export async function onRequestPost(ctx: Context): Promise<Response> {
  const body = await readJson(ctx.request);
  const endpoint = str(body?.endpoint, 1000);
  const slugs = Array.isArray(body?.slugs) && body.slugs.length <= 100 ? body.slugs.map((s) => str(s, 120)) : null;
  const lang = body?.lang === "en" ? "en" : "bn";
  if (!endpoint?.startsWith("https://") || (slugs && slugs.some((s) => !s))) return proxy(ctx, 20, "", null);

  if (body?.action === "unwatch") return proxy(ctx, 20, "/rest/v1/rpc/unwatch_prices", { p_endpoint: endpoint, p_slugs: slugs });
  const p256dh = str(body?.p256dh, 120);
  const auth = str(body?.auth, 40);
  const ok = body?.action === "watch" && p256dh && auth && slugs?.length;
  return proxy(ctx, 20, "/rest/v1/rpc/watch_prices", ok ? { p_endpoint: endpoint, p_p256dh: p256dh, p_auth: auth, p_slugs: slugs, p_lang: lang } : null);
}
