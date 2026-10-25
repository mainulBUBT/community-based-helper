import { StoreBlocked } from "../lib/errors";
import { decode, stripTags } from "../lib/html";
import { getJson, getText } from "../lib/http";
import { toTaka } from "../lib/price";
import { sitemapUrls } from "../lib/sitemap";
import { appleGadgetsVariants, chardikeVariants, dazzleVariants, gadgetAndGearVariants, hhsVariants, kryVariants, maczenVariants, perfectoVariants, startechVariants, sumashVariants, wooVariants } from "./parsers";
import type { Condition, Listing, Store } from "./types";

const site = (url: string) => new URL(url).host.replace(/^www\./, "");

export function slugTitle(url: string): string {
  const slug = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
  return decodeURIComponent(slug).replace(/[-_]+/g, " ");
}

function slugListing(url: string): Listing {
  return { title: slugTitle(url), url, price: null, oldPrice: null };
}

// সাধারণ দোকান: product sitemap থেকে listing, ভার্সনের দাম parser থেকে, না থাকলে JSON-LD/itemprop/og।
// নতুন দোকান যোগ করতে নিচের তালিকায় একটা এন্ট্রি লাগে।
function sitemapStore(config: {
  id: string;
  name: string;
  origin: string;
  sample: string;
  sitemap: string;
  path: string;
  match?: RegExp; // path এর নিচে ক্যাটাগরি পাতাও থাকলে, শুধু পণ্যের পাতা চেনার নিয়ম
  condition: Condition;
  promoUrl?: string;
  variants?: Store["variants"];
}): Store {
  return {
    ...config,
    promoUrl: config.promoUrl ?? null,
    rendered: false,
    async discover() {
      const urls = await sitemapUrls(config.sitemap);
      return urls.flatMap((url) => {
        const { pathname } = new URL(url);
        const product = pathname.startsWith(config.path) && (!config.match || config.match.test(pathname));
        return site(url) === site(config.origin) && product ? [slugListing(`${config.origin}${pathname}`)] : [];
      });
    },
  };
}

// Star Tech: product sitemap নেই, ক্যাটাগরি পেজ পাতা ধরে ঘুরে listing
const STARTECH = "https://www.startech.com.bd";
const STARTECH_CATEGORIES = [
  "/mobile-phone",
  "/apple-ipad",
  "/tablet-pc",
  "/apple-macbook",
  "/apple-imac",
  "/apple-mac-mini",
  "/apple-mac-studio",
  "/gadget/smart-watch",
  "/earbuds",
  "/accessories/headphone",
  "/power-bank",
  "/monitor",
  "/desktops/brand-pc",
  "/mobile-phone-charger-adapter",
  "/charger-fan",
];

