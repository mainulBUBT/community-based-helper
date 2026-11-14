import { NotFound, StoreBlocked } from "../lib/errors";
import { decode, stripTags } from "../lib/html";
import { getJson, getText } from "../lib/http";
import { pace } from "../lib/limiter";
import { toTaka } from "../lib/price";
import { findSitemap, productPaths, sitemapUrls } from "../lib/sitemap";
import { appleGadgetsVariants, aurevaVariants, bartonProduct, chardikeVariants, dazzleVariants, embeddedVariants, gadgetAndGearVariants, hhsVariants, hnstechProduct, hnstechVariants, kryVariants, hkLifestyleVariants, maczenVariants, othobaVariants, pchouseVariants, perfectoVariants, rioVariants, shajgojVariants, shopifyProduct, startechVariants, sumashVariants, themallVariants, wooVariants } from "./parsers";
import { isReplica } from "../../src/utils/categories";
import type { Condition, Listing, Store } from "./types";
export type { Condition, Listing, Store };

const site = (url: string) => new URL(url).host.replace(/^www\./, "");

export function slugTitle(url: string): string {
  const slug = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
  return decodeURIComponent(slug).replace(/[-_]+/g, " ");
}

function slugListing(url: string): Listing {
  return { title: slugTitle(url), url, price: null, oldPrice: null };
}

