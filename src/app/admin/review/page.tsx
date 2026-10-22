"use client";

import { ImageIcon } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Field, Select } from "@/components/admin/Field";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { Badge } from "@/components/ui/Badge";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminAction } from "@/hooks/useAdminAction";
import { useAdminI18n } from "@/hooks/useI18n";
import { saveManualOffer } from "@/services/admin/offers";
import { listPendingReview, resolveReview } from "@/services/admin/review";
import { listAllSellers, saveSeller } from "@/services/admin/sellers";
import { loadCatalog } from "@/services/catalog-live";
import type { ReviewItem } from "@/types/admin";
import type { Condition, Product, Seller } from "@/types/catalog";
import { formatTaka } from "@/utils/format";
import { safeUrl } from "@/utils/url";

const taka = (value?: string) => (value ? formatTaka(Number(value)) : "");

function Actions({ item, yes, no, onDone }: { item: ReviewItem; yes: string; no: string; onDone: () => void }) {
  const { t } = useAdminI18n();
  const { busy, run } = useAdminAction();
  async function decide(approved: boolean) {
    if (await run(() => resolveReview(item, approved), approved ? t.admin.review.approved : t.admin.review.rejected)) onDone();
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy} onClick={() => decide(true)} className={primaryButton}>
        {yes}
      </button>
      <button type="button" disabled={busy} onClick={() => decide(false)} className={secondaryButton}>
        {no}
      </button>
    </div>
  );
}

const NEW_SELLER = "__new";
const lower = (value?: string) => (value ?? "").toLowerCase();

async function loadReview() {
  const [items, { products }, sellers] = await Promise.all([listPendingReview(), loadCatalog(true), listAllSellers()]);
  return { items, products, sellers };
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
  const condition: Condition = /আনঅফিসিয়াল|unofficial/i.test(payload.condition ?? "") ? "unofficial" : /ব্যবহৃত|used/i.test(payload.condition ?? "") ? "used" : "official";
  const region = payload.condition?.match(/\(([^)]+)\)/)?.[1] ?? "";
  return { productId: product?.id ?? "", variantId: variant?.id ?? "", sellerId: seller?.id ?? NEW_SELLER, condition, region };
}

function ApplySubmission({ item, products, sellers, onDone }: { item: ReviewItem; products: Product[]; sellers: Seller[]; onDone: () => void }) {
  const { t } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const initial = guess(item.payload, products, sellers);
  const [productId, setProductId] = useState(initial.productId);
  const [sellerId, setSellerId] = useState(initial.sellerId);
  const product = products.find((p) => p.id === productId);

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
          ? await saveSeller({ id: "", name: text("sellerName") ?? item.payload.seller, kind: "shop", website: null, phone: text("phone"), whatsapp: null, facebook: null, area: null, verified: false, active: true })
          : sellerId;
      await saveManualOffer({ variantId, sellerId: seller, condition: form.get("condition") as Condition, region: text("region"), price, url: text("url"), source: "user" });
      await resolveReview(item, true);
    }, t.admin.review.approved);
    if (done) onDone();
  }

  if (!products.length) return <p className="text-sm text-dim">{t.admin.review.noProduct}</p>;

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-lg border border-line bg-surface-2/50 p-4 md:grid-cols-2">
      <p className="text-sm font-semibold md:col-span-2">{t.admin.review.applyTitle}</p>
      <Select label={t.admin.products.product} value={productId} onChange={(e) => setProductId(e.target.value)} required>
        <option value="">—</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.brand} {p.name}
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
        {sellers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      {sellerId === NEW_SELLER ? (
        <Field label={t.admin.review.newSellerName} name="sellerName" defaultValue={item.payload.seller} required />
      ) : (
        <span className="hidden md:block" />
      )}
      {sellerId === NEW_SELLER && <Field label={t.admin.sellers.phone} name="phone" type="tel" defaultValue={item.payload.phone ?? ""} required />}
      <Select label={t.admin.products.condition} name="condition" defaultValue={initial.condition}>
        {(Object.entries(t.condition) as [Condition, string][]).map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </Select>
      <Field label={t.admin.products.region} name="region" defaultValue={initial.region} placeholder={t.admin.products.regionPlaceholder} />
      <Field label={t.admin.products.price} name="price" inputMode="numeric" defaultValue={item.payload.price} required />
      <Field label={t.admin.products.url} name="url" type="url" defaultValue={safeUrl(item.payload.link) ?? ""} placeholder="https://" />
      <div className="flex flex-wrap gap-2 md:col-span-2">
        <button type="submit" disabled={busy || !product} className={primaryButton}>
          {t.admin.review.submissionYes}
        </button>
        {!product && (
          <Link href="/admin/products/" className={secondaryButton + " inline-flex items-center"}>
            {t.admin.review.noProduct}
          </Link>
        )}
      </div>
    </form>
  );
}

