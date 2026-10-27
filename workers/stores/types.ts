import type { CatalogProduct } from "../lib/match";
import type { Quote } from "../lib/price";
import type { Condition } from "../../src/types/catalog";

export interface Listing {
  title: string;
  url: string;
  price: number | null;
  oldPrice: number | null;
}

export type { Condition } from "../../src/types/catalog";

// পাতার একটা ভার্সন: options এ স্টোরেজ/RAM/সাইজ/কানেক্টিভিটি, রং বাদ; region আলাদা কারণ দাম তুলনায় সবচেয়ে কমটা নেওয়া হয়
export interface ShopVariant {
  options: string[];
  region: string | null;
  price: number;
  oldPrice: number | null;
  inStock: boolean | null;
}

// পাতার HTML ছাড়াই দোকানের নিজের পণ্য-ডেটা থেকে সব ভার্সন, নাম আর ছবি
export interface ShopProduct {
  rows: ShopVariant[];
  title: string | null;
  image: string | null;
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
  // থাকলে আগে এটা (Shopify এর .js); null বা ভার্সন খালি হলে HTML পথে — এতে প্রতি পাতায় দুবার অনুরোধ লাগে না
  product?: (url: string) => Promise<ShopProduct | null>;
  // listing ব্র্যান্ডের ক্যাটাগরি থেকে এলে "brand"; না দিলে পুরো sitemap
  listsBy?: "brand";
  discover: (products: Pick<CatalogProduct, "name" | "brand">[]) => Promise<Listing[]>;
}