// sitemap ছাড়া দোকান: প্রতিটা ক্যাটাগরির পাতা একে একে, নতুন পণ্য না এলে থামে
async function categoryListings(
  origin: string,
  paths: string[],
  parse: (html: string) => Listing[],
  { pages = 30, param = "page", fetchPage = getText }: { pages?: number; param?: string; fetchPage?: (url: string) => Promise<string> } = {},
): Promise<Listing[]> {
  const all: Listing[] = [];
  for (const path of paths) {
    for (let page = 1; page <= pages; page++) {
      const items = parse(await fetchPage(`${origin}${path}${page > 1 ? `?${param}=${page}` : ""}`));
      const fresh = items.filter((item) => !all.some((seen) => seen.url === item.url));
      if (fresh.length === 0) break;
      all.push(...fresh);
    }
  }
  return all;
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
  rendered?: boolean;
  variants?: Store["variants"];
  product?: Store["product"];
}): Store {
  const rendered = config.rendered ?? false;
  return {
    ...config,
    promoUrl: config.promoUrl ?? null,
    rendered,
    async discover() {
      const urls = await sitemapUrls(config.sitemap, 0, new Set(), rendered);
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
  "/laptop-notebook",
  "/apple-imac",
  "/apple-mac-mini",
  "/apple-mac-studio",
  "/gadget/smart-watch",
  "/earbuds",
  "/neckband",
  "/accessories/headphone",
  "/power-bank",
  "/monitor",
  "/desktops/brand-pc",
  "/mobile-phone-charger-adapter",
  "/charger-fan",
  "/networking/router",
  "/water-purifier",
  "/trimmer",
  "/component/ram",
  "/component/laptop-ram",
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
  discover: () => categoryListings(STARTECH, STARTECH_CATEGORIES, parseStartechListings),
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

// Othoba (nopCommerce মার্কেটপ্লেস): sitemap ফাঁকা, তাই ক্যাটাগরি পাতা (?pagenumber=) ধরে ঘুরে listing।
// Agora: sitemap নেই, ক্যাটাগরির এক পাতাতেই সব পণ্য, দাম আর স্টক। পণ্যের পাতা নয়, কারণ নামের শুরু এক হলে সেখানে অন্য পণ্য আসে
// (meril-baby?prod_id=… সবই toothpaste)। প্রতি run-এ ক্যাটাগরিগুলো একবার। নতুন ধরনের পণ্য এলে এখানে ক্যাটাগরি যোগ করুন
const AGORA = "https://agorasuperstores.com";
const AGORA_CATEGORIES = ["baby-food", "baby-needs", "personal-care", "beauty-products", "pharmacy", "grocery-essentials", "quick-food", "confectionary", "baking-needs", "fruits"];
const AGORA_CARD = /href="(https:\/\/agorasuperstores\.com\/product-details\/[^"]*prod_id=(\d+))"[\s\S]*?<p class="allProduct-subtext[^"]*"[^>]*>\s*([^<]+?)\s*<\/p>[\s\S]*?data-price="([\d.]+)"[\s\S]*?data-i18n="(add_to_cart|out_of_stock)"/g;

interface AgoraCard extends Listing {
  inStock: boolean;
}

let agoraCards: Promise<Map<string, AgoraCard>> | null = null;

async function loadAgoraCards() {
  const cards = new Map<string, AgoraCard>();
  for (const path of AGORA_CATEGORIES) {
    for (const [, url, id, name, price, stock] of (await getText(`${AGORA}/products/${path}`)).matchAll(AGORA_CARD)) {
      const taka = toTaka(price);
      if (taka) cards.set(id, { title: decode(name), url, price: taka, oldPrice: null, inStock: stock === "add_to_cart" });
    }
  }
  return cards;
}

const agoraCatalog = () => (agoraCards ??= loadAgoraCards());

const agora: Store = {
  id: "agora",
  name: "Agora",
  origin: AGORA,
  rendered: false,
  condition: "official",
  sample: `${AGORA}/products/baby-food`,
  promoUrl: null,
  async product(url) {
    const card = (await agoraCatalog()).get(new URL(url).searchParams.get("prod_id") ?? "");
    if (!card?.price) throw new NotFound(`${url}: Agora-র তালিকায় নেই`);
    return { rows: [{ options: [], region: null, price: card.price, oldPrice: null, inStock: card.inStock }], title: card.title, image: null };
  },
  async discover() {
    return [...(await agoraCatalog()).values()];
  },
};

// Othoba: sitemap ফাঁকা; আগে ক্যাটাগরি পাতা পড়া হতো, কিন্তু সাইটের ক্যাটাগরি পাতা এখন ব্রাউজারেও ফাঁকা
// (পণ্য আসে Typesense সার্চ API দিয়ে: search.othoba.com)। তাই Typesense সার্চ এন্ডপয়েন্ট থেকে পণ্যের তালিকা পড়া হয়।
const OTHOBA = "https://othoba.com";
const OTHOBA_TYPESENSE = "https://search.othoba.com";
const OTHOBA_API_KEY = "ekdHAQFqamb1XVMxKGLouPGTcwT9Wzgz";
const OTHOBA_CATEGORIES = [
  "water-dispensers-purifiers-2",
  "water-purifiers-filters-accessories-5",
  "honey-6",
  "honey-7",
  "nuts-dry-fruits-2",
];

interface OthobaTypesenseResponse {
  hits?: {
    document?: {
      Name?: string;
      SeName?: string;
      Price?: number;
      OldPrice?: number;
    };
  }[];
}

async function discoverOthoba(): Promise<Listing[]> {
  const all = new Map<string, Listing>();
  for (const cat of OTHOBA_CATEGORIES) {
    for (let page = 1; page <= 10; page++) {
      const url = `${OTHOBA_TYPESENSE}/collections/Products/documents/search?q=*&filter_by=CategorySeName:[${cat}]&per_page=150&page=${page}`;
      const data = (await getJson(url, { "x-typesense-api-key": OTHOBA_API_KEY }).catch(() => null)) as OthobaTypesenseResponse | null;
      const hits = data?.hits ?? [];
      if (!hits.length) break;
      for (const h of hits) {
        const doc = h.document;
        if (!doc?.SeName) continue;
        const productUrl = `${OTHOBA}/${doc.SeName}`;
        if (!all.has(productUrl)) {
          all.set(productUrl, {
            title: doc.Name ? decode(doc.Name.trim()) : slugTitle(productUrl),
            url: productUrl,
            price: doc.Price || null,
            oldPrice: doc.OldPrice && doc.Price && doc.OldPrice > doc.Price ? doc.OldPrice : null,
          });
        }
      }
      if (hits.length < 150) break;
    }
  }
  return [...all.values()];
}

const othoba: Store = {
  id: "othoba",
  name: "Othoba",
  origin: OTHOBA,
  rendered: false,
  condition: "official",
  sample: `${OTHOBA}/pureit-marina-rouvmf-6l-water-purifier-7-stage-purification-with-20lhour-high-speed-technology-best-buy-1040783`,
  promoUrl: null,
  variants: othobaVariants,
  discover: discoverOthoba,
};

// PQS: sitemap প্রায় ৬MB, ৬০ সেকেন্ডে নামে না; ক্যাটাগরি পাতায় (?page=N) ৪৮টা করে।
// ফোনের পাতায় দাম নেই ("Call for price"), তাই ফোনের ক্যাটাগরি বাদ
const PQS = "https://www.pqs.com.bd";
const PQS_CATEGORIES = ["/all-laptop", "/brand-pc", "/mini-pc", "/all-in-one-pc", "/monitor", "/router", "/earphone", "/headphone", "/speaker", "/smart-watch", "/power-bank", "/portable-ssd", "/tablet"];

function parsePqsListings(html: string): Listing[] {
  return [...html.matchAll(/<h4 class="name"><a href="([^"]+)">([^<]+)<\/a>/g)].map(([, url, name]) => ({
    title: decode(name.trim()),
    url,
    price: null,
    oldPrice: null,
  }));
}

