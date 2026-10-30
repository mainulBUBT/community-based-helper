import { StoreBlocked } from "../lib/errors";
import { decode, stripTags } from "../lib/html";
import { getJson, postForm } from "../lib/http";
import { groupBy } from "../lib/pool";
import { tokens } from "../lib/match";
import { structuredQuote, toTaka } from "../lib/price";
import type { ShopProduct, ShopVariant } from "./types";

type Json = Record<string, unknown>;

const COLOR = /colou?r/i;
const REGION = /region|country/i;
const MAX_COMBOS = 12;

const isObject = (value: unknown): value is Json => Boolean(value) && typeof value === "object" && !Array.isArray(value);

// Next.js RSC আর অন্যান্য স্ক্রিপ্টে JSON এস্কেপ করা থাকে
const unescaped = (html: string) => html.replace(/\\(["\\])/g, "$1");

function parse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function jsonAt(text: string, start: number): unknown {
  let depth = 0;
  let quoted = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === "\\") i++;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === "{" || c === "[") depth++;
    else if ((c === "}" || c === "]") && --depth === 0) return parse(text.slice(start, i + 1));
  }
  return null;
}

function objectsAt(html: string, marker: RegExp): Json[] {
  const text = unescaped(html);
  const seen = new Map<unknown, Json>();
  for (const match of text.matchAll(marker)) {
    const found = jsonAt(text, match.index);
    if (isObject(found) && !seen.has(found.id)) seen.set(found.id, found);
  }
  return [...seen.values()];
}

// পাশের "সম্পর্কিত পণ্য" বাদ: যে পণ্যের ভার্সনে পাতার মূল দাম আছে সেটাই, না পেলে প্রথমটা
function mainProduct(rows: Json[], productOf: (row: Json) => unknown, priceOf: (row: Json) => number | null, html: string): Json[] {
  const groups = [...groupBy(rows, (row) => String(productOf(row))).values()];
  const shown = structuredQuote(html)?.price;
  return groups.find((group) => group.some((row) => priceOf(row) === shown)) ?? groups[0] ?? [];
}

function variant(attributes: [unknown, unknown][], price: unknown, oldPrice: unknown, inStock: boolean | null): ShopVariant[] {
  const amount = toTaka(price);
  if (!amount) return [];
  const old = toTaka(oldPrice);
  const pairs = attributes.map(([name, value]) => [String(name ?? ""), String(value ?? "").trim()] as const).filter(([, value]) => value);
  return [
    {
      options: pairs.filter(([name]) => !COLOR.test(name) && !REGION.test(name)).map(([, value]) => value),
      region: pairs.find(([name]) => REGION.test(name))?.[1] ?? null,
      price: amount,
      oldPrice: old && old > amount ? old : null,
      inStock,
    },
  ];
}

// WooCommerce এর এক-দামের পণ্যে JSON-LD থাকে না, দাম শুধু <p class="price"> এ
function wooSimple(html: string): ShopVariant[] {
  const block = /<p class="price">([\s\S]*?)<\/p>/.exec(html)?.[1];
  if (!block || !/product-type-simple/.test(html)) return [];
  const current = /<ins[^>]*>([\s\S]*?)<\/ins>/.exec(block)?.[1] ?? block;
  const old = /<del[^>]*>([\s\S]*?)<\/del>/.exec(block)?.[1];
  const classes = /id="product-\d+"[^>]*class="([^"]*)"/.exec(html)?.[1] ?? "";
  const inStock = /\boutofstock\b/.test(classes) ? false : /\binstock\b/.test(classes) ? true : null;
  return variant([], stripTags(current), old ? stripTags(old) : null, inStock);
}

