export type Category = string;
export type SellerKind = "website" | "shop" | "group";
export type Condition = "official" | "unofficial" | "used";
export type OfferSource = "site" | "seller" | "user" | "admin";

export const AXES = ["chip", "ram", "storage", "size", "connectivity", "edition", "color", "gpu", "cpu", "resolution", "battery", "capacity"] as const;
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
  lowestAny: number | null;
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
}
