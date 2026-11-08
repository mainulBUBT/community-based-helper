export type Category = string;
export type SellerKind = "website" | "shop" | "group";
export const CONDITIONS = ["official", "unofficial", "used", "replica_premium", "replica"] as const;
export type Condition = (typeof CONDITIONS)[number];
export type OfferSource = "site" | "seller" | "user" | "admin";

export const AXES = ["chip", "ram", "storage", "size", "connectivity", "edition", "color", "gpu", "cpu", "resolution", "battery", "capacity", "wattage"] as const;
export type Axis = (typeof AXES)[number];
export type VariantAttributes = Partial<Record<Axis, string>>;

export interface CategoryInfo {
  slug: Category;
  name: string;
  nameEn: string;
  icon: string;
  axes: Axis[];
  parent?: Category | null;
  position: number;
  active: boolean;
  // false: ব্র্যান্ড ওয়ারেন্টি বলে কিছু নেই (স্কিনকেয়ার, জুতা), তাই অফিসিয়াল/আনঅফিসিয়াল ভাগ দেখানো হয় না
  warranty?: boolean;
  // এই ক্যাটাগরিতে দামের কোন কোন ধরন হয় (ক্রমে); না থাকলে ইলেকট্রনিক্সের official/unofficial/used
  conditions?: Condition[];
  // true: নকল বেশি হয় এমন পণ্য (মেকআপ, স্কিনকেয়ার) — পণ্যের পাতায় "কেনার আগে আসল কিনা যাচাই করুন"
  verifyNote?: boolean;
  // true: একই নামের পণ্য দোকানভেদে আলাদা মানের (খেজুর জাত ধরে তুলনা) — পণ্যের পাতায় সেই নোট
  qualityNote?: boolean;
  // false: হোমের টাইল আর শেলফে নয় (মেনু, নিজের পাতা আর sitemap এ থাকে); অ্যাডমিনের মৌসুমি ক্যাটাগরিতে বদলায়
  showOnHome?: boolean;
  // মৌসুমি/উৎসবের ক্যাটাগরি: অন্য ক্যাটাগরির পণ্যের slug হাতে বাছা; না থাকলে সাধারণ ক্যাটাগরি
  collection?: string[];
}

export interface SpecItem {
  label: string;
  value: string;
}

export interface SpecGroup {
  group: string;
  items: SpecItem[];
}

export interface Variant {
  id: string;
  label: string;
  attributes: VariantAttributes;
  officialPrice: number | null;
  sku?: string | null;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: Category;
  releaseYear: number | null;
  popularity: number;
  variants: Variant[];
  images?: string[];
  colors?: string[];
  regions?: string[];
  tags?: string[];
  description?: string | null;
  descriptionEn?: string | null;
  specs?: SpecGroup[];
  specsSource?: string | null;
  active?: boolean;
}

export interface Seller {
  id: string;
  name: string;
  kind: SellerKind;
  website: string | null;
  phone: string | null;
  whatsapp: string | null;
  facebook: string | null;
  area: string | null;
  verified: boolean;
  active: boolean;
  // build এ public/sellers এ ফাইল থাকলে তার পথ; অ্যাডমিনের লাইভ ডেটায় থাকে না
  logo?: string | null;
}

export interface Offer {
  id: string;
  variantId: string;
  sellerId: string;
  condition: Condition;
  region: string | null;
  price: number;
  oldPrice: number | null;
  inStock: boolean | null;
  url: string | null;
  source: OfferSource;
  published: boolean;
  checkedAt: string;
}

export interface Promo {
  id: string;
  sellerId: string;
  kind: string;
  text: string;
  scope: string | null;
  endsOn: string | null;
  active: boolean;
}

export interface PricePoint {
  offerId: string;
  price: number;
  seenAt: string;
}

export interface OfferView extends Offer {
  seller: Seller;
  promos: Promo[];
}

export interface ProductSummary {
  product: Product;
  lowest: number | null;
  size: string | null;
  condition: Condition | null;
  compareAt: number | null;
  inStock: boolean;
  sellerCount: number;
  drop: number | null;
}

export interface Alternative {
  summary: ProductSummary;
  variantId: string;
  specLabel: string;
  sameSpec: boolean;
  price: number;
  saving: number;
  condition: Condition;
  stores: number;
}

export interface ProductDetail {
  product: Product;
  category: CategoryInfo | null;
  offers: OfferView[];
  history: PricePoint[];
  alternatives: Record<string, Alternative[]>;
  startVariant: string | null;
}