export function wooVariants(html: string): ShopVariant[] {
  const raw = /data-product_variations="([^"]*)"/.exec(html)?.[1];
  const list = raw ? parse(decode(raw)) : null;
  if (!Array.isArray(list)) return wooSimple(html);
  return list.filter(isObject).flatMap((v) => {
    if (v.variation_is_active === false) return [];
    // "12-256-gb" স্লাগ আসলে RAM/স্টোরেজ ("12/256GB"); শুধু ফাঁকা দিলে 12 কে আর RAM চেনা যায় না
    const attributes = Object.entries(isObject(v.attributes) ? v.attributes : {}).map(
      ([key, value]) => [key.replace(/^attribute_(pa_)?/, ""), String(value).replace(/^(\d+)-(\d+)-?(gb|tb)$/i, "$1/$2$3").replace(/-/g, " ")] as [string, string],
    );
    return variant(attributes, v.display_price, v.display_regular_price, typeof v.is_in_stock === "boolean" ? v.is_in_stock : null);
  });
}

export function dazzleVariants(html: string): ShopVariant[] {
  const text = unescaped(html);
  const at = text.indexOf('"initialVariants"');
  const list = at < 0 ? null : jsonAt(text, text.indexOf("[", text.indexOf('"data":', at)));
  if (!Array.isArray(list)) return [];
  const rows = list.filter(isObject);
  const named = (group: RegExp) => [...new Set(rows.filter((v) => group.test(String(v.attributeGroup))).map((v) => String(v.attribute)))].sort((a, b) => b.length - a.length);
  const colors = named(COLOR);
  const regions = named(REGION);
  return rows.flatMap((v) => {
    let name = String(v.variantName ?? "");
    const region = regions.find((r) => name.includes(r)) ?? null;
    for (const word of [...colors, ...(region ? [region] : [])]) name = name.replace(word, " ");
    return variant([["", name], ["region", region]], v.retailUnitSale, v.mrpUnitSale, typeof v.isActive === "boolean" ? v.isActive : null);
  });
}

