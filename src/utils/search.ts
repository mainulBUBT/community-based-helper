import type { CategoryInfo, Product } from "@/types/catalog";

// বাংলায় লেখা ব্র্যান্ড/মডেল/ক্যাটাগরির শব্দ → ইংরেজি; একটা বাংলা শব্দ কয়েকটা ইংরেজি শব্দও হতে পারে ("পাওয়ার ব্যাংক")
const ALIASES: Record<string, string> = {
  আইফোন: "iphone",
  আইপ্যাড: "ipad",
  ম্যাকবুক: "macbook",
  ম্যাক: "mac",
  আইম্যাক: "imac",
  এয়ারপডস: "airpods",
  অ্যাপল: "apple",
  এপল: "apple",
  স্যামসাং: "samsung",
  সামসাং: "samsung",
  গ্যালাক্সি: "galaxy",
  শাওমি: "xiaomi",
  রেডমি: "redmi",
  পোকো: "poco",
  রিয়েলমি: "realme",
  অপো: "oppo",
  ভিভো: "vivo",
  ওয়ানপ্লাস: "oneplus",
  গুগল: "google",
  পিক্সেল: "pixel",
  হুয়াওয়ে: "huawei",
  অনার: "honor",
  টেকনো: "tecno",
  ইনফিনিক্স: "infinix",
  মটোরোলা: "motorola",
  মোটো: "moto",
  নোকিয়া: "nokia",
  নকিয়া: "nokia",
  লেনোভো: "lenovo",
  থিংকপ্যাড: "thinkpad",
  আইডিয়াপ্যাড: "ideapad",
  এইচপি: "hp",
  ডেল: "dell",
  আসুস: "asus",
  এসার: "acer",
  এমএসআই: "msi",
  সনি: "sony",
  এলজি: "lg",
  জেবিএল: "jbl",
  অ্যাঙ্কার: "anker",
  ওরাইমো: "oraimo",
  বেসিয়াস: "baseus",
  হাইলু: "haylou",
  কসপেট: "kospet",
  অ্যামাজফিট: "amazfit",
  নাইকি: "nike",
  অ্যাডিডাস: "adidas",
  জর্ডান: "jordan",
  পুমা: "puma",
  ওয়াচ: "watch",
  ঘড়ি: "watch",
  বাডস: "buds",
  নোট: "note",
  প্রো: "pro",
  ম্যাক্স: "max",
  প্লাস: "plus",
  আল্ট্রা: "ultra",
  এয়ার: "air",
  মিনি: "mini",
  লাইট: "lite",
  নিও: "neo",
  ল্যাপটপ: "laptop",
  ট্যাব: "tablet",
  ট্যাবলেট: "tablet",
  ডেস্কটপ: "desktop",
  মনিটর: "monitor",
  চার্জার: "charger",
  ফ্যান: "fan",
  রাউটার: "router",
  নেকব্যান্ড: "neckband",
  ইয়ারবাড: "earbuds",
  ইয়ারফোন: "earphone",
  হেডফোন: "headphone",
  পাওয়ারব্যাংক: "power bank",
  পাওয়ার: "power",
  ব্যাংক: "bank",
  স্মার্টওয়াচ: "smart watch",
  স্মার্ট: "smart",
  ফিল্টার: "filter",
  পানির: "water",
  ক্রিম: "cream",
  টোনার: "toner",
  লিপস্টিক: "lipstick",
  ফাউন্ডেশন: "foundation",
  মধু: "honey",
  খেজুর: "dates",
  বেবি: "baby",
  বাচ্চার: "baby",
  ডায়াপার: "diaper",
  ডাইপার: "diaper",
  ওয়াইপস: "wipes",
  লোশন: "lotion",
  শ্যাম্পু: "shampoo",
  পাউডার: "powder",
  সাবান: "soap",
  তেল: "oil",
  wipe: "wipes",
  diapers: "diaper",
  জুতা: "sneakers",
  স্নিকার্স: "sneakers",
  সিরাম: "serum",
  সানস্ক্রিন: "sunscreen",
  ফেসওয়াশ: "face wash",
  powerbank: "power bank",
  earbud: "earbuds",
  headphones: "headphone",
  sneaker: "sneakers",
  smartwatch: "smart watch",
  macbookpro: "macbook pro",
  macbookair: "macbook air",
};

// খোঁজার সাথে সম্পর্কহীন শব্দ, বাদ যায়
const STOP = new Set(["দাম", "কত", "টাকা", "এর", "কিনতে", "চাই", "price", "bd", "in", "of", "the", "for", "a", "an"]);

const BN_DIGITS = /[০-৯]/g;
const toAsciiDigits = (text: string) => text.replace(BN_DIGITS, (d) => String(d.charCodeAt(0) - 0x09e6));

// ছোট হাতের অক্ষর, বাংলা সংখ্যা → ইংরেজি, "+" → plus, বাকি চিহ্ন ফাঁকা
const clean = (text: string) =>
  toAsciiDigits(text.normalize("NFC").toLowerCase())
    .replace(/\+/g, " plus ")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim();

export const tokenize = (text: string) => (clean(text) ? clean(text).split(" ") : []);

export function queryWords(query: string) {
  return tokenize(query)
    .flatMap((word) => (ALIASES[word] ?? word).split(" "))
    .filter((word) => word && !STOP.has(word));
}

