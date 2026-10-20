"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field, Select } from "@/components/admin/Field";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { Toggle } from "@/components/admin/Toggle";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { CATEGORIES, CONDITION_LABEL } from "@/config/site";
import { useAsync } from "@/hooks/useAsync";
import { showToast } from "@/lib/toast";
import { deleteOffer, listOffersFor, updateOffer } from "@/services/admin/offers";
import { deleteProduct, deleteVariant, saveVariant, updateProduct } from "@/services/admin/products";
import { listAllSellers } from "@/services/admin/sellers";
import { loadCatalog } from "@/services/catalog";
import type { Category, Offer, Product, Variant } from "@/types/catalog";

const iconButton = "flex size-10 items-center justify-center rounded-xl border border-line text-dim hover:border-brand hover:text-brand";
const toPrice = (value: FormDataEntryValue | null) => Number(String(value ?? "").replace(/\D/g, "")) || null;

async function loadEditor(id: string) {
  const [{ products }, sellers] = await Promise.all([loadCatalog(true), listAllSellers()]);
  const product = products.find((p) => p.id === id) ?? null;
  const offers = product ? await listOffersFor(product.variants.map((v) => v.id)) : [];
  return { product, offers, sellers: new Map(sellers.map((s) => [s.id, s.name])) };
}

function DetailsForm({ product, onSaved }: { product: Product; onSaved: () => void }) {
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await updateProduct(product, {
      brand: String(form.get("brand")).trim(),
      name: String(form.get("name")).trim(),
      category: form.get("category") as Category,
      releaseYear: Number(form.get("year")) || null,
      popularity: Number(form.get("popularity")) || 0,
    });
    showToast("সেভ হলো");
    onSaved();
  }
  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-5 md:grid-cols-3">
      <Field label="ব্র্যান্ড" name="brand" defaultValue={product.brand} required />
      <Field label="মডেল" name="name" defaultValue={product.name} required />
      <Select label="ভাগ" name="category" defaultValue={product.category}>
        {CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </Select>
      <Field label="বাজারে আসার সাল" name="year" type="number" defaultValue={product.releaseYear ?? ""} />
      <Field label="জনপ্রিয়তা (০-১০০)" name="popularity" type="number" min={0} max={100} defaultValue={product.popularity} hint="বেশি হলে হোম পেজে আগে দেখায়" />
      <button type="submit" className={`${primaryButton} self-end`}>
        সেভ করুন
      </button>
    </form>
  );
}

function VariantRow({ product, variant, onChange }: { product: Product; variant: Variant; onChange: () => void }) {
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await saveVariant(product, { ...variant, label: String(form.get("label")).trim(), officialPrice: toPrice(form.get("price")) });
    showToast(variant.id ? "ভার্সন সেভ হলো" : "ভার্সন যোগ হলো");
    if (!variant.id) event.currentTarget.reset();
    onChange();
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3 px-5 py-3">
      <div className="min-w-48 flex-1">
        <Field label="ভার্সন" name="label" defaultValue={variant.label} required />
      </div>
      <div className="w-40">
        <Field label="অফিসিয়াল দাম" name="price" inputMode="numeric" defaultValue={variant.officialPrice ?? ""} />
      </div>
      <button type="submit" className={variant.id ? secondaryButton : primaryButton}>
        {variant.id ? "সেভ" : "যোগ করুন"}
      </button>
      {variant.id && (
        <button
          type="button"
          aria-label={`${variant.label} মুছুন`}
          className={iconButton}
          onClick={async () => {
            if (!confirm(`${variant.label} আর এর সব দাম মুছে ফেলবেন?`)) return;
            await deleteVariant(product, variant);
            showToast("ভার্সন মুছে ফেলা হলো");
            onChange();
          }}
        >
          <Trash2 size={17} aria-hidden="true" />
        </button>
      )}
    </form>
  );
}

