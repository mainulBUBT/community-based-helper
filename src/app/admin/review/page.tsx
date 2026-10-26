"use client";

import { ExternalLink, EyeOff, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { ConditionSelect } from "@/components/admin/ConditionSelect";
import { Field, Select } from "@/components/admin/Field";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { Badge } from "@/components/ui/Badge";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminAction } from "@/hooks/useAdminAction";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { offerVariants, saveManualOffer } from "@/services/admin/offers";
import { canUndo, listPendingReview, listRecentDecisions, resolveReview, undoReview } from "@/services/admin/review";
import { listAllSellers, saveSeller } from "@/services/admin/sellers";
import { loadCatalog } from "@/services/catalog-live";
import type { ReviewItem } from "@/types/admin";
import type { Condition, Offer, Product, Seller } from "@/types/catalog";
import { formatTaka } from "@/utils/format";
import { safeUrl } from "@/utils/url";

const taka = (value?: string | number | null) => (value ? formatTaka(Number(value)) : "");
const NEW_SELLER = "__new";
const lower = (value?: string) => (value ?? "").toLowerCase();

interface Context {
  products: Product[];
  offers: Offer[];
  sellers: Seller[];
  anomalyVariant: Map<string, string>;
}

async function loadReview() {
  const [items, recent, catalog, sellers] = await Promise.all([listPendingReview(), listRecentDecisions(), loadCatalog(true), listAllSellers()]);
  const anomalyVariant = await offerVariants(items.filter((i) => i.kind === "anomaly" && i.payload.offerId).map((i) => i.payload.offerId));
  return { items, recent, context: { products: catalog.products, offers: catalog.offers, sellers, anomalyVariant } satisfies Context };
}

const productOf = (products: Product[], variantId?: string) => products.find((p) => p.variants.some((v) => v.id === variantId));

// অফিসিয়াল দাম আর এই দোকান বাদে বাকি দোকানের দামের সীমা: পাশে রেখে বোঝা যায় নতুন অংকটা বিশ্বাসযোগ্য কিনা
function PriceContext({ ctx, variantId, sellerId }: { ctx: Context; variantId?: string; sellerId?: string }) {
  const { t, num } = useAdminI18n();
  const variant = productOf(ctx.products, variantId)?.variants.find((v) => v.id === variantId);
  const prices = ctx.offers.filter((o) => o.variantId === variantId && o.sellerId !== sellerId).map((o) => o.price);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  return (
    <ul className="flex flex-col gap-0.5 text-[13px] text-dim">
      {variant?.officialPrice && <li>{t.admin.review.official(taka(variant.officialPrice))}</li>}
      <li>{prices.length ? t.admin.review.others(low === high ? taka(low) : `${taka(low)} – ${taka(high)}`, num(prices.length)) : t.admin.review.noOthers}</li>
    </ul>
  );
}

function ShopLink({ url, label }: { url?: string; label?: string }) {
  const { t } = useAdminI18n();
  const href = safeUrl(url);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener nofollow" className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
      <ExternalLink size={14} aria-hidden="true" />
      {label ?? t.admin.review.openShop}
    </a>
  );
}

function Choice({ label, hint, tone, disabled, onClick }: { label: string; hint: string; tone: "yes" | "no"; disabled: boolean; onClick: () => void }) {
  return (
    <div className="flex flex-col gap-1">
      <button type="button" disabled={disabled} onClick={onClick} className={tone === "yes" ? primaryButton : secondaryButton}>
        {label}
      </button>
      <span className="max-w-64 text-xs text-dim">{hint}</span>
    </div>
  );
}

function Section({ title, help, count, children }: { title: string; help: string; count: number; children: ReactNode }) {
  const { t } = useAdminI18n();
  return (
    <Panel title={title}>
      <p className="border-b border-line-soft bg-surface-2/50 px-5 py-3 text-sm text-dim">{help}</p>
      {count === 0 ? <p className="px-5 py-4 text-dim">{t.admin.review.empty}</p> : <ul className="divide-y divide-line-soft">{children}</ul>}
    </Panel>
  );
}