export function kryVariants(html: string): ShopVariant[] {
  const rows = objectsAt(html, /\{"id":\d+,"productId":\d+,"isDeleted":/g).filter((v) => v.isDeleted === false);
  const current = (v: Json) => toTaka(v.discountPrice) || toTaka(v.price);
  return mainProduct(rows, (v) => v.productId, current, html).flatMap((v) => {
    const ram = v.ram && /^\d+$/.test(String(v.ram)) ? `${v.ram}GB` : v.ram;
    const colors = Array.isArray(v.ProductColor) ? v.ProductColor.filter(isObject) : [];
    const inStock = colors.length ? colors.some((c) => c.inStock === true) : null;
    const attributes: [unknown, unknown][] = [["ram", ram], ["storage", v.rom], ["size", v.size], ["connectivity", v.connectivity], ["chipset", v.chipset], ["region", v.region]];
    return variant(attributes, current(v), v.price, inStock);
  });
}

// MacZen BD (Next.js RSC): দাম তিন জায়গায় — iPhone এ combinationPrices [{sim, storage, price}], Mac এ
// specPriceMap {"প্রসেসর||স্টোরেজ": [{country, priceDelta, priceType}]}, নয়তো পণ্যের একটাই "price"।
// CALL_FOR_PRICE বাদ; eSIM-only ভার্সন মানে USA।
export function maczenVariants(html: string): ShopVariant[] {
  const text = unescaped(html);
  const at = (key: string): unknown => {
    const i = text.indexOf(`"${key}":`);
    const start = i + key.length + 3;
    return i >= 0 && (text[start] === "{" || text[start] === "[") ? jsonAt(text, start) : null;
  };
  const inStock = text.includes("schema.org/InStock") ? true : null;
  const priced = (row: Json, price: unknown, attributes: [unknown, unknown][]) =>
    row.priceType === "CALL_FOR_PRICE" ? [] : variant(attributes, price, null, row.priceType === "PRE_ORDER" ? null : inStock);

  const combos = at("combinationPrices");
  if (Array.isArray(combos) && combos.length) {
    return combos.filter(isObject).flatMap((row) => {
      const region = row.country ?? (row.sim === "eSim" ? "USA" : null);
      return priced(row, row.price, [["ram", row.ram], ["storage", row.storage], ["size", row.size], ["region", region]]);
    });
  }
  const spec = at("specPriceMap");
  if (isObject(spec) && Object.keys(spec).length) {
    return Object.entries(spec).flatMap(([key, rows]) => {
      const options: [unknown, unknown][] = key.split("||").map((part, i) => [i === 0 ? "processor" : "storage", part]);
      return (Array.isArray(rows) ? rows.filter(isObject) : []).flatMap((row) => priced(row, row.priceDelta, [...options, ["region", row.country]]));
    });
  }
  const base = /"price":(\d+),"optionGroups"/.exec(text)?.[1];
  return base ? variant([], base, null, inStock) : [];
}

export function appleGadgetsVariants(html: string): ShopVariant[] {
  const price = (v: Json) => (Array.isArray(v.prices) && isObject(v.prices[0]) ? v.prices[0] : null);
  const rows = objectsAt(html, /\{"id":\d+,"product_id":\d+,"attribute_data":/g).filter((v) => price(v) && Array.isArray(v.values));
  const amount = (v: Json, key: string) => {
    const field = price(v)?.[key];
    return isObject(field) ? field.value : null;
  };
  return mainProduct(rows, (v) => v.product_id, (v) => toTaka(amount(v, "price")), html).flatMap((v) => {
    const attributes = (v.values as unknown[]).filter(isObject).map((value) => {
      const option = isObject(value.option) && isObject(value.option.name) ? value.option.name.en : "";
      return [option, isObject(value.name) ? value.name.en : ""] as [unknown, unknown];
    });
    const status = String(v.status ?? "");
    return variant(attributes, amount(v, "price"), amount(v, "compare_price"), /in-stock|pre/i.test(status) ? true : /out/i.test(status) ? false : null);
  });
}

export function gadgetAndGearVariants(html: string): ShopVariant[] {
  const rows = objectsAt(html, /\{"id":\d+,"productId":\d+,"images":/g).filter((v) => v.status === "active" && Array.isArray(v.attributes));
  const current = (v: Json) => toTaka(v.effectivePrice) || toTaka(v.discountedPrice) || toTaka(v.price);
  return mainProduct(rows, (v) => v.productId, current, html).flatMap((v) => {
    const attributes = (v.attributes as unknown[]).filter(isObject).map((a) => [a.key, a.value] as [unknown, unknown]);
    const inStock = v.stockOut === true ? false : /in stock/i.test(String(v.stockStatus)) ? true : null;
    return variant(attributes, current(v), v.price, inStock);
  });
}

// Nuxt payload: প্রতিটা মান অ্যারের একটা index, Reactive/Ref মোড়ক খুলে পড়তে হয়
function hydrate(data: unknown[], index: unknown, depth = 0): unknown {
  if (typeof index !== "number" || index < 0 || depth > 12) return null;
  const value = data[index];
  if (Array.isArray(value)) {
    if (typeof value[0] === "string") return /^(Shallow)?(Reactive|Ref)$/.test(value[0]) ? hydrate(data, value[1], depth + 1) : null;
    return value.map((i) => hydrate(data, i, depth + 1));
  }
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key, i]) => [key, hydrate(data, i, depth + 1)]));
  return value;
}

export function sumashVariants(html: string): ShopVariant[] {
  const raw = /<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1];
  const data = raw ? parse(raw) : null;
  if (!Array.isArray(data)) return [];
  const product = data.find((v) => isObject(v) && "variant_options" in v && "variants" in v) as Json | undefined;
  if (!product) return [];
  const names = new Map<unknown, [string, string]>();
  for (const group of ([] as unknown[]).concat(hydrate(data, product.variant_options) ?? []).filter(isObject)) {
    for (const option of ([] as unknown[]).concat(group.value ?? []).filter(isObject)) {
      names.set(option.id, [String(group.name), String(option.value).replace(/_[0-9a-f]{6}$/i, "")]);
    }
  }
  return ([] as unknown[]).concat(hydrate(data, product.variants) ?? []).filter(isObject).flatMap((v) => {
    if (v.status !== 1) return [];
    const ids = Array.isArray(v.option_value_id_list) ? v.option_value_id_list : [];
    const attributes = ids.flatMap((id) => (names.has(id) ? [names.get(id)!] : []));
    return variant(attributes, toTaka(v.discount_price) || v.price, v.price, typeof v.stock === "number" ? v.stock > 0 : null);
  });
}

