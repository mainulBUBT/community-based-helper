import { proxy, readJson, str, type Context } from "./_proxy";

const VISITOR = /^[A-Za-z0-9-]{1,64}$/;
const REFERRER = /^[A-Za-z0-9.-]{1,255}$/;

export async function onRequestPost(ctx: Context): Promise<Response> {
  const body = await readJson(ctx.request);
  const visitor = str(body?.visitor, 64);
  const path = str(body?.path, 300);
  const referrer = body?.referrer == null ? null : str(body.referrer, 255);
  const productId = body?.product_id == null ? null : str(body.product_id, 64);
  const ok = visitor && VISITOR.test(visitor) && path?.startsWith("/") && !path.startsWith("//") && (referrer === null || REFERRER.test(referrer));
  return proxy(ctx, 60, "/rest/v1/page_views", ok ? { visitor, path, product_id: productId, referrer } : null);
}
