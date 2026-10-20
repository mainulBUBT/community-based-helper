export type Category = "mobile" | "apple" | "watch";
export type SellerKind = "website" | "shop" | "group";
export type Condition = "official" | "unofficial" | "used";
export type OfferSource = "site" | "seller" | "user" | "admin";

export interface Variant {
  id: string;
  label: string;
  officialPrice: number | null;
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
  inStock: boolean;
  sellerCount: number;
  drop: number | null;
}

export interface ProductDetail {
  product: Product;
  offers: OfferView[];
  history: PricePoint[];
}
