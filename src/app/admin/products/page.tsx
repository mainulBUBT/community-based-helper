"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ConditionSelect } from "@/components/admin/ConditionSelect";
import { Field, Select, TextArea } from "@/components/admin/Field";
import { SearchBox } from "@/components/admin/ListSearch";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { Badge } from "@/components/ui/Badge";
import { Pagination, paginate } from "@/components/ui/Pagination";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { categoryName } from "@/utils/categories";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { showToast } from "@/lib/toast";
import { saveManualOffer } from "@/services/admin/offers";
import { createProduct, DuplicateProductError } from "@/services/admin/products";
import { listAllSellers } from "@/services/admin/sellers";
import { listSummaries } from "@/services/catalog-live";
import type { Condition, ProductSummary, VariantAttributes } from "@/types/catalog";
import { matchesQuery } from "@/utils/catalog";
import { formatTaka } from "@/utils/format";
import { variantLabel } from "@/utils/variants";

const PAGE_SIZE = 20;
const OLD_AFTER_YEARS = 3;

type Issue = "hidden" | "noPrice" | "noImage" | "noYear" | "noStock" | "old";

// পণ্যের কী কী কাজ বাকি: দাম, ছবি, বছর, স্টক, বা অনেক পুরনো মডেল
function issuesOf({ product, sellerCount, inStock }: ProductSummary): Issue[] {
  const year = new Date().getFullYear();
  const issues: [Issue, boolean][] = [
    ["hidden", product.active === false],
    ["noPrice", sellerCount === 0],
    ["noImage", !product.images?.length],
    ["noYear", !product.releaseYear],
    ["noStock", sellerCount > 0 && !inStock],
    ["old", Boolean(product.releaseYear && product.releaseYear <= year - OLD_AFTER_YEARS)],
  ];
  return issues.filter(([, has]) => has).map(([issue]) => issue);
}

async function loadData() {
  const [summaries, sellers] = await Promise.all([listSummaries(true), listAllSellers()]);
  return { summaries, sellers };
}

function parseVariants(text: string) {
  return text
    .split("\n")
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter(([label]) => label)
    .map(([label, price]) => ({ label, officialPrice: price ? Number(price.replace(/\D/g, "")) || null : null }));
}

const EXAMPLE: VariantAttributes = { chip: "M5", ram: "8GB", storage: "256GB", size: "44mm", connectivity: "GPS", edition: "Pro", color: "Black" };

