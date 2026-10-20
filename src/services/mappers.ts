import type { AuditEntry, Job, JobRun, ReviewItem } from "@/types/admin";
import type { Offer, PricePoint, Product, Promo, Seller, Variant } from "@/types/catalog";

type Row = Record<string, unknown>;

const str = (value: unknown) => (value == null ? null : String(value));

export const toVariant = (row: Row): Variant => ({
  id: String(row.id),
  label: String(row.label),
  officialPrice: (row.official_price as number | null) ?? null,
});

export const toProduct = (row: Row): Product => ({
  id: String(row.id),
  slug: String(row.slug),
  name: String(row.name),
  brand: String(row.brand),
  category: row.category as Product["category"],
  releaseYear: (row.release_year as number | null) ?? null,
  popularity: Number(row.popularity ?? 0),
  variants: ((row.variants as Row[] | undefined) ?? [])
    .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
    .map(toVariant),
});

export const toSeller = (row: Row): Seller => ({
  id: String(row.id),
  name: String(row.name),
  kind: row.kind as Seller["kind"],
  website: str(row.website),
  phone: str(row.phone),
  whatsapp: str(row.whatsapp),
  facebook: str(row.facebook),
  area: str(row.area),
  verified: Boolean(row.verified),
  active: Boolean(row.active),
});

export const fromSeller = (seller: Omit<Seller, "id">) => ({
  name: seller.name,
  kind: seller.kind,
  website: seller.website,
  phone: seller.phone,
  whatsapp: seller.whatsapp,
  facebook: seller.facebook,
  area: seller.area,
  verified: seller.verified,
  active: seller.active,
});

export const toOffer = (row: Row): Offer => ({
  id: String(row.id),
  variantId: String(row.variant_id),
  sellerId: String(row.seller_id),
  condition: row.condition as Offer["condition"],
  region: str(row.region),
  price: Number(row.price),
  oldPrice: (row.old_price as number | null) ?? null,
  inStock: (row.in_stock as boolean | null) ?? null,
  url: str(row.url),
  source: row.source as Offer["source"],
  published: Boolean(row.published),
  checkedAt: String(row.checked_at),
});

export const toPromo = (row: Row): Promo => ({
  id: String(row.id),
  sellerId: String(row.seller_id),
  kind: String(row.kind),
  text: String(row.text),
  scope: str(row.scope),
  endsOn: str(row.ends_on),
  active: Boolean(row.active),
});

export const toPricePoint = (row: Row): PricePoint => ({
  offerId: String(row.offer_id),
  price: Number(row.price),
  seenAt: String(row.seen_at),
});

export const toReviewItem = (row: Row): ReviewItem => ({
  id: String(row.id),
  kind: row.kind as ReviewItem["kind"],
  payload: row.payload as Record<string, string>,
  createdAt: String(row.created_at),
});

export const toJob = (row: Row): Job => ({
  id: String(row.id),
  name: String(row.name),
  runner: String(row.runner),
  schedule: String(row.schedule),
  enabled: Boolean(row.enabled),
  runRequestedAt: str(row.run_requested_at),
  lastRunAt: str(row.last_run_at),
  lastStatus: str(row.last_status),
  lastMessage: str(row.last_message),
});

export const toJobRun = (row: Row): JobRun => ({
  id: Number(row.id),
  jobId: String(row.job_id),
  status: String(row.status),
  message: str(row.message),
  startedAt: String(row.started_at),
});

export const toAudit = (row: Row): AuditEntry => ({
  id: Number(row.id),
  action: String(row.action),
  detail: (row.detail as Record<string, unknown> | null) ?? null,
  createdAt: String(row.created_at),
});