function RejectButton({ item, onDone }: { item: ReviewItem; onDone: () => void }) {
  const { t } = useAdminI18n();
  const { busy, run } = useAdminAction();
  return (
    <button type="button" disabled={busy} onClick={async () => (await run(() => resolveReview(item, false), t.admin.review.rejected)) && onDone()} className={`${secondaryButton} self-start`}>
      {t.admin.review.submissionNo}
    </button>
  );
}

export default function ReviewPage() {
  const { t, num, ago } = useAdminI18n();
  const { data: loaded, error, loading, reload } = useAsync(loadReview, []);
  if (loading) return <ListSkeleton />;
  if (error || !loaded) return <ErrorNotice onRetry={reload} />;
  const data = loaded.items;

  const matches = data.filter((i) => i.kind === "match");
  const anomalies = data.filter((i) => i.kind === "anomaly");
  const submissions = data.filter((i) => i.kind === "submission");

  return (
    <>
      <PageTitle title={t.admin.review.title} subtitle={t.admin.review.subtitle} />
      <div className="flex flex-col gap-6">
        <Panel title={t.admin.review.matches(num(matches.length))}>
          {matches.length === 0 && <p className="px-5 py-4 text-dim">{t.admin.review.noMatches}</p>}
          <ul className="divide-y divide-line-soft">
            {matches.map((item) => (
              <li key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_1fr_auto] md:items-center">
                <div>
                  <p className="font-semibold">{item.payload.listing}</p>
                  <p className="text-[13px] text-dim">{t.admin.review.atSeller(item.payload.seller, taka(item.payload.price))}</p>
                </div>
                <div>
                  <p className="font-semibold">{item.payload.guess}</p>
                  <p className="text-[13px] text-dim">{item.payload.reason}</p>
                  <Badge tone="gold">{t.admin.review.confidence(num(item.payload.confidence))}</Badge>
                </div>
                <Actions item={item} yes={t.admin.review.matchYes} no={t.admin.review.matchNo} onDone={reload} />
              </li>
            ))}
          </ul>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel title={t.admin.review.anomalies(num(anomalies.length))}>
            {anomalies.length === 0 && <p className="px-5 py-4 text-dim">{t.admin.review.empty}</p>}
            <ul className="divide-y divide-line-soft">
              {anomalies.map((item) => (
                <li key={item.id} className="flex flex-col gap-2 px-5 py-4">
                  <p className="font-semibold">
                    {item.payload.product}, {item.payload.seller}
                  </p>
                  <p>
                    <span className="text-dim line-through">{taka(item.payload.from)}</span> {t.admin.review.fromWord}{" "}
                    <strong className="text-gold-text">{taka(item.payload.to)}</strong>
                  </p>
                  <p className="text-[13px] text-dim">{item.payload.reason}</p>
                  <Actions item={item} yes={t.admin.review.anomalyYes} no={t.admin.review.anomalyNo} onDone={reload} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={t.admin.review.submissions(num(submissions.length))}>
            {submissions.length === 0 && <p className="px-5 py-4 text-dim">{t.admin.review.empty}</p>}
            <ul className="divide-y divide-line-soft">
              {submissions.map((item) => (
                <li key={item.id} className="flex gap-4 px-5 py-4">
                  <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-faint">
                    <ImageIcon size={24} aria-hidden="true" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <p className="font-semibold">{item.payload.seller}</p>
                    <p className="text-sm">
                      {item.payload.product}
                      {item.payload.condition ? `, ${item.payload.condition}` : ""}, <strong>{taka(item.payload.price)}</strong>
                    </p>
                    {item.payload.phone && <p className="text-sm">{t.admin.review.phone(item.payload.phone)}</p>}
                    {safeUrl(item.payload.link) && (
                      <a href={safeUrl(item.payload.link)!} target="_blank" rel="noopener nofollow" className="truncate text-sm text-brand">
                        {item.payload.link}
                      </a>
                    )}
                    <p className="text-[13px] text-dim">{t.admin.review.sentBy(item.payload.from, ago(item.createdAt))}</p>
                    <ApplySubmission item={item} products={loaded.products} sellers={loaded.sellers} onDone={reload} />
                    <RejectButton item={item} onDone={reload} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