function parseStartechListings(html: string): Listing[] {
  return html.split('class="p-item"').slice(1).flatMap((block) => {
    const link = /class="p-item-name">\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(block);
    if (!link) return [];
    const priceBlock = /class="p-item-price">([\s\S]*?)<\/div>/.exec(block)?.[1] ?? "";
    const price = toTaka(/price-new">([^<]+)/.exec(priceBlock)?.[1] ?? stripTags(priceBlock));
    const oldPrice = toTaka(/price-old">([^<]+)/.exec(priceBlock)?.[1]);
    return [{ title: stripTags(link[2]), url: decode(link[1]), price, oldPrice }];
  });
}

const startech: Store = {
  id: "startech",
  name: "Star Tech",
  origin: STARTECH,
  rendered: false,
  condition: "official",
  sample: `${STARTECH}/iphone-18-pro`,
  promoUrl: `${STARTECH}/information/offer`,
  variants: startechVariants,
  async discover() {
    const all: Listing[] = [];
    for (const path of STARTECH_CATEGORIES) {
      for (let page = 1; page <= 30; page++) {
        const items = parseStartechListings(await getText(`${STARTECH}${path}${page > 1 ? `?page=${page}` : ""}`));
        const fresh = items.filter((item) => !all.some((seen) => seen.url === item.url));
        if (fresh.length === 0) break;
        all.push(...fresh);
      }
    }
    return all;
  },
};

// Dazzle: product sitemap এ শুধু সাম্প্রতিক পণ্য, তাই ক্যাটালগের ব্র্যান্ডের সাব-ক্যাটাগরি (যেমন phones/iphone) থেকেও
const DAZZLE = "https://dazzle.com.bd";
const APPLE_LINES = /iphone|ipad|mac|apple|airpod/;

function brandCategory(url: string, brands: Set<string>): boolean {
  const [root, , leaf] = new URL(url).pathname.split("/").filter(Boolean);
  if (root !== "categories" || !leaf) return false;
  return [...brands].some((brand) => leaf.includes(brand) || (brand === "apple" && APPLE_LINES.test(leaf)));
}

const dazzleSitemap = sitemapStore({
  id: "dazzle",
  name: "Dazzle",
  origin: DAZZLE,
  sample: `${DAZZLE}/product/iphone-18-pro-price-in-bangladesh`,
  sitemap: `${DAZZLE}/products/sitemap.xml`,
  path: "/product/",
  condition: "unofficial",
  variants: dazzleVariants,
});

const dazzle: Store = {
  ...dazzleSitemap,
  listsBy: "brand",
  async discover(products) {
    const urls = new Set((await dazzleSitemap.discover(products)).map((l) => l.url));
    const brands = new Set(products.flatMap((p) => p.brand.toLowerCase().split(/\s+/)).filter((w) => w.length > 2));
    const categories = (await sitemapUrls(`${DAZZLE}/categories/sitemap.xml`)).filter((url) => brandCategory(url, brands));
    for (const category of categories) {
      for (let page = 1, pages = 1; page <= Math.min(pages, 30); page++) {
        const html = await getText(`${category}${page > 1 ? `?page=${page}` : ""}`)
          .then((text) => text.replace(/\\"/g, '"'))
          .catch((error) => {
            if (error instanceof StoreBlocked) throw error;
            return "";
          });
        pages = Number(/"totalPages":(\d+)/.exec(html)?.[1] ?? pages);
        for (const [, slug] of html.matchAll(/"productSlug":"([^"]+)"/g)) urls.add(`${DAZZLE}/product/${slug}`);
      }
    }
    return [...urls].map(slugListing);
  },
};

// Pickaboo: robots.txt এ আটকায়; অনুমতি পেলে সার্চ-পেজ থেকে discover চালু করা যাবে
const PICKABOO = "https://www.pickaboo.com";

function parsePickabooListings(html: string): Listing[] {
  const seen = new Set<string>();
  return [...html.matchAll(/<a[^>]+href="((?:https:\/\/www\.pickaboo\.com)?\/product-detail\/[^"#?]+)"[^>]*>([\s\S]*?)<\/a>/g)].flatMap(([, href, inner]) => {
    const url = new URL(decode(href), PICKABOO).href;
    const title = stripTags(inner);
    if (!title || seen.has(url)) return [];
    seen.add(url);
    return [{ title, url, price: null, oldPrice: null }];
  });
}

const pickaboo: Store = {
  id: "pickaboo",
  name: "Pickaboo",
  origin: PICKABOO,
  rendered: false,
  condition: "official",
  sample: `${PICKABOO}/product-detail/apple-iphone-17`,
  promoUrl: null,
  listsBy: "name",
  async discover(products) {
    const lists: Listing[] = [];
    for (const { name } of products) lists.push(...parsePickabooListings(await getText(`${PICKABOO}/search-result/${encodeURIComponent(name)}`)));
    return lists;
  },
};

// Klassy Missy (Next.js): product sitemap নেই; ক্যাটাগরির তালিকা RSS এ, প্রতিটা ক্যাটাগরির প্রথম পাতায় ৩৬টা পণ্য
// (বাকিগুলো পাতায় JS দিয়ে আসে, তাই সব পণ্য ধরা পড়ে না)
const KLASSY = "https://klassy.com.bd";

const klassy: Store = {
  id: "klassy",
  name: "Klassy Missy",
  origin: KLASSY,
  rendered: false,
  condition: "official",
  sample: `${KLASSY}/product/LANEIGE-Lip-Sleeping-Mask-EX-BERRY-20g-z10kh`,
  promoUrl: null,
  async discover() {
    const rss = await getText(`${KLASSY}/manifest/categories.xml`);
    const categories = new Set([...rss.matchAll(/<link>\s*(https:\/\/klassy\.com\.bd\/category\/[A-Za-z0-9-]+)\s*<\/link>/g)].map(([, url]) => url));
    const urls = new Set<string>();
    for (const category of categories) {
      const html = await getText(category).catch((error) => {
        if (error instanceof StoreBlocked) throw error;
        return "";
      });
      for (const [, slug] of html.matchAll(/\/products?\/([A-Za-z0-9-]+)/g)) urls.add(`${KLASSY}/product/${slug}`);
    }
    return [...urls].map(slugListing);
  },
};

// Her Happy Skin (Next.js): পাতায় দাম JS-এ আসে; তালিকা আর দাম-স্টক দুটোই সাইট নিজে যে API থেকে
// পড়ে (her-api) সেখান থেকে — প্রতি পাতায় ২০টা পণ্য, লিংকের পরের পাতা links.next এ
const HHS = "https://herhappyskin.com";

const herhappyskin: Store = {
  id: "herhappyskin",
  name: "Her Happy Skin",
  origin: HHS,
  rendered: false,
  condition: "official",
  sample: `${HHS}/cosrx-advanced-snail-96-mucin-power-essence-30ml-mini-19-cosrx-advanced-snail-96-mucin-power-essence-100ml`,
  promoUrl: null,
  variants: hhsVariants,
  async discover() {
    const all: Listing[] = [];
    for (let page = 1; page <= 40; page++) {
      const data = (await getJson(`https://her-api.herhappyskin.com/hst-api/products/?name=&page=${page}`)) as
        | { results?: { name: string; slug: string; price: number; discount_price: number }[]; links?: { next: string | null } }
        | null;
      if (!data) break;
      for (const item of data.results ?? []) {
        all.push({ title: item.name, url: `${HHS}/${item.slug}`, price: item.discount_price || item.price, oldPrice: item.discount_price ? item.price : null });
      }
      if (!data.links?.next) break;
    }
    return all;
  },
};

// Trek N Tread: Laravel (Inertia) — সাইটম্যাপ নেই, প্রোডাক্ট পাতার দাম embedded data-page JSON-এ (এনকোডেড &quot;);
// product.variation_price = মূল দাম, variation_discounted_price = ছাড়ের দাম। ক্যাটালগ পাতা (?page=1..12)-তে সব পণ্য।
const TREK = "https://trekntread.com";

const trekntread: Store = {
  id: "trekntread",
  name: "Trek N Tread",
  origin: TREK,
  rendered: false,
  condition: "unofficial",
  sample: `${TREK}/products/673-adidas-samba-color-white-green-low-neck-grade-oem`,
  promoUrl: null,
  parse(html) {
    const m = /"variation_price":(\d+),"variation_discounted_price":(\d+),"variations"/.exec(html.replace(/&quot;/g, '"'));
    const full = m ? Number(m[1]) : 0;
    const sale = m ? Number(m[2]) : 0;
    const price = sale > 0 ? sale : full > 0 ? full : null;
    if (!price) return null;
    return { price, oldPrice: full > sale ? full : null, inStock: true, title: null, via: "trek-data-page" };
  },
  async discover() {
    const all: Listing[] = [];
    for (let page = 1; page <= 12; page++) {
      const text = await getText(`${TREK}?page=${page}`).then((html) => html.replace(/&quot;/g, '"')).catch(() => "");
      for (const m of text.matchAll(/"title":"((?:[^"\\]|\\.)*)","slug":"([a-z0-9-]+)","type":"1"/g)) {
        let name = m[1];
        try {
          name = JSON.parse(`"${m[1]}"`) as string;
        } catch {
          // টাইটেল ডিকোড না হলে কাঁচাটাই
        }
        all.push({ title: name, url: `${TREK}/products/${m[2]}`, price: null, oldPrice: null });
      }
    }
    return all;
  },
};

export const stores: Store[] = [
  startech,
  pickaboo,
  sitemapStore({
    id: "shajgoj",
    name: "Shajgoj",
    origin: "https://shop.shajgoj.com",
    sample: "https://shop.shajgoj.com/product/cerave-hydrating-cleanser-for-normal-to-dry-skin",
    sitemap: "https://shop.shajgoj.com/sitemap.xml",
    path: "/product/",
    condition: "official",
  }),
  sitemapStore({
    id: "arogga",
    name: "Arogga",
    origin: "https://www.arogga.com",
    sample: "https://www.arogga.com/product/51397/cerave-hydrating-cleanser-for-normal-to-dry-skin-236ml",
    sitemap: "https://www.arogga.com/sitemap.xml",
    path: "/product/",
    condition: "official",
  }),
  sitemapStore({
    id: "applegadgets",
    name: "Apple Gadgets",
    origin: "https://www.applegadgetsbd.com",
    sample: "https://www.applegadgetsbd.com/product/iphone-18-pro",
    sitemap: "https://www.applegadgetsbd.com/product/sitemap.xml",
    path: "/product/",
    condition: "unofficial",
    variants: appleGadgetsVariants,
  }),
  sitemapStore({
    id: "gadgetandgear",
    name: "Gadget & Gear",
    origin: "https://gadgetandgear.com",
    sample: "https://gadgetandgear.com/product/iphone-18-pro",
    sitemap: "https://gadgetandgear.com/sitemap.xml",
    path: "/product/",
    condition: "official",
    promoUrl: "https://gadgetandgear.com/offers",
    variants: gadgetAndGearVariants,
  }),
  sitemapStore({
    id: "sumashtech",
    name: "Sumash Tech",
    origin: "https://www.sumashtech.com",
    sample: "https://www.sumashtech.com/product/iphone-18-pro",
    sitemap: "https://www.sumashtech.com/__sitemap__/product.xml",
    path: "/product/",
    condition: "unofficial",
    variants: sumashVariants,
  }),
  sitemapStore({
    id: "kry",
    name: "Kry International",
    origin: "https://kryinternational.com",
    sample: "https://kryinternational.com/products/iphone-18-pro",
    sitemap: "https://kryinternational.com/sitemap.xml",
    path: "/products/",
    condition: "unofficial",
    variants: kryVariants,
  }),
  dazzle,
  sitemapStore({
    id: "maczen",
    name: "MacZen BD",
    origin: "https://www.maczenbd.com",
    sample: "https://www.maczenbd.com/products/macbook/15-inch-macbook-air-m5",
    sitemap: "https://www.maczenbd.com/sitemap.xml",
    path: "/products/",
    match: /^\/products\/[^/]+\/[^/]+$/,
    condition: "unofficial",
    variants: maczenVariants,
  }),
  sitemapStore({
    id: "diamu",
    name: "Diamu",
    origin: "https://diamu.com.bd",
    sample: "https://diamu.com.bd/product/iphone-18-pro/",
    sitemap: "https://diamu.com.bd/sitemap_index.xml",
    path: "/product/",
    condition: "unofficial",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "executivemachines",
    name: "Executive Machines",
    origin: "https://executivemachines.com",
    sample: "https://executivemachines.com/product/iphone-18-pro-256-gb/",
    sitemap: "https://executivemachines.com/sitemap_index.xml",
    path: "/product/",
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "motionview",
    name: "Motion View",
    origin: "https://motionview.com.bd",
    sample: "https://motionview.com.bd/product/amazfit-active-2-square-smartwatch-premium-edition",
    sitemap: "https://motionview.com.bd/sitemap.xml",
    path: "/product/",
    condition: "official",
  }),
  sitemapStore({
    id: "gadgetbreeze",
    name: "Gadget Breeze",
    origin: "https://gadgetbreeze.com.bd",
    sample: "https://gadgetbreeze.com.bd/product/xiaomi-redmi-watch-6-active/",
    sitemap: "https://gadgetbreeze.com.bd/sitemap_index.xml",
    path: "/product/",
    condition: "unofficial",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "mcsolution",
    name: "MC Solution",
    origin: "https://mcsolution.com.bd",
    sample: "https://mcsolution.com.bd/vivobook-pro-15-oled-n6506mv/",
    sitemap: "https://mcsolution.com.bd/sitemap_index.xml",
    path: "/", // পণ্যের slug মূল ডোমেনেই — ফিল্টার আসলে sitemap ফাইলই (product-sitemap)
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "istockbd",
    name: "iStockBD",
    origin: "https://istockbd.com",
    sample: "https://istockbd.com/products/new-apple-ipad-pro-2020-11-2020",
    sitemap: "https://istockbd.com/sitemap.xml",
    path: "/products/",
    condition: "unofficial",
  }),
  sitemapStore({
    id: "pcbstore",
    name: "PCB Store",
    origin: "https://pcbstore.com.bd",
    sample: "https://pcbstore.com.bd/product/pcb-blaak-v2-mouse-pad",
    sitemap: "https://pcbstore.com.bd/sitemap.xml",
    path: "/product/",
    condition: "unofficial",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "custommacbd",
    name: "CustomMacBD",
    origin: "https://custommacbd.com",
    sample: "https://custommacbd.com/products/magic-mouse-2",
    sitemap: "https://custommacbd.com/sitemap.xml",
    path: "/products/",
    condition: "unofficial",
  }),
  sitemapStore({
    id: "globalbrand",
    name: "Global Brand",
    origin: "https://www.globalbrand.com.bd",
    sample: "https://www.globalbrand.com.bd/ugreen-x512-55556-20w-usb-c-gan-fast-charger-eu",
    sitemap: "https://www.globalbrand.com.bd/sitemap.xml",
    path: "/",
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "emartway",
    name: "EmartWay Skincare",
    origin: "https://www.emartwayskincare.com.bd",
    sample: "https://www.emartwayskincare.com.bd/cerave-moisturizing-cream-56ml",
    sitemap: "https://www.emartwayskincare.com.bd/sitemap.xml",
    path: "/",
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "koreancare",
    name: "Korean Care BD",
    origin: "https://kcarebd.com",
    sample: "https://kcarebd.com/products/aestura-derma-uv365-barrier-hydro-mineral-sunscreen-20ml/",
    sitemap: "https://kcarebd.com/sitemap.xml",
    path: "/products/",
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "skincareshop",
    name: "Skincare Shop",
    origin: "https://skincareshop.com.bd",
    sample: "https://skincareshop.com.bd/product/the-body-shop-shea-shower-cream-250ml/",
    sitemap: "https://skincareshop.com.bd/sitemap.xml",
    path: "/product/",
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "indianmartbd",
    name: "IndianMartBD",
    origin: "https://indianmartbd.com",
    sample: "https://indianmartbd.com/product/minimalist-vitamin-c-face-serum-bangladesh/",
    sitemap: "https://indianmartbd.com/sitemap.xml",
    path: "/product/",
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "colorworld",
    name: "Color World",
    origin: "https://colorworld.com.bd",
    sample: "https://colorworld.com.bd/product/vaseline-lip-therapy-cocoa-butter-0-25-oz-7g/",
    sitemap: "https://colorworld.com.bd/sitemap.xml",
    path: "/product/",
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "glowella",
    name: "Glowella",
    origin: "https://glowellabd.com",
    sample: "https://glowellabd.com/product/axis-y-new-skin-resolution-gel-mask-100ml/",
    sitemap: "https://glowellabd.com/sitemap.xml",
    path: "/product/",
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "ohsogo",
    name: "OHSOGO",
    origin: "https://www.ohsogo.com",
    sample: "https://www.ohsogo.com/products/luminous-skin-face-serum-30ml-alpha-arbutin",
    sitemap: "https://www.ohsogo.com/sitemap.xml",
    path: "/products/",
    condition: "official",
  }),
  sitemapStore({
    id: "chardike",
    name: "Chardike",
    origin: "https://chardike.com",
    sample: "https://chardike.com/product/laxzin-alpha-arbutin-02-with-hyaluronic-acid-serum-30ml",
    sitemap: "https://chardike.com/sitemap.xml",
    path: "/product/",
    condition: "official",
    variants: chardikeVariants,
  }),
  sitemapStore({
    id: "perfectobd",
    name: "Perfecto",
    origin: "https://perfectobd.com",
    sample: "https://perfectobd.com/product/3w-clinic-fresh-collagen-sheet-mask",
    sitemap: "https://perfectobd.com/sitemap.xml",
    path: "/product/",
    condition: "official",
    variants: perfectoVariants,
  }),
  sitemapStore({
    id: "beprincess",
    name: "Beprincess BD",
    origin: "https://beprincessbd.com",
    sample: "https://beprincessbd.com/product/skino-ultimate-glow-brightening-toner-100ml/",
    sitemap: "https://beprincessbd.com/sitemap_index.xml",
    path: "/product/",
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "koreanmartbd",
    name: "Korean Mart BD",
    origin: "https://koreanmartbd.com",
    sample: "https://koreanmartbd.com/product/aromatica-tea-tree-pore-purifying-gel-cream-5-niacinamide-01-pha-100ml",
    sitemap: "https://koreanmartbd.com/sitemap.xml",
    path: "/product/",
    condition: "official",
  }),
  klassy,
  trekntread,
  sitemapStore({
    id: "selltech",
    name: "Sell Tech",
    origin: "https://www.selltech.com.bd",
    sample: "https://www.selltech.com.bd/",
    sitemap: "https://www.selltech.com.bd/sitemaps/product-sitemap.xml",
    path: "/",
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "liraimport",
    name: "Lira Import",
    origin: "https://liraimportltd.com",
    sample: "https://liraimportltd.com/product/medicube-collagen-night-wrapping-mask-75ml/",
    sitemap: "https://liraimportltd.com/sitemap.xml",
    path: "/product/",
    condition: "official",
    variants: wooVariants,
  }),
  herhappyskin,
];

// তালিকায় না থাকা দোকানের পুরনো দামও বাদ যায় না: JSON-LD/itemprop/og দিয়ে চেষ্টা
function genericStore(url: string): Store {
  const { origin } = new URL(url);
  return { id: site(url), name: site(url), origin, rendered: false, condition: "official", sample: url, promoUrl: null, variants: wooVariants, discover: async () => [] };
}

export function storeFor(url: string): Store {
  return stores.find((store) => site(store.origin) === site(url)) ?? genericStore(url);
}

export function conditionOf(store: Store, text: string): Condition {
  if (/\b(unofficial|intl|international)\b/i.test(text)) return "unofficial";
  if (/\bofficial\b/i.test(text)) return "official";
  return store.condition;
}