function ProductForm() {
  const { t, lang } = useAdminI18n();
  const router = useRouter();
  const { categories } = useAdminCategories();
  const [category, setCategory] = useState("");
  const axes = categories.find((c) => c.slug === (category || categories[0]?.slug))?.axes ?? [];
  const example = `${variantLabel(EXAMPLE, axes) || "Standard"} | 99999`;
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const variants = parseVariants(String(form.get("variants")));
    if (!variants.length) {
      showToast(t.admin.products.needVariant);
      return;
    }
    try {
      const id = await createProduct({
        brand: String(form.get("brand")).trim(),
        name: String(form.get("name")).trim(),
        category: String(form.get("category")),
        releaseYear: Number(form.get("year")) || null,
        variants,
      });
      showToast(t.admin.products.added);
      router.push(`/admin/products/edit/?id=${id}`);
    } catch (error) {
      showToast(error instanceof DuplicateProductError ? t.admin.products.duplicate(error.existing) : t.admin.products.addFailed);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-5 md:grid-cols-2">
      <Field label={t.admin.products.brand} name="brand" required placeholder="Samsung" />
      <Field label={t.admin.products.model} name="name" required placeholder="Galaxy A17 5G" />
      <Select label={t.admin.products.category} name="category" value={category || categories[0]?.slug} onChange={(e) => setCategory(e.target.value)}>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {categoryName(c, lang)}
          </option>
        ))}
      </Select>
      <Field label={t.admin.products.year} name="year" type="number" placeholder="2026" />
      <div className="md:col-span-2">
        <TextArea label={t.admin.products.variants} name="variants" required placeholder={example} hint={`${t.admin.products.variantsHint} ${t.admin.products.variantsExample(example)}`} />
      </div>
      <p className="text-sm text-dim md:col-span-2">{t.admin.products.afterAdd}</p>
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
      <ConditionSelect category={product?.category} />
      <Field label={t.admin.products.region} name="region" placeholder={t.admin.products.regionPlaceholder} list="product-regions" key={`region-${productId}`} />
      <datalist id="product-regions">
        {(product?.regions ?? []).map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
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
  const { t, num, lang } = useAdminI18n();
  const { categories } = useAdminCategories();
  const { data, loading, reload } = useAsync(loadData, []);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [problemsOnly, setProblemsOnly] = useState(false);
  const [page, setPage] = useState(1);
  if (loading || !data) return <ListSkeleton />;

  const filtered = data.summaries.filter(
    (summary) =>
      (!category || summary.product.category === category) &&
      (!query.trim() || matchesQuery(summary.product, query.trim())) &&
      (!problemsOnly || issuesOf(summary).some((issue) => issue !== "hidden")),
  );
  const paged = paginate(filtered, page, PAGE_SIZE);
  const categoryLabel = (slug: string) => {
    const c = categories.find((x) => x.slug === slug);
    return c ? categoryName(c, lang) : slug;
  };

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
            <ProductForm />
          </Panel>
        )}
        <Panel title={t.admin.products.manualTitle}>
          <ManualPriceForm data={data} onDone={reload} />
        </Panel>
        <Panel title={t.admin.products.all(num(data.summaries.length))}>
          <div className="flex flex-wrap gap-3 border-b border-line-soft p-4">
            <SearchBox
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              placeholder={t.admin.products.searchPlaceholder}
            />
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              aria-label={t.admin.products.colCategory}
              className="h-10 rounded-lg border border-line bg-surface px-2 text-sm"
            >
              <option value="">{t.admin.products.allCategories}</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {categoryName(c, lang)}
                </option>
              ))}
            </select>
            <select
              value={problemsOnly ? "problems" : ""}
              onChange={(e) => {
                setProblemsOnly(e.target.value === "problems");
                setPage(1);
              }}
              aria-label={t.admin.products.problemsOnly}
              className="h-10 rounded-lg border border-line bg-surface px-2 text-sm"
            >
              <option value="">{t.admin.products.allProducts}</option>
              <option value="problems">{t.admin.products.problemsOnly}</option>
            </select>
          </div>
          {filtered.length === 0 && <p className="px-5 py-4 text-dim">{t.admin.products.noMatch}</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[15px]">
              <thead className="text-[13px] text-dim">
                <tr>
                  <th className="px-5 py-3 font-semibold">{t.admin.products.colProduct}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.products.colCategory}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.products.colVariants}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.products.colStores}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.products.colLowest}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.products.colLowestAny}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {paged.items.map((summary) => {
                  const { product, lowest, lowestAny, sellerCount } = summary;
                  const issues = issuesOf(summary);
                  return (
                  <tr key={product.id}>
                    <td className="px-5 py-3">
                      <Link href={`/admin/products/edit/?id=${product.id}`} className="font-semibold hover:text-brand">
                        {product.brand} {product.name}
                      </Link>
                      {issues.length > 0 && (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {issues.map((issue) => (
                            <Badge key={issue} tone={issue === "hidden" ? "neutral" : "gold"}>
                              {t.admin.products.flags[issue]}
                            </Badge>
                          ))}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[13px]">{categoryLabel(product.category)}</td>
                    <td className="px-3 py-3 text-[13px] text-dim">{product.variants.map((v) => v.label).join(", ")}</td>
                    <td className="px-3 py-3">{num(sellerCount)}</td>
                    <td className="px-3 py-3 font-semibold">{lowest ? formatTaka(lowest) : t.admin.products.none}</td>
                    <td className="px-3 py-3">{lowestAny ? formatTaka(lowestAny) : t.admin.products.none}</td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
          {paged.pages > 1 && (
            <div className="border-t border-line-soft p-4">
              <Pagination page={paged.page} pages={paged.pages} onChange={setPage} labels={t.common.pager} format={num} />
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