interface OptionGroup {
  id: string;
  label: string;
  values: { id: string; title: string }[];
}

function combos(groups: OptionGroup[]): [OptionGroup, { id: string; title: string }][][] {
  return groups.reduce<[OptionGroup, { id: string; title: string }][][]>(
    (all, group) => all.flatMap((picked) => group.values.map((value) => [...picked, [group, value] as [OptionGroup, { id: string; title: string }]])),
    [[]],
  );
}

// Star Tech: ভার্সনের দাম পাতায় থাকে না, ব্রাউজার যেভাবে চায় সেভাবে /product/product/variation থেকে
export async function startechVariants(html: string, url: string): Promise<ShopVariant[]> {
  const productId = /name="product_id" value="(\d+)"/.exec(html)?.[1];
  const groups: OptionGroup[] = [...html.matchAll(/id="input-option(\d+)">([^<:]+)/g)].map(([, id, label]) => ({
    id,
    label: label.trim(),
    values: [...html.matchAll(new RegExp(`value="(\\d+)"\\s+name="option\\[${id}\\]" title="([^"]+)"`, "g"))].map(([, value, title]) => ({ id: value, title: decode(title) })),
  }));
  const sizing = groups.filter((g) => !COLOR.test(g.label) && g.values.length);
  if (!productId || sizing.length === 0) return [];
  const color = groups.find((g) => COLOR.test(g.label) && g.values.length);
  const endpoint = new URL("/product/product/variation", url).href;
  const rows: ShopVariant[] = [];
  for (const picked of combos(sizing).slice(0, MAX_COMBOS)) {
    const form: Record<string, string> = { product_id: productId };
    for (const [group, value] of picked) form[`option[${group.id}]`] = value.id;
    if (color) form[`option[${color.id}]`] = color.values[0].id;
    const answer = parse(await postForm(endpoint, form));
    if (!isObject(answer) || answer.error) continue;
    const stock = String(answer.stock ?? "");
    const special = answer.special ? answer.special : null;
    rows.push(
      ...variant(
        picked.map(([group, value]) => [group.label, value.title]),
        special ?? answer.price,
        special ? answer.price : null,
        /in stock|pre ?order/i.test(stock) ? true : /out of stock|up ?coming/i.test(stock) ? false : null,
      ),
    );
  }
  return rows;
}

// Chardike (Next.js): দাম __NEXT_DATA__ এর initialCoreData তে — price মূল দাম, discount_price ছাড়ের দাম
export function chardikeVariants(html: string): ShopVariant[] {
  const data = parse(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "");
  const core = isObject(data) && isObject(data.props) && isObject(data.props.pageProps) ? data.props.pageProps.initialCoreData : null;
  if (!isObject(core)) return [];
  const full = toTaka(core.price);
  const sale = toTaka(core.discount_price);
  return variant([], sale && full && sale < full ? sale : full, full, typeof core.stock === "number" ? core.stock > 0 : null);
}

// Aureva (Next.js): দাম __NEXT_DATA__ এর props.pageProps.product এ — sale_price বেচার দাম,
// price/max_price কাটা দাম; নামেই সাইজ লেখা ("… Essence 100ml", patch হলে "24 patch")
export function aurevaVariants(html: string): ShopVariant[] {
  const data = parse(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "");
  const p = isObject(data) && isObject(data.props) && isObject(data.props.pageProps) ? data.props.pageProps.product : null;
  if (!isObject(p)) return [];
  const name = String(p.name ?? "");
  const amount = toTaka(p.sale_price) ?? toTaka(p.price);
  const full = toTaka(p.price);
  const size = /(\d+(?:\.\d+)?\s*(?:ml|g|oz))\b/i.exec(name)?.[1] ?? /(\d+)\s*patch/i.exec(name)?.[1]?.concat("pcs");
  return variant(size ? [["size", size.replace(/\s+/g, "").toLowerCase()]] : [], amount, full,
    typeof p.in_stock === "number" ? p.in_stock > 0 : null);
}

