"use client";

import { CheckCircle2, Circle, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field, Select, TextArea } from "@/components/admin/Field";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { Toggle } from "@/components/admin/Toggle";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminAction } from "@/hooks/useAdminAction";
import { categoryName } from "@/utils/categories";
import { canonicalRegion } from "@/utils/region";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import type { Messages } from "@/i18n/bn";
import { showToast } from "@/lib/toast";
import { deleteOffer, listOffersFor, updateOffer } from "@/services/admin/offers";
import { deleteProduct, deleteVariant, getProduct, saveVariant, updateProduct } from "@/services/admin/products";
import { listAllSellers } from "@/services/admin/sellers";
import type { Axis, Offer, Product, Variant, VariantAttributes } from "@/types/catalog";
import { telLink } from "@/utils/format";
import { specsToText, textToSpecs } from "@/utils/specs";
import { variantLabel } from "@/utils/variants";

const iconButton = "flex size-10 items-center justify-center rounded-xl border border-line text-dim hover:border-brand hover:text-brand";
const toPrice = (value: FormDataEntryValue | null) => Number(String(value ?? "").replace(/\D/g, "")) || null;

async function loadEditor(id: string) {
  const [product, sellers] = await Promise.all([getProduct(id), listAllSellers()]);
  const offers = product ? await listOffersFor(product.variants.map((v) => v.id)) : [];
  return { product, offers, sellers: new Map(sellers.map((s) => [s.id, s])) };
}

const splitList = (value: FormDataEntryValue | null, separator: RegExp) =>
  String(value ?? "")
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);