const pqs: Store = {
  id: "pqs",
  name: "PQS",
  origin: PQS,
  rendered: false,
  condition: "official",
  sample: `${PQS}/tp-link-archer-ax12-ax1500-router`,
  promoUrl: null,
  discover: () => categoryListings(PQS, PQS_CATEGORIES, parsePqsListings),
};

// BabyCare (OpenCart): sitemap-এ শুধু ক্যাটাগরি, পণ্য ক্যাটাগরি পাতায় (?page=N)-তে ২৪টা করে;
// পণ্যের পাতায় JSON-LD নেই, দাম itemprop="price" (ছাড়ের দাম), og এ কাটা (মূল) দাম
const BABYCARE = "https://www.babycare.com.bd";
const BABYCARE_CATEGORIES = ["/diapers", "/wipes", "/bathing", "/baby-shampoo", "/lotions-oils", "/baby-oil", "/baby-powder-baby-cream"];

function parseBabycareListings(html: string): Listing[] {
  return [...html.matchAll(/<div class="product-item"[\s\S]*?itemprop="url" content="([^"]+)"[\s\S]*?itemprop="name"[^>]*>([^<]+)</g)].map(([, url, name]) => ({
    title: decode(name.trim()),
    url,
    price: null,
    oldPrice: null,
  }));
}

const babycare: Store = {
  id: "babycare",
  name: "BabyCare",
  origin: BABYCARE,
  rendered: false,
  condition: "official",
  sample: `${BABYCARE}/huggies-dry-medium-pant-diaper`,
  promoUrl: null,
  discover: () =>
    categoryListings(BABYCARE, BABYCARE_CATEGORIES, parseBabycareListings, { pages: 15, fetchPage: (url) => getText(url).catch(() => "") }),
};

// HNS Tech: sitemap নেই; ক্যাটাগরি পাতায় লিংক থাকে না, সব পণ্য /shop?page=1..N-এ।
// পণ্যের পাতার data-variants JSON-এ সব কনফিগের দাম-স্টক; pre-order পাতার দাম ০ (বুকিং ফি আলাদা), সেগুলো অফার হয় না।
const HNS = "https://www.hnstechbd.com";
const HNS_SHOP_PAGES = 6;

function parseHnsListings(html: string): Listing[] {
  return [...html.matchAll(/href="(?:https:\/\/www\.hnstechbd\.com)?(\/product-details\/([a-z0-9-]+)\/\d+)"/g)].map(([, path, slug]) => ({
    title: decodeURIComponent(slug).replace(/[-_]+/g, " "),
    url: `${HNS}${path}`,
    price: null,
    oldPrice: null,
  }));
}

const hnstech: Store = {
  id: "hnstech",
  name: "HNS Tech",
  origin: HNS,
  rendered: false,
  condition: "unofficial",
  sample: `${HNS}/product-details/macbook-neo-13singaporeusa/87`,
  promoUrl: null,
  product: hnstechProduct,
  variants: hnstechVariants,
  async discover() {
    const all: Listing[] = [];
    for (let page = 1; page <= HNS_SHOP_PAGES; page++) {
      const html = await getText(`${HNS}/shop?page=${page}`).catch(() => "");
      for (const item of parseHnsListings(html)) {
        if (!all.some((seen) => seen.url === item.url)) all.push(item);
      }
    }
    return all;
  },
};

