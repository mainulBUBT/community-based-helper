import { decode, stripTags } from "../lib/html";
import { postForm } from "../lib/http";
import { groupBy } from "../lib/pool";
import { structuredQuote, toTaka } from "../lib/price";
import type { ShopVariant } from "./types";

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
    const attributes = Object.entries(isObject(v.attributes) ? v.attributes : {}).map(
      ([key, value]) => [key.replace(/^attribute_(pa_)?/, ""), String(value).replace(/-/g, " ")] as [string, string],
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

// PerfectoBD (Next.js RSC): পাতার পণ্যটা slug দিয়ে চেনা, পাশের পণ্যের দাম নয়
export function perfectoVariants(html: string, url: string): ShopVariant[] {
  const slug = new URL(url).pathname.split("/").filter(Boolean).pop();
  const product = objectsAt(html, /\{"id":\d+,"type":"product","slug":/g).find((p) => p.slug === slug);
  if (!product) return [];
  return variant([], product.calculable_price, product.mrp_price, typeof product.in_stock === "boolean" ? product.in_stock : null);
}