// বানান ভুল কতটা মানা হবে: ছোট শব্দে একদম না, মাঝারিতে ১ অক্ষর, বড়তে ২
const tolerance = (word: string) => (word.length < 5 ? 0 : word.length < 8 ? 1 : 2);

// Damerau-Levenshtein (পাশাপাশি দুই অক্ষর উল্টে গেলে ১ গোনা হয়), সীমা ছাড়ালে থামে
function editDistance(a: string, b: string, limit: number) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const same = a[i - 1] === b[j - 1];
      let cost = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (same ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cost = Math.min(cost, prev2[j - 2] + 1);
      row[j] = cost;
      best = Math.min(best, cost);
    }
    if (best > limit) return limit + 1;
    [prev2, prev] = [prev, row];
  }
  return prev[b.length];
}

const isNumeric = (word: string) => /^\d+$/.test(word);

// একটা খোঁজার শব্দ একটা নামের শব্দের সাথে কতটা মেলে (০ = মেলে না)
function wordScore(query: string, word: string) {
  if (query === word) return 10;
  if (isNumeric(query)) {
    // "15" যেন "150ml" বা "1500" না ধরে; "a15", "s24" এর ভেতরের সংখ্যা ধরে
    const digits = word.match(/\d+/g);
    return digits?.some((d) => d === query) ? 7 : 0;
  }
  if (word.startsWith(query)) return 6 + 3 * (query.length / word.length);
  if (query.length >= 3 && word.includes(query)) return 4;
  const limit = tolerance(query);
  if (limit) {
    const distance = editDistance(query, word, limit);
    if (distance <= limit) return 5 - distance;
  }
  return 0;
}

interface Field {
  words: string[];
  weight: number;
}

export interface Indexed<T> {
  item: T;
  fields: Field[];
  // ব্র্যান্ড আর নাম এক সাথে, ফাঁকা ছাড়া: "galaxys24ultra" ধরে
  compact: string;
  phrase: string;
  nameLength: number;
}

export function indexProduct<T>(item: T, product: Product, categories?: CategoryInfo[]): Indexed<T> {
  const category = categories?.find((c) => c.slug === product.category);
  const parent = category?.parent ? categories?.find((c) => c.slug === category.parent) : undefined;
  const title = tokenize(`${product.brand} ${product.name}`);
  const categoryWords = [category, parent].filter(Boolean).flatMap((c) => [...tokenize(c!.nameEn), ...tokenize(c!.name).flatMap((w) => (ALIASES[w] ?? w).split(" "))]);
  return {
    item,
    fields: [
      { words: title, weight: 1 },
      { words: [...new Set(product.variants.flatMap((v) => tokenize(v.label)))], weight: 0.5 },
      { words: [...new Set(categoryWords)], weight: 0.6 },
    ],
    compact: title.join(""),
    phrase: title.join(" "),
    nameLength: title.length,
  };
}

// সব শব্দ মিললে স্কোর, নাহলে ০ (misses দিলে ততটা শব্দ না মিললেও চলে)। নাম যত ছোট আর যত বেশি অংশ মিলেছে, স্কোর তত বেশি ("iPhone 17" আগে, "iPhone 17 Pro Max" পরে)
export function scoreIndexed(entry: Indexed<unknown>, words: string[], misses = 0) {
  if (!words.length) return 1;
  let total = 0;
  let missed = 0;
  for (const query of words) {
    let best = 0;
    for (const { words: list, weight } of entry.fields) {
      for (const word of list) {
        const s = wordScore(query, word) * weight;
        if (s > best) best = s;
      }
    }
    if (!best && query.length >= 3 && entry.compact.includes(query)) best = 3;
    if (!best && ++missed > misses) return 0;
    total += best || -query.length;
  }
  const phrase = words.join(" ");
  if (entry.phrase.includes(phrase)) total += 5;
  else if (entry.compact.includes(words.join(""))) total += 3;
  return total + (3 * Math.min(words.length, entry.nameLength)) / entry.nameLength;
}

export interface Ranked<T> {
  item: T;
  score: number;
  // true: সব শব্দ মেলেনি, একটা বাদ দিয়ে কাছাকাছি মিল
  partial: boolean;
}

// আগে সব শব্দ মেলে এমন পণ্য; একটাও না থাকলে একটা শব্দ বাদ দিয়ে কাছাকাছি যা মেলে ("iphone 15" লিখলে খালি পাতার বদলে অন্য আইফোন)
export function rankItems<T>(entries: Indexed<T>[], query: string): Ranked<T>[] {
  const words = queryWords(query);
  if (!words.length) return entries.map((entry) => ({ item: entry.item, score: 1, partial: false }));
  const rank = (misses: number) =>
    entries
      .map((entry) => ({ item: entry.item, score: scoreIndexed(entry, words, misses), partial: misses > 0 }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
  const exact = rank(0);
  return exact.length || words.length < 2 ? exact : rank(1);
}

export function rankProducts<T>(items: T[], getProduct: (item: T) => Product, query: string, categories?: CategoryInfo[]) {
  return rankItems(
    items.map((item) => indexProduct(item, getProduct(item), categories)),
    query,
  );
}

export function matchesQuery(product: Product, query: string, categories?: CategoryInfo[]) {
  const words = queryWords(query);
  return !words.length || scoreIndexed(indexProduct(null, product, categories), words) > 0;
}