export const stores: Store[] = [
  startech,
  sitemapStore({
    id: "shajgoj",
    name: "Shajgoj",
    origin: "https://shop.shajgoj.com",
    sample: "https://shop.shajgoj.com/product/cerave-hydrating-cleanser-for-normal-to-dry-skin",
    sitemap: "https://shop.shajgoj.com/sitemap.xml",
    path: "/product/",
    condition: "official",
    variants: shajgojVariants,
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
  // খেজুর, মধু: Next.js, প্রতিটা ওজনের দাম আর স্টক পাতার ভেতরের JSON-এ (JSON-LD-এ শুধু প্রথম ওজন)
  sitemapStore({
    id: "haramain",
    name: "Haramain Store",
    origin: "https://haramainstore.com",
    sample: "https://haramainstore.com/products/ajwa-super-premium-dates",
    sitemap: "https://haramainstore.com/sitemap.xml",
    path: "/products/",
    condition: "official",
    variants: embeddedVariants,
  }),
  sitemapStore({
    id: "khaasfood",
    name: "Khaas Food",
    origin: "https://www.khaasfood.com",
    sample: "https://www.khaasfood.com/product/ajwa-dates",
    sitemap: "https://www.khaasfood.com/sitemap.xml",
    path: "/product/",
    condition: "official",
    variants: embeddedVariants,
  }),
  sitemapStore({
    id: "holybasket",
    name: "Holy Basket",
    origin: "https://holybasketbd.com",
    sample: "https://holybasketbd.com/product/ajwa-dates-500gm",
    sitemap: "https://holybasketbd.com/sitemap.xml",
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
    id: "gadgetbd",
    name: "Gadget BD",
    origin: "https://gadgetbd.com",
    sample: "https://gadgetbd.com/product/iphone-17-pro-price-in-bangladesh/",
    sitemap: "https://gadgetbd.com/sitemap_index.xml",
    path: "/product/",
    condition: "unofficial",
    variants: wooVariants,
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
    id: "ucc",
    name: "UCC",
    origin: "https://www.ucc.com.bd",
    sample: "https://www.ucc.com.bd/transcend-1tb-esd310c-type-c-portable-ssd-black",
    sitemap: "https://www.ucc.com.bd/sitemaps/product-sitemap.xml",
    path: "/", // পণ্যের slug মূল ডোমেনেই — ফিল্টার আসলে sitemap ফাইলই (product-sitemap)
    condition: "official",
  }),
  sitemapStore({
    id: "skyland",
    name: "Skyland",
    origin: "https://www.skyland.com.bd",
    sample: "https://www.skyland.com.bd/jbl-clip-5-portable-bluetooth-speaker",
    sitemap: "https://www.skyland.com.bd/sitemap.xml",
    path: "/", // sitemap এ পণ্যের slug ই সব, ক্যাটাগরির আলাদা পাতা নেই
    condition: "official",
  }),
  sitemapStore({
    id: "istockbd",
    name: "iStockBD",
    origin: "https://istockbd.com",
    sample: "https://istockbd.com/products/new-apple-ipad-pro-2020-11-2020",
    sitemap: "https://istockbd.com/sitemap.xml",
    path: "/products/",
    condition: "unofficial",
    product: shopifyProduct,
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
    product: shopifyProduct,
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
    product: shopifyProduct,
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
  // Aureva: স্কিনকেয়ার (মিরপুর); Next.js — JSON-LD নেই, দাম __NEXT_DATA__ এর props.pageProps.product এ
  sitemapStore({
    id: "aureva",
    name: "Aureva",
    origin: "https://aurevashopbd.com",
    sample: "https://aurevashopbd.com/products/preview/cosrx-advanced-snail-96-mucin-power-essence-100ml",
    sitemap: "https://aurevashopbd.com/sitemap.xml",
    path: "/products/preview/",
    condition: "official",
    variants: aurevaVariants,
  }),
  // Korean Skincare BD: WooCommerce; দাম পাতার Product JSON-LD Offer এ (regular দাম del এ), wooVariants লাগে না
  sitemapStore({
    id: "koreanskincarebd",
    name: "Korean Skincare BD",
    origin: "https://koreanskincarebd.com",
    sample: "https://koreanskincarebd.com/product/cosrx-advanced-snail-96-mucin-power-essence-100ml/",
    sitemap: "https://koreanskincarebd.com/sitemap_index.xml",
    path: "/product/",
    condition: "official",
  }),
  klassy,
  // ল্যাপটপ: WooCommerce; বেশিরভাগ মডেল কোড বিদেশি বাজারের (fb3231nw, es1013dx), ওয়ারেন্টি দোকানের — তাই আনঅফিসিয়াল
  sitemapStore({
    id: "techmarvels",
    name: "Tech Marvels",
    origin: "https://techmarvels.com.bd",
    sample: "https://techmarvels.com.bd/product/lenovo-thinkpad-e14-gen7-core-ultra-7-255h-business-laptop/",
    sitemap: "https://techmarvels.com.bd/sitemap_index.xml",
    path: "/product/",
    condition: "unofficial",
    variants: wooVariants,
  }),
  // Trek N Tread: ২৯ অক্টোবর ২০২৬-এ সাইট নতুন করে বানানো; এখন sitemap আর JSON-LD আছে, লিংক থেকে সংখ্যার prefix বাদ
  sitemapStore({
    id: "trekntread",
    name: "Trek N Tread",
    origin: "https://trekntread.com",
    sample: "https://trekntread.com/products/adizero-adios-pro-evo-1-light-blue-grade-11",
    sitemap: "https://trekntread.com/sitemap.xml",
    path: "/products/",
    condition: "replica",
  }),
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
    rendered: true,
  }),
  sitemapStore({
    id: "banglashoppers",
    name: "BanglaShoppers",
    origin: "https://www.banglashoppers.com",
    sample: "https://www.banglashoppers.com/simple-refreshing-facial-wash-gel-150ml.html",
    sitemap: "https://www.banglashoppers.com/sitemap.xml",
    path: "/",
    match: /\.html$/,
    condition: "official",
    rendered: true,
  }),
  herhappyskin,
  othoba,
  pqs,
  agora,
  sitemapStore({
    id: "beautybooth",
    name: "Beauty Booth",
    origin: "https://beautybooth.com.bd",
    sample: "https://beautybooth.com.bd/product/essence-lash-princess-false-lash-effect-mascara-12ml",
    sitemap: "https://beautybooth.com.bd/sitemap/products.xml",
    path: "/product/",
    condition: "official",
  }),
  sitemapStore({
    id: "alzak",
    name: "ALZAK",
    origin: "https://alzakbd.com",
    sample: "https://alzakbd.com/product/essence-lash-princess-false-lash-mascara/",
    sitemap: "https://alzakbd.com/sitemap_index.xml",
    path: "/product/",
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "bdamajan",
    name: "BD Amajan Shop",
    origin: "https://bdamajanshop.com",
    sample: "https://bdamajanshop.com/product/essence-lash-princess-false-lash-effect-mascara/",
    sitemap: "https://bdamajanshop.com/sitemap_index.xml",
    path: "/product/",
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "ukdirect",
    name: "UK Direct BD",
    origin: "https://ukdirectbd.com",
    sample: "https://ukdirectbd.com/product/maybelline-colossal-kohl-kajal-24h-black-bold-smudge-resistant-eyeliner/",
    sitemap: "https://ukdirectbd.com/sitemap_index.xml",
    path: "/product/",
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "skinrevive",
    name: "Skin Revive BD",
    origin: "https://skinrevivebd.com",
    sample: "https://skinrevivebd.com/product/maybelline-colossal-kohl-kajal-24h-black/",
    sitemap: "https://skinrevivebd.com/sitemap_index.xml",
    path: "/product/",
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "efamas",
    name: "eFamas",
    origin: "https://www.efamas.com.bd",
    sample: "https://www.efamas.com.bd/shop/diaper-potty/savlon-twinkle/savlon-twinkle-pant-system-baby-diaper-size-xl-12-20kg-44pcs/",
    sitemap: "https://www.efamas.com.bd/product-sitemap.xml",
    path: "/shop/",
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "mke",
    name: "MK Electronics",
    origin: "https://mke.com.bd",
    sample: "https://mke.com.bd/kent-grand-star-ro-water-purifier",
    sitemap: "https://mke.com.bd/sitemap-products.xml",
    path: "/",
    condition: "official",
  }),
  // Shaver Shop: WooCommerce গ্রুমিং স্পেশালিস্ট (HTC, Kemei, VGR, Philips, Oraimo, Enchen)
  sitemapStore({
    id: "shavershop",
    name: "Shaver Shop",
    origin: "https://shavershop.com.bd",
    sample: "https://shavershop.com.bd/item/kemei-km-5017-hair-clipper-beard-trimmer/",
    sitemap: "https://shavershop.com.bd/sitemaps.xml",
    path: "/item/",
    condition: "unofficial",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "trimmershopbd",
    name: "Trimmer Shop BD",
    origin: "https://trimmershopbd.com.bd",
    sample: "https://trimmershopbd.com.bd/product/philips-bt1230-18-beard-trimmer/",
    sitemap: "https://trimmershopbd.com.bd/sitemap_index.xml",
    path: "/product/",
    condition: "unofficial",
    variants: wooVariants,
  }),
  // Salextra: বড় মাল্টিব্র্যান্ড রিটেইলার; sitemap ফ্ল্যাট, দাম পাতার JSON-LD-এ (ভার্সনের parser নেই)
  sitemapStore({
    id: "salextra",
    name: "Salextra",
    origin: "https://www.salextra.com.bd",
    sample: "https://www.salextra.com.bd/product/kemei-km-5017-electric-hair-clipper-trimmer-rechargeable-ergonomically-shaver-razor-cordless-adjustable-clipper-for-child-pet",
    sitemap: "https://www.salextra.com.bd/sitemap.xml",
    path: "/product/",
    condition: "unofficial",
  }),
  // পণ্যের পাতা সাইটের গোড়ায় (/<slug>), ক্যাটাগরিও একই রকম; শিরোনাম মিলিয়েই বাছা হয়, দাম JSON-LD-এ
  sitemapStore({
    id: "genten",
    name: "Genten",
    origin: "https://genten.com.bd",
    sample: "https://genten.com.bd/jbl-tune-500-wired-on-ear-headphone",
    sitemap: "https://www.genten.com.bd/sitemap.xml",
    path: "/",
    match: /^\/[^/]+$/,
    condition: "official",
  }),
  sitemapStore({
    id: "binarylogic",
    name: "Binary Logic",
    origin: "https://www.binarylogic.com.bd",
    sample: "https://www.binarylogic.com.bd/hp-250r-g10-intel-core-3-100u-business-laptop-pc",
    sitemap: "https://www.binarylogic.com.bd/sitemap.xml",
    path: "/",
    match: /^\/[^/]+$/,
    condition: "official",
  }),
  sitemapStore({
    id: "cosmeticscorner",
    name: "Cosmetics Corner",
    origin: "https://www.cosmeticscorner.com.bd",
    sample: "https://www.cosmeticscorner.com.bd/johnsons-baby-shampoo-200ml/",
    sitemap: "https://www.cosmeticscorner.com.bd/sitemap_index.xml",
    path: "/",
    match: /^\/[^/]+\/$/,
    condition: "official",
  }),
  sitemapStore({
    id: "arafatelecom",
    name: "Arafa Telecom",
    origin: "https://arafatelecom.com",
    sample: "https://arafatelecom.com/product/motorola-edge-70-pro/",
    sitemap: "https://arafatelecom.com/sitemap_index.xml",
    path: "/product/",
    condition: "unofficial",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "mobilebuzz",
    name: "Mobile Buzz BD",
    origin: "https://mobilebuzzbd.com",
    sample: "https://mobilebuzzbd.com/product/motorola-edge-70-pro/",
    sitemap: "https://mobilebuzzbd.com/sitemap_index.xml",
    path: "/product/",
    condition: "unofficial",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "sheitech",
    name: "Shei Tech",
    origin: "https://sheitech.com.bd",
    sample: "https://sheitech.com.bd/product/zeblaze-btalk-4-pro-smart-watch/",
    sitemap: "https://sheitech.com.bd/sitemap_index.xml",
    path: "/product/",
    condition: "unofficial",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "hashh",
    name: "Hashh Sneaker",
    origin: "https://hashh.store",
    sample: "https://hashh.store/product/adidas-campus-ash-white/",
    sitemap: "https://hashh.store/sitemap_index.xml",
    path: "/product/",
    condition: "replica",
    variants: wooVariants,
  }),
  // কপি জুতার দোকান (৮ নভেম্বর যোগ): Dhaka Step নিজেকে "authentic" বলে, কিন্তু Adios Pro 4 ~৳৫,০০০ (আসলের দামের ধারেকাছে নয়);
  // Barton "imported/premium"; HK Lifestyle পাতায় "OEM"। শিরোনামে 1:1/Premium থাকলে conditionOf প্রিমিয়াম কপি ধরে
  sitemapStore({
    id: "dhakastep",
    name: "Dhaka Step",
    origin: "https://www.dhakastep.com",
    sample: "https://www.dhakastep.com/product/adidas-adizero-adios-pro-4-bluewhitelime-burst",
    sitemap: "https://www.dhakastep.com/sitemap.xml",
    path: "/product/",
    condition: "replica",
  }),
  // Barton: নিজেদের পোশাকের দোকান, জুতাও বেচে; পণ্যের পাতা /details/, দাম og মেটায় (শিরোনাম-ছবি সাইটজুড়ে একই, তাই bartonProduct)
  sitemapStore({
    id: "barton",
    name: "Barton",
    origin: "https://bartonbangladesh.com",
    sample: "https://bartonbangladesh.com/details/adidas-adizero-adios-pro-4-running-shoe",
    sitemap: "https://bartonbangladesh.com/api/sitemap.xml",
    path: "/details/",
    condition: "replica",
    product: bartonProduct,
  }),
  sitemapStore({
    id: "hklifestyle",
    name: "HK Lifestyle",
    origin: "https://hklifestyle.com.bd",
    sample: "https://hklifestyle.com.bd/product/adidas-adizero-adios-pro-4-ekiden-pack",
    sitemap: "https://hklifestyle.com.bd/sitemap.xml",
    path: "/product/",
    condition: "replica",
    variants: hkLifestyleVariants,
  }),
  // আগে শুধু হাতে বসানো দাম ছিল (দাম genericStore দিয়ে হালনাগাদ হতো, নতুন পণ্য খোঁজা হতো না); ৮ নভেম্বর discover এ যোগ
  sitemapStore({
    id: "threes",
    name: "Three's",
    origin: "https://threesbd.com",
    sample: "https://threesbd.com/product/nike-air-max-dawn-retro/",
    sitemap: "https://threesbd.com/sitemap_index.xml",
    path: "/product/",
    condition: "replica",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "dob",
    name: "DOB Skateshop",
    origin: "https://dob.com.bd",
    sample: "https://dob.com.bd/product/converse-chuck-70-low-top-off-white/",
    sitemap: "https://dob.com.bd/sitemap.xml",
    path: "/product/",
    condition: "replica",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "sneakersbd",
    name: "SneakersBD Official",
    origin: "https://www.sneakersbdofficial.com",
    sample: "https://www.sneakersbdofficial.com/product/show/jordan-4-retro-military-black-oem-white-black-1228",
    sitemap: "https://www.sneakersbdofficial.com/sitemap.xml",
    path: "/product/show/",
    condition: "replica",
  }),
  // Shopify-র ঘণ্টার সীমা কড়া (একটানা পড়লে 429), তাই নিচের pace এ মিনিটে একটা অনুরোধ
  sitemapStore({
    id: "ragen",
    name: "Ragen",
    origin: "https://ragenbd.com",
    sample: "https://ragenbd.com/products/converse-chuck-70-canvas-garnet",
    sitemap: "https://ragenbd.com/sitemap.xml",
    path: "/products/",
    condition: "replica",
    product: shopifyProduct,
  }),
  sitemapStore({
    id: "sneakerzone",
    name: "Sneaker Zone",
    origin: "https://sneakerzonebd.com",
    sample: "https://sneakerzonebd.com/products/converse-chuck-70-high-top-black",
    sitemap: "https://sneakerzonebd.com/sitemap.xml",
    path: "/products/",
    condition: "replica",
    product: shopifyProduct,
  }),
  sitemapStore({
    id: "splayd",
    name: "Splayd",
    origin: "https://splayd.com.bd",
    sample: "https://splayd.com.bd/products/adizero-adios-pro-4-off-white-scarlet",
    sitemap: "https://splayd.com.bd/sitemap.xml",
    path: "/products/",
    condition: "replica",
    product: shopifyProduct,
  }),
  babycare,
  sitemapStore({
    id: "dolbear",
    name: "Dolbear",
    origin: "https://dolbear.com.bd",
    sample: "https://dolbear.com.bd/products/anker-zolo-20w",
    sitemap: "https://dolbear.com.bd/sitemap.xml",
    path: "/products/",
    condition: "unofficial",
  }),
  hnstech,
  sitemapStore({
    id: "vertech",
    name: "Vertech",
    origin: "https://www.vertech.com.bd",
    sample: "https://www.vertech.com.bd/products/macbook-neo-32",
    sitemap: "https://www.vertech.com.bd/sitemap.xml",
    path: "/products/",
    condition: "official",
  }),
  sitemapStore({
    id: "riointernational",
    name: "Rio International",
    origin: "https://riointernational.com.bd",
    sample: "https://riointernational.com.bd/product/qcy-pb20a-45w-powerbank",
    sitemap: "https://riointernational.com.bd/sitemap.xml",
    path: "/product/",
    variants: rioVariants,
    condition: "official",
  }),
  sitemapStore({
    id: "nexttech",
    name: "Next Tech BD",
    origin: "https://nexttech.com.bd",
    sample: "https://nexttech.com.bd/product/mac-mini-m4-16-256gb-2024/",
    sitemap: "https://nexttech.com.bd/product-sitemap.xml",
    path: "/product/",
    variants: wooVariants,
    condition: "official",
  }),
  sitemapStore({
    id: "themallbd",
    name: "The Mall BD",
    origin: "https://themallbd.com",
    sample: "https://themallbd.com/product/ponds-hydra-miracle-hyaluronic-super-light-gel-moisturiser-49g",
    sitemap: "https://themallbd.com/sitemap.xml",
    path: "/product/",
    variants: themallVariants,
    condition: "official",
  }),
  sitemapStore({
    id: "computervillage",
    name: "Computer Village",
    origin: "https://www.computervillage.com.bd",
    sample: "https://www.computervillage.com.bd/hp-15-fd0892tu-laptop",
    sitemap: "https://www.computervillage.com.bd/sitemaps/product-sitemap.xml",
    path: "/",
    condition: "official",
  }),
  sitemapStore({
    id: "bytebliss",
    name: "ByteBliss",
    origin: "https://bytebliss.com.bd",
    sample: "https://bytebliss.com.bd/apple-macbook-air-m5-13-inch",
    sitemap: "https://bytebliss.com.bd/sitemap.xml",
    path: "/",
    condition: "unofficial",
  }),
  sitemapStore({
    id: "pchouse",
    name: "PC House",
    origin: "https://www.pchouse.com.bd",
    sample: "https://www.pchouse.com.bd/amd-ryzen-5-2400g-desktop-processor",
    sitemap: "https://www.pchouse.com.bd/sitemap.xml",
    path: "/",
    condition: "official",
    variants: pchouseVariants,
  }),
  sitemapStore({
    id: "umrelo",
    name: "Umrelo",
    origin: "https://umrelo.com.bd",
    sample: "https://umrelo.com.bd/product/tp-link-deco-x20-ax1800-whole-home-mesh-wi-fi-6-system/",
    sitemap: "https://umrelo.com.bd/sitemap_index.xml",
    path: "/product/",
    condition: "official",
    variants: wooVariants,
  }),
  sitemapStore({
    id: "electronicsbangladesh",
    name: "Electronics Bangladesh",
    origin: "https://electronicsbangladesh.com",
    sample: "https://electronicsbangladesh.com/product/samsung-galaxy-a56-5g",
    sitemap: "https://electronicsbangladesh.com/sitemap.xml",
    path: "/product/",
    condition: "official",
  }),
  sitemapStore({
    id: "smartdeal",
    name: "Smart Deal",
    origin: "https://smartdeal.com.bd",
    sample: "https://smartdeal.com.bd/product/jbl-clip-4-white-portable-bluetooth-speaker",
    sitemap: "https://smartdeal.com.bd/sitemap.xml",
    path: "/product/",
    condition: "official",
  }),
  sitemapStore({
    id: "computervision",
    name: "Computer Vision",
    origin: "https://computervision.com.bd",
    sample: "https://computervision.com.bd/tp-link-archer-ax12-ax1500-wifi-router",
    sitemap: "https://computervision.com.bd/sitemap.xml",
    path: "/",
    condition: "official",
  }),
  sitemapStore({
    id: "onix",
    name: "Onix Computer",
    origin: "https://www.onixbd.com",
    sample: "https://www.onixbd.com/kingston-sxs2000-1tb-portable-ssd",
    sitemap: "https://www.onixbd.com/sitemap.xml",
    path: "/",
    condition: "official",
  }),
];

// ঘণ্টার সীমা কড়া দোকান: মিনিটে একটা অনুরোধেও এক রানে সীমা শেষ হয়ে যায়, তাই পড়া ঘণ্টা জুড়ে ছড়ানো
for (const host of ["ohsogo.com", "istockbd.com", "custommacbd.com", "sneakerzonebd.com", "splayd.com.bd", "ragenbd.com"]) pace(host, 60_000);

// Computer Village: Cloudflare 503 চ্যালেঞ্জ এড়াতে ৪ সেকেন্ড বিরতি
pace("computervillage.com.bd", 4000);

// তালিকায় না থাকা দোকান (অ্যাডমিনে শুধু ওয়েবসাইট দিয়ে যোগ করা): দাম Shopify/Woo/JSON-LD দিয়ে, পণ্যের তালিকা নিজে খোঁজা sitemap থেকে
export function genericStore(url: string, name = site(url)): Store {
  const { origin } = new URL(url);
  return {
    id: site(url),
    name,
    origin,
    rendered: false,
    condition: "official",
    sample: url,
    promoUrl: null,
    variants: wooVariants,
    product: shopifyProduct,
    async discover() {
      const map = await findSitemap(origin);
      const path = map && productPaths(map.urls, origin)[0]?.path;
      if (!map || !path) throw new StoreBlocked(site(url), "sitemap পাওয়া যায়নি, workers/stores/index.ts-এ কনফিগ লাগবে");
      return map.urls.flatMap((u) => {
        const { pathname } = new URL(u);
        return site(u) === site(origin) && pathname.startsWith(path) && pathname !== path ? [slugListing(`${origin}${pathname}`)] : [];
      });
    },
  };
}

export function storeFor(url: string): Store {
  return stores.find((store) => site(store.origin) === site(url)) ?? genericStore(url);
}

export function conditionOf(store: Store, text: string): Condition {
  // কপি জুতার দোকান: শিরোনামে নিজেরাই 1:1 বা Premium লিখলে প্রিমিয়াম কপি, নয়তো সাধারণ কপি
  if (isReplica(store.condition)) return /1:1|\(1\.1\)|premium/i.test(text) ? "replica_premium" : "replica";
  if (/\b(unofficial|intl|international)\b/i.test(text)) return "unofficial";
  if (/\bofficial\b/i.test(text)) return "official";
  return store.condition;
}