// PerfectoBD (Next.js RSC): পাতার পণ্যটা slug দিয়ে চেনা, পাশের পণ্যের দাম নয়
export function perfectoVariants(html: string, url: string): ShopVariant[] {
  const slug = new URL(url).pathname.split("/").filter(Boolean).pop();
  const product = objectsAt(html, /\{"id":\d+,"type":"product","slug":/g).find((p) => p.slug === slug);
  if (!product) return [];
  return variant([], product.calculable_price, product.mrp_price, typeof product.in_stock === "boolean" ? product.in_stock : null);
}

// Her Happy Skin (Next.js): পাতা JS-এ ফাঁকা, দাম-স্টক সাইট নিজে যে API থেকে পড়ে সেখান থেকেই;
// নামে সাইজ থাকে ("... 56ml"), সেটাই ভ্যারিয়েন্টের অপশন। API টা Django REST — JSON চাইলে আলাদা Accept লাগে
export async function hhsVariants(html: string, url: string): Promise<ShopVariant[]> {
  const slug = new URL(url).pathname.split("/").filter(Boolean).pop();
  if (!slug) return [];
  const data = (await getJson(`https://her-api.herhappyskin.com/hst-api/product-details/${slug}/1453456`)) as Json | null;
  if (!isObject(data)) return [];
  const sale = toTaka(data.discount_price);
  const full = toTaka(data.price);
  const size = /(\d+(?:\.\d+)?\s*(?:ml|g|pcs|oz))\b/i.exec(String(data.name ?? ""));
  return variant(size ? [["size", size[1].replace(/\s+/g, "").toLowerCase()]] : [], sale && full && sale < full ? sale : full, full, typeof data.stock === "number" ? data.stock > 0 : null);
}

// Othoba (nopCommerce): JSON-LD এর price মূল দাম, ছাড়ের দাম পাশের sale_price এ
export function othobaVariants(html: string): ShopVariant[] {
  const quote = structuredQuote(html);
  if (!quote) return [];
  const sale = toTaka(/"sale_price"\s*:\s*"([\d.]+)"/.exec(html)?.[1]);
  return variant([], sale && sale < quote.price ? sale : quote.price, quote.price, quote.inStock);
}

// HNS Tech (কাস্টম Laravel): পাতার data-variants JSON-এ প্রতিটা কনফিগের দাম-স্টক; রং অপশন নয়।
// Pre-order পাতায় দাম ০ থাকে (বুকিং ফি আলাদা ঘরে), তাই সেগুলো নিজে থেকেই বাদ।
export function hnstechVariants(html: string): ShopVariant[] {
  const raw = /data-variants='(\[[^']*\])'/.exec(html)?.[1];
  const list = raw ? parse(raw) : null;
  if (!Array.isArray(list)) return [];
  return list.filter(isObject).flatMap((v) => {
    const price = toTaka(v.effective_price) ?? toTaka(v.price);
    if (!price) return [];
    const full = toTaka(v.price);
    const options = [v.storage, v.display_size, v.connectivity].map((x) => (x == null ? "" : String(x).trim())).filter(Boolean);
    return variant([["", options.join(" ")]], price, full && full > price ? full : null, typeof v.quantity === "number" ? v.quantity > 0 : null);
  });
}