function OfferRow({ offer, seller, onChange }: { offer: Offer; seller: string; onChange: () => void }) {
  const [price, setPrice] = useState(String(offer.price));
  return (
    <tr>
      <td className="px-5 py-3 font-semibold">{seller}</td>
      <td className="px-3 py-3 text-[13px] text-dim">
        {CONDITION_LABEL[offer.condition]}
        {offer.region ? ` (${offer.region})` : ""}
      </td>
      <td className="px-3 py-3">
        <label className="sr-only" htmlFor={`price-${offer.id}`}>
          দাম
        </label>
        <input
          id={`price-${offer.id}`}
          value={price}
          inputMode="numeric"
          onChange={(e) => setPrice(e.target.value)}
          onBlur={async () => {
            const next = Number(price.replace(/\D/g, ""));
            if (!next || next === offer.price) return;
            await updateOffer(offer, { price: next });
            showToast("দাম বদলানো হলো");
            onChange();
          }}
          className="h-10 w-28 rounded-lg border border-line bg-surface px-2 outline-none focus:border-brand"
        />
      </td>
      <td className="px-3 py-3">
        <select
          aria-label="স্টক"
          value={offer.inStock === null ? "" : String(offer.inStock)}
          onChange={async (e) => {
            await updateOffer(offer, { inStock: e.target.value === "" ? null : e.target.value === "true" });
            onChange();
          }}
          className="h-10 rounded-lg border border-line bg-surface px-2"
        >
          <option value="">জানা নেই</option>
          <option value="true">আছে</option>
          <option value="false">নেই</option>
        </select>
      </td>
      <td className="px-3 py-3">
        <Toggle
          label="সাইটে দেখান"
          checked={offer.published}
          onChange={async (published) => {
            await updateOffer(offer, { published });
            onChange();
          }}
        />
      </td>
      <td className="px-5 py-3 text-right">
        <button
          type="button"
          aria-label="দামটা মুছুন"
          className={iconButton}
          onClick={async () => {
            if (!confirm("এই দামটা মুছে ফেলবেন?")) return;
            await deleteOffer(offer);
            showToast("মুছে ফেলা হলো");
            onChange();
          }}
        >
          <Trash2 size={17} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}

export function ProductEditor() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const { data, loading, error, reload } = useAsync(() => loadEditor(id), [id]);

  if (loading) return <ListSkeleton />;
  if (error) return <ErrorNotice onRetry={reload} />;
  if (!data?.product) {
    return (
      <p>
        পণ্যটা পাওয়া যায়নি। <Link href="/admin/products/" className="font-semibold text-brand">তালিকায় ফিরুন</Link>
      </p>
    );
  }
  const { product, offers, sellers } = data;

  return (
    <>
      <PageTitle
        title={`${product.brand} ${product.name}`}
        action={
          <div className="flex gap-2">
            <a href={`/product/${product.slug}/`} target="_blank" className={secondaryButton + " flex items-center"}>
              সাইটে দেখুন
            </a>
            <button
              type="button"
              className="h-10 rounded-xl border border-danger px-4 text-sm font-bold text-danger"
              onClick={async () => {
                if (!confirm(`${product.name} আর এর সব দাম মুছে ফেলবেন?`)) return;
                await deleteProduct(product);
                showToast("পণ্য মুছে ফেলা হলো");
                router.push("/admin/products/");
              }}
            >
              পণ্য মুছুন
            </button>
          </div>
        }
      />
      <div className="flex flex-col gap-6">
        <Panel title="তথ্য">
          <DetailsForm key={product.id + product.name} product={product} onSaved={reload} />
        </Panel>

        <Panel title="ভার্সন">
          <div className="divide-y divide-line-soft">
            {product.variants.map((variant) => (
              <VariantRow key={variant.id} product={product} variant={variant} onChange={reload} />
            ))}
            <VariantRow product={product} variant={{ id: "", label: "", officialPrice: null }} onChange={reload} />
          </div>
        </Panel>

        {product.variants.map((variant) => {
          const rows = offers.filter((o) => o.variantId === variant.id);
          return (
            <Panel key={variant.id} title={`${variant.label} এর দাম`}>
              {rows.length === 0 ? (
                <p className="px-5 py-4 text-dim">
                  এখনো কোনো দাম নেই। <Link href="/admin/products/" className="font-semibold text-brand">হাতে দাম বসান</Link>
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-[15px]">
                    <thead className="text-[13px] text-dim">
                      <tr>
                        <th className="px-5 py-3 font-semibold">বিক্রেতা</th>
                        <th className="px-3 py-3 font-semibold">কেমন</th>
                        <th className="px-3 py-3 font-semibold">দাম</th>
                        <th className="px-3 py-3 font-semibold">স্টক</th>
                        <th className="px-3 py-3 font-semibold">সাইটে</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-soft">
                      {rows.map((offer) => (
                        <OfferRow key={offer.id} offer={offer} seller={sellers.get(offer.sellerId) ?? ""} onChange={reload} />
                      ))}
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
