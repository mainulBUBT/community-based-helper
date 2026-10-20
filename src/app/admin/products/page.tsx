"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Field, Select, TextArea } from "@/components/admin/Field";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useAdminI18n } from "@/hooks/useI18n";
import { showToast } from "@/lib/toast";
import { saveManualOffer } from "@/services/admin/offers";
import { createProduct } from "@/services/admin/products";
import { listAllSellers } from "@/services/admin/sellers";
import { listSummaries } from "@/services/catalog";
import type { Category, Condition } from "@/types/catalog";
import { formatTaka } from "@/utils/format";

async function loadData() {
  const [summaries, sellers] = await Promise.all([listSummaries(), listAllSellers()]);
  return { summaries, sellers };
}

function parseVariants(text: string) {
  return text
    .split("\n")
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter(([label]) => label)
    .map(([label, price]) => ({ label, officialPrice: price ? Number(price.replace(/\D/g, "")) || null : null }));
}

function ProductForm({ onDone }: { onDone: () => void }) {
  const { t } = useAdminI18n();
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const variants = parseVariants(String(form.get("variants")));
    if (!variants.length) {
      showToast(t.admin.products.needVariant);
      return;
    }
    try {
      await createProduct({
        brand: String(form.get("brand")).trim(),
        name: String(form.get("name")).trim(),
        category: form.get("category") as Category,
        releaseYear: Number(form.get("year")) || null,
        variants,
      });
      showToast(t.admin.products.added);
      onDone();
    } catch {
      showToast(t.admin.products.addFailed);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-5 md:grid-cols-2">
      <Field label={t.admin.products.brand} name="brand" required placeholder="Samsung" />
      <Field label={t.admin.products.model} name="name" required placeholder="Galaxy A17 5G" />
      <Select label={t.admin.products.category} name="category" defaultValue="mobile">
        {(Object.keys(t.category) as Category[]).map((id) => (
          <option key={id} value={id}>
            {t.category[id].label}
          </option>
        ))}
      </Select>
      <Field label={t.admin.products.year} name="year" type="number" placeholder="2026" />
      <div className="md:col-span-2">
        <TextArea label={t.admin.products.variants} name="variants" required placeholder={"6GB / 128GB | 39999\n8GB / 128GB | 43499"} hint={t.admin.products.variantsHint} />
      </div>
      <button type="submit" className={`${primaryButton} justify-self-start`}>
        {t.admin.products.add}
      </button>
    </form>
  );
}

function ManualPriceForm({ data, onDone }: { data: Awaited<ReturnType<typeof loadData>>; onDone: () => void }) {
  const { t } = useAdminI18n();
  const [productId, setProductId] = useState(data.summaries[0]?.product.id ?? "");
  const product = data.summaries.find((s) => s.product.id === productId)?.product;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const price = Number(String(form.get("price")).replace(/\D/g, ""));
    if (!price) {
      showToast(t.admin.products.priceInvalid);
      return;
    }
    try {
      await saveManualOffer({
        variantId: String(form.get("variant")),
        sellerId: String(form.get("seller")),
        condition: form.get("condition") as Condition,
        region: String(form.get("region") ?? "").trim() || null,
        price,
        url: String(form.get("url") ?? "").trim() || null,
      });
      showToast(t.admin.products.priceSet);
      onDone();
    } catch {
      showToast(t.admin.products.priceFailed);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-5 md:grid-cols-3">
      <Select label={t.admin.products.product} value={productId} onChange={(e) => setProductId(e.target.value)}>
        {data.summaries.map(({ product: p }) => (
          <option key={p.id} value={p.id}>
            {p.brand} {p.name}
          </option>
        ))}
      </Select>
      <Select label={t.admin.products.variant} name="variant" key={productId}>
        {product?.variants.map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </Select>
      <Select label={t.admin.products.seller} name="seller">
        {data.sellers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <Select label={t.admin.products.condition} name="condition" defaultValue="official">
        {(Object.entries(t.condition) as [Condition, string][]).map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </Select>
      <Field label={t.admin.products.region} name="region" placeholder={t.admin.products.regionPlaceholder} />
      <Field label={t.admin.products.price} name="price" inputMode="numeric" required />
      <div className="md:col-span-2">
        <Field label={t.admin.products.url} name="url" type="url" placeholder="https://" />
      </div>
      <button type="submit" className={`${primaryButton} self-end`}>
        {t.admin.products.setPrice}
      </button>
    </form>
  );
}

export default function ProductsAdminPage() {
  const { t, num } = useAdminI18n();
  const { data, loading, reload } = useAsync(loadData, []);
  const [adding, setAdding] = useState(false);
  if (loading || !data) return <ListSkeleton />;

  return (
    <>
      <PageTitle
        title={t.admin.products.title}
        action={
          <button type="button" onClick={() => setAdding((v) => !v)} className={adding ? secondaryButton : primaryButton}>
            {adding ? t.admin.products.hideForm : t.admin.products.new}
          </button>
        }
      />
      <div className="flex flex-col gap-6">
        {adding && (
          <Panel title={t.admin.products.newTitle}>
            <ProductForm
              onDone={() => {
                setAdding(false);
                reload();
              }}
            />
          </Panel>
        )}
        <Panel title={t.admin.products.manualTitle}>
          <ManualPriceForm data={data} onDone={reload} />
        </Panel>
        <Panel title={t.admin.products.all(num(data.summaries.length))}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[15px]">
              <thead className="text-[13px] text-dim">
                <tr>
                  <th className="px-5 py-3 font-semibold">{t.admin.products.colProduct}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.products.colVariants}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.products.colStores}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.products.colLowest}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {data.summaries.map(({ product, lowest, sellerCount }) => (
                  <tr key={product.id}>
                    <td className="px-5 py-3">
                      <Link href={`/admin/products/edit/?id=${product.id}`} className="font-semibold hover:text-brand">
                        {product.brand} {product.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-[13px] text-dim">{product.variants.map((v) => v.label).join(", ")}</td>
                    <td className="px-3 py-3">{num(sellerCount)}</td>
                    <td className="px-3 py-3 font-semibold">{lowest ? formatTaka(lowest) : t.admin.products.none}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/product/${product.slug}/`}
                          target="_blank"
                          rel="noopener"
                          title={t.admin.editor.viewOnSite}
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-dim hover:border-brand hover:text-brand"
                        >
                          <ExternalLink size={16} aria-hidden="true" />
                          <span className="sr-only">{t.admin.editor.viewOnSite}</span>
                        </a>
                        <Link href={`/admin/products/edit/?id=${product.id}`} className={secondaryButton + " inline-flex items-center"}>
                          {t.admin.common.edit}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