// Shopify: পাতার JSON-LD এ শুধু প্রথম ভার্সনের দাম; প্রতিটা ভার্সনের দাম (পয়সায়), স্টক, অপশন, নাম আর ছবি /products/<handle>.js এ।
// না পেলে null — তখন আগের মতো পাতার JSON-LD। আটকে দিলে সেটা উপরে যায়, যাতে দোকান-আটকানোর নিয়ম চলে
export async function shopifyProduct(url: string): Promise<ShopProduct | null> {
  const { origin, pathname } = new URL(url);
  const handle = /\/products\/([^/?#]+)/.exec(pathname)?.[1];
  if (!handle) return null;
  const data = await getJson(`${origin}/products/${handle}.js`).catch((error) => {
    if (error instanceof StoreBlocked) throw error;
    return null;
  });
  if (!isObject(data) || !Array.isArray(data.variants)) return null;
  const names = (Array.isArray(data.options) ? data.options : []).map((option) => (isObject(option) ? option.name : option));
  const taka = (cents: unknown) => (typeof cents === "number" ? cents / 100 : null);
  const rows = data.variants.filter(isObject).flatMap((v) => {
    // এক ভার্সনের পণ্যে Shopify নিজে "Default Title" বসায়, ওটা কোনো অপশন নয়
    const values = [v.option1, v.option2, v.option3].map((value) => (value === "Default Title" ? null : value));
    return variant(
      names.map((name, i) => [name, values[i]] as [unknown, unknown]),
      taka(v.price),
      taka(v.compare_at_price),
      typeof v.available === "boolean" ? v.available : null,
    );
  });
  const image = typeof data.featured_image === "string" && data.featured_image ? data.featured_image.replace(/^\/\//, "https://") : null;
  return { rows, title: typeof data.title === "string" ? data.title : null, image };
}

// JS দিয়ে আঁকা দোকান (Next.js, Nuxt ইত্যাদি) দাম পাতার ভেতরের JSON-এ রাখে। দামের ঘরওয়ালা object খুঁজে, পাতার লিংক আর শিরোনামের
// সাথে যেটার নাম মেলে সেটাই মূল পণ্য; ভার্সন তার ভেতরের তালিকায়, নইলে একই slug বা মূল নামের অন্য object-এ
const SALE_KEYS = ["salePrice", "sale_price", "discountPrice", "discount_price", "offerPrice", "offer_price", "sellingPrice", "selling_price", "specialPrice", "special_price", "price", "sellPrice", "sell_price"];
const OLD_KEYS = ["regularPrice", "regular_price", "originalPrice", "original_price", "orig", "mrp", "compareAtPrice", "compare_at_price", "oldPrice", "old_price", "sellPrice", "sell_price", "price"];
const PRICE_KEY = new RegExp(`"(${SALE_KEYS.join("|")})":\\s*"?\\d`, "g");
const IN_STOCK = ["inStock", "in_stock", "isInStock", "is_in_stock", "available"];
const OUT_OF_STOCK = ["isOutOfStock", "is_out_of_stock", "outOfStock", "out_of_stock", "isStockOut", "is_stock_out", "isSoldOut", "soldOut"];
const MAX_TRIES = 40;

function pricedObjects(text: string): Json[] {
  const parsed = new Map<number, unknown>();
  const found = new Map<number, Json>();
  for (const match of text.matchAll(PRICE_KEY)) {
    let at = match.index;
    for (let tries = 0; tries < MAX_TRIES && at > 0; tries++) {
      at = text.lastIndexOf("{", at - 1);
      if (at < 0) break;
      if (!parsed.has(at)) parsed.set(at, jsonAt(text, at));
      const value = parsed.get(at);
      if (isObject(value) && match[1] in value) {
        found.set(at, value);
        break;
      }
    }
  }
  return [...found.values()];
}

// "500 gm", "500gm", "1 KG" → "500g", "1kg", যাতে ক্যাটালগের লেবেলের সাথে মেলে
const unit = (text: string) =>
  text.replace(/(\d+(?:\.\d+)?)\s*(gms?|grams?|g)\b/gi, "$1g").replace(/(\d+(?:\.\d+)?)\s*(kgs?|kilograms?)\b/gi, "$1kg").replace(/(\d+(?:\.\d+)?)\s*(ml|ltr|l)\b/gi, (_, n, u) => `${n}${u.toLowerCase() === "ml" ? "ml" : "l"}`);

function optionsOf(row: Json): [unknown, unknown][] {
  if (isObject(row.attributes)) return Object.entries(row.attributes).map(([name, value]) => [name, unit(String(value ?? ""))]);
  const named = row.variationName ?? row.variantName ?? row.variation_name ?? row.variant_name;
  if (typeof named === "string") return [["", unit(named)]];
  if (row.weight != null && row.weight !== "") return [["", unit(`${row.weight} ${row.weightUnit ?? row.weight_unit ?? ""}`)]];
  return [];
}

function amountsOf(row: Json): { price: number | null; oldPrice: number | null } {
  const list = (keys: string[]) => keys.map((key) => toTaka(row[key])).filter((n): n is number => n !== null);
  const oldPrice = Math.max(0, ...list(OLD_KEYS)) || null;
  // কিছু API-তে discountPrice মানে ছাড়ের অংক, দাম নয়; পুরনো দামের ৪০%-এর কম হলে সেটা বাদ
  const price = list(SALE_KEYS).find((n) => !oldPrice || n >= oldPrice * 0.4) ?? null;
  return { price, oldPrice };
}

function stockOf(row: Json): boolean | null {
  const yes = IN_STOCK.find((key) => typeof row[key] === "boolean");
  if (yes) return row[yes] as boolean;
  const no = OUT_OF_STOCK.find((key) => typeof row[key] === "boolean");
  return no ? !row[no] : null;
}

const nameOf = (row: Json) => [row.name, row.title, row.productName, row.slug, row.handle].filter((v) => typeof v === "string").join(" ");

function nestedRows(product: Json): Json[] {
  const lists: Json[][] = [];
  const walk = (node: unknown, depth: number) => {
    if (depth > 3) return;
    if (Array.isArray(node)) {
      const rows = node.filter((n): n is Json => isObject(n) && SALE_KEYS.some((key) => toTaka(n[key])));
      if (rows.length) lists.push(rows);
      else node.forEach((n) => walk(n, depth + 1));
    } else if (isObject(node)) Object.entries(node).forEach(([key, value]) => !/related|similar|recommend|upsell|cross/i.test(key) && walk(value, depth + 1));
  };
  Object.values(product).forEach((value) => walk(value, 0));
  return lists.sort((a, b) => b.length - a.length)[0] ?? [];
}

export function embeddedVariants(html: string, url: string): ShopVariant[] {
  const objects = pricedObjects(unescaped(html)).filter((row) => amountsOf(row).price);
  const slug = decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).pop() ?? "").toLowerCase();
  const page = new Set(tokens(`${slug.replace(/[-_]+/g, " ")} ${/<title[^>]*>([^<]*)/i.exec(html)?.[1] ?? ""}`));
  const fit = (row: Json) => {
    if (typeof row.slug === "string" && row.slug.toLowerCase() === slug) return 2;
    const own = [...new Set(tokens(nameOf(row)))];
    return own.length ? own.filter((t) => page.has(t)).length / own.length : 0;
  };
  const main = objects.map((row) => ({ row, fit: fit(row) })).sort((a, b) => b.fit - a.fit)[0];
  if (!main || main.fit < 0.6) return [];
  const nested = nestedRows(main.row);
  const kin = objects.filter(
    (row) => (main.row.slug != null && row.slug === main.row.slug) || (main.row.parentName != null && row.parentName === main.row.parentName),
  );
  const rows = nested.length ? nested : kin.length ? kin : [main.row];
  const out = rows.flatMap((row) => {
    const { price, oldPrice } = amountsOf(row);
    return variant(optionsOf(row), price, oldPrice, stockOf(row));
  });
  // পাতার JSON-LD-এর দাম থাকলে সেটা এর মধ্যে থাকতেই হবে, নইলে ভুল object ধরা হয়েছে
  const shown = structuredQuote(html)?.price;
  return shown && !out.some((row) => row.price === shown || row.oldPrice === shown) ? [] : out;
}