function DetailsForm({ product, onSaved }: { product: Product; onSaved: () => void }) {
  const { t, lang } = useAdminI18n();
  const { categories } = useAdminCategories();
  const { busy, run } = useAdminAction();
  const [images, setImages] = useState((product.images ?? []).join("\n"));
  const previews = images.split("\n").map((line) => line.trim()).filter(Boolean);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim() || null;
    const saved = await run(
      () =>
        updateProduct(product, {
          brand: String(form.get("brand")).trim(),
          name: String(form.get("name")).trim(),
          category: String(form.get("category")),
          releaseYear: Number(form.get("year")) || null,
          popularity: Number(form.get("popularity")) || 0,
          images: previews,
          colors: splitList(form.get("colors"), /,/),
          regions: [...new Set(splitList(form.get("regions"), /,/).map(canonicalRegion).filter((r): r is string => Boolean(r)))],
          description: text("description"),
          descriptionEn: text("descriptionEn"),
          specs: textToSpecs(String(form.get("specs") ?? "")),
          specsSource: text("specsSource"),
          active: form.get("active") === "on",
        }),
      t.admin.common.saved,
    );
    if (saved) onSaved();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <Panel title={t.admin.editor.detailsTitle}>
        <div className="grid gap-4 p-5 md:grid-cols-3">
          <Field label={t.admin.products.brand} name="brand" defaultValue={product.brand} required />
          <Field label={t.admin.products.model} name="name" defaultValue={product.name} required />
          <Select label={t.admin.products.category} name="category" defaultValue={product.category}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {categoryName(c, lang)}
              </option>
            ))}
          </Select>
          <Field label={t.admin.products.year} name="year" type="number" defaultValue={product.releaseYear ?? ""} />
          <Field label={t.admin.editor.popularity} name="popularity" type="number" min={0} max={100} defaultValue={product.popularity} hint={t.admin.editor.popularityHint} />
          <label className="flex items-start gap-3 text-sm md:col-span-3">
            <input type="checkbox" name="active" defaultChecked={product.active !== false} className="mt-0.5 size-4 accent-[var(--color-brand)]" />
            <span className="flex flex-col gap-0.5">
              <span className="font-semibold">{t.admin.editor.showOnSite}</span>
              <span className="text-xs text-dim">{t.admin.editor.showOnSiteHint}</span>
            </span>
          </label>
        </div>
      </Panel>

      <Panel title={t.admin.editor.mediaTitle}>
        <div className="flex flex-col gap-4 p-5">
          <TextArea label={t.admin.editor.images} value={images} onChange={(e) => setImages(e.target.value)} hint={t.admin.editor.imagesHint} placeholder="https://" rows={4} />
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <span key={src + i} className={`flex size-20 items-center justify-center overflow-hidden rounded-lg border bg-white p-1.5 ${i === 0 ? "border-brand" : "border-line"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="size-full object-contain" />
                </span>
              ))}
            </div>
          )}
        </div>
      </Panel>

      <Panel title={t.admin.editor.varietyTitle}>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label={t.admin.editor.colors} name="colors" defaultValue={(product.colors ?? []).join(", ")} hint={t.admin.editor.colorsHint} />
          <Field label={t.admin.editor.regions} name="regions" defaultValue={(product.regions ?? []).join(", ")} hint={t.admin.editor.regionsHint} />
        </div>
      </Panel>

      <Panel title={t.admin.editor.specsTitle}>
        <div className="flex flex-col gap-4 p-5">
          <TextArea
            label={t.admin.editor.specsField}
            name="specs"
            defaultValue={specsToText(product.specs ?? [])}
            hint={t.admin.editor.specsHint}
            placeholder={"Display\nSize | 6.3 inch\nType | OLED\n\nBattery\nCapacity | 5000mAh"}
            rows={16}
            className="font-mono text-[13px]"
          />
          <Field label={t.admin.editor.specsSource} name="specsSource" type="url" defaultValue={product.specsSource ?? ""} hint={t.admin.editor.specsSourceHint} placeholder="https://" />
        </div>
      </Panel>

      <Panel title={t.admin.editor.descriptionTitle}>
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          <TextArea label={t.admin.editor.description} name="description" defaultValue={product.description ?? ""} rows={5} />
          <TextArea label={t.admin.editor.descriptionEn} name="descriptionEn" defaultValue={product.descriptionEn ?? ""} rows={5} />
        </div>
      </Panel>

      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end border-t border-line bg-page/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <button type="submit" disabled={busy} className={primaryButton}>
          {t.admin.common.save}
        </button>
      </div>
    </form>
  );
}

function VariantRow({ product, variant, axes, onChange }: { product: Product; variant: Variant; axes: Axis[]; onChange: () => void }) {
  const { t } = useAdminI18n();
  const { busy, run } = useAdminAction();
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const el = event.currentTarget;
    const form = new FormData(el);
    const saved = await run(
      () => {
        const attributes: VariantAttributes = Object.fromEntries(axes.map((axis) => [axis, String(form.get(axis) ?? "").trim()]).filter(([, value]) => value));
        const label = String(form.get("label") ?? "").trim() || variantLabel(attributes, axes);
        if (!label) throw new Error("label");
        const sku = String(form.get("sku") ?? "").trim() || null;
        return saveVariant(product, { ...variant, label, attributes, sku, officialPrice: toPrice(form.get("price")) });
      },
      variant.id ? t.admin.editor.variantSaved : t.admin.editor.variantAdded,
    );
    if (!saved) return;
    if (!variant.id) el.reset();
    onChange();
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3 px-5 py-3">
      {axes.map((axis) => (
        <div key={axis} className="w-32">
          <Field label={t.axis[axis]} name={axis} defaultValue={variant.attributes[axis] ?? ""} />
        </div>
      ))}
      <div className="min-w-48 flex-1">
        <Field label={t.admin.editor.variantLabel} name="label" defaultValue={variant.label} required={!axes.length} placeholder={axes.length ? t.admin.editor.variantLabelAuto : undefined} />
      </div>
      <div className="w-32">
        <Field label={t.admin.editor.sku} name="sku" defaultValue={variant.sku ?? ""} />
      </div>
      <div className="w-40">
        <Field label={t.admin.editor.officialPrice} name="price" inputMode="numeric" defaultValue={variant.officialPrice ?? ""} />
      </div>
      <button type="submit" disabled={busy} className={variant.id ? secondaryButton : primaryButton}>
        {variant.id ? t.admin.editor.saveShort : t.admin.editor.add}
      </button>
      {variant.id && (
        <button
          type="button"
          aria-label={`${variant.label} ${t.admin.common.delete}`}
          className={iconButton}
          disabled={busy}
          onClick={async () => {
            if (!confirm(t.admin.editor.confirmDeleteVariant(variant.label))) return;
            if (await run(() => deleteVariant(product, variant), t.admin.editor.variantDeleted)) onChange();
          }}
        >
          <Trash2 size={17} aria-hidden="true" />
        </button>
      )}
    </form>
  );
}

function OfferRow({ offer, seller, phone, website, onChange }: { offer: Offer; seller: string; phone: string | null; website: string | null; onChange: () => void }) {
  const { t } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const [price, setPrice] = useState(String(offer.price));
  const [url, setUrl] = useState(offer.url ?? "");
  const [region, setRegion] = useState(offer.region ?? "");
  return (
    <tr>
      <td className="px-5 py-3">
        <div className="flex flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-1.5 font-semibold">
            {offer.url ? (
              <a href={offer.url} target="_blank" rel="noopener nofollow" title={t.admin.editor.sourceLink} className="inline-flex items-center gap-1.5 hover:text-brand">
                {seller}
                <ExternalLink size={13} className="text-faint" aria-hidden="true" />
              </a>
            ) : (
              seller
            )}
            {offer.condition !== "official" && (
              <span className="rounded bg-gold-soft px-1.5 py-0.5 text-[11px] font-bold text-gold-text">
                {t.condition[offer.condition as keyof Messages["condition"]]}
                {offer.region ? ` (${offer.region})` : ""}
              </span>
            )}
          </span>
          <label className="sr-only" htmlFor={`url-${offer.id}`}>
            {t.admin.products.url}
          </label>
          <input
            id={`url-${offer.id}`}
            type="url"
            value={url}
            placeholder="https://"
            onChange={(e) => setUrl(e.target.value)}
            onBlur={async () => {
              const next = url.trim() || null;
              if (next === offer.url) return;
              if (await run(() => updateOffer(offer, { url: next }))) onChange();
            }}
            className="h-9 w-full min-w-40 max-w-56 rounded-lg border border-line bg-surface px-2 text-[13px] outline-none focus:border-brand"
          />
          <label className="flex items-center gap-2 text-[13px] text-dim">
            {t.admin.products.region}
            <input
              value={region}
              list="offer-regions"
              placeholder={t.admin.products.regionPlaceholder}
              onChange={(e) => setRegion(e.target.value)}
              onBlur={async () => {
                const next = region.trim() || null;
                if (next === offer.region) return;
                if (await run(() => updateOffer(offer, { region: next }), t.admin.editor.offerUpdated)) onChange();
              }}
              className="h-8 w-28 rounded-lg border border-line bg-surface px-2 text-[13px] text-ink outline-none focus:border-brand"
            />
          </label>
          {!offer.url &&
            (phone ? (
              <a href={telLink(phone)} className="text-[13px] font-semibold text-brand">
                {phone}
              </a>
            ) : website ? (
              <a href={website} target="_blank" rel="noopener nofollow" className="text-[13px] text-dim hover:text-brand">
                {website.replace(/^https?:\/\//, "").replace(/\/+$/, "")}
              </a>
            ) : (
              <span className="text-[13px] font-semibold text-gold-text">{t.admin.editor.noContact}</span>
            ))}
        </div>
      </td>
      <td className="px-3 py-3">
        <label className="sr-only" htmlFor={`price-${offer.id}`}>
          {t.admin.editor.priceAria}
        </label>
        <input
          id={`price-${offer.id}`}
          value={price}
          inputMode="numeric"
          onChange={(e) => setPrice(e.target.value)}
          onBlur={async () => {
            const next = Number(price.replace(/\D/g, ""));
            if (!price.trim() || next === offer.price) return;
            if (!next) {
              setPrice(String(offer.price));
              showToast(t.admin.products.priceInvalid);
              return;
            }
            if (await run(() => updateOffer(offer, { price: next }), t.admin.editor.offerUpdated)) onChange();
          }}
          className="h-10 w-28 rounded-lg border border-line bg-surface px-2 outline-none focus:border-brand"
        />
      </td>
      <td className="px-3 py-3">
        <select
          aria-label={t.admin.editor.stockAria}
          value={offer.inStock === null ? "" : String(offer.inStock)}
          onChange={async (e) => {
            if (await run(() => updateOffer(offer, { inStock: e.target.value === "" ? null : e.target.value === "true" }))) onChange();
          }}
          className="h-10 rounded-lg border border-line bg-surface px-2"
        >
          <option value="">{t.admin.editor.stockUnknown}</option>
          <option value="true">{t.admin.editor.stockYes}</option>
          <option value="false">{t.admin.editor.stockNo}</option>
        </select>
      </td>
      <td className="px-3 py-3">
        <Toggle
          label={t.admin.editor.publishAria}
          checked={offer.published}
          disabled={busy}
          onChange={async (published) => {
            if (await run(() => updateOffer(offer, { published }))) onChange();
          }}
        />
      </td>
      <td className="px-5 py-3 text-right">
        <button
          type="button"
          aria-label={t.admin.editor.deleteOfferAria}
          className={iconButton}
          disabled={busy}
          onClick={async () => {
            if (!confirm(t.admin.editor.confirmDeleteOffer)) return;
            if (await run(() => deleteOffer(offer), t.admin.common.deleted)) onChange();
          }}
        >
          <Trash2 size={17} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}

export function ProductEditor() {
  const { t } = useAdminI18n();
  const { categories } = useAdminCategories();
  const { run } = useAdminAction();
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const { data, loading, error, reload } = useAsync(() => loadEditor(id), [id]);

  if (loading) return <ListSkeleton />;
  if (error) return <ErrorNotice onRetry={reload} />;
  if (!data?.product) {
    return (
      <p>
        {t.admin.editor.notFound} <Link href="/admin/products/" className="font-semibold text-brand">{t.admin.editor.backToList}</Link>
      </p>
    );
  }
  const { product, offers, sellers } = data;
  const categoryAxes = categories.find((c) => c.slug === product.category)?.axes ?? [];
  const axes: Axis[] = categoryAxes.includes("color") ? categoryAxes : [...categoryAxes, "color"];

  return (
    <>
      <PageTitle
        title={`${product.brand} ${product.name}`}
        action={
          <div className="flex gap-2">
            <a href={`/product/${product.slug}/`} target="_blank" className={secondaryButton + " flex items-center"}>
              {t.admin.editor.viewOnSite}
            </a>
            <button
              type="button"
              className="h-10 rounded-xl border border-danger px-4 text-sm font-bold text-danger"
              onClick={async () => {
                if (!confirm(t.admin.editor.confirmDeleteProduct(product.name))) return;
                if (await run(() => deleteProduct(product), t.admin.editor.productDeleted)) router.push("/admin/products/");
              }}
            >
              {t.admin.editor.deleteProduct}
            </button>
          </div>
        }
      />
      <datalist id="offer-regions">
        {[...new Set([...(product.regions ?? []), ...offers.map((o) => o.region).filter((r): r is string => Boolean(r)), "USA", "Japan", "Singapore", "Hong Kong", "Australia", "UAE", "India", "Global"])].map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
      <div className="flex flex-col gap-6">
        <Panel title={t.admin.editor.checklist}>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 px-5 py-4 text-sm">
            {[
              { key: "images", done: Boolean(product.images?.length) },
              { key: "specs", done: Boolean(product.specs?.length) },
              { key: "description", done: Boolean(product.description || product.descriptionEn) },
              { key: "officialPrice", done: product.variants.some((v) => v.officialPrice) },
              { key: "offers", done: offers.length > 0 },
            ].map(({ key, done }) => (
              <li key={key} className={`flex items-center gap-1.5 ${done ? "text-ok" : "text-dim"}`}>
                {done ? <CheckCircle2 size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
                {t.admin.editor.checks[key as keyof typeof t.admin.editor.checks]}
              </li>
            ))}
          </ul>
        </Panel>
        <DetailsForm key={product.id + product.name} product={product} onSaved={reload} />

        <Panel title={t.admin.editor.variantsTitle}>
          <div className="divide-y divide-line-soft">
            {product.variants.map((variant) => (
              <VariantRow key={variant.id} product={product} variant={variant} axes={axes} onChange={reload} />
            ))}
            <VariantRow product={product} variant={{ id: "", label: "", attributes: {}, officialPrice: null }} axes={axes} onChange={reload} />
          </div>
        </Panel>

        {product.variants.map((variant) => {
          const rows = offers.filter((o) => o.variantId === variant.id);
          return (
            <Panel key={variant.id} title={t.admin.editor.offersTitle(variant.label)}>
              {rows.length === 0 ? (
                <p className="px-5 py-4 text-dim">
                  {t.admin.editor.noOffers}{" "}
                  <Link href="/admin/products/" className="font-semibold text-brand">
                    {t.admin.editor.setManually}
                  </Link>
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-[15px]">
                    <thead className="text-[13px] text-dim">
                      <tr>
                        <th className="px-5 py-3 font-semibold">{t.admin.editor.colSeller}</th>
                        <th className="px-3 py-3 font-semibold">{t.admin.editor.colPrice}</th>
                        <th className="px-3 py-3 font-semibold">{t.admin.editor.colStock}</th>
                        <th className="px-3 py-3 font-semibold">{t.admin.editor.colPublished}</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-soft">
                      {rows.map((offer) => {
                        const s = sellers.get(offer.sellerId);
                        return <OfferRow key={offer.id} offer={offer} seller={s?.name ?? ""} phone={s?.phone ?? null} website={s?.website ?? null} onChange={reload} />;
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          );
        })}
      </div>
    </>
  );
}
