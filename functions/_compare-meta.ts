// তুলনার পাতা static, তাই Facebook/WhatsApp-এর preview শুধু সাধারণ শিরোনাম পেত। এই Function ?p= দেখে HTML-এর
// title, description, og আর canonical-এ পণ্যের নাম বসায়; পাতার বাকিটা আগের মতোই static ফাইল থেকে আসে
import { bn } from "../src/i18n/bn";
import { en } from "../src/i18n/en";
import { compareShare } from "../src/utils/compare-share";

interface Card {
  slug: string;
  name: string;
  category: string;
  lowest: number | null;
  image: string | null;
}

interface RewriterElement {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  setInnerContent(content: string): void;
  remove(): void;
}

declare class HTMLRewriter {
  on(selector: string, handler: { element(el: RewriterElement): void }): HTMLRewriter;
  transform(response: Response): Response;
}

interface Context {
  request: Request;
  env: { ASSETS: { fetch: (input: Request | string) => Promise<Response> } };
  next: () => Promise<Response>;
}

const MAX_ITEMS = 3;
const MAX_TITLE = 70;
// শুধু link preview আর search bot-এর জন্য; সাধারণ ভিজিটরের শিরোনাম ব্রাউজারে CompareView নিজেই বসায়
const BOTS = /bot|crawl|spider|slurp|facebookexternalhit|facebookcatalog|whatsapp|telegram|slack|discord|linkedin|twitter|skype|viber|pinterest|embedly|preview|google|bing|yandex|duckduck|baidu/i;
let cards: Promise<Map<string, Card>> | null = null;
let siteNames: Promise<{ bn: string; en: string }> | null = null;

async function asset<T>(ctx: Context, path: string): Promise<T> {
  const res = await ctx.env.ASSETS.fetch(new URL(path, ctx.request.url).toString());
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

// একই isolate-এ পরের অনুরোধগুলো আর JSON পার্স করে না
function loadCards(ctx: Context) {
  cards ??= asset<{ product: { slug: string; name: string; category: string; images?: string[] }; lowest: number | null }[]>(ctx, "/data/catalog/summaries.json")
    .then((list) => new Map(list.map(({ product, lowest }) => [product.slug, { slug: product.slug, name: product.name, category: product.category, lowest, image: product.images?.[0] ?? null }])))
    .catch((error) => {
      cards = null;
      throw error;
    });
  return cards;
}

function loadSiteNames(ctx: Context) {
  siteNames ??= asset<{ settings: { name?: string; nameEn?: string } }>(ctx, "/data/catalog/manifest.json")
    .then(({ settings }) => ({ bn: settings.name ?? "", en: settings.nameEn || settings.name || "" }))
    .catch((error) => {
      siteNames = null;
      throw error;
    });
  return siteNames;
}

const setContent = (value: string) => ({ element: (el: RewriterElement) => void el.setAttribute("content", value) });
// static পাতার canonical-এ সাইটের আসল domain থাকে; preview বা www থেকে খুললেও সেটাই রাখি
const withSiteOrigin = (attr: string, path: string) => ({
  element: (el: RewriterElement) => {
    const current = el.getAttribute(attr);
    if (current) el.setAttribute(attr, `${new URL(current).origin}${path}`);
  },
});

export async function compareMeta(ctx: Context, lang: "bn" | "en"): Promise<Response> {
  const page = await ctx.next();
  const url = new URL(ctx.request.url);
  const slugs = [...new Set((url.searchParams.get("p") ?? "").split(",").filter(Boolean))];
  if (!slugs.length || !BOTS.test(ctx.request.headers.get("user-agent") ?? "") || !page.headers.get("content-type")?.includes("text/html")) return page;

  try {
    const [map, names] = await Promise.all([loadCards(ctx), loadSiteNames(ctx)]);
    const found = slugs.flatMap((slug) => map.get(slug) ?? []);
    const items = found.filter((card) => card.category === found[0]?.category).slice(0, MAX_ITEMS);
    if (!items.length) return page;

    const share = compareShare(lang === "en" ? en : bn, lang, items);
    // বাছা ভার্সনের দাম এখানে জানা নেই, তাই তখন বিবরণে কার্ডের দাম লিখি না
    const site = lang === "en" ? names.en : names.bn;
    const title = site && `${share.title} | ${site}`.length <= MAX_TITLE ? `${share.title} | ${site}` : share.title;
    // ?p=a,b আর ?p=b,a একই তুলনা: canonical-এ ক্রম একরকম, যাতে Google দুবার না ধরে
    const query = `?p=${items.map((item) => encodeURIComponent(item.slug)).sort().join(",")}`;
    const path = `${url.pathname}${query}`;
    const image = items.find((item) => item.image)?.image;
    const index = items.length > 1;
    const description = index && !url.searchParams.get("v") ? share.description : null;

    let rewriter = new HTMLRewriter()
      .on("title", { element: (el) => void el.setInnerContent(title) })
      .on('meta[property="og:title"]', setContent(title))
      .on('meta[name="twitter:title"]', setContent(title))
      .on('meta[property="og:url"]', withSiteOrigin("content", path))
      .on('link[rel="canonical"]', withSiteOrigin("href", path))
      .on('link[rel="alternate"][hreflang]', {
        element: (el) => {
          const href = el.getAttribute("href");
          if (href) el.setAttribute("href", `${href.replace(/\/$/, "")}/${query}`);
        },
      })
      .on('meta[name="robots"]', setContent(index ? "index, follow" : "noindex, follow"));
    if (description) {
      rewriter = rewriter
        .on('meta[name="description"]', setContent(description))
        .on('meta[property="og:description"]', setContent(description))
        .on('meta[name="twitter:description"]', setContent(description));
    }
    if (image) {
      rewriter = rewriter
        .on('meta[property="og:image"]', setContent(image))
        .on('meta[name="twitter:image"]', setContent(image))
        .on('meta[property="og:image:width"], meta[property="og:image:height"]', { element: (el) => el.remove() });
    }
    return rewriter.transform(page);
  } catch {
    return page;
  }
}
