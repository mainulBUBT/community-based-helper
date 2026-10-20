"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Field, Select, TextArea } from "@/components/admin/Field";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { CATEGORIES, CONDITION_LABEL } from "@/config/site";
import { useAsync } from "@/hooks/useAsync";
import { showToast } from "@/lib/toast";
import { saveManualOffer } from "@/services/admin/offers";
import { createProduct } from "@/services/admin/products";
import { listAllSellers } from "@/services/admin/sellers";
import { listSummaries } from "@/services/catalog";
import type { Category, Condition } from "@/types/catalog";
import { formatTaka, toBnDigits } from "@/utils/format";

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
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const variants = parseVariants(String(form.get("variants")));
    if (!variants.length) {
      showToast("অন্তত একটা ভার্সন দিন");
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
      showToast("পণ্য যোগ হলো");
      onDone();
    } catch {
      showToast("যোগ করা গেল না");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-5 md:grid-cols-2">
      <Field label="ব্র্যান্ড" name="brand" required placeholder="Samsung" />
      <Field label="মডেল" name="name" required placeholder="Galaxy A17 5G" />
      <Select label="ভাগ" name="category" defaultValue="mobile">
        {CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </Select>
      <Field label="বাজারে আসার সাল" name="year" type="number" placeholder="2026" />
      <div className="md:col-span-2">
        <TextArea label="ভার্সন" name="variants" required placeholder={"6GB / 128GB | 39999\n8GB / 128GB | 43499"} hint="প্রতি লাইনে একটা ভার্সন। | এর পরে অফিসিয়াল দাম, না জানলে খালি রাখুন।" />
      </div>
      <button type="submit" className={`${primaryButton} justify-self-start`}>
        পণ্য যোগ করুন
      </button>
    </form>
  );
}

function ManualPriceForm({ data, onDone }: { data: Awaited<ReturnType<typeof loadData>>; onDone: () => void }) {
  const [productId, setProductId] = useState(data.summaries[0]?.product.id ?? "");
  const product = data.summaries.find((s) => s.product.id === productId)?.product;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await saveManualOffer({
        variantId: String(form.get("variant")),
        sellerId: String(form.get("seller")),
        condition: form.get("condition") as Condition,
        region: String(form.get("region") ?? "").trim() || null,
        price: Number(String(form.get("price")).replace(/\D/g, "")),
        url: String(form.get("url") ?? "").trim() || null,
      });
      showToast("দাম বসানো হলো");
      onDone();
    } catch {
      showToast("দাম বসানো গেল না");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-5 md:grid-cols-3">
      <Select label="পণ্য" value={productId} onChange={(e) => setProductId(e.target.value)}>
        {data.summaries.map(({ product: p }) => (
          <option key={p.id} value={p.id}>
            {p.brand} {p.name}
          </option>
        ))}
      </Select>
      <Select label="ভার্সন" name="variant" key={productId}>
        {product?.variants.map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </Select>
      <Select label="বিক্রেতা" name="seller">
        {data.sellers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <Select label="কেমন" name="condition" defaultValue="official">
        {Object.entries(CONDITION_LABEL).map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </Select>
      <Field label="কোন দেশের (থাকলে)" name="region" placeholder="USA" />
      <Field label="দাম (টাকা)" name="price" inputMode="numeric" required />
      <div className="md:col-span-2">
        <Field label="লিংক (থাকলে)" name="url" type="url" placeholder="https://" />
      </div>
      <button type="submit" className={`${primaryButton} self-end`}>
        দাম বসান
      </button>
    </form>
  );
}

export default function ProductsAdminPage() {
  const { data, loading, reload } = useAsync(loadData, []);
  const [adding, setAdding] = useState(false);
  if (loading || !data) return <ListSkeleton />;

  return (
    <>
      <PageTitle
        title="পণ্য ও দাম"
        action={
          <button type="button" onClick={() => setAdding((v) => !v)} className={adding ? secondaryButton : primaryButton}>
            {adding ? "বন্ধ করুন" : "নতুন পণ্য"}
          </button>
        }
      />
      <div className="flex flex-col gap-6">
        {adding && (
          <Panel title="নতুন পণ্য">
            <ProductForm
              onDone={() => {
                setAdding(false);
                reload();
              }}
            />
          </Panel>
        )}
        <Panel title="হাতে দাম বসান">
          <ManualPriceForm data={data} onDone={reload} />
        </Panel>
        <Panel title={`সব পণ্য (${toBnDigits(data.summaries.length)})`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[15px]">
              <thead className="text-[13px] text-dim">
                <tr>
                  <th className="px-5 py-3 font-semibold">পণ্য</th>
                  <th className="px-3 py-3 font-semibold">ভার্সন</th>
                  <th className="px-3 py-3 font-semibold">দোকান</th>
                  <th className="px-3 py-3 font-semibold">সবচেয়ে কম</th>
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
                    <td className="px-3 py-3">{toBnDigits(sellerCount)}</td>
                    <td className="px-3 py-3 font-semibold">{lowest ? formatTaka(lowest) : "নেই"}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/admin/products/edit/?id=${product.id}`} className={secondaryButton + " inline-flex items-center"}>
                        সম্পাদনা
                      </Link>
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
