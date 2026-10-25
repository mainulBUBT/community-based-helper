import type { CatalogProduct } from "../lib/match";
import type { Quote } from "../lib/price";

export interface Listing {
  title: string;
  url: string;
  price: number | null;
  oldPrice: number | null;
}

export type Condition = "official" | "unofficial";

// পাতার একটা ভার্সন: options এ স্টোরেজ/RAM/সাইজ/কানেক্টিভিটি, রং বাদ; region আলাদা কারণ দাম তুলনায় সবচেয়ে কমটা নেওয়া হয়
export interface ShopVariant {
  options: string[];
  region: string | null;
  price: number;
  oldPrice: number | null;
  inStock: boolean | null;
}

export interface Store {
  id: string;
  name: string;
  origin: string;
  rendered: boolean;
  priceSelector?: string;
  sample: string;
  promoUrl: string | null;
  condition: Condition;
  parse?: (html: string) => Quote | null;
  variants?: (html: string, url: string) => ShopVariant[] | Promise<ShopVariant[]>;
  // listing পণ্যের উপর নির্ভর করলে: ব্র্যান্ডের ক্যাটাগরি থেকে ("brand") বা প্রতি পণ্যে সার্চ ("name"); না দিলে পুরো sitemap
  listsBy?: "brand" | "name";
  discover: (products: Pick<CatalogProduct, "name" | "brand">[]) => Promise<Listing[]>;
}
