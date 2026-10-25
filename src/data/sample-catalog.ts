import type { Offer, PricePoint, Product, Seller } from "@/types/catalog";
import { catalogOffers, catalogProducts, catalogSellers } from "./catalog.generated";

export const sampleProducts: Product[] = catalogProducts.map((p) => ({ ...p, variants: p.variants.map((v) => ({ ...v })) }));

export const sampleSellers: Seller[] = catalogSellers.map((s) => ({ ...s }));

export const sampleOffers: Offer[] = catalogOffers.map((o) => ({ ...o }));

export const sampleHistory: PricePoint[] = sampleOffers.map((offer) => ({ offerId: offer.id, price: offer.price, seenAt: offer.checkedAt }));