function MatchCard({ item, ctx, onDone }: { item: ReviewItem; ctx: Context; onDone: () => void }) {
  const { t, num, ago } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const p = item.payload;
  const product = productOf(ctx.products, p.variantId);
  const [variantId, setVariantId] = useState(p.variantId);
  const label = product?.variants.find((v) => v.id === variantId)?.label ?? "";

  async function decide(approved: boolean) {
    const patch: Record<string, string> = approved && variantId !== p.variantId ? { variantId, guess: `${product?.name ?? ""} ${label}`.trim() } : {};
    if (await run(() => resolveReview(item, approved, patch), approved ? t.admin.review.approved : t.admin.review.rejected)) onDone();
  }

  return (
    <li className="flex flex-col gap-4 px-5 py-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5 rounded-lg border border-line-soft p-3">
          <span className="text-xs font-semibold text-dim">{t.admin.review.shopSide}</span>
          <p className="font-semibold">{p.listing}</p>
          <p className="text-sm">
            {p.seller}: <strong>{taka(p.price)}</strong>
            {p.oldPrice && <span className="text-dim">, {t.admin.review.oldPrice(taka(p.oldPrice))}</span>}
            {p.inStock === "false" && <span className="text-danger">, {t.admin.review.outOfStock}</span>}
          </p>
          <ShopLink url={p.url} />
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-line-soft p-3">
          <span className="text-xs font-semibold text-dim">{t.admin.review.ourSide}</span>
          <p className="font-semibold">{product ? `${product.brand} ${product.name}` : p.guess}</p>
          {product && (
            <Select label={t.admin.review.pickVariant} value={variantId} onChange={(e) => setVariantId(e.target.value)}>
              {product.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </Select>
          )}
          <PriceContext ctx={ctx} variantId={variantId} sellerId={p.sellerId} />
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-2 text-[13px] text-dim">
        {p.confidence && <Badge tone="gold">{t.admin.review.aiGuess(num(p.confidence))}</Badge>}
        {p.reason}
        <span className="text-faint">{t.admin.review.arrived(ago(item.createdAt))}</span>
      </p>
      <div className="flex flex-wrap gap-3">
        <Choice tone="yes" label={t.admin.review.matchYes} hint={t.admin.review.matchYesHint} disabled={busy || !variantId} onClick={() => decide(true)} />
        <Choice tone="no" label={t.admin.review.matchNo} hint={t.admin.review.matchNoHint} disabled={busy} onClick={() => decide(false)} />
      </div>
    </li>
  );
}

function AnomalyCard({ item, ctx, onDone }: { item: ReviewItem; ctx: Context; onDone: () => void }) {
  const { t, ago } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const p = item.payload;
  async function decide(approved: boolean) {
    if (await run(() => resolveReview(item, approved), approved ? t.admin.review.approved : t.admin.review.rejected)) onDone();
  }
  return (
    <li className="flex flex-col gap-3 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold">
          {p.product}, {p.seller}
        </p>
        <Badge tone="gold">
          <EyeOff size={12} aria-hidden="true" className="mr-1 inline" />
          {t.admin.review.hidden}
        </Badge>
      </div>
      <p className="text-lg">{t.admin.review.changed(taka(p.from), taka(p.to))}</p>
      <p className="text-[13px] text-dim">
        {p.reason} <span className="text-faint">{t.admin.review.arrived(ago(item.createdAt))}</span>
      </p>
      <PriceContext ctx={ctx} variantId={ctx.anomalyVariant.get(p.offerId)} sellerId={ctx.offers.find((o) => o.id === p.offerId)?.sellerId} />
      <ShopLink url={p.url} />
      <div className="flex flex-wrap gap-3">
        <Choice tone="yes" label={t.admin.review.anomalyYes(taka(p.to))} hint={t.admin.review.anomalyYesHint} disabled={busy} onClick={() => decide(true)} />
        <Choice tone="no" label={t.admin.review.anomalyNo(taka(p.from))} hint={t.admin.review.anomalyNoHint} disabled={busy} onClick={() => decide(false)} />
      </div>
    </li>
  );
}

function guess(payload: Record<string, string>, products: Product[], sellers: Seller[]) {
  const text = lower(payload.product);
  const product = products.find((p) => p.id === payload.productId) ?? products.find((p) => text.includes(lower(p.name)));
  const variant =
    product?.variants.find((v) => v.id === payload.variantId) ??
    product?.variants.find((v) => Object.values(v.attributes).every((value) => text.includes(lower(value)))) ??
    product?.variants[0];
  const sellerText = lower(payload.seller);
  const seller = sellers.find((s) => sellerText.includes(lower(s.name)) || lower(s.name).includes(sellerText.split(",")[0].trim()));
  return { productId: product?.id ?? "", variantId: variant?.id ?? "", sellerId: seller?.id ?? NEW_SELLER };
}

function SubmissionCard({ item, ctx, onDone }: { item: ReviewItem; ctx: Context; onDone: () => void }) {
  const { t, ago } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const p = item.payload;
  const initial = guess(p, ctx.products, ctx.sellers);
  const [productId, setProductId] = useState(initial.productId);
  const [sellerId, setSellerId] = useState(initial.sellerId);
  const product = ctx.products.find((x) => x.id === productId);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim() || null;
    const price = Number(String(form.get("price")).replace(/\D/g, ""));
    const variantId = text("variant");
    if (!price || !variantId) return;
    const done = await run(async () => {
      const seller =
        sellerId === NEW_SELLER
          ? await saveSeller({ id: "", name: text("sellerName") ?? p.seller, kind: "shop", website: null, phone: text("phone"), whatsapp: null, facebook: null, area: null, verified: false, active: true })
          : sellerId;
      await saveManualOffer({ variantId, sellerId: seller, condition: form.get("condition") as Condition, region: text("region"), price, url: text("url"), source: "user" });
      await resolveReview(item, true);
    }, t.admin.review.applied);
    if (done) onDone();
  }

  async function reject() {
    if (await run(() => resolveReview(item, false), t.admin.review.rejected)) onDone();
  }

  return (
    <li className="flex flex-col gap-3 px-5 py-4">
      <div className="flex flex-col gap-1">
        <p className="font-semibold">
          {p.product}: {taka(p.price)}
        </p>
        <p className="text-sm">
          {p.seller}
          {p.phone && <span className="text-dim">, {t.admin.review.phone(p.phone)}</span>}
        </p>
        <ShopLink url={p.link} label={t.admin.review.openSent} />
        <p className="text-[13px] text-dim">{t.admin.review.sentBy(p.from ?? "", ago(item.createdAt))}</p>
      </div>
      {!ctx.products.length ? (
        <p className="text-sm text-dim">{t.admin.review.noProduct}</p>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-3 rounded-lg border border-line bg-surface-2/50 p-4 md:grid-cols-2">
          <p className="text-sm font-semibold md:col-span-2">{t.admin.review.applyTitle}</p>
          <Select label={t.admin.products.product} value={productId} onChange={(e) => setProductId(e.target.value)} required>
            <option value="">—</option>
            {ctx.products.map((x) => (
              <option key={x.id} value={x.id}>
                {x.brand} {x.name}
              </option>
            ))}
          </Select>
          <Select label={t.admin.products.variant} name="variant" key={productId} defaultValue={productId === initial.productId ? initial.variantId : undefined} required>
            {product?.variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </Select>
          <Select label={t.admin.products.seller} value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
            <option value={NEW_SELLER}>{t.admin.review.newSeller}</option>
            {ctx.sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          {sellerId === NEW_SELLER ? <Field label={t.admin.review.newSellerName} name="sellerName" defaultValue={p.seller} required /> : <span className="hidden md:block" />}
          {sellerId === NEW_SELLER && (
            <>
              <Field label={t.admin.sellers.phone} name="phone" type="tel" defaultValue={p.phone ?? ""} required />
              <p className="self-center text-xs text-dim">{t.admin.review.newSellerNote}</p>
            </>
          )}
          <ConditionSelect category={product?.category} />
          <Field label={t.admin.products.region} name="region" placeholder={t.admin.products.regionPlaceholder} />
          <Field label={t.admin.products.price} name="price" inputMode="numeric" defaultValue={p.price} required />
          <Field label={t.admin.products.url} name="url" type="url" defaultValue={safeUrl(p.link) ?? ""} placeholder="https://" />
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button type="submit" disabled={busy || !product} className={primaryButton}>
              {t.admin.review.submissionYes}
            </button>
            <button type="button" disabled={busy} onClick={reject} className={secondaryButton}>
              {t.admin.review.submissionNo}
            </button>
            {!product && (
              <Link href="/admin/products/" className={`${secondaryButton} inline-flex items-center`}>
                {t.admin.review.noProduct}
              </Link>
            )}
          </div>
        </form>
      )}
    </li>
  );
}

function RecentDecisions({ items, onDone }: { items: ReviewItem[]; onDone: () => void }) {
  const { t, ago } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const title = (item: ReviewItem) => item.payload.listing ?? item.payload.product ?? item.payload.seller ?? "";
  return (
    <Panel title={t.admin.review.recent}>
      {items.length === 0 ? (
        <p className="px-5 py-4 text-dim">{t.admin.review.recentEmpty}</p>
      ) : (
        <ul className="divide-y divide-line-soft">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
              <Badge tone={item.status === "approved" ? "ok" : "neutral"}>{item.status === "approved" ? t.admin.review.decidedYes : t.admin.review.decidedNo}</Badge>
              <span className="min-w-0 flex-1 truncate">{title(item)}</span>
              <span className="text-[13px] text-dim">{item.resolvedAt ? ago(item.resolvedAt) : ""}</span>
              {canUndo(item) ? (
                <button type="button" disabled={busy} onClick={async () => (await run(() => undoReview(item), t.admin.review.undone)) && onDone()} className={`${secondaryButton} inline-flex items-center gap-1.5`}>
                  <Undo2 size={14} aria-hidden="true" />
                  {t.admin.review.undo}
                </button>
              ) : (
                <span className="text-xs text-dim">{t.admin.review.alreadyApplied}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default function ReviewPage() {
  const { t, num } = useAdminI18n();
  const { data, error, loading, reload } = useAsync(loadReview, []);
  if (loading) return <ListSkeleton />;
  if (error || !data) return <ErrorNotice onRetry={reload} />;
  const { items, recent, context } = data;
  const of = (kind: ReviewItem["kind"]) => items.filter((i) => i.kind === kind);
  const [matches, anomalies, submissions] = [of("match"), of("anomaly"), of("submission")];

  return (
    <>
      <PageTitle
        title={t.admin.review.title}
        subtitle={t.admin.review.subtitle}
        action={
          <Link href="/admin/jobs/" className={`${secondaryButton} inline-flex items-center`}>
            {t.admin.review.runNow}
          </Link>
        }
      />
      <div className="flex flex-col gap-6">
        <Section title={t.admin.review.anomalies(num(anomalies.length))} help={t.admin.review.anomaliesHelp} count={anomalies.length}>
          {anomalies.map((item) => (
            <AnomalyCard key={item.id} item={item} ctx={context} onDone={reload} />
          ))}
        </Section>
        <Section title={t.admin.review.matches(num(matches.length))} help={t.admin.review.matchesHelp} count={matches.length}>
          {matches.map((item) => (
            <MatchCard key={item.id} item={item} ctx={context} onDone={reload} />
          ))}
        </Section>
        <Section title={t.admin.review.submissions(num(submissions.length))} help={t.admin.review.submissionsHelp} count={submissions.length}>
          {submissions.map((item) => (
            <SubmissionCard key={item.id} item={item} ctx={context} onDone={reload} />
          ))}
        </Section>
        <RecentDecisions items={recent} onDone={reload} />
      </div>
    </>
  );
}
