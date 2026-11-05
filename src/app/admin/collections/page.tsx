"use client";

import { useState, type FormEvent } from "react";
import { Field } from "@/components/admin/Field";
import { IconPicker } from "@/components/admin/IconPicker";
import { LangTabs } from "@/components/admin/LangTabs";
import { PageTitle, Panel, primaryButton, secondaryButton } from "@/components/admin/Panel";
import { ProductPicker } from "@/components/admin/ProductPicker";
import { Toggle } from "@/components/admin/Toggle";
import { CategoryIcon } from "@/components/product/CategoryIcon";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useAdminAction } from "@/hooks/useAdminAction";
import { useAdminI18n } from "@/hooks/useAdminI18n";
import { useAsync } from "@/hooks/useAsync";
import { showToast } from "@/lib/toast";
import { deleteCategory, listCollections, saveCategory } from "@/services/admin/categories";
import { listJobs, requestJobRun } from "@/services/admin/jobs";
import { listSummaries } from "@/services/catalog-live";
import type { CategoryInfo, Product } from "@/types/catalog";

async function loadData() {
  const [collections, summaries, jobs] = await Promise.all([listCollections(), listSummaries(true), listJobs()]);
  return { collections, products: summaries.map((s) => s.product), rebuild: jobs.find((job) => job.id === "rebuild") };
}

function CollectionForm({ collection, isNew, products, onClose }: { collection: CategoryInfo; isNew: boolean; products: Product[]; onClose: (saved: boolean) => void }) {
  const { t } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const [selected, setSelected] = useState(collection.collection ?? []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const slug = isNew ? String(form.get("slug")).trim().toLowerCase() : collection.slug;
    if (!/^[a-z0-9-]+$/.test(slug)) {
      showToast(t.admin.categories.slugInvalid);
      return;
    }
    const next: CategoryInfo = {
      ...collection,
      slug,
      name: String(form.get("name")).trim(),
      nameEn: String(form.get("nameEn")).trim(),
      icon: String(form.get("icon")),
      position: Number(form.get("position")) || 0,
      collection: selected,
    };
    if (await run(() => saveCategory(next, isNew), t.admin.common.saved)) onClose(true);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 p-5 md:grid-cols-2">
      <Field label={t.admin.categories.slug} name="slug" defaultValue={collection.slug} required disabled={!isNew} hint={t.admin.categories.slugHint} placeholder="eid" />
      <Field label={t.admin.categories.position} name="position" type="number" defaultValue={collection.position} />
      <div className="md:col-span-2">
        <LangTabs
          className="flex flex-col gap-4"
          en={<Field label={t.admin.categories.nameEn} name="nameEn" defaultValue={collection.nameEn} required />}
          bn={<Field label={t.admin.categories.name} name="name" defaultValue={collection.name} required />}
        />
      </div>
      <div className="md:col-span-2">
        <IconPicker name="icon" defaultValue={collection.icon} />
      </div>
      <div className="md:col-span-2">
        <ProductPicker products={products} selected={selected} onChange={setSelected} />
      </div>
      <div className="flex gap-2 md:col-span-2">
        <button type="submit" disabled={busy} className={primaryButton}>
          {t.admin.common.save}
        </button>
        <button type="button" onClick={() => onClose(false)} className={secondaryButton}>
          {t.admin.common.cancel}
        </button>
      </div>
    </form>
  );
}

export default function CollectionsPage() {
  const { t, lang, num } = useAdminI18n();
  const { busy, run } = useAdminAction();
  const { data, error, loading, reload } = useAsync(loadData, []);
  const [editing, setEditing] = useState<{ collection: CategoryInfo; isNew: boolean } | null>(null);

  if (loading) return <ListSkeleton />;
  if (error || !data) return <ErrorNotice onRetry={reload} />;

  const { collections, products, rebuild } = data;
  const close = (saved: boolean) => {
    setEditing(null);
    if (saved) reload();
  };
  const text = t.admin.collections;
  const blank: CategoryInfo = { slug: "", name: "", nameEn: "", icon: "gift", axes: [], parent: null, position: 0, active: true, collection: [] };

  return (
    <>
      <PageTitle
        title={text.title}
        subtitle={text.subtitle}
        action={
          <div className="flex gap-2">
            {rebuild && (
              <button type="button" disabled={busy} onClick={() => run(() => requestJobRun(rebuild), t.admin.jobs.runQueuedToast)} className={secondaryButton}>
                {text.publish}
              </button>
            )}
            <button type="button" onClick={() => setEditing({ collection: blank, isNew: true })} className={primaryButton}>
              {text.new}
            </button>
          </div>
        }
      />
      <div className="flex flex-col gap-6">
        {editing && (
          <Panel title={editing.isNew ? text.new : t.admin.categories.editTitle(editing.collection.nameEn)}>
            <CollectionForm key={editing.collection.slug || "new"} collection={editing.collection} isNew={editing.isNew} products={products} onClose={close} />
          </Panel>
        )}
        <Panel title={text.all(num(collections.length))}>
          <div className="overflow-x-auto">
            <table className="card-table w-full text-left text-[15px]">
              <thead className="text-[13px] text-dim">
                <tr>
                  <th className="px-5 py-3 font-semibold">{t.admin.products.colCategory}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.categories.products}</th>
                  <th className="px-3 py-3 font-semibold">{t.admin.categories.active}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-line-soft xl:divide-y">
                {collections.map((collection) => (
                  <tr key={collection.slug}>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                          <CategoryIcon name={collection.icon} size={18} />
                        </span>
                        <span className="flex flex-col">
                          <span className="font-semibold">{lang === "en" ? collection.nameEn : collection.name}</span>
                          <span className="text-xs text-dim">{collection.slug}</span>
                        </span>
                      </span>
                    </td>
                    <td data-label={t.admin.categories.products} className="px-3 py-3">{num(collection.collection?.length ?? 0)}</td>
                    <td data-label={t.admin.categories.active} className="px-3 py-3">
                      <Toggle
                        label={t.admin.categories.active}
                        checked={collection.active}
                        disabled={busy}
                        onChange={async (active) => {
                          if (await run(() => saveCategory({ ...collection, active }, false))) reload();
                        }}
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2 max-xl:*:flex-1">
                        <button type="button" onClick={() => setEditing({ collection, isNew: false })} className={secondaryButton}>
                          {t.admin.common.edit}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            if (!confirm(t.admin.categories.confirmDelete(collection.nameEn))) return;
                            if (await run(() => deleteCategory(collection), t.admin.common.deleted)) reload();
                          }}
                          className="h-10 rounded-xl border border-line px-3 text-sm font-semibold text-danger disabled:opacity-40"
                        >
                          {t.admin.common.delete}
                        </button>
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
